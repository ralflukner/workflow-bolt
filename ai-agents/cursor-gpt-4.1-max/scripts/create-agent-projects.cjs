#!/usr/bin/env node

// Create per-agent projects and cross-project task association system
const VikunjaAPI = require('./vikunja-api.cjs');

async function createAgentProjects() {
  const api = new VikunjaAPI();
  
  try {
    console.log('🤖 Creating per-agent projects and cross-project system...\n');
    
    // Define AI agents and their roles
    const agents = [
      {
        name: 'cursor-claude-sonnet',
        title: 'cursor-claude-sonnet Tasks',
        description: 'Tasks assigned to and completed by cursor-claude-sonnet AI agent. Focus: code analysis, documentation, system architecture.'
      },
      {
        name: 'cursor-gpt-4.1-max', 
        title: 'cursor-gpt-4.1-max Tasks',
        description: 'Tasks assigned to and completed by cursor-gpt-4.1-max AI agent. Focus: implementation, debugging, testing.'
      }
    ];
    
    // Create shared/cross-cutting project
    const sharedProject = {
      title: 'Shared Agent Tasks',
      description: 'Cross-cutting tasks involving multiple agents or requiring coordination between different AI systems.'
    };
    
    console.log('📁 Creating shared project...');
    const sharedResponse = await api.createProject(sharedProject);
    console.log(`✅ Created: "${sharedResponse.title}" (ID: ${sharedResponse.id})`);
    
    // Create agent-specific projects
    const agentProjects = [];
    for (const agent of agents) {
      console.log(`🤖 Creating project for ${agent.name}...`);
      
      // Check if project already exists
      const existingProjects = await api.getProjects();
      const existing = existingProjects.find(p => p.title === agent.title);
      
      if (existing) {
        console.log(`⏭️  Project already exists: "${agent.title}" (ID: ${existing.id})`);
        agentProjects.push(existing);
      } else {
        const response = await api.createProject(agent);
        console.log(`✅ Created: "${response.title}" (ID: ${response.id})`);
        agentProjects.push(response);
      }
    }
    
    console.log('\n🎯 Adding sample tasks with cross-project references...\n');
    
    // Add sample tasks to demonstrate cross-project association
    const sampleTasks = [
      {
        project: agentProjects[0].id, // cursor-claude-sonnet
        task: {
          title: '[SELF-ASSIGNED] Implement task assignment system',
          description: `Task assigned to: cursor-claude-sonnet
Priority: High
Related projects: Vikunja Improvement (ID: 8), Shared Agent Tasks (ID: ${sharedResponse.id})
Related agents: cursor-gpt-4.1-max (for testing)

Implement description-based task assignment system for AI agents to track ownership and completion status.`,
          priority: 3
        }
      },
      {
        project: agentProjects[1].id, // cursor-gpt-4.1-max  
        task: {
          title: '[PLACEHOLDER] cursor-gpt-4.1-max coordination task',
          description: `Task assigned to: cursor-gpt-4.1-max
Priority: Medium  
Related projects: cursor-claude-sonnet Tasks (ID: ${agentProjects[0].id})
Related agents: cursor-claude-sonnet

Placeholder for future cursor-gpt-4.1-max task assignments.`,
          priority: 2
        }
      },
      {
        project: sharedResponse.id, // Shared
        task: {
          title: 'Establish inter-agent communication protocol',
          description: `Task type: Shared/Coordination
Related agents: cursor-claude-sonnet, cursor-gpt-4.1-max
Related projects: All agent projects

Define how AI agents coordinate on shared tasks, handle handoffs, and maintain project continuity.`,
          priority: 3
        }
      }
    ];
    
    // Create the sample tasks
    for (const sample of sampleTasks) {
      const task = await api.createTask(sample.project, sample.task);
      console.log(`✅ Created task: "${task.title}" (ID: ${task.id})`);
    }
    
    console.log('\n📊 Project Structure Summary:');
    console.log(`🤖 cursor-claude-sonnet Tasks (ID: ${agentProjects[0].id})`);
    console.log(`🤖 cursor-gpt-4.1-max Tasks (ID: ${agentProjects[1].id})`);
    console.log(`🔄 Shared Agent Tasks (ID: ${sharedResponse.id})`);
    
    console.log('\n🎯 Cross-Project Association System:');
    console.log('✅ Related projects: Referenced by ID in task descriptions');
    console.log('✅ Related agents: Listed in task descriptions');
    console.log('✅ Task assignment: Tracked via description annotations');
    console.log('✅ Labels: Use [AGENT: name] format for filtering');
    
    console.log('\n📋 Usage Examples:');
    console.log('# Assign task to cursor-claude-sonnet:');
    console.log('./scripts/assign-task.cjs assign TASK_ID "Starting work on this"');
    console.log('');
    console.log('# List tasks for specific agent:');
    console.log('./scripts/manage-tasks.cjs list # (will be enhanced for agent filtering)');
    console.log('');
    console.log('# Create cross-project task:');
    console.log('./scripts/manage-tasks.cjs add "Task title" "Description with Related projects: X, Y"');
    
  } catch (error) {
    console.error('❌ Failed to create agent projects:', error.message);
  }
}

// Run creation if called directly
if (require.main === module) {
  createAgentProjects();
}