/**
 * VisualizerFactory Tests
 *
 * Test suite for factory pattern functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  VisualizerFactory,
  factory,
} from '../../../src/visualization/api/VisualizerFactory';
import { VisualizerBuilder } from '../../../src/visualization/api/VisualizerBuilder';
import type { VisualizationConfig } from '../../../src/visualization/core/types';

describe('VisualizerFactory', () => {
  let factoryInstance: VisualizerFactory;

  beforeEach(() => {
    VisualizerFactory.reset();
    factoryInstance = VisualizerFactory.getInstance();
    factoryInstance.registerBuiltInVisualizers();
  });

  afterEach(() => {
    VisualizerFactory.reset();
  });

  // ==========================================================================
  // SINGLETON TESTS
  // ==========================================================================

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = VisualizerFactory.getInstance();
      const instance2 = VisualizerFactory.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = VisualizerFactory.getInstance();
      VisualizerFactory.reset();
      const instance2 = VisualizerFactory.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  // ==========================================================================
  // REGISTRATION TESTS
  // ==========================================================================

  describe('Visualizer Registration', () => {
    it('should check if type is registered', () => {
      expect(factoryInstance.isRegistered('graph')).toBe(true);
      expect(factoryInstance.isRegistered('sorting')).toBe(true);
    });

    it('should register built-in visualizers', () => {
      expect(factoryInstance.isRegistered('graph')).toBe(true);
      expect(factoryInstance.isRegistered('tree')).toBe(true);
      expect(factoryInstance.isRegistered('graph3d')).toBe(true);
      expect(factoryInstance.isRegistered('sorting')).toBe(true);
    });
  });

  // ==========================================================================
  // CREATION TESTS
  // ==========================================================================

  describe('Visualizer Creation', () => {
    const testConfig: VisualizationConfig = {
      id: 'test-viz',
      renderMode: '2d',
      width: 800,
      height: 600,
    };

    it('should create visualizer from config', () => {
      expect(() => {
        factoryInstance.create({
          type: 'graph',
          config: testConfig,
        });
      }).toThrow('Not implemented'); // Due to placeholder
    });

    it('should throw error for unregistered type in strict mode', () => {
      expect(() => {
        factoryInstance.create({
          type: 'nonexistent' as any,
          config: testConfig,
        });
      }).toThrow('not registered');
    });

    it('should create from builder', () => {
      const builder = new VisualizerBuilder()
        .graph()
        .withDimensions(800, 600)
        .withId('builder-test');

      expect(() => {
        factoryInstance.createFromBuilder(builder);
      }).toThrow('Not implemented'); // Due to placeholder
    });

    it('should throw error if builder has no type', () => {
      const builder = new VisualizerBuilder().withDimensions(800, 600);

      expect(() => {
        factoryInstance.createFromBuilder(builder);
      }).toThrow('no type specified');
    });
  });

  // ==========================================================================
  // PRESET TESTS
  // ==========================================================================

  describe('Preset Management', () => {
    it('should register preset', () => {
      factoryInstance.registerPreset({
        name: 'test-preset',
        description: 'Test preset',
        type: 'graph',
        config: {
          width: 1024,
          height: 768,
        },
      });

      const preset = factoryInstance.getPreset('test-preset');
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('test-preset');
    });

    it('should list all presets', () => {
      const presets = factoryInstance.listPresets();
      expect(presets.length).toBeGreaterThan(0);

      // Should have default presets
      const names = presets.map((p) => p.name);
      expect(names).toContain('basic-sorting');
      expect(names).toContain('force-graph');
    });

    it('should get preset by name', () => {
      const preset = factoryInstance.getPreset('force-graph');

      expect(preset).toBeDefined();
      expect(preset?.type).toBe('graph');
    });

    it('should create from preset', () => {
      expect(() => {
        factoryInstance.createFromPreset('force-graph');
      }).toThrow('Not implemented'); // Due to placeholder
    });

    it('should throw error for non-existent preset', () => {
      expect(() => {
        factoryInstance.createFromPreset('nonexistent');
      }).toThrow('not found');
    });

    it('should apply overrides when creating from preset', () => {
      const overrides: Partial<VisualizationConfig> = {
        width: 1200,
        backgroundColor: '#000000',
      };

      expect(() => {
        factoryInstance.createFromPreset('force-graph', overrides);
      }).toThrow('Not implemented'); // Due to placeholder
    });
  });

  // ==========================================================================
  // DEFAULT PRESETS TESTS
  // ==========================================================================

  describe('Default Presets', () => {
    it('should have basic-sorting preset', () => {
      const preset = factoryInstance.getPreset('basic-sorting');

      expect(preset).toBeDefined();
      expect(preset?.type).toBe('sorting');
      expect(preset?.config.renderMode).toBe('2d');
    });

    it('should have force-graph preset', () => {
      const preset = factoryInstance.getPreset('force-graph');

      expect(preset).toBeDefined();
      expect(preset?.type).toBe('graph');
    });

    it('should have binary-tree preset', () => {
      const preset = factoryInstance.getPreset('binary-tree');

      expect(preset).toBeDefined();
      expect(preset?.type).toBe('tree');
    });

    it('should have 3d-network preset', () => {
      const preset = factoryInstance.getPreset('3d-network');

      expect(preset).toBeDefined();
      expect(preset?.type).toBe('graph3d');
      expect(preset?.config.renderMode).toBe('3d');
    });

    it('should have social-network preset', () => {
      const preset = factoryInstance.getPreset('social-network');

      expect(preset).toBeDefined();
      expect(preset?.type).toBe('graph');
      expect(preset?.config.width).toBe(1000);
    });
  });

  // ==========================================================================
  // CONFIGURATION TESTS
  // ==========================================================================

  describe('Factory Configuration', () => {
    it('should get factory config', () => {
      const config = factoryInstance.getConfig();

      expect(config).toBeDefined();
      expect(config.defaultType).toBe('graph');
      expect(config.strict).toBe(true);
    });

    it('should update factory config', () => {
      factoryInstance.updateConfig({
        debug: true,
        defaultType: 'tree',
      });

      const config = factoryInstance.getConfig();

      expect(config.debug).toBe(true);
      expect(config.defaultType).toBe('tree');
    });
  });

  // ==========================================================================
  // CONVENIENCE EXPORTS TESTS
  // ==========================================================================

  describe('Convenience Exports', () => {
    it('should export singleton factory', () => {
      expect(factory).toBeInstanceOf(VisualizerFactory);
    });
  });
});
