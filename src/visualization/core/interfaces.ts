/**
 * Core Interfaces for Visualization System
 *
 * Production-ready interface definitions for the unified visualization API.
 * Follows Observer pattern and supports extensibility through composition.
 */

import type {
  VisualizationConfig,
  ThemeConfig,
  AnimationConfig,
  ExportConfig,
  LayoutConfig,
  RenderMode,
  AnimationState,
  ExportFormat,
  VisualNode,
  VisualEdge,
  ExecutionStep,
  StateSnapshot,
  VisualizationEventType,
  EventHandler,
  UnsubscribeFunction,
  PerformanceMetrics,
  Position,
  BoundingBox,
} from './types';

// ============================================================================
// BASE VISUALIZATION INTERFACE
// ============================================================================

/**
 * Core interface that all visualizations must implement.
 * Provides unified API for 2D and 3D visualizations.
 */
export interface IVisualization {
  // ------------------------------------------------------------------------
  // Configuration
  // ------------------------------------------------------------------------

  /** Get current configuration */
  getConfig(): VisualizationConfig;

  /** Update configuration (partial update supported) */
  updateConfig(config: Partial<VisualizationConfig>): void;

  /** Get render mode (2D or 3D) */
  getRenderMode(): RenderMode;

  // ------------------------------------------------------------------------
  // Data Management
  // ------------------------------------------------------------------------

  /** Set visualization data (nodes and edges) */
  setData(nodes: VisualNode[], edges?: VisualEdge[]): void;

  /** Get current nodes */
  getNodes(): VisualNode[];

  /** Get current edges */
  getEdges(): VisualEdge[];

  /** Update specific node */
  updateNode(nodeId: string, updates: Partial<VisualNode>): void;

  /** Update specific edge */
  updateEdge(edgeId: string, updates: Partial<VisualEdge>): void;

  /** Add node to visualization */
  addNode(node: VisualNode): void;

  /** Add edge to visualization */
  addEdge(edge: VisualEdge): void;

  /** Remove node from visualization */
  removeNode(nodeId: string): void;

  /** Remove edge from visualization */
  removeEdge(edgeId: string): void;

  /** Clear all data */
  clear(): void;

  // ------------------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------------------

  /** Initialize visualization (attach to DOM, create renderers) */
  initialize(container: HTMLElement): Promise<void>;

  /** Render current state */
  render(): void;

  /** Force re-render even if no changes detected */
  forceRender(): void;

  /** Resize visualization to new dimensions */
  resize(width: number, height: number): void;

  /** Destroy visualization and cleanup resources */
  destroy(): void;

  // ------------------------------------------------------------------------
  // State Management
  // ------------------------------------------------------------------------

  /** Get current state snapshot */
  getState(): StateSnapshot;

  /** Restore state from snapshot */
  setState(state: StateSnapshot): void;

  /** Reset to initial state */
  reset(): void;

  // ------------------------------------------------------------------------
  // Event System (Observer Pattern)
  // ------------------------------------------------------------------------

  /** Subscribe to events */
  on<T extends VisualizationEventType>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): UnsubscribeFunction;

  /** Unsubscribe from events */
  off<T extends VisualizationEventType>(eventType: T['type'], handler: EventHandler<T>): void;

  /** Emit event to subscribers */
  emit<T extends VisualizationEventType>(event: T): void;

  // ------------------------------------------------------------------------
  // Layout
  // ------------------------------------------------------------------------

  /** Apply layout algorithm to current data */
  applyLayout(config: LayoutConfig): Promise<void>;

  /** Get current layout configuration */
  getLayout(): LayoutConfig | null;

  // ------------------------------------------------------------------------
  // Camera Control (3D mode)
  // ------------------------------------------------------------------------

  /** Get camera position (3D mode only) */
  getCameraPosition(): Position | null;

  /** Set camera position (3D mode only) */
  setCameraPosition(position: Position): void;

  /** Reset camera to default view */
  resetCamera(): void;

  /** Fit visualization to view bounds */
  fitToView(padding?: number): void;

  /** Get current view bounding box */
  getViewBounds(): BoundingBox;

  // ------------------------------------------------------------------------
  // Performance
  // ------------------------------------------------------------------------

  /** Get current performance metrics */
  getMetrics(): PerformanceMetrics;

  /** Enable/disable performance monitoring */
  setPerformanceMonitoring(enabled: boolean): void;
}

// ============================================================================
// ANIMATION CONTROLLER INTERFACE
// ============================================================================

/**
 * Controls animation playback and timeline management
 */
export interface IAnimationController {
  // ------------------------------------------------------------------------
  // Playback Control
  // ------------------------------------------------------------------------

  /** Play animation from current position */
  play(): void;

  /** Pause animation at current position */
  pause(): void;

  /** Stop animation and reset to start */
  stop(): void;

