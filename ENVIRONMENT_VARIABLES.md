# Environment Variables Configuration

## Required Variables

### DATABASE_URL
Your Neon PostgreSQL connection string:
```
postgresql://username:password@host:5432/database
```

**For Neon Database:**
- Go to your Neon dashboard
- Select your database
- Copy the connection string (should include pooler for better performance)
- Example: `postgresql://user:pass@ep-wandering-queen-a1uv5kby-pooler.ap-southeast-1.aws.neon.tech:5432/neondb`

### SESSION_SECRET
A random secret key for session security:
```
SESSION_SECRET=your-very-secure-random-string-here
```

**Generate a secure secret:**
```bash
# Option 1: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Use OpenSSL
openssl rand -hex 32

# Option 3: Use online generator
# Visit: https://generate-secret.vercel.app/32
```

### NODE_ENV
Set to production for deployment:
```
NODE_ENV=production
```

### PORT
Render uses port 10000:
```
PORT=10000
```

## Optional Variables (Email Features)

### BREVO_API_KEY
Your Brevo SMTP API key for sending daily reports:
```
BREVO_API_KEY=your-brevo-api-key
```

**To get Brevo API key:**
1. Sign up at https://www.brevo.com
2. Go to Settings → SMTP & API
3. Create new API key
4. Copy the key

### BREVO_SMTP_USER
Your Brevo SMTP username:
```
BREVO_SMTP_USER=your-brevo-username
```

## Setting Environment Variables in Render

### Method 1: Render Dashboard
1. Go to your service in Render dashboard
2. Click "Environment" tab
3. Add each variable:
   - Key: `DATABASE_URL`
   - Value: Your Neon connection string
   - Click "Add"
4. Repeat for all variables

### Method 2: Render YAML (render.yaml)
Already configured in your `render.yaml` file:
```yaml
envVars:
  - key: NODE_ENV
    value: production
  - key: SESSION_SECRET
    generateValue: true  # Render will generate this
  - key: PORT
    value: 10000
```

You'll still need to add `DATABASE_URL` manually in the dashboard.

## Local Development

Create a `.env` file (never commit this file):
```bash
# Copy from .env.example
cp .env.example .env

# Edit with your actual values
nano .env
```

## Security Notes

- Never commit actual environment variables to Git
- Use strong, unique values for SESSION_SECRET
- Keep DATABASE_URL private
- Email variables are optional - app works without them

## Verification

Test your environment variables:
```bash
# Check if variables are set
echo $DATABASE_URL
echo $SESSION_SECRET

# Test database connection
npm run db:push
```

Your complaint management system will be fully functional once these variables are properly configured in Render.