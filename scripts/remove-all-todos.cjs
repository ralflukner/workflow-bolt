#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

const PROJECT_ID = 3; // cursor-gpt-4.1-max Tasks

async function removeAllTodos() {
  const tasks = await api.getTasks(PROJECT_ID);
  const openTodos = tasks.filter(t => !t.done && t.title.startsWith('[TODO]'));
  if (openTodos.length === 0) {
    console.log('No [TODO] tasks to delete.');
    return;
  }
  console.log(`Found ${openTodos.length} [TODO] tasks. Deleting...`);
  let deleted = 0;
  for (const task of openTodos) {
    try {
      await api.deleteTask(task.id);
      console.log(`✓ Deleted: ${task.title}`);
      deleted++;
    } catch (e) {
      console.log(`✗ Failed to delete: ${task.title}`);
    }
  }
  console.log(`\nDeleted ${deleted} [TODO] tasks.`);
}

removeAllTodos(); 