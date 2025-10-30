# Migration Plan: viz-scope-link → viz-scope-angular

**Từ**: React + Vite + shadcn/ui → **Sang**: Angular 19+ + Angular Material  
**Ngày**: 30/10/2025  
**Status**: ✅ **COMPLETED** (15/16 tasks - 93.75%)

> **Note**: Đã hoàn thành migration với Angular Signals thay vì ng-zorro-antd. Sử dụng Angular Material 20.2.10 và standalone components.

---

## 📋 Tổng quan Migration

### Mục tiêu

Migrate toàn bộ ứng dụng viz-scope-link (React-based topology visualization) sang Angular framework với ng-zorro-antd component library, đảm bảo:

- ✅ Giữ nguyên 100% tính năng hiện tại
- ✅ Cấu trúc Angular chuẩn (feature modules, services, guards)
- ✅ Type-safe với TypeScript strict mode
- ✅ Performance tương đương hoặc tốt hơn
- ✅ Theming system nhất quán (dark/light mode)

### Phạm vi công việc

- **~3,000 LOC** business logic (TypeScript)
- **~5,000 LOC** UI components (React → Angular)
- **~500 LOC** mock data và testing
- **GoJS integration** (3.1.0) - giữ nguyên
- **15+ React components** → **Angular components**

---

## 🏗️ Cấu trúc thư mục Angular (Target)

```
apps/viz-scope-angular/
├── src/
│   ├── app/
│   │   ├── core/                    # Singleton services, guards, interceptors
│   │   │   ├── services/
│   │   │   │   ├── scope.service.ts
│   │   │   │   ├── folding.service.ts
│   │   │   │   ├── hops.service.ts
│   │   │   │   ├── theme.service.ts
│   │   │   │   ├── topology.service.ts
│   │   │   │   └── gojs.service.ts
│   │   │   ├── guards/
│   │   │   │   └── topology-loaded.guard.ts
│   │   │   └── core.module.ts
│   │   │
│   │   ├── shared/                  # Reusable components, directives, pipes
│   │   │   ├── components/
│   │   │   │   ├── node-type-icon/
│   │   │   │   ├── visibility-chip/
│   │   │   │   ├── quick-node-type-chip/
│   │   │   │   └── hidden-branch-cue/
│   │   │   ├── directives/
│   │   │   ├── pipes/
│   │   │   │   ├── type-index.pipe.ts
│   │   │   │   └── metric-format.pipe.ts
│   │   │   └── shared.module.ts
│   │   │
│   │   ├── features/                # Feature modules
│   │   │   ├── runtime/
│   │   │   │   ├── components/
│   │   │   │   │   ├── runtime-page/
│   │   │   │   │   ├── graph-canvas/
│   │   │   │   │   ├── navigation/
│   │   │   │   │   ├── floating-dock/
│   │   │   │   │   ├── node-data-panel/
│   │   │   │   │   ├── branch-data-panel/
│   │   │   │   │   ├── node-type-panel/
│   │   │   │   │   ├── node-group-panel/
│   │   │   │   │   ├── quick-node-type-controls/
│   │   │   │   │   ├── metric-selector/
│   │   │   │   │   ├── view-menu/
│   │   │   │   │   ├── fold-selected-button/
│   │   │   │   │   ├── fold-state-control/
│   │   │   │   │   ├── immersive-toggle/
│   │   │   │   │   ├── partial-fold-dialog/
│   │   │   │   │   ├── partial-expand-dialog/
│   │   │   │   │   └── context-menu-portal/
│   │   │   │   ├── services/
│   │   │   │   │   └── runtime-state.service.ts
│   │   │   │   └── runtime.module.ts
│   │   │   │
│   │   │   └── index/               # Legacy index page
│   │   │       └── index.module.ts
│   │   │
│   │   ├── models/                  # Data models & interfaces
│   │   │   ├── node.model.ts
│   │   │   ├── link.model.ts
│   │   │   ├── topology.model.ts
│   │   │   ├── variable.model.ts
│   │   │   ├── meta-node.model.ts
│   │   │   ├── branch-data.model.ts
│   │   │   ├── scope-config.model.ts
│   │   │   ├── types.ts             # Enums & type aliases
│   │   │   └── index.ts
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── app.html
│   │
│   ├── assets/
│   │   ├── mocks/
│   │   │   └── topologies.json
│   │   └── icons/
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   ├── styles/
│   │   ├── themes/
│   │   │   ├── _variables.scss
│   │   │   ├── _light-theme.scss
│   │   │   └── _dark-theme.scss
│   │   └── _gojs-theme.scss
│   │
│   ├── styles.scss                  # Global styles + ng-zorro imports
│   ├── main.ts
│   └── index.html
│
├── project.json
├── tsconfig.app.json
├── tsconfig.spec.json
└── README.md
```

