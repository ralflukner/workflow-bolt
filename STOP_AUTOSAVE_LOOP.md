# Stop Auto-Save Loop

## Quick Fix

The PatientContext is continuously auto-saving because the `storageService` dependency is being recreated on each render.

## Solution

In `src/context/PatientContext.tsx`, around line 178, change:

```typescript
// FROM:
}, [patients, persistenceEnabled, isLoading, storageService, storageType, useFirebase, firebaseReady]);

// TO:
}, [patients, persistenceEnabled, isLoading, storageType, useFirebase, firebaseReady]);
```

Remove `storageService` from the dependency array since it's derived from `useFirebase` and `firebaseReady`.

## Alternative: Use useMemo

Wrap the storageService selection in useMemo:

```typescript
const storageService = useMemo(() => {
  return useFirebase && firebaseReady ? dailySessionService : localSessionService;
}, [useFirebase, firebaseReady]);
```

This will prevent the service from being recreated unnecessarily.
