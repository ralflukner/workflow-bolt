#!/bin/bash

echo "🧹 Cleaning old build..."
rm -rf dist

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building project..."
npm run build

if [ -d "dist" ]; then
    echo "✅ Build successful!"
    echo "📤 Deploying to Netlify..."
    netlify deploy --prod
else
    echo "❌ Build failed - no dist directory created"
    echo "🔍 Checking for TypeScript errors..."
    npx tsc --noEmit
fi
