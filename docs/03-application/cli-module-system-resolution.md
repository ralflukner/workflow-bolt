# CLI Module System Resolution Design

**Author:** Claude o3 MAX • **Date:** 2025-07-03

## 1  Background

The root project is configured as an **ES Module** workspace (`"type": "module"` in `package.json`).
The oclif-based CLI, however, was compiling to **CommonJS** (CJS) via `tsconfig.cli.json` (`"module": "CommonJS"`).
Running the generated binaries (`dist/cli/bin/workflow-test`) therefore throws runtime errors like

```
Error [ERR_REQUIRE_ESM]: require() of ES Module … not supported.
```

## 2  Goals & Success Criteria

1. `npm run build:cli` produces an executable CLI that runs with a plain `node` invocation (no experimental flags).
2. The CLI build integrates cleanly with the existing ES Module project—no separate package boundaries required.
3. CI passes and all existing CLI commands (import, verify, test-runner, health-check) work unchanged.

## 3  Options Considered

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A** | Keep CJS output; ship a secondary `package.json` inside `dist/cli` with `"type": "commonjs"`. | Minimal TypeScript change; oclif defaults to CJS. | Adds nested package management; complicates path resolution; diverges from project-wide ESM standard. |
| **B** | Switch CLI build to **ESM** (`"module": "ES2020"`) and rely on Node ≥ 18 native ESM support. | Aligns with root project; single module system; future-proof. | Requires updating oclif bin stub to `import` style; some plugins may still assume `require`. |
| **C** | Skip transpilation and run CLI via **ts-node** in ESM mode. | Zero build step; perfect type alignment. | Slower startup; larger runtime deps; unsuitable for production distributions. |

## 4  Decision

**Option B (Full ESM Build)** is chosen.

Rationale:

* Keeps the entire codebase consistent under a single module paradigm.
* Supported by `@oclif/core` v3 which can operate in ESM mode.
* Avoids additional packaging or runtime dependencies.

## 5  Implementation Plan

1. **tsconfig.cli.json**
   * Change `"module": "ES2020"` (was `CommonJS`).
   * Ensure `"target": "ES2020"` (already set).
   * Remove obsolete compiler options that force CJS semantics.
2. **Build Script**
   * `package.json` `scripts.build:cli` already calls `tsc --project tsconfig.cli.json` → unchanged.
3. **CLI Bin Stub** (`src/cli/bin/workflow-test.ts`)
   * Replace `require('../commands')` with dynamic import: `import('../commands');` if necessary.
   * Ensure shebang remains `#!/usr/bin/env node`.
4. **Package Exports**
   * Root `package.json`: add an `exports` entry for the CLI binary if needed:
   ```json
   "bin": {
     "workflow-test": "./dist/cli/bin/workflow-test.js"
   }
   ```
   (Already present, verify extension correctness.)
5. **CI Pipeline**
   * Extend existing workflow to run `npm run build:cli && node dist/cli/bin/workflow-test --help`.
6. **Regression Tests**
   * Add Jest integration tests under `src/__tests__/cli/` that spawn the built binary via `execa` and assert command output.
7. **Documentation Updates**
   * Update `docs/03-application/README.md` with CLI build instructions.

## 6  Rollback Strategy

If incompatibilities arise, revert tsconfig changes and adopt Option A by shipping a nested `package.json` marking `dist/cli` as CJS.

## 7  Timeline

| Task | Owner | ETA |
|------|-------|-----|
| tsconfig update & local build verification | Claude Code (Interactive) | **Today** |
| Bin stub adjustment | Claude Code | Today |
| Jest CLI integration tests | Claude o3 MAX | +1 day |
| CI workflow update | Claude o3 MAX | +1 day |
| Documentation & PR | Both | +2 days |

---

*Approved changes will be executed in subsequent commits once design is reviewed.*
