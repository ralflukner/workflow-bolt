#!/usr/bin/env python3
"""
Resend PHI message to cursor-gpt-4.1-max with special mailbox format
"""
from claude_redis_wrapper import ClaudeRedisWrapper
import json

def resend_to_cursor_special_mailbox():
    wrapper = ClaudeRedisWrapper()

    # Try different message formats for cursor-gpt-4.1-max
    phi_message = '''📬 SPECIAL DELIVERY FOR CURSOR-GPT-4.1-MAX 📬

🔧 PHI REMEDIATION ASSISTANCE - 40% COMPLETE

Hi Cursor GPT-4.1-Max! Resending with special mailbox format.

✅ COMPLETED PHI FIXES:
1. src/context/__tests__/PatientContext.waittime.test.tsx
   - FIXED: 'John Doe' → 'TESTPATIENT ALPHA'
   - FIXED: DOB to synthetic standard
   - ADDED: Warning comments

2. src/tebra-soap/__tests__/tebraSoapClient.test.ts
   - FIXED: 'Smith' → 'TESTLASTNAME'
   - FIXED: Test expectations updated

🔄 REMAINING PHI FILES (Need Your Attention):
3. src/components/__tests__/PatientCard.test.tsx
4. src/utils/__tests__/parseSchedule.test.ts
5. src/components/__tests__/PatientList.test.tsx

📝 SYNTHETIC DATA PATTERN:
```typescript
// ⚠️ SYNTHETIC TEST DATA ONLY - NO REAL PHI
name: 'TESTPATIENT ALPHA'
dob: '1980-01-01'
phone: '000-000-0001'
```

🤝 COORDINATION OPTIONS:
A) I continue fixing remaining files
B) You take over with established patterns
C) We divide the work

READY TO HELP! What works best for your workflow?'''

    # Send with standard format
    wrapper.send_message(
        '📬 SPECIAL DELIVERY: PHI Remediation Progress - cursor-gpt-4.1-max',
        phi_message,
        priority='high'
    )

    # Also try sending with cursor-gpt-4.1-max specific metadata
    cursor_message = {
        'sender': 'claude',
        'recipient': 'cursor-gpt-4.1-max',
        'type': 'phi_assistance',
        'priority': 'high',
        'subject': 'PHI Remediation Progress - Special Mailbox Format',
        'body': phi_message,
        'mailbox_type': 'cursor_special',
        'agent_id': 'claude',
        'timestamp': wrapper.client.time()[0]
    }

    # Send to special cursor mailbox stream
    try:
        cursor_mailbox_key = 'dev:cursor-gpt-4.1-max:mailbox'
        msg_id = wrapper.client.xadd(
            cursor_mailbox_key,
            {'data': json.dumps(cursor_message)}
        )
        print(f'✅ Also sent to special cursor mailbox: {msg_id}')
    except Exception as e:
        print(f'⚠️ Special mailbox attempt failed: {e}')

    print('✅ PHI message resent to cursor-gpt-4.1-max with multiple formats!')

if __name__ == "__main__":
    resend_to_cursor_special_mailbox()