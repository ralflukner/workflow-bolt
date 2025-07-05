#!/usr/bin/env node

// Simple assignment using the enhanced Vikunja API
const VikunjaAPI = require('./vikunja-api.cjs');

async function assignToSelf() {
  const api = new VikunjaAPI();
  
  try {
    console.log('🎯 Assigning task #3014 to cursor-claude-sonnet...\n');
    
    // First, let's see what labels exist
    console.log('🏷️  Current labels:');
    const labels = await api.getLabels();
    labels.forEach(label => {
      console.log(`  - ${label.title} (ID: ${label.id}, Color: ${label.hex_color})`);
    });
    
    // Create agent label if it doesn't exist
    console.log('\n🤖 Creating/finding agent label...');
    const agentLabel = await api.findOrCreateLabel('agent:cursor-claude-sonnet', '#3b82f6');
    console.log(`✅ Agent label: ${agentLabel.title} (ID: ${agentLabel.id})`);
    
    // Create status label if it doesn't exist  
    console.log('\n📊 Creating/finding status label...');
    const statusLabel = await api.findOrCreateLabel('status:in-progress', '#3b82f6');
    console.log(`✅ Status label: ${statusLabel.title} (ID: ${statusLabel.id})`);
    
    // Get current task
    console.log('\n📋 Getting current task...');
    const task = await api.getTask(3014);
    console.log(`Task: "${task.title}"`);
    console.log(`Current labels:`, task.labels || 'none');
    
    // Try to assign using the addLabelsToTask method
    console.log('\n🔗 Adding labels to task...');
    await api.addLabelsToTask(3014, [agentLabel.id, statusLabel.id]);
    
    // Check the result
    console.log('\n✅ Assignment complete! Checking result...');
    const updatedTask = await api.getTask(3014);
    console.log(`Updated labels:`, updatedTask.labels?.map(l => `${l.title} (${l.hex_color})`) || 'none');
    
    // Now list my assigned tasks
    console.log('\n📋 My assigned tasks:');
    const myTasks = await api.getTasksByAgent('cursor-claude-sonnet');
    console.log(`Found ${myTasks.length} task(s) assigned to cursor-claude-sonnet:`);
    myTasks.forEach(task => {
      console.log(`  - [${task.id}] ${task.title}`);
    });
    
  } catch (error) {
    console.error('❌ Assignment failed:', error.message);
    console.error('Error details:', error.response?.data || error);
  }
}

if (require.main === module) {
  assignToSelf();
}