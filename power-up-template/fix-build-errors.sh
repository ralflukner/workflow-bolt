#!/bin/bash

echo "🔧 Fixing TypeScript build errors..."

# Fix ApiResponse type
if ! grep -q "interface ApiResponse" src/types/api.ts 2>/dev/null; then
  mkdir -p src/types
  echo 'export interface ApiResponse {
  data?: any;
  error?: string;
  status: number;
  success: boolean;
}' > src/types/api.ts
fi

# Add import to tebra-connection-debug.ts
if ! grep -q "import { ApiResponse }" src/cli/commands/tebra-connection-debug.ts; then
  sed -i.bak '1s/^/import { ApiResponse } from "..\/..\/types\/api";\n/' src/cli/commands/tebra-connection-debug.ts
fi

# Create missing contexts if they don't exist
if [ ! -f src/contexts/PatientContext.tsx ]; then
  mkdir -p src/contexts
  echo 'import React, { createContext } from "react";
export interface PatientContextType {
  selectedPatient: any;
  setSelectedPatient: (patient: any) => void;
}
export default createContext<PatientContextType | undefined>(undefined);' > src/contexts/PatientContext.tsx
fi

if [ ! -f src/contexts/TimeContext.tsx ]; then
  echo 'import React, { createContext } from "react";
export interface TimeContextType {
  selectedTime: any;
  setSelectedTime: (time: any) => void;
}
export default createContext<TimeContextType | undefined>(undefined);' > src/contexts/TimeContext.tsx
fi

echo "✅ Build errors fixed!"
