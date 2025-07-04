import functions_framework
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

# Configure structured logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@functions_framework.http
def patient_sync(request):
    """
    Patient Data Synchronization Function - Handles patient data sync between systems.
    
    Supports multiple sync operations:
    - sync_patient: Synchronize single patient data
    - sync_appointments: Synchronize patient appointments
    - sync_status: Update patient status across systems
    - bulk_sync: Batch synchronization of multiple patients
    
    Expected payload format:
    {
        "operation": "sync_patient|sync_appointments|sync_status|bulk_sync",
        "patient_id": "patient_123",
        "data": {
            "patient_info": {...},
            "appointments": [...],
            "status": "arrived|waiting|in_progress|completed"
        },
        "sync_options": {
            "bidirectional": true,
            "conflict_resolution": "source_wins|target_wins|manual",
            "validate_data": true
        }
    }
    
    Args:
        request: Flask Request object
    Returns:
        Tuple of (response_dict, status_code)
    """
    try:
        # Parse request
        request_json = request.get_json(silent=True)
        request_args = request.args
        
        # Validate request method
        if request.method not in ['POST', 'PUT', 'PATCH']:
            return {
                "status": "error",
                "message": "Only POST, PUT, and PATCH methods are supported",
                "accepted_methods": ["POST", "PUT", "PATCH"]
            }, 405
        
        # Validate payload exists
        if not request_json:
            return {
                "status": "error",
                "message": "JSON payload is required",
                "example": {
                    "operation": "sync_patient",
                    "patient_id": "patient_123",
                    "data": {"patient_info": {}}
                }
            }, 400
        
        # Validate and parse sync operation
        validation_result = _validate_sync_payload(request_json)
        if not validation_result["valid"]:
            return {
                "status": "error",
                "message": "Invalid sync payload format",
                "validation_errors": validation_result["errors"]
            }, 400
        
        # Log incoming sync request
        logger.info("Patient sync request received", extra={
            "operation": request_json.get("operation"),
            "patient_id": request_json.get("patient_id"),
            "sync_options": request_json.get("sync_options", {}),
            "request_method": request.method,
            "sync_timestamp": datetime.utcnow().isoformat()
        })
        
        # Process the sync operation
        sync_result = _process_sync_operation(request_json)
        
        # Handle sync conflicts if any
        if sync_result.get("conflicts"):
            conflict_resolution = _resolve_sync_conflicts(sync_result["conflicts"], request_json.get("sync_options", {}))
            sync_result["conflict_resolution"] = conflict_resolution
        
        # Log sync completion
        logger.info("Patient sync completed", extra={
            "operation": request_json.get("operation"),
            "patient_id": request_json.get("patient_id"),
            "sync_status": sync_result["status"],
            "records_synced": sync_result.get("records_synced", 0),
            "sync_duration_ms": sync_result.get("duration_ms", 0),
            "completed_at": datetime.utcnow().isoformat()
        })
        
        # Return success response
        response = {
            "status": "success",
            "message": "Patient data synchronized successfully",
            "sync_result": sync_result,
            "processed_at": datetime.utcnow().isoformat(),
            "operation": request_json.get("operation"),
            "patient_id": request_json.get("patient_id")
        }
        
        return response, 200
        
    except Exception as e:
        logger.error(f"Error processing patient sync: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "message": f"Patient sync failed: {str(e)}",
            "error_type": type(e).__name__,
            "timestamp": datetime.utcnow().isoformat()
        }, 500

def _validate_sync_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Validate the incoming sync payload format."""
    errors = []
    
    # Required fields
    required_fields = ["operation", "patient_id"]
    for field in required_fields:
        if field not in payload:
            errors.append(f"Missing required field: {field}")
    
    # Validate operation
    valid_operations = ["sync_patient", "sync_appointments", "sync_status", "bulk_sync"]
    if "operation" in payload and payload["operation"] not in valid_operations:
        errors.append(f"Invalid operation. Must be one of: {valid_operations}")
    
    # Validate patient_id format
    if "patient_id" in payload:
        patient_id = payload["patient_id"]
        if not isinstance(patient_id, str) or len(patient_id) < 3:
            errors.append("patient_id must be a string with at least 3 characters")
    
    # Validate data structure if present
    if "data" in payload and not isinstance(payload["data"], dict):
        errors.append("Field 'data' must be an object")
    
    # Validate sync_options if present
    if "sync_options" in payload and not isinstance(payload["sync_options"], dict):
        errors.append("Field 'sync_options' must be an object")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def _process_sync_operation(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Process the sync operation and return results."""
    start_time = datetime.utcnow()
    operation = payload.get("operation")
    patient_id = payload.get("patient_id")
    data = payload.get("data", {})
    sync_options = payload.get("sync_options", {})
    
    # Initialize result
    result = {
        "status": "processing",
        "operation": operation,
        "patient_id": patient_id,
        "records_synced": 0,
        "conflicts": [],
        "sync_details": {}
    }
    
    try:
        # Process based on operation type
        if operation == "sync_patient":
            result.update(_sync_patient_data(patient_id, data, sync_options))
        elif operation == "sync_appointments":
            result.update(_sync_appointment_data(patient_id, data, sync_options))
        elif operation == "sync_status":
            result.update(_sync_patient_status(patient_id, data, sync_options))
        elif operation == "bulk_sync":
            result.update(_bulk_sync_patients(data, sync_options))
        else:
            result["status"] = "error"
            result["error"] = f"Unknown operation: {operation}"
            
        # Calculate processing time
        end_time = datetime.utcnow()
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        result["duration_ms"] = duration_ms
        
        # Set final status if not already set
        if result["status"] == "processing":
            result["status"] = "completed"
            
    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)
        result["error_type"] = type(e).__name__
    
    return result

