#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

const VIKUNJA_IMPROVEMENT_PROJECT_ID = 8;

async function updateTaskAssignment() {
  try {
    // Get all tasks in the improvement project
    const tasks = await api.getTasks(VIKUNJA_IMPROVEMENT_PROJECT_ID);
    
    // Find the task assignment task (should be the most recent one)
    const assignmentTask = tasks.find(t => 
      t.title.includes('Implement task assignment functionality') && 
      !t.done
    );
    
    if (assignmentTask) {
      const updatedDescription = `${assignmentTask.description}

**ASSIGNMENT:**
- **Assigned To**: cursor-gpt-4.1-max
- **Assigned Date**: ${new Date().toISOString()}
- **Status**: In Progress
- **Notes**: This task is assigned to cursor-gpt-4.1-max agent for implementation.`;

      await api.updateTask(assignmentTask.id, {
        description: updatedDescription
      });
      
      console.log(`✅ Updated task assignment for: ${assignmentTask.title}`);
      console.log(`📋 Assigned to: cursor-gpt-4.1-max`);
      console.log(`🆔 Task ID: ${assignmentTask.id}`);
    } else {
      console.log('❌ Could not find the task assignment task');
    }
    
  } catch (error) {
    console.error('Failed to update task assignment:', error.message);
  }
}

updateTaskAssignment(); 