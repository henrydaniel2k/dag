/**
 * Fold Selected Button Component
 * Floating button to fold multiple selected nodes
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-fold-selected-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatBadgeModule],
  template: `
    @if (selectedCount >= 2) {
    <button
      mat-raised-button
      color="primary"
      (click)="foldSelected.emit()"
      class="fold-selected-btn"
    >
      <mat-icon>unfold_less</mat-icon>
      <span>Fold Selected ({{ selectedCount }})</span>
    </button>
    }
  `,
  styles: [
    `
      .fold-selected-btn {
        position: fixed;
        bottom: 16px;
        right: 16px;
        z-index: 50;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
          0 2px 4px -2px rgb(0 0 0 / 0.1);

        mat-icon {
          margin-right: 8px;
        }
      }
    `,
  ],
})
export class FoldSelectedButtonComponent {
  @Input() selectedCount = 0;
  @Output() foldSelected = new EventEmitter<void>();
}
