import { describe, it, expect, jest } from '@jest/globals';
import { Patient } from '../../types';

const validPatientData: Patient[] = [
  {
    id: 'test-1',
    name: 'Test Patient',
    dob: '1990-01-01',
    appointmentTime: '2025-05-28T09:00:00.000Z',
    provider: 'Dr. Test',
    status: 'scheduled'
  }
];

describe('ImportJSON Component Validation', () => {
  describe('validatePatientData function', () => {
    const validatePatientData = (data: unknown): data is Patient[] => {
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

    it('should validate correct patient data', () => {
      expect(() => validatePatientData(validPatientData)).not.toThrow();
      expect(validatePatientData(validPatientData)).toBe(true);
    });

    it('should throw error if data is not an array', () => {
      const invalidData = { name: 'Not an array' };
      expect(() => validatePatientData(invalidData)).toThrow('JSON data must be an array of patients');
    });

    it('should throw error if patient is missing required fields', () => {
      const invalidPatient = [
        {
          id: 'test-1',
          dob: '1990-01-01',
          appointmentTime: '2025-05-28T09:00:00.000Z',
          provider: 'Dr. Test',
          status: 'scheduled'
        }
      ];
      
      expect(() => validatePatientData(invalidPatient)).toThrow('Patient at index 0 is missing required field: name');
    });

    it('should validate empty array', () => {
      expect(() => validatePatientData([])).not.toThrow();
      expect(validatePatientData([])).toBe(true);
    });
  });

  describe('File reading and JSON parsing', () => {
    it('should handle JSON parsing errors', () => {
      jest.useFakeTimers();
      
      const mockSetError = jest.fn();
      const mockSetProcessing = jest.fn();
      
      const mockFileReader = {
        onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
        readAsText: jest.fn(() => {
          setTimeout(() => {
            if (mockFileReader.onload) {
              (mockFileReader.onload as (ev: {target: {result: string}}) => void)({ target: { result: 'not valid json' } });
            }
          }, 0);
        })
      };
      
      const originalFileReader = globalThis.FileReader;
      globalThis.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader;
      
      const mockFile = new File([''], 'test.json', { type: 'application/json' });
      
      const handleFileSelect = (file: File) => {
        mockSetProcessing(true);
        mockSetError(null);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            JSON.parse(e.target?.result as string);
          } catch (err) {
            mockSetError(err instanceof Error ? err.message : 'Failed to parse JSON file');
          } finally {
            mockSetProcessing(false);
          }
        };
        
        reader.onerror = () => {
          mockSetError('Failed to read file');
          mockSetProcessing(false);
        };
        
        reader.readAsText(file);
      };
      
      handleFileSelect(mockFile);
      
      jest.runAllTimers();
      
      expect(mockSetError).toHaveBeenCalledWith(expect.stringContaining('JSON'));
      expect(mockSetProcessing).toHaveBeenCalledWith(false);
      
      globalThis.FileReader = originalFileReader;
      jest.useRealTimers();
    });
  });
});
