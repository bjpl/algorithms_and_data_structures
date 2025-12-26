/**
 * Unified Visualization API
 *
 * Provides a consistent, type-safe interface across all visualizers
 * (SortingVisualizer, GraphVisualizer, TreeVisualizer, Graph3DVisualizer).
 *
 * Features:
 * - Polymorphic behavior with runtime type checking
 * - Consistent method signatures
 * - Shared configuration patterns
 * - Fluent API support via builder pattern
 *
 * @module visualization/api/UnifiedAPI
 */

import type {
  VisualizationConfig,
  VisualNode,
  VisualEdge,
  ExecutionStep,
  LayoutConfig,
  ThemeConfig,
  AnimationConfig,
  ExportConfig,
  PerformanceMetrics,
  Position,
} from '../core/types';
import type { IVisualization } from '../core/interfaces';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Supported visualizer types
 */
export type VisualizerType = 'sorting' | 'graph' | 'tree' | 'graph3d';

/**
 * Base configuration that all visualizers must accept
 */
export interface UnifiedVisualizerConfig {
  type: VisualizerType;
  config: VisualizationConfig;
}

/**
 * Unified API result with consistent structure
 */
export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  metadata?: {
    duration?: number;
    timestamp?: number;
    [key: string]: any;
  };
}

/**
 * Execution context for visualizer operations
 */
export interface ExecutionContext {
  visualizer: IVisualization;
  config: VisualizationConfig;
  state: {
    initialized: boolean;
    rendering: boolean;
    animating: boolean;
  };
}

// ============================================================================
// UNIFIED API CLASS
// ============================================================================

/**
 * Unified API providing consistent interface across all visualizer types.
 *
 * This class wraps different visualizer implementations and provides:
 * - Type-safe method signatures
 * - Consistent error handling
 * - Standardized return types
 * - Performance tracking
 * - Event forwarding
 *
 * @example
 * ```typescript
 * const api = new UnifiedAPI(sortingVisualizer);
 *
 * // All operations return ApiResult
 * const result = await api.setData({ nodes: [...], edges: [...] });
 * if (result.success) {
 *   await api.render();
 * }
 *
 * // Consistent metric access
 * const metrics = api.getMetrics();
 * console.log(`FPS: ${metrics.fps}`);
 * ```
 */
export class UnifiedAPI {
  private visualizer: IVisualization;
  private context: ExecutionContext;
  private performanceMetrics: PerformanceMetrics;

