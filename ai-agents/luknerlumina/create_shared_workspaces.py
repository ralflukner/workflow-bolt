import os
import json
from datetime import datetime, timezone

def create_shared_workspaces():
    print("🤝 Creating shared workspaces...")
    
    workspaces = [
        "team_collaboration",
        "patient_care_coordination",
        "ehr_integration", 
        "compliance_documents",
        "ai_collaboration_results"
    ]
    
    for workspace in workspaces:
        create_single_shared_workspace(workspace)
    
    print("✅ All shared workspaces created!")

def create_single_shared_workspace(workspace_name):
    workspace_dir = "shared_workspaces/" + workspace_name
    os.makedirs(workspace_dir, exist_ok=True)
    
    # Create config
    config = {
        "name": workspace_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "access": "team_members"
    }
    
    config_path = workspace_dir + "/workspace_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    
    # Create README using list approach
    readme_lines = [
        "# " + workspace_name,
        "",
        "This is a shared workspace for team collaboration.",
        "",
        "## Guidelines",
        "- Keep files organized",
        "- Use descriptive names", 
        "- Follow HIPAA guidelines",
        ""
    ]
    
    readme_path = workspace_dir + "/README.md"
    with open(readme_path, "w") as f:
        for line in readme_lines:
            f.write(line + "")
    
    print("  ✅ Created shared workspace: " + workspace_name)

if __name__ == "__main__":
    create_shared_workspaces()