/**
 * Navigation Component
 * Sidebar navigation with MANTO selector and expandable tree view
 * Matches the React viz-scope-link Navigation component with tree hierarchy
 */

import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RuntimeStateService } from '../../../core/services/runtime-state.service';
import { Node } from '../../../models/node.model';

interface TreeNodeState {
  node: Node;
  isExpanded: boolean;
  depth: number;
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, MatSelectModule, MatIconModule, MatTooltipModule],
  template: `
    <div
      class="border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col h-full relative"
      [style.width.px]="navWidth()"
    >
      <!-- Header with MANTO Selector -->
      <div class="p-4 border-b border-gray-300 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white">
            Navigation
          </h2>
          <mat-form-field
            class="flex-1"
            appearance="outline"
            subscriptSizing="dynamic"
          >
            <mat-select
              [value]="selectedManto()"
              (selectionChange)="onMantoChange($event.value)"
            >
              <mat-option value="Electrical">Electrical</mat-option>
              <mat-option value="Cooling">Cooling</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <!-- Tree View -->
      <div class="flex-1 overflow-y-auto p-3">
        @for (treeNode of treeNodes(); track treeNode.node.id) {
        <div
          role="button"
          tabindex="0"
          class="flex items-center gap-2 px-2 py-2 cursor-pointer transition-colors rounded-lg"
          [class.bg-blue-600]="selectedMsn() === treeNode.node.id"
          [class.text-white]="selectedMsn() === treeNode.node.id"
          [class.hover:bg-gray-200]="selectedMsn() !== treeNode.node.id"
          [class.dark:hover:bg-gray-800]="selectedMsn() !== treeNode.node.id"
          [style.padding-left.rem]="treeNode.depth * 1.5 + 0.5"
          (click)="onNodeClick(treeNode.node.id)"
          (keydown.enter)="onNodeClick(treeNode.node.id)"
          (keydown.space)="onNodeClick(treeNode.node.id)"
          [matTooltip]="treeNode.node.name + ' (' + treeNode.node.type + ')'"
          matTooltipPosition="right"
        >
          <!-- Expand/Collapse Button -->
          @if (hasChildren(treeNode.node)) {
          <button
            (click)="toggleExpand(treeNode.node.id, $event)"
            class="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-700 rounded flex-shrink-0"
            [attr.aria-label]="treeNode.isExpanded ? 'Collapse' : 'Expand'"
          >
            <mat-icon class="!w-4 !h-4 text-base">
              {{ treeNode.isExpanded ? 'expand_more' : 'chevron_right' }}
            </mat-icon>
          </button>
          } @else {
          <span class="w-5 flex-shrink-0"></span>
          }

          <!-- Node Icon (SVG) -->
          <svg
            width="16"
            height="16"
            [attr.viewBox]="getNodeIcon(treeNode.node.type).viewBox"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="flex-shrink-0"
            [class.text-white]="selectedMsn() === treeNode.node.id"
            [class.text-blue-600]="selectedMsn() !== treeNode.node.id"
          >
            <path [attr.d]="getNodeIcon(treeNode.node.type).path" />
          </svg>

          <!-- Node Name -->
          <span class="text-sm font-medium truncate flex-1 min-w-0">
            {{ treeNode.node.name }}
          </span>

          <!-- Node Type Badge -->
          <span
            class="text-xs px-2 py-0.5 rounded-md ml-auto flex-shrink-0 whitespace-nowrap"
            [class.bg-gray-700]="selectedMsn() === treeNode.node.id"
            [class.text-gray-300]="selectedMsn() === treeNode.node.id"
            [class.bg-gray-200]="selectedMsn() !== treeNode.node.id"
            [class.dark:bg-gray-800]="selectedMsn() !== treeNode.node.id"
            [class.text-gray-700]="selectedMsn() !== treeNode.node.id"
            [class.dark:text-gray-400]="selectedMsn() !== treeNode.node.id"
          >
            {{ treeNode.node.type }}
          </span>
        </div>
        }
      </div>

      <!-- Resize Handle -->
      <div
        class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-600/50 transition-colors group"
        (mousedown)="startResize($event)"
        role="separator"
        aria-label="Resize navigation panel"
      >
        <div
          class="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <mat-icon class="!w-4 !h-4 text-base text-gray-500">
            drag_indicator
          </mat-icon>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }

      ::ng-deep .mat-mdc-form-field-infix {
        min-height: 36px;
        padding-top: 8px !important;
        padding-bottom: 8px !important;
      }

      ::ng-deep .mat-mdc-text-field-wrapper {
        padding: 0 !important;
      }
    `,
  ],
})
export class NavigationComponent {
  private readonly runtimeState = inject(RuntimeStateService);

  // Resizable width with localStorage persistence
  readonly navWidth = (() => {
    if (typeof window === 'undefined') return signal(360);
    const stored = localStorage.getItem('nav-width');
    return signal(stored ? parseInt(stored, 10) : 360);
  })();

  private isResizing = signal(false);

