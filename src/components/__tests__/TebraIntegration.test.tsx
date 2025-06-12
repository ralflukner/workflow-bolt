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
      REACT_APP_TEBRA_USERNAME: 'test-user',
      REACT_APP_TEBRA_PASSWORD: 'test-password',
      REACT_APP_TEBRA_WSDL_URL: 'https://test-wsdl-url.com'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders correctly with valid credentials', async () => {
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

  it('shows fallback mode when credentials are missing', async () => {
    process.env.REACT_APP_TEBRA_USERNAME = '';
    process.env.REACT_APP_TEBRA_PASSWORD = '';
    process.env.REACT_APP_TEBRA_WSDL_URL = '';

    render(
      <TestProviders>
        <TebraIntegration />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Fallback Mode')).toBeInTheDocument();
      expect(screen.getByText('Tebra credentials not configured - environment variables missing')).toBeInTheDocument();
    });
    
    expect(screen.getByText('User: Not configured')).toBeInTheDocument();
    expect(screen.getByText('Status: Using Fallback Data')).toBeInTheDocument();
  });

  it('handles import from Tebra in fallback mode', async () => {
    render(
      <TestProviders>
        <TebraIntegration />
      </TestProviders>
    );

    // In test environment, expect Fallback Mode since external APIs are not available
    await waitFor(() => {
      expect(screen.getByText('Fallback Mode')).toBeInTheDocument();
    });
    
    const importButton = screen.getByText('Import from Tebra');
    fireEvent.click(importButton);
    
    // In fallback mode, clicking import shows the service not initialized message
    expect(screen.getByText('Integration service not initialized. Please check environment variables and reload.')).toBeInTheDocument();
  });

  it('handles import failure gracefully', async () => {
    jest.clearAllMocks();
    
    const mockModule = jest.requireMock('../../tebra-soap/tebra-integration-service');
    mockModule.TebraIntegrationService.mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(true),
      isApiConnected: jest.fn().mockReturnValue(true),
      forceSync: jest.fn().mockResolvedValue({
        success: false,
        patientsFound: 0,
        appointmentsFound: 0,
        errors: ['API error', 'Connection timeout'],
        lastSyncTime: new Date()
      }),
      cleanup: jest.fn(),
      stopAutoSync: jest.fn(),
      syncTodaysSchedule: jest.fn(),
      getLastSyncResult: jest.fn().mockReturnValue({
        success: false,
        patientsFound: 0,
        appointmentsFound: 0,
        errors: ['API error', 'Connection timeout'],
        lastSyncTime: new Date()
      }),
      updateConfig: jest.fn()
    }));

    render(
      <TestProviders>
        <TebraIntegration />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
    
    const importButton = screen.getByText('Import from Tebra');
    fireEvent.click(importButton);
    
    expect(screen.getByText('Importing schedule from Tebra EHR...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/Import failed/)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(screen.getByText(/Errors:/)).toBeInTheDocument();
    expect(screen.getByText(/• API error/)).toBeInTheDocument();
    expect(screen.getByText(/• Connection timeout/)).toBeInTheDocument();
  });

  it('handles API connection failure', async () => {
    jest.clearAllMocks();
    
    const mockModule = jest.requireMock('../../tebra-soap/tebra-integration-service');
    mockModule.TebraIntegrationService.mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(false),
      isApiConnected: jest.fn().mockReturnValue(false),
      forceSync: jest.fn().mockResolvedValue({
        success: false,
        patientsFound: 0,
        appointmentsFound: 0,
        errors: ['API connection failed'],
        lastSyncTime: new Date()
      }),
      cleanup: jest.fn(),
      stopAutoSync: jest.fn(),
      syncTodaysSchedule: jest.fn(),
      getLastSyncResult: jest.fn().mockReturnValue(null),
      updateConfig: jest.fn()
    }));

    render(
      <TestProviders>
        <TebraIntegration />
      </TestProviders>
    );

    await waitFor(() => {
      const fallbackElement = screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'span' && 
               content.includes('Fallback Mode');
      });
      expect(fallbackElement).toBeInTheDocument();
    }, { timeout: 3000 });
    
    await waitFor(() => {
      expect(screen.getByText('Connected with fallback mode (API unavailable)')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Status: Using Fallback Data')).toBeInTheDocument();
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

  it('handles uninitialized integration service', async () => {
    const { TebraIntegrationService: MockService } = jest.requireMock('../../tebra-soap/tebra-integration-service');
    
    MockService.mockImplementationOnce(() => {
      throw new Error('Failed to create integration service');
    });
    
    render(
      <TestProviders>
        <TebraIntegration />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Fallback Mode')).toBeInTheDocument();
      expect(screen.getByText('Failed to connect to Tebra EHR')).toBeInTheDocument();
    });
    
    const importButton = screen.getByText('Import from Tebra');
    fireEvent.click(importButton);
    
    expect(screen.getByText('Integration service not initialized. Please check environment variables and reload.')).toBeInTheDocument();
  });
});
