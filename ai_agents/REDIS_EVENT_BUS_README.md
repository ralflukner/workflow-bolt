# Redis Event-Bus Client

This is a Python client for connecting to the LuknerLumina Redis Event-Bus. It provides functionality for sending and receiving messages via Redis Streams.

## Installation

1. Make sure you have Python 3.6+ installed
2. Install the required dependencies:
   ```bash
   pip install "redis[ssl]>=5,<6"
   ```

## Configuration

The client requires the Redis password to be set as an environment variable:

```bash
export REDIS_PASS="your_redis_password"  # Replace with the actual password
```

> **Note**: For security reasons, do not hardcode the password in your scripts. Ask Dev-Ops or check the 1Password vault for the password.

## Usage

### Basic Usage

```python
import os
from ai-agents.redis_event_bus import connect_to_redis, send_message, read_messages

# Set the Redis password (if not already set in environment)
os.environ["REDIS_PASS"] = "your_redis_password"  # Replace with actual password

# Connect to Redis
client = connect_to_redis()
if client:
    # Send a message
    send_message(
        client,
        sender="your_name",
        action="hello_world",
        payload={"message": "Hello from your_name! Just joined the Redis Event-Bus."}
    )
    
    # Read messages
    messages = read_messages(client, count=5)
```

### Command-Line Interface

The script also provides a command-line interface for common operations:

```bash
# Send a hello_world message
python redis_event_bus.py hello

# Read the last 10 messages
python redis_event_bus.py read --count 10

# Send a lock_shell message
python redis_event_bus.py lock --resource docker --ttl 900000

# Send an unlock_shell message
python redis_event_bus.py unlock --resource docker
```

## Lock Protocol

Before running anything long-lived (Docker, emulator), publish a lock message so other devs don't collide:

```python
from ai-agents.redis_event_bus import send_lock_shell

# Lock the docker resource for 15 minutes (900000 ms)
send_lock_shell("docker", ttl_ms=900000)

# Do your work...

# When finished, unlock the resource
from ai-agents.redis_event_bus import send_unlock_shell
send_unlock_shell("docker")
```

Or using the command-line interface:

```bash
# Lock the docker resource
python redis_event_bus.py lock --resource docker

# When finished, unlock the resource
python redis_event_bus.py unlock --resource docker
```

## Security Note

For production use, it's recommended to use certificate verification:

```python
# In connect_to_redis function, replace:
r = redis.Redis.from_url(url, ssl=True, ssl_cert_reqs=ssl.CERT_NONE)

# With:
r = redis.Redis.from_url(url, ssl=True, ssl_ca_certs="redis-ca.pem", ssl_cert_reqs=ssl.CERT_REQUIRED)
```

You'll need to download the [Redis Labs CA cert](https://s3.amazonaws.com/redis.downloads/redis-ca.pem) and provide the path to it.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ERR invalid password` | Re-check the SECRET; ensure no spaces/quotes copied |
| `Server aborted SSL` | Make sure you're using SSL (ssl=True) with the Redis client |
| `REDIS_PASS environment variable not set` | Set the REDIS_PASS environment variable with the Redis password |

## Welcome Message

When you first connect to the Redis Event-Bus, it's customary to send a hello_world message:

```bash
python redis_event_bus.py hello
```

This will notify the team that you've successfully connected to the Redis Event-Bus.