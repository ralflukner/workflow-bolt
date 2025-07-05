/**
 * Project Management Integration with Vikunja
 * For tracking development tasks, features, and sprints
 */

import { vikunjaApi } from './vikunjaApi';
import type { VikunjaProject, VikunjaTask } from './vikunjaApi';

interface ProjectTask {
  id?: number;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'testing' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  dueDate?: string;
  tags: string[];
  estimatedHours?: number;
}

interface Sprint {
  name: string;
  startDate: string;
  endDate: string;
  goals: string[];
}

class ProjectManagementService {
  private projectCache: Map<string, VikunjaProject> = new Map();

  /**
   * Create a development project
   */
  async createDevelopmentProject(
    name: string,
    description: string,
    type: 'feature' | 'bugfix' | 'infrastructure' | 'research' = 'feature'
  ): Promise<VikunjaProject> {
    const projectTitle = `${name} [${type.toUpperCase()}]`;
    const projectDescription = `
${description}

**Project Type**: ${type}
**Created**: ${new Date().toLocaleDateString()}

## Development Phases
- [ ] Planning & Requirements
- [ ] Design & Architecture
- [ ] Implementation
- [ ] Testing & QA
- [ ] Deployment
- [ ] Documentation

*Managed by Workflow-Bolt Project Management*
    `.trim();

    const project = await vikunjaApi.createProject(projectTitle, projectDescription);
    this.projectCache.set(name, project);
    
    // Create initial development tasks
    await this.createInitialTasks(project.id, type);
    
    return project;
  }

  /**
   * Create development task
   */
  async createDevelopmentTask(
    projectId: number,
    task: ProjectTask
  ): Promise<VikunjaTask> {
    const priority = this.getPriorityNumber(task.priority);
    const description = `
**Task Description:**
${task.description}

**Status**: ${task.status}
**Priority**: ${task.priority}
**Tags**: ${task.tags.join(', ')}
${task.estimatedHours ? `**Estimated Hours**: ${task.estimatedHours}` : ''}
${task.assignee ? `**Assignee**: ${task.assignee}` : ''}

## Acceptance Criteria
- [ ] Requirements understood
- [ ] Implementation complete
- [ ] Tests written and passing
- [ ] Code reviewed
- [ ] Documentation updated

*Created by Workflow-Bolt*
    `.trim();

    return vikunjaApi.createTask(
      projectId,
      task.title,
      description,
      priority,
      task.dueDate
    );
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: number,
    newStatus: ProjectTask['status'],
    notes?: string
  ): Promise<VikunjaTask> {
    const updates: any = {
      done: newStatus === 'done'
    };

    if (notes) {
      // Get current task to update description
      const task = await vikunjaApi.testConnection(); // This will need proper task fetching
      // Update description with status change notes
    }

    return vikunjaApi.updateTask(taskId, updates);
  }

  /**
   * Create sprint/milestone
   */
  async createSprint(
    projectId: number,
    sprint: Sprint
  ): Promise<VikunjaTask> {
    const title = `Sprint: ${sprint.name}`;
    const description = `
**Sprint Planning**

**Duration**: ${sprint.startDate} to ${sprint.endDate}

**Sprint Goals:**
${sprint.goals.map(goal => `- ${goal}`).join('\n')}

## Sprint Backlog
Tasks will be linked to this sprint milestone.

## Definition of Done
- [ ] All planned features implemented
- [ ] Tests passing
- [ ] Code reviewed and merged
- [ ] Documentation updated
- [ ] Sprint retrospective completed

*Sprint managed by Workflow-Bolt*
    `.trim();

    return vikunjaApi.createTask(projectId, title, description, 3, sprint.endDate);
  }

  /**
   * Get project by name
   */
  async getProjectByName(name: string): Promise<VikunjaProject | null> {
    // Check cache first
    if (this.projectCache.has(name)) {
      return this.projectCache.get(name)!;
    }

    // Search in Vikunja
    const projects = await vikunjaApi.getProjects();
    const project = projects.find(p => p.title.includes(name));
    
    if (project) {
      this.projectCache.set(name, project);
    }
    
    return project || null;
  }

  /**
   * Get all development tasks for a project
   */
  async getProjectTasks(projectId: number): Promise<VikunjaTask[]> {
    return vikunjaApi.getTasks(projectId);
  }

