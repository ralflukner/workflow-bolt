#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

const PROJECT_ID = 3; // cursor-gpt-4.1-max Tasks

// Task categories
const CATEGORIES = {
  'CRITICAL_BUGS': { priority: 4, description: 'High-priority bugs that need immediate attention' },
  'TESTING': { priority: 3, description: 'Test-related tasks and improvements' },
  'INFRASTRUCTURE': { priority: 3, description: 'CI/CD, deployment, and infrastructure tasks' },
  'DOCUMENTATION': { priority: 2, description: 'Documentation and knowledge management' },
  'REFACTORING': { priority: 2, description: 'Code refactoring and technical debt' },
  'FEATURES': { priority: 2, description: 'New features and enhancements' },
  'DEPENDENCIES': { priority: 1, description: 'Third-party dependency updates and maintenance' },
  'CLEANUP': { priority: 1, description: 'Code cleanup and removal of deprecated features' }
};

async function categorizeTasks() {
  const tasks = await api.getTasks(PROJECT_ID);
  const openTasks = tasks.filter(t => !t.done);
  
  console.log('Organizing tasks by category...\n');
  
  for (const task of openTasks) {
    let category = 'CLEANUP'; // default
    let newPriority = task.priority;
    
    // Categorize based on task title
    const title = task.title.toLowerCase();
    
    if (title.includes('fix') || title.includes('bug') || title.includes('error') || title.includes('fail')) {
      category = 'CRITICAL_BUGS';
      newPriority = Math.max(newPriority, 4);
    } else if (title.includes('test') || title.includes('jest') || title.includes('mock')) {
      category = 'TESTING';
      newPriority = Math.max(newPriority, 3);
    } else if (title.includes('ci') || title.includes('cd') || title.includes('pipeline') || title.includes('deploy')) {
      category = 'INFRASTRUCTURE';
      newPriority = Math.max(newPriority, 3);
    } else if (title.includes('doc') || title.includes('document')) {
      category = 'DOCUMENTATION';
    } else if (title.includes('refactor') || title.includes('cleanup') || title.includes('simplify')) {
      category = 'REFACTORING';
    } else if (title.includes('feature') || title.includes('add') || title.includes('implement')) {
      category = 'FEATURES';
    } else if (title.includes('update') || title.includes('upgrade') || title.includes('dependency')) {
      category = 'DEPENDENCIES';
    }
    
    // Update task with category and better description
    const categoryInfo = CATEGORIES[category];
    const newDescription = `${categoryInfo.description}\n\nOriginal: ${task.description || task.title}`;
    
    await api.updateTask(task.id, {
      title: `[${category}] ${task.title}`,
      description: newDescription,
      priority: newPriority
    });
    
    console.log(`✓ Categorized: [${category}] ${task.title}`);
  }
  
  console.log('\nTask organization complete!');
}

async function showTaskSummary() {
  const tasks = await api.getTasks(PROJECT_ID);
  const openTasks = tasks.filter(t => !t.done);
  
  console.log('\n=== TASK SUMMARY ===');
  console.log(`Total open tasks: ${openTasks.length}`);
  
  const categories = {};
  const priorities = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  for (const task of openTasks) {
    const category = task.title.match(/\[(\w+)\]/)?.[1] || 'UNCATEGORIZED';
    categories[category] = (categories[category] || 0) + 1;
    priorities[task.priority] = (priorities[task.priority] || 0) + 1;
  }
  
  console.log('\nBy Category:');
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} tasks`);
  });
  
  console.log('\nBy Priority:');
  Object.entries(priorities).forEach(([priority, count]) => {
    if (count > 0) {
      console.log(`  Priority ${priority}: ${count} tasks`);
    }
  });
}

async function main() {
  const [cmd] = process.argv.slice(2);
  
  if (cmd === 'categorize') {
    await categorizeTasks();
  } else if (cmd === 'summary') {
    await showTaskSummary();
  } else {
    console.log('Usage:');
    console.log('  ./scripts/organize-tasks.cjs categorize  # Categorize all tasks');
    console.log('  ./scripts/organize-tasks.cjs summary     # Show task summary');
  }
}

main(); 