#!/bin/bash
# Automated Security Scanner for Cloud Endpoints
SERVICES=(
  "https://us-central1-luknerlumina-firebase.cloudfunctions.net/getFirebaseConfig"
  # Add more endpoints as needed
)

for service in "${SERVICES[@]}"; do
  echo "=== Testing $service ==="
  curl -s -o /dev/null -w "No Auth: %{http_code}\n" "$service"
  curl -s -o /dev/null -w "Bad Auth: %{http_code}\n" -H "Authorization: Bearer invalid" "$service"
  curl -s -I "$service" | grep -E "X-Content-Type-Options|X-Frame-Options|Strict-Transport"
done 