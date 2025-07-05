#!/usr/bin/env node

// Assign task to cursor-claude-sonnet using the enhanced API
const VikunjaAPI = require('./vikunja-api.cjs');

async function assignMyselfToTask() {
  const api = new VikunjaAPI();
  
  try {
    console.log('🎯 Assigning myself (cursor-claude-sonnet) to task #3014...\n');
    
    // Use the built-in assignTaskToAgent method
    console.log('🤖 Using assignTaskToAgent method...');
    await api.assignTaskToAgent(3014, 'cursor-claude-sonnet');
    
    // Update status to in-progress
    console.log('📊 Updating status to in-progress...');
    await api.updateTaskStatus(3014, 'in-progress');
    
    // Check the result
    console.log('\n✅ Assignment complete! Checking result...');
    const task = await api.getTask(3014);
    console.log(`📋 Task: "${task.title}"`);
    console.log(`🏷️  Labels:`, task.labels?.map(l => `${l.title} (${l.hex_color})`) || 'none');
    
    // List all my tasks
    console.log('\n📋 All tasks assigned to cursor-claude-sonnet:');
    const myTasks = await api.getTasksByAgent('cursor-claude-sonnet');
    console.log(`Found ${myTasks.length} task(s):`);
    myTasks.forEach(task => {
      const statusLabel = task.labels?.find(l => l.title.startsWith('status:'));
      const status = statusLabel ? statusLabel.title.replace('status:', '') : 'unknown';
      console.log(`  - [${task.id}] ${task.title} (${status})`);
    });
    
    console.log('\n🎉 Task assignment successful!');
    
  } catch (error) {
    console.error('❌ Assignment failed:', error.message);
  }
}

if (require.main === module) {
  assignMyselfToTask();
}