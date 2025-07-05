#!/bin/bash
# Redis Pre-flight Check v2.0

progress() {
    echo -ne "\r[$1] $2"
    sleep 0.1
}

fix() {
    case "$1" in
        Docker) echo "Start Docker Desktop" ;;
        "Redis CLI") echo "Install redis-cli (brew install redis)" ;;
        "Port 6379") echo "Start Redis: docker run -d -p 6379:6379 redis:7-alpine" ;;
        "Redis Ping") echo "Check Redis logs or restart container" ;;
        "Write Test") echo "Check Redis permissions or restart container" ;;
        *) echo "Check system configuration" ;;
    esac
}

if [[ "$1" == "--fix" && -n "$2" ]]; then
    fix "$2"
    exit 0
fi

tests=(
    "Docker:docker info"
    "Redis CLI:redis-cli --version"
    "Port 6379:nc -zv localhost 6379"
    "Redis Ping:redis-cli ping"
    "Write Test:redis-cli SET test:preflight ok EX 10"
)

echo "🚀 Redis Pre-Flight Check v2.0"
echo "=============================="

for test in "${tests[@]}"; do
    IFS=':' read -r name cmd <<< "$test"
    progress "⏳" "$name"
    if eval "$cmd" &>/dev/null; then
        progress "✅" "$name"
        echo
    else
        progress "❌" "$name - FAILED"
        echo -e "\n   Fix: $(bash $0 --fix "$name")"
        exit 1
    fi
done

echo -e "\n✅ All systems operational!" 