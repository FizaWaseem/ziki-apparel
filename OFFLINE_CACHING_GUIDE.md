# Hybrid Offline-First Caching System

## Overview
This document explains the offline-first caching system implemented in Ziki Apparel. The system ensures that users can browse products, categories, and home content even when experiencing internet connectivity issues.

## Architecture

### Core Components

#### 1. **Cache Utility** (`src/lib/cache.ts`)
- **Purpose**: Manages localStorage operations with TTL (Time-To-Live) support
- **Key Functions**:
  - `getCache<T>(key, options)` - Retrieve cached data
  - `setCache<T>(key, data, options)` - Store data with TTL
  - `removeCache(key)` - Clear specific cache entry
  - `clearCache(namespace)` - Clear all entries in a namespace
  - `getCacheMetadata(key)` - Get cache age and expiry info

#### 2. **Connectivity Tracker** (`src/lib/connectivity.ts`)
- **Purpose**: Detects and monitors online/offline status
- **Key Features**:
  - `useOnlineStatus()` - React hook for real-time online/offline detection
  - `isUserOnline()` - Synchronous online status check
  - `verifyConnectivity(timeout)` - Validates connectivity via API

#### 3. **API Cache Service** (`src/lib/apiCache.ts`)
- **Purpose**: Wrapper around fetch with automatic cache fallback
- **Key Features**:
  - Automatic caching of API responses
  - Fallback to cache on API failure
  - Fallback to cache when offline
  - TTL-based cache expiration
  - Response metadata (age, expiry)

#### 4. **UI Components** (`src/components/OfflineIndicator.tsx`)
- **OfflineIndicator**: Shows when user is offline (banner at top)
- **DataSourceBadge**: Visual indicator showing if data is from API or cache
- **CacheLoadingSkeleton**: Loading placeholder for offline mode
- **OfflineMessage**: Error message when action can't be completed
- **RetryButton**: Button to retry failed API calls

### Storage Structure
```
localStorage keys:
ziki_data_hero-slides
ziki_data_categories
ziki_data_featured-products
ziki_data_products-[query-params]
ziki_data_product-[slug]
```

Each stored item contains:
```json
{
  "data": {},           // Actual data
  "timestamp": 1234567890000,  // When cached
  "ttl": 24             // Hours until expiry (0 = no expiry)
}
```

## Data Caching Strategy

### Cache TTLs (Time To Live)

| Data | TTL | Reason |
|------|-----|--------|
| Hero Slides | 12 hours | Marketing content, changes less frequently |
| Categories | 24 hours | Relatively static data |
| Featured Products | 12 hours | Promotional data, may change |
| Product List | 12 hours | May change with new arrivals |
| Individual Product | 12 hours | Details may be updated |

### Automatic Caching Flow

```
1. Page loads → Component calls API via apiFetchWithCache()
2. Service checks:
   a. Is data in cache & not expired? → Return cached data
   b. Is user online? → Attempt API call
   c. API success? → Cache response & return
   d. API failed? → Check cache, return if available
   e. No cache available? → Return error
```

## Usage Guide

### Using the API Cache Service

```typescript
import { apiFetchWithCache } from '@/lib/apiCache'

// Fetch with automatic caching
const response = await apiFetchWithCache<Product[]>(
  '/api/products',
  'products',  // Cache key
  {
    cacheTtl: 12,
    cacheNamespace: 'data',
  }
)

// Response contains:
// - data: T | null (the actual data)
// - error: string | null (error message if any)
// - isCached: boolean (was this from cache?)
// - source: 'api' | 'cache' | 'error'
// - metadata: { cacheAge, cacheExpiry }

if (response.data) {
  console.log('Products:', response.data)
  console.log('From cache?', response.isCached)
}
```

### Using the Offline Indicator

```typescript
import { OfflineIndicator } from '@/components/OfflineIndicator'

// Add to Layout
<OfflineIndicator showDetails={true} />

// Shows a banner when offline, says "You are offline, X items cached"
```

### Using the Data Source Badge

```typescript
import { DataSourceBadge } from '@/components/OfflineIndicator'

// Show data source
<DataSourceBadge isCached={isCached} cacheAge={ageInMs} />

// Shows either:
// ✓ Live data (green)
// 📦 Cached • 2h ago (blue)
```

### Detecting Online Status

```typescript
import { useOnlineStatus, isUserOnline } from '@/lib/connectivity'

// In component
const isOnline = useOnlineStatus()  // Updates in real-time

// Or direct check
if (isUserOnline()) {
  // Attempt API call
}
```

