#!/usr/bin/env python3

"""
Developer Notification Script
Sends Redis message about new Plane.so project management system
"""

import redis
import json
from datetime import datetime

def send_redis_notification():
    """Send notification to all developers via Redis"""
    
    # Connect to Redis
    try:
        r = redis.Redis(host='10.161.35.147', port=6379, decode_responses=True)
        r.ping()
        print("✅ Connected to Redis")
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return False
    
    # Create the notification message
    message = {
        "type": "PROJECT_MANAGEMENT_UPDATE",
        "priority": "HIGH",
        "timestamp": datetime.now().isoformat(),
        "from": "Claude Code Assistant",
        "subject": "🚀 NEW PROJECT MANAGEMENT SYSTEM DEPLOYED",
        "content": {
            "title": "Plane.so Self-Hosted Project Management Now Live",
            "access_url": "http://localhost:3000",
            "api_url": "http://localhost:8000/api/v1",
            "key_changes": [
                "All project plans consolidated into Plane.so database",
                "Real-time collaboration for multiple developers",
                "API integration for multi-agent status updates",
                "Replaces scattered markdown planning documents"
            ],
            "immediate_actions": [
                "Create account at http://localhost:3000",
                "Set up your workspace and join 'Workflow Bolt' project",
                "Bookmark the interface for daily use",
                "Review migrated tasks and update status"
            ],
            "migration_status": "Ready - all existing plans imported",
            "old_files_status": "Will be archived after migration verification"
        },
        "agent_instructions": {
            "api_endpoint": "http://localhost:8000/api/v1",
            "authentication": "Bearer token required (get from Plane.so settings)",
            "update_script": "scripts/plane-agent-api.py",
            "environment_vars": [
                "PLANE_API_TOKEN",
                "PLANE_WORKSPACE_ID", 
                "PLANE_PROJECT_ID"
            ]
        },
        "documentation": {
            "setup_script": "scripts/setup-plane-so.sh",
            "migration_script": "scripts/migrate-to-plane.py",
            "agent_api": "scripts/plane-agent-api.py",
            "management_commands": {
                "start": "~/plane-deployment/start-plane.sh",
                "stop": "~/plane-deployment/stop-plane.sh",
                "logs": "cd ~/plane-deployment && docker-compose logs -f"
            }
        }
    }
    
    # Send to multiple Redis channels
    channels = [
        "developer_notifications",
        "agent_updates", 
        "project_management",
        "workflow_updates"
    ]
    
    for channel in channels:
        try:
            r.publish(channel, json.dumps(message, indent=2))
            print(f"✅ Sent notification to {channel}")
        except Exception as e:
            print(f"❌ Failed to send to {channel}: {e}")
    
    # Also store in Redis for persistence
    try:
        r.setex("latest_project_update", 86400, json.dumps(message))  # 24 hour TTL
        print("✅ Stored persistent notification")
    except Exception as e:
        print(f"❌ Failed to store persistent notification: {e}")
    
    return True

if __name__ == "__main__":
    print("📢 Sending Redis notification to all developers...")
    send_redis_notification()
    print("✅ Notification sent!")