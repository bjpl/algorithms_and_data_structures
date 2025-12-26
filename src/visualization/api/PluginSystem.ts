/**
 * Plugin System for Visualizers
 *
 * Extensible plugin architecture supporting:
 * - Custom algorithms
 * - Custom renderers
 * - Custom exporters
 * - Lifecycle hooks
 * - Event listeners
 *
 * @module visualization/api/PluginSystem
 */

import type { IVisualization } from '../core/interfaces';
import type {
  VisualizationEventType,
  ExecutionStep,
  ExportConfig,
  LayoutConfig,
} from '../core/types';
import type { VisualizerType } from './UnifiedAPI';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Plugin name */
  name: string;

  /** Plugin version */
  version: string;

  /** Plugin description */
  description?: string;

  /** Plugin author */
  author?: string;

  /** Visualizer types this plugin supports */
  compatibleTypes?: VisualizerType[];

  /** Dependencies on other plugins */
  dependencies?: string[];
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  /** Called when plugin is installed */
  onInstall?: (visualizer: IVisualization) => void | Promise<void>;

  /** Called when plugin is uninstalled */
  onUninstall?: (visualizer: IVisualization) => void | Promise<void>;

  /** Called before rendering */
  beforeRender?: (visualizer: IVisualization) => void | Promise<void>;

  /** Called after rendering */
  afterRender?: (visualizer: IVisualization) => void | Promise<void>;

  /** Called when data changes */
  onDataChange?: (visualizer: IVisualization) => void;

  /** Called on configuration update */
  onConfigUpdate?: (visualizer: IVisualization, updates: any) => void;
}

/**
 * Base plugin interface
 */
export interface IPlugin {
  /** Plugin metadata */
  readonly metadata: PluginMetadata;

  /** Lifecycle hooks */
  readonly hooks?: PluginHooks;

  /** Install plugin on visualizer */
  install(visualizer: IVisualization): void | Promise<void>;

  /** Uninstall plugin from visualizer */
  uninstall(visualizer: IVisualization): void | Promise<void>;
}

/**
 * Algorithm plugin interface
 */
export interface IAlgorithmPlugin extends IPlugin {
  /** Execute algorithm and generate steps */
  execute(data: any): ExecutionStep[];

  /** Get algorithm name */
  getAlgorithmName(): string;

  /** Get algorithm complexity */
  getComplexity(): {
    time: string;
    space: string;
  };
}

/**
 * Renderer plugin interface
 */
export interface IRendererPlugin extends IPlugin {
  /** Custom render function */
  render(visualizer: IVisualization, context: any): void;

  /** Get renderer name */
  getRendererName(): string;

  /** Check if renderer supports render mode */
  supports(renderMode: '2d' | '3d'): boolean;
}

/**
 * Exporter plugin interface
 */
export interface IExporterPlugin extends IPlugin {
  /** Export visualization */
  export(
    visualizer: IVisualization,
    config: ExportConfig
  ): Promise<Blob>;

  /** Get supported export formats */
  getSupportedFormats(): string[];

  /** Get exporter name */
  getExporterName(): string;
}

/**
 * Layout plugin interface
 */
export interface ILayoutPlugin extends IPlugin {
  /** Apply layout algorithm */
  applyLayout(
    visualizer: IVisualization,
    config: LayoutConfig
  ): Promise<void>;

  /** Get layout algorithm name */
  getLayoutName(): string;

  /** Check if layout supports visualizer type */
  supportsType(type: VisualizerType): boolean;
}

// ============================================================================
// BASE PLUGIN CLASS
// ============================================================================

/**
 * Abstract base class for plugins
 *
 * Provides common functionality and enforces interface compliance.
 */
export abstract class BasePlugin implements IPlugin {
  abstract metadata: PluginMetadata;
  hooks?: PluginHooks;

  constructor() {
    this.validateMetadata();
  }

  /**
   * Validate plugin metadata
   */
  private validateMetadata(): void {
    if (!this.metadata.name) {
      throw new Error('Plugin metadata must include name');
    }
    if (!this.metadata.version) {
      throw new Error('Plugin metadata must include version');
    }
  }

