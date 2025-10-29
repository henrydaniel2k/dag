/**
 * Hopping logic: When hidden nodes lie between visible nodes,
 * create dashed links showing "via <Hidden Nodes>"
 */

import { Link, Node, NodeType, Topology } from "./models";

export interface HopLink extends Link {
  isHop: true;
  viaNodes: string[];
}

/**
 * Compute hopping connectors for hidden node types.
 * Returns additional "hop" links that bypass hidden nodes with dashed styling.
 * Only creates hops when there are two visible endpoints with hidden nodes between them.
 */
export function computeHops(
  topology: Topology,
  visibleNodeIds: Set<string>,
  hiddenTypes: Set<NodeType>
): HopLink[] {
  const hopLinks: HopLink[] = [];

  // For each visible node, find paths to other visible nodes that go through hidden nodes
  for (const startNodeId of visibleNodeIds) {
    const startNode = topology.nodes.get(startNodeId);
    if (!startNode) continue;

    // BFS to find all reachable visible nodes through hidden nodes
    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: string[] }> = [
      { nodeId: startNodeId, path: [] },
    ];

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = topology.nodes.get(nodeId);
      if (!node) continue;

      // Check children
      for (const childId of node.children) {
        const child = topology.nodes.get(childId);
        if (!child) continue;

        const newPath = [...path];
        
        // If this child is hidden, add to path and continue traversing
        if (hiddenTypes.has(child.type)) {
          newPath.push(childId);
          queue.push({ nodeId: childId, path: newPath });
        } 
        // If this child is visible and we've passed through hidden nodes, create hop link
        // Only if both endpoints (start and end) are visible
        else if (visibleNodeIds.has(childId) && newPath.length > 0) {
          // Only create hop if we don't already have a direct link
          const hasDirectLink = topology.links.some(
            (l) => l.source === startNodeId && l.target === childId
          );
          
          if (!hasDirectLink) {
            hopLinks.push({
              id: `hop-${startNodeId}-${childId}`,
              source: startNodeId,
              target: childId,
              topology: topology.type,
              isHop: true,
              viaNodes: newPath,
            });
          }
        }
      }
    }
  }

  // Deduplicate hop links
  const uniqueHops = new Map<string, HopLink>();
  for (const hop of hopLinks) {
    const key = `${hop.source}-${hop.target}`;
    if (!uniqueHops.has(key)) {
      uniqueHops.set(key, hop);
    }
  }

  return Array.from(uniqueHops.values());
}

/**
 * Get a human-readable description of the hop path
 */
export function getHopDescription(hopLink: HopLink, topology: Topology): string {
  if (!hopLink.viaNodes || hopLink.viaNodes.length === 0) {
    return "Direct connection";
  }

  const nodeNames = hopLink.viaNodes
    .map((id) => topology.nodes.get(id)?.name || id);
  
  // If more than 3 nodes, show first 3 and "+ N more"
  if (nodeNames.length > 3) {
    const displayed = nodeNames.slice(0, 3).join(", ");
    const remaining = nodeNames.length - 3;
    return `via ${displayed} +${remaining} more`;
  }

  return `via ${nodeNames.join(", ")}`;
}
