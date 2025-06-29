import React, { useState, useRef } from 'react';
import { Terminal, Filter, Download, Trash2, Play, Pause } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'error' | 'warning' | 'debug';
  component: string;
  message: string;
  correlationId?: string;
  metadata?: {
    duration?: number;
    statusCode?: number;
    method?: string;
  };
}

interface LiveLogViewerProps {
  maxEntries?: number;
  autoScroll?: boolean;
}

export const LiveLogViewer: React.FC<LiveLogViewerProps> = ({ 
  maxEntries = 500,
  autoScroll = true 
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'error' | 'warning' | 'debug'>('all');
  const [isPaused, setIsPaused] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [highlightCorrelationId, setHighlightCorrelationId] = useState<string | null>(null);

  // Generate mock logs for demonstration
  const generateLogs = () => {
    if (isPaused) return;

    const components = ['TebraAPI', 'Firebase', 'CloudRun', 'Frontend', 'AuthBridge'];
    const correlationId = Math.random().toString(36).substring(2, 10);

    const logTemplates = [
      { level: 'info' as const, message: 'API request initiated' },
      { level: 'info' as const, message: 'Data transformation completed' },
      { level: 'warning' as const, message: 'Rate limit approaching' },
      { level: 'error' as const, message: 'Connection timeout' },
      { level: 'debug' as const, message: 'Cache miss, fetching from source' },
      { level: 'info' as const, message: 'Patient data synchronized' },
      { level: 'error' as const, message: 'Invalid response format' },
      { level: 'warning' as const, message: 'High memory usage detected' }
    ];

    const generateLog = (): LogEntry => {
      const template = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      return {
        id: Math.random().toString(36).substring(2),
        timestamp: new Date(),
        level: template.level,
        component: components[Math.floor(Math.random() * components.length)],
        message: template.message,
        correlationId: Math.random() > 0.3 ? correlationId : undefined,
        metadata: Math.random() > 0.5 ? {
          duration: Math.floor(Math.random() * 5000),
          statusCode: Math.random() > 0.7 ? 500 : 200,
          method: 'GetAppointments'
        } : undefined
      };
    };

    const interval = setInterval(() => {
      const newLog = generateLog();
      setLogs(prev => {
        const updated = [newLog, ...prev];
        return updated.slice(0, maxEntries);
      });
    }, Math.random() * 2000 + 500);

    return () => clearInterval(interval);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  const handleLevelFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLevelFilter(e.target.value as 'all' | 'info' | 'error' | 'warning' | 'debug');
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-600 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Terminal className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Live API Logs</h3>
          <span className="text-sm text-gray-400">({logs.length} entries)</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? 
              <Play className="w-4 h-4 text-green-400" /> : 
              <Pause className="w-4 h-4 text-yellow-400" />
            }
          </button>
          <button
            onClick={() => {
              const interval = generateLogs();
              // Optionally, you can clear the interval if you want to stop generating logs
              // clearInterval(interval);
            }}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Generate new logs"
          >
            Generate Logs
          </button>
          <button
            onClick={() => setLogs([])}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter logs... (text, component, or correlation ID)"
            value={filter}
            onChange={handleFilterChange}
            aria-label="Filter logs by text, component, or correlation ID"
            id="log-filter"
            className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <label htmlFor="log-level-filter" className="sr-only">Filter logs by level</label>
        <select
          id="log-level-filter"
          value={levelFilter}
          onChange={handleLevelFilterChange}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
          aria-label="Filter logs by level"
          title="Filter logs by level"
        >
          <option value="all">All Levels</option>
          <option value="error">Errors</option>
          <option value="warning">Warnings</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
      </div>

      {/* Log entries */}
      <div 
        ref={logContainerRef}
        className="h-96 overflow-y-auto space-y-1 font-mono text-sm"
      >
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {filter || levelFilter !== 'all' ? 'No logs match the current filter' : 'No logs yet...'}
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-2 rounded ${getLevelBgColor(log.level)} ${
                highlightCorrelationId === log.correlationId ? 'ring-2 ring-blue-500' : ''
              } hover:bg-gray-700/50 transition-colors cursor-pointer`}
              onClick={() => setHighlightCorrelationId(
                highlightCorrelationId === log.correlationId ? null : log.correlationId || null
              )}
            >
              <div className="flex items-start space-x-2">
                <span className="text-gray-500 text-xs">
                  {log.timestamp.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit'
                  })}
                </span>
                <span className={`font-bold text-xs ${getLevelColor(log.level)}`}>
                  [{log.level.toUpperCase().padEnd(7)}]
                </span>
                <span className="text-cyan-400 text-xs">[{log.component}]</span>
                <span className="text-gray-300 flex-1">{log.message}</span>
              </div>

              {(log.correlationId || log.metadata) && (
                <div className="ml-20 mt-1 text-xs space-x-4">
                  {log.correlationId && (
                    <span className="text-gray-500">ID: {log.correlationId}</span>
                  )}
                  {log.metadata && (
                    <>
                      {log.metadata.duration && (
                        <span className="text-gray-500">Duration: {log.metadata.duration}ms</span>
                      )}
                      {log.metadata.statusCode && (
                        <span className={log.metadata.statusCode >= 400 ? 'text-red-400' : 'text-green-400'}>
                          Status: {log.metadata.statusCode}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