  /**
   * Install plugin
   */
  async install(visualizer: IVisualization): Promise<void> {
    // Call install hook
    if (this.hooks?.onInstall) {
      await this.hooks.onInstall(visualizer);
    }

    // Setup lifecycle hooks
    this.setupHooks(visualizer);
  }

  /**
   * Uninstall plugin
   */
  async uninstall(visualizer: IVisualization): Promise<void> {
    // Call uninstall hook
    if (this.hooks?.onUninstall) {
      await this.hooks.onUninstall(visualizer);
    }

    // Cleanup hooks
    this.cleanupHooks(visualizer);
  }

  /**
   * Setup lifecycle hooks
   */
  private setupHooks(visualizer: IVisualization): void {
    if (this.hooks?.beforeRender) {
      visualizer.on('render:start', () => {
        this.hooks!.beforeRender!(visualizer);
      });
    }

    if (this.hooks?.afterRender) {
      visualizer.on('render:complete', () => {
        this.hooks!.afterRender!(visualizer);
      });
    }
  }

  /**
   * Cleanup hooks
   */
  private cleanupHooks(_visualizer: IVisualization): void {
    // Remove event listeners
    // Implementation depends on event system
  }

  /**
   * Check if plugin is compatible with visualizer type
   */
  isCompatible(type: VisualizerType): boolean {
    if (!this.metadata.compatibleTypes) {
      return true; // Compatible with all if not specified
    }
    return this.metadata.compatibleTypes.includes(type);
  }
}

// ============================================================================
// PLUGIN REGISTRY
// ============================================================================

/**
 * Central registry for managing plugins
 */
export class PluginRegistry {
  private plugins: Map<string, IPlugin> = new Map();
  private installedPlugins: Map<IVisualization, Set<string>> = new Map();

  /**
   * Register plugin
   *
   * @param plugin - Plugin instance to register
   */
  register(plugin: IPlugin): void {
    const name = plugin.metadata.name;

    if (this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" is already registered`);
    }

    this.plugins.set(name, plugin);
  }

  /**
   * Unregister plugin
   *
   * @param name - Plugin name
   */
  unregister(name: string): void {
    this.plugins.delete(name);
  }

  /**
   * Get plugin by name
   *
   * @param name - Plugin name
   * @returns Plugin instance or undefined
   */
  get(name: string): IPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * List all registered plugins
   *
   * @returns Array of plugin metadata
   */
  list(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map((p) => p.metadata);
  }

  /**
   * Install plugin on visualizer
   *
   * @param visualizer - Target visualizer
   * @param pluginName - Plugin name
   */
  async install(
    visualizer: IVisualization,
    pluginName: string
  ): Promise<void> {
    const plugin = this.plugins.get(pluginName);

    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" not found`);
    }

    // Check if already installed
    const installed = this.installedPlugins.get(visualizer);
    if (installed?.has(pluginName)) {
      throw new Error(`Plugin "${pluginName}" is already installed`);
    }

    // Install plugin
    await plugin.install(visualizer);

