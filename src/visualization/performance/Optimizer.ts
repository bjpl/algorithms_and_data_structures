/**
 * Performance Optimizer
 *
 * Advanced rendering optimization techniques for high-performance visualizations.
 * Implements canvas optimizations, WebGL fallback, and intelligent caching.
 *
 * @module visualization/performance/Optimizer
 */

import type { VisualNode, VisualEdge, BoundingBox } from '../core/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Rendering strategy
 */
export type RenderStrategy = 'canvas-2d' | 'webgl' | 'svg' | 'hybrid';

/**
 * Optimization technique
 */
export type OptimizationTechnique =
  | 'dirty-rectangles'
  | 'layering'
  | 'culling'
  | 'batching'
  | 'pooling'
  | 'web-workers'
  | 'virtual-scrolling';

/**
 * Optimizer configuration
 */
export interface OptimizerConfig {
  /** Preferred rendering strategy */
  strategy: RenderStrategy;

  /** Enable dirty rectangle rendering */
  enableDirtyRectangles: boolean;

  /** Enable canvas layering */
  enableLayering: boolean;

  /** Enable viewport culling */
  enableCulling: boolean;

  /** Enable render batching */
  enableBatching: boolean;

  /** Enable RequestAnimationFrame pooling */
  enableRafPooling: boolean;

  /** Enable Web Workers for computation */
  enableWebWorkers: boolean;

  /** Enable virtual scrolling for large datasets */
  enableVirtualScrolling: boolean;

  /** WebGL threshold (node count) */
  webglThreshold: number;

  /** Viewport padding for culling */
  viewportPadding: number;

  /** Max batch size */
  maxBatchSize: number;
}

/**
 * Dirty rectangle
 */
export interface DirtyRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Render layer
 */
export interface RenderLayer {
  id: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  zIndex: number;
  isDirty: boolean;
  opacity: number;
}

/**
 * Render batch
 */
export interface RenderBatch {
  nodes: VisualNode[];
  edges: VisualEdge[];
  bounds: BoundingBox;
}

/**
 * Optimization statistics
 */
export interface OptimizationStats {
  /** Elements culled */
  culledNodes: number;
  culledEdges: number;

  /** Dirty rectangles */
  dirtyRegions: number;

  /** Batches processed */
  batchCount: number;

  /** Current strategy */
  strategy: RenderStrategy;

  /** Active optimizations */
  activeOptimizations: OptimizationTechnique[];

  /** Memory saved (bytes) */
  memorySaved: number;

  /** Render time saved (ms) */
  timeSaved: number;
}

// ============================================================================
// PERFORMANCE OPTIMIZER CLASS
// ============================================================================

/**
 * Advanced performance optimizer with multiple rendering strategies
 */
export class Optimizer {
  private config: OptimizerConfig;
  private dirtyRegions: DirtyRectangle[] = [];
  private layers: Map<string, RenderLayer> = new Map();
  private rafPool: Set<number> = new Set();
  private renderBatches: RenderBatch[] = [];
  private stats: OptimizationStats;

  private lastRenderTime = 0;
  private framePool: number[] = [];

  // WebGL context
  private gl: WebGLRenderingContext | null = null;
  private webglProgram: WebGLProgram | null = null;

  // Web Worker pool
  private workers: Worker[] = [];
  private workerTaskQueue: Array<{ task: any; resolve: Function; reject: Function }> = [];

  constructor(config?: Partial<OptimizerConfig>) {
    this.config = {
      strategy: config?.strategy ?? 'canvas-2d',
      enableDirtyRectangles: config?.enableDirtyRectangles ?? true,
      enableLayering: config?.enableLayering ?? true,
      enableCulling: config?.enableCulling ?? true,
      enableBatching: config?.enableBatching ?? true,
      enableRafPooling: config?.enableRafPooling ?? true,
      enableWebWorkers: config?.enableWebWorkers ?? false, // Disabled by default (requires setup)
      enableVirtualScrolling: config?.enableVirtualScrolling ?? false,
      webglThreshold: config?.webglThreshold ?? 1000,
      viewportPadding: config?.viewportPadding ?? 100,
      maxBatchSize: config?.maxBatchSize ?? 100,
    };

    this.stats = {
      culledNodes: 0,
      culledEdges: 0,
      dirtyRegions: 0,
      batchCount: 0,
      strategy: this.config.strategy,
      activeOptimizations: [],
      memorySaved: 0,
      timeSaved: 0,
    };
  }

