/**
 * Base Visualization Implementation
 *
 * Abstract base class implementing common functionality for all visualizations.
 * Provides event system, state management, and lifecycle hooks.
 */

import type {
  IVisualization,
  IAnimationController,
  IAlgorithmExecutor,
} from './interfaces';
import type {
  VisualizationConfig,
  VisualizationEventType,
  EventHandler,
  UnsubscribeFunction,
  VisualNode,
  VisualEdge,
  StateSnapshot,
  PerformanceMetrics,
  Position,
  BoundingBox,
  LayoutConfig,
  RenderMode,
} from './types';

/**
 * Abstract base class for all visualization implementations
 */
export abstract class BaseVisualization implements IVisualization {
  protected config: VisualizationConfig;
  protected container: HTMLElement | null = null;
  protected nodes: VisualNode[] = [];
  protected edges: VisualEdge[] = [];
  protected isInitialized = false;
  protected isDestroyed = false;
  protected eventHandlers: Map<string, Set<EventHandler>> = new Map();
  protected currentLayout: LayoutConfig | null = null;
  protected performanceMonitoring = false;
  protected lastMetrics: PerformanceMetrics | null = null;

  // Animation and executor can be optionally injected
  protected animationController?: IAnimationController;
  protected algorithmExecutor?: IAlgorithmExecutor;

  constructor(config: VisualizationConfig) {
    this.config = { ...config };
    this.validateConfig(config);
  }

  // ========================================================================
  // ABSTRACT METHODS (must be implemented by subclasses)
  // ========================================================================

  /**
   * Render the visualization. Subclasses implement specific rendering logic.
   */
  abstract render(): void;

  /**
   * Initialize renderer-specific resources (canvas, WebGL context, etc.)
   */
  protected abstract initializeRenderer(container: HTMLElement): Promise<void>;

  /**
   * Cleanup renderer-specific resources
   */
  protected abstract cleanupRenderer(): void;

  /**
   * Apply layout algorithm (subclass-specific implementation)
   */
  protected abstract applyLayoutInternal(config: LayoutConfig): Promise<void>;

  // ========================================================================
  // CONFIGURATION
  // ========================================================================

  getConfig(): VisualizationConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig(this.config);

