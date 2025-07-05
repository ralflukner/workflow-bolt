#!/usr/bin/env node

// Debug label assignment
const VikunjaAPI = require('./vikunja-api.cjs');
const axios = require('axios');

VikunjaAPI.prototype.getTask = async function(taskId) {
  const response = await axios.get(`${this.baseUrl}/tasks/${taskId}`, { headers: this.headers });
  return response.data;
};

async function debugTask(taskId) {
  const api = new VikunjaAPI();
  
  try {
    const task = await api.getTask(taskId);
    console.log(`📋 Task #${taskId}: "${task.title}"`);
    console.log(`🔗 Project ID: ${task.project_id}`);
    console.log(`✅ Done: ${task.done}`);
    console.log(`🏷️  Labels:`, task.labels);
    
    if (task.labels && task.labels.length > 0) {
      task.labels.forEach(label => {
        console.log(`  - ${label.title} (ID: ${label.id})`);
      });
    } else {
      console.log('  (no labels)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (require.main === module) {
  const taskId = process.argv[2];
  if (!taskId) {
    console.error('Usage: ./debug-labels.cjs TASK_ID');
    process.exit(1);
  }
  debugTask(parseInt(taskId));
}