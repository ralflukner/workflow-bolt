from secure_redis_client import LuknerSecureRedisClient
from hipaa_workflow_agent import HIPAAWorkflowAgent
from datetime import datetime, timezone
import uuid

class PatientManager:
    def __init__(self):
        self.redis_client = LuknerSecureRedisClient()
        self.agent = HIPAAWorkflowAgent()
    
    def create_patient(self, name, provider, appointment_time, insurance=None):
        """Create a new patient record"""
        patient_id = f"PAT{str(uuid.uuid4())[:8].upper()}"
        
        patient_data = {
            "patient_id": patient_id,
            "name": name,
            "provider": provider,
            "appointment_time": appointment_time,
            "insurance": insurance or "Not Specified",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "registered"
        }
        
        # Store patient data
        self.redis_client.store_patient_data(patient_id, patient_data)
        
        print(f"✅ Patient created successfully!")
        print(f"   Patient ID: {patient_id}")
        print(f"   Name: {name}")
        print(f"   Provider: {provider}")
        print(f"   Appointment: {appointment_time}")
        
        return patient_id
    
    def start_workflow(self, patient_id):
        """Start workflow for existing patient"""
        patient_data = self.redis_client.get_patient_data(patient_id)
        if not patient_data:
            print(f"❌ Patient {patient_id} not found")
            return None
        
        print(f"🚀 Starting workflow for {patient_data.get('name', 'Unknown')}")
        workflow_id = self.agent.process_patient_check_in(patient_data)
        
        return workflow_id
    
    def demo_patients(self):
        """Create demo patients for testing"""
        print("🏥 Creating Demo Patients...")
        print("=" * 40)
        
        demo_patients = [
            {
                "name": "Alice Johnson",
                "provider": "Dr. Lukner",
                "appointment_time": "2025-07-03T09:00:00Z",
                "insurance": "Blue Cross Blue Shield"
            },
            {
                "name": "Bob Smith",
                "provider": "Dr. Lukner",
                "appointment_time": "2025-07-03T10:30:00Z",
                "insurance": "Aetna"
            },
            {
                "name": "Carol Davis",
                "provider": "Dr. Lukner",
                "appointment_time": "2025-07-03T14:00:00Z",
                "insurance": "United Healthcare"
            }
        ]
        
        created_patients = []
        for patient in demo_patients:
            patient_id = self.create_patient(**patient)
            created_patients.append(patient_id)
            print("")
        
        print("🎉 Demo patients created successfully!")
        return created_patients

if __name__ == "__main__":
    manager = PatientManager()
    
    # Create demo patients
    patient_ids = manager.demo_patients()
    
    # Start workflow for first patient
    print("")
    print("=" * 40)
    print("🚀 Starting workflow for first patient...")
    if patient_ids:
        workflow_id = manager.start_workflow(patient_ids[0])
        print(f"✅ Workflow started: {workflow_id}")
