# 🚀 Complete Render Deployment Setup

## 📋 **Render Service Configuration**

### **Basic Settings**
- **Service Type**: `Web Service`
- **Environment**: `Node`
- **Region**: `Oregon (US West)` or your preferred region
- **Branch**: `main`
- **Root Directory**: ` ` (leave blank - build from root)

### **Build & Deploy Settings**
```bash
# Build Command
npm ci && vite build && node build.js

# Start Command  
npm start

# Node Version
20.19.4
```

### **Advanced Settings**
- **Auto-Deploy**: `Yes`
- **Health Check Path**: `/`
- **Docker Command**: Leave blank
- **Pre-Deploy Command**: Leave blank

## 🔧 **Environment Variables**

### **Required Variables**
```bash
DATABASE_URL=postgresql://your-neon-connection-string
SESSION_SECRET=your-32-character-random-string
NODE_ENV=production
PORT=10000
```

### **Optional Variables (Email Features)**
```bash
BREVO_API_KEY=your-brevo-api-key
BREVO_SMTP_USER=your-brevo-smtp-username
```

## 🗂️ **File Structure Verification**

Your project should have this structure:
```
project-root/
├── client/
│   ├── index.html          ✅ Required for Vite build
│   ├── src/
│   └── public/
├── server/
│   ├── index.ts            ✅ Development entry
│   ├── production.ts       ✅ Production entry (clean)
│   └── routes.ts
├── shared/
├── dist/                   ✅ Build output directory
├── package.json            ✅ Build scripts
├── vite.config.ts          ✅ Vite configuration
├── render.yaml             ✅ Render configuration
└── build.js                ✅ Custom build script
```

## 📦 **Package.json Scripts**

Verify these scripts exist:
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && node build.js",
    "start": "NODE_ENV=production node dist/index.js",
    "db:push": "drizzle-kit push"
  }
}
```

## 🔗 **GitHub Repository Setup**

### **1. Prepare Repository**
```bash
# Add all files
git add .

# Commit changes
git commit -m "Final deployment configuration"

# Push to GitHub
git push origin main
```

### **2. Files to Ensure Are Committed**
- ✅ `server/production.ts` (clean production entry)
- ✅ `build.js` (custom build script)
- ✅ `render.yaml` (Render configuration)
- ✅ `.env.example` (environment template)
- ✅ `RENDER_DEPLOYMENT.md` (documentation)
- ✅ Updated `vite.config.ts`

## 🎯 **Step-by-Step Deployment**

### **Step 1: Create Render Service**
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your repository

### **Step 2: Configure Build Settings**
```bash
Name: complaint-management-system
Environment: Node
Region: Oregon (US West)
Branch: main
Root Directory: (leave blank)
Build Command: npm ci && node build.js
Start Command: npm start
```

### **Step 3: Set Environment Variables**
```bash
DATABASE_URL = postgresql://your-neon-connection-string
SESSION_SECRET = your-32-character-random-string
NODE_ENV = production
PORT = 10000
```

### **Step 4: Deploy**
Click "Create Web Service" - Render will:
1. Clone your repository
2. Install dependencies with `npm ci`
3. Build frontend with `vite build`
4. Build backend with `node build.js`
5. Start server with `npm start`

## 🔒 **Security Configuration**

### **Generate SESSION_SECRET**
```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32

# Option 3: Online (secure)
# Visit: https://generate-secret.vercel.app/32
```

### **Database Connection**
Your Neon DATABASE_URL should look like:
```
postgresql://username:password@ep-wandering-queen-a1uv5kby-pooler.ap-southeast-1.aws.neon.tech:5432/neondb?sslmode=require
```

## 🌐 **Post-Deployment**

### **Your App URLs**
- **Live URL**: `https://complaint-management-system.onrender.com`
- **Dashboard**: Available in Render dashboard
- **Logs**: Available in Render service logs

### **First Login**
- **Admin User**: `temp`
- **Password**: `temp`

### **Verify Deployment**
1. ✅ App loads at your Render URL
2. ✅ Login works with temp/temp
3. ✅ Database connection successful
4. ✅ All pages render correctly
5. ✅ Complaint system functional

## ⚡ **Performance Optimization**

### **Auto-Sleep Prevention**
Render free tier apps sleep after 15 minutes. To keep alive:
- Upgrade to paid plan, OR
- Use external monitoring service to ping your app

### **Database Performance**
- Using Neon pooler connection for optimal performance
- Connection string includes pooler configuration

## 🐛 **Troubleshooting**

### **Common Issues & Solutions**

1. **Build Fails - "Could not resolve entry module"**
   - ✅ **FIXED**: Vite config already configured correctly
   - Root directory points to `./client`
   - `index.html` exists in client folder

2. **"Cannot find package 'vite'" in production**
   - ✅ **FIXED**: Using separate `production.ts` entry point
   - No Vite dependencies in production build

3. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Ensure Neon database is active
   - Check connection string includes SSL mode

4. **Session Issues**
   - Verify SESSION_SECRET is set
   - Must be 32+ character random string

## 📞 **Support**

If you encounter issues:
1. Check Render build/deploy logs
2. Verify all environment variables are set
3. Ensure GitHub repository is up to date
4. Contact Render support for platform issues

Your complaint management system is now ready for production deployment! 🎉