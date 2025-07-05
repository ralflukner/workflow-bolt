# Vikunja Project Management - Quick Guide for AI Agents

## API Access
**Token**: `tk_556fc1cf49295b3c8637506e57877c21f863ec16`  
**Base URL**: `http://localhost:3456/api/v1`

## Quick Commands

### Get Projects
```bash
curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" http://localhost:3456/api/v1/projects
```

### Create Task
```bash
curl -X PUT -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{"title":"Task Name","description":"Task details","priority":3}' \
  http://localhost:3456/api/v1/projects/3/tasks
```

### Update Task
```bash
curl -X POST -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{"done":true}' \
  http://localhost:3456/api/v1/tasks/TASK_ID
```

## Node.js Integration
```javascript
const VikunjaAPI = require('./scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

// Create task
await api.createTask(3, {title: "New Task", priority: 3});

// Get projects
const projects = await api.getProjects();

// Mark task complete
await api.updateTask(taskId, {done: true});
```

## Project IDs
- **Inbox**: 1
- **workflow bolt**: 2  
- **cursor-gpt-4.1-max Tasks**: 3

## Priority Levels
1=Low, 2=Medium, 3=High, 4=Urgent, 5=Critical

Web UI: http://localhost:3456