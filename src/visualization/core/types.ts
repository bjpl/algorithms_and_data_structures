/**
 * Core Type Definitions for Visualization System
 *
 * Production-ready TypeScript interfaces for unified visualization API
 * supporting 2D/3D rendering, animations, exports, and themes.
 */

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * Rendering mode for visualizations
 */
export type RenderMode = '2d' | '3d';

/**
 * Export format for visualization output
 */
export type ExportFormat = 'png' | 'svg' | 'video' | 'json';

/**
 * Animation playback state
 */
export type AnimationState = 'idle' | 'playing' | 'paused' | 'stopped';

/**
 * Theme variant
 */
export type ThemeVariant = 'light' | 'dark' | 'auto';

/**
 * Algorithm execution step status
 */
export type StepStatus = 'pending' | 'active' | 'completed' | 'error';

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

/**
 * Base configuration for all visualizations
 */
export interface VisualizationConfig {
  /** Unique identifier for this visualization instance */
  id: string;

  /** Display title */
  title?: string;

  /** Rendering mode (2D or 3D) */
  renderMode: RenderMode;

  /** Width of canvas in pixels */
  width: number;

  /** Height of canvas in pixels */
  height: number;

  /** Background color (CSS color string) */
  backgroundColor?: string;

  /** Enable automatic scaling for responsive layouts */
  autoScale?: boolean;

  /** Padding around visualization content */
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Theme variant */
  variant: ThemeVariant;

  /** Primary color palette */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };

  /** Typography settings */
  typography: {
    fontFamily: string;
    fontSize: {
      small: number;
      medium: number;
      large: number;
    };
    fontWeight: {
      normal: number;
      bold: number;
    };
  };

  /** Spacing scale */
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };

  /** Animation durations in milliseconds */
  transitions: {
    fast: number;
    normal: number;
    slow: number;
  };
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Animation duration in milliseconds */
  duration?: number;

  /** Easing function name */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';

  /** Custom cubic-bezier values (if easing is 'cubic-bezier') */
  cubicBezier?: [number, number, number, number];

  /** Delay before animation starts (ms) */
  delay?: number;

  /** Number of times to repeat (-1 for infinite) */
  repeat?: number;

  /** Auto-play on mount */
  autoPlay?: boolean;

  /** Playback speed multiplier (1.0 = normal speed) */
  speed?: number;
}

/**
 * Export configuration
 */
export interface ExportConfig {
  /** Output format */
  format: ExportFormat;

  /** Output quality (0-1 for images, affects video bitrate) */
  quality?: number;

  /** Include transparent background (PNG/SVG only) */
  transparent?: boolean;

  /** Scale factor for raster exports */
  scale?: number;

  /** Video-specific options */
  video?: {
    /** Frame rate (fps) */
    fps: number;

    /** Codec to use */
    codec: 'h264' | 'vp8' | 'vp9';

    /** Bitrate in kbps */
    bitrate: number;
  };
}

// ============================================================================
// DATA STRUCTURES
// ============================================================================

/**
 * Position in 2D or 3D space
 */
export interface Position {
  x: number;
  y: number;
  z?: number;
}

/**
 * Dimensions
 */
export interface Dimensions {
  width: number;
  height: number;
  depth?: number;
}

/**
 * Bounding box
 */
export interface BoundingBox {
  min: Position;
  max: Position;
}

/**
 * Visual node in a graph or tree
 */
export interface VisualNode<T = any> {
  /** Unique node identifier */
  id: string;

  /** Node data payload */
  data: T;

  /** Position in space */
  position: Position;

  /** Visual styling */
  style?: {
    color?: string;
    size?: number;
    shape?: 'circle' | 'square' | 'diamond' | 'triangle';
    label?: string;
    opacity?: number;
  };

  /** Animation state */
  animationState?: StepStatus;

  /** Metadata for algorithm visualization */
  metadata?: Record<string, any>;
}

/**
 * Visual edge connecting nodes
 */
export interface VisualEdge {
  /** Unique edge identifier */
  id: string;

  /** Source node ID */
  source: string;

  /** Target node ID */
  target: string;

  /** Edge weight/label */
  weight?: number;

  /** Visual styling */
  style?: {
    color?: string;
    width?: number;
    dashArray?: number[];
    opacity?: number;
    animated?: boolean;
  };

  /** Whether edge is directed */
  directed?: boolean;

  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Algorithm execution step
 */
export interface ExecutionStep {
  /** Step sequence number */
  index: number;

  /** Human-readable description */
  description: string;

  /** Nodes affected in this step */
  affectedNodes: string[];

