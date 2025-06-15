#!/bin/bash
set -euo pipefail

# This script fixes common markdownlint issues in markdown files

# Files to fix
FILES=(
  ".github/workflows/security-check.yml"
  "docs/instructions.md"
)

for file in "${FILES[@]}"; do
  echo "Fixing markdownlint issues in $file..."
  
  # Create a backup
  cp "$file" "$file.bak"
  
  # Fix MD022/blanks-around-headings: Headings should be surrounded by blank lines
  # Add blank line before headings if not already present
  sed -i.tmp -E 's/^([^#\n][^\n]*)\n(#+ )/\1\n\n\2/g' "$file"
  # Add blank line after headings if not already present
  sed -i.tmp -E 's/^(#+ [^\n]*)\n([^#\n][^\n]*)/\1\n\n\2/g' "$file"
  
  # Fix MD032/blanks-around-lists: Lists should be surrounded by blank lines
  # Add blank line before lists if not already present
  sed -i.tmp -E 's/([^\n-])\n(- )/\1\n\n\2/g' "$file"
  # Add blank line after lists if not already present
  sed -i.tmp -E 's/(- [^\n]*)\n([^-\n])/\1\n\n\2/g' "$file"
  
  # Fix MD031/blanks-around-fences: Fenced code blocks should be surrounded by blank lines
  # Add blank line before fenced code blocks if not already present
  sed -i.tmp -E 's/([^\n])\n(```)/\1\n\n\2/g' "$file"
  # Add blank line after fenced code blocks if not already present
  sed -i.tmp -E 's/(```)\n([^\n])/\1\n\n\2/g' "$file"
  
  # Fix MD009/no-trailing-spaces: No trailing spaces
  sed -i.tmp -E 's/[ \t]+$//g' "$file"
  
  # Fix MD047/single-trailing-newline: Files should end with a single newline
  # Ensure file ends with exactly one newline
  sed -i.tmp -E '$a\' "$file"
  
  # Remove temporary files
  rm -f "$file.tmp"
  
  echo "Fixed markdownlint issues in $file"
done

echo "All files fixed successfully!"