#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

async function showLabelDashboard() {
  console.log('\n' + '='.repeat(80));
  console.log('🏷️  VIKUNJA LABEL DASHBOARD');
  console.log('='.repeat(80));
  
  try {
    // Get all labels
    const labels = await api.getLabels();
    
    // Get all projects and tasks
    const projects = await api.getProjects();
    const allTasks = [];
    
    for (const project of projects) {
      const tasks = await api.getTasks(project.id);
      allTasks.push(...tasks.map(task => ({ ...task, project_name: project.title })));
    }
    
    // Group labels by type
    const groupedLabels = {
      agents: labels.filter(l => l.title.startsWith('agent:')),
      status: labels.filter(l => l.title.startsWith('status:')),
      categories: labels.filter(l => l.title.startsWith('category:')),
      priority: labels.filter(l => l.title.startsWith('priority:'))
    };
    
    // Show agent assignments
    console.log('\n👥 AGENT ASSIGNMENTS:');
    console.log('-'.repeat(80));
    
    for (const agentLabel of groupedLabels.agents) {
      const agentName = agentLabel.title.replace('agent:', '');
      const agentTasks = allTasks.filter(task => 
        task.labels && task.labels.some(l => l.id === agentLabel.id)
      );
      
      const openTasks = agentTasks.filter(t => !t.done);
      const completedTasks = agentTasks.filter(t => t.done);
      
      console.log(`🤖 ${agentName}:`);
      console.log(`   📋 Total: ${agentTasks.length} tasks`);
      console.log(`   🔄 Open: ${openTasks.length}`);
      console.log(`   ✅ Completed: ${completedTasks.length}`);
      
      // Show status breakdown for this agent
      const statusBreakdown = {};
      openTasks.forEach(task => {
        const statusLabels = task.labels?.filter(l => l.title.startsWith('status:')) || [];
        statusLabels.forEach(label => {
          const status = label.title.replace('status:', '');
          statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
        });
      });
      
      if (Object.keys(statusBreakdown).length > 0) {
        console.log(`   📊 Status breakdown:`);
        Object.entries(statusBreakdown).forEach(([status, count]) => {
          console.log(`      ${status}: ${count} tasks`);
        });
      }
      console.log('');
    }
    
    // Show status overview
    console.log('📊 STATUS OVERVIEW:');
    console.log('-'.repeat(80));
    
    for (const statusLabel of groupedLabels.status) {
      const statusName = statusLabel.title.replace('status:', '');
      const statusTasks = allTasks.filter(task => 
        task.labels && task.labels.some(l => l.id === statusLabel.id)
      );
      
      const openTasks = statusTasks.filter(t => !t.done);
      
      if (openTasks.length > 0) {
        console.log(`📋 ${statusName.toUpperCase()}: ${openTasks.length} tasks`);
        openTasks.slice(0, 5).forEach(task => {
          const agentLabels = task.labels?.filter(l => l.title.startsWith('agent:')) || [];
          const agents = agentLabels.map(l => l.title.replace('agent:', '')).join(', ') || 'unassigned';
          console.log(`   [${task.priority}] #${task.id} - ${task.title} → ${agents}`);
        });
        if (openTasks.length > 5) {
          console.log(`   ... and ${openTasks.length - 5} more tasks`);
        }
        console.log('');
      }
    }
    
    // Show category breakdown
    console.log('📂 CATEGORY BREAKDOWN:');
    console.log('-'.repeat(80));
    
    for (const categoryLabel of groupedLabels.categories) {
      const categoryName = categoryLabel.title.replace('category:', '');
      const categoryTasks = allTasks.filter(task => 
        task.labels && task.labels.some(l => l.id === categoryLabel.id)
      );
      
      const openTasks = categoryTasks.filter(t => !t.done);
      
      if (openTasks.length > 0) {
        console.log(`📁 ${categoryName.toUpperCase()}: ${openTasks.length} tasks`);
        openTasks.slice(0, 3).forEach(task => {
          const agentLabels = task.labels?.filter(l => l.title.startsWith('agent:')) || [];
          const statusLabels = task.labels?.filter(l => l.title.startsWith('status:')) || [];
          const agent = agentLabels.length > 0 ? agentLabels[0].title.replace('agent:', '') : 'unassigned';
          const status = statusLabels.length > 0 ? statusLabels[0].title.replace('status:', '') : 'unknown';
          console.log(`   [${task.priority}] #${task.id} - ${task.title} (${status} → ${agent})`);
        });
        if (openTasks.length > 3) {
          console.log(`   ... and ${openTasks.length - 3} more tasks`);
        }
        console.log('');
      }
    }
    
    // Show priority overview
    console.log('🎯 PRIORITY OVERVIEW:');
    console.log('-'.repeat(80));
    
    for (const priorityLabel of groupedLabels.priority) {
      const priorityName = priorityLabel.title.replace('priority:', '');
      const priorityTasks = allTasks.filter(task => 
        task.labels && task.labels.some(l => l.id === priorityLabel.id)
      );
      
      const openTasks = priorityTasks.filter(t => !t.done);
      
      if (openTasks.length > 0) {
        console.log(`🔥 ${priorityName.toUpperCase()}: ${openTasks.length} tasks`);
        openTasks.forEach(task => {
          const agentLabels = task.labels?.filter(l => l.title.startsWith('agent:')) || [];
          const statusLabels = task.labels?.filter(l => l.title.startsWith('status:')) || [];
          const agent = agentLabels.length > 0 ? agentLabels[0].title.replace('agent:', '') : 'unassigned';
          const status = statusLabels.length > 0 ? statusLabels[0].title.replace('status:', '') : 'unknown';
          console.log(`   [${task.priority}] #${task.id} - ${task.title} (${status} → ${agent})`);
        });
        console.log('');
      }
    }
    
    // Show unlabeled tasks
    const unlabeledTasks = allTasks.filter(task => 
      !task.done && (!task.labels || task.labels.length === 0)
    );
    
    if (unlabeledTasks.length > 0) {
      console.log('🏷️  UNLABELED TASKS:');
      console.log('-'.repeat(80));
      console.log(`📋 Found ${unlabeledTasks.length} unlabeled tasks:`);
      unlabeledTasks.slice(0, 10).forEach(task => {
        console.log(`   [${task.priority}] #${task.id} - ${task.title} (${task.project_name})`);
      });
      if (unlabeledTasks.length > 10) {
        console.log(`   ... and ${unlabeledTasks.length - 10} more tasks`);
      }
      console.log('');
    }
    
    // Show statistics
    console.log('📈 LABEL STATISTICS:');
    console.log('-'.repeat(80));
    
    const totalTasks = allTasks.length;
    const openTasks = allTasks.filter(t => !t.done);
    const labeledTasks = openTasks.filter(t => t.labels && t.labels.length > 0);
    const unlabeledCount = openTasks.length - labeledTasks.length;
    
    console.log(`📊 Total tasks: ${totalTasks}`);
    console.log(`📋 Open tasks: ${openTasks.length}`);
    console.log(`🏷️  Labeled tasks: ${labeledTasks.length}`);
    console.log(`❓ Unlabeled tasks: ${unlabeledCount}`);
    console.log(`👥 Agent labels: ${groupedLabels.agents.length}`);
    console.log(`📊 Status labels: ${groupedLabels.status.length}`);
    console.log(`📂 Category labels: ${groupedLabels.categories.length}`);
    console.log(`🎯 Priority labels: ${groupedLabels.priority.length}`);
    
    // Show recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(80));
    
    const recommendations = [];
    
    if (unlabeledCount > 0) {
      recommendations.push(`🏷️  ${unlabeledCount} tasks need labels - run 'npm run labels:bulk' to assign`);
    }
    
    // Check for overloaded agents
    for (const agentLabel of groupedLabels.agents) {
      const agentName = agentLabel.title.replace('agent:', '');
      const agentTasks = allTasks.filter(task => 
        !task.done && task.labels && task.labels.some(l => l.id === agentLabel.id)
      );
      
      if (agentTasks.length > 15) {
        recommendations.push(`⚠️  ${agentName} has ${agentTasks.length} tasks - consider reassignment`);
      }
    }
    
    // Check for blocked tasks
    const blockedTasks = allTasks.filter(task => 
      !task.done && task.labels && task.labels.some(l => l.title === 'status:blocked')
    );
    
    if (blockedTasks.length > 5) {
      recommendations.push(`🚫 ${blockedTasks.length} blocked tasks - review and unblock`);
    }
    
    if (recommendations.length === 0) {
      console.log('✅ All tasks are well-organized with labels!');
    } else {
      recommendations.forEach(rec => console.log(rec));
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Failed to generate label dashboard:', error.message);
  }
}

async function showAgentWorkload(agentName) {
  console.log(`\n=== WORKLOAD FOR ${agentName.toUpperCase()} ===\n`);
  
  try {
    const agentTasks = await api.getTasksByAgent(agentName);
    const openTasks = agentTasks.filter(t => !t.done);
    
    if (openTasks.length === 0) {
      console.log(`No open tasks assigned to ${agentName}.`);
      return;
    }
    
    // Group by status
    const statusGroups = {};
    openTasks.forEach(task => {
      const statusLabels = task.labels?.filter(l => l.title.startsWith('status:')) || [];
      const status = statusLabels.length > 0 ? statusLabels[0].title.replace('status:', '') : 'unknown';
      if (!statusGroups[status]) statusGroups[status] = [];
      statusGroups[status].push(task);
    });
    
    console.log(`📋 Total open tasks: ${openTasks.length}`);
    console.log('');
    
    Object.entries(statusGroups).forEach(([status, tasks]) => {
      console.log(`📊 ${status.toUpperCase()} (${tasks.length} tasks):`);
      tasks.forEach(task => {
        const categoryLabels = task.labels?.filter(l => l.title.startsWith('category:')) || [];
        const priorityLabels = task.labels?.filter(l => l.title.startsWith('priority:')) || [];
        const category = categoryLabels.length > 0 ? categoryLabels[0].title.replace('category:', '') : '';
        const priority = priorityLabels.length > 0 ? priorityLabels[0].title.replace('priority:', '') : '';
        
        console.log(`   [${task.priority}] #${task.id} - ${task.title}`);
        if (category) console.log(`      📂 Category: ${category}`);
        if (priority) console.log(`      🎯 Priority: ${priority}`);
      });
      console.log('');
    });
    
  } catch (error) {
    console.error(`❌ Failed to get workload for ${agentName}:`, error.message);
  }
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  
  switch (cmd) {
    case 'overview':
      await showLabelDashboard();
      break;
      
    case 'workload':
      const agentName = args[0] || 'cursor-gpt-4.1-max';
      await showAgentWorkload(agentName);
      break;
      
    default:
      console.log('Usage:');
      console.log('  ./scripts/label-dashboard.cjs overview              # Show full label dashboard');
      console.log('  ./scripts/label-dashboard.cjs workload [agent]      # Show agent workload');
  }
}

main(); 