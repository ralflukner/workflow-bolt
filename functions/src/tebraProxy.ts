import * as functions from 'firebase-functions';
import axios from 'axios';

const TEBRA_PHP_URL = 'https://tebra-php-api-xxxxx-uc.a.run.app'; // PHP service!

export const tebraProxy = functions.https.onRequest(async (req, res) => {
  try {
    const { action, params } = req.body;
    const response = await axios.post(
      TEBRA_PHP_URL,
      { action, params },
      {
        headers: {
          'X-API-Key': process.env.INTERNAL_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    res.status(response.status).json(response.data);
  } catch (error: unknown) {
    let status = 500;
    let message = 'Unknown error';
    if (axios.isAxiosError(error)) {
      status = error.response?.status || 500;
      message = error.response?.data || error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }
    console.error('Error calling Tebra PHP API:', message);
    res.status(status).json({ error: message });
  }
}); 