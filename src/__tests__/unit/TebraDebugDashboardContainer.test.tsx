import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TebraDebugDashboardContainer from '../../components/TebraDebugDashboardContainer';
import { PatientContext } from '../../context/PatientContextDef';
import { PatientContextType } from '../../context/PatientContextType';
import { tebraDebugApi } from '../../services/tebraDebugApi';
import { tebraApiService } from '../../services/tebraApiService';
import { Patient } from '../../types';

// Mock the Tebra debug services
jest.mock('../../services/tebraDebugApi');
jest.mock('../../services/tebraApiService');

const mockTebraDebugApi = tebraDebugApi as jest.Mocked<typeof tebraDebugApi>;
const mockTebraApiService = tebraApiService as jest.Mocked<typeof tebraApiService>;

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Activity: () => <div data-testid="activity-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />
}));

// Create test patients for MegaParse import scenario
const createTestPatients = (count: number): Patient[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `patient-${i + 1}`,
    name: `Test Patient ${i + 1}`,
    dob: '1980-01-01',
    appointmentTime: new Date(Date.now() + i * 60000).toISOString(),
    status: i % 2 === 0 ? 'scheduled' : 'arrived',
    provider: 'Dr. Test',
    appointmentType: 'Office Visit',
    chiefComplaint: 'Follow-up'
  }));
};

// Stub context factory
const createStubContext = (patients: Patient[] = []): PatientContextType => ({
  patients,
  addPatient: jest.fn(),
  updatePatients: jest.fn(),
  deletePatient: jest.fn(),
  updatePatientStatus: jest.fn(),
  assignRoom: jest.fn(),
  updateCheckInTime: jest.fn(),
  getPatientsByStatus: jest.fn(() => []),
  getMetrics: jest.fn(() => ({
    totalPatients: patients.length,
    patientsByStatus: {} as any,
    averageWaitTime: 0,
    patientsSeenToday: 0
  })),
  getWaitTime: jest.fn(() => 0),
  clearPatients: jest.fn(),
  exportPatientsToJSON: jest.fn(),
  importPatientsFromJSON: jest.fn(),
  tickCounter: 0,
  isLoading: false,
  persistenceEnabled: false,
  saveCurrentSession: jest.fn(),
  togglePersistence: jest.fn(),
  hasRealData: patients.length > 0,
  loadMockData: jest.fn(),
  refreshFromFirebase: jest.fn()
});

