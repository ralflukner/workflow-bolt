# CI/CD Security Gate Integration

Add the following to your CI/CD pipeline (e.g., .gitlab-ci.yml or GitHub Actions):

```yaml
security-check:
  script:
    - bash functions/security-scan.sh
    - npm run security:check-dependencies
    - gcloud alpha firestore databases get-iam-policy
  rules:
    - if: $CI_MERGE_REQUEST_ID
```

Update scripts and endpoints as needed to ensure all security checks pass before deployment.
