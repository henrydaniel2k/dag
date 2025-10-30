/**
 * Scope configuration model
 * Represents the complete visualization configuration state
 */

import { NodeType, TopologyType } from './types';
import { Variable } from './variable.model';
import { TimeWindow } from './time-window.model';

/**
 * Complete scope configuration
 * Defines what and how to display in the topology visualization
 */
export interface ScopeConfig {
  /** Main Scope Node ID (focal point of visualization) */
  readonly msn: string;

  /** Main Topology Type for navigation */
  readonly mantoType: TopologyType;

  /** Node types to hide from visualization */
  readonly hiddenNodeTypes: ReadonlySet<NodeType>;

  /** Node types that are folded into meta-nodes */
  readonly foldedNodeTypes: ReadonlySet<NodeType>;

  /** Metric variable to overlay on nodes (optional) */
  readonly overlayMetric?: Variable;

  /** Time window for metric data */
  readonly timeWindow: TimeWindow;

  /** Immersive mode (hides UI chrome) */
  readonly immersiveMode: boolean;
}

/**
 * Create a default scope configuration
 * @param msn Main Scope Node ID
 * @param mantoType Main Topology Type
 * @returns Default ScopeConfig
 */
export function createDefaultScopeConfig(
  msn: string,
  mantoType: TopologyType = 'Electrical'
): ScopeConfig {
  return {
    msn,
    mantoType,
    hiddenNodeTypes: new Set(),
    foldedNodeTypes: new Set(),
    timeWindow: 'Latest',
    immersiveMode: false,
  };
}

/**
 * Check if a node type is hidden
 * @param config Scope configuration
 * @param type Node type
 * @returns True if node type is hidden
 */
export function isNodeTypeHidden(config: ScopeConfig, type: NodeType): boolean {
  return config.hiddenNodeTypes.has(type);
}

/**
 * Check if a node type is folded
 * @param config Scope configuration
 * @param type Node type
 * @returns True if node type is folded
 */
export function isNodeTypeFolded(config: ScopeConfig, type: NodeType): boolean {
  return config.foldedNodeTypes.has(type);
}

/**
 * Check if a node type is visible (not hidden)
 * @param config Scope configuration
 * @param type Node type
 * @returns True if node type is visible
 */
export function isNodeTypeVisible(
  config: ScopeConfig,
  type: NodeType
): boolean {
  return !isNodeTypeHidden(config, type);
}

/**
 * Check if metric overlay is enabled
 * @param config Scope configuration
 * @returns True if overlay metric is set
 */
export function hasMetricOverlay(config: ScopeConfig): boolean {
  return !!config.overlayMetric;
}
