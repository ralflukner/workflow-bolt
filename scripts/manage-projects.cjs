#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

async function listProjects() {
  const projects = await api.getProjects();
  if (!projects.length) {
    console.log('No projects found.');
    return;
  }
  console.log('Available projects:');
  for (const p of projects) {
    console.log(`- [${p.id}] ${p.title}`);
  }
}

async function main() {
  const [cmd] = process.argv.slice(2);
  if (cmd === 'list') {
    await listProjects();
  } else {
    console.log('Usage: manage-projects.cjs list');
  }
}

main();