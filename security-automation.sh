#!/usr/bin/env bash

# Automated Security Management System for Lukner Clinic
# Combines all security checks, monitoring, and reporting into a single system
# Designed for rural healthcare practice with minimal administrative overhead

set -euo pipefail

# Derived paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
TOOLS_ROOT="$PROJECT_ROOT/tebra-tools"

# Configuration
CLINIC_NAME="Lukner Clinic"
# Primary alert destination (can be comma-separated list)
ALERT_EMAILS="lukner@luknerclinic.com"
PRACTICE_HOURS_START=8
PRACTICE_HOURS_END=18
LOG_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$PROJECT_ROOT/backups"
REPORTS_DIR="$PROJECT_ROOT/reports"

# Create directories if they don't exist
mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$REPORTS_DIR"

# Logging function
log_event() {
    local level="$1"
    local message="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "$timestamp [$level] $message" | tee -a "$LOG_DIR/security-automation.log"
}

# Check if it's business hours
is_business_hours() {
    local current_hour=$(date +%H)
    local current_day=$(date +%u)  # 1-7, Monday=1
    [[ $current_day -le 5 && $current_hour -ge $PRACTICE_HOURS_START && $current_hour -le $PRACTICE_HOURS_END ]]
}

# Send alerts based on context
send_alert() {
    local subject="$1"
    local message="$2"
    log_event "ALERT" "$subject: $message"
    # High-sensitivity mode → always e-mail immediately
    IFS=',' read -ra DESTS <<< "$ALERT_EMAILS"
    for addr in "${DESTS[@]}"; do
        echo "$message" | mail -s "[$CLINIC_NAME Security] $subject" "$addr" 2>/dev/null || true
    done
}

# Security dashboard
run_security_dashboard() {
    local dashboard_date=$(date +"%Y-%m-%d %H:%M:%S")
    local security_score=6
    local issues_found=0

    echo "============================================================"
    echo "        $CLINIC_NAME Security Dashboard - $dashboard_date      "
    echo "============================================================"

    # 1. Credential rotation status
    echo "\n🔄 CREDENTIAL ROTATION STATUS"
    if [[ -f "$TOOLS_ROOT/credential-rotation.log" ]]; then
        local last_rotation=$(tail -n 1 "$TOOLS_ROOT/credential-rotation.log" | awk '{print $1" "$2}' | tr -d '[]')
        local days_since=$(( ($(date +%s) - $(date_or_die -d "$last_rotation" +%s)) / 86400 ))
        local days_until_next=$((90 - days_since))
        if [[ $days_until_next -le 7 ]]; then
            echo "⚠️  Credential rotation due in $days_until_next days"
            if [[ $days_until_next -le 0 ]]; then
                security_score=$((security_score - 1))
                issues_found=$((issues_found + 1))
                send_alert "Credential Rotation Overdue" "Credentials overdue by $((days_until_next * -1)) days" "urgent"
            fi
        else
            echo "✅ Next rotation in $days_until_next days"
        fi
    else
        echo "⚠️  No rotation history found"
        security_score=$((security_score - 1))
        issues_found=$((issues_found + 1))
    fi

    # 2. Tebra API connectivity
    echo "\n🌐 TEBRA API CONNECTIVITY"
    local api_start=$(date +%s)
    if timeout 30s php "$TOOLS_ROOT/test-tebra.php" --quiet >/dev/null 2>&1; then
        local api_resp=$(( $(date +%s) - api_start ))
        echo "✅ API responding in ${api_resp}s"
        if [[ $api_resp -gt 10 ]]; then
            echo "⚠️  Slow response time detected"
            is_business_hours && send_alert "Slow Tebra Response" "API response ${api_resp}s" "normal"
        fi
    else
        echo "❌ API connectivity failed"
        security_score=$((security_score - 1))
        issues_found=$((issues_found + 1))
        send_alert "Tebra API Offline" "Unable to connect to Tebra API" "urgent"
    fi

    # 3. Secret Manager access
    echo "\n🔐 SECRET MANAGER STATUS"
    local secrets=("TEBRA_USERNAME" "TEBRA_PASSWORD" "TEBRA_CUSTOMER_KEY")
    local secret_issues=0
    for secret in "${secrets[@]}"; do
        if gcloud secrets versions access latest --secret="$secret" >/dev/null 2>&1; then
            echo "✅ $secret accessible"
        else
            echo "❌ $secret access failed"
            secret_issues=$((secret_issues + 1))
        fi
    done
    if [[ $secret_issues -gt 0 ]]; then
        security_score=$((security_score - 1))
        issues_found=$((issues_found + 1))
        send_alert "Secret Manager Issues" "$secret_issues secrets inaccessible" "urgent"
    fi

    # 4. Sensitive data exposure
    echo "\n🔍 SENSITIVE DATA EXPOSURE CHECK"
    if "$TOOLS_ROOT/scripts/security-check-gsm.sh" --quiet; then
        echo "✅ No sensitive data exposure detected"
    else
        echo "⚠️  Potential sensitive data exposure found"
        security_score=$((security_score - 1))
        issues_found=$((issues_found + 1))
        send_alert "Sensitive Data Exposure" "Security scan detected issues" "urgent"
    fi

    # 5. Backup status
    echo "\n💾 BACKUP STATUS"
    local today=$(date +%Y%m%d)
    local backups=("patient-cache-$today.db" "appointments-$today.json" "config-backup-$today.tar.gz")
    local missing_backups=0
    for bkp in "${backups[@]}"; do
        if [[ -f "$BACKUP_DIR/$bkp" ]]; then
            echo "✅ $bkp exists"
        else
            echo "⚠️  $bkp missing"
            missing_backups=$((missing_backups + 1))
        fi
    done
    [[ $missing_backups -gt 0 ]] && echo "ℹ️  $missing_backups backup(s) missing"

    # 6. System performance: disk usage
    echo "\n📊 SYSTEM PERFORMANCE"
    local disk_usage=$(df -h . | awk 'NR==2 {sub("%", "", $5); print $5}')
    if [[ $disk_usage -gt 90 ]]; then
        echo "⚠️  Disk usage: ${disk_usage}% (high)"
        send_alert "High Disk Usage" "Disk usage at ${disk_usage}%" "normal"
    else
        echo "✅ Disk usage: ${disk_usage}%"
    fi

    echo "\n🏆 SECURITY SCORE: $security_score/6"
    [[ $security_score -lt 5 ]] && send_alert "Low Security Score" "Score ${security_score}/6 with ${issues_found} issues" "urgent"

    is_business_hours && [[ $issues_found -gt 0 ]] && echo "⚠️  $issues_found issues may affect patient care during practice hours"

    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ"),dashboard,$security_score,$issues_found" >> "$LOG_DIR/security-metrics.csv"
}

