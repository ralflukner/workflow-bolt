#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

const PROJECT_ID = 3; // cursor-gpt-4.1-max Tasks
const TODO_REGEX = /TODO:?(.+)/i;
const SUPPORTED_EXTS = ['.js', '.ts', '.tsx', '.py', '.cjs', '.sh', '.md'];

function loadIgnorePatterns() {
  const ignoreFile = '.ignore.vikunja';
  if (!fs.existsSync(ignoreFile)) {
    return ['node_modules/**', 'venv/**', 'dist/**', 'build/**', 'coverage/**', 'logs/**', 'vendor/**'];
  }
  
  const ignoreContent = fs.readFileSync(ignoreFile, 'utf8');
  return ignoreContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(pattern => {
      // Convert .gitignore-style patterns to glob patterns
      if (pattern.startsWith('/')) {
        return pattern.substring(1) + '/**';
      }
      if (pattern.endsWith('/')) {
        return pattern + '**';
      }
      if (pattern.includes('*')) {
        return pattern;
      }
      return pattern + '/**';
    });
}

function findTodoComments() {
  const ignorePatterns = loadIgnorePatterns();
  
  // Focus on specific project directories
  const projectDirs = [
    'src/**/*.{js,ts,tsx,py,cjs,sh,md}',
    'scripts/**/*.{js,ts,tsx,py,cjs,sh,md}',
    'functions/**/*.{js,ts,tsx,py,cjs,sh,md}',
    'ai-agents/**/*.{js,ts,tsx,py,cjs,sh,md}',
    '*.{js,ts,tsx,py,cjs,sh,md}'
  ];
  
  const todos = [];
  
  for (const pattern of projectDirs) {
    const files = glob.sync(pattern, {
      ignore: ignorePatterns
    });
    
    for (const file of files) {
      // Skip files in virtual environments and third-party directories
      if (file.includes('venv') || 
          file.includes('site-packages') || 
          file.includes('node_modules') ||
          file.includes('vendor') ||
          file.includes('.git')) {
        continue;
      }
      
      const ext = path.extname(file);
      if (!SUPPORTED_EXTS.includes(ext)) continue;
      if (!fs.statSync(file).isFile()) continue;
      
      try {
        const lines = fs.readFileSync(file, 'utf8').split('\n');
        lines.forEach((line, idx) => {
          const match = line.match(TODO_REGEX);
          if (match) {
            const todoText = match[1].trim();
            // Skip very short or incomplete TODO comments
            if (todoText.length < 10 || 
                todoText.includes('= []') ||
                todoText.includes('= [') ||
                todoText.includes(':') ||
                todoText.includes('.')) {
              return;
            }
            todos.push({
              text: todoText,
              file,
              line: idx + 1
            });
          }
        });
      } catch (error) {
        console.log(`Warning: Could not read file ${file}: ${error.message}`);
      }
    }
  }
  
  return todos;
}

async function getOpenTodoTasks() {
  const tasks = await api.getTasks(PROJECT_ID);
  return tasks.filter(t => !t.done && t.title.startsWith('[TODO]'));
}

async function syncTodos() {
  const todos = findTodoComments();
  const openTasks = await getOpenTodoTasks();
  const openTitles = new Set(openTasks.map(t => t.title));
  let created = 0;
  for (const todo of todos) {
    const title = `[TODO] ${todo.text}`;
    if (openTitles.has(title)) continue;
    const description = `Found in \`${todo.file}\` at line ${todo.line}`;
    await api.createTask(PROJECT_ID, { title, description, priority: 2 });
    console.log('Created Vikunja task for TODO:', title);
    created++;
  }
  if (created === 0) {
    console.log('No new TODOs to sync.');
  }
}

async function cleanAndResync() {
  console.log('Cleaning up existing TODO tasks...');
  const openTasks = await getOpenTodoTasks();
  
  // Delete existing TODO tasks
  for (const task of openTasks) {
    try {
      await api.deleteTask(task.id);
      console.log(`Deleted: ${task.title}`);
    } catch (error) {
      console.log(`Failed to delete task ${task.id}: ${error.message}`);
    }
  }
  
  console.log(`\nDeleted ${openTasks.length} existing TODO tasks.`);
  console.log('\nRe-syncing with current codebase...');
  
  // Re-sync with current codebase
  await syncTodos();
}

async function main() {
  const [cmd] = process.argv.slice(2);
  
  if (cmd === 'clean-resync') {
    await cleanAndResync();
  } else {
    await syncTodos();
  }
}

main(); 