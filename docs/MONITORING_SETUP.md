
# Tebra Proxy Monitoring Setup

## Overview

Comprehensive monitoring and alerting has been configured for the Tebra SOAP proxy service running on Google Cloud Run. Enhanced structured logging provides advanced filtering and correlation capabilities in GCP Cloud Logging.

## Alert Policies Created

### 1. High Latency Aler

- **Policy ID**: `18129142588318108102`

- **Trigger**: P95 latency > 10 seconds for 5 minutes

- **Metric**: `run.googleapis.com/request_latencies`

- **Email**: [lukner@luknerclinic.com](mailto:lukner@luknerclinic.com)

### 2. High Error Count Aler

- **Policy ID**: `9158751147478329485`

- **Trigger**: More than 2 5xx errors per minute for 5 minutes

- **Metric**: `run.googleapis.com/request_count` with `response_code_class="5xx"`

- **Email**: [lukner@luknerclinic.com](mailto:lukner@luknerclinic.com)

### 3. Service Availability Aler

- **Policy ID**: `14626826506718716196`

- **Trigger**: No successful 2xx requests for 10 minutes

- **Metric**: Absence of `response_code_class="2xx"` requests

- **Email**: [lukner@luknerclinic.com](mailto:lukner@luknerclinic.com)

## Notification Channel

- **Channel ID**: `11260908912930231273`

- **Type**: Email

- **Address**: [lukner@luknerclinic.com](mailto:lukner@luknerclinic.com)

- **Status**: Enabled

## Dashboard Integration

### MonitoringStatus Componen

Added to the main dashboard (`/src/components/MonitoringStatus.tsx`) that provides:

**Note**: Requires `VITE_TEBRA_PROXY_API_KEY` environment variable to be set for health checks.

- **Real-time health checks** of the Tebra proxy service

- **Response time monitoring** (updated every 2 minutes)

- **Visual status indicators** with color-coded states:
  - 🟢 Green: Service healthy
  - 🟡 Yellow: Service issues/warnings
  - 🔴 Red: Service offline/error

- **Expandable details** showing response times and status

- **Direct link** to Cloud Monitoring alerting console

### Features

- Automatic health checks every 2 minutes

- Manual refresh capability

- Responsive design for mobile/desktop

- Integration with existing dashboard theme

## Structured Logging Features

### Advanced Log Filtering

The enhanced debug logger now preserves structured fields in GCP Cloud Logging:

```bash
# Find all errors for a specific correlation ID
correlationId="a1b2c3d4" AND level="ERROR"

# Find slow operations (over 5 seconds)
elapsedMs>5000

# Find all Tebra API calls
component="TebraProxyClient" AND message="API Call"

# Find operations that took multiple steps
step>10
```

### Performance Monitoring

- **Response Time Tracking**: Use `elapsedMs` field for performance analysis
- **Correlation Tracking**: Follow complete request flows using `correlationId`
- **Component Analysis**: Filter by specific components for targeted debugging
- **Step Analysis**: Identify complex operations requiring optimization

## Access Links

