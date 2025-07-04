#!/usr/bin/env python3

import redis
import json
import os
from datetime import datetime

def connect_to_redis():
    """
    Connect to Google Cloud Memorystore Redis
    No SSL needed when running within GCP VPC
    """
    try:
        # Get connection details from environment or use defaults
        redis_host = os.environ.get('REDIS_HOST', 'localhost')
        redis_port = int(os.environ.get('REDIS_PORT', 6379))
        
        print(f"🔄 Connecting to Redis at {redis_host}:{redis_port}...")
        
        client = redis.Redis(
            host=redis_host,
            port=redis_port,
            decode_responses=True,
            socket_connect_timeout=10,
            socket_timeout=10,
            retry_on_timeout=True,
            health_check_interval=30
        )
        
        # Test connection
        client.ping()
        print(f"✅ Connected successfully to Redis at {redis_host}:{redis_port}!")
        return client
        
    except redis.ConnectionError as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 Troubleshooting:")
        if redis_host == 'localhost':
            print("   - For local dev: Make sure SSH tunnel is running")
            print("   - Run: ./setup_redis_tunnel.sh")
        else:
            print("   - For Cloud Functions: Ensure VPC connector is configured")
            print("   - For GCE: Ensure instance is in same VPC")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def send_message(r, sender, action, payload):
    """
    Send a message through Redis pub/sub
    """
    if not r:
        print("❌ ERROR: Redis client not provided or not connected.")
        return False
    try:
        message = {
            "sender": sender,
            "action": action,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat()
        }
        channel = os.environ.get('REDIS_CHANNEL', 'events')
        r.publish(channel, json.dumps(message))
        print(f"✅ Message sent to '{channel}': {action} from {sender}")
        return True
    except Exception as e:
        print(f"❌ ERROR sending message: {e}")
        return False

def subscribe_to_events(r, callback, channels=None):
    """
    Subscribe to Redis pub/sub channels
    """
    if not r:
        print("❌ ERROR: Redis client not provided or not connected.")
        return
    
    if channels is None:
        channels = [os.environ.get('REDIS_CHANNEL', 'events')]
    
    try:
        pubsub = r.pubsub()
        pubsub.subscribe(*channels)
        
        print(f"📡 Subscribed to channels: {', '.join(channels)}")
        print("Listening for messages...")
        
        for message in pubsub.listen():
            if message['type'] == 'message':
                try:
                    data = json.loads(message['data'])
                    callback(data)
                except json.JSONDecodeError:
                    print(f"⚠️  Invalid JSON received: {message['data']}")
                except Exception as e:
                    print(f"❌ Error processing message: {e}")
                    
    except Exception as e:
        print(f"❌ Subscription error: {e}")
    finally:
        pubsub.close()

def health_check(r):
    """
    Perform a health check on Redis connection
    """
    if not r:
        return {"status": "error", "message": "No Redis connection"}
    
    try:
        # Ping
        r.ping()
        
        # Test write
        test_key = f"health_check_{datetime.utcnow().timestamp()}"
        r.set(test_key, "ok", ex=10)
        
        # Test read
        value = r.get(test_key)
        
        # Get server info
        info = r.info('server')
        
        # Clean up
        r.delete(test_key)
        
        return {
            "status": "healthy",
            "redis_version": info.get('redis_version', 'Unknown'),
            "uptime_seconds": info.get('uptime_in_seconds', 0),
            "connected_clients": info.get('connected_clients', 0),
            "used_memory_human": info.get('used_memory_human', 'Unknown')
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def test_redis_operations():
    """
    Test various Redis operations
    """
    print("🧪 Testing Redis Operations")
    print("=" * 40)
    
    r = connect_to_redis()
    if not r:
        print("❌ Could not connect to Redis")
        return False
    
    try:
        # Test basic operations
        print("\n📝 Testing basic operations...")
        
        # String operations
        r.set('test:string', 'Hello Memorystore!', ex=300)
        print(f"✅ String set/get: {r.get('test:string')}")
        
        # Hash operations
        r.hset('test:hash', mapping={'field1': 'value1', 'field2': 'value2'})
        print(f"✅ Hash operations: {r.hgetall('test:hash')}")
        
        # List operations
        r.lpush('test:list', 'item1', 'item2', 'item3')
        print(f"✅ List operations: {r.lrange('test:list', 0, -1)}")
        
        # Set operations
        r.sadd('test:set', 'member1', 'member2', 'member3')
        print(f"✅ Set operations: {r.smembers('test:set')}")
        
        # Pub/Sub test
        print("\n📡 Testing pub/sub...")
        success = send_message(r, "test_client", "test_action", {"test": "data"})
        if success:
            print("✅ Pub/sub test successful!")
        
        # Health check
        print("\n🏥 Running health check...")
        health = health_check(r)
        print(f"✅ Health status: {health['status']}")
        if health['status'] == 'healthy':
            print(f"   Redis version: {health['redis_version']}")
            print(f"   Uptime: {health['uptime_seconds']} seconds")
            print(f"   Memory usage: {health['used_memory_human']}")
        
        # Cleanup
        print("\n🧹 Cleaning up test data...")
        r.delete('test:string', 'test:hash', 'test:list', 'test:set')
        print("✅ Cleanup complete")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    finally:
        r.close()

if __name__ == "__main__":
    # Run tests when executed directly
    test_redis_operations()
    
    # Example of subscribing to events
    print("\n📡 Example: Subscribing to events (press Ctrl+C to stop)...")
    r = connect_to_redis()
    if r:
        def message_handler(data):
            print(f"📨 Received: {data}")
        
        try:
            subscribe_to_events(r, message_handler)
        except KeyboardInterrupt:
            print("\n👋 Subscription stopped")
        finally:
            r.close()