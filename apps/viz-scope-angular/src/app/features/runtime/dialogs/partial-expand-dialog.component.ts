/**
 * Partial Expand Dialog Component
 * Modal dialog for selecting specific nodes to expand from a meta-node
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
import { MetaNode } from '../../../models';

export interface PartialExpandDialogData {
  metaNode: MetaNode;
  getNodeName: (nodeId: string) => string;
}

export interface PartialExpandDialogResult {
  nodeIds: string[];
  expandAll: boolean;
}

@Component({
  selector: 'app-partial-expand-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>Expand Nodes from {{ data.metaNode.type }}</h2>

    <mat-dialog-content>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Select which nodes to expand from this meta-node ({{
          data.metaNode.count
        }}
        nodes)
      </p>

      <div class="max-h-[400px] overflow-y-auto space-y-2">
        @for (nodeId of data.metaNode.nodeIds; track nodeId) {
        <div class="flex items-center gap-2">
          <mat-checkbox
            [checked]="selectedNodeIds.has(nodeId)"
            (change)="toggleNode(nodeId)"
          />
          <span
            role="button"
            tabindex="0"
            class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer flex-1"
            (click)="toggleNode(nodeId)"
            (keyup.enter)="toggleNode(nodeId)"
            (keyup.space)="toggleNode(nodeId)"
          >
            {{ data.getNodeName(nodeId) }}
          </span>
        </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-stroked-button (click)="onExpandAll()">Expand All</button>
      <button
        mat-raised-button
        color="primary"
        (click)="onExpandSelected()"
        [disabled]="selectedNodeIds.size === 0"
      >
        Expand Selected ({{ selectedNodeIds.size }})
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
export class PartialExpandDialogComponent {
  readonly dialogRef = inject(MatDialogRef<PartialExpandDialogComponent>);
  readonly data = inject<PartialExpandDialogData>(MAT_DIALOG_DATA);

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

  onExpandSelected(): void {
    if (this.selectedNodeIds.size > 0) {
      const result: PartialExpandDialogResult = {
        nodeIds: Array.from(this.selectedNodeIds),
        expandAll: false,
      };
      this.dialogRef.close(result);
    }
  }

  onExpandAll(): void {
    const result: PartialExpandDialogResult = {
      nodeIds: [...this.data.metaNode.nodeIds],
      expandAll: true,
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
