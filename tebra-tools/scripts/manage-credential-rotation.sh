#!/usr/bin/env bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
TOOLS_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$TOOLS_ROOT")"

set -euo pipefail

# Configuration
ROTATION_INTERVAL_DAYS=90
WARNING_THRESHOLD_DAYS=15
ROTATION_LOG_FILE="$TOOLS_ROOT/credential-rotation.log"
ROTATION_STATE_FILE="$TOOLS_ROOT/credential-rotation-state.json"

# Ensure logs directory exists
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

# Function to get current timestamp
get_timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

# Function to log rotation events
log_rotation() {
    local event_type=$1
    local message=$2
    echo "[$(get_timestamp)] [$event_type] $message" >> "$ROTATION_LOG_FILE"
}

# Function to update rotation state
update_rotation_state() {
    local credential_type=$1
    local rotation_date=$2
    local rotated_by=$3
    
    # Create state file if it doesn't exist
    if [ ! -f "$ROTATION_STATE_FILE" ]; then
        echo "{}" > "$ROTATION_STATE_FILE"
    fi
    
    # Update the state file
    local temp_file=$(mktemp)
    jq --arg type "$credential_type" \
       --arg date "$rotation_date" \
       --arg user "$rotated_by" \
       '.[$type] = {"last_rotation": $date, "rotated_by": $user}' \
       "$ROTATION_STATE_FILE" > "$temp_file"
    mv "$temp_file" "$ROTATION_STATE_FILE"
}

# Function to check if rotation is needed
check_rotation_needed() {
    local credential_type=$1
    local current_date=$(date "+%s")
    
    if [ ! -f "$ROTATION_STATE_FILE" ]; then
        echo "true"
        return
    fi
    
    local last_rotation=$(jq -r ".[\"$credential_type\"].last_rotation" "$ROTATION_STATE_FILE")
    if [ "$last_rotation" = "null" ]; then
        echo "true"
        return
    fi
    
    local last_rotation_seconds=$(date -jf "%Y-%m-%d %H:%M:%S" "$last_rotation" "+%s" 2>/dev/null || date -d "$last_rotation" "+%s")
    local days_since_rotation=$(( (current_date - last_rotation_seconds) / 86400 ))
    
    if [ $days_since_rotation -ge $ROTATION_INTERVAL_DAYS ]; then
        echo "true"
    else
        echo "false"
    fi
}

# Function to get days until next rotation
get_days_until_rotation() {
    local credential_type=$1
    local current_date=$(date "+%s")
    
    if [ ! -f "$ROTATION_STATE_FILE" ]; then
        echo "0"
        return
    fi
    
    local last_rotation=$(jq -r ".[\"$credential_type\"].last_rotation" "$ROTATION_STATE_FILE")
    if [ "$last_rotation" = "null" ]; then
        echo "0"
        return
    fi
    
    local last_rotation_seconds=$(date -jf "%Y-%m-%d %H:%M:%S" "$last_rotation" "+%s" 2>/dev/null || date -d "$last_rotation" "+%s")
    local days_since_rotation=$(( (current_date - last_rotation_seconds) / 86400 ))
    local days_until_rotation=$(( ROTATION_INTERVAL_DAYS - days_since_rotation ))
    
    echo "$days_until_rotation"
}

# HIPAA audit logging
log_hipaa_event() {
    local event_type="$1"
    local details="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "$timestamp,$event_type,$USER,$details" >> "$LOG_DIR/hipaa-audit.log"

    # Alert if sensitive operations during business hours
    local hour=$(date +%H)
    if [[ $hour -ge 8 && $hour -le 17 ]]; then
        echo "ALERT: Credential rotation during business hours - $event_type" | \
            mail -s "Security Alert - Credential Rotation" admin@luknerclinic.com 2>/dev/null || true
    fi
}

# Practice hours check before rotation
check_practice_hours() {
    local current_hour=$(date +%H)
    local current_day=$(date +%u)  # 1-7, Monday=1

    # Check if it's business hours (8 AM - 6 PM, Mon-Fri)
    if [[ $current_day -le 5 && $current_hour -ge 8 && $current_hour -le 18 ]]; then
        echo "WARNING: Credential rotation during active practice hours"
        echo "Consider scheduling during off-hours to minimize disruption"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Rotation cancelled. Schedule for after 6 PM or weekends."
            exit 1
        fi
    fi
}

# Modify record_rotation to invoke new checks and logging
record_rotation() {
    local credential_type=$1
    local rotated_by=$2

    # Practice hours prompt
    check_practice_hours

    # Update rotation state
    update_rotation_state "$credential_type" "$(get_timestamp)" "$rotated_by"

    # Log the rotation
    log_rotation "ROTATION" "Credential '$credential_type' rotated by $rotated_by"
    log_hipaa_event "ROTATION" "Credential '$credential_type' rotated by $rotated_by"

    echo "✅ Rotation recorded for $credential_type"
}

# Function to check rotation status
check_status() {
    local credential_type=$1
    
    if [ ! -f "$ROTATION_STATE_FILE" ]; then
        echo "❌ No rotation records found"
        return
    fi
    
    local last_rotation=$(jq -r ".[\"$credential_type\"].last_rotation" "$ROTATION_STATE_FILE")
    local rotated_by=$(jq -r ".[\"$credential_type\"].rotated_by" "$ROTATION_STATE_FILE")
    
    if [ "$last_rotation" = "null" ]; then
        echo "❌ No rotation record found for $credential_type"
        return
    fi
    
    local days_until_rotation=$(get_days_until_rotation "$credential_type")
    
    if [ $days_until_rotation -le 0 ]; then
        echo "🚨 $credential_type is overdue for rotation"
        echo "   Last rotated: $last_rotation by $rotated_by"
    elif [ $days_until_rotation -le $WARNING_THRESHOLD_DAYS ]; then
        echo "⚠️  $credential_type needs rotation in $days_until_rotation days"
        echo "   Last rotated: $last_rotation by $rotated_by"
    else
        echo "✅ $credential_type is up to date"
        echo "   Last rotated: $last_rotation by $rotated_by"
        echo "   Next rotation in $days_until_rotation days"
    fi
}

# Main command handling
case "${1:-}" in
    "record")
        if [ -z "${2:-}" ]; then
            echo "Usage: $0 record <credential_type>"
            exit 1
        fi
        record_rotation "$2" "${USER:-unknown}"
        ;;
    "check")
        if [ -z "${2:-}" ]; then
            echo "Usage: $0 check <credential_type>"
            exit 1
        fi
        check_status "$2"
        ;;
    "list")
        if [ ! -f "$ROTATION_STATE_FILE" ]; then
            echo "No rotation records found"
            exit 0
        fi
        echo "=== Credential Rotation Status ==="
        jq -r 'keys[]' "$ROTATION_STATE_FILE" | while read -r credential_type; do
            echo
            check_status "$credential_type"
        done
        ;;
    *)
        echo "Usage: $0 <command> [credential_type]"
        echo "Commands:"
        echo "  record <credential_type>  - Record a credential rotation"
        echo "  check <credential_type>   - Check rotation status"
        echo "  list                      - List all credential statuses"
        exit 1
        ;;
esac 