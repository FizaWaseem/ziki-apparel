import { useEffect, useState } from 'react';

/**
 * Hook to track online/offline status
 * Safe for SSR - only runs on client
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      console.log('[Connectivity] Online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[Connectivity] Offline - using cached data');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Check if user is online
 * Safe for SSR - returns true on server
 */
export function isUserOnline(): boolean {
  if (typeof window === 'undefined') return true;
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Attempt to verify connectivity by making a lightweight fetch request
 */
export async function verifyConnectivity(timeout = 3000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch('/api/health', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(id);
    return response.ok;
  } catch (error) {
    console.debug('[Connectivity] Verification failed:', error);
    return false;
  }
}
