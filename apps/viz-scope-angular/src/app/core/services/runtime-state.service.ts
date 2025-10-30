/**
 * Runtime State Service
 * Central state management for the runtime view using Angular Signals
 *
 * This service manages all application state including:
 * - Topology selection (MANTO)
 * - MSN (Most Significant Node) selection
 * - Node visibility (hidden types, folded nodes, hidden branches)
 * - Metric overlay and time window
 * - UI state (panels, immersive mode)
 * - Selected nodes for interaction
 *
 * All state is exposed as readonly signals with controlled update methods.
 */

import { Injectable, signal, computed, effect, inject } from '@angular/core';
import {
  TopologyType,
  NodeType,
  Variable,
  TimeWindow,
  MetaNode,
  Node,
  Link,
  Topology,
} from '../../models';
import {
  isTimeWindowValidForSIT,
  getMinimumTimeWindow,
} from '../../models/time-window.model';
import { ScopeService, ScopeResult } from './scope.service';
import { FoldingService } from './folding.service';
import { HopsService } from './hops.service';
import { TopologyService } from './topology.service';

/**
 * View mode type
 */
export type ViewMode =
  | 'Physical View'
  | 'Graph View'
  | 'Data Reports'
  | 'Alerts'
  | 'Data Inputs';

@Injectable({
  providedIn: 'root',
})
export class RuntimeStateService {
  //
  // === CORE STATE SIGNALS ===
  //

  /**
   * Selected topology type (MANTO)
   */
  private readonly _selectedManto = signal<TopologyType>('Electrical');

  /**
   * Selected Most Significant Node (MSN)
   */
  private readonly _selectedMsn = signal<string | null>('ats-1');

  /**
   * Hidden node types (filtered from view)
   */
  private readonly _hiddenTypes = signal<NodeType[]>([]);

  /**
   * Locked node type (cannot be hidden, typically MSN type)
   */
  private readonly _lockedType = signal<NodeType | null>(null);

  /**
   * Folded node IDs (grouped into meta-nodes)
   */
  private readonly _foldedNodeIds = signal<Set<string>>(new Set());

  /**
   * Overlay metric for node display
   */
  private readonly _overlayMetric = signal<Variable | null>(null);

  /**
   * Time window for metric data
   */
  private readonly _timeWindow = signal<TimeWindow>('Latest');

  /**
   * Immersive mode (hide UI chrome)
   */
  private readonly _immersiveMode = signal<boolean>(false);

  /**
   * Selected node for data panel
   */
  private readonly _selectedNode = signal<string | null>(null);

  /**
   * Branch root node for branch panel
   */
  private readonly _branchRootNode = signal<string | null>(null);

  /**
   * Current view mode
   */
  private readonly _currentView = signal<ViewMode>('Graph View');

  /**
   * Selected node IDs (for multi-select)
   */
  private readonly _selectedNodeIds = signal<Set<string>>(new Set());

  /**
   * Meta-node for expand dialog
   */
  private readonly _expandDialogMetaNode = signal<MetaNode | null>(null);

  /**
   * Node type panel open state
   */
  private readonly _nodeTypePanelOpen = signal<boolean>(false);

  /**
   * Node group panel open state
   */
  private readonly _nodeGroupPanelOpen = signal<boolean>(false);

  /**
   * Selected group type for node group panel
   */
  private readonly _selectedGroupType = signal<NodeType | null>(null);

  /**
   * Partial fold dialog open state
   */
  private readonly _partialFoldDialogOpen = signal<boolean>(false);

  /**
   * Partial fold type for dialog
   */
  private readonly _partialFoldType = signal<NodeType | null>(null);

  /**
   * Auto-folded types (types with >10 nodes)
   */
  private readonly _autoFoldedTypes = signal<Set<NodeType>>(new Set());

  /**
   * Hidden branch root node IDs
   */
  private readonly _hiddenBranchRoots = signal<Set<string>>(new Set());

  /**
   * Context menu state
   */
  private readonly _contextMenuState = signal<{
    isOpen: boolean;
    x: number;
    y: number;
    nodeId?: string;
    canOpenBranch: boolean;
  } | null>(null);

