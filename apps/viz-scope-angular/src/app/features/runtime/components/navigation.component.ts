/**
 * Navigation Component
 * Sidebar navigation with MANTO and MSN selectors
 */

import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RuntimeStateService } from '../../../core/services/runtime-state.service';
import { Node } from '../../../models/node.model';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav
      class="h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col"
    >
      <!-- Logo / Title -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          DAG Viewer
        </h1>
      </div>

      <!-- MANTO Selector -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-800">
        <label
          for="manto-selector"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Topology (MANTO)
        </label>
        <select
          id="manto-selector"
          [value]="selectedManto()"
          (change)="onMantoChange($event)"
          class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
        >
          <option value="">Select topology...</option>
          @for (manto of availableMantos(); track manto) {
          <option [value]="manto">{{ manto }}</option>
          }
        </select>
      </div>

      <!-- MSN Selector -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-800">
        <label
          for="msn-selector"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Root Node (MSN)
        </label>
        <select
          id="msn-selector"
          [value]="selectedMsn() || ''"
          (change)="onMsnChange($event)"
          [disabled]="!selectedManto()"
          class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
        >
          <option value="">Select root node...</option>
          @for (node of rootNodes(); track node.id) {
          <option [value]="node.id">{{ node.name }} ({{ node.type }})</option>
          }
        </select>
      </div>

      <!-- Stats -->
      <div class="p-4 flex-1">
        <div class="space-y-3 text-sm">
          <div class="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Scope Nodes:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ scopeNodeCount() }}
            </span>
          </div>

          <div class="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Visible:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ visibleNodeCount() }}
            </span>
          </div>

          <div class="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Hidden Types:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ hiddenTypeCount() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          (click)="onResetDefaults()"
          [disabled]="!hasNonDefaultSettings()"
          class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reset Defaults
        </button>
      </div>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class NavigationComponent {
  private readonly runtimeState = inject(RuntimeStateService);

  // Computed values from state
  readonly selectedManto = this.runtimeState.selectedManto;
  readonly selectedMsn = this.runtimeState.selectedMsn;
  readonly hasNonDefaultSettings = this.runtimeState.hasNonDefaultSettings;

  // Available MANTOs (from topology service) - hardcoded for now
  readonly availableMantos = computed(() => {
    return ['Electrical', 'Cooling'] as const;
  });

  // Root nodes in current topology
  readonly rootNodes = computed(() => {
    const topo = this.runtimeState.topology();
    if (!topo) return [];

    return Array.from(topo.nodes.values())
      .filter((node) => (node as Node).parents.length === 0)
      .sort((a, b) =>
        (a as Node).name.localeCompare((b as Node).name)
      ) as Node[];
  });

  // Stats
  readonly scopeNodeCount = computed(() => {
    const scope = this.runtimeState.scope();
    return scope ? scope.nodes.size : 0;
  });

  readonly visibleNodeCount = computed(() => {
    return this.runtimeState.visibleNodes().length;
  });

  readonly hiddenTypeCount = computed(() => {
    return this.runtimeState.hiddenTypes().length;
  });

  onMantoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const manto = select.value; // TopologyType
    if (manto === 'Electrical' || manto === 'Cooling') {
      this.runtimeState.setSelectedManto(manto);
    }
  }

  onMsnChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const msn = select.value;
    if (msn) {
      this.runtimeState.setSelectedMsn(msn);
    }
  }

  onResetDefaults(): void {
    this.runtimeState.resetToDefaults();
  }
}
