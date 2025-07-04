#!/usr/bin/env python3
"""
Test script for Redis 2FA system
Demonstrates complete authentication flow
"""

import time
import json
from redis_user_manager import RedisUserManager

def test_complete_flow():
    """Test complete Redis 2FA authentication flow"""
    print("🧪 Testing Redis 2FA Authentication System")
    print("=" * 50)
    
    manager = RedisUserManager()
    
    # 1. Create test users
    print("\n1️⃣ Creating test users...")
    
    # Create agent user
    agent_result = manager.create_user("test-agent-001", "agent")
    print(f"✅ Created agent: {agent_result['username']}")
    
    # Create human user  
    human_result = manager.create_user("test-human-001", "human")
    print(f"✅ Created human: {human_result['username']}")
    
    # 2. Test TOTP verification
    print("\n2️⃣ Testing TOTP verification...")
    
    import pyotp
    
    # Generate current TOTP for agent
    agent_totp = pyotp.TOTP(agent_result['totp_secret'])
    current_totp = agent_totp.now()
    
    print(f"📱 Current TOTP for {agent_result['username']}: {current_totp}")
    
    # Verify TOTP
    totp_valid = manager.verify_totp(agent_result['username'], current_totp)
    print(f"✅ TOTP verification: {'PASSED' if totp_valid else 'FAILED'}")
    
    # 3. Test custom 2FA
    print("\n3️⃣ Testing custom 2FA...")
    
    # Generate custom 2FA code
    custom_code = manager.compute_custom_2fa(agent_result['custom_formula'])
    print(f"🧮 Current custom 2FA for {agent_result['username']}: {custom_code}")
    
    # Verify custom 2FA
    custom_valid = manager.verify_custom_2fa(agent_result['username'], custom_code)
    print(f"✅ Custom 2FA verification: {'PASSED' if custom_valid else 'FAILED'}")
    
    # 4. Test Redis connection with new user
    print("\n4️⃣ Testing Redis connection...")
    
    import redis
    
    try:
        # Connect using new agent credentials
        redis_client = redis.Redis(
            host="redis-16451.c280.us-central1-2.gce.redns.redis-cloud.com",
            port=16451,
            username=agent_result['username'],
            password=agent_result['password'],
            ssl=True,
            ssl_cert_reqs=None
        )
        
        # Test Redis operations
        redis_client.ping()
        redis_client.set(f"test:{agent_result['username']}", "Hello 2FA!")
        value = redis_client.get(f"test:{agent_result['username']}").decode()
        
        print(f"✅ Redis connection successful: {value}")
        
        # Clean up test key
        redis_client.delete(f"test:{agent_result['username']}")
        
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
    
    # 5. Test secret rotation
    print("\n5️⃣ Testing secret rotation...")
    
    # Force rotation for agent
    rotation_result = manager.rotate_user_secrets(agent_result['username'], force=True)
    print(f"🔄 Rotation status: {rotation_result['status']}")
    
    if rotation_result['status'] == 'rotated':
        print(f"🔐 New TOTP secret: {rotation_result['new_totp_secret']}")
        print(f"🧮 New custom formula: {rotation_result['new_custom_formula']}")
        
        # Verify old TOTP no longer works
        old_totp_valid = manager.verify_totp(agent_result['username'], current_totp)
        print(f"🚫 Old TOTP verification: {'FAILED (Good!)' if not old_totp_valid else 'PASSED (Bad!)'}")
        
        # Verify new TOTP works
        new_totp = pyotp.TOTP(rotation_result['new_totp_secret']).now()
        new_totp_valid = manager.verify_totp(agent_result['username'], new_totp)
        print(f"✅ New TOTP verification: {'PASSED' if new_totp_valid else 'FAILED'}")
    
    # 6. Test compromise scenario
    print("\n6️⃣ Testing compromise scenario...")
    
    compromise_result = manager.mark_compromised(human_result['username'])
    print(f"🚨 Compromise handling: {compromise_result['status']}")
    
    # 7. List all users
    print("\n7️⃣ Listing all users...")
    
    users = manager.list_users()
    print(f"📋 Total users: {len(users)}")
    for username, info in users.items():
        status = "🟢" if info.get('active', True) else "🔴"
        print(f"  {status} {username} ({info.get('user_type', 'unknown')})")
    
    # 8. Generate QR codes
    print("\n8️⃣ Generating QR codes...")
    
    try:
        agent_qr = manager.generate_qr_code_image(agent_result['username'])
        with open(f"qr_{agent_result['username']}.png", 'wb') as f:
            f.write(agent_qr)
        print(f"📱 QR code saved: qr_{agent_result['username']}.png")
        
        human_qr = manager.generate_qr_code_image(human_result['username'])
        with open(f"qr_{human_result['username']}.png", 'wb') as f:
            f.write(human_qr)
        print(f"📱 QR code saved: qr_{human_result['username']}.png")
        
    except Exception as e:
        print(f"⚠️ QR code generation failed: {e}")
    
    # 9. Performance test
    print("\n9️⃣ Performance testing...")
    
    start_time = time.time()
    for i in range(10):
        totp_valid = manager.verify_totp(agent_result['username'], new_totp)
        custom_valid = manager.verify_custom_2fa(agent_result['username'], 
                                                manager.compute_custom_2fa(rotation_result['new_custom_formula']))
    
    end_time = time.time()
    avg_time = (end_time - start_time) / 20  # 20 operations total
    print(f"⚡ Average verification time: {avg_time:.3f}s")
    
    # 10. Cleanup (optional)
    print("\n🔟 Cleanup...")
    
    cleanup = input("Delete test users? (y/N): ").lower().strip()
    if cleanup == 'y':
        manager.delete_user(agent_result['username'])
        manager.delete_user(human_result['username'])
        print("🗑️ Test users deleted")
    else:
        print("ℹ️ Test users preserved for manual testing")
        print(f"Agent: {agent_result['username']}")
        print(f"Human: {human_result['username']}")
    
    print("\n🎉 Redis 2FA System Test Complete!")
    print("=" * 50)
    
    return {
        'agent_user': agent_result['username'],
        'human_user': human_result['username'],
        'totp_test': totp_valid,
        'custom_2fa_test': custom_valid,
        'rotation_test': rotation_result['status'] == 'rotated',
        'performance': avg_time
    }