  //
  // === READONLY COMPUTED SIGNALS ===
  //

  /**
   * Current topology based on selected MANTO
   */
  readonly topology = computed<Topology>(() => {
    const manto = this._selectedManto();
    return (
      this.topologyService.getTopology()(manto) || {
        type: manto,
        nodes: new Map(),
        links: [],
      }
    );
  });

  /**
   * Computed scope based on MSN and topology
   */
  readonly scope = computed<ScopeResult | null>(() => {
    const msn = this._selectedMsn();
    const topo = this.topology();

    if (!msn || !topo.nodes.has(msn)) return null;

    return this.scopeService.computeScope(msn, topo);
  });

  /**
   * Upstream node IDs
   */
  readonly upstream = computed<string[]>(() => {
    const s = this.scope();
    return s ? Array.from(s.upstream) : [];
  });

  /**
   * Downstream node IDs
   */
  readonly downstream = computed<string[]>(() => {
    const s = this.scope();
    return s ? Array.from(s.downstream) : [];
  });

  /**
   * Scope types ordered as Upstream → MSN → Downstream
   */
  readonly scopeTypes = computed<NodeType[]>(() => {
    const s = this.scope();
    const msn = this._selectedMsn();
    const topo = this.topology();

    if (!s || !msn) return [];

    const msnNode = topo.nodes.get(msn);
    if (!msnNode) return [];

    const msnType = msnNode.type;
    const up = this.upstream();
    const down = this.downstream();

    // Get unique upstream types (excluding MSN type)
    const upstreamTypes = Array.from(
      new Set(
        up
          .map((id) => topo.nodes.get(id)?.type)
          .filter((t): t is NodeType => t !== undefined && t !== msnType)
      )
    ).sort((a, b) => this.compareTypes(a, b));

    // Get unique downstream types (excluding MSN type and upstream types)
    const upstreamTypeSet = new Set(upstreamTypes);
    const downstreamTypes = Array.from(
      new Set(
        down
          .map((id) => topo.nodes.get(id)?.type)
          .filter(
            (t): t is NodeType =>
              t !== undefined && t !== msnType && !upstreamTypeSet.has(t)
          )
      )
    ).sort((a, b) => this.compareTypes(a, b));

    return [...upstreamTypes, msnType, ...downstreamTypes];
  });

  /**
   * Parent-only types (appear in upstream but not downstream)
   */
  readonly parentOnlyTypes = computed<Set<NodeType>>(() => {
    const s = this.scope();
    const msn = this._selectedMsn();
    const topo = this.topology();

    if (!s || !msn) return new Set();

    const msnNode = topo.nodes.get(msn);
    if (!msnNode) return new Set();

    const up = this.upstream();
    const down = this.downstream();

    const upstreamTypes = new Set<NodeType>(
      up.map((id) => topo.nodes.get(id)?.type).filter((t): t is NodeType => !!t)
    );
    const downstreamTypes = new Set<NodeType>(
      down
        .map((id) => topo.nodes.get(id)?.type)
        .filter((t): t is NodeType => !!t)
    );

    return new Set(
      Array.from(upstreamTypes).filter(
        (t) => !downstreamTypes.has(t) && t !== msnNode.type
      )
    );
  });

  /**
   * All nodes in the current scope (regardless of visibility)
   */
  readonly allScopeNodes = computed<Node[]>(() => {
    const s = this.scope();
    const topo = this.topology();

    if (!s) return [];

    return Array.from(s.nodes)
      .map((id) => topo.nodes.get(id))
      .filter((n): n is Node => !!n);
  });

  /**
   * Visible IDs before folding (after applying hiddenTypes filter)
   */
  readonly visibleIdsBeforeFold = computed<Set<string>>(() => {
    const s = this.scope();
    const hidden = new Set(this._hiddenTypes());
    const topo = this.topology();

    if (!s) return new Set();

    return new Set(
      Array.from(s.nodes).filter((id) => {
        const node = topo.nodes.get(id);
        return node && !hidden.has(node.type);
      })
    );
  });

