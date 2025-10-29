import { describe, it, expect } from "vitest";
import { computeHops, getHopDescription } from "../hops";
import { electricalTopology } from "../../mocks/topologies";
import { NodeType } from "../models";

describe("computeHops", () => {
  it("creates hop link when UPS is hidden between ATS and PDU", () => {
    const visibleNodes = new Set(["ats-1", "pdu-1", "pdu-2", "pdu-3"]);
    const hiddenTypes = new Set<NodeType>(["UPS"]);
    
    const hops = computeHops(electricalTopology, visibleNodes, hiddenTypes);
    
    // Should create hops: ATS-1 → UPS-1 → PDU-1, ATS-1 → UPS-2 → PDU-2, ATS-1 → UPS-3 → PDU-3
    expect(hops.length).toBeGreaterThan(0);
    
    // Find hop from ATS to PDU-1
    const atsTopdu1Hop = hops.find(h => h.source === "ats-1" && h.target === "pdu-1");
    expect(atsTopdu1Hop).toBeDefined();
    expect(atsTopdu1Hop?.isHop).toBe(true);
    expect(atsTopdu1Hop?.viaNodes).toContain("ups-1");
  });

  it("creates multi-hop link when multiple types are hidden", () => {
    const visibleNodes = new Set(["ats-1", "rack-pdu-1", "rack-pdu-2"]);
    const hiddenTypes = new Set<NodeType>(["UPS", "PDU"]);
    
    const hops = computeHops(electricalTopology, visibleNodes, hiddenTypes);
    
    // Should create hop: ATS-1 → UPS-1 → PDU-1 → Rack PDU-1
    const multiHop = hops.find(h => h.source === "ats-1" && h.target === "rack-pdu-1");
    expect(multiHop).toBeDefined();
    expect(multiHop?.viaNodes.length).toBeGreaterThanOrEqual(2); // UPS and PDU
  });

  it("does not create hop when no hidden nodes between visible nodes", () => {
    const visibleNodes = new Set(["ats-1", "ups-1", "pdu-1"]);
    const hiddenTypes = new Set<NodeType>();
    
    const hops = computeHops(electricalTopology, visibleNodes, hiddenTypes);
    
    // No hidden nodes, so no hops
    expect(hops.length).toBe(0);
  });

  it("does not create hop when only one endpoint is visible", () => {
    const visibleNodes = new Set(["ats-1"]); // Only ATS visible
    const hiddenTypes = new Set<NodeType>(["UPS", "PDU"]);
    
    const hops = computeHops(electricalTopology, visibleNodes, hiddenTypes);
    
    // No second visible endpoint, so no hops
    expect(hops.length).toBe(0);
  });
});

describe("getHopDescription", () => {
  it("formats single hidden node correctly", () => {
    const hop = {
      id: "hop-1",
      source: "ats-1",
      target: "pdu-1",
      topology: "Electrical" as const,
      isHop: true as const,
      viaNodes: ["ups-1"],
    };
    
    const description = getHopDescription(hop, electricalTopology);
    expect(description).toBe("via UPS 1");
  });

  it("formats multiple hidden nodes correctly", () => {
    const hop = {
      id: "hop-1",
      source: "ats-1",
      target: "rack-pdu-1",
      topology: "Electrical" as const,
      isHop: true as const,
      viaNodes: ["ups-1", "pdu-1"],
    };
    
    const description = getHopDescription(hop, electricalTopology);
    expect(description).toBe("via UPS 1, PDU Room 1");
  });

  it("truncates when more than 3 hidden nodes", () => {
    const hop = {
      id: "hop-1",
      source: "sg-1",
      target: "server-1",
      topology: "Electrical" as const,
      isHop: true as const,
      viaNodes: ["ats-1", "ups-1", "pdu-1", "rack-pdu-1"],
    };
    
    const description = getHopDescription(hop, electricalTopology);
    expect(description).toContain("via ATS 1, UPS 1, PDU Room 1");
    expect(description).toContain("+1 more");
  });
});
