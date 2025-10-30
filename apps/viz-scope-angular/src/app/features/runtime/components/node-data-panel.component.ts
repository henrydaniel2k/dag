/**
 * Node Data Panel Component
 * Side panel showing detailed information about a selected node
 */

import {
  Component,
  Output,
  EventEmitter,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RuntimeStateService } from '../../../core/services/runtime-state.service';
import { Node } from '../../../models';

// Metric families for organizing metrics
const METRIC_FAMILIES = {
  emissions: { name: 'Emissions', order: 1 },
  energy: { name: 'Energy & Power', order: 2 },
  environmental: { name: 'Environmental', order: 3 },
  other: { name: 'Other Metrics', order: 4 },
} as const;

type MetricFamily = keyof typeof METRIC_FAMILIES;

interface MetricDisplay {
  id: string;
  name: string;
  type: string;
  sit: number;
  unit: string;
  value: number;
  isIntegrated: boolean;
}

@Component({
  selector: 'app-node-data-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (selectedNode()) { @let node = selectedNode();
    <div
      class="w-96 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-full p-2"
    >
      <!-- Header -->
      <div
        class="p-4 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between"
      >
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <!-- Icon placeholder -->
            <span class="w-4 h-4 rounded bg-blue-500"></span>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ node!.name }}
            </h3>
            @if (node!.alerts && node!.alerts.length > 0) {
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded"
            >
              ⚠️ Alert
            </span>
            }
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ node!.type }}
          </p>
          <div class="flex gap-1 mt-2">
            @for (topo of node!.topologies; track topo) {
            <span
              class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded"
            >
              {{ topo }}
            </span>
            }
          </div>
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
          Time Period • {{ timeWindow() }}
        </p>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-4 space-y-4">
          <!-- Alerts -->
          @if (node!.alerts && node!.alerts.length > 0) {
          <div>
            <h4
              class="text-sm font-semibold text-gray-900 dark:text-white mb-2"
            >
              Alerts
            </h4>
            <div class="space-y-2">
              @for (alert of node!.alerts; track $index) {
              <div
                class="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              >
                <span class="text-red-600 dark:text-red-400">⚠️</span>
                <p class="text-sm text-gray-900 dark:text-white">{{ alert }}</p>
              </div>
              }
            </div>
          </div>
          }

          <!-- Metrics by Family -->
          @for (family of getMetricFamilies(node!); track family) { @let
          familyMetrics = getMetricsForFamily(node!, family); @if
          (familyMetrics.length > 0) {
          <div>
            <h4
              class="text-sm font-semibold text-gray-900 dark:text-white mb-2"
            >
              {{ METRIC_FAMILIES[family].name }}
            </h4>
            <div class="space-y-2">
              @for (metric of familyMetrics; track metric.id) {
              <div class="p-3 rounded-md bg-gray-100 dark:bg-gray-800">
                <div class="flex items-center justify-between">
                  <div>
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ metric.name }}
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      {{ metric.type }} • SIT: {{ metric.sit }}m @if
                      (metric.isIntegrated) {
                      <span> • Integrated</span>
                      }
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
              </div>
              }
            </div>
          </div>
          } }

          <!-- Connections -->
          <div>
            <h4
              class="text-sm font-semibold text-gray-900 dark:text-white mb-2"
            >
              Connections
            </h4>
            <div class="grid grid-cols-2 gap-2">
              <div
                class="p-3 rounded-md bg-gray-100 dark:bg-gray-800 text-center"
              >
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Parents
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ node!.parents.length }}
                </p>
              </div>
              <div
                class="p-3 rounded-md bg-gray-100 dark:bg-gray-800 text-center"
              >
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Children
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ node!.children.length }}
                </p>
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
export class NodeDataPanelComponent {
  @Output() panelClose = new EventEmitter<void>();

  private readonly runtimeState = inject(RuntimeStateService);

  // Expose METRIC_FAMILIES for template
  readonly METRIC_FAMILIES = METRIC_FAMILIES;

  // State from RuntimeStateService
  readonly selectedNode = computed(() => {
    const nodeId = this.runtimeState.selectedNode();
    if (!nodeId) return null;

    const topology = this.runtimeState.topology();
    return (topology?.nodes.get(nodeId) as Node | undefined) || null;
  });

  readonly timeWindow = this.runtimeState.timeWindow;

  close(): void {
    this.runtimeState.setSelectedNode(null);
    this.panelClose.emit();
  }

  getMetricFamily(variableName: string): MetricFamily {
    const name = variableName.toLowerCase();
    if (name.includes('co2') || name.includes('emission')) return 'emissions';
    if (
      name.includes('power') ||
      name.includes('energy') ||
      name.includes('current') ||
      name.includes('voltage')
    )
      return 'energy';
    if (name.includes('temperature') || name.includes('humidity'))
      return 'environmental';
    return 'other';
  }

  getMetricFamilies(node: Node): MetricFamily[] {
    // Get all unique families present in metrics
    const families = new Set<MetricFamily>();
    node.metrics.forEach((metric) => {
      families.add(this.getMetricFamily(metric.variable.name));
    });

    // Sort by order
    return Array.from(families).sort(
      (a, b) => METRIC_FAMILIES[a].order - METRIC_FAMILIES[b].order
    );
  }

  getMetricsForFamily(node: Node, family: MetricFamily): MetricDisplay[] {
    return node.metrics
      .filter((metric) => this.getMetricFamily(metric.variable.name) === family)
      .map((metric) => ({
        id: metric.variable.id,
        name: metric.variable.name,
        type: metric.variable.type,
        sit: metric.variable.sit,
        unit: metric.variable.unit,
        value: metric.value,
        isIntegrated: metric.variable.isIntegrated || false,
      }));
  }
}
