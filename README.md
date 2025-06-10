# Tebra EHR Integration

A robust and well-documented integration with the Tebra EHR system using SOAP API.

## Features

- SOAP API integration with Tebra EHR
- Rate limiting to prevent API abuse
- Data transformation between Tebra and internal formats
- Comprehensive error handling
- Type safety with TypeScript
- Extensive test coverage
- Environment variable configuration
- Firebase integration for data persistence

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Firebase project
- Tebra EHR credentials

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/tebra-integration.git
cd tebra-integration
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your credentials:
```env
# Tebra EHR Integration
REACT_APP_TEBRA_WSDL_URL="https://api.tebra.com/wsdl"
REACT_APP_TEBRA_USERNAME="your-username"
REACT_APP_TEBRA_PASSWORD="your-password"

# Firebase Configuration
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

## Usage

### Basic Usage

```typescript
import { TebraApiService } from './src/tebra-soap/tebra-api-service';

// Create API service instance
const apiService = new TebraApiService({
  wsdlUrl: process.env.REACT_APP_TEBRA_WSDL_URL,
  username: process.env.REACT_APP_TEBRA_USERNAME,
  password: process.env.REACT_APP_TEBRA_PASSWORD
});

// Test connection
const isConnected = await apiService.testConnection();

// Get patient data
const patientData = await apiService.getPatientData('patient-id');

// Get appointment data
const appointmentData = await apiService.getAppointmentData('appointment-id');

// Get daily session data
const sessionData = await apiService.getDailySessionData(new Date());
```

### Error Handling

The integration includes comprehensive error handling:

```typescript
try {
  const patientData = await apiService.getPatientData('patient-id');
} catch (error) {
  if (error instanceof TebraApiError) {
    console.error('Tebra API error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Rate Limiting

The integration includes built-in rate limiting to prevent API abuse:

```typescript
// Rate limiting is handled automatically
const patientData = await apiService.getPatientData('patient-id');
```

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Architecture

The integration is built with a modular architecture:

- `TebraSoapClient`: Handles direct SOAP API communication
- `TebraRateLimiter`: Manages API rate limits
- `TebraDataTransformer`: Transforms data between Tebra and internal formats
- `TebraApiService`: High-level service for data synchronization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
