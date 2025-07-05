#!/usr/bin/env python3
"""
Check and reply to mail in cursor's Maildir

Usage:
  python3 ai-agents/cursor-gpt-4.1-max/scripts/check_and_reply_mail.py

- Reads all messages from maildir/new/ and maildir/cur/
- Prints sender, subject, date, type, and body
- Replies to each sender via SharedDevComm (if sender is not 'system')
- Uses thread_id if present
- Logs all replies in logs/ with a timestamped filename
"""
import mailbox
from pathlib import Path
import email
import json
from datetime import datetime
from functions.shared.shared_devcomm import SharedDevComm

AGENT_ID = 'cursor-gpt-4.1-max'
MAILDIR_PATH = Path('ai-agents/cursor-gpt-4.1-max/maildir')
LOG_DIR = Path('ai-agents/cursor-gpt-4.1-max/logs')
LOG_DIR.mkdir(parents=True, exist_ok=True)
comm = SharedDevComm(AGENT_ID)

def main():
    mbox = mailbox.Maildir(str(MAILDIR_PATH))
    replies = []
    count = 0
    for key in mbox.iterkeys():
        msg = mbox[key]
        sender = msg['From']
        subject = msg['Subject']
        thread_id = msg.get('X-DevComm-Thread') or msg.get('X-Thread-ID') or None
        body = msg.get_payload(decode=True)
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == 'text/plain':
                    body = part.get_payload(decode=True)
                    break
        body_str = body.decode('utf-8', errors='replace') if isinstance(body, bytes) else str(body)
        print(f"\n[INBOX] From: {sender}\nSubject: {subject}\nThread: {thread_id}\nBody:\n{body_str}\n---")
        # Compose and send reply if not from 'system'
        if sender != 'system':
            reply_body = f"Hi {sender}, message received regarding '{subject}'. This is cursor-gpt-4.1-max. Let me know if you need further action."
            reply = {
                'type': 'ack',
                'priority': 'normal',
                'subject': f"Re: {subject}",
                'body': reply_body,
                'thread_id': thread_id or 'maildir-reply-20250705'
            }
            comm.send_targeted_message(sender, reply)
            replies.append({
                'to': sender,
                'subject': reply['subject'],
                'body': reply['body'],
                'thread_id': reply['thread_id']
            })
            count += 1
    # Log all replies
    if replies:
        ts = datetime.utcnow().strftime('%Y%m%dT%H%M%S')
        log_file = LOG_DIR / f'maildir_reply_{ts}.json'
        with open(log_file, 'w') as f:
            json.dump(replies, f, indent=2)
        print(f"\n✅ Replied to {count} messages. Replies logged in {log_file}")
    else:
        print("\n📭 No messages to reply to.")

if __name__ == "__main__":
    main() 