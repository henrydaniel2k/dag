/**
 * Topology model
 * Represents a complete network graph (Electrical, Cooling, Organization)
 */

import { TopologyType } from './types';
import { Node } from './node.model';
import { Link } from './link.model';

/**
 * Complete topology graph
 * Contains all nodes and links for a specific topology type
 */
export interface Topology {
  /** Type of topology (Electrical, Cooling, Organization) */
  readonly type: TopologyType;

  /** All nodes in the topology (keyed by node ID) */
  readonly nodes: ReadonlyMap<string, Node>;

  /** All links in the topology */
  readonly links: readonly Link[];
}

/**
 * Get a node by ID
 * @param topology Topology to search
 * @param nodeId Node identifier
 * @returns Node or undefined if not found
 */
export function getNode(topology: Topology, nodeId: string): Node | undefined {
  return topology.nodes.get(nodeId);
}

/**
 * Check if a node exists in topology
 * @param topology Topology to search
 * @param nodeId Node identifier
 * @returns True if node exists
 */
export function hasNode(topology: Topology, nodeId: string): boolean {
  return topology.nodes.has(nodeId);
}

/**
 * Get all nodes as an array
 * @param topology Topology to query
 * @returns Array of all nodes
 */
export function getAllNodes(topology: Topology): Node[] {
  return Array.from(topology.nodes.values());
}

/**
 * Get all node IDs
 * @param topology Topology to query
 * @returns Array of all node IDs
 */
export function getAllNodeIds(topology: Topology): string[] {
  return Array.from(topology.nodes.keys());
}

/**
 * Get links between two nodes
 * @param topology Topology to search
 * @param sourceId Source node ID
 * @param targetId Target node ID
 * @returns Array of links (may be empty)
 */
export function getLinksBetween(
  topology: Topology,
  sourceId: string,
  targetId: string
): Link[] {
  return topology.links.filter(
    (link) => link.source === sourceId && link.target === targetId
  );
}

/**
 * Get all links connected to a node (incoming or outgoing)
 * @param topology Topology to search
 * @param nodeId Node identifier
 * @returns Array of connected links
 */
export function getConnectedLinks(topology: Topology, nodeId: string): Link[] {
  return topology.links.filter(
    (link) => link.source === nodeId || link.target === nodeId
  );
}

/**
 * Get parent nodes (upstream)
 * @param topology Topology to search
 * @param nodeId Node identifier
 * @returns Array of parent nodes
 */
export function getParentNodes(topology: Topology, nodeId: string): Node[] {
  const node = getNode(topology, nodeId);
  if (!node) return [];
  return node.parents
    .map((parentId) => getNode(topology, parentId))
    .filter((n): n is Node => !!n);
}

/**
 * Get child nodes (downstream)
 * @param topology Topology to search
 * @param nodeId Node identifier
 * @returns Array of child nodes
 */
export function getChildNodes(topology: Topology, nodeId: string): Node[] {
  const node = getNode(topology, nodeId);
  if (!node) return [];
  return node.children
    .map((childId) => getNode(topology, childId))
    .filter((n): n is Node => !!n);
}
