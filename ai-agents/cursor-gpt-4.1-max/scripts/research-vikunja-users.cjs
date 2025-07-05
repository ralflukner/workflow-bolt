#!/usr/bin/env node

// Research Vikunja user assignment capabilities for cursor-claude-sonnet
const VikunjaAPI = require('./vikunja-api.cjs');

async function researchUserAssignment() {
  const api = new VikunjaAPI();
  
  try {
    console.log('🔍 Researching Vikunja user assignment capabilities...\n');
    
    // Check if we can get user information
    console.log('📋 Testing user-related endpoints:');
    
    try {
      // Try to get current user info
      const userResponse = await api.getCurrentUser();
      console.log('✅ Current user endpoint works:', userResponse);
    } catch (error) {
      console.log('❌ Current user endpoint failed:', error.message);
    }
    
    try {
      // Try to get all users (may require admin)
      const usersResponse = await api.getUsers();
      console.log('✅ Users list endpoint works:', usersResponse);
    } catch (error) {
      console.log('❌ Users list endpoint failed:', error.message);
    }
    
    // Test task assignment in a task update
    console.log('\n🎯 Testing task assignment via update...');
    try {
      const testTask = await api.createTask(3, {
        title: '[TEST] cursor-claude-sonnet assignment test',
        description: 'Testing task assignment for AI agent cursor-claude-sonnet',
        priority: 1
      });
      
      console.log(`✅ Created test task: ${testTask.id}`);
      
      // Try to assign task to cursor-claude-sonnet
      const assignmentUpdate = await api.updateTask(testTask.id, {
        assignees: [{ username: 'cursor-claude-sonnet' }]
      });
      
      console.log('✅ Task assignment successful:', assignmentUpdate);
      
      // Clean up test task
      await api.updateTask(testTask.id, { done: true });
      console.log('✅ Cleaned up test task');
      
    } catch (error) {
      console.log('❌ Task assignment failed:', error.message);
      console.log('💡 May need to create user "cursor-claude-sonnet" first');
    }
    
    console.log('\n📝 Assignment Options:');
    console.log('1. Use task descriptions for AI agent tracking');
    console.log('2. Create actual Vikunja users for AI agents');  
    console.log('3. Use task labels/tags for assignment');
    console.log('4. Use custom fields if available');
    
    // Mark the research task as in progress
    console.log('\n✅ Research complete - updating task #3007');
    await api.updateTask(3007, {
      description: 'ASSIGNED TO: cursor-claude-sonnet\nRESEARCH STATUS: In progress\n\nResearched Vikunja API for user assignment. Need to implement AI agent user creation or use description-based assignment system.'
    });
    
  } catch (error) {
    console.error('❌ Research failed:', error.message);
  }
}

// Add user-related methods to VikunjaAPI if needed
const axios = require('axios');

// Extend the API with user methods
VikunjaAPI.prototype.getCurrentUser = async function() {
  const response = await axios.get(`${this.baseUrl}/user`, { headers: this.headers });
  return response.data;
};

VikunjaAPI.prototype.getUsers = async function() {
  const response = await axios.get(`${this.baseUrl}/users`, { headers: this.headers });
  return response.data;
};

// Run research if called directly
if (require.main === module) {
  researchUserAssignment();
}