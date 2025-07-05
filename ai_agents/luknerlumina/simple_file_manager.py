import os
import sys

def list_files(username, folder=None):
    base_path = "user_workspaces/" + username
    
    if not os.path.exists(base_path):
        print("❌ User workspace not found: " + username)
        return
    
    if folder:
        target_path = base_path + "/" + folder
    else:
        target_path = base_path
    
    if not os.path.exists(target_path):
        print("❌ Folder not found: " + str(folder))
        return
    
    print("📁 Contents of " + target_path + ":")
    print("-" * 40)
    
    items = os.listdir(target_path)
    for item in sorted(items):
        item_path = os.path.join(target_path, item)
        if os.path.isdir(item_path):
            print("📁 " + item + "/")
        else:
            try:
                size = os.path.getsize(item_path)
                print("📄 " + item + " (" + str(size) + " bytes)")
            except OSError:
                print("📄 " + item + " (size unavailable)")

def show_usage(username):
    base_path = "user_workspaces/" + username
    
    if not os.path.exists(base_path):
        print("❌ User workspace not found: " + username)
        return
    
    total_size = 0
    file_count = 0
    
    for root, dirs, files in os.walk(base_path):
        for file in files:
            try:
                file_path = os.path.join(root, file)
                total_size += os.path.getsize(file_path)
                file_count += 1
            except OSError:
                # Skip files that can't be accessed
                continue
    
    # Convert to readable format
    if total_size < 1024:
        size_str = str(total_size) + " B"
    elif total_size < 1024 * 1024:
        size_str = str(round(total_size/1024, 1)) + " KB"
    else:
        size_str = str(round(total_size/(1024*1024), 1)) + " MB"
    
    print("📊 Storage usage for " + username + ":")
    print("   Files: " + str(file_count))
    print("   Total size: " + size_str)

def validate_username(username):
    """Validate username to prevent injection attacks"""
    import re
    # only allow alphanumeric, dot, underscore or hyphen
    if not re.match(r'^[a-zA-Z0-9._-]+$', username):
        return False
    # enforce a reasonable maximum length
    if len(username) > 50:
        return False
    return True

def main():
    if len(sys.argv) < 2:
        print("Usage: python simple_file_manager.py <command> [args]")
        print("Commands:")
        print("  list <username> [folder]  - List files in user workspace")
        print("  usage <username>          - Show storage usage for user")
        return
    
    command = sys.argv[1]
    
    if command == "list":
        if len(sys.argv) < 3:
            print("Error: Username required")
            return
        username = sys.argv[2]
        if not validate_username(username):
            print("Error: Invalid username format")
            return
        folder = sys.argv[3] if len(sys.argv) > 3 else None
        list_files(username, folder)
    
    elif command == "usage":
        if len(sys.argv) < 3:
            print("Error: Username required")
            return
        username = sys.argv[2]
        if not validate_username(username):
            print("Error: Invalid username format")
            return
        show_usage(username)
    
    else:
        print("Unknown command: " + command)
        print("Available commands: list, usage")

if __name__ == "__main__":
    main()