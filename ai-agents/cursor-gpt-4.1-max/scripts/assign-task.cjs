#!/usr/bin/env node

// Generic task assignment script for any agent/user in the shared system
const VikunjaAPI = require('./vikunja-api.cjs');

function showUsage() {
  console.log(`
🎯 Universal Task Assignment Tool

Usage:
  ./assign-task.cjs TASK_ID AGENT_NAME [STATUS] [CATEGORY] [PRIORITY]

Arguments:
  TASK_ID     - The ID of the task to assign
  AGENT_NAME  - Who to assign to: cursor-claude-sonnet, cursor-gpt-4.1-max, drlukner, etc.
  STATUS      - Optional status: todo, in-progress, review, testing, done, blocked
  CATEGORY    - Optional category: bug, feature, refactor, documentation, testing, etc.
  PRIORITY    - Optional priority: critical, high, medium, low

Examples:
  ./assign-task.cjs 3014 cursor-claude-sonnet in-progress
  ./assign-task.cjs 3015 drlukner review documentation high
  ./assign-task.cjs 3016 cursor-gpt-4.1-max todo bug critical

Available agents: cursor-claude-sonnet, cursor-gpt-4.1-max, drlukner
`);
}

async function assignTask(taskId, agentName, status = 'assigned', category = null, priority = null) {
  const api = new VikunjaAPI();
  
  try {
    console.log(`🎯 Assigning task #${taskId} to ${agentName}...\n`);
    
    // Get current task details
    const task = await api.getTask(taskId);
    console.log(`📋 Task: "${task.title}"`);
    
    // Assign to agent
    console.log(`🤖 Assigning to ${agentName}...`);
    await api.assignTaskToAgent(taskId, agentName);
    
    // Update status if provided
    if (status && status !== 'assigned') {
      console.log(`📊 Setting status to: ${status}`);
      await api.updateTaskStatus(taskId, status);
    }
    
    // Add category label if provided
    if (category) {
      console.log(`🏷️  Adding category: ${category}`);
      const categoryLabel = await api.findOrCreateLabel(`category:${category}`);
      await api.addLabelsToTask(taskId, [categoryLabel.id]);
    }
    
    // Add priority label if provided
    if (priority) {
      console.log(`🚨 Setting priority: ${priority}`);
      const priorityLabel = await api.findOrCreateLabel(`priority:${priority}`);
      await api.addLabelsToTask(taskId, [priorityLabel.id]);
    }
    
    // Show final result
    console.log('\n✅ Assignment complete!');
    const updatedTask = await api.getTask(taskId);
    console.log(`📋 "${updatedTask.title}"`);
    console.log(`🏷️  Labels:`, updatedTask.labels?.map(l => l.title).join(', ') || 'none');
    
    // Show agent's current workload
    console.log(`\n📊 ${agentName}'s current tasks:`);
    const agentTasks = await api.getTasksByAgent(agentName);
    const openTasks = agentTasks.filter(t => !t.done);
    console.log(`${openTasks.length} open task(s):`);
    openTasks.forEach(t => {
      const statusLabel = t.labels?.find(l => l.title.startsWith('status:'));
      const taskStatus = statusLabel ? statusLabel.title.replace('status:', '') : 'unknown';
      console.log(`  - [${t.id}] ${t.title} (${taskStatus})`);
    });
    
  } catch (error) {
    console.error(`❌ Assignment failed:`, error.message);
    process.exit(1);
  }
}

async function main() {
  const [,, taskId, agentName, status, category, priority] = process.argv;
  
  if (!taskId || !agentName) {
    showUsage();
    process.exit(1);
  }
  
  // Validate agent name
  const validAgents = ['cursor-claude-sonnet', 'cursor-gpt-4.1-max', 'drlukner'];
  if (!validAgents.includes(agentName)) {
    console.error(`❌ Invalid agent: ${agentName}`);
    console.error(`Valid agents: ${validAgents.join(', ')}`);
    process.exit(1);
  }
  
  await assignTask(parseInt(taskId), agentName, status, category, priority);
}

if (require.main === module) {
  main();
}