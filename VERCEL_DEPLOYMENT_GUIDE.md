# 🚀 Vercel Deployment Guide

Your Bridge Bidding Discussion Website is fully configured for Vercel deployment! Here are the complete instructions to deploy:

## ✅ **Pre-configured Files**

All configuration files are already created and ready:
- ✅ `vercel.json` - Full-stack app configuration
- ✅ `backend/src/index.ts` - Serverless function export
- ✅ Environment files for production
- ✅ Build scripts and routing setup

## 🎯 **Option 1: Direct CLI Deployment (Recommended)**

### **Step 1: Login to Vercel**
```bash
vercel login
```
Choose your preferred login method (GitHub recommended).

### **Step 2: Deploy the Application**
```bash
vercel --prod
```

When prompted:
- **Set up and deploy?** → `Yes`
- **Which scope?** → Select your account
- **Link to existing project?** → `No` 
- **Project name?** → `bridge-bidding-website`
- **Directory?** → `./` (current directory)

### **Step 3: Add Database (PostgreSQL)**
```bash
vercel env add DATABASE_URL
```
Enter your PostgreSQL connection string when prompted.

### **Step 4: Add Environment Variables**
```bash
# JWT Secret for authentication
vercel env add JWT_SECRET
# Enter a secure random string (e.g., output of: openssl rand -base64 32)

# Frontend URL (will be your Vercel domain)
vercel env add FRONTEND_URL
# Enter: https://your-project-name.vercel.app

# API URL for frontend
vercel env add VITE_API_URL
# Enter: https://your-project-name.vercel.app/api
```

### **Step 5: Redeploy with Environment Variables**
```bash
vercel --prod
```

## 🎯 **Option 2: GitHub Integration (Automatic)**

### **Step 1: Connect Repository**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub: `eddovandenboom/bridge-bidding-discussion-website`

### **Step 2: Configure Project**
- **Framework Preset:** Other
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output Directory:** `frontend/dist`

### **Step 3: Add Environment Variables**
In the Vercel dashboard, go to Project Settings → Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Production |
| `JWT_SECRET` | `your-secure-random-string` | Production |
| `FRONTEND_URL` | `https://your-project.vercel.app` | Production |
| `VITE_API_URL` | `https://your-project.vercel.app/api` | Production |
| `NODE_ENV` | `production` | Production |

### **Step 4: Deploy**
Click "Deploy" - Vercel will automatically build and deploy your app!

## 📊 **Database Setup**

### **Option A: Vercel Postgres (Recommended)**
```bash
vercel env add DATABASE_URL
# Vercel will provide the connection string
```

### **Option B: External PostgreSQL**
Use any PostgreSQL provider (Railway, Supabase, AWS RDS, etc.):
```bash
vercel env add DATABASE_URL
# Enter: postgresql://username:password@host:5432/database_name
```

## 🔧 **Post-Deployment**

### **Run Database Migrations**
After deployment, run Prisma migrations:
```bash
# Set up Prisma (if not already done)
vercel env add PRISMA_GENERATE_DATAPROXY true

# Deploy migrations
npx prisma migrate deploy
npx prisma generate
```

### **Seed Database (Optional)**
```bash
npx prisma db seed
```

## 🎉 **Your App Will Be Live At:**
```
https://your-project-name.vercel.app
```

## 📋 **Vercel Configuration Details**

The `vercel.json` configures:
- ✅ **Frontend:** Static build from `frontend/dist`
- ✅ **Backend:** Serverless functions from `backend/src/index.ts`
- ✅ **Routing:** `/api/*` → Backend, everything else → Frontend
- ✅ **Build:** Automatically runs `npm run build`
- ✅ **Functions:** 30-second timeout for database operations

## 🔧 **Troubleshooting**

### **Build Errors**
```bash
# Test build locally first
npm run build

# Check Vercel logs
vercel logs
```

### **Database Connection Issues**
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL

# Test Prisma connection
npx prisma db pull
```

### **Environment Variables**
```bash
# List all environment variables
vercel env ls

# Remove incorrect variables
vercel env rm VARIABLE_NAME
```

## 🚀 **Quick Deploy Command**

For immediate deployment:
```bash
vercel login && vercel --prod
```

**Your bridge bidding discussion website is ready to go live! 🌉♠️♥️♦️♣️**