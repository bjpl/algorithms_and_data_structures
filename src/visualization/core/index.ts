/**
 * @file Core visualization module exports
 * @module visualization/core
 */

// Visualization base class
export {
  Visualization,
  VisualizationError,
  type VisualizationConfig,
  type VisualizationEvent,
  type Renderer,
  type Theme as VisualizationTheme,
  type EventListener as VisualizationEventListener,
} from './Visualization';

// Animation controller
export {
  AnimationController,
  type AnimationState,
  type AnimationEvent,
  type AnimationConfig,
  type AnimationSnapshot,
} from './AnimationController';
export type { TimeTravelConfig } from './AnimationController';

// Theme provider
export {
  ThemeProvider,
  type Theme,
  type ColorScheme,
  type ThemeConfig,
  type RGB,
  type ThemeEvent,
  type ThemeExport,
} from './ThemeProvider';

// Exporter
export {
  Exporter,
  type ExportFormat,
  type ExportConfig,
  type VideoConfig,
  type ExportResult,
  type ExportEvent,
} from './Exporter';

// Algorithm executor
export {
  AlgorithmExecutor,
  type AlgorithmFunction,
  type ExecutionStep,
  type ExecutionState,
  type ExecutionConfig,
  type StateSnapshot,
  type HistoryEntry,
  type ExecutionTrace,
  type ExecutionEvent,
} from './AlgorithmExecutor';

// Debug controller
export {
  DebugController,
  type BreakpointType,
  type ExecutionAction,
  type DebugState,
  type DebugEvent,
  type DebugContext,
  type CallFrame,
  type LineBreakpoint,
  type ConditionalBreakpoint,
  type HitCountBreakpoint,
  type Logpoint,
  type Breakpoint,
  type WatchExpression,
  type MemorySnapshot,
  type DebugConfig,
} from './DebugController';

// Time-travel debugging controller
export {
  TimeTravelController,
  type TimeTravelEvent,
  type StateDiff,
  type TimeTravelSnapshot,
  type HistoryBranch,
  type HistoryMarker,
} from './TimeTravelController';