  /** Resume animation from paused state */
  resume(): void;

  /** Get current playback state */
  getState(): AnimationState;

  // ------------------------------------------------------------------------
  // Timeline Navigation
  // ------------------------------------------------------------------------

  /** Seek to specific time (milliseconds) */
  seek(time: number): void;

  /** Step forward one frame */
  stepForward(): void;

  /** Step backward one frame */
  stepBackward(): void;

  /** Get current playback time */
  getCurrentTime(): number;

  /** Get total animation duration */
  getDuration(): number;

  /** Get current frame number */
  getCurrentFrame(): number;

  /** Get total number of frames */
  getTotalFrames(): number;

  // ------------------------------------------------------------------------
  // Speed Control
  // ------------------------------------------------------------------------

  /** Set playback speed (1.0 = normal) */
  setSpeed(speed: number): void;

  /** Get current playback speed */
  getSpeed(): number;

  // ------------------------------------------------------------------------
  // Configuration
  // ------------------------------------------------------------------------

  /** Update animation configuration */
  updateConfig(config: Partial<AnimationConfig>): void;

  /** Get current animation configuration */
  getConfig(): AnimationConfig;

  // ------------------------------------------------------------------------
  // Loop Control
  // ------------------------------------------------------------------------

  /** Set whether animation should loop */
  setLoop(enabled: boolean): void;

  /** Check if looping is enabled */
  isLooping(): boolean;

  // ------------------------------------------------------------------------
  // Event Hooks
  // ------------------------------------------------------------------------

  /** Called when animation completes */
  onComplete(callback: () => void): UnsubscribeFunction;

  /** Called when animation updates */
  onUpdate(callback: (progress: number) => void): UnsubscribeFunction;

  /** Called when playback state changes */
  onStateChange(callback: (state: AnimationState) => void): UnsubscribeFunction;
}

// ============================================================================
// ALGORITHM EXECUTOR INTERFACE
// ============================================================================

/**
 * Manages step-based algorithm execution and visualization
 */
export interface IAlgorithmExecutor {
  // ------------------------------------------------------------------------
  // Step Management
  // ------------------------------------------------------------------------

  /** Add execution step */
  addStep(step: ExecutionStep): void;

  /** Get all steps */
  getSteps(): ExecutionStep[];

  /** Get specific step by index */
  getStep(index: number): ExecutionStep | null;

  /** Get current step index */
  getCurrentStepIndex(): number;

  /** Get total number of steps */
  getTotalSteps(): number;

  /** Clear all steps */
  clearSteps(): void;

  // ------------------------------------------------------------------------
  // Execution Control
  // ------------------------------------------------------------------------

  /** Execute next step */
  executeNextStep(): Promise<void>;

  /** Execute previous step */
  executePreviousStep(): Promise<void>;

  /** Execute specific step by index */
  executeStep(index: number): Promise<void>;

  /** Execute all steps automatically with delay */
  executeAll(delayMs?: number): Promise<void>;

  /** Stop automatic execution */
  stopExecution(): void;

  /** Check if currently executing */
  isExecuting(): boolean;

  // ------------------------------------------------------------------------
  // Step Lifecycle Hooks
  // ------------------------------------------------------------------------

  /** Called before step executes */
  onBeforeStep(callback: (step: ExecutionStep) => void | Promise<void>): UnsubscribeFunction;

  /** Called after step executes */
  onAfterStep(callback: (step: ExecutionStep) => void | Promise<void>): UnsubscribeFunction;

  /** Called on step error */
  onStepError(callback: (step: ExecutionStep, error: Error) => void): UnsubscribeFunction;

  // ------------------------------------------------------------------------
  // Visualization Integration
  // ------------------------------------------------------------------------

  /** Link to visualization instance */
  setVisualization(visualization: IVisualization): void;

  /** Get linked visualization */
  getVisualization(): IVisualization | null;

  /** Apply step changes to visualization */
  applyStepToVisualization(step: ExecutionStep): Promise<void>;

  // ------------------------------------------------------------------------
  // State Management
  // ------------------------------------------------------------------------

  /** Get current execution state */
  getExecutionState(): {
    currentStep: number;
    totalSteps: number;
    isExecuting: boolean;
    stepHistory: ExecutionStep[];
  };

  /** Reset executor to initial state */
  reset(): void;
}

// ============================================================================
// THEME PROVIDER INTERFACE
// ============================================================================

/**
 * Manages theming and visual styling
 */
export interface IThemeProvider {
  // ------------------------------------------------------------------------
  // Theme Management
  // ------------------------------------------------------------------------

  /** Get current theme */
  getTheme(): ThemeConfig;

  /** Set active theme */
  setTheme(theme: ThemeConfig): void;

  /** Update theme (partial update) */
  updateTheme(updates: Partial<ThemeConfig>): void;

