# Workflow Bolt Documentation

Welcome to the Workflow Bolt documentation. This directory contains comprehensive documentation for all aspects of the application, including architecture, security, debugging guides, and integration details.

## 📁 Documentation Structure

### Core Documentation Areas

#### [00-overview/](00-overview/)

High-level overview of the system, its purpose, and key features.

#### [01-compliance/](01-compliance/)

HIPAA compliance documentation, security policies, and regulatory requirements.

- [Encryption Key Rotation](01-compliance/encryption-key-rotation.md)

#### [02-infrastructure/](02-infrastructure/)

Infrastructure setup, deployment configurations, and cloud services.

#### [03-application/](03-application/)

Application-specific documentation including frontend and backend details.

#### [04-ops/](04-ops/)

Operational procedures, monitoring, and maintenance guides.

#### [05-governance/](05-governance/)

Governance policies, development workflows, and team procedures.

### Specialized Documentation

#### [api/](api/)

API documentation, endpoints, and integration guides.

- [FHIR API Documentation](api/FHIR-API-Documentation.txt)
- [Macra Open API Documentation](api/macra-open-api-documentation.txt)
- [Tebra API Examples](api/tebra_api_examples.php)

#### [architecture/](architecture/)

System architecture, design patterns, and technical decisions.

- [System Architecture](architecture/architecture.md)
- [Component Design](architecture/component-design.md)
- [Data Model](architecture/data-model.md)
- [Directory Structure](architecture/directory-structure.md)
- [Firebase Persistence Plan](architecture/firebase-persistence-plan.md)
- [Persistence Implementation](architecture/PERSISTENCE_IMPLEMENTATION.md)

#### [debugging/](debugging/)

Debugging guides, troubleshooting, and diagnostic tools.

- [Debug Toolkit](debugging/DEBUG-TOOLKIT.md)
- [Tebra Debug Summary](debugging/TEBRA_DEBUG_SUMMARY.md)
- [Tebra Fixes Summary](debugging/TEBRA_FIXES_SUMMARY.md)
- [Correlation ID Implementation](debugging/correlation-id-implementation.md)
- [OpenTelemetry Integration](debugging/opentelemetry-integration.md)
- [Monitoring Setup](debugging/MONITORING_SETUP.md)
- [Advanced Debugging Features](debugging/advanced-debugging-features.md)
- [Debugging Tools Summary](debugging/debugging-tools-summary.md)

#### [deployment/](deployment/)

Deployment guides, CI/CD configurations, and release procedures.

- [Deployment Complete Guide](deployment/DEPLOYMENT_COMPLETE.md)
- [Tebra PHP Deployment](deployment/TEBRA_PHP_DEPLOYMENT_COMPLETE.md)
- [Deploy Tebra Fix](deployment/DEPLOY-TEBRA-FIX.md)
- [Netlify Deployment Summary](deployment/netlify-deployment-summary.md)
- [Deployment Fix Guide](deployment/deployment-fix-guide.md)

#### [security/](security/)

Security documentation, HIPAA compliance, and access controls.

- [Security Overview](security/SECURITY.md)
- [HIPAA Setup Guide](security/HIPAA_SETUP_GUIDE.md)
- [HIPAA Security Fixes](security/SECURITY_HIPAA_FIXES_20250623.md)
- [Patient Encryption Resolved](security/PATIENT_ENCRYPTION_RESOLVED.md)
- [Patient Encryption Repair](security/patient-encryption-repair.md)
- [Debug Endpoint Security](security/debug-endpoint-security.md)
- [Debug Endpoint Security Summary](security/debug-endpoint-security-summary.md)

#### [setup/](setup/)

Installation guides, environment setup, and configuration.

- [Environment Setup](setup/ENVIRONMENT_SETUP.md)
- [Firebase Setup](setup/FIREBASE_SETUP.md)
- [Firebase CLI Auth](setup/FIREBASE_CLI_AUTH.md)
- [Setup Guide](setup/setup-guide.md)
- [Auth Setup](setup/auth-setup.md)
- [OAuth Secret Guide](setup/oauth-secret-guide.md)

#### [tebra-integration/](tebra-integration/)

Comprehensive Tebra EHR integration documentation.

- [Tebra API URL Config](tebra-integration/TEBRA_API_URL_CONFIG.md)
- [Tebra Integration Summary](tebra-integration/tebra-integration-summary.md)
- [Tebra Cloud Run Design](tebra-integration/tebra-cloudrun-design.md)
- [Tebra Debugging Strategy](tebra-integration/tebra-debugging-strategy-guide.md)
- [Tebra Functions Usage](tebra-integration/tebra-functions-usage.md)
- [Tebra PHP Migration](tebra-integration/TEBRA_PHP_MIGRATION.md)
- [Tebra API Failures](tebra-integration/tebra-api-failures.md)
- [Tebra Credential Rotation](tebra-integration/tebra-credential-rotation.md)
- [Tebra Debug Dashboard Guide](tebra-integration/tebra-debug-dashboard-guide.md)
- [Phase 1 SOAP Auth Fix Design](tebra-integration/PHASE1_SOAP_AUTH_FIX_DESIGN.md)
- [Phase 2 Instrumentation Design](tebra-integration/PHASE_2_INSTRUMENTATION_DESIGN.md)

#### [security-wiki/](security-wiki/)

Security knowledge base and incident response procedures.

- [Security Wiki Home](security-wiki/Home.md)
- [Incident Response](security-wiki/Incident-Response.md)

