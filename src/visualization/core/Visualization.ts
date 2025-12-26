/**
 * @file Abstract base class for all visualizations
 * @module visualization/core
 */

/**
 * Custom error class for visualization-related errors
 */
export class VisualizationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'VisualizationError';
    Object.setPrototypeOf(this, VisualizationError.prototype);
  }
}

/**
 * Supported rendering modes
 */
export type Renderer = 'canvas' | 'webgl';

/**
 * Supported themes
 */
export type Theme = 'dark' | 'light' | 'custom';

/**
 * Visualization configuration
 */
export interface VisualizationConfig {
  /** Canvas element to render to */
  canvas: HTMLCanvasElement;
  /** Width of the visualization */
  width: number;
  /** Height of the visualization */
  height: number;
  /** Visual theme */
  theme?: Theme;
  /** Rendering mode */
  renderer?: Renderer;
}

/**
 * Visualization event types
 */
export type VisualizationEvent =
  | 'init'
  | 'render'
  | 'update'
  | 'dispose'
  | 'resize'
  | 'themeChange'
  | 'stateChange'
  | 'error';

/**
 * Event listener callback type
 */
export type EventListener<T = any> = (data?: T) => void;

/**
 * Abstract base class for all visualizations
 *
 * Provides common functionality for:
 * - Canvas/WebGL rendering abstraction
 * - Event subscription system (observer pattern)
 * - Lifecycle management (init, update, dispose)
 * - Theme support
 * - Performance optimizations
 *
 * @abstract
 * @example
 * ```typescript
 * class MyVisualization extends Visualization {
 *   protected doRender(): void {
 *     // Render implementation
 *   }
 *
 *   protected doUpdate(deltaTime: number): void {
 *     // Update implementation
 *   }
 * }
 *
 * const viz = new MyVisualization({
 *   canvas: canvasElement,
 *   width: 800,
 *   height: 600,
 *   theme: 'dark'
 * });
 *
 * await viz.init();
 * viz.render();
 * ```
 */
export abstract class Visualization {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D | WebGLRenderingContext | null = null;
  protected width: number;
  protected height: number;
  protected theme: Theme;
  protected renderer: Renderer;

  private initialized = false;
  private disposed = false;
  private updateLoopActive = false;
  private animationFrameId: number | null = null;
  private lastUpdateTime = 0;

  // Event system
  private eventListeners: Map<VisualizationEvent, Set<EventListener>> = new Map();

