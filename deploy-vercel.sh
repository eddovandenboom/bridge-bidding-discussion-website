#!/bin/bash

# 🚀 Quick Vercel Deployment Script for Bridge Bidding Website

echo "🌉 Bridge Bidding Discussion Website - Vercel Deployment"
echo "========================================================"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
    echo "✅ Vercel CLI installed!"
fi

# Build the application locally first
echo ""
echo "🔨 Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix build errors before deploying."
    exit 1
fi
echo "✅ Build successful!"

# Check if logged in to Vercel
echo ""
echo "👤 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add your PostgreSQL DATABASE_URL: vercel env add DATABASE_URL"
echo "2. Add JWT_SECRET: vercel env add JWT_SECRET"
echo "3. Update FRONTEND_URL and VITE_API_URL with your Vercel domain"
echo "4. Redeploy: vercel --prod"
echo ""
echo "📖 For detailed instructions, see VERCEL_DEPLOYMENT_GUIDE.md"