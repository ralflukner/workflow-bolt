const { tebraProxyClient } = require('../tebra-proxy-client');

// Mock dependencies
jest.mock('node-fetch');
jest.mock('google-auth-library');
jest.mock('firebase-functions');

const mockFetch = require('node-fetch');
const { GoogleAuth } = require('google-auth-library');

describe('TebraProxyClient', () => {
  let mockAuth, mockClient;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock Google Auth
    mockClient = {
      request: jest.fn(),
      getRequestHeaders: jest.fn()
    };
    
    mockAuth = {
      getIdTokenClient: jest.fn().mockResolvedValue(mockClient)
    };
    
    GoogleAuth.mockImplementation(() => mockAuth);
    
    // Reset client state
    tebraProxyClient.initialized = false;
    
    // Set up environment
    process.env.TEBRA_CLOUD_RUN_URL = 'https://test-service.run.app';
    process.env.TEBRA_INTERNAL_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.TEBRA_CLOUD_RUN_URL;
    delete process.env.TEBRA_INTERNAL_API_KEY;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid HTTPS URL', async () => {
      await tebraProxyClient.initialize();
      
      expect(tebraProxyClient.initialized).toBe(true);
      expect(GoogleAuth).toHaveBeenCalledWith({
        keyFilename: undefined
      });
    });

    it('should throw error for non-HTTPS URL', async () => {
      process.env.TEBRA_CLOUD_RUN_URL = 'http://insecure-service.run.app';
      tebraProxyClient.initialized = false;
      
      await expect(tebraProxyClient.initialize()).rejects.toThrow(
        'Tebra Cloud Run URL must use HTTPS'
      );
    });

    it('should handle absolute path for service account key', async () => {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/absolute/path/to/key.json';
      
      await tebraProxyClient.initialize();
      
      expect(GoogleAuth).toHaveBeenCalledWith({
        keyFilename: '/absolute/path/to/key.json'
      });
    });

    it('should handle relative path for service account key', async () => {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = 'relative/path/to/key.json';
      
      await tebraProxyClient.initialize();
      
      expect(GoogleAuth).toHaveBeenCalledWith({
        keyFilename: expect.stringMatching(/.*relative\/path\/to\/key\.json$/)
      });
    });

    it('should only initialize once', async () => {
      await tebraProxyClient.initialize();
      await tebraProxyClient.initialize();
      
      expect(GoogleAuth).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authentication', () => {
    beforeEach(async () => {
      await tebraProxyClient.initialize();
    });

    it('should generate ID token successfully', async () => {
      const mockToken = 'eyJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJodHRwczovL3Rlc3Qtc2VydmljZS5ydW4uYXBwIiwiaXNzIjoidGVzdCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature';
      
      mockClient.getRequestHeaders.mockResolvedValue({
        Authorization: `Bearer ${mockToken}`
      });

      const token = await tebraProxyClient.getIdentityToken();

      expect(token).toBe(mockToken);
      expect(mockAuth.getIdTokenClient).toHaveBeenCalledWith(
        'https://test-service.run.app'
      );
    });

    it('should handle token generation failure', async () => {
      mockAuth.getIdTokenClient.mockRejectedValue(new Error('Auth failed'));

      await expect(tebraProxyClient.getIdentityToken()).rejects.toThrow('Auth failed');
    });

    it('should decode token in development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const mockToken = 'header.eyJhdWQiOiJodHRwczovL3Rlc3Qtc2VydmljZS5ydW4uYXBwIiwiaXNzIjoidGVzdCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature';
      
      mockClient.getRequestHeaders.mockResolvedValue({
        Authorization: `Bearer ${mockToken}`
      });

      // Mock console.log to capture debug output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await tebraProxyClient.getIdentityToken();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TebraCloudRun] Token audience:',
        'https://test-service.run.app'
      );
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('API Requests', () => {
    beforeEach(async () => {
      await tebraProxyClient.initialize();
      mockClient.getRequestHeaders.mockResolvedValue({
        Authorization: 'Bearer mock-token'
      });
    });

    it('should make authenticated request successfully', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true }
      };
      
      mockClient.request.mockResolvedValue(mockResponse);

      const response = await tebraProxyClient.makeAuthenticatedRequest(
        'test-endpoint',
        'POST',
        { test: 'data' }
      );

      expect(response).toEqual(mockResponse);
      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'https://test-service.run.app/test-endpoint',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key'
        },
        data: { test: 'data' }
      });
    });

    it('should handle request without API key', async () => {
      delete process.env.TEBRA_INTERNAL_API_KEY;
      tebraProxyClient.initialized = false;
      await tebraProxyClient.initialize();
      
      mockClient.request.mockResolvedValue({ status: 200, data: {} });

      await tebraProxyClient.makeAuthenticatedRequest('test-endpoint');

      expect(mockClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'X-API-Key': expect.anything()
          })
        })
      );
    });

    it('should handle request errors with response details', async () => {
      const mockError = new Error('Request failed');
      mockError.response = {
        status: 500,
        data: { error: 'Internal server error' },
        headers: { 'content-type': 'application/json' }
      };
      
      mockClient.request.mockRejectedValue(mockError);

      await expect(
        tebraProxyClient.makeAuthenticatedRequest('test-endpoint')
      ).rejects.toThrow('Request failed');
    });
  });

  describe('getAppointments', () => {
    beforeEach(async () => {
      await tebraProxyClient.initialize();
      mockClient.getRequestHeaders.mockResolvedValue({
        Authorization: 'Bearer mock-token'
      });
    });

    it('should validate required parameters', async () => {
      await expect(tebraProxyClient.getAppointments()).rejects.toThrow(
        'Both fromDate and toDate are required'
      );
      
      await expect(tebraProxyClient.getAppointments('2024-01-15')).rejects.toThrow(
        'Both fromDate and toDate are required'
      );
    });

    it('should validate date order', async () => {
      await expect(
        tebraProxyClient.getAppointments('2024-01-16', '2024-01-15')
      ).rejects.toThrow('fromDate must be before or equal to toDate');
    });

    it('should parse nested response structure', async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {
            data: {
              Appointments: {
                AppointmentData: [
                  { PatientID: '123', PatientFullName: 'John Doe' }
                ]
              }
            }
          }
        }
      };
      
      mockClient.request.mockResolvedValue(mockResponse);

      const appointments = await tebraProxyClient.getAppointments('2024-01-15', '2024-01-15');

      expect(appointments).toEqual([
        { PatientID: '123', PatientFullName: 'John Doe' }
      ]);
    });

    it('should handle string response data', async () => {
      const mockResponse = {
        status: 200,
        data: JSON.stringify({
          data: {
            Appointments: {
              AppointmentData: [
                { PatientID: '456', PatientFullName: 'Jane Smith' }
              ]
            }
          }
        })
      };
      
      mockClient.request.mockResolvedValue(mockResponse);

      const appointments = await tebraProxyClient.getAppointments('2024-01-15', '2024-01-15');

      expect(appointments).toEqual([
        { PatientID: '456', PatientFullName: 'Jane Smith' }
      ]);
    });

    it('should return empty array for missing appointments', async () => {
      const mockResponse = {
        status: 200,
        data: { data: {} }
      };
      
      mockClient.request.mockResolvedValue(mockResponse);

      const appointments = await tebraProxyClient.getAppointments('2024-01-15', '2024-01-15');

      expect(appointments).toEqual([]);
    });
  });

  describe('getProviders', () => {
    beforeEach(async () => {
      await tebraProxyClient.initialize();
      mockClient.getRequestHeaders.mockResolvedValue({
        Authorization: 'Bearer mock-token'
      });
    });

    it('should parse nested provider response structure', async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {
            data: {
              GetProvidersResult: {
                Providers: {
                  ProviderData: [
                    { ProviderId: 'p1', FirstName: 'John', LastName: 'Smith' }
                  ]
                }
              }
            }
          }
        }
      };
      
      mockClient.request.mockResolvedValue(mockResponse);

      const providers = await tebraProxyClient.getProviders();

      expect(providers).toEqual([
        { ProviderId: 'p1', FirstName: 'John', LastName: 'Smith' }
      ]);
    });

    it('should handle single provider as array', async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {
            Providers: {
              ProviderData: { ProviderId: 'p1', FirstName: 'John', LastName: 'Smith' }
            }
          }
        }
      };
      
      mockClient.request.mockResolvedValue(mockResponse);

      const providers = await tebraProxyClient.getProviders();

      expect(providers).toEqual([
        { ProviderId: 'p1', FirstName: 'John', LastName: 'Smith' }
      ]);
    });
  });

  describe('getPatientById', () => {
    beforeEach(async () => {
      await tebraProxyClient.initialize();
      mockClient.getRequestHeaders.mockResolvedValue({
        Authorization: 'Bearer mock-token'
      });
    });

    it('should validate required patientId', async () => {
      await expect(tebraProxyClient.getPatientById()).rejects.toThrow(
        'patientId is required'
      );
    });

    it('should parse nested patient response structure', async () => {
      const mockResponse = {
        status: 200,
        data: {
          data: {
            data: {
              GetPatientResult: {
                Patient: {
                  PatientId: '123',
                  FirstName: 'John',
                  LastName: 'Doe'
                }
              }
            }
          }
        }
      };
      
      mockClient.request.mockResolvedValue(mockResponse);

      const patient = await tebraProxyClient.getPatientById('123');

      expect(patient).toEqual({
        PatientId: '123',
        FirstName: 'John',
        LastName: 'Doe'
      });
    });
  });

  describe('Connection Testing', () => {
    beforeEach(async () => {
      await tebraProxyClient.initialize();
      mockClient.getRequestHeaders.mockResolvedValue({
        Authorization: 'Bearer mock-token'
      });
    });

    it('should return true for successful connection test', async () => {
      mockClient.request.mockResolvedValue({ status: 200, data: {} });

      const result = await tebraProxyClient.testConnection();

      expect(result).toBe(true);
    });

    it('should return false for failed connection test', async () => {
      mockClient.request.mockRejectedValue(new Error('Connection failed'));

      const result = await tebraProxyClient.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await tebraProxyClient.initialize();
      mockClient.getRequestHeaders.mockResolvedValue({
        Authorization: 'Bearer mock-token'
      });
    });

    it('should handle malformed JSON response', async () => {
      const mockResponse = {
        status: 200,
        data: 'invalid json {'
      };
      
      mockClient.request.mockResolvedValue(mockResponse);

      const appointments = await tebraProxyClient.getAppointments('2024-01-15', '2024-01-15');

      expect(appointments).toEqual([]);
    });
  });
});