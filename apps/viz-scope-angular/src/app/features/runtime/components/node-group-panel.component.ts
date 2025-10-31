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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faTimes,
  faChevronDown,
  faChevronUp,
  faEyeSlash,
  faEye,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { Node, NodeType } from '../../../models';

type FilterType = 'all' | 'eligible' | 'hidden';

@Component({
  selector: 'app-node-group-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatTooltipModule,
    FontAwesomeModule,
  ],
  template: `
    <!-- Backdrop - very subtle, doesn't obscure content -->
    @if (_isOpen()) {
    <div
      role="button"
      tabindex="0"
      class="fixed inset-0 bg-black/10 dark:bg-black/20 z-40"
      (click)="closePanel()"
      (keydown.escape)="closePanel()"
      aria-label="Close panel"
    ></div>
    }
    <!-- Side Panel - on top of backdrop -->
    <div [class]="getPanelClass()">
      <div
        class="flex flex-col h-full bg-white dark:bg-gray-900 shadow-xl border-l border-gray-200 dark:border-gray-700"
      >
        <!-- Header -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-2">
            <h2
              class="text-lg font-semibold mb-0 flex items-center gap-2 text-gray-900 dark:text-white"
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
                class="text-blue-600 dark:text-blue-400"
              >
                <path d="M3 3h10v10H3V3z" />
              </svg>
              {{ _nodeType() }} Nodes
            </h2>
            <button
              (click)="closePanel()"
              aria-label="Close panel"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <fa-icon
                [icon]="faTimes"
                class="text-gray-600 dark:text-gray-400"
              />
            </button>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-0">
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
        <div class="flex-1 overflow-hidden flex flex-col p-4">
          <!-- Bulk Actions -->
          <div class="space-y-2 mb-3">
            <div class="flex items-center justify-between">
              <button
                (click)="handleSelectAll()"
                class="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                  (click)="handleFoldSelected()"
                  class="flex-1 h-8 text-xs px-3 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                >
                  <fa-icon [icon]="faChevronUp" class="text-xs" />
                  Fold
                </button>
                <button
                  (click)="handleUnfoldSelected()"
                  class="flex-1 h-8 text-xs px-3 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                >
                  <fa-icon [icon]="faChevronDown" class="text-xs" />
                  Unfold
                </button>
              </div>
              <div class="flex items-center gap-2">
                @if (currentFilter() !== 'hidden') {
                <button
                  (click)="handleHideBranchSelected()"
                  [disabled]="!canHideSelected()"
                  [matTooltip]="hideTooltip()"
                  class="flex-1 h-8 text-xs px-3 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <fa-icon [icon]="faEyeSlash" class="text-xs" />
                  Hide Branch
                </button>
                } @if (canUnhideSelected()) {
                <button
                  (click)="handleUnhideBranchSelected()"
                  class="flex-1 h-8 text-xs px-3 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                >
                  <fa-icon [icon]="faEye" class="text-xs" />
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
            <fa-icon
              [icon]="faFilter"
              class="text-sm text-gray-600 dark:text-gray-400"
            />
            <div class="flex items-center gap-1">
              <button
                (click)="setFilter('all')"
                [class]="
                  currentFilter() === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                "
                class="h-7 text-xs px-3 rounded hover:opacity-80 transition-opacity"
              >
                All
              </button>
              <button
                (click)="setFilter('eligible')"
                [class]="
                  currentFilter() === 'eligible'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                "
                class="h-7 text-xs px-3 rounded hover:opacity-80 transition-opacity"
              >
                Eligible ({{ eligibleCount() }})
              </button>
              <button
                (click)="setFilter('hidden')"
                [class]="
                  currentFilter() === 'hidden'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                "
                class="h-7 text-xs px-3 rounded hover:opacity-80 transition-opacity"
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
                  <span
                    class="text-sm font-medium truncate text-gray-900 dark:text-white"
                    >{{ node.name }}</span
                  >
                  @if (_hiddenBranchRoots().has(node.id)) {
                  <span
                    class="text-xs h-5 px-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center"
                    >Hidden branch</span
                  >
                  } @if (_foldedNodeIds().has(node.id)) {
                  <span
                    class="text-xs h-5 px-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center"
                    >Folded</span
                  >
                  } @if (!_hiddenBranchRoots().has(node.id)) {
                  <span
                    class="text-xs h-5 px-2 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center"
                    >Visible</span
                  >
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

  // FontAwesome icons
  readonly faTimes = faTimes;
  readonly faChevronDown = faChevronDown;
  readonly faChevronUp = faChevronUp;
  readonly faEyeSlash = faEyeSlash;
  readonly faEye = faEye;
  readonly faFilter = faFilter;

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
      'fixed top-0 right-0 h-full w-96 transition-transform duration-300 ease-in-out z-50';
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
