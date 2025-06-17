# Changelog

## [Unreleased]

- **Enhancement**: Fixed structured logging in `functions/src/debug-logger.js` to preserve
  all metadata fields in GCP Cloud Logging for advanced filtering and monitoring.
- **Security**: Enhanced log analysis script (`analyze-logs.cjs`) to prevent shell injection
  by replacing `execSync` with `spawnSync` and proper argument arrays.
- **Reliability**: Fixed async/await handling in log analysis CLI to prevent premature
  process exit before analysis completion.
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
- **Docs**: Updated `docs/README.md` index to include the Debugging Toolkit link for easier discovery.
- **Fix**: Corrected WSDL endpoint secret (`tebra-wsdl-url`) to use service endpoint instead of WSDL query string.
- **Fix**: Updated `TebraHttpClient.php` to use proper `SOAPAction` namespace (`http://www.kareo.com/ServiceContracts/2.1/`) matching Tebra documentation.
- **Security**: Removed legacy HTTP Basic Auth; authentication is now provided exclusively via SOAP headers.
- **Enhancement**: Refactored `TebraHttpClient.php` methods (`getPatients`, `getProviders`, `getAppointments`) to follow the exact official Tebra PHP example pattern, validated against live API.
- **Note**: Cloud Run deployment successful (revision `tebra-php-api-00019-xs8`); remaining "Unable to find user" error under investigation with Tebra support.

### Fixed

- **Cloud Functions**: `functions/index.js` now caches Auth0 domain, audience and JWKS client at module scope, avoiding repeated Secret-Manager calls on warm invocations.
- **Status Mapping**: Added common variants (`no-show`, `checked-in`, `ready for m.d.` etc.) in `functions/src/tebra-sync/status-map.(ts|js)` to prevent silent mis-mappings.
- **Compilation**: Added auto-generated `status-map.js` next to TypeScript file so Node (CommonJS) `require` succeeds during function deploy.
- **Firestore Save**: `src/services/firebase/dailySessionService.ts` now strips `undefined` values and encrypts patient data, fixing "Unsupported field value" runtime errors.
- **ReportModal**: Introduced local `escapeHtml` helper eliminating missing identifier error and improving XSS safety when printing reports.
- **Type Safety**: Replaced `any` casts in `PatientSection.tsx`, `test-tebra-appointments.ts`, and tightened `patientSections` constant typing to `PatientApptStatus`.
- **Lint**: Addressed ESLint `prefer-const` and `no-explicit-any` warnings across several files.

### Security

- **Credential Redaction**: Debug scripts `tebra-tools/test-tebra-env.php` and `test-tebra.php` now redact `<Password>` elements and gate verbose output behind `TEBRA_VERBOSE` env flag.

### Docs

- Updated CHANGELOG with these entries; remember to bump version when releasing.

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
