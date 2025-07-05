#!/usr/bin/env python3
"""
Simple script to send messages to AI agents via NATS JetStream (replaces Redis)
"""
import sys, os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
import json
import asyncio
from datetime import datetime, timezone
# If running from project root, use this import:
from ai_agents.nats_message_bus import NATSMessageBus

async def send_ai_collaboration_message(bus, target_agent, message_data):
    correlation_id = f"claude_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    message = {
        "sender": "claude",
        "action": "collaboration_request",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message_type": "direct",
        "correlation_id": correlation_id,
        "reply_to": target_agent,
        "payload": message_data
    }
    try:
        ack = await bus.send_message(
            action="collaboration_request",
            payload=message_data,
            correlation_id=correlation_id,
            reply_to=target_agent,
            message_type="direct"
        )
        if ack:
            print(f"🚀 Message sent to {target_agent}")
            print(f"   Subject: agent.updates.{target_agent}")
            print(f"   Correlation ID: {correlation_id}")
            return True
        else:
            print(f"❌ Failed to send message to {target_agent}")
            return False
    except Exception as e:
        print(f"❌ Exception sending message to {target_agent}: {e}")
        return False

async def main():
    bus = NATSMessageBus("claude")
    await bus.connect()

    o3_max_message = {
        "task": "share_strengths_and_contributions",
        "context": "You previously designed the Redis communication architecture and helped Gemini connect to the messaging system. We are building a multi-AI collaboration system and need to understand your strengths, preferences, and past contributions to this project.",
        "questions": [
            "What specific Redis solutions did you implement?",
            "What types of problems do you most enjoy solving?",
            "What makes you uniquely suited for complex reasoning tasks?",
            "How can we best leverage your expertise in the multi-AI system?"
        ],
        "requested_by": "claude",
        "project": "workflow-bolt",
        "priority": "high",
        "github_issues": [
            "https://github.com/ralflukner/workflow-bolt/issues/17",
            "https://github.com/ralflukner/workflow-bolt/issues/19"
        ]
    }

    gemini_message = {
        "task": "share_strengths_and_contributions",
        "context": "You have been identified as having strong capabilities in code review, real-time analysis, and multimodal content processing. The user mentioned that o3 MAX helped you connect to the Redis messaging system, showing successful AI-to-AI collaboration.",
        "questions": [
            "What specific code reviews or optimizations have you provided?",
            "What aspects of code analysis do you excel at?",
            "How can we leverage your real-time information access?",
            "What types of multimodal content analysis can you provide?",
            "How do you prefer to work with other AIs?"
        ],
        "requested_by": "claude",
        "project": "workflow-bolt",
        "priority": "high",
        "github_issues": [
            "https://github.com/ralflukner/workflow-bolt/issues/18",
            "https://github.com/ralflukner/workflow-bolt/issues/19"
        ]
    }

    print("📤 Sending collaboration requests to AI agents...")
    print("=" * 50)

    if await send_ai_collaboration_message(bus, "o3-max", o3_max_message):
        print("✅ Request sent to o3 MAX")
    else:
        print("❌ Failed to send request to o3 MAX")

    print()

    if await send_ai_collaboration_message(bus, "gemini", gemini_message):
        print("✅ Request sent to Gemini")
    else:
        print("❌ Failed to send request to Gemini")

    print("\n📋 Messages sent! AI agents can respond via NATS messaging system.")
    print("🔍 Check GitHub issues for collaboration progress:")
    print("   - o3 MAX: https://github.com/ralflukner/workflow-bolt/issues/17")
    print("   - Gemini: https://github.com/ralflukner/workflow-bolt/issues/18")
    print("   - Multi-AI: https://github.com/ralflukner/workflow-bolt/issues/19")

    await bus.close()

if __name__ == "__main__":
    asyncio.run(main())