  /**
   * Visible IDs after branch hiding (multi-parent logic)
   */
  readonly visibleIdsAfterBranchHide = computed<Set<string>>(() => {
    const before = this.visibleIdsBeforeFold();
    const hiddenRoots = this._hiddenBranchRoots();
    const topo = this.topology();

    if (hiddenRoots.size === 0) return before;

    const hiddenNodes = new Set<string>();

    // For each hidden branch root, compute all descendants
    hiddenRoots.forEach((rootId) => {
      if (!before.has(rootId)) return; // Root not visible by type filter

      const branch = this.scopeService.getBranchNodes(rootId, topo);
      branch.forEach((nodeId: string) => {
        if (before.has(nodeId)) {
          hiddenNodes.add(nodeId);
        }
      });
    });

    // Multi-parent logic: only hide if ALL visible upstream paths are hidden
    const hiddenRootIds = new Set(hiddenRoots);
    const finalHidden = new Set<string>();

    hiddenNodes.forEach((nodeId) => {
      // Always hide the root itself
      if (hiddenRootIds.has(nodeId)) {
        finalHidden.add(nodeId);
        return;
      }

      const node = topo.nodes.get(nodeId);
      if (!node) return;

      // Check if at least one visible parent is NOT in hiddenNodes
      const hasVisibleParent = node.parents.some(
        (parentId: string) => before.has(parentId) && !hiddenNodes.has(parentId)
      );

      if (!hasVisibleParent) {
        finalHidden.add(nodeId);
      }
    });

    return new Set(Array.from(before).filter((id) => !finalHidden.has(id)));
  });

  /**
   * Visible nodes (Node objects)
   */
  readonly visibleNodes = computed<Node[]>(() => {
    const ids = this.visibleIdsAfterBranchHide();
    const topo = this.topology();

    return Array.from(ids)
      .map((id) => topo.nodes.get(id))
      .filter((n): n is Node => !!n);
  });

  /**
   * Meta-nodes (folded nodes grouped by type)
   */
  readonly metaNodes = computed<MetaNode[]>(() => {
    const visible = this.visibleNodes();
    const folded = this._foldedNodeIds();

    const foldedNodesByType = new Map<NodeType, Node[]>();

    for (const node of visible) {
      if (folded.has(node.id)) {
        if (!foldedNodesByType.has(node.type)) {
          foldedNodesByType.set(node.type, []);
        }
        const typeNodes = foldedNodesByType.get(node.type);
        if (typeNodes) {
          typeNodes.push(node);
        }
      }
    }

    const metaNodes: MetaNode[] = [];
    for (const [type, nodes] of foldedNodesByType.entries()) {
      if (nodes.length > 0) {
        const metaNode = this.foldingService.foldNodeType(type, nodes);
        metaNodes.push(metaNode);
      }
    }

    return metaNodes;
  });

  /**
   * Unfolded nodes (visible but not folded)
   */
  readonly unfoldedNodes = computed<Node[]>(() => {
    const visible = this.visibleNodes();
    const folded = this._foldedNodeIds();

    return visible.filter((node) => !folded.has(node.id));
  });

  /**
   * Hop links (through hidden nodes)
   */
  readonly hopLinks = computed<Link[]>(() => {
    const s = this.scope();
    const topo = this.topology();
    const visible = this.visibleIdsBeforeFold();
    const hidden = new Set(this._hiddenTypes());

    if (!s) return [];

    return this.hopsService.computeHops(topo, visible, hidden);
  });

  /**
   * Direct links (between unfolded nodes)
   */
  readonly directLinks = computed<Link[]>(() => {
    const unfolded = this.unfoldedNodes();
    const topo = this.topology();

    return topo.links.filter(
      (link: Link) =>
        unfolded.some((n) => n.id === link.source) &&
        unfolded.some((n) => n.id === link.target)
    );
  });

  /**
   * All links (direct + hop + meta links, merged)
   */
  readonly allLinks = computed<Link[]>(() => {
    const direct = this.directLinks();
    const hop = this.hopLinks();
    const meta = this.metaLinks();

    // Merge and deduplicate
    return this.foldingService.mergeParallelConnectors([
      ...direct,
      ...meta,
      ...hop,
    ]);
  });

