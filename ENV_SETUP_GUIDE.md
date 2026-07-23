# Environment Variables Setup Guide

This guide helps you configure all necessary environment variables for local development.

## 1. Email Configuration (For Forgot Password & Order Emails)

Get your email credentials and add to `.env.local`:

### Option A: Gmail (Recommended - Free)

1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Create an "App Password":
   - Search for "App passwords" in security settings
   - Generate one for "Mail" and "Windows Computer"
   - Copy the 16-character password

4. Add to `.env.local`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Ziki Apparel
```

### Option B: SendGrid (Paid - Professional)

1. Create account at https://sendgrid.com
2. Get API key from Settings → API Keys
3. Add to `.env.local`:
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@zikiapparel.com
EMAIL_FROM_NAME=Ziki Apparel
```

### Test Email Configuration

Run this command to test if email is working:

```bash
curl -X POST http://localhost:3000/api/test/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"zikiapparel@gmail.com"}'
```

Should see: `{"success":true,"message":"✅ Test email sent successfully..."}`

---

## 2. Image Upload Configuration (Supabase Storage)

Image uploads use Supabase Storage which works on Vercel.

### Local Development Setup

1. **Get Supabase Credentials:**
   - Go to https://app.supabase.com → Your Project
   - Click **Settings** (bottom left) → **API**
   - Copy: **Project URL** and **Anon public key**

2. **Add to `.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

3. **Create Storage Bucket:**
   - In Supabase: **Storage** (left sidebar)
   - Click **Create new bucket**
   - Name: `product-images`
   - Make it **Public**
   - Click **Create bucket**

4. **Set Bucket Permissions:**
   - Click the bucket: `product-images`
   - Click **Policies** tab
   - Make sure public access is enabled for read
   - Add policy for authenticated users to upload

### Test Image Upload

1. Start dev server: `npm run dev`
2. Go to http://localhost:3000/admin/products/new
3. Try uploading an image
4. Check console for detailed error messages if it fails

---

## 3. Authentication Configuration

### Production (Vercel)

Make sure these are set in Vercel Environment Variables:

```
NEXTAUTH_URL=https://zikiapparel.vercel.app (your actual domain)
NEXTAUTH_SECRET=generate-with: openssl rand -base64 32
DATABASE_URL=from Supabase with pooler endpoint
DIRECT_URL=from Supabase with direct endpoint
```

### Local Development (`.env.local`)

Copy these from Vercel:

```bash
vercel env pull .env.local
```

Or manually add:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key (can be anything for dev)
DATABASE_URL=from Vercel env
DIRECT_URL=from Vercel env
```

---

## 4. Stripe Configuration (Optional - For Payments)

If you want to test payments locally:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

Get from: https://dashboard.stripe.com → API Keys

---

## 5. Complete `.env.local` Example

Here's a complete template for local development:

```
# Database
DATABASE_URL=postgresql://user:password@host:6543/postgres?statement_cache_size=0
DIRECT_URL=postgresql://user:password@host:5432/postgres

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key-change-in-production

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Ziki Apparel

# Supabase Storage (for images)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional - Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 6. Testing Setup

### Test Email
```bash
curl -X POST http://localhost:3000/api/test/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'
```

### Test Admin Login
1. Email: `admin@zikiapparel.com`
2. Password: `admin123`

### Test Customer Account
1. Sign up with any email
2. Sign in with the email and password

### Test Image Upload
1. Go to: http://localhost:3000/admin/products/new
2. Log in as admin
3. Fill in product details
4. Try uploading an image

---

## Common Issues & Fixes

### Email not sending?
- ❌ Check `EMAIL_HOST` is correct (smtp.gmail.com for Gmail)
- ❌ Check `EMAIL_PASS` is Gmail App Password, not regular password
- ❌ Check 2FA is enabled on Gmail account
- ✅ Run email test: `curl -X POST ...` (see above)

### Images not uploading?
- ❌ Check `NEXT_PUBLIC_SUPABASE_URL` is set
- ❌ Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- ❌ Check bucket `product-images` exists in Supabase
- ❌ Check bucket is set to Public
- ✅ Check browser console for errors
- ✅ Check server logs: `npm run dev`

### Can't sign in?
- ❌ Check `DATABASE_URL` is set
- ❌ Check `NEXTAUTH_SECRET` is set
- ❌ Check database connection works
- ✅ Run: `npm run db:seed` to create test users
- ✅ Check: Email is `admin@zikiapparel.com`, Password is `admin123`

### Admin login works in dev but not production?
- ❌ Check `NEXTAUTH_URL` in Vercel is correct (must be your domain)
- ❌ Check `NEXTAUTH_SECRET` is set (use `openssl rand -base64 32`)
- ✅ Redeploy after setting env vars

---

Need help? Check the logs:
```bash
npm run dev  # Watch console for errors
```
