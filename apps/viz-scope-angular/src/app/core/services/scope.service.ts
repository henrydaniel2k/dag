/**
 * Scope Service
 * Computes recursive scope for topology visualization
 * Returns all upstream parents ∪ MSN ∪ all downstream children
 */

import { Injectable } from '@angular/core';
import { Topology, getNode, Node } from '../../models';

/**
 * Result of scope computation
 */
export interface ScopeResult {
  /** All node IDs in scope (recursive) */
  nodes: Set<string>;
  /** All recursive parents of MSN */
  upstream: Set<string>;
  /** The MSN itself */
  msn: string;
  /** All recursive children of MSN */
  downstream: Set<string>;
}

/**
 * Information about a hidden branch
 */
export interface HiddenBranchInfo {
  rootId: string;
  rootName: string;
  nodeCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class ScopeService {
  /**
   * Get direct parents of a node
   * @param nodeId Node identifier
   * @param topology Topology to search
   * @returns Array of parent node IDs
   */
  private getParents(nodeId: string, topology: Topology): string[] {
    const node = getNode(topology, nodeId);
    return node ? Array.from(node.parents) : [];
  }

  /**
   * Get direct children of a node
   * @param nodeId Node identifier
   * @param topology Topology to search
   * @returns Array of child node IDs
   */
  private getChildren(nodeId: string, topology: Topology): string[] {
    const node = getNode(topology, nodeId);
    return node ? Array.from(node.children) : [];
  }

  /**
   * Compute all upstream nodes recursively using BFS
   * @param msnId Main Scope Node identifier
   * @param topology Topology to traverse
   * @returns Set of upstream node IDs
   */
  private computeUpstream(msnId: string, topology: Topology): Set<string> {
    const upstream = new Set<string>();
    const queue = [msnId];
    const visited = new Set<string>([msnId]);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      const parents = this.getParents(current, topology);

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
   * Compute all downstream nodes recursively using BFS
   * @param msnId Main Scope Node identifier
   * @param topology Topology to traverse
   * @returns Set of downstream node IDs
   */
  private computeDownstream(msnId: string, topology: Topology): Set<string> {
    const downstream = new Set<string>();
    const queue = [msnId];
    const visited = new Set<string>([msnId]);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      const children = this.getChildren(current, topology);

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
   * Compute the full recursive scope for a given MSN in a topology
   * @param msnId Main Scope Node identifier
   * @param topology Topology to analyze
   * @returns ScopeResult with upstream, downstream, and all nodes
   * @throws Error if MSN not found in topology
   */
  computeScope(msnId: string, topology: Topology): ScopeResult {
    const msn = getNode(topology, msnId);
    if (!msn) {
      throw new Error(`MSN ${msnId} not found in topology`);
    }

    const upstream = this.computeUpstream(msnId, topology);
    const downstream = this.computeDownstream(msnId, topology);
    const allNodes = new Set([...upstream, msnId, ...downstream]);

    return {
      nodes: allNodes,
      upstream,
      msn: msnId,
      downstream,
    };
  }

  /**
   * Build a pseudo-tree from a DAG for navigation purposes
   * For nodes with multiple parents, deterministically choose one primary parent
   * @param topology Topology to process
   * @returns Map of nodeId to primaryParentId (null for root nodes)
   */
  buildPseudoTree(topology: Topology): Map<string, string | null> {
    const pseudoTree = new Map<string, string | null>();

    // Sort nodes by ID for deterministic ordering
    const sortedNodes = Array.from(topology.nodes.values()).sort(
      (a: Node, b: Node) => a.id.localeCompare(b.id)
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
   * Get all nodes in a branch rooted at the given node
   * Returns all descendants recursively
   * @param rootId Root node identifier
   * @param topology Topology to traverse
   * @returns Set of all node IDs in the branch
   */
  getBranchNodes(rootId: string, topology: Topology): Set<string> {
    const branch = new Set<string>();
    const visited = new Set<string>();

    const traverse = (nodeId: string): void => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      branch.add(nodeId);

      const node = getNode(topology, nodeId);
      if (node) {
        for (const childId of node.children) {
          traverse(childId);
        }
      }
    };

    traverse(rootId);
    return branch;
  }

  /**
   * For a given node, find all hidden branch roots where this node is a parent
   * Returns list of branches that are hidden and connected through this parent
   * @param nodeId Node identifier to check
   * @param hiddenBranchRoots Set of hidden branch root IDs
   * @param topology Topology to analyze
   * @returns Array of hidden branch information
   */
  getHiddenBranchesForNode(
    nodeId: string,
    hiddenBranchRoots: Set<string>,
    topology: Topology
  ): HiddenBranchInfo[] {
    const hiddenBranches: HiddenBranchInfo[] = [];

    // For each hidden root, check if nodeId is one of its parents
    hiddenBranchRoots.forEach((rootId) => {
      const rootNode = getNode(topology, rootId);
      if (rootNode && rootNode.parents.includes(nodeId)) {
        const branchSize = this.getBranchNodes(rootId, topology).size;
        hiddenBranches.push({
          rootId,
          rootName: rootNode.name,
          nodeCount: branchSize,
        });
      }
    });

    return hiddenBranches;
  }
}
