import unittest
import subprocess
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class TestUserAcceptance(unittest.TestCase):
    def test_doctor_workflow(self):
        """Test typical doctor workflow"""
        print("👨‍⚕️ Testing doctor workflow...")
        
        # 1. Doctor logs in
        result = subprocess.run([
            "python", "lukner_cli.py",
            "--user", "dr.ralf.lukner",
            "user", "profile"
        ], capture_output=True, text=True)
        
        self.assertEqual(result.returncode, 0)
        
        # 2. Doctor views patient list
        result = subprocess.run([
            "python", "lukner_cli.py",
            "--user", "dr.ralf.lukner", 
            "patient", "list"
        ], capture_output=True, text=True)
        
        self.assertEqual(result.returncode, 0)
        
        # 3. Doctor checks messages
        result = subprocess.run([
            "python", "lukner_cli.py",
            "--user", "dr.ralf.lukner",
            "message", "inbox"
        ], capture_output=True, text=True)
        
        self.assertEqual(result.returncode, 0)
        
        print("✅ Doctor workflow test passed")
    
    def test_staff_workflow(self):
        """Test typical staff workflow"""
        print("👩‍💼 Testing staff workflow...")
        
        # 1. Staff member logs in
        result = subprocess.run([
            "python", "lukner_cli.py",
            "--user", "krystina.joslyn",
            "user", "profile"
        ], capture_output=True, text=True)
        
        self.assertEqual(result.returncode, 0)
        
        # 2. Staff views patient list
        result = subprocess.run([
            "python", "lukner_cli.py",
            "--user", "krystina.joslyn",
            "patient", "list"
        ], capture_output=True, text=True)
        
        self.assertEqual(result.returncode, 0)
        
        print("✅ Staff workflow test passed")
    
    def test_admin_workflow(self):
        """Test typical admin workflow"""
        print("👩‍💻 Testing admin workflow...")
        
        # 1. Admin logs in
        result = subprocess.run([
            "python", "lukner_cli.py",
            "--user", "beth.lukner",
            "user", "profile"
        ], capture_output=True, text=True)
        
        self.assertEqual(result.returncode, 0)
        
        # 2. Admin views messages
        result = subprocess.run([
            "python", "lukner_cli.py",
            "--user", "beth.lukner",
            "message", "inbox"
        ], capture_output=True, text=True)
        
        self.assertEqual(result.returncode, 0)
        
        print("✅ Admin workflow test passed")
    
    def test_ai_collaboration_workflow(self):
        """Test AI collaboration workflow"""
        print("🤖 Testing AI collaboration workflow...")
        
        # Test AI collaboration connection
        result = subprocess.run([
            "python", "ai_agent_collaboration.py"
        ], capture_output=True, text=True)
        
        self.assertEqual(result.returncode, 0)
        
        print("✅ AI collaboration workflow test passed")

if __name__ == "__main__":
    unittest.main(verbosity=2)
