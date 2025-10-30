# Architecture Document - viz-scope-link

**Project**: viz-scope-link  
**Version**: 0.0.0  
**Last Updated**: October 30, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Core Concepts](#core-concepts)
6. [Module Structure](#module-structure)
7. [Data Flow](#data-flow)
8. [Component Hierarchy](#component-hierarchy)
9. [State Management](#state-management)
10. [Theming System](#theming-system)
11. [Testing Strategy](#testing-strategy)
12. [Performance Considerations](#performance-considerations)
13. [Future Enhancements](#future-enhancements)

---

## Overview

**viz-scope-link** is a React-based topology visualization application for managing and visualizing hierarchical infrastructure networks. It specializes in rendering complex directed acyclic graphs (DAGs) with electrical and cooling topologies, providing advanced features like scope filtering, node folding, branch hiding, and dynamic metric overlays.

### Key Features

- **Multi-topology support**: Electrical and Cooling network visualization
- **Scope-based filtering**: Focus on relevant nodes (upstream + MSN + downstream)
- **Node folding**: Aggregate multiple nodes of the same type into meta-nodes
- **Branch hiding**: Temporarily hide entire sub-branches
- **Metric overlay**: Display real-time metrics on nodes
- **Immersive mode**: Distraction-free visualization
- **Theme support**: Light/dark mode with consistent styling across UI and graph

### Primary Use Cases

1. Infrastructure monitoring and visualization
2. Real-time metric tracking across topology nodes
3. Hierarchical navigation through complex networks
4. Impact analysis through branch exploration
5. Selective focus via scope management

---

## Architecture Principles

### 1. **Separation of Concerns**

- **UI Components**: Presentational components in `src/components/`
- **Business Logic**: Pure functions in `src/lib/`
- **Data Models**: Type definitions in `src/lib/models.ts` and `src/lib/types.ts`
- **State Management**: React state with hooks in page components

### 2. **Unidirectional Data Flow**

- State flows down through props
- Events bubble up through callbacks
- Central state in `RuntimePage.tsx`
- Derived state computed via `useMemo`

### 3. **Performance-First**

- Memoized computations for expensive operations
- Incremental GoJS updates (avoid full re-layouts)
- Efficient filtering and scope computation
- Minimal re-renders through proper dependency arrays

### 4. **Type Safety**

- Full TypeScript coverage
- Strict type checking enabled
- Discriminated unions for node types
- Explicit interfaces for all data structures

### 5. **Composability**

- Small, focused components
- Reusable UI primitives from shadcn/ui
- HOCs and hooks for shared logic
- Clear component contracts via props

---

## Technology Stack

### Frontend Framework

- **React 18.3.1**: Component library with concurrent features
- **TypeScript 5.8.3**: Static type checking
- **Vite 5.4.19**: Build tool and dev server (ESM-first)

### UI Libraries

- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **shadcn/ui**: Accessible component primitives built on Radix UI
- **Lucide React**: Icon library
- **next-themes**: Theme management

### Graph Rendering

- **GoJS 3.1.0**: Interactive diagram library
- Custom theming layer bridging CSS variables to GoJS

### State & Data

- **TanStack Query 5.83.0**: Server state management (unused currently)
- **React Router DOM 6.30.1**: Client-side routing
- **Zod 3.25.76**: Runtime schema validation

### Testing

- **Vitest 3.2.4**: Unit test framework
- **React Testing Library 16.3.0**: Component testing utilities
- **jsdom 27.0.1**: DOM simulation

### Build & Development

- **SWC**: Fast TypeScript/JSX compilation
- **ESLint 9.32.0**: Code linting
- **PostCSS + Autoprefixer**: CSS processing

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Navigation  │  │ Graph Canvas │  │  Data Panels  │  │
│  │   Panel     │  │   (GoJS)     │  │  (Node/Branch)│  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              State Management Layer (React)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │             RuntimePage Component                 │  │
│  │  • selectedMsn, selectedManto                     │  │
│  │  • hiddenTypes, foldedNodeIds                     │  │
│  │  • overlayMetric, timeWindow                      │  │
│  │  • selectedNodeIds, hiddenBranchRoots             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               Business Logic Layer                       │
│  ┌───────────┐  ┌─────────┐  ┌────────┐  ┌──────────┐ │
│  │  Scope    │  │ Folding │  │  Hops  │  │  Theme   │ │
│  │ Computation│  │  Logic  │  │ Logic  │  │  Engine  │ │
│  └───────────┘  └─────────┘  └────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Model Layer                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Topology (Node, Link)                           │  │
│  │  • Electrical topology                            │  │
│  │  • Cooling topology                               │  │
│  │  • Node types, metrics, relationships             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture

```
App.tsx (Router)
  │
  ├─ RuntimePage.tsx (Main Application State)
  │    │
  │    ├─ Navigation (Sidebar)
  │    │    ├─ MANTO selector
  │    │    └─ MSN selector
  │    │
  │    ├─ Header Bar
  │    │    ├─ ViewMenu
  │    │    ├─ MetricSelector
  │    │    ├─ Theme Toggle
  │    │    └─ ImmersiveToggle
  │    │
  │    ├─ QuickNodeTypeControls (Top bar)
  │    │    └─ VisibilityChip × N
  │    │
  │    ├─ GraphCanvas (GoJS Diagram)
  │    │    ├─ Node templates
  │    │    ├─ Meta-node templates
  │    │    ├─ Link templates
  │    │    └─ Hop templates
  │    │
  │    ├─ FloatingDock (Zoom controls)
  │    │
  │    ├─ FoldSelectedButton (Multi-select)
  │    │
  │    ├─ NodeDataPanel (Slide-in panel)
  │    │
  │    ├─ BranchDataPanel (Slide-in panel)
  │    │
  │    ├─ NodeTypePanel (Drawer)
  │    │    └─ QuickNodeTypeChip × N
  │    │
  │    ├─ NodeGroupPanel (Drawer)
  │    │
  │    ├─ PartialFoldDialog (Modal)
  │    │
  │    ├─ PartialExpandDialog (Modal)
  │    │
  │    └─ ContextMenuPortal (Context menu)
  │
  ├─ Index (Legacy page)
  │
  └─ NotFound (404 page)
```

---

## Core Concepts

### 1. **Topology**

A **Topology** represents a complete network graph with nodes and links.

```typescript
interface Topology {
  type: TopologyType; // "Electrical" | "Cooling" | "Organization"
  nodes: Map<string, Node>; // All nodes in topology
  links: Link[]; // All connections
}
```

**Topologies** are static data structures defined in `src/mocks/topologies.ts`. The application currently supports:

- **Electrical Topology**: Power distribution (ES → ATS → UPS → PDU → Server)
- **Cooling Topology**: Cooling systems (Chiller → CRAC → ...)

### 2. **Node**

A **Node** represents a single infrastructure component.

```typescript
interface Node {
  id: string; // Unique identifier
  name: string; // Display name
  type: NodeType; // "ES" | "ATS" | "UPS" | "PDU" | ...
  topologies: TopologyType[]; // Which topologies this node belongs to
  parents: string[]; // Parent node IDs (upstream)
  children: string[]; // Child node IDs (downstream)
  metrics: MetricValue[]; // Current metric values
  alerts?: string[]; // Active alerts
  cSit?: number; // Consolidated Sample Interval Time
  rit?: number; // Report Interval Time
}
```

### 3. **Main Scope Node (MSN)**

The **MSN** is the focal node for visualization. Scope computation determines which nodes to display based on the MSN:

**Scope = Upstream(MSN) ∪ {MSN} ∪ Downstream(MSN)**

- **Upstream**: All recursive parents
- **Downstream**: All recursive children
- **MSN**: Always included and locked (cannot be hidden)

### 4. **MANTO (Main Topology)**

The **MANTO** is the active topology (Electrical or Cooling). Users can switch between topologies without losing the MSN, which automatically adjusts to a valid node in the new topology.

### 5. **Node Type Filtering**

Users can **hide** or **show** node types to simplify the view:

- **Visible types**: Nodes displayed in the graph
- **Hidden types**: Nodes filtered out (including their hops)
- **Locked type**: MSN's type (cannot be hidden)
- **Parent-only types**: Types appearing only upstream (hidden by default)

### 6. **Folding (Meta-nodes)**

**Folding** aggregates multiple nodes of the same type into a single **meta-node**:

```typescript
interface MetaNode {
  id: string; // "meta-{NodeType}"
  type: NodeType; // Type being folded
  count: number; // Number of nodes in meta-node
  nodeIds: string[]; // IDs of folded nodes
  consolidatedMetrics: MetricValue[]; // Aggregated metrics
}
```

**Folding logic**:

- **Extensive metrics** (power, energy): Summed
- **Intensive metrics** (temperature): Averaged

**Auto-folding**: Types with >10 nodes in scope are auto-folded on MSN change.

### 7. **Branch Hiding**

Users can temporarily **hide entire branches** (sub-trees) from a node:

- Clicking the **cue indicator** (double dots) on a node reveals hidden branches
- Hidden branches maintain multi-parent logic (node appears if any parent is visible)
- Hidden branch roots are tracked in `hiddenBranchRoots` set

### 8. **Hop Links**

When a node type is hidden, **hop links** (dashed lines) connect visible nodes that were indirectly connected through hidden nodes:

```
A → (hidden B) → C   becomes   A --→ C (hop)
```

Hover tooltip shows: `via B`

### 9. **Metric Overlay**

Users can select a **metric** to display on nodes:

```typescript
interface Variable {
  id: string; // Metric ID
  name: string; // Display name
  type: VariableType; // "extensive" | "intensive"
  unit: string; // "kW", "°C", etc.
  sit: number; // Sample Interval Time (minutes)
  isIntegrated: boolean; // Whether used in branch integration
}
```

**Time Window Restrictions**:

- `SIT` (Sample Interval Time) limits the minimum time window
- Time window auto-bumps if incompatible with selected metric

### 10. **Immersive Mode**

Hides non-essential UI for focused visualization:

- Hides navigation sidebar
- Hides quick controls
- Full-screen graph canvas

---

## Module Structure

### `/src/lib/` - Core Business Logic

#### `models.ts`

**Purpose**: Core data type definitions  
**Exports**: `Node`, `Link`, `Topology`, `Variable`, `MetricValue`, `ScopeConfig`, etc.

#### `types.ts`

**Purpose**: NodeType ordering and utilities  
**Exports**: `NodeType`, `TYPE_ORDER`, `typeIndex`

#### `scope.ts`

**Purpose**: Scope computation (upstream/downstream traversal)  
**Key Functions**:

- `computeScope(msnId, topology)`: Returns all nodes in scope
- `getBranchNodes(rootId, topology)`: Returns all descendants of a node
- `getHiddenBranchesForNode(nodeId, hiddenBranchRoots, topology)`: Finds hidden branches connected to a node
- `buildPseudoTree(topology)`: Creates a tree from DAG for navigation

#### `folding.ts`

**Purpose**: Node folding logic  
**Key Functions**:

- `foldNodeType(type, nodes, topology)`: Creates a meta-node from nodes
- `mergeParallelConnectors(links)`: Deduplicates parallel edges
- `getAutoFoldNodeIds(nodes, threshold)`: Computes which nodes to auto-fold

#### `hops.ts`

**Purpose**: Hop link computation  
**Key Functions**:

- `computeHops(topology, visibleIds, hiddenTypes)`: Generates hop links for hidden nodes
- `getHopDescription(link, topology)`: Generates tooltip text

#### `theme.ts`

**Purpose**: GoJS theming via CSS variables  
**Key Functions**:

- `getGojsTheme()`: Reads CSS variables and returns theme object
- `applyTheme(diagram)`: Updates GoJS diagram with current theme

#### `timeWindows.ts`

**Purpose**: Time window validation  
**Key Functions**:

- `isWindowAllowed(window, metric, node)`: Checks if window is valid for metric
- `getMinimumWindow(metric, node)`: Returns smallest valid window

#### `utils.ts`

**Purpose**: General utility functions (Tailwind `cn`, etc.)

### `/src/components/` - UI Components

#### Core Graph Components

- **`GraphCanvas.tsx`**: Main GoJS diagram wrapper

  - Creates and manages GoJS diagram instance
  - Defines node/link templates
  - Handles selection, context menus, tooltips
  - Performs incremental updates (no full re-layouts)

- **`FloatingDock.tsx`**: Zoom/pan controls overlay

- **`HiddenBranchCue.tsx`**: Indicator for hidden branches (double dots)

#### Control Components

- **`QuickNodeTypeControls.tsx`**: Horizontal bar with visibility chips for all types
- **`VisibilityChip.tsx`**: Toggle chip for individual node type
- **`QuickNodeTypeChip.tsx`**: Chip in Node Type Panel
- **`FoldSelectedButton.tsx`**: Button to fold multi-selected nodes
- **`FoldStateSegmentedControl.tsx`**: Toggle for fold state (All/None/Partial)
- **`ImmersiveToggle.tsx`**: Button to enter immersive mode
- **`MetricSelector.tsx`**: Dropdown for metric + time window selection

#### Panel Components

- **`Navigation.tsx`**: Sidebar with MANTO and MSN selectors
- **`NodeDataPanel.tsx`**: Slide-in panel with single node details
- **`BranchDataPanel.tsx`**: Slide-in panel with branch aggregation
- **`NodeTypePanel.tsx`**: Drawer with full type controls
- **`NodeGroupPanel.tsx`**: Drawer with individual node list for a type
- **`ViewMenu.tsx`**: Dropdown for view selection

#### Dialog Components

- **`PartialFoldDialog.tsx`**: Modal for selecting specific nodes to fold
- **`PartialExpandDialog.tsx`**: Modal for expanding specific nodes from a meta-node
- **`ContextMenuPortal.tsx`**: Right-click context menu

#### Icon Components

- **`NodeTypeIcon.tsx`**: SVG icons for each node type (ES, ATS, UPS, etc.)

### `/src/pages/` - Page Components

- **`RuntimePage.tsx`**: Main application page with full state management
- **`Index.tsx`**: Legacy placeholder page
- **`NotFound.tsx`**: 404 error page

### `/src/mocks/` - Mock Data

- **`topologies.ts`**: Static electrical and cooling topology data

### `/src/test/` - Test Setup

- **`setup.ts`**: Vitest global setup (RTL matchers, cleanup)

### `/src/lib/__tests__/` - Unit Tests

- **`scope.test.ts`**: Tests for scope computation
- **`hops.test.ts`**: Tests for hop link generation
- **`nodeTypeFilter.test.ts`**: Tests for node type filtering

---

## Data Flow

### 1. **Initial Load**

```
User loads app
     │
     ▼
App.tsx → RuntimePage.tsx
     │
     ▼
Initialize state:
  • selectedManto = "Electrical"
  • selectedMsn = "ats-1"
  • hiddenTypes = [] (computed from scope)
  • foldedNodeIds = Set() (auto-fold)
     │
     ▼
Topology loaded from mocks/topologies.ts
     │
     ▼
Compute scope (useMemo):
  scope = computeScope(selectedMsn, topology)
     │
     ▼
Apply default filters:
  • Hide parent-only types
  • Auto-fold types with >10 nodes
     │
     ▼
Render GraphCanvas with filtered nodes
```

### 2. **MSN Change**

```
User selects new MSN
     │
     ▼
setSelectedMsn(newMsn)
     │
     ▼
scope = computeScope(newMsn, topology)
     │
     ▼
Reset defaults:
  • Compute new parent-only types
  • Auto-fold types with >10 nodes
  • Clear hidden branches
     │
     ▼
Re-render GraphCanvas with new scope
```

### 3. **Node Type Visibility Toggle**

```
User clicks visibility chip
     │
     ▼
setHiddenTypes(prev => toggle(type))
     │
     ▼
visibleIdsBeforeFold = scope.nodes - hiddenTypes
     │
     ▼
Compute hop links for hidden types
     │
     ▼
Re-render GraphCanvas with filtered nodes + hops
```

### 4. **Folding**

```
User folds a node type
     │
     ▼
setFoldedNodeIds(prev => add(nodeIds))
     │
     ▼
Group nodes by type:
  metaNodes = foldNodeType(type, nodes, topology)
     │
     ▼
Adjust links:
  • Direct links between unfolded nodes
  • Links to/from meta-nodes
  • Hop links adjusted for folded nodes
     │
     ▼
Re-render GraphCanvas with metaNodes + unfoldedNodes
```

### 5. **Branch Hiding**

```
User hides a branch
     │
     ▼
setHiddenBranchRoots(prev => add(rootId))
     │
     ▼
Compute hidden nodes:
  branch = getBranchNodes(rootId, topology)
     │
     ▼
Apply multi-parent logic:
  • Node hidden if ALL visible parents are hidden
  • Root node always hidden
     │
     ▼
visibleIdsAfterBranchHide = visibleIdsBeforeFold - hiddenNodes
     │
     ▼
Show cue indicator on parent nodes
     │
     ▼
Re-render GraphCanvas
```

### 6. **Metric Overlay**

```
User selects metric
     │
     ▼
setOverlayMetric(metric)
     │
     ▼
Check time window compatibility:
  if (!isWindowAllowed(timeWindow, metric, msn))
     │
     ▼
Auto-bump time window:
  setTimeWindow(getMinimumWindow(metric, msn))
     │
     ▼
Compute metric values for nodes:
  • For regular nodes: node.metrics[metricId]
  • For meta-nodes: consolidate metrics
     │
     ▼
Re-render GraphCanvas with metric overlay
```

---

## Component Hierarchy

### RuntimePage State Tree

```typescript
RuntimePage {
  // Topology selection
  selectedManto: TopologyType;
  selectedMsn: string | null;

  // Node filtering
  hiddenTypes: NodeType[];
  lockedType: NodeType | null;

  // Folding
  foldedNodeIds: Set<string>;
  autoFoldedTypes: Set<NodeType>;

  // Branch hiding
  hiddenBranchRoots: Set<string>;

  // Metric overlay
  overlayMetric: Variable | null;
  timeWindow: TimeWindow;

  // Selection
  selectedNodeIds: Set<string>;
  selectedNode: string | null;  // For data panel
  branchRootNode: string | null; // For branch panel

  // UI state
  immersiveMode: boolean;
  currentView: string;
  nodeTypePanelOpen: boolean;
  nodeGroupPanelOpen: boolean;
  partialFoldDialogOpen: boolean;
  expandDialogMetaNode: MetaNode | null;
  contextMenuState: { ... } | null;
  theme: 'light' | 'dark';
}
```

### Derived State (useMemo)

```typescript
// Topology based on MANTO
topology =
  selectedManto === "Electrical" ? electricalTopology : coolingTopology;

// Scope based on MSN
scope = computeScope(selectedMsn, topology);

// Upstream/downstream
upstream = Array.from(scope.upstream);
downstream = Array.from(scope.downstream);

// Scope types ordered
scopeTypes = [...upstreamTypes, msnType, ...downstreamTypes];

// Visible nodes after type filter
visibleIdsBeforeFold = scope.nodes - hiddenTypes;

// Visible nodes after branch hiding
visibleIdsAfterBranchHide = visibleIdsBeforeFold - hiddenBranches;

// Unfolded nodes
visibleNodes = visibleIdsAfterBranchHide.map((id) => topology.nodes.get(id));

// Meta-nodes
metaNodes = foldedNodes.groupBy(type).map(foldNodeType);

// Links
directLinks = topology.links.filter(visibleNodes);
metaLinks = metaNodes.flatMap(computeLinks);
hopLinks = computeHops(topology, visibleIds, hiddenTypes);
allLinks = mergeParallelConnectors([...directLinks, ...metaLinks, ...hopLinks]);
```

### Event Flow

```typescript
// Node selection
onNodeClick(nodeId, isMultiSelect)
  → setSelectedNodeIds()
  → GraphCanvas re-renders with selection

// MSN change
onMsnChange(newMsn)
  → setSelectedMsn(newMsn)
  → scope recomputes
  → defaults reset
  → GraphCanvas re-renders

// Type visibility toggle
onToggleType(type)
  → setHiddenTypes(prev => toggle(type))
  → visibleIds recompute
  → GraphCanvas re-renders

// Node folding
onFoldAll(type)
  → setFoldedNodeIds(prev => add(typeNodeIds))
  → metaNodes recompute
  → GraphCanvas re-renders

// Branch hiding
onHideBranch(nodeId)
  → setHiddenBranchRoots(prev => add(nodeId))
  → visibleIdsAfterBranchHide recomputes
  → GraphCanvas re-renders

// Context menu
onContextMenu(data)
  → setContextMenuState(data)
  → ContextMenuPortal renders at cursor position
```

---

## State Management

### State Location Strategy

1. **Page-level state** (`RuntimePage.tsx`)

   - Global application state
   - Topology selection
   - Filtering, folding, hiding
   - Metric overlay
   - Panel/dialog visibility

2. **Component-level state** (individual components)

   - Local UI state (hover, focus, animation)
   - Form inputs
   - Temporary selections

3. **Derived state** (`useMemo`)
   - Expensive computations
   - Filtered node lists
   - Scope computation
   - Meta-node generation

### State Update Patterns

#### Immutable Updates

```typescript
// Adding to Set
setFoldedNodeIds((prev) => new Set([...prev, nodeId]));

// Removing from Set
setFoldedNodeIds((prev) => {
  const next = new Set(prev);
  next.delete(nodeId);
  return next;
});

// Toggling in array
setHiddenTypes((prev) =>
  prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
);
```

#### Computed State Memoization

```typescript
const visibleNodes = useMemo(
  () =>
    Array.from(visibleIdsAfterBranchHide)
      .map((id) => topology.nodes.get(id))
      .filter((n): n is Node => !!n),
  [visibleIdsAfterBranchHide, topology]
);
```

### State Synchronization

- **MSN ↔ selectedNodeIds**: MSN is always selected (green border)
- **Theme ↔ GoJS**: Theme changes propagate to GoJS via `applyTheme()`
- **Folding ↔ Auto-fold**: Manual fold clears AUTO badge

---

## Theming System

### CSS Variables → GoJS Theme Bridge

The theming system uses **CSS custom properties** to maintain consistency between Tailwind UI and GoJS rendering.

#### CSS Variables (defined in `index.css`)

```css
:root {
  --gojs-node-fill: 30 41 59; /* hsl(210, 33%, 20%) */
  --gojs-node-stroke: 71 85 105; /* hsl(215, 25%, 35%) */
  --gojs-node-text: 248 250 252; /* white */
  /* ... more variables */
}

.light {
  --gojs-node-fill: 241 245 249; /* hsl(210, 40%, 96%) */
  --gojs-node-stroke: 148 163 184; /* hsl(215, 20%, 65%) */
  --gojs-node-text: 15 23 42; /* black */
  /* ... override for light mode */
}
```

#### Theme Computation (`src/lib/theme.ts`)

```typescript
export function getGojsTheme(): GojsTheme {
  return {
    nodeFill: getCSSColor("node-fill"),
    nodeStroke: getCSSColor("node-stroke"),
    // ... read all CSS variables
  };
}

function getCSSColor(varName: string): string {
  const hsl = getComputedStyle(document.documentElement)
    .getPropertyValue(`--gojs-${varName}`)
    .trim();
  return hsl ? `hsl(${hsl})` : "#000000";
}
```

#### Theme Application

```typescript
export function applyTheme(diagram: go.Diagram | null) {
  if (!diagram) return;

  const theme = getGojsTheme();
  diagram.commit((d) => {
    d.model.modelData.theme = theme;
  }, "update-theme");

  diagram.updateAllTargetBindings();
}
```

#### GoJS Bindings

```typescript
// In node template
$(
  go.Shape,
  "RoundedRectangle",
  new go.Binding("fill", "theme", (t) => t.nodeFill).ofModel(),
  new go.Binding("stroke", "theme", (t) => t.nodeStroke).ofModel()
);
```

#### Theme Toggle

```typescript
const toggleTheme = () => {
  const next = theme === "dark" ? "light" : "dark";
  document.documentElement.classList.toggle("light", next === "light");
  setTheme(next);
};
```

Theme observer in GraphCanvas:

```typescript
useEffect(() => {
  const observer = new MutationObserver(() => {
    applyTheme(diagram.current);
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => observer.disconnect();
}, []);
```

---

## Testing Strategy

### Unit Testing

**Framework**: Vitest 3.2.4 with jsdom environment

**Test Structure**:

- `src/lib/__tests__/`: Pure function tests
- Focus on business logic (scope, folding, hops, filtering)

**Example Test**:

```typescript
// src/lib/__tests__/scope.test.ts
describe("computeScope", () => {
  it("should include all upstream and downstream nodes", () => {
    const scope = computeScope("msn-1", topology);
    expect(scope.nodes.has("parent-1")).toBe(true);
    expect(scope.nodes.has("child-1")).toBe(true);
    expect(scope.nodes.has("msn-1")).toBe(true);
  });
});
```

### Component Testing

**Framework**: React Testing Library 16.3.0

**Strategy**:

- Test user interactions
- Verify UI state changes
- Mock external dependencies (GoJS)

**GoJS Mocking**:

```typescript
vi.mock("gojs", () => ({
  default: {},
  Diagram: class {
    constructor() {}
    commit(fn: any) {
      fn(this);
    }
    updateAllTargetBindings() {}
  },
  GraphObject: { make: () => ({}) },
}));
```

### CSS Variable Mocking (for jsdom)

```typescript
beforeEach(() => {
  document.documentElement.style.setProperty("--gojs-node-fill", "0 0% 0%");
  // ... or mock getComputedStyle
});
```

### Running Tests

```bash
# Watch mode
npx vitest

# Run once
npx vitest run

# Specific file
npx vitest run src/lib/__tests__/scope.test.ts

# Dot reporter (less noise)
npx vitest run --reporter=dot
```

---

## Performance Considerations

### 1. **Memoization**

All expensive computations are memoized:

```typescript
const scope = useMemo(
  () => computeScope(selectedMsn, topology),
  [selectedMsn, topology]
);

const visibleNodes = useMemo(
  () => filterNodes(scope, hiddenTypes, foldedNodeIds),
  [scope, hiddenTypes, foldedNodeIds]
);
```

### 2. **Incremental GoJS Updates**

GraphCanvas performs **incremental updates** to avoid full re-layouts:

```typescript
// Detect structural changes
const nodesAddedOrRemoved = /* ... */;
const linksAddedOrRemoved = /* ... */;

d.commit((diag) => {
  // Upsert nodes (update existing, add new)
  nextNodeData.forEach((nd) => {
    const existing = model.nodeDataArray.find(x => x.key === nd.key);
    if (!existing) {
      model.addNodeData(nd);
    } else {
      // Update only changed properties
      props.forEach(p => {
        if (nd[p] !== existing[p]) model.setDataProperty(existing, p, nd[p]);
      });
    }
  });
}, "update-diagram");

// Layout only on structural changes
if (nodesAddedOrRemoved || linksAddedOrRemoved) {
  d.layoutDiagram(true);
}
```

### 3. **Camera Preservation**

Camera state is preserved during minor updates:

```typescript
if (isScopeChange) {
  d.zoomToFit(); // Major change: recenter
} else {
  // Preserve camera, pan to new nodes
  const oldScale = d.scale;
  const oldPosition = d.position.copy();
  d.layoutDiagram(true);
  d.scale = oldScale;
  d.position = oldPosition;
  d.scrollToRect(newNodeBounds);
}
```

### 4. **Efficient Filtering**

Filtering uses Sets for O(1) lookups:

```typescript
const hidden = new Set<NodeType>(hiddenTypes);
const visible = new Set(
  Array.from(scope.nodes).filter((id) => {
    const node = topology.nodes.get(id);
    return node && !hidden.has(node.type);
  })
);
```

### 5. **Debouncing User Input**

(Future enhancement: debounce search/filter inputs)

---

## Future Enhancements

### Short-term

1. **Persistence**

   - Save/load scope configurations
   - Restore user preferences (theme, hidden types, etc.)

2. **Search & Filter**

   - Node name search
   - Metric threshold filtering
   - Alert filtering

3. **Export**

   - Export graph as PNG/SVG
   - Export data as CSV/JSON

4. **Keyboard Navigation**
   - Arrow keys for node selection
   - Tab for next node
   - Enter for data panel

### Medium-term

1. **Real-time Data**

   - WebSocket integration for live metrics
   - Auto-refresh overlay metrics
   - Alert notifications

2. **Advanced Analytics**

   - Historical metric charts
   - Branch comparison
   - Trend analysis

3. **Collaboration**

   - Share graph views
   - Annotate nodes
   - Comment on branches

4. **Organization Topology**
   - Third topology type
   - Organizational hierarchy

### Long-term

1. **AI/ML Integration**

   - Anomaly detection
   - Predictive alerts
   - Smart recommendations

2. **Mobile Support**

   - Responsive design
   - Touch gestures
   - Mobile-optimized UI

3. **Multi-user**

   - User accounts
   - Role-based access
   - Audit logs

4. **API Backend**
   - REST API for topology management
   - GraphQL for flexible queries
   - Backend integration

---

## Appendix

### Key File Reference

| File                             | Purpose                | Lines of Code |
| -------------------------------- | ---------------------- | ------------- |
| `src/pages/RuntimePage.tsx`      | Main application state | ~600          |
| `src/components/GraphCanvas.tsx` | GoJS wrapper           | ~500          |
| `src/lib/scope.ts`               | Scope computation      | ~150          |
| `src/lib/folding.ts`             | Folding logic          | ~100          |
| `src/lib/hops.ts`                | Hop link generation    | ~150          |
| `src/lib/theme.ts`               | Theme engine           | ~50           |
| `src/lib/models.ts`              | Data models            | ~150          |
| `src/mocks/topologies.ts`        | Mock data              | ~300          |

### Environment Setup

```bash
# Node version
node -v  # >= 18.0.0

# Install dependencies
npm install

# Dev server
npm run dev  # http://localhost:8080

# Build
npm run build

# Preview production build
npm run preview

# Run tests
npx vitest
```

### Key Dependencies Version Reference

- React: `18.3.1`
- TypeScript: `5.8.3`
- Vite: `5.4.19`
- GoJS: `3.1.0`
- Tailwind CSS: `3.4.17`
- TanStack Query: `5.83.0`
- React Router: `6.30.1`
- Vitest: `3.2.4`

---

**Document End**

For questions or contributions, refer to the main `README.md` or contact the development team.
