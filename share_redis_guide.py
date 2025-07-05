#!/usr/bin/env python3
"""
Share Redis Communication Guide with all developers
"""
from claude_redis_wrapper import ClaudeRedisWrapper

def share_guide():
    wrapper = ClaudeRedisWrapper()

    # Share the Redis communication guide with all developers
    guide_message = '''🤖 Claude's Redis Communication Guide v2.0

🚨 CRITICAL LEARNING: SyntaxError in Message Checking
❌ WRONG - Shell escaping leaked into Python:
timestamp = msg['timestamp'][:19] if msg['timestamp'] \\!= 'unknown' else 'unknown'
                                                      ^^ Backslash breaks Python

✅ CORRECT - Clean Python syntax:
timestamp = msg['timestamp'][:19] if msg['timestamp'] != 'unknown' else 'unknown'

📋 RELIABLE MESSAGE PATTERNS FOR ALL DEVELOPERS:

1. SENDING MESSAGES (Working Pattern):
```python
from claude_redis_wrapper import ClaudeRedisWrapper
wrapper = ClaudeRedisWrapper()
wrapper.send_message(
    subject="CLI Progress Update",
    body="Working on resolving remaining CLI issues. ETA: 2 hours",
    priority='normal'
)
```

2. READING MESSAGES (Fixed Pattern):
Save as script file to avoid shell escaping:
```python
from claude_redis_wrapper import ClaudeRedisWrapper
wrapper = ClaudeRedisWrapper()
messages = wrapper.get_messages(10)

for msg in messages:
    timestamp = msg.get('timestamp', 'unknown')
    if timestamp != 'unknown' and len(timestamp) >= 19:
        timestamp = timestamp[:19]
    print(f"[{timestamp}] {msg['sender']}: {msg['subject']}")
```

🛡️ AVOIDING SHELL ESCAPING:
❌ Problematic: python3 -c "complex logic with quotes"
✅ Reliable: Create script files, then run them

📊 BEST PRACTICES:
- Use script files for complex message processing
- Keep shell commands simple
- Always test locally before sending to all developers
- Include context in messages (task ID, file names, error messages)
- Set appropriate priority

🔧 QUICK DEBUG COMMANDS:
# Test connection
python3 -c "from claude_redis_wrapper import ClaudeRedisWrapper; ClaudeRedisWrapper()"

# Count messages  
python3 -c "from claude_redis_wrapper import ClaudeRedisWrapper; print(len(ClaudeRedisWrapper().get_messages(20)))"

LESSON LEARNED: Shell escaping can break Python syntax. Use script files for reliability!

IMMEDIATE FIX APPLIED: Created check_messages.py to avoid this exact issue going forward.'''

    wrapper.send_message(
        '🤖 Redis Communication Guide v2.0 - Shell Escaping Lessons',
        guide_message,
        priority='high'
    )

    print('✅ Redis communication guide shared with all developers!')

if __name__ == "__main__":
    share_guide()