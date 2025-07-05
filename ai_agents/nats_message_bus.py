import os
import json
import asyncio
import logging
from datetime import datetime, timezone
try:
    from nats.aio.client import Client as NATS
    from nats.js.api import StreamConfig, ConsumerConfig
    from nats.js.errors import NotFoundError
except ImportError as e:
    NATS = None
    StreamConfig = ConsumerConfig = NotFoundError = None
    logging.error("nats-py is not installed. Please install it with 'pip install nats-py'.")

logger = logging.getLogger("nats_message_bus")
logging.basicConfig(level=logging.INFO)

NATS_URL = os.environ.get("NATS_URL", "nats://localhost:4222")
STREAM_NAME = os.environ.get("NATS_STREAM", "AGENT_UPDATES")
SUBJECT_PREFIX = os.environ.get("NATS_SUBJECT_PREFIX", "agent.updates")

"""
NATSMessageBus: JetStream-based persistent messaging for agent-to-agent and agent-to-human communication.
Requirements: durable consumers, message persistence, explicit ACK, request/reply, message history replay, debug logging, error handling.
API is similar to redis_event_bus.py for easy migration.
"""

class NATSMessageBus:
    def __init__(self, agent_id, loop=None):
        self.agent_id = agent_id
        self.loop = loop or asyncio.get_event_loop()
        if NATS is None:
            raise ImportError("nats-py is not installed. Please install it with 'pip install nats-py'.")
        self.nc = NATS()
        self.js = None
        self.stream = STREAM_NAME
        self.subject = f"{SUBJECT_PREFIX}.{agent_id}"
        self.connected = False

    async def connect(self):
        try:
            await self.nc.connect(servers=[NATS_URL], io_loop=self.loop)
            self.js = await self.nc.jetstream()
            if self.js is None:
                raise RuntimeError("JetStream is not available on this NATS server.")
            await self._ensure_stream()
            self.connected = True
            logger.info(f"Connected to NATS at {NATS_URL}")
        except Exception as e:
            logger.error(f"Failed to connect to NATS: {e}")
            self.connected = False
            raise

    async def _ensure_stream(self):
        if self.js is None:
            logger.error("JetStream is not initialized.")
            return
        try:
            await self.js.stream_info(self.stream)
        except Exception as e:
            if NotFoundError and isinstance(e, NotFoundError):
                await self.js.add_stream(
                    name=self.stream,
                    subjects=[f"{SUBJECT_PREFIX}.*"],
                    retention="limits",
                    storage="file",
                    max_msgs=10000,
                    max_age=604800000000000,  # 7 days
                    discard="old"
                )
                logger.info(f"Created NATS stream: {self.stream}")
            else:
                logger.error(f"Error ensuring stream: {e}")
                raise

    async def send_message(self, action, payload=None, correlation_id=None, reply_to=None, message_type="broadcast"):
        if self.js is None:
            logger.error("JetStream is not initialized.")
            return None
        msg = {
            "sender": self.agent_id,
            "action": action,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message_type": message_type,
        }
        if correlation_id:
            msg["correlation_id"] = correlation_id
        if reply_to:
            msg["reply_to"] = reply_to
        msg["payload"] = json.dumps(payload) if payload else "{}"
        subj = self.subject if message_type == "broadcast" else f"{SUBJECT_PREFIX}.{reply_to or self.agent_id}"
        try:
            ack = await self.js.publish(subj, json.dumps(msg).encode())
            logger.info(f"Sent message to {subj}: {msg}")
            return ack
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            return None

    async def request(self, action, payload=None, timeout=10):
        correlation_id = f"{self.agent_id}_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        msg = {
            "sender": self.agent_id,
            "action": action,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message_type": "request",
            "correlation_id": correlation_id,
            "payload": json.dumps(payload) if payload else "{}"
        }
        subj = f"{SUBJECT_PREFIX}.request"
        try:
            resp = await self.nc.request(subj, json.dumps(msg).encode(), timeout=timeout)
            logger.info(f"Request sent to {subj}: {msg}")
            return json.loads(resp.data.decode())
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return None

    async def send_response(self, reply_to, action, payload=None, correlation_id=None):
        if self.js is None:
            logger.error("JetStream is not initialized.")
            return None
        msg = {
            "sender": self.agent_id,
            "action": action,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message_type": "response",
            "correlation_id": correlation_id,
            "payload": json.dumps(payload) if payload else "{}"
        }
        subj = f"{SUBJECT_PREFIX}.{reply_to}"
        try:
            ack = await self.js.publish(subj, json.dumps(msg).encode())
            logger.info(f"Sent response to {subj}: {msg}")
            return ack
        except Exception as e:
            logger.error(f"Failed to send response: {e}")
            return None

    async def subscribe(self, callback, durable_name=None, deliver_policy="all"):
        if self.js is None:
            logger.error("JetStream is not initialized.")
            return
        durable = durable_name or f"{self.agent_id}_consumer"
        subj = f"{SUBJECT_PREFIX}.{self.agent_id}"
        try:
            async def _cb(msg):
                data = json.loads(msg.data.decode())
                logger.info(f"Received message: {data}")
                await callback(data, msg)
                await msg.ack()
            await self.js.subscribe(
                subj,
                durable=durable,
                deliver_policy=deliver_policy,
                ack_policy="explicit",
                cb=_cb
            )
            logger.info(f"Subscribed to {subj} with durable {durable}")
        except Exception as e:
            logger.error(f"Failed to subscribe: {e}")
            raise

    async def replay_history(self, count=10):
        if self.js is None:
            logger.error("JetStream is not initialized.")
            return []
        durable = f"{self.agent_id}_replay"
        subj = f"{SUBJECT_PREFIX}.{self.agent_id}"
        msgs = []
        try:
            consumer = await self.js.pull_subscribe(subj, durable=durable)
            batch = await consumer.fetch(count)
            for msg in batch:
                data = json.loads(msg.data.decode())
                msgs.append(data)
                await msg.ack()
            logger.info(f"Replayed {len(msgs)} messages from {subj}")
        except Exception as e:
            logger.error(f"Failed to replay history: {e}")
        return msgs

    async def close(self):
        if hasattr(self.nc, "is_connected") and self.nc.is_connected:
            await self.nc.drain()
            logger.info("NATS connection closed.")

# Example usage (for migration/testing):
# import asyncio
# async def main():
#     bus = NATSMessageBus("agent1")
#     await bus.connect()
#     await bus.send_message("test_action", {"foo": "bar"})
#     await bus.close()
# asyncio.run(main()) 