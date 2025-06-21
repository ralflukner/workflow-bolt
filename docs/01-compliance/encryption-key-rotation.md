# Encryption Key Rotation & Multi-Key Strategy

_Last updated: 2025-06-19_

## 1. Why We Need More Than One Key

Patient data (PHI) **must remain readable for decades**, yet the cryptographic landscape regularly evolves.  The safest way to avoid mass-re-encryption events and to limit the blast-radius of a single key compromise is to:

1. Use **multiple keys** for different records / segments.
2. Rotate keys on a predictable schedule (or ad-hoc in response to incidents).
3. Keep track of **which key version** protected which piece of data.

> _"Having multiple key versions adds another layer of security – an attacker would need to obtain **every** key to decrypt the full dataset."_

## 2. What This Architecture Is Called

Depending on which slice of the security world you come from, you may hear several overlapping terms.  Our implementation combines **all** of these patterns:

| Term | Short Definition | Where It Appears |
|------|------------------|------------------|
| **Hierarchical Key Management (HKM)** | Multiple keys organised in parent ➜ child relationships (e.g., master ⭢ data keys). | HSMs, Google KMS |
| **Envelope Encryption** | Data is encrypted with a **Data Encryption Key (DEK)**, which itself is encrypted with a **Key Encryption Key (KEK)**. | AWS KMS, GCP KMS |
| **Field-Level / Segmented Encryption** | Different attributes or segments of a record are encrypted with distinct keys. | MongoDB FLE, financial systems |
| **Key Versioning** | Each logical key can have multiple cryptoperiod versions (v1, v2, …). | All cloud KMS providers |
| **Lazy / Progressive Rekeying** | Rotate keys gradually; re-encrypt data on read or in small batches. | Google "Crypto Shredding" white-paper |
| **Crypto-Shredding** | Rendering data unreadable by deleting the corresponding key version. | GDPR Right-to-be-Forgotten |
| **Rolling / Partial Re-encryption** | Rotate keys for a subset (e.g., patient cohort) without halting the system. | Large-scale databases |

## 3. How We Implement It

1. **Encrypted payload format** is JSON containing:
   ```jsonc
   {
     "v": 3,           // key version
     "alg": "AES-256-GCM",
     "iv": "…",
     "ciphertext": "…"
   }
   ```
2. **Key storage**
   • All DEKs live in Google Secret Manager (per-version secrets named `PATIENT_ENC_KEY_v{n}`).
   • A small wrapper service supplies keys to authorised Cloud Run & Firebase Functions.
3. **Rotation workflow**
   1. Generate new DEK via `scripts/rotate-patient-enc-key.sh` (coming soon 🛠️).
   2. Mark it **active** in Firestore `config/security` doc.
   3. App picks up the new key and starts encrypting _new_ data with it.
   4. Background job re-encrypts _old_ documents in small batches.
4. **Partial key rotation**
   • Helper in `src/services/encryption/partialKeyRotation.ts` can re-encrypt only selected "segments".

## 4. Threat-Modelling Benefits

• **Forward & backward secrecy** – older keys can be disabled without breaking new writes; new keys can't read historical data without access to their version.
• **Reduced blast radius** – key compromise only affects the cohort encrypted with that key version.
• **Fast incident response** – revoke or shred a compromised version and re-encrypt affected records.

## 5. Related Code & Docs

| Component | Location |
|-----------|----------|
| Encryption service | `src/services/encryption/patientEncryptionService.ts` |
| Key rotation helper | `src/services/encryption/keyRotationStrategy.ts` |
| Partial rotation helper | `src/services/encryption/partialKeyRotation.ts` |
| Patient encryption repair guide | `docs/patient-encryption-repair.md` |

---

_Questions? Open an issue in the **Docs Cleanup 2025** project board._
