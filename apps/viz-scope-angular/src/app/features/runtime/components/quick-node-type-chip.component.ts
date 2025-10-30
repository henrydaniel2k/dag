/**
 * Quick Node Type Chip Component
 * Individual chip displaying node type with visibility toggle
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeType } from '../../../models';

@Component({
  selector: 'app-quick-node-type-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      [attr.aria-pressed]="isVisible"
      [attr.aria-disabled]="isLocked"
      [disabled]="isLocked"
      (click)="handleClick($event)"
      [title]="tooltipText"
      [class]="chipClasses"
    >
      <!-- Icon placeholder -->
      <span class="w-4 h-4 rounded-sm bg-current opacity-60"></span>

      <!-- Type name -->
      <span class="text-xs select-none whitespace-nowrap">{{ type }}</span>

      <!-- Count -->
      @if (count !== undefined && count > 0) {
      <span class="text-[10px] text-muted-foreground ml-0.5">×{{ count }}</span>
      }

      <!-- Badges -->
      <div class="flex items-center gap-1 ml-1">
        @if (isLocked) {
        <span
          class="inline-flex items-center h-4 px-1.5 text-[10px] border rounded border-[var(--badge-lock)] text-[var(--badge-lock)]"
          aria-label="MSN type cannot be hidden"
        >
          🔒
        </span>
        } @if (isAutoFolded && !isLocked) {
        <span
          class="inline-flex items-center h-4 px-1.5 text-[10px] border rounded border-[var(--badge-auto)] text-[var(--badge-auto)]"
          aria-label="Auto-folded"
        >
          AUTO
        </span>
        } @if (isPartialFolded && !isLocked) {
        <span
          class="inline-flex items-center h-4 px-1.5 text-[10px] border rounded border-[var(--badge-partial)] text-[var(--badge-partial)]"
          aria-label="Partially folded"
        >
          PARTIAL
        </span>
        }
      </div>
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
export class QuickNodeTypeChipComponent {
  @Input() type!: NodeType;
  @Input() isVisible = true;
  @Input() isLocked = false;
  @Input() isAutoFolded = false;
  @Input() isPartialFolded = false;
  @Input() count?: number;

  @Output() chipClick = new EventEmitter<void>();

  get tooltipText(): string {
    if (this.isLocked) {
      return 'MSN type cannot be hidden';
    }
    return `${this.isVisible ? 'Hide' : 'Show'} ${this.type} in current scope`;
  }

  get chipClasses(): string {
    const baseClasses = [
      'flex items-center gap-1.5 px-2 py-1 h-8 rounded-md border text-sm transition-all',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    ];

    if (this.isVisible) {
      baseClasses.push(
        'bg-[var(--chip-visible-bg)] border-[var(--chip-visible-border)] text-[var(--chip-visible-text)]',
      );
    } else {
      baseClasses.push('bg-transparent border-border text-muted-foreground opacity-60');
    }

    if (this.isLocked) {
      baseClasses.push('cursor-not-allowed opacity-70');
    } else {
      baseClasses.push('hover:brightness-110 cursor-pointer');
    }

    return baseClasses.join(' ');
  }

  handleClick(event: MouseEvent): void {
    event.preventDefault();
    if (!this.isLocked) {
      this.chipClick.emit();
    }
  }
}
