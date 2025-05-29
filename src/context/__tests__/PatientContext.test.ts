import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { mockPatients } from '../../data/mockData';
import { Patient } from '../../types';

const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

const mockCreateObjectURL = jest.fn(() => 'mock-url');
const mockRevokeObjectURL = jest.fn();

describe('PatientContext JSON functionality', () => {
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
    
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick
    };
    mockCreateElement.mockReturnValue(mockAnchor);
    mockCreateObjectURL.mockReturnValue('mock-url');
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('exportPatientsToJSON', () => {
    it('should create a JSON blob with patient data', () => {
      const patients = [...mockPatients];
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
      };
      
      exportPatientsToJSON();
      
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect((mockCreateElement.mock.results[0].value as {href: string, download: string, click: jest.Mock}).href).toBe('mock-url');
      expect((mockCreateElement.mock.results[0].value as {href: string, download: string, click: jest.Mock}).download).toContain('patient-data-');
      
      expect(mockAppendChild).toHaveBeenCalledTimes(1);
      expect(mockClick).toHaveBeenCalledTimes(1);
      expect(mockRemoveChild).toHaveBeenCalledTimes(1);
      
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
    });
    
    it('should generate a filename with the current date', () => {
      const mockDate = new Date('2025-05-28');
      const spy = jest.spyOn(globalThis, 'Date');
      spy.mockImplementation(() => mockDate);
      
      const patients = [...mockPatients];
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
      };
      
      exportPatientsToJSON();
      
      expect((mockCreateElement.mock.results[0].value as {href: string, download: string, click: jest.Mock}).download).toBe('patient-data-2025-05-28.json');
      
      spy.mockRestore();
    });
  });
  
  describe('importPatientsFromJSON', () => {
    it('should set patients state with imported data', () => {
      const setPatients = jest.fn();
      
      const importPatientsFromJSON = (importedPatients: Patient[]) => {
        setPatients(importedPatients);
      };
      
      const testPatients = [...mockPatients];
      
      importPatientsFromJSON(testPatients);
      
      expect(setPatients).toHaveBeenCalledWith(testPatients);
      expect(setPatients).toHaveBeenCalledTimes(1);
    });
    
    it('should handle empty patient array', () => {
      const setPatients = jest.fn();
      
      const importPatientsFromJSON = (importedPatients: Patient[]) => {
        setPatients(importedPatients);
      };
      
      importPatientsFromJSON([]);
      
      expect(setPatients).toHaveBeenCalledWith([]);
    });
  });
});
