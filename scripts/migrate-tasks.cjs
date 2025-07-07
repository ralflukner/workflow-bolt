#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

async function migrateTask(taskId, newProjectId) {
  try {
    const task = await api.getTask(taskId);
    if (!task) {
      console.log(`Task ${taskId} not found.`);
      return;
    }

    // Create a new task in the new project with the old task's data
    const newTask = await api.createTask(newProjectId, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.due_date,
      // Copy labels if they exist
      labels: task.labels ? task.labels.map(label => ({ id: label.id, title: label.title })) : []
    });

    // Mark the old task as done (or delete it, depending on policy)
    await api.updateTask(taskId, { done: true }); // Marking as done for now

    console.log(`✅ Task ${taskId} migrated to project ${newProjectId} as new task ${newTask.id}. Old task marked as done.`);
  } catch (error) {
    console.error(`❌ Failed to migrate task ${taskId}:`, error.message);
  }
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  switch (cmd) {
    case 'migrate':
      if (args.length < 2) {
        console.log('Usage: ./scripts/migrate-tasks.cjs migrate <task_id> <new_project_id>');
        return;
      }
      await migrateTask(parseInt(args[0]), parseInt(args[1]));
      break;
    default:
      console.log('Usage:');
      console.log('  ./scripts/migrate-tasks.cjs migrate <task_id> <new_project_id> # Migrate a task to a new project');
  }
}

main();
