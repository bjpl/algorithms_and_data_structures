/**
 * PluginSystem Tests
 *
 * Test suite for plugin architecture functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BasePlugin,
  PluginRegistry,
  PluginBuilder,
  createPlugin,
} from '../../../src/visualization/api/PluginSystem';
import type {
  IPlugin,
  PluginMetadata,
} from '../../../src/visualization/api/PluginSystem';
import type { IVisualization } from '../../../src/visualization/core/interfaces';

// ============================================================================
// MOCK PLUGIN
// ============================================================================

class TestPlugin extends BasePlugin {
  metadata: PluginMetadata = {
    name: 'test-plugin',
    version: '1.0.0',
    description: 'Test plugin for testing',
  };

  installCalled = false;
  uninstallCalled = false;

  async install(visualizer: IVisualization): Promise<void> {
    this.installCalled = true;
    await super.install(visualizer);
  }

  async uninstall(visualizer: IVisualization): Promise<void> {
    this.uninstallCalled = true;
    await super.uninstall(visualizer);
  }
}

// ============================================================================
// MOCK VISUALIZER
// ============================================================================

const createMockVisualizer = (): IVisualization => {
  const eventHandlers = new Map<string, Function[]>();

  return {
    getConfig: vi.fn().mockReturnValue({ id: 'test' }),
    updateConfig: vi.fn(),
    getRenderMode: vi.fn().mockReturnValue('2d'),
    setData: vi.fn(),
    getNodes: vi.fn().mockReturnValue([]),
    getEdges: vi.fn().mockReturnValue([]),
    updateNode: vi.fn(),
    updateEdge: vi.fn(),
    addNode: vi.fn(),
    addEdge: vi.fn(),
    removeNode: vi.fn(),
    removeEdge: vi.fn(),
    clear: vi.fn(),
    initialize: vi.fn().mockResolvedValue(undefined),
    render: vi.fn(),
    forceRender: vi.fn(),
    resize: vi.fn(),
    destroy: vi.fn(),
    getState: vi.fn().mockReturnValue({}),
    setState: vi.fn(),
    reset: vi.fn(),
    on: vi.fn((eventType: string, handler: Function) => {
      if (!eventHandlers.has(eventType)) {
        eventHandlers.set(eventType, []);
      }
      eventHandlers.get(eventType)!.push(handler);
      return () => {};
    }),
    off: vi.fn(),
    emit: vi.fn(),
    applyLayout: vi.fn().mockResolvedValue(undefined),
    getLayout: vi.fn().mockReturnValue(null),
    getCameraPosition: vi.fn().mockReturnValue(null),
    setCameraPosition: vi.fn(),
    resetCamera: vi.fn(),
    fitToView: vi.fn(),
    getViewBounds: vi.fn().mockReturnValue({ min: {}, max: {} }),
    getMetrics: vi.fn().mockReturnValue({}),
    setPerformanceMonitoring: vi.fn(),
  } as unknown as IVisualization;
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe('PluginSystem', () => {
  let mockVisualizer: IVisualization;

  beforeEach(() => {
    mockVisualizer = createMockVisualizer();
  });

  // ==========================================================================
  // BASE PLUGIN TESTS
  // ==========================================================================

  describe('BasePlugin', () => {
    it('should create plugin instance', () => {
      const plugin = new TestPlugin();

      expect(plugin).toBeInstanceOf(BasePlugin);
      expect(plugin.metadata.name).toBe('test-plugin');
    });

    it('should validate metadata', () => {
      expect(() => {
        class InvalidPlugin extends BasePlugin {
          metadata = {} as any; // Invalid metadata
        }
        new InvalidPlugin();
      }).toThrow('metadata must include');
    });

    it('should call install hook', async () => {
      const plugin = new TestPlugin();
      await plugin.install(mockVisualizer);

      expect(plugin.installCalled).toBe(true);
    });

    it('should call uninstall hook', async () => {
      const plugin = new TestPlugin();
      await plugin.uninstall(mockVisualizer);

      expect(plugin.uninstallCalled).toBe(true);
    });

    it('should check compatibility', () => {
      const plugin = new TestPlugin();

      // No compatible types = compatible with all
      expect(plugin.isCompatible('graph')).toBe(true);
      expect(plugin.isCompatible('tree')).toBe(true);
    });

    it('should respect compatible types', () => {
      class SpecificPlugin extends BasePlugin {
        metadata: PluginMetadata = {
          name: 'specific',
          version: '1.0.0',
          compatibleTypes: ['graph', 'graph3d'],
        };
      }

      const plugin = new SpecificPlugin();

      expect(plugin.isCompatible('graph')).toBe(true);
      expect(plugin.isCompatible('graph3d')).toBe(true);
      expect(plugin.isCompatible('tree')).toBe(false);
    });
  });

  // ==========================================================================
  // PLUGIN REGISTRY TESTS
  // ==========================================================================

  describe('PluginRegistry', () => {
    let registry: PluginRegistry;

    beforeEach(() => {
      registry = new PluginRegistry();
    });

    it('should register plugin', () => {
      const plugin = new TestPlugin();
      registry.register(plugin);

      expect(registry.get('test-plugin')).toBe(plugin);
    });

    it('should throw on duplicate registration', () => {
      const plugin = new TestPlugin();
      registry.register(plugin);

      expect(() => {
        registry.register(plugin);
      }).toThrow('already registered');
    });

    it('should unregister plugin', () => {
      const plugin = new TestPlugin();
      registry.register(plugin);

      registry.unregister('test-plugin');

      expect(registry.get('test-plugin')).toBeUndefined();
    });

    it('should list all plugins', () => {
      const plugin1 = new TestPlugin();
      const plugin2 = new TestPlugin();
      plugin2.metadata.name = 'test-plugin-2';

      registry.register(plugin1);
      registry.register(plugin2);

      const list = registry.list();

      expect(list).toHaveLength(2);
      expect(list.map((p) => p.name)).toContain('test-plugin');
      expect(list.map((p) => p.name)).toContain('test-plugin-2');
    });

    it('should install plugin on visualizer', async () => {
      const plugin = new TestPlugin();
      registry.register(plugin);

      await registry.install(mockVisualizer, 'test-plugin');

      expect(plugin.installCalled).toBe(true);
      expect(registry.isInstalled(mockVisualizer, 'test-plugin')).toBe(true);
    });

    it('should throw on installing non-existent plugin', async () => {
      await expect(
        registry.install(mockVisualizer, 'nonexistent')
      ).rejects.toThrow('not found');
    });

    it('should throw on duplicate installation', async () => {
      const plugin = new TestPlugin();
      registry.register(plugin);

      await registry.install(mockVisualizer, 'test-plugin');

      await expect(
        registry.install(mockVisualizer, 'test-plugin')
      ).rejects.toThrow('already installed');
    });

    it('should uninstall plugin from visualizer', async () => {
      const plugin = new TestPlugin();
      registry.register(plugin);

      await registry.install(mockVisualizer, 'test-plugin');
      await registry.uninstall(mockVisualizer, 'test-plugin');

      expect(plugin.uninstallCalled).toBe(true);
      expect(registry.isInstalled(mockVisualizer, 'test-plugin')).toBe(false);
    });

    it('should get installed plugins', async () => {
      const plugin = new TestPlugin();
      registry.register(plugin);

      await registry.install(mockVisualizer, 'test-plugin');

      const installed = registry.getInstalled(mockVisualizer);

      expect(installed).toHaveLength(1);
      expect(installed[0]).toBe(plugin);
    });

    it('should get plugins for type', () => {
      class GraphPlugin extends BasePlugin {
        metadata: PluginMetadata = {
          name: 'graph-plugin',
          version: '1.0.0',
          compatibleTypes: ['graph'],
        };
      }

      const plugin1 = new TestPlugin(); // Compatible with all
      const plugin2 = new GraphPlugin(); // Compatible with graph only

      registry.register(plugin1);
      registry.register(plugin2);

      const graphPlugins = registry.getPluginsForType('graph');
      const treePlugins = registry.getPluginsForType('tree');

      expect(graphPlugins).toHaveLength(2); // Both compatible
      expect(treePlugins).toHaveLength(1); // Only test-plugin
    });
  });

  // ==========================================================================
  // PLUGIN BUILDER TESTS
  // ==========================================================================

  describe('PluginBuilder', () => {
    it('should build plugin with metadata', () => {
      const plugin = new PluginBuilder()
        .named('my-plugin')
        .version('2.0.0')
        .description('My custom plugin')
        .by('Test Author')
        .build();

      expect(plugin.metadata.name).toBe('my-plugin');
      expect(plugin.metadata.version).toBe('2.0.0');
      expect(plugin.metadata.description).toBe('My custom plugin');
      expect(plugin.metadata.author).toBe('Test Author');
    });

    it('should set compatible types', () => {
      const plugin = new PluginBuilder()
        .named('graph-only')
        .version('1.0.0')
        .compatibleWith('graph', 'graph3d')
        .build();

      expect(plugin.metadata.compatibleTypes).toEqual(['graph', 'graph3d']);
    });

    it('should set dependencies', () => {
      const plugin = new PluginBuilder()
        .named('dependent')
        .version('1.0.0')
        .dependsOn('plugin-a', 'plugin-b')
        .build();

      expect(plugin.metadata.dependencies).toEqual(['plugin-a', 'plugin-b']);
    });

    it('should add lifecycle hooks', () => {
      const installFn = vi.fn();
      const uninstallFn = vi.fn();

      const plugin = new PluginBuilder()
        .named('hooked')
        .version('1.0.0')
        .onInstall(installFn)
        .onUninstall(uninstallFn)
        .build();

      plugin.install(mockVisualizer);
      expect(installFn).toHaveBeenCalled();

      plugin.uninstall(mockVisualizer);
      expect(uninstallFn).toHaveBeenCalled();
    });

    it('should add render hooks', () => {
      const beforeRenderFn = vi.fn();
      const afterRenderFn = vi.fn();

      const plugin = new PluginBuilder()
        .named('render-hooks')
        .version('1.0.0')
        .beforeRender(beforeRenderFn)
        .afterRender(afterRenderFn)
        .build();

      expect(plugin.hooks?.beforeRender).toBe(beforeRenderFn);
      expect(plugin.hooks?.afterRender).toBe(afterRenderFn);
    });

    it('should throw without required fields', () => {
      expect(() => {
        new PluginBuilder().build();
      }).toThrow('name and version are required');
    });
  });

  // ==========================================================================
  // CREATE PLUGIN TESTS
  // ==========================================================================

  describe('createPlugin', () => {
    it('should create plugin builder', () => {
      const builder = createPlugin();

      expect(builder).toBeInstanceOf(PluginBuilder);
    });

    it('should build functional plugin', () => {
      const plugin = createPlugin()
        .named('quick-plugin')
        .version('1.0.0')
        .build();

      expect(plugin.metadata.name).toBe('quick-plugin');
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe('Integration', () => {
    it('should handle complete plugin lifecycle', async () => {
      const registry = new PluginRegistry();
      const installSpy = vi.fn();
      const uninstallSpy = vi.fn();

      const plugin = createPlugin()
        .named('lifecycle-test')
        .version('1.0.0')
        .onInstall(installSpy)
        .onUninstall(uninstallSpy)
        .build();

      // Register
      registry.register(plugin);

      // Install
      await registry.install(mockVisualizer, 'lifecycle-test');
      expect(installSpy).toHaveBeenCalled();

      // Verify installed
      expect(registry.isInstalled(mockVisualizer, 'lifecycle-test')).toBe(true);

      // Uninstall
      await registry.uninstall(mockVisualizer, 'lifecycle-test');
      expect(uninstallSpy).toHaveBeenCalled();

      // Verify uninstalled
      expect(registry.isInstalled(mockVisualizer, 'lifecycle-test')).toBe(false);
    });
  });
});
