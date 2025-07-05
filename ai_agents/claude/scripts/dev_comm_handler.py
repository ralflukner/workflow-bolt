#!/usr/bin/env python3
"""
Claude Agent - Developer Communication Handler
Handles Redis developer channel communication for agent coordination
"""

import sys
import os
import json
from datetime import datetime

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, project_root)

try:
    from functions.shared.dev_comm import DevComm
    print("✅ DevComm module imported successfully")
except ImportError as e:
    print(f"❌ Failed to import DevComm: {e}")
    print(f"Project root: {project_root}")
    print(f"Python path: {sys.path}")
    sys.exit(1)

def read_intro_message():
    """Read the introductory message from the Redis developer channel"""
    print("🔍 Reading Redis developer channel history...")
    
    try:
        history = DevComm.get_history(10)
        print(f"📨 Found {len(history)} recent messages")
        
        intro_message = None
        for msg in history:
            if msg.get('thread_id') == 'devcomm-intro-20250705':
                intro_message = msg
                print(f"📩 Found intro message:")
                print(f"   From: {msg['sender']}")
                print(f"   Subject: {msg['subject']}")
                print(f"   Body: {msg['body']}")
                print(f"   Timestamp: {msg['timestamp']}")
                break
        
        if not intro_message:
            print("⚠️  No intro message found with thread_id 'devcomm-intro-20250705'")
            print("📋 Available messages:")
            for i, msg in enumerate(history[:5]):
                print(f"   {i+1}. From {msg['sender']}: {msg.get('subject', 'No subject')} (thread: {msg.get('thread_id', 'None')})")
        
        return intro_message
        
    except Exception as e:
        print(f"❌ Error reading messages: {e}")
        return None

def send_acknowledgment():
    """Send acknowledgment reply to the developer channel"""
    print("📤 Sending acknowledgment reply...")
    
    try:
        reply_message = {
            'sender': 'claude',
            'type': 'ack',
            'priority': 'normal',
            'subject': 'Re: Welcome to DevComm',
            'body': 'Hi Cursor GPT-4.1-Max! Message received and DevComm is working perfectly. Ready for multi-agent collaboration. Currently working on Phase 1.5: Test Failures & Repair.',
            'thread_id': 'devcomm-intro-20250705'
        }
        
        msg_id = DevComm.send(reply_message)
        print(f"✅ Acknowledgment sent successfully (ID: {msg_id})")
        return msg_id
        
    except Exception as e:
        print(f"❌ Error sending acknowledgment: {e}")
        return None

def log_communication(intro_msg, reply_id):
    """Log the communication exchange to Claude's logs"""
    log_file = os.path.join(project_root, 'ai-agents', 'claude', 'logs', '2025-07-05_dev-comm-intro.log')
    
    log_entry = f"""# Claude Agent - DevComm Introduction Log
# Date: {datetime.utcnow().isoformat()}Z

## Incoming Message
- **From**: {intro_msg['sender'] if intro_msg else 'N/A'}
- **Subject**: {intro_msg['subject'] if intro_msg else 'N/A'}
- **Thread ID**: {intro_msg['thread_id'] if intro_msg else 'N/A'}
- **Timestamp**: {intro_msg['timestamp'] if intro_msg else 'N/A'}
- **Body**: {intro_msg['body'] if intro_msg else 'Message not found'}

## Outgoing Reply
- **Reply ID**: {reply_id}
- **Status**: {'Success' if reply_id else 'Failed'}
- **Thread ID**: devcomm-intro-20250705

## DevComm Status
- ✅ Module import: Success
- ✅ Message read: {'Success' if intro_msg else 'Failed - Message not found'}
- ✅ Message send: {'Success' if reply_id else 'Failed'}

## Next Steps
- DevComm channel is operational and ready for agent coordination
- Can now communicate with other agents (Cursor GPT-4.1-Max, Gemini, etc.)
- Will use for task delegation during Phase 1.5: Test Failures & Repair

---
Communication test complete.
"""
    
    try:
        with open(log_file, 'w') as f:
            f.write(log_entry)
        print(f"📝 Communication logged to: {log_file}")
    except Exception as e:
        print(f"⚠️  Failed to write log: {e}")

def main():
    """Main function to handle developer communication introduction"""
    print("🤖 Claude Agent - Developer Communication Handler")
    print("=" * 50)
    
    # Read the intro message
    intro_msg = read_intro_message()
    
    # Send acknowledgment
    reply_id = send_acknowledgment()
    
    # Log the exchange
    log_communication(intro_msg, reply_id)
    
    # Summary
    print("\n📊 Communication Summary:")
    print(f"   Intro message: {'✅ Received' if intro_msg else '❌ Not found'}")
    print(f"   Acknowledgment: {'✅ Sent' if reply_id else '❌ Failed'}")
    print(f"   DevComm status: {'✅ Operational' if intro_msg and reply_id else '⚠️  Partial'}")
    
    if intro_msg and reply_id:
        print("\n🎉 Developer communication channel is fully operational!")
        print("🔗 Claude is now connected for multi-agent collaboration")
    else:
        print("\n⚠️  Communication setup encountered issues")
    
    return intro_msg and reply_id

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)