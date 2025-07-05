#!/usr/bin/env node

// Add project for human user drlukner
const VikunjaAPI = require('./vikunja-api.cjs');

async function addHumanUserProject() {
  const api = new VikunjaAPI();
  
  try {
    console.log('👨‍💻 Adding project for human user: drlukner...\n');
    
    // Create drlukner project
    const humanProject = {
      title: 'drlukner Tasks',
      description: 'Tasks assigned to and managed by Dr. Lukner (human project owner). Focus: project oversight, strategic decisions, medical domain expertise, system requirements.'
    };
    
    console.log('📁 Creating drlukner project...');
    const response = await api.createProject(humanProject);
    console.log(`✅ Created: "${response.title}" (ID: ${response.id})`);
    
    // Add initial tasks for drlukner
    const initialTasks = [
      {
        title: 'Review Vikunja project organization',
        description: `Task assigned to: drlukner
Priority: Medium
Task type: Review/Oversight

Review the current Vikunja project structure, agent assignments, and overall organization. Provide feedback on improvements and strategic direction.

Related projects: All agent projects
Related agents: cursor-claude-sonnet, cursor-gpt-4.1-max`,
        priority: 2
      },
      {
        title: 'Define medical domain requirements',
        description: `Task assigned to: drlukner  
Priority: High
Task type: Requirements/Strategy

Define specific medical and healthcare requirements for the workflow-bolt project, particularly around Tebra EHR integration and patient data handling.

Related projects: Tebra Integration Critical (ID: 7), Critical Bugs & Fixes (ID: 5)
Related agents: cursor-claude-sonnet (for documentation), cursor-gpt-4.1-max (for implementation)`,
        priority: 3
      },
      {
        title: 'Approve inter-agent coordination protocols',
        description: `Task assigned to: drlukner
Priority: Medium  
Task type: Approval/Governance

Review and approve the inter-agent communication protocols and coordination frameworks developed by the AI agents.

Related projects: Shared Agent Tasks (ID: 9)
Related agents: cursor-claude-sonnet, cursor-gpt-4.1-max
Related tasks: #3014 (Establish inter-agent communication protocol)`,
        priority: 2
      },
      {
        title: 'Set project priorities and roadmap',
        description: `Task assigned to: drlukner
Priority: High
Task type: Strategic Planning

Establish clear project priorities, timeline, and roadmap for the workflow-bolt project development. Balance immediate critical fixes with long-term strategic goals.

Related projects: All projects
Related agents: cursor-claude-sonnet (for documentation), cursor-gpt-4.1-max (for implementation)`,
        priority: 3
      }
    ];
    
    console.log('\n📝 Adding initial tasks for drlukner...');
    for (const task of initialTasks) {
      const createdTask = await api.createTask(response.id, task);
      console.log(`✅ Created: "${createdTask.title}" (ID: ${createdTask.id})`);
    }
    
    // Update agent-tasks.cjs to include drlukner
    console.log('\n🔧 Updating agent configuration...');
    
    console.log('\n📊 Updated Project Structure:');
    console.log(`👨‍💻 drlukner Tasks (ID: ${response.id}) - Human project owner`);
    console.log(`🤖 cursor-claude-sonnet Tasks (ID: 10) - AI agent`);
    console.log(`🤖 cursor-gpt-4.1-max Tasks (ID: 3) - AI agent`);
    console.log(`🔄 Shared Agent Tasks (ID: 9) - Cross-cutting tasks`);
    
    console.log('\n🎯 drlukner Initial Tasks:');
    console.log('1. Review Vikunja project organization (Medium priority)');
    console.log('2. Define medical domain requirements (High priority)');
    console.log('3. Approve inter-agent coordination protocols (Medium priority)');
    console.log('4. Set project priorities and roadmap (High priority)');
    
    console.log('\n📋 Usage for drlukner:');
    console.log('# List drlukner tasks:');
    console.log(`./scripts/agent-tasks.cjs list-project ${response.id}`);
    console.log('');
    console.log('# Create task for drlukner:');
    console.log(`./scripts/manage-tasks.cjs add "Task title" "Description for drlukner" 3 ${response.id}`);
    console.log('');
    console.log('# Via web UI:');
    console.log('http://localhost:3456');
    
    return response;
    
  } catch (error) {
    console.error('❌ Failed to add drlukner project:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  addHumanUserProject();
}