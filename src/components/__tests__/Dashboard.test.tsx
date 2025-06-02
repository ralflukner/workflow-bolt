// Dashboard tests temporarily skipped due to hanging issues
// TODO: Investigate and fix hanging React component tests

import '@testing-library/jest-dom';

// Mock EnvDebugger BEFORE importing Dashboard to avoid import.meta parsing issues
jest.mock('../EnvDebugger', () => {
  return {
    EnvDebugger: () => null,
  };
});

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { TestProviders } from '../../test/testHelpers';
import React from 'react';

const mockAddPatient = jest.fn();
const mockExportPatientsToJSON = jest.fn();
const mockImportPatientsFromJSON = jest.fn();
const mockClearPatients = jest.fn();

jest.mock('../../hooks/usePatientContext', () => ({
  usePatientContext: () => ({
    patients: [],
    addPatient: mockAddPatient,
    updatePatientStatus: jest.fn(),
    assignRoom: jest.fn(),
    updateCheckInTime: jest.fn(),
    getPatientsByStatus: (status: string) => {
      if (status === 'scheduled') return [{ id: '1', name: 'Test Patient', status: 'scheduled' }];
      return [];
    },
    getMetrics: () => ({ totalAppointments: 5, waitingCount: 2, averageWaitTime: 15, maxWaitTime: 30 }),
    getWaitTime: () => 0,
    clearPatients: mockClearPatients,
    exportPatientsToJSON: mockExportPatientsToJSON,
    importPatientsFromJSON: mockImportPatientsFromJSON,
    tickCounter: 0,
    isLoading: false,
    persistenceEnabled: false,
    saveCurrentSession: jest.fn().mockResolvedValue(true),
    togglePersistence: jest.fn()
  })
}));

jest.mock('../../hooks/useTimeContext', () => ({
  useTimeContext: () => ({
    getCurrentTime: () => new Date('2023-01-01T10:00:00.000Z'),
    formatDateTime: (date: Date | string) => typeof date === 'string' ? new Date(date).toLocaleString() : date.toLocaleString(),
    timeMode: { simulated: false, currentTime: new Date().toISOString() },
    toggleSimulation: jest.fn(),
    adjustTime: jest.fn(),
    formatTime: (date: Date | string) => typeof date === 'string' ? new Date(date).toLocaleTimeString() : date.toLocaleTimeString()
  })
}));

