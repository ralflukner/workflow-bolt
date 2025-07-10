# Firebase to Redis/PostgreSQL Migration Guide

## Overview

This guide documents the complete migration from Firebase to a Redis Memorystore and PostgreSQL architecture on Google Cloud Platform.

## Architecture Changes

### Before (Firebase-based)

```
Frontend → Firebase Auth → Firebase Functions → Tebra PHP API
    ↓
Firestore (Patient Data)
```

### After (Redis/PostgreSQL-based)

```
Frontend → Auth0 → Redis Streams → Worker Service → Tebra PHP API
    ↓                    ↓
PostgreSQL          Redis Cache
(Patient Data)     (Session Data)
```

## Key Benefits

1. **No CORS Issues**: All API communication happens server-side via Redis
2. **Better Scalability**: Redis streams handle high throughput
3. **Cost Optimization**: Reduced Firebase usage costs
4. **HIPAA Compliance**: Better control over data storage and encryption
5. **Real-time Updates**: SSE provides live status updates
6. **Async Processing**: Long-running operations don't timeout

## Migration Steps

### Phase 1: Infrastructure Setup

1. **Deploy GCP Infrastructure**
   ```bash
   cd /Users/ralfb.luknermdphd/PycharmProjects/workflow-bolt
   ./scripts/deploy-gcp-infrastructure.sh
   ```

   This creates:
   - VPC with private subnets
   - Redis Memorystore instance
   - Cloud SQL PostgreSQL for Vikunja
   - GKE cluster for services
   - VPC connector for serverless access

2. **Verify Infrastructure**
   ```bash
   # Check GKE cluster
   kubectl get nodes
   
   # Check Vikunja deployment
   kubectl get pods -n vikunja
   
   # Get Redis connection info
   cd terraform/environments/prod
   terraform output -json redis_connection
   ```

### Phase 2: Deploy Services

1. **Deploy Tebra Redis Worker**
   ```bash
   kubectl apply -f k8s/tebra-worker/
   ```

2. **Deploy Redis Logger Service**
   ```bash
   kubectl apply -f k8s/redis-logger/
   ```

3. **Deploy SSE Proxy**
   ```bash
   kubectl apply -f k8s/sse-proxy/
   ```

### Phase 3: Update Frontend

1. **Remove Firebase Dependencies**
   ```bash
   ./scripts/remove-firebase-functions.sh
   ```

2. **Update Environment Variables**
   ```env
   # Remove Firebase variables
   # VITE_FIREBASE_API_KEY=...
   # VITE_FIREBASE_AUTH_DOMAIN=...
   
   # Add Redis/PostgreSQL variables
   VITE_REDIS_API_URL=https://api.luknerlumina.com/redis
   VITE_REDIS_SSE_URL=https://api.luknerlumina.com/events
   VITE_POSTGRES_API_URL=https://api.luknerlumina.com/patients
   ```

3. **Update Service Imports**
   ```typescript
   // Before
   import { tebraFirebaseApi } from './services/tebraFirebaseApi';
   
   // After
   import { tebraRedisApi } from './services/tebraRedisApi';
   import { useTebraRedisApi } from './hooks/useTebraRedisApi';
   ```

### Phase 4: Data Migration

1. **Export Firestore Data**
   ```bash
   gcloud firestore export gs://luknerlumina-backups/firestore-final
   ```

2. **Transform and Import to PostgreSQL**
   ```bash
   # Run migration script
   python scripts/migrate-firestore-to-postgres.py
   ```

### Phase 5: Testing

1. **Test Redis Connection**
   ```bash
   node scripts/test-redis-connection.js
   ```

2. **Test Tebra API via Redis**
   ```bash
   curl -X POST https://api.luknerlumina.com/redis/publish \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"stream":"tebra:requests","message":{"action":"testConnection"}}'
   ```

3. **Test Vikunja Access**
   ```bash
   curl https://vikunja.luknerlumina.com/api/v1/info
   ```

### Phase 6: Cutover

1. **Update DNS Records**
   - Point `vikunja.luknerlumina.com` to the GKE Ingress IP
   - Update API endpoints in frontend config

2. **Monitor Services**
   ```bash
   # Watch logs
   kubectl logs -f deployment/tebra-worker -n default
   kubectl logs -f deployment/vikunja -n vikunja
   
   # Check metrics
   gcloud monitoring dashboards list
   ```

3. **Disable Firebase Functions**
   ```bash
   firebase functions:delete --all --force
   ```

## Rollback Plan

If issues arise:

1. **Keep Firebase Active**: Don't delete Firebase project for 30 days
2. **Feature Flags**: Use environment variables to switch between APIs
3. **Data Backup**: Keep Firestore export for emergency restore
4. **Quick Switch**: Update environment variables to revert

## Security Considerations

1. **VPC Security**
   - All services in private subnets
   - No public IPs except load balancers
   - Cloud Armor for DDoS protection

2. **Authentication**
   - Auth0 for user authentication
   - Service accounts with minimal permissions
   - API keys in Secret Manager

3. **Data Protection**
   - Encryption at rest (Redis, PostgreSQL)
   - TLS for all connections
   - HIPAA-compliant configuration

## Cost Comparison

### Firebase (Monthly)

- Firestore: ~$200
- Functions: ~$150
- Auth: ~$50
- **Total: ~$400**

### Redis/PostgreSQL (Monthly)

- Redis Memorystore: ~$150
- Cloud SQL: ~$100
- GKE: ~$100
- **Total: ~$350**

**Savings: ~$50/month (12.5%)**

## Monitoring and Alerts

1. **Set up Alerts**
    ```bash
    gcloud alpha monitoring policies create \
      --notification-channels=$CHANNEL_ID \
      --display-name="Redis Connection Failures" \
      --condition-display-name="High error rate" \
      --condition-threshold-value=5
    ```

2. **Dashboard Access**
    - GCP Console → Monitoring → Dashboards
    - Custom dashboard: "Redis-PostgreSQL-Monitoring"

## Support Contacts

- **Infrastructure**: DevOps team
- **Redis Issues**: Check worker logs first
- **Vikunja Issues**: Check PostgreSQL connection
- **Emergency**: Keep Firebase as backup for 30 days

## Verification Checklist

- [ ] GCP infrastructure deployed successfully
- [ ] Vikunja accessible at [https://vikunja.luknerlumina.com](https://vikunja.luknerlumina.com)
- [ ] Redis worker processing requests
- [ ] SSE delivering real-time updates
- [ ] Frontend using Redis API
- [ ] All tests passing
- [ ] Monitoring configured
- [ ] Team trained on new architecture
- [ ] Documentation updated
- [ ] Firebase functions deleted (after 30 days)