    if (this.isInitialized) {
      this.forceRender();
    }
  }

  getRenderMode(): RenderMode {
    return this.config.renderMode;
  }

  protected validateConfig(config: VisualizationConfig): void {
    if (config.width <= 0 || config.height <= 0) {
      throw new Error('Width and height must be positive');
    }
    if (!config.id) {
      throw new Error('Visualization ID is required');
    }
  }

  // ========================================================================
  // DATA MANAGEMENT
  // ========================================================================

  setData(nodes: VisualNode[], edges: VisualEdge[] = []): void {
    this.nodes = [...nodes];
    this.edges = [...edges];
    this.validateData();

    if (this.isInitialized) {
      this.render();
    }
  }

  getNodes(): VisualNode[] {
    return [...this.nodes];
  }

  getEdges(): VisualEdge[] {
    return [...this.edges];
  }

  updateNode(nodeId: string, updates: Partial<VisualNode>): void {
    const index = this.nodes.findIndex((n) => n.id === nodeId);
    if (index === -1) {
      throw new Error(`Node ${nodeId} not found`);
    }

    this.nodes[index] = { ...this.nodes[index], ...updates };

    if (this.isInitialized) {
      this.render();
    }
  }

  updateEdge(edgeId: string, updates: Partial<VisualEdge>): void {
    const index = this.edges.findIndex((e) => e.id === edgeId);
    if (index === -1) {
      throw new Error(`Edge ${edgeId} not found`);
    }

    this.edges[index] = { ...this.edges[index], ...updates };

    if (this.isInitialized) {
      this.render();
    }
  }

  addNode(node: VisualNode): void {
    if (this.nodes.some((n) => n.id === node.id)) {
      throw new Error(`Node ${node.id} already exists`);
    }

    this.nodes.push(node);

    if (this.isInitialized) {
      this.render();
    }
  }

  addEdge(edge: VisualEdge): void {
    if (this.edges.some((e) => e.id === edge.id)) {
      throw new Error(`Edge ${edge.id} already exists`);
    }

    // Validate that source and target nodes exist
    if (!this.nodes.some((n) => n.id === edge.source)) {
      throw new Error(`Source node ${edge.source} not found`);
    }
    if (!this.nodes.some((n) => n.id === edge.target)) {
      throw new Error(`Target node ${edge.target} not found`);
    }

    this.edges.push(edge);

    if (this.isInitialized) {
      this.render();
    }
  }

  removeNode(nodeId: string): void {
    const index = this.nodes.findIndex((n) => n.id === nodeId);
    if (index === -1) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Remove associated edges
    this.edges = this.edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );

    this.nodes.splice(index, 1);

    if (this.isInitialized) {
      this.render();
    }
  }

  removeEdge(edgeId: string): void {
    const index = this.edges.findIndex((e) => e.id === edgeId);
    if (index === -1) {
      throw new Error(`Edge ${edgeId} not found`);
    }

    this.edges.splice(index, 1);

    if (this.isInitialized) {
      this.render();
    }
  }

  clear(): void {
    this.nodes = [];
    this.edges = [];

    if (this.isInitialized) {
      this.render();
    }
  }

  protected validateData(): void {
    // Ensure all edge references are valid
    const nodeIds = new Set(this.nodes.map((n) => n.id));
    for (const edge of this.edges) {
      if (!nodeIds.has(edge.source)) {
        throw new Error(`Invalid edge: source node ${edge.source} not found`);
      }
      if (!nodeIds.has(edge.target)) {
        throw new Error(`Invalid edge: target node ${edge.target} not found`);
      }
    }

    // Check for duplicate IDs
    const nodeIdSet = new Set<string>();
    for (const node of this.nodes) {
      if (nodeIdSet.has(node.id)) {
        throw new Error(`Duplicate node ID: ${node.id}`);
      }
      nodeIdSet.add(node.id);
    }

    const edgeIdSet = new Set<string>();
    for (const edge of this.edges) {
      if (edgeIdSet.has(edge.id)) {
        throw new Error(`Duplicate edge ID: ${edge.id}`);
      }
      edgeIdSet.add(edge.id);
    }
  }

  // ========================================================================
  // RENDERING & LIFECYCLE
  // ========================================================================

  async initialize(container: HTMLElement): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Visualization already initialized');
    }

    this.container = container;
    await this.initializeRenderer(container);
    this.isInitialized = true;

    this.emit({
      type: 'render:start',
      timestamp: Date.now(),
      source: this.config.id,
    });

    this.render();
  }

  forceRender(): void {
    if (!this.isInitialized) {
      throw new Error('Cannot render: visualization not initialized');
    }
    this.render();
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive');
    }

    this.config.width = width;
    this.config.height = height;

    if (this.isInitialized) {
      this.forceRender();
    }
  }

  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.cleanupRenderer();
    this.eventHandlers.clear();
    this.nodes = [];
    this.edges = [];
    this.container = null;
    this.isInitialized = false;
    this.isDestroyed = true;
  }

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  getState(): StateSnapshot {
    return {
      timestamp: Date.now(),
      stepIndex: this.algorithmExecutor?.getCurrentStepIndex() ?? 0,
      nodes: [...this.nodes],
      edges: [...this.edges],
      cameraPosition: this.getCameraPosition() ?? undefined,
      metadata: {
        config: this.config,
        layout: this.currentLayout,
      },
    };
  }

  setState(state: StateSnapshot): void {
    this.nodes = [...state.nodes];
    this.edges = [...state.edges];

    if (state.cameraPosition) {
      this.setCameraPosition(state.cameraPosition);
    }

    if (this.isInitialized) {
      this.render();
    }
  }

  reset(): void {
    this.clear();
    this.resetCamera();
    if (this.animationController) {
      this.animationController.stop();
    }
    if (this.algorithmExecutor) {
      this.algorithmExecutor.reset();
    }
  }

  // ========================================================================
  // EVENT SYSTEM (Observer Pattern)
  // ========================================================================

  on<T extends VisualizationEventType>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): UnsubscribeFunction {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    const handlers = this.eventHandlers.get(eventType)!;
    handlers.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler);
    };
  }

  off<T extends VisualizationEventType>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler as EventHandler);
    }
  }

  emit<T extends VisualizationEventType>(event: T): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      });
    }
  }

  // ========================================================================
  // LAYOUT
  // ========================================================================

  async applyLayout(config: LayoutConfig): Promise<void> {
    this.currentLayout = config;
    await this.applyLayoutInternal(config);

    if (this.isInitialized) {
      this.render();
    }
  }

  getLayout(): LayoutConfig | null {
    return this.currentLayout ? { ...this.currentLayout } : null;
  }

  // ========================================================================
  // CAMERA CONTROL (default implementations for 2D, override for 3D)
  // ========================================================================

  getCameraPosition(): Position | null {
    // 2D visualizations don't have a camera
    return null;
  }

  setCameraPosition(_position: Position): void {
    // No-op for 2D visualizations
  }

  resetCamera(): void {
    // No-op for 2D visualizations
  }

  fitToView(padding = 20): void {
    if (this.nodes.length === 0) {
      return;
    }

    const bounds = this.calculateBoundingBox(this.nodes);
    const scale = this.calculateFitScale(bounds, padding);

    // Apply scale and center (subclass-specific implementation)
    this.applyFitTransform(bounds, scale, padding);
  }

  getViewBounds(): BoundingBox {
    return this.calculateBoundingBox(this.nodes);
  }

  protected calculateBoundingBox(nodes: VisualNode[]): BoundingBox {
    if (nodes.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
      };
    }

    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (const node of nodes) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      minZ = Math.min(minZ, node.position.z ?? 0);
      maxX = Math.max(maxX, node.position.x);
      maxY = Math.max(maxY, node.position.y);
      maxZ = Math.max(maxZ, node.position.z ?? 0);
    }

    return {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
    };
  }

  protected calculateFitScale(bounds: BoundingBox, padding: number): number {
    const width = bounds.max.x - bounds.min.x;
    const height = bounds.max.y - bounds.min.y;
    const availableWidth = this.config.width - padding * 2;
    const availableHeight = this.config.height - padding * 2;

    return Math.min(availableWidth / width, availableHeight / height);
  }

  protected applyFitTransform(
    _bounds: BoundingBox,
    _scale: number,
    _padding: number
  ): void {
    // Subclass-specific implementation
  }

  // ========================================================================
  // PERFORMANCE MONITORING
  // ========================================================================

  getMetrics(): PerformanceMetrics {
    if (!this.lastMetrics) {
      return {
        fps: 0,
        frameTime: 0,
        nodeCount: this.nodes.length,
        edgeCount: this.edges.length,
        timestamp: Date.now(),
      };
    }
    return { ...this.lastMetrics };
  }

  setPerformanceMonitoring(enabled: boolean): void {
    this.performanceMonitoring = enabled;
  }

  protected updateMetrics(frameTime: number): void {
    if (!this.performanceMonitoring) {
      return;
    }

    this.lastMetrics = {
      fps: frameTime > 0 ? 1000 / frameTime : 0,
      frameTime,
      nodeCount: this.nodes.length,
      edgeCount: this.edges.length,
      memoryUsage: this.estimateMemoryUsage(),
      timestamp: Date.now(),
    };
  }

  protected estimateMemoryUsage(): number {
    // Rough estimate: each node ~1KB, each edge ~0.5KB
    const nodeMem = this.nodes.length * 1;
    const edgeMem = this.edges.length * 0.5;
    return nodeMem + edgeMem;
  }

  // ========================================================================
  // DEPENDENCY INJECTION
  // ========================================================================

  setAnimationController(controller: IAnimationController): void {
    this.animationController = controller;
  }

  setAlgorithmExecutor(executor: IAlgorithmExecutor): void {
    this.algorithmExecutor = executor;
    executor.setVisualization(this);
  }
}
