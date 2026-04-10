/**
 * Cache Management Utility
 * Handles localStorage operations with TTL (time-to-live) support
 */

export interface CacheOptions {
  ttl?: number; // Time to live in hours (0 = no expiry)
  namespace?: string;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const DEFAULT_TTL = 24; // 24 hours
const CACHE_PREFIX = 'ziki_';

/**
 * Get data from cache
 */
export function getCache<T>(key: string, options?: CacheOptions): T | null {
  try {
    if (typeof window === 'undefined') return null;

    const namespace = options?.namespace || '';
    const fullKey = `${CACHE_PREFIX}${namespace}${key}`;
    const cached = localStorage.getItem(fullKey);

    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);
    const now = Date.now();
    const ageHours = (now - parsed.timestamp) / (1000 * 60 * 60);

    // Check if cache has expired
    if (parsed.ttl > 0 && ageHours > parsed.ttl) {
      localStorage.removeItem(fullKey);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error(`[Cache] Error reading cache for ${key}:`, error);
    return null;
  }
}

/**
 * Store data in cache
 */
export function setCache<T>(
  key: string,
  data: T,
  options?: CacheOptions
): boolean {
  try {
    if (typeof window === 'undefined') return false;

    const namespace = options?.namespace || '';
    const fullKey = `${CACHE_PREFIX}${namespace}${key}`;
    const ttl = options?.ttl ?? DEFAULT_TTL;

    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    localStorage.setItem(fullKey, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    console.error(`[Cache] Error writing cache for ${key}:`, error);
    return false;
  }
}

/**
 * Remove specific cache entry
 */
export function removeCache(key: string, namespace?: string): boolean {
  try {
    if (typeof window === 'undefined') return false;

    const ns = namespace || '';
    const fullKey = `${CACHE_PREFIX}${ns}${key}`;
    localStorage.removeItem(fullKey);
    return true;
  } catch (error) {
    console.error(`[Cache] Error removing cache for ${key}:`, error);
    return false;
  }
}

/**
 * Clear all cache entries (optionally for a specific namespace)
 */
export function clearCache(namespace?: string): boolean {
  try {
    if (typeof window === 'undefined') return false;

    const prefix = namespace 
      ? `${CACHE_PREFIX}${namespace}` 
      : CACHE_PREFIX;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error(`[Cache] Error clearing cache:`, error);
    return false;
  }
}

/**
 * Get cache metadata (age, expiry info)
 */
export function getCacheMetadata(key: string, namespace?: string) {
  try {
    if (typeof window === 'undefined') return null;

    const ns = namespace || '';
    const fullKey = `${CACHE_PREFIX}${ns}${key}`;
    const cached = localStorage.getItem(fullKey);

    if (!cached) return null;

    const parsed: CachedData<unknown> = JSON.parse(cached);
    const now = Date.now();
    const ageMs = now - parsed.timestamp;
    const ageHours = ageMs / (1000 * 60 * 60);
    const isExpired = parsed.ttl > 0 && ageHours > parsed.ttl;
    const expiresIn = parsed.ttl > 0 ? parsed.ttl - ageHours : null;

    return {
      timestamp: parsed.timestamp,
      ageMs,
      ageHours,
      ttlHours: parsed.ttl,
      isExpired,
      expiresInHours: expiresIn,
    };
  } catch (error) {
    console.error(`[Cache] Error getting metadata for ${key}:`, error);
    return null;
  }
}
