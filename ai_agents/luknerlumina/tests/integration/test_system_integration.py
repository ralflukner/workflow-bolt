import unittest
import time
import subprocess
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lukner_enterprise_system import LuknerEnterpriseSystem
from ai_agent_collaboration import AIAgentCollaboration
from secure_redis_client import LuknerSecureRedisClient

class TestSystemIntegration(unittest.TestCase):
    def setUp(self):
        self.enterprise_system = LuknerEnterpriseSystem()
        self.ai_collaboration = AIAgentCollaboration()
        self.redis_client = LuknerSecureRedisClient()
    
    def test_full_system_startup(self):
        """Test complete system startup"""
        print("🚀 Testing full system startup...")
        
        # Test Redis connection
        self.assertTrue(self.redis_client.test_connection())
        
        # Test enterprise system initialization
        self.enterprise_system.initialize_complete_system()
        
        # Test AI agent activation
        agents = self.ai_collaboration.activate_all_agents()
        self.assertEqual(len(agents), 4)
        
        print("✅ Full system startup test passed")
    
    def test_end_to_end_workflow(self):
        """Test complete end-to-end workflow"""
        print("🔄 Testing end-to-end workflow...")
        
        # 1. User connects
        user = "dr.ralf.lukner"
        
        # 2. User requests AI collaboration
        task_id = self.ai_collaboration.assign_task_to_agent(
            "workflow-agent",
            "Test patient workflow",
            user
        )
        
        # 3. Multi-agent collaboration
        self.ai_collaboration.collaborate_on_task(
            task_id,
            "workflow-agent", 
            ["compliance-agent"]
        )
        
        # 4. Verify task data stored
        task_data = self.redis_client.get_data(f"task_assignment:{task_id}")
        self.assertIsNotNone(task_data)
        
        print("✅ End-to-end workflow test passed")
    
    def test_cli_integration(self):
        """Test CLI integration with backend"""
        print("🖥️ Testing CLI integration...")
        
        # Test Python CLI
        result = subprocess.run([
            "python", "lukner_cli.py", 
            "--user", "dr.ralf.lukner",
            "patient", "list"
        ], capture_output=True, text=True)
        
        self.assertEqual(result.returncode, 0)
        print("✅ CLI integration test passed")

if __name__ == "__main__":
    unittest.main(verbosity=2)
