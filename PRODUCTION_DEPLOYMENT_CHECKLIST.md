# Production Deployment Checklist

Before deploying to production, ensure all these are configured in Vercel.

## 🔐 Critical Environment Variables

Go to **Vercel** → Your Project → **Settings** → **Environment Variables** → **Production**

### Authentication (Required)
```
NEXTAUTH_SECRET = [Generate with: openssl rand -base64 32]
NEXTAUTH_URL = https://zikiapparel.vercel.app  [Your actual domain]
```

**How to generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```
Copy the output and paste it in Vercel.

**NEXTAUTH_URL must be:**
- ✅ Your actual domain (e.g., https://zikiapparel.vercel.app)
- ❌ NOT http://localhost:3000
- ❌ NOT with trailing slash

---

### Database (Required)
```
DATABASE_URL = postgresql://user:pass@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?statement_cache_size=0
DIRECT_URL = postgresql://user:pass@aws-1-ap-southeast-1.db.supabase.com:5432/postgres
```

**Verify:**
- ✅ DATABASE_URL uses pooler endpoint (port 6543)
- ✅ DIRECT_URL uses direct endpoint (port 5432)
- ✅ Both have correct credentials

---

### Email Service (Required for Forgot Password)

#### Option 1: Gmail (Free)
```
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_SECURE = false
EMAIL_USER = your-email@gmail.com
EMAIL_PASS = your-16-char-app-password
EMAIL_FROM = your-email@gmail.com
EMAIL_FROM_NAME = Ziki Apparel
```

#### Option 2: SendGrid (Professional)
```
EMAIL_HOST = smtp.sendgrid.net
EMAIL_PORT = 587
EMAIL_SECURE = false
EMAIL_USER = apikey
EMAIL_PASS = your-sendgrid-api-key
EMAIL_FROM = noreply@zikiapparel.com
EMAIL_FROM_NAME = Ziki Apparel
```

---

### Image Storage (Required for Product Images)
```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-public-key
```

**Note:** These are `NEXT_PUBLIC_*` so they're safe to expose on frontend.

---

### Stripe (Optional - For Payments)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
STRIPE_SECRET_KEY = sk_live_...
```

---

## ✅ Pre-Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] NEXTAUTH_SECRET is unique and strong
- [ ] NEXTAUTH_URL matches your domain exactly
- [ ] Database pooler endpoint is correct (port 6543)
- [ ] Email service configured and tested
- [ ] Supabase bucket `product-images` created and set to Public
- [ ] Supabase credentials are for production project
- [ ] `.env.local` is NOT committed to git
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in dev: `npm run dev`

---

## 🚀 Deployment Steps

### Step 1: Verify All Code Changes Are Committed
```bash
git status
git add .
git commit -m "fix: auth, email, image uploads for production"
git push origin main
```

### Step 2: Add Environment Variables to Vercel
1. Go to https://vercel.com/dashboard
2. Select your project
3. **Settings** → **Environment Variables**
4. Add each variable above for **Production**
5. Click **Save**

### Step 3: Trigger Deployment
In Vercel dashboard, click **Redeploy** (or auto-deploys on git push)

### Step 4: Monitor Deployment
1. Watch the deployment logs
2. Check for any build errors
3. Once deployed, go to your domain

### Step 5: Test Production

#### Test Admin Login
- Go to https://yoursite.com/auth/signin
- Email: `admin@zikiapparel.com`
- Password: `admin123`
- Should be redirected to /admin

#### Test Customer Signup
- Click "Create account"
- Fill in signup form
- Should receive confirmation email
- Sign in with new credentials

#### Test Forgot Password
- Go to /auth/forgot-password
- Enter email
- Check inbox for reset link
- Reset password should work

#### Test Product Upload
- Go to /admin/products/new
- Fill in product details
- Upload an image
- Image should appear in Supabase bucket

---

## 🐛 Troubleshooting

### Admin/Customer Can't Sign In
**Check:**
- [ ] NEXTAUTH_SECRET is set in Vercel
- [ ] NEXTAUTH_URL matches your domain
- [ ] DATABASE_URL is correct (check with `vercel env ls`)
- [ ] User exists in database (`npm run db:seed` locally first)

**Debug:**
```bash
# Check logs in Vercel
vercel logs <your-project>

# Look for: ✅ Auth success or ❌ Auth error messages
```

### Email Not Sending
**Check:**
- [ ] EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS are set
- [ ] Gmail: App Password is 16 characters (not regular password)
- [ ] Gmail: 2FA is enabled
- [ ] SendGrid: API key is correct

**Debug:**
```bash
# In local dev, test email with:
curl -X POST https://zikiapparel.vercel.app/api/test/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your@email.com"}'
```

### Image Upload Not Working
**Check:**
- [ ] NEXT_PUBLIC_SUPABASE_URL is set
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY is set
- [ ] Bucket `product-images` exists
- [ ] Bucket is set to Public

**Debug:**
- Check browser console for upload errors
- Check Vercel logs for server errors

### Database Connection Errors
**Check:**
- [ ] DATABASE_URL uses pooler endpoint (6543)
- [ ] DIRECT_URL uses direct endpoint (5432)
- [ ] Credentials are correct
- [ ] Supabase project is not paused

**Fix:**
- In Supabase, go to **Project Settings** → **General**
- Verify project is not paused
- Check Database credentials are correct

---

## 📊 Post-Deployment Monitoring

### Daily Checks
- [ ] Admin dashboard accessible
- [ ] Orders being processed
- [ ] Emails sending (check order confirmations)
- [ ] Images uploading properly

### Weekly Checks
- [ ] Verify database backups
- [ ] Check error logs in Vercel
- [ ] Monitor email sending limits

### Monitor URLs
- **Status**: https://vercel.com/dashboard → Your Project
- **Logs**: `vercel logs <project> --follow`
- **Errors**: Check Vercel deploy logs
- **Performance**: Check Next.js Analytics in Vercel

---

## 🔄 Rollback Plan

If something goes wrong:

```bash
# Revert last commit
git revert HEAD
git push

# Or go to specific version
git log --oneline
git checkout <commit-hash>
git push --force-with-lease
```

Vercel will auto-redeploy the old version.

---

## 📞 Support

**If something fails:**

1. Check Vercel logs: `vercel logs <project> --follow`
2. Check environment variables match exactly
3. Check database connection with: `npm run db:push`
4. Test email locally: `npm run dev` → visit /api/test/send-email
5. Check Supabase status page

---

Generated: $(date)
Project: Ziki Apparel
