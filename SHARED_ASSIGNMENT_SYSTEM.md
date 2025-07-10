# Shared Task Assignment System for Vikunja

## Universal Tools for Multi-Agent/Human Collaboration

### Overview

This system provides universal task assignment and completion tools that work for all agents and humans sharing the Vikunja project management system.

---

## ✅ **Universal Assignment Tool**

**Script**: `./ai-agents/cursor-gpt-4.1-max/scripts/assign-task.cjs`

### Usage

```bash
./assign-task.cjs TASK_ID AGENT_NAME [STATUS] [CATEGORY] [PRIORITY]
```

### Examples

```bash
# Assign task to cursor-claude-sonnet
./assign-task.cjs 3014 cursor-claude-sonnet in-progress

# Assign to drlukner with review status and documentation category
./assign-task.cjs 3015 drlukner review documentation high

# Assign critical bug to cursor-gpt-4.1-max
./assign-task.cjs 3016 cursor-gpt-4.1-max todo bug critical
```

### Available Agents/Users

- `cursor-claude-sonnet` - AI agent (code analysis, documentation, architecture)
- `cursor-gpt-4.1-max` - AI agent (implementation, debugging, testing)
- `drlukner` - Human user (project oversight, medical domain expertise)

---

## ✅ **Universal Completion Tool**

**Script**: `./ai-agents/cursor-gpt-4.1-max/scripts/complete-task.cjs`

### Usage

```bash
./complete-task.cjs TASK_ID AGENT_NAME [COMPLETION_NOTES]
```

### Examples

```bash
# Complete task with notes
./complete-task.cjs 3014 cursor-claude-sonnet "Successfully implemented inter-agent protocols"

# Complete task without notes
./complete-task.cjs 3015 drlukner
```

---

## 📋 **Simple Assignment Tool** (Fallback)

**Script**: `./ai-agents/cursor-gpt-4.1-max/scripts/simple-assign.cjs`

When the full label system has API issues, use this description-based assignment:

```bash
./simple-assign.cjs TASK_ID AGENT_NAME [STATUS]
```

---

## 🏗️ **Project Structure**

### Agent/User Projects

- **cursor-claude-sonnet Tasks** (ID: 10) - AI agent personal tasks
- **cursor-gpt-4.1-max Tasks** (ID: 3) - AI agent personal tasks  
- **drlukner Tasks** (ID: 11) - Human user tasks
- **Shared Agent Tasks** (ID: 9) - Cross-cutting coordination tasks

### Shared Projects

- **Critical Bugs & Fixes** (ID: 5) - Urgent system issues
- **Auth0 Firebase Debug** (ID: 6) - Authentication system
- **Tebra Integration Critical** (ID: 7) - Medical records integration
- **Documentation & Guides** (ID: 4) - Project documentation

---

## 🎯 **Assignment Workflow**

### 1. For Any Agent/User

```bash
# Assign task
./assign-task.cjs TASK_ID AGENT_NAME STATUS

# Work on task (implementation depends on agent)

# Complete task  
./complete-task.cjs TASK_ID AGENT_NAME "Completion details"
```

### 2. Cross-Project Coordination

- Tasks can reference related projects in descriptions
- Use "Related projects: ID1, ID2" format
- Use "Related agents: agent1, agent2" format

### 3. Status Tracking

- **todo** - Ready to start
- **in-progress** - Currently working
- **review** - Ready for review
- **testing** - In testing phase
- **done** - Completed
- **blocked** - Waiting on dependencies

---

## 🏷️ **Label System** (Enhanced API)

When the enhanced Vikunja API is fully working, the system supports:

### Agent Labels

- `agent:cursor-claude-sonnet` (purple)
- `agent:cursor-gpt-4.1-max` (blue)
- `agent:drlukner` (green)

### Status Labels

- `status:todo` (gray)
- `status:in-progress` (blue)
- `status:review` (orange)
- `status:testing` (purple)
- `status:done` (green)
- `status:blocked` (red)

