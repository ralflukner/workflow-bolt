import sys
import os
import pytest
import json
from datetime import datetime

# Add function directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), f'../../functions/tebra_debug'))

from main import tebra_debug, _validate_debug_payload, _process_debug_data

class MockRequest:
    def __init__(self, json_data=None, args=None, method='POST'):
        self._json = json_data
        self.args = args or {}
        self.method = method
        self.path = '/test'
    
    def get_json(self, silent=False):
        return self._json

def test_tebra_debug_valid_payload():
    """Test successful processing of valid Tebra debug data"""
    valid_payload = {
        "source": "tebra_api",
        "level": "info",
        "message": "Patient data retrieved successfully",
        "timestamp": "2024-07-04T15:30:00Z",
        "data": {
            "operation": "get_patient",
            "duration_ms": 850,
            "status_code": 200,
            "request_id": "req_12345"
        },
        "metrics": {
            "memory_usage_mb": 45.2,
            "cpu_usage_percent": 12.5
        }
    }
    
    request = MockRequest(json_data=valid_payload)
    response, status = tebra_debug(request)
    
    assert status == 200
    assert response["status"] == "success"
    assert response["message"] == "Debug data processed successfully"
    assert response["data_summary"]["source"] == "tebra_api"
    assert response["data_summary"]["level"] == "info"
    assert response["data_summary"]["records_processed"] == 1
    assert response["request_id"] == "req_12345"

def test_tebra_debug_missing_required_fields():
    """Test validation error for missing required fields"""
    invalid_payload = {
        "level": "info"
        # Missing 'source' and 'message'
    }
    
    request = MockRequest(json_data=invalid_payload)
    response, status = tebra_debug(request)
    
    assert status == 400
    assert response["status"] == "error"
    assert response["message"] == "Invalid payload format"
    assert "Missing required field: source" in response["validation_errors"]
    assert "Missing required field: message" in response["validation_errors"]

def test_tebra_debug_invalid_source():
    """Test validation error for invalid source"""
    invalid_payload = {
        "source": "invalid_source",
        "level": "info",
        "message": "Test message"
    }
    
    request = MockRequest(json_data=invalid_payload)
    response, status = tebra_debug(request)
    
    assert status == 400
    assert response["status"] == "error"
    assert "Invalid source" in response["validation_errors"][0]

def test_tebra_debug_invalid_level():
    """Test validation error for invalid level"""
    invalid_payload = {
        "source": "tebra_api",
        "level": "invalid_level",
        "message": "Test message"
    }
    
    request = MockRequest(json_data=invalid_payload)
    response, status = tebra_debug(request)
    
    assert status == 400
    assert response["status"] == "error"
    assert "Invalid level" in response["validation_errors"][0]

def test_tebra_debug_no_json_payload():
    """Test error when no JSON payload is provided"""
    request = MockRequest(json_data=None)
    response, status = tebra_debug(request)
    
    assert status == 400
    assert response["status"] == "error"
    assert response["message"] == "JSON payload is required"
    assert "example" in response

def test_tebra_debug_invalid_method():
    """Test error for invalid HTTP method"""
    valid_payload = {
        "source": "tebra_api",
        "level": "info",
        "message": "Test message"
    }
    
    request = MockRequest(json_data=valid_payload, method='GET')
    response, status = tebra_debug(request)
    
    assert status == 405
    assert response["status"] == "error"
    assert response["message"] == "Only POST and PUT methods are supported"
    assert response["accepted_methods"] == ["POST", "PUT"]

def test_validate_debug_payload_valid():
    """Test payload validation with valid data"""
    valid_payload = {
        "source": "tebra_sync",
        "level": "warn",
        "message": "Sync delay detected",
        "data": {"operation": "sync_appointments"},
        "metrics": {"cpu_usage_percent": 85.0}
    }
    
    result = _validate_debug_payload(valid_payload)
    assert result["valid"] is True
    assert len(result["errors"]) == 0

def test_validate_debug_payload_invalid_structures():
    """Test payload validation with invalid data structures"""
    invalid_payload = {
        "source": "tebra_api",
        "level": "info",
        "message": "Test",
        "data": "should_be_object",  # Invalid: should be dict
        "metrics": ["should", "be", "object"]  # Invalid: should be dict
    }
    
    result = _validate_debug_payload(invalid_payload)
    assert result["valid"] is False
    assert "Field 'data' must be an object" in result["errors"]
    assert "Field 'metrics' must be an object" in result["errors"]

def test_process_debug_data_performance_rating():
    """Test performance rating classification"""
    test_cases = [
        (400, "excellent"),
        (1500, "good"), 
        (3000, "slow"),
        (6000, "critical")
    ]
    
    for duration, expected_rating in test_cases:
        payload = {
            "source": "tebra_api",
            "level": "info",
            "message": "Test",
            "data": {"duration_ms": duration}
        }
        
        processed = _process_debug_data(payload)
        assert processed["performance_rating"] == expected_rating

def test_process_debug_data_level_priority():
    """Test debug level priority assignment"""
    test_cases = [
        ("debug", 1),
        ("info", 2),
        ("warn", 3), 
        ("error", 4),
        ("critical", 5)
    ]
    
    for level, expected_priority in test_cases:
        payload = {
            "source": "tebra_api",
            "level": level,
            "message": "Test"
        }
        
        processed = _process_debug_data(payload)
        assert processed["level_priority"] == expected_priority

def test_process_debug_data_timestamp_validation():
    """Test timestamp validation"""
    # Valid ISO timestamp
    valid_payload = {
        "source": "tebra_api",
        "level": "info", 
        "message": "Test",
        "timestamp": "2024-07-04T15:30:00Z"
    }
    
    processed = _process_debug_data(valid_payload)
    assert processed["timestamp_valid"] is True
    
    # Invalid timestamp
    invalid_payload = {
        "source": "tebra_api",
        "level": "info",
        "message": "Test", 
        "timestamp": "invalid-timestamp"
    }
    
    processed = _process_debug_data(invalid_payload)
    assert processed["timestamp_valid"] is False
    assert "timestamp_error" in processed

def test_multiple_tebra_sources():
    """Test all valid Tebra sources"""
    valid_sources = ["tebra_api", "tebra_sync", "tebra_auth", "tebra_proxy", "tebra_dashboard"]
    
    for source in valid_sources:
        payload = {
            "source": source,
            "level": "info",
            "message": f"Test message from {source}"
        }
        
        request = MockRequest(json_data=payload)
        response, status = tebra_debug(request)
        
        assert status == 200
        assert response["status"] == "success"
        assert response["data_summary"]["source"] == source