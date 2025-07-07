#!/usr/bin/env node

// CLI for managing Vikunja tasks for workflow-bolt
const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

const DEFAULT_PROJECT_ID = 3; // Default to cursor-gpt-4.1-max Tasks

async function listTasks(projectId) {
  const tasks = await api.getTasks(projectId);
  if (!tasks.length) {
    console.log('No open tasks.');
    return;
  }
  console.log('Open tasks:');
  for (const t of tasks) {
    if (!t.done) {
      console.log(`- [${t.id}] ${t.title} (priority: ${t.priority})`);
    }
  }
}

async function addTask(projectId, title, description = '', priority = 3) {
  const task = await api.createTask(projectId, { title, description, priority: Number(priority) });
  console.log('Created task:', task.id, task.title);
}

async function markDone(projectId, taskId) {
  // Note: Vikunja API updateTask does not require project ID for task updates
  await api.updateTask(taskId, { done: true });
  console.log('Marked task', taskId, 'as done.');
}

async function main() {
  let rawArgs = process.argv.slice(2);
  let projectId = DEFAULT_PROJECT_ID;
  let cmd;
  let args;

  // Check if the first argument is a project ID (numeric)
  if (rawArgs.length > 0 && !isNaN(parseInt(rawArgs[0]))) {
    projectId = parseInt(rawArgs[0]);
    cmd = rawArgs[1]; // The command is the second argument
    args = rawArgs.slice(2); // Remaining arguments
  } else {
    cmd = rawArgs[0]; // The command is the first argument
    args = rawArgs.slice(1); // Remaining arguments
  }

  if (cmd === 'list') {
    await listTasks(projectId);
  } else if (cmd === 'add') {
    const [title, description, priority] = args;
    if (!title) {
      console.log('Usage: add "Task Title" "Description" [priority]');
      return;
    }
    await addTask(projectId, title, description, priority);
  } else if (cmd === 'done') {
    const [taskId] = args;
    if (!taskId) {
      console.log('Usage: done TASK_ID');
      return;
    }
    await markDone(projectId, taskId);
  } else {
    console.log('Usage: manage-tasks.cjs [PROJECT_ID] [list|add|done]');
    console.log('Example: manage-tasks.cjs 8 list');
    console.log('Example: manage-tasks.cjs add "New Task"');
  }
}

main(); 