/**
 * Unified Visualization API Exports
 *
 * Central export point for the unified visualization API system.
 * Provides all tools needed for creating, configuring, and extending visualizers.
 *
 * @module visualization/api
 */

// ============================================================================
// CORE API
// ============================================================================

export { UnifiedAPI } from './UnifiedAPI';
export type {
  VisualizerType,
  UnifiedVisualizerConfig,
  ApiResult,
  ExecutionContext,
} from './UnifiedAPI';

// ============================================================================
// BUILDER PATTERN
// ============================================================================

export { VisualizerBuilder } from './VisualizerBuilder';

// ============================================================================
// FACTORY PATTERN
// ============================================================================

export {
  VisualizerFactory,
  factory,
  create,
} from './VisualizerFactory';
export type {
  FactoryConfig,
  ConfigPreset,
} from './VisualizerFactory';

// ============================================================================
// PLUGIN SYSTEM
// ============================================================================

export {
  BasePlugin,
  PluginRegistry,
  PluginBuilder,
  createPlugin,
  globalRegistry,
} from './PluginSystem';
export type {
  PluginMetadata,
  PluginHooks,
  IPlugin,
  IAlgorithmPlugin,
  IRendererPlugin,
  IExporterPlugin,
  ILayoutPlugin,
} from './PluginSystem';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * @example Basic Usage
 * ```typescript
 * import { VisualizerBuilder, factory } from '@/visualization/api';
 *
 * // Method 1: Using Builder
 * const viz = new VisualizerBuilder()
 *   .graph()
 *   .withDimensions(800, 600)
 *   .withForceDirectedLayout()
 *   .withData(nodes, edges);
 *
 * const instance = factory.createFromBuilder(viz);
 *
 * // Method 2: Using Factory Directly
 * const viz2 = factory.create({
 *   type: 'graph',
 *   config: {
 *     id: 'my-graph',
 *     renderMode: '2d',
 *     width: 800,
 *     height: 600
 *   }
 * });
 *
 * // Method 3: Using Preset
 * const viz3 = factory.createFromPreset('force-graph');
 * ```
 *
 * @example Plugin Development
 * ```typescript
 * import { createPlugin, globalRegistry } from '@/visualization/api';
 *
 * // Create custom plugin
 * const myPlugin = createPlugin()
 *   .named('my-custom-plugin')
 *   .version('1.0.0')
 *   .description('Adds custom features')
 *   .compatibleWith('graph', 'graph3d')
 *   .beforeRender((viz) => {
 *     console.log('About to render!');
 *   })
 *   .build();
 *
 * // Register and use
 * globalRegistry.register(myPlugin);
 * await globalRegistry.install(visualizer, 'my-custom-plugin');
 * ```
 *
 * @example Advanced Builder
 * ```typescript
 * import { VisualizerBuilder } from '@/visualization/api';
 *
 * const viz = new VisualizerBuilder()
 *   .graph3D()
 *   .withId('social-network')
 *   .withTitle('Social Network Graph')
 *   .withDimensions(1200, 800)
 *   .withDarkTheme()
 *   .withAnimationDuration(500)
 *   .withAutoPlay()
 *   .withLayout({
 *     algorithm: 'force-directed',
 *     options: {
 *       forceDirected: {
 *         springLength: 100,
 *         springStrength: 0.05,
 *         repulsionStrength: 1000
 *       }
 *     },
 *     animate: true
 *   })
 *   .withData(socialNodes, socialEdges);
 *
 * const instance = factory.createFromBuilder(viz);
 * await instance.initialize(container);
 * instance.render();
 * ```
 */
