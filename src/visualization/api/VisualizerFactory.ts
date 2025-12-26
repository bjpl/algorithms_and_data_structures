/**
 * Visualizer Factory Pattern
 *
 * Centralized factory for creating visualizer instances with:
 * - Type-safe creation
 * - Configuration presets
 * - Plugin integration
 * - Dependency injection
 *
 * @module visualization/api/VisualizerFactory
 */

import type { VisualizationConfig } from '../core/types';
import type { IVisualization } from '../core/interfaces';
import type { VisualizerType } from './UnifiedAPI';
import { VisualizerBuilder } from './VisualizerBuilder';
import type { IPlugin, PluginRegistry } from './PluginSystem';

// Import actual visualizers (these would be the real implementations)
// For now, we'll use type imports
import type { SortingVisualizer } from '../algorithms/SortingVisualizer';
import type { GraphVisualizer } from '../algorithms/GraphVisualizer';
import type { TreeVisualizer } from '../algorithms/TreeVisualizer';
import type { Graph3DVisualizer } from '../3d/Graph3DVisualizer';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Factory configuration
 */
export interface FactoryConfig {
  /** Default visualizer type */
  defaultType?: VisualizerType;

  /** Plugin registry */
  plugins?: PluginRegistry;

  /** Enable strict mode (throw on errors vs return null) */
  strict?: boolean;

  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Visualizer constructor type
 */
type VisualizerConstructor<T extends IVisualization = IVisualization> = new (
  config: any
) => T;

/**
 * Registry of visualizer constructors
 */
type VisualizerRegistry = {
  [K in VisualizerType]: VisualizerConstructor;
};

/**
 * Configuration preset
 */
export interface ConfigPreset {
  name: string;
  description: string;
  type: VisualizerType;
  config: Partial<VisualizationConfig>;
}

// ============================================================================
// VISUALIZER FACTORY
// ============================================================================

/**
 * Factory for creating visualizer instances.
 *
 * Features:
 * - Type-safe visualizer creation
 * - Builder pattern integration
 * - Plugin system integration
 * - Configuration presets
 * - Singleton registry
 *
 * @example
 * ```typescript
 * // Create from config
 * const viz = VisualizerFactory.create({
 *   type: 'graph',
 *   config: { id: 'graph-1', width: 800, height: 600, renderMode: '2d' }
 * });
 *
 * // Create from builder
 * const builder = new VisualizerBuilder()
 *   .graph()
 *   .withDimensions(800, 600)
 *   .withForceDirectedLayout();
 *
 * const viz = VisualizerFactory.createFromBuilder(builder);
 *
 * // Create from preset
 * const viz = VisualizerFactory.createFromPreset('social-network');
 * ```
 */
export class VisualizerFactory {
  private static instance: VisualizerFactory | null = null;
  private registry: Partial<VisualizerRegistry> = {};
  private presets: Map<string, ConfigPreset> = new Map();
  private config: FactoryConfig;
  private pluginRegistry?: PluginRegistry;

  private constructor(config: FactoryConfig = {}) {
    this.config = {
      defaultType: 'graph',
      strict: true,
      debug: false,
      ...config,
    };

    this.pluginRegistry = config.plugins;

    // Register default presets
    this.registerDefaultPresets();
  }

  // ==========================================================================
  // SINGLETON ACCESS
  // ==========================================================================

