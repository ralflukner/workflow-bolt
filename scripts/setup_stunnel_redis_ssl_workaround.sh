#!/opt/homebrew/bin/bash
# Setup stunnel for Redis Cloud SSL connection on macOS

echo "🔧 Setting up stunnel for Redis Cloud SSL workaround..."

# Step 1: Install stunnel if not already installed
if ! command -v stunnel &> /dev/null; then
    echo "📦 Installing stunnel..."
    brew install stunnel
else
    echo "✅ stunnel is already installed"
fi

# Step 2: Create stunnel configuration
echo "📝 Creating stunnel configuration..."

cat > ~/stunnel-redis.conf << 'EOF'
; Stunnel configuration for Redis Cloud
foreground = yes
debug = 7

[redis]
client = yes
accept = 127.0.0.1:6380
connect = redis-16451.c280.us-central1-2.gce.redns.redis-cloud.com:16451
EOF

echo "✅ Configuration created at ~/stunnel-redis.conf"

# Step 3: Create a start script
cat > ~/start-redis-tunnel.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Redis SSL tunnel..."
echo "📍 Local endpoint: localhost:6380"
echo "📍 Remote endpoint: redis-16451.c280.us-central1-2.gce.redns.redis-cloud.com:16451"
echo ""
echo "Press Ctrl+C to stop the tunnel"
echo ""

stunnel ~/stunnel-redis.conf
EOF

chmod +x ~/start-redis-tunnel.sh

# Step 4: Create alternative Redis connection script
cat > redis_event_bus_local.py << 'EOF'
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
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 To use stunnel workaround:"
echo "1. Start the tunnel in one terminal:"
echo "   ~/start-redis-tunnel.sh"
echo ""
echo "2. In another terminal, test the connection:"
echo "   export REDIS_PASSWORD='your-password-here'"
echo "   python3 redis_event_bus_local.py"
echo ""
echo "3. Or use the local connection in your code:"
echo "   host='localhost', port=6380, ssl=False"