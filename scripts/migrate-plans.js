#!/usr/bin/env node

/**
 * Project Plan Migration Script - JavaScript Version
 * Migrates all scattered project plans into Vikunja via API calls
 */

const VIKUNJA_BASE_URL = 'http://localhost:3456';
const API_BASE = `${VIKUNJA_BASE_URL}/api/v1`;

// You'll need to get this token from Vikunja settings after creating your account
const VIKUNJA_TOKEN = process.env.VITE_VIKUNJA_TOKEN || '';

if (!VIKUNJA_TOKEN) {
  console.log('❌ VITE_VIKUNJA_TOKEN environment variable not set');
  console.log('📝 Steps to get token:');
  console.log('1. Visit http://localhost:3456');
  console.log('2. Create account or login');
  console.log('3. Go to Settings → API Tokens');
  console.log('4. Create new token');
  console.log('5. Set environment variable: export VITE_VIKUNJA_TOKEN=your_token_here');
  process.exit(1);
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VIKUNJA_TOKEN}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

async function createProject(title, description) {
  return apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify({ title, description })
  });
}

async function createTask(projectId, title, description, priority = 2) {
  return apiRequest(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      description,
      priority,
      project_id: projectId
    })
  });
}

// Master project plans data
const PROJECT_PLANS = [
  {
    name: 'Code Review Action Plan - Phase 1.5',
    description: 'Complete test failure repair and TypeScript error cleanup from original 4-phase action plan',
    priority: 'high',
    sourceFile: 'ACTION_PLAN.md',
    tasks: [
      {
        title: 'Fix failing test suites (12 currently failing)',
        description: `
**Priority**: HIGH
**Estimated**: 16 hours

Repair all failing Jest tests, focus on React Query and component testing issues.

**Acceptance Criteria**:
- All 12 failing test suites pass
- No new test failures introduced  
- Test coverage maintained or improved

**Tags**: testing, jest, react-query
        `.trim(),
        priority: 4
      },
      {
        title: 'Reduce TypeScript errors to <5',
        description: `
**Priority**: HIGH
**Estimated**: 8 hours

Currently 16 TypeScript errors, target reduction to under 5 errors.

**Acceptance Criteria**:
- TypeScript error count under 5
- No type safety regressions
- Clean build process

**Tags**: typescript, compilation
        `.trim(),
        priority: 4
      }
    ]
  },
  {
    name: 'Tebra Debug Dashboard Refactor',
    description: 'Refactor monolithic 780-line TebraDebugDashboard into modular components with zero behavioral changes',
    priority: 'high',
    sourceFile: 'docs/03-application/tebra-debug-dashboard-implementation-plan.md',
    tasks: [
      {
        title: 'Break down 780-line monolith into <200 line modules',
        description: `
**Priority**: HIGH
**Estimated**: 20 hours

Split TebraDebugDashboard into focused, testable components.

**Acceptance Criteria**:
- No single component over 200 lines
- Zero behavioral changes
- Improved maintainability

**Tags**: refactor, tebra, components
        `.trim(),
        priority: 4
      },
      {
        title: 'Fix "Sync Today" functionality - CRITICAL',
        description: `
**Priority**: URGENT
**Estimated**: 8 hours

Resolve current sync failures and runtime errors in Tebra integration.

**Current Issue**: appointmentsArray undefined error in syncSchedule.js

**Acceptance Criteria**:
- Sync Today button works without errors
- Proper error handling and logging
- User feedback on sync status

**Tags**: bugfix, tebra, sync, critical
        `.trim(),
        priority: 4
      },
      {
        title: 'Achieve >85% test coverage',
        description: `
**Priority**: MEDIUM
**Estimated**: 16 hours

Add comprehensive tests for all new modular components.

**Acceptance Criteria**:
- Test coverage above 85%
- All critical paths tested
- Edge cases covered

**Tags**: testing, coverage
        `.trim(),
        priority: 3
      }
    ]
  },
  {
    name: 'Dashboard Hook to Class Migration',
    description: 'Convert remaining 13/22 dashboard components from hooks to classes for improved stability',
    priority: 'medium',
    sourceFile: 'docs/05-governance/ROADMAP.md',
    tasks: [
      {
        title: 'Convert remaining 13 hook-based components',
        description: `
**Priority**: MEDIUM
**Estimated**: 40 hours

Systematically convert components to class-based architecture.

**Progress**: 9/22 components converted
**Remaining**: 13 components

**Acceptance Criteria**:
- All 22 dashboard components are class-based
- No functionality regressions
- Improved component stability

**Tags**: react, refactor, components
        `.trim(),
        priority: 3
      }
    ]
  },
  {
    name: 'Redis Architecture Migration',
    description: 'Replace Firebase/Auth0 complexity with Redis-based architecture for better performance and control',
    priority: 'high',
    sourceFile: 'docs/Redis-Implementation-Master-Plan.md',
    tasks: [
      {
        title: 'Complete Redis design documentation',
        description: `
**Priority**: HIGH
**Estimated**: 24 hours

Finalize architecture designs and implementation specifications.

**Multi-agent coordination required**

**Acceptance Criteria**:
- Complete architecture documentation
- Implementation specifications
- Migration plan documented

**Tags**: redis, architecture, design
        `.trim(),
        priority: 4
      },
      {
        title: 'Implement Redis 2FA authentication system',
        description: `
**Priority**: HIGH  
**Estimated**: 40 hours
**Current Status**: 75% complete, Week 3 of 3

Build secure 2FA system using Redis as the backend store.

**Acceptance Criteria**:
- 2FA fully functional
- Secure token management
- User management system

**Tags**: redis, 2fa, auth
        `.trim(),
        priority: 4
      }
    ]
  },
  {
    name: 'Security & Compliance Remediation',
    description: 'Address critical HIPAA compliance and authentication security issues',
    priority: 'urgent',
    sourceFile: 'endpoint_authentication_plan.py',
    tasks: [
      {
        title: 'Fix endpoint authentication vulnerabilities - CRITICAL',
        description: `
**Priority**: URGENT
**Estimated**: 12 hours

Address critical authentication issues that impact HIPAA compliance.

**Critical HIPAA compliance issue requiring immediate coordination**

**Acceptance Criteria**:
- All endpoints properly authenticated
- HIPAA compliance verified
- Security audit passed

**Tags**: security, authentication, hipaa, critical
        `.trim(),
        priority: 4
      },
      {
        title: 'Implement comprehensive audit logging',
        description: `
**Priority**: HIGH
**Estimated**: 8 hours

Add detailed audit logs for all patient data access.

**Acceptance Criteria**:
- All patient data access logged
- Audit trail compliant with HIPAA
- Log analysis capabilities

**Tags**: security, logging, audit, hipaa
        `.trim(),
        priority: 4
      }
    ]
  },
  {
    name: 'Documentation Reorganization',
    description: 'Reorganize 130+ markdown files into structured documentation system',
    priority: 'medium',
    sourceFile: 'docs/DOCUMENTATION_REORG_PLAN.md',
    tasks: [
      {
        title: 'Complete 5-phase documentation restructure',
        description: `
**Priority**: MEDIUM
**Estimated**: 16 hours
**Current Status**: Phase 2 in progress

Organize files into:
- 00-overview
- 01-compliance  
- 02-infrastructure
- 03-application
- 04-ops
- 05-governance

**Acceptance Criteria**:
- All 130+ files properly categorized
- Clear navigation structure
- Updated cross-references

**Tags**: documentation, organization
        `.trim(),
        priority: 2
      }
    ]
  },
  {
    name: 'White Screen Issue Resolution',
    description: 'Systematic 4-phase debugging plan for application white screen issues',
    priority: 'high',
    sourceFile: 'white_screen_assessment_plan.py',
    tasks: [
      {
        title: 'Phase 1: Function status verification',
        description: `
**Priority**: HIGH
**Estimated**: 2 hours

Verify all Firebase Functions are deployed and responding.

**Acceptance Criteria**:
- All functions responding
- Status endpoints verified
- Function logs reviewed

**Tags**: debugging, firebase, functions
        `.trim(),
        priority: 4
      },
      {
        title: 'Phase 2-4: Code analysis and fixes',
        description: `
**Priority**: HIGH
**Estimated**: 6 hours

Complete phases 2-4 of white screen debugging:
- Phase 2: Code analysis and error detection
- Phase 3: Environment verification  
- Phase 4: Fix implementation and testing

**Timeline**: 1-1.5 hours total with 30-minute progress updates

**Tags**: debugging, analysis, fix
        `.trim(),
        priority: 4
      }
    ]
  }
];

