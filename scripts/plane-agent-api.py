#!/usr/bin/env python3

"""
Plane.so Multi-Agent API Integration
Allows agents to update task status, progress, and add comments
Author: Claude Code Assistant
Version: 1.0
Date: 2025-07-05
"""

import requests
import json
import os
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class TaskUpdate:
    """Data structure for task updates"""
    task_id: str
    agent: str
    status: Optional[str] = None
    completion: Optional[int] = None
    comment: Optional[str] = None
    time_spent: Optional[int] = None  # in minutes

class PlaneAgentAPI:
    """API client for multi-agent task management"""
    
    def __init__(self, base_url: str = "http://localhost:8000", token: str = None):
        self.base_url = base_url
        self.session = requests.Session()
        if token:
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # These should be set after authentication/workspace selection
        self.workspace_id = None
        self.project_id = None
    
    def set_workspace_project(self, workspace_id: str, project_id: str):
        """Set the workspace and project IDs for API calls"""
        self.workspace_id = workspace_id
        self.project_id = project_id
    
    def get_all_tasks(self) -> List[Dict]:
        """Get all tasks/issues from the project"""
        if not self.workspace_id or not self.project_id:
            raise ValueError("Workspace and project IDs must be set")
        
        try:
            url = f"{self.base_url}/api/v1/workspaces/{self.workspace_id}/projects/{self.project_id}/issues/"
            response = self.session.get(url)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Failed to get tasks: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ Error getting tasks: {e}")
            return []
    
    def find_task_by_name(self, task_name: str) -> Optional[Dict]:
        """Find a task by its name"""
        tasks = self.get_all_tasks()
        for task in tasks:
            if task.get("name", "").lower() == task_name.lower():
                return task
        return None
    
    def update_task_status(self, task_id: str, status: str, agent: str) -> bool:
        """Update task status"""
        if not self.workspace_id or not self.project_id:
            raise ValueError("Workspace and project IDs must be set")
        
        # Map common status terms to Plane.so states
        status_mapping = {
            "todo": "backlog",
            "in_progress": "started",
            "in progress": "started", 
            "started": "started",
            "done": "completed",
            "completed": "completed",
            "blocked": "backlog",  # You may want to create a custom "blocked" state
            "review": "started"    # Or create a custom "review" state
        }
        
        plane_status = status_mapping.get(status.lower(), status)
        
        try:
            url = f"{self.base_url}/api/v1/workspaces/{self.workspace_id}/projects/{self.project_id}/issues/{task_id}/"
            
            update_data = {
                "state": plane_status
            }
            
            response = self.session.patch(url, json=update_data)
            if response.status_code == 200:
                print(f"✅ Updated task {task_id} status to {plane_status} by {agent}")
                return True
            else:
                print(f"❌ Failed to update task status: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error updating task status: {e}")
            return False
    
    def add_task_comment(self, task_id: str, comment: str, agent: str) -> bool:
        """Add a comment to a task"""
        if not self.workspace_id or not self.project_id:
            raise ValueError("Workspace and project IDs must be set")
        
        try:
            url = f"{self.base_url}/api/v1/workspaces/{self.workspace_id}/projects/{self.project_id}/issues/{task_id}/comments/"
            
            comment_data = {
                "comment": f"**{agent}** ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})\n\n{comment}"
            }
            
            response = self.session.post(url, json=comment_data)
            if response.status_code == 201:
                print(f"✅ Added comment to task {task_id} by {agent}")
                return True
            else:
                print(f"❌ Failed to add comment: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error adding comment: {e}")
            return False
    
    def log_time_spent(self, task_id: str, minutes: int, agent: str, description: str = "") -> bool:
        """Log time spent on a task"""
        comment = f"⏱️ **Time logged**: {minutes} minutes"
        if description:
            comment += f"\n**Activity**: {description}"
        
        return self.add_task_comment(task_id, comment, agent)
    
    def update_completion_percentage(self, task_id: str, completion: int, agent: str) -> bool:
        """Update task completion percentage (via comment since Plane.so doesn't have built-in % field)"""
        comment = f"📊 **Progress Update**: {completion}% complete"
        return self.add_task_comment(task_id, comment, agent)
    
    def agent_status_update(self, update: TaskUpdate) -> bool:
        """Comprehensive update from an agent"""
        success = True
        
        # Update status if provided
        if update.status:
            success &= self.update_task_status(update.task_id, update.status, update.agent)
        
        # Add comment if provided
        if update.comment:
            success &= self.add_task_comment(update.task_id, update.comment, update.agent)
        
        # Log time if provided
        if update.time_spent:
            success &= self.log_time_spent(update.task_id, update.time_spent, update.agent)
        
        # Update completion if provided
        if update.completion is not None:
            success &= self.update_completion_percentage(update.task_id, update.completion, update.agent)
        
        return success

