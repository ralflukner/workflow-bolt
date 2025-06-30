import React, { Component, createRef } from 'react';
import { withContexts, WithContextsProps } from './withContexts';
import { Patient } from '../types';
import { X, Check, AlertCircle, Upload } from 'lucide-react';

interface ImportJSONProps {
  onClose: () => void;
}

interface State {
  error: string | null;
  success: string | null;
  processing: boolean;
}

class ImportJSONClass extends Component<ImportJSONProps & WithContextsProps, State> {
  private fileInputRef = createRef<HTMLInputElement>();
  private successTimeout: NodeJS.Timeout | null = null;

  constructor(props: ImportJSONProps & WithContextsProps) {
    super(props);

    this.state = {
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

  validatePatientData = (data: unknown): data is Patient[] => {
    if (!Array.isArray(data)) {
      throw new Error('JSON data must be an array of patients');
    }

    const requiredFields = ['id', 'name', 'dob', 'appointmentTime', 'provider', 'status'];
    
    for (let i = 0; i < data.length; i++) {
      const patient = data[i];
      if (typeof patient !== 'object' || patient === null) {
        throw new Error(`Patient at index ${i} is not a valid object`);
      }
      
      for (const field of requiredFields) {
        if (!(field in patient)) {
          throw new Error(`Patient at index ${i} is missing required field: ${field}`);
        }
        if (typeof patient[field] !== 'string') {
          throw new Error(`Patient at index ${i} field '${field}' must be a string`);
        }
      }
    }

    return true;
  };

  handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    this.setState({
      processing: true,
      error: null,
      success: null
    });

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string;
        
        // Check file size (limit to ~10MB of text)
        if (fileContent.length > 10 * 1024 * 1024) {
          throw new Error('File is too large. Maximum size is 10MB.');
        }
        
        const jsonData = JSON.parse(fileContent);
         
        if (this.validatePatientData(jsonData)) {
          this.props.patientContext.importPatientsFromJSON(jsonData);
          this.setState({
            success: `Successfully imported ${jsonData.length} patients`,
            processing: false
          });

          this.successTimeout = setTimeout(() => {
            this.props.onClose();
          }, 2000); // Slightly longer delay
        }
      } catch (err) {
        this.setState({
          error: err instanceof Error ? err.message : 'Failed to parse JSON file',
          processing: false
        });
      }
    };
    
    reader.onerror = () => {
      this.setState({
        error: 'Failed to read file',
        processing: false
      });
    };
    
    reader.readAsText(file);
  };

  handleChooseFileClick = () => {
    this.fileInputRef.current?.click();
  };

  render() {
    const { error, success, processing } = this.state;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Import Patient Data</h2>
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
              Select JSON file to import:
            </label>
            <input
              ref={this.fileInputRef}
              type="file"
              accept=".json"
              onChange={this.handleFileSelect}
              className="hidden"
              disabled={processing}
            />
            <button
              onClick={this.handleChooseFileClick}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:bg-blue-700 disabled:cursor-not-allowed"
            >
              <Upload size={18} />
              {processing ? 'Processing...' : 'Choose JSON File'}
            </button>
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
          </div>
        </div>
      </div>
    );
  }
}

// Export the wrapped component
const ImportJSON = withContexts(ImportJSONClass);
export default ImportJSON;