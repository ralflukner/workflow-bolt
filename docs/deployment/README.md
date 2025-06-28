# Deployment Documentation

This directory contains deployment guides, CI/CD configurations, and release procedures for Workflow Bolt.

## 📁 Contents

### Deployment Guides

- [Deployment Complete Guide](DEPLOYMENT_COMPLETE.md) - Comprehensive deployment procedures
- [Tebra PHP Deployment](TEBRA_PHP_DEPLOYMENT_COMPLETE.md) - PHP service deployment guide
- [Deploy Tebra Fix](DEPLOY-TEBRA-FIX.md) - Quick fix deployment instructions
- [Netlify Deployment Summary](netlify-deployment-summary.md) - Frontend deployment on Netlify
- [Deployment Fix Guide](deployment-fix-guide.md) - Troubleshooting deployment issues

## 🚀 Deployment Overview

### System Components

1. **Frontend (React)**
   - Platform: Netlify
   - Build: Vite
   - Environment: Production/Staging

2. **Backend (Firebase Functions)**
   - Platform: Google Cloud Functions
   - Runtime: Node.js 18
   - Deployment: Firebase CLI

3. **PHP API Service**
   - Platform: Google Cloud Run
   - Container: Docker
   - Runtime: PHP 8.2 + Apache

4. **Database**
   - Service: Firestore
   - Backup: Automated daily

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Run all tests locally
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Review environment variables
- [ ] Check Secret Manager values
- [ ] Backup production database

### Frontend Deployment

```bash
# Build and test locally
npm run build
npm run preview

# Deploy to Netlify (automatic on push to main)
git push origin main
```

### Backend Deployment

```bash
# Deploy Firebase Functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:tebraProxy

# Deploy Cloud Run service
cd tebra-php-api
gcloud run deploy tebra-php-api --source . \
  --region us-central1 \
  --project luknerlumina-firebase \
  --no-allow-unauthenticated
```

### Post-Deployment

- [ ] Verify all services are running
- [ ] Test critical user flows
- [ ] Check monitoring dashboards
- [ ] Update status page
- [ ] Notify stakeholders

## 🔄 CI/CD Pipeline

### GitHub Actions

- Runs on push to main
- Executes tests
- Builds artifacts
- Deploys to staging

### Netlify

- Auto-deploys from main branch
- Preview deployments for PRs
- Environment variable management

### Firebase

- Manual deployment via CLI
- Staging project available
- Rollback capabilities

## 🚨 Rollback Procedures

### Frontend Rollback

1. Go to Netlify dashboard
2. Select previous deployment
3. Click "Publish deploy"

### Function Rollback

```bash
# List function versions
gcloud functions list --project=luknerlumina-firebase

# Deploy previous version
firebase deploy --only functions --force
```

### Cloud Run Rollback

```bash
# List revisions
gcloud run revisions list --service=tebra-php-api \
  --region=us-central1 --project=luknerlumina-firebase

# Route traffic to previous revision
gcloud run services update-traffic tebra-php-api \
  --to-revisions=REVISION_NAME=100 \
  --region=us-central1 --project=luknerlumina-firebase
```

## 🔐 Security Considerations

- Never deploy with `--allow-unauthenticated` for services handling PHI
- Rotate service account keys after deployment
- Verify HTTPS certificates
- Check CORS configuration
- Review IAM permissions

## 📊 Deployment Metrics

Monitor these post-deployment:

- Response times
- Error rates
- Memory usage
- Cold start frequency
- User activity

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version
   - Clear cache
   - Review dependencies

2. **Function Timeouts**
   - Increase memory allocation
   - Check for infinite loops
   - Review async operations

3. **Permission Errors**
   - Verify IAM roles
   - Check service accounts
   - Review API enablement

## 🔗 Related Documentation

- [Architecture](../architecture/) - System design
- [Setup](../setup/) - Environment configuration
- [Security](../security/) - Security requirements
- [Debugging](../debugging/) - Post-deployment debugging

## 📅 Deployment Schedule

- **Production**: Tuesday/Thursday mornings
- **Staging**: Continuous deployment
- **Hotfixes**: As needed with approval
- **Major releases**: First Tuesday of month
