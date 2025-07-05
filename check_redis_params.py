import os
from functions.shared.redis_client import SmartRedisClient

print("\n CONNECTION ATTEMPT DETAILS:")
print(f"Host: {os.getenv('REDIS_HOST', 'DEFAULT: None')}")
print(f"Port: {os.getenv('REDIS_PORT', 'DEFAULT: None')}")

client = SmartRedisClient().get_client()
print("Ping:", client.ping())