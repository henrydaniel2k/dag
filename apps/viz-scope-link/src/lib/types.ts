/**
 * Canonical type ordering and utilities
 */

export type NodeType =
  | "Organization"
  | "ES"
  | "Switch Gear"
  | "ATS"
  | "UPS"
  | "PDU"
  | "Rack PDU"
  | "Server"
  | "Chiller"
  | "CRAC";

export const TYPE_ORDER: NodeType[] = [
  "Organization",
  "ES",
  "ATS",
  "Switch Gear",
  "UPS",
  "PDU",
  "Rack PDU",
  "Server",
  "Chiller",
  "CRAC",
];

export const typeIndex: Record<NodeType, number> = Object.fromEntries(
  TYPE_ORDER.map((t, i) => [t, i])
) as Record<NodeType, number>;
