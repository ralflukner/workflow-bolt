import unittest
from unittest.mock import Mock, patch
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_agent_collaboration import AIAgentCollaboration

class TestAIAgentCollaboration(unittest.TestCase):
    def setUp(self):
        self.collaboration = AIAgentCollaboration()
    
    def test_agent_initialization(self):
        """Test AI agent initialization"""
        agents = self.collaboration.activate_all_agents()
        
        self.assertIsInstance(agents, dict)
        self.assertIn("claude-master-agent", agents)
        self.assertIn("workflow-agent", agents)
        self.assertIn("compliance-agent", agents)
        self.assertIn("messaging-agent", agents)
        print("✅ Agent initialization test passed")
    
    def test_task_assignment(self):
        """Test task assignment to agents"""
        task_id = self.collaboration.assign_task_to_agent(
            "workflow-agent", 
            "Test EHR integration",
            "dr.ralf.lukner"
        )
        
        self.assertIsNotNone(task_id)
        self.assertTrue(task_id.startswith("task_"))
        print("✅ Task assignment test passed")
    
    def test_collaboration_setup(self):
        """Test multi-agent collaboration setup"""
        task_id = "test_task_123"
        
        # This should not raise an exception
        self.collaboration.collaborate_on_task(
            task_id,
            "workflow-agent",
            ["compliance-agent", "messaging-agent"]
        )
        print("✅ Collaboration setup test passed")

if __name__ == "__main__":
    unittest.main(verbosity=2)