- **Cloud Monitoring Console**: [https://console.cloud.google.com/monitoring/alerting/policies?project=luknerlumina-firebase](https://console.cloud.google.com/monitoring/alerting/policies?project=luknerlumina-firebase)

- **Cloud Logging Console**: [https://console.cloud.google.com/logs/query?project=luknerlumina-firebase](https://console.cloud.google.com/logs/query?project=luknerlumina-firebase)

- **Tebra Proxy Health Endpoint**: [https://tebra-proxy-623450773640.us-central1.run.app/health](https://tebra-proxy-623450773640.us-central1.run.app/health)

- **Cloud Run Service**: [https://console.cloud.google.com/run/detail/us-central1/tebra-proxy](https://console.cloud.google.com/run/detail/us-central1/tebra-proxy)

## Alert Response

When alerts trigger, you will receive emails at `lukner@luknerclinic.com` with:

- Alert description and severity

- Current metric values

- Direct links to investigate in Cloud Console

- Timestamps and duration information

## Maintenance

### Adding/Removing Email Recipients

```bash

# Create new notification channel

gcloud alpha monitoring channels create
  --display-name="Additional Email"
  --type=email
  --channel-labels=email_address=new@email.com

# Add to existing policy

gcloud alpha monitoring policies update POLICY_ID
  --add-notification-channels=CHANNEL_ID

```

### Modifying Alert Thresholds

Update the alert policies in Cloud Monitoring console or via gcloud CLI.

### Testing Alerts

Use the manual refresh button in the MonitoringStatus component or directly test endpoints to trigger alerts.

## Troubleshooting

### "Tebra Service Offline" in Dashboard

**Issue**: MonitoringStatus shows service as offline
**Cause**: Missing or incorrect `VITE_TEBRA_PROXY_API_KEY` environment variable
**Solution**:

1. Add the API key to `.env.local`:

   ```bash
   echo "VITE_TEBRA_PROXY_API_KEY=UlmgPDMHoMqP2KAMKGIJK4tudPlm7z7ertoJ6eTV3+Y=" >> .env.local
   ```

2. Restart the development server

### Manual Service Health Check

```bash
curl -H "X-API-Key: UlmgPDMHoMqP2KAMKGIJK4tudPlm7z7ertoJ6eTV3+Y="
  https://tebra-proxy-623450773640.us-central1.run.app/health

```

### Verify Appointment Retrieval

```bash
curl -X POST -H "Content-Type: application/json"
  -H "X-API-Key: UlmgPDMHoMqP2KAMKGIJK4tudPlm7z7ertoJ6eTV3+Y="
  -d '{"fromDate": "2025-06-10", "toDate": "2025-06-10"}'
  https://tebra-proxy-623450773640.us-central1.run.app/appointments

```

## Environment Configuration

### Required Environment Variables

Add to `.env.local` for dashboard monitoring:

```

VITE_TEBRA_PROXY_API_KEY=UlmgPDMHoMqP2KAMKGIJK4tudPlm7z7ertoJ6eTV3+Y=

```

### API Key Managemen

- **Secret Name**: `tebra-proxy-api-key`

- **Location**: Google Secret Manager

- **Access**: `gcloud secrets versions access latest --secret="tebra-proxy-api-key"`

## Performance & Timeouts

### Accommodation for Slow Tebra API

The Tebra SOAP API can be inherently slow (5+ seconds response times). Multiple strategies implemented:

**Buffering/Caching Layer:**

- **5-minute cache** for appointment data in proxy

- **Cache warming endpoint** (`/warm-cache`) for preloading data

- **Fast ping endpoint** (`/ping`) for health checks (~230ms vs 5s+)

- **Cache status** visible in health endpoin

**Timeout Configuration:**

- **SOAP Connection Timeout**: 30 seconds

- **SOAP Socket Timeout**: 60 seconds

- **Cloud Run Service Timeout**: 300 seconds (5 minutes)

- **MonitoringStatus Frontend**: Uses ping endpoint (15s timeout)

**Cache Management:**

- **TTL**: 5 minutes for appointment data

- **Storage**: `/tmp/` directory in Cloud Run container

- **Endpoints**: `/warm-cache` (POST), `/health` shows cache status

### Time Range Configuration

- **Start Time**: 12:00:00 AM (midnight)

- **End Time**: 11:59:59 PM (full day coverage)

- **Practice ID**: "1" (internal Tebra ID)

- **Timezone Offset**: -6 (Central Time)

## Container Versions

- **Current**: `gcr.io/luknerlumina-firebase/tebra-proxy:tebra-proxy-00011-crp`

- **Stable**: `gcr.io/luknerlumina-firebase/tebra-proxy:stable-20250611`

- **Version**: `gcr.io/luknerlumina-firebase/tebra-proxy:v1.0.0`

## Created

- **Date**: June 11, 2025

- **By**: Claude Code

- **Status**: Production Ready ✅
