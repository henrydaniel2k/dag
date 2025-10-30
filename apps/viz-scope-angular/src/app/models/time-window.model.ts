/**
 * Time window model
 * Represents time ranges for metric queries
 */

/**
 * Predefined time window options
 */
export type TimeWindow =
  | 'Latest'
  | '15m'
  | '1h'
  | '3h'
  | '12h'
  | '24h'
  | '3d'
  | '7d'
  | '14d'
  | '30d'
  | 'Custom';

/**
 * Time window configuration
 * Maps time window to duration in minutes
 */
export interface TimeWindowConfig {
  /** Time window identifier */
  readonly window: TimeWindow;

  /** Duration in minutes (0 for Latest, -1 for Custom) */
  readonly minutes: number;
}

/**
 * All available time windows with their durations
 */
export const TIME_WINDOWS: readonly TimeWindowConfig[] = [
  { window: 'Latest', minutes: 0 },
  { window: '15m', minutes: 15 },
  { window: '1h', minutes: 60 },
  { window: '3h', minutes: 180 },
  { window: '12h', minutes: 720 },
  { window: '24h', minutes: 1440 },
  { window: '3d', minutes: 4320 },
  { window: '7d', minutes: 10080 },
  { window: '14d', minutes: 20160 },
  { window: '30d', minutes: 43200 },
  { window: 'Custom', minutes: -1 },
] as const;

/**
 * Get time window configuration by window name
 * @param window Time window name
 * @returns TimeWindowConfig or undefined
 */
export function getTimeWindowConfig(
  window: TimeWindow
): TimeWindowConfig | undefined {
  return TIME_WINDOWS.find((tw) => tw.window === window);
}

/**
 * Get duration in minutes for a time window
 * @param window Time window name
 * @returns Duration in minutes (0 for Latest, -1 for Custom)
 */
export function getTimeWindowMinutes(window: TimeWindow): number {
  return getTimeWindowConfig(window)?.minutes ?? 0;
}

/**
 * Check if a time window is valid for a given sample interval time (SIT)
 * @param window Time window to check
 * @param sit Sample Interval Time in minutes
 * @returns True if window is valid for the SIT
 */
export function isTimeWindowValidForSIT(
  window: TimeWindow,
  sit: number
): boolean {
  if (window === 'Latest') return true;
  if (window === 'Custom') return true;

  const minutes = getTimeWindowMinutes(window);
  return minutes >= sit;
}

/**
 * Get the minimum valid time window for a given SIT
 * @param sit Sample Interval Time in minutes
 * @returns Minimum valid time window
 */
export function getMinimumTimeWindow(sit: number): TimeWindow {
  for (const config of TIME_WINDOWS) {
    if (config.window === 'Latest' || config.window === 'Custom') continue;
    if (config.minutes >= sit) {
      return config.window;
    }
  }
  return '30d'; // Fallback to largest window
}

/**
 * Format time window for display
 * @param window Time window to format
 * @returns Formatted string
 */
export function formatTimeWindow(window: TimeWindow): string {
  const config = getTimeWindowConfig(window);
  if (!config) return window;

  if (window === 'Latest') return 'Latest';
  if (window === 'Custom') return 'Custom Range';

  return window;
}
