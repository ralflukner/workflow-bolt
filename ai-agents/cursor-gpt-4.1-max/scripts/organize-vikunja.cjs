#!/usr/bin/env node

// Organize Vikunja projects and tasks for the workflow-bolt project
const VikunjaAPI = require('./vikunja-api.cjs');

async function organizeVikunja() {
  const api = new VikunjaAPI();
  
  try {
    console.log('🗂️  Organizing Vikunja project structure...\n');
    
    // Create main project categories
    const projects = [
      {
        title: 'Auth0 & Firebase Integration',
        description: 'Authentication system debugging and maintenance'
      },
      {
        title: 'Tebra EHR Integration', 
        description: 'Medical records API integration and sync functionality'
      },
      {
        title: 'Dashboard & UI',
        description: 'Frontend components and user interface improvements'
      },
      {
        title: 'Documentation & Setup',
        description: 'Project documentation, guides, and development setup'
      }
    ];
    
    const createdProjects = [];
    
    // Create projects
    for (const project of projects) {
      console.log(`📁 Creating project: "${project.title}"`);
      const response = await api.createProject(project);
      createdProjects.push(response);
      console.log(`✅ Created with ID: ${response.id}`);
    }
    
    console.log('\n📝 Adding organized tasks...\n');
    
    // Auth0 & Firebase tasks
    const authTasks = [
      {
        title: 'Fix JWT verification failures',
        description: 'Resolve Auth0 token exchange issues with Firebase Functions',
        priority: 4
      },
      {
        title: 'Update Secret Manager configuration',
        description: 'Ensure Auth0 domain and audience match across frontend/backend',
        priority: 3
      },
      {
        title: 'Test authentication flow end-to-end',
        description: 'Verify complete login → token exchange → Firebase auth',
        priority: 3
      }
    ];
    
    for (const task of authTasks) {
      await api.createTask(createdProjects[0].id, task);
      console.log(`✅ Added: "${task.title}"`);
    }
    
    // Tebra EHR tasks  
    const tebraTasks = [
      {
        title: 'Fix Tebra sync runtime errors',
        description: 'Resolve "appointmentsArray is not defined" error in syncSchedule.js',
        priority: 4
      },
      {
        title: 'Test Tebra API connection',
        description: 'Verify SOAP API communication through PHP proxy',
        priority: 3
      },
      {
        title: 'Implement appointment sync workflow',
        description: 'Complete patient data synchronization from Tebra to application',
        priority: 3
      }
    ];
    
    for (const task of tebraTasks) {
      await api.createTask(createdProjects[1].id, task);
      console.log(`✅ Added: "${task.title}"`);
    }
    
    // Dashboard & UI tasks
    const dashboardTasks = [
      {
        title: 'Debug white screen issue',
        description: 'Investigate and fix blank dashboard display',
        priority: 4
      },
      {
        title: 'Optimize React context usage',
        description: 'Review withContexts HOC and usePatientContext implementation',
        priority: 2
      },
      {
        title: 'Improve error handling UI',
        description: 'Better error messages and recovery options for users',
        priority: 2
      }
    ];
    
    for (const task of dashboardTasks) {
      await api.createTask(createdProjects[2].id, task);
      console.log(`✅ Added: "${task.title}"`);
    }
    
    // Documentation tasks
    const docTasks = [
      {
        title: 'Maintain CLAUDE.md documentation',
        description: 'Keep project instructions and debugging guides updated',
        priority: 2
      },
      {
        title: 'Organize Vikunja project structure',
        description: 'Set up proper task management and workflow organization',
        priority: 3
      },
      {
        title: 'Create deployment guides',
        description: 'Document Firebase Functions and Cloud Run deployment procedures',
        priority: 2
      }
    ];
    
    for (const task of docTasks) {
      await api.createTask(createdProjects[3].id, task);
      console.log(`✅ Added: "${task.title}"`);
    }
    
    // Clean up old test tasks from cursor-gpt-4.1-max project
    console.log('\n🧹 Cleaning up test tasks...');
    const oldTasks = await api.getTasks(3); // cursor-gpt-4.1-max Tasks project
    for (const task of oldTasks) {
      if (task.title.includes('Test') || task.title.includes('test')) {
        await api.updateTask(task.id, { done: true });
        console.log(`✅ Marked test task as done: "${task.title}"`);
      }
    }
    
    console.log('\n🎉 Vikunja organization complete!');
    console.log('📊 Project structure:');
    console.log('  - Auth0 & Firebase Integration');
    console.log('  - Tebra EHR Integration');  
    console.log('  - Dashboard & UI');
    console.log('  - Documentation & Setup');
    console.log('\nVisit http://localhost:3456 to view organized projects');
    
  } catch (error) {
    console.error('❌ Organization failed:', error.message);
  }
}

// Run organization if called directly
if (require.main === module) {
  organizeVikunja();
}