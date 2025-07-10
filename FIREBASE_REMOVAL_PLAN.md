# Firebase Removal Plan

## Overview

This document outlines the complete plan for removing Firebase from the workflow-bolt project and replacing it with the new Redis-based architecture on Google Cloud Platform.

## Current Firebase Usage

### 1. Authentication

- **Current**: Firebase Auth integrated with Auth0
- **Replacement**: Direct Auth0 authentication with Redis session management

### 2. Database (Firestore)

- **Current**: Patient data, session data, daily sessions stored in Firestore
- **Replacement**: PostgreSQL on Cloud SQL with Redis caching

### 3. Functions

- **Current**: Firebase Functions for Tebra proxy and other backend services
- **Replacement**:
  - Tebra Redis Worker on GKE
  - Redis publish endpoint on Cloud Run
  - Dashboard API on Cloud Run

### 4. Hosting

- **Current**: Firebase Hosting for static files
- **Replacement**: Already using Netlify for frontend

### 5. Configuration

- **Current**: Firebase config loaded from environment/backend
- **Replacement**: Direct environment variables and Secret Manager

## Removal Steps

### Phase 1: Update Package Dependencies

1. Remove Firebase packages from `package.json`:
   - `@firebase/app`
   - `@firebase/auth`
   - `@firebase/firestore`
   - `firebase`
   - `firebase-functions`

2. Remove Firebase packages from `functions/package.json`:
   - `firebase-admin`
   - `firebase-functions`

3. Add new dependencies:
   - `redis` (already added)
   - `pg` for PostgreSQL
   - `@google-cloud/secret-manager` (already added)

### Phase 2: Update Frontend Services

1. Replace `src/services/tebraFirebaseApi.ts` with `src/services/tebraRedisApi.ts` (already created)

2. Update authentication:
   - Remove `src/services/authBridge.ts` (Firebase/Auth0 bridge)
   - Update `src/auth/AuthProvider.tsx` to use Auth0 directly
   - Remove Firebase auth initialization

3. Update data services:
   - Replace Firestore services with PostgreSQL/Redis services
   - Update `src/services/firebase/` directory
   - Create new `src/services/persistence/` directory

### Phase 3: Update Context and Hooks

1. Remove `src/contexts/firebase.tsx`
2. Remove `src/hooks/useFirebase.ts`
3. Update `src/context/PatientContext.tsx` to remove Firebase dependencies
4. Create new context for Redis/PostgreSQL persistence

### Phase 4: Update Configuration

1. Remove all Firebase config files:
   - `src/config/firebase.ts`
   - `src/config/firebase-config.ts`
   - `src/config/firebase-init.ts`
   - `src/services/firebase/firebaseConfig.ts`

2. Remove Firebase environment variables from:
   - `.env` files
   - `.env.example`
   - Documentation

3. Update configuration to use new services:
   - Redis connection config
   - PostgreSQL connection config
   - Cloud Run endpoints

### Phase 5: Update Backend Functions

1. Remove `functions/` directory entirely
2. Deploy new services:
   - Redis Worker (already created)
   - Redis Logger (already created)
   - Dashboard API (already created)

### Phase 6: Update Build and Deployment

1. Remove `firebase.json`
2. Remove Firebase-related scripts:
   - `scripts/firebase-auth.sh`
   - `scripts/generate-firebase-config.sh`
   - `scripts/fix-firebase-config.sh`
   - `scripts/get-firebase-config.js`

3. Update deployment scripts to use new infrastructure

### Phase 7: Update Tests

1. Remove Firebase mocks from `src/setupTests.tsx`
2. Update test files that use Firebase
3. Add tests for new Redis/PostgreSQL services

### Phase 8: Update Documentation

1. Remove Firebase setup guides:
   - `docs/setup/FIREBASE_SETUP.md`
   - `docs/setup/FIREBASE_CLI_AUTH.md`

2. Update remaining documentation to remove Firebase references
3. Add documentation for new architecture

## Migration Data Plan

### Patient Data Migration

1. Export all patient data from Firestore
2. Transform data for PostgreSQL schema
3. Import into new PostgreSQL database
4. Verify data integrity

### Session Data Migration

1. Export active sessions from Firestore
2. Import into Redis with appropriate TTLs
3. Update session management code

### Daily Sessions Migration

1. Export historical daily sessions
2. Import into PostgreSQL for long-term storage
3. Cache recent sessions in Redis

## Rollback Plan

1. Keep Firebase project active but unused for 30 days
2. Maintain data export backups
3. Document rollback procedures
4. Test rollback in staging environment

## Timeline

- **Week 1**: Update dependencies and frontend services
- **Week 2**: Deploy new backend services
- **Week 3**: Migrate data
- **Week 4**: Remove Firebase code and test
- **Week 5**: Monitor and optimize

## Success Criteria

1. All Firebase dependencies removed from codebase
2. No Firebase API calls in production
3. All data successfully migrated
4. All tests passing with new architecture
5. No degradation in performance
6. Cost reduction achieved
