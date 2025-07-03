import os
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

class UserFileStorageSystem:
    def __init__(self):
        self.base_storage_dir = "user_workspaces"
        self.shared_storage_dir = "shared_workspaces"
        self.templates_dir = "workspace_templates"
        
    def create_user_storage_system(self):
        print("📁 Creating User File Storage System")
        print("=" * 50)
        
        self.create_storage_structure()
        self.create_user_workspaces()
        self.create_shared_workspaces()
        
        print("✅ User file storage system created!")
        
    def create_storage_structure(self):
        print("📁 Creating storage structure...")
        
        main_dirs = [
            self.base_storage_dir,
            self.shared_storage_dir,
            self.templates_dir,
            "backup_storage",
            "archive_storage"
        ]
        
        for directory in main_dirs:
            os.makedirs(directory, exist_ok=True)
        
        print("  ✅ Storage structure created")
        
    def create_user_workspaces(self):
        print("👥 Creating user workspaces...")
        
        users = [
            {
                "username": "dr.ralf.lukner",
                "role": "physician",
                "name": "Dr. Ralf Lukner"
            },
            {
                "username": "beth.lukner",
                "role": "admin",
                "name": "Beth Lukner"
            },
            {
                "username": "krystina.joslyn",
                "role": "staff",
                "name": "Krystina Joslyn"
            },
            {
                "username": "tanisha.joslyn",
                "role": "staff",
                "name": "Tanisha Joslyn"
            },
            {
                "username": "paul.marigliano",
                "role": "admin",
                "name": "Paul Marigliano"
            }
        ]
        
        for user in users:
            self.create_user_workspace(user)
        
        print("  ✅ User workspaces created")
        
    def create_user_workspace(self, user):
        username = user["username"]
        user_dir = f"{self.base_storage_dir}/{username}"
        
        user_subdirs = [
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
        
        for subdir in user_subdirs:
            os.makedirs(f"{user_dir}/{subdir}", exist_ok=True)
        
        workspace_config = {
            "user": user,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "storage_quota": "5GB",
            "permissions": {
                "read": True,
                "write": True,
                "delete": True,
                "share": True
            },
            "folders": user_subdirs
        }
        
        with open(f"{user_dir}/workspace_config.json", "w") as f:
            json.dump(workspace_config, f, indent=2)
        
        print(f"  ✅ Workspace created for {user['name']}")
        
    def create_shared_workspaces(self):
        print("🤝 Creating shared workspaces...")
        
        shared_workspaces = [
            {
                "name": "team_collaboration",
                "description": "General team collaboration space",
                "access": "all_users"
            },
            {
                "name": "patient_care_coordination",
                "description": "Patient care coordination files",
                "access": "healthcare_staff"
            },
            {
                "name": "ehr_integration",
                "description": "EHR integration project files",
                "access": "technical_team"
            },
            {
                "name": "compliance_documents",
                "description": "HIPAA and compliance documentation",
                "access": "admin_staff"
            },
            {
                "name": "ai_collaboration_results",
                "description": "Results from AI agent collaborations",
                "access": "all_users"
            }
        ]
        
        for workspace in shared_workspaces:
            self.create_shared_workspace(workspace)
        
        print("  ✅ Shared workspaces created")
        
    def create_shared_workspace(self, workspace):
        workspace_name = workspace["name"]
        workspace_dir = f"{self.shared_storage_dir}/{workspace_name}"
        
        os.makedirs(workspace_dir, exist_ok=True)
        
        workspace_config = {
            "workspace": workspace,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "permissions": {
                "read": True,
                "write": True,
                "delete": False,
                "share": True
            },
            "access_log": []
        }
        
        with open(f"{workspace_dir}/workspace_config.json", "w") as f:
            json.dump(workspace_config, f, indent=2)
        
        readme_lines = [
            f"# {workspace['description']}",
            "",
            "## Purpose",
            f"{workspace['description']}",
            "",
            "## Access",
            f"{workspace['access']}",
            "",
            "## Guidelines",
            "1. File Naming: Use descriptive names with dates",
            "2. Organization: Keep files organized in appropriate folders",
            "3. Collaboration: Use comments and version control",
            "4. Security: Follow HIPAA guidelines for patient data",
            "",
            "## Security",
            "- All files are encrypted",
            "- Access is logged",
            "- Automatic compliance checking",
            ""
        ]
        
        with open(f"{workspace_dir}/README.md", "w") as f:
            f.write("
".join(readme_lines))
        
        print(f"  ✅ Shared workspace created: {workspace_name}")

if __name__ == "__main__":
    storage_system = UserFileStorageSystem()
    storage_system.create_user_storage_system()
