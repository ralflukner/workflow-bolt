# Tebra EHR Integration

A robust and well-documented integration with the Tebra EHR system using SOAP API.

## ⚠️ IMPORTANT: Tebra API Configuration

**Current Tebra PHP API URL:** `https://tebra-php-api-623450773640.us-central1.run.app`

See [TEBRA_API_URL_CONFIG.md](./TEBRA_API_URL_CONFIG.md) for detailed URL configuration and troubleshooting.

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

- Firebase projec

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

### API Reference

#### TebraApiService

The main service class for interacting with the Tebra EHR system.

##### Methods

- `testConnection()`: Tests the connection to the Tebra API

- `getPatientData(patientId: string)`: Retrieves patient information

- `getAppointmentData(appointmentId: string)`: Retrieves appointment details

- `getDailySessionData(date: Date)`: Gets all appointments for a specific date

- `getAppointments(fromDate: Date, toDate: Date)`: Retrieves appointments within a date range

- `getPatients(patientIds: string[])`: Gets multiple patients by their IDs

- `getProviders()`: Retrieves all providers

- `getAllPatients()`: Gets all patients in the system

- `createAppointment(appointmentData: Partial<TebraAppointment>)`: Creates a new appointment

- `updateAppointment(appointmentData: Partial<TebraAppointment>)`: Updates an existing appointmen

#### Rate Limiting

The integration includes built-in rate limiting to prevent API abuse:

```typescript
// Rate limiting is handled automatically
const patientData = await apiService.getPatientData('patient-id');

// Check rate limiter status
const stats = apiService.getRateLimiterStats();
const canCallNow = apiService.canCallMethodImmediately('getPatientData');
const waitTime = apiService.getRemainingWaitTime('getPatientData');

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

### Data Types

#### TebraPatient

```typescript
interface TebraPatient {
  PatientId: string;
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  Gender: string;
  Email: string;
  Phone: string;
  Address: {
    Street: string;
    City: string;
    State: string;
    ZipCode: string;
    Country: string;
  };
  Insurance: {
    Provider: string;
    PolicyNumber: string;
    GroupNumber: string;
  };
  CreatedAt: string;
  UpdatedAt: string;
}

```

#### TebraAppointmentt

```typescript
interface TebraAppointment {
  AppointmentId: string;
  PatientId: string;
  ProviderId: string;
  StartTime: string;
  EndTime: string;
  Status: string;
  Type: string;
  Notes: string;
  CreatedAt: string;
  UpdatedAt: string;
}

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

### Component Details

#### TebraSoapClient

- Handles SOAP API communication

- Manages authentication

- Implements retry logic

- Handles SOAP envelope creation and parsing

#### TebraRateLimiter

- Implements token bucket algorithm

- Configurable rate limits per method

- Thread-safe implementation

- Provides status monitoring

#### TebraDataTransformer

- Converts between SOAP and internal data formats

- Handles date/time conversions

- Validates data integrity

- Provides default values for missing fields

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify credentials in `.env.local`
   - Check WSDL URL accessibility
   - Ensure proper permissions

2. **Rate Limiting Issues**
   - Monitor rate limiter stats
   - Adjust rate limits if needed
   - Implement caching for frequently accessed data

3. **Data Transformation Errors**
   - Check data format compatibility
   - Verify required fields
   - Review error logs for specific issues

### Debugging

Enable debug logging by setting the environment variable:

```bash
DEBUG=tebra:* npm start

```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support – Firebase Callable Functions & Cloud-Run Proxy

Detailed usage instructions, security notes, and troubleshooting tips for
`getSecret`, `tebraTestConnection`, and the other proxy functions live in
[`docs/tebra-functions-usage.md`](docs/tebra-functions-usage.md).

## Redis Pre-flight and Diagnostics

Before running any script that uses Redis, always:

1. Source the pre-flight script:
   ```bash
   source scripts/redis-preflight.sh
   ```
   This will check connectivity, environment, and write permissions.

2. Use the diagnostics function in Python:
   ```python
   from functions.shared.redis_client import print_connection_status
   print_connection_status()
   ```
   This prints connection status, latency, and helpful error messages.

3. Troubleshooting:
   - If you see "Connection refused", start Redis locally:
     ```bash
     docker run -d -p 6379:6379 redis:7-alpine
     ```
   - If you see timeouts, check REDIS_HOST and VPC connector.
   - If you see auth errors, set REDIS_PASSWORD or check Secret Manager.

All Redis-dependent scripts must pass the pre-flight check before use. See `functions/shared/redis_client.py` and `scripts/redis-preflight.sh` for details.
