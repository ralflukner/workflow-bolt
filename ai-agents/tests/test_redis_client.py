import os
import pathlib
import sys
import unittest
from unittest.mock import patch

# Ensure project root on path
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.append(str(PROJECT_ROOT))

# Avoid import errors if redis not installed
with patch.dict('sys.modules', {'redis': None}):
    from ai_agents.luknerlumina.ai_agent_collaboration import RedisClient  # type: ignore


class TestRedisClientFallback(unittest.TestCase):
    """Basic sanity test for markdown fallback when Redis unavailable."""

    def test_publish_without_redis(self):
        with patch.dict(os.environ, {"REDIS_URL": ""}, clear=False):
            client = RedisClient()
            client.publish("integration-test-message", "test")
            log_path = PROJECT_ROOT / "logs" / "agent_collaboration.md"
            self.assertTrue(log_path.exists())


if __name__ == "__main__":
    unittest.main() 