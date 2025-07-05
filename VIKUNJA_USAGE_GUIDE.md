# 📝 How to Use Vikunja for AI Developers

## Overview
Vikunja is an open-source project management tool, similar to Trello or Asana, but self-hosted and script-friendly. In this project, it's used to track tasks, bugs, features, and project management items for AI development.

---

## 🚀 Quick Start

### Access Points
- **Web UI**: http://localhost:3456
- **CLI Tools**: `./ai-agents/cursor-gpt-4.1-max/scripts/`
- **API Token**: `tk_556fc1cf49295b3c8637506e57877c21f863ec16`

### Start Vikunja
```bash
./scripts/vikunja-docker.sh start
```

---

## 🛠️ Managing Tasks via CLI

### List Tasks
```bash
./ai-agents/cursor-gpt-4.1-max/scripts/manage-tasks.cjs list
```

### Add Task
```bash
./ai-agents/cursor-gpt-4.1-max/scripts/manage-tasks.cjs add "Fix authentication bug" "Debug Auth0 token validation" 4
```

### Mark Complete
```bash
./ai-agents/cursor-gpt-4.1-max/scripts/manage-tasks.cjs done 123
```

### Show Statistics
```bash
./ai-agents/cursor-gpt-4.1-max/scripts/manage-tasks.cjs stats
```

### Sync TODOs from Code
```bash
./ai-agents/cursor-gpt-4.1-max/scripts/manage-tasks.cjs sync
```

---

## 📊 Current Project Structure

### 🚨 Critical Projects
- **Critical Bugs & Fixes** (ID: 5) - Urgent issues requiring immediate attention
- **Auth0 Firebase Debug** (ID: 6) - Authentication system critical issues  
- **Tebra Integration Critical** (ID: 7) - High-priority Tebra EHR integration issues

### 📚 Supporting Projects
- **Documentation & Guides** (ID: 4) - Project documentation and setup instructions
- **cursor-gpt-4.1-max Tasks** (ID: 3) - AI agent specific tasks

---

## 🎯 Priority System

| Priority | Icon | Description | When to Use |
|----------|------|-------------|-------------|
| 5 | 🚨 | Critical | System down, blocking users |
| 4 | 🔴 | Urgent | Major bugs, security issues |
| 3 | 🟠 | High | Important features, improvements |
| 2 | 🟡 | Medium | Regular tasks, enhancements |
| 1 | 🔵 | Low | Nice-to-have, backlog items |

---

## 💡 Best Practices for AI Developers

### Create Tasks For:
- ✅ New features, experiments, or research spikes
- ✅ Bugs, test failures, or technical debt
- ✅ Infrastructure changes (e.g., Firebase, Docker, CI/CD)
- ✅ Documentation and compliance work
- ✅ Code TODOs and FIXMEs (automated via sync)

### Task Creation Guidelines:
- **Use clear, actionable titles** (e.g., "Refactor secureStorage for testability")
- **Add context in descriptions** (file names, error messages, logs)
- **Set appropriate priority** based on impact and urgency
- **Include file references** when relevant (e.g., `src/auth/AuthProvider.tsx:42`)

### Workflow:
1. **Start with Priority 5** (🚨 Critical) tasks first
2. **Mark tasks as done** immediately when completed  
3. **Review and organize** tasks regularly
4. **Use web UI** for complex task management
5. **Sync TODOs** from code periodically

---

## 🔄 Automation Features

### TODO Sync
Automatically finds and creates tasks from code comments:
```javascript
// TODO: Add input validation
// FIXME: Memory leak in event listeners  
```

### Project Organization
Run migration scripts to organize existing work:
```bash
./ai-agents/cursor-gpt-4.1-max/scripts/migrate-high-priority.cjs
```

---

## 🚨 Current Critical Tasks

Based on recent migrations, these critical tasks need immediate attention:

1. **Fix white screen dashboard issue** (Priority 5)
   - Dashboard shows blank screen - blocking user access
   - Check React context providers and component mounting

2. **Resolve Tebra sync runtime error** (Priority 5)  
   - `appointmentsArray` undefined error in `syncSchedule.js:154`
   - Causes sync failures

3. **Repair JWT verification failures** (Priority 5)
   - Auth0 token validation failing with 401 errors
   - Users cannot authenticate

4. **Fix Firebase callable function CORS errors** (Priority 4)
   - CORS 403 errors on tebraProxy function calls
   - Blocking Tebra integration

---

## 🔧 Troubleshooting

### If Tasks Look Wrong:
```bash
# Check current structure
./ai-agents/cursor-gpt-4.1-max/scripts/check-vikunja-projects.cjs

# Clean up if needed (future script)
./ai-agents/cursor-gpt-4.1-max/scripts/cleanup-tasks.cjs
```

### If Vikunja Won't Start:
```bash
./scripts/vikunja-docker.sh restart
./scripts/vikunja-docker.sh logs
```

### If API Calls Fail:
- Check if Vikunja is running: `./scripts/vikunja-docker.sh status`
- Verify API token in `VIKUNJA_QUICK_GUIDE.md`
- Test connection: `curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" http://localhost:3456/api/v1/projects`

---

## 📋 Integration with Development Workflow

### Commit Messages
Reference tasks in commits:
```bash
git commit -m "Fix Auth0 token validation - closes Vikunja task #2983"
```

### Code Comments
Link to tasks in code:
```javascript
// FIXME: Memory leak - tracked in Vikunja task #123
```

### Testing
Mark test-related tasks when running CI:
```bash
# After test failures
./ai-agents/cursor-gpt-4.1-max/scripts/manage-tasks.cjs add "Fix failing auth tests" "Jest tests failing in AuthProvider.test.tsx" 4
```

---

## 🤝 Collaboration

### Multi-User Setup
- Enable user registration in Vikunja web UI if needed
- Assign tasks to specific developers
- Use project sharing for team collaboration

### Task Assignment
```bash
# Via web UI: http://localhost:3456
# Assign tasks to team members
# Set due dates for time-sensitive work
```

---

## 📚 Additional Resources

- **Scripts Directory**: `./ai-agents/cursor-gpt-4.1-max/scripts/`
- **Connection Guide**: `./ai-agents/cursor-gpt-4.1-max/VIKUNJA_QUICK_GUIDE.md`
- **Project Documentation**: `./ai-agents/cursor-gpt-4.1-max/PROJECT_MANAGEMENT_DB_CONNECTION.md`
- **Vikunja Documentation**: https://vikunja.io/docs/

---

## 🎯 Next Steps

1. **Review critical tasks**: Visit http://localhost:3456 or run `manage-tasks.cjs list`
2. **Start with Priority 5 tasks**: Focus on critical bugs first
3. **Set up regular task review**: Weekly cleanup and organization
4. **Integrate with development workflow**: Reference tasks in commits and PRs

---

*This system replaces scattered markdown files and provides centralized project management for all AI agents and developers in the workflow-bolt project.*