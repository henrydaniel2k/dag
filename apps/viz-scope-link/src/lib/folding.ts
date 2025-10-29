/**
 * Folding logic: Group nodes by type into meta-nodes
 */

import { Node, NodeType, Topology, Link, MetricValue, VariableType, MetaNode } from "./models";

/**
 * Create meta-nodes for folded node types.
 * Returns meta-nodes with consolidated metrics.
 */
export function foldNodeType(
  nodeType: NodeType,
  nodes: Node[],
  topology: Topology
): MetaNode {
  const metaNodeId = `meta-${nodeType}`;
  const nodeIds = nodes.map((n) => n.id);

  // Consolidate metrics
  const metricsByVariable = new Map<string, MetricValue[]>();

  for (const node of nodes) {
    for (const metric of node.metrics) {
      const key = metric.variable.id;
      if (!metricsByVariable.has(key)) {
        metricsByVariable.set(key, []);
      }
      metricsByVariable.get(key)!.push(metric);
    }
  }

  const consolidatedMetrics: MetricValue[] = [];

  for (const [varId, metrics] of metricsByVariable.entries()) {
    if (metrics.length === 0) continue;

    const variable = metrics[0].variable;
    let consolidatedValue: number;

    // Extensive variables (power, etc) are summed
    if (variable.type === "extensive") {
      consolidatedValue = metrics.reduce((sum, m) => sum + m.value, 0);
    } 
    // Intensive variables (temperature, etc) are averaged
    else {
      consolidatedValue =
        metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    }

    consolidatedMetrics.push({
      value: consolidatedValue,
      timestamp: metrics[0].timestamp,
      variable,
    });
  }

  return {
    id: metaNodeId,
    type: nodeType,
    count: nodes.length,
    nodeIds,
    consolidatedMetrics,
  };
}

/**
 * Merge parallel connectors when folding creates multiple edges between the same endpoints.
 * Returns deduplicated links.
 */
export function mergeParallelConnectors(links: Link[]): Link[] {
  const linkMap = new Map<string, Link>();

  for (const link of links) {
    const key = `${link.source}-${link.target}`;
    if (!linkMap.has(key)) {
      linkMap.set(key, link);
    }
    // Keep the first link, discard duplicates
  }

  return Array.from(linkMap.values());
}

/**
 * Determine which node IDs should be auto-folded (types with >10 nodes in scope).
 * Returns the IDs of all nodes whose type exceeds the threshold.
 */
export function getAutoFoldNodeIds(
  nodesInScope: Node[],
  threshold: number = 10
): Set<string> {
  const typeCounts = new Map<NodeType, Node[]>();

  for (const node of nodesInScope) {
    if (!typeCounts.has(node.type)) {
      typeCounts.set(node.type, []);
    }
    typeCounts.get(node.type)!.push(node);
  }

  const autoFoldNodeIds = new Set<string>();
  for (const [type, nodes] of typeCounts.entries()) {
    if (nodes.length > threshold) {
      // Fold all nodes of this type
      nodes.forEach(node => autoFoldNodeIds.add(node.id));
    }
  }

  return autoFoldNodeIds;
}

/**
 * Check if a node type is a "parent-only" type (appears only as parents, no children under MSN).
 */
export function isParentOnlyType(
  type: NodeType,
  childrenIds: Set<string>,
  topology: Topology
): boolean {
  const childrenOfType = Array.from(childrenIds)
    .map((id) => topology.nodes.get(id))
    .filter((n) => n && n.type === type);

  return childrenOfType.length === 0;
}

