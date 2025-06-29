class DebugLogger {
  private logs: string[] = [];
  private static instance: DebugLogger;

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  addLog(message: string, source: string = 'General'): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${source}] ${message}`;
    console.log(logEntry);
    this.logs.push(logEntry);
    
    // Keep only last 1000 logs to prevent memory issues
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  downloadLogs(filename?: string): void {
    const logContent = this.logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `debug-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export const debugLogger = DebugLogger.getInstance();