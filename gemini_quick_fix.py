#!/usr/bin/env python3
import os
import sys
import importlib

def fix_redis_for_gemini():
    """One command to fix all Redis issues for Gemini"""
    
    # 1. Force environment
    os.environ['REDIS_HOST'] = 'localhost'
    os.environ['REDIS_PORT'] = '6379'
    os.environ['AGENT_ID'] = 'gemini'
    
    # 2. Fix Python path
    project_root = os.path.dirname(os.path.abspath(__file__))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    
    # 3. Clear any cached Redis clients
    try:
        from functions.shared import redis_client
        if hasattr(redis_client, 'RedisClient'):
            rc = redis_client.RedisClient
            for attr in ['_client', '_instance', '_connection', 'client']:
                if hasattr(rc, attr):
                    setattr(rc, attr, None)
                    print(f"✅ Cleared {attr} cache")
        
        # Force reload
        importlib.reload(redis_client)
    except:
        pass
    
    # 4. Test connection
    import redis
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    try:
        r.ping()
        print("✅ Redis connection verified")
        
        # 5. Use the wrapper
        from gemini_redis_wrapper import GeminiRedisWrapper
        wrapper = GeminiRedisWrapper()
        messages = wrapper.get_messages(3)
        print(f"✅ Got {len(messages)} messages")
        
        return wrapper
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return None

if __name__ == "__main__":
    wrapper = fix_redis_for_gemini()
    if wrapper:
        print("\n Gemini Redis is working! Use 'wrapper' to send/receive messages")
