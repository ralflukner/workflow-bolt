# HIPAA Audit Log

| Timestamp           | Endpoint            | User ID / IP         | Action         | Status      |
|---------------------|---------------------|----------------------|---------------|-------------|
| 2025-07-05T12:00Z   | /getFirebaseConfig  | user:abc123          | access         | success     |
| 2025-07-05T12:01Z   | /getFirebaseConfig  | ip:1.2.3.4           | access         | denied (401)|
| ...                 | ...                 | ...                  | ...           | ...         |

Log all access attempts, especially failures, for compliance review. 