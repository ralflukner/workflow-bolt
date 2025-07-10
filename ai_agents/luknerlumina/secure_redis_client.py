from google.cloud import secretmanager
import redis
import json
import os
import logging
from datetime import datetime, timezone
from typing import Optional, Any, Dict, Union

class LuknerSecureRedisClient:
    def __init__(self, project_id: str = "luknerlumina"):
        self.project_id = project_id
        self.secret_id = "lukner-redis-connection"
        self.client: Optional[redis.Redis] = None
        
        # Configure logging for Redis operations
        self.logger = logging.getLogger(__name__)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
        
    def get_connection_string(self) -> str:
        """Get Redis connection string from Google Secret Manager"""
        try:
            client = secretmanager.SecretManagerServiceClient()
            name = f"projects/{self.project_id}/secrets/{self.secret_id}/versions/latest"
            response = client.access_secret_version(request={"name": name})
            return response.payload.data.decode("UTF-8")
        except Exception as e:
            raise ConnectionError(f"Failed to retrieve Redis connection from Secret Manager: {e}")
    
    def connect(self) -> redis.Redis:
        """Create secure Redis connection"""
        connection_string = self.get_connection_string()
        self.client = redis.from_url(connection_string)
        return self.client
    
    def ping(self) -> bool:
        """Test connection"""
        if not self.client:
            self.connect()
        if self.client is None:
            raise ConnectionError("Failed to establish Redis connection")
        return self.client.ping()
    
    def store_patient_data(self, patient_id: str, data: Dict[str, Any]) -> bool:
        """Store patient data with HIPAA compliance"""
        if not self.client:
            self.connect()
        
        if self.client is None:
            raise ConnectionError("Failed to establish Redis connection")
        
        # Add metadata with timezone-aware datetime
        secure_data = {
            **data,
            "stored_at": datetime.now(timezone.utc).isoformat(),
            "encrypted": False,  # TODO: Implement encryption at rest
            "access_logged": False,  # TODO: Implement audit logging
            "clinic": "LuknerClinic",
            "stored_by": "lukner-workflow-agent"
        }
        
        key = f"lukner:patient:{patient_id}"
        try:
            # Attempt Redis JSON operation
            result = self.client.json().set(key, "$", secure_data)
            self.logger.info(f"Successfully stored patient data for ID: {patient_id}")
            return bool(result)
        except Exception as e:
            # Handle RedisJSON module not loaded or command errors
            error_msg = f"Redis JSON operation failed for patient {patient_id}: {str(e)}"
            self.logger.error(error_msg)
            if "unknown command" in str(e).lower() or "json.set" in str(e).lower():
                raise RuntimeError("RedisJSON module is not available on this Redis instance. Please install RedisJSON module.") from e
            else:
                raise RuntimeError(f"Redis JSON command error: {str(e)}") from e
        except (TypeError, ValueError) as e:
            # Handle JSON serialization errors
            error_msg = f"Data serialization failed for patient {patient_id}: {str(e)}"
            self.logger.error(error_msg)
            raise ValueError(f"Invalid data format for patient storage: {str(e)}") from e
        except redis.exceptions.ConnectionError as e:
            # Handle connection issues
            error_msg = f"Redis connection error while storing patient {patient_id}: {str(e)}"
            self.logger.error(error_msg)
            raise ConnectionError(f"Failed to connect to Redis: {str(e)}") from e
        except Exception as e:
            # Handle any other unexpected errors
            error_msg = f"Unexpected error storing patient {patient_id}: {str(e)}"
            self.logger.error(error_msg)
            raise RuntimeError(f"Unexpected Redis operation error: {str(e)}") from e
    
    def get_patient_data(self, patient_id):
        """Retrieve patient data securely"""
        if not self.client:
            self.connect()
        
        key = f"lukner:patient:{patient_id}"
        try:
            # Attempt Redis JSON operation
            result = self.client.json().get(key)
            if result is None:
                self.logger.warning(f"No patient data found for ID: {patient_id}")
            else:
                self.logger.info(f"Successfully retrieved patient data for ID: {patient_id}")
            return result
        except redis.exceptions.ResponseError as e:
            # Handle RedisJSON module not loaded or command errors
            error_msg = f"Redis JSON retrieval failed for patient {patient_id}: {str(e)}"
            self.logger.error(error_msg)
            if "unknown command" in str(e).lower() or "json.get" in str(e).lower():
                raise RuntimeError("RedisJSON module is not available on this Redis instance. Please install RedisJSON module.") from e
            else:
                raise RuntimeError(f"Redis JSON command error: {str(e)}") from e
        except redis.exceptions.ConnectionError as e:
            # Handle connection issues
            error_msg = f"Redis connection error while retrieving patient {patient_id}: {str(e)}"
            self.logger.error(error_msg)
            raise ConnectionError(f"Failed to connect to Redis: {str(e)}") from e
        except Exception as e:
            # Handle any other unexpected errors
            error_msg = f"Unexpected error retrieving patient {patient_id}: {str(e)}"
            self.logger.error(error_msg)
            raise RuntimeError(f"Unexpected Redis operation error: {str(e)}") from e
    
    def store_workflow_state(self, workflow_id, state_data):
        """Store workflow state"""
        if not self.client:
            self.connect()
        
        workflow_state = {
            **state_data,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "clinic": "LuknerClinic"
        }
        
        key = f"lukner:workflow:{workflow_id}"
        try:
            # Attempt Redis JSON operation
            result = self.client.json().set(key, "$", workflow_state)
            self.logger.info(f"Successfully stored workflow state for ID: {workflow_id}")
            return result
        except redis.exceptions.ResponseError as e:
            # Handle RedisJSON module not loaded or command errors
            error_msg = f"Redis JSON operation failed for workflow {workflow_id}: {str(e)}"
            self.logger.error(error_msg)
            if "unknown command" in str(e).lower() or "json.set" in str(e).lower():
                raise RuntimeError("RedisJSON module is not available on this Redis instance. Please install RedisJSON module.") from e
            else:
                raise RuntimeError(f"Redis JSON command error: {str(e)}") from e
        except (TypeError, ValueError) as e:
            # Handle JSON serialization errors
            error_msg = f"Data serialization failed for workflow {workflow_id}: {str(e)}"
            self.logger.error(error_msg)
            raise ValueError(f"Invalid data format for workflow storage: {str(e)}") from e
        except redis.exceptions.ConnectionError as e:
            # Handle connection issues
            error_msg = f"Redis connection error while storing workflow {workflow_id}: {str(e)}"
            self.logger.error(error_msg)
            raise ConnectionError(f"Failed to connect to Redis: {str(e)}") from e
        except Exception as e:
            # Handle any other unexpected errors
            error_msg = f"Unexpected error storing workflow {workflow_id}: {str(e)}"
            self.logger.error(error_msg)
            raise RuntimeError(f"Unexpected Redis operation error: {str(e)}") from e
    
    def get_workflow_state(self, workflow_id):
        """Get workflow state"""
        if not self.client:
            self.connect()
        
        key = f"lukner:workflow:{workflow_id}"
        try:
            # Attempt Redis JSON operation
            result = self.client.json().get(key)
            if result is None:
                self.logger.warning(f"No workflow state found for ID: {workflow_id}")
            else:
                self.logger.info(f"Successfully retrieved workflow state for ID: {workflow_id}")
            return result
        except redis.exceptions.ResponseError as e:
            # Handle RedisJSON module not loaded or command errors
            error_msg = f"Redis JSON retrieval failed for workflow {workflow_id}: {str(e)}"
            self.logger.error(error_msg)
            if "unknown command" in str(e).lower() or "json.get" in str(e).lower():
                raise RuntimeError("RedisJSON module is not available on this Redis instance. Please install RedisJSON module.") from e
            else:
                raise RuntimeError(f"Redis JSON command error: {str(e)}") from e
        except redis.exceptions.ConnectionError as e:
            # Handle connection issues
            error_msg = f"Redis connection error while retrieving workflow {workflow_id}: {str(e)}"
            self.logger.error(error_msg)
            raise ConnectionError(f"Failed to connect to Redis: {str(e)}") from e
        except Exception as e:
            # Handle any other unexpected errors
            error_msg = f"Unexpected error retrieving workflow {workflow_id}: {str(e)}"
            self.logger.error(error_msg)
            raise RuntimeError(f"Unexpected Redis operation error: {str(e)}") from e
    
    def test_connection(self):
        """Test Redis connection - alias for ping()"""
        return self.ping()
    
    def store_data(self, namespace, data):
        """Store generic data in Redis"""
        if not self.client:
            self.connect()
        
        key = f"lukner:data:{namespace}"
        try:
            # Store as JSON string
            json_data = json.dumps(data)
            result = self.client.set(key, json_data)
            self.logger.info(f"Successfully stored data for namespace: {namespace}")
            return result
        except Exception as e:
            error_msg = f"Failed to store data for namespace {namespace}: {str(e)}"
            self.logger.error(error_msg)
            raise RuntimeError(error_msg) from e
    
    def get_data(self, namespace):
        """Retrieve generic data from Redis"""
        if not self.client:
            self.connect()
        
        key = f"lukner:data:{namespace}"
        try:
            result = self.client.get(key)
            if result is None:
                self.logger.warning(f"No data found for namespace: {namespace}")
                return None
            else:
                # Parse JSON string back to object
                parsed_data = json.loads(result)
                self.logger.info(f"Successfully retrieved data for namespace: {namespace}")
                return parsed_data
        except Exception as e:
            error_msg = f"Failed to retrieve data for namespace {namespace}: {str(e)}"
            self.logger.error(error_msg)
            raise RuntimeError(error_msg) from e
    
    def encrypt_data(self, data):
        """Encrypt data (placeholder implementation)"""
        # TODO: Implement proper encryption
        # For now, just return the data as-is for testing
        return data
    
    def decrypt_data(self, encrypted_data):
        """Decrypt data (placeholder implementation)"""
        # TODO: Implement proper decryption
        # For now, just return the data as-is for testing
        return encrypted_data

# Usage example for manual testing
if __name__ == "__main__":
    redis_client = LuknerSecureRedisClient()
    try:
        print("🔍 Testing basic Redis connection...")
        redis_client.ping()
        print("✅ Connection successful!")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
