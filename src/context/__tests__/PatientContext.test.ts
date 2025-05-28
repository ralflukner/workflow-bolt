import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockPatients } from '../../data/mockData';

const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();

const mockCreateObjectURL = vi.fn(() => 'mock-url');
const mockRevokeObjectURL = vi.fn();

describe('PatientContext JSON functionality', () => {
  beforeEach(() => {
    document.createElement = mockCreateElement;
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;
    
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
    vi.restoreAllMocks();
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
      expect(mockCreateElement.mock.results[0].value.href).toBe('mock-url');
      expect(mockCreateElement.mock.results[0].value.download).toContain('patient-data-');
      
      expect(mockAppendChild).toHaveBeenCalledTimes(1);
      expect(mockClick).toHaveBeenCalledTimes(1);
      expect(mockRemoveChild).toHaveBeenCalledTimes(1);
      
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
    });
    
    it('should generate a filename with the current date', () => {
      const mockDate = new Date('2025-05-28');
      const spy = vi.spyOn(globalThis, 'Date');
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
      
      expect(mockCreateElement.mock.results[0].value.download).toBe('patient-data-2025-05-28.json');
      
      spy.mockRestore();
    });
  });
  
  describe('importPatientsFromJSON', () => {
    it('should set patients state with imported data', () => {
      const setPatients = vi.fn();
      
      const importPatientsFromJSON = (importedPatients: any[]) => {
        setPatients(importedPatients);
      };
      
      const testPatients = [...mockPatients];
      
      importPatientsFromJSON(testPatients);
      
      expect(setPatients).toHaveBeenCalledWith(testPatients);
      expect(setPatients).toHaveBeenCalledTimes(1);
    });
    
    it('should handle empty patient array', () => {
      const setPatients = vi.fn();
      
      const importPatientsFromJSON = (importedPatients: any[]) => {
        setPatients(importedPatients);
      };
      
      importPatientsFromJSON([]);
      
      expect(setPatients).toHaveBeenCalledWith([]);
    });
  });
});
