import os
import json
from datetime import datetime, timezone

class ClaudeCommunicator:
    def __init__(self):
        self.communication_log = []
        
    def receive_message(self, message, from_agent):
        """Receive message from an agent"""
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "from": from_agent,
            "to": "Claude",
            "message": message
        }
        self.communication_log.append(log_entry)
        
        print(f"📨 Message from {from_agent}:")
        print(f"   {message}")
        print(f"   Timestamp: {log_entry['timestamp']}")
        
        # Save to communication log
        self.save_communication_log()
        
        return f"Message received from {from_agent}: {message}"
        
    def save_communication_log(self):
        """Save communication log to file"""
        log_path = "shared_workspaces/ai_collaboration_results/communication_log.json"
        with open(log_path, "w") as f:
            json.dump(self.communication_log, f, indent=2)
            
    def send_response(self, response, to_agent):
        """Send response back to agent"""
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "from": "Claude",
            "to": to_agent,
            "message": response
        }
        self.communication_log.append(log_entry)
        
        print(f"📤 Response to {to_agent}:")
        print(f"   {response}")
        
        self.save_communication_log()
        return f"Response sent to {to_agent}"

if __name__ == "__main__":
    communicator = ClaudeCommunicator()
    
    # Test communication
    test_message = "Hello Claude! The LuknerLumina system is ready for collaboration."
    communicator.receive_message(test_message, "AICollaborationAgent")
    
    # Send test response
    response = "Great! I'm ready to collaborate with the LuknerLumina agents."
    communicator.send_response(response, "AICollaborationAgent")
    
    print("✅ Communication system established!")