  // ==========================================================================
  // DIRTY RECTANGLE OPTIMIZATION
  // ==========================================================================

  /**
   * Mark region as dirty (needs re-render)
   */
  public markDirty(rect: DirtyRectangle): void {
    if (!this.config.enableDirtyRectangles) {
      return;
    }

    // Merge with existing dirty regions if overlapping
    const merged = this.mergeDirtyRectangles([...this.dirtyRegions, rect]);
    this.dirtyRegions = merged;
    this.stats.dirtyRegions = merged.length;
  }

  /**
   * Mark node area as dirty
   */
  public markNodeDirty(node: VisualNode, padding = 10): void {
    const size = node.style?.size ?? 20;
    this.markDirty({
      x: node.position.x - size / 2 - padding,
      y: node.position.y - size / 2 - padding,
      width: size + padding * 2,
      height: size + padding * 2,
    });
  }

  /**
   * Mark edge area as dirty
   */
  public markEdgeDirty(source: VisualNode, target: VisualNode, padding = 5): void {
    const x1 = Math.min(source.position.x, target.position.x);
    const y1 = Math.min(source.position.y, target.position.y);
    const x2 = Math.max(source.position.x, target.position.x);
    const y2 = Math.max(source.position.y, target.position.y);

    this.markDirty({
      x: x1 - padding,
      y: y1 - padding,
      width: x2 - x1 + padding * 2,
      height: y2 - y1 + padding * 2,
    });
  }

  /**
   * Merge overlapping dirty rectangles
   */
  private mergeDirtyRectangles(rects: DirtyRectangle[]): DirtyRectangle[] {
    if (rects.length <= 1) {
      return rects;
    }

    const merged: DirtyRectangle[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < rects.length; i++) {
      if (processed.has(i)) {
        continue;
      }

      let current = rects[i];
      processed.add(i);

      // Try to merge with remaining rectangles
      for (let j = i + 1; j < rects.length; j++) {
        if (processed.has(j)) {
          continue;
        }

        if (this.rectanglesOverlap(current, rects[j])) {
          current = this.mergeRectangles(current, rects[j]);
          processed.add(j);
          j = i; // Restart inner loop to check for more merges
        }
      }

      merged.push(current);
    }

    return merged;
  }

  /**
   * Check if rectangles overlap
   */
  private rectanglesOverlap(r1: DirtyRectangle, r2: DirtyRectangle): boolean {
    return !(
      r1.x + r1.width < r2.x ||
      r2.x + r2.width < r1.x ||
      r1.y + r1.height < r2.y ||
      r2.y + r2.height < r1.y
    );
  }

  /**
   * Merge two rectangles into bounding box
   */
  private mergeRectangles(r1: DirtyRectangle, r2: DirtyRectangle): DirtyRectangle {
    const x = Math.min(r1.x, r2.x);
    const y = Math.min(r1.y, r2.y);
    const width = Math.max(r1.x + r1.width, r2.x + r2.width) - x;
    const height = Math.max(r1.y + r1.height, r2.y + r2.height) - y;

    return { x, y, width, height };
  }

  /**
   * Get dirty regions and clear
   */
  public getDirtyRegions(): DirtyRectangle[] {
    const regions = [...this.dirtyRegions];
    this.dirtyRegions = [];
    return regions;
  }

  /**
   * Clear all dirty regions
   */
  public clearDirty(): void {
    this.dirtyRegions = [];
    this.stats.dirtyRegions = 0;
  }

  // ==========================================================================
  // CANVAS LAYERING
  // ==========================================================================

