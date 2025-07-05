#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

// Project configurations
const PROJECTS = {
  'drlukner': { id: 11, name: 'drlukner Tasks', type: 'human', icon: '👨‍💻' },
  'cursor-gpt-4.1-max': { id: 3, name: 'cursor-gpt-4.1-max Tasks', type: 'ai', icon: '🤖' },
  'cursor-claude-sonnet': { id: 10, name: 'cursor-claude-sonnet Tasks', type: 'ai', icon: '🤖' },
  'shared': { id: 9, name: 'Shared Agent Tasks', type: 'coordination', icon: '🔄' },
  'vikunja-improvement': { id: 8, name: 'Vikunja Improvement', type: 'system', icon: '⚙️' }
};

async function showDashboard() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 WORKFLOW-BOLT PROJECT DASHBOARD');
  console.log('='.repeat(80));
  
  const dashboard = {};
  const agentWorkloads = {};
  
  // Gather data from all projects
  for (const [key, project] of Object.entries(PROJECTS)) {
    try {
      const tasks = await api.getTasks(project.id);
      const openTasks = tasks.filter(t => !t.done);
      const completedTasks = tasks.filter(t => t.done);
      
      dashboard[key] = {
        total: tasks.length,
        open: openTasks.length,
        completed: completedTasks.length,
        completionRate: tasks.length > 0 ? ((completedTasks.length / tasks.length) * 100).toFixed(1) : 0,
        highPriority: openTasks.filter(t => t.priority >= 4).length,
        assignedTasks: openTasks.filter(t => t.description && t.description.includes('Assigned To:')).length
      };
      
      // Track agent workloads
      openTasks.forEach(task => {
        if (task.description && task.description.includes('Assigned To:')) {
          const match = task.description.match(/Assigned To: (\w+)/);
          if (match) {
            const agent = match[1];
            if (!agentWorkloads[agent]) agentWorkloads[agent] = [];
            agentWorkloads[agent].push({ ...task, project: project.name });
          }
        }
      });
      
    } catch (error) {
      console.log(`⚠️  Could not fetch data for ${project.name}: ${error.message}`);
    }
  }
  
  // Show project overview
  console.log('\n📊 PROJECT OVERVIEW:');
  console.log('-'.repeat(80));
  
  Object.entries(dashboard).forEach(([key, stats]) => {
    const project = PROJECTS[key];
    const progressBar = createProgressBar(stats.completionRate);
    console.log(`${project.icon} ${project.name}:`);
    console.log(`   📈 Progress: ${progressBar} ${stats.completionRate}%`);
    console.log(`   📋 Tasks: ${stats.open} open, ${stats.completed} done (${stats.total} total)`);
    console.log(`   🔥 High Priority: ${stats.highPriority}`);
    console.log(`   👥 Assigned: ${stats.assignedTasks}`);
    console.log('');
  });
  
  // Show agent workloads
  console.log('👥 AGENT WORKLOADS:');
  console.log('-'.repeat(80));
  
  if (Object.keys(agentWorkloads).length === 0) {
    console.log('No tasks currently assigned to agents.');
  } else {
    Object.entries(agentWorkloads).forEach(([agent, tasks]) => {
      const priorities = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      tasks.forEach(task => {
        priorities[task.priority] = (priorities[task.priority] || 0) + 1;
      });
      
      const totalTasks = tasks.length;
      const highPriority = tasks.filter(t => t.priority >= 4).length;
      
      console.log(`🤖 ${agent}:`);
      console.log(`   📋 Total: ${totalTasks} tasks`);
      console.log(`   🔥 High Priority: ${highPriority}`);
      console.log(`   📊 Priority breakdown:`);
      Object.entries(priorities).forEach(([priority, count]) => {
        if (count > 0) {
          console.log(`      P${priority}: ${count} tasks`);
        }
      });
      console.log('');
    });
  }
  
  // Show recent activity
  console.log('🕒 RECENT ACTIVITY:');
  console.log('-'.repeat(80));
  
  const recentTasks = [];
  for (const [key, project] of Object.entries(PROJECTS)) {
    try {
      const tasks = await api.getTasks(project.id);
      const recent = tasks
        .filter(t => !t.done && t.priority >= 3)
        .slice(0, 3)
        .map(t => ({ ...t, project: project.name }));
      recentTasks.push(...recent);
    } catch (error) {
      // Skip if can't fetch
    }
  }
  
  if (recentTasks.length === 0) {
    console.log('No recent high-priority tasks found.');
  } else {
    recentTasks
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10)
      .forEach(task => {
        const project = PROJECTS[Object.keys(PROJECTS).find(k => PROJECTS[k].name === task.project)];
        console.log(`[${task.priority}] ${project?.icon || '📁'} ${task.project}: ${task.title}`);
      });
  }
  
  // Show system health
  console.log('\n💚 SYSTEM HEALTH:');
  console.log('-'.repeat(80));
  
  const totalProjects = Object.keys(dashboard).length;
  const healthyProjects = Object.values(dashboard).filter(stats => stats.total > 0).length;
  const overallCompletion = Object.values(dashboard).reduce((sum, stats) => sum + parseFloat(stats.completionRate), 0) / totalProjects;
  
  console.log(`📊 Overall Health: ${healthyProjects}/${totalProjects} projects active`);
  console.log(`📈 Average Completion: ${overallCompletion.toFixed(1)}%`);
  console.log(`🤖 Active Agents: ${Object.keys(agentWorkloads).length}`);
  
  // Show recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('-'.repeat(80));
  
  const recommendations = [];
  
  // Check for overloaded agents
  Object.entries(agentWorkloads).forEach(([agent, tasks]) => {
    if (tasks.length > 10) {
      recommendations.push(`⚠️  ${agent} has ${tasks.length} tasks - consider reassignment`);
    }
  });
  
  // Check for high-priority tasks
  Object.entries(dashboard).forEach(([key, stats]) => {
    if (stats.highPriority > 5) {
      const project = PROJECTS[key];
      recommendations.push(`🔥 ${project.name} has ${stats.highPriority} high-priority tasks - needs attention`);
    }
  });
  
  // Check for unassigned tasks
  Object.entries(dashboard).forEach(([key, stats]) => {
    const unassigned = stats.open - stats.assignedTasks;
    if (unassigned > 5) {
      const project = PROJECTS[key];
      recommendations.push(`📋 ${project.name} has ${unassigned} unassigned tasks - needs assignment`);
    }
  });
  
  if (recommendations.length === 0) {
    console.log('✅ All systems operating normally!');
  } else {
    recommendations.forEach(rec => console.log(rec));
  }
  
  console.log('\n' + '='.repeat(80));
}

