#!/usr/bin/env python3
"""
🚨 Developer Redis Setup Guide
For AI agents (Gemini, Claude, etc.) to set up Redis communication
"""
import os
import sys
import importlib

def fix_redis_for_any_agent(agent_name='ai-agent'):
    """One command to fix all Redis issues for any AI agent"""
    
    # 1. Force environment
    os.environ['REDIS_HOST'] = 'localhost'
    os.environ['REDIS_PORT'] = '6379'
    os.environ['AGENT_ID'] = agent_name
    
    # 2. Fix Python path
    project_root = os.path.dirname(os.path.abspath(__file__))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    
    # 3. Clear any cached Redis clients
    try:
        from functions.shared import redis_client
        if hasattr(redis_client, 'SmartRedisClient'):
            rc = redis_client.SmartRedisClient
            for attr in ['_client', '_instance', '_connection', 'client']:
                if hasattr(rc, attr):
                    setattr(rc, attr, None)
                    print(f"✅ Cleared {attr} cache")
        
        # Force reload
        importlib.reload(redis_client)
    except Exception as e:
        print(f"⚠️  Redis client clear failed: {e}")
    
    # 4. Test connection
    import redis
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    try:
        r.ping()
        print("✅ Redis connection verified")
        
        # 5. Create agent-specific wrapper
        import json
        from datetime import datetime, timezone
        
        class AgentRedisWrapper:
            def __init__(self, agent_id):
                self.agent_id = agent_id
                self.client = redis.Redis(
                    host='localhost',
                    port=6379,
                    decode_responses=True,
                    socket_connect_timeout=2
                )
                self.stream_key = 'dev:workflow-bolt:stream'
            
            def get_messages(self, count=10):
                """Get recent messages"""
                try:
                    messages = self.client.xrevrange(self.stream_key, count=count)
                    results = []
                    for msg_id, data in messages:
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
                                pass
                    return results
                except Exception as e:
                    print(f"❌ Error reading messages: {e}")
                    return []
            
            def send_message(self, subject, body, priority='normal'):
                """Send message"""
                message = {
                    'sender': self.agent_id,
                    'type': 'status',
                    'priority': priority,
                    'subject': subject,
                    'body': body,
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'agent_id': self.agent_id
                }
                
                try:
                    msg_id = self.client.xadd(
                        self.stream_key,
                        {'data': json.dumps(message)}
                    )
                    print(f"✅ {self.agent_id} message sent: {msg_id}")
                    return msg_id
                except Exception as e:
                    print(f"❌ Failed to send message: {e}")
                    return None
        
        wrapper = AgentRedisWrapper(agent_name)
        messages = wrapper.get_messages(3)
        print(f"✅ Got {len(messages)} messages")
        
        return wrapper
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return None

def setup_for_gemini():
    """Specific setup for Gemini"""
    print("🤖 Setting up Redis for Gemini...")
    return fix_redis_for_any_agent('gemini')

def setup_for_claude():
    """Specific setup for Claude"""  
    print("🤖 Setting up Redis for Claude...")
    return fix_redis_for_any_agent('claude')

if __name__ == "__main__":
    if len(sys.argv) > 1:
        agent = sys.argv[1].lower()
        if agent == 'gemini':
            wrapper = setup_for_gemini()
        elif agent == 'claude':
            wrapper = setup_for_claude()
        else:
            wrapper = fix_redis_for_any_agent(agent)
    else:
        wrapper = fix_redis_for_any_agent('unknown-agent')
    
    if wrapper:
        print(f"\n🎯 Redis is working! Agent can now communicate.")
        
        # Send setup confirmation
        wrapper.send_message(
            f"{wrapper.agent_id.title()} Redis Setup Complete",
            "Redis communication channel established successfully. Ready for coordination.",
            priority='normal'
        )