def _sync_patient_data(patient_id: str, data: Dict[str, Any], options: Dict[str, Any]) -> Dict[str, Any]:
    """Synchronize patient demographic and clinical data."""
    # Placeholder for actual patient data sync logic
    # This would typically involve:
    # 1. Fetching current patient data from multiple sources
    # 2. Comparing and identifying differences
    # 3. Applying conflict resolution rules
    # 4. Updating patient records across systems
    
    patient_info = data.get("patient_info", {})
    
    # Simulate sync processing
    sync_details = {
        "demographics_updated": bool(patient_info.get("demographics")),
        "insurance_updated": bool(patient_info.get("insurance")),
        "emergency_contact_updated": bool(patient_info.get("emergency_contact")),
        "medical_history_updated": bool(patient_info.get("medical_history"))
    }
    
    records_synced = sum(1 for updated in sync_details.values() if updated)
    
    return {
        "records_synced": records_synced,
        "sync_details": sync_details,
        "patient_data_hash": _generate_data_hash(patient_info)
    }

def _sync_appointment_data(patient_id: str, data: Dict[str, Any], options: Dict[str, Any]) -> Dict[str, Any]:
    """Synchronize patient appointment data."""
    appointments = data.get("appointments", [])
    
    # Simulate appointment sync
    sync_details = {
        "appointments_processed": len(appointments),
        "new_appointments": len([a for a in appointments if a.get("status") == "new"]),
        "updated_appointments": len([a for a in appointments if a.get("status") == "updated"]),
        "cancelled_appointments": len([a for a in appointments if a.get("status") == "cancelled"])
    }
    
    return {
        "records_synced": sync_details["appointments_processed"],
        "sync_details": sync_details,
        "appointment_count": len(appointments)
    }

def _sync_patient_status(patient_id: str, data: Dict[str, Any], options: Dict[str, Any]) -> Dict[str, Any]:
    """Synchronize patient status across systems."""
    status = data.get("status")
    previous_status = data.get("previous_status")
    
    # Simulate status sync
    sync_details = {
        "status_changed": status != previous_status,
        "current_status": status,
        "previous_status": previous_status,
        "status_timestamp": datetime.utcnow().isoformat()
    }
    
    return {
        "records_synced": 1 if sync_details["status_changed"] else 0,
        "sync_details": sync_details
    }

def _bulk_sync_patients(data: Dict[str, Any], options: Dict[str, Any]) -> Dict[str, Any]:
    """Perform bulk synchronization of multiple patients."""
    patient_list = data.get("patients", [])
    
    # Simulate bulk sync
    sync_details = {
        "total_patients": len(patient_list),
        "processed_patients": len(patient_list),
        "successful_syncs": len(patient_list),
        "failed_syncs": 0,
        "batch_size": options.get("batch_size", 50)
    }
    
    return {
        "records_synced": sync_details["successful_syncs"],
        "sync_details": sync_details
    }

def _resolve_sync_conflicts(conflicts: List[Dict[str, Any]], options: Dict[str, Any]) -> Dict[str, Any]:
    """Resolve synchronization conflicts based on configured strategy."""
    resolution_strategy = options.get("conflict_resolution", "source_wins")
    
    resolved_conflicts = []
    for conflict in conflicts:
        resolution = {
            "field": conflict.get("field"),
            "strategy": resolution_strategy,
            "source_value": conflict.get("source_value"),
            "target_value": conflict.get("target_value"),
            "resolved_value": conflict.get("source_value") if resolution_strategy == "source_wins" else conflict.get("target_value"),
            "resolved_at": datetime.utcnow().isoformat()
        }
        resolved_conflicts.append(resolution)
    
    return {
        "strategy": resolution_strategy,
        "conflicts_resolved": len(resolved_conflicts),
        "resolutions": resolved_conflicts
    }

def _generate_data_hash(data: Dict[str, Any]) -> str:
    """Generate a hash for data integrity verification."""
    # Simple hash generation for demo purposes
    data_str = json.dumps(data, sort_keys=True)
    return f"hash_{len(data_str)}_{hash(data_str) & 0xFFFFFFFF:08x}"