  /**
   * Creates a new Visualization instance
   *
   * @param config - Configuration object
   * @throws {VisualizationError} If configuration is invalid
   */
  constructor(config: VisualizationConfig) {
    this.validateConfig(config);

    this.canvas = config.canvas;
    this.width = config.width;
    this.height = config.height;
    this.theme = config.theme ?? 'dark';
    this.renderer = config.renderer ?? 'canvas';

    // Set canvas dimensions
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  /**
   * Validates the configuration
   *
   * @param config - Configuration to validate
   * @throws {VisualizationError} If configuration is invalid
   */
  private validateConfig(config: VisualizationConfig): void {
    if (!config.canvas || !(config.canvas instanceof HTMLCanvasElement)) {
      throw new VisualizationError(
        'Invalid canvas element provided',
        'INVALID_CANVAS',
        { canvas: config.canvas }
      );
    }

    if (config.width <= 0 || config.height <= 0) {
      throw new VisualizationError(
        'Invalid dimensions: width and height must be positive',
        'INVALID_DIMENSIONS',
        { width: config.width, height: config.height }
      );
    }
  }

  /**
   * Initializes the visualization
   *
   * @throws {VisualizationError} If already initialized
   */
  public async init(): Promise<void> {
    if (this.initialized) {
      throw new VisualizationError(
        'Visualization already initialized',
        'ALREADY_INITIALIZED'
      );
    }

    this.ctx = this.createContext();

    this.initialized = true;
    this.emit('init');
  }

  /**
   * Creates the rendering context based on renderer type
   *
   * @returns The rendering context
   */
  private createContext(): CanvasRenderingContext2D | WebGLRenderingContext {
    if (this.renderer === 'webgl') {
      const ctx =
        this.canvas.getContext('webgl') || this.canvas.getContext('webgl2');

      if (!ctx) {
        // Fallback to canvas
        this.renderer = 'canvas';
        return this.canvas.getContext('2d')!;
      }

      return ctx;
    }

    return this.canvas.getContext('2d')!;
  }

  /**
   * Checks if the visualization is initialized
   *
   * @returns True if initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Checks if the visualization is disposed
   *
   * @returns True if disposed
   */
  public isDisposed(): boolean {
    return this.disposed;
  }

  /**
   * Renders the visualization
   *
   * @throws {VisualizationError} If not initialized or disposed
   */
  public render(): void {
    this.checkState();

    try {
      this.doRender();
      this.emit('render');
    } catch (error) {
      this.emit('error', { error });
      throw error;
    }
  }

  /**
   * Abstract method for rendering implementation
   * Must be implemented by subclasses
   *
   * @abstract
   * @protected
   */
  protected abstract doRender(): void;

  /**
   * Starts the update loop
   *
   * @throws {VisualizationError} If loop already active
   */
  public startUpdateLoop(): void {
    this.checkState();

    if (this.updateLoopActive) {
      throw new VisualizationError(
        'Update loop already active',
        'LOOP_ALREADY_ACTIVE'
      );
    }

    this.updateLoopActive = true;
    this.lastUpdateTime = performance.now();
    this.updateLoop();
  }

  /**
   * Stops the update loop
   */
  public stopUpdateLoop(): void {
    this.updateLoopActive = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Internal update loop using requestAnimationFrame
   */
  private updateLoop = (): void => {
    if (!this.updateLoopActive) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    try {
      this.doUpdate(deltaTime);
      this.render();
      this.emit('update', { deltaTime });
    } catch (error) {
      this.emit('error', { error });
    }

    this.animationFrameId = requestAnimationFrame(this.updateLoop);
  };

  /**
   * Abstract method for update implementation
   * Must be implemented by subclasses
   *
   * @abstract
   * @protected
   * @param deltaTime - Time elapsed since last update in milliseconds
   */
  protected abstract doUpdate(deltaTime: number): void;

  /**
   * Resizes the canvas
   *
   * @param width - New width
   * @param height - New height
   * @throws {VisualizationError} If dimensions are invalid
   */
  public resize(width: number, height: number): void {
    this.checkState();

    if (width <= 0 || height <= 0) {
      throw new VisualizationError(
        'Invalid dimensions: width and height must be positive',
        'INVALID_DIMENSIONS',
        { width, height }
      );
    }

    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    this.emit('resize', { width, height });
  }

  /**
   * Gets the current width
   *
   * @returns The width
   */
  public getWidth(): number {
    return this.width;
  }

  /**
   * Gets the current height
   *
   * @returns The height
   */
  public getHeight(): number {
    return this.height;
  }

  /**
   * Gets the current theme
   *
   * @returns The theme
   */
  public getTheme(): Theme {
    return this.theme;
  }

  /**
   * Sets the theme
   *
   * @param theme - New theme
   */
  public setTheme(theme: Theme): void {
    this.checkState();

    this.theme = theme;
    this.emit('themeChange', { theme });
  }

  /**
   * Gets the current renderer
   *
   * @returns The renderer type
   */
  public getRenderer(): Renderer {
    return this.renderer;
  }

  /**
   * Subscribes to an event
   *
   * @param event - Event type
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  public on<T = any>(event: VisualizationEvent, listener: EventListener<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(listener);

    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  /**
   * Emits an event to all subscribers
   *
   * @param event - Event type
   * @param data - Event data
   */
  protected emit<T = any>(event: VisualizationEvent, data?: T): void {
    const listeners = this.eventListeners.get(event);

    if (!listeners) return;

    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Checks if the visualization is in a valid state
   *
   * @throws {VisualizationError} If not initialized or disposed
   */
  private checkState(): void {
    if (!this.initialized) {
      throw new VisualizationError(
        'Visualization not initialized. Call init() first.',
        'NOT_INITIALIZED'
      );
    }

    if (this.disposed) {
      throw new VisualizationError(
        'Visualization has been disposed',
        'DISPOSED'
      );
    }
  }

  /**
   * Disposes the visualization and cleans up resources
   */
  public dispose(): void {
    if (this.disposed) return;

    this.stopUpdateLoop();
    this.eventListeners.clear();
    this.ctx = null;
    this.disposed = true;

    this.emit('dispose');
  }
}
