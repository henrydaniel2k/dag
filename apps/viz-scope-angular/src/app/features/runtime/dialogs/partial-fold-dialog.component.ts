/**
 * Partial Fold Dialog Component
 * Modal dialog for selecting specific nodes to fold into a meta-node
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NodeType, Node } from '../../../models';

export interface PartialFoldDialogData {
  nodeType: NodeType;
  nodes: Node[];
  getNodeName: (nodeId: string) => string;
}

export interface PartialFoldDialogResult {
  nodeIds: string[];
  foldAll: boolean;
}

@Component({
  selector: 'app-partial-fold-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <!-- Icon placeholder -->
      <span class="w-5 h-5 rounded bg-blue-500"></span>
      <span>Partial Fold: {{ data.nodeType }}</span>
    </h2>

    <mat-dialog-content>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Select which {{ data.nodeType }} nodes to fold into a meta-node.
      </p>

      <div class="max-h-[400px] overflow-y-auto space-y-2">
        @for (node of data.nodes; track node.id) {
        <div
          role="button"
          tabindex="0"
          class="flex items-center gap-3 p-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          (click)="toggleNode(node.id)"
          (keyup.enter)="toggleNode(node.id)"
          (keyup.space)="toggleNode(node.id)"
        >
          <mat-checkbox
            [checked]="selectedNodeIds.has(node.id)"
            (change)="toggleNode(node.id)"
            (click)="$event.stopPropagation()"
          />
          <div class="flex-1 min-w-0">
            <div
              class="text-sm font-medium text-gray-900 dark:text-white truncate"
            >
              {{ data.getNodeName(node.id) }}
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400">
              {{ node.id }}
            </div>
          </div>
        </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-stroked-button (click)="onFoldAll()">Fold All</button>
      <button
        mat-raised-button
        color="primary"
        (click)="onFoldSelected()"
        [disabled]="selectedNodeIds.size === 0"
      >
        Fold Selected ({{ selectedNodeIds.size }})
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      mat-dialog-content {
        min-width: 400px;
        max-width: 500px;
      }
    `,
  ],
})
export class PartialFoldDialogComponent {
  readonly dialogRef = inject(MatDialogRef<PartialFoldDialogComponent>);
  readonly data = inject<PartialFoldDialogData>(MAT_DIALOG_DATA);

  selectedNodeIds = new Set<string>();

  toggleNode(nodeId: string): void {
    if (this.selectedNodeIds.has(nodeId)) {
      this.selectedNodeIds.delete(nodeId);
    } else {
      this.selectedNodeIds.add(nodeId);
    }
    // Trigger change detection
    this.selectedNodeIds = new Set(this.selectedNodeIds);
  }

  onFoldSelected(): void {
    if (this.selectedNodeIds.size > 0) {
      const result: PartialFoldDialogResult = {
        nodeIds: Array.from(this.selectedNodeIds),
        foldAll: false,
      };
      this.dialogRef.close(result);
    }
  }

  onFoldAll(): void {
    const result: PartialFoldDialogResult = {
      nodeIds: this.data.nodes.map((n: Node) => n.id),
      foldAll: true,
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
