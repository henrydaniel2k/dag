/**
 * Unit tests for model utility functions
 * Example test file demonstrating model testing patterns
 */

import { NodeType, TYPE_ORDER, getTypeIndex, compareNodeTypes } from './types';
import {
  Node,
  hasChildren,
  hasParents,
  belongsToTopology,
  getMetric,
  hasAlerts,
} from './node.model';
import {
  Link,
  createLinkId,
  isHopLink,
  isDirectLink,
  getHopDescription,
} from './link.model';
import {
  TimeWindow,
  getTimeWindowConfig,
  getTimeWindowMinutes,
  isTimeWindowValidForSIT,
  getMinimumTimeWindow,
} from './time-window.model';

describe('Types Model', () => {
  describe('getTypeIndex', () => {
    it('should return correct index for node types', () => {
      expect(getTypeIndex('ES')).toBe(1);
      expect(getTypeIndex('UPS')).toBe(4);
      expect(getTypeIndex('Server')).toBe(7);
    });

    it('should return -1 for invalid type', () => {
      expect(getTypeIndex('Invalid' as NodeType)).toBe(-1);
    });
  });

  describe('compareNodeTypes', () => {
    it('should sort node types correctly', () => {
      const types: NodeType[] = ['Server', 'ES', 'UPS', 'ATS'];
      const sorted = types.sort(compareNodeTypes);
      expect(sorted).toEqual(['ES', 'ATS', 'UPS', 'Server']);
    });
  });

  describe('TYPE_ORDER', () => {
    it('should have all node types', () => {
      expect(TYPE_ORDER.length).toBe(10);
      expect(TYPE_ORDER[0]).toBe('Organization');
      expect(TYPE_ORDER[TYPE_ORDER.length - 1]).toBe('CRAC');
    });
  });
});

describe('Node Model', () => {
  const mockNode: Node = {
    id: 'test-1',
    name: 'Test Node',
    type: 'UPS',
    topologies: ['Electrical'],
    parents: ['parent-1'],
    children: ['child-1', 'child-2'],
    metrics: [
      {
        value: 100,
        timestamp: new Date(),
        variable: {
          id: 'power',
          name: 'Power',
          type: 'extensive',
          unit: 'kW',
          sit: 15,
          isIntegrated: true,
        },
      },
    ],
    alerts: ['High Temperature'],
  };

  describe('hasChildren', () => {
    it('should return true if node has children', () => {
      expect(hasChildren(mockNode)).toBe(true);
    });

    it('should return false if node has no children', () => {
      const nodeWithoutChildren: Node = { ...mockNode, children: [] };
      expect(hasChildren(nodeWithoutChildren)).toBe(false);
    });
  });

  describe('hasParents', () => {
    it('should return true if node has parents', () => {
      expect(hasParents(mockNode)).toBe(true);
    });
  });

  describe('belongsToTopology', () => {
    it('should return true if node belongs to topology', () => {
      expect(belongsToTopology(mockNode, 'Electrical')).toBe(true);
    });

    it('should return false if node does not belong to topology', () => {
      expect(belongsToTopology(mockNode, 'Cooling')).toBe(false);
    });
  });

  describe('getMetric', () => {
    it('should return metric by variable ID', () => {
      const metric = getMetric(mockNode, 'power');
      expect(metric).toBeDefined();
      expect(metric?.value).toBe(100);
    });

    it('should return undefined for non-existent metric', () => {
      const metric = getMetric(mockNode, 'temperature');
      expect(metric).toBeUndefined();
    });
  });

  describe('hasAlerts', () => {
    it('should return true if node has alerts', () => {
      expect(hasAlerts(mockNode)).toBe(true);
    });

    it('should return false if node has no alerts', () => {
      const nodeWithoutAlerts: Node = { ...mockNode, alerts: [] };
      expect(hasAlerts(nodeWithoutAlerts)).toBe(false);
    });
  });
});

describe('Link Model', () => {
  const mockLink: Link = {
    id: 'link-1',
    source: 'node-1',
    target: 'node-2',
    topology: 'Electrical',
  };

  const mockHopLink: Link = {
    id: 'hop-1',
    source: 'node-1',
    target: 'node-3',
    topology: 'Electrical',
    isHop: true,
    viaNodes: ['node-2'],
  };

  describe('createLinkId', () => {
    it('should create link ID from source and target', () => {
      const id = createLinkId('node-1', 'node-2');
      expect(id).toBe('node-1->node-2');
    });
  });

  describe('isHopLink', () => {
    it('should return true for hop link', () => {
      expect(isHopLink(mockHopLink)).toBe(true);
    });

    it('should return false for direct link', () => {
      expect(isHopLink(mockLink)).toBe(false);
    });
  });

  describe('isDirectLink', () => {
    it('should return true for direct link', () => {
      expect(isDirectLink(mockLink)).toBe(true);
    });

    it('should return false for hop link', () => {
      expect(isDirectLink(mockHopLink)).toBe(false);
    });
  });

  describe('getHopDescription', () => {
    it('should return description for hop link', () => {
      const description = getHopDescription(mockHopLink);
      expect(description).toBe('via node-2');
    });

    it('should return empty string for direct link', () => {
      const description = getHopDescription(mockLink);
      expect(description).toBe('');
    });
  });
});

describe('TimeWindow Model', () => {
  describe('getTimeWindowConfig', () => {
    it('should return config for valid window', () => {
      const config = getTimeWindowConfig('1h');
      expect(config).toBeDefined();
      expect(config?.minutes).toBe(60);
    });

    it('should return undefined for invalid window', () => {
      const config = getTimeWindowConfig('invalid' as TimeWindow);
      expect(config).toBeUndefined();
    });
  });

  describe('getTimeWindowMinutes', () => {
    it('should return minutes for time window', () => {
      expect(getTimeWindowMinutes('15m')).toBe(15);
      expect(getTimeWindowMinutes('1h')).toBe(60);
      expect(getTimeWindowMinutes('24h')).toBe(1440);
    });

    it('should return 0 for Latest', () => {
      expect(getTimeWindowMinutes('Latest')).toBe(0);
    });
  });

  describe('isTimeWindowValidForSIT', () => {
    it('should return true if window is valid for SIT', () => {
      expect(isTimeWindowValidForSIT('1h', 15)).toBe(true);
      expect(isTimeWindowValidForSIT('1h', 60)).toBe(true);
    });

    it('should return false if window is too small for SIT', () => {
      expect(isTimeWindowValidForSIT('15m', 60)).toBe(false);
    });

    it('should always return true for Latest', () => {
      expect(isTimeWindowValidForSIT('Latest', 9999)).toBe(true);
    });
  });

  describe('getMinimumTimeWindow', () => {
    it('should return minimum valid window for SIT', () => {
      expect(getMinimumTimeWindow(15)).toBe('15m');
      expect(getMinimumTimeWindow(30)).toBe('1h');
      expect(getMinimumTimeWindow(100)).toBe('3h');
    });

    it('should return 30d for very large SIT', () => {
      expect(getMinimumTimeWindow(999999)).toBe('30d');
    });
  });
});
