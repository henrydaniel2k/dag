# viz-scope-angular - Application Structure

Angular-based topology visualization application migrated from React (viz-scope-link).

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                    # Singleton services, guards (providedIn: 'root')
│   │   ├── services/
│   │   │   ├── scope.service.ts
│   │   │   ├── folding.service.ts
│   │   │   ├── hops.service.ts
│   │   │   ├── theme.service.ts
│   │   │   ├── topology.service.ts
│   │   │   └── gojs.service.ts
│   │   ├── guards/
│   │   │   └── topology-loaded.guard.ts
│   │   ├── index.ts
│   │   └── README.md
│   │
│   ├── shared/                  # Reusable components, pipes, directives
│   │   ├── components/
│   │   │   ├── node-type-icon/
│   │   │   ├── visibility-chip/
│   │   │   ├── quick-node-type-chip/
│   │   │   └── hidden-branch-cue/
│   │   ├── directives/
│   │   ├── pipes/
│   │   │   ├── type-index.pipe.ts
│   │   │   └── metric-format.pipe.ts
│   │   ├── index.ts
│   │   └── README.md
│   │
│   ├── features/                # Feature modules (lazy-loaded)
│   │   ├── runtime/             # Main topology visualization feature
│   │   │   ├── components/
│   │   │   │   ├── runtime-page/
│   │   │   │   ├── graph-canvas/
│   │   │   │   ├── navigation/
│   │   │   │   ├── floating-dock/
│   │   │   │   ├── node-data-panel/
│   │   │   │   ├── branch-data-panel/
│   │   │   │   ├── node-type-panel/
│   │   │   │   ├── node-group-panel/
│   │   │   │   ├── quick-node-type-controls/
│   │   │   │   ├── metric-selector/
│   │   │   │   ├── view-menu/
│   │   │   │   ├── fold-selected-button/
│   │   │   │   ├── fold-state-control/
│   │   │   │   ├── immersive-toggle/
│   │   │   │   ├── partial-fold-dialog/
│   │   │   │   ├── partial-expand-dialog/
│   │   │   │   └── context-menu-portal/
│   │   │   ├── services/
│   │   │   │   └── runtime-state.service.ts (Signal-based state)
│   │   │   └── runtime.routes.ts
│   │   └── README.md
│   │
│   ├── models/                  # TypeScript interfaces, enums, types
│   │   ├── types.ts
│   │   ├── node.model.ts
│   │   ├── link.model.ts
│   │   ├── topology.model.ts
│   │   ├── variable.model.ts
│   │   ├── meta-node.model.ts
│   │   ├── branch-data.model.ts
│   │   ├── scope-config.model.ts
│   │   ├── time-window.model.ts
│   │   ├── index.ts
│   │   └── README.md
│   │
│   ├── app.component.ts
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── app.html
│
├── assets/
│   └── mocks/
│       └── topologies.json      # Mock topology data
│
├── environments/
│   ├── environment.ts           # Development config
│   └── environment.prod.ts      # Production config
│
├── styles/
│   ├── themes/
│   │   ├── _variables.scss      # Global variables
│   │   ├── _light-theme.scss    # Light theme colors
│   │   └── _dark-theme.scss     # Dark theme colors
│   └── _gojs-theme.scss         # GoJS theme integration
│
├── styles.scss                  # Global styles + ng-zorro imports
├── main.ts
└── index.html
```

## 🏗️ Architecture Layers

### 1. Core Layer (`app/core/`)

- **Singleton services** provided at root level
- Business logic (scope, folding, hops computation)
- Theme management
- GoJS integration wrapper
- Application-wide guards

**Guidelines:**

- All services should be `@Injectable({ providedIn: 'root' })`
- Services should be stateless or manage app-level state
- No UI components in core

### 2. Shared Layer (`app/shared/`)

- **Reusable presentational components**
- Custom pipes and directives
- Component library extensions
- UI utilities

**Guidelines:**

- Components should use OnPush change detection
- No feature-specific logic
- Can be used by any feature
- Use input()/output() signals

### 3. Features Layer (`app/features/`)

- **Feature modules** organized by business domain
- Feature-specific components
- Feature-scoped services (RuntimeStateService)
- Lazy-loaded when possible

**Guidelines:**

- Each feature is self-contained
- Feature services NOT provided at root
- Can depend on core and shared
- No cross-feature dependencies

### 4. Models Layer (`app/models/`)

- **Pure TypeScript** interfaces and types
- No framework dependencies
- Shared across all layers

**Guidelines:**

- Use interfaces for objects
- Use enums for fixed values
- Prefer readonly properties
- Export via index.ts

## 🎨 State Management

### Signal-based Architecture (Angular 16+)

**RuntimeStateService** uses Angular Signals for reactive state:

```typescript
// Writable signals (private)
private _selectedMsn = signal<string | null>(null);

// Read-only signals (public)
readonly selectedMsn = this._selectedMsn.asReadonly();

// Computed signals (derived)
readonly scope = computed(() => {
  const msn = this._selectedMsn();
  return this.scopeService.computeScope(msn, this.topology());
});

// Actions
setSelectedMsn(msnId: string): void {
  this._selectedMsn.set(msnId);
}
```

**Benefits:**

- ⚡ Fine-grained reactivity
- 🎯 Automatic dependency tracking
- 🚀 Better performance than Zone.js
- 📝 Simpler than RxJS for state
- 🔄 Easy to test

## 🎨 Theming

### ng-zorro-antd + GoJS Integration

- **Light/Dark mode** support
- CSS custom properties for GoJS
- Seamless theme switching
- Consistent styling across UI and graph

**Files:**

- `styles/themes/_light-theme.scss` - Light mode colors
- `styles/themes/_dark-theme.scss` - Dark mode colors
- `styles/_gojs-theme.scss` - GoJS CSS variables
- `core/services/theme.service.ts` - Theme management

## 🧪 Testing

- **Unit tests**: Jasmine + Karma
- **Component tests**: Angular Testing Utilities
- **Service tests**: TestBed + spies
- **Signal tests**: Direct signal() calls

## 📦 Dependencies

### Core

- Angular 19+
- TypeScript 5.8+
- GoJS 3.1.0

### UI

- ng-zorro-antd (Ant Design for Angular)
- Lucide Angular (icons)

### Testing

- Jasmine
- Karma
- Angular Testing Utilities

## 🚀 Development

```bash
# Install dependencies
npm install

# Development server
npm run serve

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## 📚 Migration from React

This project is migrated from `viz-scope-link` (React + Vite + shadcn/ui).

**Key changes:**

- React hooks → Angular Signals
- shadcn/ui → ng-zorro-antd
- Vite → Angular CLI
- React Router → Angular Router
- Vitest → Jasmine/Karma

See [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) for detailed migration strategy.

## 📝 Conventions

### File Naming

- Components: `*.component.ts`
- Services: `*.service.ts`
- Guards: `*.guard.ts`
- Pipes: `*.pipe.ts`
- Models: `*.model.ts`
- Tests: `*.spec.ts`

### Component Structure

```
component-name/
├── component-name.component.ts
├── component-name.component.html
├── component-name.component.scss
└── component-name.component.spec.ts
```

### Code Style

- Use standalone components (Angular 19+)
- Prefer signals over observables for state
- Use OnPush change detection
- Use input()/output() signals
- Follow Angular style guide

---

**Version**: 1.0  
**Last Updated**: 30/10/2025
