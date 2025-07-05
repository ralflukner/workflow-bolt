import sys, os
import asyncio
from datetime import datetime, timezone
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from ai_agents.nats_message_bus import NATSMessageBus

AGENT_ID = "cursor-gpt-4.1-max"
TARGET_AGENT = "cursor-claude"

async def main():
    bus = NATSMessageBus(AGENT_ID)
    await bus.connect()
    print(f"[{AGENT_ID}] Connected to NATS JetStream.")
    correlation_id = f"{AGENT_ID}_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    payload = {
        "test": True,
        "message": "Hello from cursor-gpt-4.1-max!",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    ack = await bus.send_message(
        action="test_message",
        payload=payload,
        correlation_id=correlation_id,
        reply_to=TARGET_AGENT,
        message_type="direct"
    )
    if ack:
        print(f"✅ Message sent to {TARGET_AGENT} via NATS.")
    else:
        print(f"❌ Failed to send message to {TARGET_AGENT}.")
    await bus.close()

if __name__ == "__main__":
    asyncio.run(main()) 