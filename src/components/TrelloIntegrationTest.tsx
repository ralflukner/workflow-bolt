import React, { useState } from 'react';
import { trelloApi, TrelloBoard } from '../services/trelloApi';

export const TrelloIntegrationTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [boards, setBoards] = useState<TrelloBoard[]>([]);

  const testConnection = async () => {
    setIsLoading(true);
    setResult('Testing Trello connection...');
    
    try {
      const connectionTest = await trelloApi.testConnection();
      
      if (connectionTest.success) {
        setResult(`✅ Connected to Trello! User: ${connectionTest.user?.fullName || connectionTest.user?.username || 'Unknown'}`);
        
        // Also fetch boards
        const userBoards = await trelloApi.getBoards();
        setBoards(userBoards);
        setResult(prev => prev + `\n📋 Found ${userBoards.length} boards`);
      } else {
        setResult(`❌ Connection failed: ${connectionTest.error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestBoard = async () => {
    setIsLoading(true);
    setResult('Creating test board...');
    
    try {
      const testBoard = await trelloApi.createBoard(
        'Workflow-Bolt Test Board',
        'Test board created by Workflow-Bolt integration'
      );
      
      setResult(`✅ Created test board: ${testBoard.name}\n🔗 URL: ${testBoard.url}`);
      
      // Refresh boards list
      const userBoards = await trelloApi.getBoards();
      setBoards(userBoards);
    } catch (error) {
      setResult(`❌ Error creating board: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        🔧 Trello Integration Test
      </h3>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button
            onClick={createTestBoard}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Test Board'}
          </button>
        </div>
        
        {result && (
          <div className="bg-gray-900 rounded p-3">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        
        {boards.length > 0 && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-white font-medium mb-2">Your Trello Boards ({boards.length}):</h4>
            <div className="space-y-2">
              {boards.slice(0, 5).map((board) => (
                <div key={board.id} className="bg-gray-700 rounded p-2">
                  <div className="text-white font-medium">{board.name}</div>
                  {board.desc && (
                    <div className="text-gray-400 text-sm mt-1">{board.desc}</div>
                  )}
                  <a 
                    href={board.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Open in Trello →
                  </a>
                </div>
              ))}
              {boards.length > 5 && (
                <div className="text-gray-400 text-sm">
                  ...and {boards.length - 5} more boards
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-white font-medium mb-2">Configuration Info:</h4>
          <div className="text-sm text-gray-400 space-y-1">
            <div>API Key: {import.meta.env.VITE_TRELLO_API_KEY ? '✅ Configured' : '❌ Missing'}</div>
            <div>Token: {import.meta.env.VITE_TRELLO_TOKEN ? '✅ Configured' : '❌ Missing'}</div>
            <div>Base URL: https://api.trello.com/1</div>
          </div>
        </div>
      </div>
    </div>
  );
};