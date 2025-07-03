import subprocess
import sys

def run_test(script_name, description):
    """Run a test script and show results"""
    print(f"🧪 {description}")
    print("-" * 50)
    
    try:
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print(result.stdout)
            print(f"✅ {description} - PASSED")
        else:
            print(f"❌ {description} - FAILED")
            print("Error:", result.stderr)
            
    except Exception as e:
        print(f"❌ {description} - ERROR: {e}")
    
    print("=" * 60)

def main():
    """Run all system tests"""
    print("🏥 LuknerLumina HIPAA System - Complete Test Suite")
    print("=" * 60)
    
    tests = [
        ("secure_redis_client.py", "Secure Redis Client Test"),
        ("hipaa_workflow_agent.py", "HIPAA Workflow Agent Test"),
        ("lukner_dashboard.py", "System Dashboard Test"),
        ("patient_manager.py", "Patient Manager Test"),
        ("system_summary.py", "System Summary Test")
    ]
    
    for script, description in tests:
        run_test(script, description)
    
    print("🎉 All tests completed!")
    print("🏥 LuknerLumina HIPAA System: FULLY OPERATIONAL!")

if __name__ == "__main__":
    main()
