# Project Management Database Connection Instructions for cursor-gpt-4.1-max

## Overview

This document provides instructions for cursor-gpt-4.1-max to connect to and interact with the centralized Vikunja project management database.

## Database Details

- **System**: Vikunja (self-hosted project management)
- **Database**: PostgreSQL 
- **Access Method**: Docker containers + REST API
- **Location**: Local Docker setup in workflow-bolt project

## Connection Setup

### 1. Start the Vikunja System

```bash
cd /Users/ralfb.luknermdphd/PycharmProjects/workflow-bolt
./scripts/vikunja-docker.sh start
```

### 2. Access URLs

- **Vikunja Web Interface**: <http://localhost:3456>
- **API Endpoint**: <http://localhost:3456/api/v1>
- **Database**: PostgreSQL on localhost:5432

### 3. API Authentication

**API Token**: `tk_556fc1cf49295b3c8637506e57877c21f863ec16`
**Permissions**: Full access to all Vikunja features
**Expires**: October 3, 2025

### 4. API Usage Examples

#### Get All Projects

```bash
curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
     http://localhost:3456/api/v1/projects
```

#### Create New Task in Inbox Project

```bash
curl -X POST \
     -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
     -H "Content-Type: application/json" \
     -d '{"title":"New Task","description":"Task description","project_id":1}' \
     http://localhost:3456/api/v1/projects/1/tasks
```

#### Update Task Status

```bash
curl -X PUT \
     -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
     -H "Content-Type: application/json" \
     -d '{"done":true}' \
     http://localhost:3456/api/v1/tasks/TASK_ID
```

## Available Projects (Migrated from scattered files)

1. **Tebra Debug Dashboard Refactor** - Main dashboard improvements
2. **Redis Architecture Migration** - Event bus implementation  
3. **Security & Compliance** - HIPAA and security enhancements
4. **Authentication System** - Auth0 and Firebase integration
5. **Testing Framework** - Comprehensive testing strategy
6. **Documentation Organization** - Docs restructuring
7. **Performance Optimization** - App speed improvements
8. **Integration APIs** - External service connections
9. **Deployment & CI/CD** - Build and deployment automation

## Node.js Integration Script

Use this script for programmatic access:

```javascript
// scripts/vikunja-api.js
const axios = require('axios');

class VikunjaAPI {
  constructor(baseUrl = 'http://localhost:3456/api/v1', token = 'tk_556fc1cf49295b3c8637506e57877c21f863ec16') {
    this.baseUrl = baseUrl;
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getProjects() {
    const response = await axios.get(`${this.baseUrl}/projects`, { headers: this.headers });
    return response.data;
  }

  async createTask(projectId, task) {
    const response = await axios.post(
      `${this.baseUrl}/projects/${projectId}/tasks`, 
      task, 
      { headers: this.headers }
    );
    return response.data;
  }

  async updateTask(taskId, updates) {
    const response = await axios.put(
      `${this.baseUrl}/tasks/${taskId}`, 
      updates, 
      { headers: this.headers }
    );
    return response.data;
  }
}

module.exports = VikunjaAPI;
```

## Status Management

### Task Statuses

- `new` - Just created
- `in_progress` - Currently being worked on  
- `completed` - Finished successfully
- `blocked` - Waiting for dependencies
- `cancelled` - No longer needed

### Priority Levels

- `1` - Low priority
- `2` - Medium priority  
- `3` - High priority
- `4` - Urgent
- `5` - Critical

## Best Practices for cursor-gpt-4.1-max

1. **Always check project status** before creating new tasks
2. **Use descriptive task titles** with clear action items
3. **Set appropriate priorities** based on urgency and impact
4. **Update task progress** regularly with status changes
5. **Add detailed descriptions** for complex tasks
6. **Use labels/tags** for categorization (e.g., "bug", "feature", "documentation")
7. **Set due dates** for time-sensitive tasks
8. **Link related tasks** using dependencies

## Error Handling

If connection fails:

1. Check if Docker containers are running: `docker ps`
2. Restart Vikunja: `./scripts/vikunja-docker.sh restart`
3. Verify database is healthy: `./scripts/vikunja-docker.sh status`
4. Check logs: `./scripts/vikunja-docker.sh logs`

## Data Migration Status

✅ **Completed**: All scattered project plans migrated to Vikunja
✅ **Available**: 9 major projects with 25+ tasks ready
⏳ **Pending**: API token setup for automated access

## Next Steps for cursor-gpt-4.1-max

1. Set up API token using the web interface
2. Test connection with provided scripts
3. Begin project management tasks using the centralized system
4. Report any issues or needed improvements

---

**Note**: This system replaces the previous scattered markdown files and provides a proper project management workflow for all AI agents in the system.