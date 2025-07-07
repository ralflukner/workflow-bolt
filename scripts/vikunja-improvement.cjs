#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

const DEFAULT_PROJECT_ID = 8; // Default to Vikunja Improvement Project

async function showImprovementTasks(projectId) {
  try {
    const tasks = await api.getTasks(projectId);
    const openTasks = tasks.filter(t => !t.done);
    
    console.log('\n=== VIKUNJA IMPROVEMENT PROJECT ===');
    console.log(`📋 Total open tasks: ${openTasks.length}\n`);
    
    // Group by category
    const categories = {};
    openTasks.forEach(task => {
      const category = task.title.match(/\[(\w+)\]/)?.[1] || 'UNCATEGORIZED';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(task);
    });
    
    // Display by category
    Object.entries(categories).forEach(([category, tasks]) => {
      console.log(`\n📁 ${category} (${tasks.length} tasks):`);
      tasks.forEach(task => {
        const priority = '🔥'.repeat(task.priority);
        console.log(`  [${task.id}] [${task.priority}] ${priority} ${task.title}`);
        if (task.description) {
          const lines = task.description.split('\n').slice(0, 3);
          lines.forEach(line => {
            if (line.trim()) {
              console.log(`      ${line.trim()}`);
            }            
          });
          if (task.description.split('\n').length > 3) {
            console.log(`      ...`);
          }
        }
      });
    });
    
    // Show priority breakdown
    const priorities = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    openTasks.forEach(task => {
      priorities[task.priority] = (priorities[task.priority] || 0) + 1;
    });
    
    console.log('\n📊 Priority Breakdown:');
    Object.entries(priorities).forEach(([priority, count]) => {
      if (count > 0) {
        const bars = '█'.repeat(count);
        console.log(`  Priority ${priority}: ${bars} (${count})`);
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch improvement tasks:', error.message);
  }
}

async function showProgress(projectId) {
  try {
    const tasks = await api.getTasks(projectId);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.done).length;
    const openTasks = totalTasks - completedTasks;
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;
    
    console.log('\n=== VIKUNJA IMPROVEMENT PROGRESS ===');
    console.log(`📈 Completion Rate: ${completionRate}%`);
    console.log(`✅ Completed: ${completedTasks}`);
    console.log(`⏳ Remaining: ${openTasks}`);
    console.log(`📋 Total: ${totalTasks}`);
    
    if (completedTasks > 0) {
      console.log('\n🎉 Recently Completed:');
      const recentCompleted = tasks.filter(t => t.done).slice(-3);
      recentCompleted.forEach(task => {
        console.log(`  ✅ ${task.title}`);
      });
    }
    
  } catch (error) {
    console.error('Failed to fetch progress:', error.message);
  }
}

async function addImprovementTask(projectId, title, description, priority = 2) {
  try {
    await api.createTask(projectId, {
      title,
      description,
      priority
    });
    console.log(`✅ Added improvement task: ${title}`);
  } catch (error) {
    console.error('Failed to add task:', error.message);
  }
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
  
  switch (cmd) {
    case 'list':
      await showImprovementTasks(projectId);
      break;
    case 'progress':
      await showProgress(projectId);
      break;
    case 'add':
      if (args.length < 2) {
        console.log('Usage: ./scripts/vikunja-improvement.cjs [PROJECT_ID] add "Title" "Description" [priority]');
        return;
      }
      const title = args[0];
      const description = args[1];
      const priority = args[2] ? parseInt(args[2]) : 2;
      await addImprovementTask(projectId, title, description, priority);
      break;
    default:
      console.log('Usage:');
      console.log('  ./scripts/vikunja-improvement.cjs [PROJECT_ID] list      # Show all improvement tasks');
      console.log('  ./scripts/vikunja-improvement.cjs [PROJECT_ID] progress  # Show progress summary');
      console.log('  ./scripts/vikunja-improvement.cjs [PROJECT_ID] add "Title" "Description" [priority]  # Add new task');
  }
}

main(); 