# Shared Module

Contains reusable components, directives, and pipes that can be used across multiple features.

## Structure

```
shared/
├── components/        # Reusable UI components
│   ├── node-type-icon/
│   ├── visibility-chip/
│   ├── quick-node-type-chip/
│   └── hidden-branch-cue/
├── directives/        # Custom directives
├── pipes/            # Custom pipes
│   ├── type-index.pipe.ts
│   └── metric-format.pipe.ts
└── index.ts          # Barrel exports
```

## Components

### NodeTypeIconComponent

Displays SVG icons for different node types (ES, ATS, UPS, etc.).

### VisibilityChipComponent

Toggle chip for showing/hiding node types with ng-zorro nz-tag.

### QuickNodeTypeChipComponent

Chip variant used in the Node Type Panel.

### HiddenBranchCueComponent

Indicator (double dots) for hidden branches on nodes.

## Pipes

### TypeIndexPipe

Returns the sort order index for a node type.

### MetricFormatPipe

Formats metric values with appropriate units (kW, °C, etc.).

## Guidelines

- Components should be small and focused
- Use OnPush change detection strategy
- Components should be presentation-only (no business logic)
- Use input signals (`input()`) and output signals (`output()`)
- All components should be thoroughly tested