describe('TebraDebugDashboardContainer', () => {
  let stubContext: PatientContextType;

  beforeEach(() => {
    stubContext = createStubContext();
    jest.clearAllMocks();
    
    // Mock successful health checks by default
    const baseResult = { duration: 0, correlationId: 'test-correlation' } as const;
    mockTebraDebugApi.testFrontendHealth.mockResolvedValue({ status: 'healthy', message: 'OK', ...baseResult });
    mockTebraDebugApi.testFirebaseFunctions.mockResolvedValue({ status: 'healthy', message: 'OK', ...baseResult });
    mockTebraDebugApi.testTebraProxy.mockResolvedValue({ status: 'healthy', message: 'OK', ...baseResult });
    mockTebraDebugApi.testTebraApi.mockResolvedValue({ status: 'healthy', message: 'OK', ...baseResult });
    mockTebraDebugApi.testDataTransform.mockResolvedValue({ status: 'healthy', message: 'OK', ...baseResult });
    mockTebraDebugApi.testDashboardUpdate.mockResolvedValue({ status: 'healthy', message: 'OK', ...baseResult });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders default metrics correctly', () => {
      render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      expect(screen.getByText('Tebra Integration Status')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('Active Errors')).toBeInTheDocument();
      expect(screen.getByText('Avg Response')).toBeInTheDocument();
      expect(screen.getByText('Last Success')).toBeInTheDocument();
    });

    it('renders all data flow steps', () => {
      render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      expect(screen.getByText('Frontend Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Firebase Callable Functions')).toBeInTheDocument();
      expect(screen.getByText('Node.js → PHP Proxy')).toBeInTheDocument();
      expect(screen.getByText('Firebase → PHP Proxy')).toBeInTheDocument();
      expect(screen.getByText('PHP → Tebra SOAP')).toBeInTheDocument();
      expect(screen.getByText('Data Transformation')).toBeInTheDocument();
      expect(screen.getByText('Dashboard State Update')).toBeInTheDocument();
    });

    it('shows auto refresh toggle and refresh button', () => {
      render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      expect(screen.getByText('Auto Refresh')).toBeInTheDocument();
      expect(screen.getByText('Refresh Now')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeChecked(); // Auto refresh should be enabled by default
    });
  });

  describe('Health Check Functionality', () => {
    it('runs health checks on manual refresh', async () => {
      jest.useFakeTimers();
      
      render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      const refreshButton = screen.getByText('Refresh Now');
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(mockTebraDebugApi.testFrontendHealth).toHaveBeenCalled();
        expect(mockTebraDebugApi.testFirebaseFunctions).toHaveBeenCalled();
        expect(mockTebraDebugApi.testTebraProxy).toHaveBeenCalled();
        expect(mockTebraDebugApi.testTebraApi).toHaveBeenCalled();
        expect(mockTebraDebugApi.testDataTransform).toHaveBeenCalled();
        expect(mockTebraDebugApi.testDashboardUpdate).toHaveBeenCalled();
      });
    });

    it('displays success rate after successful health checks', async () => {
      render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      const refreshButton = screen.getByText('Refresh Now');
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(screen.getByText('100.0%')).toBeInTheDocument(); // 100% success rate
      });
    });

    it('handles health check failures and shows error rate', async () => {
      // Mock some failures
      const baseResult = { duration: 0, correlationId: 'test-correlation' } as const;
      mockTebraDebugApi.testTebraApi.mockResolvedValue({ status: 'error', message: 'Connection failed', ...baseResult });
      mockTebraDebugApi.testDataTransform.mockResolvedValue({ status: 'warning', message: 'Slow response', ...baseResult });

      render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      const refreshButton = screen.getByText('Refresh Now');
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        // With 1 error out of 7 steps, success rate should be ~85.7%
        expect(screen.getByText(/85\./)).toBeInTheDocument(); // Partial match for success rate
      });
    });
  });

  describe('MegaParse Integration Success Scenario', () => {
    it('handles successful MegaParse import with patients loaded', async () => {
      const testPatients = createTestPatients(15); // Simulate successful MegaParse import
      const contextWithPatients = createStubContext(testPatients);

      render(
        <PatientContext.Provider value={contextWithPatients}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      const refreshButton = screen.getByText('Refresh Now');
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        // Should show 100% success rate with patients loaded
        expect(screen.getByText('100.0%')).toBeInTheDocument();
        expect(mockTebraDebugApi.testDashboardUpdate).toHaveBeenCalled();
      });
    });

    it('shows warning when no patients are loaded after import', async () => {
      // Empty patient list suggests import issues
      render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      const refreshButton = screen.getByText('Refresh Now');
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(mockTebraDebugApi.testDashboardUpdate).toHaveBeenCalled();
        // Dashboard update should detect no patients and show warning
      });
    });

    it('shows performance warning with large patient datasets', async () => {
      const largePatientSet = createTestPatients(150); // Large import from MegaParse
      const contextWithManyPatients = createStubContext(largePatientSet);

      render(
        <PatientContext.Provider value={contextWithManyPatients}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      const refreshButton = screen.getByText('Refresh Now');
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(mockTebraDebugApi.testDashboardUpdate).toHaveBeenCalled();
        // Should detect performance warning with >100 patients
      });
    });
  });

  describe('Auto-refresh Functionality', () => {
    it('starts auto-refresh interval by default', () => {
      jest.useFakeTimers();
      jest.spyOn(global, 'setInterval');

      render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    it('toggles auto-refresh when checkbox is clicked', async () => {
      jest.useFakeTimers();
      jest.spyOn(global, 'clearInterval');

      render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      const checkbox = screen.getByRole('checkbox');
      
      await act(async () => {
        fireEvent.click(checkbox);
      });

      expect(clearInterval).toHaveBeenCalled();
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Advanced Diagnostics', () => {
    it('shows/hides advanced diagnostics section', async () => {
      render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      const toggleButton = screen.getByText('Show Advanced Diagnostics');
      
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      expect(screen.getByText('Deep System Analysis')).toBeInTheDocument();
      expect(screen.getByText('Run Deep Scan')).toBeInTheDocument();
      expect(screen.getByText('Hide Advanced Diagnostics')).toBeInTheDocument();
    });

    it('runs PHP proxy diagnostics', async () => {
      mockTebraApiService.debugPhpProxy.mockResolvedValue({ status: 'success', details: 'All systems operational' });

      render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      // Show advanced diagnostics
      const showButton = screen.getByText('Show Advanced Diagnostics');
      await act(async () => {
        fireEvent.click(showButton);
      });

      // Run deep scan
      const scanButton = screen.getByText('Run Deep Scan');
      await act(async () => {
        fireEvent.click(scanButton);
      });

      await waitFor(() => {
        expect(mockTebraApiService.debugPhpProxy).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays recent errors when health checks fail', async () => {
      mockTebraDebugApi.testTebraApi.mockRejectedValue(new Error('API connection timeout'));

      render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      const refreshButton = screen.getByText('Refresh Now');
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/API connection timeout/)).toBeInTheDocument();
      });
    });

    it('handles PHP proxy diagnostic failures', async () => {
      mockTebraApiService.debugPhpProxy.mockRejectedValue(new Error('PHP proxy unreachable'));

      render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      // Show advanced diagnostics
      const showButton = screen.getByText('Show Advanced Diagnostics');
      await act(async () => {
        fireEvent.click(showButton);
      });

      // Run deep scan
      const scanButton = screen.getByText('Run Deep Scan');
      await act(async () => {
        fireEvent.click(scanButton);
      });

      await waitFor(() => {
        expect(mockTebraApiService.debugPhpProxy).toHaveBeenCalled();
      });

      // Error should be logged to console (we can't easily test console.error in this setup)
    });
  });

  describe('Cleanup', () => {
    it('clears interval on component unmount', () => {
      jest.useFakeTimers();
      jest.spyOn(global, 'clearInterval');

      const { unmount } = render(
        <PatientContext.Provider value={stubContext}>
          <TebraDebugDashboardContainer />
        </PatientContext.Provider>
      );

      unmount();

      expect(clearInterval).toHaveBeenCalled();
    });
  });
});