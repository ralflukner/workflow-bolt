// Create basic project structure in Vikunja
const VikunjaAPI = require('./vikunja-api.cjs');

async function setupBasicProjects() {
  const api = new VikunjaAPI();
  
  try {
    console.log('🚀 Setting up basic project structure...\n');
    
    // Create a simple "cursor-gpt-4.1-max Tasks" project
    const projectData = {
      title: 'cursor-gpt-4.1-max Tasks',
      description: 'Tasks and work items for the cursor-gpt-4.1-max AI agent'
    };
    
    console.log('📁 Creating project: "cursor-gpt-4.1-max Tasks"');
    const response = await api.createProject(projectData);
    console.log(`✅ Project created with ID: ${response.id}`);
    
    // Add a few basic tasks to get started
    const basicTasks = [
      {
        title: 'Test API connection',
        description: 'Verify that the cursor-gpt-4.1-max agent can connect to Vikunja API',
        priority: 3
      },
      {
        title: 'Create project documentation',
        description: 'Document the project setup and API usage',
        priority: 2
      },
      {
        title: 'Set up task workflow',
        description: 'Establish workflow for creating and managing tasks',
        priority: 2
      }
    ];
    
    console.log('\n📝 Adding basic tasks...');
    for (const task of basicTasks) {
      const taskResponse = await api.createTask(response.id, task);
      console.log(`✅ Created task: "${taskResponse.title}" (ID: ${taskResponse.id})`);
    }
    
    console.log('\n🎉 Basic project setup complete!');
    console.log(`Visit http://localhost:3456 to view the project in Vikunja`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Add createProject method to the API class if it doesn't exist
async function createProject(projectData) {
  const axios = require('axios');
  const response = await axios.put(
    `${this.baseUrl}/projects`,
    projectData,
    { headers: this.headers }
  );
  return response.data;
}

// Run setup if called directly
if (require.main === module) {
  setupBasicProjects();
}