## Current Implementation

### Home Page (`src/pages/index.tsx`)
- ✅ Caches hero slides (12h TTL)
- ✅ Caches featured products (12h TTL)
- ✅ Caches categories (24h TTL)
- ✅ Shows data source badge on featured products
- ✅ Integrated with OfflineIndicator in Layout

### Products Page (`src/pages/products/index.tsx`)
- ✅ Caches product listings (12h TTL)
- ✅ Caches categories (24h TTL)
- ✅ Shows data source badge with product count
- ✅ Dynamic cache keys based on query parameters

### Layout (`src/components/Layout.tsx`)
- ✅ Displays OfflineIndicator at top
- ✅ Shows when offline and how many items are cached

## Testing Offline Functionality

### Browser DevTools Method
1. Open DevTools (F12)
2. Go to **Network** tab
3. Click the dropdown next to the throttle icon (usually says "No throttling")
4. Select **Offline**
5. Navigate between pages
6. Data should load from cache

### Network Simulation
1. DevTools > Network tab
2. Check "Throttle" and select "Offline"
3. Reload page or navigate
4. Notice banner appears: "You are offline"

### Testing Cache Expiry
1. Load home page (caches data)
2. Wait 12 hours or manually set system time forward
3. Reload page
4. Should re-fetch from API (if online)

## Performance Benefits

| Scenario | Benefit |
|----------|---------|
| Slow network | Data loads from cache instantly |
| Offline mode | All cached data accessible |
| Network hiccup | Graceful fallback to cached data |
| Large dataset | localStorage is fast |
| Repeat visits | No API calls if cache valid |

## Storage Limits

- **localStorage**: ~5-10MB per domain
- Current usage: < 1MB (compressed products JSON)
- Safe for: ~500-1000 products with images

To monitor:
```javascript
// In browser console
JSON.stringify(localStorage).length / 1024 / 1024  // MB
```

## Future Enhancements

1. **IndexedDB**: For larger datasets (> 10MB)
2. **Service Worker**: Cache images and static assets
3. **Sync API**: Queue orders/updates when offline, sync when online
4. **Smart Refresh**: Update cache in background when online
5. **Compression**: GZip JSON for more storage
6. **Partial Sync**: Merge user changes with fresh data

## Troubleshooting

### "Too many connections" Error
**Issue**: Database connection pool exhausted
**Solution**: Check `/src/lib/prisma.ts` - ensure singleton caching is enabled in production

### Cache Not Updating
**Issue**: Old data persists
**Solution**: 
- Increase TTL or set to 0 (no expiry)
- Or clear cache: `clearCache('data')`
- DevTools > Application > LocalStorage > Clear All

### Offline Banner Not Showing
**Issue**: OfflineIndicator not visible
**Solution**:
- Ensure it's in Layout component
- Check CSS (should be position: fixed, z-50)
- Verify `navigator.onLine` in DevTools Console

### Performance Slow on Cache Load
**Issue**: Large cache slows page load
**Solution**:
- Reduce TTL for less critical data
- Limit product cache to specific categories
- Consider pagination caching instead

## API Endpoints Used

- `GET /api/products` - Product list
- `GET /api/products?featured=true` - Featured products
- `GET /api/categories` - All categories
- `GET /api/hero` - Hero slider content
- `GET /api/health` - Connectivity check

## Security Considerations

⚠️ **Important**: Sensitive data should NOT be cached:
- User authentication tokens
- Payment information
- Personal/PII data
- Admin-only content

Current implementation only caches:
- ✅ Public product data
- ✅ Public category data
- ✅ Public hero content

**Never** cache data retrieved with secured endpoints.

## Monitoring Cache Health

Add this to browser console to monitor:
```javascript
// Get all cached data
Object.keys(localStorage)
  .filter(k => k.startsWith('ziki_'))
  .map(k => ({
    key: k,
    size: localStorage[k].length,
    data: JSON.parse(localStorage[k])
  }))

// Clear specific namespace
Object.keys(localStorage)
  .filter(k => k.startsWith('ziki_data_'))
  .forEach(k => localStorage.removeItem(k))
```

## Support

For issues or enhancements:
1. Check DevTools > Application > LocalStorage
2. Check browser Console for error messages
3. Verify API endpoints are accessible (`/api/health`)
4. Test with offline mode enabled
