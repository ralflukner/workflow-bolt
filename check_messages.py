#!/usr/bin/env python3
"""
Reliable message checking script - avoids shell escaping issues
"""
from claude_redis_wrapper import ClaudeRedisWrapper
from datetime import datetime

def check_messages():
    wrapper = ClaudeRedisWrapper()
    messages = wrapper.get_messages(15)

    print("\n📥 Recent Developer Messages:")
    print("=" * 70)

    urgent_messages = []
    claude_mentions = []

    for msg in messages:
        # Safe timestamp handling
        timestamp = msg.get('timestamp', 'unknown')
        if timestamp != 'unknown' and len(timestamp) >= 19:
            timestamp = timestamp[:19]
        
        sender = msg.get('sender', 'unknown').upper()
        subject = msg.get('subject', 'No subject')
        body = msg.get('body', '')
        priority = msg.get('priority', 'normal')
        
        print(f"[{timestamp}] {sender}: {subject}")
        
        # Show body snippet
        if len(body) > 150:
            print(f"   {body[:150]}...")
        else:
            print(f"   {body}")
        
        # Mark priority
        if priority in ['high', 'critical']:
            print(f"   🚨 PRIORITY: {priority.upper()}")
        
        # Check if message needs Claude's attention
        needs_attention = any(keyword in subject.lower() or keyword in body.lower() 
                            for keyword in ['claude', 'cli', 'urgent', 'blocked', 'help'])
        
        if needs_attention:
            print(f"   ⚠️  This message may need your attention!")
            if priority in ['high', 'critical']:
                urgent_messages.append(msg)
            else:
                claude_mentions.append(msg)
        
        print()

    print("=" * 70)
    
    # Summary
    if urgent_messages:
        print(f"\n🚨 URGENT MESSAGES REQUIRING RESPONSE: {len(urgent_messages)}")
        for msg in urgent_messages:
            print(f"   - From {msg['sender']}: {msg['subject']}")
    
    if claude_mentions:
        print(f"\n💬 MESSAGES MENTIONING CLAUDE: {len(claude_mentions)}")
        for msg in claude_mentions:
            print(f"   - From {msg['sender']}: {msg['subject']}")
    
    if not urgent_messages and not claude_mentions:
        print("\n✅ No urgent messages requiring immediate response.")
    
    return urgent_messages, claude_mentions

if __name__ == "__main__":
    urgent, mentions = check_messages()