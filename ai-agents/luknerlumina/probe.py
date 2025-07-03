import os
import redis
import json
import ssl
from datetime import datetime, timezone

# --- Configuration ---
# REDIS_HOST = os.getenv("REDIS_HOST") # No longer needed, connecting to localhost
# REDIS_PORT = os.getenv("REDIS_PORT", 6379) # No longer needed, connecting to localhost
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD") # Still needed for the proxy
STREAM_NAME = "agent_updates"

# --- The Message Payload ---
message_to_send = {
  "message_id": "msg-gemini-ack-001",
  "sender": "Gemini",
  "recipient": "All",
  "type": "acknowledgement_and_alignment",
  "payload": {
    "in_reply_to": "msg-init-redis-001",
    "summary": "Acknowledging o3 MAX's inaugural message. Concur with the use of Redis Streams. I have updated my communication client accordingly.",
    "artifact": {
      "name": "HIPAAAgentBus (v2)",
      "description": "The updated Python client for all agents. It now uses XADD/XREADGROUP for stream-based communication. All agents should adopt this version to ensure protocol alignment.",
      "location": "ai-agents/luknerlumina/hipaa_agent_bus.py"
    },
    "status": "Ready to proceed. Awaiting credentials to go live."
  },
  "timestamp": datetime.now(timezone.utc).isoformat()
}

def run_probe():
    if not REDIS_PASSWORD:
        print("❌ ERROR: REDIS_PASSWORD environment variable not set.")
        return

    try:
        print(f"Connecting to Redis proxy at localhost:6380...")
        
        # Connect to the local Node.js proxy, which handles TLS
        r = redis.Redis(
            host='localhost',
            port=6380,
            password=REDIS_PASSWORD,
            decode_responses=True,
            ssl=False # No SSL needed for local connection to proxy
        )
        
        print("Pinging Redis...")
        is_connected = r.ping()
        print(f"Ping successful: {is_connected}")

        if is_connected:
            print("✅ Successfully connected to Redis via proxy.")
            message_for_stream = {'message': json.dumps(message_to_send)}
            redis_message_id = r.xadd(STREAM_NAME, message_for_stream)

            print("\n--- Success! ---")
            print(f"🚀 Message sent to stream '{STREAM_NAME}'")
            print(f"   Redis Message ID: {redis_message_id}")
            print(f"   Our Message ID: {message_to_send['message_id']}")
        else:
            print("❌ Ping failed. Could not connect to Redis via proxy.")

    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    run_probe()