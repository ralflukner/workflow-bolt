import React, { useState, useRef } from 'react';
import { usePatientContext } from '../hooks/usePatientContext';
import { Patient } from '../types';
import { X, Check, AlertCircle, Upload } from 'lucide-react';

interface ImportJSONProps {
  onClose: () => void;
}

const ImportJSON: React.FC<ImportJSONProps> = ({ onClose }) => {
  const { importPatientsFromJSON } = usePatientContext();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validatePatientData = (data: any): data is Patient[] => {
    if (!Array.isArray(data)) {
      throw new Error('JSON data must be an array of patients');
    }

    const requiredFields = ['id', 'name', 'dob', 'appointmentTime', 'provider', 'status'];
    
    for (let i = 0; i < data.length; i++) {
      const patient = data[i];
      for (const field of requiredFields) {
        if (!(field in patient)) {
          throw new Error(`Patient at index ${i} is missing required field: ${field}`);
        }
      }
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        if (validatePatientData(jsonData)) {
          importPatientsFromJSON(jsonData);
          setSuccess(`Successfully imported ${jsonData.length} patients`);
          
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse JSON file');
      } finally {
        setProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file');
      setProcessing(false);
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Import Patient Data</h2>
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
            Select JSON file to import:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            disabled={processing}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
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
            onClick={onClose}
            className={`px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors ${success ? 'hidden' : ''}`}
            disabled={processing}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportJSON;
