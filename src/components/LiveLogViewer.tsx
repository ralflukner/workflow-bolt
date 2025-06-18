import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Filter, Download, Trash2, Play, Pause } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'error' | 'warning' | 'debug';
  component: string;
  message: string;
  correlationId?: string;
  metadata?: Record<string, any>;
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
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isPaused, setIsPaused] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [highlightCorrelationId, setHighlightCorrelationId] = useState<string | null>(null);

  // Simulate real-time log streaming (in production, connect to actual log stream)
  useEffect(() => {
    if (isPaused) return;

    const generateLog = (): LogEntry => {
      const components = ['TebraProxy', 'CloudRun', 'Firebase', 'SOAP', 'Transform'];
      const levels: Array<LogEntry['level']> = ['info', 'error', 'warning', 'debug'];
      const correlationId = Math.random().toString(36).substring(2, 10);
      
      const templates = [
        { level: 'info', message: 'GetAppointments request initiated' },
        { level: 'error', message: 'SOAP fault: Object reference not set to an instance of an object' },
        { level: 'warning', message: 'Response time exceeding threshold: 3247ms' },
        { level: 'debug', message: 'Request headers: X-API-Key: [REDACTED]' },
        { level: 'info', message: 'Successfully retrieved 12 patients' },
        { level: 'error', message: 'Cloud Run health check failed: Connection timeout' },
      ];

      const template = templates[Math.floor(Math.random() * templates.length)];
      
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
  }, [isPaused, maxEntries]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && !isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll, isPaused]);

  const filteredLogs = logs.filter(log => {
    const matchesText = !filter || 
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      log.component.toLowerCase().includes(filter.toLowerCase()) ||
      (log.correlationId && log.correlationId.includes(filter));
    
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    
    return matchesText && matchesLevel;
  });

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      case 'debug': return 'text-gray-400';
    }
  };

  const getLevelBgColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'bg-red-900/20';
      case 'warning': return 'bg-yellow-900/20';
      case 'info': return 'bg-blue-900/20';
      case 'debug': return 'bg-gray-900/20';
    }
  };

  const exportLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.component}] ${log.message}${log.correlationId ? ` (ID: ${log.correlationId})` : ''}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tebra-logs-${new Date().toISOString()}.txt`;
    a.click();
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-600 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Terminal className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Live API Logs</h3>
          <span className="text-sm text-gray-400">({filteredLogs.length} entries)</span>
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
            onClick={exportLogs}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Export logs"
          >
            <Download className="w-4 h-4 text-gray-400" />
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

      {/* Filters */}
      <div className="flex space-x-2 mb-4">
        <div className="flex-1 relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter logs... (text, component, or correlation ID)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
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
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {filter || levelFilter !== 'all' ? 'No logs match the current filter' : 'No logs yet...'}
          </div>
        ) : (
          filteredLogs.map((log) => (
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
                    second: '2-digit',
                    fractionalSecondDigits: 3
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