### Category Labels

- `category:bug` (red)
- `category:feature` (green)
- `category:refactor` (blue)
- `category:documentation` (purple)
- `category:testing` (orange)
- `category:infrastructure` (indigo)
- `category:security` (red)
- `category:performance` (green)

### Priority Labels

- `priority:critical` (dark red)
- `priority:high` (orange)
- `priority:medium` (yellow)
- `priority:low` (green)

---

## 📊 **Shared Workflows**

### Task Assignment Examples

1. **drlukner assigns review task to cursor-claude-sonnet:**
   ```bash
   ./assign-task.cjs 3015 cursor-claude-sonnet review documentation medium
   ```

2. **cursor-gpt-4.1-max takes on a critical bug:**
   ```bash
   ./assign-task.cjs 2980 cursor-gpt-4.1-max in-progress bug critical
   ```

3. **cursor-claude-sonnet completes documentation:**
   ```bash
   ./complete-task.cjs 3015 cursor-claude-sonnet "Updated architecture documentation with latest system design"
   ```

### Inter-Agent Coordination

1. **Handoff Pattern:**
   ```bash
   # Agent 1 completes their part
   ./complete-task.cjs 123 cursor-claude-sonnet "Analysis complete, ready for implementation"
   
   # Agent 2 takes over
   ./assign-task.cjs 124 cursor-gpt-4.1-max in-progress implementation
   ```

2. **Review Pattern:**
   ```bash
   # Implementation agent completes
   ./complete-task.cjs 125 cursor-gpt-4.1-max "Implementation complete, ready for review"
   
   # Review by human or senior agent
   ./assign-task.cjs 125 drlukner review
   ```

---

## 🚀 **Getting Started**

### For Any New Agent/User

1. **Check available tasks:**
   ```bash
   ./agent-tasks.cjs list [AGENT_NAME]
   ```

2. **Assign yourself a task:**
   ```bash
   ./assign-task.cjs TASK_ID YOUR_NAME in-progress
   ```

3. **Complete the task:**
   ```bash
   ./complete-task.cjs TASK_ID YOUR_NAME "What you accomplished"
   ```

### For Project Coordination

1. **Create cross-project task:**
   ```bash
   ./manage-tasks.cjs add "Task Title" "Description with Related projects: 5, 6 Related agents: all"
   ```

2. **Assign to appropriate agent:**
   ```bash
   ./assign-task.cjs NEW_TASK_ID BEST_AGENT todo
   ```

---

## 📈 **Benefits of Shared System**

✅ **Universal tools** - Work for all agents and humans  
✅ **Clear ownership** - Every task has a designated assignee  
✅ **Status tracking** - Real-time progress visibility  
✅ **Cross-project coordination** - Tasks can span multiple projects  
✅ **Handoff support** - Easy task transfer between agents  
✅ **Audit trail** - Complete assignment and completion history  
✅ **Flexible assignment** - Support for any agent name as argument  

---

## 🔧 **Troubleshooting**

### If Enhanced API Labels Don't Work

- Use `simple-assign.cjs` for description-based assignment
- Assignment info stored in task descriptions
- Still provides full audit trail and ownership tracking

### If Task Assignment Fails

- Check that agent name is valid: `cursor-claude-sonnet`, `cursor-gpt-4.1-max`, `drlukner`
- Verify task ID exists: `./debug-labels.cjs TASK_ID`
- Use fallback: `./simple-assign.cjs TASK_ID AGENT_NAME STATUS`

### For New Agents

- Add agent to valid agents list in scripts
- Create agent-specific project if needed
- Update documentation with new agent capabilities

---

**Last Updated**: 2025-07-05  
**System Status**: ✅ Operational with universal assignment tools  
**Next Enhancement**: Full label API integration when Vikunja API is stable  

*This system enables seamless collaboration between AI agents and human users in the workflow-bolt project management environment.*
