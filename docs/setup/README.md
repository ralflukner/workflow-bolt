# Setup Documentation

This directory contains installation guides, environment setup instructions, and configuration documentation for Workflow Bolt.

## 📁 Contents

### Core Setup Guides

- [Environment Setup](ENVIRONMENT_SETUP.md) - Complete development environment setup
- [Firebase Setup](FIREBASE_SETUP.md) - Firebase project configuration
- [Setup Guide](setup-guide.md) - General setup instructions

### Authentication & Secrets

- [Auth Setup](auth-setup.md) - Authentication system configuration
- [OAuth Secret Guide](oauth-secret-guide.md) - Managing OAuth credentials
- [Firebase CLI Auth](FIREBASE_CLI_AUTH.md) - Firebase CLI authentication

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Cloud SDK (`gcloud`)
- Firebase CLI (`firebase-tools`)
- Git
- VS Code (recommended)

### Initial Setup Steps

1. **Clone Repository**

   ```bash
   git clone https://github.com/your-org/workflow-bolt.git
   cd workflow-bolt
   ```

2. **Install Dependencies**

   ```bash
   npm install
   cd functions && npm install
   cd ../tebra-php-api && composer install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Firebase Setup**

   ```bash
   firebase login
   firebase use --add
   # Select your project
   ```

5. **Start Development**

   ```bash
   npm run dev
   ```

## 🔧 Configuration Files

### Frontend (.env)

```env
# Auth0
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
VITE_AUTH0_AUDIENCE=https://api.patientflow.com

# Firebase
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Backend (functions/.env)

```env
# Google Cloud
GOOGLE_CLOUD_PROJECT=your-project-id
FUNCTIONS_EMULATOR_TIMEOUT_SECONDS=540

# Monitoring (optional)
OTEL_ENABLED=true
OTEL_SERVICE_NAME=workflow-bolt
```

## 🛠️ Development Tools

### Required Tools

- **VS Code Extensions**
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Firebase

- **Chrome Extensions**
  - React Developer Tools
  - Redux DevTools

### Optional Tools

- Postman (API testing)
- TablePlus (database viewer)
- ngrok (local tunneling)

## 🔐 Secret Management

### Google Secret Manager

```bash
# List secrets
gcloud secrets list --project=your-project-id

# Create a secret
echo -n "secret-value" | gcloud secrets create SECRET_NAME --data-file=-

# Access a secret
gcloud secrets versions access latest --secret=SECRET_NAME
```

### Local Development

- Use `.env` files (never commit)
- Copy from `.env.example`
- Store in password manager

## 🏗️ Project Structure

```
workflow-bolt/
├── src/              # React frontend
├── functions/        # Firebase Functions
├── tebra-php-api/   # PHP Cloud Run service
├── docs/            # Documentation
├── scripts/         # Utility scripts
└── tests/           # Test suites
```

## 🔍 Verification Steps

### Check Frontend

```bash
npm run dev
# Visit http://localhost:5173
```

### Check Functions

```bash
firebase emulators:start --only functions
# Test at http://localhost:5001
```

### Check PHP Service

```bash
cd tebra-php-api
php -S localhost:8080 -t public
# Test at http://localhost:8080
```

## 🐛 Common Setup Issues

### Node Version Mismatch

```bash
# Use nvm to switch versions
nvm install 18
nvm use 18
```

### Permission Errors

```bash
# Fix npm permissions
npm cache clean --force
sudo npm install -g firebase-tools
```

### Firebase Auth Issues

```bash
# Re-authenticate
firebase logout
firebase login --reauth
```

### Missing Dependencies

```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

## 🔗 Related Documentation

- [Environment Setup](ENVIRONMENT_SETUP.md) - Detailed setup guide
- [Firebase Setup](FIREBASE_SETUP.md) - Firebase configuration
- [Auth Setup](auth-setup.md) - Authentication setup
- [Deployment](../deployment/) - Deploy your setup

## 📋 Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Firebase CLI installed
- [ ] Google Cloud SDK installed
- [ ] Environment variables configured
- [ ] Firebase project created
- [ ] Auth0 application configured
- [ ] Secret Manager permissions granted
- [ ] Local development server running
- [ ] Tests passing
- [ ] Documentation reviewed
