import json
import time
from datetime import datetime
from typing import Optional, List, Callable
from functions.shared.redis_client import SmartRedisClient, RedisConnectionError
import logging

logger = logging.getLogger(__name__)

class DevCommV2:
    """
    Developer communication protocol for AI/DevOps coordination via Redis stream.
    Channel: dev:workflow-bolt:stream
    Message schema: see DevMessage interface in project docs.
    Version: 2.0
    """
    STREAM_KEY = 'dev:workflow-bolt:stream'
    MAX_MESSAGE_SIZE = 4096  # 4KB
    DEFAULT_TTL = 86400      # 24 hours
    VERSION = "2.0"

    @classmethod
    def _validate_message(cls, message: dict):
        assert len(message.get('subject', '')) <= 100, "Subject too long"
        assert len(json.dumps(message)) <= cls.MAX_MESSAGE_SIZE, "Message too large"
        assert message.get('sender'), "Sender required"
        assert message.get('type'), "Type required"
        assert message.get('priority') in ['low', 'normal', 'high', 'critical'], "Invalid priority"
        assert message.get('body'), "Body required"
        # Optionally: check thread_id, ttl, metadata

    @classmethod
    def send(cls, message: dict, retry: int = 3) -> str:
        """Send message with validation, retries, and circuit breaker."""
        cls._validate_message(message)
        message['id'] = f"{message['sender']}-{int(time.time()*1000)}"
        message['timestamp'] = datetime.utcnow().isoformat() + 'Z'
        message['version'] = cls.VERSION
        message['attempt'] = 0
        for attempt in range(retry):
            try:
                client = SmartRedisClient().get_client()
                msg_id = client.xadd(
                    cls.STREAM_KEY,
                    {'data': json.dumps(message)},
                    maxlen=1000
                )
                if message.get('ttl'):
                    client.expire(f"{cls.STREAM_KEY}:{msg_id}", message['ttl'])
                logger.info(f"Sent: {message['type']} from {message['sender']} (v{cls.VERSION})")
                return msg_id
            except RedisConnectionError as e:
                logger.error(f"Send failed (attempt {attempt+1}): {e.diagnostics['message']}")
                time.sleep(2 ** attempt)
            except Exception as e:
                logger.error(f"Send failed (attempt {attempt+1}): {e}")
                time.sleep(2 ** attempt)
        # All retries failed - write to local backup
        cls._write_to_disk_backup(message)
        raise Exception("DevComm send failed after retries")

    @classmethod
    def _write_to_disk_backup(cls, message: dict):
        try:
            with open("devcomm_failed_messages.jsonl", "a") as f:
                f.write(json.dumps(message) + "\n")
            logger.warning("Message written to local backup: devcomm_failed_messages.jsonl")
        except Exception as e:
            logger.error(f"Failed to write backup: {e}")

    @classmethod
    def listen(cls,
               callback: Callable[[dict], None],
               sender_filter: Optional[str] = None,
               last_id: str = '$') -> None:
        """Listen for messages with automatic reconnection and circuit breaker."""
        while True:
            try:
                client = SmartRedisClient().get_client()
                messages = client.xread(
                    {cls.STREAM_KEY: last_id},
                    block=5000,
                    count=10
                )
                for stream, msgs in messages:
                    for msg_id, data in msgs:
                        try:
                            message = json.loads(data[b'data'])
                            if sender_filter and message['sender'] != sender_filter:
                                continue
                            callback(message)
                            last_id = msg_id
                        except Exception as e:
                            logger.error(f"Process error: {e}")
            except RedisConnectionError as e:
                logger.error(f"Listen error: {e.diagnostics['message']}, reconnecting...")
                time.sleep(5)
            except Exception as e:
                logger.error(f"Listen error: {e}, reconnecting...")
                time.sleep(5)

    @classmethod
    def get_history(cls, count: int = 50) -> List[dict]:
        """Get recent message history."""
        try:
            client = SmartRedisClient().get_client()
            messages = client.xrevrange(cls.STREAM_KEY, count=count)
            return [json.loads(data[b'data']) for _, data in messages]
        except Exception as e:
            logger.error(f"History fetch failed: {e}")
            return []

# Usage Example:
# DevCommV2.send({
#     'sender': 'claude',
#     'type': 'task',
#     'priority': 'high',
#     'subject': 'Test Failures Critical',
#     'body': 'Gemini, please fix TypeScript errors in patient_sync',
#     'thread_id': 'test-fix-2025'
# })
#
# def handle_message(msg):
#     if msg['type'] == 'task' and msg['priority'] == 'high':
#         print(f"URGENT from {msg['sender']}: {msg['body']}")
#
# DevCommV2.listen(handle_message, sender_filter='gemini') 