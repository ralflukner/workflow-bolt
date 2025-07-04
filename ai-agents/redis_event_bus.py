import os
import ssl
import redis
import json
from datetime import datetime, timezone
from redis.exceptions import ConnectionError  # type: ignore
from urllib.parse import quote_plus

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
        # Construct the Redis URL for a secure connection.
        # The password may contain characters that must be URL-encoded; otherwise
        # redis-py's URL parser mistakes part of the password for the port.

        encoded_pw = quote_plus(REDIS_PASSWORD)

        # Use the TLS scheme (rediss://) so redis-py automatically enables SSL.
        url = f"rediss://{REDIS_USERNAME}:{encoded_pw}@{REDIS_HOST}:{REDIS_PORT}"
        
        # Create Redis client with SSL enabled
        r = redis.Redis.from_url(url, ssl=True, ssl_cert_reqs=ssl.CERT_NONE)
        
        # Test connection
        if r.ping():
            print("✅ Successfully connected to Redis.")
            return r
        else:
            print("❌ Ping failed. Could not connect to Redis.")
            return None
            
    except ConnectionError as e:
        print(f"❌ CONNECTION ERROR: Could not connect to Redis. Details: {e}")
        return None
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        return None

def send_message(client, sender, action, payload=None, correlation_id=None, reply_to=None, message_type="broadcast"):
    """
    Send a message to the Redis stream with enhanced reply capabilities.
    
    Args:
        client (redis.Redis): Redis client instance
        sender (str): Name of the sender
        action (str): Action being performed
        payload (dict, optional): Additional data to include. Defaults to None.
        correlation_id (str, optional): Correlation ID for request/response pairing
        reply_to (str, optional): Target agent ID for direct replies
        message_type (str): Type of message ('broadcast', 'request', 'response', 'direct')
    
    Returns:
        str: Message ID if successful, None otherwise
    """
    if not client:
        print("❌ ERROR: Redis client not provided or not connected.")
        return None
    
    try:
        # Generate correlation ID if not provided for requests
        if message_type == "request" and not correlation_id:
            correlation_id = f"{sender}_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        
        # Prepare message data with enhanced fields
        message_data = {
            "sender": sender,
            "action": action,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message_type": message_type
        }
        
        # Add correlation fields if provided
        if correlation_id:
            message_data["correlation_id"] = correlation_id
        if reply_to:
            message_data["reply_to"] = reply_to
        
        # Add payload if provided
        if payload:
            message_data["payload"] = json.dumps(payload)
        else:
            message_data["payload"] = "{}"
        
        # Determine target stream
        stream_name = STREAM_NAME
        if message_type == "direct" and reply_to:
            stream_name = f"agent_inbox:{reply_to}"
        
        # Send message to stream
        message_id = client.xadd(stream_name, message_data)
        
        print(f"🚀 Message sent to stream '{stream_name}'")
        print(f"   Redis Message ID: {message_id}")
        print(f"   Sender: {sender}")
        print(f"   Action: {action}")
        print(f"   Message Type: {message_type}")
        if correlation_id:
            print(f"   Correlation ID: {correlation_id}")
        if reply_to:
            print(f"   Reply To: {reply_to}")
        
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

def send_request(client, sender, action, payload=None, reply_to=None):
    """
    Send a request message expecting a response.
    
    Args:
        client (redis.Redis): Redis client instance
        sender (str): Name of the sender
        action (str): Action being requested
        payload (dict, optional): Request data
        reply_to (str, optional): Target agent for direct request
    
    Returns:
        str: Correlation ID for tracking the response
    """
    correlation_id = f"{sender}_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    message_type = "direct" if reply_to else "request"
    
    send_message(
        client, 
        sender=sender, 
        action=action, 
        payload=payload,
        correlation_id=correlation_id,
        reply_to=reply_to,
        message_type=message_type
    )
    
    return correlation_id

def send_response(client, sender, action, payload=None, correlation_id=None, reply_to=None):
    """
    Send a response message to a previous request.
    
    Args:
        client (redis.Redis): Redis client instance
        sender (str): Name of the sender
        action (str): Response action
        payload (dict, optional): Response data
        correlation_id (str): Correlation ID from original request
        reply_to (str, optional): Original requester
    
    Returns:
        str: Message ID if successful, None otherwise
    """
    message_type = "direct" if reply_to else "response"
    
    return send_message(
        client,
        sender=sender,
        action=action,
        payload=payload,
        correlation_id=correlation_id,
        reply_to=reply_to,
        message_type=message_type
    )

def read_agent_inbox(client, agent_id, count=5, last_id="0-0"):
    """
    Read messages from an agent's direct inbox.
    
    Args:
        client (redis.Redis): Redis client instance
        agent_id (str): Agent ID to read inbox for
        count (int, optional): Number of messages to read. Defaults to 5.
        last_id (str, optional): ID to start reading from. Defaults to "0-0".
    
    Returns:
        list: List of direct messages
    """
    if not client:
        print("❌ ERROR: Redis client not provided or not connected.")
        return []
    
    try:
        inbox_stream = f"agent_inbox:{agent_id}"
        messages = client.xread({inbox_stream: last_id}, count=count)
        
        if not messages:
            print(f"No messages found in inbox for agent '{agent_id}'")
            return []
        
        # Process and return messages
        processed_messages = []
        for stream_name, stream_messages in messages:
            for message_id, message_data in stream_messages:
                print(f"\n--- Direct Message ID: {message_id} ---")
                for key, value in message_data.items():
                    print(f"   {key}: {value}")
                
                processed_messages.append({
                    "id": message_id,
                    **message_data
                })
        
        return processed_messages
        
    except Exception as e:
        print(f"❌ Failed to read agent inbox: {e}")
        return []

