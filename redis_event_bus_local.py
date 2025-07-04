import redis
import json
import os
from datetime import datetime

def connect_to_redis():
    """
    Connect to Redis through local stunnel proxy
    """
    try:
        print("🔄 Connecting to Redis via local stunnel proxy...")
        
        client = redis.Redis(
            host='localhost',
            port=6380,
            password=os.environ.get('REDIS_PASSWORD'),
            decode_responses=True,
            ssl=False  # No SSL needed - stunnel handles it
        )
        
        client.ping()
        print("✅ Connected successfully via stunnel!")
        return client
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 Make sure stunnel is running:")
        print("   ~/start-redis-tunnel.sh")
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

if __name__ == "__main__":
    r = connect_to_redis()
    if r:
        print("📝 Testing connection...")
        r.set('test', 'hello', ex=10)
        print(f"✅ Test value: {r.get('test')}")
