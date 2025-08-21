# Render Deployment Guide for Complaint Management System

## Prerequisites

1. **Neon Database**: You already have your database on Neon
2. **GitHub Repository**: Your code needs to be in a GitHub repository
3. **Render Account**: Sign up at https://render.com

## Deployment Steps

### 1. Prepare Environment Variables

You'll need to set these environment variables in Render:

- `DATABASE_URL`: Your Neon database connection string
- `SESSION_SECRET`: A random secret for session management (Render can generate this)
- `NODE_ENV`: Set to "production"
- `PORT`: Set to 10000 (Render's default)

Optional (for email functionality):
- `BREVO_API_KEY`: Your Brevo SMTP API key
- `BREVO_SMTP_USER`: Your Brevo SMTP username

### 2. Deploy to Render

#### Option A: Using Render Dashboard (Recommended)

1. **Connect GitHub Repository**:
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub account and select your repository

2. **Configure the Service**:
   - **Name**: `complaint-management-system`
   - **Environment**: Node
   - **Region**: Choose closest to your users
   - **Branch**: main (or your default branch)
   - **Build Command**: `npm ci && node build.js`
   - **Start Command**: `npm start`

3. **Set Environment Variables**:
   - Click "Advanced" → "Add Environment Variable"
   - Add all the variables listed above
   - For `DATABASE_URL`, use your Neon connection string

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

#### Option B: Using render.yaml (Infrastructure as Code)

1. **Commit the render.yaml file** to your repository
2. **Import from render.yaml**:
   - Go to https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will read the configuration from render.yaml

### 3. Database Configuration

Since you're using Neon, you don't need Render's database service. Just:

1. **Get your Neon connection string**:
   - Go to your Neon dashboard
   - Copy the connection string (should look like: `postgresql://username:password@host:5432/database`)

2. **Set DATABASE_URL in Render**:
   - Use your Neon connection string as the `DATABASE_URL` environment variable

### 4. Post-Deployment

1. **Run Database Migrations** (if needed):
   - Go to your Render service dashboard
   - Open the Shell
   - Run: `npm run db:push`

2. **Verify the Application**:
   - Your app will be available at: `https://complaint-management-system.onrender.com`
   - Test all functionality including login, dashboard, and complaint management

## Important Notes

### Build Configuration
- The build process compiles both frontend (React) and backend (Express)
- Frontend builds to `dist/public`
- Backend builds to `dist/index.js`
- Static files are served by Express in production

### Database Considerations
- Neon provides excellent performance and reliability
- Connection pooling is already configured in your application
- No additional database setup needed on Render

### Performance Tips
- Render's free tier has some limitations (sleeps after 15 minutes of inactivity)
- Consider upgrading to a paid plan for production use
- Monitor performance in Render's dashboard

### Security
- All sensitive data should be in environment variables
- HTTPS is provided automatically by Render
- Your Neon database connection is encrypted

## Troubleshooting

### Common Issues

1. **Build Fails with Status 127** (RESOLVED):
   - This was caused by Vite dependencies being imported in production
   - Fixed by creating separate production.ts entry point
   - Production build now completely clean of development dependencies
   - Build process: `npm ci && vite build && node build.js`

2. **General Build Fails**:
   - Check that all dependencies are in `package.json`
   - Verify build command is correct
   - Check build logs in Render dashboard

2. **Database Connection Issues**:
   - Verify your Neon connection string is correct
   - Check that Neon database is accessible
   - Ensure environment variables are set correctly

3. **Application Won't Start**:
   - Check that start command is `npm start`
   - Verify `PORT` environment variable is set to 10000
   - Review application logs in Render dashboard

### Support Resources
- Render Documentation: https://render.com/docs
- Neon Documentation: https://neon.tech/docs
- GitHub Issues: Create issues in your repository for project-specific problems

## Cost Estimate
- **Render Free Tier**: $0/month (with limitations)
- **Render Starter**: $7/month (recommended for production)
- **Neon Free Tier**: $0/month (3GB storage, sufficient for this application)

Your application should deploy successfully and be accessible within 5-10 minutes of setup.