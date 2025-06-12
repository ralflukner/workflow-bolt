# SECURITY SECRETS MANAGEMENT

## 🔐 HIPAA-Compliant Secret Storage

This document outlines our security-first approach to managing secrets in Firebase Cloud Functions, ensuring HIPAA compliance through encryption, audit logging, and least-privilege access.

## 📋 Secret Inventory

### Production Secrets (Google Secret Manager)

- `auth0-domain` - Auth0 tenant domain for JWT verification
- `auth0-audience` - Auth0 API audience for token validation
- `tebra-username` - Tebra API username (future)
- `tebra-password` - Tebra API password (future)
- `tebra-api-url` - Tebra API endpoint URL (future)

### Local Development

- Encrypted `.env` files for local development only
- Never commit plaintext `.env` files to version control

## 🛡️ Security Controls

### Encryption

- **At Rest**: Google Secret Manager (AES-256 encryption)
- **In Transit**: TLS 1.3 for all API communications
- **Local Backup**: AES-256-CBC with PBKDF2 (100,000 iterations)

### Access Control

- **IAM**: Cloud Functions service account has `secretmanager.secretAccessor` role
- **Audit**: All secret access logged with timestamps
- **Rotation**: Secrets can be rotated without code changes

## 📝 CLI Commands

### Creating Secrets

```bash
# Create a new secret
gcloud secrets create SECRET_NAME --replication-policy=automatic

# Add secret value
echo "SECRET_VALUE" | gcloud secrets versions add SECRET_NAME --data-file=-
```

### Managing Secrets

```bash
# List all secrets
gcloud secrets list

# View secret metadata (not the value)
gcloud secrets describe SECRET_NAME

# Add new version (rotation)
echo "NEW_VALUE" | gcloud secrets versions add SECRET_NAME --data-file=-
```

### Local Encryption

```bash
# Encrypt .env file for secure backup
ENV=.env
STAMP=$(date +%Y%m%d)
openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -salt \
        -in "$ENV" -out "$ENV.$STAMP.enc" \
        -k "$(whoami)-$(hostname)-HIPAA"

# Decrypt when needed (NEVER commit decrypted files)
openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -salt -d \
        -in "$ENV.$STAMP.enc" -out "$ENV.temp" \
        -k "$(whoami)-$(hostname)-HIPAA"
```

## 🚫 Security Violations

### NEVER DO

- ❌ Commit plaintext `.env` files
- ❌ Log secret values in application code
- ❌ Store secrets in frontend code
- ❌ Share encrypted files via insecure channels
- ❌ Use weak encryption or short passwords

### ALWAYS DO:
- ✅ Use Google Secret Manager for production
- ✅ Encrypt local secrets with strong ciphers
- ✅ Audit all secret access
- ✅ Rotate secrets regularly
- ✅ Use least-privilege IAM policies

## 🔄 Secret Rotation Process

1. **Create new secret version**:
   ```bash
   echo "NEW_VALUE" | gcloud secrets versions add SECRET_NAME --data-file=-
   ```

2. **Deploy functions** (they automatically use latest version)

3. **Verify functionality** in staging/production

4. **Disable old version** (optional):
   ```bash
   gcloud secrets versions disable VERSION_NUMBER --secret=SECRET_NAME
   ```

## 🚨 Incident Response

### If secrets are compromised:
1. **Immediate**: Rotate all affected secrets
2. **Audit**: Review access logs for unauthorized access
3. **Notify**: Inform security team and compliance officer
4. **Document**: Record incident and remediation steps

### Emergency Contacts
- **Security Team**: [security@luknerclinic.com]
- **HIPAA Officer**: [hipaa@luknerclinic.com]
- **On-call Engineer**: [oncall@luknerclinic.com]

## 📊 Compliance Mapping

| HIPAA Requirement | Implementation |
|-------------------|----------------|
| Access Control | IAM roles, audit logging |
| Encryption | AES-256 at rest/transit |
| Audit Trails | Cloud Logging, Secret Manager audit |
| Data Integrity | Cryptographic signatures |
| Transmission Security | TLS 1.3 for all communications |

---

**Last Updated**: $(date +%Y-%m-%d)
**Reviewed By**: Security Team
**Next Review**: $(date -d '+3 months' +%Y-%m-%d) 
