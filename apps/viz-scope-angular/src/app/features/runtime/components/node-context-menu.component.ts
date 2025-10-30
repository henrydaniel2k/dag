/**
 * Node Context Menu Component
 * Right-click menu for graph nodes and canvas background
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { Node } from '../../../models';

export interface ContextMenuState {
  x: number;
  y: number;
  node: Node | null;
}

export interface ContextMenuAction {
  type:
    | 'open-data-panel'
    | 'set-msn'
    | 'fold-node'
    | 'open-branch-panel'
    | 'open-node-type-panel'
    | 'hide-branch'
    | 'unhide-branch';
  nodeId?: string;
}

@Component({
  selector: 'app-node-context-menu',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatIconModule],
  template: `
    <!-- Hidden trigger for programmatic menu -->
    <div
      [style.position]="'absolute'"
      [style.left.px]="_menuState()?.x || 0"
      [style.top.px]="_menuState()?.y || 0"
      [style.pointerEvents]="'none'"
    >
      <button
        #menuTrigger="matMenuTrigger"
        [matMenuTriggerFor]="contextMenu"
        style="opacity: 0; width: 0; height: 0;"
        aria-hidden="true"
      >
        <!-- Hidden trigger -->
      </button>
    </div>

    <!-- Context Menu -->
    <mat-menu #contextMenu="matMenu" class="context-menu-overlay">
      @if (_menuState(); as state) { @if (state.node; as node) {
      <!-- Node Context Menu -->
      <button mat-menu-item (click)="onAction('open-data-panel', node.id)">
        <mat-icon>description</mat-icon>
        <span>Open Node Data Panel</span>
      </button>

      <button mat-menu-item (click)="onAction('set-msn', node.id)">
        <mat-icon>place</mat-icon>
        <span>Set as MSN</span>
      </button>

      @if (canShowFoldOption(node)) {
      <button mat-menu-item (click)="onAction('fold-node', node.id)">
        <mat-icon>unfold_less</mat-icon>
        <span>Fold this {{ node.type }}</span>
      </button>
      } @if (canShowBranchOption(node)) { @if (isHiddenBranchRoot(node.id)) {
      <button mat-menu-item (click)="onAction('unhide-branch', node.id)">
        <mat-icon>visibility</mat-icon>
        <span>Unhide Branch</span>
      </button>
      } @else {
      <button
        mat-menu-item
        (click)="onAction('hide-branch', node.id)"
        [disabled]="!canHideBranch(node)"
      >
        <mat-icon>visibility_off</mat-icon>
        <span>Hide Branch...</span>
      </button>
      } } @if (canOpenBranchPanel()) {
      <button mat-menu-item (click)="onAction('open-branch-panel', node.id)">
        <mat-icon>account_tree</mat-icon>
        <span>Open Branch Data Panel</span>
      </button>
      } } @else {
      <!-- Background Context Menu -->
      <button mat-menu-item (click)="onAction('open-node-type-panel')">
        <mat-icon>layers</mat-icon>
        <span>Open Node Type Panel</span>
      </button>
      } }
    </mat-menu>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      ::ng-deep .context-menu-overlay {
        .mat-mdc-menu-panel {
          min-width: 240px;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
            0 2px 4px -2px rgb(0 0 0 / 0.1);
        }

        .mat-mdc-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          font-size: 14px;

          mat-icon {
            width: 20px;
            height: 20px;
            font-size: 20px;
            color: inherit;
          }
        }
      }
    `,
  ],
})
export class NodeContextMenuComponent {
  protected _menuState = signal<ContextMenuState | null>(null);

  @Input({ required: true }) set menuState(state: ContextMenuState | null) {
    const prevState = this._menuState();

    // Always update the state
    this._menuState.set(state);

    if (!state) {
      // Close menu when state becomes null
      if (prevState) {
        setTimeout(() => this.menuTrigger?.closeMenu(), 10);
      }
    } else {
      // Open menu for any non-null state
      // This handles both first open and subsequent opens after the menu was closed
      setTimeout(() => this.openMenu(), 10);
    }
  }
  @Input() allScopeNodes: Node[] = [];
  @Input() hiddenBranchRoots = new Set<string>();
  @Input() visibleIdsBeforeFold = new Set<string>();
  @Input() canOpenBranch = false;

  @Output() action = new EventEmitter<ContextMenuAction>();

  @ViewChild('menuTrigger', { read: MatMenuTrigger, static: true })
  menuTrigger!: MatMenuTrigger;

  // Computed values
  readonly currentNode = computed(() => {
    const state = this._menuState();
    return state?.node || null;
  });

  openMenu(): void {
    // Close existing menu first if it's open
    if (this.menuTrigger?.menuOpen) {
      this.menuTrigger.closeMenu();
    }

    // Small delay to allow cleanup, then open
    setTimeout(() => {
      if (this.menuTrigger) {
        this.menuTrigger.openMenu();
      }
    }, 20);
  }

  closeMenu(): void {
    if (this.menuTrigger?.menuOpen) {
      this.menuTrigger.closeMenu();
    }
    // Note: We don't set state to null here because the parent (RuntimePage)
    // should call closeContextMenu() on the service to properly reset state
  }

  canShowFoldOption(node: Node): boolean {
    // Show fold option if there are multiple nodes of the same type
    const allNodesOfSameType = this.allScopeNodes.filter(
      (n) => n.type === node.type
    );
    return allNodesOfSameType.length > 1;
  }

  canShowBranchOption(node: Node): boolean {
    // Show hide/unhide branch option if node has children or is hidden root
    return node.children.length > 0 || this.isHiddenBranchRoot(node.id);
  }

  canHideBranch(node: Node): boolean {
    // Can hide if node has visible parent and has children
    const hasVisibleParent = node.parents.some((parentId) =>
      this.visibleIdsBeforeFold.has(parentId)
    );
    return node.children.length > 0 && hasVisibleParent;
  }

  isHiddenBranchRoot(nodeId: string): boolean {
    return this.hiddenBranchRoots.has(nodeId);
  }

  canOpenBranchPanel(): boolean {
    return this.canOpenBranch;
  }

  onAction(type: ContextMenuAction['type'], nodeId?: string): void {
    this.action.emit({ type, nodeId });
    this.closeMenu();
  }
}
