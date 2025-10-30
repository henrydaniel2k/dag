/**
 * Branch data model
 * Represents aggregated data for a branch in the topology
 */

import { NodeType } from './types';
import { MetricValue } from './variable.model';

/**
 * Aggregated data for a branch (sub-tree) in the topology
 * Used for branch panels and analytics
 */
export interface BranchData {
  /** Root node ID of the branch */
  readonly rootNodeId: string;

  /** Count of nodes by type in this branch */
  readonly nodeTypeCounts: ReadonlyMap<NodeType, number>;

  /** Consolidated metrics for the entire branch */
  readonly consolidatedMetrics: readonly MetricValue[];

  /** Total number of nodes in branch */
  readonly totalNodes: number;
}

/**
 * Get count for a specific node type
 * @param branchData Branch data to query
 * @param type Node type
 * @returns Count of nodes of this type (0 if none)
 */
export function getNodeTypeCount(
  branchData: BranchData,
  type: NodeType
): number {
  return branchData.nodeTypeCounts.get(type) ?? 0;
}

/**
 * Get all node types present in the branch
 * @param branchData Branch data to query
 * @returns Array of node types
 */
export function getBranchNodeTypes(branchData: BranchData): NodeType[] {
  return Array.from(branchData.nodeTypeCounts.keys());
}

/**
 * Check if branch has any nodes of a specific type
 * @param branchData Branch data to query
 * @param type Node type
 * @returns True if branch contains nodes of this type
 */
export function branchHasNodeType(
  branchData: BranchData,
  type: NodeType
): boolean {
  return getNodeTypeCount(branchData, type) > 0;
}

/**
 * Get total count of nodes in branch
 * @param branchData Branch data to query
 * @returns Total node count
 */
export function getBranchTotalNodes(branchData: BranchData): number {
  return branchData.totalNodes;
}

/**
 * Get consolidated metric by variable ID
 * @param branchData Branch data to query
 * @param variableId Variable identifier
 * @returns Metric value or undefined
 */
export function getBranchMetric(
  branchData: BranchData,
  variableId: string
): MetricValue | undefined {
  return branchData.consolidatedMetrics.find(
    (m) => m.variable.id === variableId
  );
}
