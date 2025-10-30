# Features Module

Contains feature-specific modules organized by business domain.

## Structure

```
features/
└── runtime/          # Main topology runtime visualization feature
    ├── components/   # Feature-specific components
    │   ├── runtime-page/
    │   ├── graph-canvas/
    │   ├── navigation/
    │   ├── floating-dock/
    │   ├── node-data-panel/
    │   ├── branch-data-panel/
    │   ├── node-type-panel/
    │   ├── node-group-panel/
    │   ├── quick-node-type-controls/
    │   ├── metric-selector/
    │   ├── view-menu/
    │   ├── fold-selected-button/
    │   ├── fold-state-control/
    │   ├── immersive-toggle/
    │   ├── partial-fold-dialog/
    │   ├── partial-expand-dialog/
    │   └── context-menu-portal/
    ├── services/     # Feature-specific services
    │   └── runtime-state.service.ts
    └── runtime.routes.ts
```

## Runtime Feature

The runtime feature is the main application feature that handles:

- Topology visualization with GoJS
- Node filtering and folding
- Branch hiding
- Metric overlay
- Scope management

### RuntimeStateService

Signal-based state management service for the entire runtime feature.
Contains all application state (selected MSN, hidden types, folded nodes, etc.)
and derived computed signals (scope, visible nodes, meta-nodes, links).

## Guidelines

- Each feature should be self-contained
- Feature services should NOT be providedIn: 'root'
- Use lazy loading for features when possible
- Feature modules should import SharedModule
- Avoid dependencies between features
