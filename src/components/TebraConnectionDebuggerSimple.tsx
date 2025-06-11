import React, { useState } from 'react';
import { tebraApiService } from '../services/tebraApiService';

export const TebraConnectionDebuggerSimple: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('Not tested');
  const [isExpanded, setIsExpanded] = useState(false);

  const runTest = async () => {
    setTestResult('Testing...');
    
    try {
      const startTime = Date.now();
      const result = await tebraApiService.testConnection();
      const duration = Date.now() - startTime;
      
      if (result) {
        setTestResult(`✅ Success (${duration}ms)`);
      } else {
        setTestResult(`❌ Failed (${duration}ms)`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="text-xs text-gray-400 hover:text-gray-300 underline"
      >
        Debug Connection
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-white">Connection Debug</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <button
          onClick={runTest}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
        >
          Test Connection
        </button>

        <div className="text-sm text-gray-300">
          Result: {testResult}
        </div>
      </div>
    </div>
  );
};