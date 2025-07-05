#!/usr/bin/env node

// Enhanced task management for AI agents with cross-project support
const VikunjaAPI = require('./vikunja-api.cjs');

const AGENT_PROJECTS = {
  'cursor-claude-sonnet': 10,
  'cursor-gpt-4.1-max': 3,
  'shared': 9
};

const CURRENT_AGENT = 'cursor-claude-sonnet';

async function listAgentTasks(agent = CURRENT_AGENT, showAll = false) {
  const api = new VikunjaAPI();
  
  try {
    console.log(`📋 Tasks for ${agent}:\n`);
    
    // Get tasks from agent's dedicated project
    const projectId = AGENT_PROJECTS[agent];
    if (!projectId) {
      console.error(`❌ No project found for agent: ${agent}`);
      return;
    }
    
    const tasks = await api.getTasks(projectId);
    const openTasks = showAll ? tasks : tasks.filter(task => !task.done);
    
    if (openTasks.length === 0) {
      console.log(`✅ No ${showAll ? '' : 'open '}tasks for ${agent}`);
      return;
    }
    
    // Also check shared project for tasks mentioning this agent
    const sharedTasks = await api.getTasks(AGENT_PROJECTS.shared);
    const relevantSharedTasks = sharedTasks.filter(task => 
      !task.done && task.description && task.description.includes(agent)
    );
    
    // Display agent's own tasks
    console.log(`🤖 ${agent} Project Tasks (${openTasks.length}):`);
    openTasks.forEach(task => {
      const priority = ['', '🔵', '🟡', '🟠', '🔴', '🚨'][task.priority] || '';
      const assigned = task.description && task.description.includes('ASSIGNED TO:') ? '👤' : '';
      console.log(`${priority}${assigned} [${task.id}] ${task.title}`);
      
      // Show assignment info if present
      if (task.description && task.description.includes('ASSIGNED TO:')) {
        const match = task.description.match(/ASSIGNED TO: ([^\n]+)/);
        if (match) {
          console.log(`    👤 Assigned to: ${match[1]}`);
        }
      }
      
      // Show related projects
      if (task.description && task.description.includes('Related projects:')) {
        const match = task.description.match(/Related projects: ([^\n]+)/);
        if (match) {
          console.log(`    🔗 Related: ${match[1]}`);
        }
      }
      
      console.log('');
    });
    
    // Display relevant shared tasks
    if (relevantSharedTasks.length > 0) {
      console.log(`🔄 Shared Tasks Involving ${agent} (${relevantSharedTasks.length}):`);
      relevantSharedTasks.forEach(task => {
        const priority = ['', '🔵', '🟡', '🟠', '🔴', '🚨'][task.priority] || '';
        console.log(`${priority} [${task.id}] ${task.title} (Shared)`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error listing agent tasks:', error.message);
  }
}

async function assignToSelf(taskId, comment = '') {
  const api = new VikunjaAPI();
  
  try {
    // Get task details
    const task = await api.getTask(taskId);
    
    // Create assignment annotation
    const timestamp = new Date().toISOString();
    const assignmentInfo = `\n\n--- ASSIGNMENT ---\nASSIGNED TO: ${CURRENT_AGENT}\nASSIGNED ON: ${timestamp}\nSTATUS: In Progress${comment ? `\nNOTES: ${comment}` : ''}`;
    
    // Update task
    const updatedTask = await api.updateTask(taskId, {
      description: (task.description || '') + assignmentInfo
    });
    
    console.log(`✅ Task #${taskId} assigned to ${CURRENT_AGENT}`);
    console.log(`📋 "${task.title}"`);
    
  } catch (error) {
    console.error(`❌ Failed to assign task #${taskId}:`, error.message);
  }
}

async function completeTask(taskId, notes = '') {
  const api = new VikunjaAPI();
  
  try {
    const task = await api.getTask(taskId);
    
    const timestamp = new Date().toISOString();
    const completionInfo = `\n\n--- COMPLETION ---\nCOMPLETED BY: ${CURRENT_AGENT}\nCOMPLETED ON: ${timestamp}${notes ? `\nCOMPLETION NOTES: ${notes}` : ''}`;
    
    const completedTask = await api.updateTask(taskId, {
      done: true,
      description: (task.description || '') + completionInfo
    });
    
    console.log(`✅ Task #${taskId} completed by ${CURRENT_AGENT}`);
    console.log(`📋 "${task.title}"`);
    
  } catch (error) {
    console.error(`❌ Failed to complete task #${taskId}:`, error.message);
  }
}

async function createCrossProjectTask(title, description, relatedProjects = [], relatedAgents = [], priority = 2) {
  const api = new VikunjaAPI();
  
  try {
    // Enhance description with cross-project info
    let enhancedDescription = description;
    
    if (relatedProjects.length > 0) {
      enhancedDescription += `\n\nRelated projects: ${relatedProjects.join(', ')}`;
    }
    
    if (relatedAgents.length > 0) {
      enhancedDescription += `\nRelated agents: ${relatedAgents.join(', ')}`;
    }
    
    // Create task in shared project by default
    const task = await api.createTask(AGENT_PROJECTS.shared, {
      title,
      description: enhancedDescription,
      priority
    });
    
    console.log(`✅ Cross-project task created: "${task.title}" (ID: ${task.id})`);
    
    return task;
    
  } catch (error) {
    console.error('❌ Failed to create cross-project task:', error.message);
  }
}

// Add getTask method if not exists
const axios = require('axios');
if (!VikunjaAPI.prototype.getTask) {
  VikunjaAPI.prototype.getTask = async function(taskId) {
    const response = await axios.get(`${this.baseUrl}/tasks/${taskId}`, { headers: this.headers });
    return response.data;
  };
}

function showUsage() {
  console.log(`
🤖 AI Agent Task Manager (${CURRENT_AGENT})

Usage:
  ./agent-tasks.cjs list [agent]                    # List tasks for agent
  ./agent-tasks.cjs assign TASK_ID [notes]          # Assign task to self
  ./agent-tasks.cjs complete TASK_ID [notes]        # Complete assigned task
  ./agent-tasks.cjs create "Title" "Description"    # Create cross-project task
  ./agent-tasks.cjs agents                          # List all agents

Available agents: cursor-claude-sonnet, cursor-gpt-4.1-max, shared

Examples:
  ./agent-tasks.cjs list cursor-claude-sonnet
  ./agent-tasks.cjs assign 3012 "Starting implementation"
  ./agent-tasks.cjs complete 3012 "Assignment system implemented"
  ./agent-tasks.cjs create "Fix bug X" "Cross-project bug affecting multiple agents"
`);
}

async function main() {
  const [,, command, ...args] = process.argv;
  
  switch (command) {
    case 'list':
      await listAgentTasks(args[0] || CURRENT_AGENT);
      break;
      
    case 'assign':
      if (!args[0]) {
        console.error('❌ Task ID required');
        process.exit(1);
      }
      await assignToSelf(parseInt(args[0]), args.slice(1).join(' '));
      break;
      
    case 'complete':
      if (!args[0]) {
        console.error('❌ Task ID required');
        process.exit(1);
      }
      await completeTask(parseInt(args[0]), args.slice(1).join(' '));
      break;
      
    case 'create':
      if (!args[0] || !args[1]) {
        console.error('❌ Title and description required');
        process.exit(1);
      }
      await createCrossProjectTask(args[0], args[1]);
      break;
      
    case 'agents':
      console.log('🤖 Available AI Agents:');
      Object.entries(AGENT_PROJECTS).forEach(([agent, projectId]) => {
        console.log(`  - ${agent} (Project ID: ${projectId})`);
      });
      break;
      
    default:
      showUsage();
  }
}

if (require.main === module) {
  main();
}