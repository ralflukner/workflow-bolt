#!/usr/bin/env python3

import unittest
from unittest.mock import Mock, patch, MagicMock
import redis
import pytest
import logging
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
        # Create data that will cause serialization issues (circular reference)
        circular_data = {}
        circular_data['self'] = circular_data
        
        self.mock_redis.json.return_value.set.side_effect = TypeError(
            "Object of type dict is not JSON serializable"
        )

        # Act & Assert
        with self.assertRaises(ValueError) as context:
            self.client.store_patient_data(patient_id, circular_data)
        
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

    def test_logging_workflow_operations(self):
        """Test that workflow operations are properly logged"""
        # Arrange
        with patch.object(self.client.logger, 'info') as mock_log_info:
            workflow_id = "workflow123"
            state_data = {"step": "check_in"}
            self.mock_redis.json.return_value.set.return_value = True

            # Act
            self.client.store_workflow_state(workflow_id, state_data)

            # Assert
            mock_log_info.assert_called_with(f"Successfully stored workflow state for ID: {workflow_id}")

    def test_logging_errors(self):
        """Test that errors are properly logged"""
        # Arrange
        with patch.object(self.client.logger, 'error') as mock_log_error:
            patient_id = "test123"
            patient_data = {"name": "Test Patient"}
            error_msg = "Connection refused"
            self.mock_redis.json.return_value.set.side_effect = redis.exceptions.ConnectionError(error_msg)

            # Act & Assert
            with self.assertRaises(ConnectionError):
                self.client.store_patient_data(patient_id, patient_data)

            # Assert logging
            mock_log_error.assert_called()
            logged_message = mock_log_error.call_args[0][0]
            self.assertIn(f"Redis connection error while storing patient {patient_id}", logged_message)


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

    def test_error_chaining(self):
        """Test that error chaining preserves original error information"""
        # Arrange
        self.client.client = Mock()
        original_error = redis.exceptions.ResponseError("Original Redis error")
        self.client.client.json.return_value.set.side_effect = original_error

        # Act & Assert
        with self.assertRaises(RuntimeError) as context:
            self.client.store_patient_data("test", {"name": "Test"})
        
        # Verify error chaining
        self.assertIsInstance(context.exception.__cause__, redis.exceptions.ResponseError)
        self.assertEqual(str(context.exception.__cause__), "Original Redis error")


if __name__ == '__main__':
    # Configure logging for test output
    logging.basicConfig(level=logging.DEBUG)
    
    # Run the tests
    unittest.main(verbosity=2)