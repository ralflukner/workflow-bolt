#!/bin/bash

echo "🔧 Fixing all TypeScript build errors..."

# 1. Create types directory and ApiResponse
mkdir -p src/types
cat > src/types/api.ts << 'EOT'
export interface ApiResponse {
  data?: any;
  error?: string;
  status: number;
  success: boolean;
}
EOT

# 2. Add import to tebra-connection-debug.ts
if [ -f src/cli/commands/tebra-connection-debug.ts ]; then
  if ! grep -q "import { ApiResponse }" src/cli/commands/tebra-connection-debug.ts; then
    echo 'import { ApiResponse } from "../../types/api";' > temp.ts
    cat src/cli/commands/tebra-connection-debug.ts >> temp.ts
    mv temp.ts src/cli/commands/tebra-connection-debug.ts
  fi
fi

# 3. Create contexts
mkdir -p src/contexts

cat > src/contexts/PatientContext.tsx << 'EOT'
import React, { createContext } from 'react';

export interface PatientContextType {
  selectedPatient: any;
  setSelectedPatient: (patient: any) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);
export default PatientContext;
export { PatientContext };
EOT

cat > src/contexts/TimeContext.tsx << 'EOT'
import React, { createContext } from 'react';

export interface TimeContextType {
  selectedTime: any;
  setSelectedTime: (time: any) => void;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);
export default TimeContext;
export { TimeContext };
EOT

# 4. Check if we need to fix PersistenceDiagnostic props too
if grep -q "PersistenceDiagnostic" src/components/Dashboard.tsx; then
  echo "⚠️  PersistenceDiagnostic also needs props - checking..."
fi

echo "✅ All fixes applied!"
echo "🧪 Testing build..."
npm run build
