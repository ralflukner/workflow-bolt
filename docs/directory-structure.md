# Recommended Project Structure

```
workflow-bolt/
├── src/
│   ├── Traits/
│   │   └── SecretManagerTrait.php
│   └── Services/
│       └── TebraApiService.php
├── tests/
│   └── test-tebra.php
├── config/
│   └── services.yaml
├── .gitignore
├── composer.json
├── composer.lock
├── security-check.sh
├── README.md
└── docs/
    └── gsm-setup-guide.md
```

## File Purposes

- **src/Traits/SecretManagerTrait.php**: Reusable trait for GSM access
- **src/Services/TebraApiService.php**: Main service class for Tebra API
- **tests/test-tebra.php**: Test script using the service
- **config/services.yaml**: Service configuration
- **.gitignore**: Prevents committing sensitive files
- **composer.json**: PHP dependencies
- **security-check.sh**: Verify no credentials in repo
- **docs/**: Documentation and setup guides

## Never Commit These Files

```
# Files that should NEVER be in your repository
.env
.env.local
credentials.json
service-account.json
service-account-*.json
*.key
*.pem
*.p12
test-tebra-old.php  # The original file with hardcoded credentials
```