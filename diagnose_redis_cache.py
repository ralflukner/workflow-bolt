import os
import sys

# Force env vars BEFORE any imports
os.environ['REDIS_HOST'] = 'localhost'
os.environ['REDIS_PORT'] = '6379'

print("=" * 60)
print("Redis Connection Diagnostic")
print("=" * 60)
print(f"Environment: REDIS_HOST={os.environ.get('REDIS_HOST')}")
print(f"Environment: REDIS_PORT={os.environ.get('REDIS_PORT')}")

# Test 1: Direct Redis connection
import redis
try:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True, socket_connect_timeout=2)
    r.ping()
    print("✅ Direct Redis connection: SUCCESS")
except Exception as e:
    print(f"❌ Direct Redis connection: FAILED - {e}")

# Test 2: Check if RedisClient is a singleton/cached
try:
    from functions.shared.redis_client import RedisClient
    
    # Check if it's using a cached client
    if hasattr(RedisClient, '_client') or hasattr(RedisClient, '_instance'):
        print("⚠️  WARNING: RedisClient appears to cache connections!")
        print("   This means env var changes won't take effect")
        
        # Try to clear the cache
        if hasattr(RedisClient, '_client'):
            RedisClient._client = None
        if hasattr(RedisClient, '_instance'):
            RedisClient._instance = None
        print("   ✅ Cleared Redis client cache")
except Exception as e:
    print(f"❌ RedisClient import failed: {e}")

# Test 3: Check DevCommV2
try:
    from functions.shared.dev_comm import DevCommV2
    
    # Force new connection
    from functions.shared.redis_client import SmartRedisClient
    SmartRedisClient._client = redis.Redis(
        host='localhost', 
        port=6379, 
        decode_responses=True,
        socket_connect_timeout=2
    )
    
    history = DevCommV2.get_history(5)
    print(f"✅ DevCommV2.get_history: SUCCESS - Got {len(history)} messages")
except Exception as e:
    print(f"❌ DevCommV2.get_history: FAILED - {e}")
    
    # Debug the error
    if "b'data'" in str(e):
        print("   📝 NOTE: This is a decoding issue - decode_responses not set")
    elif "Timeout" in str(e):
        print("   📝 NOTE: Still connecting to wrong host")