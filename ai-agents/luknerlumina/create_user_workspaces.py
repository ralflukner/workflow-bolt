import os
import json
from datetime import datetime, timezone

def create_user_workspaces():
    print("👥 Creating user workspaces...")
    
    users = [
        "dr.ralf.lukner",
        "beth.lukner", 
        "krystina.joslyn",
        "tanisha.joslyn",
        "paul.marigliano"
    ]
    
    for username in users:
        create_single_workspace(username)
    
    print("✅ All user workspaces created!")

def create_single_workspace(username):
    user_dir = f"user_workspaces/{username}"
    
    # Create user folders
    folders = [
        "documents",
        "patient_files",
        "reports", 
        "templates",
        "ai_collaborations",
        "drafts",
        "archive",
        "shared_with_me",
        "my_uploads"
    ]
    
    for folder in folders:
        folder_path = f"{user_dir}/{folder}"
        os.makedirs(folder_path, exist_ok=True)
    
    # Create config file
    config = {
        "username": username,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "storage_quota": "5GB",
        "folders": folders
    }
    
    config_path = f"{user_dir}/workspace_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    
    print(f"  ✅ Created workspace for {username}")

if __name__ == "__main__":
    create_user_workspaces()
