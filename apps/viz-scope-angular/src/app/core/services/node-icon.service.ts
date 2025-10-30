/**
 * Node Icon Service
 * Provides SVG geometry for node type icons used in GoJS diagrams and UI
 */

import { Injectable } from '@angular/core';
import { NodeType } from '../../models';

/**
 * Icon definition interface
 * Contains both GoJS geometry string and SVG path for flexibility
 */
export interface NodeTypeIconDef {
  /** SVG geometry string for GoJS Shape */
  geometry: string;
  /** SVG path for React/Angular rendering */
  path: string;
  /** ViewBox for the icon */
  viewBox: string;
  /** Default size in pixels */
  size: number;
}

@Injectable({
  providedIn: 'root',
})
export class NodeIconService {
  /**
   * Icon registry mapping NodeType to icon definitions
   * Icons are defined as SVG paths that can be used in both GoJS and Angular
   */
  private readonly iconRegistry: Record<NodeType, NodeTypeIconDef> = {
    Organization: {
      geometry: 'F M8 2 L8 6 L2 6 L2 14 L14 14 L14 6 L8 6 L8 2 z',
      path: 'M8 2v4H2v8h12V6H8V2z',
      viewBox: '0 0 16 16',
      size: 20,
    },
    ES: {
      geometry: 'F M8 1 L13 8 L8 15 L3 8 z',
      path: 'M8 1l5 7-5 7-5-7 5-7z',
      viewBox: '0 0 16 16',
      size: 20,
    },
    'Switch Gear': {
      geometry: 'F M2 5 L14 5 L14 11 L2 11 z M6 5 L6 11 M10 5 L10 11',
      path: 'M2 5h12v6H2V5zm4 0v6m4-6v6',
      viewBox: '0 0 16 16',
      size: 20,
    },
    ATS: {
      geometry: 'F M8 2 A6 6 0 1 1 8 14 A6 6 0 0 1 8 2 z M8 4 L8 8 L11 8',
      path: 'M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2zm0 2v4h3',
      viewBox: '0 0 16 16',
      size: 20,
    },
    UPS: {
      geometry: 'F M4 3 L12 3 L12 13 L4 13 z M6 6 L10 6 M6 9 L10 9',
      path: 'M4 3h8v10H4V3zm2 3h4m-4 3h4',
      viewBox: '0 0 16 16',
      size: 20,
    },
    PDU: {
      geometry:
        'F M3 2 L13 2 L13 14 L3 14 z M6 5 A1 1 0 1 1 6 7 A1 1 0 0 1 6 5 z M10 5 A1 1 0 1 1 10 7 A1 1 0 0 1 10 5 z M6 9 A1 1 0 1 1 6 11 A1 1 0 0 1 6 9 z M10 9 A1 1 0 1 1 10 11 A1 1 0 0 1 10 9 z',
      path: 'M3 2h10v12H3V2zm3 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM6 9a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z',
      viewBox: '0 0 16 16',
      size: 20,
    },
    'Rack PDU': {
      geometry:
        'F M4 1 L12 1 L12 15 L4 15 z M6 3 A0.5 0.5 0 1 1 6 4 A0.5 0.5 0 0 1 6 3 z M10 3 A0.5 0.5 0 1 1 10 4 A0.5 0.5 0 0 1 10 3 z M6 6 A0.5 0.5 0 1 1 6 7 A0.5 0.5 0 0 1 6 6 z M10 6 A0.5 0.5 0 1 1 10 7 A0.5 0.5 0 0 1 10 6 z M6 9 A0.5 0.5 0 1 1 6 10 A0.5 0.5 0 0 1 6 9 z M10 9 A0.5 0.5 0 1 1 10 10 A0.5 0.5 0 0 1 10 9 z M6 12 A0.5 0.5 0 1 1 6 13 A0.5 0.5 0 0 1 6 12 z M10 12 A0.5 0.5 0 1 1 10 13 A0.5 0.5 0 0 1 10 12 z',
      path: 'M4 1h8v14H4V1zm2 2a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm4 0a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zM6 6a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm4 0a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zM6 9a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm4 0a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm-4 3a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm4 0a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z',
      viewBox: '0 0 16 16',
      size: 20,
    },
    Server: {
      geometry:
        'F M2 3 L14 3 L14 6 L2 6 z M2 7 L14 7 L14 10 L2 10 z M2 11 L14 11 L14 14 L2 14 z M4 4.5 A0.5 0.5 0 1 1 4 5.5 A0.5 0.5 0 0 1 4 4.5 z M4 8.5 A0.5 0.5 0 1 1 4 9.5 A0.5 0.5 0 0 1 4 8.5 z M4 12.5 A0.5 0.5 0 1 1 4 13.5 A0.5 0.5 0 0 1 4 12.5 z',
      path: 'M2 3h12v3H2V3zm0 4h12v3H2V7zm0 4h12v3H2v-3zm2-9.5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm0 4a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm0 4a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z',
      viewBox: '0 0 16 16',
      size: 20,
    },
    Chiller: {
      geometry:
        'F M8 2 L11 5 L9 5 L9 8 L11 8 L8 11 L5 8 L7 8 L7 5 L5 5 z M3 12 L13 12 M4 13 L12 13 M5 14 L11 14',
      path: 'M8 2l3 3H9v3h2l-3 3-3-3h2V5H5l3-3zM3 12h10m-9 1h8m-7 1h6',
      viewBox: '0 0 16 16',
      size: 20,
    },
    CRAC: {
      geometry:
        'F M8 8 A5 5 0 1 1 8 8 z M8 3 L8 6 M11.5 4.5 L9.5 6.5 M13 8 L10 8 M11.5 11.5 L9.5 9.5 M8 13 L8 10 M4.5 11.5 L6.5 9.5 M3 8 L6 8 M4.5 4.5 L6.5 6.5',
      path: 'M8 8a5 5 0 1 1 0 0zM8 3v3m3.5-1.5l-2 2M13 8h-3m1.5 3.5l-2-2M8 13v-3m-3.5 1.5l2-2M3 8h3m-1.5-3.5l2 2',
      viewBox: '0 0 16 16',
      size: 20,
    },
  };

  /**
   * Fallback icon for unknown node types
   */
  private readonly fallbackIcon: NodeTypeIconDef = {
    geometry:
      'F M8 2 L8 10 M8 12 A0.5 0.5 0 1 1 8 13 A0.5 0.5 0 0 1 8 12 z M3 3 L13 3 L13 13 L3 13 z',
    path: 'M8 2v8m0 2a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zM3 3h10v10H3V3z',
    viewBox: '0 0 16 16',
    size: 20,
  };

  /**
   * Get icon definition for a node type
   * @param type Node type to get icon for
   * @returns Icon definition with geometry and path
   */
  getIcon(type: NodeType): NodeTypeIconDef {
    return this.iconRegistry[type] || this.fallbackIcon;
  }

  /**
   * Get GoJS geometry string for a node type
   * @param type Node type to get geometry for
   * @returns GoJS geometry string
   */
  getGeometry(type: NodeType): string {
    return this.getIcon(type).geometry;
  }

  /**
   * Get SVG path for a node type
   * @param type Node type to get path for
   * @returns SVG path string
   */
  getPath(type: NodeType): string {
    return this.getIcon(type).path;
  }

  /**
   * Get all registered node types
   * @returns Array of all registered node types
   */
  getAllTypes(): NodeType[] {
    return Object.keys(this.iconRegistry) as NodeType[];
  }
}
