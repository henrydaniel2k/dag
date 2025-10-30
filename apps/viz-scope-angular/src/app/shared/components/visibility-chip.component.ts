/**
 * Visibility Chip Component
 * Shows a node type with visibility toggle
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeType } from '../../models';

@Component({
  selector: 'app-visibility-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      [disabled]="isDisabled"
      [attr.aria-pressed]="isVisible"
      [attr.aria-disabled]="isDisabled"
      (click)="handleClick()"
      [class]="buttonClasses"
    >
      <!-- Icon placeholder -->
      <span class="w-3.5 h-3.5 rounded-sm bg-current opacity-60"></span>
      <span>{{ type }}</span>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `,
  ],
})
export class VisibilityChipComponent {
  @Input() type!: NodeType;
  @Input() isVisible = true;
  @Input() isDisabled = false;

  @Output() chipClick = new EventEmitter<void>();

  get buttonClasses(): string {
    const classes = [
      'h-8 px-3 text-xs font-medium transition-all duration-150 gap-1.5',
      'flex items-center rounded-md border',
    ];

    if (this.isVisible) {
      classes.push(
        'bg-blue-50 dark:bg-blue-950',
        'border-blue-300 dark:border-blue-700',
        'text-blue-900 dark:text-blue-100',
        'hover:brightness-110'
      );
    } else {
      classes.push(
        'bg-transparent',
        'border-gray-300 dark:border-gray-700',
        'text-gray-500 dark:text-gray-400',
        'opacity-60 hover:opacity-80'
      );
    }

    if (this.isDisabled) {
      classes.push('opacity-70 cursor-not-allowed');
    } else {
      classes.push('cursor-pointer');
    }

    return classes.join(' ');
  }

  handleClick(): void {
    if (!this.isDisabled) {
      this.chipClick.emit();
    }
  }
}
