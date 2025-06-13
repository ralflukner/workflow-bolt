#!/bin/bash

# Find all markdown files, excluding node_modules and vendor directories
find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/vendor/*" | while read file; do
  echo "Processing $file"
  
  # Ensure headings have exactly one blank line before and after
  sed -i '' -E 's/^[[:space:]]*$//g' "$file"  # Remove lines with only whitespace
  sed -i '' -E 's/\n{3,}/\n\n/g' "$file"      # Replace 3+ newlines with 2
  
  # Ensure file ends with exactly one newline
  sed -i '' -E '$a\' "$file"
  
  echo "Done processing $file"
done

echo "All markdown files processed."