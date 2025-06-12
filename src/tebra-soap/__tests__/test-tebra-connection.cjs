require('ts-node/register');          // enable on‑the‑fly TS transpile
const { SecretsService } = require('../../services/secretsService.ts');
const { TebraSoapClient } = require('../tebraSoapClient');

(async () => {
  const secretsService = SecretsService.getInstance();
  const username = await secretsService.getSecret('TEBRA_USERNAME');
  const password = await secretsService.getSecret('TEBRA_PASSWORD');
  const customerKey = await secretsService.getSecret('TEBRA_CUSTOMER_KEY');
  const wsdlUrl = `https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl&customerkey=${customerKey}`;

  const client = new TebraSoapClient({ wsdlUrl, username, password });
  try {
    const result = await client.testConnection();
    console.log('Tebra API connection result:', result);
  } catch (err) {
    console.error('Tebra API connection failed:', err);
  }
})();