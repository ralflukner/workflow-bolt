import os
print('Current Redis Config in Python:')
print(f'REDIS_HOST = {os.getenv("REDIS_HOST", "NOT SET")}')
print(f'REDIS_PORT = {os.getenv("REDIS_PORT", "NOT SET")}')

# Check if it's the Memorystore IP
if '10.161' in str(os.getenv('REDIS_HOST', '')):
    print('❌ ERROR: Still pointing to Memorystore!')
else:
    print('✅ Host looks correct')
