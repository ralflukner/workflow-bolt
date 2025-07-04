import sys
import os
import pytest
import json
from datetime import datetime

# Add function directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), f'../../functions/patient_sync'))

from main import patient_sync, _validate_sync_payload, _process_sync_operation

class MockRequest:
    def __init__(self, json_data=None, args=None, method='POST'):
        self._json = json_data
        self.args = args or {}
        self.method = method
        self.path = '/test'
    
    def get_json(self, silent=False):
        return self._json

def test_patient_sync_valid_payload():
    """Test successful patient sync with valid payload"""
    valid_payload = {
        "operation": "sync_patient",
        "patient_id": "patient_123",
        "data": {
            "patient_info": {
                "demographics": {"name": "John Doe", "age": 45},
                "insurance": {"provider": "Blue Cross", "policy": "12345"},
                "emergency_contact": {"name": "Jane Doe", "phone": "555-0123"}
            }
        },
        "sync_options": {
            "bidirectional": True,
            "conflict_resolution": "source_wins",
            "validate_data": True
        }
    }
    
    request = MockRequest(json_data=valid_payload)
    response, status = patient_sync(request)
    
    assert status == 200
    assert response["status"] == "success"
    assert response["message"] == "Patient data synchronized successfully"
    assert response["operation"] == "sync_patient"
    assert response["patient_id"] == "patient_123"
    assert "sync_result" in response
    assert response["sync_result"]["records_synced"] > 0

def test_patient_sync_appointments():
    """Test appointment synchronization"""
    payload = {
        "operation": "sync_appointments",
        "patient_id": "patient_456",
        "data": {
            "appointments": [
                {"id": "appt_1", "status": "new", "date": "2025-07-05"},
                {"id": "appt_2", "status": "updated", "date": "2025-07-06"},
                {"id": "appt_3", "status": "cancelled", "date": "2025-07-07"}
            ]
        }
    }
    
    request = MockRequest(json_data=payload)
    response, status = patient_sync(request)
    
    assert status == 200
    assert response["status"] == "success"
    assert response["sync_result"]["records_synced"] == 3
    assert response["sync_result"]["sync_details"]["appointments_processed"] == 3

def test_patient_sync_status_update():
    """Test patient status synchronization"""
    payload = {
        "operation": "sync_status",
        "patient_id": "patient_789",
        "data": {
            "status": "in_progress",
            "previous_status": "waiting"
        }
    }
    
    request = MockRequest(json_data=payload)
    response, status = patient_sync(request)
    
    assert status == 200
    assert response["status"] == "success"
    assert response["sync_result"]["records_synced"] == 1
    assert response["sync_result"]["sync_details"]["status_changed"] is True

def test_patient_sync_bulk_operation():
    """Test bulk patient synchronization"""
    payload = {
        "operation": "bulk_sync",
        "patient_id": "bulk_operation",
        "data": {
            "patients": [
                {"id": "patient_1", "data": {}},
                {"id": "patient_2", "data": {}},
                {"id": "patient_3", "data": {}}
            ]
        },
        "sync_options": {
            "batch_size": 10
        }
    }
    
    request = MockRequest(json_data=payload)
    response, status = patient_sync(request)
    
    assert status == 200
    assert response["status"] == "success"
    assert response["sync_result"]["records_synced"] == 3
    assert response["sync_result"]["sync_details"]["total_patients"] == 3

def test_patient_sync_missing_required_fields():
    """Test validation error for missing required fields"""
    invalid_payload = {
        "operation": "sync_patient"
        # Missing 'patient_id'
    }
    
    request = MockRequest(json_data=invalid_payload)
    response, status = patient_sync(request)
    
    assert status == 400
    assert response["status"] == "error"
    assert response["message"] == "Invalid sync payload format"
    assert "Missing required field: patient_id" in response["validation_errors"]

def test_patient_sync_invalid_operation():
    """Test validation error for invalid operation"""
    invalid_payload = {
        "operation": "invalid_operation",
        "patient_id": "patient_123"
    }
    
    request = MockRequest(json_data=invalid_payload)
    response, status = patient_sync(request)
    
    assert status == 400
    assert response["status"] == "error"
    assert "Invalid operation" in response["validation_errors"][0]

def test_patient_sync_no_json_payload():
    """Test error when no JSON payload is provided"""
    request = MockRequest(json_data=None)
    response, status = patient_sync(request)
    
    assert status == 400
    assert response["status"] == "error"
    assert response["message"] == "JSON payload is required"
    assert "example" in response

def test_patient_sync_invalid_method():
    """Test error for invalid HTTP method"""
    valid_payload = {
        "operation": "sync_patient",
        "patient_id": "patient_123"
    }
    
    request = MockRequest(json_data=valid_payload, method='GET')
    response, status = patient_sync(request)
    
    assert status == 405
    assert response["status"] == "error"
    assert response["message"] == "Only POST, PUT, and PATCH methods are supported"
    assert response["accepted_methods"] == ["POST", "PUT", "PATCH"]

def test_validate_sync_payload_valid():
    """Test payload validation with valid data"""
    valid_payload = {
        "operation": "sync_patient",
        "patient_id": "patient_123",
        "data": {"patient_info": {}},
        "sync_options": {"bidirectional": True}
    }
    
    result = _validate_sync_payload(valid_payload)
    assert result["valid"] is True
    assert len(result["errors"]) == 0

def test_validate_sync_payload_invalid_patient_id():
    """Test payload validation with invalid patient_id"""
    invalid_payload = {
        "operation": "sync_patient",
        "patient_id": "ab",  # Too short
        "data": {}
    }
    
    result = _validate_sync_payload(invalid_payload)
    assert result["valid"] is False
    assert "patient_id must be a string with at least 3 characters" in result["errors"]

def test_validate_sync_payload_invalid_structures():
    """Test payload validation with invalid data structures"""
    invalid_payload = {
        "operation": "sync_patient",
        "patient_id": "patient_123",
        "data": "should_be_object",  # Invalid: should be dict
        "sync_options": ["should", "be", "object"]  # Invalid: should be dict
    }
    
    result = _validate_sync_payload(invalid_payload)
    assert result["valid"] is False
    assert "Field 'data' must be an object" in result["errors"]
    assert "Field 'sync_options' must be an object" in result["errors"]

def test_process_sync_operation_performance():
    """Test sync operation processing performance"""
    payload = {
        "operation": "sync_patient",
        "patient_id": "patient_123",
        "data": {"patient_info": {"demographics": {"name": "Test"}}},
        "sync_options": {}
    }
    
    result = _process_sync_operation(payload)
    assert result["status"] == "completed"
    assert "duration_ms" in result
    assert result["duration_ms"] >= 0
    assert result["records_synced"] > 0

def test_all_sync_operations():
    """Test all supported sync operations"""
    operations = ["sync_patient", "sync_appointments", "sync_status", "bulk_sync"]
    
    for operation in operations:
        payload = {
            "operation": operation,
            "patient_id": "patient_test",
            "data": {
                "patient_info": {"demographics": {}},
                "appointments": [{"id": "test"}],
                "status": "waiting",
                "patients": [{"id": "test1"}]
            }
        }
        
        request = MockRequest(json_data=payload)
        response, status = patient_sync(request)
        
        assert status == 200
        assert response["status"] == "success"
        assert response["operation"] == operation
