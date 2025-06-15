
# Firebase Functions Setup for Tebra EHR Integration

This guide covers setting up Firebase Cloud Functions to handle Tebra SOAP
API calls on the server-side, enabling secure browser-based integration.

## Overview

The Tebra SOAP client has been moved to Firebase Cloud Functions because:

- SOAP libraries require Node.js modules that don't work in browsers

- Server-side execution provides better security for API credentials

- Firebase Functions auto-scale and handle rate limiting efficiently

## Prerequisites

1. **Firebase Project**: Ensure you have a Firebase project set up
2. **Firebase CLI**: Install Firebase CLI globally

   ```bash
   npm install -g firebase-tools
   ```

3. **Tebra API Credentials**: You'll need:
   - SOAP WSDL URL
   - Username
   - Password

## Setup Steps

### 1. Install Function Dependencies

Navigate to the functions directory and install dependencies:

```bash
cd functions
npm install

```

### 2. Configure Environment Variables

Create a `.env` file in the `functions/` directory:

```bash

# functions/.env

TEBRA_SOAP_USERNAME=your_tebra_username
TEBRA_SOAP_PASSWORD=your_tebra_password
TEBRA_SOAP_WSDL=https://your-tebra-instance.com/soap/wsdl

```

**Security Note**: Never commit the `.env` file to version control.

### 3. Firebase Project Configuration

Initialize Firebase in your project (if not already done):

```bash
firebase login
firebase use --add  # Select your Firebase project

```

### 4. Deploy Functions

Deploy the Tebra integration functions:

```bash
firebase deploy --only functions

```

This deploys the following endpoints:

- `tebraTestConnection` - Test API connectivity

- `tebraGetPatient` - Get patient by ID

- `tebraSearchPatients` - Search for patients

- `tebraGetAppointments` - Get appointments by date

- `tebraGetProviders` - Get all providers

- `tebraCreateAppointment` - Create new appointment

- `tebraUpdateAppointment` - Update existing appointment

- `tebraSyncTodaysSchedule` - Sync today's schedule

- `tebraAutoSync` - Scheduled auto-sync (every 15 minutes, business hours)

## Available Functions

### Manual Functions (Callable)

#### `tebraTestConnection()`

Tests connectivity to the Tebra API.

**Parameters**: None
**Returns**: `{ success: boolean, message: string }`

#### `tebraGetPatient({ patientId })`

Retrieves a specific patient by ID.

**Parameters**:

- `patientId: string` - The patient's unique ID

**Returns**: `{ success: boolean, data?: TebraPatient }`

#### `tebraSearchPatients({ searchCriteria })`

Searches for patients matching criteria.

**Parameters**:

- `searchCriteria: SearchCriteria` - Search parameters (firstName, lastName, etc.)

**Returns**: `{ success: boolean, data?: TebraPatient[] }`

#### `tebraGetAppointments({ date })`

Gets appointments for a specific date.

**Parameters**:

- `date: string` - Date in YYYY-MM-DD format

**Returns**: `{ success: boolean, data?: TebraAppointment[] }`

#### `tebraGetProviders()`

Retrieves all available providers.

**Parameters**: None
**Returns**: `{ success: boolean, data?: TebraProvider[] }`

#### `tebraSyncTodaysSchedule()`

Syncs today's schedule and stores in Firebase.

**Parameters**: None
**Returns**: `{ success: boolean, data?: Patient[], message?: string }`

### Scheduled Functions

#### `tebraAutoSync`

Automatically syncs Tebra data every 15 minutes during business hours
(8 AM - 6 PM, Monday-Friday).

## Rate Limiting

The functions implement Tebra API rate limiting:

- `GetPatient`: 250ms between calls

- `SearchPatients`: 500ms between calls

- `GetAppointments`: 1000ms between calls

- `GetProviders`: 500ms between calls

- `CreateAppointment`: 2000ms between calls

- `UpdateAppointment`: 2000ms between calls

## Client-Side Usage

Use the `TebraApiService` to call functions from your React app:

```typescript
import { tebraApiService } from "../services/tebraApiService";

// Test connection
const isConnected = await tebraApiService.testConnection();

// Sync schedule
const result = await tebraApiService.syncTodaysSchedule();

// Search patients
const patients = await tebraApiService.searchPatients({ lastName: "Smith" });

```

## Error Handling

All functions include comprehensive error handling:

- Connection failures return meaningful error messages

- Rate limiting is automatically enforced

- Failed operations are logged for debugging

## Monitoring

Monitor your functions in the Firebase Console:

- **Functions tab**: View function execution logs

- **Usage tab**: Monitor invocation counts and performance

- **Logs tab**: Debug issues and errors

## Security

### Environment Variables

- Never commit sensitive credentials to version control

- Use Firebase environment configuration for production:

  ```bash
  firebase functions:config:set tebra.username="your_username"
  firebase functions:config:set tebra.password="your_password"
  firebase functions:config:set tebra.wsdl="your_wsdl_url"
  ```

### Authentication

Consider adding authentication to sensitive functions:

```javascript
if (!request.auth) {
  throw new HttpsError("unauthenticated", "Authentication required");
}

```

## Troubleshooting

### Common Issues

#### "SOAP client creation failed"

- Verify WSDL URL is accessible

- Check network connectivity from Firebase Functions

- Ensure credentials are correct

#### "Rate limit exceeded"

- Functions automatically handle rate limiting

- Check if you're making too many concurrent calls

#### "Function timeout"

- SOAP calls may take time; consider increasing timeout

- Monitor function execution time in Firebase Console

### Debugging

Enable detailed logging:

```javascript
console.log("Debug info:", {
  wsdlUrl: this.config.wsdlUrl,
  // Don't log credentials!
});

```

View logs:

```bash
firebase functions:log

```

## Cost Optimization

- Functions only run when called (pay-per-use)

- Auto-sync runs only during business hours

- Rate limiting prevents excessive API calls

- Consider caching frequently accessed data

## Next Steps

1. **Deploy functions**: `firebase deploy --only functions`
2. **Test integration**: Use the TebraIntegration component in your app
3. **Monitor usage**: Check Firebase Console for function metrics
4. **Set up alerting**: Configure alerts for function failures

## Support

For issues:

1. Check Firebase Functions logs
2. Verify Tebra API credentials and connectivity
3. Review rate limiting and quota usage
4. Test individual functions via Firebase Console