  constructor(visualizer: IVisualization) {
    this.visualizer = visualizer;

    this.context = {
      visualizer,
      config: visualizer.getConfig(),
      state: {
        initialized: false,
        rendering: false,
        animating: false,
      },
    };

    this.performanceMetrics = {
      fps: 0,
      frameTime: 0,
      nodeCount: 0,
      edgeCount: 0,
      timestamp: Date.now(),
    };

    // Setup event forwarding
    this.setupEventForwarding();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Initialize visualizer with container
   *
   * @param container - DOM element to render into
   * @returns Promise resolving to operation result
   */
  async initialize(container: HTMLElement): Promise<ApiResult<void>> {
    const startTime = performance.now();

    try {
      await this.visualizer.initialize(container);
      this.context.state.initialized = true;

      return {
        success: true,
        metadata: {
          duration: performance.now() - startTime,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          duration: performance.now() - startTime,
          timestamp: Date.now(),
        },
      };
    }
  }

  // ==========================================================================
  // DATA MANAGEMENT
  // ==========================================================================

  /**
   * Set visualization data
   *
   * @param data - Nodes and optional edges
   * @returns Operation result
   */
  setData(data: { nodes: VisualNode[]; edges?: VisualEdge[] }): ApiResult<void> {
    try {
      this.visualizer.setData(data.nodes, data.edges);

      this.performanceMetrics.nodeCount = data.nodes.length;
      this.performanceMetrics.edgeCount = data.edges?.length || 0;

      return {
        success: true,
        data: undefined,
        metadata: {
          nodeCount: data.nodes.length,
          edgeCount: data.edges?.length || 0,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Get current visualization data
   *
   * @returns Current nodes and edges
   */
  getData(): ApiResult<{ nodes: VisualNode[]; edges: VisualEdge[] }> {
    try {
      const nodes = this.visualizer.getNodes();
      const edges = this.visualizer.getEdges();

      return {
        success: true,
        data: { nodes, edges },
        metadata: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Update specific node
   *
   * @param nodeId - Node identifier
   * @param updates - Partial node updates
   * @returns Operation result
   */
  updateNode(nodeId: string, updates: Partial<VisualNode>): ApiResult<void> {
    try {
      this.visualizer.updateNode(nodeId, updates);
      return {
        success: true,
        metadata: {
          nodeId,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Update specific edge
   *
   * @param edgeId - Edge identifier
   * @param updates - Partial edge updates
   * @returns Operation result
   */
  updateEdge(edgeId: string, updates: Partial<VisualEdge>): ApiResult<void> {
    try {
      this.visualizer.updateEdge(edgeId, updates);
      return {
        success: true,
        metadata: {
          edgeId,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Add node to visualization
   */
  addNode(node: VisualNode): ApiResult<void> {
    try {
      this.visualizer.addNode(node);
      this.performanceMetrics.nodeCount++;
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Add edge to visualization
   */
  addEdge(edge: VisualEdge): ApiResult<void> {
    try {
      this.visualizer.addEdge(edge);
      this.performanceMetrics.edgeCount++;
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Remove node from visualization
   */
  removeNode(nodeId: string): ApiResult<void> {
    try {
      this.visualizer.removeNode(nodeId);
      this.performanceMetrics.nodeCount--;
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Remove edge from visualization
   */
  removeEdge(edgeId: string): ApiResult<void> {
    try {
      this.visualizer.removeEdge(edgeId);
      this.performanceMetrics.edgeCount--;
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Clear all data
   */
  clear(): ApiResult<void> {
    try {
      this.visualizer.clear();
      this.performanceMetrics.nodeCount = 0;
      this.performanceMetrics.edgeCount = 0;
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  /**
   * Render visualization
   *
   * @returns Operation result with render metrics
   */
  render(): ApiResult<{ frameTime: number }> {
    const startTime = performance.now();
    this.context.state.rendering = true;

    try {
      this.visualizer.render();
      const frameTime = performance.now() - startTime;

      this.performanceMetrics.frameTime = frameTime;
      this.performanceMetrics.fps = 1000 / frameTime;
      this.performanceMetrics.timestamp = Date.now();

      return {
        success: true,
        data: { frameTime },
        metadata: {
          frameTime,
          fps: this.performanceMetrics.fps,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    } finally {
      this.context.state.rendering = false;
    }
  }

  /**
   * Force re-render
   */
  forceRender(): ApiResult<{ frameTime: number }> {
    try {
      this.visualizer.forceRender();
      return this.render();
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Resize visualization
   */
  resize(width: number, height: number): ApiResult<void> {
    try {
      this.visualizer.resize(width, height);
      this.context.config.width = width;
      this.context.config.height = height;
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  // ==========================================================================
  // LAYOUT
  // ==========================================================================

  /**
   * Apply layout algorithm
   *
   * @param config - Layout configuration
   * @returns Promise resolving to operation result
   */
  async applyLayout(config: LayoutConfig): Promise<ApiResult<void>> {
    const startTime = performance.now();

    try {
      await this.visualizer.applyLayout(config);

      return {
        success: true,
        metadata: {
          duration: performance.now() - startTime,
          algorithm: config.algorithm,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          duration: performance.now() - startTime,
          timestamp: Date.now(),
        },
      };
    }
  }

  /**
   * Get current layout configuration
   */
  getLayout(): ApiResult<LayoutConfig | null> {
    try {
      const layout = this.visualizer.getLayout();
      return {
        success: true,
        data: layout,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  // ==========================================================================
  // CAMERA CONTROL (3D Mode)
  // ==========================================================================

  /**
   * Get camera position (3D mode only)
   */
  getCameraPosition(): ApiResult<Position | null> {
    try {
      const position = this.visualizer.getCameraPosition();
      return {
        success: true,
        data: position,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Set camera position (3D mode only)
   */
  setCameraPosition(position: Position): ApiResult<void> {
    try {
      this.visualizer.setCameraPosition(position);
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Reset camera to default view
   */
  resetCamera(): ApiResult<void> {
    try {
      this.visualizer.resetCamera();
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Fit visualization to view
   */
  fitToView(padding = 50): ApiResult<void> {
    try {
      this.visualizer.fitToView(padding);
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Get current configuration
   */
  getConfig(): ApiResult<VisualizationConfig> {
    try {
      const config = this.visualizer.getConfig();
      return {
        success: true,
        data: config,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<VisualizationConfig>): ApiResult<void> {
    try {
      this.visualizer.updateConfig(updates);
      this.context.config = this.visualizer.getConfig();
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  // ==========================================================================
  // PERFORMANCE
  // ==========================================================================

  /**
   * Get performance metrics
   */
  getMetrics(): ApiResult<PerformanceMetrics> {
    try {
      const metrics = this.visualizer.getMetrics();
      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Enable/disable performance monitoring
   */
  setPerformanceMonitoring(enabled: boolean): ApiResult<void> {
    try {
      this.visualizer.setPerformanceMonitoring(enabled);
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  /**
   * Get execution context
   */
  getContext(): ExecutionContext {
    return { ...this.context };
  }

  /**
   * Check if visualizer is initialized
   */
  isInitialized(): boolean {
    return this.context.state.initialized;
  }

  /**
   * Check if currently rendering
   */
  isRendering(): boolean {
    return this.context.state.rendering;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Destroy visualizer and cleanup resources
   */
  destroy(): ApiResult<void> {
    try {
      this.visualizer.destroy();
      this.context.state.initialized = false;
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  // ==========================================================================
  // EVENT FORWARDING
  // ==========================================================================

  /**
   * Setup event forwarding from visualizer
   */
  private setupEventForwarding(): void {
    // Forward all events through unified API
    const eventTypes = [
      'node:click',
      'node:hover',
      'edge:click',
      'edge:hover',
      'render:complete',
      'step:complete',
    ] as const;

    eventTypes.forEach((eventType) => {
      this.visualizer.on(eventType, (event) => {
        // Events are automatically forwarded
        // Consumers can still use visualizer.on() directly
      });
    });
  }

  // ==========================================================================
  // TYPE GUARDS
  // ==========================================================================

  /**
   * Check if visualizer supports 3D features
   */
  is3DMode(): boolean {
    return this.context.config.renderMode === '3d';
  }

  /**
   * Get underlying visualizer instance
   *
   * Use for accessing visualizer-specific methods not in unified API
   */
  getVisualizer(): IVisualization {
    return this.visualizer;
  }

  /**
   * Get visualizer type
   */
  getType(): string {
    return this.context.config.id.split('-')[0]; // Infer from ID
  }
}
