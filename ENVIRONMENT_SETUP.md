# Environment Setup Guide

This guide provides detailed instructions for setting up the development environment for the Tebra EHR Integration.

## Prerequisites

### Required Software

- Node.js 18.x or higher
- npm 9.x or higher
- Git
- VS Code (recommended) or your preferred IDE
- Firebase CLI
- Postman (for API testing)

### Required Accounts

- GitHub account
- Firebase account
- Tebra EHR account
- Auth0 account (for authentication)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/tebra-integration.git
cd tebra-integration
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

1. Copy the environment template:

```bash
cp .env-example .env.local
```

2. Configure the following environment variables:

```env
# Tebra EHR Integration
VITE_TEBRA_WSDL_URL="https://api.tebra.com/wsdl"
VITE_TEBRA_USERNAME="your-username"
VITE_TEBRA_PASSWORD="your-password"

# Firebase Configuration
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

# Auth0 Configuration
VITE_AUTH0_DOMAIN="your-auth0-domain"
VITE_AUTH0_CLIENT_ID="your-auth0-client-id"
VITE_AUTH0_AUDIENCE="your-auth0-audience"
```

### 4. Firebase Setup

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Login to Firebase:

```bash
firebase login
```

3. Initialize Firebase:

```bash
firebase init
```

4. Select the following features:

- Firestore
- Functions
- Hosting
- Emulators

### 5. Development Tools Setup

#### VS Code Extensions

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Firebase Explorer
- GitLens

#### Postman Collection

1. Import the `postman_collection.json` file
2. Configure environment variables in Postman
3. Test the API endpoints

## Development Workflow

### Starting the Development Server

```bash
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Troubleshooting

### Common Issues

1. **Node Version Mismatch**

```bash
# Check Node version
node --version

# Install correct version using nvm
nvm install 18
nvm use 18
```

2. **Firebase Authentication Issues**

- Verify Firebase project settings
- Check environment variables
- Ensure Firebase CLI is logged in

3. **Tebra API Connection Issues**

- Verify WSDL URL accessibility
- Check credentials
- Test connection using Postman

4. **Build Failures**

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules

# Reinstall dependencies
npm install
```

### Debugging

1. **Enable Debug Logging**

```bash
DEBUG=tebra:* npm start
```

2. **Check Logs**

- Application logs: `npm run logs`
- Firebase logs: `firebase functions:log`
- Test logs: `npm run test:debug`

## Best Practices

### Code Organization

- Follow the established project structure
- Use TypeScript for type safety
- Follow the component design guidelines
- Maintain test coverage

### Git Workflow

1. Create feature branches
2. Write meaningful commit messages
3. Create pull requests for review
4. Keep branches up to date

### Security

- Never commit sensitive data
- Use environment variables
- Follow security guidelines
- Regular dependency updates

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tebra API Documentation](https://api.tebra.com/docs)
- [Auth0 Documentation](https://auth0.com/docs)

## Support

For additional help:

1. Check the [documentation](docs/overview.md)
2. Review [recent changes](CHANGES_SUMMARY.md)
3. Open a GitHub issue
4. Contact the development team
