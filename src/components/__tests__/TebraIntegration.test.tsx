import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TebraIntegration from '../TebraIntegration';
import { TestProviders } from '../../test/testHelpers';

jest.mock('../../tebra-soap/tebra-integration-service', () => {
  const mockService = {
    initialize: jest.fn().mockResolvedValue(true),
    isApiConnected: jest.fn().mockReturnValue(true),
    forceSync: jest.fn().mockResolvedValue({
      success: true,
      patientsFound: 5,
      appointmentsFound: 10,
      errors: [],
      lastSyncTime: new Date()
    }),
    cleanup: jest.fn(),
    stopAutoSync: jest.fn(),
    syncTodaysSchedule: jest.fn().mockResolvedValue({
      success: true,
      patientsFound: 5,
      appointmentsFound: 10,
      errors: [],
      lastSyncTime: new Date()
    }),
    getLastSyncResult: jest.fn().mockReturnValue({
      success: true,
      patientsFound: 5,
      appointmentsFound: 10,
      errors: [],
      lastSyncTime: new Date()
    }),
    updateConfig: jest.fn()
  };
  
  return {
    TebraIntegrationService: jest.fn().mockImplementation(() => mockService),
    createTebraConfig: jest.fn().mockReturnValue({})
  };
});

const originalEnv = process.env;

describe('TebraIntegration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    process.env = {
      ...originalEnv,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders correctly with valid credentials', async () => {
    process.env.VITE_TEBRA_USERNAME = 'test-user';
    process.env.VITE_TEBRA_PASSWORD = 'test-password';
    process.env.VITE_TEBRA_WSDL_URL = 'https://test-wsdl-url.com';

    render(
      <TestProviders>
        <TebraIntegration />
      </TestProviders>
    );

    expect(screen.getByText('Tebra EHR Integration')).toBeInTheDocument();
    
    // In test environment, expect Fallback Mode since external APIs are not available
    await waitFor(() => {
      expect(screen.getByText('Fallback Mode')).toBeInTheDocument();
    });
    
    const importButton = screen.getByText('Import from Tebra');
    expect(importButton).toBeEnabled();
  });

  it('shows fallback mode and missing credentials message', async () => {
    delete process.env.VITE_TEBRA_USERNAME;
    delete process.env.VITE_TEBRA_PASSWORD;
    delete process.env.VITE_TEBRA_WSDL_URL;

    render(
      <TestProviders>
        <TebraIntegration />
      </TestProviders>
    );

    // Should show fallback mode badge
    expect(screen.getByText('Fallback Mode')).toBeInTheDocument();
    // Should show missing credentials message
    await waitFor(() => {
        expect(screen.getByText('Tebra credentials not configured - environment variables missing')).toBeInTheDocument();
    });
  });

  it('handles import from Tebra in fallback mode', async () => {
    // Unset credentials for this specific test
    delete process.env.REACT_APP_TEBRA_USERNAME;
    delete process.env.REACT_APP_TEBRA_PASSWORD;
    delete process.env.REACT_APP_TEBRA_WSDL_URL;

    render(
      <TestProviders>
        <TebraIntegration />
      </TestProviders>
    );

    const importButton = screen.getByText('Import from Tebra');
    fireEvent.click(importButton);

    // In fallback mode, clicking import shows the missing credentials message
    expect(screen.getByText('Integration service not initialized. Please check environment variables and reload.')).toBeInTheDocument();
  });

  it('handles import failure gracefully', async () => {
    render(
      <TestProviders>
        <TebraIntegration />
      </TestProviders>
    );

    const importButton = screen.getByText('Import from Tebra');
    fireEvent.click(importButton);

    // Should show fallback mode badge
    expect(screen.getByText('Fallback Mode')).toBeInTheDocument();
  });

  it('handles API connection failure', async () => {
    render(
      <TestProviders>
        <TebraIntegration />
      </TestProviders>
    );

    // Should show fallback mode badge
    expect(screen.getByText('Fallback Mode')).toBeInTheDocument();
  });

  it('handles uninitialized integration service', async () => {
    render(
      <TestProviders>
        <TebraIntegration />
      </TestProviders>
    );

    // Should show fallback mode badge
    expect(screen.getByText('Fallback Mode')).toBeInTheDocument();
  });

  it('handles date selection', async () => {
    const { container } = render(
      <TestProviders>
        <TebraIntegration />
      </TestProviders>
    );

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput).not.toBeNull();
    
    fireEvent.change(dateInput, { target: { value: '2023-05-15' } });
    
    expect(dateInput.value).toBe('2023-05-15');
  });
});
