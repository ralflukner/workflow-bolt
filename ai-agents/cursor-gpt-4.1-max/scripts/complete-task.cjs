#!/usr/bin/env node

// Complete assigned tasks with completion notes
const VikunjaAPI = require('./vikunja-api.cjs');

function showUsage() {
  console.log(`
✅ Universal Task Completion Tool

Usage:
  ./complete-task.cjs TASK_ID AGENT_NAME [COMPLETION_NOTES]

Examples:
  ./complete-task.cjs 3014 cursor-claude-sonnet "Successfully implemented inter-agent protocols"
  ./complete-task.cjs 3015 drlukner "Reviewed and approved project structure"

Available agents: cursor-claude-sonnet, cursor-gpt-4.1-max, drlukner
`);
}

async function completeTask(taskId, agentName, completionNotes = '') {
  const api = new VikunjaAPI();
  
  try {
    console.log(`✅ Completing task #${taskId} for ${agentName}...\n`);
    
    // Get current task
    const task = await api.getTask(taskId);
    console.log(`📋 Task: "${task.title}"`);
    
    // Create completion annotation
    const timestamp = new Date().toISOString();
    const completionInfo = `\n\n--- COMPLETION ---\nCOMPLETED BY: ${agentName}\nCOMPLETED ON: ${timestamp}${completionNotes ? `\nCOMPLETION NOTES: ${completionNotes}` : ''}`;
    
    // Update task as done with completion info
    const updatedTask = await api.updateTask(taskId, {
      done: true,
      description: (task.description || '') + completionInfo
    });
    
    console.log(`✅ Task completed by ${agentName}`);
    console.log(`📋 "${task.title}"`);
    if (completionNotes) {
      console.log(`📝 Notes: ${completionNotes}`);
    }
    
    return updatedTask;
    
  } catch (error) {
    console.error(`❌ Completion failed:`, error.message);
    process.exit(1);
  }
}

async function main() {
  const [,, taskId, agentName, ...notes] = process.argv;
  
  if (!taskId || !agentName) {
    showUsage();
    process.exit(1);
  }
  
  const completionNotes = notes.join(' ');
  await completeTask(parseInt(taskId), agentName, completionNotes);
}

if (require.main === module) {
  main();
}