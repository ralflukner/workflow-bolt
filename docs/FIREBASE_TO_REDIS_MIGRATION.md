# Firebase to Redis/PostgreSQL Migration Guide

## Overview

This document tracks the complete migration from Firebase to Redis Memorystore and PostgreSQL on Google Cloud Platform.

## Migration Status

### ✅ Completed

1. **Firebase Functions Removal**
   - All 23 Firebase functions successfully deleted from the cloud
   - Removed GOOGLE_APPLICATION_CREDENTIALS references from codebase
   - Updated environment configuration to use Application Default Credentials

2. **Infrastructure Setup** 
   - Terraform configuration created for Redis, PostgreSQL, GKE, and VPC
   - 63 resources defined including security policies and monitoring
   - Infrastructure partially deployed (some fixes needed)

3. **Service Replacements Created**
   - **Redis Publish Endpoint** (`functions/src/redis-publish-endpoint.js`)
     - Replaces Firebase Functions for handling API requests
     - Uses Auth0 for authentication (no Firebase Auth)
     - Publishes to Redis streams for async processing
   - **PostgreSQL Service** (`src/services/persistence/postgresService.ts`)
     - Direct database access replacing Firestore
     - Patient and session data management
     - HIPAA-compliant data retention

4. **Migration Tools**
   - Data migration script (`scripts/migrate-firestore-to-postgres.js`)
   - Deployment script (`scripts/deploy-redis-postgres-services.sh`)
   - Docker configuration for Cloud Run deployment

## Architecture Comparison

### Before (Firebase)
```
Frontend → Firebase Auth → Firebase Functions → Firestore
                ↓
            Firebase SDK
```

### After (Redis/PostgreSQL)
```
Frontend → Auth0 → Redis Publish Endpoint → Redis Streams
                          ↓                      ↓
                   PostgreSQL              Tebra Worker
```

## Migration Functions Mapping

| Firebase Function | Replacement | Location |
|-------------------|-------------|----------|
| `tebraProxy` | Redis Publish Endpoint | `/api/tebra/:action` |
| `tebraGetPatient` | Redis Publish Endpoint | `/api/tebra/getPatient` |
| `tebraGetAppointments` | Redis Publish Endpoint | `/api/tebra/getAppointments` |
| `tebraCreateAppointment` | Redis Publish Endpoint | `/api/tebra/createAppointment` |
| `exchangeAuth0Token` | Direct Auth0 integration | Frontend |
| `scheduledCredentialCheck` | Cloud Scheduler → Redis | `/api/scheduled/credential-check` |
| `dailyPurge` | PostgreSQL service | `dailySessionService.purgeOldSessions()` |
| `patientSync` | Tebra Redis Worker | Kubernetes deployment |
| `getFirebaseConfig` | Environment variables | Removed |

## Data Migration

### Patients Table (PostgreSQL)
```sql
CREATE TABLE patients (
  id VARCHAR(255) PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  phone VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### Daily Sessions Table (PostgreSQL)
```sql
CREATE TABLE daily_sessions (
  id VARCHAR(255) PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Session Data Table (PostgreSQL)
```sql
CREATE TABLE session_data (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES daily_sessions(id),
  patient_id VARCHAR(255),
  timestamp TIMESTAMP NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Deployment Steps

### 1. Deploy Infrastructure
```bash
cd terraform/environments/prod
terraform apply
```

### 2. Deploy Redis Publish Endpoint
```bash
./scripts/deploy-redis-postgres-services.sh
```

### 3. Migrate Data
```bash
node scripts/migrate-firestore-to-postgres.js
```

### 4. Update Frontend Configuration
```bash
cp .env.redis-postgres .env
npm run build
```

### 5. Deploy Tebra Worker
```bash
./scripts/deploy-k8s-applications.sh
```

## Environment Variables

### Required for Redis/PostgreSQL
```env
# Redis Configuration
VITE_REDIS_API_URL=https://redis-publish-endpoint-xxx.run.app/api
REDIS_HOST=10.x.x.x
REDIS_PASSWORD=xxx

# PostgreSQL Configuration  
POSTGRES_HOST=10.x.x.x
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=xxx
POSTGRES_DATABASE=luknerlumina

# Auth0 Configuration
AUTH0_DOMAIN=luknerlumina.auth0.com
AUTH0_AUDIENCE=https://api.luknerlumina.com

# Feature Flags
VITE_ENABLE_REDIS=true
VITE_ENABLE_POSTGRES=true
VITE_ENABLE_FIREBASE=false
```

## Security Improvements

1. **No Service Account Keys**: Using Application Default Credentials
2. **VPC-native networking**: All services communicate over private IPs
3. **Cloud Armor**: WAF protection for public endpoints
4. **Workload Identity**: GKE pods use Google service accounts
5. **Encryption at rest**: KMS keys for all data

## Monitoring

- Cloud Logging for all services
- Cloud Monitoring dashboards
- Error reporting integration
- Uptime checks for critical endpoints

## Rollback Plan

If issues arise:
1. Firebase project remains active for 30 days
2. Firestore data is preserved as backup
3. Can redeploy Firebase functions from git history
4. Frontend can switch back via feature flags

## Outstanding Tasks

- [ ] Complete Terraform infrastructure deployment
- [ ] Build and push Tebra Worker Docker image  
- [ ] Run data migration script
- [ ] Update DNS records for vikunja.luknerlumina.com
- [ ] Test all endpoints thoroughly
- [ ] Update frontend to use new services
- [ ] Monitor for 24-48 hours
- [ ] Document any issues found
- [ ] Schedule Firebase cleanup (after 30 days)

## Testing Checklist

- [ ] Redis publish endpoint health check
- [ ] Auth0 authentication flow
- [ ] Patient CRUD operations
- [ ] Appointment management
- [ ] Daily session tracking
- [ ] Scheduled tasks execution
- [ ] Data persistence verification
- [ ] Performance benchmarks

## Support Contacts

- Infrastructure: DevOps team
- Database: DBA team  
- Security: Security team
- Application: Development team

---

**Last Updated**: $(date)
**Status**: Migration in progress
