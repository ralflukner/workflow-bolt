import unittest
from unittest.mock import Mock, patch
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lukner_cli import LuknerCLI

class TestLuknerCLI(unittest.TestCase):
    def setUp(self):
        self.cli = LuknerCLI()
    
    def test_user_authentication(self):
        """Test user authentication"""
        valid_users = [
            "dr.ralf.lukner",
            "beth.lukner", 
            "krystina.joslyn",
            "tanisha.joslyn",
            "paul.marigliano"
        ]
        
        for user in valid_users:
            result = self.cli.authenticate_user(user)
            self.assertTrue(result)
        
        print("✅ User authentication test passed")
    
    def test_patient_list_command(self):
        """Test patient list command"""
        with patch('sys.argv', ['lukner_cli.py', '--user', 'dr.ralf.lukner', 'patient', 'list']):
            # This should not raise an exception
            try:
                self.cli.handle_patient_command(['list'])
                print("✅ Patient list command test passed")
            except Exception as e:
                self.fail(f"Patient list command failed: {e}")
    
    def test_message_command(self):
        """Test message command"""
        with patch('sys.argv', ['lukner_cli.py', '--user', 'beth.lukner', 'message', 'inbox']):
            try:
                self.cli.handle_message_command(['inbox'])
                print("✅ Message command test passed")
            except Exception as e:
                self.fail(f"Message command failed: {e}")

if __name__ == "__main__":
    unittest.main(verbosity=2)
