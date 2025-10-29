/**
 * Scope computation: Returns all upstream parents (recursive) ∪ MSN ∪ all downstream children (recursive)
 */

import { Node, Topology } from "./models";

export interface ScopeResult {
  nodes: Set<string>; // All node IDs in scope (recursive)
  upstream: Set<string>; // All recursive parents of MSN
  msn: string; // The MSN itself
  downstream: Set<string>; // All recursive children of MSN
}

/**
 * Get direct parents of a node in the topology
 */
function getParents(nodeId: string, topology: Topology): string[] {
  const node = topology.nodes.get(nodeId);
  return node ? node.parents : [];
}

/**
 * Get direct children of a node in the topology
 */
function getChildren(nodeId: string, topology: Topology): string[] {
  const node = topology.nodes.get(nodeId);
  return node ? node.children : [];
}

/**
 * Compute all upstream nodes recursively (BFS)
 */
function computeUpstream(msnId: string, topology: Topology): Set<string> {
  const upstream = new Set<string>();
  const queue = [msnId];
  const visited = new Set<string>([msnId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const parents = getParents(current, topology);

    for (const parent of parents) {
      if (!visited.has(parent)) {
        visited.add(parent);
        upstream.add(parent);
        queue.push(parent);
      }
    }
  }

  return upstream;
}

/**
 * Compute all downstream nodes recursively (BFS)
 */
function computeDownstream(msnId: string, topology: Topology): Set<string> {
  const downstream = new Set<string>();
  const queue = [msnId];
  const visited = new Set<string>([msnId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = getChildren(current, topology);

    for (const child of children) {
      if (!visited.has(child)) {
        visited.add(child);
        downstream.add(child);
        queue.push(child);
      }
    }
  }

  return downstream;
}

/**
 * Compute the full recursive scope for a given MSN in a topology.
 * Returns all upstream parents ∪ {MSN} ∪ all downstream children.
 */
export function computeScope(msnId: string, topology: Topology): ScopeResult {
  const msn = topology.nodes.get(msnId);
  if (!msn) {
    throw new Error(`MSN ${msnId} not found in topology`);
  }

  const upstream = computeUpstream(msnId, topology);
  const downstream = computeDownstream(msnId, topology);
  const allNodes = new Set([...upstream, msnId, ...downstream]);

  return {
    nodes: allNodes,
    upstream,
    msn: msnId,
    downstream,
  };
}

/**
 * Build a pseudo-tree from a DAG for navigation purposes.
 * For each node with multiple parents, deterministically choose one primary parent.
 * Returns a map of nodeId -> primaryParentId
 */
export function buildPseudoTree(topology: Topology): Map<string, string | null> {
  const pseudoTree = new Map<string, string | null>();

  // Sort nodes by ID for deterministic ordering
  const sortedNodes = Array.from(topology.nodes.values()).sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  for (const node of sortedNodes) {
    if (node.parents.length === 0) {
      pseudoTree.set(node.id, null); // Root node
    } else {
      // Choose the first parent alphabetically for consistency
      const primaryParent = [...node.parents].sort()[0];
      pseudoTree.set(node.id, primaryParent);
    }
  }

  return pseudoTree;
}

/**
 * Get all nodes in a branch rooted at the given node.
 * Returns all descendants recursively.
 */
export function getBranchNodes(
  rootId: string,
  topology: Topology
): Set<string> {
  const branch = new Set<string>();
  const visited = new Set<string>();

  function traverse(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    branch.add(nodeId);

    const node = topology.nodes.get(nodeId);
    if (node) {
      for (const childId of node.children) {
        traverse(childId);
      }
    }
  }

  traverse(rootId);
  return branch;
}

export interface HiddenBranchInfo {
  rootId: string;
  rootName: string;
  nodeCount: number;
}

/**
 * For a given node, find all hidden branch roots where this node is a parent.
 * Returns list of branches that are hidden and connected through this parent.
 */
export function getHiddenBranchesForNode(
  nodeId: string,
  hiddenBranchRoots: Set<string>,
  topology: Topology
): HiddenBranchInfo[] {
  const hiddenBranches: HiddenBranchInfo[] = [];
  
  // For each hidden root, check if nodeId is one of its parents
  hiddenBranchRoots.forEach(rootId => {
    const rootNode = topology.nodes.get(rootId);
    if (rootNode && rootNode.parents.includes(nodeId)) {
      const branchSize = getBranchNodes(rootId, topology).size;
      hiddenBranches.push({
        rootId,
        rootName: rootNode.name,
        nodeCount: branchSize,
      });
    }
  });
  
  return hiddenBranches;
}
