#!/bin/bash

# Ensure we're in the project directory
cd "$(dirname "$0")"

echo "🧹 Cleaning up..."
rm -rf node_modules
rm -rf .next
rm -f package-lock.json

echo "🔧 Installing dependencies globally..."
npm install -g tailwindcss postcss autoprefixer

echo "🔧 Installing project dependencies..."
npm install --legacy-peer-deps

echo "⚙️ Setting up Tailwind CSS..."
npx tailwindcss init -p

echo "🏗️ Building the application..."
npm run build

echo "⚙️ Setting up environment variables..."
cat > .env.local << EOL
NEXT_PUBLIC_API_URL=https://jono.digital/api
NODE_ENV=production
EOL

echo "✅ Deployment setup completed!"
echo "🚀 Now you can start the application with: npm run cpanel-start"
