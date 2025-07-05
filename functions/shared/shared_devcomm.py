import redis
import os
import json
import time
import threading
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Callable
from functions.shared.redis_client import SmartRedisClient
import logging

logger = logging.getLogger(__name__)

class SharedDevComm:
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.client = SmartRedisClient().get_client()
        self._announce_presence()
    def _announce_presence(self):
        presence_key = f"dev:presence:{self.agent_id}"
        self.client.setex(
            presence_key,
            300,  # 5 min TTL
            json.dumps({
                "agent": self.agent_id,
                "capabilities": self._get_capabilities(),
                "status": "online",
                "timestamp": datetime.utcnow().isoformat()
            })
        )
        # Refresh every 4 minutes
        threading.Timer(240, self._announce_presence).start()
    def _get_capabilities(self):
        # Placeholder for agent capabilities
        return ["devcomm", "redis", "python"]
    def get_online_agents(self) -> List[Dict]:
        agents = []
        for key in self.client.scan_iter("dev:presence:*"):
            agent_data = self.client.get(key)
            if agent_data:
                agents.append(json.loads(agent_data))
        return agents
    def send_broadcast(self, message: dict):
        message.update({
            "from": self.agent_id,
            "to": "all",
            "sent_at": datetime.utcnow().isoformat()
        })
        self._send_message("dev:channels:general", message)
    def send_targeted_message(self, recipient: str, message: dict):
        message.update({
            "from": self.agent_id,
            "to": recipient,
            "sent_at": datetime.utcnow().isoformat()
        })
        inbox = f"dev:channels:{recipient}"
        self._send_message(inbox, message)
        # Also send to general for visibility
        self._send_message("dev:channels:general", {**message, "copy": True})
    def _send_message(self, channel: str, message: dict):
        # Deduplication
        msg_id = f"{self.agent_id}-{int(time.time()*1000)}"
        message['msg_id'] = msg_id
        message['hash'] = hashlib.sha256(json.dumps(message, sort_keys=True).encode()).hexdigest()[:8]
        dedup_key = f"dev:dedup:{message['hash']}"
        if self.client.set(dedup_key, "1", nx=True, ex=60):
            self.client.xadd(channel, {"msg": json.dumps(message)}, maxlen=1000)
            logger.info(f"Sent message to {channel}: {message['subject'] if 'subject' in message else message['type']}")
        else:
            logger.info(f"Duplicate message detected, skipping: {message['subject'] if 'subject' in message else message['type']}")
    def listen_to_my_inbox(self, callback: Callable[[dict], None]):
        my_inbox = f"dev:channels:{self.agent_id}"
        general = "dev:channels:general"
        last_ids = {my_inbox: "$", general: "$"}
        while True:
            try:
                streams = self.client.xread(last_ids, block=5000)
                for stream, messages in streams:
                    for msg_id, data in messages:
                        message = json.loads(data[b'msg'])
                        if message.get('to') == self.agent_id or message.get('to') == 'all' or stream.decode().endswith('general'):
                            callback(message)
                        last_ids[stream.decode()] = msg_id
            except Exception as e:
                logger.error(f"Inbox listen error: {e}")
                time.sleep(2)
    def claim_task(self, task_id: str, duration: int = 300) -> bool:
        lock_key = f"dev:locks:task:{task_id}"
        acquired = self.client.set(
            lock_key,
            json.dumps({
                "owner": self.agent_id,
                "acquired_at": datetime.utcnow().isoformat(),
                "duration": duration
            }),
            nx=True,
            ex=duration
        )
        if acquired:
            self.send_broadcast({
                "type": "task_claimed",
                "task_id": task_id,
                "owner": self.agent_id
            })
            return True
        else:
            owner_data = self.client.get(lock_key)
            if owner_data:
                owner = json.loads(owner_data)['owner']
                print(f"Task {task_id} already claimed by {owner}")
            return False
    def start_thread(self, thread_info: dict):
        thread_id = thread_info.get("thread_id")
        if not thread_id:
            thread_id = hashlib.sha256(str(time.time()).encode()).hexdigest()[:12]
            thread_info["thread_id"] = thread_id
        thread_key = f"dev:threads:{thread_id}"
        self.client.xadd(thread_key, {"msg": json.dumps(thread_info)}, maxlen=100)
        self.send_broadcast({
            "type": "thread_started",
            "thread_id": thread_id,
            "topic": thread_info.get("topic"),
            "participants": thread_info.get("participants", []),
            "initial_message": thread_info.get("initial_message", "")
        })
        return thread_id
    def check_rate_limit(self):
        rate_key = f"dev:ratelimit:{self.agent_id}"
        current = self.client.incr(rate_key)
        if current == 1:
            self.client.expire(rate_key, 3600)
        if current > 100:
            raise Exception(f"{self.agent_id} exceeded rate limit (100/hour)")
    def process_message(self, message: dict):
        print(f"[{self.agent_id}] Received: {message}")

# Usage Example:
# comm = SharedDevComm('claude')
# comm.send_broadcast({"type": "alert", "severity": "critical", "subject": "Redis memory at 90%", "action_required": "all"})
# comm.send_targeted_message("gemini", {"type": "question", "subject": "TypeScript error in patient_sync", "body": "Can you help debug line 47?", "thread_id": "ts-error-12345"})
# comm.listen_to_my_inbox(lambda msg: print(f"Received: {msg}"))
# comm.claim_task("fix-redis-timeout")
# comm.start_thread({"topic": "Refactoring authentication system", "participants": ["claude", "gemini"], "initial_message": "Let's discuss the auth refactor approach"}) 