---

## 📦 Component Mapping: React → Angular + ng-zorro-antd

### Phase 1: Core Components

| React Component       | Angular Component          | ng-zorro Components                 | Complexity |
| --------------------- | -------------------------- | ----------------------------------- | ---------- |
| `GraphCanvas.tsx`     | `GraphCanvasComponent`     | - (pure GoJS)                       | ⭐⭐⭐⭐⭐ |
| `Navigation.tsx`      | `NavigationComponent`      | `nz-layout`, `nz-menu`, `nz-select` | ⭐⭐⭐     |
| `FloatingDock.tsx`    | `FloatingDockComponent`    | `nz-button`, `nz-tooltip`           | ⭐⭐       |
| `HiddenBranchCue.tsx` | `HiddenBranchCueComponent` | `nz-badge`                          | ⭐         |

### Phase 2: Data Panels

| React Component       | Angular Component          | ng-zorro Components                       | Complexity |
| --------------------- | -------------------------- | ----------------------------------------- | ---------- |
| `NodeDataPanel.tsx`   | `NodeDataPanelComponent`   | `nz-drawer`, `nz-descriptions`, `nz-list` | ⭐⭐⭐⭐   |
| `BranchDataPanel.tsx` | `BranchDataPanelComponent` | `nz-drawer`, `nz-statistic`, `nz-table`   | ⭐⭐⭐⭐   |
| `NodeTypePanel.tsx`   | `NodeTypePanelComponent`   | `nz-drawer`, `nz-collapse`, `nz-switch`   | ⭐⭐⭐     |
| `NodeGroupPanel.tsx`  | `NodeGroupPanelComponent`  | `nz-drawer`, `nz-list`, `nz-checkbox`     | ⭐⭐⭐     |

### Phase 3: Control Components

| React Component                 | Angular Component                | ng-zorro Components          | Complexity |
| ------------------------------- | -------------------------------- | ---------------------------- | ---------- |
| `QuickNodeTypeControls.tsx`     | `QuickNodeTypeControlsComponent` | `nz-tag`, `nz-space`         | ⭐⭐       |
| `VisibilityChip.tsx`            | `VisibilityChipComponent`        | `nz-tag` + custom directive  | ⭐⭐       |
| `QuickNodeTypeChip.tsx`         | `QuickNodeTypeChipComponent`     | `nz-tag`, `nz-badge`         | ⭐⭐       |
| `MetricSelector.tsx`            | `MetricSelectorComponent`        | `nz-select`, `nz-cascader`   | ⭐⭐⭐     |
| `ViewMenu.tsx`                  | `ViewMenuComponent`              | `nz-dropdown`, `nz-menu`     | ⭐⭐       |
| `FoldSelectedButton.tsx`        | `FoldSelectedButtonComponent`    | `nz-button`, `nz-popconfirm` | ⭐⭐       |
| `FoldStateSegmentedControl.tsx` | `FoldStateControlComponent`      | `nz-segmented`               | ⭐⭐       |
| `ImmersiveToggle.tsx`           | `ImmersiveToggleComponent`       | `nz-button`, `nz-tooltip`    | ⭐         |

### Phase 4: Dialogs & Menus

