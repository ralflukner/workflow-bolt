#!/usr/bin/env python3

"""
Test configuration and utilities for Redis error handling tests
"""

import os
import sys
import logging
from typing import Dict, Any, Optional


class RedisTestConfig:
    """Configuration for Redis error handling tests"""
    
    # Test environment settings
    TEST_REDIS_URL = "redis://localhost:6379/15"  # Use DB 15 for testing
    TEST_TIMEOUT = 30  # seconds
    LOG_LEVEL = logging.DEBUG
    
    # Mock settings for error simulation
    MOCK_ERRORS = {
        'redis_json_missing': "ERR unknown command 'JSON.SET'",
        'connection_refused': "Connection refused",
        'authentication_failed': "NOAUTH Authentication required",
        'serialization_error': "Object of type dict is not JSON serializable",
        'memory_error': "OOM command not allowed when used memory > 'maxmemory'",
    }
    
    # Test data templates
    TEST_PATIENT_DATA = {
        "name": "Test Patient",
        "appointment_time": "2025-07-03T14:30:00Z",
        "provider": "Dr. Test",
        "status": "scheduled",
        "phone": "555-0123",
        "mrn": "TEST123456"
    }
    
    TEST_WORKFLOW_DATA = {
        "step": "patient_check_in",
        "status": "active",
        "next_action": "verify_insurance",
        "patient_id": "test123",
        "priority": "normal"
    }
    
    @classmethod
    def setup_test_logging(cls) -> logging.Logger:
        """Setup logging for tests"""
        logger = logging.getLogger('redis_tests')
        logger.setLevel(cls.LOG_LEVEL)
        
        if not logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    @classmethod
    def get_test_data(cls, data_type: str, **overrides) -> Dict[str, Any]:
        """Get test data with optional overrides"""
        if data_type == 'patient':
            data = cls.TEST_PATIENT_DATA.copy()
        elif data_type == 'workflow':
            data = cls.TEST_WORKFLOW_DATA.copy()
        else:
            raise ValueError(f"Unknown test data type: {data_type}")
        
        data.update(overrides)
        return data
    
    @classmethod
    def get_mock_error(cls, error_type: str) -> str:
        """Get mock error message for testing"""
        if error_type not in cls.MOCK_ERRORS:
            raise ValueError(f"Unknown error type: {error_type}")
        return cls.MOCK_ERRORS[error_type]


def create_circular_reference_data() -> Dict[str, Any]:
    """Create data with circular reference for serialization error testing"""
    data = {"name": "Test Patient"}
    data['self'] = data  # Circular reference
    return data


def simulate_large_data() -> Dict[str, Any]:
    """Create large data structure for memory/performance testing"""
    return {
        "name": "Test Patient",
        "large_field": "x" * 10000,  # 10KB string
        "repeated_data": ["test"] * 1000,  # Large list
        "nested_data": {
            f"key_{i}": f"value_{i}" 
            for i in range(1000)
        }
    }


class TestErrorSimulator:
    """Utility class for simulating various Redis errors"""
    
    @staticmethod
    def create_redis_json_missing_error():
        """Create error for missing RedisJSON module"""
        import redis
        return redis.exceptions.ResponseError(
            RedisTestConfig.get_mock_error('redis_json_missing')
        )
    
    @staticmethod
    def create_connection_error():
        """Create Redis connection error"""
        import redis
        return redis.exceptions.ConnectionError(
            RedisTestConfig.get_mock_error('connection_refused')
        )
    
    @staticmethod
    def create_authentication_error():
        """Create Redis authentication error"""
        import redis
        return redis.exceptions.AuthenticationError(
            RedisTestConfig.get_mock_error('authentication_failed')
        )
    
    @staticmethod
    def create_serialization_error():
        """Create JSON serialization error"""
        return TypeError(
            RedisTestConfig.get_mock_error('serialization_error')
        )
    
    @staticmethod
    def create_memory_error():
        """Create Redis memory error"""
        import redis
        return redis.exceptions.ResponseError(
            RedisTestConfig.get_mock_error('memory_error')
        )


if __name__ == "__main__":
    # Test the configuration
    logger = RedisTestConfig.setup_test_logging()
    logger.info("Redis test configuration loaded successfully")
    
    # Test data generation
    patient_data = RedisTestConfig.get_test_data('patient', name="Custom Patient")
    logger.info(f"Generated patient data: {patient_data}")
    
    # Test error simulation
    try:
        raise TestErrorSimulator.create_connection_error()
    except Exception as e:
        logger.info(f"Successfully simulated error: {type(e).__name__}: {e}")
    
    logger.info("Test configuration validation complete")