#!/usr/bin/env node

// CLI for managing Vikunja tasks for workflow-bolt
const VikunjaAPI = require('./vikunja-api.cjs');
const api = new VikunjaAPI();

const PROJECT_ID = 3; // cursor-gpt-4.1-max Tasks

async function listTasks() {
  const tasks = await api.getTasks(PROJECT_ID);
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

async function addTask(title, description = '', priority = 3) {
  const task = await api.createTask(PROJECT_ID, { title, description, priority: Number(priority) });
  console.log('Created task:', task.id, task.title);
}

async function markDone(taskId) {
  await api.updateTask(taskId, { done: true });
  console.log('Marked task', taskId, 'as done.');
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'list') {
    await listTasks();
  } else if (cmd === 'add') {
    const [title, description, priority] = args;
    if (!title) {
      console.log('Usage: add "Task Title" "Description" [priority]');
      return;
    }
    await addTask(title, description, priority);
  } else if (cmd === 'done') {
    const [taskId] = args;
    if (!taskId) {
      console.log('Usage: done TASK_ID');
      return;
    }
    await markDone(taskId);
  } else {
    console.log('Usage: manage-tasks.cjs [list|add|done]');
  }
}

main(); 