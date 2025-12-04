#!/bin/bash

# ScreenGrab Setup Helper Script
# This script helps automate the initial setup process

set -e

echo "🎥 ScreenGrab Setup Helper"
echo "=========================="
echo ""

# Check if wrangler is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npm/npx not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js and npm found"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 2: Login to Cloudflare
echo "🔐 Step 2: Login to Cloudflare"
echo "A browser window will open for authentication..."
npx wrangler login
echo "✅ Logged in to Cloudflare"
echo ""

# Step 3: Create R2 bucket
echo "🪣 Step 3: Creating R2 bucket..."
if npx wrangler r2 bucket create screengrab-videos 2>&1 | grep -q "already exists\|Created"; then
    echo "✅ R2 bucket ready"
else
    echo "❌ Failed to create R2 bucket"
    exit 1
fi
echo ""

# Step 4: Create D1 database
echo "🗄️ Step 4: Creating D1 database..."
DB_OUTPUT=$(npx wrangler d1 create screengrab-db 2>&1)

if echo "$DB_OUTPUT" | grep -q "already exists"; then
    echo "✅ D1 database already exists"
    echo "⚠️  Please ensure database_id is set in wrangler.toml"
elif echo "$DB_OUTPUT" | grep -q "database_id"; then
    echo "✅ D1 database created"
    echo ""
    echo "📝 IMPORTANT: Copy this database_id to wrangler.toml:"
    echo "$DB_OUTPUT" | grep "database_id"
    echo ""
    echo "Press Enter after you've updated wrangler.toml..."
    read
else
    echo "❌ Failed to create D1 database"
    exit 1
fi
echo ""

# Step 5: Initialize database
echo "📊 Step 5: Initializing database tables..."
if npm run db:init; then
    echo "✅ Database initialized"
else
    echo "❌ Failed to initialize database"
    echo "Make sure you've updated the database_id in wrangler.toml"
    exit 1
fi
echo ""

# Step 6: Setup secrets
echo "🔑 Step 6: Setting up secrets..."
echo ""

echo "Let's generate a JWT secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
echo "$JWT_SECRET" | npx wrangler secret put JWT_SECRET
echo "✅ JWT secret set"
echo ""

echo "Now let's add your Google OAuth Client Secret"
echo "Get it from: https://console.cloud.google.com/apis/credentials"
npx wrangler secret put GOOGLE_CLIENT_SECRET
echo "✅ Google OAuth secret set"
echo ""

echo "Finally, let's add your Resend API key"
echo "Get it from: https://resend.com/api-keys"
npx wrangler secret put RESEND_API_KEY
echo "✅ Resend API key set"
echo ""

# Final instructions
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit wrangler.toml and add your GOOGLE_CLIENT_ID"
echo "2. Run 'npm run dev' to start development server"
echo "3. Visit http://localhost:8787"
echo ""
echo "For detailed setup instructions, see SETUP.md"
echo "For quick reference, see QUICK_START.md"
echo ""

