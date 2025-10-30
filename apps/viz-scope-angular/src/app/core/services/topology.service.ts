/**
 * Topology Service
 * Provides access to topology data (Electrical, Cooling, Organization)
 */

import { Injectable, signal, computed } from '@angular/core';
import { Topology, TopologyType } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class TopologyService {
  /**
   * Electrical topology signal
   * Will be loaded from mock data or API
   */
  private readonly _electricalTopology = signal<Topology | null>(null);

  /**
   * Cooling topology signal
   * Will be loaded from mock data or API
   */
  private readonly _coolingTopology = signal<Topology | null>(null);

  /**
   * Organization topology signal
   * Will be loaded from mock data or API
   */
  private readonly _organizationTopology = signal<Topology | null>(null);

  /**
   * Read-only electrical topology
   */
  readonly electricalTopology = this._electricalTopology.asReadonly();

  /**
   * Read-only cooling topology
   */
  readonly coolingTopology = this._coolingTopology.asReadonly();

  /**
   * Read-only organization topology
   */
  readonly organizationTopology = this._organizationTopology.asReadonly();

  /**
   * Loading state signal
   */
  readonly loading = signal<boolean>(false);

  /**
   * Error state signal
   */
  readonly error = signal<string | null>(null);

  /**
   * Get topology by type (computed)
   */
  readonly getTopology = computed(() => {
    return (type: TopologyType): Topology | null => {
      switch (type) {
        case 'Electrical':
          return this._electricalTopology();
        case 'Cooling':
          return this._coolingTopology();
        case 'Organization':
          return this._organizationTopology();
        default:
          return null;
      }
    };
  });

  constructor() {
    // TODO: Load topologies from mock data or API
    // For now, initialize with empty maps
    this.initializeEmptyTopologies();
  }

  /**
   * Initialize empty topologies
   * This will be replaced with actual data loading
   */
  private initializeEmptyTopologies(): void {
    this._electricalTopology.set({
      type: 'Electrical',
      nodes: new Map(),
      links: [],
    });

    this._coolingTopology.set({
      type: 'Cooling',
      nodes: new Map(),
      links: [],
    });

    this._organizationTopology.set({
      type: 'Organization',
      nodes: new Map(),
      links: [],
    });
  }

  /**
   * Load electrical topology data
   * @param topology Topology data to load
   */
  loadElectricalTopology(topology: Topology): void {
    this._electricalTopology.set(topology);
  }

  /**
   * Load cooling topology data
   * @param topology Topology data to load
   */
  loadCoolingTopology(topology: Topology): void {
    this._coolingTopology.set(topology);
  }

  /**
   * Load organization topology data
   * @param topology Topology data to load
   */
  loadOrganizationTopology(topology: Topology): void {
    this._organizationTopology.set(topology);
  }

  /**
   * Load all topologies from mock data file
   * This will be called from app initialization
   * @returns Promise that resolves when loading is complete
   */
  async loadTopologies(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // TODO: Replace with actual data loading from assets/mocks/topologies.json
      // For now, just simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Mock data will be loaded here
      console.log('Topologies loaded (mock data pending)');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.error.set(errorMessage);
      console.error('Failed to load topologies:', err);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Check if a topology is loaded
   * @param type Topology type to check
   * @returns True if topology is loaded and has nodes
   */
  isTopologyLoaded(type: TopologyType): boolean {
    const topology = this.getTopology()(type);
    return topology !== null && topology.nodes.size > 0;
  }

  /**
   * Get all available topology types
   * @returns Array of topology types that are loaded
   */
  getAvailableTopologies(): TopologyType[] {
    const types: TopologyType[] = [];
    if (this.isTopologyLoaded('Electrical')) types.push('Electrical');
    if (this.isTopologyLoaded('Cooling')) types.push('Cooling');
    if (this.isTopologyLoaded('Organization')) types.push('Organization');
    return types;
  }
}
