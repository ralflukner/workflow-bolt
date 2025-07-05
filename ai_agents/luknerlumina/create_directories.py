import os

def create_basic_structure():
    print("📁 Creating basic directory structure...")
    
    # Main directories
    directories = [
        "user_workspaces",
        "shared_workspaces", 
        "workspace_templates",
        "backup_storage",
        "archive_storage"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"  ✅ Created {directory}")
    
    print("✅ Basic structure created!")

if __name__ == "__main__":
    create_basic_structure()
