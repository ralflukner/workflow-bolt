import React, { Component } from 'react';
import { withContexts, WithContextsProps } from './withContexts';
import { Patient } from '@/types';
import { X, Check, AlertCircle } from 'lucide-react';
import { debugLogger } from '../services/debugLogger';
import { parseSchedule } from '../utils/parseSchedule';

interface ImportScheduleProps {
  onClose: () => void;
}

interface State {
  scheduleText: string;
  error: string | null;
  success: string | null;
  processing: boolean;
}

class ImportScheduleClass extends Component<ImportScheduleProps & WithContextsProps, State> {
  private successTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ImportScheduleProps & WithContextsProps) {
    super(props);

    this.state = {
      scheduleText: '',
      error: null,
      success: null,
      processing: false,
    };
  }

  componentWillUnmount() {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  addLog = (message: string) => {
    debugLogger.addLog(message, 'ImportSchedule');
  };

  handleImport = () => {
    this.addLog('🎯 Starting import process...');
    this.setState({
      processing: true,
      error: null,
      success: null
    });

    try {
      this.addLog('📋 About to parse schedule text: ' + this.state.scheduleText.substring(0, 100) + '...');
      const patients = parseSchedule(
        this.state.scheduleText, 
        this.props.timeContext.getCurrentTime(), 
        { logFunction: this.addLog }
      );

      this.addLog(`✅ Parsing complete. Found ${patients.length} valid patients`);

      if (patients.length === 0) {
        this.addLog('❌ No valid appointments found');
        this.setState({
          error: 'No valid appointments found in the schedule.',
          processing: false
        });
        return;
      }

      // Add unique IDs to all patients
      this.addLog(`🏷️ Adding unique IDs to ${patients.length} patients`);
      const patientsWithIds: Patient[] = patients.map(patientData => ({
        ...patientData,
        id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));

      // Update all patients at once to avoid race conditions
      this.addLog(`➕ Updating context with all ${patientsWithIds.length} patients at once`);
      this.props.patientContext.updatePatients(patientsWithIds);

      this.addLog('✅ Import process completed successfully');
      this.setState({
        success: `Successfully imported ${patients.length} appointments`,
        processing: false
      });

      // Show a success message briefly then close
      this.successTimeout = setTimeout(() => {
        this.props.onClose();
      }, 1500);
    } catch (err) {
      this.setState({
        error: err instanceof Error ? err.message : 'Failed to parse schedule. Please check the format.',
        processing: false
      });
    }
  };

  handleScheduleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ scheduleText: e.target.value });
  };

  render() {
    const { scheduleText, error, success, processing } = this.state;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Import Schedule</h2>
            <button
              onClick={this.props.onClose}
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
              onChange={this.handleScheduleTextChange}
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
                onClick={this.props.onClose}
                className={`px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors ${success ? 'hidden' : ''}`}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={success ? this.props.onClose : this.handleImport}
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
}

// Export the wrapped component
const ImportSchedule = withContexts(ImportScheduleClass);
export default ImportSchedule;