/**
 * Visualizer Builder Pattern
 *
 * Provides fluent API for constructing visualizers with method chaining.
 * Handles validation, defaults, and ensures type safety during construction.
 *
 * @module visualization/api/VisualizerBuilder
 */

import type {
  VisualizationConfig,
  ThemeConfig,
  AnimationConfig,
  LayoutConfig,
  VisualNode,
  VisualEdge,
  RenderMode,
} from '../core/types';
import type { IVisualization } from '../core/interfaces';
import type { VisualizerType } from './UnifiedAPI';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Builder configuration state
 */
interface BuilderState {
  type?: VisualizerType;
  config: Partial<VisualizationConfig>;
  theme?: ThemeConfig;
  animation?: AnimationConfig;
  layout?: LayoutConfig;
  initialData?: {
    nodes: VisualNode[];
    edges?: VisualEdge[];
  };
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// VISUALIZER BUILDER
// ============================================================================

/**
 * Fluent builder for creating visualizer instances.
 *
 * Features:
 * - Method chaining for readable configuration
 * - Type-safe building process
 * - Automatic validation
 * - Sensible defaults
 * - Immutable building (each method returns new builder)
 *
 * @example
 * ```typescript
 * const visualizer = new VisualizerBuilder()
 *   .ofType('graph')
 *   .withId('network-viz')
 *   .withDimensions(800, 600)
 *   .withTheme(darkTheme)
 *   .withLayout({ algorithm: 'force-directed' })
 *   .withData(nodes, edges)
 *   .build();
 *
 * // Or use presets
 * const sortViz = new VisualizerBuilder()
 *   .ofType('sorting')
 *   .withPreset('default-sorting')
 *   .withData(arrayData)
 *   .build();
 * ```
 */
export class VisualizerBuilder {
  private state: BuilderState;

  constructor(initialState?: Partial<BuilderState>) {
    this.state = {
      config: {},
      ...initialState,
    };
  }

  // ==========================================================================
  // TYPE SELECTION
  // ==========================================================================

  /**
   * Set visualizer type
   *
   * @param type - Visualizer type (sorting, graph, tree, graph3d)
   * @returns New builder instance with type set
   */
  ofType(type: VisualizerType): VisualizerBuilder {
    return this.clone({ type });
  }

  /**
   * Create sorting visualizer
   */
  sorting(): VisualizerBuilder {
    return this.ofType('sorting').with2DMode();
  }

  /**
   * Create graph visualizer
   */
  graph(): VisualizerBuilder {
    return this.ofType('graph').with2DMode();
  }

  /**
   * Create tree visualizer
   */
  tree(): VisualizerBuilder {
    return this.ofType('tree').with2DMode();
  }

  /**
   * Create 3D graph visualizer
   */
  graph3D(): VisualizerBuilder {
    return this.ofType('graph3d').with3DMode();
  }

  // ==========================================================================
  // BASIC CONFIGURATION
  // ==========================================================================

  /**
   * Set visualizer ID
   */
  withId(id: string): VisualizerBuilder {
    return this.clone({
      config: { ...this.state.config, id },
    });
  }

  /**
   * Set title
   */
  withTitle(title: string): VisualizerBuilder {
    return this.clone({
      config: { ...this.state.config, title },
    });
  }

  /**
   * Set dimensions
   */
  withDimensions(width: number, height: number): VisualizerBuilder {
    return this.clone({
      config: { ...this.state.config, width, height },
    });
  }

  /**
   * Set width
   */
  withWidth(width: number): VisualizerBuilder {
    return this.clone({
      config: { ...this.state.config, width },
    });
  }

  /**
   * Set height
   */
  withHeight(height: number): VisualizerBuilder {
    return this.clone({
      config: { ...this.state.config, height },
    });
  }

  /**
   * Set background color
   */
  withBackground(color: string): VisualizerBuilder {
    return this.clone({
      config: { ...this.state.config, backgroundColor: color },
    });
  }

  /**
   * Enable auto-scaling
   */
  withAutoScale(enabled = true): VisualizerBuilder {
    return this.clone({
      config: { ...this.state.config, autoScale: enabled },
    });
  }

  /**
   * Set padding
   */
  withPadding(
    top: number,
    right?: number,
    bottom?: number,
    left?: number
  ): VisualizerBuilder {
    return this.clone({
      config: {
        ...this.state.config,
        padding: {
          top,
          right: right ?? top,
          bottom: bottom ?? top,
          left: left ?? right ?? top,
        },
      },
    });
  }

  // ==========================================================================
  // RENDER MODE
  // ==========================================================================

