import React from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface TebraIntegrationProps {
  onSyncToday?: () => void;
  onTestConnection?: () => void;
  isConnected?: boolean;
  lastSync?: string;
}

const TebraIntegrationSimple: React.FC<TebraIntegrationProps> = ({
  onSyncToday = () => console.log('Sync Today clicked'),
  onTestConnection = () => console.log('Test Connection clicked'),
  isConnected = false,
  lastSync = 'Never'
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <RefreshCw className="mr-2" size={20} />
          Tebra Integration
        </h2>
        <div className="flex items-center">
          {isConnected ? (
            <CheckCircle className="text-green-500 mr-2" size={20} />
          ) : (
            <XCircle className="text-red-500 mr-2" size={20} />
          )}
          <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="text-gray-300">
          <Clock className="inline mr-2" size={16} />
          Last Sync: {lastSync}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onSyncToday}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
        >
          <RefreshCw size={16} className="mr-2" />
          Sync Today
        </button>
        
        <button
          onClick={onTestConnection}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
        >
          <CheckCircle size={16} className="mr-2" />
          Test Connection
        </button>
      </div>
    </div>
  );
};

export default TebraIntegrationSimple;