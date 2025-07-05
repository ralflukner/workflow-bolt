#!/usr/bin/env tsx

/**
 * Project Plan Migration Script
 * Migrates all scattered project plans from files into Vikunja
 */

import fs from 'fs';
import path from 'path';
import { projectManagement } from '../src/services/projectManagementSync';
import { vikunjaApi } from '../src/services/vikunjaApi';

interface ProjectPlan {
  name: string;
  description: string;
  type: 'feature' | 'bugfix' | 'infrastructure' | 'research';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  phase: string;
  status: 'planning' | 'in-progress' | 'blocked' | 'completed';
  tasks: TaskPlan[];
  sourceFile: string;
  estimatedDays?: number;
  assignee?: string;
  dependencies?: string[];
}

interface TaskPlan {
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'testing' | 'done';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  tags: string[];
  estimatedHours?: number;
  acceptanceCriteria?: string[];
}

// Master project plans extracted from documentation
const PROJECT_PLANS: ProjectPlan[] = [
  {
    name: 'Code Review Action Plan - Phase 1.5',
    description: 'Complete test failure repair and TypeScript error cleanup from original 4-phase action plan',
    type: 'infrastructure',
    priority: 'high',
    phase: 'Phase 1.5 - Test Repair',
    status: 'in-progress',
    sourceFile: 'ACTION_PLAN.md',
    estimatedDays: 3,
    tasks: [
      {
        title: 'Fix failing test suites (12 currently failing)',
        description: 'Repair all failing Jest tests, focus on React Query and component testing issues',
        status: 'in-progress',
        priority: 'high',
        tags: ['testing', 'jest', 'react-query'],
        estimatedHours: 16,
        acceptanceCriteria: [
          'All 12 failing test suites pass',
          'No new test failures introduced',
          'Test coverage maintained or improved'
        ]
      },
      {
        title: 'Reduce TypeScript errors to <5',
        description: 'Currently 16 TypeScript errors, target reduction to under 5 errors',
        status: 'todo',
        priority: 'high',
        tags: ['typescript', 'compilation'],
        estimatedHours: 8,
        acceptanceCriteria: [
          'TypeScript error count under 5',
          'No type safety regressions',
          'Clean build process'
        ]
      }
    ]
  },
  {
    name: 'Dashboard Hook to Class Migration',
    description: 'Convert remaining 13/22 dashboard components from hooks to classes for stability',
    type: 'infrastructure',
    priority: 'medium',
    phase: 'Q3 2025 - Component Migration',
    status: 'in-progress',
    sourceFile: 'docs/05-governance/ROADMAP.md',
    estimatedDays: 10,
    tasks: [
      {
        title: 'Convert remaining 13 hook-based components',
        description: 'Systematically convert components to class-based architecture for better stability',
        status: 'in-progress',
        priority: 'medium',
        tags: ['react', 'refactor', 'components'],
        estimatedHours: 40,
        acceptanceCriteria: [
          'All 22 dashboard components are class-based',
          'No functionality regressions',
          'Improved component stability'
        ]
      },
      {
        title: 'Update component documentation',
        description: 'Document new class-based component patterns and usage guidelines',
        status: 'todo',
        priority: 'low',
        tags: ['documentation', 'components'],
        estimatedHours: 6
      }
    ]
  },
  {
    name: 'Tebra Debug Dashboard Refactor',
    description: 'Refactor monolithic 780-line TebraDebugDashboard into modular components',
    type: 'feature',
    priority: 'high',
    phase: 'Phase 1 - Core Implementation',
    status: 'in-progress',
    sourceFile: 'docs/03-application/tebra-debug-dashboard-implementation-plan.md',
    estimatedDays: 5,
    tasks: [
      {
        title: 'Break down 780-line monolith into <200 line modules',
        description: 'Split TebraDebugDashboard into focused, testable components',
        status: 'in-progress',
        priority: 'high',
        tags: ['refactor', 'tebra', 'components'],
        estimatedHours: 20,
        acceptanceCriteria: [
          'No single component over 200 lines',
          'Zero behavioral changes',
          'Improved maintainability'
        ]
      },
      {
        title: 'Achieve >85% test coverage',
        description: 'Add comprehensive tests for all new modular components',
        status: 'todo',
        priority: 'medium',
        tags: ['testing', 'coverage'],
        estimatedHours: 16,
        acceptanceCriteria: [
          'Test coverage above 85%',
          'All critical paths tested',
          'Edge cases covered'
        ]
      },
      {
        title: 'Fix "Sync Today" functionality',
        description: 'Resolve current sync failures and runtime errors in Tebra integration',
        status: 'todo',
        priority: 'urgent',
        tags: ['bugfix', 'tebra', 'sync'],
        estimatedHours: 8,
        acceptanceCriteria: [
          'Sync Today button works without errors',
          'Proper error handling and logging',
          'User feedback on sync status'
        ]
      }
    ]
  },
  {
    name: 'Redis Architecture Migration',
    description: 'Replace Firebase/Auth0 complexity with Redis-based architecture',
    type: 'infrastructure',
    priority: 'high',
    phase: 'Design Phase',
    status: 'planning',
    sourceFile: 'docs/Redis-Implementation-Master-Plan.md',
    estimatedDays: 21,
    assignee: 'Multi-agent team',
    tasks: [
      {
        title: 'Complete Redis design documentation',
        description: 'Finalize architecture designs and implementation specifications',
        status: 'in-progress',
        priority: 'high',
        tags: ['redis', 'architecture', 'design'],
        estimatedHours: 24,
        acceptanceCriteria: [
          'Complete architecture documentation',
          'Implementation specifications',
          'Migration plan documented'
        ]
      },
      {
        title: 'Implement Redis 2FA authentication system',
        description: 'Build secure 2FA system using Redis as the backend store',
        status: 'in-progress',
        priority: 'high',
        tags: ['redis', '2fa', 'auth'],
        estimatedHours: 40,
        acceptanceCriteria: [
          '2FA fully functional',
          'Secure token management',
          'User management system'
        ]
      },
      {
        title: 'Phase out Firebase/Auth0 dependencies',
        description: 'Systematically remove Firebase and Auth0 dependencies',
        status: 'todo',
        priority: 'medium',
        tags: ['migration', 'firebase', 'auth0'],
        estimatedHours: 32
      }
    ]
  },
  {
    name: 'Website Architecture Overhaul',
    description: 'Transform single dashboard into full website with 9+ specialized dashboards',
    type: 'feature',
    priority: 'medium',
    phase: 'Architecture Planning',
    status: 'planning',
    sourceFile: 'docs/WEBSITE_ARCHITECTURE_MASTER_PLAN.md',
    estimatedDays: 45,
    assignee: 'Multi-agent team',
    tasks: [
      {
        title: 'Design 9 specialized dashboards',
        description: 'Plan and design Patient Flow, Tebra Integration, Analytics, Reports, Schedule, Settings, Admin, Compliance, and API dashboards',
        status: 'planning',
        priority: 'medium',
        tags: ['design', 'dashboards', 'architecture'],
        estimatedHours: 60,
        acceptanceCriteria: [
          'All 9 dashboards designed',
          'User flow documented',
          'Navigation structure defined'
        ]
      },
      {
        title: 'Implement responsive website framework',
        description: 'Build scalable framework to support multiple specialized dashboards',
        status: 'todo',
        priority: 'medium',
        tags: ['frontend', 'framework', 'responsive'],
        estimatedHours: 80
      }
    ]
  },
  {
    name: 'Documentation Reorganization',
    description: 'Reorganize 130+ markdown files into structured documentation system',
    type: 'infrastructure',
    priority: 'medium',
    phase: 'Phase 2 - Bulk Relocation',
    status: 'in-progress',
    sourceFile: 'docs/DOCUMENTATION_REORG_PLAN.md',
    estimatedDays: 4,
    tasks: [
      {
        title: 'Complete 5-phase documentation restructure',
        description: 'Organize files into 00-overview, 01-compliance, 02-infrastructure, 03-application, 04-ops, 05-governance',
        status: 'in-progress',
        priority: 'medium',
        tags: ['documentation', 'organization'],
        estimatedHours: 16,
        acceptanceCriteria: [
          'All 130+ files properly categorized',
          'Clear navigation structure',
          'Updated cross-references'
        ]
      },
      {
        title: 'Update all internal documentation links',
        description: 'Fix broken links after file reorganization',
        status: 'todo',
        priority: 'low',
        tags: ['documentation', 'links'],
        estimatedHours: 8
      }
    ]
  },
  {
    name: 'Security & Compliance Remediation',
    description: 'Address critical HIPAA compliance and authentication security issues',
    type: 'infrastructure',
    priority: 'urgent',
    phase: 'Critical Security',
    status: 'planning',
    sourceFile: 'endpoint_authentication_plan.py',
    estimatedDays: 2,
    tasks: [
      {
        title: 'Fix endpoint authentication vulnerabilities',
        description: 'Address critical authentication issues that impact HIPAA compliance',
        status: 'todo',
        priority: 'urgent',
        tags: ['security', 'authentication', 'hipaa'],
        estimatedHours: 12,
        acceptanceCriteria: [
          'All endpoints properly authenticated',
          'HIPAA compliance verified',
          'Security audit passed'
        ]
      },
      {
        title: 'Implement comprehensive audit logging',
        description: 'Add detailed audit logs for all patient data access',
        status: 'todo',
        priority: 'high',
        tags: ['security', 'logging', 'audit'],
        estimatedHours: 8
      }
    ]
  },
  {
    name: 'CLI Testing Framework',
    description: 'Comprehensive CLI testing for all dashboard functionality',
    type: 'infrastructure',
    priority: 'medium',
    phase: 'Testing Infrastructure',
    status: 'planning',
    sourceFile: 'docs/CLI_DASHBOARD_TESTING_PLAN.md',
    estimatedDays: 6,
    tasks: [
      {
        title: 'Build comprehensive CLI testing suite',
        description: 'Systematic testing of all dashboard buttons and functionality',
        status: 'todo',
        priority: 'medium',
        tags: ['testing', 'cli', 'automation'],
        estimatedHours: 24,
        acceptanceCriteria: [
          'All dashboard functions testable via CLI',
          'Automated test execution',
          'Performance monitoring included'
        ]
      },
      {
        title: 'Debug and fix "Sync Today" button',
        description: 'Systematic debugging of Sync Today failure using CLI testing',
        status: 'todo',
        priority: 'high',
        tags: ['debugging', 'tebra', 'sync'],
        estimatedHours: 6
      }
    ]
  },
  {
    name: 'White Screen Issue Resolution',
    description: 'Systematic 4-phase debugging plan for application white screen issues',
    type: 'bugfix',
    priority: 'high',
    phase: 'Debugging',
    status: 'planning',
    sourceFile: 'white_screen_assessment_plan.py',
    estimatedDays: 1,
    tasks: [
      {
        title: 'Phase 1: Function status verification',
        description: 'Verify all Firebase Functions are deployed and responding',
        status: 'todo',
        priority: 'high',
        tags: ['debugging', 'firebase', 'functions'],
        estimatedHours: 2,
        acceptanceCriteria: [
          'All functions responding',
          'Status endpoints verified',
          'Function logs reviewed'
        ]
      },
      {
        title: 'Phase 2: Code analysis and error detection',
        description: 'Analyze application code for white screen root causes',
        status: 'todo',
        priority: 'high',
        tags: ['debugging', 'analysis'],
        estimatedHours: 2
      },
      {
        title: 'Phase 3: Environment verification',
        description: 'Verify all environment variables and configurations',
        status: 'todo',
        priority: 'medium',
        tags: ['debugging', 'environment'],
        estimatedHours: 1
      },
      {
        title: 'Phase 4: Fix implementation and testing',
        description: 'Implement fixes and verify resolution',
        status: 'todo',
        priority: 'high',
        tags: ['fix', 'testing'],
        estimatedHours: 3
      }
    ]
  }
];