  /**
   * Create common development task templates
   */
  async createTaskFromTemplate(
    projectId: number,
    template: 'bug-fix' | 'feature' | 'refactor' | 'test' | 'docs',
    title: string,
    details: string
  ): Promise<VikunjaTask> {
    const templates = {
      'bug-fix': {
        priority: 'high' as const,
        tags: ['bug', 'fix'],
        description: `
**Bug Report:**
${details}

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior
[Describe what should happen]

## Actual Behavior
[Describe what actually happens]

## Fix Checklist
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Tests added/updated
- [ ] Manual testing completed
- [ ] Regression testing
        `.trim()
      },
      'feature': {
        priority: 'medium' as const,
        tags: ['feature', 'enhancement'],
        description: `
**Feature Request:**
${details}

## User Story
As a [user type], I want [goal] so that [benefit].

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Implementation Notes
[Technical considerations]

## Testing Requirements
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing
        `.trim()
      },
      'refactor': {
        priority: 'low' as const,
        tags: ['refactor', 'tech-debt'],
        description: `
**Refactoring Task:**
${details}

## Current State
[Describe current implementation]

## Desired State
[Describe target implementation]

## Benefits
- [ ] Improved performance
- [ ] Better maintainability
- [ ] Reduced complexity
- [ ] Enhanced readability

## Checklist
- [ ] Code refactored
- [ ] Tests still passing
- [ ] No functionality changes
- [ ] Performance verified
        `.trim()
      },
      'test': {
        priority: 'medium' as const,
        tags: ['testing', 'quality'],
        description: `
**Testing Task:**
${details}

## Test Scope
[What needs to be tested]

## Test Types
- [ ] Unit tests
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Performance tests

## Coverage Goals
- [ ] Critical paths covered
- [ ] Edge cases tested
- [ ] Error scenarios handled
        `.trim()
      },
      'docs': {
        priority: 'low' as const,
        tags: ['documentation'],
        description: `
**Documentation Task:**
${details}

## Documentation Type
- [ ] API documentation
- [ ] User guide
- [ ] Developer guide
- [ ] Architecture docs

## Requirements
- [ ] Clear and concise
- [ ] Examples included
- [ ] Up-to-date with code
- [ ] Reviewed for accuracy
        `.trim()
      }
    };

    const template_data = templates[template];
    return this.createDevelopmentTask(projectId, {
      title,
      description: template_data.description,
      status: 'todo',
      priority: template_data.priority,
      tags: template_data.tags
    });
  }

  /**
   * Create initial tasks for a new project
   */
  private async createInitialTasks(projectId: number, type: string): Promise<void> {
    const initialTasks = [
      {
        title: 'Project Setup & Planning',
        description: 'Set up project structure, define requirements, and create development plan',
        status: 'todo' as const,
        priority: 'high' as const,
        tags: ['setup', 'planning']
      },
      {
        title: 'Architecture Design',
        description: 'Design system architecture and technical specifications',
        status: 'todo' as const,
        priority: 'high' as const,
        tags: ['design', 'architecture']
      },
      {
        title: 'Development Environment Setup',
        description: 'Configure development tools, CI/CD, and testing framework',
        status: 'todo' as const,
        priority: 'medium' as const,
        tags: ['setup', 'devops']
      }
    ];

    for (const task of initialTasks) {
      await this.createDevelopmentTask(projectId, task);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Convert priority string to number
   */
  private getPriorityNumber(priority: ProjectTask['priority']): number {
    switch (priority) {
      case 'urgent': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  /**
   * Generate project report
   */
  async generateProjectReport(projectId: number): Promise<string> {
    const project = await vikunjaApi.getProject(projectId);
    const tasks = await vikunjaApi.getTasks(projectId);
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.done).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const tasksByPriority = {
      urgent: tasks.filter(t => t.priority === 4).length,
      high: tasks.filter(t => t.priority === 3).length,
      medium: tasks.filter(t => t.priority === 2).length,
      low: tasks.filter(t => t.priority === 1).length
    };

    return `
# Project Report: ${project.title}

**Progress**: ${completedTasks}/${totalTasks} tasks completed (${progress}%)
**Created**: ${new Date(project.created).toLocaleDateString()}
**Last Updated**: ${new Date(project.updated).toLocaleDateString()}

## Task Breakdown
- **Urgent**: ${tasksByPriority.urgent}
- **High**: ${tasksByPriority.high} 
- **Medium**: ${tasksByPriority.medium}
- **Low**: ${tasksByPriority.low}

## Recent Tasks
${tasks.slice(0, 5).map(task => 
  `- ${task.done ? '✅' : '⏳'} ${task.title}`
).join('\n')}

*Generated by Workflow-Bolt Project Management*
    `.trim();
  }
}

// Export singleton
export const projectManagement = new ProjectManagementService();
export default projectManagement;

// Export types
export type { ProjectTask, Sprint };