import React, { useState } from 'react';
import { vikunjaApi, VikunjaProject } from '../services/vikunjaApi';

export const VikunjaIntegrationTest: React.FC = () => {
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
        
        // Also fetch projects
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

  const createTestProject = async () => {
    setIsLoading(true);
    setResult('Creating test project...');
    
    try {
      const testProject = await vikunjaApi.createProject(
        'Patient Workflows - Test',
        'Test project for Workflow-Bolt patient management integration'
      );
      
      setResult(`✅ Created test project: ${testProject.title}\n📋 Project ID: ${testProject.id}`);
      
      // Create a test patient task
      const testTask = await vikunjaApi.createPatientWorkflow(
        testProject.id,
        'John Doe',
        '2025-01-15 10:00 AM',
        'scheduled',
        'Annual checkup appointment'
      );
      
      setResult(prev => prev + `\n✅ Created test patient task: ${testTask.title}`);
      
      // Refresh projects list
      const userProjects = await vikunjaApi.getProjects();
      setProjects(userProjects);
    } catch (error) {
      setResult(`❌ Error creating project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const healthCheck = async () => {
    setIsLoading(true);
    setResult('Checking Vikunja health...');
    
    try {
      const health = await vikunjaApi.healthCheck();
      setResult(`${health.status === 'healthy' ? '✅' : '❌'} ${health.message}`);
    } catch (error) {
      setResult(`❌ Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        📋 Vikunja Integration Test
      </h3>
      
      <div className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={healthCheck}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {isLoading ? 'Checking...' : 'Health Check'}
          </button>
          
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button
            onClick={createTestProject}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Test Project'}
          </button>
        </div>
        
        {result && (
          <div className="bg-gray-900 rounded p-3">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        
        {projects.length > 0 && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-white font-medium mb-2">Your Vikunja Projects ({projects.length}):</h4>
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="bg-gray-700 rounded p-2">
                  <div className="text-white font-medium">{project.title}</div>
                  {project.description && (
                    <div className="text-gray-400 text-sm mt-1">{project.description}</div>
                  )}
                  <div className="text-blue-400 text-xs mt-1">
                    ID: {project.id} • Created: {new Date(project.created).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {projects.length > 5 && (
                <div className="text-gray-400 text-sm">
                  ...and {projects.length - 5} more projects
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-white font-medium mb-2">Configuration Info:</h4>
          <div className="text-sm text-gray-400 space-y-1">
            <div>Vikunja URL: {import.meta.env.VITE_VIKUNJA_URL || 'http://localhost:3456'}</div>
            <div>Token: {import.meta.env.VITE_VIKUNJA_TOKEN ? '✅ Configured' : '❌ Missing (login required)'}</div>
            <div>Status: Single binary, SQLite database</div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-white font-medium mb-2">Quick Setup:</h4>
          <div className="text-sm text-gray-400 space-y-1">
            <div>1. Visit: <a href="http://localhost:3456" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">http://localhost:3456</a></div>
            <div>2. Create your admin account</div>
            <div>3. Generate API token in settings</div>
            <div>4. Add VITE_VIKUNJA_TOKEN to environment</div>
          </div>
        </div>
      </div>
    </div>
  );
};