#!/bin/bash

echo "🧹 Fixing Dashboard.tsx issues..."

# Backup original
cp src/components/Dashboard.tsx src/components/Dashboard.tsx.backup

# Fix: Remove unused destructured variables in generateReportContent
sed -i '' '/const { getCurrentTime, timeMode } = this.props.timeContext;/d' src/components/Dashboard.tsx

# Fix: Remove the entire unused generateReportContent method
sed -i '' '/private generateReportContent = /,/^  };$/d' src/components/Dashboard.tsx

# Fix: Remove unused expandedSection from render destructuring
sed -i '' 's/expandedSection,//g' src/components/Dashboard.tsx

# Fix: Shorten import path
sed -i '' 's|import { Patient } from '\''../types/index'\'';|import { Patient } from '\''../types'\'';|' src/components/Dashboard.tsx

echo "✅ Fixed unused variables and imports!"