  /**
   * Meta links (to/from meta-nodes)
   */
  private readonly metaLinks = computed<Link[]>(() => {
    const metaNodes = this.metaNodes();
    const unfolded = this.unfoldedNodes();
    const topo = this.topology();

    return metaNodes.flatMap((metaNode) => {
      const links: Link[] = [];

      for (const link of topo.links) {
        const sourceInMeta = metaNode.nodeIds.includes(link.source);
        const targetInMeta = metaNode.nodeIds.includes(link.target);

        if (sourceInMeta && !targetInMeta) {
          // Link from meta-node to external node
          const targetNode = unfolded.find((n) => n.id === link.target);
          const targetMetaNode = metaNodes.find((m) =>
            m.nodeIds.includes(link.target)
          );

          if (targetNode || targetMetaNode) {
            links.push({
              ...link,
              source: metaNode.id,
              target: targetMetaNode ? targetMetaNode.id : link.target,
            });
          }
        } else if (!sourceInMeta && targetInMeta) {
          // Link from external node to meta-node
          const sourceNode = unfolded.find((n) => n.id === link.source);
          const sourceMetaNode = metaNodes.find((m) =>
            m.nodeIds.includes(link.source)
          );

          if (sourceNode || sourceMetaNode) {
            links.push({
              ...link,
              source: sourceMetaNode ? sourceMetaNode.id : link.source,
              target: metaNode.id,
            });
          }
        }
        // Skip internal links (both in same meta-node)
      }

      return links;
    });
  });

  /**
   * Has non-default settings (for indicator)
   */
  readonly hasNonDefaultSettings = computed<boolean>(() => {
    return (
      this._hiddenTypes().length > 0 ||
      this._foldedNodeIds().size > 0 ||
      this._hiddenBranchRoots().size > 0
    );
  });

  //
  // === PUBLIC READONLY ACCESSORS ===
  //

  readonly selectedManto = this._selectedManto.asReadonly();
  readonly selectedMsn = this._selectedMsn.asReadonly();
  readonly hiddenTypes = this._hiddenTypes.asReadonly();
  readonly lockedType = this._lockedType.asReadonly();
  readonly foldedNodeIds = this._foldedNodeIds.asReadonly();
  readonly overlayMetric = this._overlayMetric.asReadonly();
  readonly timeWindow = this._timeWindow.asReadonly();
  readonly immersiveMode = this._immersiveMode.asReadonly();
  readonly selectedNode = this._selectedNode.asReadonly();
  readonly branchRootNode = this._branchRootNode.asReadonly();
  readonly currentView = this._currentView.asReadonly();
  readonly selectedNodeIds = this._selectedNodeIds.asReadonly();
  readonly expandDialogMetaNode = this._expandDialogMetaNode.asReadonly();
  readonly nodeTypePanelOpen = this._nodeTypePanelOpen.asReadonly();
  readonly nodeGroupPanelOpen = this._nodeGroupPanelOpen.asReadonly();
  readonly selectedGroupType = this._selectedGroupType.asReadonly();
  readonly partialFoldDialogOpen = this._partialFoldDialogOpen.asReadonly();
  readonly partialFoldType = this._partialFoldType.asReadonly();
  readonly autoFoldedTypes = this._autoFoldedTypes.asReadonly();
  readonly hiddenBranchRoots = this._hiddenBranchRoots.asReadonly();
  readonly contextMenuState = this._contextMenuState.asReadonly();

  private readonly scopeService = inject(ScopeService);
  private readonly foldingService = inject(FoldingService);
  private readonly hopsService = inject(HopsService);
  private readonly topologyService = inject(TopologyService);

  // Available variables for metric overlay (loaded from mock data)
  readonly availableVariables = signal<Variable[]>([]);

  constructor() {
    this.setupEffects();
    this.loadAvailableVariables();
  }

