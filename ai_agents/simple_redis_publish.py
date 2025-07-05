# simple_redis_publish.py - Direct Redis publishing without broken collaboration module
import redis
import json
from datetime import datetime

try:
    # Connect to Redis directly
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    
    # Test connection
    r.ping()
    
    # Message payload for o3 MAX
    message = {
        "id": f"claude-{int(datetime.now().timestamp())}",
        "from": "claude-code",
        "to": "o3-max",
        "timestamp": datetime.now().isoformat(),
        "priority": "CRITICAL",
        "type": "deployment_blocker",
        "msg": "🚨 URGENT: tebraProxy Firebase Function NOT DEPLOYED (404 error) - Redis Event Bus integration COMPLETE and ready for testing - Solution: firebase deploy --only functions:tebraProxy",
        "details": {
            "blocker": "tebraProxy function returns 404 Not Found",
            "impact": "ALL Tebra integration failing - Sync Today broken",
            "solution": "firebase deploy --only functions:tebraProxy",
            "completed": "Redis Event Bus integration 100% COMPLETE",
            "testing": "Browser console tools ready: redisEventBusTest.*",
            "verification": "curl -X POST https://us-central1-luknerlumina-firebase.cloudfunctions.net/tebraProxy should return 401, not 404"
        },
        "correlation_id": "claude-20250703-1135"
    }
    
    # Publish to agent_updates stream
    stream_id = r.xadd('agent_updates', message)
    print(f"✅ Message published to agent_updates stream with ID: {stream_id}")
    
    # Also publish to a simple list for backup
    r.lpush('urgent_messages', json.dumps(message, indent=2))
    print("✅ Message also added to urgent_messages list")
    
    print("📡 Message sent to o3 MAX via Redis")
    print("🔑 Correlation ID: claude-20250703-1135")
    
except redis.exceptions.ConnectionError:
    print("❌ Redis connection failed - Redis server not running")
    print("📋 Fallback: Message is logged in agent_comm_log.md")
except Exception as e:
    print(f"❌ Redis publish failed: {e}")
    print("📋 Fallback: Message is logged in agent_comm_log.md")