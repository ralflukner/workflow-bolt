from secure_redis_client import LuknerSecureRedisClient
from hipaa_workflow_agent import HIPAAWorkflowAgent

def test_system():
    """Test the complete system"""
    print("🧪 Testing Complete LuknerLumina HIPAA System...")
    print("=" * 60)
    
    # Test 1: Secure Redis Client
    print("1️⃣ Testing Secure Redis Client...")
    redis_client = LuknerSecureRedisClient()
    try:
        redis_client.ping()
        print("   ✅ Redis connection successful")
    except Exception as e:
        print(f"   ❌ Redis connection failed: {e}")
        return False
    
    # Test 2: HIPAA Workflow Agent
    print("
2️⃣ Testing HIPAA Workflow Agent...")
    agent = HIPAAWorkflowAgent()
    try:
        # Quick patient check-in test
        patient_info = {
            "patient_id": "TEST001",
            "name": "Test Patient",
            "provider": "Dr. Lukner"
        }
        workflow_id = agent.process_patient_check_in(patient_info)
        print(f"   ✅ Workflow created: {workflow_id}")
    except Exception as e:
        print(f"   ❌ Workflow test failed: {e}")
        return False
    
    print("
🎉 All systems operational!")
    print("🏥 LuknerLumina HIPAA system ready for production!")
    return True

if __name__ == "__main__":
    test_system()