  /** Edges affected in this step */
  affectedEdges?: string[];

  /** Step execution status */
  status: StepStatus;

  /** Timestamp when step was executed */
  timestamp?: number;

  /** Additional step data */
  data?: Record<string, any>;
}

/**
 * Visualization state snapshot
 */
export interface StateSnapshot {
  /** Snapshot timestamp */
  timestamp: number;

  /** Current execution step index */
  stepIndex: number;

  /** All nodes at this state */
  nodes: VisualNode[];

  /** All edges at this state */
  edges: VisualEdge[];

  /** Camera position (for 3D) */
  cameraPosition?: Position;

  /** Custom state data */
  metadata?: Record<string, any>;
}

// ============================================================================
// EVENT INTERFACES
// ============================================================================

/**
 * Base event
 */
export interface VisualizationEvent {
  /** Event type */
  type: string;

  /** Event timestamp */
  timestamp: number;

  /** Event source */
  source: string;
}

/**
 * Node interaction event
 */
export interface NodeEvent extends VisualizationEvent {
  type: 'node:click' | 'node:hover' | 'node:select';
  nodeId: string;
  position: Position;
}

/**
 * Edge interaction event
 */
export interface EdgeEvent extends VisualizationEvent {
  type: 'edge:click' | 'edge:hover' | 'edge:select';
  edgeId: string;
  sourceId: string;
  targetId: string;
}

/**
 * Animation lifecycle event
 */
export interface AnimationEvent extends VisualizationEvent {
  type: 'animation:start' | 'animation:pause' | 'animation:resume' | 'animation:stop' | 'animation:complete';
  animationId?: string;
}

/**
 * Step execution event
 */
export interface StepEvent extends VisualizationEvent {
  type: 'step:start' | 'step:complete' | 'step:error';
  step: ExecutionStep;
}

/**
 * Render event
 */
export interface RenderEvent extends VisualizationEvent {
  type: 'render:start' | 'render:complete' | 'render:error';
  frameNumber?: number;
}

/**
 * Export event
 */
export interface ExportEvent extends VisualizationEvent {
  type: 'export:start' | 'export:progress' | 'export:complete' | 'export:error';
  format?: ExportFormat;
  progress?: number;
  url?: string;
  error?: Error;
}

/**
 * Union of all event types
 */
export type VisualizationEventType =
  | NodeEvent
  | EdgeEvent
  | AnimationEvent
  | StepEvent
  | RenderEvent
  | ExportEvent;

/**
 * Event handler callback
 */
export type EventHandler<T extends VisualizationEvent = VisualizationEvent> = (event: T) => void;

/**
 * Event subscriber cleanup function
 */
export type UnsubscribeFunction = () => void;

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**
 * Performance metrics for visualization rendering
 */
export interface PerformanceMetrics {
  /** Frames per second */
  fps: number;

  /** Frame render time in milliseconds */
  frameTime: number;

  /** Total nodes being rendered */
  nodeCount: number;

  /** Total edges being rendered */
  edgeCount: number;

  /** Memory usage in MB */
  memoryUsage?: number;

  /** Last measurement timestamp */
  timestamp: number;
}

// ============================================================================
// LAYOUT ALGORITHMS
// ============================================================================

/**
 * Layout algorithm type
 */
export type LayoutAlgorithm =
  | 'force-directed'
  | 'hierarchical'
  | 'circular'
  | 'grid'
  | 'tree'
  | 'dagre'
  | 'custom';

/**
 * Layout configuration
 */
export interface LayoutConfig {
  /** Algorithm to use */
  algorithm: LayoutAlgorithm;

  /** Algorithm-specific options */
  options?: {
    /** Force-directed options */
    forceDirected?: {
      iterations?: number;
      springLength?: number;
      springStrength?: number;
      repulsionStrength?: number;
      damping?: number;
    };

    /** Hierarchical options */
    hierarchical?: {
      direction?: 'TB' | 'BT' | 'LR' | 'RL';
      levelSeparation?: number;
      nodeSeparation?: number;
      treeSpacing?: number;
    };

    /** Circular options */
    circular?: {
      radius?: number;
      startAngle?: number;
      sweep?: number;
    };

    /** Grid options */
    grid?: {
      rows?: number;
      columns?: number;
      cellWidth?: number;
      cellHeight?: number;
    };

    /** Custom layout function */
    custom?: (nodes: VisualNode[], edges: VisualEdge[]) => VisualNode[];
  };

  /** Whether to animate layout transitions */
  animate?: boolean;

  /** Animation duration for layout changes */
  animationDuration?: number;
}
