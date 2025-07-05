#!/usr/bin/env python3
"""
Redis Event-Bus Example Script

This script demonstrates how to use the Redis Event-Bus client to communicate
with the LuknerLumina Redis Event-Bus.

Usage:
    1. Set the REDIS_PASS environment variable with the Redis password
    2. Run this script to send a hello_world message and read recent messages

Example:
    export REDIS_PASS="your_redis_password"  # Replace with actual password
    python redis_event_bus_example.py
"""

import os
import sys
from redis_event_bus import connect_to_redis, send_message, read_messages

def main():
    """Main function to demonstrate Redis Event-Bus functionality."""
    # Check if REDIS_PASS environment variable is set
    if not os.environ.get("REDIS_PASS"):
        print("❌ ERROR: REDIS_PASS environment variable not set.")
        print("Please set the REDIS_PASS environment variable with the Redis password.")
        print("Example: export REDIS_PASS=\"your_redis_password\"")
        sys.exit(1)
    
    # Connect to Redis
    print("Connecting to Redis...")
    client = connect_to_redis()
    if not client:
        print("❌ Failed to connect to Redis. Exiting.")
        sys.exit(1)
    
    # Send a hello_world message
    print("\n--- Sending hello_world message ---")
    sender_name = os.environ.get("USER", "new_dev")
    message_id = send_message(
        client,
        sender=sender_name,
        action="hello_world",
        payload={"message": f"Hello from {sender_name}! Just joined the Redis Event-Bus."}
    )
    
    if not message_id:
        print("❌ Failed to send message. Exiting.")
        sys.exit(1)
    
    # Read recent messages
    print("\n--- Reading recent messages ---")
    messages = read_messages(client, count=5)
    
    if not messages:
        print("No messages found in the stream.")
    
    print("\n✅ Example completed successfully!")
    print("You've successfully connected to the Redis Event-Bus and sent a hello_world message.")
    print("Welcome to the LuknerLumina project!")

if __name__ == "__main__":
    main()