#!/usr/bin/env node
// Run a limited number of Jest test files.
// Usage: node scripts/run-tests-limit.cjs [limit]
const { execSync, spawnSync } = require('child_process');

const limit = parseInt(process.argv[2] || '50', 10);
if (isNaN(limit) || limit <= 0) {
  console.error('Please provide a positive number as limit.');
  process.exit(1);
}

try {
  const listOutput = execSync('npx jest --listTests', { encoding: 'utf8' });
  const testFiles = listOutput.trim().split('\n');
  const selected = testFiles.slice(0, limit);
  if (selected.length === 0) {
    console.log('No test files found.');
    process.exit(0);
  }
  console.log(`Running ${selected.length} test file(s) out of ${testFiles.length}...`);
  const result = spawnSync('npx', ['jest', '--runInBand', ...selected], { stdio: 'inherit' });
  process.exit(result.status);
} catch (err) {
  console.error('Error running limited tests:', err.message);
  process.exit(1);
} 