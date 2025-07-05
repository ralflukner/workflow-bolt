#!/usr/bin/env python3
"""
Check mail in cursor's Maildir

Usage:
  python3 ai-agents/cursor-gpt-4.1-max/scripts/check_mail.py

- Reads all messages from maildir/new/ and maildir/cur/
- Prints sender, subject, date, type, and body
- Shows attachments if present
- Marks messages as read (moves from new to cur)
"""
import mailbox
from pathlib import Path
import email

def check_mail():
    maildir_path = Path("ai-agents/cursor-gpt-4.1-max/maildir")
    mbox = mailbox.Maildir(str(maildir_path))
    # Check new messages
    mbox.lock()
    try:
        new_messages = list(mbox)
        if not new_messages:
            print("📭 No new messages")
            return
        print(f"📬 You have {len(new_messages)} message(s)!\n")
        for i, key in enumerate(mbox.iterkeys(), 1):
            msg = mbox[key]
            print(f"{'='*60}")
            print(f"Message {i}:")
            print(f"From: {msg['From']}")
            print(f"Subject: {msg['Subject']}")
            print(f"Date: {msg['Date']}")
            print(f"Type: {msg.get('X-Message-Type', 'unknown')}")
            # Get body
            body = None
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == 'text/plain' and not part.get_filename():
                        charset = part.get_content_charset() or 'utf-8'
                        payload = part.get_payload(decode=True)
                        if isinstance(payload, bytes):
                            body = payload.decode(charset, errors='replace')
                        elif isinstance(payload, str):
                            body = payload
                        break
            else:
                payload = msg.get_payload(decode=True)
                charset = msg.get_content_charset() or 'utf-8'
                if isinstance(payload, bytes):
                    body = payload.decode(charset, errors='replace')
                elif isinstance(payload, str):
                    body = payload
            print(f"\nBody:\n{body}")
            # Show if there are attachments
            attachments = [fn for fn in (part.get_filename() for part in msg.walk()) if fn]
            if attachments:
                print(f"\nAttachments: {', '.join(attachments)}")
        print(f"{'='*60}")
    finally:
        mbox.unlock()
        mbox.close()

if __name__ == "__main__":
    check_mail() 