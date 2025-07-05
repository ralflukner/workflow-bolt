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

  // Get all projects
  async getProjects() {
    try {
      const response = await axios.get(`${this.baseUrl}/projects`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error.message);
      throw error;
    }
  }

  // Get tasks from a project
  async getTasks(projectId) {
    try {
      const response = await axios.get(`${this.baseUrl}/projects/${projectId}/tasks`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
      throw error;
    }
  }

  // Create a new task - Using PUT method as per API
  async createTask(projectId, taskData) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/projects/${projectId}/tasks`,
        { project_id: projectId, ...taskData },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error.message);
      throw error;
    }
  }

  // Update a task
  async updateTask(taskId, updates) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/tasks/${taskId}`,
        updates,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error.message);
      throw error;
    }
  }

  // Delete a task
  async deleteTask(taskId) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/tasks/${taskId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting task:', error.message);
      throw error;
    }
  }

  // Create a new project
  async createProject(projectData) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/projects`,
        projectData,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error.message);
      throw error;
    }
  }
}

// Test the API
async function testAPI() {
  const api = new VikunjaAPI();
  
  try {
    console.log('🔧 Testing Vikunja API connection...');
    
    // Get all projects
    const projects = await api.getProjects();
    console.log('✅ Connection successful!');
    console.log(`📋 Found ${projects.length} project(s):`);
    projects.forEach(p => console.log(`  - ${p.title} (ID: ${p.id})`));
    
    // Create a test task
    console.log('\n📝 Creating test task...');
    const newTask = await api.createTask(1, {
      title: 'Test Task from cursor-gpt-4.1-max',
      description: 'This is a test task created via API',
      priority: 3
    });
    console.log(`✅ Task created: "${newTask.title}" (ID: ${newTask.id})`);
    
    // Get tasks from Inbox project
    console.log('\n📋 Fetching tasks from Inbox project...');
    const tasks = await api.getTasks(1);
    console.log(`Found ${tasks.length} task(s)`);
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Export for use in other modules
module.exports = VikunjaAPI;

// Run test if called directly
if (require.main === module) {
  testAPI();
}