#!/usr/bin/env node

// Test the improved label-based assignment system
const VikunjaAPI = require('./vikunja-api.cjs');

async function testAssignment() {
  const api = new VikunjaAPI();
  
  try {
    console.log('🧪 Testing improved label-based assignment system...\n');
    
    // Assign task 3014 to cursor-claude-sonnet
    console.log('🎯 Assigning task #3014 to cursor-claude-sonnet...');
    await api.assignTaskToAgent(3014, 'cursor-claude-sonnet');
    
    // Update status to in-progress
    console.log('🔄 Updating task status to in-progress...');
    await api.updateTaskStatus(3014, 'in-progress');
    
    // Check the task now
    console.log('\n📋 Task after assignment:');
    const task = await api.getTask(3014);
    console.log(`Title: "${task.title}"`);
    console.log(`Labels:`, task.labels?.map(l => `${l.title} (${l.hex_color})`));
    
    // Test getting tasks by agent
    console.log('\n🤖 Getting all tasks assigned to cursor-claude-sonnet...');
    const myTasks = await api.getTasksByAgent('cursor-claude-sonnet');
    console.log(`Found ${myTasks.length} task(s):`);
    myTasks.forEach(task => {
      console.log(`  - [${task.id}] ${task.title}`);
      console.log(`    Labels: ${task.labels?.map(l => l.title).join(', ') || 'none'}`);
    });
    
    // Test getting tasks by status
    console.log('\n🔄 Getting all in-progress tasks...');
    const inProgressTasks = await api.getTasksByStatus('in-progress');
    console.log(`Found ${inProgressTasks.length} in-progress task(s):`);
    inProgressTasks.forEach(task => {
      const agentLabel = task.labels?.find(l => l.title.startsWith('agent:'));
      const agent = agentLabel ? agentLabel.title.replace('agent:', '') : 'unassigned';
      console.log(`  - [${task.id}] ${task.title} (${agent})`);
    });
    
    console.log('\n✅ Assignment system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testAssignment();
}