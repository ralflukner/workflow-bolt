#!/usr/bin/env python3
"""
Connect to Google Cloud Memorystore Redis (no SSL needed)
"""
import redis
import json
import os
from datetime import datetime

# Memorystore connection details
REDIS_HOST = "10.161.35.147"
REDIS_PORT = 6379

def connect_to_redis():
    """
    Connect to Google Cloud Memorystore Redis
    """
    try:
        print(f"🔄 Connecting to Memorystore Redis at {REDIS_HOST}:{REDIS_PORT}...")
        
        client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            decode_responses=True,
            socket_connect_timeout=10,
            socket_timeout=10,
        )
        
        client.ping()
        print("✅ Connected successfully to Memorystore!")
        return client
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 Make sure you're either:")
        print("   1. Running from a GCE instance in the same VPC")
        print("   2. Connected via Cloud VPN")
        print("   3. Using Cloud Run/Functions with VPC connector")
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
        r.set('test', 'hello from Memorystore!', ex=60)
        print(f"✅ Test value: {r.get('test')}")
        
        # Test pub/sub
        send_message(r, "test_client", "health_check", {"status": "ok"})
