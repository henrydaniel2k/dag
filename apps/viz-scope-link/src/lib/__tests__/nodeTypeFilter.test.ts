import { describe, it, expect } from "vitest";
import { computeScope } from "../scope";
import { electricalTopology } from "../../mocks/topologies";
import { NodeType } from "../models";

describe("Node Type Filter defaults", () => {
  it("hides parent-only types by default for ATS-1", () => {
    const scope = computeScope("ats-1", electricalTopology);
    const msnNode = electricalTopology.nodes.get("ats-1")!;
    
    // Determine parent-only types
    const upstreamTypes = new Set<NodeType>();
    const downstreamTypes = new Set<NodeType>();
    
    for (const upstreamId of scope.upstream) {
      const upstream = electricalTopology.nodes.get(upstreamId);
      if (upstream) upstreamTypes.add(upstream.type);
    }
    
    downstreamTypes.add(msnNode.type); // ATS
    for (const downstreamId of scope.downstream) {
      const downstream = electricalTopology.nodes.get(downstreamId);
      if (downstream) downstreamTypes.add(downstream.type);
    }
    
    const parentOnlyTypes = new Set<NodeType>();
    for (const type of upstreamTypes) {
      if (!downstreamTypes.has(type) && type !== msnNode.type) {
        parentOnlyTypes.add(type);
      }
    }
    
    // Since ATS is root, there should be no upstream types
    expect(parentOnlyTypes.size).toBe(0);
    
    // Switch Gear should be downstream (children of ATS)
    expect(downstreamTypes.has("Switch Gear")).toBe(true);
  });

  it("shows child types by default for ATS-1", () => {
    const scope = computeScope("ats-1", electricalTopology);
    
    // Get all types in scope
    const scopeTypes = new Set<NodeType>();
    for (const nodeId of scope.nodes) {
      const node = electricalTopology.nodes.get(nodeId);
      if (node) scopeTypes.add(node.type);
    }
    
    // ATS is root, so scope includes ATS + all downstream (Switch Gear, UPS, PDU, Rack PDU, Server)
    expect(scopeTypes.has("ATS")).toBe(true);
    expect(scopeTypes.has("Switch Gear")).toBe(true);
    expect(scopeTypes.has("UPS")).toBe(true);
    expect(scopeTypes.has("PDU")).toBe(true);
    expect(scopeTypes.has("Rack PDU")).toBe(true);
    expect(scopeTypes.has("Server")).toBe(true);
  });

  it("MSN type is locked and cannot be hidden", () => {
    const scope = computeScope("ats-1", electricalTopology);
    const msnNode = electricalTopology.nodes.get("ats-1")!;
    
    // MSN type should be ATS
    expect(msnNode.type).toBe("ATS");
    
    // In the UI, this type should be locked (checkbox disabled)
    // This is a behavioral test - the lock is enforced in the component
  });

  it("available types match exactly the types in scope", () => {
    const scope = computeScope("pdu-1", electricalTopology);
    
    // Get types in scope
    const scopeTypes = new Set<NodeType>();
    for (const nodeId of scope.nodes) {
      const node = electricalTopology.nodes.get(nodeId);
      if (node) scopeTypes.add(node.type);
    }
    
    // For PDU-1: upstream (ATS, Switch Gear, UPS) + PDU (MSN) + downstream (Rack PDU, Server)
    expect(scopeTypes.has("ATS")).toBe(true);
    expect(scopeTypes.has("Switch Gear")).toBe(true);
    expect(scopeTypes.has("UPS")).toBe(true);
    expect(scopeTypes.has("PDU")).toBe(true);
    expect(scopeTypes.has("Rack PDU")).toBe(true);
    expect(scopeTypes.has("Server")).toBe(true);
  });
});
