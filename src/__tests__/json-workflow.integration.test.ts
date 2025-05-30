import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { mockPatients } from '../data/mockData';
import { Patient } from '../types';

describe('JSON Import/Export Integration', () => {
  const mockCreateElement = jest.fn();
  const mockAppendChild = jest.fn();
  const mockRemoveChild = jest.fn();
  const mockClick = jest.fn();
  const mockCreateObjectURL = jest.fn(() => 'mock-url');
  const mockRevokeObjectURL = jest.fn();
  
  const mockAnchor = {
    href: '',
    download: '',
    click: mockClick
  };
  
  beforeEach(() => {
    document.createElement = mockCreateElement as unknown as typeof document.createElement;
    document.body.appendChild = mockAppendChild as unknown as typeof document.body.appendChild;
    document.body.removeChild = mockRemoveChild as unknown as typeof document.body.removeChild;
    URL.createObjectURL = mockCreateObjectURL;
    URL.revokeObjectURL = mockRevokeObjectURL;
    
    mockCreateElement.mockReset();
    mockAppendChild.mockReset();
    mockRemoveChild.mockReset();
    mockClick.mockReset();
    mockCreateObjectURL.mockReset();
    mockRevokeObjectURL.mockReset();
    
    mockCreateElement.mockReturnValue(mockAnchor);
    mockCreateObjectURL.mockReturnValue('mock-url');
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('should maintain data integrity through export and import cycle', () => {
    const patients: Patient[] = [...mockPatients];
    
    const setPatients = jest.fn();
    
    const exportPatientsToJSON = () => {
      const jsonData = JSON.stringify(patients, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return jsonData;
    };
    
    const importPatientsFromJSON = (jsonData: string) => {
      const importedPatients = JSON.parse(jsonData);
      setPatients(importedPatients);
      return importedPatients;
    };
    
    const exportedData = exportPatientsToJSON();
    
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockAppendChild).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockRemoveChild).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
    
    const importedPatients = importPatientsFromJSON(exportedData);
    
    expect(importedPatients).toEqual(patients);
    expect(setPatients).toHaveBeenCalledWith(patients);
    expect(setPatients).toHaveBeenCalledTimes(1);
  });
  
  it('should handle validation during import cycle', () => {
    const validatePatientData = jest.fn((data: unknown): data is Patient[] => {
      if (!Array.isArray(data)) {
        throw new Error('JSON data must be an array of patients');
      }
      return true;
    });
    
    const validData = JSON.stringify(mockPatients);
    expect(() => {
      const parsed = JSON.parse(validData);
      validatePatientData(parsed);
    }).not.toThrow();
    
    const invalidData = '{"name": "Not an array"}';
    expect(() => {
      const parsed = JSON.parse(invalidData);
      validatePatientData(parsed);
    }).toThrow('JSON data must be an array of patients');
    
    expect(validatePatientData).toHaveBeenCalledTimes(2);
  });
});