| React Component           | Angular Component                         | ng-zorro Components                          | Complexity |
| ------------------------- | ----------------------------------------- | -------------------------------------------- | ---------- |
| `PartialFoldDialog.tsx`   | `PartialFoldDialogComponent`              | `nz-modal`, `nz-checkbox-group`, `nz-button` | ⭐⭐⭐     |
| `PartialExpandDialog.tsx` | `PartialExpandDialogComponent`            | `nz-modal`, `nz-checkbox-group`, `nz-button` | ⭐⭐⭐     |
| `NodeContextMenu.tsx`     | `NodeContextMenuComponent`                | `nz-dropdown`, `nz-menu`                     | ⭐⭐⭐     |
| `ContextMenuPortal.tsx`   | Integrated vào `NodeContextMenuComponent` | `nz-dropdown` (overlay)                      | ⭐⭐       |

### Phase 5: Icons

| React Component    | Angular Component       | ng-zorro Components    | Complexity |
| ------------------ | ----------------------- | ---------------------- | ---------- |
| `NodeTypeIcon.tsx` | `NodeTypeIconComponent` | `nz-icon` (custom SVG) | ⭐⭐       |

---

## 🔄 Business Logic Migration: React Hooks → Angular Services

### Core Services (từ `src/lib/`)

#### 1. **ScopeService** (từ `scope.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class ScopeService {
  computeScope(msnId: string, topology: Topology): ScopeResult
  getBranchNodes(rootId: string, topology: Topology): Set<string>
  getHiddenBranchesForNode(nodeId: string, ...): string[]
  buildPseudoTree(topology: Topology): TreeNode
}
```

#### 2. **FoldingService** (từ `folding.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class FoldingService {
  foldNodeType(type: NodeType, nodes: Node[], topology: Topology): MetaNode;
  mergeParallelConnectors(links: Link[]): Link[];
  getAutoFoldNodeIds(nodes: Node[], threshold: number): string[];
}
```

#### 3. **HopsService** (từ `hops.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class HopsService {
  computeHops(
    topology: Topology,
    visibleIds: Set<string>,
    hiddenTypes: Set<NodeType>
  ): Link[];
  getHopDescription(link: Link, topology: Topology): string;
}
```

#### 4. **ThemeService** (từ `theme.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme$: Observable<'light' | 'dark'>;

  getGojsTheme(): GojsTheme;
  applyTheme(diagram: go.Diagram): void;
  toggleTheme(): void;
}
```

#### 5. **TopologyService** (từ `topologies.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class TopologyService {
  electricalTopology$: Observable<Topology>;
  coolingTopology$: Observable<Topology>;

  getTopology(type: TopologyType): Observable<Topology>;
  getNode(id: string): Observable<Node | undefined>;
}
```

#### 6. **GojsService** (wrapper cho GoJS)

```typescript
@Injectable({ providedIn: 'root' })
export class GojsService {
  constructor(private themeService: ThemeService) {}

  createDiagram(div: HTMLDivElement): go.Diagram;
  updateDiagram(diagram: go.Diagram, nodeData: any[], linkData: any[]): void;
  setupNodeTemplates(diagram: go.Diagram): void;
  setupLinkTemplates(diagram: go.Diagram): void;
}
```

#### 7. **RuntimeStateService** (state management cho RuntimePage - Signal-based)

```typescript
@Injectable() // Scoped to RuntimeModule
export class RuntimeStateService {
  // Writable signals for all runtime state
  private readonly _selectedManto = signal<TopologyType>('Electrical');
  private readonly _selectedMsn = signal<string | null>(null);
  private readonly _hiddenTypes = signal<Set<NodeType>>(new Set());
  private readonly _foldedNodeIds = signal<Set<string>>(new Set());
  private readonly _hiddenBranchRoots = signal<Set<string>>(new Set());
  private readonly _overlayMetric = signal<Variable | null>(null);
  private readonly _timeWindow = signal<TimeWindow>('Latest');
  private readonly _selectedNodeIds = signal<Set<string>>(new Set());
  private readonly _immersiveMode = signal<boolean>(false);