// Sprint definitions
const SPRINT_PLANS = [
  {
    name: 'Sprint 1 - Critical Fixes (Jan 6-19, 2025)',
    goals: [
      'Fix "Sync Today" Tebra functionality',
      'Resolve critical security vulnerabilities', 
      'Complete Phase 1.5 test repairs',
      'Fix all white screen issues'
    ]
  },
  {
    name: 'Sprint 2 - Architecture & Testing (Jan 20 - Feb 2, 2025)',
    goals: [
      'Complete Redis architecture design',
      'Continue dashboard component migration',
      'Stabilize test suite',
      'Implement security improvements'
    ]
  }
];

async function testConnection() {
  try {
    const user = await apiRequest('/user');
    console.log(`✅ Connected to Vikunja as: ${user.name || user.username}`);
    return true;
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function migrateProjectPlans() {
  console.log('🚀 Starting Workflow-Bolt project plan migration to Vikunja...\n');

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log('\n📝 Make sure Vikunja is running and you have a valid token.');
    return;
  }

  try {
    // Create master project
    console.log('\n📋 Creating master project...');
    const masterProject = await createProject(
      'Workflow-Bolt Master Plan [INFRASTRUCTURE]',
      `Master project tracking all development efforts across the Workflow-Bolt healthcare application.

**Migration Date**: ${new Date().toISOString().split('T')[0]}
**Total Projects**: ${PROJECT_PLANS.length}
**Source Files**: Multiple planning documents

## Project Overview
This master project coordinates all development efforts including:
- Critical bug fixes (Sync Today, white screen issues)
- Security and HIPAA compliance  
- Architecture migrations (Redis, component refactoring)
- Testing and documentation improvements

## Multi-Agent Coordination
Projects involve coordination between multiple AI agents:
- Claude Code: CLI & testing
- Gemini: Infrastructure & deployment  
- o3 MAX: Backend API architecture
- Opus: Frontend development
- Sider.AI: Website design & architecture

*Managed by Workflow-Bolt Project Management System*`
    );
    
    console.log(`✅ Created master project: ${masterProject.title} (ID: ${masterProject.id})`);

    // Create all individual projects
    console.log('\n🏗️  Creating individual projects...');
    const createdProjects = [];

    for (const plan of PROJECT_PLANS) {
      console.log(`\n📦 Creating: ${plan.name}`);
      
      try {
        const projectDescription = `${plan.description}

**Source File**: ${plan.sourceFile}
**Priority**: ${plan.priority.toUpperCase()}
**Total Tasks**: ${plan.tasks.length}

## Project Tasks
${plan.tasks.map((task, i) => `${i + 1}. ${task.title}`).join('\n')}

*Migrated from scattered planning documents to centralized Vikunja management*`;

        const project = await createProject(
          `${plan.name} [${plan.priority.toUpperCase()}]`,
          projectDescription
        );
        
        createdProjects.push({ plan, project });
        console.log(`  ✅ Created project (ID: ${project.id})`);

        // Create tasks for this project  
        console.log(`  📝 Creating ${plan.tasks.length} tasks...`);
        for (const task of plan.tasks) {
          try {
            await createTask(
              project.id,
              task.title,
              task.description,
              task.priority || 2
            );
            console.log(`    ✅ ${task.title}`);
          } catch (error) {
            console.log(`    ❌ Failed: ${task.title} - ${error.message}`);
          }
          
          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Delay between projects
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`  ❌ Failed to create project: ${plan.name} - ${error.message}`);
      }
    }

    // Create sprint tasks in master project
    console.log('\n🏃‍♂️ Creating sprint plans...');
    for (const sprint of SPRINT_PLANS) {
      try {
        const sprintDescription = `
**Sprint Goals**:
${sprint.goals.map(goal => `- ${goal}`).join('\n')}

## Sprint Backlog
Tasks will be coordinated across multiple projects to achieve sprint goals.

## Definition of Done
- All planned features implemented
- Tests passing  
- Code reviewed and merged
- Documentation updated
- Sprint retrospective completed

*Sprint managed by Workflow-Bolt Project Management System*
        `.trim();

        await createTask(
          masterProject.id,
          sprint.name,
          sprintDescription,
          4 // High priority
        );
        console.log(`✅ Created sprint: ${sprint.name}`);
      } catch (error) {
        console.log(`❌ Failed to create sprint: ${sprint.name} - ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Create migration summary
    console.log('\n📊 Creating migration summary...');
    const summaryDescription = `
# Project Plan Migration Summary - COMPLETED ✅

**Migration Date**: ${new Date().toISOString().split('T')[0]}
**Projects Created**: ${createdProjects.length}/${PROJECT_PLANS.length}
**Sprints Created**: ${SPRINT_PLANS.length}
**Total Tasks**: ${PROJECT_PLANS.reduce((sum, p) => sum + p.tasks.length, 0)}

## Successfully Migrated Projects
${createdProjects.map((p, i) => `${i + 1}. **${p.plan.name}** - ${p.plan.priority} priority (${p.plan.tasks.length} tasks)`).join('\n')}

## Key Accomplishments
- ✅ All scattered planning documents consolidated
- ✅ Task priorities and estimates preserved  
- ✅ Multi-agent coordination structure maintained
- ✅ Sprint organization established
- ✅ Source file references preserved

## Immediate Priorities
1. **CRITICAL**: Fix "Sync Today" functionality (Tebra)
2. **URGENT**: Resolve security vulnerabilities (HIPAA compliance)
3. **HIGH**: Complete test suite repairs (12 failing suites)
4. **HIGH**: Fix white screen issues

## Next Steps
1. Review and assign team members in Vikunja
2. Begin Sprint 1 execution (Jan 6-19, 2025)
3. Update task progress as work is completed
4. Conduct sprint retrospectives
5. Archive original planning documents

*Migration completed successfully by Workflow-Bolt Project Management System*
    `.trim();

    await createTask(
      masterProject.id,
      'PROJECT MIGRATION COMPLETED ✅',
      summaryDescription,
      2
    );

    // Final summary
    console.log('\n🎉 Migration completed successfully!\n');
    console.log('📊 MIGRATION SUMMARY:');
    console.log(`  ✅ Master project: ${masterProject.title}`);
    console.log(`  ✅ Individual projects: ${createdProjects.length}/${PROJECT_PLANS.length}`);
    console.log(`  ✅ Sprint plans: ${SPRINT_PLANS.length}`);
    console.log(`  ✅ Total tasks: ${PROJECT_PLANS.reduce((sum, p) => sum + p.tasks.length, 0)}`);
    console.log(`  ✅ Source files processed: ${[...new Set(PROJECT_PLANS.map(p => p.sourceFile))].length}`);
    
    console.log('\n🔗 Access your migrated projects at: http://localhost:3456');
    
    console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
    console.log('  1. Fix "Sync Today" Tebra functionality (CRITICAL)');
    console.log('  2. Resolve security vulnerabilities (URGENT)');
    console.log('  3. Repair failing test suites (12 suites)');
    console.log('  4. Debug white screen issues');
    
    console.log('\n📋 Project Management Ready:');
    console.log('  • All scattered plans now centralized in Vikunja');
    console.log('  • Sprint 1 ready to begin (Jan 6-19, 2025)');
    console.log('  • Clear priorities and task assignments');
    console.log('  • Multi-agent coordination structure preserved');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure Vikunja is running: $HOME/.workflow-bolt/vikunja-admin.sh status');
    console.log('2. Verify your API token is valid');
    console.log('3. Check network connectivity to localhost:3456');
  }
}

// Run migration
migrateProjectPlans();