  /**
   * Create render layer
   */
  public createLayer(
    id: string,
    width: number,
    height: number,
    zIndex = 0,
    opacity = 1
  ): RenderLayer {
    if (this.layers.has(id)) {
      return this.layers.get(id)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.zIndex = zIndex.toString();
    canvas.style.opacity = opacity.toString();
    canvas.style.pointerEvents = 'none';

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    const layer: RenderLayer = {
      id,
      canvas,
      ctx,
      zIndex,
      isDirty: true,
      opacity,
    };

    this.layers.set(id, layer);
    return layer;
  }

  /**
   * Get layer by ID
   */
  public getLayer(id: string): RenderLayer | undefined {
    return this.layers.get(id);
  }

  /**
   * Mark layer as dirty
   */
  public markLayerDirty(id: string): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.isDirty = true;
    }
  }

  /**
   * Clear layer
   */
  public clearLayer(id: string): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      layer.isDirty = false;
    }
  }

  /**
   * Remove layer
   */
  public removeLayer(id: string): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.canvas.remove();
      this.layers.delete(id);
    }
  }

  /**
   * Get all layers sorted by z-index
   */
  public getLayers(): RenderLayer[] {
    return Array.from(this.layers.values()).sort((a, b) => a.zIndex - b.zIndex);
  }

  // ==========================================================================
  // VIEWPORT CULLING
  // ==========================================================================

  /**
   * Cull nodes outside viewport
   */
  public cullNodes(nodes: VisualNode[], viewport: BoundingBox): VisualNode[] {
    if (!this.config.enableCulling) {
      return nodes;
    }

    const padding = this.config.viewportPadding;
    const culled = nodes.filter((node) => {
      const size = node.style?.size ?? 20;
      const halfSize = size / 2;

      return (
        node.position.x + halfSize >= viewport.min.x - padding &&
        node.position.x - halfSize <= viewport.max.x + padding &&
        node.position.y + halfSize >= viewport.min.y - padding &&
        node.position.y - halfSize <= viewport.max.y + padding
      );
    });

    this.stats.culledNodes = nodes.length - culled.length;
    return culled;
  }

  /**
   * Cull edges outside viewport
   */
  public cullEdges(
    edges: VisualEdge[],
    nodes: Map<string, VisualNode>,
    viewport: BoundingBox
  ): VisualEdge[] {
    if (!this.config.enableCulling) {
      return edges;
    }

    const padding = this.config.viewportPadding;
    const culled = edges.filter((edge) => {
      const source = nodes.get(edge.source);
      const target = nodes.get(edge.target);

      if (!source || !target) {
        return false;
      }

      // Check if edge intersects viewport
      const minX = Math.min(source.position.x, target.position.x);
      const maxX = Math.max(source.position.x, target.position.x);
      const minY = Math.min(source.position.y, target.position.y);
      const maxY = Math.max(source.position.y, target.position.y);

      return (
        maxX >= viewport.min.x - padding &&
        minX <= viewport.max.x + padding &&
        maxY >= viewport.min.y - padding &&
        minY <= viewport.max.y + padding
      );
    });

    this.stats.culledEdges = edges.length - culled.length;
    return culled;
  }

  // ==========================================================================
  // RENDER BATCHING
  // ==========================================================================

  /**
   * Create render batches from nodes
   */
  public createBatches(nodes: VisualNode[], edges: VisualEdge[]): RenderBatch[] {
    if (!this.config.enableBatching) {
      return [
        {
          nodes,
          edges,
          bounds: this.calculateBounds(nodes),
        },
      ];
    }

    const batches: RenderBatch[] = [];
    const batchSize = this.config.maxBatchSize;

    // Batch nodes
    for (let i = 0; i < nodes.length; i += batchSize) {
      const batchNodes = nodes.slice(i, i + batchSize);
      const nodeIds = new Set(batchNodes.map((n) => n.id));

      // Include edges that connect nodes in this batch
      const batchEdges = edges.filter(
        (e) => nodeIds.has(e.source) || nodeIds.has(e.target)
      );

      batches.push({
        nodes: batchNodes,
        edges: batchEdges,
        bounds: this.calculateBounds(batchNodes),
      });
    }

    this.stats.batchCount = batches.length;
    this.renderBatches = batches;
    return batches;
  }

  /**
   * Calculate bounds for nodes
   */
  private calculateBounds(nodes: VisualNode[]): BoundingBox {
    if (nodes.length === 0) {
      return {
        min: { x: 0, y: 0 },
        max: { x: 0, y: 0 },
      };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const size = node.style?.size ?? 20;
      const halfSize = size / 2;

      minX = Math.min(minX, node.position.x - halfSize);
      minY = Math.min(minY, node.position.y - halfSize);
      maxX = Math.max(maxX, node.position.x + halfSize);
      maxY = Math.max(maxY, node.position.y + halfSize);
    }

    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY },
    };
  }

  // ==========================================================================
  // RAF POOLING
  // ==========================================================================

  /**
   * Request animation frame with pooling
   */
  public requestFrame(callback: FrameRequestCallback): number {
    if (!this.config.enableRafPooling || typeof window === 'undefined') {
      return requestAnimationFrame(callback);
    }

    const handle = requestAnimationFrame((time) => {
      this.rafPool.delete(handle);
      callback(time);
    });

    this.rafPool.add(handle);
    return handle;
  }

  /**
   * Cancel animation frame
   */
  public cancelFrame(handle: number): void {
    if (typeof window === 'undefined') {
      return;
    }

    cancelAnimationFrame(handle);
    this.rafPool.delete(handle);
  }

  /**
   * Cancel all pending frames
   */
  public cancelAllFrames(): void {
    if (typeof window === 'undefined') {
      return;
    }

    for (const handle of Array.from(this.rafPool)) {
      cancelAnimationFrame(handle);
    }
    this.rafPool.clear();
  }

  // ==========================================================================
  // WEBGL RENDERING
  // ==========================================================================

  /**
   * Initialize WebGL context
   */
  public initWebGL(canvas: HTMLCanvasElement): boolean {
    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        return false;
      }

      this.gl = gl as WebGLRenderingContext;
      this.initWebGLProgram();
      return true;
    } catch (error) {
      console.error('WebGL initialization failed:', error);
      return false;
    }
  }

  /**
   * Initialize WebGL shader program
   */
  private initWebGLProgram(): void {
    if (!this.gl) {
      return;
    }

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      uniform vec2 u_resolution;
      varying vec4 v_color;

      void main() {
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        gl_PointSize = 10.0;
        v_color = a_color;
      }
    `;

    // Fragment shader
    const fragmentShaderSource = `
      precision mediump float;
      varying vec4 v_color;

      void main() {
        gl_FragColor = v_color;
      }
    `;

    const vertexShader = this.createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    if (!vertexShader || !fragmentShader) {
      return;
    }

    this.webglProgram = this.gl.createProgram();
    if (!this.webglProgram) {
      return;
    }

    this.gl.attachShader(this.webglProgram, vertexShader);
    this.gl.attachShader(this.webglProgram, fragmentShader);
    this.gl.linkProgram(this.webglProgram);

    if (!this.gl.getProgramParameter(this.webglProgram, this.gl.LINK_STATUS)) {
      console.error('WebGL program linking failed');
      this.webglProgram = null;
    }
  }

  /**
   * Create WebGL shader
   */
  private createShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) {
      return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Check if WebGL is available and should be used
   */
  public shouldUseWebGL(nodeCount: number): boolean {
    return (
      this.config.strategy === 'webgl' ||
      (this.config.strategy === 'hybrid' && nodeCount >= this.config.webglThreshold)
    );
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  /**
   * Get optimization statistics
   */
  public getStats(): OptimizationStats {
    const activeOptimizations: OptimizationTechnique[] = [];

    if (this.config.enableDirtyRectangles) {
      activeOptimizations.push('dirty-rectangles');
    }
    if (this.config.enableLayering) {
      activeOptimizations.push('layering');
    }
    if (this.config.enableCulling) {
      activeOptimizations.push('culling');
    }
    if (this.config.enableBatching) {
      activeOptimizations.push('batching');
    }
    if (this.config.enableRafPooling) {
      activeOptimizations.push('pooling');
    }
    if (this.config.enableWebWorkers) {
      activeOptimizations.push('web-workers');
    }
    if (this.config.enableVirtualScrolling) {
      activeOptimizations.push('virtual-scrolling');
    }

    return {
      ...this.stats,
      activeOptimizations,
      strategy: this.config.strategy,
    };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      culledNodes: 0,
      culledEdges: 0,
      dirtyRegions: 0,
      batchCount: 0,
      strategy: this.config.strategy,
      activeOptimizations: [],
      memorySaved: 0,
      timeSaved: 0,
    };
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Update optimizer configuration
   */
  public updateConfig(config: Partial<OptimizerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): OptimizerConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.cancelAllFrames();
    this.layers.clear();
    this.dirtyRegions = [];
    this.renderBatches = [];

    if (this.gl && this.webglProgram) {
      this.gl.deleteProgram(this.webglProgram);
      this.webglProgram = null;
      this.gl = null;
    }

    // Cleanup workers
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.workerTaskQueue = [];
  }
}
