#!/usr/bin/env python3

"""
GitHub Projects Migration Script
Converts all existing project plans into GitHub Issues for import into Projects v2
Author: Claude Code Assistant
Version: 1.0
Date: 2025-07-05
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

# Colors for output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def print_colored(message: str, color: str):
    print(f"{color}{message}{Colors.NC}")

def run_command(command: List[str]) -> str:
    """Run a command and return its output"""
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print_colored(f"❌ Command failed: {' '.join(command)}", Colors.RED)
        print_colored(f"Error: {e.stderr}", Colors.RED)
        return ""

def parse_action_plan() -> List[Dict[str, Any]]:
    """Parse ACTION_PLAN.md and extract tasks"""
    tasks = []
    
    action_plan_path = Path("ACTION_PLAN.md")
    if not action_plan_path.exists():
        print_colored("⚠️ ACTION_PLAN.md not found", Colors.YELLOW)
        return tasks
    
    content = action_plan_path.read_text()
    
    # Define tasks from ACTION_PLAN.md
    action_plan_tasks = [
        {
            "title": "Remove Unauthenticated Access from Cloud Functions",
            "body": "Remove `--allow-unauthenticated` flag from deploy scripts and implement IAM-based authentication",
            "phase": "Foundation Stabilization",
            "priority": "Critical",
            "owner": "DevOps Team",
            "agent": "Human Developer",
            "estimated_days": 1,
            "completion": 100,
            "status": "Done",
            "hipaa_impact": "High",
            "security_level": "Critical",
            "dependencies": "None"
        },
        {
            "title": "Secure CI/CD Authentication with OIDC",
            "body": "Update GitHub workflows to use OIDC/Workload Identity instead of long-lived service account keys",
            "phase": "Foundation Stabilization", 
            "priority": "Critical",
            "owner": "DevOps Team",
            "agent": "Human Developer",
            "estimated_days": 2,
            "completion": 100,
            "status": "Done",
            "hipaa_impact": "High",
            "security_level": "Critical",
            "dependencies": "None"
        },
        {
            "title": "Remove PHI from Source Code and Test Data",
            "body": "Conduct thorough audit to identify and remove all hard-coded PHI. Implement data masking for logs and synthetic test data",
            "phase": "Foundation Stabilization",
            "priority": "Critical", 
            "owner": "Security Team",
            "agent": "Human Developer",
            "estimated_days": 3,
            "completion": 100,
            "status": "Done",
            "hipaa_impact": "High",
            "security_level": "Critical",
            "dependencies": "None"
        },
        {
            "title": "Fix Initial TypeScript Build Errors",
            "body": "Address TypeScript errors in Dashboard.tsx, sync-today-debug.ts, and tebraDebugApi.ts",
            "phase": "Foundation Stabilization",
            "priority": "High",
            "owner": "Frontend Team",
            "agent": "Human Developer", 
            "estimated_days": 2,
            "completion": 100,
            "status": "Done",
            "hipaa_impact": "Low",
            "security_level": "None",
            "dependencies": "None"
        },
        {
            "title": "Triage All Test Failures",
            "body": "Review CODE_REVIEW_RESULTS.md section 9, categorize failures by type, and assign owners",
            "phase": "Testing Infrastructure",
            "priority": "High",
            "owner": "Backend Team",
            "agent": "Human Developer",
            "estimated_days": 3,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "Low",
            "security_level": "None",
            "dependencies": "Test environment setup"
        },
        {
            "title": "Fix Undefined Variables and Add Missing Mocks",
            "body": "Define all variables, add mocks for dependencies (BrowserController, megaParseSchedule.js)",
            "phase": "Testing Infrastructure",
            "priority": "High",
            "owner": "Backend Team",
            "agent": "Human Developer",
            "estimated_days": 3,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "None",
            "security_level": "None",
            "dependencies": "Test triage completion"
        },
        {
            "title": "Create Missing Operational Scripts",
            "body": "Implement health_dashboard.sh and safe_rollback.sh for monitoring and deployment rollback",
            "phase": "Foundation Stabilization",
            "priority": "High",
            "owner": "DevOps Team",
            "agent": "Human Developer",
            "estimated_days": 2,
            "completion": 50,
            "status": "In Progress",
            "hipaa_impact": "Medium",
            "security_level": "Medium",
            "dependencies": "Monitoring infrastructure"
        },
        {
            "title": "Create Automated Deployment Workflow",
            "body": "Implement deploy.yml GitHub workflow for automated Cloud Functions deployment",
            "phase": "Foundation Stabilization",
            "priority": "High",
            "owner": "DevOps Team",
            "agent": "Human Developer",
            "estimated_days": 3,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "Medium", 
            "security_level": "High",
            "dependencies": "OIDC authentication setup"
        },
        {
            "title": "Implement Dependency Vulnerability Scanning",
            "body": "Integrate pip-audit or safety into CI/CD pipeline for vulnerability detection",
            "phase": "Security & Compliance",
            "priority": "High",
            "owner": "Security Team", 
            "agent": "Human Developer",
            "estimated_days": 2,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "Medium",
            "security_level": "High",
            "dependencies": "CI/CD pipeline setup"
        },
        {
            "title": "Establish HIPAA Compliance Baseline",
            "body": "Create hipaa_function Terraform module and hipaa-enforcement.sentinel policy",
            "phase": "Security & Compliance",
            "priority": "High",
            "owner": "Security Team",
            "agent": "Human Developer",
            "estimated_days": 5,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "High",
            "security_level": "Critical",
            "dependencies": "Terraform infrastructure"
        }
    ]
    
    tasks.extend(action_plan_tasks)
    return tasks

def parse_redis_plan() -> List[Dict[str, Any]]:
    """Parse Redis integration plan and extract tasks"""
    tasks = []
    
    redis_plan_tasks = [
        {
            "title": "Create Production Redis Client Module",
            "body": "Implement shared Redis client with connection pooling, health checks, and fallback handling in functions/shared/redis_client.py",
            "phase": "Redis Migration",
            "priority": "High",
            "owner": "Backend Team",
            "agent": "Human Developer",
            "estimated_days": 2,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "Medium",
            "security_level": "Medium",
            "dependencies": "VPC connector setup"
        },
        {
            "title": "Create Redis Client Unit and Integration Tests",
            "body": "Implement comprehensive test suite for Redis client including mocking and real connection tests",
            "phase": "Redis Migration",
            "priority": "High",
            "owner": "Backend Team", 
            "agent": "Human Developer",
            "estimated_days": 1,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "Low",
            "security_level": "None",
            "dependencies": "Redis client module"
        },
        {
            "title": "Migrate Functions to Shared Redis Client",
            "body": "Refactor tebra_debug, patient_sync, and other functions to use shared Redis client",
            "phase": "Redis Migration",
            "priority": "High",
            "owner": "Backend Team",
            "agent": "Human Developer", 
            "estimated_days": 3,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "Medium",
            "security_level": "Medium",
            "dependencies": "Redis client module, tests"
        },
        {
            "title": "Add Redis Health Endpoints",
            "body": "Implement /redis-health endpoints using RedisClient.health_check() for monitoring",
            "phase": "Redis Migration",
            "priority": "Medium",
            "owner": "Backend Team",
            "agent": "Human Developer",
            "estimated_days": 1,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "Low",
            "security_level": "Low",
            "dependencies": "Redis client migration"
        },
        {
            "title": "Deploy and Validate Redis Integration",
            "body": "Deploy functions with VPC connector and validate Redis connectivity in production",
            "phase": "Redis Migration",
            "priority": "High",
            "owner": "DevOps Team",
            "agent": "Human Developer",
            "estimated_days": 2,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "Medium",
            "security_level": "Medium", 
            "dependencies": "Function migration, health endpoints"
        },
        {
            "title": "Create Redis Monitoring and Alert Policies",
            "body": "Use Terraform to create alert policies for Redis connection failures and high latency",
            "phase": "Redis Migration",
            "priority": "Medium",
            "owner": "DevOps Team",
            "agent": "Human Developer",
            "estimated_days": 2,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "Low",
            "security_level": "Low",
            "dependencies": "Redis deployment"
        },
        {
            "title": "Implement GitHub Actions for Redis Functions",
            "body": "Add .github/workflows/deploy-functions.yml to automate testing, deployment, and validation",
            "phase": "Redis Migration",
            "priority": "Medium", 
            "owner": "DevOps Team",
            "agent": "Human Developer",
            "estimated_days": 2,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "Low",
            "security_level": "Medium",
            "dependencies": "Monitoring setup"
        }
    ]
    
    tasks.extend(redis_plan_tasks)
    return tasks

def parse_security_tasks() -> List[Dict[str, Any]]:
    """Add security and endpoint authentication tasks"""
    tasks = []
    
    security_tasks = [
        {
            "title": "Endpoint Authentication Security Audit",
            "body": "Comprehensive audit of all Firebase Functions and Cloud Run services for proper authentication",
            "phase": "Security & Compliance",
            "priority": "Critical",
            "owner": "Security Team",
            "agent": "Claude Code",
            "estimated_days": 1,
            "completion": 100,
            "status": "Done",
            "hipaa_impact": "High",
            "security_level": "Critical",
            "dependencies": "None"
        },
        {
            "title": "Implement Standardized Auth Middleware",
            "body": "Create and deploy requireAuth middleware for all HTTP endpoints handling PHI",
            "phase": "Security & Compliance",
            "priority": "Critical",
            "owner": "Security Team",
            "agent": "Claude Code",
            "estimated_days": 1,
            "completion": 100,
            "status": "Done",
            "hipaa_impact": "High",
            "security_level": "Critical",
            "dependencies": "Security audit"
        },
        {
            "title": "Add Security Headers to All Endpoints",
            "body": "Implement OWASP-recommended security headers across all services",
            "phase": "Security & Compliance",
            "priority": "High",
            "owner": "Security Team",
            "agent": "Claude Code",
            "estimated_days": 0.5,
            "completion": 100,
            "status": "Done",
            "hipaa_impact": "Medium",
            "security_level": "High",
            "dependencies": "Auth middleware"
        },
        {
            "title": "Create Automated Security Scanner",
            "body": "Develop comprehensive endpoint security scanner script for regular audits",
            "phase": "Security & Compliance",
            "priority": "High",
            "owner": "Security Team",
            "agent": "Claude Code",
            "estimated_days": 1,
            "completion": 100,
            "status": "Done",
            "hipaa_impact": "Medium",
            "security_level": "High",
            "dependencies": "Security infrastructure"
        },
        {
            "title": "Weekly Security Scanning Schedule",
            "body": "Set up automated weekly security scans and alerting for endpoint vulnerabilities",
            "phase": "Security & Compliance",
            "priority": "Medium",
            "owner": "DevOps Team",
            "agent": "Human Developer",
            "estimated_days": 1,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "Medium",
            "security_level": "Medium",
            "dependencies": "Security scanner"
        }
    ]
    
    tasks.extend(security_tasks)
    return tasks

def parse_documentation_tasks() -> List[Dict[str, Any]]:
    """Add documentation and process improvement tasks"""
    tasks = []
    
    doc_tasks = [
        {
            "title": "Consolidate Project Management Plans",
            "body": "Merge all existing planning documents into unified GitHub Projects v2 database",
            "phase": "Documentation & Process",
            "priority": "High",
            "owner": "DevOps Team",
            "agent": "Claude Code",
            "estimated_days": 1,
            "completion": 75,
            "status": "In Progress",
            "hipaa_impact": "None",
            "security_level": "None",
            "dependencies": "GitHub Projects setup"
        },
        {
            "title": "Update CLAUDE.md Architecture Documentation",
            "body": "Update project documentation to reflect current Redis-first architecture and multi-agent workflow",
            "phase": "Documentation & Process",
            "priority": "Medium",
            "owner": "DevOps Team", 
            "agent": "Claude Code",
            "estimated_days": 2,
            "completion": 50,
            "status": "In Progress",
            "hipaa_impact": "None",
            "security_level": "None",
            "dependencies": "Project consolidation"
        },
        {
            "title": "Create Multi-Agent Coordination Documentation",
            "body": "Document the multi-agent development workflow and communication protocols",
            "phase": "Documentation & Process",
            "priority": "Medium",
            "owner": "DevOps Team",
            "agent": "Multi-Agent",
            "estimated_days": 2,
            "completion": 25,
            "status": "Todo",
            "hipaa_impact": "None",
            "security_level": "None",
            "dependencies": "Agent coordination system"
        },
        {
            "title": "Setup API Integration for Agent Updates",
            "body": "Create GitHub Projects API integration for automated status updates from agents",
            "phase": "Documentation & Process",
            "priority": "Medium",
            "owner": "Backend Team",
            "agent": "Human Developer",
            "estimated_days": 3,
            "completion": 0,
            "status": "Todo",
            "hipaa_impact": "None",
            "security_level": "Low",
            "dependencies": "GitHub Projects setup"
        }
    ]
    
    tasks.extend(doc_tasks)
    return tasks

def create_github_issues(tasks: List[Dict[str, Any]]) -> None:
    """Create GitHub issues for all tasks"""
    print_colored("📝 Creating GitHub Issues from Tasks", Colors.BLUE)
    
    created_count = 0
    for task in tasks:
        # Create issue body with metadata
        body = f"""{task['body']}

