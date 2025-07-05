import functions_framework
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

# Configure structured logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@functions_framework.http
def tebra_debug(request):
    """
    Tebra Debug Data Handler - Accepts and processes debug logs/metrics from Tebra systems.
    
    Expected payload format:
    {
        "source": "tebra_api|tebra_sync|tebra_auth",
        "level": "info|warn|error|debug",
        "timestamp": "2024-07-04T15:30:00Z",
        "message": "Description of the event",
        "data": {
            "operation": "sync_appointments|get_patient|auth_token",
            "duration_ms": 1250,
            "status_code": 200,
            "error_details": null,
            "request_id": "req_12345"
        },
        "metrics": {
            "memory_usage_mb": 45.2,
            "cpu_usage_percent": 12.5,
            "active_connections": 3
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
        if request.method not in ['POST', 'PUT']:
            return {
                "status": "error", 
                "message": "Only POST and PUT methods are supported",
                "accepted_methods": ["POST", "PUT"]
            }, 405
        
        # Validate payload exists
        if not request_json:
            return {
                "status": "error",
                "message": "JSON payload is required",
                "example": {
                    "source": "tebra_api",
                    "level": "info",
                    "message": "Operation completed successfully"
                }
            }, 400
        
        # Validate and parse debug data
        validation_result = _validate_debug_payload(request_json)
        if not validation_result["valid"]:
            return {
                "status": "error",
                "message": "Invalid payload format",
                "validation_errors": validation_result["errors"]
            }, 400
        
        # Process the debug data
        processed_data = _process_debug_data(request_json)
        
        # Log the debug data with structured format
        logger.info("Tebra debug data received", extra={
            "tebra_source": request_json.get("source"),
            "tebra_level": request_json.get("level"),
            "tebra_operation": request_json.get("data", {}).get("operation"),
            "tebra_duration_ms": request_json.get("data", {}).get("duration_ms"),
            "tebra_status_code": request_json.get("data", {}).get("status_code"),
            "tebra_request_id": request_json.get("data", {}).get("request_id"),
            "processed_at": datetime.utcnow().isoformat()
        })
        
        # Store or forward data (placeholder for future integration)
        storage_result = _store_debug_data(processed_data)
        
        # Return success response
        response = {
            "status": "success",
            "message": "Debug data processed successfully",
            "processed_at": datetime.utcnow().isoformat(),
            "data_summary": {
                "source": request_json.get("source"),
                "level": request_json.get("level"),
                "records_processed": 1,
                "storage_status": storage_result["status"]
            },
            "request_id": request_json.get("data", {}).get("request_id")
        }
        
        return response, 200
        
    except Exception as e:
        logger.error(f"Error processing Tebra debug data: {str(e)}", exc_info=True)
        return {
            "status": "error", 
            "message": f"Internal processing error: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }, 500

def _validate_debug_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Validate the incoming debug payload format."""
    errors = []
    
    # Required fields
    required_fields = ["source", "level", "message"]
    for field in required_fields:
        if field not in payload:
            errors.append(f"Missing required field: {field}")
    
    # Validate source
    valid_sources = ["tebra_api", "tebra_sync", "tebra_auth", "tebra_proxy", "tebra_dashboard"]
    if "source" in payload and payload["source"] not in valid_sources:
        errors.append(f"Invalid source. Must be one of: {valid_sources}")
    
    # Validate level
    valid_levels = ["debug", "info", "warn", "error", "critical"]
    if "level" in payload and payload["level"] not in valid_levels:
        errors.append(f"Invalid level. Must be one of: {valid_levels}")
    
    # Validate data structure if present
    if "data" in payload and not isinstance(payload["data"], dict):
        errors.append("Field 'data' must be an object")
    
    # Validate metrics structure if present
    if "metrics" in payload and not isinstance(payload["metrics"], dict):
        errors.append("Field 'metrics' must be an object")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def _process_debug_data(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Process and enrich the debug data."""
    processed = payload.copy()
    
    # Add processing metadata
    processed["processed_at"] = datetime.utcnow().isoformat()
    processed["processor"] = "tebra_debug_function"
    processed["processor_version"] = "1.0.0"
    
    # Parse and validate timestamp if provided
    if "timestamp" in payload:
        try:
            # Validate ISO format
            datetime.fromisoformat(payload["timestamp"].replace('Z', '+00:00'))
            processed["timestamp_valid"] = True
        except ValueError:
            processed["timestamp_valid"] = False
            processed["timestamp_error"] = "Invalid ISO format"
    
    # Classify the debug level priority
    level_priority = {
        "debug": 1,
        "info": 2, 
        "warn": 3,
        "error": 4,
        "critical": 5
    }
    processed["level_priority"] = level_priority.get(payload.get("level"), 0)
    
    # Extract operation metrics if available
    if "data" in payload and isinstance(payload["data"], dict):
        data_section = payload["data"]
        if "duration_ms" in data_section:
            # Classify performance
            duration = data_section["duration_ms"]
            if duration < 500:
                processed["performance_rating"] = "excellent"
            elif duration < 2000:
                processed["performance_rating"] = "good"
            elif duration < 5000:
                processed["performance_rating"] = "slow"
            else:
                processed["performance_rating"] = "critical"
    
    return processed

def _store_debug_data(processed_data: Dict[str, Any]) -> Dict[str, Any]:
    """Store or forward debug data to appropriate services."""
    # Placeholder for future integration with:
    # - Google Cloud Logging
    # - BigQuery for analytics
    # - Firestore for structured storage
    # - Pub/Sub for real-time forwarding
    # - Monitoring/alerting systems
    
    try:
        # Simulate storage operation
        storage_location = f"debug_logs/{processed_data.get('source')}/{datetime.utcnow().strftime('%Y/%m/%d')}"
        
        # Future: Implement actual storage logic here
        # - Log to Cloud Logging with structured format
        # - Store metrics in BigQuery for analysis
        # - Alert on critical errors
        # - Update dashboard metrics
        
        return {
            "status": "stored",
            "location": storage_location,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to store debug data: {str(e)}")
        return {
            "status": "storage_failed",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
# Cold start Fri Jul  4 19:44:09 CDT 2025
# cold start test 1 - Fri Jul  4 20:04:32 CDT 2025
# cold start test 2 - Fri Jul  4 20:06:00 CDT 2025
