# Redis Hello Stream Utility
# Provides async helper for agent communication via Redis Streams.

import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import redis.asyncio as redis_async  # type: ignore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RedisStreamClient:
    """Async Redis client wrapper for `agent_updates` stream."""

    def __init__(self) -> None:
        self.redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.stream_name: str = os.getenv("STREAM_NAME", "agent_updates")
        self.agent_id: str = os.getenv("AGENT_ID", "windsurf")
        self._client: Optional[redis_async.Redis] = None

    async def _connect(self) -> redis_async.Redis:
        if self._client is None:
            self._client = redis_async.from_url(
                self.redis_url,
                decode_responses=True,
                socket_timeout=10,
                socket_connect_timeout=10,
            )
            # mypy/static checker sees Optional; but we just created it, so safe
            await self._client.ping()  # type: ignore[arg-type]
            logger.info("Connected to Redis @ %s", self.redis_url)
        return self._client

    async def _disconnect(self) -> None:
        if self._client is not None:
            await self._client.close()
            self._client = None

    async def publish(self, msg: str, msg_type: str = "info", **extra: Any) -> str:
        """Publish a generic message to the stream and return entry id."""
        client = await self._connect()
        payload: Dict[str, Any] = {
            "agent": self.agent_id,
            "msg": msg,
            "type": msg_type,
            "ts": datetime.now(timezone.utc).isoformat(),
        }
        payload.update(extra)
        entry_id = await client.xadd(self.stream_name, payload)
        logger.info("Published %s message → %s", msg_type, entry_id)
        return entry_id

    async def publish_hello(self) -> str:
        """Convenience wrapper that publishes a 'hello' greeting."""
        return await self.publish(
            "hello",
            "greeting",
            capabilities=json.dumps([
                "code_editing",
                "file_analysis",
                "documentation",
                "testing_framework",
            ]),
        )

    async def tail(self, count: int = 10) -> List[Dict[str, Any]]:
        """Return the last *count* entries from the stream."""
        client = await self._connect()
        entries = await client.xrevrange(self.stream_name, count=count)
        parsed: List[Dict[str, Any]] = []
        for entry_id, fields in entries:
            parsed.append({"id": entry_id, **fields})
        return list(reversed(parsed))


async def _cli() -> None:
    import sys

    if len(sys.argv) == 1 or sys.argv[1] in {"help", "-h", "--help"}:
        print("Usage: python redis_hello.py [hello|tail] [count]")
        return

    cmd = sys.argv[1]
    client = RedisStreamClient()
    if cmd == "hello":
        await client.publish_hello()
    elif cmd == "tail":
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        msgs = await client.tail(count)
        for m in msgs:
            ts = m.get("ts", "")
            print(f"[{m['id']}] {m.get('agent')} – {m.get('msg')} ({ts})")
    else:
        print(f"Unknown command: {cmd}")

    await client._disconnect()


if __name__ == "__main__":
    asyncio.run(_cli()) 