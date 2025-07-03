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
            size = os.path.getsize(item_path)
            print("📄 " + item + " (" + str(size) + " bytes)")

def show_usage(username):
    base_path = "user_workspaces/" + username
    
    if not os.path.exists(base_path):
        print("❌ User workspace not found: " + username)
        return
    
    total_size = 0
    file_count = 0
    
    for root, dirs, files in os.walk(base_path):
        for file in files:
            file_path = os.path.join(root, file)
            total_size += os.path.getsize(file_path)
            file_count += 1
    
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

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python simple_file_manager.py list <username> [folder]")
        print("  python simple_file_manager.py usage <username>")
        return
    
    command = sys.argv[1]
    
    if command == "list":
        if len(sys.argv) < 3:
            print("Error: Username required")
            return
        username = sys.argv[2]
        folder = sys.argv[3] if len(sys.argv) > 3 else None
        list_files(username, folder)
    
    elif command == "usage":
        if len(sys.argv) < 3:
            print("Error: Username required")
            return
        username = sys.argv[2]
        show_usage(username)
    
    else:
        print("Unknown command: " + command)

if __name__ == "__main__":
    main()