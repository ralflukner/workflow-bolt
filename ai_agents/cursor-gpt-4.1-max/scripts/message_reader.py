#!/usr/bin/env python3
"""Interactive message reader"""

import mailbox
from pathlib import Path
import json

def display_message(msg, msg_num, total):
    """Display a single message in full"""
    print(f"\n{'='*60}")
    print(f"MESSAGE {msg_num} of {total}")
    print(f"{'='*60}")

    # Headers
    headers = [
        ('From', msg.get('From', 'Unknown')),
        ('To', msg.get('To', 'Unknown')),
        ('Subject', msg.get('Subject', 'No Subject')),
        ('Date', msg.get('Date', 'Unknown')),
        ('Type', msg.get('X-Message-Type', 'unknown'))
    ]

    for label, value in headers:
        print(f"{label:10}: {value}")

    print("-" * 60)

    # Body
    body = extract_body(msg)
    print("\nBODY:")
    print(body or "[No body content]")

    # Attachments
    attachments = extract_attachments(msg)
    if attachments:
        print("\n" + "-" * 60)
        print("ATTACHMENTS:")
        for name, content in attachments:
            print(f"\n{name}:")
            if isinstance(content, dict):
                print(json.dumps(content, indent=2))
            else:
                print(content[:500] + "..." if len(content) > 500 else content)

def extract_body(msg):
    """Extract message body"""
    try:
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == 'text/plain':
                    payload = part.get_payload(decode=True)
                    if payload:
                        return payload.decode('utf-8', errors='replace')
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                return payload.decode('utf-8', errors='replace')
            return msg.get_payload()
    except Exception as e:
        return f"[Error reading body: {e}]"
    return None

def extract_attachments(msg):
    """Extract attachments"""
    attachments = []
    try:
        for part in msg.walk():
            filename = part.get_filename()
            if filename:
                payload = part.get_payload(decode=True)
                if filename.endswith('.json'):
                    try:
                        content = json.loads(payload)
                    except:
                        content = payload.decode('utf-8', errors='replace')
                else:
                    content = payload.decode('utf-8', errors='replace')
                attachments.append((filename, content))
    except:
        pass
    return attachments

def main():
    """Main interactive reader"""
    maildir_path = Path("ai-agents/cursor-gpt-4.1-max/maildir")
    mbox = mailbox.Maildir(str(maildir_path))
    all_keys = list(mbox.keys())

    if not all_keys:
        print("📭 No messages in mailbox")
        return

    print(f"📬 Found {len(all_keys)} message(s)")

    current = 0
    while True:
        msg = mbox[all_keys[current]]
        display_message(msg, current + 1, len(all_keys))

        print(f"\n{'='*60}")
        print("Commands: [n]ext, [p]revious, [q]uit, [1-9] jump to message")
        cmd = input("Enter command: ").strip().lower()

        if cmd == 'q':
            break
        elif cmd == 'n' and current < len(all_keys) - 1:
            current += 1
        elif cmd == 'p' and current > 0:
            current -= 1
        elif cmd.isdigit():
            num = int(cmd) - 1
            if 0 <= num < len(all_keys):
                current = num
            else:
                print(f"Invalid message number. Choose 1-{len(all_keys)}")

if __name__ == "__main__":
    main()
