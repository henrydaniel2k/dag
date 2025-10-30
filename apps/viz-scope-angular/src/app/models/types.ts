/**
 * Node type definitions and canonical ordering
 * Defines all infrastructure node types in the topology
 */

/**
 * All possible node types in the topology hierarchy
 */
export type NodeType =
  | 'Organization'
  | 'ES'
  | 'Switch Gear'
  | 'ATS'
  | 'UPS'
  | 'PDU'
  | 'Rack PDU'
  | 'Server'
  | 'Chiller'
  | 'CRAC';

/**
 * All supported topology types
 */
export type TopologyType = 'Electrical' | 'Cooling' | 'Organization';

/**
 * Variable measurement types
 */
export type VariableType = 'extensive' | 'intensive';

/**
 * Canonical ordering of node types for UI display
 * Order represents hierarchy level (top to bottom)
 */
export const TYPE_ORDER: readonly NodeType[] = [
  'Organization',
  'ES',
  'ATS',
  'Switch Gear',
  'UPS',
  'PDU',
  'Rack PDU',
  'Server',
  'Chiller',
  'CRAC',
] as const;

/**
 * Map of node type to its sort order index
 * Used for sorting and positioning in UI
 */
export const typeIndex: Record<NodeType, number> = Object.fromEntries(
  TYPE_ORDER.map((t, i) => [t, i])
) as Record<NodeType, number>;

/**
 * Get the sort order index for a node type
 * @param type The node type
 * @returns The sort order index (0-based)
 */
export function getTypeIndex(type: NodeType): number {
  return typeIndex[type] ?? -1;
}

/**
 * Compare two node types for sorting
 * @param a First node type
 * @param b Second node type
 * @returns Negative if a < b, positive if a > b, 0 if equal
 */
export function compareNodeTypes(a: NodeType, b: NodeType): number {
  return getTypeIndex(a) - getTypeIndex(b);
}
