import { useState, useEffect, useMemo, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { GraphCanvas, GraphCanvasRef } from "@/components/GraphCanvas";
import { FloatingDock } from "@/components/FloatingDock";
import { QuickNodeTypeControls } from "@/components/QuickNodeTypeControls";
import { NodeTypePanel } from "@/components/NodeTypePanel";
import { NodeGroupPanel } from "@/components/NodeGroupPanel";
import { PartialFoldDialog } from "@/components/PartialFoldDialog";
import { MetricSelector } from "@/components/MetricSelector";
import { ImmersiveToggle } from "@/components/ImmersiveToggle";
import { ViewMenu } from "@/components/ViewMenu";
import { NodeDataPanel } from "@/components/NodeDataPanel";
import { BranchDataPanel } from "@/components/BranchDataPanel";
import { PartialExpandDialog } from "@/components/PartialExpandDialog";
import { FoldSelectedButton } from "@/components/FoldSelectedButton";
import { ContextMenuPortal } from "@/components/ContextMenuPortal";
import { TopologyType, NodeType, Variable, TimeWindow, MetaNode, Node as GraphNode } from "@/lib/models";
import { typeIndex } from "@/lib/types";
import { computeScope, getBranchNodes } from "@/lib/scope";
import { computeHops } from "@/lib/hops";
import { getAutoFoldNodeIds, foldNodeType, mergeParallelConnectors } from "@/lib/folding";
import { electricalTopology, coolingTopology } from "@/mocks/topologies";
import { isWindowAllowed, getMinimumWindow } from "@/lib/timeWindows";
import { toast } from "sonner";

export default function RuntimePage() {
  const graphCanvasRef = useRef<GraphCanvasRef>(null);
  const [diagramReady, setDiagramReady] = useState(false);
  const [selectedManto, setSelectedManto] = useState<TopologyType>("Electrical");
  const [selectedMsn, setSelectedMsn] = useState<string | null>("ats-1");
  
  // Check if diagram is ready
  useEffect(() => {
    const checkDiagram = setInterval(() => {
      if (graphCanvasRef.current?.diagram) {
        setDiagramReady(true);
        clearInterval(checkDiagram);
      }
    }, 100);
    
    return () => clearInterval(checkDiagram);
  }, []);
  const [hiddenTypes, setHiddenTypes] = useState<NodeType[]>([]);
  const [lockedType, setLockedType] = useState<NodeType | null>(null);
  const [foldedNodeIds, setFoldedNodeIds] = useState<Set<string>>(new Set());
  const [overlayMetric, setOverlayMetric] = useState<Variable | null>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("Latest");
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null); // For data panel
  const [branchRootNode, setBranchRootNode] = useState<string | null>(null); // For branch panel
  const [currentView, setCurrentView] = useState<"Physical View" | "Graph View" | "Data Reports" | "Alerts" | "Data Inputs">("Graph View");
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [expandDialogMetaNode, setExpandDialogMetaNode] = useState<MetaNode | null>(null);
  const [nodeTypePanelOpen, setNodeTypePanelOpen] = useState(false);
  const [nodeGroupPanelOpen, setNodeGroupPanelOpen] = useState(false);
  const [selectedGroupType, setSelectedGroupType] = useState<NodeType | null>(null);
  const [partialFoldDialogOpen, setPartialFoldDialogOpen] = useState(false);
  const [partialFoldType, setPartialFoldType] = useState<NodeType | null>(null);
  const [autoFoldedTypes, setAutoFoldedTypes] = useState<Set<NodeType>>(new Set());
  const [hiddenBranchRoots, setHiddenBranchRoots] = useState<Set<string>>(new Set());
  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    nodeId?: string;
    canOpenBranch: boolean;
  } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => document.documentElement.classList.contains('light') ? 'light' : 'dark'
  );

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('light', next === 'light');
    setTheme(next);
  };

  // Get the correct topology based on selected MANTO
  const topology = selectedManto === "Electrical" ? electricalTopology : coolingTopology;

  // When MANTO changes, reset MSN to a valid node in the new topology
  useEffect(() => {
    if (selectedMsn && !topology.nodes.has(selectedMsn)) {
      // Find the first root node in the new topology
      const rootNode = Array.from(topology.nodes.values()).find(
        (node) => node.parents.length === 0
      );
      setSelectedMsn(rootNode?.id || null);
      setSelectedNode(null); // Clear the data panel
    }
  }, [selectedManto, topology, selectedMsn]);

  // Sync MSN selection to selectedNodeIds for visual green border
  useEffect(() => {
    if (selectedMsn) {
      console.log('[RuntimePage] Syncing MSN to selectedNodeIds:', selectedMsn);
      setSelectedNodeIds(new Set([selectedMsn]));
    }
  }, [selectedMsn]);

  // Only compute scope if MSN exists in current topology
  const scope = useMemo(
    () => (selectedMsn && topology.nodes.has(selectedMsn) ? computeScope(selectedMsn, topology) : null),
    [selectedMsn, topology]
  );

  // Compute upstream and downstream IDs
  const upstream = useMemo(() => (scope ? Array.from(scope.upstream) : []), [scope]);
  const downstream = useMemo(() => (scope ? Array.from(scope.downstream) : []), [scope]);

  // Compute scope types ordered as Upstream → MSN → Downstream
  const scopeTypes = useMemo(() => {
    if (!scope || !selectedMsn) return [];
    
    const msnNode = topology.nodes.get(selectedMsn);
    if (!msnNode) return [];

    const msnType = msnNode.type;

    // Get unique upstream types (excluding MSN type)
    const upstreamTypes = Array.from(
      new Set(upstream.map((id) => topology.nodes.get(id)?.type).filter((t): t is NodeType => t !== undefined && t !== msnType))
    ).sort((a, b) => typeIndex[a] - typeIndex[b]);

    // Get unique downstream types (excluding MSN type and types already in upstream)
    const upstreamTypeSet = new Set(upstreamTypes);
    const downstreamTypes = Array.from(
      new Set(downstream.map((id) => topology.nodes.get(id)?.type).filter((t): t is NodeType => t !== undefined && t !== msnType && !upstreamTypeSet.has(t)))
    ).sort((a, b) => typeIndex[a] - typeIndex[b]);

    // Order: Upstream → MSN → Downstream (no duplicates)
    return [...upstreamTypes, msnType, ...downstreamTypes];
  }, [scope, upstream, downstream, selectedMsn, topology]);

  // Set defaults when MSN or MANTO changes
  useEffect(() => {
    if (!selectedMsn || !scope) return;

    const msnNode = topology.nodes.get(selectedMsn);
    if (!msnNode) return;

    const upstreamTypes = new Set<NodeType>(
      upstream.map((id) => topology.nodes.get(id)?.type).filter((t): t is NodeType => !!t)
    );
    const downstreamTypes = new Set<NodeType>(
      downstream.map((id) => topology.nodes.get(id)?.type).filter((t): t is NodeType => !!t)
    );

    // Parent-only types = appear in upstream but not in downstream (and not MSN type)
    const parentOnly = Array.from(upstreamTypes).filter((t) => !downstreamTypes.has(t) && t !== msnNode.type);

    setHiddenTypes(parentOnly); // hide parent-only by default
    setLockedType(msnNode.type); // MSN type locked

    // Auto-fold node IDs with >10 nodes of same type
    const scopeNodeIds = Array.from(scope.nodes);
    const scopeNodes = scopeNodeIds
      .map((id) => topology.nodes.get(id))
      .filter((n): n is NonNullable<typeof n> => !!n);
    const autoFoldNodeIds = getAutoFoldNodeIds(scopeNodes, 10);
    setFoldedNodeIds(autoFoldNodeIds);

    // Track which types were auto-folded
    const typeCounts = new Map<NodeType, number>();
    scopeNodes.forEach((node) => {
      typeCounts.set(node.type, (typeCounts.get(node.type) || 0) + 1);
    });
    const autoTypes = new Set<NodeType>();
    typeCounts.forEach((count, type) => {
      if (count > 10) autoTypes.add(type);
    });
    setAutoFoldedTypes(autoTypes);
  }, [selectedMsn, selectedManto, scope, upstream, downstream, topology]);

  // Auto-bump time window when metric or MSN changes
  useEffect(() => {
    if (!overlayMetric || !selectedMsn) return;

    const msnNode = topology.nodes.get(selectedMsn);
    if (!msnNode) return;

    if (!isWindowAllowed(timeWindow, overlayMetric, msnNode)) {
      const minWindow = getMinimumWindow(overlayMetric, msnNode);
      setTimeWindow(minWindow);
      toast.info(`Time window adjusted to ${minWindow}`, {
        description: `Blocked by SIT=${overlayMetric.sit}m`,
        duration: 3000,
      });
    }
  }, [overlayMetric, selectedMsn, topology, timeWindow]);

  // Compute visible IDs before folding (after applying hiddenTypes filter)
  const visibleIdsBeforeFold = useMemo(() => {
    if (!scope) return new Set<string>();
    const hidden = new Set<NodeType>(hiddenTypes);
    return new Set(
      Array.from(scope.nodes).filter((id) => {
        const node = topology.nodes.get(id);
        return node && !hidden.has(node.type);
      })
    );
  }, [scope, hiddenTypes, topology]);

  // Branch hiding layer (new): filter out hidden branches
  const visibleIdsAfterBranchHide = useMemo(() => {
    if (hiddenBranchRoots.size === 0) return visibleIdsBeforeFold;
    
    const hiddenNodes = new Set<string>();
    
    // For each hidden branch root, compute all descendants
    hiddenBranchRoots.forEach(rootId => {
      if (!visibleIdsBeforeFold.has(rootId)) return; // Root not visible by type filter
      
      const branch = getBranchNodes(rootId, topology);
      branch.forEach(nodeId => {
        if (visibleIdsBeforeFold.has(nodeId)) {
          hiddenNodes.add(nodeId);
        }
      });
    });
    
    // Multi-parent logic: only hide if ALL visible upstream paths are hidden
    const hiddenRootIds = new Set(hiddenBranchRoots);
    const finalHidden = new Set<string>();
    
    hiddenNodes.forEach(nodeId => {
      // Always hide the root itself - don't apply multi-parent check
      if (hiddenRootIds.has(nodeId)) {
        finalHidden.add(nodeId);
        return;
      }
      
      const node = topology.nodes.get(nodeId);
      if (!node) return;
      
      // Check if at least one visible parent is NOT in hiddenNodes
      const hasVisibleParent = node.parents.some(parentId => 
        visibleIdsBeforeFold.has(parentId) && !hiddenNodes.has(parentId)
      );
      
      if (!hasVisibleParent) {
        finalHidden.add(nodeId);
      }
    });
    
    return new Set(
      Array.from(visibleIdsBeforeFold).filter(id => !finalHidden.has(id))
    );
  }, [visibleIdsBeforeFold, hiddenBranchRoots, topology]);

  const visibleNodes = useMemo(
    () =>
      Array.from(visibleIdsAfterBranchHide)
        .map((id) => topology.nodes.get(id))
        .filter((n): n is NonNullable<typeof n> => !!n),
    [visibleIdsAfterBranchHide, topology]
  );

  // Apply partial folding: group folded nodes by type into meta-nodes
  const metaNodes: MetaNode[] = [];
  const unfoldedNodes: typeof visibleNodes = [];
  
  if (visibleNodes.length > 0) {
    const foldedNodesByType = new Map<NodeType, typeof visibleNodes>();
    
    for (const node of visibleNodes) {
      if (!node) continue;
      
      if (foldedNodeIds.has(node.id)) {
        // This node is folded - add to meta-node group
        if (!foldedNodesByType.has(node.type)) {
          foldedNodesByType.set(node.type, []);
        }
        foldedNodesByType.get(node.type)!.push(node);
      } else {
        // This node is unfolded - show individually
        unfoldedNodes.push(node);
      }
    }
    
    // Create meta-nodes for each type that has folded nodes
    for (const [type, nodes] of foldedNodesByType.entries()) {
      if (nodes.length > 0) {
        const metaNode = foldNodeType(type, nodes, topology);
        metaNodes.push(metaNode);
      }
    }
  }

  // Compute hops after filtering
  const hopLinks = useMemo(() => {
    if (!scope) return [];
    const hidden = new Set<NodeType>(hiddenTypes);
    return computeHops(topology, visibleIdsBeforeFold, hidden);
  }, [scope, topology, visibleIdsBeforeFold, hiddenTypes]);

  // Direct links between unfolded nodes
  let directLinks = topology.links.filter(
    (link) =>
      unfoldedNodes.some((n) => n?.id === link.source) &&
      unfoldedNodes.some((n) => n?.id === link.target)
  );

  // Adjust hop links for folded nodes
  const adjustedHopLinks = hopLinks.map(link => {
    let source = link.source;
    let target = link.target;
    
    // Check if source is in a meta-node
    const sourceMetaNode = metaNodes.find(m => m.nodeIds.includes(link.source));
    if (sourceMetaNode) source = sourceMetaNode.id;
    
    // Check if target is in a meta-node
    const targetMetaNode = metaNodes.find(m => m.nodeIds.includes(link.target));
    if (targetMetaNode) target = targetMetaNode.id;
    
    return { ...link, source, target };
  });

  // Links to/from meta-nodes (non-hop)
  const metaLinks = metaNodes.flatMap(metaNode => {
    const links: typeof directLinks = [];
    
    // Find all non-hop links that connect to nodes within this meta-node
    for (const link of topology.links) {
      const sourceInMeta = metaNode.nodeIds.includes(link.source);
      const targetInMeta = metaNode.nodeIds.includes(link.target);
      
      if (sourceInMeta && !targetInMeta) {
        // Link from meta-node to external node
        const targetNode = unfoldedNodes.find(n => n?.id === link.target);
        const targetMetaNode = metaNodes.find(m => m.nodeIds.includes(link.target));
        
        if (targetNode || targetMetaNode) {
          links.push({
            ...link,
            source: metaNode.id,
            target: targetMetaNode ? targetMetaNode.id : link.target,
          });
        }
      } else if (!sourceInMeta && targetInMeta) {
        // Link from external node to meta-node
        const sourceNode = unfoldedNodes.find(n => n?.id === link.source);
        const sourceMetaNode = metaNodes.find(m => m.nodeIds.includes(link.source));
        
        if (sourceNode || sourceMetaNode) {
          links.push({
            ...link,
            source: sourceMetaNode ? sourceMetaNode.id : link.source,
            target: metaNode.id,
          });
        }
      } else if (sourceInMeta && targetInMeta) {
        // Both in same meta-node - skip internal links
        continue;
      }
    }
    
    return links;
  });

  // Merge all links and deduplicate
  const allLinks = mergeParallelConnectors([...directLinks, ...metaLinks, ...adjustedHopLinks]);

  const handleNodeClick = (nodeId: string, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      const newSelected = new Set(selectedNodeIds);
      if (newSelected.has(nodeId)) {
        newSelected.delete(nodeId);
      } else {
        newSelected.add(nodeId);
      }
      setSelectedNodeIds(newSelected);
    } else {
      setSelectedNodeIds(new Set([nodeId]));
      setSelectedNode(nodeId);
    }
  };

  const handleMetaNodeClick = (metaNode: MetaNode) => {
    // Open partial expand dialog
    setExpandDialogMetaNode(metaNode);
  };

  const handlePartialExpand = (nodeIds: string[]) => {
    setFoldedNodeIds((prev) => {
      const newSet = new Set(prev);
      nodeIds.forEach((id) => newSet.delete(id));
      return newSet;
    });
  };

  const handleFoldSelected = () => {
    if (selectedNodeIds.size < 2) return;
    
    setFoldedNodeIds((prev) => {
      const newSet = new Set(prev);
      selectedNodeIds.forEach((id) => newSet.add(id));
      return newSet;
    });
    setSelectedNodeIds(new Set());
  };

  // Node Type Panel handlers
  const handleFoldAllOfType = (type: NodeType) => {
    const typeNodeIds = visibleNodes
      .filter((n) => n?.type === type)
      .map((n) => n!.id);
    
    setFoldedNodeIds((prev) => {
      const newSet = new Set(prev);
      typeNodeIds.forEach((id) => newSet.add(id));
      return newSet;
    });
  };

  const handleUnfoldAllOfType = (type: NodeType) => {
    const typeNodeIds = visibleNodes
      .filter((n) => n?.type === type)
      .map((n) => n!.id);
    
    setFoldedNodeIds((prev) => {
      const newSet = new Set(prev);
      typeNodeIds.forEach((id) => newSet.delete(id));
      return newSet;
    });
  };


  const getTypeNodeCount = (type: NodeType) => {
    if (!scope) return { total: 0, folded: 0, unfolded: 0, visible: 0, hiddenBranch: 0 };
    
    // Compute totalInScope from scope only (ignore visibility state)
    const scopeNodesOfType = Array.from(scope.nodes)
      .map(id => topology.nodes.get(id))
      .filter((n): n is NonNullable<typeof n> => n?.type === type);
    
    const totalInScope = scopeNodesOfType.length;
    
    // Compute visibleCount from totalInScope ∩ visibleTypes
    const isHidden = hiddenTypes.includes(type);
    
    // Count nodes hidden by branch hiding
    const hiddenByBranch = scopeNodesOfType.filter(n => 
      !visibleIdsAfterBranchHide.has(n.id) && visibleIdsBeforeFold.has(n.id)
    ).length;
    
    const visibleNodesOfType = isHidden ? [] : scopeNodesOfType.filter(n => 
      visibleIdsAfterBranchHide.has(n.id)
    );
    
    const folded = visibleNodesOfType.filter(n => foldedNodeIds.has(n.id)).length;
    const unfolded = visibleNodesOfType.length - folded;
    const visible = unfolded; // Unfolded nodes are visible
    
    return {
      total: totalInScope,
      folded,
      unfolded,
      visible,
      hiddenBranch: hiddenByBranch,
    };
  };

  // Compute parent-only types for badges
  const parentOnlyTypes = useMemo(() => {
    if (!scope || !selectedMsn) return new Set<NodeType>();

    const msnNode = topology.nodes.get(selectedMsn);
    if (!msnNode) return new Set<NodeType>();

    const upstreamTypes = new Set<NodeType>(
      upstream.map((id) => topology.nodes.get(id)?.type).filter((t): t is NodeType => !!t)
    );
    const downstreamTypes = new Set<NodeType>(
      downstream.map((id) => topology.nodes.get(id)?.type).filter((t): t is NodeType => !!t)
    );

    return new Set(
      Array.from(upstreamTypes).filter((t) => !downstreamTypes.has(t) && t !== msnNode.type)
    );
  }, [scope, upstream, downstream, selectedMsn, topology]);

  // Handler to open Node Group Panel
  const handleOpenNodeGroup = (type: NodeType) => {
    setSelectedGroupType(type);
    setNodeGroupPanelOpen(true);
  };

  // Handler to reset to scope defaults
  const handleResetToDefaults = () => {
    if (!selectedMsn || !scope) return;

    const msnNode = topology.nodes.get(selectedMsn);
    if (!msnNode) return;

    const upstreamTypes = new Set<NodeType>(
      upstream.map((id) => topology.nodes.get(id)?.type).filter((t): t is NodeType => !!t)
    );
    const downstreamTypes = new Set<NodeType>(
      downstream.map((id) => topology.nodes.get(id)?.type).filter((t): t is NodeType => !!t)
    );

    const parentOnly = Array.from(upstreamTypes).filter((t) => !downstreamTypes.has(t) && t !== msnNode.type);

    setHiddenTypes(parentOnly);
    setLockedType(msnNode.type);

    const scopeNodeIds = Array.from(scope.nodes);
    const scopeNodes = scopeNodeIds
      .map((id) => topology.nodes.get(id))
      .filter((n): n is NonNullable<typeof n> => !!n);
    const autoFoldNodeIds = getAutoFoldNodeIds(scopeNodes, 10);
    setFoldedNodeIds(autoFoldNodeIds);
    
    // Clear hidden branches
    setHiddenBranchRoots(new Set());

    toast.success("Reset to scope defaults", {
      description: "Visibility, folding, and hidden branches cleared",
    });
  };

  // Hide Branch handlers
  const handleHideBranch = (nodeId: string) => {
    const node = topology.nodes.get(nodeId);
    if (!node) return;
    
    // Check eligibility
    const hasVisibleParent = node.parents.some(parentId => 
      visibleIdsBeforeFold.has(parentId)
    );
    
    if (!hasVisibleParent) {
      toast.error("Cannot hide branch", {
        description: "This node has no upstream parent in the current view",
      });
      return;
    }
    
    setHiddenBranchRoots(prev => new Set(prev).add(nodeId));
    
    const branchSize = getBranchNodes(nodeId, topology).size;
    toast.success(`Hidden branch: ${node.name}`, {
      description: `${branchSize} nodes hidden`,
    });
  };

  const handleUnhideBranch = (nodeId: string) => {
    const node = topology.nodes.get(nodeId);
    if (!node) return;
    
    setHiddenBranchRoots(prev => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });
    
    toast.success(`Unhid branch: ${node.name}`);
  };

  const handleBulkHideBranch = (nodeIds: string[]) => {
    const newHidden = new Set(hiddenBranchRoots);
    nodeIds.forEach(id => newHidden.add(id));
    setHiddenBranchRoots(newHidden);
    
    toast.success(`Hidden ${nodeIds.length} branch${nodeIds.length > 1 ? 'es' : ''}`);
  };

  const handleBulkUnhideBranch = (nodeIds: string[]) => {
    const newHidden = new Set(hiddenBranchRoots);
    nodeIds.forEach(id => newHidden.delete(id));
    setHiddenBranchRoots(newHidden);
    
    toast.success(`Unhid ${nodeIds.length} branch${nodeIds.length > 1 ? 'es' : ''}`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // T key: toggle Node Type Panel
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setNodeTypePanelOpen((prev) => !prev);
      }

      // I key: toggle Immersive Mode
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setImmersiveMode((prev) => !prev);
      }
      
      // Esc: close panels
      if (e.key === 'Escape') {
        if (nodeTypePanelOpen) {
          setNodeTypePanelOpen(false);
        }
        if (nodeGroupPanelOpen) {
          setNodeGroupPanelOpen(false);
        }
        if (partialFoldDialogOpen) {
          setPartialFoldDialogOpen(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodeTypePanelOpen, nodeGroupPanelOpen, partialFoldDialogOpen]);

  // Compute hasNonDefaultSettings for quick controls indicator
  const hasNonDefaultSettings = useMemo(() => {
    return hiddenTypes.length > 0 || foldedNodeIds.size > 0;
  }, [hiddenTypes.length, foldedNodeIds.size]);

  return (
    <div className="flex h-screen bg-background">
      <Navigation
        selectedManto={selectedManto}
        onMantoChange={setSelectedManto}
        selectedMsn={selectedMsn}
        onMsnChange={setSelectedMsn}
      />
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-4">
            <ViewMenu currentView={currentView} onViewChange={setCurrentView} />
            {currentView === "Graph View" && selectedMsn && topology.nodes.get(selectedMsn) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>MSN:</span>
                <span className="font-medium text-foreground">
                  {topology.nodes.get(selectedMsn)!.name}
                </span>
                <span className="px-2 py-0.5 text-xs rounded bg-secondary/60 border border-border">
                  {topology.nodes.get(selectedMsn)!.type}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MetricSelector
              selectedMetric={overlayMetric}
              onMetricChange={setOverlayMetric}
              selectedWindow={timeWindow}
              onWindowChange={setTimeWindow}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <ImmersiveToggle
              immersiveMode={immersiveMode}
              onToggle={setImmersiveMode}
            />
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          {currentView === "Graph View" ? (
            <>
              <div className="flex-1 flex flex-col">
                <QuickNodeTypeControls
                  scopeTypes={scopeTypes}
                  hiddenTypes={hiddenTypes}
                  onToggleType={(type) => {
                    setHiddenTypes((prev) =>
                      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                    );
                  }}
                  lockedType={lockedType}
                  foldedNodeIds={foldedNodeIds}
                  onOpenNodeTypePanel={() => setNodeTypePanelOpen(true)}
                  getTypeNodeCount={getTypeNodeCount}
                  autoFoldedTypes={autoFoldedTypes}
                  hasNonDefaultSettings={hasNonDefaultSettings}
                />
                <div className="flex-1 overflow-hidden relative">
                  <GraphCanvas
                    ref={graphCanvasRef}
                    nodes={(unfoldedNodes.length > 0
                      ? unfoldedNodes
                      : (selectedMsn && topology.nodes.get(selectedMsn)
                          ? [topology.nodes.get(selectedMsn)!]
                          : [])
                    ).filter((n): n is NonNullable<typeof n> => !!n)}
                    metaNodes={metaNodes}
                    links={allLinks}
                    selectedNodeId={selectedMsn}
                    selectedNodeIds={selectedNodeIds}
                    onNodeClick={handleNodeClick}
                    onMetaNodeClick={handleMetaNodeClick}
                    onSetAsMsn={(id) => setSelectedMsn(id)}
                    onOpenDataPanel={(id) => setSelectedNode(id)}
                    onToggleFoldType={(nodeId) => {
                      // Toggle fold state for this individual node
                      const newFolded = new Set(foldedNodeIds);
                      if (newFolded.has(nodeId)) {
                        newFolded.delete(nodeId);
                      } else {
                        newFolded.add(nodeId);
                      }
                      setFoldedNodeIds(newFolded);
                    }}
                    onOpenBranchPanel={(id) => setBranchRootNode(id)}
                    onContextMenu={(data) => setContextMenuState({ isOpen: true, ...data })}
                    onBackgroundContextMenu={(x, y) => setContextMenuState({ isOpen: true, x, y, nodeId: undefined, canOpenBranch: false })}
                    overlayMetric={overlayMetric}
                    highlightedBranchRoot={branchRootNode}
                    topology={topology}
                    scope={scope}
                    hiddenBranchRoots={hiddenBranchRoots}
                    onUnhideBranch={handleUnhideBranch}
                  />
                  <FoldSelectedButton
                    selectedCount={selectedNodeIds.size}
                    onFoldSelected={handleFoldSelected}
                  />
                  <FloatingDock diagram={graphCanvasRef.current?.diagram || null} />
                </div>
              </div>
              {selectedNode && topology.nodes.get(selectedNode) && (
                <NodeDataPanel
                  node={topology.nodes.get(selectedNode)!}
                  onClose={() => setSelectedNode(null)}
                  overlayMetric={overlayMetric}
                  timeWindow={timeWindow}
                />
              )}
              {branchRootNode && topology.nodes.get(branchRootNode) && (
                <BranchDataPanel
                  rootNode={topology.nodes.get(branchRootNode)!}
                  onClose={() => setBranchRootNode(null)}
                  overlayMetric={overlayMetric}
                  timeWindow={timeWindow}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-foreground mb-2">{currentView}</h2>
                <p className="text-muted-foreground">Coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <PartialExpandDialog
        metaNode={expandDialogMetaNode}
        open={expandDialogMetaNode !== null}
        onClose={() => setExpandDialogMetaNode(null)}
        onExpand={handlePartialExpand}
        getNodeName={(nodeId) => topology.nodes.get(nodeId)?.name || nodeId}
      />
      <ContextMenuPortal
        isOpen={contextMenuState?.isOpen || false}
        x={contextMenuState?.x || 0}
        y={contextMenuState?.y || 0}
        node={contextMenuState?.nodeId ? topology.nodes.get(contextMenuState.nodeId) || null : null}
        canOpenBranch={contextMenuState?.canOpenBranch || false}
        visibleNodes={unfoldedNodes.filter((n): n is GraphNode => n !== null && n !== undefined)}
        allScopeNodes={visibleNodes.filter((n): n is GraphNode => n !== null && n !== undefined)}
        hiddenBranchRoots={hiddenBranchRoots}
        visibleIdsBeforeFold={visibleIdsBeforeFold}
        onOpenDataPanel={() => {
          if (contextMenuState?.nodeId) {
            // Always open Node Data Panel (same as left-click)
            setSelectedNode(contextMenuState.nodeId);
            setBranchRootNode(null);
          }
        }}
        onSetAsMsn={() => {
          if (contextMenuState?.nodeId) setSelectedMsn(contextMenuState.nodeId);
        }}
        onToggleFold={() => {
          if (contextMenuState?.nodeId) {
            const newFolded = new Set(foldedNodeIds);
            if (newFolded.has(contextMenuState.nodeId)) {
              newFolded.delete(contextMenuState.nodeId);
            } else {
              newFolded.add(contextMenuState.nodeId);
            }
            setFoldedNodeIds(newFolded);
          }
        }}
        onOpenBranchPanel={() => {
          if (contextMenuState?.nodeId) {
            setBranchRootNode(contextMenuState.nodeId);
            setSelectedNode(null);
          }
        }}
        onOpenNodeTypePanel={() => {
          setNodeTypePanelOpen(true);
          setContextMenuState(null);
        }}
        onHideBranch={handleHideBranch}
        onUnhideBranch={handleUnhideBranch}
        onClose={() => setContextMenuState(null)}
      />
      <NodeTypePanel
        open={nodeTypePanelOpen}
        onOpenChange={setNodeTypePanelOpen}
        scopeTypes={scopeTypes}
        hiddenTypes={hiddenTypes}
        onToggleType={(type) => {
          setHiddenTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
          );
          // Clear AUTO badge when user manually changes fold state
          setAutoFoldedTypes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(type);
            return newSet;
          });
        }}
        lockedType={lockedType}
        foldedNodeIds={foldedNodeIds}
        onFoldAll={(type) => {
          handleFoldAllOfType(type);
          setAutoFoldedTypes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(type);
            return newSet;
          });
        }}
        onUnfoldAll={(type) => {
          handleUnfoldAllOfType(type);
          setAutoFoldedTypes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(type);
            return newSet;
          });
        }}
        onPartialFold={(type) => {
          setPartialFoldType(type);
          setPartialFoldDialogOpen(true);
          setAutoFoldedTypes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(type);
            return newSet;
          });
        }}
        getTypeNodeCount={getTypeNodeCount}
        onOpenNodeGroup={handleOpenNodeGroup}
        onResetToDefaults={handleResetToDefaults}
        autoFoldedTypes={autoFoldedTypes}
        parentOnlyTypes={parentOnlyTypes}
      />
      <NodeGroupPanel
        open={nodeGroupPanelOpen}
        onOpenChange={setNodeGroupPanelOpen}
        nodeType={selectedGroupType}
        nodes={Array.from(topology.nodes.values()).filter((n) => n.type === selectedGroupType)}
        foldedNodeIds={foldedNodeIds}
        hiddenBranchRoots={hiddenBranchRoots}
        visibleIdsBeforeFold={visibleIdsBeforeFold}
        topology={topology}
        onFoldNodes={(nodeIds) => {
          setFoldedNodeIds((prev) => {
            const newSet = new Set(prev);
            nodeIds.forEach((id) => newSet.add(id));
            return newSet;
          });
        }}
        onUnfoldNodes={(nodeIds) => {
          setFoldedNodeIds((prev) => {
            const newSet = new Set(prev);
            nodeIds.forEach((id) => newSet.delete(id));
            return newSet;
          });
        }}
        onHideBranch={handleBulkHideBranch}
        onUnhideBranch={handleBulkUnhideBranch}
      />
      <PartialFoldDialog
        open={partialFoldDialogOpen}
        onClose={() => {
          setPartialFoldDialogOpen(false);
          setPartialFoldType(null);
        }}
        nodeType={partialFoldType!}
        nodes={partialFoldType ? visibleNodes.filter((n) => n?.type === partialFoldType) as GraphNode[] : []}
        onFold={(nodeIds) => {
          setFoldedNodeIds((prev) => {
            const newSet = new Set(prev);
            nodeIds.forEach((id) => newSet.add(id));
            return newSet;
          });
        }}
        getNodeName={(nodeId) => topology.nodes.get(nodeId)?.name || nodeId}
      />
    </div>
  );
}
