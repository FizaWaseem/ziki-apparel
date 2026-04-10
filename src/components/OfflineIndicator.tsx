import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/lib/connectivity';

interface OfflineIndicatorProps {
  showDetails?: boolean;
}

/**
 * Offline Indicator Banner
 * Shows when user is offline or using cached data
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ showDetails = false }) => {
  const isOnline = useOnlineStatus();
  const [cacheInfo, setCacheInfo] = useState<string>('');

  useEffect(() => {
    if (!isOnline && showDetails) {
      const storageSize = localStorage.length;
      setCacheInfo(`${storageSize} items cached`);
    }
  }, [isOnline, showDetails]);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b-2 border-yellow-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-yellow-800">
            📡 You are offline
          </span>
          {cacheInfo && (
            <span className="text-xs text-yellow-700">· {cacheInfo}</span>
          )}
        </div>
        <span className="text-xs text-yellow-700">
          Showing cached data • Content will refresh when online
        </span>
      </div>
    </div>
  );
};

/**
 * Data Source Badge
 * Shows whether data is from live API or cache
 */
interface DataSourceBadgeProps {
  isCached: boolean;
  cacheAge?: number; // in ms
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({ isCached, cacheAge }) => {
  const formatAge = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  if (!isCached) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
        ✓ Live data
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
      📦 Cached {cacheAge ? `• ${formatAge(cacheAge)}` : ''}
    </span>
  );
};

/**
 * Loading Skeleton for Offline Mode
 * Shows when data is being loaded from cache
 */
export const CacheLoadingSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-full" />
        </div>
      ))}
    </div>
  );
};

/**
 * Offline Message Component
 */
export const OfflineMessage: React.FC<{ action?: string }> = ({ 
  action = 'perform this action' 
}) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
      <p className="text-sm text-yellow-800">
        📡 You&apos;re offline and cannot {action}. Please check your connection.
      </p>
    </div>
  );
};

/**
 * Retry Button for Failed API Calls
 */
interface RetryButtonProps {
  onRetry: () => void;
  loading?: boolean;
}

export const RetryButton: React.FC<RetryButtonProps> = ({ onRetry, loading = false }) => {
  return (
    <button
      onClick={onRetry}
      disabled={loading}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
    >
      {loading ? '⟳ Retrying...' : '↻ Retry'}
    </button>
  );
};
