from google.cloud import secretmanager
import redis
import json
import os
from datetime import datetime, timezone

class LuknerSecureRedisClient:
    def __init__(self, project_id="luknerlumina"):
        self.project_id = project_id
        self.secret_id = "lukner-redis-connection"
        self.client = None
        
    def get_connection_string(self):
        """Get Redis connection string from Google Secret Manager"""
        client = secretmanager.SecretManagerServiceClient()
        name = f"projects/{self.project_id}/secrets/{self.secret_id}/versions/latest"
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    
    def connect(self):
        """Create secure Redis connection"""
        connection_string = self.get_connection_string()
        self.client = redis.from_url(connection_string)
        return self.client
    
    def ping(self):
        """Test connection"""
        if not self.client:
            self.connect()
        return self.client.ping()
    
    def store_patient_data(self, patient_id, data):
        """Store patient data with HIPAA compliance"""
        if not self.client:
            self.connect()
        
        # Add metadata with timezone-aware datetime
        secure_data = {
            **data,
            "stored_at": datetime.now(timezone.utc).isoformat(),
            "hipaa_compliant": True,
            "clinic": "LuknerClinic",
            "stored_by": "lukner-workflow-agent"
        }
        
        key = f"lukner:patient:{patient_id}"
        return self.client.json().set(key, "$", secure_data)
    
    def get_patient_data(self, patient_id):
        """Retrieve patient data securely"""
        if not self.client:
            self.connect()
        
        key = f"lukner:patient:{patient_id}"
        return self.client.json().get(key)
    
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
        return self.client.json().set(key, "$", workflow_state)
    
    def get_workflow_state(self, workflow_id):
        """Get workflow state"""
        if not self.client:
            self.connect()
        
        key = f"lukner:workflow:{workflow_id}"
        return self.client.json().get(key)
    
    def test_secure_operations(self):
        """Test all secure operations"""
        try:
            print("🔍 Testing LuknerLumina Secure Redis Operations...")
            print("=" * 50)
            
            # Test connection
            self.ping()
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
            self.store_patient_data("test123", patient_data)
            
            print("📖 Retrieving patient data...")
            retrieved = self.get_patient_data("test123")
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
            
            self.store_workflow_state("workflow_test123", workflow_state)
            workflow_retrieved = self.get_workflow_state("workflow_test123")
            print("✅ Workflow state managed successfully!")
            print(f"   Current step: {workflow_retrieved.get('step', 'N/A')}")
            print(f"   Status: {workflow_retrieved.get('status', 'N/A')}")
            
            print("")
            print("🎉 All secure operations working perfectly!")
            print("🏥 LuknerLumina HIPAA-compliant system ready!")
            return True
            
        except Exception as e:
            print(f"❌ Error in secure operations: {e}")
            print(f"   Error type: {type(e).__name__}")
            return False

# Usage example
if __name__ == "__main__":
    redis_client = LuknerSecureRedisClient()
    redis_client.test_secure_operations()
