#!/bin/bash

# Railway deployment script for Bridge Bidding Discussion Website
echo "🚀 Starting Railway deployment..."

# Step 1: Initialize Railway project (run this manually)
echo "1. Run: railway init"
echo "   - Select workspace: eddovandenboom's Projects"  
echo "   - Create new project: Yes"
echo "   - Project name: bridge-bidding-website"

# Step 2: Deploy application
echo "2. Run: railway up"

# Step 3: Add PostgreSQL database
echo "3. Run: railway add postgresql"

# Step 4: Set environment variables
echo "4. Set environment variables:"
echo "   railway variables set NODE_ENV=production"
echo "   railway variables set PORT=3001"
echo "   railway variables set JWT_SECRET=$(openssl rand -base64 32)"

# Step 5: Generate domain
echo "5. Run: railway domain"

# Step 6: Check deployment status
echo "6. Run: railway status"

echo ""
echo "🔗 After deployment, your app will be available at:"
echo "   https://your-app-name.railway.app"
echo ""
echo "📚 To view logs: railway logs"
echo "🌐 To open dashboard: railway open"