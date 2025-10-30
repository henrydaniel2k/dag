/**
 * GoJS Integration Service
 * Manages GoJS diagram lifecycle, templates, and incremental updates
 *
 * This service bridges Angular components with GoJS diagram library.
 * It handles:
 * - Diagram initialization and configuration
 * - Node and link templates with theme bindings
 * - Incremental updates (upsert nodes/links without full rebuild)
 * - Smart camera positioning (scope changes vs expansions)
 * - Selection synchronization
 * - Theme application
 */

import {
  Injectable,
  signal,
  effect,
  WritableSignal,
  inject,
} from '@angular/core';
import * as go from 'gojs';
import { Topology, Node, Link, MetaNode, Variable } from '../../models';
import type { ScopeResult, HiddenBranchInfo } from './scope.service';
import { NodeIconService } from './node-icon.service';
import { ThemeService } from './theme.service';
import { ScopeService } from './scope.service';

/**
 * GoJS node data interface
 * Extends Node with GoJS-specific display properties
 */
export interface GojsNodeData {
  key: string;
  id: string;
  name: string;
  type: string;
  iconGeometry: string;
  isHighlighted: boolean;
  metric: string;
  tooltipMetric: string;
  tooltipAlerts: string;
  canOpenBranch: boolean;
  hasHiddenBranches: boolean;
  hiddenBranchInfo: HiddenBranchInfo[];
  category?: string;
  // Meta-node specific
  titleLine?: string;
  typeLine?: string;
  countLine?: string;
  metaNodeData?: MetaNode;
}

/**
 * GoJS link data interface
 */
export interface GojsLinkData {
  key: string;
  from: string;
  to: string;
  category?: string;
  via?: string;
  isHighlighted: boolean;
}

/**
 * Diagram event callbacks
 */
export interface DiagramCallbacks {
  onNodeClick?: (nodeId: string, isMultiSelect: boolean) => void;
  onMetaNodeClick?: (metaNode: MetaNode) => void;
  onContextMenu?: (data: {
    nodeId: string;
    x: number;
    y: number;
    canOpenBranch: boolean;
  }) => void;
  onBackgroundContextMenu?: (x: number, y: number) => void;
  onUnhideBranch?: (rootId: string) => void;
}

@Injectable({
  providedIn: 'root',
})
export class GojsService {
  /**
   * GoJS diagram instance
   */
  private diagram: go.Diagram | null = null;

  /**
   * Current callbacks for diagram events
   * Stored in signal to avoid template recreation on callback changes
   */
  private readonly callbacks: WritableSignal<DiagramCallbacks> = signal({});

  /**
   * Previous node/link keys for detecting structural changes
   */
  private previousNodeKeys = new Set<string>();
  private previousLinkKeys = new Set<string>();

  private readonly nodeIconService = inject(NodeIconService);
  private readonly themeService = inject(ThemeService);
  private readonly scopeService = inject(ScopeService);

  constructor() {
    // Apply theme changes to diagram
    effect(() => {
      this.themeService.theme(); // Track theme signal
      if (this.diagram) {
        this.themeService.applyTheme(this.diagram);
      }
    });
  }

