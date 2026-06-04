/**
 * Uptime Domain
 * 
 * Ubiquitous Language:
 * - Uptime: duration since server started (in milliseconds)
 * - UptimeInterval: structured breakdown of uptime into time units
 * - TimeUnit: named interval (days, hours, minutes, seconds)
 */

export interface TimeUnit {
  readonly label: string;
  readonly value: number;
  readonly symbol: string;
}

export interface UptimeInterval {
  readonly days: TimeUnit;
  readonly hours: TimeUnit;
  readonly minutes: TimeUnit;
  readonly seconds: TimeUnit;
}

export interface UptimeBreakdown {
  readonly totalSeconds: number;
  readonly intervals: UptimeInterval;
}

/**
 * Pure functions for uptime calculations
 */

/**
 * Convert milliseconds to total seconds
 */
export const toSeconds = (milliseconds: number): number =>
  Math.floor(milliseconds / 1000);

/**
 * Extract time intervals from total seconds
 */
export const extractIntervals = (totalSeconds: number): UptimeInterval => {
  const days = Math.floor(totalSeconds / 86400);
  const remainingAfterDays = totalSeconds % 86400;
  
  const hours = Math.floor(remainingAfterDays / 3600);
  const remainingAfterHours = remainingAfterDays % 3600;
  
  const minutes = Math.floor(remainingAfterHours / 60);
  const seconds = remainingAfterHours % 60;

  return {
    days: { label: 'days', value: days, symbol: 'd' },
    hours: { label: 'hours', value: hours, symbol: 'h' },
    minutes: { label: 'minutes', value: minutes, symbol: 'm' },
    seconds: { label: 'seconds', value: seconds, symbol: 's' },
  };
};

/**
 * Break down uptime into structured intervals
 */
export const breakdownUptime = (uptimeMillis: number): UptimeBreakdown => ({
  totalSeconds: toSeconds(uptimeMillis),
  intervals: extractIntervals(toSeconds(uptimeMillis)),
});

/**
 * Filter time units with non-zero values
 */
export const getSignificantIntervals = (intervals: UptimeInterval): TimeUnit[] =>
  [intervals.days, intervals.hours, intervals.minutes, intervals.seconds]
    .filter((unit) => unit.value > 0);

/**
 * Format a single time unit
 */
export const formatTimeUnit = (unit: TimeUnit): string =>
  `${unit.value}${unit.symbol}`;

/**
 * Format multiple time units with separator
 */
export const formatIntervals = (units: TimeUnit[], separator: string = ' '): string =>
  units.map(formatTimeUnit).join(separator);

/**
 * Main: Convert uptime to human-readable format
 */
export const formatUptimeHuman = (uptimeMillis: number): string => {
  const breakdown = breakdownUptime(uptimeMillis);
  const significant = getSignificantIntervals(breakdown.intervals);
  
  // Always show seconds, even if zero
  if (significant.length === 0) {
    return formatTimeUnit(breakdown.intervals.seconds);
  }
  
  return formatIntervals(significant);
};
