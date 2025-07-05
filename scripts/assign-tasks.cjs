#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

// Available agents and their project IDs
const AGENTS = {
  'drlukner': { id: 11, name: 'drlukner', type: 'human', project: 'drlukner' },
  'cursor-gpt-4.1-max': { id: 3, name: 'cursor-gpt-4.1-max', type: 'ai', project: 'cursor-gpt-4.1-max' },
  'cursor-claude-sonnet': { id: 10, name: 'cursor-claude-sonnet', type: 'ai', project: 'cursor-claude-sonnet' }
};

// Project mappings
const PROJECTS = {
  'drlukner': { id: 11, name: 'drlukner Tasks' },
  'cursor-gpt-4.1-max': { id: 3, name: 'cursor-gpt-4.1-max Tasks' },
  'cursor-claude-sonnet': { id: 10, name: 'cursor-claude-sonnet Tasks' },
  'shared': { id: 9, name: 'Shared Agent Tasks' },
  'vikunja-improvement': { id: 8, name: 'Vikunja Improvement' }
};

async function assignTask(taskId, projectId, agentName) {
  try {
    const agent = AGENTS[agentName];
    if (!agent) {
      console.log('❌ Invalid agent. Available agents:');
      Object.keys(AGENTS).forEach(key => console.log(`  - ${key}`));
      return;
    }
    
    // Get the task
    const tasks = await api.getTasks(projectId);
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      console.log(`❌ Task ${taskId} not found in project ${projectId}`);
      return;
    }
    
    // Update task description with assignment
    const assignmentInfo = `
**ASSIGNMENT INFO:**
- **Assigned To**: ${agent.name}
- **Assigned By**: ${process.env.USER || 'system'}
- **Assigned Date**: ${new Date().toISOString()}
- **Agent Type**: ${agent.type}
- **Project**: ${PROJECTS[Object.keys(PROJECTS).find(k => PROJECTS[k].id === projectId)]?.name || 'Unknown'}

${task.description || ''}`;

    await api.updateTask(projectId, taskId, {
      description: assignmentInfo
    });
    
    console.log(`✅ Task ${taskId} assigned to ${agent.name}`);
    console.log(`📋 Task: ${task.title}`);
    console.log(`📁 Project: ${PROJECTS[Object.keys(PROJECTS).find(k => PROJECTS[k].id === projectId)]?.name}`);
    
  } catch (error) {
    console.error('Failed to assign task:', error.message);
  }
}

async function listAssignedTasks(agentName) {
  console.log(`\n=== TASKS ASSIGNED TO ${agentName.toUpperCase()} ===\n`);
  
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
          console.log(`  [${task.priority}] #${task.id} - ${task.title}`);
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
  
  // Show summary
  const priorities = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  myTasks.forEach(task => {
    priorities[task.priority] = (priorities[task.priority] || 0) + 1;
  });
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`  Total assigned tasks: ${myTasks.length}`);
  Object.entries(priorities).forEach(([priority, count]) => {
    if (count > 0) {
      console.log(`  Priority ${priority}: ${count} tasks`);
    }
  });
}

async function listAvailableAgents() {
  console.log('\n=== AVAILABLE AGENTS ===\n');
  
  Object.entries(AGENTS).forEach(([key, agent]) => {
    const typeIcon = agent.type === 'human' ? '👨‍💻' : '🤖';
    console.log(`${typeIcon} ${agent.name} (${agent.type})`);
    console.log(`   Project: ${agent.project}`);
    console.log(`   ID: ${agent.id}`);
    console.log('');
  });
}

