#!/usr/bin/env python3
"""
Debug script to inspect raw Redis message format for cursor-gpt-4.1-max

Usage:
  python3 ai-agents/cursor-gpt-4.1-max/scripts/debug_redis_messages.py

- Connects to Redis at localhost:6379
- Fetches last 5 messages from personal and general channels
- Prints raw data, field types, and JSON parse attempts
"""
import redis
import json
from pathlib import Path

def debug_redis_messages():
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    channels = [
        'dev:channels:cursor-gpt-4.1-max',
        'dev:channels:general'
    ]
    for channel in channels:
        print(f"\n{'='*60}")
        print(f"📡 Channel: {channel}")
        print(f"{'='*60}")
        try:
            messages = r.xrange(channel, count=5)
            if not messages:
                print("📭 No messages in this channel")
                continue
            for msg_id, data in messages:
                print(f"\n🔑 Message ID: {msg_id}")
                print(f"📦 Raw data structure: {type(data)}")
                print(f"📝 Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                for key, value in data.items():
                    print(f"\n  Field: '{key}'")
                    print(f"  Type: {type(value)}")
                    print(f"  Length: {len(value) if isinstance(value, str) else 'N/A'}")
                    print(f"  Preview: {repr(value[:100]) if isinstance(value, str) else repr(value)}")
                    if isinstance(value, str) and value.strip():
                        try:
                            parsed = json.loads(value)
                            print(f"  ✅ Valid JSON: {json.dumps(parsed, indent=2)[:200]}...")
                        except json.JSONDecodeError as e:
                            print(f"  ❌ Not JSON: {e}")
                print("-" * 40)
        except Exception as e:
            print(f"❌ Error reading channel: {e}")

if __name__ == "__main__":
    debug_redis_messages() 