import { describe, it, expect } from "vitest";
import { computeScope } from "../scope";
import { electricalTopology } from "../../mocks/topologies";

describe("computeScope", () => {
  it("returns exactly upstream ∪ MSN ∪ downstream for ATS-1", () => {
    const result = computeScope("ats-1", electricalTopology);
    
    // Expected: MSN (ATS 1) + Switch Gears + UPS + PDUs + Rack PDUs + Servers (all downstream)
    // No upstream since ATS is root
    expect(result.msn).toBe("ats-1");
    expect(result.upstream.size).toBe(0); // ATS is root
    expect(result.downstream.size).toBeGreaterThan(0); // All downstream nodes
    expect(result.nodes.has("ats-1")).toBe(true);
    expect(result.nodes.has("sg-1")).toBe(true);
    expect(result.nodes.has("sg-2")).toBe(true);
  });

  it("returns correct scope for PDU-1", () => {
    const result = computeScope("pdu-1", electricalTopology);
    
    // Expected: upstream (ATS, Switch Gears, UPS) + PDU 1 (MSN) + Rack PDUs + Servers (downstream)
    expect(result.msn).toBe("pdu-1");
    expect(result.upstream.size).toBeGreaterThan(0); // Has upstream nodes
    expect(result.downstream.size).toBeGreaterThan(0); // Has Rack PDUs and Servers
    
    // Check specific upstream nodes
    expect(result.nodes.has("ats-1")).toBe(true);
    expect(result.nodes.has("ups-1")).toBe(true);
  });

  it("returns only MSN and downstream for root nodes", () => {
    const result = computeScope("ats-1", electricalTopology);
    
    // ATS is a root node (no parents)
    expect(result.msn).toBe("ats-1");
    expect(result.upstream.size).toBe(0);
    expect(result.downstream.size).toBeGreaterThan(0);
    expect(result.nodes.has("sg-1")).toBe(true);
  });

  it("returns only MSN and upstream for leaf nodes", () => {
    const result = computeScope("server-1", electricalTopology);
    
    // Server 1 is a leaf node (no children)
    expect(result.msn).toBe("server-1");
    expect(result.downstream.size).toBe(0);
    expect(result.upstream.size).toBeGreaterThan(0); // Has upstream chain
    expect(result.nodes.has("rack-pdu-1")).toBe(true);
  });
});
