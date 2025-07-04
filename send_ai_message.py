#!/usr/bin/env python3
"""
Simple script to send messages to AI agents via Redis
"""
import os
import ssl
import redis
import json
from datetime import datetime, timezone
from urllib.parse import quote_plus

# Redis connection information
REDIS_HOST = "redis-16451.c280.us-central1-2.gce.redns.redis-cloud.com"
REDIS_PORT = 16451
REDIS_USERNAME = "default"

def connect_to_redis():
    """Connect to Redis with URL encoding for special characters."""
    redis_password = os.environ.get("REDIS_PASS")
    if not redis_password:
        print("❌ ERROR: REDIS_PASS environment variable not set.")
        return None
    
    try:
        # URL encode the password to handle special characters
        encoded_password = quote_plus(redis_password)
        url = f"rediss://{REDIS_USERNAME}:{encoded_password}@{REDIS_HOST}:{REDIS_PORT}"
        
        # Create Redis client with SSL - rediss:// scheme enables SSL automatically
        client = redis.Redis.from_url(url, ssl_cert_reqs=ssl.CERT_NONE, decode_responses=True)
        
        # Test connection
        if client.ping():
            print("✅ Successfully connected to Redis.")
            return client
        else:
            print("❌ Ping failed.")
            return None
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return None

def send_ai_collaboration_message(target_agent, message_data):
    """Send collaboration request to AI agent."""
    client = connect_to_redis()
    if not client:
        return False
    
    try:
        # Prepare message
        correlation_id = f"claude_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        
        message = {
            "sender": "claude",
            "action": "collaboration_request", 
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message_type": "direct",
            "correlation_id": correlation_id,
            "reply_to": target_agent,
            "payload": json.dumps(message_data)
        }
        
        # Send to agent-specific inbox
        stream_name = f"agent_inbox:{target_agent}"
        message_id = client.xadd(stream_name, message)
        
        print(f"🚀 Message sent to {target_agent}")
        print(f"   Stream: {stream_name}")
        print(f"   Message ID: {message_id}")
        print(f"   Correlation ID: {correlation_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send message: {e}")
        return False

def main():
    # Message for o3 MAX
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
    
    # Message for Gemini
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
    
    # Send messages
    print("📤 Sending collaboration requests to AI agents...")
    print("=" * 50)
    
    if send_ai_collaboration_message("o3-max", o3_max_message):
        print("✅ Request sent to o3 MAX")
    else:
        print("❌ Failed to send request to o3 MAX")
    
    print()
    
    if send_ai_collaboration_message("gemini", gemini_message):
        print("✅ Request sent to Gemini")
    else:
        print("❌ Failed to send request to Gemini")
    
    print("\n📋 Messages sent! AI agents can respond via Redis messaging system.")
    print("🔍 Check GitHub issues for collaboration progress:")
    print("   - o3 MAX: https://github.com/ralflukner/workflow-bolt/issues/17")
    print("   - Gemini: https://github.com/ralflukner/workflow-bolt/issues/18")
    print("   - Multi-AI: https://github.com/ralflukner/workflow-bolt/issues/19")

if __name__ == "__main__":
    main()