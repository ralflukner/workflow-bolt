import React, { useState } from 'react';
import { projectManagement } from '../services/projectManagementSync';
import { vikunjaApi, VikunjaProject } from '../services/vikunjaApi';

export const ProjectManagementTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [projects, setProjects] = useState<VikunjaProject[]>([]);

  const testConnection = async () => {
    setIsLoading(true);
    setResult('Testing Vikunja connection...');
    
    try {
      const connectionTest = await vikunjaApi.testConnection();
      
      if (connectionTest.success) {
        setResult(`✅ Connected to Vikunja! User: ${connectionTest.user?.name || connectionTest.user?.username || 'Unknown'}`);
        
        // Fetch projects
        const userProjects = await vikunjaApi.getProjects();
        setProjects(userProjects);
        setResult(prev => prev + `\n📋 Found ${userProjects.length} projects`);
      } else {
        setResult(`❌ Connection failed: ${connectionTest.error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createDevelopmentProject = async () => {
    setIsLoading(true);
    setResult('Creating development project...');
    
    try {
      const project = await projectManagement.createDevelopmentProject(
        'Auth0 Firebase Integration',
        'Implement secure authentication flow between Auth0 and Firebase for healthcare application',
        'feature'
      );
      
      setResult(`✅ Created project: ${project.title}\n📋 Project ID: ${project.id}`);
      
      // Create a sample task
      const task = await projectManagement.createTaskFromTemplate(
        project.id,
        'feature',
        'Implement JWT token exchange',
        'Create secure token exchange mechanism between Auth0 and Firebase custom tokens'
      );
      
      setResult(prev => prev + `\n✅ Created sample task: ${task.title}`);
      
      // Refresh projects list
      const userProjects = await vikunjaApi.getProjects();
      setProjects(userProjects);
    } catch (error) {
      setResult(`❌ Error creating project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createBugFixProject = async () => {
    setIsLoading(true);
    setResult('Creating bug fix project...');
    
    try {
      const project = await projectManagement.createDevelopmentProject(
        'Tebra API Debug Issues',
        'Fix runtime errors and improve error handling in Tebra EHR integration',
        'bugfix'
      );
      
      // Create bug fix task
      const bugTask = await projectManagement.createTaskFromTemplate(
        project.id,
        'bug-fix',
        'Fix appointmentsArray undefined error',
        'Runtime error in syncSchedule.js where appointmentsArray is not defined, causing sync failures'
      );
      
      setResult(`✅ Created bug fix project: ${project.title}\n🐛 Created bug task: ${bugTask.title}`);
      
      // Refresh projects
      const userProjects = await vikunjaApi.getProjects();
      setProjects(userProjects);
    } catch (error) {
      setResult(`❌ Error creating bug fix project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createSprint = async () => {
    setIsLoading(true);
    setResult('Creating sprint...');
    
    try {
      // Use first project or create one
      let targetProject = projects[0];
      if (!targetProject) {
        targetProject = await projectManagement.createDevelopmentProject(
          'Workflow-Bolt Core',
          'Core development tasks for Workflow-Bolt healthcare application',
          'feature'
        );
      }

      const sprint = await projectManagement.createSprint(targetProject.id, {
        name: 'Sprint 1 - Q1 2025',
        startDate: '2025-01-06',
        endDate: '2025-01-19',
        goals: [
          'Complete Auth0 Firebase integration',
          'Fix all Tebra API sync issues', 
          'Implement project management integration',
          'Deploy stable version to production'
        ]
      });
      
      setResult(`✅ Created sprint: ${sprint.title}\n📅 Duration: 2 weeks\n🎯 4 goals defined`);
    } catch (error) {
      setResult(`❌ Error creating sprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    setResult('Generating project report...');
    
    try {
      if (projects.length === 0) {
        setResult('❌ No projects found. Create a project first.');
        return;
      }

      const report = await projectManagement.generateProjectReport(projects[0].id);
      setResult(`📊 Project Report Generated:\n\n${report}`);
    } catch (error) {
      setResult(`❌ Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        🏗️ Project Management Integration
      </h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button
            onClick={createDevelopmentProject}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Feature Project'}
          </button>
          
          <button
            onClick={createBugFixProject}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Bug Fix Project'}
          </button>
          
          <button
            onClick={createSprint}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Sprint'}
          </button>
        </div>
        
        <button
          onClick={generateReport}
          disabled={isLoading || projects.length === 0}
          className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate Project Report'}
        </button>
        
        {result && (
          <div className="bg-gray-900 rounded p-3">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        
        {projects.length > 0 && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-white font-medium mb-2">Development Projects ({projects.length}):</h4>
            <div className="space-y-2">
              {projects.map((project) => (
                <div key={project.id} className="bg-gray-700 rounded p-2">
                  <div className="text-white font-medium">{project.title}</div>
                  <div className="text-gray-400 text-sm mt-1">
                    {project.description.split('\n')[0]}
                  </div>
                  <div className="text-blue-400 text-xs mt-1 flex justify-between">
                    <span>ID: {project.id}</span>
                    <span>Created: {new Date(project.created).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-white font-medium mb-2">Project Templates Available:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
            <div>🐛 Bug Fix - High priority fixes</div>
            <div>✨ Feature - New functionality</div>
            <div>🔧 Refactor - Code improvements</div>
            <div>🧪 Test - Testing tasks</div>
            <div>📚 Docs - Documentation</div>
            <div>🏗️ Infrastructure - DevOps tasks</div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-white font-medium mb-2">Next Steps:</h4>
          <div className="text-sm text-gray-400 space-y-1">
            <div>1. Visit: <a href="http://localhost:3456" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">http://localhost:3456</a></div>
            <div>2. Generate API token in settings</div>
            <div>3. Add VITE_VIKUNJA_TOKEN to GSM</div>
            <div>4. Start managing your development projects!</div>
          </div>
        </div>
      </div>
    </div>
  );
};