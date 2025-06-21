# Deployment Guide

This guide covers deploying the Bridge Discussion Website to various hosting platforms.

## Option 1: Railway (Recommended - Full Stack)

Railway can host your entire application with database included.

### Steps:

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with your GitHub account

2. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `bridge-bidding-discussion-website` repository
   - Railway will automatically detect it's a Node.js app

3. **Add PostgreSQL Database**
   - In your project dashboard, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will provision a database and provide connection details

4. **Set Environment Variables**
   - Go to your backend service
   - Click "Variables" tab
   - Add these variables:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=production
   PORT=3001
   ```
   - Railway will auto-fill the DATABASE_URL from your Postgres service

5. **Custom Start Command**
   - In backend service settings, set start command: `npm run build && npm run start`
   - Or Railway will use the railway.json config automatically

6. **Deploy**
   - Push changes to your main branch
   - Railway auto-deploys on git push

### Railway Environment Variables:
```bash
# Required
DATABASE_URL=postgresql://... # Auto-provided by Railway Postgres
JWT_SECRET=your-secret-key
NODE_ENV=production

# Optional
PORT=3001 # Railway sets this automatically
```

---

## Option 2: Vercel (Frontend) + Supabase (Backend/DB)

### Frontend on Vercel:

1. **Deploy Frontend**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set build settings:
     - Framework: `Vite`
     - Root Directory: `frontend`
     - Build Command: `npm run build`
     - Output Directory: `dist`

### Backend on Supabase:

1. **Database Setup**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Get database URL from settings

2. **Backend Hosting**
   - Use Vercel Functions or Railway for the backend
   - Or deploy to Render.com

---

## Option 3: Render (Full Stack)

### Steps:

1. **Sign up for Render**
   - Go to [render.com](https://render.com)
   - Connect your GitHub account

2. **Deploy Backend**
   - Create "New Web Service"
   - Connect your GitHub repo
   - Settings:
     - Root Directory: `backend`
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`

3. **Add PostgreSQL**
   - Create "New PostgreSQL" database
   - Copy connection URL

4. **Environment Variables**
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```

5. **Deploy Frontend**
   - Create "New Static Site"
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

---

## Pre-Deployment Checklist

### 1. Update Frontend API URLs
Edit `frontend/src/utils/api.ts` to use your production backend URL:

```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.railway.app/api'  // Replace with your actual URL
  : 'http://localhost:3001/api';
```

### 2. Environment Variables
Backend `.env`:
```bash
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### 3. Build Commands
- **Backend**: `npm run build && npm run start`
- **Frontend**: `npm run build`

### 4. Database Migration
After deployment, run:
```bash
npx prisma migrate deploy
npx prisma db seed  # Optional: adds admin user and labels
```

---

## Testing Your Deployment

1. **Backend Health Check**
   - Visit `https://your-backend-url/api/health`
   - Should return `{"status": "ok"}`

2. **Frontend**
   - Visit your frontend URL
   - Try signing up/in
   - Import a PBN file
   - Create comments and polls

3. **Database**
   - Check that user registration works
   - Verify data persistence

---

## Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Add your frontend URL to backend CORS settings
   - Update `CORS_ORIGIN` environment variable

2. **Database Connection**
   - Verify `DATABASE_URL` format
   - Check network access in hosting provider

3. **API Calls Failing**
   - Update frontend API base URL
   - Check environment variables

4. **Build Failures**
   - Verify Node.js version (18+)
   - Check package.json scripts
   - Review build logs

---

## Cost Estimates

### Railway (Free Tier Available)
- **Free**: $0/month - Good for development
- **Pro**: $5/month + usage - Production ready

### Vercel + Supabase
- **Vercel**: Free for hobby projects
- **Supabase**: Free tier available, $25/month for production

### Render
- **Free**: Static sites free, web services $7/month
- **Starter**: $25/month for production apps

---

## Recommended: Railway Deployment

Railway is the easiest option for this full-stack app. Here's the quick setup:

1. Push your code to GitHub
2. Connect Railway to your GitHub repo
3. Add PostgreSQL database
4. Set environment variables
5. Deploy!

Railway handles the complexity of connecting frontend, backend, and database automatically.