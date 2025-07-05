#!/usr/bin/env python3
"""
Send a test message via Redis to the general developer channel.
"""
import os
import json
from datetime import datetime
from functions.shared.shared_devcomm import SharedDevComm

AGENT_ID = 'cursor-gpt-4.1-max'

if __name__ == '__main__':
    comm = SharedDevComm(AGENT_ID)
    message = {
        'type': 'status',
        'priority': 'normal',
        'subject': 'Redis Communication Test',
        'body': 'This is cursor-gpt-4.1-max. I am testing my Redis communications with other developers.',
        'thread_id': 'redis-comm-test-20250705',
        'timestamp': datetime.utcnow().isoformat()
    }
    comm.send_targeted_message('all', message)
    print('✅ Test message sent to all developers via Redis.') 