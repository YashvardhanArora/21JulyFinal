# Railway Deployment Guide

## Required Environment Variables

Set these in your Railway dashboard (Settings → Environment):

### Database Configuration
```
DATABASE_URL=your_neon_database_url
```

### Optional Email Configuration
```
BREVO_API_KEY=your_brevo_smtp_key_if_needed
```

### Node Environment
```
NODE_ENV=production
```

## Railway Build Process

1. **Build Command:** `node build.js` (builds both frontend and backend)
2. **Start Command:** `npm start` (starts the production server)
3. **Port:** Railway automatically provides PORT environment variable

## Deployment Steps

1. Connect your GitHub repository to Railway
2. Set the environment variables above
3. Railway will automatically build using `node build.js`
4. Your app will start with `npm start` on the Railway-provided port

## Troubleshooting

- **Build Issues:** Ensure all dependencies are in `dependencies` not `devDependencies`  
- **Database Connection:** Make sure DATABASE_URL is correctly set
- **Port Issues:** The app automatically uses Railway's PORT environment variable

Your application should now be running on Railway!