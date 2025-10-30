/**
 * Runtime Page Component
 * Main page for the runtime graph view
 *
 * This component orchestrates the entire runtime view including:
 * - Navigation sidebar
 * - Top toolbar (view selector, metric selector, theme toggle)
 * - GraphCanvas (main diagram)
 * - Side panels (node data, branch data, node type, node group)
 * - Dialogs (partial fold, partial expand)
 * - Context menu
 * - Floating controls (quick type controls, fold selected button, dock)
 */

import { Component, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { GraphCanvasComponent } from './components/graph-canvas.component';
import { NavigationComponent } from './components/navigation.component';
import { QuickNodeTypeControlsComponent } from './components/quick-node-type-controls.component';
import { NodeTypePanelComponent } from './components/node-type-panel.component';
import { NodeGroupPanelComponent } from './components/node-group-panel.component';
import { NodeDataPanelComponent } from './components/node-data-panel.component';
import { BranchDataPanelComponent } from './components/branch-data-panel.component';
import {
  NodeContextMenuComponent,
  ContextMenuAction,
} from './components/node-context-menu.component';
import { FoldSelectedButtonComponent } from './components/fold-selected-button.component';
import { FloatingDockComponent } from './components/floating-dock.component';
import { MetricSelectorComponent } from './components/metric-selector.component';
import { ImmersiveToggleComponent } from './components/immersive-toggle.component';
import { ViewMenuComponent } from './components/view-menu.component';
import {
  PartialExpandDialogComponent,
  PartialExpandDialogResult,
} from './dialogs/partial-expand-dialog.component';
import { RuntimeStateService } from '../../core/services/runtime-state.service';
import { NodeType } from '../../models';

@Component({
  selector: 'app-runtime-page',
  standalone: true,
  imports: [
    CommonModule,
    GraphCanvasComponent,
    NavigationComponent,
    QuickNodeTypeControlsComponent,
    NodeTypePanelComponent,
    NodeGroupPanelComponent,
    NodeDataPanelComponent,
    BranchDataPanelComponent,
    NodeContextMenuComponent,
    FoldSelectedButtonComponent,
    FloatingDockComponent,
    MetricSelectorComponent,
    ImmersiveToggleComponent,
    ViewMenuComponent,
  ],
  template: `
    <div class="flex h-screen bg-background">
      <!-- Navigation Sidebar -->
      <app-navigation></app-navigation>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col">
        <!-- Top Toolbar -->
        <div class="flex items-center justify-between border-b border-border">
          <div class="flex items-center">
            <app-view-menu
              [currentView]="runtimeState.currentView()"
              (viewChange)="runtimeState.setCurrentView($event)"
            />
            <app-immersive-toggle
              [immersiveMode]="runtimeState.immersiveMode()"
              (toggle)="runtimeState.setImmersiveMode($event)"
            />
          </div>
        </div>

        <!-- Metric Selector (below toolbar) -->
        <app-metric-selector
          [selectedMetric]="runtimeState.overlayMetric()"
          [selectedWindow]="runtimeState.timeWindow()"
          [availableVariables]="runtimeState.availableVariables()"
          (metricChange)="runtimeState.setOverlayMetric($event)"
          (windowChange)="runtimeState.setTimeWindow($event)"
        />

        <!-- Graph View -->
        <div
          class="flex-1 flex overflow-hidden"
          *ngIf="runtimeState.currentView() === 'Graph View'"
        >
          <!-- Quick Controls -->
          <div class="flex-1 flex flex-col">
            <app-quick-node-type-controls
              (openPanel)="openNodeTypePanel()"
            ></app-quick-node-type-controls>

            <!-- GraphCanvas -->
            <div class="flex-1 overflow-hidden relative">
              <app-graph-canvas
                #graphCanvas
                (metaNodeClicked)="openPartialExpandDialog()"
              ></app-graph-canvas>

              <!-- Floating Dock -->
              <app-floating-dock
                [diagram]="graphCanvas?.getDiagram() || null"
              />

              <!-- Fold Selected Button -->
              <app-fold-selected-button
                [selectedCount]="runtimeState.selectedNodeIds().size"
                (foldSelected)="onFoldSelected()"
              />
            </div>
          </div>

          <!-- Node Data Panel -->
          @if (runtimeState.selectedNode()) {
          <app-node-data-panel />
          } @else if (branchRootNode()) {
          <app-branch-data-panel
            [branchRootId]="branchRootNode()"
            (panelClose)="branchRootNode.set(null)"
          />
          }
        </div>

        <!-- Other Views (TODO) -->
        <div
          class="flex-1 flex items-center justify-center"
          *ngIf="runtimeState.currentView() !== 'Graph View'"
        >
          <div class="text-center">
            <h2 class="text-2xl font-semibold mb-2">
              {{ runtimeState.currentView() }}
            </h2>
            <p class="text-muted-foreground">Coming soon</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Node Type Panel -->
    <app-node-type-panel
      [isOpen]="isNodeTypePanelOpen()"
      (openChange)="isNodeTypePanelOpen.set($event)"
      (openNodeGroup)="openNodeGroupPanel($event)"
    />

    <!-- Node Group Panel -->
    <app-node-group-panel
      [isOpen]="isNodeGroupPanelOpen()"
      [nodeType]="selectedGroupType()"
      [nodes]="nodesOfSelectedType()"
      [foldedNodeIds]="runtimeState.foldedNodeIds()"
      [hiddenBranchRoots]="runtimeState.hiddenBranchRoots()"
      [visibleIdsBeforeFold]="runtimeState.visibleIdsBeforeFold()"
      (openChange)="isNodeGroupPanelOpen.set($event)"
      (foldNodes)="onBulkFoldNodes($event)"
      (unfoldNodes)="onBulkUnfoldNodes($event)"
      (hideBranch)="onBulkHideBranch($event)"
      (unhideBranch)="onBulkUnhideBranch($event)"
    />

    <!-- Context Menu -->
    <app-node-context-menu
      #contextMenu
      [menuState]="runtimeState.contextMenuForComponent()"
      [allScopeNodes]="runtimeState.allScopeNodes()"
      [hiddenBranchRoots]="runtimeState.hiddenBranchRoots()"
      [visibleIdsBeforeFold]="runtimeState.visibleIdsBeforeFold()"
      (action)="onContextMenuAction($event)"
    />
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class RuntimePageComponent {
  @ViewChild(GraphCanvasComponent) graphCanvas?: GraphCanvasComponent;
  @ViewChild('contextMenu') contextMenu?: NodeContextMenuComponent;

  // Inject services (public for template access)
  readonly runtimeState = inject(RuntimeStateService);
  private readonly dialog = inject(MatDialog);

  // Panel state
  isNodeTypePanelOpen = signal(false);
  isNodeGroupPanelOpen = signal(false);
  selectedGroupType = signal<NodeType | null>(null);
  branchRootNode = signal<string | null>(null);

  // Nodes of selected type for group panel
  readonly nodesOfSelectedType = computed(() => {
    const type = this.selectedGroupType();
    if (!type) return [];

    const topology = this.runtimeState.topology();
    if (!topology) return [];

    return Array.from(topology.nodes.values()).filter((n) => n.type === type);
  });

  constructor() {
    // Component initialization
    console.log('[RuntimePage] Initialized');

    // Auto-select first MSN when topology loads
    this.autoSelectDefaultMsn();
  }

  /**
   * Auto-select the first available MSN (root node) in the current topology
   */
  private autoSelectDefaultMsn(): void {
    // Wait a bit for topology to load
    setTimeout(() => {
      const topology = this.runtimeState.topology();
      if (
        topology &&
        topology.nodes.size > 0 &&
        !this.runtimeState.selectedMsn()
      ) {
        // Find first root node (node with no parents)
        const rootNode = Array.from(topology.nodes.values()).find(
          (node) => node.parents.length === 0
        );

        if (rootNode) {
          console.log('[RuntimePage] Auto-selecting MSN:', rootNode.id);
          this.runtimeState.setSelectedMsn(rootNode.id);
        }
      }
    }, 500);
  }

  openNodeTypePanel(): void {
    this.isNodeTypePanelOpen.set(true);
  }

  openNodeGroupPanel(type: NodeType): void {
    console.log('[RuntimePage] Opening node group panel for type:', type);

    // Close NodeTypePanel first to avoid overlay
    this.isNodeTypePanelOpen.set(false);

    this.selectedGroupType.set(type);
    this.isNodeGroupPanelOpen.set(true);
    console.log('[RuntimePage] Panel state set:', {
      isOpen: this.isNodeGroupPanelOpen(),
      selectedType: this.selectedGroupType(),
      nodesCount: this.nodesOfSelectedType().length,
    });
  }

  onFoldSelected(): void {
    const selectedIds = Array.from(this.runtimeState.selectedNodeIds());
    if (selectedIds.length >= 2) {
      this.runtimeState.foldNodes(selectedIds);
    }
  }

  /**
   * Handles context menu actions
   */
  onContextMenuAction(action: ContextMenuAction): void {
    // Close context menu first to reset state
    this.runtimeState.closeContextMenu();

    switch (action.type) {
      case 'open-data-panel':
        if (action.nodeId) {
          this.runtimeState.setSelectedNode(action.nodeId);
        }
        break;

      case 'set-msn':
        if (action.nodeId) {
          this.runtimeState.setSelectedMsn(action.nodeId);
        }
        break;

      case 'fold-node':
        if (action.nodeId) {
          this.runtimeState.foldNodes([action.nodeId]);
        }
        break;

      case 'open-branch-panel':
        if (action.nodeId) {
          // Close selected node panel and open branch panel instead
          this.runtimeState.setSelectedNode(null);
          this.branchRootNode.set(action.nodeId);
        }
        break;

      case 'open-node-type-panel':
        this.openNodeTypePanel();
        break;

      case 'hide-branch':
        if (action.nodeId) {
          this.runtimeState.hideBranch(action.nodeId);
        }
        break;

      case 'unhide-branch':
        if (action.nodeId) {
          this.runtimeState.unhideBranch(action.nodeId);
        }
        break;
    }
  }

  /**
   * Bulk operations from Node Group Panel
   */
  onBulkFoldNodes(nodeIds: string[]): void {
    this.runtimeState.foldNodes(nodeIds);
  }

  onBulkUnfoldNodes(nodeIds: string[]): void {
    this.runtimeState.unfoldNodes(nodeIds);
  }

  onBulkHideBranch(nodeIds: string[]): void {
    nodeIds.forEach((id) => this.runtimeState.hideBranch(id));
  }

  onBulkUnhideBranch(nodeIds: string[]): void {
    nodeIds.forEach((id) => this.runtimeState.unhideBranch(id));
  }

  /**
   * Opens the partial expand dialog for a meta-node
   * Called when user clicks on a meta-node in the graph
   */
  openPartialExpandDialog(): void {
    const metaNode = this.runtimeState.expandDialogMetaNode();
    if (!metaNode) return;

    const topology = this.runtimeState.topology();
    if (!topology) return;

    const dialogRef = this.dialog.open<
      PartialExpandDialogComponent,
      unknown,
      PartialExpandDialogResult
    >(PartialExpandDialogComponent, {
      data: {
        metaNode,
        getNodeName: (nodeId: string) => {
          const node = topology.nodes.get(nodeId);
          return node ? node.name : nodeId;
        },
      },
      width: '500px',
      maxHeight: '80vh',
    });

    dialogRef
      .afterClosed()
      .subscribe((result: PartialExpandDialogResult | undefined) => {
        if (result && result.nodeIds.length > 0) {
          this.runtimeState.unfoldNodes(result.nodeIds);
        }
      });
  }
}
