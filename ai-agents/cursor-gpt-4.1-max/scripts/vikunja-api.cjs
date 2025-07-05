// Vikunja API Integration for cursor-gpt-4.1-max
const axios = require('axios');

class VikunjaAPI {
  constructor(baseUrl = 'http://localhost:3456/api/v1', token = 'tk_556fc1cf49295b3c8637506e57877c21f863ec16') {
    this.baseUrl = baseUrl;
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getProjects() {
    const response = await axios.get(`${this.baseUrl}/projects`, { headers: this.headers });
    return response.data;
  }

  async createProject(project) {
    const response = await axios.post(`${this.baseUrl}/projects`, project, { headers: this.headers });
    return response.data;
  }

  async createTask(projectId, task) {
    const response = await axios.post(
      `${this.baseUrl}/projects/${projectId}/tasks`, 
      task, 
      { headers: this.headers }
    );
    return response.data;
  }

  async updateTask(taskId, updates) {
    const response = await axios.put(
      `${this.baseUrl}/tasks/${taskId}`, 
      updates, 
      { headers: this.headers }
    );
    return response.data;
  }

  async getTasks(projectId) {
    const response = await axios.get(`${this.baseUrl}/projects/${projectId}/tasks`, { headers: this.headers });
    return response.data;
  }

  async deleteTask(taskId) {
    const response = await axios.delete(`${this.baseUrl}/tasks/${taskId}`, { headers: this.headers });
    return response.data;
  }
}

// Test the API connection
async function testConnection() {
  const api = new VikunjaAPI();
  
  try {
    console.log('🔧 Testing Vikunja API connection...');
    const projects = await api.getProjects();
    console.log('✅ Connection successful!');
    console.log(`📋 Found ${projects.length} project(s):`);
    
    projects.forEach(project => {
      console.log(`  - ${project.title} (ID: ${project.id})`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

// Example usage for cursor-gpt-4.1-max
async function createDevelopmentTask() {
  const api = new VikunjaAPI();
  
  try {
    // Create a test task in the Inbox project (ID: 1)
    const newTask = await api.createTask(1, {
      title: 'cursor-gpt-4.1-max API Integration Test',
      description: 'Test task created by cursor-gpt-4.1-max to verify API integration',
      priority: 2,
      done: false
    });
    
    console.log('✅ Task created:', newTask.title);
    console.log(`📝 Task ID: ${newTask.id}`);
    
    return newTask;
  } catch (error) {
    console.error('❌ Failed to create task:', error.message);
    return null;
  }
}

module.exports = { VikunjaAPI, testConnection, createDevelopmentTask };

// Run test if called directly
if (require.main === module) {
  testConnection().then(success => {
    if (success) {
      createDevelopmentTask();
    }
  });
}