  /**
   * Load available variables from mock data
   */
  private async loadAvailableVariables(): Promise<void> {
    try {
      const { availableVariables } = await import(
        '../../../assets/mocks/topologies'
      );
      this.availableVariables.set(availableVariables);
      console.log('✅ Available variables loaded:', availableVariables.length);
    } catch (err) {
      console.error('Failed to load available variables:', err);
    }
  }

  //
  // === EFFECTS ===
  //

  /**
   * Setup reactive effects for state management
   */
  private setupEffects(): void {
    // When MANTO changes, reset MSN to valid node in new topology
    effect(() => {
      const msn = this._selectedMsn();
      const topo = this.topology();

      if (msn && !topo.nodes.has(msn)) {
        // Find first root node
        const rootNode = Array.from(topo.nodes.values()).find(
          (node: Node) => node.parents.length === 0
        ) as Node | undefined;
        this._selectedMsn.set(rootNode?.id || null);
        this._selectedNode.set(null);
      }
    });

    // Sync MSN selection to selectedNodeIds
    effect(() => {
      const msn = this._selectedMsn();
      if (msn) {
        this._selectedNodeIds.set(new Set([msn]));
      }
    });

    // Set defaults when MSN or MANTO changes
    effect(() => {
      const msn = this._selectedMsn();
      const s = this.scope();
      const topo = this.topology();

      if (!msn || !s) return;

      const msnNode = topo.nodes.get(msn);
      if (!msnNode) return;

      const up = this.upstream();
      const down = this.downstream();

      const upstreamTypes = new Set<NodeType>(
        up
          .map((id) => topo.nodes.get(id)?.type)
          .filter((t): t is NodeType => !!t)
      );
      const downstreamTypes = new Set<NodeType>(
        down
          .map((id) => topo.nodes.get(id)?.type)
          .filter((t): t is NodeType => !!t)
      );

      // Parent-only types
      const parentOnly = Array.from(upstreamTypes).filter(
        (t) => !downstreamTypes.has(t) && t !== msnNode.type
      );

      this._hiddenTypes.set(parentOnly);
      this._lockedType.set(msnNode.type);

      // Auto-fold >10 nodes of same type
      const scopeNodeIds = Array.from(s.nodes);
      const scopeNodes = scopeNodeIds
        .map((id) => topo.nodes.get(id))
        .filter((n): n is Node => !!n);
      const autoFoldNodeIds = this.foldingService.getAutoFoldNodeIds(
        scopeNodes,
        10
      );
      this._foldedNodeIds.set(autoFoldNodeIds);

      // Track auto-folded types
      const typeCounts = new Map<NodeType, number>();
      scopeNodes.forEach((node) => {
        typeCounts.set(node.type, (typeCounts.get(node.type) || 0) + 1);
      });
      const autoTypes = new Set<NodeType>();
      typeCounts.forEach((count, type) => {
        if (count > 10) autoTypes.add(type);
      });
      this._autoFoldedTypes.set(autoTypes);
    });

    // Auto-bump time window when metric or MSN changes
    effect(() => {
      const metric = this._overlayMetric();
      const msn = this._selectedMsn();
      const topo = this.topology();
      const window = this._timeWindow();

      if (!metric || !msn) return;

      const msnNode = topo.nodes.get(msn);
      if (!msnNode) return;

      // Get SIT (Sample Interval Time) from metric variable
      const sit = metric.sit || 0;

      if (!isTimeWindowValidForSIT(window, sit)) {
        const minWindow = getMinimumTimeWindow(sit);
        this._timeWindow.set(minWindow);
        // TODO: Show toast notification
        console.log(`Time window adjusted to ${minWindow}`);
      }
    });
  }

  //
  // === UPDATE METHODS ===
  //

  setSelectedManto(manto: TopologyType): void {
    this._selectedManto.set(manto);
  }

  setSelectedMsn(msn: string | null): void {
    this._selectedMsn.set(msn);
  }

  toggleHiddenType(type: NodeType): void {
    const current = this._hiddenTypes();
    if (current.includes(type)) {
      this._hiddenTypes.set(current.filter((t) => t !== type));
    } else {
      this._hiddenTypes.set([...current, type]);
    }
  }

