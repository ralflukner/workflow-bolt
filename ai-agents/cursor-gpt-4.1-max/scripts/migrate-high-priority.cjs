#!/usr/bin/env node

// Migrate high-priority project management tasks to Vikunja
const VikunjaAPI = require('./vikunja-api.cjs');

async function migrateHighPriorityTasks() {
  const api = new VikunjaAPI();
  
  try {
    console.log('🚨 Migrating high-priority tasks to Vikunja...\n');
    
    // Create high-priority projects if they don't exist
    const projects = [
      {
        title: 'Critical Bugs & Fixes',
        description: 'Urgent issues requiring immediate attention'
      },
      {
        title: 'Auth0 Firebase Debug',
        description: 'Authentication system critical issues'
      },
      {
        title: 'Tebra Integration Critical',
        description: 'High-priority Tebra EHR integration issues'
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
    
    console.log('\n🚨 Adding critical tasks...\n');
    
    // Critical Bugs & Fixes (Project ID: createdProjects[0].id)
    const criticalTasks = [
      {
        title: 'Fix white screen dashboard issue',
        description: 'Dashboard shows blank screen - blocking user access. Check React context providers and component mounting.',
        priority: 5
      },
      {
        title: 'Resolve Tebra sync runtime error',
        description: 'appointmentsArray undefined error in syncSchedule.js line 154 - causes sync failures',
        priority: 5
      },
      {
        title: 'Fix Firebase callable function CORS errors',
        description: 'CORS 403 errors on tebraProxy function calls - blocking Tebra integration',
        priority: 4
      },
      {
        title: 'Repair JWT verification failures',
        description: 'Auth0 token validation failing with 401 errors - users cannot authenticate',
        priority: 5
      }
    ];
    
    for (const task of criticalTasks) {
      await api.createTask(createdProjects[0].id, task);
      console.log(`🚨 Added critical: "${task.title}"`);
    }
    
    // Auth0 Firebase Debug (Project ID: createdProjects[1].id)
    const authTasks = [
      {
        title: 'Fix Secret Manager newline characters',
        description: 'AUTH0_DOMAIN and AUTH0_AUDIENCE have trailing newlines causing JWT validation failures',
        priority: 4
      },
      {
        title: 'Verify Auth0 application configuration',
        description: 'Check Auth0 dashboard for suspended applications and correct domain settings',
        priority: 4
      },
      {
        title: 'Test end-to-end authentication flow',
        description: 'Complete login → token exchange → Firebase custom token workflow verification',
        priority: 3
      },
      {
        title: 'Update emergency rollback procedures',
        description: 'Document and test Auth0 configuration rollback for production incidents',
        priority: 3
      }
    ];
    
    for (const task of authTasks) {
      await api.createTask(createdProjects[1].id, task);
      console.log(`🔐 Added auth task: "${task.title}"`);
    }
    
    // Tebra Integration Critical (Project ID: createdProjects[2].id)
    const tebraTasks = [
      {
        title: 'Fix appointment sync array initialization',
        description: 'Ensure appointmentsArray is properly initialized as empty array to prevent runtime errors',
        priority: 4
      },
      {
        title: 'Test Tebra SOAP API connection',
        description: 'Verify PHP Cloud Run service can communicate with Tebra API endpoints',
        priority: 4
      },
      {
        title: 'Debug tebraProxy Firebase Function',
        description: 'Investigate and fix routing issues in tebraProxy callable function',
        priority: 4
      },
      {
        title: 'Validate patient data synchronization',
        description: 'Ensure patient appointment data flows correctly from Tebra to dashboard',
        priority: 3
      }
    ];
    
    for (const task of tebraTasks) {
      await api.createTask(createdProjects[2].id, task);
      console.log(`🏥 Added Tebra task: "${task.title}"`);
    }
    
    console.log('\n📊 Migration summary:');
    console.log(`  🚨 Critical Bugs & Fixes: ${criticalTasks.length} tasks`);
    console.log(`  🔐 Auth0 Firebase Debug: ${authTasks.length} tasks`);
    console.log(`  🏥 Tebra Integration Critical: ${tebraTasks.length} tasks`);
    console.log(`  📋 Total: ${criticalTasks.length + authTasks.length + tebraTasks.length} high-priority tasks`);
    
    console.log('\n🎯 Next steps:');
    console.log('  - Review tasks: ./scripts/manage-tasks.cjs list');
    console.log('  - Web UI: http://localhost:3456');
    console.log('  - Start with Priority 5 (🚨 Critical) tasks first');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateHighPriorityTasks();
}