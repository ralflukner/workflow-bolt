#!/usr/bin/env python3
"""
DevComm Inbox Listener for cursor-gpt-4.1-max

Usage:
  export AGENT_ID=cursor-gpt-4.1-max
  python3 ai-agents/cursor-gpt-4.1-max/scripts/dev_comm_inbox_listener.py

- Listens to both personal inbox and general channel
- Prints and logs all messages addressed to this agent or broadcast to 'all'
- Highlights and logs replies in the PHI audit thread (thread_id: devcomm-phi-audit-20250705)
- Handles connection errors and retries
- Fetches and prints the last 20 messages from both channels at startup
"""
import os
import sys
import json
import time
from datetime import datetime
from functions.shared.shared_devcomm import SharedDevComm

AGENT_ID = os.getenv('AGENT_ID', 'cursor-gpt-4.1-max')
LOG_DIR = os.path.join(os.path.dirname(__file__), '../logs')
THREAD_ID = 'devcomm-phi-audit-20250705'

os.makedirs(LOG_DIR, exist_ok=True)

def log_message(msg):
    ts = datetime.utcnow().strftime('%Y%m%dT%H%M%S')
    fname = f"{LOG_DIR}/inbox_{ts}.json"
    with open(fname, 'w') as f:
        json.dump(msg, f, indent=2)

def print_message(msg):
    is_phi_thread = msg.get('thread_id') == THREAD_ID
    prefix = '[PHI-AUDIT]' if is_phi_thread else '[INBOX]'
    print(f"{prefix} {msg.get('timestamp', 'unknown')} | From: {msg.get('from','?')} | To: {msg.get('to','all')} | Subject: {msg.get('subject','')}\n{msg.get('body','')}\n---")
    if is_phi_thread:
        print("[PHI-AUDIT THREAD] Reply detected.")

def fetch_history(comm, channel, count=20):
    try:
        messages = comm.client.xrevrange(channel, count=count)
        for msg_id, data in reversed(messages):
            msg = json.loads(data[b'msg'])
            print_message(msg)
            log_message(msg)
    except Exception as e:
        print(f"[ERROR] Fetching history from {channel}: {e}")

def main():
    print(f"\n🟢 DevComm Inbox Listener started for agent: {AGENT_ID}")
    comm = SharedDevComm(AGENT_ID)
    my_inbox = f"dev:channels:{AGENT_ID}"
    general = "dev:channels:general"
    print("Fetching last 20 messages from inbox and general channel...")
    fetch_history(comm, my_inbox, 20)
    fetch_history(comm, general, 20)
    def handle(msg):
        print_message(msg)
        log_message(msg)
    try:
        comm.listen_to_my_inbox(handle)
    except KeyboardInterrupt:
        print("\nListener stopped by user.")
        sys.exit(0)
    except Exception as e:
        print(f"[ERROR] Listener crashed: {e}")
        time.sleep(5)
        main()

if __name__ == "__main__":
    main() 