#!/usr/bin/env bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
TOOLS_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$TOOLS_ROOT")"

set -euo pipefail

echo "=== Tebra Credentials Security Check ==="

# Check if required environment variables are set
if [ -z "${GOOGLE_CLOUD_PROJECT:-}" ]; then
    echo "❌ GOOGLE_CLOUD_PROJECT environment variable is not set"
    exit 1
fi

# Check if gcloud is authenticated
if ! gcloud auth application-default print-access-token >/dev/null 2>&1; then
    echo "❌ Not authenticated with gcloud. Please run 'gcloud auth application-default login'"
    exit 1
fi

# Function to get secret from GSM
get_secret() {
    local secret_name=$1
    gcloud secrets versions access latest --secret="$secret_name" 2>/dev/null || echo ""
}

# Function to check a secret's age and content
check_secret() {
    local secret_id=$1
    local warning_threshold_days=90  # 3 months
    local critical_threshold_days=180  # 6 months
    
    echo "Checking secret: $secret_id"
    
    # Get secret version info
    local version_info
    version_info=$(gcloud secrets versions list "$secret_id" --format="json" 2>/dev/null || echo "[]")
    
    if [ "$version_info" = "[]" ]; then
        echo "❌ Secret $secret_id not found"
        return 1
    fi
    
    # Get latest version creation time
    local create_time
    create_time=$(echo "$version_info" | jq -r '.[0].createTime')
    
    if [ -z "$create_time" ]; then
        echo "❌ Could not get creation time for $secret_id"
        return 1
    fi
    
    # Convert to Unix timestamp
    local create_timestamp
    create_timestamp=$(date -jf "%Y-%m-%dT%H:%M:%S" "${create_time%%.*}" "+%s" 2>/dev/null || date -d "${create_time%%.*}" "+%s")
    local current_timestamp
    current_timestamp=$(date "+%s")
    
    # Calculate age in days
    local age_days
    age_days=$(( (current_timestamp - create_timestamp) / 86400 ))
    
    # Check for common credential patterns
    local secret_value
    secret_value=$(gcloud secrets versions access latest --secret="$secret_id" 2>/dev/null)
    
    if [ -z "$secret_value" ]; then
        echo "❌ Could not access secret $secret_id"
        return 1
    fi
    
    # Check for common credential patterns
    local has_issues=0
    local issues=()
    
    # Check for common password patterns
    if [[ "$secret_value" =~ [Pp]assword ]]; then
        issues+=("Contains 'password' text")
        has_issues=1
    fi
    
    if [[ "$secret_value" =~ [Kk]ey ]]; then
        issues+=("Contains 'key' text")
        has_issues=1
    fi
    
    # Age-based warnings
    if [ "$age_days" -gt "$critical_threshold_days" ]; then
        issues+=("Secret is over 6 months old")
        has_issues=1
    elif [ "$age_days" -gt "$warning_threshold_days" ]; then
        issues+=("Secret is over 3 months old")
        has_issues=1
    fi
    
    # Report findings
    if [ "$has_issues" -eq 1 ]; then
        echo "⚠️  Issues found with $secret_id:"
        printf "  - %s\n" "${issues[@]}"
        echo "  Age: $age_days days"
        return 1
    else
        echo "✅ $secret_id looks good (age: $age_days days)"
        return 0
    fi
}

# Get current credentials for pattern matching
echo "Retrieving current credentials from GSM..."
CURRENT_USERNAME=$(get_secret "TEBRA_USERNAME")
CURRENT_PASSWORD=$(get_secret "TEBRA_PASSWORD")
CURRENT_CUSTOMER_KEY=$(get_secret "TEBRA_CUSTOMER_KEY")

# Initialize patterns array
PATTERNS=()
if [ -n "$CURRENT_USERNAME" ] && [ -n "$CURRENT_PASSWORD" ]; then
    echo "✓ Successfully retrieved current credentials from GSM"
    echo "  Username: ${CURRENT_USERNAME:0:3}***"
    echo "  Customer Key: ${CURRENT_CUSTOMER_KEY:0:2}***"
    echo
    
    # Add current credentials to patterns (excluding Customer Key)
    PATTERNS+=("$CURRENT_USERNAME")
    PATTERNS+=("$CURRENT_PASSWORD")