async function showUnassignedTasks(projectId) {
  console.log(`\n=== UNASSIGNED TASKS IN PROJECT ${projectId} ===\n`);
  
  try {
    const tasks = await api.getTasks(projectId);
    const unassignedTasks = tasks.filter(t => 
      !t.done && 
      (!t.description || !t.description.includes('Assigned To:'))
    );
    
    if (unassignedTasks.length === 0) {
      console.log('No unassigned tasks found.');
      return;
    }
    
    unassignedTasks.forEach(task => {
      console.log(`[${task.priority}] #${task.id} - ${task.title}`);
    });
    
    console.log(`\n📊 Found ${unassignedTasks.length} unassigned tasks`);
    
  } catch (error) {
    console.error('Failed to fetch unassigned tasks:', error.message);
  }
}

async function bulkAssign(projectId, agentName, priorityFilter = null) {
  console.log(`\n=== BULK ASSIGNING TASKS TO ${agentName.toUpperCase()} ===\n`);
  
  try {
    const tasks = await api.getTasks(projectId);
    const unassignedTasks = tasks.filter(t => 
      !t.done && 
      (!t.description || !t.description.includes('Assigned To:'))
    );
    
    let tasksToAssign = unassignedTasks;
    if (priorityFilter) {
      tasksToAssign = unassignedTasks.filter(t => t.priority >= priorityFilter);
    }
    
    if (tasksToAssign.length === 0) {
      console.log('No tasks available for assignment.');
      return;
    }
    
    console.log(`Found ${tasksToAssign.length} tasks to assign:`);
    tasksToAssign.forEach(task => {
      console.log(`  [${task.priority}] #${task.id} - ${task.title}`);
    });
    
    // Assign each task
    let assignedCount = 0;
    for (const task of tasksToAssign) {
      try {
        await assignTask(task.id, projectId, agentName);
        assignedCount++;
      } catch (error) {
        console.log(`⚠️  Failed to assign task ${task.id}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Successfully assigned ${assignedCount} tasks to ${agentName}`);
    
  } catch (error) {
    console.error('Failed to bulk assign tasks:', error.message);
  }
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  
  switch (cmd) {
    case 'assign':
      if (args.length < 3) {
        console.log('Usage: ./scripts/assign-tasks.cjs assign <task_id> <project_id> <agent_name>');
        console.log('Example: ./scripts/assign-tasks.cjs assign 3009 8 cursor-gpt-4.1-max');
        return;
      }
      await assignTask(parseInt(args[0]), parseInt(args[1]), args[2]);
      break;
      
    case 'list':
      const agentName = args[0] || 'cursor-gpt-4.1-max';
      await listAssignedTasks(agentName);
      break;
      
    case 'agents':
      await listAvailableAgents();
      break;
      
    case 'unassigned':
      const projectId = parseInt(args[0]) || 8;
      await showUnassignedTasks(projectId);
      break;
      
    case 'bulk':
      if (args.length < 3) {
        console.log('Usage: ./scripts/assign-tasks.cjs bulk <project_id> <agent_name> [min_priority]');
        console.log('Example: ./scripts/assign-tasks.cjs bulk 8 cursor-gpt-4.1-max 3');
        return;
      }
      const priority = args[3] ? parseInt(args[3]) : null;
      await bulkAssign(parseInt(args[0]), args[1], priority);
      break;
      
    default:
      console.log('Usage:');
      console.log('  ./scripts/assign-tasks.cjs assign <task_id> <project_id> <agent>  # Assign specific task');
      console.log('  ./scripts/assign-tasks.cjs list [agent_name]                     # List assigned tasks');
      console.log('  ./scripts/assign-tasks.cjs agents                                # List available agents');
      console.log('  ./scripts/assign-tasks.cjs unassigned [project_id]               # Show unassigned tasks');
      console.log('  ./scripts/assign-tasks.cjs bulk <project_id> <agent> [priority]  # Bulk assign tasks');
      console.log('\nAvailable agents:');
      Object.keys(AGENTS).forEach(key => console.log(`  - ${key}`));
      console.log('\nAvailable projects:');
      Object.entries(PROJECTS).forEach(([key, project]) => console.log(`  - ${key} (ID: ${project.id})`));
  }
}

main(); 