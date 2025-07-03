import unittest
from unittest.mock import Mock, patch
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from secure_redis_client import LuknerSecureRedisClient

class TestLuknerSecureRedisClient(unittest.TestCase):
    def setUp(self):
        self.client = LuknerSecureRedisClient()
    
    @patch('redis.Redis')
    def test_connection_establishment(self, mock_redis):
        """Test Redis connection establishment"""
        mock_redis.return_value.ping.return_value = True
        
        result = self.client.test_connection()
        self.assertTrue(result)
        print("✅ Redis connection test passed")
    
    @patch('redis.Redis')
    def test_data_storage(self, mock_redis):
        """Test data storage functionality"""
        mock_redis.return_value.hset.return_value = True
        
        test_data = {"test_key": "test_value"}
        result = self.client.store_data("test_namespace", test_data)
        
        self.assertTrue(result)
        print("✅ Data storage test passed")
    
    @patch('redis.Redis')
    def test_data_retrieval(self, mock_redis):
        """Test data retrieval functionality"""
        mock_redis.return_value.hget.return_value = '{"test_key": "test_value"}'
        
        result = self.client.get_data("test_namespace")
        self.assertIsNotNone(result)
        print("✅ Data retrieval test passed")
    
    def test_encryption_decryption(self):
        """Test encryption and decryption"""
        test_data = "sensitive_patient_data"
        
        encrypted = self.client.encrypt_data(test_data)
        decrypted = self.client.decrypt_data(encrypted)
        
        self.assertEqual(test_data, decrypted)
        print("✅ Encryption/decryption test passed")

if __name__ == "__main__":
    unittest.main(verbosity=2)
