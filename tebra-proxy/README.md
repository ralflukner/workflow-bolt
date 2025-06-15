
# Tebra SOAP Proxy - HIPAA Complian

A secure PHP proxy server for Tebra (Kareo) SOAP API integration with Firebase Functions.

## 🔒 Security Features

- ✅ **API Key Authentication** - Prevents unauthorized access

- ✅ **HIPAA Audit Logging** - Complete request tracking

- ✅ **Input Validation** - Prevents injection attacks

- ✅ **Rate Limiting** - Protects against abuse

- ✅ **CORS Restrictions** - Limited to Firebase domains

- ✅ **Security Headers** - XSS, CSRF, clickjacking protection

- ✅ **HTTPS Enforced** - All traffic encrypted in transi

- ✅ **Non-root Container** - Reduced attack surface

## 📋 Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud SDK** installed (`gcloud` command)
3. **Docker** installed
4. **HIPAA Business Associate Agreement** signed with Google

## 🚀 Quick Deploymen

1. **Set Environment Variables:**

```bash
export TEBRA_SOAP_USERNAME="work-flow@luknerclinic.com"
export TEBRA_SOAP_PASSWORD="your-tebra-password"
export TEBRA_SOAP_CUSTKEY="your-customer-key"

```

2. **Login to Google Cloud:**

```bash
gcloud auth login
gcloud config set project luknerlumina-firebase

```

3. **Deploy:**

```bash
cd tebra-proxy
./deploy.sh

```

4. **Save the Generated API Key!** 📝
   The deployment will output a secure API key - save this for Firebase Functions.

## 🔧 Configuration

### Environment Variables

| Variable              | Description                           | Required |
| --------------------- | ------------------------------------- | -------- |
| `TEBRA_SOAP_USERNAME` | Tebra API username                    | ✅       |
| `TEBRA_SOAP_PASSWORD` | Tebra API password                    | ✅       |
| `TEBRA_SOAP_CUSTKEY`  | Tebra customer key                    | ✅       |
| `API_KEY`             | Secure API key for authentication     | ✅       |
| `LOG_LEVEL`           | Logging level (debug/info/warn/error) | ❌       |

### Firebase Functions Integration

Update your Firebase Functions environment:

```bash
firebase functions:config:se
  tebra.proxy_url="https://your-service-url"
  tebra.proxy_api_key="your-generated-api-key"

```

## 📡 API Endpoints

All endpoints require `X-API-Key` header for authentication.

### Health Check

```bash
GET /tes
X-API-Key: your-api-key

```

### Get Providers

```bash
GET /providers
X-API-Key: your-api-key

```

### Get Appointments

```bash
POST /appointments
X-API-Key: your-api-key
Content-Type: application/json

{
  "fromDate": "2025-06-02",
  "toDate": "2025-06-02"
}

```

### Get Practices

```bash
GET /practices
X-API-Key: your-api-key

```

### Patient Operations

```bash

# Get patient by ID

GET /patients/{id}
X-API-Key: your-api-key

# Search patients

POST /patients
X-API-Key: your-api-key
Content-Type: application/json

{
  "LastName": "Smith",
  "FirstName": "John"
}

```

## 🛡️ HIPAA Compliance

### Required Steps

1. **Sign BAA with Google Cloud:**

   - Navigate to Google Cloud Console
   - Go to Compliance → BAA
   - Review and sign the Business Associate Agreemen

2. **Enable Audit Logging:**

   ```bash
   gcloud logging sinks create tebra-audit-sink
     storage.googleapis.com/your-audit-bucke
     --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="tebra-proxy"'
   ```

3. **Set Up Monitoring:**

   ```bash
   gcloud alpha monitoring policies create --policy-from-file=monitoring-policy.yaml
   ```

4. **Regular Security Reviews:**
   - Review access logs monthly
   - Monitor for unusual activity
   - Update dependencies regularly

### Security Checklis

- ✅ All data encrypted in transit (HTTPS)

- ✅ All data encrypted at rest (Google Cloud default)

- ✅ API access restricted by authentication

- ✅ Request logging for audit trails

- ✅ Rate limiting to prevent abuse

- ✅ Input validation to prevent attacks

- ✅ Security headers configured

- ✅ Container runs as non-root user

- ✅ Minimal attack surface

## 🔧 Local Developmen

1. **Start PHP development server:**

```bash
cd tebra-proxy
php -S localhost:8080

```

2. **Test with API key:**

```bash
curl -H "X-API-Key: secure-random-key-change-in-production"
     http://localhost:8080/tes

```

## 📊 Monitoring

### Cloud Run Metrics

- Request count and latency

- Error rates and status codes

- Memory and CPU usage

- Instance coun

### Application Logs

- All requests logged with audit information

- Error tracking with stack traces

- Security events (failed authentication)

### Alerts

- High error rate (>5%)

- Unusual traffic patterns

- Authentication failures

## 🆘 Troubleshooting

### Common Issues

1. **Authentication Failed (401)**

   - Check API key in request headers
   - Verify environment variable is set correctly

2. **Rate Limited (429)**

   - Implement exponential backoff in clien
   - Consider increasing rate limits if legitimate

3. **SOAP Faults**
   - Check Tebra credentials
   - Verify customer key is correc
   - Check network connectivity

### Log Analysis

```bash

# View recent logs

gcloud logs read "resource.type=cloud_run_revision" --limit=50

# Filter for errors

gcloud logs read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=20

```

## 📞 Suppor

For technical issues:

1. Check Cloud Run logs
2. Verify environment variables
3. Test endpoints directly
4. Contact Google Cloud Support for infrastructure issues

---

**⚠️ Important:** This proxy handles PHI (Protected Health Information). Ensure all HIPAA compliance requirements are met before production use.
