# Ziki Apparel Production Database Initialization Guide

## 🔴 Problem: Products Not Showing in Production

**Symptoms:**
- ✅ Health check returns: `"status":"ok","database":"connected"`
- ❌ But NO categories, products, or features display
- API endpoints return empty arrays

**Root Cause:**
The database is connected but **completely empty** - the seed data was never populated.

---

## 🔧 Solution: Initialize the Database

You have **3 options** to seed your production database:

---

## Option 1: Using the Admin Initialization Endpoint (⭐ RECOMMENDED)

### Step 1: Set Environment Variable
Add to your Vercel environment variables:
```
INIT_SECRET=your-super-secret-initialization-key-here
```

Make it long and random (e.g., use `openssl rand -hex 32` to generate)

### Step 2: Call the Initialization Endpoint
```bash
curl -X POST https://your-domain.vercel.app/api/admin/init-seed \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your-super-secret-initialization-key-here"
```

### Step 3: Verify Success
Response will show:
```json
{
  "message": "Database initialized successfully",
  "stats": {
    "adminCreated": true,
    "categoriesCreated": 2,
    "productsCreated": 6
  }
}
```

**Calling it again will fail safely:**
```json
{
  "message": "Database already initialized",
  "productsCount": 6
}
```

---

## Option 2: Using Prisma CLI (Local Development)

If you have local access to the production database (WITH CAUTION):

```bash
# Option A: Using your production DATABASE_URL
DATABASE_URL="postgresql://..." npm run db:seed

# Option B: Using tsx directly
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
```

⚠️ **WARNING**: Only do this if you're absolutely sure about your connection string

---

## Option 3: Manual Database Seeding with Vercel Functions

Create a one-time deployment with a seed script, then remove it.

1. Create `scripts/seed-prod.ts`
2. Update `package.json`: Add `"seed-prod": "tsx scripts/seed-prod.ts"`
3. Create a deployment-time script in `vercel.json`:
   ```json
   {
     "buildCommand": "npm run db:migrate && npm run seed-prod && npm run build"
   }
   ```
4. Deploy and remove the config after success

---

## ✅ After Initialization: Verify Data

### Check with the Products API
```bash
curl https://your-domain.vercel.app/api/products?limit=1
```

Expected response: Products array with data

### Check with the Categories API
```bash
curl https://your-domain.vercel.app/api/categories
```

Expected response: Array with 2 categories

### Local Check
```bash
npm run db:seed  # Seeds local database
npx tsx check-products.ts  # Shows product count
```

---

## 📊 What Gets Seeded

When you initialize the database, you get:

### Admin User
- Email: `admin@zikiapparel.com`
- Password: `admin123`
- ⚠️ Change this immediately after first login!

### Categories
- Men's Jeans
- Women's Jeans

### Products (6 Total, All ACTIVE)
1. Classic Straight Leg Jeans (Featured)
2. Slim Fit Dark Wash Jeans (Featured)
3. High-Waisted Skinny Jeans (Featured)
4. Relaxed Fit Vintage Jeans
5. Bootcut Classic Jeans
6. Raw Selvedge Denim

Each product has:
- ✅ Multiple sizes
- ✅ Color variants
- ✅ Stock levels
- ✅ Pricing information
- ✅ Product images from Unsplash

---

## 🚨 Troubleshooting

### "Database already initialized" error
The database already has products. This is safe - the endpoint won't overwrite existing data.

To reset (destructive):
```bash
# LOCAL ONLY - BACKUP YOUR DATA FIRST!
npx prisma migrate reset --force
npm run db:seed
```

### Init endpoint returns 401 (Unauthorized)
- Check your `INIT_SECRET` matches exactly (no extra spaces)
- Verify the variable is set in Vercel environment
- Restart your deployment after setting new env vars

### "Method not allowed" error
Make sure you're sending a POST request, not GET:
```bash
# ✅ Correct
curl -X POST https://your-domain.vercel.app/api/admin/init-seed ...

# ❌ Wrong
curl https://your-domain.vercel.app/api/admin/init-seed ...
```

### Still seeing 0 products after initialization
1. Verify the init endpoint returned success
2. Check Vercel logs: `vercel logs [project-id]`
3. Try the products API directly to verify data exists
4. Clear browser cache (might be caching empty response)

---

## 🔐 Security Notes

- The `INIT_SECRET` should be **long and random**
- Never commit the secret to version control
- The endpoint only works if database is empty (prevents accidental data overwrites)
- After initialization, this endpoint will always return "already initialized"
- Consider disabling the endpoint in production after initial setup (or adding IP restrictions)

---

## 📝 For Future Deploys

To prevent this issue in future deployments:

1. **Option A**: Always run seeding in your CI/CD pipeline
   ```bash
   npm run db:migrate && npm run db:seed
   ```

2. **Option B**: Keep a separate initialization script separate from build

3. **Option C**: Use Vercel's database initialization hooks (if available)

---

## ❓ Questions?

Check logs with:
```bash
# View Vercel function logs
vercel logs [your-project-id]

# Or check Prisma logs
DATABASE_URL="your-prod-url" npx prisma studio
```
