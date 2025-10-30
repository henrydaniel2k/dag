/**
 * Node model
 * Represents a single infrastructure component in the topology
 */

import { NodeType, TopologyType } from './types';
import { MetricValue } from './variable.model';

/**
 * Infrastructure node in the topology
 * Represents components like servers, PDUs, UPS units, etc.
 */
export interface Node {
  /** Unique node identifier */
  readonly id: string;

  /** Display name */
  readonly name: string;

  /** Node type (ES, ATS, UPS, etc.) */
  readonly type: NodeType;

  /** Which topologies this node belongs to */
  readonly topologies: readonly TopologyType[];

  /** Parent node IDs (upstream in hierarchy) */
  readonly parents: readonly string[];

  /** Child node IDs (downstream in hierarchy) */
  readonly children: readonly string[];

  /** Current metric values for this node */
  readonly metrics: readonly MetricValue[];

  /** Active alerts (optional) */
  readonly alerts?: readonly string[];

  /** Consolidated Sample Interval Time (optional) */
  readonly cSit?: number;

  /** Report Interval Time (optional) */
  readonly rit?: number;
}

/**
 * Check if a node has children
 * @param node Node to check
 * @returns True if node has children
 */
export function hasChildren(node: Node): boolean {
  return node.children.length > 0;
}

/**
 * Check if a node has parents
 * @param node Node to check
 * @returns True if node has parents
 */
export function hasParents(node: Node): boolean {
  return node.parents.length > 0;
}

/**
 * Check if a node belongs to a specific topology
 * @param node Node to check
 * @param topology Topology type
 * @returns True if node belongs to topology
 */
export function belongsToTopology(node: Node, topology: TopologyType): boolean {
  return node.topologies.includes(topology);
}

/**
 * Get a metric value by variable ID
 * @param node Node to search
 * @param variableId Variable identifier
 * @returns Metric value or undefined
 */
export function getMetric(
  node: Node,
  variableId: string
): MetricValue | undefined {
  return node.metrics.find((m) => m.variable.id === variableId);
}

/**
 * Check if a node has active alerts
 * @param node Node to check
 * @returns True if node has alerts
 */
export function hasAlerts(node: Node): boolean {
  return !!node.alerts && node.alerts.length > 0;
}
