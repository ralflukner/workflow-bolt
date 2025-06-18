# SECURITY SECRETS MANAGEMENT

## 🔐 HIPAA-Compliant Secret Storage

This document outlines our security-first approach to managing secrets in Firebase Cloud Functions, ensuring HIPAA compliance through encryption, audit logging, and least-privilege access.

## 📋 Secret Inventory

### Production Secrets (Google Secret Manager)

- `auth0-domain` - Auth0 tenant domain for JWT verification

- `auth0-audience` - Auth0 API audience for token validation

- `TEBRA_USERNAME` - Tebra API username (future)

- `TEBRA_PASSWORD` - Tebra API password (future)

- `tebra-api-url` - Tebra API endpoint URL (future)

### Local Developmen

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

### Data Residency

- **Region**: All secrets stored in us-central1
- **Replication**: User-managed replication policy
- **Compliance**: HIPAA data residency requirements

## 📝 CLI Commands

### Creating Secrets

```bash
# Create a new secret with HIPAA-compliant data residency
gcloud secrets create SECRET_NAME \
    --replication-policy=user-managed \
    --locations=us-central1

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

 openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -salt -d \
     -in "$ENV.$STAMP.enc" -out "$ENV.temp" \
     -k "$(whoami)-$(hostname)-HIPAA"
        -k "$(whoami)-$(hostname)-HIPAA"
```
