#!/usr/bin/env bash

# Tebra health monitoring script
# Runs connectivity and performance checks, with alerts during business hours.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
TOOLS_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$TOOLS_ROOT")"
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

is_business_hours() {
    local hour=$(date +%H)
    local day=$(date +%u)
    [[ $day -ge 1 && $day -le 5 && $hour -ge 8 && $hour -le 18 ]]
}

send_clinical_alert() {
    local message="$1"
    echo "$message" | mail -s "Clinical System Alert" frontdesk@luknerclinic.com 2>/dev/null || true
}

check_tebra_connectivity() {
    local start=$(date +%s)
    local success=true
    if ! php "$PROJECT_ROOT/tebra-tools/test-tebra.php" --quiet 2>/dev/null; then
        success=false
        echo "$(date): Tebra API connectivity failed" >> "$LOG_DIR/service-health.log"
        if is_business_hours; then
            send_clinical_alert "Tebra integration offline - patient scheduling may be affected" "high"
        fi
    fi
    local end=$(date +%s)
    local response=$((end - start))
    echo "$(date),$success,$response" >> "$LOG_DIR/tebra-performance.csv"
    if [[ $response -gt 10 ]]; then
        echo "WARNING: Slow Tebra response time: ${response}s"
    fi
}

check_tebra_connectivity 