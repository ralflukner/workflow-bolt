# Versioning Scheme

This document outlines the versioning scheme used for the Tebra Proxy service.

## Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) with the format:

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes that require migration steps
- **MINOR**: New features in a backward-compatible manner
- **PATCH**: Backward-compatible bug fixes

## Version Tags

Container images are tagged using the following format:
```
v{MAJOR}.{MINOR}.{PATCH}
```

Example: `v1.0.0`

## Release Process

1. **Development**
   - Work happens on feature branches
   - Changes are merged to main branch
   - CI/CD pipeline runs tests

2. **Version Bump**
   - Update version in CHANGELOG.md
   - Tag the release in gi
   - Build and push container image

3. **Deployment**
   - Update cloudrun.yaml with new version
   - Deploy to staging environmen
   - Verify functionality
   - Deploy to production

## Version Lifecycle

- **Current**: Latest stable version
- **Previous**: Last stable version (for rollback)
- **Next**: Version in developmen

## Breaking Changes

Breaking changes require:
1. MAJOR version bump
2. Migration guide
3. Deprecation notice
4. Backward compatibility layer (if possible)

## Security Updates

Security patches:
1. Get highest priority
2. May skip normal release cycle
3. Require immediate deploymen
4. Must be documented in CHANGELOG.md

## Rollback Procedure

1. Identify the issue
2. Locate last known good version
3. Update cloudrun.yaml
4. Deploy rollback version
5. Document in CHANGELOG.md