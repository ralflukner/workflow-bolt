#!/usr/bin/env ts-node

/**
 * Test runner for Tebra Sync integration tests
 * 
 * Usage:
 *   npm run test:sync
 *   npm run test:sync -- --verbose
 *   npm run test:sync -- --testNamePattern="successful sync"
 */

import { execSync } from 'child_process';
import * as path from 'path';

const testFile = path.join(__dirname, 'syncSchedule.integration.test.ts');

console.log('🧪 Running Tebra Sync Integration Tests...\n');

try {
  const args = process.argv.slice(2).join(' ');
  const command = `npx jest ${testFile} ${args} --colors`;
  
  execSync(command, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '../../..'),
  });
  
  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('\n❌ Tests failed!');
  process.exit(1);
}