  setHiddenTypes(types: NodeType[]): void {
    this._hiddenTypes.set(types);
  }

  toggleFoldNode(nodeId: string): void {
    const current = new Set(this._foldedNodeIds());
    if (current.has(nodeId)) {
      current.delete(nodeId);
    } else {
      current.add(nodeId);
    }
    this._foldedNodeIds.set(current);
  }

  foldNodes(nodeIds: string[]): void {
    const current = new Set(this._foldedNodeIds());
    nodeIds.forEach((id) => current.add(id));
    this._foldedNodeIds.set(current);
  }

  unfoldNodes(nodeIds: string[]): void {
    const current = new Set(this._foldedNodeIds());
    nodeIds.forEach((id) => current.delete(id));
    this._foldedNodeIds.set(current);
  }

  foldAllOfType(type: NodeType): void {
    const visible = this.visibleNodes();
    const typeNodeIds = visible.filter((n) => n.type === type).map((n) => n.id);
    this.foldNodes(typeNodeIds);
    this.removeAutoFoldedType(type);
  }

  unfoldAllOfType(type: NodeType): void {
    const visible = this.visibleNodes();
    const typeNodeIds = visible.filter((n) => n.type === type).map((n) => n.id);
    this.unfoldNodes(typeNodeIds);
    this.removeAutoFoldedType(type);
  }

  setOverlayMetric(metric: Variable | null): void {
    this._overlayMetric.set(metric);
  }

  setTimeWindow(window: TimeWindow): void {
    this._timeWindow.set(window);
  }

  toggleImmersiveMode(): void {
    this._immersiveMode.set(!this._immersiveMode());
  }

  setImmersiveMode(value: boolean): void {
    this._immersiveMode.set(value);
  }

  setSelectedNode(nodeId: string | null): void {
    this._selectedNode.set(nodeId);
  }

  setBranchRootNode(nodeId: string | null): void {
    this._branchRootNode.set(nodeId);
  }

  setCurrentView(view: ViewMode): void {
    this._currentView.set(view);
  }

  handleNodeClick(nodeId: string, isMultiSelect = false): void {
    if (isMultiSelect) {
      const current = new Set(this._selectedNodeIds());
      if (current.has(nodeId)) {
        current.delete(nodeId);
      } else {
        current.add(nodeId);
      }
      this._selectedNodeIds.set(current);
    } else {
      this._selectedNodeIds.set(new Set([nodeId]));
      this._selectedNode.set(nodeId);
    }
  }

  setExpandDialogMetaNode(metaNode: MetaNode | null): void {
    this._expandDialogMetaNode.set(metaNode);
  }

  setNodeTypePanelOpen(open: boolean): void {
    this._nodeTypePanelOpen.set(open);
  }

  setNodeGroupPanelOpen(open: boolean): void {
    this._nodeGroupPanelOpen.set(open);
  }

  setSelectedGroupType(type: NodeType | null): void {
    this._selectedGroupType.set(type);
  }

  setPartialFoldDialogOpen(open: boolean): void {
    this._partialFoldDialogOpen.set(open);
  }

  setPartialFoldType(type: NodeType | null): void {
    this._partialFoldType.set(type);
  }

  removeAutoFoldedType(type: NodeType): void {
    const current = new Set(this._autoFoldedTypes());
    current.delete(type);
    this._autoFoldedTypes.set(current);
  }

  hideBranch(nodeId: string): void {
    const current = new Set(this._hiddenBranchRoots());
    current.add(nodeId);
    this._hiddenBranchRoots.set(current);
  }

  unhideBranch(nodeId: string): void {
    const current = new Set(this._hiddenBranchRoots());
    current.delete(nodeId);
    this._hiddenBranchRoots.set(current);
  }

  bulkHideBranches(nodeIds: string[]): void {
    const current = new Set(this._hiddenBranchRoots());
    nodeIds.forEach((id) => current.add(id));
    this._hiddenBranchRoots.set(current);
  }

