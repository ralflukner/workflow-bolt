#!/usr/bin/env python3
"""Simple mail checker without external dependencies - Fixed for MaildirMessage"""

import mailbox
from pathlib import Path
import json


def check_new_mail():
    """Check for new messages in cursor's maildir"""
    maildir_path = Path("ai-agents/cursor-gpt-4.1-max/maildir")

    if not maildir_path.exists():
        print("❌ Maildir not found. Run setup_maildir.py first.")
        return

    mbox = mailbox.Maildir(str(maildir_path))

    # Get all message keys
    all_keys = list(mbox.keys())

    if not all_keys:
        print("📭 No messages in mailbox")
        return

    print(f"📬 Found {len(all_keys)} message(s) in mailbox\n")

    for i, key in enumerate(all_keys, 1):
        msg = mbox[key]

        print(f"{'=' * 60}")
        print(f"Message {i} (ID: {key[:8]}...)")
        print(f"From: {msg.get('From', 'Unknown')}")
        print(f"To: {msg.get('To', 'Unknown')}")
        print(f"Subject: {msg.get('Subject', 'No Subject')}")
        print(f"Date: {msg.get('Date', 'Unknown')}")

        # Get message type if available
        msg_type = msg.get('X-Message-Type', 'unknown')
        print(f"Type: {msg_type}")

        # Get body - Fixed for MaildirMessage
        body = None
        try:
            if msg.is_multipart():
                # For multipart messages, find the text/plain part
                for part in msg.walk():
                    if part.get_content_type() == 'text/plain':
                        payload = part.get_payload(decode=True)
                        if payload:
                            body = payload.decode('utf-8', errors='replace')
                            break
            else:
                # For simple messages, get payload directly
                payload = msg.get_payload(decode=True)
                if payload:
                    body = payload.decode('utf-8', errors='replace')
                else:
                    # If decode=True didn't work, try without decoding
                    body = msg.get_payload()
        except Exception as e:
            print(f"  ⚠️  Error getting message body: {e}")
            body = None

        if body:
            print(f"\nBody Preview (first 200 chars):")
            preview = body[:200] + "..." if len(body) > 200 else body
            print(preview.strip())

        # Check for attachments
        attachments = []
        try:
            for part in msg.walk():
                filename = part.get_filename()
                if filename:
                    attachments.append(filename)
        except:
            pass

        if attachments:
            print(f"\nAttachments: {', '.join(attachments)}")

    print(f"{'=' * 60}")


if __name__ == "__main__":
    check_new_mail()
