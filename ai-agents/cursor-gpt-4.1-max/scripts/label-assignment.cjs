#!/usr/bin/env node

// Label-based user assignment system for Vikunja
const VikunjaAPI = require('./vikunja-api.cjs');

// User assignment labels
const USER_LABELS = {
  'cursor-claude-sonnet': 'assigned:cursor-claude-sonnet',
  'cursor-gpt-4.1-max': 'assigned:cursor-gpt-4.1-max', 
  'drlukner': 'assigned:drlukner'
};

const STATUS_LABELS = {
  'todo': 'status:todo',
  'in-progress': 'status:in-progress',
  'review': 'status:review',
  'done': 'status:done',
  'blocked': 'status:blocked'
};

const PRIORITY_LABELS = {
  'critical': 'priority:critical',
  'high': 'priority:high',
  'medium': 'priority:medium',
  'low': 'priority:low'
};

async function assignTaskWithLabel(taskId, assignee, status = 'in-progress') {
  const api = new VikunjaAPI();
  
  try {
    console.log(`🏷️  Assigning task #${taskId} to ${assignee} using labels...`);
    
    // Get current task
    const task = await api.getTask(taskId);
    
    // Prepare label updates
    const currentLabels = task.labels || [];
    
    // Remove any existing assignment labels
    const filteredLabels = currentLabels.filter(label => 
      !Object.values(USER_LABELS).includes(label.title) &&
      !Object.values(STATUS_LABELS).includes(label.title)
    );
    
    // Add new assignment and status labels (as strings for the API to handle)
    const newLabels = [
      ...filteredLabels.map(l => l.title || l),
      USER_LABELS[assignee],
      STATUS_LABELS[status]
    ];
    
    // Update task with labels
    const updatedTask = await api.updateTaskLabels(taskId, newLabels);
    
    console.log(`✅ Task assigned to ${assignee} with status: ${status}`);
    console.log(`📋 "${task.title}"`);
    console.log(`🏷️  Labels: ${newLabels.map(l => l.title).join(', ')}`);
    
    return updatedTask;
    
  } catch (error) {
    console.error(`❌ Failed to assign task #${taskId}:`, error.message);
  }
}

async function updateTaskStatus(taskId, status) {
  const api = new VikunjaAPI();
  
  try {
    console.log(`🏷️  Updating task #${taskId} status to: ${status}`);
    
    const task = await api.getTask(taskId);
    const currentLabels = task.labels || [];
    
    // Remove existing status labels
    const filteredLabels = currentLabels.filter(label => 
      !Object.values(STATUS_LABELS).includes(label.title)
    );
    
    // Add new status label
    const newLabels = [
      ...filteredLabels.map(l => l.title || l),
      STATUS_LABELS[status]
    ];
    
    // Mark as done if status is 'done'
    const taskUpdate = { labels: newLabels };
    if (status === 'done') {
      taskUpdate.done = true;
    }
    
    const updatedTask = await api.updateTask(taskId, taskUpdate);
    
    console.log(`✅ Task status updated to: ${status}`);
    console.log(`📋 "${task.title}"`);
    
    return updatedTask;
    
  } catch (error) {
    console.error(`❌ Failed to update task #${taskId}:`, error.message);
  }
}

async function listTasksByAssignee(assignee = null, showAll = false) {
  const api = new VikunjaAPI();
  
  try {
    console.log(`📋 Tasks${assignee ? ` assigned to ${assignee}` : ' by assignee'}:\n`);
    
    // Get all tasks from relevant projects
    const projectIds = [3, 9, 10, 11]; // All user projects + shared
    const allTasks = [];
    
    for (const projectId of projectIds) {
      try {
        const tasks = await api.getTasks(projectId);
        allTasks.push(...tasks.map(task => ({ ...task, projectId })));
      } catch (error) {
        // Skip projects that don't exist or are inaccessible
      }
    }
    
    // Filter by assignee if specified
    let filteredTasks = allTasks;
    if (assignee) {
      const assigneeLabel = USER_LABELS[assignee];
      filteredTasks = allTasks.filter(task => 
        task.labels && task.labels.some(label => label.title === assigneeLabel)
      );
    }
    
    // Filter by completion status
    if (!showAll) {
      filteredTasks = filteredTasks.filter(task => !task.done);
    }
    
    // Group by assignee
    const tasksByAssignee = {};
    
    filteredTasks.forEach(task => {
      const assigneeLabel = task.labels?.find(label => 
        Object.values(USER_LABELS).includes(label.title)
      );
      
      const taskAssignee = assigneeLabel ? 
        Object.keys(USER_LABELS).find(key => USER_LABELS[key] === assigneeLabel.title) :
        'unassigned';
      
      if (!tasksByAssignee[taskAssignee]) {
        tasksByAssignee[taskAssignee] = [];
      }
      tasksByAssignee[taskAssignee].push(task);
    });
    
    // Display tasks
    Object.entries(tasksByAssignee).forEach(([user, tasks]) => {
      if (tasks.length === 0) return;
      
      const userIcon = user === 'drlukner' ? '👨‍💻' : 
                      user.includes('cursor') ? '🤖' : '❓';
      
      console.log(`${userIcon} ${user} (${tasks.length} tasks):`);
      
      tasks.forEach(task => {
        const priority = ['', '🔵', '🟡', '🟠', '🔴', '🚨'][task.priority] || '';
        const statusLabel = task.labels?.find(label => 
          Object.values(STATUS_LABELS).includes(label.title)
        );
        const status = statusLabel ? statusLabel.title.replace('status:', '') : 'todo';
        const statusIcon = {
          'todo': '⏳',
          'in-progress': '🔄', 
          'review': '👀',
          'done': '✅',
          'blocked': '🚫'
        }[status] || '⏳';
        
        console.log(`  ${priority}${statusIcon} [${task.id}] ${task.title}`);
        
        // Show labels
        if (task.labels && task.labels.length > 0) {
          const labelStr = task.labels.map(l => l.title).join(', ');
          console.log(`    🏷️  ${labelStr}`);
        }
      });
      
      console.log('');
    });
    
    if (Object.keys(tasksByAssignee).length === 0) {
      console.log('📭 No tasks found');
    }
    
  } catch (error) {
    console.error('❌ Error listing tasks:', error.message);
  }
}

