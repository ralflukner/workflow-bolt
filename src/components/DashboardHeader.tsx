import React from 'react';
import { PlusCircle, FileDown, Upload, Download, Bug, FileText } from 'lucide-react';
import AuthNav from './AuthNav';
import MetricsPanel from './MetricsPanel';
import TimeControl from './TimeControl';
import TebraIntegration from './TebraIntegrationNew';
import MonitoringStatus from './MonitoringStatus';
import { debugLogger } from '../services/debugLogger';

interface DashboardHeaderProps {
  showDebugPanels: boolean;
  onToggleDebug: () => void;
  showDebugTextWindow?: boolean;
  onToggleDebugTextWindow?: () => void;
  onShowNewPatient: () => void;
  onShowImportSchedule: () => void;
  onShowImportJSON: () => void;
  onExportJSON: () => void;
  onExportSchedule: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  showDebugPanels,
  onToggleDebug,
  showDebugTextWindow,
  onToggleDebugTextWindow,
  onShowNewPatient,
  onShowImportSchedule,
  onShowImportJSON,
  onExportJSON,
  onExportSchedule
}) => {
  return (
    <header className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-0">
          Patient Flow Management
        </h1>

        <div className="flex items-center space-x-4">
          <AuthNav />
          <div className="flex space-x-2">
            <button 
              onClick={onShowImportSchedule}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
            >
              <Upload size={18} className="mr-1" />
              Import Schedule
            </button>
            <button 
              onClick={onShowImportJSON}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors"
            >
              <Upload size={18} className="mr-1" />
              Import JSON
            </button>
            <button 
              onClick={onShowNewPatient}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
            >
              <PlusCircle size={18} className="mr-1" />
              New Patient
            </button>
            <button 
              onClick={onExportJSON}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-500 transition-colors"
            >
              <Download size={18} className="mr-1" />
              Export JSON
            </button>
            <button 
              onClick={onExportSchedule}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors"
            >
              <FileDown size={18} className="mr-1" />
              Export Schedule
            </button>
            <button 
              onClick={onToggleDebug}
              className="flex items-center px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              <Bug size={18} className="mr-1" />
              {showDebugPanels ? 'Hide' : 'Show'} Debug
            </button>
            {onToggleDebugTextWindow && (
              <button 
                onClick={onToggleDebugTextWindow}
                className="flex items-center px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                <FileText size={18} className="mr-1" />
                {showDebugTextWindow ? 'Hide' : 'Show'} Text View
              </button>
            )}
            <button 
              onClick={() => debugLogger.downloadLogs('import-debug-logs.txt')}
              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 transition-colors"
            >
              <Download size={18} className="mr-1" />
              Debug Logs
            </button>
          </div>
        </div>
      </div>

      <div>
        <MetricsPanel />
        <div className="mt-4">
          <TimeControl />
        </div>
        <div className="mt-4">
          <TebraIntegration />
        </div>
        <div className="mt-4">
          <MonitoringStatus />
        </div>
      </div>
    </header>
  );
};