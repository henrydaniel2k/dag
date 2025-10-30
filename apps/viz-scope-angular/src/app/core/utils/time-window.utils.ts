/**
 * Time window gating logic based on SIT/C-SIT/RIT
 * Pure utility functions for time window filtering
 */

import { Node, Variable, TimeWindow, TIME_WINDOWS } from '../../models';

/**
 * Get allowed time windows for a given metric/node based on SIT/C-SIT/RIT gating.
 * Only windows >= the minimum sample interval are allowed.
 */
export function getAllowedWindows(
  variable: Variable,
  node?: Node
): TimeWindow[] {
  // Determine the minimum interval
  let minInterval = variable.sit;

  if (node) {
    // If node has C-SIT or RIT, use the maximum of sit, cSit, rit
    if (node.cSit) {
      minInterval = Math.max(minInterval, node.cSit);
    }
    if (node.rit) {
      minInterval = Math.max(minInterval, node.rit);
    }
  }

  // Filter windows that meet or exceed the minimum interval
  return TIME_WINDOWS.filter((w) => {
    if (w.window === 'Latest') return true; // Latest is always allowed
    if (w.window === 'Custom') return true; // Custom is always allowed
    return w.minutes >= minInterval;
  }).map((w) => w.window);
}

/**
 * Check if a specific time window is allowed for a metric/node.
 */
export function isWindowAllowed(
  window: TimeWindow,
  variable: Variable,
  node?: Node
): boolean {
  const allowed = getAllowedWindows(variable, node);
  return allowed.includes(window);
}

/**
 * Get the minimum allowed window for a metric/node.
 */
export function getMinimumWindow(variable: Variable, node?: Node): TimeWindow {
  const allowed = getAllowedWindows(variable, node);
  // Return the first non-Latest window, or Latest if that's all we have
  const nonLatest = allowed.filter((w) => w !== 'Latest' && w !== 'Custom');
  return nonLatest[0] || 'Latest';
}

/**
 * Get window duration in minutes.
 */
export function getWindowMinutes(window: TimeWindow): number {
  const config = TIME_WINDOWS.find((w) => w.window === window);
  return config?.minutes ?? 0;
}

/**
 * Time alignment logic for Node/Branch data panels.
 * Returns the appropriate time period to display based on overlay and window.
 */
export function getAlignedTimePeriod(
  overlayWindow: TimeWindow,
  dataSit: number,
  selectedWindow: TimeWindow
): { period: string; shouldConsolidate: boolean } {
  const selectedMinutes = getWindowMinutes(selectedWindow);

  // If overlay is Latest
  if (overlayWindow === 'Latest') {
    return {
      period: `Latest (SIT: ${dataSit}m)`,
      shouldConsolidate: false,
    };
  }

  // If data SIT < selected window → consolidate to window
  if (dataSit < selectedMinutes) {
    return {
      period: `${selectedWindow} (consolidated from ${dataSit}m SIT)`,
      shouldConsolidate: true,
    };
  }

  // If data SIT > selected window → show latest SIT of node data
  if (dataSit > selectedMinutes) {
    return {
      period: `Latest (SIT: ${dataSit}m)`,
      shouldConsolidate: false,
    };
  }

  // SIT matches window
  return {
    period: selectedWindow,
    shouldConsolidate: false,
  };
}