  // Read-only signals (exposed to components)
  readonly selectedManto = this._selectedManto.asReadonly();
  readonly selectedMsn = this._selectedMsn.asReadonly();
  readonly hiddenTypes = this._hiddenTypes.asReadonly();
  readonly foldedNodeIds = this._foldedNodeIds.asReadonly();
  readonly hiddenBranchRoots = this._hiddenBranchRoots.asReadonly();
  readonly overlayMetric = this._overlayMetric.asReadonly();
  readonly timeWindow = this._timeWindow.asReadonly();
  readonly selectedNodeIds = this._selectedNodeIds.asReadonly();
  readonly immersiveMode = this._immersiveMode.asReadonly();

  // Computed signals (derived state - auto-updates)
  readonly topology = computed(() => {
    const manto = this._selectedManto();
    return this.topologyService.getTopology(manto);
  });

  readonly scope = computed(() => {
    const msn = this._selectedMsn();
    const topo = this.topology();
    return msn ? this.scopeService.computeScope(msn, topo) : null;
  });

  readonly visibleIdsBeforeFold = computed(() => {
    const scopeNodes = this.scope()?.nodes || new Set();
    const hidden = this._hiddenTypes();
    const topo = this.topology();

    return new Set(
      Array.from(scopeNodes).filter((id) => {
        const node = topo.nodes.get(id);
        return node && !hidden.has(node.type);
      })
    );
  });

  readonly visibleNodes = computed(() => {
    const visibleIds = this.visibleIdsBeforeFold();
    const topo = this.topology();
    return Array.from(visibleIds)
      .map((id) => topo.nodes.get(id))
      .filter((n): n is Node => !!n);
  });

  readonly metaNodes = computed(() => {
    const folded = this._foldedNodeIds();
    const topo = this.topology();
    return this.foldingService.createMetaNodes(folded, topo);
  });

  readonly allLinks = computed(() => {
    const topo = this.topology();
    const visibleIds = this.visibleIdsBeforeFold();
    const hidden = this._hiddenTypes();
    return this.hopsService.computeLinks(topo, visibleIds, hidden);
  });

  constructor(
    private topologyService: TopologyService,
    private scopeService: ScopeService,
    private foldingService: FoldingService,
    private hopsService: HopsService
  ) {}

  // Actions (mutate signals)
  setSelectedMsn(msnId: string): void {
    this._selectedMsn.set(msnId);
  }

