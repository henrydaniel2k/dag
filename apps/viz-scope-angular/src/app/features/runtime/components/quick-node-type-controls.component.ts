/**
 * Quick Node Type Controls Component
 * Toolbar with quick access chips for toggling node type visibility
 */

import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickNodeTypeChipComponent } from './quick-node-type-chip.component';
import { RuntimeStateService } from '../../../core/services/runtime-state.service';
import { NodeType } from '../../../models';

@Component({
  selector: 'app-quick-node-type-controls',
  standalone: true,
  imports: [CommonModule, QuickNodeTypeChipComponent],
  template: `
    <div
      class="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
    >
      <!-- Node Types Button -->
      <button
        type="button"
        (click)="onOpenNodeTypePanel()"
        title="Open Node Type Panel (T)"
        class="relative h-8 px-3 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
      >
        <span class="text-lg">📋</span>
        <span>Node Types</span>
        @if (hasNonDefaultSettings()) {
        <span
          class="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500"
          aria-label="Node types modified"
        ></span>
        }
      </button>

      <!-- Separator -->
      <div class="w-px h-6 bg-gray-300 dark:bg-gray-700"></div>

      <!-- Quick Chips -->
      <div class="flex items-center gap-2 flex-wrap">
        @for (type of scopeTypes(); track type) {
        <app-quick-node-type-chip
          [type]="type"
          [isVisible]="!hiddenTypesSet().has(type)"
          [isLocked]="type === lockedType()"
          [isAutoFolded]="autoFoldedTypes().has(type)"
          [isPartialFolded]="isTypePartiallyFolded(type)"
          [count]="getTypeCount(type)"
          (chipClick)="onToggleType(type)"
        />
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class QuickNodeTypeControlsComponent {
  private readonly runtimeState = inject(RuntimeStateService);

  // State from RuntimeStateService
  readonly scopeTypes = this.runtimeState.scopeTypes;
  readonly hiddenTypes = this.runtimeState.hiddenTypes;
  readonly lockedType = this.runtimeState.lockedType;
  readonly hasNonDefaultSettings = this.runtimeState.hasNonDefaultSettings;
  readonly autoFoldedTypes = this.runtimeState.autoFoldedTypes;
  readonly foldedNodeIds = this.runtimeState.foldedNodeIds;

  // Convert hidden types array to Set for efficient lookup
  readonly hiddenTypesSet = computed(() => new Set(this.hiddenTypes()));

  /**
   * Check if a type is partially folded (some nodes folded, some unfolded)
   */
  isTypePartiallyFolded(type: NodeType): boolean {
    const counts = this.getTypeCounts(type);
    return counts.folded > 0 && counts.unfolded > 0;
  }

  /**
   * Get count for display on chip (show if any nodes are folded)
   */
  getTypeCount(type: NodeType): number | undefined {
    const counts = this.getTypeCounts(type);
    return counts.folded > 0 ? counts.total : undefined;
  }

  /**
   * Get detailed counts for a node type
   */
  private getTypeCounts(type: NodeType): {
    total: number;
    folded: number;
    unfolded: number;
  } {
    const scope = this.runtimeState.scope();
    const topology = this.runtimeState.topology();
    const foldedSet = this.foldedNodeIds();

    if (!scope || !topology) {
      return { total: 0, folded: 0, unfolded: 0 };
    }

    let total = 0;
    let folded = 0;
    let unfolded = 0;

    // Count nodes of this type in scope
    for (const nodeId of scope.nodes) {
      const node = topology.nodes.get(nodeId);
      if (node && (node as any).type === type) {
        total++;
        if (foldedSet.has(nodeId)) {
          folded++;
        } else {
          unfolded++;
        }
      }
    }

    return { total, folded, unfolded };
  }

  /**
   * Toggle visibility of a node type
   */
  onToggleType(type: NodeType): void {
    // Don't toggle if it's the locked type (MSN type)
    if (type === this.lockedType()) {
      return;
    }

    this.runtimeState.toggleHiddenType(type);
  }

  /**
   * Open the Node Type Panel
   * TODO: Implement panel opening logic when panel is created
   */
  onOpenNodeTypePanel(): void {
    console.log('[QuickNodeTypeControls] Open Node Type Panel - TODO');
    // Will be implemented when NodeTypePanel is created
  }
}
