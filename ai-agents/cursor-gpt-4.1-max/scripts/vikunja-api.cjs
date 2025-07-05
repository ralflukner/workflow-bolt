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

  // Get all labels
  async getLabels() {
    try {
      const response = await axios.get(`${this.baseUrl}/labels`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching labels:', error.message);
      throw error;
    }
  }

  // Create a new label
  async createLabel(title, hexColor = '#1973ff') {
    try {
      const response = await axios.put(
        `${this.baseUrl}/labels`,
        {
          title,
          hex_color: hexColor
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating label:', error.message);
      throw error;
    }
  }

  // Get a specific task with full details
  async getTask(taskId) {
    try {
      const response = await axios.get(`${this.baseUrl}/tasks/${taskId}`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching task:', error.message);
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

  // Add labels to a task
  async addLabelsToTask(taskId, labelIds) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/tasks/${taskId}/labels`,
        { label_ids: labelIds },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding labels to task:', error.message);
      throw error;
    }
  }

  // Remove labels from a task
  async removeLabelsFromTask(taskId, labelIds) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/tasks/${taskId}/labels`,
        {
          headers: this.headers,
          data: { label_ids: labelIds }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error removing labels from task:', error.message);
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

  // Find or create label by title
  async findOrCreateLabel(title, hexColor = '#1973ff') {
    try {
      const labels = await this.getLabels();
      const existingLabel = labels.find(label => label.title === title);
      
      if (existingLabel) {
        return existingLabel;
      }
      
      return await this.createLabel(title, hexColor);
    } catch (error) {
      console.error('Error finding or creating label:', error.message);
      throw error;
    }
  }

  // Assign task to agent using labels
  async assignTaskToAgent(taskId, agentName) {
    try {
      // Create or find agent label
      const agentLabel = await this.findOrCreateLabel(
        `agent:${agentName}`,
        agentName.includes('cursor') ? '#3b82f6' : '#10b981'
      );
      
      // Create or find status label
      const statusLabel = await this.findOrCreateLabel(
        'status:assigned',
        '#f59e0b'
      );
      
      // Add labels to task
      await this.addLabelsToTask(taskId, [agentLabel.id, statusLabel.id]);
      
      console.log(`✅ Task ${taskId} assigned to ${agentName} using labels`);
      return true;
    } catch (error) {
      console.error('Error assigning task to agent:', error.message);
      throw error;
    }
  }

  // Update task status using labels
  async updateTaskStatus(taskId, status) {
    try {
      const statusLabels = {
        'todo': '#6b7280',
        'in-progress': '#3b82f6', 
        'review': '#f59e0b',
        'testing': '#8b5cf6',
        'done': '#10b981',
        'blocked': '#ef4444'
      };
      
      // Remove old status labels
      const task = await this.getTask(taskId);
      const oldStatusLabels = task.labels.filter(label => label.title.startsWith('status:'));
      if (oldStatusLabels.length > 0) {
        await this.removeLabelsFromTask(taskId, oldStatusLabels.map(l => l.id));
      }
      
      // Add new status label
      const statusLabel = await this.findOrCreateLabel(
        `status:${status}`,
        statusLabels[status] || '#6b7280'
      );
      
      await this.addLabelsToTask(taskId, [statusLabel.id]);
      
      console.log(`✅ Task ${taskId} status updated to ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating task status:', error.message);
      throw error;
    }
  }

  // Get tasks by label
  async getTasksByLabel(labelTitle) {
    try {
      const labels = await this.getLabels();
      const label = labels.find(l => l.title === labelTitle);
      
      if (!label) {
        return [];
      }
      
      // Get all projects and search for tasks with this label
      const projects = await this.getProjects();
      const tasksWithLabel = [];
      
      for (const project of projects) {
        const tasks = await this.getTasks(project.id);
        const filteredTasks = tasks.filter(task => 
          task.labels && task.labels.some(l => l.id === label.id)
        );
        tasksWithLabel.push(...filteredTasks);
      }
      
      return tasksWithLabel;
    } catch (error) {
      console.error('Error getting tasks by label:', error.message);
      throw error;
    }
  }

  // Get tasks assigned to specific agent
  async getTasksByAgent(agentName) {
    return this.getTasksByLabel(`agent:${agentName}`);
  }

  // Get tasks by status
  async getTasksByStatus(status) {
    return this.getTasksByLabel(`status:${status}`);
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
    
    // Test label functionality
    console.log('\n🏷️  Testing label functionality...');
    const testLabel = await api.findOrCreateLabel('test-label', '#ff0000');
    console.log(`✅ Label created/found: "${testLabel.title}" (ID: ${testLabel.id})`);
    
    // Create a test task with labels
    console.log('\n📝 Creating test task with labels...');
    const newTask = await api.createTask(1, {
      title: 'Test Task with Labels',
      description: 'This is a test task with label assignment',
      priority: 3
    });
    console.log(`✅ Task created: "${newTask.title}" (ID: ${newTask.id})`);
    
    // Assign task to agent using labels
    await api.assignTaskToAgent(newTask.id, 'cursor-gpt-4.1-max');
    
    // Update task status
    await api.updateTaskStatus(newTask.id, 'in-progress');
    
    console.log('\n✅ Label functionality test completed!');
    
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