  toggleNodeType(type: NodeType): void {
    this._hiddenTypes.update((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  foldNodeType(type: NodeType, nodeIds: string[]): void {
    this._foldedNodeIds.update((prev) => new Set([...prev, ...nodeIds]));
  }

  unfoldNodes(nodeIds: string[]): void {
    this._foldedNodeIds.update((prev) => {
      const next = new Set(prev);
      nodeIds.forEach((id) => next.delete(id));
      return next;
    });
  }

  hideBranch(rootId: string): void {
    this._hiddenBranchRoots.update((prev) => new Set([...prev, rootId]));
  }

  showBranch(rootId: string): void {
    this._hiddenBranchRoots.update((prev) => {
      const next = new Set(prev);
      next.delete(rootId);
      return next;
    });
  }

  setOverlayMetric(metric: Variable | null): void {
    this._overlayMetric.set(metric);
  }

  setTimeWindow(window: TimeWindow): void {
    this._timeWindow.set(window);
  }

  toggleImmersiveMode(): void {
    this._immersiveMode.update((prev) => !prev);
  }

  selectNode(nodeId: string, multiSelect: boolean = false): void {
    if (multiSelect) {
      this._selectedNodeIds.update((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
    } else {
      this._selectedNodeIds.set(new Set([nodeId]));
    }
  }

  clearSelection(): void {
    this._selectedNodeIds.set(new Set());
  }

  // Reset state for MSN change
  resetDefaults(): void {
    this._hiddenTypes.set(new Set());
    this._foldedNodeIds.set(new Set());
    this._hiddenBranchRoots.set(new Set());
    this.clearSelection();
  }
}
```

---

## 🎨 Theming Strategy

### 1. ng-zorro Theme Customization

**File: `src/styles/themes/_variables.scss`**

```scss
// Light theme
$light-primary-color: #1890ff;
$light-background-color: #ffffff;
$light-text-color: #000000;

// Dark theme
$dark-primary-color: #177ddc;
$dark-background-color: #141414;
$dark-text-color: #ffffff;
```

**File: `src/styles.scss`**

```scss
@import 'ng-zorro-antd/ng-zorro-antd.scss';
@import './themes/variables';
@import './themes/light-theme';
@import './themes/dark-theme';
@import './styles/gojs-theme';

// CSS variables for GoJS (same as React version)
:root {
  --gojs-node-fill: 30 41 59;
  --gojs-node-stroke: 71 85 105;
  // ... all existing CSS vars
}

.dark {
  --gojs-node-fill: 241 245 249;
  // ... dark mode overrides
}
```

### 2. Theme Integration với GoJS

ThemeService sẽ:

1. Listen to theme changes (via `RendererFactory2` hoặc `DOCUMENT`)
2. Parse CSS variables
3. Call `gojsService.applyTheme(diagram)`
4. Trigger diagram update

---

## 🔀 State Management Strategy

### ✅ Angular Signals (Recommended - Modern Approach)

- **RuntimeStateService** với Angular Signals (v16+)
- **Pros**:
  - ⚡ Fine-grained reactivity (only re-render what changes)
  - 🎯 Automatic dependency tracking với `computed()`
  - 🚀 Better performance than Zone.js + RxJS
  - 📝 Simpler syntax, less boilerplate
  - 🔄 Easy to debug (no async issues)
  - 🎨 Works great with OnPush change detection
- **Cons**:
  - Requires Angular 16+ (we're on 19 ✅)
  - New paradigm (but better than RxJS for state)

### Alternative: RxJS BehaviorSubjects

- Traditional approach với Observables
- **Pros**: Mature, well-known pattern
- **Cons**: More boilerplate, async complexity, Zone.js overhead

### Alternative: NgRx (Overkill)

- Full Redux pattern với Actions/Reducers/Effects
- **Pros**: DevTools, time-travel debugging
- **Cons**: 3x more boilerplate, unnecessary complexity

**Decision**: Dùng **Angular Signals** vì:

- ✅ Modern Angular best practice (v16+)
- ✅ Perfect cho reactive UI (graph updates)
- ✅ Automatic computed values (scope → visibleNodes → metaNodes)
- ✅ No subscription management needed
- ✅ Better performance profile
- ✅ Simpler component code với `signal()` template syntax

---

## 🎨 Component Signal Integration

### Using Signals in Components

#### Example 1: RuntimePage Component

```typescript
@Component({
  selector: 'app-runtime-page',
  templateUrl: './runtime-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush, // Important!
})
export class RuntimePageComponent {
  // Inject signal-based service
  protected readonly state = inject(RuntimeStateService);

  // Local component signals
  protected readonly nodeTypePanelOpen = signal(false);
  protected readonly contextMenuState = signal<ContextMenuState | null>(null);

  // Computed from service signals
  protected readonly scopeTypes = computed(() => {
    const scope = this.state.scope();
    if (!scope) return [];

    const upstream = Array.from(scope.upstream);
    const downstream = Array.from(scope.downstream);
    return [...upstream, scope.msn, ...downstream];
  });

  // Effects for side effects
  constructor() {
    // Watch for MSN changes and reset defaults
    effect(() => {
      const msn = this.state.selectedMsn();
      if (msn) {
        this.state.resetDefaults();
      }
    });

    // Update GoJS diagram when nodes change
    effect(
      () => {
        const nodes = this.state.visibleNodes();
        const links = this.state.allLinks();
        this.updateDiagram(nodes, links);
      },
      { allowSignalWrites: true }
    );
  }

  // Event handlers
  protected onNodeClick(nodeId: string, multiSelect: boolean): void {
    this.state.selectNode(nodeId, multiSelect);
  }

  protected onToggleType(type: NodeType): void {
    this.state.toggleNodeType(type);
  }

  private updateDiagram(nodes: Node[], links: Link[]): void {
    // GoJS update logic
  }
}
```

#### Example 2: Template Syntax

```html
<!-- Access signals with () in templates -->
<app-navigation
  [selectedManto]="state.selectedManto()"
  [selectedMsn]="state.selectedMsn()"
  (mantoChange)="state.setSelectedManto($event)"
  (msnChange)="state.setSelectedMsn($event)"
/>

<!-- Computed signals work the same -->
<app-quick-node-type-controls
  [nodeTypes]="scopeTypes()"
  [hiddenTypes]="state.hiddenTypes()"
  (toggleType)="onToggleType($event)"
/>

<!-- Conditional rendering with signals -->
@if (state.selectedMsn(); as msn) {
<app-node-data-panel [nodeId]="msn" />
}

<!-- Iteration with signals -->
@for (node of state.visibleNodes(); track node.id) {
<div>{{ node.name }}</div>
}

<!-- Immersive mode toggle -->
<button
  (click)="state.toggleImmersiveMode()"
  [class.active]="state.immersiveMode()"
>
  Toggle Immersive
</button>
```

#### Example 3: Child Component with Signals

```typescript
@Component({
  selector: 'app-visibility-chip',
  template: `
    <nz-tag
      [nzColor]="isVisible() ? 'blue' : 'default'"
      (click)="onToggle()"
      [class.locked]="isLocked()"
    >
      <app-node-type-icon [type]="type()" />
      {{ type() }}
      @if (count(); as c) {
      <nz-badge [nzCount]="c" />
      }
    </nz-tag>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisibilityChipComponent {
  // Input signals (new Angular 17.1+ feature)
  type = input.required<NodeType>();
  count = input<number | null>(null);
  hiddenTypes = input.required<Set<NodeType>>();
  lockedType = input<NodeType | null>(null);

  // Output events
  toggle = output<NodeType>();

  // Computed signals
  isVisible = computed(() => !this.hiddenTypes().has(this.type()));
  isLocked = computed(() => this.lockedType() === this.type());

  protected onToggle(): void {
    if (!this.isLocked()) {
      this.toggle.emit(this.type());
    }
  }
}
```

### Signal Best Practices

1. **Use `asReadonly()`** for service signals exposed to components
2. **Use `computed()`** instead of getters for derived values
3. **Use `effect()`** sparingly (only for side effects, not for state changes)
4. **Enable `OnPush` change detection** on all components
5. **Use `input()`/`output()`** instead of `@Input`/`@Output` (Angular 17.1+)
6. **Track by** in `@for` loops for performance
7. **Use `update()`** for immutable state changes (Sets, Arrays)
8. **`Use @if() @else() @else if()`** for condition statemenents

---

## 🧪 Testing Strategy

### React (hiện tại)

- **Vitest** + React Testing Library
- jsdom environment
- Mock GoJS

### Angular (target)

- **Jasmine** + **Karma** (default Angular)
- **Angular Testing Utilities** (TestBed, ComponentFixture)
- Mock services với `jasmine.createSpyObj`

**Migration checklist**:

- [ ] Port `scope.test.ts` → `scope.service.spec.ts`
- [ ] Port `hops.test.ts` → `hops.service.spec.ts`
- [ ] Port `nodeTypeFilter.test.ts` → `node-type-filter.spec.ts`
- [ ] Add component tests cho mỗi Angular component
- [ ] Integration tests cho RuntimePage flow

---

## 📅 Migration Timeline (Estimated)

### Week 1: Foundation

- [x] Setup cấu trúc thư mục Angular chuẩn
- [ ] Migrate core models (models.ts, types.ts)
- [ ] Setup ng-zorro-antd + theming
- [ ] Create core services (Scope, Folding, Hops, Theme)

### Week 2: GoJS Integration

- [ ] Create GojsService wrapper
- [ ] Migrate GraphCanvas component
- [ ] Test theme integration với GoJS
- [ ] Port topology mock data

### Week 3: Core UI Components

- [ ] Migrate Navigation
- [ ] Migrate FloatingDock
- [ ] Migrate QuickNodeTypeControls
- [ ] Migrate VisibilityChip

### Week 4: Data Panels

- [ ] Migrate NodeDataPanel
- [ ] Migrate BranchDataPanel
- [ ] Migrate NodeTypePanel
- [ ] Migrate NodeGroupPanel

### Week 5: Controls & Dialogs ✅ COMPLETED

- [x] Migrate PartialFoldDialog (138 LOC) - Angular Material Dialog
- [x] Migrate PartialExpandDialog (124 LOC) - Angular Material Dialog
- [x] Migrate ContextMenu (180 LOC) - Material Menu with programmatic trigger
- [ ] Migrate MetricSelector, ViewMenu (Task 15 - In Progress)
- [ ] Migrate FoldSelectedButton, FoldStateControl (Task 15 - In Progress)

### Week 6: RuntimePage & State (Signal-based)

- [ ] Create RuntimeStateService với Signals
- [ ] Implement computed signals cho derived state
- [ ] Migrate RuntimePage logic với effect()
- [ ] Wire up all components với signal bindings
- [ ] Integration testing

### Week 7: Testing & Polish

- [ ] Port all unit tests
- [ ] Add component tests
- [ ] Fix bugs
- [ ] Performance optimization

### Week 8: Final QA

- [ ] E2E testing
- [ ] Cross-browser testing
- [ ] Accessibility audit
- [ ] Documentation

---

## ⚠️ Migration Challenges & Solutions

### Challenge 1: React Hooks → Angular Signals

**Problem**: React useMemo/useCallback/useEffect không có direct equivalent  
**Solution**: Angular Signals là perfect match! 🎯

- `useMemo` → `computed()` (auto-memoized, dependency tracking)
- `useState` → `signal()` (writable signal)
- `useCallback` → Class methods (auto-bound)
- `useEffect` → `effect()` (runs when signals change)

**Example mapping**:

```typescript
// React
const [count, setCount] = useState(0);
const doubled = useMemo(() => count * 2, [count]);
useEffect(() => console.log(doubled), [doubled]);

// Angular Signals
count = signal(0);
doubled = computed(() => this.count() * 2);
constructor() {
  effect(() => console.log(this.doubled()));
}
```

### Challenge 2: GoJS Incremental Updates

**Problem**: React version có logic phức tạp để tránh full re-layout  
**Solution**:

- Dùng `ngDoCheck` + KeyValueDiffer để detect changes
- Implement tương tự logic trong `GraphCanvas.tsx` (lines 200-350)

### Challenge 3: CSS Variables → ng-zorro Theme

**Problem**: ng-zorro dùng LESS variables, không dễ integrate với CSS vars  
**Solution**:

- Giữ CSS variables cho GoJS
- Override ng-zorro theme via `angular.json` styles
- ThemeService bridge 2 systems

### Challenge 4: Multi-select State

**Problem**: React setState synchronous, Angular CD asynchronous  
**Solution**: Signals solve this naturally! 🎯

- Signal updates are **synchronous** (like React useState)
- No need for `ChangeDetectorRef` with OnPush
- Components auto-rerender when signals change
- Perfect for multi-select: `selectedNodeIds.update(prev => ...)`

### Challenge 5: Context Menu Positioning

**Problem**: React Portal → Angular CDK Overlay  
**Solution**:

- Dùng `nz-dropdown` với `nzTrigger="contextmenu"`
- Hoặc dùng CDK Overlay trực tiếp với ConnectedPositionStrategy

---

## 🎯 Success Criteria

### Functional Parity

- [ ] All 15+ components working identically
- [ ] All scope, folding, hiding logic works
- [ ] GoJS rendering matches React version
- [ ] Theme switching works (light/dark)
- [ ] Metric overlay displays correctly
- [ ] All dialogs/panels function

### Code Quality

- [ ] TypeScript strict mode enabled
- [ ] No `any` types (except GoJS interop)
- [ ] All services unit tested (>80% coverage)
- [ ] All components tested
- [ ] ESLint passing với no warnings

### Performance

- [ ] Initial load < 2s
- [ ] MSN change < 500ms
- [ ] Type toggle < 200ms
- [ ] No memory leaks (check with Chrome DevTools)
- [ ] Smooth 60fps animations

### UX Consistency

- [ ] UI looks identical to React version
- [ ] All tooltips work
- [ ] Keyboard shortcuts preserved
- [ ] Responsive behavior maintained
- [ ] Immersive mode works

---

## 📚 Reference Documents

### Architecture

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Original React architecture
- [Angular Style Guide](https://angular.dev/style-guide) - Official Angular best practices
- [Angular Signals Guide](https://angular.dev/guide/signals) - Signal-based reactivity
- [ng-zorro-antd Docs](https://ng.ant.design/docs/introduce/en) - Component library

### Key Files to Study

1. `apps/viz-scope-link/src/pages/RuntimePage.tsx` (~600 LOC) - Main state logic
2. `apps/viz-scope-link/src/components/GraphCanvas.tsx` (~500 LOC) - GoJS integration
3. `apps/viz-scope-link/src/lib/scope.ts` (~150 LOC) - Core algorithm
4. `apps/viz-scope-link/src/lib/folding.ts` (~100 LOC) - Folding logic
5. `apps/viz-scope-link/src/lib/theme.ts` (~50 LOC) - Theme bridge

---

## ✅ Migration Completion Status

### Completed (15/16 tasks - 93.75%)

✅ **Task 1-4**: Foundation (models, services, directory structure)  
✅ **Task 5-6**: GoJS integration & RuntimeStateService  
✅ **Task 7-8**: GraphCanvas & compilation fixes  
✅ **Task 9-12**: Core UI components (Navigation, NodeTypePanel, DataPanels)  
✅ **Task 13-14**: Dialogs & Context Menu  
✅ **Task 15**: Actions & Controls (FloatingDock, MetricSelector, etc.)

### Pending (1/16 task - 6.25%)

⏸️ **Task 16**: Testing & Polish (deferred)

- Unit tests for services
- Component integration tests
- Runtime error handling
- Performance profiling

### Final Statistics

- **20+ components** created (~3,500 LOC)
- **6 services** implemented (~2,600 LOC)
- **9 model files** migrated (~600 LOC)
- **Build successful**: 1.48 MB lazy chunk (309 KB gzipped)
- **Type-safe**: 100% TypeScript strict mode
- **Zero RxJS** in component layer (pure signals)

### Production Readiness

**Status**: ✅ **Ready for data integration**

Next steps:

1. Connect TopologyService to real data source
2. Add theme toggle UI button
3. Test with large graphs (>500 nodes)
4. Runtime error boundary implementation
5. Integration testing (when needed)

See [TASK_COMPLETION_SUMMARY.md](./TASK_COMPLETION_SUMMARY.md) for detailed completion report.

---

## 📝 Appendix: Signal vs RxJS Comparison

### When to use Signals

✅ Component state (UI state, local state)  
✅ Derived computations (computed values)  
✅ Synchronous data flow  
✅ Fine-grained reactivity

### When to use RxJS

✅ Async operations (HTTP, WebSocket)  
✅ Complex event streams  
✅ Debouncing, throttling  
✅ Multi-step pipelines

### Hybrid Approach (Best of Both)

```typescript
@Injectable()
export class DataService {
  // RxJS for HTTP
  private dataApi$ = this.http.get<Data[]>('/api/data');
  readonly http = inject(HttpClient);

  // Signal for state
  private _data = signal<Data[]>([]);
  readonly data = this._data.asReadonly();

  // Convert Observable to Signal
  constructor() {
    this.dataApi$.subscribe((data) => this._data.set(data));

    // Or use toSignal()
    // this.data = toSignal(this.dataApi$, { initialValue: [] });
  }
}
```

---

**Document Version**: 2.0 (Signal-based)  
**Last Updated**: 30/10/2025  
**Owner**: Migration Team
