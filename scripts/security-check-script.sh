#!/bin/bash

# Security check script to verify credentials have been removed from Git history
# Run this after cleaning your repository

echo "=== Git Repository Security Check ==="
echo "Checking for exposed credentials in Git history..."
echo

# Define sensitive patterns to search for
PATTERNS=(
    "ZEp7U8-VeHuza@luknerclinic.com"
    "8<O{*a3SF297i]CDFW5mmZ&asx519M"
    "j57wt68dc39q"
    "password.*=.*['\"].*['\"]"
    "customerKey.*=.*['\"].*['\"]"
)

FOUND_ISSUES=0

# Check current working directory
echo "1. Checking working directory..."
for pattern in "${PATTERNS[@]}"; do
    if grep -r "$pattern" . --exclude-dir=.git --exclude-dir=vendor --exclude-dir=node_modules 2>/dev/null; then
        echo "⚠️  WARNING: Found sensitive data in working directory matching: $pattern"
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
    fi
done

if [ $FOUND_ISSUES -eq 0 ]; then
    echo "✓ Working directory is clean"
fi

# Check Git history
echo -e "\n2. Checking Git history..."
HISTORY_ISSUES=0

for pattern in "${PATTERNS[@]}"; do
    if git log -p -G"$pattern" --all 2>/dev/null | grep -q "$pattern"; then
        echo "⚠️  WARNING: Found sensitive data in Git history matching pattern"
        HISTORY_ISSUES=$((HISTORY_ISSUES + 1))
        
        # Show which commits contain the pattern
        echo "   Commits containing sensitive data:"
        git log --pretty=format:"   - %h %s" -G"$pattern" --all | head -5
        echo
    fi
done

if [ $HISTORY_ISSUES -eq 0 ]; then
    echo "✓ Git history is clean"
else
    echo "⚠️  Found $HISTORY_ISSUES sensitive patterns in Git history"
    echo "   You must clean the Git history before pushing!"
fi

# Check for security files
echo -e "\n3. Checking for security best practices..."
SECURITY_SCORE=0

if [ -f ".gitignore" ]; then
    echo "✓ .gitignore exists"
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    
    # Check if .gitignore contains important patterns
    if grep -q "\.env" .gitignore; then
        echo "✓ .env is in .gitignore"
        SECURITY_SCORE=$((SECURITY_SCORE + 1))
    else
        echo "⚠️  .env is not in .gitignore"
    fi
else
    echo "⚠️  No .gitignore file found"
fi

# Check for accidentally committed files
echo -e "\n4. Checking for accidentally tracked sensitive files..."
SENSITIVE_FILES=(
    ".env"
    "credentials.json"
    "service-account.json"
    "*.key"
    "*.pem"
)

for file_pattern in "${SENSITIVE_FILES[@]}"; do
    if git ls-files | grep -E "$file_pattern" 2>/dev/null; then
        echo "⚠️  WARNING: Sensitive file tracked in Git: $file_pattern"
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
    fi
done

# Summary
echo -e "\n=== Security Check Summary ==="
if [ $FOUND_ISSUES -eq 0 ] && [ $HISTORY_ISSUES -eq 0 ]; then
    echo "✅ Repository appears to be clean!"
    echo "   Security score: $SECURITY_SCORE/2"
else
    echo "❌ Security issues found!"
    echo "   - Working directory issues: $FOUND_ISSUES"
    echo "   - Git history issues: $HISTORY_ISSUES"
    echo ""
    echo "⚠️  URGENT: Do not push to remote until these issues are resolved!"
    echo "   Follow the cleanup instructions in the setup guide."
fi

# Additional recommendations
echo -e "\n=== Recommendations ==="
echo "1. Rotate all exposed credentials immediately"
echo "2. Enable 2FA on all service accounts"
echo "3. Set up secret scanning in your repository"
echo "4. Use Google Secret Manager for all sensitive data"
echo "5. Regular security audits of your codebase"