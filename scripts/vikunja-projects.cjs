#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

async function listProjects() {
  try {
    const projects = await api.getProjects();
    console.log('\n📋 Available Vikunja Projects:');
    if (projects.length === 0) {
      console.log('  No projects found.');
      return;
    }
    projects.forEach(p => {
      console.log(`  -[${p.id}] ${p.title}`);
      if (p.description) {
        console.log(`    Description: ${p.description}`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to list projects:', error.message);
  }
}

async function createProject(title, description = '') {
  try {
    const project = await api.createProject({ title, description });
    console.log(`✅ Created project: [${project.id}] ${project.title}`);
  } catch (error) {
    console.error('❌ Failed to create project:', error.message);
  }
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  switch (cmd) {
    case 'list':
      await listProjects();
      break;
    case 'create':
      if (args.length < 1) {
        console.log('Usage: ./scripts/vikunja-projects.cjs create "Project Title" ["Description"]');
        return;
      }
      await createProject(args[0], args[1]);
      break;
    default:
      console.log('Usage:');
      console.log('  ./scripts/vikunja-projects.cjs list          # List all Vikunja projects');
      console.log('  ./scripts/vikunja-projects.cjs create "Title" ["Description"] # Create a new project');
  }
}

main();
