#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

// Predefined label configurations
const LABEL_CONFIGS = {
  // Agent assignments
  agents: {
    'cursor-gpt-4.1-max': { color: '#3b82f6', description: 'AI Agent - GPT-4.1 Max' },
    'cursor-claude-sonnet': { color: '#8b5cf6', description: 'AI Agent - Claude Sonnet' },
    'drlukner': { color: '#10b981', description: 'Human User - Project Owner' }
  },
  
  // Status labels
  status: {
    'todo': { color: '#6b7280', description: 'Task is pending' },
    'in-progress': { color: '#3b82f6', description: 'Task is being worked on' },
    'review': { color: '#f59e0b', description: 'Task is ready for review' },
    'testing': { color: '#8b5cf6', description: 'Task is in testing phase' },
    'done': { color: '#10b981', description: 'Task is completed' },
    'blocked': { color: '#ef4444', description: 'Task is blocked' },
    'assigned': { color: '#f59e0b', description: 'Task has been assigned' }
  },
  
  // Category labels
  categories: {
    'bug': { color: '#ef4444', description: 'Bug fix or issue' },
    'feature': { color: '#10b981', description: 'New feature development' },
    'refactor': { color: '#3b82f6', description: 'Code refactoring' },
    'documentation': { color: '#8b5cf6', description: 'Documentation work' },
    'testing': { color: '#f59e0b', description: 'Testing related' },
    'infrastructure': { color: '#6366f1', description: 'Infrastructure work' },
    'security': { color: '#dc2626', description: 'Security related' },
    'performance': { color: '#059669', description: 'Performance optimization' }
  },
  
  // Priority labels
  priority: {
    'critical': { color: '#dc2626', description: 'Critical priority' },
    'high': { color: '#ea580c', description: 'High priority' },
    'medium': { color: '#d97706', description: 'Medium priority' },
    'low': { color: '#65a30d', description: 'Low priority' }
  }
};

