import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as go from "gojs";
import { Node, Link, MetaNode, Topology, Variable } from "@/lib/models";
import { getHopDescription } from "@/lib/hops";
import { getBranchNodes, ScopeResult, getHiddenBranchesForNode } from "@/lib/scope";
import { getGojsTheme, applyTheme } from "@/lib/theme";
import { getNodeTypeIcon } from "@/lib/icons/nodeTypeIcons";

export interface GraphCanvasRef {
  diagram: go.Diagram | null;
}

interface GraphCanvasProps {
  nodes: Node[];
  links: Link[];
  metaNodes?: MetaNode[];
  selectedNodeId: string | null;
  selectedNodeIds: Set<string>;
  onNodeClick: (nodeId: string, isMultiSelect?: boolean) => void;
  onMetaNodeClick?: (metaNode: MetaNode) => void;
  onSetAsMsn: (nodeId: string) => void;
  onOpenDataPanel: (nodeId: string) => void;
  onToggleFoldType: (nodeId: string) => void;
  onOpenBranchPanel: (nodeId: string) => void;
  onContextMenu?: (data: { nodeId: string; x: number; y: number; canOpenBranch: boolean }) => void;
  onBackgroundContextMenu?: (x: number, y: number) => void;
  overlayMetric?: Variable | null;
  highlightedBranchRoot: string | null;
  topology: Topology;
  scope: ScopeResult | null;
  hiddenBranchRoots?: Set<string>;
  onUnhideBranch?: (rootId: string) => void;
}

