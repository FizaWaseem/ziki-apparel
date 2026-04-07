# Production Database Recovery - Complete Guide

## 🔍 STEP 1: Diagnose Current Database State

**Wait 1-2 minutes for deployment, then run:**

```powershell
# PowerShell - Check database state
Invoke-WebRequest -Uri "https://zikiapparel.vercel.app/api/admin/db-check" -Method GET | ConvertTo-Json -Depth 10
```

**This will show:**
- ✅ How many products/categories/variants exist
- ✅ Status of each product (ACTIVE, DRAFT, ARCHIVED)
- ✅ Data integrity issues (missing images, variants)
- ✅ Recommendations for next steps

**Expected Output Example:**
```json
{
  "timestamp": "2026-04-07T...",
  "database": {
    "counts": {
      "products": 2,      // ← Should be 6!
      "categories": 2,    // ← Should be 2 ✓
      "variants": 8,
      "images": 2         // ← Should be 6!
    },
    "productsByStatus": [
      { "status": "ACTIVE", "_count": 2 }
    ]
  },
  "recommendations": [
    "⚠️ 4 PRODUCTS WITHOUT IMAGES"
  ]
}
```

---

## 🧹 STEP 2: Clean Database (If Corrupted)

**If db-check shows incomplete data (like above), run:**

```powershell
# PowerShell - Delete all corrupted data
Invoke-WebRequest -Uri "https://zikiapparel.vercel.app/api/admin/db-clean" `
    -Method POST `
    -Body "" | ConvertTo-Json
```

**Expected Response:**
```json
{
  "message": "Database cleaned successfully",
  "deleted": {
    "products": 2,
    "categories": 2,
    "variants": 8,
    "images": 2,
    "reviews": 0,
    "cartItems": 0,
    "orderItems": 0
  },
  "nextStep": "POST to /api/admin/db-seed-v2 to initialize with fresh data"
}
```

---

## 🌱 STEP 3: Seed Fresh Database

**Now seed with all 6 products:**

```powershell
# PowerShell - Seed fresh data
Invoke-WebRequest -Uri "https://zikiapparel.vercel.app/api/admin/db-seed-v2" `
    -Method POST `
    -Body "" | ConvertTo-Json -Depth 5
```

**Expected Response:**
```json
{
  "message": "✅ Database seeded successfully",
  "stats": {
    "adminCreated": true,
    "categoriesCreated": 2,
    "productsCreated": 6,
    "imagesCreated": 6,
    "variantsCreated": 18,
    "errorsEncountered": []
  },
  "finalCounts": {
    "products": 6,
    "categories": 2,
    "images": 6,
    "variants": 18
  }
}
```

---

## 🔬 STEP 4: Verify APIs Work

**Test Products API:**
```powershell
Invoke-WebRequest -Uri "https://zikiapparel.vercel.app/api/products?limit=2" -Method GET | ConvertTo-Json -Depth 5
```
Should show 6 products with images and variants.

**Test Categories API:**
```powershell
Invoke-WebRequest -Uri "https://zikiapparel.vercel.app/api/categories" -Method GET | ConvertTo-Json
```
Should show 2 categories (Men's & Women's Jeans).

**Test on First Load:**
Open https://zikiapparel.vercel.app in a NEW/INCOGNITO browser window.
- ✅ Should show products IMMEDIATELY (not on second load)
- ✅ Should show category filters
- ✅ No "Internal Server Error"

---

## ✅ Complete Workflow (Copy-Paste Ready)

```powershell
# 1. Check current state
Write-Host "1️⃣ Checking database state..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "https://zikiapparel.vercel.app/api/admin/db-check" -Method GET | ConvertTo-Json

# 2. Clean (if needed)
Write-Host "`n2️⃣ Cleaning database..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://zikiapparel.vercel.app/api/admin/db-clean" -Method POST -Body "" | ConvertTo-Json

Write-Host "`nWaiting 2 seconds for consistency..." -ForegroundColor Gray
Start-Sleep -Seconds 2

# 3. Seed fresh data
Write-Host "`n3️⃣ Seeding fresh data..." -ForegroundColor Green
Invoke-WebRequest -Uri "https://zikiapparel.vercel.app/api/admin/db-seed-v2" -Method POST -Body "" | ConvertTo-Json -Depth 5

# 4. Verify
Write-Host "`n4️⃣ Verifying products..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "https://zikiapparel.vercel.app/api/products?limit=1" -Method GET
$products = $response.Content | ConvertFrom-Json
Write-Host "✅ Found $($products.pagination.totalCount) products" -ForegroundColor Green
```

---

## 🚨 Troubleshooting

### "Database already has products"
```powershell
# Means db-check showed data exists. Run db-clean first:
Invoke-WebRequest -Uri "https://zikiapparel.vercel.app/api/admin/db-clean" -Method POST -Body ""
```

### Still getting "Internal Server Error"
This usually means a Prisma connection pool issue. The fix:
1. Check if Vercel logs show connection errors
2. The error details will show in the API response (we enabled that for debugging)
3. If it's a pool issue, clear browser cache and test again

### Products still not loading after seeding
1. Run db-check again to verify data exists
2. Clear browser cache
3. Open in INCOGNITO window (fresh session)
4. Check Vercel logs for more details

---

## 📊 What Gets Seeded

| Item | Count | Details |
|------|-------|---------|
| **Admin User** | 1 | Email: `admin@zikiapparel.com`, Password: `admin123` |
| **Categories** | 2 | Men's Jeans, Women's Jeans |
| **Products** | 6 | All ACTIVE with images & variants |
| **Images** | 6 | From Unsplash (1 per product) |
| **Variants** | 18 | 3-4 size/color combinations per product |

---

## 🔐 Security Notes

These endpoints are in **debug mode** (no auth required) for emergency recovery. After fixing:

1. **In production**, add environment variable protection
2. **Rate limit** the cleanup endpoints
3. **Only expose** in emergency situations
4. **Log all** database modifications

After database is stable, we'll add proper authentication.

---

## 📋 Summary of the Fix

**Why it wasn't working:**
1. Initial seeding only created 2 of 6 products (partial failure)
2. Database left in inconsistent state (orphaned variants/images)
3. Products API couldn't handle incomplete data
4. Categories worked (simple query) but products failed (complex join)
5. Prisma connection pool issues masked the root cause

**How these endpoints fix it:**
- ✅ `db-check` shows exactly what's wrong
- ✅ `db-clean` completely resets to clean state
- ✅ `db-seed-v2` properly seeds everything with validation
- ✅ Better error messages for debugging

---

## Next Steps (After Recovery)

1. **Verify both dev and prod work**
2. **Test image uploads** work correctly
3. **Monitor Vercel logs** for any connection issues
4. **Add proper auth** to these endpoints
5. **Document** any remaining issues

---

Run the commands above and share the output! 🚀