  /** Register custom theme */
  registerTheme(name: string, theme: ThemeConfig): void;

  /** Get registered theme by name */
  getRegisteredTheme(name: string): ThemeConfig | null;

  /** List all registered theme names */
  listThemes(): string[];

  /** Switch to registered theme by name */
  switchTheme(name: string): void;

  // ------------------------------------------------------------------------
  // Color Utilities
  // ------------------------------------------------------------------------

  /** Get color from current theme */
  getColor(colorKey: keyof ThemeConfig['colors']): string;

  /** Get contrast color for given background */
  getContrastColor(backgroundColor: string): string;

  /** Generate color palette based on primary color */
  generatePalette(primaryColor: string): ThemeConfig['colors'];

  // ------------------------------------------------------------------------
  // CSS Generation
  // ------------------------------------------------------------------------

  /** Generate CSS variables for current theme */
  toCSSVariables(): Record<string, string>;

  /** Apply theme to DOM as CSS variables */
  applyToDOM(rootElement?: HTMLElement): void;

  // ------------------------------------------------------------------------
  // Event Hooks
  // ------------------------------------------------------------------------

  /** Called when theme changes */
  onThemeChange(callback: (theme: ThemeConfig) => void): UnsubscribeFunction;
}

// ============================================================================
// EXPORTER INTERFACE
// ============================================================================

/**
 * Handles exporting visualizations to various formats
 */
export interface IExporter {
  // ------------------------------------------------------------------------
  // Export Operations
  // ------------------------------------------------------------------------

  /** Export visualization to specified format */
  export(config: ExportConfig): Promise<Blob>;

  /** Export to PNG image */
  exportToPNG(quality?: number, scale?: number): Promise<Blob>;

  /** Export to SVG vector */
  exportToSVG(includeStyles?: boolean): Promise<Blob>;

  /** Export animation to video */
  exportToVideo(
    duration: number,
    fps?: number,
    codec?: 'h264' | 'vp8' | 'vp9'
  ): Promise<Blob>;

  /** Export data as JSON */
  exportToJSON(includeMetadata?: boolean): Promise<Blob>;

  // ------------------------------------------------------------------------
  // Download Helpers
  // ------------------------------------------------------------------------

  /** Export and trigger browser download */
  download(filename: string, config: ExportConfig): Promise<void>;

  /** Get data URL for inline embedding */
  toDataURL(format: ExportFormat): Promise<string>;

  // ------------------------------------------------------------------------
  // Video Recording (Browser-based)
  // ------------------------------------------------------------------------

  /** Start recording visualization as video */
  startRecording(fps?: number): void;

  /** Stop recording and return video blob */
  stopRecording(): Promise<Blob>;

  /** Check if currently recording */
  isRecording(): boolean;

  /** Get recording duration in milliseconds */
  getRecordingDuration(): number;

  // ------------------------------------------------------------------------
  // Server-side Export (Puppeteer)
  // ------------------------------------------------------------------------

  /** Export using server-side rendering (requires backend) */
  exportServerSide(config: ExportConfig): Promise<Blob>;

  /** Check if server-side export is available */
  isServerSideAvailable(): Promise<boolean>;

  // ------------------------------------------------------------------------
  // Progress Tracking
  // ------------------------------------------------------------------------

  /** Called with export progress (0-1) */
  onProgress(callback: (progress: number) => void): UnsubscribeFunction;

  /** Called when export completes */
  onComplete(callback: (blob: Blob) => void): UnsubscribeFunction;

  /** Called on export error */
  onError(callback: (error: Error) => void): UnsubscribeFunction;

  // ------------------------------------------------------------------------
  // Configuration
  // ------------------------------------------------------------------------

  /** Set default export configuration */
  setDefaultConfig(config: Partial<ExportConfig>): void;

  /** Get current default configuration */
  getDefaultConfig(): ExportConfig;
}

// ============================================================================
// FACTORY INTERFACE
// ============================================================================

/**
 * Factory for creating visualization instances
 */
export interface IVisualizationFactory {
  /** Create visualization instance */
  create(config: VisualizationConfig): IVisualization;

  /** Create with animation controller */
  createWithAnimation(
    config: VisualizationConfig,
    animationConfig?: AnimationConfig
  ): {
    visualization: IVisualization;
    animation: IAnimationController;
  };

  /** Create with algorithm executor */
  createWithExecutor(config: VisualizationConfig): {
    visualization: IVisualization;
    executor: IAlgorithmExecutor;
  };

  /** Create complete system (visualization + animation + executor + exporter) */
  createComplete(
    config: VisualizationConfig,
    animationConfig?: AnimationConfig
  ): {
    visualization: IVisualization;
    animation: IAnimationController;
    executor: IAlgorithmExecutor;
    exporter: IExporter;
    theme: IThemeProvider;
  };
}