## Project Metadata
- **Phase**: {task['phase']}
- **Priority**: {task['priority']}
- **Owner**: {task['owner']}
- **Agent Assignment**: {task['agent']}
- **Estimated Days**: {task['estimated_days']}
- **Completion**: {task['completion']}%
- **HIPAA Impact**: {task['hipaa_impact']}
- **Security Level**: {task['security_level']}
- **Dependencies**: {task['dependencies']}

## Labels
- phase:{task['phase'].lower().replace(' ', '-')}
- priority:{task['priority'].lower()}
- owner:{task['owner'].lower().replace(' ', '-')}
- agent:{task['agent'].lower().replace(' ', '-')}
- hipaa:{task['hipaa_impact'].lower()}
- security:{task['security_level'].lower()}
"""
        
        # Create labels for the issue
        labels = [
            f"phase:{task['phase'].lower().replace(' ', '-')}",
            f"priority:{task['priority'].lower()}",
            f"owner:{task['owner'].lower().replace(' ', '-')}",
            f"agent:{task['agent'].lower().replace(' ', '-')}",
            f"hipaa:{task['hipaa_impact'].lower()}",
            f"security:{task['security_level'].lower()}"
        ]
        
        # Add status-based labels
        if task['status'] == 'Done':
            labels.append('status:done')
        elif task['status'] == 'In Progress':
            labels.append('status:in-progress')
        else:
            labels.append('status:todo')
        
        label_args = []
        for label in labels:
            label_args.extend(['-l', label])
        
        # Create the issue
        command = [
            'gh', 'issue', 'create',
            '--title', task['title'],
            '--body', body
        ] + label_args
        
        try:
            result = run_command(command)
            if result:
                created_count += 1
                print_colored(f"✅ Created: {task['title']}", Colors.GREEN)
            else:
                print_colored(f"❌ Failed to create: {task['title']}", Colors.RED)
        except Exception as e:
            print_colored(f"❌ Error creating {task['title']}: {e}", Colors.RED)
    
    print_colored(f"📊 Created {created_count} GitHub issues", Colors.BLUE)

def main():
    """Main migration function"""
    print_colored("🚀 Migrating Project Plans to GitHub Issues", Colors.BLUE)
    print_colored("=" * 50, Colors.BLUE)
    
    # Check if we're in the right directory
    if not Path("ACTION_PLAN.md").exists():
        print_colored("❌ Please run this script from the project root directory", Colors.RED)
        sys.exit(1)
    
    # Parse all plans
    print_colored("📖 Parsing existing project plans...", Colors.BLUE)
    all_tasks = []
    all_tasks.extend(parse_action_plan())
    all_tasks.extend(parse_redis_plan())
    all_tasks.extend(parse_security_tasks())
    all_tasks.extend(parse_documentation_tasks())
    
    print_colored(f"📊 Found {len(all_tasks)} tasks across all plans", Colors.GREEN)
    
    # Summary by phase
    phases = {}
    for task in all_tasks:
        phase = task['phase']
        if phase not in phases:
            phases[phase] = {'total': 0, 'done': 0, 'in_progress': 0, 'todo': 0}
        phases[phase]['total'] += 1
        phases[phase][task['status'].lower().replace(' ', '_')] += 1
    
    print_colored("\n📋 Summary by Phase:", Colors.BLUE)
    for phase, counts in phases.items():
        print(f"  {phase}: {counts['total']} tasks "
              f"(✅ {counts['done']} done, 🔄 {counts['in_progress']} in progress, "
              f"⬜ {counts['todo']} todo)")
    
    # Create GitHub issues
    print_colored(f"\n🚀 Creating GitHub issues...", Colors.BLUE)
    create_github_issues(all_tasks)
    
    # Generate summary report
    print_colored("\n📊 Migration Summary:", Colors.GREEN)
    print_colored("=" * 30, Colors.GREEN)
    print(f"Total tasks migrated: {len(all_tasks)}")
    print(f"Phases covered: {len(phases)}")
    print("\nNext steps:")
    print("1. Go to your GitHub repository issues page")
    print("2. Add the issues to your GitHub Project")
    print("3. Configure the project views and automation")
    print("4. Set up API integration for agent updates")

if __name__ == "__main__":
    main()