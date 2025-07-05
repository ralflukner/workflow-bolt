#!/usr/bin/env node

// CLI tool for managing Vikunja tasks
const VikunjaAPI = require('./vikunja-api.cjs');

const DEFAULT_PROJECT_ID = 3; // cursor-gpt-4.1-max Tasks

async function listTasks() {
  const api = new VikunjaAPI();
  try {
    const tasks = await api.getTasks(DEFAULT_PROJECT_ID);
    const openTasks = tasks.filter(task => !task.done);
    
    console.log(`📋 Open tasks in cursor-gpt-4.1-max Tasks (${openTasks.length}):\n`);
    
    if (openTasks.length === 0) {
      console.log('✅ No open tasks');
      return;
    }
    
    openTasks.forEach(task => {
      const priority = ['', '🔵', '🟡', '🟠', '🔴', '🚨'][task.priority] || '';
      console.log(`${priority} [${task.id}] ${task.title}`);
      if (task.description) {
        console.log(`    ${task.description}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing tasks:', error.message);
  }
}

async function addTask(title, description = '', priority = 3) {
  const api = new VikunjaAPI();
  try {
    const task = await api.createTask(DEFAULT_PROJECT_ID, {
      title,
      description,
      priority: parseInt(priority)
    });
    console.log(`✅ Task created: "${task.title}" (ID: ${task.id})`);
  } catch (error) {
    console.error('❌ Error creating task:', error.message);
  }
}

async function markDone(taskId) {
  const api = new VikunjaAPI();
  try {
    const task = await api.updateTask(parseInt(taskId), { done: true });
    console.log(`✅ Task completed: "${task.title}"`);
  } catch (error) {
    console.error('❌ Error updating task:', error.message);
  }
}

function showUsage() {
  console.log(`
📝 Vikunja Task Manager

Usage:
  ./scripts/manage-tasks.cjs list
  ./scripts/manage-tasks.cjs add "Task Title" ["Description"] [priority]
  ./scripts/manage-tasks.cjs done TASK_ID

Examples:
  ./scripts/manage-tasks.cjs add "Fix auth bug" "Debug Auth0 token validation" 4
  ./scripts/manage-tasks.cjs done 7

Priority levels: 1=Low, 2=Medium, 3=High, 4=Urgent, 5=Critical
Web UI: http://localhost:3456
`);
}

// Main CLI handler
async function main() {
  const [,, command, ...args] = process.argv;
  
  switch (command) {
    case 'list':
      await listTasks();
      break;
    case 'add':
      if (!args[0]) {
        console.error('❌ Title required');
        showUsage();
        process.exit(1);
      }
      await addTask(args[0], args[1], args[2]);
      break;
    case 'done':
      if (!args[0]) {
        console.error('❌ Task ID required');
        showUsage();
        process.exit(1);
      }
      await markDone(args[0]);
      break;
    default:
      showUsage();
  }
}

if (require.main === module) {
  main();
}