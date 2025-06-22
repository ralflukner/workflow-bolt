# Firebase CLI Authentication Guide

This guide provides instructions for authenticating with the Firebase CLI, which is required for deploying Firebase Functions, Hosting, and other Firebase services.

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- A Firebase account
- A Firebase project

## Authentication Script

We've provided a script to simplify the Firebase CLI authentication process. The script:

1. Checks if Firebase CLI is installed, and installs it if not
2. Authenticates with Firebase CLI
3. Sets up the Firebase project

### Using the Authentication Script

```bash
# Make the script executable (if not already)
chmod +x scripts/firebase-auth.sh

# Run the script
./scripts/firebase-auth.sh
```

The script will:
- Check if Firebase CLI is installed
- Install Firebase CLI if needed
- Check if you're already logged in
- Prompt you to log in if needed
- Set up your Firebase project

## Manual Authentication Steps

If you prefer to authenticate manually, follow these steps:

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Log in to Firebase

```bash
firebase login
```

This will open a browser window for authentication. If you're in an environment without a browser, use:

```bash
firebase login --no-localhost
```

### 3. Set up your Firebase project

```bash
# List available projects
firebase projects:list

# Set the active project
firebase use --add YOUR_PROJECT_ID
```

## Verifying Authentication

To verify that you're properly authenticated:

```bash
# List Firebase projects
firebase projects:list

# Check Firebase CLI version
firebase --version
```

## Common Issues

### Authentication Failed

If authentication fails:
1. Check your internet connection
2. Ensure you have the correct Firebase account credentials
3. Try logging in with the `--no-localhost` flag
4. Clear Firebase CLI credentials and try again:
   ```bash
   firebase logout
   firebase login
   ```

### Permission Denied

If you encounter permission issues:
1. Ensure you have the necessary permissions in the Firebase project
2. Verify that you're using the correct Google account
3. Ask a project administrator to grant you the required permissions

## Next Steps

After authenticating with Firebase CLI, you can:

1. Deploy Firebase Functions:
   ```bash
   firebase deploy --only functions
   ```

2. Deploy Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```

3. Open the Firebase Console:
   ```bash
   firebase open
   ```

4. View Firebase logs:
   ```bash
   firebase functions:log
   ```

## Additional Resources

- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)