  /**
   * Get singleton factory instance
   */
  static getInstance(config?: FactoryConfig): VisualizerFactory {
    if (!VisualizerFactory.instance) {
      VisualizerFactory.instance = new VisualizerFactory(config);
    }
    return VisualizerFactory.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  static reset(): void {
    VisualizerFactory.instance = null;
  }

  // ==========================================================================
  // VISUALIZER REGISTRATION
  // ==========================================================================

  /**
   * Register visualizer constructor
   *
   * @param type - Visualizer type
   * @param constructor - Visualizer constructor function
   */
  register(
    type: VisualizerType,
    constructor: VisualizerConstructor
  ): void {
    this.registry[type] = constructor;
    this.log(`Registered visualizer type: ${type}`);
  }

  /**
   * Register all built-in visualizers
   *
   * This would normally import and register actual constructors.
   * For type safety, we use a placeholder that throws.
   */
  registerBuiltInVisualizers(): void {
    // In production, this would be:
    // this.register('sorting', SortingVisualizer);
    // this.register('graph', GraphVisualizer);
    // this.register('tree', TreeVisualizer);
    // this.register('graph3d', Graph3DVisualizer);

    // Placeholder for type safety
    const placeholder = class implements IVisualization {
      getConfig() { return {} as VisualizationConfig; }
      updateConfig() { throw new Error('Not implemented'); }
      getRenderMode() { return '2d' as const; }
      setData() { throw new Error('Not implemented'); }
      getNodes() { return []; }
      getEdges() { return []; }
      updateNode() { throw new Error('Not implemented'); }
      updateEdge() { throw new Error('Not implemented'); }
      addNode() { throw new Error('Not implemented'); }
      addEdge() { throw new Error('Not implemented'); }
      removeNode() { throw new Error('Not implemented'); }
      removeEdge() { throw new Error('Not implemented'); }
      clear() { throw new Error('Not implemented'); }
      initialize() { return Promise.resolve(); }
      render() { throw new Error('Not implemented'); }
      forceRender() { throw new Error('Not implemented'); }
      resize() { throw new Error('Not implemented'); }
      destroy() { throw new Error('Not implemented'); }
      getState() { return {} as any; }
      setState() { throw new Error('Not implemented'); }
      reset() { throw new Error('Not implemented'); }
      on() { return () => {}; }
      off() { throw new Error('Not implemented'); }
      emit() { throw new Error('Not implemented'); }
      applyLayout() { return Promise.resolve(); }
      getLayout() { return null; }
      getCameraPosition() { return null; }
      setCameraPosition() { throw new Error('Not implemented'); }
      resetCamera() { throw new Error('Not implemented'); }
      fitToView() { throw new Error('Not implemented'); }
      getViewBounds() { return { x: 0, y: 0, width: 0, height: 0 } as any; }
      getMetrics() { return {} as any; }
      setPerformanceMonitoring() { throw new Error('Not implemented'); }
    } as any;

    this.register('sorting', placeholder);
    this.register('graph', placeholder);
    this.register('tree', placeholder);
    this.register('graph3d', placeholder);
  }

  /**
   * Check if visualizer type is registered
   */
  isRegistered(type: VisualizerType): boolean {
    return type in this.registry;
  }

  // ==========================================================================
  // CREATION METHODS
  // ==========================================================================

  /**
   * Create visualizer from type and config
   *
   * @param options - Type and configuration
   * @returns Visualizer instance
   */
  create(options: {
    type: VisualizerType;
    config: VisualizationConfig;
  }): IVisualization {
    const { type, config } = options;

    // Check if type is registered
    if (!this.isRegistered(type)) {
      const error = `Visualizer type "${type}" is not registered`;
      if (this.config.strict) {
        throw new Error(error);
      }
      this.log(error);
      return null as any;
    }

    // Get constructor
    const Constructor = this.registry[type]!;

    try {
      // Create instance
      const instance = new Constructor(config);

      // Apply plugins
      if (this.pluginRegistry) {
        this.applyPlugins(instance, type);
      }

      this.log(`Created ${type} visualizer: ${config.id}`);

      return instance;
    } catch (error) {
      const message = `Failed to create ${type} visualizer: ${(error as Error).message}`;
      if (this.config.strict) {
        throw new Error(message);
      }
      this.log(message);
      return null as any;
    }
  }

  /**
   * Create visualizer from builder
   *
   * @param builder - Configured builder instance
   * @returns Visualizer instance
   */
  createFromBuilder(builder: VisualizerBuilder): IVisualization {
    const state = builder.getState();

    if (!state.type) {
      throw new Error('Builder state has no type specified');
    }

    // Get or apply defaults to config
    const config: VisualizationConfig = {
      id: state.config.id || `visualizer-${Date.now()}`,
      renderMode: state.config.renderMode || '2d',
      width: state.config.width || 800,
      height: state.config.height || 600,
      backgroundColor: state.config.backgroundColor || '#FFFFFF',
      autoScale: state.config.autoScale ?? false,
      padding: state.config.padding || {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
      ...state.config,
    };

    // Create visualizer
    const visualizer = this.create({
      type: state.type,
      config,
    });

    // Set initial data if provided
    if (state.initialData) {
      visualizer.setData(state.initialData.nodes, state.initialData.edges);
    }

    // Apply layout if provided
    if (state.layout) {
      visualizer.applyLayout(state.layout);
    }

    return visualizer;
  }

  /**
   * Create visualizer from preset
   *
   * @param presetName - Name of registered preset
   * @param overrides - Optional config overrides
   * @returns Visualizer instance
   */
  createFromPreset(
    presetName: string,
    overrides?: Partial<VisualizationConfig>
  ): IVisualization {
    const preset = this.presets.get(presetName);

    if (!preset) {
      throw new Error(`Preset "${presetName}" not found`);
    }

    const config: VisualizationConfig = {
      id: `${preset.type}-${Date.now()}`,
      renderMode: '2d',
      width: 800,
      height: 600,
      ...preset.config,
      ...overrides,
    } as VisualizationConfig;

    return this.create({
      type: preset.type,
      config,
    });
  }

  // ==========================================================================
  // PRESET MANAGEMENT
  // ==========================================================================

  /**
   * Register configuration preset
   */
  registerPreset(preset: ConfigPreset): void {
    this.presets.set(preset.name, preset);
    this.log(`Registered preset: ${preset.name}`);
  }

  /**
   * Get preset by name
   */
  getPreset(name: string): ConfigPreset | undefined {
    return this.presets.get(name);
  }

  /**
   * List all available presets
   */
  listPresets(): ConfigPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Register default presets
   */
  private registerDefaultPresets(): void {
    this.registerPreset({
      name: 'basic-sorting',
      description: 'Basic sorting algorithm visualization',
      type: 'sorting',
      config: {
        renderMode: '2d',
        width: 800,
        height: 400,
        autoScale: true,
        backgroundColor: '#f5f5f5',
      },
    });

    this.registerPreset({
      name: 'force-graph',
      description: 'Force-directed graph layout',
      type: 'graph',
      config: {
        renderMode: '2d',
        width: 800,
        height: 600,
        autoScale: true,
      },
    });

    this.registerPreset({
      name: 'binary-tree',
      description: 'Binary tree visualization',
      type: 'tree',
      config: {
        renderMode: '2d',
        width: 800,
        height: 600,
      },
    });

    this.registerPreset({
      name: '3d-network',
      description: '3D network visualization',
      type: 'graph3d',
      config: {
        renderMode: '3d',
        width: 800,
        height: 600,
      },
    });

    this.registerPreset({
      name: 'social-network',
      description: 'Social network graph with clustering',
      type: 'graph',
      config: {
        renderMode: '2d',
        width: 1000,
        height: 700,
        autoScale: true,
        backgroundColor: '#ffffff',
      },
    });
  }

  // ==========================================================================
  // PLUGIN INTEGRATION
  // ==========================================================================

  /**
   * Apply plugins to visualizer instance
   */
  private applyPlugins(
    instance: IVisualization,
    type: VisualizerType
  ): void {
    if (!this.pluginRegistry) return;

    const plugins = this.pluginRegistry.getPluginsForType(type);

    for (const plugin of plugins) {
      try {
        plugin.install(instance);
        this.log(`Applied plugin "${plugin.metadata.name}" to ${type}`);
      } catch (error) {
        this.log(
          `Failed to apply plugin "${plugin.metadata.name}": ${(error as Error).message}`
        );
      }
    }
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Log message if debug enabled
   */
  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[VisualizerFactory] ${message}`);
    }
  }

  /**
   * Get factory configuration
   */
  getConfig(): FactoryConfig {
    return { ...this.config };
  }

  /**
   * Update factory configuration
   */
  updateConfig(updates: Partial<FactoryConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Create singleton factory with default config
 */
export const factory = VisualizerFactory.getInstance();

/**
 * Quick create functions
 */
export const create = {
  sorting: (config: VisualizationConfig) =>
    factory.create({ type: 'sorting', config }),

  graph: (config: VisualizationConfig) =>
    factory.create({ type: 'graph', config }),

  tree: (config: VisualizationConfig) =>
    factory.create({ type: 'tree', config }),

  graph3d: (config: VisualizationConfig) =>
    factory.create({ type: 'graph3d', config }),
};
