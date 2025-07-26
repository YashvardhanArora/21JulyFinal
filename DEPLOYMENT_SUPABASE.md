# Supabase Deployment Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Choose organization and enter:
   - **Name**: `complaint-management`
   - **Database Password**: (generate strong password)
   - **Region**: Choose closest to your users
5. Click "Create new project"

## 2. Get Database Connection String

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection String**
3. Copy the **URI** format connection string
4. The format should be one of these:
   - Direct: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - Pooler: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

**Important**: Make sure to:
- Replace [YOUR-PASSWORD] with your actual database password
- Use the correct project reference from your Supabase project
- Try both the direct connection and pooler connection if one doesn't work

**Network Issues**: If you get "ENOTFOUND" errors:
1. The Replit environment might have network restrictions to Supabase
2. Try the pooler connection format instead
3. Consider using Supabase's REST API for better compatibility
4. Alternative: Keep using the current Neon database (it's working perfectly)

## 3. Environment Variables

Set these environment variables in your deployment platform:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
BREVO_API_KEY=your_brevo_api_key_here
```

## 4. Deploy Schema

Run this command to create tables in your Supabase database:

```bash
npm run db:push
```

## 5. Verify Setup

1. Go to Supabase dashboard → **Table Editor**
2. You should see these tables:
   - `users`
   - `complaints` 
   - `complaint_history`
   - `notifications`

## 6. Deploy Application

### Option A: Vercel
```bash
npm i -g vercel
vercel
# Add DATABASE_URL and BREVO_API_KEY in Vercel dashboard
```

### Option B: Railway
```bash
npm i -g @railway/cli
railway login
railway link
railway up
# Add environment variables in Railway dashboard
```

### Option C: Render
1. Connect GitHub repo to Render
2. Set build command: `npm run build`
3. Set start command: `npm run start`
4. Add environment variables in settings

## 7. Initial Data

The application will automatically:
- Create admin user (username: admin, password: admin123)
- Create ASM users for testing
- Load 114 sample complaints from 2024

## 8. Supabase Features You Can Use

- **Real-time subscriptions**: Add live updates
- **Row Level Security**: Secure data access
- **Storage**: File upload for attachments
- **Edge Functions**: Serverless functions
- **Auth**: Built-in authentication (optional replacement)

## 9. Optional: Supabase Storage for File Attachments

If you want to handle complaint attachments:

1. Go to **Storage** in Supabase dashboard
2. Create bucket named `complaint-attachments`
3. Update the upload logic to use Supabase storage instead of local files

## Connection String Format

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres
```

Replace:
- `PROJECT_REF`: Your project reference (found in Settings → General)
- `PASSWORD`: Your database password
- `region`: Your selected region