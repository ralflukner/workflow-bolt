---
title: Firebase Functions Deployment Runbook
date: "2025-06-29"
priority: critical
status: operational
tags:
  - deployment
  - runbook
  - firebase
  - operations
---

# 🚀 Firebase Functions Deployment Runbook

## Executive Summary

This runbook provides step-by-step procedures for safely deploying Firebase Functions, including pre-deployment checks, deployment execution, and post-deployment verification.

**Critical**: Always run pre-deployment checks before deploying to production.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Verification

```bash
# Check Node.js version
node --version  # Should be v20.x.x

# Check Firebase CLI
firebase --version

# Verify you're in the correct project
firebase use --project luknerlumina-firebase
```

### 2. Run Pre-Deployment Safety Checks

```bash
# Run comprehensive safety checks
./scripts/pre-deploy-check.sh

# Expected output: "🎉 All critical checks passed! Ready for deployment."
```

### 3. Manual Verification

- [ ] All tests passing locally
- [ ] Code review completed and approved
- [ ] No hardcoded credentials in code
- [ ] Firebase.json runtime is "nodejs20"
- [ ] Functions/package.json Node engine is "20"
- [ ] No critical security vulnerabilities

---

## 🚀 Deployment Procedures

### Standard Deployment

```bash
# 1. Navigate to functions directory
cd functions

# 2. Clean install dependencies
rm -rf node_modules package-lock.json
npm ci

# 3. Run tests
npm test

# 4. Deploy functions
firebase deploy --only functions

# 5. Verify deployment
cd ..
node test-functions-deployment.cjs
```

### Emergency Hot-Fix Deployment

For critical production issues only:

```bash
# 1. Quick safety check
./scripts/pre-deploy-check.sh

# 2. Deploy specific function
firebase deploy --only functions:FUNCTION_NAME

# 3. Immediate verification
node test-functions-deployment.cjs
```

### Rollback Procedure

If deployment fails or causes issues:

```bash
# 1. Get previous version
gcloud run revisions list --service=FUNCTION_NAME --format="value(name)" --limit=2

# 2. Rollback to previous revision
PREVIOUS_REVISION=$(gcloud run revisions list --service=FUNCTION_NAME --format="value(name)" --limit=2 | tail -1)
gcloud run services update-traffic FUNCTION_NAME --to-revisions=$PREVIOUS_REVISION=100

# 3. Verify rollback
node test-functions-deployment.cjs
```

---

## 🔍 Post-Deployment Verification

### 1. Function Health Check

```bash
# Run deployment verification
node test-functions-deployment.cjs

# Expected: All functions return ✅ DEPLOYED status
```

### 2. End-to-End Testing

```bash
# Test critical user flows
npm run test:integration

# Test real API connections (if applicable)
npm run test:real-api
```

### 3. Monitor Function Metrics

Check Cloud Console for:
- [ ] Function execution count
- [ ] Error rates (should be < 1%)
- [ ] Average execution time
- [ ] Memory usage
- [ ] Cold start frequency

### 4. Log Analysis

```bash
# Check for errors in the last 10 minutes
gcloud functions logs read --limit 100 --filter="severity>=ERROR AND timestamp>='-10m'"

# Check specific function logs
firebase functions:log --only FUNCTION_NAME
```

---

## 🚨 Troubleshooting Guide

### Common Deployment Issues

#### Issue: "Container Healthcheck failed"

**Symptoms**:

 
```
ERROR: (gcloud.functions.deploy) OperationError: code=3 message=Build failed
Container Healthcheck failed. Revision 'xxx' is not ready and cannot serve traffic.
```

 

**Solutions**:

1. Check Node.js version in firebase.json
2. Verify package.json dependencies
3. Check for OpenTelemetry initialization issues
4. Review function timeout settings

```bash
# Quick fix commands
cd functions
rm -rf node_modules package-lock.json
npm ci
firebase deploy --only functions
```

#### Issue: "Function not found (404)"

**Symptoms**:
- test-functions-deployment.cjs shows ❌ NOT FOUND
- HTTP 404 when calling function

**Solutions**:
1. Verify function is exported in index.js
2. Check function name spelling
3. Ensure deployment completed successfully
4. Verify Firebase project and region

