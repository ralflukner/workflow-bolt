#!/usr/bin/env node

// Simple task assignment using description updates
const VikunjaAPI = require('./vikunja-api.cjs');

function showUsage() {
  console.log(`
🎯 Simple Task Assignment Tool

Usage:
  ./simple-assign.cjs TASK_ID AGENT_NAME [STATUS]

Examples:
  ./simple-assign.cjs 3014 cursor-claude-sonnet in-progress
  ./simple-assign.cjs 3015 drlukner review
  ./simple-assign.cjs 3016 cursor-gpt-4.1-max todo

Available agents: cursor-claude-sonnet, cursor-gpt-4.1-max, drlukner
`);
}

async function simpleAssign(taskId, agentName, status = 'assigned') {
  const api = new VikunjaAPI();
  
  try {
    console.log(`🎯 Assigning task #${taskId} to ${agentName}...\n`);
    
    // Get current task
    const task = await api.getTask(taskId);
    console.log(`📋 Task: "${task.title}"`);
    
    // Create assignment annotation
    const timestamp = new Date().toISOString();
    const assignmentInfo = `\n\n--- ASSIGNMENT ---\nASSIGNED TO: ${agentName}\nSTATUS: ${status}\nASSIGNED ON: ${timestamp}`;
    
    // Update task description
    const updatedDescription = (task.description || '') + assignmentInfo;
    
    const updatedTask = await api.updateTask(taskId, {
      description: updatedDescription
    });
    
    console.log(`✅ Task assigned to ${agentName} with status: ${status}`);
    console.log(`📋 "${task.title}"`);
    
    return updatedTask;
    
  } catch (error) {
    console.error(`❌ Assignment failed:`, error.message);
    process.exit(1);
  }
}

async function main() {
  const [,, taskId, agentName, status] = process.argv;
  
  if (!taskId || !agentName) {
    showUsage();
    process.exit(1);
  }
  
  await simpleAssign(parseInt(taskId), agentName, status);
}

if (require.main === module) {
  main();
}