async function initializeLabels() {
  console.log('🏷️  Initializing Vikunja labels...\n');
  
  const createdLabels = {};
  
  // Create agent labels
  console.log('👥 Creating agent labels...');
  for (const [agent, config] of Object.entries(LABEL_CONFIGS.agents)) {
    try {
      const label = await api.findOrCreateLabel(`agent:${agent}`, config.color);
      createdLabels[`agent:${agent}`] = label;
      console.log(`  ✅ ${agent} (${label.id})`);
    } catch (error) {
      console.log(`  ❌ ${agent}: ${error.message}`);
    }
  }
  
  // Create status labels
  console.log('\n📊 Creating status labels...');
  for (const [status, config] of Object.entries(LABEL_CONFIGS.status)) {
    try {
      const label = await api.findOrCreateLabel(`status:${status}`, config.color);
      createdLabels[`status:${status}`] = label;
      console.log(`  ✅ ${status} (${label.id})`);
    } catch (error) {
      console.log(`  ❌ ${status}: ${error.message}`);
    }
  }
  
  // Create category labels
  console.log('\n📂 Creating category labels...');
  for (const [category, config] of Object.entries(LABEL_CONFIGS.categories)) {
    try {
      const label = await api.findOrCreateLabel(`category:${category}`, config.color);
      createdLabels[`category:${category}`] = label;
      console.log(`  ✅ ${category} (${label.id})`);
    } catch (error) {
      console.log(`  ❌ ${category}: ${error.message}`);
    }
  }
  
  // Create priority labels
  console.log('\n🎯 Creating priority labels...');
  for (const [priority, config] of Object.entries(LABEL_CONFIGS.priority)) {
    try {
      const label = await api.findOrCreateLabel(`priority:${priority}`, config.color);
      createdLabels[`priority:${priority}`] = label;
      console.log(`  ✅ ${priority} (${label.id})`);
    } catch (error) {
      console.log(`  ❌ ${priority}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Label initialization complete! Created ${Object.keys(createdLabels).length} labels.`);
  return createdLabels;
}

async function assignTaskWithLabels(taskId, agentName, status = 'assigned', category = null, priority = null) {
  console.log(`\n📋 Assigning task ${taskId} to ${agentName}...`);
  
  try {
    const labelsToAdd = [];
    
    // Add agent label
    const agentLabel = await api.findOrCreateLabel(`agent:${agentName}`, LABEL_CONFIGS.agents[agentName]?.color || '#3b82f6');
    labelsToAdd.push(agentLabel.id);
    
    // Add status label
    const statusLabel = await api.findOrCreateLabel(`status:${status}`, LABEL_CONFIGS.status[status]?.color || '#6b7280');
    labelsToAdd.push(statusLabel.id);
    
    // Add category label if specified
    if (category) {
      const categoryLabel = await api.findOrCreateLabel(`category:${category}`, LABEL_CONFIGS.categories[category]?.color || '#6b7280');
      labelsToAdd.push(categoryLabel.id);
    }
    
    // Add priority label if specified
    if (priority) {
      const priorityLabel = await api.findOrCreateLabel(`priority:${priority}`, LABEL_CONFIGS.priority[priority]?.color || '#6b7280');
      labelsToAdd.push(priorityLabel.id);
    }
    
    // Add labels to task
    await api.addLabelsToTask(taskId, labelsToAdd);
    
    console.log(`✅ Task ${taskId} assigned to ${agentName} with labels:`);
    console.log(`   👤 Agent: ${agentName}`);
    console.log(`   📊 Status: ${status}`);
    if (category) console.log(`   📂 Category: ${category}`);
    if (priority) console.log(`   🎯 Priority: ${priority}`);
    
  } catch (error) {
    console.error(`❌ Failed to assign task ${taskId}: ${error.message}`);
  }
}

async function updateTaskStatus(taskId, newStatus) {
  console.log(`\n📊 Updating task ${taskId} status to ${newStatus}...`);
  
  try {
    await api.updateTaskStatus(taskId, newStatus);
    console.log(`✅ Task ${taskId} status updated to ${newStatus}`);
  } catch (error) {
    console.error(`❌ Failed to update task ${taskId} status: ${error.message}`);
  }
}

async function listTasksByLabel(labelType, value = null) {
  console.log(`\n🔍 Listing tasks by label...`);
  
  try {
    let labelTitle;
    if (value) {
      labelTitle = `${labelType}:${value}`;
    } else {
      labelTitle = labelType;
    }
    
    const tasks = await api.getTasksByLabel(labelTitle);
    
    if (tasks.length === 0) {
      console.log(`No tasks found with label: ${labelTitle}`);
      return;
    }
    
    console.log(`📋 Found ${tasks.length} task(s) with label "${labelTitle}":`);
    tasks.forEach(task => {
      const labels = task.labels ? task.labels.map(l => l.title).join(', ') : 'none';
      console.log(`  [${task.priority}] #${task.id} - ${task.title}`);
      console.log(`     📁 Project: ${task.project_id}`);
      console.log(`     🏷️  Labels: ${labels}`);
    });
    
  } catch (error) {
    console.error(`❌ Failed to list tasks by label: ${error.message}`);
  }
}

async function showLabelSummary() {
  console.log('\n📊 LABEL SUMMARY');
  console.log('='.repeat(50));
  
  try {
    const labels = await api.getLabels();
    
    // Group labels by type
    const groupedLabels = {
      agents: [],
      status: [],
      categories: [],
      priority: [],
      other: []
    };
    
    labels.forEach(label => {
      if (label.title.startsWith('agent:')) {
        groupedLabels.agents.push(label);
      } else if (label.title.startsWith('status:')) {
        groupedLabels.status.push(label);
      } else if (label.title.startsWith('category:')) {
        groupedLabels.categories.push(label);
      } else if (label.title.startsWith('priority:')) {
        groupedLabels.priority.push(label);
      } else {
        groupedLabels.other.push(label);
      }
    });
    
    console.log(`👥 Agent Labels (${groupedLabels.agents.length}):`);
    groupedLabels.agents.forEach(label => {
      console.log(`  🏷️  ${label.title} (${label.id})`);
    });
    
    console.log(`\n📊 Status Labels (${groupedLabels.status.length}):`);
    groupedLabels.status.forEach(label => {
      console.log(`  🏷️  ${label.title} (${label.id})`);
    });
    
    console.log(`\n📂 Category Labels (${groupedLabels.categories.length}):`);
    groupedLabels.categories.forEach(label => {
      console.log(`  🏷️  ${label.title} (${label.id})`);
    });
    
    console.log(`\n🎯 Priority Labels (${groupedLabels.priority.length}):`);
    groupedLabels.priority.forEach(label => {
      console.log(`  🏷️  ${label.title} (${label.id})`);
    });
    
    if (groupedLabels.other.length > 0) {
      console.log(`\n📝 Other Labels (${groupedLabels.other.length}):`);
      groupedLabels.other.forEach(label => {
        console.log(`  🏷️  ${label.title} (${label.id})`);
      });
    }
    
  } catch (error) {
    console.error(`❌ Failed to get label summary: ${error.message}`);
  }
}

async function bulkAssignLabels(projectId, agentName, status = 'assigned', category = null) {
  console.log(`\n📦 Bulk assigning labels to unassigned tasks in project ${projectId}...`);
  
  try {
    const tasks = await api.getTasks(projectId);
    const unassignedTasks = tasks.filter(task => 
      !task.done && 
      (!task.labels || !task.labels.some(l => l.title.startsWith('agent:')))
    );
    
    if (unassignedTasks.length === 0) {
      console.log('No unassigned tasks found.');
      return;
    }
    
    console.log(`Found ${unassignedTasks.length} unassigned tasks:`);
    unassignedTasks.forEach(task => {
      console.log(`  [${task.priority}] #${task.id} - ${task.title}`);
    });
    
    let assignedCount = 0;
    for (const task of unassignedTasks) {
      try {
        await assignTaskWithLabels(task.id, agentName, status, category);
        assignedCount++;
      } catch (error) {
        console.log(`⚠️  Failed to assign task ${task.id}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Successfully assigned ${assignedCount} tasks to ${agentName}`);
    
  } catch (error) {
    console.error(`❌ Failed to bulk assign labels: ${error.message}`);
  }
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  
  switch (cmd) {
    case 'init':
      await initializeLabels();
      break;
      
    case 'assign':
      if (args.length < 3) {
        console.log('Usage: ./scripts/label-manager.cjs assign <task_id> <agent> [status] [category] [priority]');
        console.log('Example: ./scripts/label-manager.cjs assign 3009 cursor-gpt-4.1-max in-progress feature high');
        return;
      }
      await assignTaskWithLabels(parseInt(args[0]), args[1], args[2], args[3], args[4]);
      break;
      
    case 'status':
      if (args.length < 2) {
        console.log('Usage: ./scripts/label-manager.cjs status <task_id> <new_status>');
        console.log('Example: ./scripts/label-manager.cjs status 3009 in-progress');
        return;
      }
      await updateTaskStatus(parseInt(args[0]), args[1]);
      break;
      
    case 'list':
      const labelType = args[0] || 'agent';
      const value = args[1];
      await listTasksByLabel(labelType, value);
      break;
      
    case 'summary':
      await showLabelSummary();
      break;
      
    case 'bulk':
      if (args.length < 3) {
        console.log('Usage: ./scripts/label-manager.cjs bulk <project_id> <agent> [status] [category]');
        console.log('Example: ./scripts/label-manager.cjs bulk 8 cursor-gpt-4.1-max assigned feature');
        return;
      }
      await bulkAssignLabels(parseInt(args[0]), args[1], args[2], args[3]);
      break;
      
    default:
      console.log('Usage:');
      console.log('  ./scripts/label-manager.cjs init                                    # Initialize all labels');
      console.log('  ./scripts/label-manager.cjs assign <task_id> <agent> [status] [category] [priority]');
      console.log('  ./scripts/label-manager.cjs status <task_id> <new_status>            # Update task status');
      console.log('  ./scripts/label-manager.cjs list [label_type] [value]                # List tasks by label');
      console.log('  ./scripts/label-manager.cjs summary                                  # Show label summary');
      console.log('  ./scripts/label-manager.cjs bulk <project_id> <agent> [status] [category]');
      console.log('\nAvailable agents:', Object.keys(LABEL_CONFIGS.agents).join(', '));
      console.log('Available statuses:', Object.keys(LABEL_CONFIGS.status).join(', '));
      console.log('Available categories:', Object.keys(LABEL_CONFIGS.categories).join(', '));
      console.log('Available priorities:', Object.keys(LABEL_CONFIGS.priority).join(', '));
  }
}

main(); 