# Task 7 Complete: GraphCanvas Component

✅ **Hoàn thành ngày**: 2025-10-30

## Tổng quan

Đã tạo **GraphCanvasComponent** - Angular wrapper component cho GojsService, hoàn toàn reactive với RuntimeStateService. Component này thay thế GraphCanvas.tsx từ React (~785 LOC) bằng architecture đơn giản hơn (~130 LOC) nhờ centralized state management.

---

## 1. GraphCanvasComponent

**File**: `features/runtime/components/graph-canvas.component.ts` (~130 LOC)

### Architecture:

```
RuntimeStateService (Signals)
         ↓
   GraphCanvasComponent (Effects)
         ↓
   GojsService (Diagram Management)
         ↓
   GoJS Diagram (Rendering)
```

### Template:

```html
<div #diagramContainer class="w-full h-full bg-graph-bg overflow-hidden"></div>
```

**Simple & Clean**: Chỉ 1 div container cho GoJS diagram.

### Component Structure:

#### Properties:

```typescript
@ViewChild('diagramContainer', { static: true })
diagramContainer!: ElementRef<HTMLDivElement>;

private diagram: go.Diagram | null = null;

private readonly runtimeState = inject(RuntimeStateService);
private readonly gojsService = inject(GojsService);
```

#### Lifecycle:

```typescript
ngOnInit(): void {
  this.initializeDiagram();
  this.setupEffects();
}

ngOnDestroy(): void {
  this.gojsService.dispose();
}
```

### Key Methods:

#### 1. initializeDiagram():

```typescript
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
```

**Purpose**: Initialize GoJS diagram với event callbacks đến RuntimeStateService.

#### 2. setupEffects():

```typescript
private setupEffects(): void {
  // Effect: Update diagram when ANY relevant state changes
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

    // Single update call with all data
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
```

**Purpose**:

- Track 9 computed signals from RuntimeStateService
- Automatically update diagram when ANY signal changes
- Single effect (no multiple useEffect hooks như React)

#### 3. getDiagram():

```typescript
getDiagram(): go.Diagram | null {
  return this.diagram;
}
```

**Purpose**: Expose diagram instance cho parent components (cho FloatingDock, etc.)

---

## 2. Event Flow

### User Interaction → State Update:

```
User clicks node
  ↓
GoJS fires click event
  ↓
Callback: onNodeClick(nodeId, isMultiSelect)
  ↓
runtimeState.handleNodeClick(nodeId, isMultiSelect)
  ↓
RuntimeStateService updates signals:
  - _selectedNodeIds.set(...)
  - _selectedNode.set(...)
  ↓
Effect triggers in GraphCanvasComponent
  ↓
gojsService.updateDiagram({ selectedNodeIds, ... })
  ↓
GojsService.syncSelection()
  ↓
GoJS diagram updates selection visual
```

### State Update → Visual Update:

```
User toggles type visibility
  ↓
runtimeState.toggleHiddenType('Server')
  ↓
RuntimeStateService computed signals recalculate:
  - visibleIdsBeforeFold()
  - visibleNodes()
  - unfoldedNodes()
  - metaNodes()
  - allLinks()
  ↓
Effect in GraphCanvasComponent detects changes
  ↓
gojsService.updateDiagram({ nodes, links, metaNodes })
  ↓
GojsService incremental update:
  - Remove Server nodes
  - Remove Server links
  - Smart layout (preserve camera)
  ↓
GoJS diagram re-renders
```

---

## 3. Callbacks Mapping

### React → Angular:

| React Prop                | Angular Callback          | State Method                |
| ------------------------- | ------------------------- | --------------------------- |
| `onNodeClick`             | `onNodeClick`             | `handleNodeClick()`         |
| `onMetaNodeClick`         | `onMetaNodeClick`         | `setExpandDialogMetaNode()` |
| `onSetAsMsn`              | ❌ (removed)              | Use context menu            |
| `onOpenDataPanel`         | ❌ (handled by onClick)   | Auto in `handleNodeClick()` |
| `onToggleFoldType`        | ❌ (removed)              | Use context menu            |
| `onOpenBranchPanel`       | ❌ (removed)              | Use context menu            |
| `onContextMenu`           | `onContextMenu`           | `setContextMenuState()`     |
| `onBackgroundContextMenu` | `onBackgroundContextMenu` | `setContextMenuState()`     |
| `onUnhideBranch`          | `onUnhideBranch`          | `unhideBranch()`            |

**Simplification**:

- ❌ Removed 4 callback props
- ✅ Use context menu for actions (setAsMsn, openDataPanel, toggleFold, openBranch)
- ✅ Single handleNodeClick handles both selection and data panel

---

## 4. RuntimePageComponent

**File**: `features/runtime/runtime-page.component.ts` (~110 LOC)

### Purpose:

Main page component orchestrating the entire runtime view.

### Template Structure:

```
<div class="flex h-screen">
  <!-- Navigation Sidebar -->
  <div class="w-64 border-r">
    <!-- TODO: Navigation component -->
  </div>

  <!-- Main Content -->
  <div class="flex-1 flex flex-col">
    <!-- Top Toolbar -->
    <div class="border-b px-4 py-2">
      <!-- TODO: Toolbar components -->
    </div>

    <!-- Graph View -->
    <div class="flex-1 flex" *ngIf="currentView === 'Graph View'">
      <!-- Quick Controls -->
      <div class="flex-1 flex flex-col">
        <div class="border-b">
          <!-- Stats display -->
        </div>

        <!-- GraphCanvas -->
        <div class="flex-1 relative">
          <app-graph-canvas></app-graph-canvas>
        </div>
      </div>

      <!-- Side Panels -->
      <div *ngIf="selectedNode" class="w-96 border-l">
        <!-- TODO: NodeDataPanel component -->
      </div>
    </div>

    <!-- Other Views -->
    <div class="flex-1" *ngIf="currentView !== 'Graph View'">
      Coming soon
    </div>
  </div>
</div>
```

### Features:

- ✅ Layout structure (sidebar + main + panels)
- ✅ GraphCanvas integration
- ✅ State binding (runtimeState.xxx())
- ✅ Conditional rendering (\*ngIf)
- 🔄 TODO: Navigation component (Task 8)
- 🔄 TODO: Toolbar components (Task 8)
- 🔄 TODO: QuickTypeControls (Task 8)
- 🔄 TODO: Side panels (Task 8)
- 🔄 TODO: Dialogs (Task 8)

### Component Class:

```typescript
export class RuntimePageComponent {
  @ViewChild(GraphCanvasComponent) graphCanvas?: GraphCanvasComponent;

  readonly runtimeState = inject(RuntimeStateService);

  constructor() {
    console.log('[RuntimePage] Initialized');
  }
}
```

**Simple**: Chỉ inject RuntimeStateService, không cần local state!

---

## 5. Routing

**File**: `app/app.routes.ts`

```typescript
export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./features/runtime/runtime-page.component').then(
        (m) => m.RuntimePageComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
```

**Features**:

- ✅ Lazy loading với `loadComponent()`
- ✅ Default route → RuntimePage
- ✅ Wildcard redirect

---

## 6. Comparison: React vs Angular

### React (GraphCanvas.tsx):

```tsx
// ~785 LOC
export const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(
  function GraphCanvas({
    nodes,           // Prop
    links,           // Prop
    metaNodes,       // Prop
    selectedNodeId,  // Prop
    selectedNodeIds, // Prop
    onNodeClick,     // Prop
    onMetaNodeClick, // Prop
    // ... 20+ props
  }, ref) {
    const diagramRef = useRef<HTMLDivElement>(null);
    const diagram = useRef<go.Diagram | null>(null);
    const handlersRef = useRef({ ... }); // Avoid recreation

    // Initialize diagram (once)
    useEffect(() => {
      // 400 LOC of template setup
    }, []);

    // Update diagram data
    useEffect(() => {
      // 300 LOC of incremental update logic
    }, [nodes, metaNodes, links, overlayMetric, ...]);

    // Sync selection
    useEffect(() => {
      // 20 LOC
    }, [selectedNodeIds]);

    // Apply theme
    useEffect(() => {
      // 30 LOC with MutationObserver
    }, []);

    return <div ref={diagramRef} className="..." />;
  }
);
```