  // Expanded nodes set
  private expandedNodeIds = signal<Set<string>>(new Set());

  // Computed values from state
  readonly selectedManto = this.runtimeState.selectedManto;
  readonly selectedMsn = this.runtimeState.selectedMsn;

  // Node type icons registry
  private readonly iconRegistry = this.buildIconRegistry();

  // Auto-expand all nodes when topology changes
  constructor() {
    effect(() => {
      const topology = this.runtimeState.topology();
      if (topology) {
        const allParentIds = new Set<string>();
        topology.nodes.forEach((node) => {
          if ((node as Node).children.length > 0) {
            allParentIds.add(node.id);
          }
        });
        this.expandedNodeIds.set(allParentIds);
      }
    });
  }

  // Build tree nodes with expansion state
  readonly treeNodes = computed((): TreeNodeState[] => {
    const topology = this.runtimeState.topology();
    if (!topology) return [];

    const expanded = this.expandedNodeIds();
    const result: TreeNodeState[] = [];

    // Get root nodes
    const rootNodes = Array.from(topology.nodes.values())
      .filter((node) => (node as Node).parents.length === 0)
      .sort((a, b) => (a as Node).name.localeCompare((b as Node).name));

    // Recursively build tree
    const buildTree = (node: Node, depth: number) => {
      const isExpanded = expanded.has(node.id);
      result.push({ node, isExpanded, depth });

      if (isExpanded && node.children.length > 0) {
        const children = node.children
          .map((childId) => topology.nodes.get(childId))
          .filter((child): child is Node => child !== undefined)
          .sort((a, b) => a.name.localeCompare(b.name));

        children.forEach((child) => buildTree(child, depth + 1));
      }
    };

    rootNodes.forEach((node) => buildTree(node as Node, 0));
    return result;
  });

  hasChildren(node: Node): boolean {
    return node.children.length > 0;
  }

  toggleExpand(nodeId: string, event: Event): void {
    event.stopPropagation();
    const expanded = new Set(this.expandedNodeIds());
    if (expanded.has(nodeId)) {
      expanded.delete(nodeId);
    } else {
      expanded.add(nodeId);
    }
    this.expandedNodeIds.set(expanded);
  }

  onNodeClick(nodeId: string): void {
    this.runtimeState.setSelectedMsn(nodeId);
  }

  onMantoChange(manto: string): void {
    if (manto === 'Electrical' || manto === 'Cooling') {
      this.runtimeState.setSelectedManto(manto);
    }
  }

  startResize(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing.set(true);

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(280, Math.min(420, e.clientX));
      this.navWidth.set(newWidth);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nav-width', newWidth.toString());
      }
    };

    const onMouseUp = () => {
      this.isResizing.set(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  getNodeIcon(type: string): { path: string; viewBox: string } {
    return this.iconRegistry[type] || this.iconRegistry['_fallback'];
  }

  private buildIconRegistry(): Record<
    string,
    { path: string; viewBox: string }
  > {
    return {
      Organization: {
        path: 'M8 2v4H2v8h12V6H8V2z',
        viewBox: '0 0 16 16',
      },
      ES: {
        path: 'M8 1l5 7-5 7-5-7 5-7z',
        viewBox: '0 0 16 16',
      },
      'Switch Gear': {
        path: 'M2 5h12v6H2V5zm4 0v6m4-6v6',
        viewBox: '0 0 16 16',
      },
      ATS: {
        path: 'M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2zm0 2v4h3',
        viewBox: '0 0 16 16',
      },
      UPS: {
        path: 'M4 3h8v10H4V3zm2 3h4m-4 3h4',
        viewBox: '0 0 16 16',
      },
      PDU: {
        path: 'M3 2h10v12H3V2zm3 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM6 9a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z',
        viewBox: '0 0 16 16',
      },
      'Rack PDU': {
        path: 'M4 1h8v14H4V1zm2 2a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm4 0a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zM6 6a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm4 0a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zM6 9a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm4 0a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm-4 3a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm4 0a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z',
        viewBox: '0 0 16 16',
      },
      Server: {
        path: 'M2 3h12v3H2V3zm0 4h12v3H2V7zm0 4h12v3H2v-3zm2-9.5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm0 4a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm0 4a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z',
        viewBox: '0 0 16 16',
      },
      Chiller: {
        path: 'M8 2l3 3H9v3h2l-3 3-3-3h2V5H5l3-3zM3 12h10m-9 1h8m-7 1h6',
        viewBox: '0 0 16 16',
      },
      CRAC: {
        path: 'M8 8a5 5 0 1 1 0 0zM8 3v3m3.5-1.5l-2 2M13 8h-3m1.5 3.5l-2-2M8 13v-3m-3.5 1.5l2-2M3 8h3m-1.5-3.5l2 2',
        viewBox: '0 0 16 16',
      },
      _fallback: {
        path: 'M8 2v8m0 2a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zM3 3h10v10H3V3z',
        viewBox: '0 0 16 16',
      },
    };
  }
}
