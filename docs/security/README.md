# Security Documentation

This directory contains security documentation, HIPAA compliance guides, and access control policies for Workflow Bolt.

## 📁 Contents

### Core Security Documents

- [Security Overview](SECURITY.md) - Comprehensive security policies and procedures
- [HIPAA Setup Guide](HIPAA_SETUP_GUIDE.md) - HIPAA compliance implementation guide
- [HIPAA Security Fixes](SECURITY_HIPAA_FIXES_20250623.md) - Recent HIPAA security updates

### Encryption & Data Protection

- [Patient Encryption Resolved](PATIENT_ENCRYPTION_RESOLVED.md) - Patient data encryption implementation
- [Patient Encryption Repair](patient-encryption-repair.md) - Troubleshooting encryption issues
- [Secrets Management](secrets-management.md) - Managing API keys and credentials

### API & Endpoint Security

- [Debug Endpoint Security](debug-endpoint-security.md) - Securing debug endpoints
- [Debug Endpoint Security Summary](debug-endpoint-security-summary.md) - Quick reference for debug security

### Authentication & Authorization

- [Auth Setup](auth.md) - Authentication system overview
- [Google Auth Platform Branding](google-auth-platform-branding.md) - OAuth branding compliance

## 🔐 Security Quick Reference

### HIPAA Compliance Checklist

- [ ] **Encryption**
  - [ ] TLS 1.2+ for all communications
  - [ ] AES-256 encryption at rest
  - [ ] Patient data field-level encryption

- [ ] **Access Control**
  - [ ] Role-based access control (RBAC)
  - [ ] Multi-factor authentication
  - [ ] Session timeout (15 minutes)

- [ ] **Audit Logging**
  - [ ] All PHI access logged
  - [ ] Immutable audit trail
  - [ ] 7-year retention policy

- [ ] **Data Protection**
  - [ ] Regular backups
  - [ ] Disaster recovery plan
  - [ ] Data loss prevention

### Security Best Practices

1. **Never commit secrets to Git**
   - Use Secret Manager for all credentials
   - Environment variables for local development
   - See [Secrets Management](secrets-management.md)

2. **Validate all inputs**
   - Sanitize user data
   - Prevent SQL injection
   - XSS protection

3. **Implement least privilege**
   - Minimal IAM permissions
   - Service account separation
   - Regular permission audits

4. **Monitor and alert**
   - Failed authentication attempts
   - Unusual access patterns
   - System vulnerabilities

## 🚨 Incident Response

For security incidents, follow the [Incident Response](../security-wiki/Incident-Response.md) procedure:

1. **Contain** - Isolate affected systems
2. **Assess** - Determine scope and impact
3. **Notify** - Alert stakeholders and authorities
4. **Remediate** - Fix vulnerabilities
5. **Document** - Record lessons learned

## 🔍 Security Commands

### Check IAM Permissions

```bash
gcloud projects get-iam-policy luknerlumina-firebase
```

### Rotate Service Account Keys

```bash
gcloud iam service-accounts keys create new-key.json \
  --iam-account=SERVICE_ACCOUNT@PROJECT.iam.gserviceaccount.com
```

### View Audit Logs

```bash
gcloud logging read "protoPayload.methodName='google.iam.admin.v1.CreateServiceAccountKey'" \
  --project=luknerlumina-firebase --limit=10
```

### Check Secret Access

```bash
gcloud logging read 'resource.type="secret_manager_secret"' \
  --project=luknerlumina-firebase --limit=20
```

## 📊 Security Metrics

Monitor these key security metrics:

- Failed login attempts per hour
- API authentication failures
- Secret Manager access frequency
- Encryption/decryption operations
- Session duration statistics

## 🔗 Related Documentation

- [Architecture](../architecture/) - Security architecture context
- [Deployment](../deployment/) - Secure deployment procedures
- [Debugging](../debugging/) - Security debugging tools
- [Setup](../setup/) - Initial security configuration

## 🛡️ Compliance Certifications

- HIPAA (Health Insurance Portability and Accountability Act)
- SOC 2 Type II (in progress)
- GDPR (General Data Protection Regulation) - EU patients

## 📝 Security Review Schedule

- **Weekly**: Review access logs
- **Monthly**: Update dependencies
- **Quarterly**: Penetration testing
- **Annually**: Full security audit
