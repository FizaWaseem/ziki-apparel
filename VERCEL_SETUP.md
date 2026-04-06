# Vercel Production Setup Guide

## Database Configuration Issue - SOLUTION

The error `Can't reach database server at 'iahm2J:5432'` means your DATABASE_URL isn't properly set in Vercel's environment variables.

### Step 1: Get Your Database Credentials

From your `.env.local`, copy these values:

```
DATABASE_URL=postgresql://postgres.zwvseidfekoppcelujvq:%40iahm2J%23zNAUVJB@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres

DIRECT_URL=postgresql://postgres.zwvseidfekoppcelujvq:%40iahm2J%23zNAUVJB@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

### Step 2: Add to Vercel Project

1. Go to https://vercel.com/dashboard/ziki-apparel/settings/environment-variables
2. Add these environment variables:

| Variable Name | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres.zwvseidfekoppcelujvq:%40iahm2J%23zNAUVJB@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres` |
| `DIRECT_URL` | `postgresql://postgres.zwvseidfekoppcelujvq:%40iahm2J%23zNAUVJB@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres` |

**Important:**
- **DATABASE_URL** uses port 6543 (Supabase connection pooler) - for regular queries
- **DIRECT_URL** uses port 5432 (direct connection) - for migrations only

### Step 3: Deploy

After adding environment variables:

```bash
git push origin main
```

Vercel will automatically redeploy with the new environment variables.

### Step 4: Verify Connection

Go to your production URL and check:
- `/api/health` - Should return status 200 with user count
- Homepage should load without database errors

## Environment Variables Needed

**All Production Variables:**
```
DATABASE_URL=postgresql://...@pooler:6543/postgres
DIRECT_URL=postgresql://...@host:5432/postgres
SHADOW_DATABASE_URL=(optional, for migrations only)
EMAIL_USER=zikiapparel@gmail.com
EMAIL_PASS=alkb qynm sqzl wjch
NEXTAUTH_SECRET=zikiapparel-secret-key-2025-production-mode
NEXTAUTH_URL=https://ziki-apparel.vercel.app
```

## Understanding the Connection URLs

### DATABASE_URL (Port 6543) - Connection Pooler
- **Purpose**: Regular application queries
- **Why**: Prevents connection exhaustion with hundreds of requests
- **Best for**: Production with many concurrent users
- **Supabase**: Points to connection pooler

### DIRECT_URL (Port 5432) - Direct Connection
- **Purpose**: Prisma migrations and schema updates
- **Why**: Migrations need a direct connection to the database
- **Used by**: `prisma migrate` commands
- **Supabase**: Direct database connection

## Troubleshooting

### Error: `Can't reach database server`
- ✅ Check DATABASE_URL is set in Vercel
- ✅ Verify URL format is complete (not cut off)
- ✅ Confirm Supabase project is active
- ✅ Check IP allowlist in Supabase settings

### Error: `prepared statement already exists`
- ✅ Use connection pooler (port 6543) instead of direct connection
- ✅ Ensure DATABASE_URL uses pooler URL

### Error: `migration lock`
- ✅ Use DIRECT_URL for migrations (port 5432)
- ✅ Database should be in `.env.local` and Vercel vars

## Testing Locally vs Production

### Local Development
```bash
# Uses .env.local
DATABASE_URL="postgresql://...@pooler:6543/postgres"
yarn run dev
```

### Production (Vercel)
```bash
# Uses Vercel environment variables
DATABASE_URL="postgresql://...@pooler:6543/postgres"
```

Both should use the same connection string format.

## Security Note

Your connection string contains credentials. **Never commit this to git!**
- ✅ `.env.local` is in `.gitignore`
- ✅ Set in Vercel dashboard only
- ✅ Never share in code or logs
