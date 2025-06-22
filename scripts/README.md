# Scripts Directory

This directory contains utility scripts for the Workflow Bolt application.

## Available Scripts

### Firebase Authentication

- **firebase-auth.sh**: Helps authenticate with Firebase CLI
  - Checks if Firebase CLI is installed, and installs it if not
  - Authenticates with Firebase CLI
  - Sets up the Firebase project
  - Usage: `./firebase-auth.sh`
  - Documentation: [Firebase CLI Authentication Guide](../docs/FIREBASE_CLI_AUTH.md)

### Secrets Management

- **generate-firebase-config.sh**: Generates a JSON string for FIREBASE_CONFIG from individual environment variables
  - Creates a properly formatted JSON string for use with Google Secret Manager
  - Usage: `./generate-firebase-config.sh`
  - Documentation: [Secrets Management Guide](../docs/secrets-management.md)

- **setup-required-secrets.sh**: Sets up all required secrets in Google Secret Manager
  - Creates secrets in GSM if they don't exist
  - Adds new versions to existing secrets
  - Sets up IAM permissions for service accounts
  - Usage: `./setup-required-secrets.sh`
  - Documentation: [Secrets Management Guide](../docs/secrets-management.md)

- **setup-firebase-secrets.sh**: Sets up Firebase configuration in Google Secret Manager
  - Creates the firebase-config secret in GSM if it doesn't exist
  - Adds a new version to the secret
  - Sets up IAM permissions for Firebase service account
  - Usage: `./setup-firebase-secrets.sh`
  - Documentation: [Secrets Management Guide](../docs/secrets-management.md)

## Usage

To use these scripts:

1. Make them executable:
   ```bash
   chmod +x scripts/script-name.sh
   ```

2. Run them from the project root:
   ```bash
   ./scripts/script-name.sh
   ```

## Adding New Scripts

When adding new scripts to this directory:

1. Make sure they have a clear purpose and are well-documented
2. Add a shebang line at the top: `#!/bin/bash`
3. Make them executable: `chmod +x scripts/script-name.sh`
4. Add them to this README.md file
5. Create or update documentation as needed
