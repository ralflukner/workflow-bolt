#!/bin/bash

# 🚀 GitHub Projects v2 Setup Script
# Sets up collaborative project management database for Workflow Bolt
# Author: Claude Code Assistant
# Version: 1.0
# Date: 2025-07-05

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 GitHub Projects v2 Setup for Workflow Bolt${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# Check if gh CLI is available and authenticated
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

echo -e "${BLUE}1. Checking GitHub Authentication${NC}"
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"

# Get current repository info
REPO_OWNER=$(gh repo view --json owner --jq '.owner.login')
REPO_NAME=$(gh repo view --json name --jq '.name')
echo "Repository: $REPO_OWNER/$REPO_NAME"

echo ""
echo -e "${BLUE}2. Creating GitHub Project${NC}"

# Try to create project with required scopes
if gh project create --title "Workflow Bolt Master Plan" --owner "$REPO_OWNER" 2>/dev/null; then
    echo -e "${GREEN}✅ Project created successfully${NC}"
    PROJECT_NUMBER=$(gh project list --owner "$REPO_OWNER" --format json | jq -r '.projects[] | select(.title == "Workflow Bolt Master Plan") | .number')
    echo "Project number: $PROJECT_NUMBER"
else
    echo -e "${YELLOW}⚠️  Automatic project creation failed${NC}"
    echo ""
    echo -e "${BLUE}Manual Setup Required:${NC}"
    echo "1. Go to: https://github.com/$REPO_OWNER?tab=projects"
    echo "2. Click 'New project' → 'Project (beta)'"
    echo "3. Name: 'Workflow Bolt Master Plan'"
    echo "4. Description: 'Consolidated project management database for multi-agent development'"
    echo ""
    echo -e "${YELLOW}After creating the project manually, run this script again.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}3. Setting Up Custom Fields${NC}"

# Note: GitHub CLI doesn't support custom fields yet, so we'll document them
cat > /tmp/github-project-fields.md << 'EOF'
# GitHub Project Custom Fields Setup

## Required Custom Fields (Add these manually in the GitHub web interface):

### 1. Phase
- **Type**: Single select
- **Options**: 
  - Foundation Stabilization
  - Redis Migration
  - Security & Compliance
  - Documentation & Process
  - Performance Optimization
  - Testing Infrastructure

### 2. Priority
- **Type**: Single select  
- **Options**:
  - Critical
  - High
  - Medium
  - Low

### 3. Owner
- **Type**: Single select
- **Options**:
  - DevOps Team
  - Backend Team
  - Security Team
  - Frontend Team
  - Agent: Claude
  - Agent: o3-MAX
  - Agent: Gemini
  - Agent: Sider.AI
  - Agent: Opus

### 4. Agent Assignment
- **Type**: Single select
- **Options**:
  - Human Developer
  - Claude Code
  - o3-MAX
  - Gemini
  - Sider.AI
  - Opus
  - Multi-Agent

### 5. Estimated Days
- **Type**: Number
- **Description**: Estimated effort in days

### 6. Completion Percentage
- **Type**: Number
- **Description**: 0-100% completion

### 7. Dependencies
- **Type**: Text
- **Description**: Links to other issues or dependencies

### 8. Sprint
- **Type**: Number
- **Description**: Sprint/iteration number

### 9. HIPAA Impact
- **Type**: Single select
- **Options**:
  - High (PHI handling)
  - Medium (Security-related)
  - Low (No PHI impact)
  - None

### 10. Security Level
- **Type**: Single select
- **Options**:
  - Critical (Security vulnerability)
  - High (Security hardening)
  - Medium (Security improvement)
  - Low (Minor security)
  - None
EOF

echo -e "${YELLOW}📋 Custom fields configuration saved to: /tmp/github-project-fields.md${NC}"
echo ""
echo -e "${BLUE}Manual step required:${NC}"
echo "1. Open your project: https://github.com/users/$REPO_OWNER/projects/$PROJECT_NUMBER"
echo "2. Click Settings (gear icon)"
echo "3. Add the custom fields listed in /tmp/github-project-fields.md"
echo ""

echo -e "${BLUE}4. Creating Project Views${NC}"

cat > /tmp/github-project-views.md << 'EOF'
# GitHub Project Views Setup

## Recommended Views (Create these manually):

### 1. Kanban by Status (Default)
- **Type**: Board
- **Group by**: Status
- **Sort by**: Priority (High to Low)

### 2. Phase Planning
- **Type**: Table
- **Group by**: Phase
- **Sort by**: Priority, then Estimated Days
- **Columns**: Title, Owner, Priority, Estimated Days, Dependencies

### 3. Agent Workload
- **Type**: Table
- **Group by**: Agent Assignment
- **Sort by**: Priority
- **Filter**: Status != Done
- **Columns**: Title, Phase, Priority, Completion Percentage, Owner

### 4. Security Focus
- **Type**: Board
- **Group by**: Security Level
- **Filter**: Security Level != None
- **Sort by**: Priority

### 5. Sprint Planning
- **Type**: Table
- **Group by**: Sprint
- **Filter**: Status != Done
- **Sort by**: Priority
- **Columns**: Title, Owner, Estimated Days, Dependencies, Completion Percentage

### 6. HIPAA Compliance
- **Type**: Table
- **Filter**: HIPAA Impact = High OR Medium
- **Sort by**: Priority
- **Columns**: Title, HIPAA Impact, Security Level, Owner, Status

### 7. Roadmap Timeline
- **Type**: Roadmap
- **Group by**: Phase
- **Date field**: Target completion (if available)
EOF

echo -e "${YELLOW}📋 Project views configuration saved to: /tmp/github-project-views.md${NC}"

echo ""
echo -e "${BLUE}5. Setting Up Automation Workflows${NC}"

cat > /tmp/github-project-automation.md << 'EOF'
# GitHub Project Automation Setup

## Recommended Automation Rules (Create these in Project Settings → Workflows):

### 1. Auto-move on PR merge
- **Trigger**: Pull request merged
- **Action**: Move linked items to "Done"
- **Additional**: Set Completion Percentage to 100

### 2. High priority notification
- **Trigger**: Item created with Priority = Critical
- **Action**: Add label "urgent"
- **Additional**: Assign to project maintainer

### 3. Agent assignment notification
- **Trigger**: Agent Assignment changed
- **Action**: Add corresponding label (e.g., "agent:claude")

### 4. Security alert
- **Trigger**: Security Level = Critical
- **Action**: Add label "security-critical"
- **Additional**: Assign to Security Team

### 5. HIPAA compliance check
- **Trigger**: HIPAA Impact = High
- **Action**: Add label "hipaa-critical"
- **Additional**: Require security review

### 6. Blocked item escalation
- **Trigger**: Status = Blocked for > 2 days
- **Action**: Add label "escalate"
- **Additional**: Notify project leads
EOF

echo -e "${YELLOW}📋 Automation workflows saved to: /tmp/github-project-automation.md${NC}"

echo ""
echo -e "${GREEN}✅ GitHub Project setup documentation created!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Complete manual setup using the generated configuration files"
echo "2. Run the migration script to import existing tasks"
echo "3. Set up API integration for multi-agent updates"
echo ""
echo -e "${YELLOW}Configuration files created:${NC}"
echo "- /tmp/github-project-fields.md"
echo "- /tmp/github-project-views.md" 
echo "- /tmp/github-project-automation.md"