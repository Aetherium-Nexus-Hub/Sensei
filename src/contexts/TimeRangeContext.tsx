import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

/**
 * Global time range context for synchronized chart controls.
 * Ensures all visualization components (APR, Rewards, Diversity, Breakdown) 
 * stay in sync with the same time range selection.
 * 
 * Persists selection to localStorage for UX consistency across sessions.
 */

export type TimeRange = '1d' | '7d' | '30d' | 'all';

interface TimeRangeContextType {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

const TimeRangeContext = createContext<TimeRangeContextType | undefined>(undefined);

/**
 * Provider component - wrap App or Dashboard with this to enable global time range state.
 * @example
 * <TimeRangeProvider>
 *   <Dashboard />
 * </TimeRangeProvider>
 */
export function TimeRangeProvider({ children }: { children: ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chart_time_range');
      return (saved as TimeRange) || '7d';
    }
    return '7d';
  });

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem('chart_time_range', timeRange);
  }, [timeRange]);

  return (
    <TimeRangeContext.Provider value={{ timeRange, setTimeRange }}>
      {children}
    </TimeRangeContext.Provider>
  );
}

/**
 * Hook to access and update global time range state.
 * Use this in Dashboard, ChartHub, and any chart components that need to sync time filtering.
 * 
 * @returns { timeRange, setTimeRange }
 * @throws Error if used outside TimeRangeProvider
 * 
 * @example
 * function MyChart() {
 *   const { timeRange, setTimeRange } = useTimeRange();
 *   return (
 *     <div>
 *       <button onClick={() => setTimeRange('7d')}>Last 7 Days</button>
 *       <Chart data={getChartData(timeRange)} />
 *     </div>
 *   );
 * }
 */
export function useTimeRange() {
  const context = useContext(TimeRangeContext);
  if (!context) {
    throw new Error('useTimeRange must be used within TimeRangeProvider');
  }
  return context;
}
