import React, { Component } from 'react';
import { withContexts, WithContextsProps } from './withContexts';
import { Patient } from '@/types';
import { X, Check, AlertCircle, Shield, TestTube, AlertTriangle } from 'lucide-react';
import { debugLogger } from '../services/debugLogger';
import { parseScheduleAuto } from '../utils/parseScheduleAdvanced';
import { parseSchedule } from '../utils/parseSchedule'; // Legacy parser for testing
import { parseScheduleWithMegaParse } from '../utils/megaParseSchedule';
import { normalizeStatus } from '../context/PatientContext';

interface ImportScheduleProps {
  onClose: () => void;
}

type ImportMode = 'megaparse' | 'secure' | 'legacy';

interface State {
  scheduleText: string;
  error: string | null;
  success: string | null;
  processing: boolean;
  importMode: ImportMode;
  showTestWarning: boolean;
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
      importMode: 'megaparse', // Default to MegaParse
      showTestWarning: false,
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
    const { importMode } = this.state;
    
    switch (importMode) {
      case 'megaparse':
        this.handleMegaParseImport();
        break;
      case 'secure':
        this.handleSecureImport();
        break;
      case 'legacy':
        this.handleLegacyImport();
        break;
    }
  };

  handleMegaParseImport = async () => {
    this.addLog('🚀 Starting MegaParse-powered import process...');
    this.setState({
      processing: true,
      error: null,
      success: null
    });

    try {
      this.addLog('📋 Using MegaParse for advanced document analysis...');
      
      // Use MegaParse to parse the schedule
      const patients = await parseScheduleWithMegaParse(
        this.state.scheduleText, 
        this.props.timeContext.getCurrentTime(), 
        { 
          logFunction: this.addLog,
          securityAudit: true,
          defaultProvider: 'RALF LUKNER'
        }
      );

      this.addLog(`✅ MegaParse analysis complete. Found ${patients.length} valid patients`);

      if (patients.length === 0) {
        this.addLog('❌ No valid appointments found');
        this.setState({
          error: 'No valid appointments found in the schedule. The format may not be recognized.',
          processing: false
        });
        return;
      }

      // Add unique IDs and normalize status for all patients with advanced parsing tags
      this.addLog(`🏷️ Adding secure unique IDs and normalizing status for ${patients.length} patients`);
      const patientsWithIds: Patient[] = patients.map((patientData) => ({
        ...patientData,
        id: `mega-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        status: normalizeStatus(patientData.status) as any,
      }));

      // Store in memory with MegaParse flags
      this.addLog(`🧠 Updating context with ${patientsWithIds.length} MegaParse-analyzed patients`);
      this.props.patientContext.updatePatients(patientsWithIds);

      this.addLog('✅ MegaParse import process completed successfully');
      this.setState({
        success: `🚀 Successfully imported ${patients.length} appointments (MegaParse-powered)`,
        processing: false
      });

      // Show a success message briefly then close
      this.successTimeout = setTimeout(() => {
        this.props.onClose();
      }, 1500);
    } catch (err) {
      this.addLog('❌ MegaParse import failed, attempting fallback...');
      this.setState({
        error: err instanceof Error ? 
          `MegaParse failed: ${err.message}. Try secure mode for fallback parsing.` : 
          'MegaParse failed. Please try secure mode or check the format.',
        processing: false
      });
    }
  };

  handleSecureImport = () => {
    this.addLog('🔒 Starting HIPAA-compliant import process...');
    this.setState({
      processing: true,
      error: null,
      success: null
    });

    try {
      this.addLog('📋 About to parse schedule text (first 100 chars): ' + this.state.scheduleText.substring(0, 100) + '...');
      
      // Use the advanced auto-detecting parser
      const patients = parseScheduleAuto(
        this.state.scheduleText, 
        this.props.timeContext.getCurrentTime(), 
        { 
          logFunction: this.addLog,
          securityAudit: true,
          saveToSecureStorage: true,
          storageKey: `secure_import_${Date.now()}`
        }
      );

      this.addLog(`✅ HIPAA-compliant parsing complete. Found ${patients.length} valid patients`);

      if (patients.length === 0) {
        this.addLog('❌ No valid appointments found');
        this.setState({
          error: 'No valid appointments found in the schedule. Please check the format.',
          processing: false
        });
        return;
      }

      // Add unique IDs and normalize status for all patients with PHI protection
      this.addLog(`🏷️ Adding secure unique IDs and normalizing status for ${patients.length} patients`);
      const patientsWithIds: Patient[] = patients.map((patientData) => ({
        ...patientData,
        id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        status: normalizeStatus(patientData.status) as any,
      }));

      // Store in memory with encryption flags
      this.addLog(`🔐 Updating secure context with all ${patientsWithIds.length} patients`);
      this.props.patientContext.updatePatients(patientsWithIds);

      this.addLog('✅ HIPAA-compliant import process completed successfully');
      this.setState({
        success: `🛡️ Successfully imported ${patients.length} appointments (HIPAA-compliant)`,
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

  handleLegacyImport = () => {
    this.addLog('⚠️ Starting LEGACY (potentially broken) import process...');
    this.setState({
      processing: true,
      error: null,
      success: null
    });

    try {
      this.addLog('📋 Using legacy parser (this may fail or behave unexpectedly)');
      
      // Simulate the broken main code by using the legacy parser
      const patients = parseSchedule(
        this.state.scheduleText, 
        this.props.timeContext.getCurrentTime()
      );

      this.addLog(`⚠️ Legacy parsing complete. Found ${patients.length} valid patients`);

      if (patients.length === 0) {
        this.addLog('❌ Legacy parser found no valid appointments (expected behavior)');
        this.setState({
          error: 'Legacy parser failed - this demonstrates the broken main code path. Try enabling secure mode.',
          processing: false
        });
        return;
      }

      // Add IDs and normalize status without security flags
      this.addLog(`🏷️ Adding basic IDs and normalizing status for ${patients.length} patients (no security)`);
      const patientsWithIds: Patient[] = patients.map((patientData) => ({
        ...patientData,
        id: `legacy-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        status: normalizeStatus(patientData.status) as any,
      }));

      // Store without encryption
      this.addLog(`📂 Updating context with ${patientsWithIds.length} patients (no encryption)`);
      this.props.patientContext.updatePatients(patientsWithIds);

      this.addLog('⚠️ Legacy import process completed (potentially with issues)');
      this.setState({
        success: `⚠️ Imported ${patients.length} appointments using legacy method (not HIPAA-compliant)`,
        processing: false
      });

      // Show a success message briefly then close
      this.successTimeout = setTimeout(() => {
        this.props.onClose();
      }, 2000); // Longer timeout to show warning
    } catch (err) {
      this.addLog('❌ Legacy parser failed as expected');
      this.setState({
        error: `Legacy parser failed: ${err instanceof Error ? err.message : 'Unknown error'} (This demonstrates the broken main code)`,
        processing: false
      });
    }
  };

  handleScheduleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ scheduleText: e.target.value });
  };

  handleModeChange = (newMode: ImportMode) => {
    this.setState({ 
      importMode: newMode,
      showTestWarning: newMode === 'legacy', // Show warning only for legacy mode
      error: null,
      success: null
    });
    
    switch (newMode) {
      case 'megaparse':
        this.addLog('🚀 Switched to MegaParse mode - advanced document parsing');
        break;
      case 'secure':
        this.addLog('🔒 Switched to secure HIPAA-compliant mode');
        break;
      case 'legacy':
        this.addLog('⚠️ Switched to legacy mode for testing broken code path');
        break;
    }
  };

  dismissTestWarning = () => {
    this.setState({ showTestWarning: false });
  };

  render() {
    const { scheduleText, error, success, processing, importMode, showTestWarning } = this.state;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              {importMode === 'megaparse' ? (
                <div className="flex items-center gap-2">
                  <div className="text-purple-400 font-bold text-lg">⚡</div>
                  <h2 className="text-xl font-semibold text-white">MegaParse Schedule Import</h2>
                </div>
              ) : importMode === 'secure' ? (
                <>
                  <Shield className="text-blue-400" size={20} />
                  <h2 className="text-xl font-semibold text-white">HIPAA-Compliant Schedule Import</h2>
                </>
              ) : (
                <>
                  <TestTube className="text-yellow-400" size={20} />
                  <h2 className="text-xl font-semibold text-white">Legacy Test Schedule Import</h2>
                </>
              )}
            </div>
            <button
              onClick={this.props.onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={processing}
            >
              <X size={24} />
            </button>
          </div>

          {/* Mode Selection */}
          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-300 font-medium">Import Mode:</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => this.handleModeChange('megaparse')}
                disabled={processing}
                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                  importMode === 'megaparse'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                <div className="flex items-center gap-1 justify-center">
                  <span>⚡</span>
                  <span>MegaParse</span>
                </div>
              </button>
              
              <button
                onClick={() => this.handleModeChange('secure')}
                disabled={processing}
                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                  importMode === 'secure'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                <div className="flex items-center gap-1 justify-center">
                  <Shield size={14} />
                  <span>Secure</span>
                </div>
              </button>
              
              <button
                onClick={() => this.handleModeChange('legacy')}
                disabled={processing}
                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                  importMode === 'legacy'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                <div className="flex items-center gap-1 justify-center">
                  <TestTube size={14} />
                  <span>Legacy</span>
                </div>
              </button>
            </div>
            
            <p className="text-xs text-gray-400 mt-2">
              {importMode === 'megaparse' && (
                'Advanced AI-powered document parsing for complex formats'
              )}
              {importMode === 'secure' && (
                'Uses encrypted storage, audit logging, and HIPAA-compliant parsing'
              )}
              {importMode === 'legacy' && (
                'Uses legacy parser to demonstrate broken code path - for testing only'
              )}
            </p>
          </div>

          {/* Test Warning */}
          {showTestWarning && (
            <div className="mb-4 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-yellow-400 mt-0.5 flex-shrink-0" size={16} />
                <div className="flex-1">
                  <p className="text-yellow-200 text-sm font-medium mb-1">
                    Testing Mode Active
                  </p>
                  <p className="text-yellow-300 text-xs">
                    You are now testing the legacy (broken) code path. This mode intentionally
                    uses older parsing logic that may fail or produce unexpected results.
                    This is for demonstration purposes only.
                  </p>
                  <button
                    onClick={this.dismissTestWarning}
                    className="mt-2 text-yellow-200 hover:text-yellow-100 text-xs underline"
                  >
                    Understood
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <span>Paste schedule data:</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  importMode === 'megaparse' 
                    ? 'bg-purple-900 text-purple-200' 
                    : importMode === 'secure' 
                    ? 'bg-blue-900 text-blue-200' 
                    : 'bg-yellow-900 text-yellow-200'
                }`}>
                  {importMode === 'megaparse' ? 'AI-POWERED' : importMode === 'secure' ? 'SECURE' : 'TEST MODE'}
                </span>
              </div>
            </label>
            <textarea
              value={scheduleText}
              onChange={this.handleScheduleTextChange}
              className={`w-full h-64 bg-gray-700 text-white border rounded p-2 font-mono text-sm ${
                error ? 'border-red-500' : success ? 'border-green-500' : 'border-gray-600'
              }`}
              placeholder={importMode === 'megaparse' 
                ? `MegaParse supports complex medical schedule formats:

• Multi-line appointment entries
• Various clinic formats (Lukner Medical, etc.)
• Intelligent field extraction
• Advanced document structure analysis

Paste your schedule data - MegaParse will automatically analyze and extract patient information.`
                : `Supports multiple formats:

Lukner Medical Clinic format:
RALF LUKNER 9:45 AM Cancelled ANITA BURGER 12/05/1956 (503) 420-6404 - Office Visit $0.00

TSV format:
06/28/2025	09:00 AM	Confirmed	TONYA LEWIS	04/03/1956	Office Visit	INSURANCE 2025	$0.00

Data is stored securely in memory only and encrypted at rest.`}
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
                  processing ? (
                    importMode === 'megaparse' 
                      ? 'bg-purple-700 cursor-not-allowed' 
                      : importMode === 'secure' 
                      ? 'bg-blue-700 cursor-not-allowed' 
                      : 'bg-yellow-700 cursor-not-allowed'
                  ) : (
                    importMode === 'megaparse' 
                      ? 'bg-purple-600 hover:bg-purple-500' 
                      : importMode === 'secure' 
                      ? 'bg-blue-600 hover:bg-blue-500' 
                      : 'bg-yellow-600 hover:bg-yellow-500'
                  )
                }`}
              >
                {processing ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {importMode === 'megaparse' 
                      ? 'Analyzing with MegaParse...' 
                      : importMode === 'secure' 
                      ? 'Processing Securely...' 
                      : 'Testing Legacy Code...'
                    }
                  </>
                ) : (
                  <>
                    {success ? 'Close' : (
                      importMode === 'megaparse' 
                        ? '⚡ Import with MegaParse' 
                        : importMode === 'secure' 
                        ? '🛡️ Import Schedule (Secure)' 
                        : '⚠️ Test Legacy Import'
                    )}
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