#!/usr/bin/env node

// Migrate tasks from CLAUDE.md documentation to Vikunja
const VikunjaAPI = require('./vikunja-api.cjs');

async function migrateDocsToVikunja() {
  const api = new VikunjaAPI();
  
  try {
    console.log('📚 Migrating tasks from CLAUDE.md to Vikunja...\n');
    
    // Get current projects to find Documentation project
    const projects = await api.getProjects();
    let docProjectId = projects.find(p => p.title.includes('Documentation'))?.id;
    
    if (!docProjectId) {
      // Create Documentation project if it doesn't exist
      const docProject = await api.createProject({
        title: 'Documentation & Guides',
        description: 'Project documentation, debugging guides, and setup instructions'
      });
      docProjectId = docProject.id;
      console.log(`📁 Created Documentation project (ID: ${docProjectId})`);
    }
    
    // Tasks from CLAUDE.md Auth0 Firebase Integration section
    const authTasks = [
      {
        title: 'Check Auth0 application status',
        description: 'Verify Auth0 app is active and not suspended in dashboard',
        priority: 3
      },
      {
        title: 'Verify Firebase billing enabled',
        description: 'Ensure Firebase project has billing for external API calls',
        priority: 3
      },
      {
        title: 'Fix newline characters in Secret Manager',
        description: 'Use echo -n to prevent trailing newlines in AUTH0_DOMAIN and AUTH0_AUDIENCE secrets',
        priority: 4
      },
      {
        title: 'Update emergency rollback procedures',
        description: 'Test and document Auth0 configuration rollback steps',
        priority: 2
      }
    ];
    
    console.log('🔐 Adding Auth0 Firebase tasks...');
    for (const task of authTasks) {
      await api.createTask(docProjectId, task);
      console.log(`✅ Added: "${task.title}"`);
    }
    
    // Tasks from Tebra API Integration section
    const tebraTasks = [
      {
        title: 'Document Tebra SOAP API architecture',
        description: 'Update three-tier proxy documentation (React → Firebase → PHP Cloud Run)',
        priority: 2
      },
      {
        title: 'Test Tebra health check endpoints',
        description: 'Verify tebraTestConnection and tebraHealthCheck functions',
        priority: 3
      },
      {
        title: 'Update Tebra debug tools',
        description: 'Maintain browser console helpers for tebraDebug',
        priority: 2
      }
    ];
    
    console.log('🏥 Adding Tebra EHR tasks...');
    for (const task of tebraTasks) {
      await api.createTask(docProjectId, task);
      console.log(`✅ Added: "${task.title}"`);
    }
    
    // Tasks from Vikunja setup section
    const vikunjaSetupTasks = [
      {
        title: 'Update Vikunja connection instructions',
        description: 'Keep PROJECT_MANAGEMENT_DB_CONNECTION.md current with working config',
        priority: 2
      },
      {
        title: 'Maintain API integration scripts',
        description: 'Update vikunja-api.cjs with new methods as needed',
        priority: 2
      },
      {
        title: 'Test CLI task management tool',
        description: 'Verify manage-tasks.cjs works correctly with current API',
        priority: 3
      }
    ];
    
    console.log('📋 Adding Vikunja setup tasks...');
    for (const task of vikunjaSetupTasks) {
      await api.createTask(docProjectId, task);
      console.log(`✅ Added: "${task.title}"`);
    }
    
    console.log('\n📊 Migration summary:');
    console.log('  - 4 Auth0 Firebase tasks');
    console.log('  - 3 Tebra EHR tasks');
    console.log('  - 3 Vikunja setup tasks');
    console.log('  - Total: 10 documentation tasks migrated');
    
    console.log('\n🎯 Next: Run ./scripts/manage-tasks.cjs list to see all tasks');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateDocsToVikunja();
}