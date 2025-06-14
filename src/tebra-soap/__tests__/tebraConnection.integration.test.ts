import { SecretsService } from '../../services/secretsService';
import { TebraSoapClient } from '../tebraSoapClient';

interface TebraError extends Error {
  response?: {
    data?: any;
  };
}

describe.skip('Tebra API Live Connection (direct SOAP access disabled)', () => {
  it('should connect to the Tebra API and return true', async () => {
    const secretsService = SecretsService.getInstance();
    const username = await secretsService.getSecret('TEBRA_USERNAME');
    const password = await secretsService.getSecret('TEBRA_PASSWORD');
    const customerKey = await secretsService.getSecret('TEBRA_CUSTOMER_KEY');
    const wsdlUrl = `https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl&customerkey=${customerKey}`;

    console.log('Attempting to connect with:', {
      wsdlUrl,
      username,
      customerKey,
      // Don't log the actual password
      passwordLength: password?.length
    });

    const client = new TebraSoapClient({ wsdlUrl, username, password });
    let result = false;
    try {
      result = await client.testConnection();
      console.log('Tebra API connection result:', result);
    } catch (err) {
      const error = err as TebraError;
      console.error('Tebra API connection failed:', {
        message: error.message,
        stack: error.stack,
        details: error.response?.data || error.response || error
      });
      throw error; // Re-throw to fail the test
    }
    expect(result).toBe(true);
  }, 20000); // 20 second timeout
});