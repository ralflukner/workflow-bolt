import os
import ssl
import redis
import json
from datetime import datetime, timezone

# Redis connection information for staging environment
REDIS_HOST = "redis-16451.c280.us-central1-2.gce.redns.redis-cloud.com"
REDIS_PORT = 16451  # TLS port
REDIS_USERNAME = "default"
REDIS_PASSWORD = os.environ.get("REDIS_PASS")  # Get password from environment variable
STREAM_NAME = "agent_updates"

def connect_to_redis():
    """
    Connect to Redis using the provided credentials.
    
    Returns:
        redis.Redis: A Redis client instance if connection is successful
        None: If connection fails
    """
    if not REDIS_PASSWORD:
        print("❌ ERROR: REDIS_PASS environment variable not set.")
        print("Please set the REDIS_PASS environment variable with the Redis password.")
        return None
    
    try:
        # Construct the Redis URL for a secure connection
        url = f"redis://{REDIS_USERNAME}:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}"
        
        # Create Redis client with SSL enabled
        r = redis.Redis.from_url(url, ssl=True, ssl_cert_reqs=ssl.CERT_NONE)
        
        # Test connection
        if r.ping():
            print("✅ Successfully connected to Redis.")
            return r
        else:
            print("❌ Ping failed. Could not connect to Redis.")
            return None
            
    except redis.exceptions.ConnectionError as e:
        print(f"❌ CONNECTION ERROR: Could not connect to Redis. Details: {e}")
        return None
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        return None

def send_message(client, sender, action, payload=None):
    """
    Send a message to the Redis stream.
    
    Args:
        client (redis.Redis): Redis client instance
        sender (str): Name of the sender
        action (str): Action being performed
        payload (dict, optional): Additional data to include. Defaults to None.
    
    Returns:
        str: Message ID if successful, None otherwise
    """
    if not client:
        print("❌ ERROR: Redis client not provided or not connected.")
        return None
    
    try:
        # Prepare message data
        message_data = {
            "sender": sender,
            "action": action,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Add payload if provided
        if payload:
            message_data["payload"] = json.dumps(payload)
        else:
            message_data["payload"] = "{}"
        
        # Send message to stream
        message_id = client.xadd(STREAM_NAME, message_data)
        
        print(f"🚀 Message sent to stream '{STREAM_NAME}'")
        print(f"   Redis Message ID: {message_id}")
        print(f"   Sender: {sender}")
        print(f"   Action: {action}")
        
        return message_id
        
    except Exception as e:
        print(f"❌ Failed to send message: {e}")
        return None

def read_messages(client, count=5, last_id="0-0"):
    """
    Read messages from the Redis stream.
    
    Args:
        client (redis.Redis): Redis client instance
        count (int, optional): Number of messages to read. Defaults to 5.
        last_id (str, optional): ID to start reading from. Defaults to "0-0" (beginning of stream).
    
    Returns:
        list: List of messages if successful, empty list otherwise
    """
    if not client:
        print("❌ ERROR: Redis client not provided or not connected.")
        return []
    
    try:
        # Read messages from stream
        messages = client.xread({STREAM_NAME: last_id}, count=count)
        
        if not messages:
            print(f"No messages found in stream '{STREAM_NAME}' after ID {last_id}")
            return []
        
        # Process and print messages
        processed_messages = []
        for stream_name, stream_messages in messages:
            for message_id, message_data in stream_messages:
                print(f"\n--- Message ID: {message_id} ---")
                for key, value in message_data.items():
                    print(f"   {key}: {value}")
                
                # Add to processed messages
                processed_messages.append({
                    "id": message_id,
                    **message_data
                })
        
        return processed_messages
        
    except Exception as e:
        print(f"❌ Failed to read messages: {e}")
        return []

def send_hello_world():
    """Send a hello_world message to the Redis stream."""
    # Connect to Redis
    client = connect_to_redis()
    if not client:
        return
    
    # Send hello_world message
    sender_name = os.environ.get("USER", "new_dev")
    send_message(
        client,
        sender=sender_name,
        action="hello_world",
        payload={"message": f"Hello from {sender_name}! Just joined the Redis Event-Bus."}
    )

def send_lock_shell(lock_name, ttl_ms=900000):
    """
    Send a lock_shell message to the Redis stream.
    
    Args:
        lock_name (str): Name of the resource to lock
        ttl_ms (int, optional): Time-to-live in milliseconds. Defaults to 900000 (15 minutes).
    """
    # Connect to Redis
    client = connect_to_redis()
    if not client:
        return
    
    # Send lock_shell message
    sender_name = os.environ.get("USER", "new_dev")
    send_message(
        client,
        sender=sender_name,
        action="lock_shell",
        payload={"lock": lock_name, "ttl_ms": ttl_ms}
    )

def send_unlock_shell(lock_name):
    """
    Send an unlock_shell message to the Redis stream.
    
    Args:
        lock_name (str): Name of the resource to unlock
    """
    # Connect to Redis
    client = connect_to_redis()
    if not client:
        return
    
    # Send unlock_shell message
    sender_name = os.environ.get("USER", "new_dev")
    send_message(
        client,
        sender=sender_name,
        action="unlock_shell",
        payload={"lock": lock_name}
    )

def main():
    """Main function to demonstrate Redis Event-Bus functionality."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Redis Event-Bus Client")
    parser.add_argument("command", choices=["hello", "read", "lock", "unlock"], 
                        help="Command to execute")
    parser.add_argument("--count", type=int, default=5, 
                        help="Number of messages to read (for 'read' command)")
    parser.add_argument("--resource", type=str, default="docker", 
                        help="Resource name for lock/unlock commands")
    parser.add_argument("--ttl", type=int, default=900000, 
                        help="Time-to-live in milliseconds for lock command")
    
    args = parser.parse_args()
    
    # Execute the requested command
    if args.command == "hello":
        send_hello_world()
    elif args.command == "read":
        client = connect_to_redis()
        if client:
            read_messages(client, count=args.count)
    elif args.command == "lock":
        send_lock_shell(args.resource, args.ttl)
    elif args.command == "unlock":
        send_unlock_shell(args.resource)

if __name__ == "__main__":
    main()