# Convenience functions for agents
def quick_update(task_name: str, status: str, agent: str, comment: str = "", completion: int = None):
    """Quick task update by task name"""
    # Load API credentials from environment or config
    api_token = os.getenv("PLANE_API_TOKEN")
    workspace_id = os.getenv("PLANE_WORKSPACE_ID") 
    project_id = os.getenv("PLANE_PROJECT_ID")
    
    if not all([api_token, workspace_id, project_id]):
        print("❌ Missing environment variables: PLANE_API_TOKEN, PLANE_WORKSPACE_ID, PLANE_PROJECT_ID")
        return False
    
    api = PlaneAgentAPI(token=api_token)
    api.set_workspace_project(workspace_id, project_id)
    
    # Find task by name
    task = api.find_task_by_name(task_name)
    if not task:
        print(f"❌ Task not found: {task_name}")
        return False
    
    # Create update
    update = TaskUpdate(
        task_id=task["id"],
        agent=agent,
        status=status,
        comment=comment,
        completion=completion
    )
    
    return api.agent_status_update(update)

def claude_update(task_name: str, status: str, comment: str = "", completion: int = None):
    """Convenience function for Claude Code agent updates"""
    return quick_update(task_name, status, "Claude Code", comment, completion)

def agent_update(agent_name: str, task_name: str, status: str, comment: str = "", completion: int = None):
    """Generic agent update function"""
    return quick_update(task_name, status, agent_name, comment, completion)

# CLI interface for agents
def cli_interface():
    """Command line interface for agent updates"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Update Plane.so tasks from agents")
    parser.add_argument("--task", required=True, help="Task name")
    parser.add_argument("--agent", required=True, help="Agent name (e.g., 'Claude Code', 'o3-MAX')")
    parser.add_argument("--status", help="New status (todo, in_progress, done, etc.)")
    parser.add_argument("--comment", help="Comment to add")
    parser.add_argument("--completion", type=int, help="Completion percentage (0-100)")
    parser.add_argument("--time", type=int, help="Time spent in minutes")
    
    args = parser.parse_args()
    
    # Load environment variables
    api_token = os.getenv("PLANE_API_TOKEN")
    workspace_id = os.getenv("PLANE_WORKSPACE_ID")
    project_id = os.getenv("PLANE_PROJECT_ID")
    
    if not all([api_token, workspace_id, project_id]):
        print("❌ Missing environment variables:")
        print("   PLANE_API_TOKEN - Get this from Plane.so user settings")
        print("   PLANE_WORKSPACE_ID - Get this from workspace URL")
        print("   PLANE_PROJECT_ID - Get this from project URL")
        return
    
    # Initialize API
    api = PlaneAgentAPI(token=api_token)
    api.set_workspace_project(workspace_id, project_id)
    
    # Find task
    task = api.find_task_by_name(args.task)
    if not task:
        print(f"❌ Task not found: {args.task}")
        return
    
    # Create update
    update = TaskUpdate(
        task_id=task["id"],
        agent=args.agent,
        status=args.status,
        comment=args.comment,
        completion=args.completion,
        time_spent=args.time
    )
    
    # Execute update
    success = api.agent_status_update(update)
    if success:
        print(f"✅ Successfully updated task: {args.task}")
    else:
        print(f"❌ Failed to update task: {args.task}")

if __name__ == "__main__":
    cli_interface()

# Example usage:
"""
# Set environment variables first:
export PLANE_API_TOKEN="your_token_here"
export PLANE_WORKSPACE_ID="workspace_id_here" 
export PLANE_PROJECT_ID="project_id_here"

# CLI usage:
python plane-agent-api.py --task "Create Production Redis Client Module" --agent "Claude Code" --status "in_progress" --comment "Started implementation of shared Redis client"

# Python usage:
from plane_agent_api import claude_update
claude_update("Create Production Redis Client Module", "in_progress", "Started implementation", 25)
"""