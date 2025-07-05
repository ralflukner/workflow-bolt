#!/usr/bin/env node

// Sync TODOs from codebase with Vikunja
const VikunjaAPI = require('./vikunja-api.cjs');
const fs = require('fs');
const path = require('path');

const TODO_PROJECT_ID = 3; // cursor-gpt-4.1-max Tasks

// TODO patterns to search for
const TODO_PATTERNS = [
  /\/\/\s*TODO:\s*(.+)/gi,        // // TODO: something
  /\/\/\s*FIXME:\s*(.+)/gi,       // // FIXME: something
  /\/\*\s*TODO:\s*(.+?)\s*\*\//gi, // /* TODO: something */
  /\/\*\s*FIXME:\s*(.+?)\s*\*\//gi, // /* FIXME: something */
  /#\s*TODO:\s*(.+)/gi,           // # TODO: something (Python, shell)
  /#\s*FIXME:\s*(.+)/gi,          // # FIXME: something
];

async function findTodosInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const todos = [];
    
    TODO_PATTERNS.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        todos.push({
          text: match[1].trim(),
          file: path.relative(process.cwd(), filePath),
          line: lineNumber,
          type: match[0].includes('FIXME') ? 'FIXME' : 'TODO'
        });
      }
    });
    
    return todos;
  } catch (error) {
    return [];
  }
}

async function scanForTodos(dir = '/Users/ralfb.luknermdphd/PycharmProjects/workflow-bolt', excludeDirs = ['node_modules', '.git', 'dist', 'build']) {
  const todos = [];
  
  function scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!excludeDirs.includes(item)) {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          // Only scan code files
          if (/\.(js|jsx|ts|tsx|py|md|sh|css|scss|html|json)$/.test(item)) {
            const fileTodos = findTodosInFile(fullPath);
            todos.push(...fileTodos);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }
  
  scanDirectory(dir);
  return todos;
}

async function syncTodosToVikunja() {
  const api = new VikunjaAPI();
  
  try {
    console.log('🔍 Scanning codebase for TODOs and FIXMEs...\n');
    
    const todos = await scanForTodos();
    
    if (todos.length === 0) {
      console.log('✅ No TODOs found in codebase');
      return;
    }
    
    console.log(`📝 Found ${todos.length} TODO/FIXME items:\n`);
    
    // Get existing tasks to avoid duplicates
    const existingTasks = await api.getTasks(TODO_PROJECT_ID);
    const existingTitles = new Set(existingTasks.map(task => task.title));
    
    let addedCount = 0;
    
    for (const todo of todos) {
      const title = `${todo.type}: ${todo.text}`;
      const description = `Found in: ${todo.file}:${todo.line}`;
      
      // Skip if already exists
      if (existingTitles.has(title)) {
        console.log(`⏭️  Skipping existing: "${title}"`);
        continue;
      }
      
      // Determine priority based on type
      const priority = todo.type === 'FIXME' ? 4 : 2;
      
      try {
        await api.createTask(TODO_PROJECT_ID, {
          title,
          description,
          priority
        });
        
        console.log(`✅ Added: "${title}"`);
        console.log(`   📍 ${todo.file}:${todo.line}`);
        addedCount++;
      } catch (error) {
        console.error(`❌ Failed to add: "${title}" - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Sync complete:`);
    console.log(`   - Found: ${todos.length} TODOs/FIXMEs`);
    console.log(`   - Added: ${addedCount} new tasks`);
    console.log(`   - Skipped: ${todos.length - addedCount} duplicates`);
    
    if (addedCount > 0) {
      console.log(`\n🎯 View tasks: ./scripts/manage-tasks.cjs list`);
      console.log(`🌐 Web UI: http://localhost:3456`);
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

// Enhanced manage-tasks integration
async function syncAndList() {
  await syncTodosToVikunja();
  console.log('\n' + '='.repeat(50));
  
  // Show current task list
  const { exec } = require('child_process');
  exec('./scripts/manage-tasks.cjs list', (error, stdout) => {
    if (!error) {
      console.log(stdout);
    }
  });
}

function showUsage() {
  console.log(`
🔄 TODO Sync Tool

Usage:
  ./scripts/sync-todos.cjs           # Sync TODOs to Vikunja
  ./scripts/sync-todos.cjs --list    # Sync and show task list

Searches for:
  - // TODO: comments
  - // FIXME: comments  
  - /* TODO: comments */
  - # TODO: comments (Python/shell)

File types: .js, .jsx, .ts, .tsx, .py, .md, .sh, .css, .html, .json
Excludes: node_modules, .git, dist, build
`);
}

// Main CLI handler
async function main() {
  const [,, flag] = process.argv;
  
  switch (flag) {
    case '--list':
      await syncAndList();
      break;
    case '--help':
    case '-h':
      showUsage();
      break;
    default:
      await syncTodosToVikunja();
  }
}

if (require.main === module) {
  main();
}

module.exports = { syncTodosToVikunja, scanForTodos };