#!/usr/bin/env python3
"""
Test Redis connection to Google Cloud Memorystore
"""

import redis

def test_redis_connection():
    """Test Redis connection to Memorystore"""
    try:
        # Connect to Google Cloud Memorystore Redis
        client = redis.Redis(
            host="10.161.35.147",
            port=6379,
            decode_responses=True
        )
        
        # Test connection
        result = client.ping()
        print(f"✅ Redis connection successful: {result}")
        
        # Test basic operations
        client.set('test_key', 'test_value', ex=30)
        value = client.get('test_key')
        print(f"✅ Redis read/write test: {value}")
        
        # Test Redis info
        info = client.info()
        print(f"✅ Redis version: {info.get('redis_version')}")
        print(f"✅ Connected clients: {info.get('connected_clients')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_redis_connection()
    exit(0 if success else 1)