def wait_for_response(client, correlation_id, timeout_seconds=30):
    """
    Wait for a response message with matching correlation ID.
    
    Args:
        client (redis.Redis): Redis client instance
        correlation_id (str): Correlation ID to match
        timeout_seconds (int): Maximum time to wait
    
    Returns:
        dict: Response message if found, None if timeout
    """
    if not client:
        print("❌ ERROR: Redis client not provided or not connected.")
        return None
    
    start_time = datetime.now(timezone.utc)
    last_id = "0-0"
    
    while True:
        try:
            # Check if timeout reached
            elapsed = (datetime.now(timezone.utc) - start_time).total_seconds()
            if elapsed > timeout_seconds:
                print(f"⏰ Timeout waiting for response with correlation ID: {correlation_id}")
                return None
            
            # Read messages looking for matching correlation ID
            messages = client.xread({STREAM_NAME: last_id}, count=10, block=1000)
            
            if messages:
                for stream_name, stream_messages in messages:
                    for message_id, message_data in stream_messages:
                        last_id = message_id
                        
                        # Check if this is a response with matching correlation ID
                        if (message_data.get("message_type") in ["response", "direct"] and 
                            message_data.get("correlation_id") == correlation_id):
                            print(f"✅ Found response for correlation ID: {correlation_id}")
                            return {
                                "id": message_id,
                                **message_data
                            }
            
        except Exception as e:
            print(f"❌ Error waiting for response: {e}")
            return None

def main():
    """Main function to demonstrate Redis Event-Bus functionality."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Redis Event-Bus Client with Reply Support")
    parser.add_argument("command", choices=["hello", "read", "lock", "unlock", "request", "response", "inbox", "demo"], 
                        help="Command to execute")
    parser.add_argument("--count", type=int, default=5, 
                        help="Number of messages to read")
    parser.add_argument("--resource", type=str, default="docker", 
                        help="Resource name for lock/unlock commands")
    parser.add_argument("--ttl", type=int, default=900000, 
                        help="Time-to-live in milliseconds for lock command")
    parser.add_argument("--action", type=str, default="ping", 
                        help="Action for request/response commands")
    parser.add_argument("--target", type=str, default=None, 
                        help="Target agent for direct messages")
    parser.add_argument("--correlation-id", type=str, default=None, 
                        help="Correlation ID for responses")
    parser.add_argument("--agent-id", type=str, default=None, 
                        help="Agent ID for inbox reading")
    parser.add_argument("--payload", type=str, default=None, 
                        help="JSON payload for messages")
    parser.add_argument("--timeout", type=int, default=30, 
                        help="Timeout in seconds for waiting responses")
    
    args = parser.parse_args()
    
    # Parse payload if provided
    payload = None
    if args.payload:
        try:
            payload = json.loads(args.payload)
        except json.JSONDecodeError:
            print("❌ Invalid JSON payload")
            return
    
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
    elif args.command == "request":
        client = connect_to_redis()
        if client:
            sender_name = os.environ.get("USER", "new_dev")
            correlation_id = send_request(client, sender_name, args.action, payload, args.target)
            print(f"✅ Request sent with correlation ID: {correlation_id}")
            
            # Wait for response
            print(f"⏳ Waiting for response (timeout: {args.timeout}s)...")
            response = wait_for_response(client, correlation_id, args.timeout)
            if response:
                print(f"📨 Response received: {response}")
            else:
                print("⏰ No response received within timeout")
    elif args.command == "response":
        if not args.correlation_id:
            print("❌ --correlation-id is required for response command")
            return
        client = connect_to_redis()
        if client:
            sender_name = os.environ.get("USER", "new_dev")
            send_response(client, sender_name, args.action, payload, args.correlation_id, args.target)
            print(f"✅ Response sent for correlation ID: {args.correlation_id}")
    elif args.command == "inbox":
        if not args.agent_id:
            print("❌ --agent-id is required for inbox command")
            return
        client = connect_to_redis()
        if client:
            read_agent_inbox(client, args.agent_id, count=args.count)
    elif args.command == "demo":
        demo_request_response()

def demo_request_response():
    """Demonstrate request/response functionality."""
    print("🎭 Redis Request/Response Demo")
    print("=" * 40)
    
    client = connect_to_redis()
    if not client:
        return
    
    sender_name = os.environ.get("USER", "demo_user")
    
    # Send a request
    print("📤 Sending request...")
    correlation_id = send_request(
        client, 
        sender=sender_name, 
        action="get_status",
        payload={"component": "workflow-engine"}
    )
    
    print(f"✅ Request sent with correlation ID: {correlation_id}")
    print("📋 To respond to this request, run:")
    print(f"   python redis_event_bus.py response --correlation-id {correlation_id} --action status_response --payload '{{\"status\": \"healthy\", \"uptime\": \"2h 30m\"}}'")
    
    # Wait for response
    print(f"\n⏳ Waiting for response (30s timeout)...")
    response = wait_for_response(client, correlation_id, 30)
    
    if response:
        print("📨 Response received!")
        print(f"   Action: {response.get('action')}")
        print(f"   Payload: {response.get('payload')}")
        print(f"   Sender: {response.get('sender')}")
    else:
        print("⏰ No response received within timeout")
        print("💡 This is expected if no other agent is running to respond")

if __name__ == "__main__":
    main()