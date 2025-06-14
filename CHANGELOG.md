# Changelog

All notable changes to the Tebra Proxy service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-03-20

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

## [Unreleased]

### Planned
- Enhanced error handling
- Request rate limiting
- API response caching
- Metrics collection
- Audit logging 