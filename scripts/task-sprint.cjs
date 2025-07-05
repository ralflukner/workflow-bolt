#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

const PROJECT_ID = 3; // cursor-gpt-4.1-max Tasks

async function showHighPriorityTasks() {
  const tasks = await api.getTasks(PROJECT_ID);
  const openTasks = tasks.filter(t => !t.done);
  const highPriority = openTasks.filter(t => t.priority >= 4);
  
  console.log('\n=== HIGH PRIORITY TASKS (Priority 4+) ===');
  if (highPriority.length === 0) {
    console.log('No high priority tasks found.');
    return;
  }
  
  highPriority.forEach(task => {
    const category = task.title.match(/\[(\w+)\]/)?.[1] || 'UNCATEGORIZED';
    console.log(`[${task.priority}] [${category}] ${task.title}`);
  });
}

async function showSprintTasks(limit = 5) {
  const tasks = await api.getTasks(PROJECT_ID);
  const openTasks = tasks.filter(t => !t.done);
  
  // Sort by priority (descending) and then by category
  const sortedTasks = openTasks.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    
    const catA = a.title.match(/\[(\w+)\]/)?.[1] || 'ZZZ';
    const catB = b.title.match(/\[(\w+)\]/)?.[1] || 'ZZZ';
    return catA.localeCompare(catB);
  });
  
  console.log(`\n=== SPRINT TASKS (Top ${limit}) ===`);
  sortedTasks.slice(0, limit).forEach((task, index) => {
    const category = task.title.match(/\[(\w+)\]/)?.[1] || 'UNCATEGORIZED';
    console.log(`${index + 1}. [${task.priority}] [${category}] ${task.title}`);
  });
}

async function showCategoryTasks(category) {
  const tasks = await api.getTasks(PROJECT_ID);
  const openTasks = tasks.filter(t => !t.done);
  const categoryTasks = openTasks.filter(t => 
    t.title.includes(`[${category}]`)
  );
  
  console.log(`\n=== ${category} TASKS ===`);
  if (categoryTasks.length === 0) {
    console.log(`No ${category} tasks found.`);
    return;
  }
  
  categoryTasks.forEach(task => {
    console.log(`[${task.priority}] ${task.title.replace(`[${category}] `, '')}`);
  });
}

async function cleanupLowValueTasks() {
  const tasks = await api.getTasks(PROJECT_ID);
  const openTasks = tasks.filter(t => !t.done);
  
  // Find tasks that are likely low-value (incomplete TODO comments, very short descriptions)
  const lowValueTasks = openTasks.filter(task => {
    const title = task.title.toLowerCase();
    return (
      title.includes('implement') && title.length < 20 || // Incomplete "Implement" tasks
      title.includes('todo') && title.length < 15 || // Very short TODO tasks
      title.includes('well, crap') || // Obviously placeholder tasks
      title.includes('should i do') // Question tasks
    );
  });
  
  console.log('\n=== POTENTIAL LOW-VALUE TASKS ===');
  console.log('These tasks might be candidates for cleanup:');
  
  lowValueTasks.forEach(task => {
    console.log(`- [${task.priority}] ${task.title}`);
  });
  
  if (lowValueTasks.length > 0) {
    console.log('\nTo mark these as done, run:');
    lowValueTasks.forEach(task => {
      console.log(`  ./scripts/manage-tasks.cjs done ${task.id}`);
    });
  }
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  
  switch (cmd) {
    case 'high-priority':
      await showHighPriorityTasks();
      break;
    case 'sprint':
      const limit = args[0] ? parseInt(args[0]) : 5;
      await showSprintTasks(limit);
      break;
    case 'category':
      const category = args[0];
      if (!category) {
        console.log('Usage: ./scripts/task-sprint.cjs category <CATEGORY>');
        console.log('Categories: CRITICAL_BUGS, TESTING, INFRASTRUCTURE, DOCUMENTATION, REFACTORING, FEATURES, DEPENDENCIES, CLEANUP');
        return;
      }
      await showCategoryTasks(category.toUpperCase());
      break;
    case 'cleanup':
      await cleanupLowValueTasks();
      break;
    default:
      console.log('Usage:');
      console.log('  ./scripts/task-sprint.cjs high-priority     # Show priority 4+ tasks');
      console.log('  ./scripts/task-sprint.cjs sprint [limit]    # Show top tasks for sprint');
      console.log('  ./scripts/task-sprint.cjs category <cat>    # Show tasks by category');
      console.log('  ./scripts/task-sprint.cjs cleanup           # Show potential cleanup candidates');
  }
}

main(); 