run_maintenance_tasks() {
    log_event "INFO" "Starting maintenance"
    find "$LOG_DIR" -name "*.log" -mtime +30 -exec gzip {} \;
    find "$BACKUP_DIR" -name "*.json" -mtime +7 -delete 2>/dev/null || true
    [ $(date +%u) -eq 7 ] && generate_weekly_report
    log_event "INFO" "Maintenance complete"
}

generate_weekly_report() {
    local week_tag=$(date +%Y%W)
    local rpt="$REPORTS_DIR/weekly-security-report-$week_tag.md"
    local week_start=$(date_or_die -d 'last monday' +%Y-%m-%d)
    local week_end=$(date_or_die -d 'next sunday' +%Y-%m-%d)

    cat > "$rpt" <<EOF
# $CLINIC_NAME Weekly Security Report
**Week $week_start to $week_end**

## Security Metrics (last 7 runs)
$(tail -7 "$LOG_DIR/security-metrics.csv" | awk -F, 'BEGIN {print "| Date | Score | Issues |\n|------|-------|--------|"} {print "| "$1" | "$3" | "$4" |"}')

## Alerts This Week
$(grep "\[ALERT\]" "$LOG_DIR/security-automation.log" | tail -10 || echo "No alerts")

*Generated automatically by $CLINIC_NAME Security System*
EOF

    log_event "INFO" "Weekly report generated: $rpt"
    local first_addr=$(echo "$ALERT_EMAILS" | cut -d',' -f1)
    mail -s "[$CLINIC_NAME] Weekly Security Report" "$first_addr" < "$rpt" 2>/dev/null || true
}

# === NEW: Daily & Monthly Reports ===

