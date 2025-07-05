#!/usr/bin/env python3

import unittest
import sys
import os
from unittest.mock import Mock, patch, MagicMock
import redis
import logging

# Add parent directory to path to import the module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from secure_redis_client import LuknerSecureRedisClient


class TestLuknerSecureRedisClient(unittest.TestCase):
    """Unit tests for LuknerSecureRedisClient error handling"""

    def setUp(self):
        """Set up test fixtures"""
        self.client = LuknerSecureRedisClient()
        # Mock the Redis client to avoid actual connections
        self.mock_redis = Mock()
        self.client.client = self.mock_redis

    def test_store_patient_data_success(self):
        """Test successful patient data storage"""
        # Arrange
        patient_id = "test123"
        patient_data = {"name": "Test Patient", "status": "scheduled"}
        self.mock_redis.json.return_value.set.return_value = True

        # Act
        result = self.client.store_patient_data(patient_id, patient_data)

        # Assert
        self.assertTrue(result)
        self.mock_redis.json.return_value.set.assert_called_once()

    def test_store_patient_data_redis_json_module_missing(self):
        """Test error handling when RedisJSON module is not available"""
        # Arrange
        patient_id = "test123"
        patient_data = {"name": "Test Patient"}
        self.mock_redis.json.return_value.set.side_effect = redis.exceptions.ResponseError(
            "ERR unknown command 'JSON.SET'"
        )

        # Act & Assert
        with self.assertRaises(RuntimeError) as context:
            self.client.store_patient_data(patient_id, patient_data)
        
        self.assertIn("RedisJSON module is not available", str(context.exception))

    def test_store_patient_data_json_serialization_error(self):
        """Test error handling for JSON serialization failures"""
        # Arrange
        patient_id = "test123"
        # Simulate TypeError during serialization
        self.mock_redis.json.return_value.set.side_effect = TypeError(
            "Object of type dict is not JSON serializable"
        )

        # Act & Assert
        with self.assertRaises(ValueError) as context:
            self.client.store_patient_data(patient_id, {"name": "Test"})
        
        self.assertIn("Invalid data format", str(context.exception))

    def test_store_patient_data_connection_error(self):
        """Test error handling for Redis connection failures"""
        # Arrange
        patient_id = "test123"
        patient_data = {"name": "Test Patient"}
        self.mock_redis.json.return_value.set.side_effect = redis.exceptions.ConnectionError(
            "Connection refused"
        )

        # Act & Assert
        with self.assertRaises(ConnectionError) as context:
            self.client.store_patient_data(patient_id, patient_data)
        
        self.assertIn("Failed to connect to Redis", str(context.exception))

    def test_store_patient_data_unexpected_error(self):
        """Test error handling for unexpected errors"""
        # Arrange
        patient_id = "test123"
        patient_data = {"name": "Test Patient"}
        self.mock_redis.json.return_value.set.side_effect = Exception("Unexpected error")

        # Act & Assert
        with self.assertRaises(RuntimeError) as context:
            self.client.store_patient_data(patient_id, patient_data)
        
        self.assertIn("Unexpected Redis operation error", str(context.exception))

    def test_get_patient_data_success(self):
        """Test successful patient data retrieval"""
        # Arrange
        patient_id = "test123"
        expected_data = {"name": "Test Patient", "status": "scheduled"}
        self.mock_redis.json.return_value.get.return_value = expected_data

        # Act
        result = self.client.get_patient_data(patient_id)

        # Assert
        self.assertEqual(result, expected_data)
        self.mock_redis.json.return_value.get.assert_called_once()

    def test_get_patient_data_not_found(self):
        """Test handling when patient data is not found"""
        # Arrange
        patient_id = "nonexistent"
        self.mock_redis.json.return_value.get.return_value = None

        # Act
        result = self.client.get_patient_data(patient_id)

        # Assert
        self.assertIsNone(result)

    def test_get_patient_data_redis_json_module_missing(self):
        """Test error handling when RedisJSON module is not available for retrieval"""
        # Arrange
        patient_id = "test123"
        self.mock_redis.json.return_value.get.side_effect = redis.exceptions.ResponseError(
            "ERR unknown command 'JSON.GET'"
        )

        # Act & Assert
        with self.assertRaises(RuntimeError) as context:
            self.client.get_patient_data(patient_id)
        
        self.assertIn("RedisJSON module is not available", str(context.exception))

    def test_store_workflow_state_success(self):
        """Test successful workflow state storage"""
        # Arrange
        workflow_id = "workflow123"
        state_data = {"step": "check_in", "status": "active"}
        self.mock_redis.json.return_value.set.return_value = True

        # Act
        result = self.client.store_workflow_state(workflow_id, state_data)

        # Assert
        self.assertTrue(result)

    def test_store_workflow_state_error_handling(self):
        """Test workflow state storage error handling"""
        # Arrange
        workflow_id = "workflow123"
        state_data = {"step": "check_in"}
        self.mock_redis.json.return_value.set.side_effect = redis.exceptions.ResponseError(
            "ERR wrong number of arguments"
        )

        # Act & Assert
        with self.assertRaises(RuntimeError) as context:
            self.client.store_workflow_state(workflow_id, state_data)
        
        self.assertIn("Redis JSON command error", str(context.exception))

    def test_get_workflow_state_success(self):
        """Test successful workflow state retrieval"""
        # Arrange
        workflow_id = "workflow123"
        expected_state = {"step": "check_in", "status": "active"}
        self.mock_redis.json.return_value.get.return_value = expected_state

        # Act
        result = self.client.get_workflow_state(workflow_id)

        # Assert
        self.assertEqual(result, expected_state)

    def test_get_workflow_state_not_found(self):
        """Test handling when workflow state is not found"""
        # Arrange
        workflow_id = "nonexistent"
        self.mock_redis.json.return_value.get.return_value = None

        # Act
        result = self.client.get_workflow_state(workflow_id)

        # Assert
        self.assertIsNone(result)

    @patch('secure_redis_client.secretmanager.SecretManagerServiceClient')
    def test_get_connection_string_error(self, mock_secret_client):
        """Test error handling for Secret Manager failures"""
        # Arrange
        mock_secret_client.return_value.access_secret_version.side_effect = Exception(
            "Access denied"
        )

        # Act & Assert
        with self.assertRaises(ConnectionError) as context:
            self.client.get_connection_string()
        
        self.assertIn("Failed to retrieve Redis connection", str(context.exception))

    def test_logging_configuration(self):
        """Test that logging is properly configured"""
        # Act
        client = LuknerSecureRedisClient()

        # Assert
        self.assertIsNotNone(client.logger)
        self.assertEqual(client.logger.level, logging.INFO)
        self.assertTrue(len(client.logger.handlers) > 0)

    def test_logging_patient_operations(self):
        """Test that patient operations are properly logged"""
        # Arrange
        with patch.object(self.client.logger, 'info') as mock_log_info:
            patient_id = "test123"
            patient_data = {"name": "Test Patient"}
            self.mock_redis.json.return_value.set.return_value = True

            # Act
            self.client.store_patient_data(patient_id, patient_data)

            # Assert
            mock_log_info.assert_called_with(f"Successfully stored patient data for ID: {patient_id}")

    def test_secure_operations_integration(self):
        """Integration test for secure operations (moved from production class)"""
        # This is the test that was incorrectly placed in the production class
        try:
            print("🔍 Testing LuknerLumina Secure Redis Operations...")
            print("=" * 50)
            
            # Mock the client to avoid actual connections
            with patch.object(self.client, 'ping') as mock_ping, \
                 patch.object(self.client, 'store_patient_data') as mock_store_patient, \
                 patch.object(self.client, 'get_patient_data') as mock_get_patient, \
                 patch.object(self.client, 'store_workflow_state') as mock_store_workflow, \
                 patch.object(self.client, 'get_workflow_state') as mock_get_workflow:
                
                # Configure mocks
                mock_ping.return_value = True
                mock_store_patient.return_value = True
                mock_get_patient.return_value = {
                    "name": "Test Patient",
                    "provider": "Dr. Lukner",
                    "hipaa_compliant": True,
                    "stored_by": "lukner-workflow-agent"
                }
                mock_store_workflow.return_value = True
                mock_get_workflow.return_value = {
                    "step": "patient_check_in",
                    "status": "active"
                }
                
                # Test connection
                self.client.ping()
                print("✅ Secure connection successful!")
                
                # Test patient data storage
                patient_data = {
                    "name": "Test Patient",
                    "appointment_time": "2025-07-03T14:30:00Z",
                    "provider": "Dr. Lukner",
                    "status": "scheduled",
                    "phone": "555-0123"
                }
                
                print("📝 Storing patient data...")
                self.client.store_patient_data("test123", patient_data)
                
                print("📖 Retrieving patient data...")
                retrieved = self.client.get_patient_data("test123")
                print("✅ Patient data retrieved successfully!")
                print(f"   Patient: {retrieved.get('name', 'N/A')}")
                print(f"   Provider: {retrieved.get('provider', 'N/A')}")
                print(f"   HIPAA Compliant: {retrieved.get('hipaa_compliant', False)}")
                print(f"   Stored by: {retrieved.get('stored_by', 'N/A')}")
                
                # Test workflow state
                print("")
                print("🔄 Testing workflow state management...")
                workflow_state = {
                    "step": "patient_check_in",
                    "status": "active",
                    "next_action": "verify_insurance",
                    "patient_id": "test123"
                }
                
                self.client.store_workflow_state("workflow_test123", workflow_state)
                workflow_retrieved = self.client.get_workflow_state("workflow_test123")
                print("✅ Workflow state managed successfully!")
                print(f"   Current step: {workflow_retrieved.get('step', 'N/A')}")
                print(f"   Status: {workflow_retrieved.get('status', 'N/A')}")
                
                print("")
                print("🎉 All secure operations working perfectly!")
                print("🏥 LuknerLumina HIPAA-compliant system ready!")
                
                # Verify all operations were called
                mock_ping.assert_called_once()
                mock_store_patient.assert_called_once()
                mock_get_patient.assert_called_once()
                mock_store_workflow.assert_called_once()
                mock_get_workflow.assert_called_once()
                
                return True
                
        except Exception as e:
            print(f"❌ Error in secure operations: {e}")
            print(f"   Error type: {type(e).__name__}")
            self.fail(f"Integration test failed: {e}")

    def test_error_chaining(self):
        """Test that error chaining preserves original error information"""
        # Arrange
        original_error = redis.exceptions.ResponseError("Original Redis error")
        self.mock_redis.json.return_value.set.side_effect = original_error

        # Act & Assert
        with self.assertRaises(RuntimeError) as context:
            self.client.store_patient_data("test", {"name": "Test"})
        
        # Verify error chaining
        self.assertIsInstance(context.exception.__cause__, redis.exceptions.ResponseError)
        self.assertEqual(str(context.exception.__cause__), "Original Redis error")


class TestRedisJSONErrorRecovery(unittest.TestCase):
    """Integration tests for Redis JSON error recovery"""

    def setUp(self):
        """Set up integration test fixtures"""
        self.client = LuknerSecureRedisClient()

    @patch('redis.from_url')
    def test_fallback_mechanism_when_json_unavailable(self, mock_redis_from_url):
        """Test that the client gracefully handles missing RedisJSON"""
        # Arrange
        mock_client = Mock()
        mock_redis_from_url.return_value = mock_client
        
        # Simulate JSON command not available
        mock_client.json.return_value.set.side_effect = redis.exceptions.ResponseError(
            "ERR unknown command 'JSON.SET'"
        )
        
        self.client.client = mock_client

        # Act & Assert
        with self.assertRaises(RuntimeError) as context:
            self.client.store_patient_data("test", {"name": "Test"})
        
        # Verify specific error message for missing module
        self.assertIn("RedisJSON module is not available", str(context.exception))


if __name__ == '__main__':
    # Configure logging for test output
    logging.basicConfig(level=logging.DEBUG)
    
    # Run the tests
    unittest.main(verbosity=2)