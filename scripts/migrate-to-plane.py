#!/usr/bin/env python3

"""
Plane.so Migration Script
Migrates all existing project plans to Plane.so via API
Author: Claude Code Assistant
Version: 1.0
Date: 2025-07-05
"""

import requests
import json
import time
from typing import Dict, List, Any
from pathlib import Path

# Configuration
PLANE_BASE_URL = "http://localhost:8000"
PLANE_API_URL = f"{PLANE_BASE_URL}/api/v1"

class PlaneAPI:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None
        self.workspace_id = None
        self.project_id = None
    
    def authenticate(self, email: str, password: str) -> bool:
        """Authenticate with Plane.so and get API token"""
        auth_data = {
            "email": email,
            "password": password
        }
        
        try:
            response = self.session.post(f"{self.base_url}/auth/sign-in/", json=auth_data)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                if self.token:
                    self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                    print("✅ Successfully authenticated with Plane.so")
                    return True
            print(f"❌ Authentication failed: {response.status_code}")
            return False
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def get_workspaces(self) -> List[Dict]:
        """Get all workspaces"""
        try:
            response = self.session.get(f"{self.base_url}/workspaces/")
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            print(f"❌ Error getting workspaces: {e}")
            return []
    
    def create_workspace(self, name: str, slug: str) -> Dict:
        """Create a new workspace"""
        workspace_data = {
            "name": name,
            "slug": slug,
            "organization_size": "2-10"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/workspaces/", json=workspace_data)
            if response.status_code == 201:
                workspace = response.json()
                self.workspace_id = workspace["id"]
                print(f"✅ Created workspace: {name}")
                return workspace
            print(f"❌ Failed to create workspace: {response.status_code}")
            return {}
        except Exception as e:
            print(f"❌ Error creating workspace: {e}")
            return {}
    
    def create_project(self, name: str, description: str) -> Dict:
        """Create a new project in the workspace"""
        if not self.workspace_id:
            print("❌ No workspace selected")
            return {}
        
        project_data = {
            "name": name,
            "description": description,
            "network": 2,  # Private project
            "project_lead": None
        }
        
        try:
            url = f"{self.base_url}/workspaces/{self.workspace_id}/projects/"
            response = self.session.post(url, json=project_data)
            if response.status_code == 201:
                project = response.json()
                self.project_id = project["id"]
                print(f"✅ Created project: {name}")
                return project
            print(f"❌ Failed to create project: {response.status_code} - {response.text}")
            return {}
        except Exception as e:
            print(f"❌ Error creating project: {e}")
            return {}
    
    def create_issue(self, issue_data: Dict) -> Dict:
        """Create a new issue in the project"""
        if not self.workspace_id or not self.project_id:
            print("❌ No workspace/project selected")
            return {}
        
        try:
            url = f"{self.base_url}/workspaces/{self.workspace_id}/projects/{self.project_id}/issues/"
            response = self.session.post(url, json=issue_data)
            if response.status_code == 201:
                return response.json()
            print(f"❌ Failed to create issue: {response.status_code} - {response.text}")
            return {}
        except Exception as e:
            print(f"❌ Error creating issue: {e}")
            return {}

def load_existing_plans() -> List[Dict[str, Any]]:
    """Load all tasks from existing project plans"""
    tasks = []
    
    # Action Plan Tasks (Security & Foundation)
    action_plan_tasks = [
        {
            "name": "Remove Unauthenticated Access from Cloud Functions",
            "description": "Remove `--allow-unauthenticated` flag from deploy scripts and implement IAM-based authentication for all Cloud Functions",
            "phase": "Foundation Stabilization",
            "priority": "urgent",
            "owner": "DevOps Team",
            "agent": "Human Developer",
            "estimated_days": 1,
            "completion": 100,
            "state": "completed",
            "hipaa_impact": "High",
            "security_level": "Critical"
        },
        {
            "name": "Secure CI/CD Authentication with OIDC",
            "description": "Update GitHub workflows to use OIDC/Workload Identity instead of long-lived service account keys for enhanced security",
            "phase": "Foundation Stabilization",
            "priority": "urgent",
            "owner": "DevOps Team",
            "agent": "Human Developer",
            "estimated_days": 2,
            "completion": 100,
            "state": "completed",
            "hipaa_impact": "High",
            "security_level": "Critical"
        },
        {
            "name": "Remove PHI from Source Code and Test Data",
            "description": "Conduct thorough audit to identify and remove all hard-coded PHI. Implement data masking for logs and synthetic test data generation",
            "phase": "Foundation Stabilization",
            "priority": "urgent",
            "owner": "Security Team",
            "agent": "Human Developer",
            "estimated_days": 3,
            "completion": 100,
            "state": "completed",
            "hipaa_impact": "High",
            "security_level": "Critical"
        },
        {
            "name": "Fix Initial TypeScript Build Errors",
            "description": "Address TypeScript errors in Dashboard.tsx, sync-today-debug.ts, and tebraDebugApi.ts to restore build stability",
            "phase": "Foundation Stabilization",
            "priority": "high",
            "owner": "Frontend Team",
            "agent": "Human Developer",
            "estimated_days": 2,
            "completion": 100,
            "state": "completed",
            "hipaa_impact": "Low",
            "security_level": "None"
        },
        {
            "name": "Triage All Test Failures",
            "description": "Review CODE_REVIEW_RESULTS.md section 9, categorize test failures by type (assertion, missing mock, OOM), and assign owners",
            "phase": "Testing Infrastructure",
            "priority": "high",
            "owner": "Backend Team",
            "agent": "Human Developer",
            "estimated_days": 3,
            "completion": 0,
            "state": "backlog",
            "hipaa_impact": "Low",
            "security_level": "None"
        },
        {
            "name": "Create Automated Deployment Workflow",
            "description": "Implement deploy.yml GitHub workflow for automated Cloud Functions deployment with proper testing and security checks",
            "phase": "Foundation Stabilization",
            "priority": "high",
            "owner": "DevOps Team",
            "agent": "Human Developer",
            "estimated_days": 3,
            "completion": 0,
            "state": "backlog",
            "hipaa_impact": "Medium",
            "security_level": "High"
        }
    ]
    
    # Redis Migration Tasks
    redis_tasks = [
        {
            "name": "Create Production Redis Client Module",
            "description": "Implement shared Redis client with connection pooling, health checks, and fallback handling in functions/shared/redis_client.py",
            "phase": "Redis Migration",
            "priority": "high",
            "owner": "Backend Team",
            "agent": "Human Developer",
            "estimated_days": 2,
            "completion": 0,
            "state": "backlog",
            "hipaa_impact": "Medium",
            "security_level": "Medium"
        },
        {
            "name": "Migrate Functions to Shared Redis Client",
            "description": "Refactor tebra_debug, patient_sync, and other functions to use shared Redis client with proper error handling",
            "phase": "Redis Migration",
            "priority": "high",
            "owner": "Backend Team",
            "agent": "Human Developer",
            "estimated_days": 3,
            "completion": 0,
            "state": "backlog",
            "hipaa_impact": "Medium",
            "security_level": "Medium"
        },
        {
            "name": "Create Redis Monitoring and Alerts",
            "description": "Use Terraform to create alert policies for Redis connection failures, high latency, and custom metrics logging",
            "phase": "Redis Migration",
            "priority": "medium",
            "owner": "DevOps Team",
            "agent": "Human Developer",
            "estimated_days": 2,
            "completion": 0,
            "state": "backlog",
            "hipaa_impact": "Low",
            "security_level": "Low"
        }
    ]
    
    # Security & Compliance Tasks (Recently Completed)
    security_tasks = [
        {
            "name": "Endpoint Authentication Security Audit",
            "description": "Comprehensive audit of all Firebase Functions and Cloud Run services for proper authentication and HIPAA compliance",
            "phase": "Security & Compliance",
            "priority": "urgent",
            "owner": "Security Team",
            "agent": "Claude Code",
            "estimated_days": 1,
            "completion": 100,
            "state": "completed",
            "hipaa_impact": "High",
            "security_level": "Critical"
        },
        {
            "name": "Implement Standardized Auth Middleware",
            "description": "Create and deploy requireAuth middleware for all HTTP endpoints handling PHI with proper token validation",
            "phase": "Security & Compliance",
            "priority": "urgent",
            "owner": "Security Team",
            "agent": "Claude Code",
            "estimated_days": 1,
            "completion": 100,
            "state": "completed",
            "hipaa_impact": "High",
            "security_level": "Critical"
        },
        {
            "name": "Create Automated Security Scanner",
            "description": "Develop comprehensive endpoint security scanner script for regular audits and vulnerability detection",
            "phase": "Security & Compliance",
            "priority": "high",
            "owner": "Security Team",
            "agent": "Claude Code",
            "estimated_days": 1,
            "completion": 100,
            "state": "completed",
            "hipaa_impact": "Medium",
            "security_level": "High"
        },
        {
            "name": "Weekly Security Scanning Schedule",
            "description": "Set up automated weekly security scans and alerting for endpoint vulnerabilities with escalation procedures",
            "phase": "Security & Compliance",
            "priority": "medium",
            "owner": "DevOps Team",
            "agent": "Human Developer",
            "estimated_days": 1,
            "completion": 0,
            "state": "backlog",
            "hipaa_impact": "Medium",
            "security_level": "Medium"
        }
    ]
    
    # Documentation & Process Tasks
    documentation_tasks = [
        {
            "name": "Consolidate Project Management Plans",
            "description": "Merge all existing planning documents into unified Plane.so database with proper API integration",
            "phase": "Documentation & Process",
            "priority": "high",
            "owner": "DevOps Team",
            "agent": "Claude Code",
            "estimated_days": 1,
            "completion": 90,
            "state": "started",
            "hipaa_impact": "None",
            "security_level": "None"
        },
        {
            "name": "Update Architecture Documentation",
            "description": "Update CLAUDE.md and project documentation to reflect current Redis-first architecture and multi-agent workflow",
            "phase": "Documentation & Process",
            "priority": "medium",
            "owner": "DevOps Team",
            "agent": "Claude Code",
            "estimated_days": 2,
            "completion": 50,
            "state": "started",
            "hipaa_impact": "None",
            "security_level": "None"
        },
        {
            "name": "Setup Multi-Agent API Integration",
            "description": "Create Plane.so API integration for automated status updates from agents with proper authentication and error handling",
            "phase": "Documentation & Process",
            "priority": "medium",
            "owner": "Backend Team",
            "agent": "Human Developer",
            "estimated_days": 3,
            "completion": 0,
            "state": "backlog",
            "hipaa_impact": "None",
            "security_level": "Low"
        }
    ]
    
    # Combine all tasks
    tasks.extend(action_plan_tasks)
    tasks.extend(redis_tasks)
    tasks.extend(security_tasks)
    tasks.extend(documentation_tasks)
    
    return tasks

def priority_to_plane(priority: str) -> str:
    """Convert priority to Plane.so format"""
    mapping = {
        "urgent": "urgent",
        "high": "high", 
        "medium": "medium",
        "low": "low"
    }
    return mapping.get(priority.lower(), "medium")

def state_to_plane(state: str) -> str:
    """Convert state to Plane.so format"""
    # Note: These will need to be created in Plane.so first
    mapping = {
        "backlog": "backlog",
        "started": "started", 
        "completed": "completed"
    }
    return mapping.get(state.lower(), "backlog")

def migrate_tasks_to_plane():
    """Main migration function"""
    print("🚀 Migrating Project Plans to Plane.so")
    print("=" * 40)
    
    # Initialize Plane API
    plane = PlaneAPI(PLANE_API_URL)
    
    # Get credentials from user
    print("\n📝 Plane.so Authentication Required")
    print("Please create an account at http://localhost:3000 first if you haven't already")
    email = input("Enter your Plane.so email: ")
    password = input("Enter your Plane.so password: ")
    
    # Authenticate
    if not plane.authenticate(email, password):
        print("❌ Failed to authenticate. Please check your credentials.")
        return
    
    # Create workspace
    workspace_name = "Workflow Bolt"
    workspace_slug = "workflow-bolt"
    
    workspaces = plane.get_workspaces()
    existing_workspace = None
    for ws in workspaces:
        if ws.get("slug") == workspace_slug:
            existing_workspace = ws
            plane.workspace_id = ws["id"]
            print(f"✅ Using existing workspace: {workspace_name}")
            break
    
    if not existing_workspace:
        workspace = plane.create_workspace(workspace_name, workspace_slug)
        if not workspace:
            print("❌ Failed to create workspace")
            return
    
    # Create project
    project_name = "Master Project Plan"
    project_description = "Consolidated project management for multi-agent development workflow including security, Redis migration, and documentation tasks"
    
    project = plane.create_project(project_name, project_description)
    if not project:
        print("❌ Failed to create project")
        return
    
    # Load and migrate tasks
    tasks = load_existing_plans()
    print(f"\n📋 Migrating {len(tasks)} tasks to Plane.so...")
    
    created_count = 0
    failed_count = 0
    
    for task in tasks:
        # Prepare issue data for Plane.so
        issue_data = {
            "name": task["name"],
            "description": f"""{task["description"]}

## Project Metadata
- **Phase**: {task["phase"]}
- **Owner**: {task["owner"]}
- **Agent Assignment**: {task["agent"]}
- **Estimated Days**: {task["estimated_days"]}
- **Completion**: {task["completion"]}%
- **HIPAA Impact**: {task["hipaa_impact"]}
- **Security Level**: {task["security_level"]}

*Migrated from legacy project plans*
""",
            "priority": priority_to_plane(task["priority"]),
            "state": state_to_plane(task["state"])
        }
        
        # Create the issue
        result = plane.create_issue(issue_data)
        if result:
            created_count += 1
            print(f"✅ Created: {task['name']}")
        else:
            failed_count += 1
            print(f"❌ Failed: {task['name']}")
        
        # Small delay to avoid rate limiting
        time.sleep(0.1)
    
    # Summary
    print(f"\n📊 Migration Summary:")
    print(f"✅ Successfully created: {created_count} issues")
    print(f"❌ Failed to create: {failed_count} issues")
    print(f"📈 Total tasks: {len(tasks)}")
    
    # Summary by phase
    phases = {}
    for task in tasks:
        phase = task['phase']
        if phase not in phases:
            phases[phase] = {'total': 0, 'completed': 0, 'started': 0, 'backlog': 0}
        phases[phase]['total'] += 1
        phases[phase][task['state']] += 1
    
    print(f"\n📋 Summary by Phase:")
    for phase, counts in phases.items():
        print(f"  {phase}: {counts['total']} tasks "
              f"(✅ {counts.get('completed', 0)} done, 🔄 {counts.get('started', 0)} in progress, "
              f"⬜ {counts.get('backlog', 0)} backlog)")
    
    print(f"\n🎉 Migration Complete!")
    print(f"🌐 Access your project at: http://localhost:3000")
    print(f"🔧 API endpoint: http://localhost:8000/api/v1/workspaces/{plane.workspace_id}/projects/{plane.project_id}/")

if __name__ == "__main__":
    migrate_tasks_to_plane()