  /**
   * Set 2D rendering mode
   */
  with2DMode(): VisualizerBuilder {
    return this.clone({
      config: { ...this.state.config, renderMode: '2d' },
    });
  }

  /**
   * Set 3D rendering mode
   */
  with3DMode(): VisualizerBuilder {
    return this.clone({
      config: { ...this.state.config, renderMode: '3d' },
    });
  }

  /**
   * Set render mode
   */
  withRenderMode(mode: RenderMode): VisualizerBuilder {
    return this.clone({
      config: { ...this.state.config, renderMode: mode },
    });
  }

  // ==========================================================================
  // THEME CONFIGURATION
  // ==========================================================================

  /**
   * Set theme
   */
  withTheme(theme: ThemeConfig): VisualizerBuilder {
    return this.clone({ theme });
  }

  /**
   * Set theme variant
   */
  withThemeVariant(variant: 'light' | 'dark' | 'auto'): VisualizerBuilder {
    const theme = this.state.theme || this.getDefaultTheme();
    return this.clone({
      theme: { ...theme, variant },
    });
  }

  /**
   * Use dark theme
   */
  withDarkTheme(): VisualizerBuilder {
    return this.withThemeVariant('dark');
  }

  /**
   * Use light theme
   */
  withLightTheme(): VisualizerBuilder {
    return this.withThemeVariant('light');
  }

  // ==========================================================================
  // ANIMATION CONFIGURATION
  // ==========================================================================

  /**
   * Set animation configuration
   */
  withAnimation(config: AnimationConfig): VisualizerBuilder {
    return this.clone({ animation: config });
  }

  /**
   * Set animation duration
   */
  withAnimationDuration(duration: number): VisualizerBuilder {
    const animation = this.state.animation || {};
    return this.clone({
      animation: { ...animation, duration },
    });
  }

  /**
   * Set animation easing
   */
  withAnimationEasing(
    easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  ): VisualizerBuilder {
    const animation = this.state.animation || {};
    return this.clone({
      animation: { ...animation, easing },
    });
  }

  /**
   * Enable auto-play
   */
  withAutoPlay(enabled = true): VisualizerBuilder {
    const animation = this.state.animation || {};
    return this.clone({
      animation: { ...animation, autoPlay: enabled },
    });
  }

  // ==========================================================================
  // LAYOUT CONFIGURATION
  // ==========================================================================

  /**
   * Set layout configuration
   */
  withLayout(config: LayoutConfig): VisualizerBuilder {
    return this.clone({ layout: config });
  }

  /**
   * Set layout algorithm
   */
  withLayoutAlgorithm(
    algorithm: LayoutConfig['algorithm']
  ): VisualizerBuilder {
    const layout = this.state.layout || { algorithm: 'force-directed' };
    return this.clone({
      layout: { ...layout, algorithm },
    });
  }

  /**
   * Use force-directed layout
   */
  withForceDirectedLayout(
    options?: LayoutConfig['options']
  ): VisualizerBuilder {
    return this.withLayout({
      algorithm: 'force-directed',
      options,
    });
  }

  /**
   * Use hierarchical layout
   */
  withHierarchicalLayout(
    direction: 'TB' | 'BT' | 'LR' | 'RL' = 'TB'
  ): VisualizerBuilder {
    return this.withLayout({
      algorithm: 'hierarchical',
      options: {
        hierarchical: { direction },
      },
    });
  }

  /**
   * Use circular layout
   */
  withCircularLayout(radius?: number): VisualizerBuilder {
    return this.withLayout({
      algorithm: 'circular',
      options: {
        circular: { radius },
      },
    });
  }

  // ==========================================================================
  // DATA CONFIGURATION
  // ==========================================================================

  /**
   * Set initial data
   */
  withData(nodes: VisualNode[], edges?: VisualEdge[]): VisualizerBuilder {
    return this.clone({
      initialData: { nodes, edges },
    });
  }

  /**
   * Set nodes only
   */
  withNodes(nodes: VisualNode[]): VisualizerBuilder {
    return this.clone({
      initialData: {
        nodes,
        edges: this.state.initialData?.edges,
      },
    });
  }

  /**
   * Set edges only
   */
  withEdges(edges: VisualEdge[]): VisualizerBuilder {
    return this.clone({
      initialData: {
        nodes: this.state.initialData?.nodes || [],
        edges,
      },
    });
  }

  // ==========================================================================
  // PRESETS
  // ==========================================================================

  /**
   * Apply predefined configuration preset
   */
  withPreset(preset: string): VisualizerBuilder {
    const presetConfig = this.getPreset(preset);
    return this.clone({
      ...presetConfig,
      config: {
        ...this.state.config,
        ...presetConfig.config,
      },
    });
  }

