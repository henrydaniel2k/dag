/**
 * Mock topology data for Electrical and Cooling systems
 */

import { Topology, Node, Link, Variable, MetricValue, NodeType } from "@/lib/models";

// Define common variables
const powerVariable: Variable = {
  id: "power",
  name: "Power",
  type: "extensive",
  unit: "kW",
  sit: 15,
  isIntegrated: true,
};

const tempVariable: Variable = {
  id: "temperature",
  name: "Temperature",
  type: "intensive",
  unit: "°C",
  sit: 5,
  isIntegrated: true,
};

const voltageVariable: Variable = {
  id: "voltage",
  name: "Voltage",
  type: "intensive",
  unit: "V",
  sit: 15,
  isIntegrated: false,
};

const currentVariable: Variable = {
  id: "current",
  name: "Current",
  type: "extensive",
  unit: "A",
  sit: 15,
  isIntegrated: false,
};

// Helper to generate metric values
function generateMetrics(basePower: number, baseTemp: number): MetricValue[] {
  const now = new Date();
  return [
    { value: basePower, timestamp: now, variable: powerVariable },
    { value: baseTemp, timestamp: now, variable: tempVariable },
    { value: 230 + Math.random() * 10, timestamp: now, variable: voltageVariable },
    { value: basePower / 230, timestamp: now, variable: currentVariable },
  ];
}

// Create Electrical Topology
export function createElectricalTopology(): Topology {
  const nodes = new Map<string, Node>();

  // ATS (feeds Switch Gears)
  const ats1: Node = {
    id: "ats-1",
    name: "ATS 1",
    type: "ATS",
    topologies: ["Electrical"],
    parents: [],
    children: ["sg-1", "sg-2"],
    metrics: generateMetrics(500, 28),
    cSit: 15,
    rit: 60,
  };
  nodes.set(ats1.id, ats1);

  // Switch Gears (downstream of ATS; upstream of UPS)
  const sg1: Node = {
    id: "sg-1",
    name: "Switch Gear 1",
    type: "Switch Gear",
    topologies: ["Electrical"],
    parents: ["ats-1"],
    children: ["ups-1", "ups-2"],
    metrics: generateMetrics(250, 30),
    cSit: 15,
  };
  nodes.set(sg1.id, sg1);

  const sg2: Node = {
    id: "sg-2",
    name: "Switch Gear 2",
    type: "Switch Gear",
    topologies: ["Electrical"],
    parents: ["ats-1"],
    children: ["ups-3"],
    metrics: generateMetrics(250, 29),
    cSit: 15,
  };
  nodes.set(sg2.id, sg2);

  // UPS units (downstream of Switch Gears)
  const ups1: Node = {
    id: "ups-1",
    name: "UPS 1",
    type: "UPS",
    topologies: ["Electrical"],
    parents: ["sg-1"],
    children: ["pdu-1"],
    metrics: generateMetrics(125, 32),
    cSit: 15,
  };
  nodes.set(ups1.id, ups1);

  const ups2: Node = {
    id: "ups-2",
    name: "UPS 2",
    type: "UPS",
    topologies: ["Electrical"],
    parents: ["sg-1"],
    children: ["pdu-2"],
    metrics: generateMetrics(125, 31),
    cSit: 15,
  };
  nodes.set(ups2.id, ups2);

  const ups3: Node = {
    id: "ups-3",
    name: "UPS 3",
    type: "UPS",
    topologies: ["Electrical"],
    parents: ["sg-2"],
    children: ["pdu-3"],
    metrics: generateMetrics(250, 33),
    cSit: 15,
  };
  nodes.set(ups3.id, ups3);

  // PDUs (room level)
  const pdu1: Node = {
    id: "pdu-1",
    name: "PDU Room 1",
    type: "PDU",
    topologies: ["Electrical"],
    parents: ["ups-1"],
    children: Array.from({ length: 12 }, (_, i) => `rack-pdu-${i + 1}`),
    metrics: generateMetrics(125, 26),
    cSit: 15,
  };
  nodes.set(pdu1.id, pdu1);

  const pdu2: Node = {
    id: "pdu-2",
    name: "PDU Room 2",
    type: "PDU",
    topologies: ["Electrical"],
    parents: ["ups-2"],
    children: Array.from({ length: 8 }, (_, i) => `rack-pdu-${i + 13}`),
    metrics: generateMetrics(125, 25),
    cSit: 15,
  };
  nodes.set(pdu2.id, pdu2);

  const pdu3: Node = {
    id: "pdu-3",
    name: "PDU Room 3",
    type: "PDU",
    topologies: ["Electrical"],
    parents: ["ups-3"],
    children: Array.from({ length: 10 }, (_, i) => `rack-pdu-${i + 21}`),
    metrics: generateMetrics(250, 27),
    cSit: 15,
  };
  nodes.set(pdu3.id, pdu3);

  // Rack PDUs (many to trigger auto-fold)
  for (let i = 1; i <= 30; i++) {
    const parentPdu = i <= 12 ? "pdu-1" : i <= 20 ? "pdu-2" : "pdu-3";
    const rackPdu: Node = {
      id: `rack-pdu-${i}`,
      name: `Rack PDU ${i}`,
      type: "Rack PDU",
      topologies: ["Electrical"],
      parents: [parentPdu],
      children: [`server-${i * 2 - 1}`, `server-${i * 2}`],
      metrics: generateMetrics(4 + Math.random() * 2, 24 + Math.random() * 2),
      cSit: 15,
    };
    nodes.set(rackPdu.id, rackPdu);
  }

  // Servers
  for (let i = 1; i <= 60; i++) {
    const parentRackPdu = `rack-pdu-${Math.ceil(i / 2)}`;
    const server: Node = {
      id: `server-${i}`,
      name: `Server ${String(i).padStart(3, "0")}`,
      type: "Server",
      topologies: ["Electrical", "Cooling"],
      parents: [parentRackPdu],
      children: [],
      metrics: generateMetrics(2 + Math.random(), 22 + Math.random() * 3),
      alerts: i === 2 ? ["High temperature"] : undefined,
      cSit: 15,
    };
    nodes.set(server.id, server);
  }

  // Create links
  const links: Link[] = [];
  for (const node of nodes.values()) {
    for (const childId of node.children) {
      links.push({
        id: `link-${node.id}-${childId}`,
        source: node.id,
        target: childId,
        topology: "Electrical",
      });
    }
  }

  return {
    type: "Electrical",
    nodes,
    links,
  };
}

