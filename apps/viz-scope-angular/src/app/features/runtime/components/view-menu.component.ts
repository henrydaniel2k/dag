/**
 * View Menu Component
 * Dropdown menu for switching between different views
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type ViewType =
  | 'Physical View'
  | 'Graph View'
  | 'Data Reports'
  | 'Alerts'
  | 'Data Inputs';

@Component({
  selector: 'app-view-menu',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatIconModule],
  template: `
    <div class="flex items-center gap-2 px-4 py-2">
      <button mat-icon-button [matMenuTriggerFor]="menu">
        <mat-icon>menu</mat-icon>
      </button>

      <mat-menu #menu="matMenu">
        @for (view of views; track view) {
        <button
          mat-menu-item
          (click)="viewChange.emit(view)"
          [class.bg-accent]="currentView === view"
        >
          {{ view }}
        </button>
        }
      </mat-menu>

      <span class="text-sm font-medium">{{ currentView }}</span>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .bg-accent {
        background-color: rgba(59, 130, 246, 0.1);
      }
    `,
  ],
})
export class ViewMenuComponent {
  @Input() currentView: ViewType = 'Graph View';
  @Output() viewChange = new EventEmitter<ViewType>();

  readonly views: ViewType[] = [
    'Physical View',
    'Graph View',
    'Data Reports',
    'Alerts',
    'Data Inputs',
  ];
}
