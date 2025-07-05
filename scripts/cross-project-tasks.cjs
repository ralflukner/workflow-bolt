#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

// Project mappings
const PROJECTS = {
  'drlukner': { id: 11, name: 'drlukner Tasks', type: 'human' },
  'cursor-claude-sonnet': { id: 10, name: 'cursor-claude-sonnet Tasks', type: 'ai' },
  'cursor-gpt-4.1-max': { id: 3, name: 'cursor-gpt-4.1-max Tasks', type: 'ai' },
  'shared': { id: 9, name: 'Shared Agent Tasks', type: 'coordination' },
  'vikunja-improvement': { id: 8, name: 'Vikunja Improvement', type: 'system' }
};

async function showCrossProjectOverview() {
  console.log('\n=== CROSS-PROJECT TASK OVERVIEW ===\n');
  
  const allTasks = {};
  const projectStats = {};
  
  // Gather tasks from all projects
  for (const [key, project] of Object.entries(PROJECTS)) {
    try {
      const tasks = await api.getTasks(project.id);
      const openTasks = tasks.filter(t => !t.done);
      allTasks[key] = openTasks;
      projectStats[key] = {
        total: tasks.length,
        open: openTasks.length,
        completed: tasks.length - openTasks.length
      };
    } catch (error) {
      console.log(`⚠️  Could not fetch tasks for ${project.name}: ${error.message}`);
    }
  }
  
  // Show project statistics
  console.log('📊 PROJECT STATISTICS:');
  Object.entries(projectStats).forEach(([key, stats]) => {
    const project = PROJECTS[key];
    const completionRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0;
    console.log(`  ${project.name}: ${stats.open} open, ${stats.completed} done (${completionRate}%)`);
  });
  
  // Show high-priority tasks across all projects
  console.log('\n🔥 HIGH-PRIORITY TASKS (Priority 4-5):');
  let highPriorityCount = 0;
  Object.entries(allTasks).forEach(([key, tasks]) => {
    const highPriority = tasks.filter(t => t.priority >= 4);
    if (highPriority.length > 0) {
      console.log(`\n  📁 ${PROJECTS[key].name}:`);
      highPriority.forEach(task => {
        console.log(`    [${task.priority}] ${task.title}`);
        highPriorityCount++;
      });
    }
  });
  
  if (highPriorityCount === 0) {
    console.log('  No high-priority tasks found across projects.');
  }
  
  // Show tasks assigned to specific agents/users
  console.log('\n👥 TASK ASSIGNMENTS:');
  Object.entries(allTasks).forEach(([key, tasks]) => {
    const assignedTasks = tasks.filter(t => 
      t.description && 
      t.description.includes('Assigned To:')
    );
    
    if (assignedTasks.length > 0) {
      console.log(`\n  📁 ${PROJECTS[key].name}:`);
      assignedTasks.forEach(task => {
        const assignmentMatch = task.description.match(/Assigned To: (\w+)/);
        const agent = assignmentMatch ? assignmentMatch[1] : 'Unknown';
        console.log(`    [${task.priority}] ${task.title} → ${agent}`);
      });
    }
  });
}

async function showAgentWorkload(agentName) {
  console.log(`\n=== WORKLOAD FOR ${agentName.toUpperCase()} ===\n`);
  
  const myTasks = [];
  
  // Check all projects for tasks assigned to this agent
  for (const [key, project] of Object.entries(PROJECTS)) {
    try {
      const tasks = await api.getTasks(project.id);
      const assignedTasks = tasks.filter(t => 
        !t.done && 
        t.description && 
        t.description.includes(`Assigned To: ${agentName}`)
      );
      
      if (assignedTasks.length > 0) {
        console.log(`📁 ${project.name}:`);
        assignedTasks.forEach(task => {
          console.log(`  [${task.priority}] ${task.title}`);
          myTasks.push({ ...task, project: project.name });
        });
      }
    } catch (error) {
      console.log(`⚠️  Could not fetch tasks for ${project.name}`);
    }
  }
  
  if (myTasks.length === 0) {
    console.log(`No tasks currently assigned to ${agentName}.`);
    return;
  }
  
  // Show workload summary
  const priorities = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  myTasks.forEach(task => {
    priorities[task.priority] = (priorities[task.priority] || 0) + 1;
  });
  
  console.log(`\n📊 WORKLOAD SUMMARY:`);
  console.log(`  Total tasks: ${myTasks.length}`);
  Object.entries(priorities).forEach(([priority, count]) => {
    if (count > 0) {
      console.log(`  Priority ${priority}: ${count} tasks`);
    }
  });
}

async function linkTasksAcrossProjects(sourceTaskId, sourceProject, targetProject, linkType = 'related') {
  try {
    const sourceProjectId = PROJECTS[sourceProject]?.id;
    const targetProjectId = PROJECTS[targetProject]?.id;
    
    if (!sourceProjectId || !targetProjectId) {
      console.log('❌ Invalid project names. Available projects:');
      Object.keys(PROJECTS).forEach(key => console.log(`  - ${key}`));
      return;
    }
    
    // Get source task
    const sourceTasks = await api.getTasks(sourceProjectId);
    const sourceTask = sourceTasks.find(t => t.id === sourceTaskId);
    
    if (!sourceTask) {
      console.log(`❌ Task ${sourceTaskId} not found in ${sourceProject}`);
      return;
    }
    
    // Create linked task in target project
    const linkedTitle = `[${linkType.toUpperCase()}] ${sourceTask.title}`;
    const linkedDescription = `${sourceTask.description}

**CROSS-PROJECT LINK:**
- **Source**: ${PROJECTS[sourceProject].name} (Task #${sourceTaskId})
- **Link Type**: ${linkType}
- **Created**: ${new Date().toISOString()}
- **Notes**: This task is linked from ${sourceProject} project for coordination.`;

    await api.createTask(targetProjectId, {
      title: linkedTitle,
      description: linkedDescription,
      priority: sourceTask.priority
    });
    
    console.log(`✅ Created linked task in ${targetProject}`);
    console.log(`📋 Source: ${sourceProject} #${sourceTaskId}`);
    console.log(`📋 Target: ${targetProject}`);
    
  } catch (error) {
    console.error('Failed to link tasks:', error.message);
  }
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  
  switch (cmd) {
    case 'overview':
      await showCrossProjectOverview();
      break;
      
    case 'workload':
      const agentName = args[0] || 'cursor-gpt-4.1-max';
      await showAgentWorkload(agentName);
      break;
      
    case 'link':
      if (args.length < 4) {
        console.log('Usage: ./scripts/cross-project-tasks.cjs link <task_id> <source_project> <target_project> [link_type]');
        console.log('Example: ./scripts/cross-project-tasks.cjs link 3009 vikunja-improvement shared related');
        return;
      }
      await linkTasksAcrossProjects(parseInt(args[0]), args[1], args[2], args[3]);
      break;
      
    default:
      console.log('Usage:');
      console.log('  ./scripts/cross-project-tasks.cjs overview                    # Show cross-project overview');
      console.log('  ./scripts/cross-project-tasks.cjs workload [agent_name]       # Show agent workload');
      console.log('  ./scripts/cross-project-tasks.cjs link <id> <src> <tgt> [type] # Link tasks across projects');
      console.log('\nAvailable projects:');
      Object.keys(PROJECTS).forEach(key => console.log(`  - ${key}`));
  }
}

main(); 