    // Track installation
    if (!this.installedPlugins.has(visualizer)) {
      this.installedPlugins.set(visualizer, new Set());
    }
    this.installedPlugins.get(visualizer)!.add(pluginName);
  }

  /**
   * Uninstall plugin from visualizer
   *
   * @param visualizer - Target visualizer
   * @param pluginName - Plugin name
   */
  async uninstall(
    visualizer: IVisualization,
    pluginName: string
  ): Promise<void> {
    const plugin = this.plugins.get(pluginName);

    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" not found`);
    }

    // Uninstall plugin
    await plugin.uninstall(visualizer);

    // Remove from tracking
    this.installedPlugins.get(visualizer)?.delete(pluginName);
  }

  /**
   * Get installed plugins for visualizer
   *
   * @param visualizer - Target visualizer
   * @returns Array of installed plugins
   */
  getInstalled(visualizer: IVisualization): IPlugin[] {
    const names = this.installedPlugins.get(visualizer);
    if (!names) return [];

    return Array.from(names)
      .map((name) => this.plugins.get(name))
      .filter((p): p is IPlugin => p !== undefined);
  }

  /**
   * Get plugins compatible with visualizer type
   *
   * @param type - Visualizer type
   * @returns Array of compatible plugins
   */
  getPluginsForType(type: VisualizerType): IPlugin[] {
    return Array.from(this.plugins.values()).filter((plugin) => {
      if (plugin instanceof BasePlugin) {
        return plugin.isCompatible(type);
      }
      // Check metadata directly
      const compatibleTypes = plugin.metadata.compatibleTypes;
      return !compatibleTypes || compatibleTypes.includes(type);
    });
  }

  /**
   * Check if plugin is installed on visualizer
   *
   * @param visualizer - Target visualizer
   * @param pluginName - Plugin name
   * @returns True if installed
   */
  isInstalled(visualizer: IVisualization, pluginName: string): boolean {
    return this.installedPlugins.get(visualizer)?.has(pluginName) ?? false;
  }
}

// ============================================================================
// PLUGIN BUILDER
// ============================================================================

/**
 * Fluent builder for creating plugins
 */
export class PluginBuilder {
  private metadata: Partial<PluginMetadata> = {};
  private hooks: Partial<PluginHooks> = {};
  private installFn?: (visualizer: IVisualization) => void | Promise<void>;
  private uninstallFn?: (visualizer: IVisualization) => void | Promise<void>;

  /**
   * Set plugin name
   */
  named(name: string): this {
    this.metadata.name = name;
    return this;
  }

  /**
   * Set plugin version
   */
  version(version: string): this {
    this.metadata.version = version;
    return this;
  }

  /**
   * Set plugin description
   */
  description(description: string): this {
    this.metadata.description = description;
    return this;
  }

  /**
   * Set plugin author
   */
  by(author: string): this {
    this.metadata.author = author;
    return this;
  }

  /**
   * Set compatible visualizer types
   */
  compatibleWith(...types: VisualizerType[]): this {
    this.metadata.compatibleTypes = types;
    return this;
  }

  /**
   * Set dependencies
   */
  dependsOn(...dependencies: string[]): this {
    this.metadata.dependencies = dependencies;
    return this;
  }

  /**
   * Set install function
   */
  onInstall(
    fn: (visualizer: IVisualization) => void | Promise<void>
  ): this {
    this.installFn = fn;
    return this;
  }

  /**
   * Set uninstall function
   */
  onUninstall(
    fn: (visualizer: IVisualization) => void | Promise<void>
  ): this {
    this.uninstallFn = fn;
    return this;
  }

  /**
   * Add before-render hook
   */
  beforeRender(
    fn: (visualizer: IVisualization) => void | Promise<void>
  ): this {
    this.hooks.beforeRender = fn;
    return this;
  }

  /**
   * Add after-render hook
   */
  afterRender(
    fn: (visualizer: IVisualization) => void | Promise<void>
  ): this {
    this.hooks.afterRender = fn;
    return this;
  }

  /**
   * Add data-change hook
   */
  onDataChange(fn: (visualizer: IVisualization) => void): this {
    this.hooks.onDataChange = fn;
    return this;
  }

  /**
   * Build plugin
   */
  build(): IPlugin {
    if (!this.metadata.name || !this.metadata.version) {
      throw new Error('Plugin name and version are required');
    }

    const metadata = this.metadata as PluginMetadata;
    const hooks = this.hooks;
    const installFn = this.installFn;
    const uninstallFn = this.uninstallFn;

    return {
      metadata,
      hooks,
      async install(visualizer: IVisualization) {
        if (installFn) {
          await installFn(visualizer);
        }
      },
      async uninstall(visualizer: IVisualization) {
        if (uninstallFn) {
          await uninstallFn(visualizer);
        }
      },
    };
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Create new plugin builder
 */
export function createPlugin(): PluginBuilder {
  return new PluginBuilder();
}

/**
 * Global plugin registry instance
 */
export const globalRegistry = new PluginRegistry();