/**
 * Create sprints from project phases
 */
const SPRINT_PLANS = [
  {
    name: 'Sprint 1 - Critical Fixes (Q1 2025)',
    startDate: '2025-01-06',
    endDate: '2025-01-19',
    goals: [
      'Fix "Sync Today" Tebra functionality',
      'Resolve critical security vulnerabilities',
      'Complete Phase 1.5 test repairs',
      'Fix all white screen issues'
    ],
    projects: ['Tebra Debug Dashboard Refactor', 'Security & Compliance Remediation', 'Code Review Action Plan - Phase 1.5', 'White Screen Issue Resolution']
  },
  {
    name: 'Sprint 2 - Architecture & Testing (Q1 2025)',
    startDate: '2025-01-20',
    endDate: '2025-02-02',
    goals: [
      'Complete Redis architecture design',
      'Implement CLI testing framework',
      'Continue dashboard component migration',
      'Stabilize test suite'
    ],
    projects: ['Redis Architecture Migration', 'CLI Testing Framework', 'Dashboard Hook to Class Migration']
  },
  {
    name: 'Sprint 3 - Documentation & Infrastructure (Q1 2025)',
    startDate: '2025-02-03',
    endDate: '2025-02-16',
    goals: [
      'Complete documentation reorganization',
      'Finalize component refactoring',
      'Begin website architecture planning',
      'Implement Redis 2FA system'
    ],
    projects: ['Documentation Reorganization', 'Website Architecture Overhaul', 'Redis Architecture Migration']
  }
];

