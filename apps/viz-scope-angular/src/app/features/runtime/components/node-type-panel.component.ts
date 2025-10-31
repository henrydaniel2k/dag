/**
 * Node Type Panel Component
 * Side panel for managing node type visibility and folding
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { VisibilityChipComponent } from '../../../shared/components/visibility-chip.component';
import {
  FoldStateSegmentedControlComponent,
  FoldState,
} from '../../../shared/components/fold-state-control.component';
import { RuntimeStateService } from '../../../core/services/runtime-state.service';
import { NodeType, Node } from '../../../models';
import {
  PartialFoldDialogComponent,
  PartialFoldDialogData,
  PartialFoldDialogResult,
} from '../dialogs/partial-fold-dialog.component';

interface TypeCounts {
  total: number;
  folded: number;
  unfolded: number;
  visible: number;
}

@Component({
  selector: 'app-node-type-panel',
  standalone: true,
  imports: [
    CommonModule,
    VisibilityChipComponent,
    FoldStateSegmentedControlComponent,
  ],
  template: `
    @if (isOpen) {
    <div
      class="fixed inset-y-0 right-0 w-[420px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col z-50"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Node Types
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Control visibility and folding for each node type in this scope.
            </p>
          </div>
          <button
            type="button"
            (click)="close()"
            class="ml-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Close panel"
          >
            <span class="text-xl">✕</span>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-4 py-2">
        <div class="space-y-0">
          @for (type of scopeTypes(); track type) { @let counts =
          getTypeCounts(type); @let foldState = getFoldState(type, counts); @let
          isHidden = hiddenTypesSet().has(type); @let isLocked = type ===
          lockedType(); @let disabledReason = getDisabledReason(type, counts,
          isHidden, isLocked);

          <div
            class="grid grid-cols-[minmax(0,1fr)_minmax(100px,auto)_auto] gap-2 px-4 py-3 border-b border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 items-center"
          >
            <!-- Column A: Type chip + stats -->
            <div class="flex flex-col gap-1 min-w-0">
              <app-visibility-chip
                [type]="type"
                [isVisible]="!isHidden"
                [isDisabled]="isLocked || counts.total === 0"
                (chipClick)="toggleType(type)"
                [title]="getChipTooltip(type, isHidden, isLocked, counts)"
              />

              <!-- Stats subline -->
              <div
                class="text-xs text-gray-600 dark:text-gray-400 truncate max-w-full"
              >
                {{ counts.total }} node{{ counts.total !== 1 ? 's' : '' }} •
                {{ counts.visible }} visible @if (counts.folded > 0) {
                <span> • {{ counts.folded }} folded</span>
                }
              </div>
            </div>

            <!-- Column B: Fold control -->
            <app-fold-state-control
              [foldState]="foldState"
              [disabled]="isHidden || counts.total === 0 || isLocked"
              [disabledReason]="disabledReason"
              [typeName]="type"
              (foldAll)="onFoldAll(type)"
              (partialFold)="onPartialFold(type)"
              (unfoldAll)="onUnfoldAll(type)"
            />

            <!-- Column C: Actions -->
            <div class="flex items-center gap-1 justify-end">
              <!-- List button -->
              <button
                type="button"
                (click)="onOpenNodeGroup(type)"
                title="Open node list (Node Group Panel)"
                class="h-8 w-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                <span class="text-lg">📋</span>
              </button>

              <!-- More actions -->
              <button
                type="button"
                (click)="resetType(type)"
                title="Reset this type to defaults"
                class="h-8 w-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                <span class="text-lg">↺</span>
              </button>
            </div>
          </div>
          }
        </div>
      </div>

      <!-- Footer -->
      <div
        class="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end"
      >
        <button
          type="button"
          (click)="onResetToDefaults()"
          title="Reset all types to scope defaults"
          class="h-9 w-9 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        >
          <span class="text-lg">↺</span>
        </button>
      </div>
    </div>
    }

    <!-- Backdrop -->
    <div
      *ngIf="isOpen"
      (click)="close()"
      (keydown.escape)="close()"
      tabindex="0"
      role="button"
      aria-label="Close panel"
      class="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
    ></div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class NodeTypePanelComponent {
  @Input() isOpen = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() openNodeGroup = new EventEmitter<NodeType>();

  private readonly runtimeState = inject(RuntimeStateService);
  private readonly dialog = inject(MatDialog);

  // State
  readonly scopeTypes = this.runtimeState.scopeTypes;
  readonly hiddenTypes = this.runtimeState.hiddenTypes;
  readonly lockedType = this.runtimeState.lockedType;
  readonly foldedNodeIds = this.runtimeState.foldedNodeIds;

  readonly hiddenTypesSet = computed(() => new Set(this.hiddenTypes()));

  close(): void {
    this.openChange.emit(false);
  }

  toggleType(type: NodeType): void {
    if (type !== this.lockedType()) {
      this.runtimeState.toggleHiddenType(type);
    }
  }

  getTypeCounts(type: NodeType): TypeCounts {
    const scope = this.runtimeState.scope();
    const topology = this.runtimeState.topology();
    const foldedSet = this.foldedNodeIds();
    const hiddenSet = this.hiddenTypesSet();

    if (!scope || !topology) {
      return { total: 0, folded: 0, unfolded: 0, visible: 0 };
    }

    let total = 0;
    let folded = 0;
    let unfolded = 0;
    let visible = 0;

    for (const nodeId of scope.nodes) {
      const node = topology.nodes.get(nodeId) as Node | undefined;
      if (node && node.type === type) {
        total++;
        if (foldedSet.has(nodeId)) {
          folded++;
        } else {
          unfolded++;
        }
        if (!hiddenSet.has(type) && !foldedSet.has(nodeId)) {
          visible++;
        }
      }
    }

    return { total, folded, unfolded, visible };
  }

  getFoldState(type: NodeType, counts: TypeCounts): FoldState {
    if (counts.unfolded === 0 && counts.total > 0) {
      return 'folded';
    }
    if (counts.folded > 0 && counts.unfolded > 0) {
      return 'partial';
    }
    return 'unfolded';
  }

  getDisabledReason(
    type: NodeType,
    counts: TypeCounts,
    isHidden: boolean,
    isLocked: boolean
  ): 'hidden' | 'not-foldable' | 'no-nodes' | undefined {
    if (counts.total === 0) return 'no-nodes';
    if (isHidden) return 'hidden';
    if (isLocked) return 'not-foldable';
    return undefined;
  }

  getChipTooltip(
    type: NodeType,
    isHidden: boolean,
    isLocked: boolean,
    counts: TypeCounts
  ): string {
    if (isLocked) return 'MSN type cannot be hidden';
    if (counts.total === 0) return `No ${type} nodes in this scope`;
    return `Click to ${isHidden ? 'show' : 'hide'} ${type} in current scope`;
  }

  onFoldAll(type: NodeType): void {
    this.runtimeState.foldAllOfType(type);
  }

  onPartialFold(type: NodeType): void {
    const topology = this.runtimeState.topology();
    if (!topology) return;

    // Get all visible unfolded nodes of this type
    const visibleNodes = this.runtimeState.visibleNodes();
    const foldedSet = new Set(this.runtimeState.foldedNodeIds());

    const nodes: Node[] = visibleNodes.filter(
      (node) => node.type === type && !foldedSet.has(node.id)
    );

    if (nodes.length === 0) return;

    const dialogRef = this.dialog.open<
      PartialFoldDialogComponent,
      PartialFoldDialogData,
      PartialFoldDialogResult
    >(PartialFoldDialogComponent, {
      data: {
        nodeType: type,
        nodes,
        getNodeName: (nodeId: string) => {
          const n = topology.nodes.get(nodeId);
          return n ? n.name : nodeId;
        },
      },
      width: '500px',
      maxHeight: '80vh',
    });

    dialogRef
      .afterClosed()
      .subscribe((result: PartialFoldDialogResult | undefined) => {
        if (result && result.nodeIds.length > 0) {
          this.runtimeState.foldNodes(result.nodeIds);
        }
      });
  }

  onUnfoldAll(type: NodeType): void {
    this.runtimeState.unfoldAllOfType(type);
  }

  onOpenNodeGroup(type: NodeType): void {
    console.log('[NodeTypePanel] Open node group for type:', type);
    this.openNodeGroup.emit(type);
  }

  resetType(type: NodeType): void {
    const hiddenSet = this.hiddenTypesSet();

    // Reset visibility if hidden
    if (hiddenSet.has(type)) {
      this.runtimeState.toggleHiddenType(type);
    }

    // Reset fold state by unfolding all
    const counts = this.getTypeCounts(type);
    if (counts.folded > 0) {
      this.runtimeState.unfoldAllOfType(type);
    }
  }

  onResetToDefaults(): void {
    this.runtimeState.resetToDefaults();
  }
}