generate_daily_report() {
    local rpt="$REPORTS_DIR/daily-security-$(date +%Y%m%d).md"
    local since=$(date_or_die -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)

    cat > "$rpt" <<EOF
# $CLINIC_NAME Daily Security Summary
**Date:** $(date +%Y-%m-%d)**

## Alerts in the last 24h

$(grep "\[ALERT\]" "$LOG_DIR/security-automation.log" | awk -v since="$since" '$1 >= since' | tail -20 || echo "No alerts")

## Latest Security Dashboard

$(tail -1 "$LOG_DIR/security-metrics.csv" | awk -F, '{print "Score: "$3"/6    Issues: "$4" ("$1")"}')

*Generated automatically by $CLINIC_NAME Security System*
EOF

    IFS=',' read -ra DESTS <<< "$ALERT_EMAILS"
    for addr in "${DESTS[@]}"; do
        mail -s "[$CLINIC_NAME] Daily Security Summary" "$addr" < "$rpt" 2>/dev/null || true
    done
    log_event "INFO" "Daily report generated"
}

generate_monthly_report() {
    local month_tag=$(date +%Y-%m)
    local rpt="$REPORTS_DIR/monthly-security-report-$month_tag.md"

    cat > "$rpt" <<EOF
# $CLINIC_NAME Monthly Security Report – $month_tag

## Credential Rotations
$(grep "$month_tag" "$TOOLS_ROOT/credential-rotation.log" | wc -l) rotations this month

## Alerts
$(grep "\[ALERT\]" "$LOG_DIR/security-automation.log" | grep "$month_tag" | wc -l) alerts logged

## Average Security Score
$(grep "$month_tag" "$LOG_DIR/security-metrics.csv" | awk -F, '{sum+=$3;cnt++} END {if(cnt>0) print sum/cnt; else print "N/A"}') / 6

*Generated automatically by $CLINIC_NAME Security System*
EOF

    for addr in $(echo "$ALERT_EMAILS" | tr ',' ' '); do
        mail -s "[$CLINIC_NAME] Monthly Security Report" "$addr" < "$rpt" 2>/dev/null || true
    done
    log_event "INFO" "Monthly report generated"
}

main() {
    case "${1:-dashboard}" in
        dashboard) run_security_dashboard ;;
        maintenance) run_maintenance_tasks ;;
        weekly) generate_weekly_report ;;
        daily) generate_daily_report ;;
        monthly) generate_monthly_report ;;
        setup) setup_automation ;;
        *) echo "Usage: $0 {dashboard|maintenance|daily|weekly|monthly|setup}"; exit 1 ;;
    esac
}

setup_automation() {
    echo "Setting up cron jobs..."
    local cron_tmp=$(mktemp)
    crontab -l 2>/dev/null > "$cron_tmp" || true
    grep -q "security-automation.sh dashboard" "$cron_tmp" || echo "0 8,12,16 * * 1-5 $PROJECT_ROOT/security-automation.sh dashboard" >> "$cron_tmp"
    grep -q "security-automation.sh maintenance" "$cron_tmp" || echo "0 6 * * * $PROJECT_ROOT/security-automation.sh maintenance" >> "$cron_tmp"
    # Daily summary 7 AM
    grep -q "security-automation.sh daily" "$cron_tmp" || echo "0 7 * * * $PROJECT_ROOT/security-automation.sh daily" >> "$cron_tmp"
    # Monthly report on 1st at 07:30
    grep -q "security-automation.sh monthly" "$cron_tmp" || echo "30 7 1 * * $PROJECT_ROOT/security-automation.sh monthly" >> "$cron_tmp"
    crontab "$cron_tmp" && rm "$cron_tmp"
    echo "✅ Cron configured"
}

# ─── Portable date handling ────────────────────────────────────────────────
# Prefer GNU date (gdate on macOS via coreutils). If not available, fall
# back to BSD date but exit with a clear message the first time a GNU-only
# feature is required.

if command -v gdate >/dev/null 2>&1; then
    DATE_BIN="gdate"
else
    DATE_BIN="date"
fi

date_or_die() {
    # Wrapper: run "$DATE_BIN" with given args. If it fails because of an
    # unsupported option (common on macOS without coreutils), print guidance
    # and exit 1.
    if ! $DATE_BIN "$@"; then
        echo "❌ BSD 'date' detected but GNU-style options are required."
        echo "   Fix: brew install coreutils && echo 'alias date=gdate' >> ~/.zshrc"
        exit 1
    fi
}

if [[ "${1:-}" == "--setup" ]]; then
    setup_automation
else
    main "$@"
fi 