import redis
import json
import os
import ssl
from datetime import datetime

def connect_to_redis():
    """
    Connect to Redis Cloud with proper SSL configuration
    """
    try:
        # Create SSL context with proper settings
        ssl_context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Alternative connection methods to try
        connection_params = {
            'host': 'redis-16451.c280.us-central1-2.gce.redns.redis-cloud.com',
            'port': 16451,
            'password': os.environ.get('REDIS_PASSWORD'),
            'decode_responses': True,
            'socket_connect_timeout': 10,
            'socket_timeout': 10,
            'retry_on_timeout': True,
            'health_check_interval': 30
        }
        
        # Try with SSL context
        try:
            print("🔄 Attempting connection with SSL context...")
            client = redis.Redis(
                **connection_params,
                ssl=True,
                ssl_context=ssl_context,
                ssl_cert_reqs='none'
            )
            client.ping()
            print("✅ Connected successfully with SSL context!")
            return client
        except Exception as e:
            print(f"⚠️  SSL context method failed: {e}")
            
            # Try with basic SSL
            try:
                print("🔄 Attempting connection with basic SSL...")
                client = redis.Redis(
                    **connection_params,
                    ssl=True,
                    ssl_cert_reqs='none'
                )
                client.ping()
                print("✅ Connected successfully with basic SSL!")
                return client
            except Exception as e2:
                print(f"⚠️  Basic SSL method failed: {e2}")
                
                # Try with minimal SSL settings
                try:
                    print("🔄 Attempting connection with minimal SSL...")
                    client = redis.Redis(
                        host='redis-16451.c280.us-central1-2.gce.redns.redis-cloud.com',
                        port=16451,
                        password=os.environ.get('REDIS_PASSWORD'),
                        ssl=True,
                        ssl_cert_reqs=ssl.CERT_NONE,
                        decode_responses=True
                    )
                    client.ping()
                    print("✅ Connected successfully with minimal SSL!")
                    return client
                except Exception as e3:
                    print(f"❌ All connection methods failed. Last error: {e3}")
                    return None
                    
    except Exception as e:
        print(f"❌ CONNECTION ERROR: {e}")
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
        r.publish("events", json.dumps(message))
        print(f"✅ Message sent: {action} from {sender}")
        return True
    except Exception as e:
        print(f"❌ ERROR sending message: {e}")
        return False

def test_connection():
    """
    Test Redis connection and basic operations
    """
    print("🔧 Testing Redis connection...")
    print(f"📍 Redis Host: redis-16451.c280.us-central1-2.gce.redns.redis-cloud.com")
    print(f"🔑 Password Set: {'Yes' if os.environ.get('REDIS_PASSWORD') else 'No'}")
    
    r = connect_to_redis()
    if r:
        try:
            # Test basic operations
            print("\n📝 Testing basic operations...")
            r.set('test_key', 'test_value', ex=60)
            value = r.get('test_key')
            print(f"✅ Set/Get test: {value}")
            
            # Test pub/sub
            print("\n📡 Testing pub/sub...")
            success = send_message(r, "test_sender", "test_action", {"test": "data"})
            if success:
                print("✅ Pub/sub test successful!")
            
            return True
        except Exception as e:
            print(f"❌ Operation test failed: {e}")
            return False
    else:
        print("❌ Could not establish connection")
        return False

if __name__ == "__main__":
    test_connection()