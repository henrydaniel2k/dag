# Core Module

Contains singleton services, guards, and interceptors that are used throughout the application.

## Structure

```
core/
├── services/          # Singleton business logic services
│   ├── scope.service.ts
│   ├── folding.service.ts
│   ├── hops.service.ts
│   ├── theme.service.ts
│   ├── topology.service.ts
│   └── gojs.service.ts
├── guards/            # Route guards
│   └── topology-loaded.guard.ts
└── index.ts          # Barrel exports
```

## Services

### ScopeService

Handles scope computation (upstream/downstream traversal) for topology visualization.

### FoldingService

Manages node folding logic to create meta-nodes from multiple nodes of the same type.

### HopsService

Computes hop links when node types are hidden, creating dashed connections.

### ThemeService

Manages light/dark theme switching and bridges CSS variables to GoJS.

### TopologyService

Provides access to electrical and cooling topology data.

### GojsService

Wrapper service for GoJS diagram creation and updates.

## Guidelines

- All services should be `@Injectable({ providedIn: 'root' })`
- Services should be stateless when possible
- Use dependency injection for service composition
- Avoid circular dependencies
