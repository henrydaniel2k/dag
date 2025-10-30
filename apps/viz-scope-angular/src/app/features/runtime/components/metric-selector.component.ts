/**
 * Metric Selector Component
 * Dropdown selectors for overlay metric and time window
 */

import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Variable, TimeWindow } from '../../../models';
import { getAllowedWindows } from '../../../core/services/time-window.service';

@Component({
  selector: 'app-metric-selector',
  standalone: true,
  imports: [CommonModule, MatSelectModule, MatFormFieldModule],
  template: `
    <div
      class="flex items-center gap-4 p-4 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
    >
      <!-- Metric Selector -->
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium whitespace-nowrap">
          Overlay Metric:
        </label>
        <mat-form-field appearance="outline" class="metric-select">
          <mat-select
            [value]="selectedMetric?.id || 'none'"
            (selectionChange)="onMetricChange($event.value)"
          >
            <mat-option value="none">None</mat-option>
            @for (variable of availableVariables; track variable.id) {
            <mat-option [value]="variable.id">
              {{ variable.name }} ({{ variable.unit }})
            </mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Time Window Selector -->
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium whitespace-nowrap">
          Time Window:
        </label>
        <mat-form-field appearance="outline" class="window-select">
          <mat-select
            [value]="selectedWindow"
            (selectionChange)="windowChange.emit($event.value)"
          >
            @for (window of allowedWindows(); track window) {
            <mat-option [value]="window">{{ window }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      ::ng-deep {
        .metric-select .mat-mdc-form-field-infix {
          width: 180px;
        }

        .window-select .mat-mdc-form-field-infix {
          width: 140px;
        }

        .metric-select,
        .window-select {
          .mat-mdc-text-field-wrapper {
            padding: 0;
          }

          .mat-mdc-form-field-subscript-wrapper {
            display: none;
          }
        }
      }
    `,
  ],
})
export class MetricSelectorComponent {
  @Input() selectedMetric: Variable | null = null;
  @Input() selectedWindow: TimeWindow = 'Latest';
  @Input() availableVariables: Variable[] = [];

  @Output() metricChange = new EventEmitter<Variable | null>();
  @Output() windowChange = new EventEmitter<TimeWindow>();

  // Computed allowed windows based on selected metric
  readonly allowedWindows = computed<TimeWindow[]>(() => {
    if (this.selectedMetric) {
      return getAllowedWindows(this.selectedMetric);
    }
    return [
      'Latest',
      '15m',
      '1h',
      '3h',
      '12h',
      '24h',
      '3d',
      '7d',
      '14d',
      '30d',
      'Custom',
    ] as TimeWindow[];
  });

  onMetricChange(metricId: string): void {
    if (metricId === 'none') {
      this.metricChange.emit(null);
    } else {
      const metric = this.availableVariables.find((v) => v.id === metricId);
      if (metric) {
        this.metricChange.emit(metric);
      }
    }
  }
}
