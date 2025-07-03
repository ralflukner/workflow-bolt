#!/bin/bash

echo "🧪 LuknerLumina Quick Test"
echo "========================="

echo "1. Testing Redis connection..."
python -c "
from secure_redis_client import LuknerSecureRedisClient
client = LuknerSecureRedisClient()
if client.test_connection():
    print('✅ Redis connection: OK')
else:
    print('❌ Redis connection: FAILED')
"

echo "2. Testing CLI functionality..."
python lukner_cli.py --user dr.ralf.lukner patient list > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ CLI functionality: OK"
else
    echo "❌ CLI functionality: FAILED"
fi

echo "3. Testing AI collaboration..."
python -c "
from ai_agent_collaboration import AIAgentCollaboration
collaboration = AIAgentCollaboration()
agents = collaboration.activate_all_agents()
if len(agents) == 4:
    print('✅ AI collaboration: OK')
else:
    print('❌ AI collaboration: FAILED')
"

echo ""
echo "🎯 Quick test completed!"
echo "For comprehensive testing, run: python tests/run_tests.py"