**Issues**:

- 🔴 20+ props (prop drilling)
- 🔴 4 useEffect hooks (complex dependencies)
- 🔴 Template setup mixed with component
- 🔴 Update logic in component
- 🔴 Ref juggling (diagramRef, diagram, handlersRef)

### Angular (GraphCanvasComponent):

```typescript
// ~130 LOC
export class GraphCanvasComponent implements OnInit, OnDestroy {
  @ViewChild('diagramContainer', { static: true })
  diagramContainer!: ElementRef<HTMLDivElement>;

  private diagram: go.Diagram | null = null;

  private readonly runtimeState = inject(RuntimeStateService);
  private readonly gojsService = inject(GojsService);

  ngOnInit(): void {
    this.initializeDiagram();  // ~40 LOC
    this.setupEffects();       // ~20 LOC
  }

  ngOnDestroy(): void {
    this.gojsService.dispose();
  }

  private initializeDiagram(): void { /* ... */ }
  private setupEffects(): void {
    effect(() => {
      // Single effect tracking 9 signals
      this.gojsService.updateDiagram({ ... });
    });
  }
}
```

**Benefits**:

- ✅ **Zero props** (use RuntimeStateService)
- ✅ **Single effect** (automatic tracking)
- ✅ **Separation of concerns** (GojsService handles GoJS)
- ✅ **Clean template** (just container div)
- ✅ **Type-safe** (inject() pattern)
- ✅ **~6x smaller** (130 vs 785 LOC)

---

## 7. Effect Reactivity

### Tracked Signals (9):

```typescript
effect(() => {
  const nodes = this.runtimeState.unfoldedNodes();           // Computed
  const links = this.runtimeState.allLinks();                // Computed
  const metaNodes = this.runtimeState.metaNodes();           // Computed
  const overlayMetric = this.runtimeState.overlayMetric();   // Signal
  const branchRoot = this.runtimeState.branchRootNode();     // Signal
  const topology = this.runtimeState.topology();             // Computed
  const scope = this.runtimeState.scope();                   // Computed
  const hiddenBranchRoots = this.runtimeState.hiddenBranchRoots(); // Signal
  const selectedNodeIds = this.runtimeState.selectedNodeIds(); // Signal

  this.gojsService.updateDiagram({ ... });
});
```

**Automatic tracking**: Effect re-runs when **ANY** of these signals change.

### Propagation Example:

```
User toggles hiddenTypes
  ↓
RuntimeStateService:
  _hiddenTypes signal updates
  ↓
  visibleIdsBeforeFold() recomputes
  ↓
  visibleIdsAfterBranchHide() recomputes
  ↓
  visibleNodes() recomputes
  ↓
  unfoldedNodes() recomputes ← Tracked by effect
  ↓
  metaNodes() recomputes ← Tracked by effect
  ↓
  directLinks() recomputes
  ↓
  allLinks() recomputes ← Tracked by effect
  ↓
GraphCanvasComponent:
  effect() detects changes in unfoldedNodes, metaNodes, allLinks
  ↓
  Calls gojsService.updateDiagram()
  ↓
GoJS diagram updates incrementally
```

**Efficiency**: Only 1 effect execution, even though 3 signals changed (batched).

---

## 8. Memory Management

### Component Lifecycle:

#### OnInit:

```typescript
ngOnInit(): void {
  this.initializeDiagram();  // Create diagram
  this.setupEffects();       // Register effect
}
```

#### OnDestroy:

