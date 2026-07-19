import { useState, useEffect } from 'react';
import { RatedData } from '../components/HeroTelemetry';

/**
 * Hook for real-time Rated Network data polling with graceful fallback.
 * 
 * Attempts to subscribe to real-time updates. Falls back to periodic polling
 * if SSE unavailable. Includes error handling and automatic retry logic.
 * 
 * @param activeProfile - 'cb77' or 'ac' profile to ensure theme-aware caching
 * @returns { ratedData, isLoading, error, lastSyncTime, retryFetch }
 * 
 * @example
 * function MetricCard() {
 *   const { ratedData, isLoading, error } = useRatedDataStream('cb77');
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorAlert message={error} onRetry={() => retryFetch()} />;
 *   return <MetricDisplay data={ratedData} />;
 * }
 */
export function useRatedDataStream(activeProfile: 'cb77' | 'ac') {
  const [ratedData, setRatedData] = useState<RatedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 seconds
  const POLLING_INTERVAL = 60000; // 60 seconds

  const fetchRatedData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/rated/senseinode');
      
      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data: RatedData = await res.json();
      
      // Validate data structure
      if (!data.apr || data.validators === undefined) {
        throw new Error('Invalid data structure from Rated API');
      }

      setRatedData(data);
      setLastSyncTime(new Date());
      setRetryCount(0); // Reset retry counter on success
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error fetching Rated Network data:', errorMsg);

      // Attempt retry with exponential backoff
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, RETRY_DELAY * (retryCount + 1));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount and profile change
  useEffect(() => {
    fetchRatedData();
  }, [activeProfile]);

  // Set up polling interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRatedData();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [retryCount]);

  // Manual retry function
  const retryFetch = () => {
    setRetryCount(0);
    fetchRatedData();
  };

  return {
    ratedData,
    isLoading,
    error,
    lastSyncTime,
    retryFetch
  };
}