else
    echo "⚠️  Could not retrieve all secrets from GSM"
    echo "   Make sure you have access to: TEBRA_USERNAME, TEBRA_PASSWORD, TEBRA_CUSTOMER_KEY"
    echo
fi

# Known old credentials to check (excluding Customer Key)
OLD_CREDENTIALS=(
    "ZEp7U8-VeHuza@luknerclinic.com"
    "8<O{*a3SF297i]CDFW5mmZ&asx519M"
)

# Generic patterns to check (excluding Customer Key patterns)
GENERIC_PATTERNS=(
    "password[[:space:]]*=[[:space:]]*['\"][^'\"]{8,}['\"]"
    "TEBRA_PASSWORD[[:space:]]*=[[:space:]]*['\"][^'\"]+['\"]"
)

FOUND_ISSUES=0
CURRENT_CRED_ISSUES=0
OLD_CRED_ISSUES=0

# Track count of sensitive files found (initially 0 to avoid unbound variable errors when using `set -u` in CI)
TRACKED_SENSITIVE=0

# Check current working directory for CURRENT credentials
if [ ${#PATTERNS[@]} -gt 0 ]; then
    echo -e "\n1. Checking working directory for CURRENT credentials..."
    for pattern in "${PATTERNS[@]}"; do
        if grep -r -F "$pattern" "$PROJECT_ROOT" \
            --exclude-dir=.git \
            --exclude-dir=vendor \
            --exclude-dir=node_modules \
            --exclude-dir=coverage \
            --exclude-dir=build \
            --exclude-dir=dist \
            --exclude="security-check*.sh" \
            --exclude="*.log" \
            --exclude=".envrc" \
            --exclude=".env.local" \
            --exclude=".env" 2>/dev/null | grep -v "Binary file"; then
            echo "⚠️  WARNING: Found CURRENT credential in working directory!"
            CURRENT_CRED_ISSUES=$((CURRENT_CRED_ISSUES + 1))
            FOUND_ISSUES=$((FOUND_ISSUES + 1))
        fi
    done
    
    if [ $CURRENT_CRED_ISSUES -eq 0 ]; then
        echo "✓ Working directory is clean of current credentials"
    fi
fi

# Check for OLD credentials
echo -e "\n2. Checking working directory for OLD/KNOWN credentials..."
OLD_FOUND_IN_DIR=0
for pattern in "${OLD_CREDENTIALS[@]}"; do
    if grep -r -F "$pattern" "$PROJECT_ROOT" \
        --exclude-dir=.git \
        --exclude-dir=vendor \
        --exclude-dir=node_modules \
        --exclude-dir=coverage \
        --exclude="security-check*.sh" \
        --exclude=".envrc" \
        --exclude=".env.local" \
        --exclude=".env" 2>/dev/null | grep -v "Binary file"; then
        echo "⚠️  WARNING: Found OLD credential in working directory: ${pattern:0:10}..."
        OLD_FOUND_IN_DIR=$((OLD_FOUND_IN_DIR + 1))
        OLD_CRED_ISSUES=$((OLD_CRED_ISSUES + 1))
    fi
done

# Check for generic patterns
echo -e "\n3. Checking for credential patterns..."
for pattern in "${GENERIC_PATTERNS[@]}"; do
    if grep -r -E "$pattern" "$PROJECT_ROOT" \
        --exclude-dir=.git \
        --exclude-dir=vendor \
        --exclude-dir=node_modules \
        --exclude-dir=coverage \
        --exclude-dir=__tests__ \
        --exclude-dir=__mocks__ \
        --exclude="security-check*.sh" \
        --exclude=".envrc" \
        --exclude=".env.local" \
        --exclude=".env" \
        --exclude="*test*.ts" \
        --exclude="*test*.js" \
        --exclude="*Test*.ts" \
        --exclude="*Test*.js" \
        --exclude="*spec*.ts" \
        --exclude="*spec*.js" \
        --exclude="*.test.ts" \
        --exclude="*.test.js" \
        --exclude="*.spec.ts" \
        --exclude="*.spec.js" \
        --include="*.php" \
        --include="*.js" \
        --include="*.ts" 2>/dev/null; then
        echo "⚠️  WARNING: Found credential pattern in code"
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
    fi
done

# Check Git history for CURRENT credentials
HISTORY_ISSUES=0
if [ ${#PATTERNS[@]} -gt 0 ]; then
    echo -e "\n4. Checking Git history for CURRENT credentials..."
    for pattern in "${PATTERNS[@]}"; do
        if git log -p -S"$pattern" --all 2>/dev/null | grep -qF "$pattern"; then
            echo "⚠️  CRITICAL: Found CURRENT credential in Git history!"
            echo "   This credential is actively in use and exposed!"
            HISTORY_ISSUES=$((HISTORY_ISSUES + 1))
            
            # Show which commits contain the pattern
            echo "   Commits containing this credential:"
            git log --pretty=format:"   - %h %s" -S"$pattern" --all | head -3
            echo
        fi
    done
fi

# Check Git history for OLD credentials
echo -e "\n5. Checking Git history for OLD credentials..."
OLD_HISTORY_ISSUES=0
for pattern in "${OLD_CREDENTIALS[@]}"; do
    if git log -p -S"$pattern" --all 2>/dev/null | grep -qF "$pattern"; then
        echo "⚠️  Found OLD credential in Git history: ${pattern:0:10}..."
        OLD_HISTORY_ISSUES=$((OLD_HISTORY_ISSUES + 1))
    fi
done

# Check for security files
echo -e "\n6. Checking for security best practices..."
SECURITY_SCORE=0

if [ -f "$PROJECT_ROOT/.gitignore" ]; then
    echo "✓ .gitignore exists"
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    
    # Check important patterns
    for ignore_pattern in ".env" "*.key" "*.pem" "credentials.json" "service-account*.json"; do
        if grep -q "$ignore_pattern" "$PROJECT_ROOT/.gitignore"; then
            SECURITY_SCORE=$((SECURITY_SCORE + 1))
        fi
    done
    echo "✓ Security patterns in .gitignore: $SECURITY_SCORE/5"
else
    echo "⚠️  No .gitignore file found"
fi

# Check credential rotation status
echo -e "\n8. Checking credential rotation status..."
if [ -f "$TOOLS_ROOT/scripts/manage-credential-rotation.sh" ]; then
    echo "=== Credential Rotation Status ==="
    "$TOOLS_ROOT/scripts/manage-credential-rotation.sh" list
else
    echo "⚠️  Credential rotation tracking not set up"
    echo "   Run: $TOOLS_ROOT/scripts/manage-credential-rotation.sh record <credential_type>"
fi

# Check for sensitive files in Git
echo -e "\n7. Checking for accidentally tracked sensitive files..."
SENSITIVE_FILES=(
    ".env"
    ".env.local"
    ".envrc"
    "credentials.json"
    "service-account.json"
    "*.pem"
    "*.key"
    "*.crt"
    "*.p12"
    "*.pfx"
)

for file in "${SENSITIVE_FILES[@]}"; do
    if git ls-files "$file" 2>/dev/null | grep -v "env-example" | grep -v "env.example" | grep -v "env-example.txt" > /dev/null; then
        echo "⚠️  WARNING: Sensitive file tracked in Git: $file"
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
        TRACKED_SENSITIVE=$((TRACKED_SENSITIVE + 1))
    fi
done

# Check for potential patient data exposure
echo -e "\n8. Checking for potential patient data exposure..."
PATIENT_PATTERNS=(
    "MRN[0-9]+"
    "DOB.*[0-9]{2}/[0-9]{2}/[0-9]{4}"
    "SSN.*[0-9]{3}-[0-9]{2}-[0-9]{4}"
    "patient_id.*[0-9]+"
)

for pattern in "${PATIENT_PATTERNS[@]}"; do
    if git grep -E "$pattern" 2>/dev/null | grep -v "env-example" | grep -v "env.example" | grep -v "env-example.txt" > /dev/null; then
        echo "⚠️  WARNING: Potential patient data pattern found in Git history: $pattern"
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
    fi
done

# Function: Patient data exposure check
check_patient_data_exposure() {
    echo -e "\n7. Checking for potential patient data exposure..."
    PATIENT_PATTERNS=(
        "MRN[0-9]+"
        "DOB.*[0-9]{2}/[0-9]{2}/[0-9]{4}"
        "SSN.*[0-9]{3}-[0-9]{2}-[0-9]{4}"
        "patient.*id.*[0-9]+"
    )

    for pattern in "${PATIENT_PATTERNS[@]}"; do
        if git log --all -S"$pattern" --source --all 2>/dev/null | grep -q .; then
            echo "⚠️  WARNING: Potential patient data pattern found in Git history: $pattern"
            SECURITY_SCORE=$((SECURITY_SCORE - 1))
            FOUND_ISSUES=$((FOUND_ISSUES + 1))
        fi
    done
}

# Call patient data exposure check after sensitive files check but before summary
check_patient_data_exposure

# Summary
echo -e "\n=== Security Check Summary ==="

if [ $CURRENT_CRED_ISSUES -gt 0 ] || [ $HISTORY_ISSUES -gt 0 ]; then
    echo "🚨 CRITICAL SECURITY ISSUE!"
    echo "   Current credentials from GSM are exposed:"
    echo "   - In working directory: $CURRENT_CRED_ISSUES occurrences"
    echo "   - In Git history: $HISTORY_ISSUES occurrences"
    echo ""
    echo "   IMMEDIATE ACTIONS REQUIRED:"
    echo "   1. Rotate credentials in Tebra NOW"
    echo "   2. Update secrets in GSM"
    echo "   3. Clean Git history immediately"
elif [ $OLD_CRED_ISSUES -gt 0 ] || [ $OLD_HISTORY_ISSUES -gt 0 ]; then
    echo "⚠️  Old credentials found (less critical if already rotated):"
    echo "   - Old credentials in directory: $OLD_FOUND_IN_DIR"
    echo "   - Old credentials in Git history: $OLD_HISTORY_ISSUES"
    echo "   These should still be cleaned from history"
else
    echo "✅ Repository appears to be clean!"
    echo "   No current or old credentials found"
fi

echo ""
echo "Overall statistics:"
echo "   - Current credential exposures: $((CURRENT_CRED_ISSUES + HISTORY_ISSUES))"
echo "   - Old credential exposures: $((OLD_CRED_ISSUES + OLD_HISTORY_ISSUES))"
echo "   - Pattern-based issues: $FOUND_ISSUES"
echo "   - Tracked sensitive files: $TRACKED_SENSITIVE"
echo "   - Security score: $SECURITY_SCORE/6"

# Recommendations based on findings
echo -e "\n=== Recommendations ==="
if [ $CURRENT_CRED_ISSUES -gt 0 ] || [ $HISTORY_ISSUES -gt 0 ]; then
    echo "🚨 URGENT - Current credentials are exposed:"
    echo "1. IMMEDIATELY rotate credentials in Tebra"
    echo "2. Run: $SCRIPT_DIR/rotate-username-password.sh"
    echo "3. Clean Git history: $SCRIPT_DIR/git-cleanup.sh"
    echo "4. Force push to all remotes"
    echo "5. Notify all team members to re-clone"
elif [ $OLD_HISTORY_ISSUES -gt 0 ]; then
    echo "⚠️  Old credentials in history:"
    echo "1. Clean Git history: $SCRIPT_DIR/git-cleanup.sh"
    echo "2. Verify credentials were already rotated"
else
    echo "✅ Good security posture! Continue with:"
    echo "1. Regular credential rotation (every 90 days)"
    echo "2. Monitor GSM access logs"
    echo "3. Use this script in CI/CD pipeline"
fi

# CI/CD mode
if [ -n "${CI:-}" ] || [ -n "${GITHUB_ACTIONS:-}" ] || [ -n "${GITLAB_CI:-}" ]; then
    echo -e "\n=== CI/CD Mode ==="
    if [ $CURRENT_CRED_ISSUES -gt 0 ] || [ $HISTORY_ISSUES -gt 0 ]; then
        echo "❌ Build failed due to exposed CURRENT credentials"
        exit 1
    elif [ $FOUND_ISSUES -gt 0 ] || [ $OLD_HISTORY_ISSUES -gt 0 ]; then
        echo "⚠️  Build passed with warnings about old credentials"
        exit 0
    else
        echo "✅ Security check passed"
        exit 0
    fi
fi