/**
 * Core module exports
 * Singleton services, guards, and interceptors
 */

// Services
export * from './services/scope.service';
export * from './services/folding.service';
export * from './services/hops.service';
export * from './services/theme.service';
export * from './services/topology.service';
export * from './services/node-icon.service';
export * from './services/gojs.service';
export * from './services/runtime-state.service';

// Re-export types from scope service
export type { ScopeResult, HiddenBranchInfo } from './services/scope.service';

// Guards
// export * from './guards/topology-loaded.guard'; // TODO: Create guard
