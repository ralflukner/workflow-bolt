#!/bin/bash
set -euo pipefail

# This script fixes common markdownlint issues in markdown files
# Usage: ./fix-markdownlint.sh [file1.md file2.md ...]
# If no files are provided, it will find and process all markdown files in the repository

# Process files provided as arguments or find all markdown files
if [ $# -eq 0 ]; then
  echo "No files provided. Finding all markdown files in the repository..."
  # Find all markdown files in the repository (compatible with older Bash versions)
  FILES=()
  while IFS= read -r file; do
    FILES+=("$file")
  done < <(find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/vendor/*")
else
  # Use files provided as arguments
  FILES=("$@")
fi

# Validate that only markdown files are processed
for file in "${FILES[@]}"; do
  # Skip if file doesn't exist
  if [ ! -f "$file" ]; then
    echo "Warning: File $file does not exist. Skipping."
    continue
  fi

  # Check if file is a markdown file
  if [[ "$file" != *.md ]]; then
    echo "Warning: $file is not a markdown file. Skipping to prevent corruption."
    continue
  fi

  echo "Fixing markdownlint issues in $file..."

  # Create a backup
  cp "$file" "$file.bak"

  # Fix MD022/blanks-around-headings: Headings should be surrounded by blank lines
  # Add blank line before headings if not already present
  # Detect GNU vs BSD sed
  if sed --version >/dev/null 2>&1; then
    # GNU
    SED_INPLACE=(-i.tmp -E)
  else
    # BSD
    SED_INPLACE=(-i '' -E)
  fi
  sed "${SED_INPLACE[@]}" 's/^([^#\n][^\n]*)\n(#+ )/\1\n\n\2/g' "$file"
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
