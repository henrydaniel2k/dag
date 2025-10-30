/**
 * Link model
 * Represents connections between nodes in the topology
 */

import { TopologyType } from './types';

/**
 * Connection between two nodes in the topology
 * Can be a direct link or a hop link (dashed)
 */
export interface Link {
  /** Unique link identifier */
  readonly id: string;

  /** Source node ID */
  readonly source: string;

  /** Target node ID */
  readonly target: string;

  /** Which topology this link belongs to */
  readonly topology: TopologyType;

  /** True if this is a hop link (dashed line through hidden nodes) */
  readonly isHop?: boolean;

  /** Hidden node IDs this hop passes through (for hop links) */
  readonly viaNodes?: readonly string[];
}

/**
 * Create a link ID from source and target
 * @param source Source node ID
 * @param target Target node ID
 * @returns Link ID
 */
export function createLinkId(source: string, target: string): string {
  return `${source}->${target}`;
}

/**
 * Check if a link is a hop link
 * @param link Link to check
 * @returns True if link is a hop link
 */
export function isHopLink(link: Link): boolean {
  return !!link.isHop;
}

/**
 * Check if a link is a direct link
 * @param link Link to check
 * @returns True if link is a direct link
 */
export function isDirectLink(link: Link): boolean {
  return !link.isHop;
}

/**
 * Get hop description for tooltip
 * @param link Hop link
 * @returns Description string (e.g., "via PDU-1, PDU-2")
 */
export function getHopDescription(link: Link): string {
  if (!link.isHop || !link.viaNodes || link.viaNodes.length === 0) {
    return '';
  }
  return `via ${link.viaNodes.join(', ')}`;
}

/**
 * Check if two links are parallel (same source and target)
 * @param link1 First link
 * @param link2 Second link
 * @returns True if links are parallel
 */
export function areLinksParallel(link1: Link, link2: Link): boolean {
  return (
    link1.source === link2.source &&
    link1.target === link2.target &&
    link1.topology === link2.topology
  );
}
