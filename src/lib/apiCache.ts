/**
 * API Service with Cache Fallback
 * Provides automatic caching and fallback for API requests
 */

import { getCache, setCache, getCacheMetadata } from './cache';
import { isUserOnline } from './connectivity';

export interface ApiCallOptions {
  cacheTtl?: number; // TTL in hours
  cacheNamespace?: string;
  skipCache?: boolean;
  forceRefresh?: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isCached: boolean;
  source: 'api' | 'cache' | 'error';
  metadata?: {
    cacheAge?: number;
    cacheExpiry?: number | null;
  };
}

/**
 * Fetch with cache fallback
 * @param url - API endpoint URL
 * @param cacheKey - Key to store in cache
 * @param options - Cache and fetch options
 */
export async function apiFetchWithCache<T>(
  url: string,
  cacheKey: string,
  options: ApiCallOptions & RequestInit = {}
): Promise<ApiResponse<T>> {
  const {
    cacheTtl = 24,
    cacheNamespace = 'api',
    skipCache = false,
    forceRefresh = false,
    ...fetchOptions
  } = options as ApiCallOptions & RequestInit;

  // Try to get from cache first (if not forcing refresh)
  if (!skipCache && !forceRefresh) {
    const cached = getCache<T>(cacheKey, {
      ttl: cacheTtl,
      namespace: cacheNamespace,
    });

    if (cached !== null) {
      const metadata = getCacheMetadata(cacheKey, cacheNamespace);
      console.log(`[API] Loaded from cache: ${cacheKey}`, { age: metadata?.ageHours.toFixed(2) + 'h' });
      
      return {
        data: cached,
        error: null,
        isCached: true,
        source: 'cache',
        metadata: {
          cacheAge: metadata?.ageMs,
          cacheExpiry: metadata?.expiresInHours,
        },
      };
    }
  }

  // Check if online before attempting API call
  if (!isUserOnline()) {
    console.warn(`[API] Offline - using cached data for: ${cacheKey}`);
    const cached = getCache<T>(cacheKey, { namespace: cacheNamespace });
    
    if (cached !== null) {
      return {
        data: cached,
        error: null,
        isCached: true,
        source: 'cache',
      };
    }

    return {
      data: null,
      error: 'No internet connection and no cached data available',
      isCached: false,
      source: 'error',
    };
  }

  // Attempt API call
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: T = await response.json();

    // Store in cache
    if (!skipCache) {
      setCache(cacheKey, data, {
        ttl: cacheTtl,
        namespace: cacheNamespace,
      });
      console.log(`[API] Cached: ${cacheKey}`);
    }

    return {
      data,
      error: null,
      isCached: false,
      source: 'api',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[API] Error fetching ${url}:`, errorMessage);

    // Fallback to cache on error
    const cached = getCache<T>(cacheKey, { namespace: cacheNamespace });
    
    if (cached !== null) {
      console.log(`[API] API failed, using cached data: ${cacheKey}`);
      return {
        data: cached,
        error: `API Error (${errorMessage}) - showing cached data`,
        isCached: true,
        source: 'cache',
      };
    }

    return {
      data: null,
      error: errorMessage,
      isCached: false,
      source: 'error',
    };
  }
}

/**
 * Convenience methods for common data types
 */

export async function fetchProducts() {
  return apiFetchWithCache('/api/products', 'products', {
    cacheTtl: 24,
    cacheNamespace: 'data',
  });
}

export async function fetchCategories() {
  return apiFetchWithCache('/api/categories', 'categories', {
    cacheTtl: 24,
    cacheNamespace: 'data',
  });
}

export async function fetchHeroSlides() {
  return apiFetchWithCache('/api/hero', 'hero-slides', {
    cacheTtl: 12,
    cacheNamespace: 'data',
  });
}

export async function fetchProductBySlug(slug: string) {
  return apiFetchWithCache(`/api/products/slug/${slug}`, `product-${slug}`, {
    cacheTtl: 12,
    cacheNamespace: 'data',
  });
}