async function createTaskWithAssignment(title, description, assignee, priority = 2, projectId = 9) {
  const api = new VikunjaAPI();
  
  try {
    console.log(`📝 Creating task assigned to ${assignee}...`);
    
    // Create task
    const task = await api.createTask(projectId, {
      title,
      description,
      priority
    });
    
    // Assign with labels
    await assignTaskWithLabel(task.id, assignee, 'todo');
    
    console.log(`✅ Task created and assigned: "${task.title}" (ID: ${task.id})`);
    
    return task;
    
  } catch (error) {
    console.error('❌ Failed to create task:', error.message);
  }
}

// Add label management methods to VikunjaAPI
const axios = require('axios');

if (!VikunjaAPI.prototype.getTask) {
  VikunjaAPI.prototype.getTask = async function(taskId) {
    const response = await axios.get(`${this.baseUrl}/tasks/${taskId}`, { headers: this.headers });
    return response.data;
  };
}

VikunjaAPI.prototype.updateTaskLabels = async function(taskId, labels) {
  // First, get or create the labels
  const labelObjects = [];
  for (const label of labels) {
    if (typeof label === 'string') {
      // Create label if it doesn't exist
      try {
        const existingLabels = await this.getLabels();
        let existingLabel = existingLabels.find(l => l.title === label);
        
        if (!existingLabel) {
          existingLabel = await this.createLabel(label);
        }
        labelObjects.push(existingLabel);
      } catch (error) {
        console.log(`Creating new label: ${label}`);
        const newLabel = await this.createLabel(label);
        labelObjects.push(newLabel);
      }
    } else {
      labelObjects.push(label);
    }
  }
  
  // Update task with label objects
  const response = await axios.post(
    `${this.baseUrl}/tasks/${taskId}`,
    { labels: labelObjects },
    { headers: this.headers }
  );
  return response.data;
};

VikunjaAPI.prototype.getLabels = async function() {
  const response = await axios.get(`${this.baseUrl}/labels`, { headers: this.headers });
  return response.data;
};

VikunjaAPI.prototype.createLabel = async function(title) {
  const response = await axios.put(
    `${this.baseUrl}/labels`, 
    { title }, 
    { headers: this.headers }
  );
  return response.data;
};

function showUsage() {
  console.log(`
🏷️  Label-Based Task Assignment System

Usage:
  ./label-assignment.cjs assign TASK_ID ASSIGNEE [status]     # Assign task
  ./label-assignment.cjs status TASK_ID STATUS               # Update status  
  ./label-assignment.cjs list [assignee]                     # List tasks
  ./label-assignment.cjs create "Title" "Desc" ASSIGNEE [priority] [projectId]

Assignees: cursor-claude-sonnet, cursor-gpt-4.1-max, drlukner
Statuses: todo, in-progress, review, done, blocked

Examples:
  ./label-assignment.cjs assign 3015 drlukner in-progress
  ./label-assignment.cjs status 3015 review  
  ./label-assignment.cjs list cursor-claude-sonnet
  ./label-assignment.cjs create "Fix bug" "Description" cursor-claude-sonnet 3
`);
}

async function main() {
  const [,, command, ...args] = process.argv;
  
  switch (command) {
    case 'assign':
      if (!args[0] || !args[1]) {
        console.error('❌ Task ID and assignee required');
        process.exit(1);
      }
      await assignTaskWithLabel(parseInt(args[0]), args[1], args[2] || 'in-progress');
      break;
      
    case 'status':
      if (!args[0] || !args[1]) {
        console.error('❌ Task ID and status required');
        process.exit(1);
      }
      await updateTaskStatus(parseInt(args[0]), args[1]);
      break;
      
    case 'list':
      await listTasksByAssignee(args[0]);
      break;
      
    case 'create':
      if (!args[0] || !args[1] || !args[2]) {
        console.error('❌ Title, description, and assignee required');
        process.exit(1);
      }
      await createTaskWithAssignment(args[0], args[1], args[2], parseInt(args[3]) || 2, parseInt(args[4]) || 9);
      break;
      
    default:
      showUsage();
  }
}

if (require.main === module) {
  main();
}

module.exports = { assignTaskWithLabel, updateTaskStatus, listTasksByAssignee };