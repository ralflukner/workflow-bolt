# Changelog

## [Unreleased]

- **Docs**: Added `docs/tebra-functions-usage.md` – guide for calling Firebase callable
  functions and Cloud-Run proxy, with code samples, sequence diagram, and pitfalls.
- **Docs**: Added `docs/tebra-api-failures.md` – consolidated failure catalogue and
  remediation roadmap.
- **Docs**: Linked new guide from top-level `README.md` for quick discovery.
- **Code**: Created `functions/src/get-secret.ts` and generated JS wrapper
  to expose a secure, whitelisted secret-fetch callable (`getSecret`).
- **Code**: Updated `functions/index.js` to export `getSecret` and improved
  error handling in `tebra-proxy-client.js` (Secret-Manager fallback & logging).
- **Code**: Refactored `src/utils/envUtils.ts` to remove `@ts-ignore` and use
  typed cast, satisfying ESLint rules.
- **Infra**: Added Secure Secret Manager workflow; IAM binding instructions
  clarified in docs.
- Added new feature X
- Fixed bug Y
- Improved performance Z

## [1.0.0] - 2024-03-20

- Initial release
- Basic functionality implemented
- Core features working

## [0.9.0] - 2024-03-15

- Beta release
- Testing phase
- Bug fixes

## [0.8.0] - 2024-03-10

- Alpha release
- Development phase
- Initial setup

All notable changes to the Tebra Proxy service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### Added

- Initial release of Tebra Proxy service
- Basic SOAP API integration with Tebra
- Health check endpoints
- Environment-based configuration
- Secret management for credentials
- Basic error handling and logging

### Security

- Secure credential storage using Kubernetes secrets
- Environment variable based configuration
- No hardcoded credentials

### Infrastructure

- Cloud Run deployment configuration
- Autoscaling settings (1-10 instances)
- Resource limits (1 CPU, 512Mi memory)
- Health check probes

### Planned

- Enhanced error handling
- Request rate limiting
- API response caching
- Metrics collection
- Audit logging