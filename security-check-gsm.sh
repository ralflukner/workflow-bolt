#!/usr/bin/env bash

set -euo pipefail

echo "=== Tebra Credentials Security Check ==="

# Check if required environment variables are set
if [ -z "${GOOGLE_CLOUD_PROJECT:-}" ]; then
    echo "❌ GOOGLE_CLOUD_PROJECT environment variable is not set"
    exit 1
fi

# Check if gcloud is authenticated
if ! gcloud auth print-access-token >/dev/null 2>&1; then
    echo "❌ Not authenticated with gcloud. Please run 'gcloud auth application-default login'"
    exit 1
fi

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
    }
    
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
    }
    
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

# Check all Tebra-related secrets
echo "Checking Tebra credentials in project: $GOOGLE_CLOUD_PROJECT"

secrets=("TEBRA_USERNAME" "TEBRA_PASSWORD" "TEBRA_CUSTOMER_KEY")
has_failures=0

for secret in "${secrets[@]}"; do
    if ! check_secret "$secret"; then
        has_failures=1
    fi
done

if [ "$has_failures" -eq 1 ]; then
    echo "❌ Security check failed - please review the issues above"
    exit 1
else
    echo "✅ Security check passed"
    exit 0
fi 