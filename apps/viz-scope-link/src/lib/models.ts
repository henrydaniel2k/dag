/**
 * Core data models for topology graph runtime
 */

export type NodeType =
  | "Organization"
  | "ES"
  | "ATS"
  | "Switch Gear"
  | "UPS"
  | "PDU"
  | "Rack PDU"
  | "Server"
  | "Chiller"
  | "CRAC";

export type TopologyType = "Electrical" | "Cooling" | "Organization";

export type VariableType = "extensive" | "intensive";

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  unit: string;
  sit: number; // Sample Interval Time in minutes
  isIntegrated: boolean; // Whether this variable is part of branch integration
}

export interface MetricValue {
  value: number;
  timestamp: Date;
  variable: Variable;
}

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  topologies: TopologyType[]; // Which topologies this node belongs to
  parents: string[]; // Parent node IDs
  children: string[]; // Child node IDs
  metrics: MetricValue[];
  alerts?: string[];
  cSit?: number; // Consolidated SIT
  rit?: number; // Report Interval Time
}

export interface Link {
  id: string;
  source: string;
  target: string;
  topology: TopologyType;
  isHop?: boolean; // True if this is a dashed hop link
  viaNodes?: string[]; // Hidden nodes this hop passes through
}

export interface Topology {
  type: TopologyType;
  nodes: Map<string, Node>;
  links: Link[];
}

export type TimeWindow =
  | "Latest"
  | "15m"
  | "1h"
  | "3h"
  | "12h"
  | "24h"
  | "3d"
  | "7d"
  | "14d"
  | "30d"
  | "Custom";

export interface TimeWindowConfig {
  window: TimeWindow;
  minutes: number;
}

export const TIME_WINDOWS: TimeWindowConfig[] = [
  { window: "Latest", minutes: 0 },
  { window: "15m", minutes: 15 },
  { window: "1h", minutes: 60 },
  { window: "3h", minutes: 180 },
  { window: "12h", minutes: 720 },
  { window: "24h", minutes: 1440 },
  { window: "3d", minutes: 4320 },
  { window: "7d", minutes: 10080 },
  { window: "14d", minutes: 20160 },
  { window: "30d", minutes: 43200 },
  { window: "Custom", minutes: -1 },
];

export interface ScopeConfig {
  msn: string; // Main Scope Node ID
  mantoType: TopologyType; // Main topology for navigation
  hiddenNodeTypes: Set<NodeType>;
  foldedNodeTypes: Set<NodeType>;
  overlayMetric?: Variable;
  timeWindow: TimeWindow;
  immersiveMode: boolean;
}

export interface BranchData {
  rootNodeId: string;
  nodeTypeCounts: Map<NodeType, number>;
  consolidatedMetrics: MetricValue[];
  totalNodes: number;
}

export interface MetaNode {
  id: string;
  type: NodeType;
  count: number;
  nodeIds: string[];
  consolidatedMetrics: MetricValue[];
}
