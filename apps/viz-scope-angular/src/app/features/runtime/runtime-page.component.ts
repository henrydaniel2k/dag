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

import { Component, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphCanvasComponent } from './components/graph-canvas.component';
import { NavigationComponent } from './components/navigation.component';
import { QuickNodeTypeControlsComponent } from './components/quick-node-type-controls.component';
import { NodeTypePanelComponent } from './components/node-type-panel.component';
import { NodeDataPanelComponent } from './components/node-data-panel.component';
import {
  NodeContextMenuComponent,
  ContextMenuState,
  ContextMenuAction,
} from './components/node-context-menu.component';
import { FoldSelectedButtonComponent } from './components/fold-selected-button.component';
import { FloatingDockComponent } from './components/floating-dock.component';
import { MetricSelectorComponent } from './components/metric-selector.component';
import { ImmersiveToggleComponent } from './components/immersive-toggle.component';
import { ViewMenuComponent } from './components/view-menu.component';
import { RuntimeStateService } from '../../core/services/runtime-state.service';

@Component({
  selector: 'app-runtime-page',
  standalone: true,
  imports: [
    CommonModule,
    GraphCanvasComponent,
    NavigationComponent,
    QuickNodeTypeControlsComponent,
    NodeTypePanelComponent,
    NodeDataPanelComponent,
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
              <app-graph-canvas #graphCanvas></app-graph-canvas>

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
    />

    <!-- Context Menu -->
    <app-node-context-menu
      #contextMenu
      [menuState]="contextMenuState"
      [allScopeNodes]="runtimeState.allScopeNodes()"
      [hiddenBranchRoots]="runtimeState.hiddenBranchRoots()"
      [visibleIdsBeforeFold]="runtimeState.visibleIdsBeforeFold()"
      [canOpenBranch]="false"
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

  // Inject state service (public for template access)
  readonly runtimeState = inject(RuntimeStateService);

  // Panel state
  isNodeTypePanelOpen = signal(false);
  contextMenuState = signal<ContextMenuState | null>(null);

  constructor() {
    // Component initialization
    console.log('[RuntimePage] Initialized');
  }

  openNodeTypePanel(): void {
    this.isNodeTypePanelOpen.set(true);
  }

  onFoldSelected(): void {
    const selectedIds = Array.from(this.runtimeState.selectedNodeIds());
    if (selectedIds.length >= 2) {
      this.runtimeState.foldNodes(selectedIds);
    }
  }

  /**
   * Opens context menu at the given position
   * Called from GraphCanvas on right-click
   */
  openContextMenu(state: ContextMenuState): void {
    this.contextMenuState.set(state);
    // Trigger menu to open
    setTimeout(() => {
      this.contextMenu?.openMenu();
    }, 10);
  }

  /**
   * Handles context menu actions
   */
  onContextMenuAction(action: ContextMenuAction): void {
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
        // TODO: Implement branch panel
        console.log('[RuntimePage] Open branch panel:', action.nodeId);
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
}
