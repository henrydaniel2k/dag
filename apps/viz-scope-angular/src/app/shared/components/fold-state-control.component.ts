/**
 * Fold State Segmented Control Component
 * 3-button control for fold/partial/unfold states
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChevronDown,
  faChevronUp,
  faArrowsUpDown,
} from '@fortawesome/free-solid-svg-icons';

export type FoldState = 'unfolded' | 'folded' | 'partial';

@Component({
  selector: 'app-fold-state-control',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div
      class="inline-flex rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden"
    >
      <!-- Fold All Button -->
      <button
        type="button"
        [disabled]="disabled"
        (click)="foldAll.emit()"
        [title]="getTooltip('fold')"
        [class]="getButtonClass('folded')"
      >
        <fa-icon [icon]="faChevronDown" />
      </button>

      <!-- Partial Fold Button -->
      <button
        type="button"
        [disabled]="disabled"
        (click)="partialFold.emit()"
        [title]="getTooltip('partial')"
        [class]="getButtonClass('partial')"
      >
        <fa-icon [icon]="faArrowsUpDown" />
      </button>

      <!-- Unfold All Button -->
      <button
        type="button"
        [disabled]="disabled"
        (click)="unfoldAll.emit()"
        [title]="getTooltip('unfold')"
        [class]="getButtonClass('unfolded')"
      >
        <fa-icon [icon]="faChevronUp" />
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `,
  ],
})
export class FoldStateSegmentedControlComponent {
  @Input() foldState: FoldState = 'unfolded';
  @Input() disabled = false;
  @Input() disabledReason?: 'hidden' | 'not-foldable' | 'no-nodes';
  @Input() typeName = 'nodes';

  @Output() foldAll = new EventEmitter<void>();
  @Output() partialFold = new EventEmitter<void>();
  @Output() unfoldAll = new EventEmitter<void>();

  // FontAwesome icons
  faChevronDown = faChevronDown;
  faChevronUp = faChevronUp;
  faArrowsUpDown = faArrowsUpDown;

  getButtonClass(state: FoldState): string {
    const classes = [
      'h-8 w-9 px-0 transition-colors',
      'hover:bg-gray-100 dark:hover:bg-gray-800',
    ];

    // Border between buttons
    if (state === 'folded' || state === 'partial') {
      classes.push('border-r border-gray-300 dark:border-gray-700');
    }

    // Active state
    if (this.foldState === state) {
      classes.push(
        'bg-blue-50 dark:bg-blue-950',
        'text-blue-900 dark:text-blue-100'
      );
    }

    // Disabled state
    if (this.disabled) {
      classes.push('opacity-50 cursor-not-allowed');
    } else {
      classes.push('cursor-pointer');
    }

    return classes.join(' ');
  }

  getTooltip(action: 'fold' | 'partial' | 'unfold'): string {
    if (this.disabled) {
      if (this.disabledReason === 'hidden') {
        return `Unhide ${this.typeName} to manage folding`;
      }
      if (this.disabledReason === 'not-foldable') {
        return 'Folding not applicable';
      }
      if (this.disabledReason === 'no-nodes') {
        return `No ${this.typeName} nodes in this scope`;
      }
    }

    if (action === 'fold') return `Fold all ${this.typeName}`;
    if (action === 'partial') return `Partial fold ${this.typeName}`;
    return `Unfold all ${this.typeName}`;
  }
}
