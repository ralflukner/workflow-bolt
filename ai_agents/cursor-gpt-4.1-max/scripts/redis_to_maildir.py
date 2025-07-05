#!/usr/bin/env python3
"""
Redis to Maildir bridge for cursor-gpt-4.1-max - Fixed version

Usage:
  python3 ai-agents/cursor-gpt-4.1-max/scripts/redis_to_maildir.py

- Fetches new messages from Redis (using redis-py)
- Writes each message as a Maildir message in maildir/new/
- Tracks last seen message ID in .last_id
- Handles both personal and general channels
- Handles 'msg' field as primary content
- Encodes JSON attachments as bytes
"""
import redis
import mailbox
import json
import email.message
import email.utils
from pathlib import Path
from datetime import datetime
import traceback

class RedisToMaildir:
    def __init__(self):
        self.agent = "cursor-gpt-4.1-max"
        self.maildir_path = Path(f"ai-agents/{self.agent}/maildir")
        self.maildir = mailbox.Maildir(str(self.maildir_path))
        self.redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
    def get_last_id(self, channel):
        safe_channel = channel.replace(':', '_').replace('/', '_')
        last_id_file = self.maildir_path / f".last_id_{safe_channel}"
        if last_id_file.exists():
            return last_id_file.read_text().strip()
        return '0-0'
    def save_last_id(self, channel, msg_id):
        safe_channel = channel.replace(':', '_').replace('/', '_')
        last_id_file = self.maildir_path / f".last_id_{safe_channel}"
        last_id_file.write_text(msg_id)
    def create_email_from_json(self, json_data, msg_id, channel):
        msg = email.message.EmailMessage()
        msg['From'] = json_data.get('sender', json_data.get('from', 'system'))
        msg['To'] = json_data.get('to', self.agent)
        msg['Subject'] = json_data.get('subject', 'No Subject')
        msg['Date'] = email.utils.formatdate()
        msg['Message-ID'] = f"<{msg_id}@{channel}>"
        msg['X-Redis-Channel'] = channel
        msg['X-Redis-Message-ID'] = msg_id
        msg['X-Message-Type'] = json_data.get('type', 'unknown')
        priority = json_data.get('priority', 'normal')
        if priority in ['critical', 'high']:
            msg['X-Priority'] = '1'
            msg['Importance'] = 'high'
        body = json_data.get('body', json_data.get('content', ''))
        msg.set_content(body)
        # Add full JSON as attachment for reference (encode as bytes)
        try:
            json_bytes = json.dumps(json_data, indent=2).encode('utf-8')
            msg.add_attachment(
                json_bytes,
                maintype='application',
                subtype='json',
                filename='original_message.json'
            )
        except Exception as e:
            print(f"  ⚠️  Could not attach JSON: {e}")
            msg['X-Original-JSON'] = json.dumps(json_data)
        return msg
    def sync_channel(self, channel):
        last_id = self.get_last_id(channel)
        print(f"🔍 Checking channel: {channel} (last_id: {last_id})")
        try:
            messages = self.redis_client.xrange(channel, min=last_id, max='+')
            delivered = 0
            for msg_id, data in messages:
                if msg_id == last_id:
                    continue
                # Extract content from 'msg' field (primary), fallback to others
                content = None
                for field in ['msg', 'data', 'message', 'content', 'body']:
                    if field in data and data[field]:
                        content = data[field]
                        break
                if not content:
                    print(f"  ⚠️  No content in message {msg_id}")
                    continue
                try:
                    if isinstance(content, str) and content.strip():
                        json_data = json.loads(content)
                    else:
                        json_data = {
                            'sender': 'system',
                            'to': self.agent,
                            'subject': f'Message {msg_id}',
                            'body': str(content),
                            'timestamp': datetime.utcnow().isoformat(),
                            'original_format': 'plain_text'
                        }
                    email_msg = self.create_email_from_json(json_data, msg_id, channel)
                    self.maildir.add(email_msg)
                    delivered += 1
                    print(f"  ✅ Delivered: {json_data.get('subject', 'No subject')}")
                except json.JSONDecodeError as e:
                    print(f"  ❌ Failed to parse message: {e}")
                except Exception as e:
                    print(f"  ❌ Error processing message {msg_id}: {e}")
                    traceback.print_exc()
                # Update last processed ID regardless of success
                self.save_last_id(channel, msg_id)
            if delivered > 0:
                print(f"  📬 Delivered {delivered} message(s) from {channel}")
            else:
                print(f"  📭 No new messages")
            return delivered
        except Exception as e:
            print(f"  ❌ Failed to sync channel {channel}: {e}")
            traceback.print_exc()
            return 0
    def sync_all(self):
        channels = [
            f'dev:channels:{self.agent}',
            'dev:channels:general'
        ]
        total_delivered = 0
        print(f"🚀 Starting Redis to Maildir sync for {self.agent}")
        print("=" * 60)
        for channel in channels:
            delivered = self.sync_channel(channel)
            total_delivered += delivered
        print("=" * 60)
        print(f"📬 Maildir sync complete. Total messages delivered: {total_delivered}")
        return total_delivered
if __name__ == "__main__":
    bridge = RedisToMaildir()
    bridge.sync_all() 