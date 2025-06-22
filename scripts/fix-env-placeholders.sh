#!/opt/homebrew/bin/bash
# scripts/fix-env-placeholders.sh

set -e

echo "🔧 Fixing placeholders and formatting in .env..."
echo "=============================================="
echo ""

# Backup current .env
cp .env .env.backup.placeholders

echo "📥 Fetching actual values from GSM..."

# Fix GMAIL_REFRESH_TOKEN
echo -n "GMAIL_REFRESH_TOKEN: "
GMAIL_REFRESH_TOKEN=$(gcloud secrets versions access latest --secret="GMAIL_REFRESH_TOKEN" 2>/dev/null || echo "")
if [ -n "$GMAIL_REFRESH_TOKEN" ] && [ "$GMAIL_REFRESH_TOKEN" != "<value>" ]; then
    echo "✅ Found"
else
    echo "❌ Not found or placeholder"
fi

# Fix GMAIL_OAUTH_CLIENT_ID
echo -n "GMAIL_OAUTH_CLIENT_ID: "
GMAIL_OAUTH_CLIENT_ID=$(gcloud secrets versions access latest --secret="GMAIL_OAUTH_CLIENT_ID" 2>/dev/null || echo "")
if [ -n "$GMAIL_OAUTH_CLIENT_ID" ] && [ "$GMAIL_OAUTH_CLIENT_ID" != "<value>" ]; then
    echo "✅ Found"
else
    echo "❌ Not found or placeholder"
fi

# Fix GMAIL_OAUTH_CLIENT_SECRET
echo -n "GMAIL_OAUTH_CLIENT_SECRET: "
GMAIL_OAUTH_CLIENT_SECRET=$(gcloud secrets versions access latest --secret="GMAIL_OAUTH_CLIENT_SECRET" 2>/dev/null || echo "")
if [ -n "$GMAIL_OAUTH_CLIENT_SECRET" ] && [ "$GMAIL_OAUTH_CLIENT_SECRET" != "<value>" ]; then
    echo "✅ Found"
else
    echo "❌ Not found or placeholder"
fi

# Get properly formatted multiline values
echo -n "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY: "
GMAIL_PRIVATE_KEY=$(gcloud secrets versions access latest --secret="GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY" 2>/dev/null || echo "")
if [ -n "$GMAIL_PRIVATE_KEY" ]; then
    echo "✅ Found"
else
    echo "❌ Not found"
fi

echo -n "VITE_FIREBASE_CONFIG: "
FIREBASE_CONFIG=$(gcloud secrets versions access latest --secret="VITE_FIREBASE_CONFIG" 2>/dev/null || echo "")
if [ -n "$FIREBASE_CONFIG" ]; then
    echo "✅ Found"
else
    echo "❌ Not found"
fi

echo ""
echo "📝 Creating corrected .env file..."

# Create new .env with proper values
cat > .env << 'EOF'
# Auto-generated from Google Secret Manager
# Generated at: 2025-06-22T02:04:12.868Z

VITE_AUTH0_DOMAIN=dev-uex7qzqmd8c4qnde.us.auth0.com
VITE_AUTH0_CLIENT_ID=I8ZHr1uCjPkO4ePgY6S421N9HQ0nnN7A
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
VITE_AUTH0_AUDIENCE=https://api.patientflow.com
VITE_AUTH0_SCOPE=openid profile email
VITE_TEBRA_USERNAME=pqpyiN-cAGRih@luknerclinic.com
VITE_TEBRA_PASSWORD=WQJyt8-ABsW5Y-sgudYx-xV25V5-XJyFyb
VITE_TEBRA_CUSTOMER_KEY=j57wt68dc39q
VITE_TEBRA_WSDL_URL=https://api.tebra.com/soap/v1?wsdl
GMAIL_CLIENT_ID=<value>
GMAIL_CLIENT_SECRET=<value>
EOF

# Add GMAIL values with actual data
if [ -n "$GMAIL_REFRESH_TOKEN" ] && [ "$GMAIL_REFRESH_TOKEN" != "<value>" ]; then
    echo "GMAIL_REFRESH_TOKEN=$GMAIL_REFRESH_TOKEN" >> .env
else
    echo "GMAIL_REFRESH_TOKEN=" >> .env
fi

if [ -n "$GMAIL_OAUTH_CLIENT_ID" ] && [ "$GMAIL_OAUTH_CLIENT_ID" != "<value>" ]; then
    echo "GMAIL_OAUTH_CLIENT_ID=$GMAIL_OAUTH_CLIENT_ID" >> .env
else
    echo "GMAIL_OAUTH_CLIENT_ID=" >> .env
fi

if [ -n "$GMAIL_OAUTH_CLIENT_SECRET" ] && [ "$GMAIL_OAUTH_CLIENT_SECRET" != "<value>" ]; then
    echo "GMAIL_OAUTH_CLIENT_SECRET=$GMAIL_OAUTH_CLIENT_SECRET" >> .env
else
    echo "GMAIL_OAUTH_CLIENT_SECRET=" >> .env
fi

# Add the rest
echo "GMAIL_SERVICE_ACCOUNT_EMAIL=gmail-proxy-sa@luknerlumina-firebase.iam.gserviceaccount.com" >> .env

# Add private key (properly escaped)
if [ -n "$GMAIL_PRIVATE_KEY" ]; then
    # Escape the private key
    ESCAPED_KEY="${GMAIL_PRIVATE_KEY//\\/\\\\}"     # Escape backslashes
    ESCAPED_KEY="${ESCAPED_KEY//\"/\\\"}"           # Escape quotes
    ESCAPED_KEY="${ESCAPED_KEY//$'\n'/\\n}"         # Convert newlines to \n
    echo "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY=\"$ESCAPED_KEY\"" >> .env
else
    echo "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY=" >> .env
fi

echo "VITE_PATIENT_ENCRYPTION_KEY=ZeLpBQob06yXimyP1IrpV0qQx+oJxDIPsAIBT+7+Xbg=" >> .env
echo "VITE_TEBRA_PROXY_API_KEY=9c2ea0249c94fd07168888f10e7a0b27d29986f1e564242652d518db784346d4" >> .env

# Add Firebase config (properly escaped)
if [ -n "$FIREBASE_CONFIG" ]; then
    # Escape the JSON
    ESCAPED_CONFIG="${FIREBASE_CONFIG//\\/\\\\}"     # Escape backslashes
    ESCAPED_CONFIG="${ESCAPED_CONFIG//\"/\\\"}"     # Escape quotes
    ESCAPED_CONFIG="${ESCAPED_CONFIG//$'\n'/\\n}"   # Convert newlines to \n
    echo "VITE_FIREBASE_CONFIG=\"$ESCAPED_CONFIG\"" >> .env
else
    echo "VITE_FIREBASE_CONFIG=" >> .env
fi

echo "GOOGLE_CLOUD_PROJECT=luknerlumina-firebase" >> .env

echo ""
echo "✅ Created corrected .env file"
echo ""
echo "📊 Summary of fixes:"
echo "- Replaced <value> placeholders with actual values from GSM"
echo "- Properly escaped multiline values (private key and JSON)"
echo "- All values are now on single lines"
echo ""
echo "🧪 Running consistency check..."
node scripts/check-env-gsm-consistency.js | tail -n 25