// Check existing Vikunja projects and tasks
const VikunjaAPI = require('./vikunja-api.cjs');

async function checkCurrentProjects() {
  const api = new VikunjaAPI();
  
  try {
    console.log('🔍 Checking current Vikunja projects and tasks...\n');
    
    // Get all projects
    const projects = await api.getProjects();
    console.log(`📋 Found ${projects.length} project(s):\n`);
    
    for (const project of projects) {
      console.log(`📁 Project: "${project.title}" (ID: ${project.id})`);
      console.log(`   Description: ${project.description || 'No description'}`);
      console.log(`   Created: ${project.created}`);
      console.log(`   Updated: ${project.updated}`);
      
      // Get tasks for this project
      try {
        const tasks = await api.getTasks(project.id);
        console.log(`   📝 Tasks: ${tasks.length}`);
        
        if (tasks.length > 0) {
          tasks.forEach(task => {
            console.log(`      - "${task.title}" (ID: ${task.id}) - ${task.done ? '✅ Done' : '⏳ Pending'}`);
            if (task.description) {
              console.log(`        Description: ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}`);
            }
          });
        }
      } catch (error) {
        console.log(`   ❌ Error fetching tasks: ${error.message}`);
      }
      
      console.log(''); // Empty line between projects
    }
    
  } catch (error) {
    console.error('❌ Error checking projects:', error.message);
  }
}

// Run the check
if (require.main === module) {
  checkCurrentProjects();
}

module.exports = checkCurrentProjects;