## 🚀 Quick Start Guides

### For New Developers

1. Start with [Environment Setup](setup/ENVIRONMENT_SETUP.md)
2. Review [System Architecture](architecture/architecture.md)
3. Check [Component Design](architecture/component-design.md)
4. Read [CLAUDE.md](CLAUDE.md) for AI assistant context

### For DevOps Engineers

1. Read [Deployment Guide](deployment/DEPLOYMENT_COMPLETE.md)
2. Review [Firebase Setup](setup/FIREBASE_SETUP.md)
3. Check [Monitoring Setup](debugging/MONITORING_SETUP.md)
4. Study [OpenTelemetry Integration](debugging/opentelemetry-integration.md)

### For Security/Compliance Officers

1. Review [HIPAA Setup Guide](security/HIPAA_SETUP_GUIDE.md)
2. Check [Security Overview](security/SECURITY.md)
3. Read [Incident Response](security-wiki/Incident-Response.md)
4. Review [Patient Encryption](security/PATIENT_ENCRYPTION_RESOLVED.md)

### For Debugging Issues

1. Use [Debug Toolkit](debugging/DEBUG-TOOLKIT.md)
2. Check [Tebra Debug Summary](debugging/TEBRA_DEBUG_SUMMARY.md)
3. Review [Correlation ID Implementation](debugging/correlation-id-implementation.md)
4. See [Debugging Strategy Guide](tebra-integration/tebra-debugging-strategy-guide.md)

## 📋 Key Reference Documents

### Project Management

- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)** - Summary of recent changes
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Overall implementation summary
- **[VERSIONING.md](VERSIONING.md)** - Versioning strategy and guidelines

### Development Guidance

- **[CLAUDE.md](CLAUDE.md)** - AI assistant instructions and context
- **[instructions.md](instructions.md)** - Development instructions
- **[overview.md](overview.md)** - System overview

### Recent Updates

- **[recent-changes.md](recent-changes.md)** - Latest updates
- **[summary-of-changes.md](summary-of-changes.md)** - Change summaries
- **[state-management-improvements.md](state-management-improvements.md)** - State management updates

## 🔍 Finding Information Quickly

### By Technical Topic

- **Authentication & Auth0**: [auth-setup.md](setup/auth-setup.md), [oauth-secret-guide.md](setup/oauth-secret-guide.md)
- **Database & Persistence**: [data-model.md](architecture/data-model.md), [firebase-persistence-plan.md](architecture/firebase-persistence-plan.md)
- **API Integration**: [api/](api/) directory, [tebra-integration/](tebra-integration/) directory
- **Troubleshooting**: [debugging/](debugging/) directory
- **Security & HIPAA**: [security/](security/) directory
- **Monitoring & Observability**: [OpenTelemetry Integration](debugging/opentelemetry-integration.md), [Monitoring Setup](debugging/MONITORING_SETUP.md)

### By System Component

- **Frontend (React)**: [component-design.md](architecture/component-design.md), [03-application/](03-application/)
- **Backend (Firebase Functions)**: [architecture/](architecture/), [tebra-functions-usage.md](tebra-integration/tebra-functions-usage.md)
- **Infrastructure**: [02-infrastructure/](02-infrastructure/), [deployment/](deployment/)
- **Tebra Integration**: [tebra-integration/](tebra-integration/) directory

### By Use Case

- **Setting up development environment**: [ENVIRONMENT_SETUP.md](setup/ENVIRONMENT_SETUP.md)
- **Debugging Tebra sync issues**: [TEBRA_DEBUG_SUMMARY.md](debugging/TEBRA_DEBUG_SUMMARY.md)
- **Deploying to production**: [DEPLOYMENT_COMPLETE.md](deployment/DEPLOYMENT_COMPLETE.md)
- **Handling security incidents**: [Incident-Response.md](security-wiki/Incident-Response.md)

## 📝 Documentation Standards

- All markdown files must pass markdown-lint validation
- Use clear, descriptive filenames (kebab-case for consistency)
- Include table of contents for documents longer than 3 sections
- Cross-reference related documents using relative links
- Keep documents synchronized with code changes
- Archive outdated documents with `.bak` extension

## 🤝 Contributing to Documentation

When adding new documentation:

1. Place it in the appropriate subdirectory based on topic
2. Update this README.md with a link in the relevant section
3. Ensure it passes markdown-lint (`markdownlint-cli2 --fix your-file.md`)
4. Add cross-references to related documents
5. Update [CHANGELOG.md](CHANGELOG.md) if it's a significant addition
6. Consider updating [CLAUDE.md](CLAUDE.md) if it affects AI assistance

## 🔧 Maintenance Guidelines

- **Quarterly Review**: Review and update all documentation
- **Archive Policy**: Move outdated docs to `.bak` files
- **Link Validation**: Check all internal links monthly
- **Version Sync**: Update docs with each release
- **Security Review**: Audit security docs with each HIPAA review

## 📊 Documentation Coverage

| Area | Status | Last Updated |
|------|--------|--------------|
| Architecture | ✅ Complete | 2025-06 |
| Security/HIPAA | ✅ Complete | 2025-06 |
| Tebra Integration | ✅ Complete | 2025-06 |
| Debugging/Monitoring | ✅ Complete | 2025-06 |
| Deployment | ✅ Complete | 2025-06 |
| API Documentation | 🔶 Partial | 2025-06 |

---

*For questions about documentation, consult [CLAUDE.md](CLAUDE.md) or reach out to the development team.*
