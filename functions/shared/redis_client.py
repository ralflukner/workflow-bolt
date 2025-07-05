"""
Redis Client for Developer Communication
Simplified client for Redis developer channel communication
"""

import redis
import os
import logging
import time

logger = logging.getLogger(__name__)

class RedisConnectionError(Exception):
    """Custom exception with helpful diagnostics"""
    def __init__(self, original_error):
        self.diagnostics = self._diagnose(original_error)
        super().__init__(self.diagnostics['message'])
    def _diagnose(self, error):
        if "Connection refused" in str(error):
            return {
                'message': "Redis not running",
                'fix': "Start Redis: docker run -d -p 6379:6379 redis:7-alpine",
                'check': "redis-cli ping"
            }
        elif "timeout" in str(error).lower():
            return {
                'message': "Redis connection timeout",
                'fix': f"Check REDIS_HOST={os.getenv('REDIS_HOST', 'not set')}",
                'check': "nslookup $REDIS_HOST"
            }
        return {
            'message': str(error),
            'fix': "Check Redis logs",
            'check': "docker logs <redis-container>"
        }

class SmartRedisClient:
    """Redis client with prioritized connection attempts and diagnostics."""
    def __init__(self):
        self.connections = [
            ("primary", os.getenv('REDIS_HOST', '10.161.35.147'), 'production'),
            ("local", "localhost", 'development'),
            ("docker", "host.docker.internal", 'container'),
            ("mock", None, 'testing')
        ]
        self._client = None
        self._mode = None
    def get_client(self):
        for name, host, env in self.connections:
            try:
                if host is None:
                    raise Exception("No host for mock client")
                client = redis.Redis(host=host, port=int(os.getenv('REDIS_PORT', 6379)), decode_responses=True, socket_connect_timeout=2)
                client.ping()
                logger.info(f"Connected via {name} ({env})")
                self._client = client
                self._mode = name
                return client
            except Exception as e:
                logger.warning(f"{name} connection failed: {e}")
        logger.error("All Redis connection attempts failed. Using mock client.")
        self._mode = "mock"
        return MockRedisClient()
    def print_connection_status(self):
        print("\n" + "="*50)
        print("🔌 SMART REDIS CONNECTION STATUS")
        print("="*50)
        for name, host, env in self.connections:
            print(f"Trying {name:8} ({env}): {host}")
            try:
                if host is None:
                    print(f"  [mock] Skipped")
                    continue
                client = redis.Redis(host=host, port=int(os.getenv('REDIS_PORT', 6379)), decode_responses=True, socket_connect_timeout=2)
                start = time.time()
                client.ping()
                latency = (time.time() - start) * 1000
                print(f"  ✅ Connected in {latency:.1f}ms (Redis {client.info()['redis_version']})")
            except Exception as e:
                print(f"  ❌ Failed: {str(e)[:40]}...")
        print("="*50 + "\n")

class MockRedisClient:
    def ping(self):
        return True
    def xadd(self, *a, **k):
        return "mock-id"
    def xread(self, *a, **k):
        return []
    def xrevrange(self, *a, **k):
        return []
    def expire(self, *a, **k):
        return True
    def set(self, *a, **k):
        return True
    def get(self, *a, **k):
        return None
    def info(self):
        return {'redis_version': 'mock'}

# Usage Example:
# client = SmartRedisClient().get_client()
# SmartRedisClient().print_connection_status()