function createProgressBar(percentage) {
  const filled = Math.round((percentage / 100) * 20);
  const empty = 20 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

async function showProjectDetails(projectKey) {
  const project = PROJECTS[projectKey];
  if (!project) {
    console.log('❌ Invalid project. Available projects:');
    Object.keys(PROJECTS).forEach(key => console.log(`  - ${key}`));
    return;
  }
  
  console.log(`\n${project.icon} ${project.name.toUpperCase()} - DETAILED VIEW`);
  console.log('='.repeat(80));
  
  try {
    const tasks = await api.getTasks(project.id);
    const openTasks = tasks.filter(t => !t.done);
    const completedTasks = tasks.filter(t => t.done);
    
    console.log(`📊 STATISTICS:`);
    console.log(`   Total Tasks: ${tasks.length}`);
    console.log(`   Open Tasks: ${openTasks.length}`);
    console.log(`   Completed: ${completedTasks.length}`);
    console.log(`   Completion Rate: ${tasks.length > 0 ? ((completedTasks.length / tasks.length) * 100).toFixed(1) : 0}%`);
    
    // Priority breakdown
    const priorities = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    openTasks.forEach(task => {
      priorities[task.priority] = (priorities[task.priority] || 0) + 1;
    });
    
    console.log(`\n📋 PRIORITY BREAKDOWN:`);
    Object.entries(priorities).forEach(([priority, count]) => {
      if (count > 0) {
        console.log(`   Priority ${priority}: ${count} tasks`);
      }
    });
    
    // Show assigned vs unassigned
    const assignedTasks = openTasks.filter(t => t.description && t.description.includes('Assigned To:'));
    const unassignedTasks = openTasks.filter(t => !t.description || !t.description.includes('Assigned To:'));
    
    console.log(`\n👥 ASSIGNMENTS:`);
    console.log(`   Assigned: ${assignedTasks.length}`);
    console.log(`   Unassigned: ${unassignedTasks.length}`);
    
    // Show recent tasks
    console.log(`\n🕒 RECENT TASKS:`);
    openTasks
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10)
      .forEach(task => {
        const assigned = task.description && task.description.includes('Assigned To:') ? '✅' : '❌';
        console.log(`   [${task.priority}] ${assigned} ${task.title}`);
      });
    
  } catch (error) {
    console.error(`Failed to fetch project details: ${error.message}`);
  }
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  
  switch (cmd) {
    case 'overview':
      await showDashboard();
      break;
      
    case 'project':
      const projectKey = args[0];
      if (!projectKey) {
        console.log('Usage: ./scripts/project-dashboard.cjs project <project_key>');
        console.log('Available projects:');
        Object.keys(PROJECTS).forEach(key => console.log(`  - ${key}`));
        return;
      }
      await showProjectDetails(projectKey);
      break;
      
    default:
      console.log('Usage:');
      console.log('  ./scripts/project-dashboard.cjs overview              # Show full dashboard');
      console.log('  ./scripts/project-dashboard.cjs project <project>    # Show project details');
      console.log('\nAvailable projects:');
      Object.keys(PROJECTS).forEach(key => console.log(`  - ${key}`));
  }
}

main(); 