```typescript
ngOnDestroy(): void {
  this.gojsService.dispose(); // Cleanup:
  // - Set diagram.div = null
  // - Clear diagram reference
  // - Clear previous keys
}
```

**Effect cleanup**: Automatic! Angular destroys effect when component destroyed.

---

## 9. Testing Strategy

### Unit Tests:

```typescript
describe('GraphCanvasComponent', () => {
  let component: GraphCanvasComponent;
  let runtimeState: RuntimeStateService;
  let gojsService: GojsService;

  beforeEach(() => {
    // Setup TestBed with mocks
  });

  it('should initialize diagram on ngOnInit', () => {
    component.ngOnInit();
    expect(gojsService.initializeDiagram).toHaveBeenCalled();
  });

  it('should update diagram when state changes', () => {
    // Trigger state change
    runtimeState.setSelectedMsn('new-msn');

    // Verify updateDiagram called
    expect(gojsService.updateDiagram).toHaveBeenCalled();
  });

  it('should dispose on ngOnDestroy', () => {
    component.ngOnDestroy();
    expect(gojsService.dispose).toHaveBeenCalled();
  });
});
```

### Integration Tests:

```typescript
describe('GraphCanvas Integration', () => {
  it('should handle node click', () => {
    // Simulate GoJS click event
    const callback = component['callbacks'].onNodeClick;
    callback('node-1', false);

    // Verify state updated
    expect(runtimeState.selectedNode()).toBe('node-1');
  });

  it('should update diagram when type hidden', () => {
    runtimeState.toggleHiddenType('Server');

    // Wait for effect
    fixture.detectChanges();

    // Verify diagram updated
    const diagram = gojsService.getDiagram();
    expect(diagram?.model.nodeDataArray.length).toBeLessThan(initialCount);
  });
});
```

---

## 10. Files Created

1. **graph-canvas.component.ts** (~130 LOC)
   - Component class
   - Template (1 div)
   - Styles (display: block)
2. **components/index.ts** (~5 LOC)
   - Barrel export
3. **runtime-page.component.ts** (~110 LOC)

   - Page component
   - Layout template
   - State binding

4. **app.routes.ts** (updated)
   - Lazy loading route
   - Default + wildcard

**Total**: ~245 LOC (vs React ~785 LOC + RuntimePage ~700 LOC = ~1,485 LOC)

---

## 11. Next Steps

### Task 8: UI Components Migration - Phase 1 (Panels)

Components to migrate:

1. **Navigation** - Sidebar với MANTO/MSN selector
2. **Toolbar** - View menu, metric selector, theme toggle, immersive toggle
3. **QuickNodeTypeControls** - Type visibility chips với badges
4. **NodeTypePanel** - Slide-over panel với type management
5. **NodeGroupPanel** - Node list panel với bulk actions
6. **NodeDataPanel** - Node details panel
7. **BranchDataPanel** - Branch analytics panel
8. **PartialFoldDialog** - Select nodes to fold
9. **PartialExpandDialog** - Select nodes to expand
10. **ContextMenu** - Right-click menu portal
11. **FoldSelectedButton** - Floating action button
12. **FloatingDock** - Zoom controls

**Framework**: ng-zorro-antd (Ant Design for Angular)

**Integration**: All components inject RuntimeStateService directly

---

## Summary

✅ **Task 7 Complete**: GraphCanvas Component

**Achievements**:

- ✅ ~130 LOC component (vs ~785 LOC React)
- ✅ Zero props (centralized state)
- ✅ Single effect (automatic tracking)
- ✅ Clean separation (component → service → GoJS)
- ✅ Type-safe with inject()
- ✅ Reactive with Signals
- ✅ Lazy loaded routing

**Architecture**:

```
RuntimeStateService (Central State)
         ↓
GraphCanvasComponent (View Layer)
         ↓
GojsService (GoJS Bridge)
         ↓
GoJS Diagram (Rendering)
```

**Ready for**: Task 8 - UI Components với ng-zorro-antd! 🚀