  /**
   * Get configuration preset
   */
  private getPreset(preset: string): Partial<BuilderState> {
    const presets: Record<string, Partial<BuilderState>> = {
      'default-sorting': {
        type: 'sorting',
        config: {
          renderMode: '2d',
          width: 800,
          height: 400,
          autoScale: true,
        },
      },
      'default-graph': {
        type: 'graph',
        config: {
          renderMode: '2d',
          width: 800,
          height: 600,
          autoScale: true,
        },
        layout: {
          algorithm: 'force-directed',
          animate: true,
        },
      },
      'default-tree': {
        type: 'tree',
        config: {
          renderMode: '2d',
          width: 800,
          height: 600,
        },
        layout: {
          algorithm: 'tree',
        },
      },
      'default-graph3d': {
        type: 'graph3d',
        config: {
          renderMode: '3d',
          width: 800,
          height: 600,
        },
        layout: {
          algorithm: 'force-directed',
          animate: true,
        },
      },
    };

    return presets[preset] || {};
  }

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  /**
   * Validate current configuration
   *
   * @returns Validation result with errors and warnings
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!this.state.type) {
      errors.push('Visualizer type is required');
    }

    if (!this.state.config.id) {
      warnings.push('No ID specified, will generate default');
    }

    if (!this.state.config.renderMode) {
      warnings.push('No render mode specified, will use default');
    }

    if (!this.state.config.width || !this.state.config.height) {
      errors.push('Width and height are required');
    }

    // Logical validation
    if (
      this.state.config.renderMode === '3d' &&
      this.state.type !== 'graph3d'
    ) {
      errors.push('3D render mode requires graph3d type');
    }

    if (
      this.state.type === 'graph3d' &&
      this.state.config.renderMode === '2d'
    ) {
      errors.push('graph3d type requires 3D render mode');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ==========================================================================
  // BUILDING
  // ==========================================================================

  /**
   * Build visualizer instance
   *
   * @returns Constructed visualizer
   * @throws Error if configuration is invalid
   */
  build(): IVisualization {
    // Validate
    const validation = this.validate();
    if (!validation.valid) {
      throw new Error(
        `Invalid configuration:\n${validation.errors.join('\n')}`
      );
    }

    // Apply defaults
    const config = this.applyDefaults();

    // Create instance using factory
    // This would normally use VisualizerFactory
    // For now, we'll throw a placeholder
    throw new Error(
      'Build method requires VisualizerFactory integration. ' +
      'Use VisualizerFactory.createFromBuilder(builder) instead.'
    );
  }

  /**
   * Get current configuration state
   *
   * Used by factory to create instance
   */
  getState(): BuilderState {
    return { ...this.state };
  }

  /**
   * Apply defaults to configuration
   */
  private applyDefaults(): VisualizationConfig {
    const defaults: Partial<VisualizationConfig> = {
      id: `visualizer-${Date.now()}`,
      renderMode: '2d',
      width: 800,
      height: 600,
      backgroundColor: '#FFFFFF',
      autoScale: false,
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    };

    return {
      ...defaults,
      ...this.state.config,
    } as VisualizationConfig;
  }

  /**
   * Get default theme
   */
  private getDefaultTheme(): ThemeConfig {
    return {
      variant: 'light',
      colors: {
        primary: '#3498db',
        secondary: '#2ecc71',
        accent: '#e74c3c',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#2c3e50',
        textSecondary: '#7f8c8d',
        border: '#bdc3c7',
        error: '#e74c3c',
        warning: '#f39c12',
        success: '#27ae60',
        info: '#3498db',
      },
      typography: {
        fontFamily: 'Arial, sans-serif',
        fontSize: {
          small: 12,
          medium: 14,
          large: 16,
        },
        fontWeight: {
          normal: 400,
          bold: 700,
        },
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
      transitions: {
        fast: 150,
        normal: 300,
        slow: 500,
      },
    };
  }

  // ==========================================================================
  // IMMUTABILITY HELPERS
  // ==========================================================================

  /**
   * Clone builder with updated state
   */
  private clone(updates: Partial<BuilderState>): VisualizerBuilder {
    return new VisualizerBuilder({
      ...this.state,
      ...updates,
      config: {
        ...this.state.config,
        ...updates.config,
      },
    });
  }

  /**
   * Create new builder from existing configuration
   */
  static from(config: VisualizationConfig): VisualizerBuilder {
    return new VisualizerBuilder({
      config,
    });
  }
}
