#!/usr/bin/env python3

"""
Test script for Redis messaging with reply capabilities
"""

import sys
import os
import time
import threading
import json
from datetime import datetime

# Add the ai-agents directory to path
sys.path.append('./ai-agents')

from redis_event_bus import (
    connect_to_redis,
    send_message,
    send_request,
    send_response,
    read_messages,
    read_agent_inbox,
    wait_for_response
)

def test_basic_messaging():
    """Test basic message sending and reading"""
    print("🧪 Testing basic messaging...")
    
    client = connect_to_redis()
    if not client:
        print("❌ Failed to connect to Redis")
        return False
    
    # Send a test message
    message_id = send_message(
        client,
        sender="test_agent",
        action="test_message",
        payload={"test": "data"}
    )
    
    if message_id:
        print(f"✅ Message sent successfully: {message_id}")
        
        # Read messages
        messages = read_messages(client, count=1)
        if messages:
            print(f"✅ Message read successfully: {len(messages)} messages")
            return True
        else:
            print("❌ Failed to read messages")
            return False
    else:
        print("❌ Failed to send message")
        return False

def test_request_response():
    """Test request/response messaging"""
    print("\n🧪 Testing request/response messaging...")
    
    client = connect_to_redis()
    if not client:
        print("❌ Failed to connect to Redis")
        return False
    
    # Send a request
    correlation_id = send_request(
        client,
        sender="test_requester",
        action="ping",
        payload={"message": "Hello, are you there?"}
    )
    
    if correlation_id:
        print(f"✅ Request sent with correlation ID: {correlation_id}")
        
        # Simulate another agent responding
        def respond_to_request():
            time.sleep(2)  # Simulate processing time
            send_response(
                client,
                sender="test_responder",
                action="pong",
                payload={"message": "Yes, I'm here!", "received_at": datetime.now().isoformat()},
                correlation_id=correlation_id
            )
        
        # Start responder thread
        responder_thread = threading.Thread(target=respond_to_request)
        responder_thread.start()
        
        # Wait for response
        response = wait_for_response(client, correlation_id, timeout_seconds=10)
        if response:
            print(f"✅ Response received: {response.get('action')}")
            print(f"   Payload: {response.get('payload')}")
            return True
        else:
            print("❌ No response received")
            return False
    else:
        print("❌ Failed to send request")
        return False

def test_direct_messaging():
    """Test direct agent-to-agent messaging"""
    print("\n🧪 Testing direct messaging...")
    
    client = connect_to_redis()
    if not client:
        print("❌ Failed to connect to Redis")
        return False
    
    target_agent = "test_agent_inbox"
    
    # Send direct message
    message_id = send_message(
        client,
        sender="test_sender",
        action="direct_message",
        payload={"message": "This is a direct message"},
        reply_to=target_agent,
        message_type="direct"
    )
    
    if message_id:
        print(f"✅ Direct message sent: {message_id}")
        
        # Read the agent's inbox
        time.sleep(1)  # Allow message to be processed
        messages = read_agent_inbox(client, target_agent, count=1)
        
        if messages:
            print(f"✅ Direct message found in inbox: {len(messages)} messages")
            return True
        else:
            print("❌ No messages found in agent inbox")
            return False
    else:
        print("❌ Failed to send direct message")
        return False

def test_message_correlation():
    """Test message correlation functionality"""
    print("\n🧪 Testing message correlation...")
    
    client = connect_to_redis()
    if not client:
        print("❌ Failed to connect to Redis")
        return False
    
    # Send multiple requests with different correlation IDs
    correlations = []
    for i in range(3):
        correlation_id = send_request(
            client,
            sender=f"test_requester_{i}",
            action="multi_ping",
            payload={"request_number": i}
        )
        correlations.append(correlation_id)
    
    print(f"✅ Sent {len(correlations)} requests")
    
    # Send responses in reverse order to test correlation
    for i, correlation_id in enumerate(reversed(correlations)):
        send_response(
            client,
            sender=f"test_responder_{i}",
            action="multi_pong",
            payload={"response_number": i},
            correlation_id=correlation_id
        )
    
    print(f"✅ Sent {len(correlations)} responses")
    
    # Verify we can find specific responses
    response = wait_for_response(client, correlations[0], timeout_seconds=5)
    if response and response.get('correlation_id') == correlations[0]:
        print("✅ Correlation ID matching works correctly")
        return True
    else:
        print("❌ Correlation ID matching failed")
        return False

def run_all_tests():
    """Run all Redis messaging tests"""
    print("🚀 Redis Messaging Test Suite")
    print("=" * 50)
    
    tests = [
        ("Basic Messaging", test_basic_messaging),
        ("Request/Response", test_request_response),
        ("Direct Messaging", test_direct_messaging),
        ("Message Correlation", test_message_correlation)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
            if result:
                print(f"✅ {test_name}: PASSED")
            else:
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\n🏆 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Redis messaging is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Check Redis connection and configuration.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)