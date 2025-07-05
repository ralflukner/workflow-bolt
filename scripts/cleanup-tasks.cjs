#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

const PROJECT_ID = 3; // cursor-gpt-4.1-max Tasks

async function identifyLowContextTasks() {
  const tasks = await api.getTasks(PROJECT_ID);
  const openTasks = tasks.filter(t => !t.done);
  
  const lowContextTasks = openTasks.filter(task => {
    const title = task.title.toLowerCase();
    
    // Tasks with very little context
    return (
      title.includes('implement') && title.length < 25 || // Incomplete "Implement" tasks
      title.includes('todo') && title.length < 20 || // Very short TODO tasks
      title.includes('well, crap') || // Obviously placeholder tasks
      title.includes('should i do') || // Question tasks
      title.includes('not sure') || // Uncertain tasks
      title.includes('this is a little') || // Vague tasks
      title.includes('clean up') && title.length < 25 || // Vague cleanup tasks
      title.includes('remove this') && title.length < 25 || // Vague removal tasks
      title.includes('update in line') || // Vague update tasks
      title.includes('add a deadline') || // Placeholder tasks
      title.includes('response is the only one') || // Incomplete tasks
      title.includes('txtlexer') || // Incomplete TODO comments
      title.includes('delegatinglexer') || // Incomplete TODO comments
      title.includes('incomplete: a readable') || // Incomplete TODO comments
      title.includes('if already given') || // Incomplete TODO comments
      title.includes('for now favor') || // Incomplete TODO comments
      title.includes('deprecated, remove') || // Generic deprecation tasks
      title.includes('remove this when') || // Generic deprecation tasks
      title.includes('in v2 we can remove') || // Generic deprecation tasks
      title.includes('in v2.0') || // Generic deprecation tasks
      title.includes('in 3.0.0') || // Generic deprecation tasks
      title.includes('stop inheriting') || // Generic refactoring tasks
      title.includes('use inspect.value') || // Generic refactoring tasks
      title.includes('add generic type') || // Generic refactoring tasks
      title.includes('add optional support') || // Generic feature tasks
      title.includes('fix tunnel') || // Generic bug tasks
      title.includes('remove this except') || // Generic bug tasks
      title.includes('add a deadline') || // Placeholder tasks
      title.includes('ist for time-blocking') || // Incomplete tasks
      title.includes('= [') || // Incomplete tasks
      title.includes(':') && title.length < 15 || // Very short tasks with colons
      title.includes('this can be simplified') || // Vague simplification tasks
      title.includes('make dispatcher') || // Vague implementation tasks
      title.includes('investigate if') || // Vague investigation tasks
      title.includes('tracking: maintained') || // Vague tracking tasks
      title.includes('sync functionality') || // Vague feature tasks
      title.includes('implement') && !task.description // Implement tasks without description
    );
  });
  
  console.log('\n=== TASKS WITH LOW CONTEXT (Candidates for deletion) ===');
  console.log(`Found ${lowContextTasks.length} tasks with insufficient context:\n`);
  
  lowContextTasks.forEach(task => {
    const category = task.title.match(/\[(\w+)\]/)?.[1] || 'UNCATEGORIZED';
    console.log(`[${task.priority}] [${category}] ${task.title}`);
    if (task.description) {
      console.log(`  Description: ${task.description.substring(0, 100)}...`);
    }
    console.log(`  ID: ${task.id}`);
    console.log('');
  });
  
  return lowContextTasks;
}

async function deleteLowContextTasks() {
  const lowContextTasks = await identifyLowContextTasks();
  
  if (lowContextTasks.length === 0) {
    console.log('No low-context tasks found to delete.');
    return;
  }
  
  console.log('\n=== DELETING LOW-CONTEXT TASKS ===');
  
  for (const task of lowContextTasks) {
    try {
      await api.deleteTask(task.id);
      console.log(`✓ Deleted: ${task.title}`);
    } catch (error) {
      console.log(`✗ Failed to delete task ${task.id}: ${error.message}`);
    }
  }
  
  console.log(`\nDeleted ${lowContextTasks.length} low-context tasks.`);
}

async function main() {
  const [cmd] = process.argv.slice(2);
  
  if (cmd === 'identify') {
    await identifyLowContextTasks();
  } else if (cmd === 'delete') {
    await deleteLowContextTasks();
  } else {
    console.log('Usage:');
    console.log('  ./scripts/cleanup-tasks.cjs identify  # Show low-context tasks');
    console.log('  ./scripts/cleanup-tasks.cjs delete    # Delete low-context tasks');
  }
}

main(); 