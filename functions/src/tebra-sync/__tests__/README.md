# Tebra Sync Integration Tests

This directory contains integration tests for the "Sync Today" functionality that syncs appointment data from Tebra to your dashboard.

## Test Files

### 1. `syncSchedule.integration.test.ts`

Comprehensive unit tests covering:

- ✅ Successful sync scenarios
- ✅ Error handling and edge cases
- ✅ Data transformation and validation
- ✅ Status mapping (Confirmed → scheduled, CheckedIn → arrived, etc.)

### 2. `testSyncLocal.ts`

Local test script to simulate the sync process with mock data.

## Running Tests

### Run all integration tests

```bash
cd functions
npm run test:sync
```

### Run tests with coverage

```bash
cd functions
npx jest src/tebra-sync/__tests__/syncSchedule.integration.test.ts --coverage
```

### Run local simulation

```bash
cd functions
npx ts-node src/tebra-sync/__tests__/testSyncLocal.ts
# Or with a specific date:
npx ts-node src/tebra-sync/__tests__/testSyncLocal.ts 2025-06-15
```

## Test Coverage

The tests cover:

1. **Happy Path**: Syncing multiple appointments with complete patient data
2. **Missing Data**: Handling appointments without provider info
3. **API Failures**: Graceful handling when Tebra API fails
4. **Data Validation**: Trimming whitespace, handling various date formats
5. **Status Mapping**: All Tebra statuses correctly map to internal statuses

## Key Test Scenarios

### Status Mapping

- `Confirmed` → `scheduled`
- `CheckedIn` → `arrived`
- `InRoom` → `appt-prep`
- `CheckedOut` → `completed`
- `Cancelled` → `cancelled`
- `NoShow` → `no-show`
- Unknown statuses → `scheduled` (default)

### Error Handling

- Continues processing if one patient fails
- Returns 0 when no appointments found
- Handles missing patient IDs gracefully
- Propagates Tebra API errors

## Mock Data Structure

Tests use realistic mock data matching Tebra's API responses:

- Appointments with various statuses
- Patient data with contact information
- Provider data with titles and degrees

## Next Steps

To test with real Tebra data:

1. Deploy the updated Firebase functions
2. Use the "Sync Today" button in your dashboard
3. Monitor Firebase logs for any issues
