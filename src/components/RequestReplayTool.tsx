import React, { useState } from 'react';
import { PlayCircle, Clock, AlertCircle, CheckCircle, Copy, RotateCcw } from 'lucide-react';

interface ReplayRequest {
  correlationId: string;
  timestamp: Date;
  method: string;
  params: any;
  response?: any;
  error?: string;
  duration?: number;
  status: 'success' | 'error';
}

interface RequestReplayToolProps {
  onReplay?: (request: ReplayRequest) => Promise<void>;
}

export const RequestReplayTool: React.FC<RequestReplayToolProps> = ({ onReplay }) => {
  const [correlationId, setCorrelationId] = useState('');
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayHistory, setReplayHistory] = useState<ReplayRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ReplayRequest | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareRequests, setCompareRequests] = useState<[ReplayRequest | null, ReplayRequest | null]>([null, null]);

  // Mock data for demonstration - in production, fetch from actual logs
  const mockRequests: ReplayRequest[] = [
    {
      correlationId: '3yo0fgwv',
      timestamp: new Date(Date.now() - 3600000),
      method: 'GetAppointments',
      params: { fromDate: '2025-06-17', toDate: '2025-06-17' },
      error: 'Object reference not set to an instance of an object',
      duration: 3247,
      status: 'error'
    },
    {
      correlationId: 'h5cgqyia',
      timestamp: new Date(Date.now() - 7200000),
      method: 'GetProviders',
      params: {},
      response: { providers: [] },
      duration: 245,
      status: 'success'
    },
    {
      correlationId: 'seax6ur9',
      timestamp: new Date(Date.now() - 10800000),
      method: 'GetPatients',
      params: { fromDate: '2025-01-01' },
      response: { patients: [] },
      duration: 523,
      status: 'success'
    }
  ];

  const handleReplay = async (request: ReplayRequest) => {
    setIsReplaying(true);
    
    try {
      // Create a new replay request
      const replayRequest: ReplayRequest = {
        ...request,
        correlationId: Math.random().toString(36).substring(2, 10),
        timestamp: new Date(),
        status: 'success' // Will be updated based on result
      };

      // Simulate API call - in production, use actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Randomly simulate success or failure for demo
      if (Math.random() > 0.3) {
        replayRequest.response = { message: 'Replay successful', data: {} };
        replayRequest.duration = Math.floor(Math.random() * 1000) + 100;
      } else {
        replayRequest.error = 'Simulated replay error';
        replayRequest.status = 'error';
        replayRequest.duration = Math.floor(Math.random() * 3000) + 1000;
      }

      setReplayHistory(prev => [replayRequest, ...prev]);
      
      if (onReplay) {
        await onReplay(replayRequest);
      }
    } catch (error) {
      console.error('Replay failed:', error);
    } finally {
      setIsReplaying(false);
    }
  };

  const getDifferenceHighlight = (obj1: any, obj2: any, path: string = ''): any => {
    if (obj1 === obj2) return null;
    if (typeof obj1 !== typeof obj2) return { [path]: { old: obj1, new: obj2 } };
    if (typeof obj1 !== 'object' || obj1 === null) return { [path]: { old: obj1, new: obj2 } };
    
    const differences: any = {};
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    
    allKeys.forEach(key => {
      const newPath = path ? `${path}.${key}` : key;
      const diff = getDifferenceHighlight(obj1[key], obj2[key], newPath);
      if (diff) Object.assign(differences, diff);
    });
    
    return Object.keys(differences).length > 0 ? differences : null;
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-600 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <PlayCircle className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Request Replay Tool</h3>
        </div>
        
        <button
          onClick={() => setComparisonMode(!comparisonMode)}
          className={`px-4 py-2 rounded transition-colors ${
            comparisonMode 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {comparisonMode ? 'Exit Comparison' : 'Compare Requests'}
        </button>
      </div>

      {/* Correlation ID Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Enter Correlation ID to find request:
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={correlationId}
            onChange={(e) => setCorrelationId(e.target.value)}
            placeholder="e.g., 3yo0fgwv"
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => {
              const found = mockRequests.find(r => r.correlationId === correlationId);
              if (found) setSelectedRequest(found);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500"
          >
            Find Request
          </button>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Requests:</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {mockRequests.map((request) => (
            <div
              key={request.correlationId}
              onClick={() => {
                if (comparisonMode) {
                  setCompareRequests(prev => 
                    prev[0] === null ? [request, null] : [prev[0], request]
                  );
                } else {
                  setSelectedRequest(request);
                }
              }}
              className={`p-3 rounded cursor-pointer transition-colors ${
                selectedRequest?.correlationId === request.correlationId
                  ? 'bg-purple-900 border border-purple-500'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {request.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-white font-medium">{request.method}</span>
                  <span className="text-gray-400 text-sm">{request.correlationId}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-400">{request.duration}ms</span>
                  <span className="text-gray-500">
                    {request.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Request Details */}
      {selectedRequest && !comparisonMode && (
        <div className="bg-gray-700 rounded p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-white">Request Details</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedRequest, null, 2))}
                className="p-2 rounded hover:bg-gray-600 transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => handleReplay(selectedRequest)}
                disabled={isReplaying}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${isReplaying ? 'animate-spin' : ''}`} />
                <span>{isReplaying ? 'Replaying...' : 'Replay Request'}</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-400">Method:</span>
              <span className="text-white ml-2 font-mono">{selectedRequest.method}</span>
            </div>
            <div>
              <span className="text-gray-400">Parameters:</span>
              <pre className="mt-1 p-2 bg-gray-800 rounded text-gray-300 overflow-x-auto">
                {JSON.stringify(selectedRequest.params, null, 2)}
              </pre>
            </div>
            {selectedRequest.error && (
              <div>
                <span className="text-gray-400">Error:</span>
                <div className="mt-1 p-2 bg-red-900/20 border border-red-500/30 rounded text-red-400">
                  {selectedRequest.error}
                </div>
              </div>
            )}
            {selectedRequest.response && (
              <div>
                <span className="text-gray-400">Response:</span>
                <pre className="mt-1 p-2 bg-gray-800 rounded text-gray-300 overflow-x-auto">
                  {JSON.stringify(selectedRequest.response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparison Mode */}
      {comparisonMode && compareRequests[0] && compareRequests[1] && (
        <div className="bg-gray-700 rounded p-4">
          <h4 className="text-lg font-medium text-white mb-4">Request Comparison</h4>
          <div className="grid grid-cols-2 gap-4">
            {compareRequests.map((request, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center space-x-2">
                  {request!.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-white font-medium">{request!.method}</span>
                  <span className="text-gray-400 text-sm">{request!.correlationId}</span>
                </div>
                <div className="text-sm">
                  <div className="text-gray-400">Duration: {request!.duration}ms</div>
                  <div className="text-gray-400">Time: {request!.timestamp.toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Show differences */}
          <div className="mt-4 p-3 bg-gray-800 rounded">
            <h5 className="text-sm font-medium text-gray-300 mb-2">Differences:</h5>
            <div className="text-sm text-gray-400">
              {(() => {
                const diff = getDifferenceHighlight(compareRequests[0], compareRequests[1]);
                if (!diff) return <span className="text-green-400">No differences found</span>;
                return (
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(diff, null, 2)}
                  </pre>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Replay History */}
      {replayHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Replay History:</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {replayHistory.map((replay) => (
              <div
                key={replay.correlationId}
                className="p-2 bg-gray-700 rounded flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  {replay.status === 'success' ? (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-red-400" />
                  )}
                  <span className="text-white text-sm">{replay.method}</span>
                  <span className="text-gray-500 text-xs">→</span>
                  <span className="text-gray-400 text-xs">{replay.correlationId}</span>
                </div>
                <span className="text-gray-500 text-xs">
                  {replay.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};