const soap = require('soap');

class TebraRateLimiter {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.lastRequestTime = 0;
    this.minDelayMs = 100; // Minimum delay between requests
  }

  async waitForSlot(endpoint) {
    return new Promise((resolve) => {
      this.queue.push({ endpoint, resolve });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delay = Math.max(0, this.minDelayMs - timeSinceLastRequest);
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    const { resolve } = this.queue.shift();
    this.lastRequestTime = Date.now();
    resolve();
    
    this.processing = false;
    
    if (this.queue.length > 0) {
      setImmediate(() => this.processQueue());
    }
  }
}

class TebraSoapClient {
  constructor() {
    this.client = null;
    this.rateLimiter = new TebraRateLimiter();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Use environment variables for Firebase Functions v2
    const proxyUrl = process.env.TEBRA_PROXY_URL;
    const customerKey = process.env.TEBRA_CUSTOMERKEY;
    const username = process.env.TEBRA_USERNAME;
    const password = process.env.TEBRA_PASSWORD;
    const proxyApiKey = process.env.TEBRA_PROXY_API_KEY;

    if (!proxyUrl || !customerKey || !username || !password) {
      throw new Error('Missing Tebra API credentials in environment variables');
    }

    // Construct the WSDL URL using the proxy
    const wsdlUrl = `${proxyUrl}/GetSchedulerService2013_05Endpoint?wsdl`;

    try {
      console.log('Initializing Tebra SOAP client via proxy...');
      this.client = await soap.createClientAsync(wsdlUrl, {
        wsdl_headers: {
          'X-API-Key': proxyApiKey
        }
      });
      
      // Add customer key header and basic auth
      this.client.addHttpHeader('CustomerKey', customerKey);
      this.client.setSecurity(new soap.BasicAuthSecurity(username, password));
      
      this.initialized = true;
      console.log('Tebra SOAP client initialized successfully via proxy');
    } catch (error) {
      console.error('Failed to initialize Tebra SOAP client:', error);
      throw new Error('Failed to initialize Tebra SOAP client');
    }
  }

  async getAppointments(fromDate, toDate) {
    await this.initialize();
    await this.rateLimiter.waitForSlot('getAppointments');

    try {
      const result = await this.client.GetAppointmentsAsync({
        fromDate,
        toDate
      });
      return result[0]?.GetAppointmentsResult || [];
    } catch (error) {
      console.error('Failed to get appointments:', error);
      throw error;
    }
  }

  async getPatientById(patientId) {
    await this.initialize();
    await this.rateLimiter.waitForSlot('getPatient');

    try {
      const result = await this.client.GetPatientAsync({ patientId });
      return result[0];
    } catch (error) {
      console.error('Failed to get patient:', error);
      throw error;
    }
  }

  async searchPatients(lastName) {
    await this.initialize();
    await this.rateLimiter.waitForSlot('searchPatients');

    try {
      const result = await this.client.SearchPatientsAsync({ lastName });
      return result[0]?.patients || result[0] || [];
    } catch (error) {
      console.error('Failed to search patients:', error);
      throw error;
    }
  }

  async getProviders() {
    await this.initialize();
    await this.rateLimiter.waitForSlot('getProviders');

    try {
      const result = await this.client.GetProvidersAsync({});
      return result[0]?.GetProvidersResult || [];
    } catch (error) {
      console.error('Failed to get providers:', error);
      throw error;
    }
  }

  async testConnection() {
    await this.initialize();
    
    try {
      await this.client.TestConnectionAsync();
      return true;
    } catch (error) {
      console.error('Failed to test connection:', error);
      return false;
    }
  }

  async createAppointment(appointmentData) {
    await this.initialize();
    await this.rateLimiter.waitForSlot('createAppointment');

    try {
      const result = await this.client.CreateAppointmentAsync({
        appointment: appointmentData
      });
      return result[0]?.CreateAppointmentResult;
    } catch (error) {
      console.error('Failed to create appointment:', error);
      throw error;
    }
  }

  async updateAppointment(appointmentData) {
    await this.initialize();
    await this.rateLimiter.waitForSlot('updateAppointment');

    try {
      const result = await this.client.UpdateAppointmentAsync({
        appointment: appointmentData
      });
      return result[0]?.UpdateAppointmentResult;
    } catch (error) {
      console.error('Failed to update appointment:', error);
      throw error;
    }
  }
}

// Create singleton instance
const tebraSoapClient = new TebraSoapClient();

module.exports = { tebraSoapClient };