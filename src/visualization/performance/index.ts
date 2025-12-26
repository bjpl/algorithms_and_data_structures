/**
 * Performance Module
 *
 * Comprehensive performance optimization and profiling system for visualizations.
 * Includes profiling, optimization techniques, adaptive quality, and real-time monitoring.
 *
 * @module visualization/performance
 */

import { Profiler as ProfilerClass } from './Profiler';
import { Optimizer as OptimizerClass } from './Optimizer';
import { AdaptiveQuality as AdaptiveQualityClass } from './AdaptiveQuality';
import { PerformanceMonitor as PerformanceMonitorClass } from './PerformanceMonitor';

export { ProfilerClass as Profiler };
export type {
  PerformanceSample,
  PerformanceThresholds,
  PerformanceWarning,
  PerformanceReport,
  ProfilerConfig,
} from './Profiler';

export { OptimizerClass as Optimizer };
export type {
  RenderStrategy,
  OptimizationTechnique,
  OptimizerConfig,
  DirtyRectangle,
  RenderLayer,
  RenderBatch,
  OptimizationStats,
} from './Optimizer';

export { AdaptiveQualityClass as AdaptiveQuality };
export type {
  QualityLevel,
  LODSettings,
  AdaptiveQualityConfig,
  QualityPreset,
} from './AdaptiveQuality';

export { PerformanceMonitorClass as PerformanceMonitor };
export type {
  MonitorDisplayMode,
  PerformanceMonitorConfig,
  MonitorStatistics,
} from './PerformanceMonitor';

/**
 * Create complete performance system with all components
 */
export function createPerformanceSystem(config?: {
  profiler?: Partial<import('./Profiler').ProfilerConfig>;
  optimizer?: Partial<import('./Optimizer').OptimizerConfig>;
  adaptiveQuality?: Partial<import('./AdaptiveQuality').AdaptiveQualityConfig>;
  monitor?: Partial<import('./PerformanceMonitor').PerformanceMonitorConfig>;
}) {

  const profiler = new ProfilerClass(config?.profiler);
  const optimizer = new OptimizerClass(config?.optimizer);
  const adaptiveQuality = new AdaptiveQualityClass(config?.adaptiveQuality, profiler);
  const monitor = new PerformanceMonitorClass(config?.monitor, profiler, optimizer, adaptiveQuality);

  return {
    profiler,
    optimizer,
    adaptiveQuality,
    monitor,

    /**
     * Start all performance systems
     */
    start() {
      profiler.start();
      adaptiveQuality.start();
    },

    /**
     * Stop all performance systems
     */
    stop() {
      profiler.stop();
      adaptiveQuality.stop();
      monitor.destroy();
    },

    /**
     * Reset all systems
     */
    reset() {
      profiler.reset();
      optimizer.resetStats();
    },

    /**
     * Generate comprehensive report
     */
    generateReport() {
      return {
        profiler: profiler.generateReport(),
        optimizer: optimizer.getStats(),
        quality: adaptiveQuality.getQuality(),
        monitor: monitor.getStatistics(),
      };
    },
  };
}
