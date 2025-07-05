#!/usr/bin/env python3
"""
Setup Maildir mailbox for cursor-gpt-4.1-max
This creates a standard Maildir structure that can handle concurrent access

Usage:
  python3 ai-agents/cursor-gpt-4.1-max/scripts/setup_maildir.py
"""
import mailbox
import os
from pathlib import Path

def setup_cursor_maildir():
    # Define paths
    agent_dir = Path("ai-agents/cursor-gpt-4.1-max")
    maildir_path = agent_dir / "maildir"
    # Create the Maildir
    print(f"📬 Creating Maildir at: {maildir_path}")
    mbox = mailbox.Maildir(str(maildir_path), create=True)
    # Verify structure was created
    subdirs = ['new', 'cur', 'tmp']
    all_exist = all((maildir_path / subdir).exists() for subdir in subdirs)
    if all_exist:
        print("✅ Maildir structure created successfully!")
        print("   Directories:")
        for subdir in subdirs:
            print(f"   - {maildir_path / subdir}/")
    else:
        print("❌ Error creating Maildir structure")
        return False
    # Create a test message to verify it works
    print("\n📝 Adding test message...")
    import email.message
    test_msg = email.message.EmailMessage()
    test_msg['From'] = 'system'
    test_msg['To'] = 'cursor-gpt-4.1-max'
    test_msg['Subject'] = 'Maildir Setup Complete'
    test_msg.set_content('Your mailbox has been successfully created. This is a test message.')
    mbox.add(test_msg)
    print("✅ Test message added")
    # Create .last_id file for tracking Redis messages
    last_id_file = maildir_path / '.last_id'
    last_id_file.write_text('0-0')
    print(f"✅ Created {last_id_file} for Redis tracking")
    return True

if __name__ == "__main__":
    # Change to project root
    project_root = Path(__file__).parent.parent.parent.parent
    os.chdir(project_root)
    print(f"📁 Working directory: {os.getcwd()}")
    if setup_cursor_maildir():
        print("\n🎉 Cursor's mailbox is ready!")
        print("\nNext steps:")
        print("1. Run the Redis bridge to start receiving messages")
        print("2. Use check_mail.py to read messages")
    else:
        print("\n❌ Setup failed") 