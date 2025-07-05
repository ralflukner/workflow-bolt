#!/usr/bin/env python3
"""
Redis-to-Maildir Bridge for cursor-gpt-4.1-max

Usage:
  python3 ai-agents/cursor-gpt-4.1-max/scripts/redis_to_maildir.py

- Fetches new messages from Redis (using redis-cli)
- Writes each message as a Maildir message in maildir/new/
- Tracks last seen message ID in .last_id
- Handles both personal and general channels
"""
import os
import subprocess
import json
from pathlib import Path
import mailbox
import email.message

def fetch_new_messages(channel, last_id):
    # Use redis-cli XREAD to fetch new messages
    cmd = [
        'redis-cli', 'XREAD', 'BLOCK', '0', 'STREAMS', channel, last_id
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode != 0 or not result.stdout.strip():
            return [], last_id
        # Parse redis-cli output (RESP format)
        lines = result.stdout.strip().splitlines()
        messages = []
        new_last_id = last_id
        for i, line in enumerate(lines):
            if line.startswith(channel):
                # Next line is the message ID
                if i+1 < len(lines):
                    msg_id = lines[i+1].strip()
                    if msg_id != last_id:
                        # Next line is the message data
                        if i+2 < len(lines):
                            data_line = lines[i+2].strip()
                            # Extract JSON from data_line
                            try:
                                json_start = data_line.find('{')
                                json_end = data_line.rfind('}')+1
                                msg_json = data_line[json_start:json_end]
                                msg = json.loads(msg_json)
                                messages.append((msg_id, msg))
                                new_last_id = msg_id
                            except Exception as e:
                                print(f"[ERROR] Failed to parse message: {e}")
        return messages, new_last_id
    except Exception as e:
        print(f"[ERROR] redis-cli failed: {e}")
        return [], last_id

def write_maildir_message(maildir_path, msg):
    mbox = mailbox.Maildir(str(maildir_path), create=True)
    emsg = email.message.EmailMessage()
    emsg['From'] = msg.get('from', 'unknown')
    emsg['To'] = msg.get('to', 'cursor-gpt-4.1-max')
    emsg['Subject'] = msg.get('subject', 'No Subject')
    emsg['Date'] = msg.get('timestamp', '')
    emsg['X-DevComm-Thread'] = msg.get('thread_id', '')
    emsg.set_content(msg.get('body', json.dumps(msg)))
    mbox.add(emsg)
    print(f"✅ Delivered message: {emsg['Subject']} from {emsg['From']}")

def main():
    agent_dir = Path("ai-agents/cursor-gpt-4.1-max")
    maildir_path = agent_dir / "maildir"
    last_id_file = maildir_path / '.last_id'
    # Read last_id
    if last_id_file.exists():
        last_id = last_id_file.read_text().strip()
    else:
        last_id = '0-0'
    channels = [f"dev:channels:cursor-gpt-4.1-max", "dev:channels:general"]
    for channel in channels:
        print(f"🔍 Checking channel: {channel} (last_id: {last_id})")
        messages, new_last_id = fetch_new_messages(channel, last_id)
        for msg_id, msg in messages:
            write_maildir_message(maildir_path, msg)
        if new_last_id != last_id:
            last_id_file.write_text(new_last_id)
            print(f"📝 Updated .last_id to {new_last_id}")
    print("\n📬 Maildir sync complete.")

if __name__ == "__main__":
    main() 