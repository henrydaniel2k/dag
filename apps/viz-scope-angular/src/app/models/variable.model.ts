/**
 * Variable and metric value models
 * Represents measurable metrics on topology nodes
 */

import { VariableType } from './types';

/**
 * Variable definition (metric type)
 * Represents a measurable property like power, temperature, etc.
 */
export interface Variable {
  /** Unique variable identifier */
  readonly id: string;

  /** Display name */
  readonly name: string;

  /** Variable type (extensive: summed, intensive: averaged) */
  readonly type: VariableType;

  /** Unit of measurement (e.g., "kW", "°C") */
  readonly unit: string;

  /** Sample Interval Time in minutes */
  readonly sit: number;

  /** Whether this variable is part of branch integration calculations */
  readonly isIntegrated: boolean;
}

/**
 * Metric value at a point in time
 * Actual measurement of a variable for a node
 */
export interface MetricValue {
  /** Measured value */
  readonly value: number;

  /** Timestamp of measurement */
  readonly timestamp: Date;

  /** Reference to the variable definition */
  readonly variable: Variable;
}

/**
 * Create a metric value
 * @param value Measured value
 * @param variable Variable definition
 * @param timestamp Timestamp (defaults to now)
 * @returns MetricValue instance
 */
export function createMetricValue(
  value: number,
  variable: Variable,
  timestamp: Date = new Date()
): MetricValue {
  return {
    value,
    timestamp,
    variable,
  };
}

/**
 * Format a metric value for display
 * @param metric Metric value to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted string with unit
 */
export function formatMetricValue(metric: MetricValue, decimals = 2): string {
  return `${metric.value.toFixed(decimals)} ${metric.variable.unit}`;
}
