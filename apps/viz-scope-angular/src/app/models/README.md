# Data Models

TypeScript interfaces, enums, and type definitions for the application.

## Structure

```
models/
├── types.ts                    # NodeType enum and ordering
├── node.model.ts              # Node interface
├── link.model.ts              # Link interface
├── topology.model.ts          # Topology interface
├── variable.model.ts          # Variable and MetricValue interfaces
├── meta-node.model.ts         # MetaNode interface
├── branch-data.model.ts       # BranchData interface
├── scope-config.model.ts      # ScopeConfig interface
├── time-window.model.ts       # TimeWindow types
└── index.ts                   # Barrel exports
```

## Guidelines

- Use interfaces for object shapes
- Use enums for fixed value sets
- Use type aliases for unions and primitives
- Prefer readonly properties when possible
- Document complex types with JSDoc comments
- Export all models from index.ts

## Migration from React

These files will be direct ports from `viz-scope-link/src/lib/`:

- `models.ts` → split into multiple model files
- `types.ts` → `types.ts` (same structure)

All models will remain pure TypeScript with no framework dependencies.
