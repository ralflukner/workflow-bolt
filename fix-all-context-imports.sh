#!/bin/bash

echo "🔧 Fixing context import paths..."

# Update usePatientContext hook
echo "Updating usePatientContext hook..."
cat > src/hooks/usePatientContext.ts << 'HOOK'
import { useContext } from 'react';
import PatientContext from '../contexts/PatientContext';

export function usePatientContext() {
  const context = useContext(PatientContext);
  
  if (!context) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  
  return context;
}
HOOK

# Update TebraDebugDashboardContainer
echo "Updating TebraDebugDashboardContainer..."
sed -i '' 's|@/context/PatientContextDef|../contexts/PatientContext|g' src/components/TebraDebugDashboardContainer.tsx
sed -i '' 's|@/context/PatientContextType|../contexts/PatientContext|g' src/components/TebraDebugDashboardContainer.tsx

# Update WorkflowStatusTracker
echo "Updating WorkflowStatusTracker..."
sed -i '' 's|../context/PatientContextDef|../contexts/PatientContext|g' src/components/WorkflowStatusTracker.tsx

# Update useTimeContext hook
echo "Updating useTimeContext hook..."
sed -i '' 's|../context/TimeContextDef|../contexts/TimeContext|g' src/hooks/useTimeContext.ts

echo "✅ All imports updated!"
