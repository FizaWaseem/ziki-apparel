#!/bin/bash

# Ziki Apparel Quick Deployment Script
echo "🚀 Ziki Apparel Deployment Assistant"
echo "===================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI is already installed"
fi

# Check if user is logged in to Vercel
echo ""
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
else
    echo "✅ Already logged in to Vercel"
fi

# Build the project
echo ""
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
echo "Note: You'll need to set environment variables in Vercel dashboard"
echo "Required variables:"
echo "- DATABASE_URL"
echo "- NEXTAUTH_URL" 
echo "- NEXTAUTH_SECRET"
echo "- EMAIL_USER"
echo "- EMAIL_PASS"
echo "- STRIPE_SECRET_KEY"
echo "- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo ""

read -p "Press Enter to continue with deployment..."

vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "Your Ziki Apparel webapp is now live!"
    echo ""
    echo "Next steps:"
    echo "1. Set environment variables in Vercel dashboard"
    echo "2. Test all features on your live site"
    echo "3. Set up your production database"
    echo "4. Configure your email service"
    echo "5. Switch to Stripe live keys when ready"
    echo ""
    echo "📚 Check LAUNCH_CHECKLIST.md for detailed post-deployment steps"
else
    echo "❌ Deployment failed. Please check the error messages above."
fi