  bulkUnhideBranches(nodeIds: string[]): void {
    const current = new Set(this._hiddenBranchRoots());
    nodeIds.forEach((id) => current.delete(id));
    this._hiddenBranchRoots.set(current);
  }

  setContextMenuState(
    state: {
      isOpen: boolean;
      x: number;
      y: number;
      nodeId?: string;
      canOpenBranch: boolean;
    } | null
  ): void {
    this._contextMenuState.set(state);
  }

  closeContextMenu(): void {
    this._contextMenuState.set(null);
  }

  foldSelected(): void {
    const selected = this._selectedNodeIds();
    if (selected.size < 2) return;

    this.foldNodes(Array.from(selected));
    this._selectedNodeIds.set(new Set());
  }

  resetToDefaults(): void {
    const msn = this._selectedMsn();
    const s = this.scope();
    const topo = this.topology();

    if (!msn || !s) return;

    const msnNode = topo.nodes.get(msn);
    if (!msnNode) return;

    const up = this.upstream();
    const down = this.downstream();

    const upstreamTypes = new Set<NodeType>(
      up.map((id) => topo.nodes.get(id)?.type).filter((t): t is NodeType => !!t)
    );
    const downstreamTypes = new Set<NodeType>(
      down
        .map((id) => topo.nodes.get(id)?.type)
        .filter((t): t is NodeType => !!t)
    );

    const parentOnly = Array.from(upstreamTypes).filter(
      (t) => !downstreamTypes.has(t) && t !== msnNode.type
    );

    this._hiddenTypes.set(parentOnly);
    this._lockedType.set(msnNode.type);

    const scopeNodeIds = Array.from(s.nodes);
    const scopeNodes = scopeNodeIds
      .map((id) => topo.nodes.get(id))
      .filter((n): n is Node => !!n);
    const autoFoldNodeIds = this.foldingService.getAutoFoldNodeIds(
      scopeNodes,
      10
    );
    this._foldedNodeIds.set(autoFoldNodeIds);

    // Clear hidden branches
    this._hiddenBranchRoots.set(new Set());

    // TODO: Show toast notification
    console.log('Reset to scope defaults');
  }

  /**
   * Get type node count (for UI display)
   */
  getTypeNodeCount(type: NodeType): {
    total: number;
    folded: number;
    unfolded: number;
    visible: number;
    hiddenBranch: number;
  } {
    const s = this.scope();
    const topo = this.topology();
    const hidden = this._hiddenTypes();
    const folded = this._foldedNodeIds();
    const before = this.visibleIdsBeforeFold();
    const after = this.visibleIdsAfterBranchHide();

    if (!s)
      return { total: 0, folded: 0, unfolded: 0, visible: 0, hiddenBranch: 0 };

    // Total in scope
    const scopeNodesOfType = Array.from(s.nodes)
      .map((id) => topo.nodes.get(id))
      .filter((n): n is Node => n?.type === type);

    const totalInScope = scopeNodesOfType.length;

    // Is hidden by type filter
    const isHidden = hidden.includes(type);

    // Hidden by branch
    const hiddenByBranch = scopeNodesOfType.filter(
      (n) => !after.has(n.id) && before.has(n.id)
    ).length;

    // Visible nodes of type
    const visibleNodesOfType = isHidden
      ? []
      : scopeNodesOfType.filter((n) => after.has(n.id));

    const foldedCount = visibleNodesOfType.filter((n) =>
      folded.has(n.id)
    ).length;
    const unfoldedCount = visibleNodesOfType.length - foldedCount;
    const visibleCount = unfoldedCount;

    return {
      total: totalInScope,
      folded: foldedCount,
      unfolded: unfoldedCount,
      visible: visibleCount,
      hiddenBranch: hiddenByBranch,
    };
  }

  /**
   * Compare node types by order
   */
  private compareTypes(a: NodeType, b: NodeType): number {
    const order: NodeType[] = [
      'Organization',
      'ES',
      'Switch Gear',
      'ATS',
      'UPS',
      'PDU',
      'Rack PDU',
      'Server',
      'Chiller',
      'CRAC',
    ];
    return order.indexOf(a) - order.indexOf(b);
  }
}
