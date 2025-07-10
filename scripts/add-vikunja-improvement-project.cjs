#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console, max-lines-per-function */

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

async function createVikunjaImprovementProject() {
  try {
    // Create the Vikunja Improvement project
    const project = await api.createProject({
      title: 'Vikunja Improvement',
      description: 'Project for tracking and managing improvements to our Vikunja setup and workflows',
      color: '#4CAF50' // Green color for improvement projects
    });
    
    console.log(`✓ Created Vikunja Improvement project with ID: ${project.id}`);
    
    // Add improvement tasks to the new project
    const improvementTasks = [
      {
        title: '[INFRASTRUCTURE] Set up multi-project organization',
        description: `Create specialized projects for different aspects:
- AI Agent Development
- Infrastructure & DevOps  
- Bug Tracking & Testing
- Documentation & Knowledge
- Features & Enhancements
- Security & Compliance

Priority: 3`,
        priority: 3
      },
      {
        title: '[ENHANCEMENT] Implement enhanced task lifecycle management',
        description: `Create workflow states and transitions:
- Backlog → In Progress → Review → Testing → Deployed → Archived
- Bug workflow: Reported → Triaged → In Progress → Testing → Fixed → Verified

Priority: 3`,
        priority: 3
      },
      {
        title: '[TOOLS] Create enhanced CLI tools for multi-project support',
        description: `New scripts to create:
- vikunja-projects.cjs - Multi-project management
- vikunja-sprints.cjs - Sprint planning and tracking  
- vikunja-reports.cjs - Generate progress reports
- vikunja-metrics.cjs - Track velocity and metrics

Priority: 3`,
        priority: 3
      },
      {
        title: '[INTEGRATION] Add Git integration for task tracking',
        description: `Link tasks to commits/PRs:
- Auto-update task status on merge
- Generate changelog from completed tasks
- Link tasks to specific commits

Priority: 3`,
        priority: 3
      },
      {
        title: '[INTEGRATION] Implement CI/CD integration',
        description: `Auto-create tasks for:
- Failed builds
- Deployment status updates
- Monitoring alerts
- Performance regressions

Priority: 3`,
        priority: 3
      },
      {
        title: '[AI_AGENTS] Integrate AI agents with Vikunja',
        description: `Enable agents to:
- Create/update tasks automatically
- Categorize tasks based on content
- Report progress on ongoing work
- Suggest task priorities

Priority: 2`,
        priority: 2
      },
      {
        title: '[DOCUMENTATION] Create comprehensive usage guide',
        description: `Document:
- Best practices for AI developers
- Task templates and examples
- Workflow processes
- Integration guidelines

Priority: 2`,
        priority: 2
      },
      {
        title: '[METRICS] Set up reporting and analytics',
        description: `Track metrics like:
- Task completion rates
- Cycle time (creation to completion)
- Velocity (tasks per sprint)
- Bug resolution time

Priority: 2`,
        priority: 2
      },
      {
        title: '[SECURITY] Audit and improve task security',
        description: `Review and enhance:
- Access controls and permissions
- Data privacy for sensitive tasks
- Audit logging for task changes
- Compliance with security policies

Priority: 3`,
        priority: 3
      },
      {
        title: '[TRAINING] Train team on new Vikunja processes',
        description: `Conduct training sessions on:
- New project structure
- Enhanced workflows
- CLI tool usage
- Best practices for task management

Priority: 2`,
        priority: 2
      }
    ];
    
    console.log('\nAdding improvement tasks...');
    
    for (const task of improvementTasks) {
      try {
        await api.createTask(project.id, task);
        console.log(`✓ Added: ${task.title}`);
      } catch (error) {
        console.log(`✗ Failed to add task: ${task.title} - ${error.message}`);
      }
    }
    
    console.log(`\n✅ Vikunja Improvement project created successfully!`);
    console.log(`📋 Project ID: ${project.id}`);
    console.log(`📝 Added ${improvementTasks.length} improvement tasks`);
    console.log(`\nNext steps:`);
    console.log(`1. Review and prioritize the improvement tasks`);
    console.log(`2. Start with Phase 1 tasks (Foundation)`);
    console.log(`3. Use the improvement plan in docs/VIKUNJA_IMPROVEMENT_PLAN.md`);
    
  } catch (error) {
    console.error('Failed to create Vikunja Improvement project:', error.message);
  }
}

createVikunjaImprovementProject(); 