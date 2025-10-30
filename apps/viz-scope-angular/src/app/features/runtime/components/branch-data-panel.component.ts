/**
 * Branch Data Panel Component
 * Shows consolidated data for a branch (hidden subtree)
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
import { RuntimeStateService } from '../../../core/services/runtime-state.service';
import { Node, NodeType } from '../../../models';
import { ScopeService } from '../../../core/services';

interface ConsolidatedMetric {
  id: string;
  name: string;
  type: string;
  unit: string;
  value: number;
  aggregationType: 'Sum' | 'Average';
}

@Component({
  selector: 'app-branch-data-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (branchRootNode()) { @let rootNode = branchRootNode(); @let branchData =
    getBranchData(rootNode!);

    <div
      class="w-96 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-full"
    >
      <!-- Header -->
      <div
        class="p-4 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between"
      >
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Branch Data
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Root: {{ rootNode!.name }}
          </p>
          <span
            class="inline-flex items-center px-2 py-0.5 mt-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded"
          >
            {{ branchData.totalNodes }} nodes
          </span>
        </div>
        <button
          type="button"
          (click)="close()"
          class="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded"
        >
          <span class="text-xl">✕</span>
        </button>
      </div>

      <!-- Time Period Info -->
      <div
        class="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
      >
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Time Period (MANTO only) • {{ timeWindow() }}
        </p>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-4 space-y-4">
          <!-- Consolidated Metrics -->
          <div>
            <h4
              class="text-sm font-semibold text-gray-900 dark:text-white mb-2"
            >
              Consolidated Metrics (Integrated Only)
            </h4>
            <div class="space-y-2">
              @if (branchData.consolidatedMetrics.length > 0) { @for (metric of
              branchData.consolidatedMetrics; track metric.id) {
              <div
                class="flex items-center justify-between p-3 rounded-md bg-gray-100 dark:bg-gray-800"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ metric.name }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    {{ metric.aggregationType }}
                  </p>
                </div>
                <div class="text-right">
                  <p
                    class="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    {{ metric.value.toFixed(2) }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    {{ metric.unit }}
                  </p>
                </div>
              </div>
              } } @else {
              <p class="text-sm text-gray-600 dark:text-gray-400">
                No integrated metrics available
              </p>
              }
            </div>
          </div>

          <!-- Branch Inventory -->
          <div>
            <h4
              class="text-sm font-semibold text-gray-900 dark:text-white mb-2"
            >
              Branch Inventory
            </h4>
            <div class="space-y-2">
              @for (typeCount of branchData.typeCounts; track typeCount.type) {
              <div
                class="flex items-center justify-between p-3 rounded-md bg-gray-100 dark:bg-gray-800"
              >
                <div class="flex items-center gap-2">
                  <!-- Icon placeholder -->
                  <span class="w-4 h-4 rounded bg-blue-500"></span>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ typeCount.type }}
                  </p>
                </div>
                <span
                  class="inline-flex items-center px-2 py-0.5 text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded"
                >
                  {{ typeCount.count }}
                </span>
              </div>
              }

              <!-- Total -->
              <div
                class="flex items-center justify-between p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700"
              >
                <p class="text-sm font-semibold text-gray-900 dark:text-white">
                  Total Nodes
                </p>
                <span
                  class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded"
                >
                  {{ branchData.totalNodes }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class BranchDataPanelComponent {
  @Input() branchRootId: string | null = null;
  @Output() panelClose = new EventEmitter<void>();

  private readonly runtimeState = inject(RuntimeStateService);
  private readonly scopeService = inject(ScopeService);

  readonly timeWindow = this.runtimeState.timeWindow;
  readonly branchRootNode = computed(() => {
    if (!this.branchRootId) return null;

    const topology = this.runtimeState.topology();
    return (topology?.nodes.get(this.branchRootId) as Node | undefined) || null;
  });

  close(): void {
    this.panelClose.emit();
  }

  getBranchData(rootNode: Node): {
    totalNodes: number;
    consolidatedMetrics: ConsolidatedMetric[];
    typeCounts: Array<{ type: NodeType; count: number }>;
  } {
    const topology = this.runtimeState.topology();
    if (!topology) {
      return { totalNodes: 0, consolidatedMetrics: [], typeCounts: [] };
    }

    // Get all branch nodes using scopeService
    const branchNodeIds = this.scopeService.getBranchNodes(
      rootNode.id,
      topology
    );
    const branchNodes: Node[] = [];

    for (const nodeId of branchNodeIds) {
      const node = topology.nodes.get(nodeId) as Node | undefined;
      if (node) {
        branchNodes.push(node);
      }
    }

    // Count node types
    const typeCounts = new Map<NodeType, number>();
    for (const node of branchNodes) {
      typeCounts.set(node.type, (typeCounts.get(node.type) || 0) + 1);
    }

    // Consolidate integrated metrics only
    const integratedMetrics = branchNodes
      .flatMap((n) => n.metrics)
      .filter((m) => m.variable.isIntegrated);

    const metricsByVariable = new Map<string, typeof integratedMetrics>();
    for (const metric of integratedMetrics) {
      const key = metric.variable.id;
      if (!metricsByVariable.has(key)) {
        metricsByVariable.set(key, []);
      }
      const metricsArray = metricsByVariable.get(key);
      if (metricsArray) {
        metricsArray.push(metric);
      }
    }

    const consolidatedMetrics: ConsolidatedMetric[] = Array.from(
      metricsByVariable.entries()
    ).map(([, metrics]) => {
      const variable = metrics[0].variable;
      let consolidatedValue: number;
      let aggregationType: 'Sum' | 'Average';

      if (variable.type === 'extensive') {
        consolidatedValue = metrics.reduce((sum, m) => sum + m.value, 0);
        aggregationType = 'Sum';
      } else {
        consolidatedValue =
          metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
        aggregationType = 'Average';
      }

      return {
        id: variable.id,
        name: variable.name,
        type: variable.type,
        unit: variable.unit,
        value: consolidatedValue,
        aggregationType,
      };
    });

    return {
      totalNodes: branchNodes.length,
      consolidatedMetrics,
      typeCounts: Array.from(typeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => a.type.localeCompare(b.type)),
    };
  }
}