export const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(function GraphCanvas({
  nodes,
  links,
  metaNodes = [],
  selectedNodeId,
  selectedNodeIds,
  onNodeClick,
  onMetaNodeClick,
  onSetAsMsn,
  onOpenDataPanel,
  onToggleFoldType,
  onOpenBranchPanel,
  onContextMenu,
  onBackgroundContextMenu,
  overlayMetric,
  highlightedBranchRoot,
  topology,
  scope,
  hiddenBranchRoots,
  onUnhideBranch,
}, ref) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const diagram = useRef<go.Diagram | null>(null);
  // Latest handlers to avoid re-creating templates/listeners
  const handlersRef = useRef({
    onNodeClick,
    onMetaNodeClick,
    onContextMenu,
    onBackgroundContextMenu,
  });

  // Expose diagram to parent via ref
  useImperativeHandle(ref, () => ({
    diagram: diagram.current,
  }));

  useEffect(() => {
    handlersRef.current.onNodeClick = onNodeClick;
    handlersRef.current.onMetaNodeClick = onMetaNodeClick;
    handlersRef.current.onContextMenu = onContextMenu;
    handlersRef.current.onBackgroundContextMenu = onBackgroundContextMenu;
  }, [onNodeClick, onMetaNodeClick, onContextMenu, onBackgroundContextMenu]);

  useEffect(() => {
    if (!diagramRef.current) return;

    const $ = go.GraphObject.make;

    const d = $(go.Diagram, diagramRef.current, {
      "undoManager.isEnabled": true,
      allowHorizontalScroll: true,
      allowVerticalScroll: true,
      hasHorizontalScrollbar: false,
      hasVerticalScrollbar: false,
      initialContentAlignment: go.Spot.Center,
      layout: $(go.LayeredDigraphLayout, {
        direction: 0, // left to right
        layerSpacing: 150,
        columnSpacing: 80,
        setsPortSpots: false,
        packOption: go.LayeredDigraphLayout.PackNone,
      }),
    });
    d.animationManager.isEnabled = false;
    
    // Enable panning tool
    d.toolManager.panningTool.isEnabled = true;

    // Background context menu (right-click on empty canvas)
    d.contextClick = (e) => {
      const part = d.findPartAt(e.documentPoint, false);
      if (!part && handlersRef.current.onBackgroundContextMenu) {
        e.handled = true;
        const viewPoint = d.transformDocToView(e.documentPoint);
        const canvasRect = d.div.getBoundingClientRect();
        handlersRef.current.onBackgroundContextMenu(
          canvasRect.left + viewPoint.x,
          canvasRect.top + viewPoint.y
        );
      }
    };

    // Node template with selection adornment and custom context menu
    const nodeTemplate = $(
      go.Node,
      "Spot", // Changed from "Auto" to allow sibling positioning
      {
        click: (e, obj) => {
          const node = obj.part as go.Node;
          if (node.data?.id) {
            const isMultiSelect = e.control || e.meta; // Ctrl on Windows/Linux, Cmd on Mac
            handlersRef.current.onNodeClick?.(node.data.id, isMultiSelect);
          }
        },
        contextClick: (e, obj) => {
          e.handled = true; // Prevent default GoJS context menu
          const node = obj.part as go.Node;
          if (node.data?.id && handlersRef.current.onContextMenu) {
            const dg = node.diagram;
            if (dg) {
              const viewPoint = dg.transformDocToView(e.documentPoint);
              const canvasRect = dg.div.getBoundingClientRect();
              handlersRef.current.onContextMenu({
                nodeId: node.data.id,
                x: canvasRect.left + viewPoint.x,
                y: canvasRect.top + viewPoint.y,
                canOpenBranch: node.data.canOpenBranch || false,
              });
            }
          }
        },
        toolTip: $(
          go.Adornment,
          "Auto",
          $(go.Shape,
            new go.Binding("fill", "theme", t => t.tooltipFill).ofModel(),
            new go.Binding("stroke", "theme", t => t.tooltipStroke).ofModel()
          ),
          $(
            go.Panel,
            "Vertical",
            { margin: 8 },
            $(
              go.TextBlock,
              {
                margin: 2,
                font: "12px sans-serif",
                visible: false,
              },
              new go.Binding("text", "tooltipMetric"),
              new go.Binding("visible", "tooltipMetric", (m) => !!m),
              new go.Binding("stroke", "theme", t => t.tooltipText).ofModel()
            ),
            $(
              go.TextBlock,
              {
                margin: 2,
                font: "11px sans-serif",
                visible: false,
              },
              new go.Binding("text", "tooltipAlerts"),
              new go.Binding("visible", "tooltipAlerts", (a) => !!a),
              new go.Binding("stroke", "theme", t => t.tooltipText).ofModel()
            ),
            $(
              go.TextBlock,
              {
                margin: 2,
                font: "11px sans-serif",
              },
              new go.Binding("visible", "", (d) => !(d.tooltipMetric || d.tooltipAlerts)),
              new go.Binding("stroke", "theme", t => t.tooltipText).ofModel(),
              "No overlay metric or alerts"
            )
          )
        ),
      },
      // Child 1: Main node card
      $(
        go.Panel,
        "Auto",
        $(
          go.Shape,
          "RoundedRectangle",
          {
            strokeWidth: 2,
          },
          new go.Binding("fill", "", function(data, obj) {
            const theme = (obj.part?.diagram?.model as any)?.modelData?.theme;
            if (!theme) return "#1e293b";
            if (data.isHighlighted) return theme.highlightFill;
            return theme.nodeFill;
          }),
          new go.Binding("stroke", "", function(data, obj) {
            const theme = (obj.part?.diagram?.model as any)?.modelData?.theme;
            if (!theme) return "#475569";
            if (data.isHighlighted) return theme.highlightStroke;
            return theme.nodeStroke;
          })
        ),
        $(
          go.Panel,
          "Vertical",
          { margin: 10 },
          $(
            go.Panel,
            "Horizontal",
            { margin: 5 },
            $(
              go.Shape,
              {
                width: 16,
                height: 16,
                strokeWidth: 1.5,
                strokeCap: "round",
                strokeJoin: "round",
                margin: new go.Margin(0, 8, 0, 0),
                fill: null,
              },
              new go.Binding("geometryString", "iconGeometry"),
              new go.Binding("stroke", "theme", t => t.iconStroke).ofModel()
            ),
            $(
              go.TextBlock,
              {
                font: "bold 14px sans-serif",
              },
              new go.Binding("text", "name"),
              new go.Binding("stroke", "theme", t => t.nodeText).ofModel()
            )
          ),
          $(
            go.TextBlock,
            {
              margin: 2,
              font: "11px sans-serif",
            },
            new go.Binding("text", "type"),
            new go.Binding("stroke", "theme", t => t.nodeTextMuted).ofModel()
          ),
          $(
            go.TextBlock,
            {
              margin: 2,
              font: "12px sans-serif",
              visible: false,
            },
            new go.Binding("text", "metric"),
            new go.Binding("visible", "metric", (m) => !!m),
            new go.Binding("stroke", "theme", t => t.metricText).ofModel()
          )
        )
      ),
      // Child 2: Hidden branch cue (sibling, positioned outside card)
      $(
        go.Panel,
        "Vertical",
        {
          alignment: new go.Spot(1, 0.5, 16, 0), // Right-center with 16px spacing
          alignmentFocus: go.Spot.Left,
          visible: false,
          cursor: "pointer",
          background: "transparent", // Invisible but clickable
          width: 20,  // Larger hit area
          height: 20, // Larger hit area
          click: (e, obj) => {
            e.handled = true;
            const node = obj.part;
            if (node && node.data.hiddenBranchInfo && node.data.hiddenBranchInfo.length > 0) {
              const firstBranch = node.data.hiddenBranchInfo[0];
              if (firstBranch && onUnhideBranch) {
                onUnhideBranch(firstBranch.rootId);
              }
            }
          },
          toolTip: $(
            go.Adornment,
            "Auto",
            $(go.Shape, { 
              fill: "rgba(0, 0, 0, 0.85)", 
              stroke: null 
            }),
            $(
              go.TextBlock,
              {
                margin: 8,
                font: "12px sans-serif",
                stroke: "#ffffff",
                maxSize: new go.Size(300, NaN),
              },
              new go.Binding("text", "hiddenBranchInfo", (branches) => {
                if (!branches || branches.length === 0) return "";
                const lines = branches.slice(0, 3).map((b: any) => 
                  `Branch — ${b.rootName} (${b.nodeCount} nodes) »`
                );
                if (branches.length > 3) {
                  lines.push(`+${branches.length - 3} more`);
                }
                return lines.join("\n");
              })
            )
          )
        },
        new go.Binding("visible", "hasHiddenBranches"),
        $(go.Shape, "Circle", {
          width: 5,  // Increased from 4
          height: 5,
          strokeWidth: 0,
          margin: new go.Margin(4, 0, 1, 0), // Center vertically in 20px hit area
        },
          new go.Binding("fill", "theme", t => t.primary).ofModel()
        ),
        $(go.Shape, "Circle", {
          width: 5,  // Increased from 4
          height: 5,
          strokeWidth: 0,
          margin: new go.Margin(1, 0, 4, 0), // Center vertically in 20px hit area
        },
          new go.Binding("fill", "theme", t => t.primary).ofModel()
        )
      )
    );

    nodeTemplate.selectionAdornmentTemplate = $(
      go.Adornment,
      "Auto",
      $(go.Shape, "RoundedRectangle", { 
        fill: null, 
        strokeWidth: 3 
      },
        new go.Binding("stroke", "theme", t => t.selectionStroke).ofModel()
      ),
      $(go.Placeholder)
    );

    d.nodeTemplate = nodeTemplate;

    // Link template
    d.linkTemplate = $(
      go.Link,
      { routing: go.Link.Orthogonal, corner: 5 },
      $(go.Shape, { strokeWidth: 2 },
        new go.Binding("strokeWidth", "isHighlighted", h => h ? 3 : 2),
        new go.Binding("stroke", "", function(data, obj) {
          const theme = (obj.part?.diagram?.model as any)?.modelData?.theme;
          if (!theme) return "#64748b";
          return data.isHighlighted ? theme.highlightStroke : theme.linkStroke;
        })
      ),
      $(go.Shape, { toArrow: "Standard" },
        new go.Binding("stroke", "", function(data, obj) {
          const theme = (obj.part?.diagram?.model as any)?.modelData?.theme;
          if (!theme) return "#64748b";
          return data.isHighlighted ? theme.highlightStroke : theme.linkStroke;
        }),
        new go.Binding("fill", "", function(data, obj) {
          const theme = (obj.part?.diagram?.model as any)?.modelData?.theme;
          if (!theme) return "#64748b";
          return data.isHighlighted ? theme.highlightStroke : theme.linkStroke;
        })
      )
    );

    // Hop link template
    const hopTemplate = $(
      go.Link,
      { routing: go.Link.Orthogonal, corner: 5, category: "hop" },
      $(go.Shape, {
        strokeWidth: 2,
        strokeDashArray: [4, 4],
      },
        new go.Binding("stroke", "theme", t => t.hopStroke).ofModel()
      ),
      $(go.Shape, { toArrow: "Standard" },
        new go.Binding("stroke", "theme", t => t.hopStroke).ofModel(),
        new go.Binding("fill", "theme", t => t.hopStroke).ofModel()
      ),
      {
        toolTip: $(
          go.Adornment,
          "Auto",
          $(go.Shape,
            new go.Binding("fill", "theme", t => t.tooltipFill).ofModel(),
            new go.Binding("stroke", "theme", t => t.tooltipStroke).ofModel()
          ),
          $(
            go.TextBlock,
            { margin: 4 },
            new go.Binding("text", "via"),
            new go.Binding("stroke", "theme", t => t.tooltipText).ofModel()
          )
        ),
      }
    );

    d.linkTemplateMap.add("hop", hopTemplate);

    // Meta-node template with 3 lines
    const metaNodeTemplate = $(
      go.Node,
      "Auto",
      {
        click: (e, obj) => {
          const node = obj.part as go.Node;
          if (node.data.metaNodeData && handlersRef.current.onMetaNodeClick) {
            handlersRef.current.onMetaNodeClick(node.data.metaNodeData);
          }
        },
      },
      $(
        go.Shape,
        "RoundedRectangle",
        {
          strokeWidth: 3,
          strokeDashArray: [5, 3],
        },
        new go.Binding("fill", "theme", t => t.metaFill).ofModel(),
        new go.Binding("stroke", "theme", t => t.metaStroke).ofModel()
      ),
      $(
        go.Panel,
        "Vertical",
        { margin: 12 },
        $(
          go.Panel,
          "Horizontal",
          { margin: 3 },
          $(
            go.Shape,
            {
              width: 16,
              height: 16,
              strokeWidth: 1.5,
              strokeCap: "round",
              strokeJoin: "round",
              margin: new go.Margin(0, 8, 0, 0),
              fill: null,
            },
            new go.Binding("geometryString", "iconGeometry"),
            new go.Binding("stroke", "theme", t => t.iconStroke).ofModel()
          ),
          $(
            go.TextBlock,
            {
              font: "bold 15px sans-serif",
            },
            new go.Binding("text", "titleLine"),
            new go.Binding("stroke", "theme", t => t.nodeText).ofModel()
          )
        ),
        $(
          go.TextBlock,
          {
            margin: 2,
            font: "11px sans-serif",
          },
          new go.Binding("text", "typeLine"),
          new go.Binding("stroke", "theme", t => t.nodeTextMuted).ofModel()
        ),
        $(
          go.TextBlock,
          {
            margin: 2,
            font: "10px sans-serif",
          },
          new go.Binding("text", "countLine"),
          new go.Binding("stroke", "theme", t => t.nodeTextMuted).ofModel()
        ),
        $(
          go.TextBlock,
          {
            margin: 2,
            font: "12px sans-serif",
            visible: false,
          },
          new go.Binding("text", "metric"),
          new go.Binding("visible", "metric", (m) => !!m),
          new go.Binding("stroke", "theme", t => t.metricText).ofModel()
        )
      )
    );

    d.nodeTemplateMap.add("meta", metaNodeTemplate);

    // Initialize empty model once with theme
    const model = new go.GraphLinksModel([], []);
    model.linkKeyProperty = "key";
    model.modelData = { theme: getGojsTheme() };
    d.model = model;

    diagram.current = d;

    return () => {
      if (diagram.current) {
        diagram.current.div = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!diagram.current) return;

    const d = diagram.current;
    const model = d.model as go.GraphLinksModel;

    // Calculate branch nodes for highlighting
    const branchNodeIds = highlightedBranchRoot && scope
      ? getBranchNodes(highlightedBranchRoot, topology)
      : new Set<string>();

    // Build next node data (no selection flags – use GoJS selection adornment)
    const nextNodeData = nodes.map((node) => {
      let metricValue = "";
      let tooltipMetric = "";
      if (overlayMetric && node.metrics.length > 0) {
        const metric = node.metrics.find(m => m.variable.id === overlayMetric.id);
        if (metric) {
          metricValue = `${metric.value.toFixed(1)} ${metric.variable.unit}`;
          tooltipMetric = `${overlayMetric.name}: ${metric.value.toFixed(1)} ${metric.variable.unit}`;
        }
      }

      let tooltipAlerts = "";
      if (node.alerts && node.alerts.length > 0) {
        tooltipAlerts = `Alerts: ${node.alerts.join(", ")}`;
      }

      // Check if this node can be a branch root (has children in MANTO)
      const nodeBranchSize = node.children.length > 0 ? getBranchNodes(node.id, topology).size : 0;
      const canOpenBranch = nodeBranchSize > 1;
      
      // Get icon geometry for this node type
      const iconDef = getNodeTypeIcon(node.type);

      // Compute hidden branches downstream from this node
      const hiddenBranches = hiddenBranchRoots && scope
        ? getHiddenBranchesForNode(node.id, hiddenBranchRoots, topology)
        : [];

      return {
        key: node.id,
        id: node.id,
        name: node.name,
        type: node.type,
        iconGeometry: iconDef.geometry,
        isHighlighted: branchNodeIds.has(node.id),
        metric: metricValue,
        tooltipMetric,
        tooltipAlerts,
        canOpenBranch,
        hasHiddenBranches: hiddenBranches.length > 0,
        hiddenBranchInfo: hiddenBranches,
      } as any;
    });

    // Meta-node data
    const nextMetaNodeData = metaNodes.map((metaNode) => {
      let metricValue = "";
      if (overlayMetric) {
        const metric = metaNode.consolidatedMetrics.find(m => m.variable.id === overlayMetric.id);
        if (metric) {
          metricValue = `${metric.value.toFixed(1)} ${metric.variable.unit}`;
        }
      }
      
      // Get icon geometry for meta-node type
      const iconDef = getNodeTypeIcon(metaNode.type);

      // Aggregate hidden branches from all nodes in this meta-node
      const aggregatedHiddenBranches = hiddenBranchRoots && scope
        ? metaNode.nodeIds.flatMap(nodeId => 
            getHiddenBranchesForNode(nodeId, hiddenBranchRoots, topology)
          )
        : [];
      
      // Deduplicate by rootId
      const uniqueHiddenBranches = Array.from(
        new Map(aggregatedHiddenBranches.map(b => [b.rootId, b])).values()
      );

      return {
        key: metaNode.id,
        id: metaNode.id,
        category: "meta",
        iconGeometry: iconDef.geometry,
        titleLine: `${metaNode.type} × ${metaNode.count}`,
        typeLine: metaNode.type,
        countLine: `${metaNode.count} nodes`,
        metric: metricValue,
        metaNodeData: metaNode,
        canOpenBranch: false,
        hasHiddenBranches: uniqueHiddenBranches.length > 0,
        hiddenBranchInfo: uniqueHiddenBranches,
      } as any;
    });

    const nextAllNodes = [...nextNodeData, ...nextMetaNodeData];

    const nextLinks = links.map((link) => {
      let viaLabel = "";
      if (link.isHop && link.viaNodes) {
        const nodeNames = link.viaNodes.map((id) => topology.nodes.get(id)?.name || id);
        if (nodeNames.length > 3) {
          const displayed = nodeNames.slice(0, 3).join(", ");
          const remaining = nodeNames.length - 3;
          viaLabel = `via ${displayed} +${remaining} more`;
        } else {
          viaLabel = `via ${nodeNames.join(", ")}`;
        }
      }

      // Highlight links if both endpoints are in the branch
      const isHighlighted = branchNodeIds.has(link.source) && branchNodeIds.has(link.target);

      const category = link.isHop ? "hop" : undefined;
      const key = `${link.source}|${link.target}|${link.isHop ? "H" : "N"}`;

      return {
        key,
        from: link.source,
        to: link.target,
        category,
        via: viaLabel,
        isHighlighted,
      } as any;
    });

    // Precompute structural changes
    const existingNodeKeys = new Set((model.nodeDataArray as any[]).map((n: any) => n.key));
    const existingLinkKeys = new Set(((model as any).linkDataArray as any[]).map((l: any) => l.key));
    const nextNodeKeys = new Set(nextAllNodes.map((n: any) => n.key));
    const nextLinkKeys = new Set(nextLinks.map((l: any) => l.key));
    const nodesAddedOrRemoved = nextAllNodes.length !== (model.nodeDataArray as any[]).length ||
      [...existingNodeKeys].some(k => !nextNodeKeys.has(k)) ||
      [...nextNodeKeys].some(k => !existingNodeKeys.has(k));
    const linksAddedOrRemoved = nextLinks.length !== ((model as any).linkDataArray as any[]).length ||
      [...existingLinkKeys].some(k => !nextLinkKeys.has(k)) ||
      [...nextLinkKeys].some(k => !existingLinkKeys.has(k));

    d.commit((diag) => {
      const m = diag.model as go.GraphLinksModel;

      // Remove nodes not present
      (m.nodeDataArray as any[]).slice().forEach((nd: any) => {
        if (!nextNodeKeys.has(nd.key)) m.removeNodeData(nd);
      });
      // Upsert nodes
      nextAllNodes.forEach((nd: any) => {
        const existing = (m.nodeDataArray as any[]).find((x: any) => x.key === nd.key);
        if (!existing) {
          m.addNodeData(nd);
        } else {
          const props = [
            "name","type","iconGeometry","isHighlighted","metric","tooltipMetric","tooltipAlerts","canOpenBranch","category","titleLine","typeLine","countLine","metaNodeData","hasHiddenBranches","hiddenBranchInfo"
          ];
          props.forEach((p) => {
            if (nd[p] !== undefined && existing[p] !== nd[p]) m.setDataProperty(existing, p, nd[p]);
          });
        }
      });

      // Ensure linkKeyProperty is set
      m.linkKeyProperty = "key";
      const existingLinks = ((m as any).linkDataArray as any[]);

      // Remove links not present
      existingLinks.slice().forEach((ld: any) => {
        if (!nextLinkKeys.has(ld.key)) (m as any).removeLinkData(ld);
      });
      // Upsert links
      nextLinks.forEach((ld: any) => {
        const existing = existingLinks.find((x: any) => x.key === ld.key);
        if (!existing) {
          (m as any).addLinkData(ld);
        } else {
          const props = ["from","to","category","via","isHighlighted"];
          props.forEach((p) => {
            if (existing[p] !== ld[p]) m.setDataProperty(existing, p, ld[p]);
          });
        }
      });
    }, "update-diagram");

    // Layout only on structural changes
    if (nodesAddedOrRemoved || linksAddedOrRemoved) {
      // Track which node keys are added and removed
      const addedNodeKeys = Array.from(nextNodeKeys).filter(k => !existingNodeKeys.has(k));
      const removedNodeKeys = Array.from(existingNodeKeys).filter(k => !nextNodeKeys.has(k));
      
      // Detect meta-node expansion: many nodes added (5+) but few removed (1-3 meta-nodes)
      const isMetaNodeExpansion = addedNodeKeys.length > 4 && removedNodeKeys.length > 0 && removedNodeKeys.length <= 3;
      
      // Scope change: many nodes removed (4+) that aren't just meta-nodes, or initial load
      const isScopeChange = !isMetaNodeExpansion && 
        (removedNodeKeys.length > 3 || (addedNodeKeys.length > 5 && existingNodeKeys.size === 0));
      
      // Store camera state before layout
      const oldScale = d.scale;
      const oldPosition = d.position.copy();
      
      // Run layout
      d.layoutDiagram(true);
      
      if (isScopeChange) {
        // Scope change: center and fit the new graph
        d.zoomToFit();
      } else {
        // Expansion/minor change: preserve camera and pan to new nodes
        d.scale = oldScale;
        d.position = oldPosition;
        
        if (addedNodeKeys.length > 0) {
          const newNodes = addedNodeKeys
            .map(key => d.findNodeForKey(key))
            .filter((n): n is go.Node => n !== null);
          
          if (newNodes.length > 0) {
            let bounds = newNodes[0].actualBounds.copy();
            newNodes.slice(1).forEach(node => {
              bounds.unionRect(node.actualBounds);
            });
            d.scrollToRect(bounds.inflate(40, 40));
          }
        }
      }
    }
  }, [nodes, metaNodes, links, overlayMetric, highlightedBranchRoot, topology, scope, hiddenBranchRoots]);

  // Sync GoJS selection with React selectedNodeIds
  useEffect(() => {
    if (!diagram.current) return;
    
    const d = diagram.current;
    console.log('[GraphCanvas] Syncing selection, selectedNodeIds:', Array.from(selectedNodeIds));
    d.commit((diag) => {
      // Clear current selection
      diag.clearSelection();
      
      // Select nodes that are in selectedNodeIds
      selectedNodeIds.forEach(nodeId => {
        const node = diag.findNodeForKey(nodeId);
        console.log('[GraphCanvas] Finding node for key:', nodeId, 'found:', !!node);
        if (node) {
          node.isSelected = true;
        }
      });
    }, "sync-selection");
  }, [selectedNodeIds]);

  // Apply theme when component mounts or theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      applyTheme(diagram.current);
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Initial theme application
    applyTheme(diagram.current);
    
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={diagramRef} className="w-full h-full bg-graph-bg overflow-hidden" />
  );
});
