#!/usr/bin/env node

// Simple task assignment system for AI agents using descriptions
const VikunjaAPI = require('./vikunja-api.cjs');

async function assignTask(taskId, assignee, comment = '') {
  const api = new VikunjaAPI();
  
  try {
    // Get current task details
    const task = await api.getTask(taskId);
    
    // Create assignment annotation
    const assignmentInfo = `\n\n--- ASSIGNMENT ---\nASSIGNED TO: ${assignee}\nASSIGNED ON: ${new Date().toISOString()}\nSTATUS: In Progress${comment ? `\nCOMMENT: ${comment}` : ''}`;
    
    // Update task with assignment
    const updatedTask = await api.updateTask(taskId, {
      description: task.description + assignmentInfo
    });
    
    console.log(`✅ Task #${taskId} assigned to ${assignee}`);
    console.log(`📋 Task: "${task.title}"`);
    
    return updatedTask;
    
  } catch (error) {
    console.error(`❌ Failed to assign task #${taskId}:`, error.message);
    throw error;
  }
}

async function completeTask(taskId, completionComment = '') {
  const api = new VikunjaAPI();
  
  try {
    // Get current task
    const task = await api.getTask(taskId);
    
    // Add completion info
    const completionInfo = `\n\n--- COMPLETION ---\nCOMPLETED BY: cursor-claude-sonnet\nCOMPLETED ON: ${new Date().toISOString()}${completionComment ? `\nCOMPLETION NOTES: ${completionComment}` : ''}`;
    
    // Mark task as done with completion info
    const completedTask = await api.updateTask(taskId, {
      done: true,
      description: task.description + completionInfo
    });
    
    console.log(`✅ Task #${taskId} completed by cursor-claude-sonnet`);
    console.log(`📋 Task: "${task.title}"`);
    
    return completedTask;
    
  } catch (error) {
    console.error(`❌ Failed to complete task #${taskId}:`, error.message);
    throw error;
  }
}

// Add getTask method to API
VikunjaAPI.prototype.getTask = async function(taskId) {
  const axios = require('axios');
  const response = await axios.get(`${this.baseUrl}/tasks/${taskId}`, { headers: this.headers });
  return response.data;
};

// CLI interface
async function main() {
  const [,, command, taskId, ...args] = process.argv;
  
  switch (command) {
    case 'assign':
      if (!taskId) {
        console.error('❌ Task ID required');
        console.log('Usage: ./assign-task.cjs assign TASK_ID [comment]');
        process.exit(1);
      }
      await assignTask(parseInt(taskId), 'cursor-claude-sonnet', args.join(' '));
      break;
      
    case 'complete':
      if (!taskId) {
        console.error('❌ Task ID required');
        console.log('Usage: ./assign-task.cjs complete TASK_ID [completion_notes]');
        process.exit(1);
      }
      await completeTask(parseInt(taskId), args.join(' '));
      break;
      
    default:
      console.log(`
🎯 Task Assignment Tool for cursor-claude-sonnet

Usage:
  ./assign-task.cjs assign TASK_ID [comment]     # Assign task to cursor-claude-sonnet
  ./assign-task.cjs complete TASK_ID [notes]     # Complete assigned task

Examples:
  ./assign-task.cjs assign 3007 "Starting research on user assignment"
  ./assign-task.cjs complete 3007 "Implemented description-based assignment system"
`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { assignTask, completeTask };