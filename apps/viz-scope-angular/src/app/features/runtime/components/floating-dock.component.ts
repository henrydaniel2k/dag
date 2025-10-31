/**
 * Floating Dock Component
 * Floating toolbar for pan/select tools and undo/redo
 */

import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHand,
  faArrowPointer,
  faRotateLeft,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import * as go from 'gojs';

export type ToolMode = 'pan' | 'select';

@Component({
  selector: 'app-floating-dock',
  standalone: true,
  imports: [CommonModule, MatButtonModule, FontAwesomeModule, MatTooltipModule],
  template: `
    <div class="floating-dock">
      <!-- Pan button -->
      <button
        mat-icon-button
        [class.active]="toolMode() === 'pan'"
        [disabled]="!diagram"
        (click)="handlePanClick()"
        matTooltip="Pan (Hand tool)"
        aria-label="Pan tool"
      >
        <fa-icon [icon]="faHand" />
      </button>

      <!-- Select button -->
      <button
        mat-icon-button
        [class.active]="toolMode() === 'select'"
        [disabled]="!diagram"
        (click)="handleSelectClick()"
        matTooltip="Select"
        aria-label="Select tool"
      >
        <fa-icon [icon]="faArrowPointer" />
      </button>

      <!-- Separator -->
      <div class="separator"></div>

      <!-- Undo button -->
      <button
        mat-icon-button
        [disabled]="!canUndo()"
        (click)="handleUndo()"
        matTooltip="Undo"
        aria-label="Undo"
      >
        <fa-icon [icon]="faRotateLeft" />
      </button>

      <!-- Redo button -->
      <button
        mat-icon-button
        [disabled]="!canRedo()"
        (click)="handleRedo()"
        matTooltip="Redo"
        aria-label="Redo"
      >
        <fa-icon [icon]="faRotateRight" />
      </button>
    </div>
  `,
  styles: [
    `
      .floating-dock {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 50;

        display: flex;
        align-items: center;
        gap: 6px;
        height: 44px;
        padding: 0 8px;
        border-radius: 9999px;

        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 10px 15px -3px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(8px);
      }

      :host-context(.dark) .floating-dock {
        background: rgba(31, 41, 55, 0.95);
        border-color: rgba(255, 255, 255, 0.1);
      }

      button {
        width: 36px;
        height: 36px;
        transition: all 150ms ease;

        fa-icon {
          font-size: 18px;
        }

        &.active {
          background-color: rgba(0, 0, 0, 0.08);
          color: rgba(0, 0, 0, 0.87);
        }

        &:not(.active):not(:disabled):hover {
          background-color: rgba(0, 0, 0, 0.04);
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }

      :host-context(.dark) button {
        &.active {
          background-color: rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.87);
        }

        &:not(.active):not(:disabled):hover {
          background-color: rgba(255, 255, 255, 0.08);
        }
      }

      .separator {
        width: 1px;
        height: 20px;
        background-color: rgba(0, 0, 0, 0.12);
        margin: 0 2px;
      }

      :host-context(.dark) .separator {
        background-color: rgba(255, 255, 255, 0.12);
      }
    `,
  ],
})
export class FloatingDockComponent implements OnChanges {
  @Input() diagram: go.Diagram | null = null;

  // FontAwesome icons
  faHand = faHand;
  faArrowPointer = faArrowPointer;
  faRotateLeft = faRotateLeft;
  faRotateRight = faRotateRight;

  // Signals for reactive state
  toolMode = signal<ToolMode>('pan');
  canUndo = signal(false);
  canRedo = signal(false);

  private modelChangedListener: ((e: go.ChangedEvent) => void) | null = null;

  constructor() {
    // Effect to setup diagram listeners when diagram changes
    effect(
      () => {
        const diagram = this.diagram;
        if (!diagram) return;

        this.setupDiagram(diagram);
      },
      { allowSignalWrites: true }
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['diagram']) {
      // Cleanup old listener
      if (
        this.modelChangedListener &&
        changes['diagram'].previousValue instanceof go.Diagram
      ) {
        const oldDiagram = changes['diagram'].previousValue as go.Diagram;
        oldDiagram.removeModelChangedListener(this.modelChangedListener);
      }

      // Setup new diagram
      if (this.diagram) {
        this.setupDiagram(this.diagram);
      }
    }
  }

  private setupDiagram(diagram: go.Diagram): void {
    // One-time initialization: enable infinite scroll
    diagram.commit((d) => {
      d.allowHorizontalScroll = true;
      d.allowVerticalScroll = true;
      d.scrollMode = go.Diagram.InfiniteScroll;
    }, 'init-scroll');

    // Set pan mode as default
    this.setPanMode(diagram);

    // Update cursor during panning
    const panTool = diagram.toolManager.panningTool;
    const originalDoMouseDown = panTool.doMouseDown;
    const originalDoMouseUp = panTool.doMouseUp;

    panTool.doMouseDown = function () {
      if (diagram.defaultCursor === 'grab') {
        const div = diagram.div as HTMLDivElement;
        div.style.cursor = 'grabbing';
      }
      originalDoMouseDown.call(this);
    };

    panTool.doMouseUp = function () {
      if (diagram.defaultCursor === 'grab') {
        const div = diagram.div as HTMLDivElement;
        div.style.cursor = 'grab';
      }
      originalDoMouseUp.call(this);
    };

    // Listen to model changes for undo/redo state
    this.modelChangedListener = () => {
      this.updateUndoRedoState(diagram);
    };
    diagram.addModelChangedListener(this.modelChangedListener);

    // Initial undo/redo state
    this.updateUndoRedoState(diagram);
  }

  private updateUndoRedoState(diagram: go.Diagram): void {
    this.canUndo.set(diagram.commandHandler.canUndo());
    this.canRedo.set(diagram.commandHandler.canRedo());
  }

  handlePanClick(): void {
    if (!this.diagram) return;
    this.setPanMode(this.diagram);
    this.toolMode.set('pan');
  }

  handleSelectClick(): void {
    if (!this.diagram) return;
    this.setSelectMode(this.diagram);
    this.toolMode.set('select');
  }

  handleUndo(): void {
    if (!this.diagram || !this.canUndo()) return;
    this.diagram.commandHandler.undo();
  }

  handleRedo(): void {
    if (!this.diagram || !this.canRedo()) return;
    this.diagram.commandHandler.redo();
  }

  private setPanMode(diagram: go.Diagram): void {
    diagram.commit((d) => {
      d.toolManager.panningTool.isEnabled = true;
      d.toolManager.dragSelectingTool.isEnabled = false;
      d.toolManager.draggingTool.isEnabled = false;
      d.defaultCursor = 'grab';
    }, 'tool-pan');

    const div = diagram.div as HTMLDivElement;
    div.style.cursor = 'grab';
  }

  private setSelectMode(diagram: go.Diagram): void {
    diagram.commit((d) => {
      d.toolManager.panningTool.isEnabled = false;
      d.toolManager.dragSelectingTool.isEnabled = true;
      d.toolManager.draggingTool.isEnabled = true;
      d.defaultCursor = 'default';
    }, 'tool-select');

    const div = diagram.div as HTMLDivElement;
    div.style.cursor = 'default';
  }
}
