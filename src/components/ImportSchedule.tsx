import React, { useState } from 'react';
import { usePatientContext } from '../hooks/usePatientContext';
import { useTimeContext } from '../hooks/useTimeContext';
import { Patient } from '../types';
import { X, Check, AlertCircle } from 'lucide-react';
import { debugLogger } from '../services/debugLogger';
import { parseSchedule } from '../utils/parseSchedule';

interface ImportScheduleProps {
  onClose: () => void;
}

const ImportSchedule: React.FC<ImportScheduleProps> = ({ onClose }) => {
  const { updatePatients } = usePatientContext();
  const { getCurrentTime } = useTimeContext();
  const [scheduleText, setScheduleText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
  const addLog = (message: string) => {
    debugLogger.addLog(message, 'ImportSchedule');
  };

  const handleImport = () => {
    addLog('🎯 Starting import process...');
    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      addLog('📋 About to parse schedule text: ' + scheduleText.substring(0, 100) + '...');
      const patients = parseSchedule(scheduleText, getCurrentTime(), { logFunction: addLog });

      addLog(`✅ Parsing complete. Found ${patients.length} valid patients`);

      if (patients.length === 0) {
        addLog('❌ No valid appointments found');
        setError('No valid appointments found in the schedule.');
        return;
      }

      // Add unique IDs to all patients
      addLog(`🏷️ Adding unique IDs to ${patients.length} patients`);
      const patientsWithIds: Patient[] = patients.map(patientData => ({
        ...patientData,
        id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));

      // Update all patients at once to avoid race conditions
      addLog(`➕ Updating context with all ${patientsWithIds.length} patients at once`);
      updatePatients(patientsWithIds);

      addLog('✅ Import process completed successfully');
      setSuccess(`Successfully imported ${patients.length} appointments`);

      // Show a success message briefly then close
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse schedule. Please check the format.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Import Schedule</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={processing}
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 mb-2">
            Paste schedule data (tab-separated):
          </label>
          <textarea
            value={scheduleText}
            onChange={(e) => setScheduleText(e.target.value)}
            className={`w-full h-64 bg-gray-700 text-white border rounded p-2 font-mono ${
              error ? 'border-red-500' : success ? 'border-green-500' : 'border-gray-600'
            }`}
            placeholder="06/28/2025&#9;09:00 AM&#9;Confirmed&#9;TONYA LEWIS&#9;04/03/1956&#9;Office Visit&#9;INSURANCE 2025&#9;$0.00"
            disabled={processing}
          />
        </div>

        {(error || success) && (
          <div className={`flex items-center gap-2 mb-4 ${error ? 'text-red-400' : 'text-green-400'}`}>
            {error ? <AlertCircle size={18} /> : <Check size={18} />}
            <p>{error || success}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors ${success ? 'hidden' : ''}`}
              disabled={processing}
            >
              Cancel
            </button>
            <button
              onClick={success ? onClose : handleImport}
              disabled={!scheduleText.trim() || processing}
              className={`px-4 py-2 text-white rounded transition-colors flex items-center gap-2 ${
                processing ? 'bg-blue-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {processing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  {success ? 'Close' : 'Import Schedule'}
                </>
              )}
            </button>
        </div>
      </div>
    </div>
  );
}

export default ImportSchedule;