// Create Cooling Topology
export function createCoolingTopology(): Topology {
  const nodes = new Map<string, Node>();

  // Chillers (root level)
  const chiller1: Node = {
    id: "chiller-1",
    name: "Chiller 1",
    type: "Chiller",
    topologies: ["Cooling"],
    parents: [],
    children: ["crac-1", "crac-2"],
    metrics: generateMetrics(150, 7),
    cSit: 30,
  };
  nodes.set(chiller1.id, chiller1);

  const chiller2: Node = {
    id: "chiller-2",
    name: "Chiller 2",
    type: "Chiller",
    topologies: ["Cooling"],
    parents: [],
    children: ["crac-3", "crac-4"],
    metrics: generateMetrics(150, 8),
    cSit: 30,
  };
  nodes.set(chiller2.id, chiller2);

  // CRACs
  const crac1: Node = {
    id: "crac-1",
    name: "CRAC 1",
    type: "CRAC",
    topologies: ["Cooling"],
    parents: ["chiller-1"],
    children: Array.from({ length: 15 }, (_, i) => `server-${i + 1}`),
    metrics: generateMetrics(75, 18),
    cSit: 30,
  };
  nodes.set(crac1.id, crac1);

  const crac2: Node = {
    id: "crac-2",
    name: "CRAC 2",
    type: "CRAC",
    topologies: ["Cooling"],
    parents: ["chiller-1"],
    children: Array.from({ length: 15 }, (_, i) => `server-${i + 16}`),
    metrics: generateMetrics(75, 19),
    cSit: 30,
  };
  nodes.set(crac2.id, crac2);

  const crac3: Node = {
    id: "crac-3",
    name: "CRAC 3",
    type: "CRAC",
    topologies: ["Cooling"],
    parents: ["chiller-2"],
    children: Array.from({ length: 15 }, (_, i) => `server-${i + 31}`),
    metrics: generateMetrics(75, 17),
    cSit: 30,
  };
  nodes.set(crac3.id, crac3);

  const crac4: Node = {
    id: "crac-4",
    name: "CRAC 4",
    type: "CRAC",
    topologies: ["Cooling"],
    parents: ["chiller-2"],
    children: Array.from({ length: 15 }, (_, i) => `server-${i + 46}`),
    metrics: generateMetrics(75, 18),
    cSit: 30,
  };
  nodes.set(crac4.id, crac4);

  // Share servers from Electrical topology
  const allServerIds = new Set([
    ...crac1.children,
    ...crac2.children,
    ...crac3.children,
    ...crac4.children,
  ]);
  
  for (const serverId of allServerIds) {
    const server = electricalTopology.nodes.get(serverId);
    if (server) {
      nodes.set(serverId, server);
    }
  }

  // Create links
  const links: Link[] = [];
  for (const node of nodes.values()) {
    for (const childId of node.children) {
      links.push({
        id: `link-${node.id}-${childId}`,
        source: node.id,
        target: childId,
        topology: "Cooling",
      });
    }
  }

  return {
    type: "Cooling",
    nodes,
    links,
  };
}

// Export both topologies
export const electricalTopology = createElectricalTopology();
export const coolingTopology = createCoolingTopology();

// Get all topologies
export function getAllTopologies(): Topology[] {
  return [electricalTopology, coolingTopology];
}

// Get topology by type
export function getTopologyByType(type: string): Topology | undefined {
  return getAllTopologies().find((t) => t.type === type);
}

// Export available variables
export const availableVariables: Variable[] = [
  powerVariable,
  tempVariable,
  voltageVariable,
  currentVariable,
];
