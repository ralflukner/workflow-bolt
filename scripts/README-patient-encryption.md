# Patient Encryption Secret Setup

This document describes the updated `create-patient-encryption-secret.sh` script for setting up patient encryption keys in Google Secret Manager (GSM).

## Overview

The script creates or updates a patient encryption key in Google Secret Manager and configures proper access permissions for Firebase Functions. It has been enhanced to be portable across different environments by accepting the project ID as a parameter or environment variable.

## Key Improvements

### ✅ **Portability**

- **Before**: Hardcoded project ID (`luknerlumina-firebase`)
- **After**: Accepts project ID as parameter or environment variable

### ✅ **Validation**

- Validates project ID format (6-30 characters, lowercase, hyphens allowed)
- Checks project accessibility and permissions
- Verifies Secret Manager API is enabled

### ✅ **Enhanced Error Handling**

- Comprehensive error messages with troubleshooting tips
- Graceful handling of missing dependencies
- Clear usage instructions

### ✅ **GSM Integration**

- Automatically enables Secret Manager API if needed
- Proper IAM permissions for Firebase service account
- Secure secret storage with versioning

## Usage

### Method 1: Command Line Parameter

```bash
./create-patient-encryption-secret.sh 'your-256-bit-encryption-key' 'your-project-id'
```

### Method 2: Environment Variable

```bash
PROJECT_ID='your-project-id' ./create-patient-encryption-secret.sh 'your-256-bit-encryption-key'
```

### Method 3: Environment Variable (Permanent)

```bash
export PROJECT_ID='your-project-id'
./create-patient-encryption-secret.sh 'your-256-bit-encryption-key'
```

## Requirements

- **gcloud CLI**: Installed and authenticated
- **Permissions**: Secret Manager Admin or equivalent
- **Project**: Valid Google Cloud Project with billing enabled

## Security Considerations

1. **Key Length**: Minimum 32 characters for adequate security
2. **Access Control**: Only Firebase service account has access
3. **Secret Rotation**: Consider implementing rotation policies
4. **Audit Logging**: All operations are logged in Cloud Audit Logs

## Troubleshooting

### Common Issues

1. **"Cannot access project"**
   - Verify project exists: `gcloud projects list`
   - Check authentication: `gcloud auth login`
   - Ensure proper permissions

2. **"Secret Manager API not enabled"**
   - Script will attempt to enable automatically
   - Manual enable: Google Cloud Console → APIs & Services

3. **"Insufficient permissions"**
   - Requires Secret Manager Admin role
   - Contact project administrator

### Validation Examples

```bash
# Test with invalid project ID
./create-patient-encryption-secret.sh 'test-key-32-chars-long-enough' 'invalid-project'

# Test with missing project ID
./create-patient-encryption-secret.sh 'test-key-32-chars-long-enough'

# Test with short encryption key
./create-patient-encryption-secret.sh 'short' 'valid-project-id'
```

## Integration with Workflow

This script is part of the patient encryption system that:

1. **Creates** encryption keys in GSM
2. **Stores** patient data encrypted in Firebase
3. **Retrieves** keys securely for decryption
4. **Maintains** HIPAA compliance

## Related Files

- `src/services/encryption/patientEncryptionService.ts` - Uses the created secret
- `functions/src/services/firestoreDailySession.ts` - Server-side encryption
- `docs/patient-encryption-repair.md` - Previous repair documentation

## Migration from Hardcoded Version

If you were using the previous hardcoded version:

```bash
# Old way (no longer works)
./create-patient-encryption-secret.sh 'your-key'

# New way
./create-patient-encryption-secret.sh 'your-key' 'your-project-id'
# or
PROJECT_ID='your-project-id' ./create-patient-encryption-secret.sh 'your-key'
```