#### Issue: "Runtime error (500+)"

**Symptoms**:
- Functions deploy but return 500+ errors
- test-functions-deployment.cjs shows ❌ ERROR

**Solutions**:
1. Check function logs for specific errors
2. Verify environment variables and secrets
3. Test function locally with emulator
4. Check database and external service connectivity

```bash
# Debug commands
firebase functions:log --only FUNCTION_NAME
firebase emulators:start --only functions
```

### Performance Issues

#### Slow Cold Starts

**Symptoms**: Functions take >3 seconds for first execution

**Solutions**:
1. Optimize dependency loading
2. Use lazy loading for heavy modules
3. Consider function warmup strategies
4. Review OpenTelemetry configuration

#### High Memory Usage

**Symptoms**: Functions approaching memory limits

**Solutions**:
1. Profile memory usage
2. Optimize data processing
3. Implement caching strategies
4. Increase memory allocation if needed

---

## 📊 Monitoring and Alerting

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Error Rate | < 1% | > 5% |
| Avg Duration | < 2s | > 10s |
| Cold Start Rate | < 10% | > 25% |
| Memory Usage | < 80% | > 90% |

### Alert Channels

- **Slack**: #engineering-alerts
- **Email**: ops-team@company.com
- **PagerDuty**: Critical issues only

### Dashboard Links

- [Firebase Functions Dashboard](https://console.cloud.google.com/monitoring/dashboards)

---

## 🔐 Security Considerations

### Pre-Deployment Security Checks

- [ ] No hardcoded credentials
- [ ] Secrets stored in Secret Manager
- [ ] Rate limiting configured
- [ ] Authentication properly implemented
- [ ] CORS settings reviewed

### HIPAA Compliance

- [ ] PHI properly encrypted
- [ ] Audit logging enabled
- [ ] Access controls verified
- [ ] Data retention policies applied

### Security Monitoring

Monitor for:
- Authentication failures
- Rate limit violations
- Unusual access patterns
- Privilege escalation attempts

---

## 🎯 Success Criteria

A successful deployment must meet all of these criteria:

### Functional Requirements

 

- [ ] All functions return expected HTTP status codes
- [ ] Integration tests pass
- [ ] Critical user flows work end-to-end

 

### Performance Requirements

 

- [ ] Error rate < 1%
- [ ] Average response time < 2 seconds
- [ ] Cold start time < 3 seconds
- [ ] Memory usage < 80% of allocated

 

### Security Requirements

 

- [ ] Authentication working correctly
- [ ] Rate limiting active
- [ ] Audit logging functional
- [ ] No security vulnerabilities introduced

 

### Operational Requirements

 

- [ ] Monitoring alerts active
- [ ] Logs properly structured
- [ ] Rollback procedure tested
- [ ] Documentation updated

 

---

## 📞 Emergency Contacts

### On-Call Rotation
- **Primary**: Engineering Team Lead
- **Secondary**: DevOps Engineer
- **Escalation**: CTO

### External Support
- **Firebase Support**: [https://firebase.google.com/support](https://firebase.google.com/support)
- **Google Cloud Support**: [Support case link]

---

## 📝 Deployment Log Template

Use this template for deployment records:

```
Date: YYYY-MM-DD HH:MM UTC
Deployer: [Name]
Commit: [SHA]
Functions Updated: [List]
Pre-deployment Checks: ✅ PASS / ❌ FAIL
Deployment Result: ✅ SUCCESS / ❌ FAILED
Post-deployment Verification: ✅ PASS / ❌ FAIL
Issues: [Any issues encountered]
Rollback Required: YES / NO
```

---

## 🔄 Continuous Improvement

### Monthly Review Items

- [ ] Deployment success rate
- [ ] Average deployment time
- [ ] Function performance trends
- [ ] Security incident analysis
- [ ] Process improvements identified

### Automation Opportunities

- [ ] Automated rollback triggers
- [ ] Performance regression detection
- [ ] Security vulnerability scanning
- [ ] Load testing automation

---

**Last Updated**: 2025-06-29  
**Next Review**: Monthly  
**Owner**: DevOps Team