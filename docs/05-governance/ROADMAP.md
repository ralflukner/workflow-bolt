# Workflow-Bolt – Master Road-Map

_Authoritative source of near-term and long-term work items.  All previous mini-plans will be folded into this file.  Last updated: 2025-07-01 10:05 EDT_

---

## 1  Live phases (2025-Q3)

| ID | Area | Target date | Owner | Status |
|----|------|-------------|--------|--------|
| P-1 | Dashboard hook→class migration | 2025-07-08 | FE team | 🟡 9/22 components converted |
| P-2 | Documentation re-organisation | 2025-07-05 | Docs WG | 🟡 in-progress |
| P-3 | Encryption redesign (SecureStorage v2) | 2025-07-15 | Security | ⏳ not-started |
| P-4 | Test/CI green-up | 2025-07-10 | QA | 🔴 failing 12 suites |
| P-5 | CLI (oclif) scaffolding | 2025-07-01 | Tools | 🟡 scaffolding committed (1f6017a0) |

---

## 2  Active backlogs

### 2.1  Dashboard migration checklist  

(ref: `docs/03-application/dashboard-class-refactor-log.md`)

- [x] Container component created  
- [ ] Convert `MonitoringStatus`  
- [ ] Convert `PersistenceStatus`  
- [ ] …

### 2.2  Test/CI repair tasks

- Update placeholder queries in weekday-import tests  
- Align SecureStorage v2 test expectations  
- Re-record obsolete snapshot  
- Ensure `npm run test` green locally & CI

### 2.3  Encryption redesign tasks

- Drop redundant IV field, embed IV in ciphertext  
- Envelope encryption helpers (`keyVault.ts`)  
- Monthly KEK rotation Cloud Scheduler job  
- Update SecureStorage unit tests

---

## 3  Milestone calendar

| Milestone | Date | Definition of Done |
|-----------|------|--------------------|
| **0.2.0-alpha** | 2025-07-18 | All tests green, docs re-org finished, SecureStorage v2 shipped |
| **0.2.0 GA** | 2025-08-01 | CLI MVP + dashboard migration complete |

---

## 4  How to update this file

1. Add a new row in the phase table with emoji status: 🟢 done · 🟡 in-progress · 🔴 blocked · ⏳ not-started.  
2. Update "Last updated" stamp.  
3. Commit with `docs(roadmap): …` and push.

---

## 5  Related documents

• Change-log: `CHANGES_SUMMARY.md`  
• Detailed dashboard log: `../03-application/dashboard-class-refactor-log.md`  
• Doc re-org tracker: `DOCUMENTATION_REORG_PLAN.md`  _(to be archived after Phase-2)_