async function migrateProjectPlans(): Promise<void> {
  console.log('🚀 Starting project plan migration to Vikunja...\n');

  try {
    // Test connection first
    const connectionTest = await vikunjaApi.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Cannot connect to Vikunja: ${connectionTest.error}`);
    }
    console.log('✅ Connected to Vikunja');

    // Create master project for tracking all sub-projects
    console.log('\n📋 Creating master project...');
    const masterProject = await projectManagement.createDevelopmentProject(
      'Workflow-Bolt Master Plan',
      'Master project tracking all development efforts across the Workflow-Bolt healthcare application',
      'infrastructure'
    );
    console.log(`✅ Created master project: ${masterProject.title} (ID: ${masterProject.id})`);

    // Migrate each project plan
    console.log('\n🏗️  Migrating individual project plans...');
    const createdProjects: any[] = [];

    for (const plan of PROJECT_PLANS) {
      console.log(`\n📦 Creating project: ${plan.name}`);
      
      try {
        const project = await projectManagement.createDevelopmentProject(
          plan.name,
          `${plan.description}\n\n**Source**: ${plan.sourceFile}\n**Phase**: ${plan.phase}\n**Status**: ${plan.status}\n**Estimated Days**: ${plan.estimatedDays || 'TBD'}\n**Assignee**: ${plan.assignee || 'Unassigned'}`,
          plan.type
        );

        createdProjects.push({ plan, project });
        console.log(`  ✅ Created project (ID: ${project.id})`);

        // Create tasks for this project
        console.log(`  📝 Creating ${plan.tasks.length} tasks...`);
        for (const task of plan.tasks) {
          try {
            const createdTask = await projectManagement.createDevelopmentTask(project.id, {
              title: task.title,
              description: `${task.description}\n\n**Estimated Hours**: ${task.estimatedHours || 'TBD'}\n\n**Acceptance Criteria**:\n${task.acceptanceCriteria?.map(c => `- ${c}`).join('\n') || 'TBD'}`,
              status: task.status,
              priority: task.priority,
              tags: task.tags
            });
            console.log(`    ✅ Created task: ${task.title}`);
          } catch (error) {
            console.log(`    ❌ Failed to create task: ${task.title} - ${error}`);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Small delay between projects
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`  ❌ Failed to create project: ${plan.name} - ${error}`);
      }
    }

    // Create sprints
    console.log('\n🏃‍♂️ Creating sprint plans...');
    for (const sprint of SPRINT_PLANS) {
      try {
        const sprintTask = await projectManagement.createSprint(masterProject.id, {
          name: sprint.name,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          goals: sprint.goals
        });
        console.log(`✅ Created sprint: ${sprint.name}`);
      } catch (error) {
        console.log(`❌ Failed to create sprint: ${sprint.name} - ${error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Create summary task in master project
    console.log('\n📊 Creating migration summary...');
    const summaryDescription = `
# Project Plan Migration Summary

**Migration Date**: ${new Date().toISOString().split('T')[0]}
**Total Projects Migrated**: ${PROJECT_PLANS.length}
**Total Sprints Created**: ${SPRINT_PLANS.length}
**Source Files Processed**: ${[...new Set(PROJECT_PLANS.map(p => p.sourceFile))].length}

## Migrated Projects
${PROJECT_PLANS.map((p, i) => `${i + 1}. **${p.name}** - ${p.type} (${p.priority} priority)`).join('\n')}

## Migration Notes
- All original source file references preserved
- Task acceptance criteria migrated
- Priority levels maintained
- Sprint organization created
- Multi-agent coordination structure preserved

## Next Steps
1. Review and update project priorities in Vikunja
2. Assign specific team members to tasks
3. Set up project dependencies
4. Begin sprint execution
5. Archive or update original planning documents

*Migration completed by Workflow-Bolt Project Management System*
    `.trim();

    await projectManagement.createDevelopmentTask(masterProject.id, {
      title: 'Project Plan Migration - Completion Summary',
      description: summaryDescription,
      status: 'done',
      priority: 'medium',
      tags: ['migration', 'summary', 'completed']
    });

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`  • Master project created: ${masterProject.title}`);
    console.log(`  • Individual projects: ${createdProjects.length}/${PROJECT_PLANS.length} created`);
    console.log(`  • Sprints created: ${SPRINT_PLANS.length}`);
    console.log(`  • Total tasks migrated: ${PROJECT_PLANS.reduce((sum, p) => sum + p.tasks.length, 0)}`);
    console.log('\n🔗 Access your projects at: http://localhost:3456');
    console.log('\n📝 Next steps:');
    console.log('  1. Review projects in Vikunja dashboard');
    console.log('  2. Assign team members to specific tasks');
    console.log('  3. Update priorities as needed');
    console.log('  4. Begin sprint execution');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Helper function to generate a project report
async function generateMigrationReport(): Promise<string> {
  const projects = await vikunjaApi.getProjects();
  const workflowProjects = projects.filter(p => 
    p.title.includes('Workflow-Bolt') || 
    p.title.includes('Tebra') || 
    p.title.includes('Redis') ||
    p.title.includes('Dashboard')
  );

  let report = `# Workflow-Bolt Project Migration Report\n\n`;
  report += `**Generated**: ${new Date().toISOString()}\n`;
  report += `**Total Projects**: ${workflowProjects.length}\n\n`;

  for (const project of workflowProjects) {
    const tasks = await vikunjaApi.getTasks(project.id);
    const completedTasks = tasks.filter(t => t.done).length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    report += `## ${project.title}\n`;
    report += `- **Progress**: ${completedTasks}/${tasks.length} tasks (${progress}%)\n`;
    report += `- **Created**: ${new Date(project.created).toLocaleDateString()}\n`;
    report += `- **Tasks**: ${tasks.length}\n\n`;
  }

  return report;
}

// Run migration if called directly
if (require.main === module) {
  migrateProjectPlans();
}

export { migrateProjectPlans, generateMigrationReport };