/**
 * Immersive Toggle Component
 * Toggle switch for immersive/fullscreen mode
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLayerGroup, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-immersive-toggle',
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    FontAwesomeModule,
    MatTooltipModule,
  ],
  template: `
    <div
      class="flex items-center gap-2 px-4 py-2 border-l border-gray-300 dark:border-gray-700"
    >
      <div class="relative">
        <fa-icon
          [icon]="faLayerGroup"
          class="text-gray-600 dark:text-gray-400"
        />
        @if (immersiveMode) {
        <span
          class="absolute -top-1 -right-1 flex h-2 w-2"
          aria-label="Immersive mode active"
        >
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"
          ></span>
          <span
            class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"
          ></span>
        </span>
        }
      </div>

      <mat-slide-toggle
        [checked]="immersiveMode"
        (change)="toggle.emit($event.checked)"
        [disabled]="true"
        color="primary"
      >
        <span class="text-sm font-medium">Immersive</span>
      </mat-slide-toggle>

      <fa-icon
        [icon]="faCircleInfo"
        class="text-gray-600 dark:text-gray-400 cursor-help"
        matTooltip="Toggle Immersive Mode (I) - View multiple topologies simultaneously"
        matTooltipPosition="below"
      />
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      @keyframes ping {
        75%,
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }

      .animate-ping {
        animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
      }
    `,
  ],
})
export class ImmersiveToggleComponent {
  @Input() immersiveMode = false;
  @Output() toggle = new EventEmitter<boolean>();

  // FontAwesome icons
  faLayerGroup = faLayerGroup;
  faCircleInfo = faCircleInfo;
}
