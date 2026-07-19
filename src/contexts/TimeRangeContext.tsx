import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Global time range context for synchronized chart controls.
 * Ensures all visualization components (APR, Rewards, Diversity, Breakdown) 
 * stay in sync with the same time range selection.
 */

export type TimeRange = '1d' | '7d' | '30d' | 'all';

interface TimeRangeContextType {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

const TimeRangeContext = createContext<TimeRangeContextType | undefined>(undefined);

export function TimeRangeProvider({ children }: { children: ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  return (
    <TimeRangeContext.Provider value={{ timeRange, setTimeRange }}>
      {children}
    </TimeRangeContext.Provider>
  );
}

/**
 * Hook to access and update global time range state.
 * Use this in Dashboard, ChartHub, and any chart components.
 * @returns { timeRange, setTimeRange }
 */
export function useTimeRange() {
  const context = useContext(TimeRangeContext);
  if (!context) {
    throw new Error('useTimeRange must be used within TimeRangeProvider');
  }
  return context;
}
