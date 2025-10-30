/**
 * Node Group Panel Component
 * Side panel for managing individual nodes of a specific type
 * Allows bulk folding, unfolding, hiding, and unhiding branches
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Node, NodeType } from '../../../models';

type FilterType = 'all' | 'eligible' | 'hidden';

@Component({
  selector: 'app-node-group-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  template: `
    <!-- Backdrop -->
    @if (_isOpen()) {
    <div
      role="button"
      tabindex="0"
      class="fixed inset-0 bg-black/30 z-[55]"
      (click)="closePanel()"
      (keydown.escape)="closePanel()"
      aria-label="Close panel"
    ></div>
    }
    <!-- Side Panel -->
    <div [class]="getPanelClass()">
      <div class="flex flex-col h-full bg-white dark:bg-gray-900 shadow-xl">
        <!-- Header -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between mb-2">
            <h2
              class="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2"
            >
              <!-- Node Type Icon SVG -->
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-blue-600"
              >
                <path d="M3 3h10v10H3V3z" />
              </svg>
              {{ _nodeType() }} Nodes
            </h2>
            <button
              mat-icon-button
              (click)="closePanel()"
              aria-label="Close panel"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ _nodes().length }}
            {{ _nodes().length === 1 ? 'node' : 'nodes' }}
            @if (hiddenCount() > 0) {
            <span> • {{ hiddenCount() }} hidden</span>
            }
            <span>
              • {{ foldedCount() }} folded • {{ unfoldedCount() }} visible</span
            >
          </p>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-hidden flex flex-col p-6">
          <!-- Bulk Actions -->
          <div class="space-y-2 mb-4">
            <div class="flex items-center justify-between">
              <button
                mat-stroked-button
                (click)="handleSelectAll()"
                class="!text-xs"
              >
                {{
                  selectedNodeIds().size === _nodes().length
                    ? 'Deselect All'
                    : 'Select All'
                }}
              </button>
              <span class="text-xs text-gray-600 dark:text-gray-400">
                {{ selectedNodeIds().size }} selected
              </span>
            </div>

            @if (selectedNodeIds().size > 0) {
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <button
                  mat-stroked-button
                  (click)="handleFoldSelected()"
                  class="flex-1 !h-8 !text-xs"
                >
                  <mat-icon class="!w-3 !h-3 !text-xs mr-1"
                    >unfold_less</mat-icon
                  >
                  Fold
                </button>
                <button
                  mat-stroked-button
                  (click)="handleUnfoldSelected()"
                  class="flex-1 !h-8 !text-xs"
                >
                  <mat-icon class="!w-3 !h-3 !text-xs mr-1"
                    >unfold_more</mat-icon
                  >
                  Unfold
                </button>
              </div>
              <div class="flex items-center gap-2">
                @if (currentFilter() !== 'hidden') {
                <button
                  mat-stroked-button
                  (click)="handleHideBranchSelected()"
                  [disabled]="!canHideSelected()"
                  [matTooltip]="hideTooltip()"
                  class="flex-1 !h-8 !text-xs"
                >
                  <mat-icon class="!w-3 !h-3 !text-xs mr-1"
                    >visibility_off</mat-icon
                  >
                  Hide Branch
                </button>
                } @if (canUnhideSelected()) {
                <button
                  mat-stroked-button
                  (click)="handleUnhideBranchSelected()"
                  class="flex-1 !h-8 !text-xs"
                >
                  <mat-icon class="!w-3 !h-3 !text-xs mr-1"
                    >visibility</mat-icon
                  >
                  Unhide Branch
                </button>
                }
              </div>
            </div>
            }
          </div>

          <div class="border-t border-gray-200 dark:border-gray-800 my-4"></div>

          <!-- Filter Pills -->
          <div class="flex items-center gap-2 mb-4">
            <mat-icon
              class="!w-4 !h-4 !text-base text-gray-600 dark:text-gray-400"
              >filter_list</mat-icon
            >
            <div class="flex items-center gap-1">
              <button
                mat-button
                [class.mat-primary]="currentFilter() === 'all'"
                [class.mat-stroked-button]="currentFilter() !== 'all'"
                (click)="setFilter('all')"
                class="!h-7 !text-xs !px-3"
              >
                All
              </button>
              <button
                mat-button
                [class.mat-primary]="currentFilter() === 'eligible'"
                [class.mat-stroked-button]="currentFilter() !== 'eligible'"
                (click)="setFilter('eligible')"
                class="!h-7 !text-xs !px-3"
              >
                Eligible ({{ eligibleCount() }})
              </button>
              <button
                mat-button
                [class.mat-primary]="currentFilter() === 'hidden'"
                [class.mat-stroked-button]="currentFilter() !== 'hidden'"
                (click)="setFilter('hidden')"
                class="!h-7 !text-xs !px-3"
              >
                Hidden ({{ hiddenCount() }})
              </button>
            </div>
          </div>

          <!-- Node List -->
          <div class="flex-1 overflow-y-auto space-y-1 pr-2">
            @for (node of filteredNodes(); track node.id) {
            <div [class]="getNodeItemClass(node.id)">
              <mat-checkbox
                [checked]="selectedNodeIds().has(node.id)"
                (change)="handleToggleNode(node.id)"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-medium truncate">{{
                    node.name
                  }}</span>
                  @if (_hiddenBranchRoots().has(node.id)) {
                  <mat-chip class="!text-xs !h-5 !px-2">Hidden branch</mat-chip>
                  } @if (_foldedNodeIds().has(node.id)) {
                  <mat-chip class="!text-xs !h-5 !px-2" color="accent"
                    >Folded</mat-chip
                  >
                  } @if (!_hiddenBranchRoots().has(node.id)) {
                  <mat-chip class="!text-xs !h-5 !px-2">Visible</mat-chip>
                  }
                </div>
                <div
                  class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1"
                >
                  <span>{{ node.id }}</span>
                  <span>•</span>
                  <span>{{ node.children.length }} children</span>
                </div>
              </div>
            </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      ::ng-deep .mat-mdc-chip {
        --mdc-chip-label-text-size: 0.75rem;
      }
    `,
  ],
})
export class NodeGroupPanelComponent {
  // Input signals (protected for template access)
  protected readonly _isOpen = signal(false);
  protected readonly _nodeType = signal<NodeType | null>(null);
  protected readonly _nodes = signal<Node[]>([]);
  protected readonly _foldedNodeIds = signal<Set<string>>(new Set());
  protected readonly _hiddenBranchRoots = signal<Set<string>>(new Set());
  protected readonly _visibleIdsBeforeFold = signal<Set<string>>(new Set());

  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  @Input() set nodeType(value: NodeType | null) {
    this._nodeType.set(value);
  }
  @Input() set nodes(value: Node[]) {
    this._nodes.set(value);
  }
  @Input() set foldedNodeIds(value: Set<string>) {
    this._foldedNodeIds.set(value);
  }
  @Input() set hiddenBranchRoots(value: Set<string>) {
    this._hiddenBranchRoots.set(value);
  }
  @Input() set visibleIdsBeforeFold(value: Set<string>) {
    this._visibleIdsBeforeFold.set(value);
  }

  @Output() openChange = new EventEmitter<boolean>();
  @Output() foldNodes = new EventEmitter<string[]>();
  @Output() unfoldNodes = new EventEmitter<string[]>();
  @Output() hideBranch = new EventEmitter<string[]>();
  @Output() unhideBranch = new EventEmitter<string[]>();

  // Local state
  readonly selectedNodeIds = signal<Set<string>>(new Set());
  readonly currentFilter = signal<FilterType>('all');

  // Computed values
  readonly foldedCount = computed(() => {
    return this._nodes().filter((n) => this._foldedNodeIds().has(n.id)).length;
  });

  readonly unfoldedCount = computed(() => {
    return this._nodes().length - this.foldedCount();
  });

  readonly hiddenCount = computed(() => {
    return this._nodes().filter((n) => this._hiddenBranchRoots().has(n.id))
      .length;
  });

  readonly eligibleCount = computed(() => {
    return this._nodes().filter(
      (n) =>
        n.parents.some((p) => this._visibleIdsBeforeFold().has(p)) &&
        n.children.length > 0 &&
        !this._hiddenBranchRoots().has(n.id)
    ).length;
  });

  readonly filteredNodes = computed(() => {
    const filter = this.currentFilter();
    const nodes = this._nodes();

    if (filter === 'eligible') {
      return nodes.filter(
        (n) =>
          n.parents.some((p) => this._visibleIdsBeforeFold().has(p)) &&
          n.children.length > 0 &&
          !this._hiddenBranchRoots().has(n.id)
      );
    }
    if (filter === 'hidden') {
      return nodes.filter((n) => this._hiddenBranchRoots().has(n.id));
    }
    return nodes;
  });

  readonly canHideSelected = computed(() => {
    const selected = this.selectedNodeIds();
    if (selected.size === 0) return false;

    return Array.from(selected).every((nodeId) => {
      const node = this._nodes().find((n) => n.id === nodeId);
      if (!node) return false;
      const hasVisibleParent = node.parents.some((p) =>
        this._visibleIdsBeforeFold().has(p)
      );
      return hasVisibleParent && node.children.length > 0;
    });
  });

  readonly canUnhideSelected = computed(() => {
    return Array.from(this.selectedNodeIds()).some((nodeId) =>
      this._hiddenBranchRoots().has(nodeId)
    );
  });

  readonly ineligibleCount = computed(() => {
    return Array.from(this.selectedNodeIds()).filter((nodeId) => {
      const node = this._nodes().find((n) => n.id === nodeId);
      if (!node) return true;
      const hasVisibleParent = node.parents.some((p) =>
        this._visibleIdsBeforeFold().has(p)
      );
      return !hasVisibleParent || node.children.length === 0;
    }).length;
  });

  readonly hideTooltip = computed(() => {
    if (this.canHideSelected()) {
      return `Hide selected branches (${this.selectedNodeIds().size})`;
    }
    const ineligible = this.ineligibleCount();
    if (ineligible > 0) {
      return `Cannot hide: ${ineligible} ${
        ineligible === 1 ? 'node lacks' : 'nodes lack'
      } a parent in this view`;
    }
    return 'Select eligible nodes to hide';
  });

  constructor() {
    // Reset selection when panel closes
    effect(() => {
      if (!this._isOpen()) {
        this.selectedNodeIds.set(new Set());
        this.currentFilter.set('all');
      }
    });
  }

  getPanelClass(): string {
    const baseClasses =
      'fixed top-0 right-0 h-full w-[400px] sm:w-[540px] z-50 transition-transform duration-300 ease-in-out';
    const visibilityClasses = this._isOpen()
      ? 'translate-x-0'
      : 'translate-x-full';

    return `${baseClasses} ${visibilityClasses}`;
  }

  getNodeItemClass(nodeId: string): string {
    const isSelected = this.selectedNodeIds().has(nodeId);
    const isHidden = this._hiddenBranchRoots().has(nodeId);

    const baseClasses =
      'flex items-center gap-3 p-2 rounded-md border transition-colors';
    const selectedClasses = isSelected
      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50';
    const hiddenClasses = isHidden ? 'opacity-70' : '';

    return `${baseClasses} ${selectedClasses} ${hiddenClasses}`;
  }

  handleToggleNode(nodeId: string): void {
    const newSet = new Set(this.selectedNodeIds());
    if (newSet.has(nodeId)) {
      newSet.delete(nodeId);
    } else {
      newSet.add(nodeId);
    }
    this.selectedNodeIds.set(newSet);
  }

  handleSelectAll(): void {
    if (this.selectedNodeIds().size === this._nodes().length) {
      this.selectedNodeIds.set(new Set());
    } else {
      this.selectedNodeIds.set(new Set(this._nodes().map((n) => n.id)));
    }
  }

  handleFoldSelected(): void {
    this.foldNodes.emit(Array.from(this.selectedNodeIds()));
    this.selectedNodeIds.set(new Set());
  }

  handleUnfoldSelected(): void {
    this.unfoldNodes.emit(Array.from(this.selectedNodeIds()));
    this.selectedNodeIds.set(new Set());
  }

  handleHideBranchSelected(): void {
    this.hideBranch.emit(Array.from(this.selectedNodeIds()));
    this.selectedNodeIds.set(new Set());
  }

  handleUnhideBranchSelected(): void {
    this.unhideBranch.emit(Array.from(this.selectedNodeIds()));
    this.selectedNodeIds.set(new Set());
  }

  setFilter(filter: FilterType): void {
    this.currentFilter.set(filter);
  }

  closePanel(): void {
    this.openChange.emit(false);
  }

  onClose(): void {
    this.openChange.emit(false);
  }
}
