/**
 * Graph Canvas Component
 * Angular wrapper for GoJS diagram integration
 *
 * This component bridges RuntimeStateService with GojsService to render
 * the interactive node graph. It subscribes to state signals and updates
 * the diagram incrementally.
 */

import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as go from 'gojs';
import { RuntimeStateService } from '../../../core/services/runtime-state.service';
import {
  GojsService,
  DiagramCallbacks,
} from '../../../core/services/gojs.service';

@Component({
  selector: 'app-graph-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #diagramContainer
      class="w-full h-full bg-graph-bg overflow-hidden"
    ></div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class GraphCanvasComponent implements OnInit, OnDestroy {
  @ViewChild('diagramContainer', { static: true })
  diagramContainer!: ElementRef<HTMLDivElement>;

  private diagram: go.Diagram | null = null;

  // Inject services
  private readonly runtimeState = inject(RuntimeStateService);
  private readonly gojsService = inject(GojsService);

  ngOnInit(): void {
    this.initializeDiagram();
    this.setupEffects();
  }

  ngOnDestroy(): void {
    this.gojsService.dispose();
  }

  /**
   * Initialize GoJS diagram with callbacks
   */
  private initializeDiagram(): void {
    if (!this.diagramContainer?.nativeElement) return;

    const callbacks: DiagramCallbacks = {
      onNodeClick: (nodeId: string, isMultiSelect: boolean) => {
        this.runtimeState.handleNodeClick(nodeId, isMultiSelect);
      },
      onMetaNodeClick: (metaNode) => {
        this.runtimeState.setExpandDialogMetaNode(metaNode);
      },
      onContextMenu: (data) => {
        this.runtimeState.setContextMenuState({
          isOpen: true,
          x: data.x,
          y: data.y,
          nodeId: data.nodeId,
          canOpenBranch: data.canOpenBranch,
        });
      },
      onBackgroundContextMenu: (x: number, y: number) => {
        this.runtimeState.setContextMenuState({
          isOpen: true,
          x,
          y,
          canOpenBranch: false,
        });
      },
      onUnhideBranch: (rootId: string) => {
        this.runtimeState.unhideBranch(rootId);
      },
    };

    this.diagram = this.gojsService.initializeDiagram(
      this.diagramContainer.nativeElement,
      callbacks
    );
  }

  /**
   * Setup reactive effects for diagram updates
   */
  private setupEffects(): void {
    // Effect 1: Update diagram when data changes
    effect(() => {
      const nodes = this.runtimeState.unfoldedNodes();
      const links = this.runtimeState.allLinks();
      const metaNodes = this.runtimeState.metaNodes();
      const overlayMetric = this.runtimeState.overlayMetric();
      const branchRoot = this.runtimeState.branchRootNode();
      const topology = this.runtimeState.topology();
      const scope = this.runtimeState.scope();
      const hiddenBranchRoots = this.runtimeState.hiddenBranchRoots();
      const selectedNodeIds = this.runtimeState.selectedNodeIds();

      // Update diagram with new data
      this.gojsService.updateDiagram({
        nodes,
        links,
        metaNodes,
        overlayMetric,
        highlightedBranchRoot: branchRoot,
        topology,
        scope,
        hiddenBranchRoots,
        selectedNodeIds,
      });
    });
  }

  /**
   * Get diagram instance (for parent components)
   */
  getDiagram(): go.Diagram | null {
    return this.diagram;
  }
}
