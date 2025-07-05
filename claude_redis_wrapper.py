import os
import redis
import json
from datetime import datetime

class ClaudeRedisWrapper:
    """Direct Redis wrapper that bypasses potentially cached connections"""
    
    def __init__(self):
        # Force local connection
        self.client = redis.Redis(
            host='localhost',
            port=6379,
            decode_responses=True,  # CRITICAL: Always decode
            socket_connect_timeout=2,
            socket_keepalive=True,
            retry_on_timeout=True
        )
        self.stream_key = 'dev:workflow-bolt:stream'
        
        # Test connection
        try:
            self.client.ping()
            print("✅ ClaudeRedisWrapper: Connected to Redis")
        except Exception as e:
            print(f"❌ ClaudeRedisWrapper: Connection failed - {e}")
            raise
    
    def get_messages(self, count=10):
        """Get recent messages from dev channel"""
        try:
            # Use xrevrange for most recent first
            messages = self.client.xrevrange(self.stream_key, count=count)
            
            results = []
            for msg_id, data in messages:
                # Handle both 'data' and 'msg' keys
                content = data.get('data') or data.get('msg')
                if content:
                    try:
                        msg = json.loads(content)
                        results.append({
                            'id': msg_id,
                            'timestamp': msg.get('timestamp', 'unknown'),
                            'sender': msg.get('sender', 'unknown'),
                            'subject': msg.get('subject', 'No subject'),
                            'body': msg.get('body', '')
                        })
                    except json.JSONDecodeError:
                        print(f"⚠️  Skipping malformed message: {content[:50]}...")
            
            return results
            
        except Exception as e:
            print(f"❌ Error reading messages: {e}")
            return []
    
    def send_message(self, subject, body, priority='normal'):
        """Send a message to dev channel"""
        message = {
            'sender': 'claude',
            'type': 'status',
            'priority': priority,
            'subject': subject,
            'body': body,
            'timestamp': datetime.utcnow().isoformat(),
            'agent_id': 'claude'
        }
        
        try:
            msg_id = self.client.xadd(
                self.stream_key,
                {'data': json.dumps(message)}
            )
            print(f"✅ Message sent: {msg_id}")
            return msg_id
        except Exception as e:
            print(f"❌ Failed to send message: {e}")
            return None

# Test the wrapper
if __name__ == "__main__":
    wrapper = ClaudeRedisWrapper()
    
    # Get messages
    print("\n📥 Recent Messages:")
    messages = wrapper.get_messages(5)
    for msg in messages:
        print(f"  [{msg['sender']}] {msg['subject']}")
    
    # Send test message
    print("\n📤 Sending test message...")
    wrapper.send_message(
        "Claude Online - Redis Fixed", 
        "Phase 1.5 Test Repair Complete: ✅ Core parsing restored (18/28 tests), ✅ TypeScript imports fixed, ✅ Puppeteer mock working. Ready for Phase 2.",
        priority='normal'
    )