jest.mock('../../utils/formatters', () => ({
  formatTime: (date: string | Date) => {
    if (typeof date === 'string') {
      const d = new Date(date);
      return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
    }
    return '10:00 AM';
  },
  formatDate: (date: string | Date) => {
    if (typeof date === 'string') {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    }
    return '1/1/2023';
  },
  formatDOB: (dob: string) => {
    if (typeof dob === 'string') {
      const parts = dob.split('-');
      if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}/${parts[0]}`;
      }
    }
    return dob;
  }
}));

// Mock Firebase and localStorage services
jest.mock('../../services/firebase/dailySessionService', () => ({
  dailySessionService: {
    loadTodaysSession: jest.fn(() => Promise.resolve([])),
    saveTodaysSession: jest.fn(() => Promise.resolve()),
  }
}));

jest.mock('../../services/localStorage/localSessionService', () => ({
  localSessionService: {
    loadTodaysSession: jest.fn(() => Promise.resolve([])),
    saveTodaysSession: jest.fn(() => Promise.resolve()),
  }
}));

// Mock child components to avoid complex rendering issues
jest.mock('../MetricsPanel', () => {
  return function MockMetricsPanel() {
    return <div data-testid="metrics-panel">Metrics Panel</div>;
  };
});

jest.mock('../TimeControl', () => {
  return function MockTimeControl() {
    return <div data-testid="time-control">Time Control</div>;
  };
});

jest.mock('../PatientList', () => {
  return function MockPatientList({ status, title }: { status: string; title: string }) {
    return <div data-testid={`patient-list-${status}`}>{title}</div>;
  };
});

jest.mock('../NewPatientForm', () => {
  return function MockNewPatientForm({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="new-patient-form">
        <button onClick={onClose} data-testid="close-new-patient-form">Close</button>
      </div>
    );
  };
});

jest.mock('../ImportSchedule', () => {
  return function MockImportSchedule({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="import-schedule">
        <button onClick={onClose} data-testid="close-import-schedule">Close</button>
      </div>
    );
  };
});

jest.mock('../ImportJSON', () => {
  return function MockImportJSON({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="import-json">
        <button onClick={onClose} data-testid="close-import-json">Close</button>
      </div>
    );
  };
});

jest.mock('../TebraIntegration', () => {
  return function MockTebraIntegration() {
    return <div data-testid="tebra-integration">Tebra Integration</div>;
  };
});

jest.mock('../TebraIntegrationNew', () => {
  return function MockTebraIntegrationNew() {
    return <div data-testid="tebra-integration-new">Tebra Integration</div>;
  };
});

jest.mock('../AuthNav', () => {
  return function MockAuthNav() {
    return <div data-testid="auth-nav">Auth Nav</div>;
  };
});

// Mock URL.createObjectURL and related functions
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock window.open for report functionality
const mockWindow = {
  document: {
    write: jest.fn(),
    close: jest.fn(),
  },
  focus: jest.fn(),
  print: jest.fn(),
  close: jest.fn(),
  onafterprint: null as ((this: Window, ev: Event) => void) | null,
};
global.window.open = jest.fn(() => mockWindow as unknown as Window);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TestProviders>
    {children}
  </TestProviders>
);

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
  });
  
  it('renders dashboard with metrics panel', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('metrics-panel')).toBeInTheDocument();
    });
  });

  it('renders dashboard with all main components', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for initial render and context setup
    await waitFor(() => {
      expect(screen.getByTestId('metrics-panel')).toBeInTheDocument();
      expect(screen.getByTestId('time-control')).toBeInTheDocument();
      expect(screen.getByTestId('tebra-integration-new')).toBeInTheDocument();
      expect(screen.getByTestId('auth-nav')).toBeInTheDocument();
    });
  });

  it('renders all patient list sections', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('patient-list-scheduled')).toBeInTheDocument();
      expect(screen.getByTestId('patient-list-Confirmed')).toBeInTheDocument();
      expect(screen.getByTestId('patient-list-arrived')).toBeInTheDocument();
      expect(screen.getByTestId('patient-list-appt-prep')).toBeInTheDocument();
      expect(screen.getByTestId('patient-list-ready-for-md')).toBeInTheDocument();
      expect(screen.getByTestId('patient-list-With Doctor')).toBeInTheDocument();
      expect(screen.getByTestId('patient-list-seen-by-md')).toBeInTheDocument();
      expect(screen.getByTestId('patient-list-completed')).toBeInTheDocument();
      expect(screen.getByTestId('patient-list-Rescheduled')).toBeInTheDocument();
      expect(screen.getByTestId('patient-list-Cancelled')).toBeInTheDocument();
      expect(screen.getByTestId('patient-list-No Show')).toBeInTheDocument();
    });
  });

  it('opens and closes new patient form', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('New Patient')).toBeInTheDocument();
    });

    // Click new patient button
    fireEvent.click(screen.getByText('New Patient'));

    await waitFor(() => {
      expect(screen.getByTestId('new-patient-form')).toBeInTheDocument();
    });

    // Close the form
    fireEvent.click(screen.getByTestId('close-new-patient-form'));

    await waitFor(() => {
      expect(screen.queryByTestId('new-patient-form')).not.toBeInTheDocument();
    });
  });

  it('opens and closes import schedule modal', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Import Schedule')).toBeInTheDocument();
    });

    // Click import schedule button
    fireEvent.click(screen.getByText('Import Schedule'));

    await waitFor(() => {
      expect(screen.getByTestId('import-schedule')).toBeInTheDocument();
    });

    // Close the modal
    fireEvent.click(screen.getByTestId('close-import-schedule'));

    await waitFor(() => {
      expect(screen.queryByTestId('import-schedule')).not.toBeInTheDocument();
    });
  });

  it('opens and closes import JSON modal', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Import JSON')).toBeInTheDocument();
    });

    // Click import JSON button
    fireEvent.click(screen.getByText('Import JSON'));

    await waitFor(() => {
      expect(screen.getByTestId('import-json')).toBeInTheDocument();
    });

    // Close the modal
    fireEvent.click(screen.getByTestId('close-import-json'));

    await waitFor(() => {
      expect(screen.queryByTestId('import-json')).not.toBeInTheDocument();
    });
  });

  it('handles export JSON functionality', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    });

    // Click export JSON button
    fireEvent.click(screen.getByText('Export JSON'));

    // The export functionality should work without errors
    // (The actual export is handled by the PatientContext)
    expect(() => fireEvent.click(screen.getByText('Export JSON'))).not.toThrow();
  });

  it('handles export schedule functionality and opens report modal', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Export Schedule')).toBeInTheDocument();
    });

    // Click export schedule button
    fireEvent.click(screen.getByText('Export Schedule'));

    // Should open the report modal
    await waitFor(() => {
      expect(screen.getByText('Patient Flow Report')).toBeInTheDocument();
    });
  });

  it('handles report modal download functionality', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Open the report modal first
    fireEvent.click(screen.getByText('Export Schedule'));

    await waitFor(() => {
      expect(screen.getByText('Download')).toBeInTheDocument();
    });

    // Mock document.createElement and related DOM operations
    const mockElement = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn(() => mockElement as unknown as HTMLAnchorElement);
    const originalAppendChild = document.body.appendChild;
    document.body.appendChild = jest.fn();
    const originalRemoveChild = document.body.removeChild;
    document.body.removeChild = jest.fn();

    // Click download button
    fireEvent.click(screen.getByText('Download'));

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(mockElement.click).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();

    // Restore original functions
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
  });

  it('handles report modal print functionality', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Open the report modal first
    fireEvent.click(screen.getByText('Export Schedule'));

    await waitFor(() => {
      expect(screen.getByText('Print')).toBeInTheDocument();
    });

    // Click print button
    fireEvent.click(screen.getByText('Print'));

    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(mockWindow.document.write).toHaveBeenCalled();
    expect(mockWindow.document.close).toHaveBeenCalled();
    expect(mockWindow.focus).toHaveBeenCalled();
    expect(mockWindow.print).toHaveBeenCalled();
  });

  it('closes report modal', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Open the report modal first
    fireEvent.click(screen.getByText('Export Schedule'));

    await waitFor(() => {
      expect(screen.getByText('Patient Flow Report')).toBeInTheDocument();
    });

    // Close the modal using the close button
    const closeButtons = screen.getAllByText('Close');
    fireEvent.click(closeButtons[0]); // First close button (there might be multiple)

    await waitFor(() => {
      expect(screen.queryByText('Patient Flow Report')).not.toBeInTheDocument();
    });
  });

  it('handles responsive mobile toggles', async () => {
    // Mock window.innerWidth to simulate mobile view
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500, // Mobile width
    });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // In mobile view, sections should have toggle buttons
      const scheduledElements = screen.getAllByText('Scheduled Patients');
      expect(scheduledElements.length).toBeGreaterThan(0);
    });

    // The component should render without errors in mobile view
    expect(screen.getByTestId('patient-list-scheduled')).toBeInTheDocument();
  });
});
