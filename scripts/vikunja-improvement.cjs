#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

const VIKUNJA_IMPROVEMENT_PROJECT_ID = 8;

async function showImprovementTasks() {
  try {
    const tasks = await api.getTasks(VIKUNJA_IMPROVEMENT_PROJECT_ID);
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
        console.log(`  [${task.priority}] ${priority} ${task.title}`);
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

async function showProgress() {
  try {
    const tasks = await api.getTasks(VIKUNJA_IMPROVEMENT_PROJECT_ID);
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

async function addImprovementTask(title, description, priority = 2) {
  try {
    await api.createTask(VIKUNJA_IMPROVEMENT_PROJECT_ID, {
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
  const [cmd, ...args] = process.argv.slice(2);
  
  switch (cmd) {
    case 'list':
      await showImprovementTasks();
      break;
    case 'progress':
      await showProgress();
      break;
    case 'add':
      if (args.length < 2) {
        console.log('Usage: ./scripts/vikunja-improvement.cjs add "Title" "Description" [priority]');
        return;
      }
      const title = args[0];
      const description = args[1];
      const priority = args[2] ? parseInt(args[2]) : 2;
      await addImprovementTask(title, description, priority);
      break;
    default:
      console.log('Usage:');
      console.log('  ./scripts/vikunja-improvement.cjs list      # Show all improvement tasks');
      console.log('  ./scripts/vikunja-improvement.cjs progress  # Show progress summary');
      console.log('  ./scripts/vikunja-improvement.cjs add "Title" "Description" [priority]  # Add new task');
  }
}

main(); 