def demo_usage_patterns():
    """Demonstrate various usage patterns"""
    print("\n🎭 Usage Pattern Demonstrations")
    print("=" * 40)
    
    manager = RedisUserManager()
    
    # Agent authentication flow
    print("\n🤖 Agent Authentication Flow:")
    print("1. Agent starts up")
    print("2. Reads TOTP secret from secure storage")
    print("3. Generates current TOTP")
    print("4. Computes custom 2FA using formula")
    print("5. Authenticates to Redis")
    print("6. Begins operations")
    
    # Human authentication flow  
    print("\n👤 Human Authentication Flow:")
    print("1. Human opens authenticator app")
    print("2. Reads TOTP code")
    print("3. Computes custom 2FA (or uses script)")
    print("4. Connects to Redis")
    print("5. Performs administrative tasks")
    
    # Emergency scenarios
    print("\n🚨 Emergency Scenarios:")
    print("1. Suspected compromise → mark_compromised() → immediate rotation")
    print("2. 90-day rotation → automated via Cloud Scheduler")
    print("3. Agent startup failure → verify credentials → rotate if needed")
    print("4. Audit requirement → list all users and last rotation dates")

if __name__ == "__main__":
    import sys
    
    try:
        # Run complete test
        results = test_complete_flow()
        
        # Show usage patterns
        demo_usage_patterns()
        
        # Exit with success if all tests passed
        all_passed = all([
            results['totp_test'],
            results['custom_2fa_test'], 
            results['rotation_test']
        ])
        
        if all_passed:
            print("\n🎊 All tests PASSED!")
            sys.exit(0)
        else:
            print("\n💥 Some tests FAILED!")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)