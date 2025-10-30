/**
 * Meta-node model
 * Represents a folded group of nodes of the same type
 */

import { NodeType } from './types';
import { MetricValue } from './variable.model';

/**
 * Meta-node (folded node group)
 * Aggregates multiple nodes of the same type into a single visual node
 */
export interface MetaNode {
  /** Unique identifier (e.g., "meta-UPS") */
  readonly id: string;

  /** Node type being folded */
  readonly type: NodeType;

  /** Number of nodes in this meta-node */
  readonly count: number;

  /** IDs of all nodes folded into this meta-node */
  readonly nodeIds: readonly string[];

  /** Consolidated metrics (summed for extensive, averaged for intensive) */
  readonly consolidatedMetrics: readonly MetricValue[];
}

/**
 * Create a meta-node ID from node type
 * @param type Node type
 * @returns Meta-node ID (e.g., "meta-UPS")
 */
export function createMetaNodeId(type: NodeType): string {
  return `meta-${type}`;
}

/**
 * Check if an ID is a meta-node ID
 * @param id Node or meta-node ID
 * @returns True if ID is a meta-node ID
 */
export function isMetaNodeId(id: string): boolean {
  return id.startsWith('meta-');
}

/**
 * Extract node type from meta-node ID
 * @param id Meta-node ID
 * @returns Node type or undefined
 */
export function getMetaNodeType(id: string): NodeType | undefined {
  if (!isMetaNodeId(id)) return undefined;
  return id.replace('meta-', '') as NodeType;
}

/**
 * Check if a meta-node contains a specific node
 * @param metaNode Meta-node to check
 * @param nodeId Node ID to search for
 * @returns True if meta-node contains the node
 */
export function metaNodeContainsNode(
  metaNode: MetaNode,
  nodeId: string
): boolean {
  return metaNode.nodeIds.includes(nodeId);
}

/**
 * Get display name for meta-node
 * @param metaNode Meta-node
 * @returns Display name (e.g., "UPS (5)")
 */
export function getMetaNodeDisplayName(metaNode: MetaNode): string {
  return `${metaNode.type} (${metaNode.count})`;
}
