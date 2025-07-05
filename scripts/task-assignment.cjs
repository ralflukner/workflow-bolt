#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

const VIKUNJA_IMPROVEMENT_PROJECT_ID = 8;

// Available agents/users for assignment
const AVAILABLE_AGENTS = [
  'cursor-gpt-4.1-max',
  'claude',
  'gemini',
  'chatgpt',
  'poe-opus',
  'o3-max',
  'sider-ai',
  'luknerlumina'
];

async function assignTask(taskId, agentName) {
  try {
    if (!AVAILABLE_AGENTS.includes(agentName)) {
      console.log(`❌ Invalid agent name. Available agents: ${AVAILABLE_AGENTS.join(', ')}`);
      return;
    }

    const tasks = await api.getTasks(VIKUNJA_IMPROVEMENT_PROJECT_ID);
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.log(`❌ Task ${taskId} not found`);
      return;
    }

    const updatedDescription = `${task.description}

**ASSIGNMENT:**
- **Assigned To**: ${agentName}
- **Assigned Date**: ${new Date().toISOString()}
- **Status**: In Progress
- **Notes**: This task is assigned to ${agentName} agent for implementation.`;

    await api.updateTask(taskId, {
      description: updatedDescription
    });

    console.log(`✅ Task ${taskId} assigned to ${agentName}`);
    console.log(`📋 Task: ${task.title}`);
    
  } catch (error) {
    console.error('Failed to assign task:', error.message);
  }
}

async function showMyTasks(agentName) {
  try {
    const tasks = await api.getTasks(VIKUNJA_IMPROVEMENT_PROJECT_ID);
    const myTasks = tasks.filter(t => 
      !t.done && 
      t.description && 
      t.description.includes(`Assigned To: ${agentName}`)
    );

    console.log(`\n=== TASKS ASSIGNED TO ${agentName.toUpperCase()} ===`);
    
    if (myTasks.length === 0) {
      console.log('No tasks currently assigned to you.');
      return;
    }

    myTasks.forEach((task, index) => {
      console.log(`\n${index + 1}. [${task.priority}] ${task.title}`);
      console.log(`   ID: ${task.id}`);
      
      // Extract assignment info
      const assignmentMatch = task.description.match(/Assigned Date: (.+)/);
      if (assignmentMatch) {
        console.log(`   Assigned: ${assignmentMatch[1]}`);
      }
    });

    console.log(`\n📊 Total tasks assigned: ${myTasks.length}`);
    
  } catch (error) {
    console.error('Failed to fetch tasks:', error.message);
  }
}

async function listAvailableAgents() {
  console.log('\n=== AVAILABLE AGENTS ===');
  AVAILABLE_AGENTS.forEach((agent, index) => {
    console.log(`${index + 1}. ${agent}`);
  });
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  
  switch (cmd) {
    case 'assign':
      if (args.length < 2) {
        console.log('Usage: ./scripts/task-assignment.cjs assign <task_id> <agent_name>');
        console.log('Example: ./scripts/task-assignment.cjs assign 3009 cursor-gpt-4.1-max');
        return;
      }
      await assignTask(parseInt(args[0]), args[1]);
      break;
      
    case 'my-tasks':
      const agentName = args[0] || 'cursor-gpt-4.1-max';
      await showMyTasks(agentName);
      break;
      
    case 'agents':
      await listAvailableAgents();
      break;
      
    default:
      console.log('Usage:');
      console.log('  ./scripts/task-assignment.cjs assign <task_id> <agent_name>  # Assign task to agent');
      console.log('  ./scripts/task-assignment.cjs my-tasks [agent_name]         # Show tasks assigned to agent');
      console.log('  ./scripts/task-assignment.cjs agents                         # List available agents');
      console.log('\nExamples:');
      console.log('  ./scripts/task-assignment.cjs assign 3009 cursor-gpt-4.1-max');
      console.log('  ./scripts/task-assignment.cjs my-tasks cursor-gpt-4.1-max');
  }
}

main(); 