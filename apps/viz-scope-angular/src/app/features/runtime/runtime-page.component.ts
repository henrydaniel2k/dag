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

import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphCanvasComponent } from './components/graph-canvas.component';
import { NavigationComponent } from './components/navigation.component';
import { QuickNodeTypeControlsComponent } from './components/quick-node-type-controls.component';
import { RuntimeStateService } from '../../core/services/runtime-state.service';

@Component({
  selector: 'app-runtime-page',
  standalone: true,
  imports: [
    CommonModule,
    GraphCanvasComponent,
    NavigationComponent,
    QuickNodeTypeControlsComponent,
  ],
  template: `
    <div class="flex h-screen bg-background">
      <!-- Navigation Sidebar -->
      <app-navigation></app-navigation>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col">
        <!-- Top Toolbar (TODO: Task 8) -->
        <div
          class="flex items-center justify-between border-b border-border px-4 py-2"
        >
          <div class="flex items-center gap-4">
            <span class="text-sm font-medium">{{
              runtimeState.currentView()
            }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground">
              Metric: {{ runtimeState.overlayMetric()?.name || 'None' }}
            </span>
          </div>
        </div>

        <!-- Graph View -->
        <div
          class="flex-1 flex overflow-hidden"
          *ngIf="runtimeState.currentView() === 'Graph View'"
        >
          <!-- Quick Controls -->
          <div class="flex-1 flex flex-col">
            <app-quick-node-type-controls></app-quick-node-type-controls>

            <!-- GraphCanvas -->
            <div class="flex-1 overflow-hidden relative">
              <app-graph-canvas></app-graph-canvas>
            </div>
          </div>

          <!-- Side Panels (TODO: Task 8) -->
          <div
            *ngIf="runtimeState.selectedNode()"
            class="w-96 border-l border-border bg-card"
          >
            <div class="p-4">
              <h3 class="text-lg font-semibold">Node Data Panel</h3>
              <p class="text-sm text-muted-foreground">
                Node ID: {{ runtimeState.selectedNode() }}
              </p>
            </div>
          </div>
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

  // Inject state service (public for template access)
  readonly runtimeState = inject(RuntimeStateService);

  constructor() {
    // Component initialization
    console.log('[RuntimePage] Initialized');
  }
}