  /**
   * Initialize GoJS diagram in a container element
   * @param container HTML div element to host the diagram
   * @param callbacks Event callbacks for user interactions
   * @returns GoJS Diagram instance
   */
  initializeDiagram(
    container: HTMLDivElement,
    callbacks: DiagramCallbacks = {}
  ): go.Diagram {
    if (this.diagram) {
      // Cleanup existing diagram
      this.diagram.div = null;
    }

    this.callbacks.set(callbacks);

    const $ = go.GraphObject.make;

    const diagram = $(go.Diagram, container, {
      'undoManager.isEnabled': true,
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

    diagram.animationManager.isEnabled = false;
    diagram.toolManager.panningTool.isEnabled = true;

    // Background context menu (right-click on empty canvas)
    diagram.contextClick = (e: go.InputEvent) => {
      const part = diagram.findPartAt(e.documentPoint, false);
      if (!part && this.callbacks().onBackgroundContextMenu) {
        e.handled = true;
        const viewPoint = diagram.transformDocToView(e.documentPoint);
        const canvasRect = diagram.div!.getBoundingClientRect();
        this.callbacks().onBackgroundContextMenu!(
          canvasRect.left + viewPoint.x,
          canvasRect.top + viewPoint.y
        );
      }
    };

    // Setup templates
    this.setupNodeTemplate(diagram);
    this.setupLinkTemplate(diagram);
    this.setupHopLinkTemplate(diagram);
    this.setupMetaNodeTemplate(diagram);

    // Initialize empty model with theme
    const model = new go.GraphLinksModel([], []);
    model.linkKeyProperty = 'key';
    model.modelData = { theme: this.themeService.getGojsTheme() };
    diagram.model = model;

    this.diagram = diagram;
    return diagram;
  }

  /**
   * Setup regular node template
   */
  private setupNodeTemplate(diagram: go.Diagram): void {
    const $ = go.GraphObject.make;

    const nodeTemplate = $(
      go.Node,
      'Spot', // Allows sibling positioning (for hidden branch cue)
      {
        click: (e: go.InputEvent, obj: go.GraphObject) => {
          const node = obj.part as go.Node;
          if (node.data?.id) {
            const isMultiSelect = e.control || e.meta; // Ctrl/Cmd for multi-select
            this.callbacks().onNodeClick?.(node.data.id, isMultiSelect);
          }
        },
        contextClick: (e: go.InputEvent, obj: go.GraphObject) => {
          e.handled = true; // Prevent default context menu
          const node = obj.part as go.Node;
          if (node.data?.id && this.callbacks().onContextMenu) {
            const dg = node.diagram;
            if (dg) {
              const viewPoint = dg.transformDocToView(e.documentPoint);
              const canvasRect = dg.div!.getBoundingClientRect();
              this.callbacks().onContextMenu!({
                nodeId: node.data.id,
                x: canvasRect.left + viewPoint.x,
                y: canvasRect.top + viewPoint.y,
                canOpenBranch: node.data.canOpenBranch || false,
              });
            }
          }
        },
        toolTip: this.createNodeTooltip($),
      },
      // Child 1: Main node card
      this.createNodeCard($),
      // Child 2: Hidden branch cue
      this.createHiddenBranchCue($)
    );

    // Selection adornment
    nodeTemplate.selectionAdornmentTemplate = $(
      go.Adornment,
      'Auto',
      $(
        go.Shape,
        'RoundedRectangle',
        { fill: null, strokeWidth: 3 },
        new go.Binding('stroke', 'theme', (t) => t.selectionStroke).ofModel()
      ),
      $(go.Placeholder)
    );

    diagram.nodeTemplate = nodeTemplate;
  }

  /**
   * Create node tooltip adornment
   */
  private createNodeTooltip($: typeof go.GraphObject.make): go.Adornment {
    return $(
      go.Adornment,
      'Auto',
      $(
        go.Shape,
        new go.Binding('fill', 'theme', (t) => t.tooltipFill).ofModel(),
        new go.Binding('stroke', 'theme', (t) => t.tooltipStroke).ofModel()
      ),
      $(
        go.Panel,
        'Vertical',
        { margin: 8 },
        // Metric tooltip
        $(
          go.TextBlock,
          {
            margin: 2,
            font: '12px sans-serif',
            visible: false,
          },
          new go.Binding('text', 'tooltipMetric'),
          new go.Binding('visible', 'tooltipMetric', (m) => !!m),
          new go.Binding('stroke', 'theme', (t) => t.tooltipText).ofModel()
        ),
        // Alerts tooltip
        $(
          go.TextBlock,
          {
            margin: 2,
            font: '11px sans-serif',
            visible: false,
          },
          new go.Binding('text', 'tooltipAlerts'),
          new go.Binding('visible', 'tooltipAlerts', (a) => !!a),
          new go.Binding('stroke', 'theme', (t) => t.tooltipText).ofModel()
        ),
        // Fallback message
        $(
          go.TextBlock,
          {
            margin: 2,
            font: '11px sans-serif',
          },
          new go.Binding(
            'visible',
            '',
            (d) => !(d.tooltipMetric || d.tooltipAlerts)
          ),
          new go.Binding('stroke', 'theme', (t) => t.tooltipText).ofModel(),
          'No overlay metric or alerts'
        )
      )
    );
  }

  /**
   * Create main node card panel
   */
  private createNodeCard($: typeof go.GraphObject.make): go.Panel {
    return $(
      go.Panel,
      'Auto',
      $(
        go.Shape,
        'RoundedRectangle',
        { strokeWidth: 2 },
        new go.Binding('fill', '', function (data, obj) {
          const theme = (obj.part?.diagram?.model as go.GraphLinksModel)
            ?.modelData?.['theme'];
          if (!theme) return '#1e293b';
          if (data.isHighlighted) return theme.highlightFill;
          return theme.nodeFill;
        }),
        new go.Binding('stroke', '', function (data, obj) {
          const theme = (obj.part?.diagram?.model as go.GraphLinksModel)
            ?.modelData?.['theme'];
          if (!theme) return '#475569';
          if (data.isHighlighted) return theme.highlightStroke;
          return theme.nodeStroke;
        })
      ),
      $(
        go.Panel,
        'Vertical',
        { margin: 10 },
        // Icon + Name row
        $(
          go.Panel,
          'Horizontal',
          { margin: 5 },
          $(
            go.Shape,
            {
              width: 16,
              height: 16,
              strokeWidth: 1.5,
              strokeCap: 'round',
              strokeJoin: 'round',
              margin: new go.Margin(0, 8, 0, 0),
              fill: null,
            },
            new go.Binding('geometryString', 'iconGeometry'),
            new go.Binding('stroke', 'theme', (t) => t.iconStroke).ofModel()
          ),
          $(
            go.TextBlock,
            { font: 'bold 14px sans-serif' },
            new go.Binding('text', 'name'),
            new go.Binding('stroke', 'theme', (t) => t.nodeText).ofModel()
          )
        ),
        // Type label
        $(
          go.TextBlock,
          {
            margin: 2,
            font: '11px sans-serif',
          },
          new go.Binding('text', 'type'),
          new go.Binding('stroke', 'theme', (t) => t.nodeTextMuted).ofModel()
        ),
        // Metric value
        $(
          go.TextBlock,
          {
            margin: 2,
            font: '12px sans-serif',
            visible: false,
          },
          new go.Binding('text', 'metric'),
          new go.Binding('visible', 'metric', (m) => !!m),
          new go.Binding('stroke', 'theme', (t) => t.metricText).ofModel()
        )
      )
    );
  }

  /**
   * Create hidden branch cue indicator
   * Positioned to the right of node card
   */
  private createHiddenBranchCue($: typeof go.GraphObject.make): go.Panel {
    return $(
      go.Panel,
      'Vertical',
      {
        alignment: new go.Spot(1, 0.5, 16, 0), // Right-center with 16px spacing
        alignmentFocus: go.Spot.Left,
        visible: false,
        cursor: 'pointer',
        background: 'transparent',
        width: 20,
        height: 20,
        click: (e: go.InputEvent, obj: go.GraphObject) => {
          e.handled = true;
          const node = obj.part;
          if (
            node &&
            node.data.hiddenBranchInfo &&
            node.data.hiddenBranchInfo.length > 0
          ) {
            const firstBranch = node.data.hiddenBranchInfo[0];
            if (firstBranch && this.callbacks().onUnhideBranch) {
              this.callbacks().onUnhideBranch!(firstBranch.rootId);
            }
          }
        },
        toolTip: $(
          go.Adornment,
          'Auto',
          $(go.Shape, { fill: 'rgba(0, 0, 0, 0.85)', stroke: null }),
          $(
            go.TextBlock,
            {
              margin: 8,
              font: '12px sans-serif',
              stroke: '#ffffff',
              maxSize: new go.Size(300, NaN),
            },
            new go.Binding('text', 'hiddenBranchInfo', (branches) => {
              if (!branches || branches.length === 0) return '';
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const lines = branches
                .slice(0, 3)
                .map(
                  (b: any) => `Branch — ${b.rootName} (${b.nodeCount} nodes) »`
                );
              if (branches.length > 3) {
                lines.push(`+${branches.length - 3} more`);
              }
              return lines.join('\n');
            })
          )
        ),
      },
      new go.Binding('visible', 'hasHiddenBranches'),
      // Two circle dots
      $(
        go.Shape,
        'Circle',
        {
          width: 5,
          height: 5,
          strokeWidth: 0,
          margin: new go.Margin(4, 0, 1, 0),
        },
        new go.Binding('fill', 'theme', (t) => t.primary).ofModel()
      ),
      $(
        go.Shape,
        'Circle',
        {
          width: 5,
          height: 5,
          strokeWidth: 0,
          margin: new go.Margin(1, 0, 4, 0),
        },
        new go.Binding('fill', 'theme', (t) => t.primary).ofModel()
      )
    );
  }

  /**
   * Setup regular link template
   */
  private setupLinkTemplate(diagram: go.Diagram): void {
    const $ = go.GraphObject.make;

    diagram.linkTemplate = $(
      go.Link,
      { routing: go.Link.Orthogonal, corner: 5 },
      $(
        go.Shape,
        { strokeWidth: 2 },
        new go.Binding('strokeWidth', 'isHighlighted', (h) => (h ? 3 : 2)),
        new go.Binding('stroke', '', function (data, obj) {
          const theme = (obj.part?.diagram?.model as go.GraphLinksModel)
            ?.modelData?.['theme'];
          if (!theme) return '#64748b';
          return data.isHighlighted ? theme.highlightStroke : theme.linkStroke;
        })
      ),
      $(
        go.Shape,
        { toArrow: 'Standard' },
        new go.Binding('stroke', '', function (data, obj) {
          const theme = (obj.part?.diagram?.model as go.GraphLinksModel)
            ?.modelData?.['theme'];
          if (!theme) return '#64748b';
          return data.isHighlighted ? theme.highlightStroke : theme.linkStroke;
        }),
        new go.Binding('fill', '', function (data, obj) {
          const theme = (obj.part?.diagram?.model as go.GraphLinksModel)
            ?.modelData?.['theme'];
          if (!theme) return '#64748b';
          return data.isHighlighted ? theme.highlightStroke : theme.linkStroke;
        })
      )
    );
  }

  /**
   * Setup hop link template (dashed links through hidden nodes)
   */
  private setupHopLinkTemplate(diagram: go.Diagram): void {
    const $ = go.GraphObject.make;

    const hopTemplate = $(
      go.Link,
      { routing: go.Link.Orthogonal, corner: 5, category: 'hop' },
      $(
        go.Shape,
        {
          strokeWidth: 2,
          strokeDashArray: [4, 4],
        },
        new go.Binding('stroke', 'theme', (t) => t.hopStroke).ofModel()
      ),
      $(
        go.Shape,
        { toArrow: 'Standard' },
        new go.Binding('stroke', 'theme', (t) => t.hopStroke).ofModel(),
        new go.Binding('fill', 'theme', (t) => t.hopStroke).ofModel()
      ),
      {
        toolTip: $(
          go.Adornment,
          'Auto',
          $(
            go.Shape,
            new go.Binding('fill', 'theme', (t) => t.tooltipFill).ofModel(),
            new go.Binding('stroke', 'theme', (t) => t.tooltipStroke).ofModel()
          ),
          $(
            go.TextBlock,
            { margin: 4 },
            new go.Binding('text', 'via'),
            new go.Binding('stroke', 'theme', (t) => t.tooltipText).ofModel()
          )
        ),
      }
    );

    diagram.linkTemplateMap.add('hop', hopTemplate);
  }

  /**
   * Setup meta-node template (folded nodes)
   */
  private setupMetaNodeTemplate(diagram: go.Diagram): void {
    const $ = go.GraphObject.make;

    const metaNodeTemplate = $(
      go.Node,
      'Auto',
      {
        click: (e: go.InputEvent, obj: go.GraphObject) => {
          const node = obj.part as go.Node;
          if (node.data.metaNodeData && this.callbacks().onMetaNodeClick) {
            this.callbacks().onMetaNodeClick!(node.data.metaNodeData);
          }
        },
      },
      $(
        go.Shape,
        'RoundedRectangle',
        {
          strokeWidth: 3,
          strokeDashArray: [5, 3],
        },
        new go.Binding('fill', 'theme', (t) => t.metaFill).ofModel(),
        new go.Binding('stroke', 'theme', (t) => t.metaStroke).ofModel()
      ),
      $(
        go.Panel,
        'Vertical',
        { margin: 12 },
        // Icon + Title row
        $(
          go.Panel,
          'Horizontal',
          { margin: 3 },
          $(
            go.Shape,
            {
              width: 16,
              height: 16,
              strokeWidth: 1.5,
              strokeCap: 'round',
              strokeJoin: 'round',
              margin: new go.Margin(0, 8, 0, 0),
              fill: null,
            },
            new go.Binding('geometryString', 'iconGeometry'),
            new go.Binding('stroke', 'theme', (t) => t.iconStroke).ofModel()
          ),
          $(
            go.TextBlock,
            { font: 'bold 15px sans-serif' },
            new go.Binding('text', 'titleLine'),
            new go.Binding('stroke', 'theme', (t) => t.nodeText).ofModel()
          )
        ),
        // Type line
        $(
          go.TextBlock,
          {
            margin: 2,
            font: '11px sans-serif',
          },
          new go.Binding('text', 'typeLine'),
          new go.Binding('stroke', 'theme', (t) => t.nodeTextMuted).ofModel()
        ),
        // Count line
        $(
          go.TextBlock,
          {
            margin: 2,
            font: '10px sans-serif',
          },
          new go.Binding('text', 'countLine'),
          new go.Binding('stroke', 'theme', (t) => t.nodeTextMuted).ofModel()
        ),
        // Metric value
        $(
          go.TextBlock,
          {
            margin: 2,
            font: '12px sans-serif',
            visible: false,
          },
          new go.Binding('text', 'metric'),
          new go.Binding('visible', 'metric', (m) => !!m),
          new go.Binding('stroke', 'theme', (t) => t.metricText).ofModel()
        )
      )
    );

    diagram.nodeTemplateMap.add('meta', metaNodeTemplate);
  }

  /**
   * Get current diagram instance
   */
  getDiagram(): go.Diagram | null {
    return this.diagram;
  }

  /**
   * Update diagram callbacks without recreating templates
   */
  updateCallbacks(callbacks: DiagramCallbacks): void {
    this.callbacks.set(callbacks);
  }

  /**
   * Update diagram with new data (incremental update)
   * This is the core update logic that handles:
   * - Structural changes (nodes/links added/removed)
   * - Property updates (highlight, metrics, etc.)
   * - Smart layout and camera positioning
   *
   * @param config Update configuration
   */
  updateDiagram(config: {
    nodes: Node[];
    links: Link[];
    metaNodes?: MetaNode[];
    overlayMetric?: Variable | null;
    highlightedBranchRoot?: string | null;
    topology: Topology;
    scope: ScopeResult | null;
    hiddenBranchRoots?: Set<string>;
    selectedNodeIds?: Set<string>;
  }): void {
    if (!this.diagram) return;

    const {
      nodes,
      links,
      metaNodes = [],
      overlayMetric,
      highlightedBranchRoot,
      topology,
      scope,
      hiddenBranchRoots,
      selectedNodeIds,
    } = config;

    const diagram = this.diagram;
    const model = diagram.model as go.GraphLinksModel;

    // Calculate branch nodes for highlighting
    const branchNodeIds =
      highlightedBranchRoot && topology
        ? this.scopeService.getBranchNodes(highlightedBranchRoot, topology)
        : new Set<string>();

    // Build next node data
    const nextNodeData = nodes.map((node) => {
      let metricValue = '';
      let tooltipMetric = '';
      if (overlayMetric && node.metrics.length > 0) {
        const metric = node.metrics.find(
          (m: { variable: { id: string } }) =>
            m.variable.id === overlayMetric.id
        );
        if (metric) {
          metricValue = `${metric.value.toFixed(1)} ${metric.variable.unit}`;
          tooltipMetric = `${overlayMetric.name}: ${metric.value.toFixed(1)} ${
            metric.variable.unit
          }`;
        }
      }

      let tooltipAlerts = '';
      if (node.alerts && node.alerts.length > 0) {
        tooltipAlerts = `Alerts: ${node.alerts.join(', ')}`;
      }

      // Check if this node can be a branch root
      const nodeBranchSize =
        node.children.length > 0
          ? this.scopeService.getBranchNodes(node.id, topology).size
          : 0;
      const canOpenBranch = nodeBranchSize > 1;

      // Get icon geometry
      const iconGeometry = this.nodeIconService.getGeometry(node.type);

      // Compute hidden branches
      const hiddenBranches =
        hiddenBranchRoots && scope
          ? this.scopeService.getHiddenBranchesForNode(
              node.id,
              hiddenBranchRoots,
              topology
            )
          : [];

      return {
        key: node.id,
        id: node.id,
        name: node.name,
        type: node.type,
        iconGeometry,
        isHighlighted: branchNodeIds.has(node.id),
        metric: metricValue,
        tooltipMetric,
        tooltipAlerts,
        canOpenBranch,
        hasHiddenBranches: hiddenBranches.length > 0,
        hiddenBranchInfo: hiddenBranches,
      } as GojsNodeData;
    });

    // Build meta-node data
    const nextMetaNodeData = metaNodes.map((metaNode) => {
      let metricValue = '';
      if (overlayMetric) {
        const metric = metaNode.consolidatedMetrics.find(
          (m: { variable: { id: string } }) =>
            m.variable.id === overlayMetric.id
        );
        if (metric) {
          metricValue = `${metric.value.toFixed(1)} ${metric.variable.unit}`;
        }
      }

      // Get icon geometry
      const iconGeometry = this.nodeIconService.getGeometry(metaNode.type);

      // Aggregate hidden branches from all nodes in this meta-node
      const aggregatedHiddenBranches =
        hiddenBranchRoots && scope
          ? metaNode.nodeIds.flatMap((nodeId: string) =>
              this.scopeService.getHiddenBranchesForNode(
                nodeId,
                hiddenBranchRoots,
                topology
              )
            )
          : [];

      // Deduplicate by rootId
      const uniqueHiddenBranches = Array.from(
        new Map(
          aggregatedHiddenBranches.map((b: HiddenBranchInfo) => [b.rootId, b])
        ).values()
      );

      return {
        key: metaNode.id,
        id: metaNode.id,
        category: 'meta',
        iconGeometry,
        titleLine: `${metaNode.type} × ${metaNode.count}`,
        typeLine: metaNode.type,
        countLine: `${metaNode.count} nodes`,
        metric: metricValue,
        metaNodeData: metaNode,
        canOpenBranch: false,
        hasHiddenBranches: uniqueHiddenBranches.length > 0,
        hiddenBranchInfo: uniqueHiddenBranches,
      } as GojsNodeData;
    });

    const nextAllNodes = [...nextNodeData, ...nextMetaNodeData];

    // Build link data
    const nextLinks = links.map((link) => {
      let viaLabel = '';
      if (link.isHop && link.viaNodes) {
        const nodeNames = link.viaNodes.map(
          (id: string) => topology.nodes.get(id)?.name || id
        );
        if (nodeNames.length > 3) {
          const displayed = nodeNames.slice(0, 3).join(', ');
          const remaining = nodeNames.length - 3;
          viaLabel = `via ${displayed} +${remaining} more`;
        } else {
          viaLabel = `via ${nodeNames.join(', ')}`;
        }
      }

      // Highlight links if both endpoints are in the branch
      const isHighlighted =
        branchNodeIds.has(link.source) && branchNodeIds.has(link.target);

      const category = link.isHop ? 'hop' : undefined;
      const key = `${link.source}|${link.target}|${link.isHop ? 'H' : 'N'}`;

      return {
        key,
        from: link.source,
        to: link.target,
        category,
        via: viaLabel,
        isHighlighted,
      } as GojsLinkData;
    });

    // Detect structural changes
    const existingNodeKeys = new Set(
      (model.nodeDataArray as GojsNodeData[]).map((n) => n.key)
    );
    const existingLinkKeys = new Set(
      (model.linkDataArray as GojsLinkData[]).map((l) => l.key)
    );
    const nextNodeKeys = new Set(nextAllNodes.map((n) => n.key));
    const nextLinkKeys = new Set(nextLinks.map((l) => l.key));

    const nodesAddedOrRemoved =
      nextAllNodes.length !== model.nodeDataArray.length ||
      [...existingNodeKeys].some((k) => !nextNodeKeys.has(k)) ||
      [...nextNodeKeys].some((k) => !existingNodeKeys.has(k));

    const linksAddedOrRemoved =
      nextLinks.length !== model.linkDataArray.length ||
      [...existingLinkKeys].some((k) => !nextLinkKeys.has(k)) ||
      [...nextLinkKeys].some((k) => !existingLinkKeys.has(k));

    // Incremental update within a transaction
    diagram.commit(() => {
      const m = diagram.model as go.GraphLinksModel;

      // Remove nodes not present
      (m.nodeDataArray as GojsNodeData[]).slice().forEach((nd) => {
        if (!nextNodeKeys.has(nd.key)) m.removeNodeData(nd);
      });

      // Upsert nodes
      nextAllNodes.forEach((nd) => {
        const existing = (m.nodeDataArray as GojsNodeData[]).find(
          (x) => x.key === nd.key
        );
        if (!existing) {
          m.addNodeData(nd);
        } else {
          // Update properties if changed
          const props = [
            'name',
            'type',
            'iconGeometry',
            'isHighlighted',
            'metric',
            'tooltipMetric',
            'tooltipAlerts',
            'canOpenBranch',
            'category',
            'titleLine',
            'typeLine',
            'countLine',
            'metaNodeData',
            'hasHiddenBranches',
            'hiddenBranchInfo',
          ];
          props.forEach((p) => {
            const key = p as keyof GojsNodeData;
            if (nd[key] !== undefined && existing[key] !== nd[key]) {
              m.setDataProperty(existing, p, nd[key]);
            }
          });
        }
      });

      // Ensure linkKeyProperty is set
      m.linkKeyProperty = 'key';
      const existingLinks = m.linkDataArray as GojsLinkData[];

      // Remove links not present
      existingLinks.slice().forEach((ld) => {
        if (!nextLinkKeys.has(ld.key)) m.removeLinkData(ld);
      });

      // Upsert links
      nextLinks.forEach((ld) => {
        const existing = existingLinks.find((x) => x.key === ld.key);
        if (!existing) {
          m.addLinkData(ld);
        } else {
          // Update properties if changed
          const props = ['from', 'to', 'category', 'via', 'isHighlighted'];
          props.forEach((p) => {
            const key = p as keyof GojsLinkData;
            if (existing[key] !== ld[key]) {
              m.setDataProperty(existing, p, ld[key]);
            }
          });
        }
      });
    }, 'update-diagram');

    // Layout and camera positioning on structural changes
    if (nodesAddedOrRemoved || linksAddedOrRemoved) {
      this.handleLayoutAndCamera(
        diagram,
        existingNodeKeys,
        nextNodeKeys,
        this.previousNodeKeys
      );
    }

    // Sync selection
    if (selectedNodeIds) {
      this.syncSelection(diagram, selectedNodeIds);
    }

    // Update previous keys for next comparison
    this.previousNodeKeys = nextNodeKeys;
    this.previousLinkKeys = nextLinkKeys;
  }

  /**
   * Handle layout and camera positioning based on change type
   * - Scope change: Center and fit
   * - Meta-node expansion: Preserve camera, pan to new nodes
   * - Minor changes: Preserve camera
   */
  private handleLayoutAndCamera(
    diagram: go.Diagram,
    existingNodeKeys: Set<string>,
    nextNodeKeys: Set<string>,
    previousNodeKeys: Set<string>
  ): void {
    const addedNodeKeys = Array.from(nextNodeKeys).filter(
      (k) => !existingNodeKeys.has(k)
    );
    const removedNodeKeys = Array.from(existingNodeKeys).filter(
      (k) => !nextNodeKeys.has(k)
    );

    // Detect meta-node expansion: many nodes added (5+) but few removed (1-3 meta-nodes)
    const isMetaNodeExpansion =
      addedNodeKeys.length > 4 &&
      removedNodeKeys.length > 0 &&
      removedNodeKeys.length <= 3;

    // Scope change: many nodes removed (4+) or initial load
    const isScopeChange =
      !isMetaNodeExpansion &&
      (removedNodeKeys.length > 3 ||
        (addedNodeKeys.length > 5 && previousNodeKeys.size === 0));

    // Store camera state before layout
    const oldScale = diagram.scale;
    const oldPosition = diagram.position.copy();

    // Run layout
    diagram.layoutDiagram(true);

    if (isScopeChange) {
      // Scope change: center and fit the new graph
      diagram.zoomToFit();
    } else {
      // Expansion/minor change: preserve camera and pan to new nodes
      diagram.scale = oldScale;
      diagram.position = oldPosition;

      if (addedNodeKeys.length > 0) {
        const newNodes = addedNodeKeys
          .map((key) => diagram.findNodeForKey(key))
          .filter((n): n is go.Node => n !== null);

        if (newNodes.length > 0) {
          const bounds = newNodes[0].actualBounds.copy();
          newNodes.slice(1).forEach((node) => {
            bounds.unionRect(node.actualBounds);
          });
          diagram.scrollToRect(bounds.inflate(40, 40));
        }
      }
    }
  }

  /**
   * Synchronize GoJS selection with Angular state
   */
  private syncSelection(
    diagram: go.Diagram,
    selectedNodeIds: Set<string>
  ): void {
    diagram.commit(() => {
      // Clear current selection
      diagram.clearSelection();

      // Select nodes that are in selectedNodeIds
      selectedNodeIds.forEach((nodeId) => {
        const node = diagram.findNodeForKey(nodeId);
        if (node) {
          node.isSelected = true;
        }
      });
    }, 'sync-selection');
  }

  /**
   * Cleanup diagram resources
   */
  dispose(): void {
    if (this.diagram) {
      this.diagram.div = null;
      this.diagram = null;
    }
    this.previousNodeKeys.clear();
    this.previousLinkKeys.clear();
  }
}
