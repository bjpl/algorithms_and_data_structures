/**
 * Performance Profiler
 *
 * Comprehensive profiling system for visualization performance monitoring.
 * Tracks FPS, frame times, memory usage, and execution metrics.
 *
 * @module visualization/performance/Profiler
 */

import type { PerformanceMetrics } from '../core/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Detailed performance sample
 */
export interface PerformanceSample {
  /** Sample timestamp */
  timestamp: number;

  /** Frames per second */
  fps: number;

  /** Frame render time (ms) */
  frameTime: number;

  /** Memory usage in MB */
  memoryUsage: number;

  /** Node count */
  nodeCount: number;

  /** Edge count */
  edgeCount: number;

  /** Custom metrics */
  custom: Map<string, number>;
}

/**
 * Performance threshold configuration
 */
export interface PerformanceThresholds {
  /** Target FPS (default: 60) */
  targetFps: number;

  /** Warning FPS threshold (default: 45) */
  warningFps: number;

  /** Critical FPS threshold (default: 30) */
  criticalFps: number;

  /** Max frame time in ms (default: 16.67 for 60fps) */
  maxFrameTime: number;

  /** Max memory usage in MB (default: 100) */
  maxMemoryUsage: number;
}

/**
 * Performance warning
 */
export interface PerformanceWarning {
  /** Warning severity */
  severity: 'info' | 'warning' | 'critical';

  /** Warning message */
  message: string;

  /** Related metric */
  metric: string;

  /** Current value */
  value: number;

  /** Threshold exceeded */
  threshold: number;

  /** Timestamp */
  timestamp: number;

  /** Recommendations */
  recommendations?: string[];
}

/**
 * Performance report
 */
export interface PerformanceReport {
  /** Report generation timestamp */
  timestamp: number;

  /** Report duration (ms) */
  duration: number;

  /** Summary statistics */
  summary: {
    avgFps: number;
    minFps: number;
    maxFps: number;
    p95Fps: number;
    p99Fps: number;
    avgFrameTime: number;
    maxFrameTime: number;
    avgMemoryUsage: number;
    maxMemoryUsage: number;
  };

  /** All samples */
  samples: PerformanceSample[];

  /** Warnings generated */
  warnings: PerformanceWarning[];

  /** Recommendations */
  recommendations: string[];
}

/**
 * Profiler configuration
 */
export interface ProfilerConfig {
  /** Enable profiling */
  enabled: boolean;

  /** Sample interval in ms (default: 100) */
  sampleInterval: number;

  /** Max samples to keep (default: 1000) */
  maxSamples: number;

  /** Performance thresholds */
  thresholds: PerformanceThresholds;

  /** Enable memory profiling */
  enableMemoryProfiling: boolean;

  /** Enable detailed logging */
  enableLogging: boolean;
}

// ============================================================================
// PERFORMANCE PROFILER CLASS
// ============================================================================

/**
 * Production-ready performance profiler with comprehensive metrics
 */
export class Profiler {
  private config: ProfilerConfig;
  private samples: PerformanceSample[] = [];
  private warnings: PerformanceWarning[] = [];
  private customMetrics: Map<string, number> = new Map();

  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsUpdateTime = 0;
  private currentFps = 0;

  private sampleTimer: NodeJS.Timeout | number | null = null;
  private rafHandle: number | null = null;

  private nodeCount = 0;
  private edgeCount = 0;

  private startTime = 0;
  private isRunning = false;

  // Frame time tracking for detailed analysis
  private frameTimes: number[] = [];
  private readonly MAX_FRAME_TIMES = 100;

  constructor(config?: Partial<ProfilerConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      sampleInterval: config?.sampleInterval ?? 100,
      maxSamples: config?.maxSamples ?? 1000,
      thresholds: {
        targetFps: 60,
        warningFps: 45,
        criticalFps: 30,
        maxFrameTime: 16.67, // 60 FPS
        maxMemoryUsage: 100,
        ...(config?.thresholds || {}),
      },
      enableMemoryProfiling: config?.enableMemoryProfiling ?? true,
      enableLogging: config?.enableLogging ?? false,
    };
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Start profiling
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.fpsUpdateTime = this.startTime;
    this.frameCount = 0;

    this.samples = [];
    this.warnings = [];

    this.log('Profiler started');

    // Start FPS tracking
    this.trackFrame();

    // Start sample collection
    if (typeof window !== 'undefined') {
      this.sampleTimer = window.setInterval(() => {
        this.collectSample();
      }, this.config.sampleInterval);
    } else if (typeof global !== 'undefined') {
      this.sampleTimer = setInterval(() => {
        this.collectSample();
      }, this.config.sampleInterval);
    }
  }

  /**
   * Stop profiling
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Clear timers
    if (this.sampleTimer !== null) {
      if (typeof window !== 'undefined') {
        window.clearInterval(this.sampleTimer as number);
      } else {
        clearInterval(this.sampleTimer as NodeJS.Timeout);
      }
      this.sampleTimer = null;
    }

    if (this.rafHandle !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }

    this.log('Profiler stopped');
  }

  /**
   * Reset profiler state
   */
  public reset(): void {
    this.stop();
    this.samples = [];
    this.warnings = [];
    this.customMetrics.clear();
    this.frameTimes = [];
    this.frameCount = 0;
    this.currentFps = 0;
    this.log('Profiler reset');
  }

  // ==========================================================================
  // FRAME TRACKING
  // ==========================================================================

  /**
   * Track frame rendering (call from render loop)
   */
  private trackFrame(): void {
    if (!this.isRunning || typeof window === 'undefined') {
      return;
    }

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Store frame time
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.MAX_FRAME_TIMES) {
      this.frameTimes.shift();
    }

    // Update FPS
    this.frameCount++;
    const elapsed = now - this.fpsUpdateTime;

    if (elapsed >= 1000) {
      this.currentFps = (this.frameCount * 1000) / elapsed;
      this.frameCount = 0;
      this.fpsUpdateTime = now;

      // Check FPS thresholds
      this.checkFpsThresholds();
    }

    // Check frame time threshold
    if (frameTime > this.config.thresholds.maxFrameTime * 2) {
      this.addWarning({
        severity: 'warning',
        message: `High frame time detected: ${frameTime.toFixed(2)}ms`,
        metric: 'frameTime',
        value: frameTime,
        threshold: this.config.thresholds.maxFrameTime,
        timestamp: now,
        recommendations: [
          'Consider reducing rendering complexity',
          'Enable dirty rectangle rendering',
          'Use WebGL for large datasets',
        ],
      });
    }

    // Continue tracking
    this.rafHandle = window.requestAnimationFrame(() => this.trackFrame());
  }

  /**
   * Mark frame start (call at beginning of render)
   */
  public markFrameStart(): void {
    this.lastFrameTime = performance.now();
  }

  /**
   * Mark frame end (call at end of render)
   */
  public markFrameEnd(): void {
    if (!this.isRunning) {
      return;
    }

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;

    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.MAX_FRAME_TIMES) {
      this.frameTimes.shift();
    }
  }

  // ==========================================================================
  // SAMPLE COLLECTION
  // ==========================================================================

  /**
   * Collect performance sample
   */
  private collectSample(): void {
    if (!this.isRunning) {
      return;
    }

    const sample: PerformanceSample = {
      timestamp: performance.now(),
      fps: this.currentFps,
      frameTime: this.getAverageFrameTime(),
      memoryUsage: this.getMemoryUsage(),
      nodeCount: this.nodeCount,
      edgeCount: this.edgeCount,
      custom: new Map(this.customMetrics),
    };

    this.samples.push(sample);

    // Limit sample history
    if (this.samples.length > this.config.maxSamples) {
      this.samples.shift();
    }

    this.log('Sample collected', sample);
  }

  /**
   * Get average frame time from recent frames
   */
  private getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) {
      return 0;
    }

    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (!this.config.enableMemoryProfiling) {
      return 0;
    }

    if (typeof window !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }

    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      return memory.heapUsed / 1024 / 1024; // Convert to MB
    }

    return 0;
  }

  // ==========================================================================
  // THRESHOLD CHECKING
  // ==========================================================================

  /**
   * Check FPS against thresholds
   */
  private checkFpsThresholds(): void {
    const { targetFps, warningFps, criticalFps } = this.config.thresholds;

    if (this.currentFps < criticalFps) {
      this.addWarning({
        severity: 'critical',
        message: `Critical FPS: ${this.currentFps.toFixed(1)} (target: ${targetFps})`,
        metric: 'fps',
        value: this.currentFps,
        threshold: criticalFps,
        timestamp: performance.now(),
        recommendations: [
          'Reduce number of rendered elements',
          'Enable adaptive quality mode',
          'Consider WebGL rendering',
          'Use virtual scrolling for large datasets',
        ],
      });
    } else if (this.currentFps < warningFps) {
      this.addWarning({
        severity: 'warning',
        message: `Low FPS: ${this.currentFps.toFixed(1)} (target: ${targetFps})`,
        metric: 'fps',
        value: this.currentFps,
        threshold: warningFps,
        timestamp: performance.now(),
        recommendations: [
          'Consider optimizing render path',
          'Enable performance optimizations',
          'Reduce animation complexity',
        ],
      });
    }

    // Check memory
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage > this.config.thresholds.maxMemoryUsage) {
      this.addWarning({
        severity: 'warning',
        message: `High memory usage: ${memoryUsage.toFixed(1)}MB`,
        metric: 'memory',
        value: memoryUsage,
        threshold: this.config.thresholds.maxMemoryUsage,
        timestamp: performance.now(),
        recommendations: [
          'Clear unused visualization data',
          'Reduce sample history size',
          'Check for memory leaks',
        ],
      });
    }
  }

  /**
   * Add performance warning
   */
  private addWarning(warning: PerformanceWarning): void {
    this.warnings.push(warning);
    this.log(`Warning: ${warning.message}`, warning);

    // Limit warning history
    if (this.warnings.length > 100) {
      this.warnings.shift();
    }
  }

  // ==========================================================================
  // METRICS API
  // ==========================================================================

  /**
   * Update render counts
   */
  public updateCounts(nodes: number, edges: number): void {
    this.nodeCount = nodes;
    this.edgeCount = edges;
  }

  /**
   * Set custom metric
   */
  public setMetric(name: string, value: number): void {
    this.customMetrics.set(name, value);
  }

  /**
   * Get custom metric
   */
  public getMetric(name: string): number | undefined {
    return this.customMetrics.get(name);
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics {
    return {
      fps: this.currentFps,
      frameTime: this.getAverageFrameTime(),
      nodeCount: this.nodeCount,
      edgeCount: this.edgeCount,
      memoryUsage: this.getMemoryUsage(),
      timestamp: performance.now(),
    };
  }

  /**
   * Get all samples
   */
  public getSamples(): PerformanceSample[] {
    return [...this.samples];
  }

  /**
   * Get recent warnings
   */
  public getWarnings(): PerformanceWarning[] {
    return [...this.warnings];
  }

  // ==========================================================================
  // REPORTING
  // ==========================================================================

  /**
   * Generate performance report
   */
  public generateReport(): PerformanceReport {
    if (this.samples.length === 0) {
      throw new Error('No samples available for report');
    }

    const fpsSamples = this.samples.map((s) => s.fps).filter((fps) => fps > 0);
    const frameTimeSamples = this.samples.map((s) => s.frameTime);
    const memorySamples = this.samples.map((s) => s.memoryUsage);

    // Calculate statistics
    const avgFps = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;
    const minFps = Math.min(...fpsSamples);
    const maxFps = Math.max(...fpsSamples);
    const p95Fps = this.percentile(fpsSamples, 0.05); // 5th percentile (lower is worse)
    const p99Fps = this.percentile(fpsSamples, 0.01);

    const avgFrameTime = frameTimeSamples.reduce((a, b) => a + b, 0) / frameTimeSamples.length;
    const maxFrameTime = Math.max(...frameTimeSamples);

    const avgMemoryUsage = memorySamples.reduce((a, b) => a + b, 0) / memorySamples.length;
    const maxMemoryUsage = Math.max(...memorySamples);

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      avgFps,
      minFps,
      avgFrameTime,
      maxFrameTime,
      avgMemoryUsage,
      maxMemoryUsage,
    });

    return {
      timestamp: performance.now(),
      duration: performance.now() - this.startTime,
      summary: {
        avgFps,
        minFps,
        maxFps,
        p95Fps,
        p99Fps,
        avgFrameTime,
        maxFrameTime,
        avgMemoryUsage,
        maxMemoryUsage,
      },
      samples: this.getSamples(),
      warnings: this.getWarnings(),
      recommendations,
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * p);
    return sorted[index] || 0;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(stats: {
    avgFps: number;
    minFps: number;
    avgFrameTime: number;
    maxFrameTime: number;
    avgMemoryUsage: number;
    maxMemoryUsage: number;
  }): string[] {
    const recommendations: string[] = [];

    // FPS recommendations
    if (stats.avgFps < this.config.thresholds.targetFps) {
      recommendations.push('Average FPS below target - enable performance optimizations');

      if (stats.avgFps < 30) {
        recommendations.push('Critical performance - consider reducing visualization complexity');
        recommendations.push('Switch to WebGL renderer for better performance');
      }
    }

    // Frame time recommendations
    if (stats.maxFrameTime > this.config.thresholds.maxFrameTime * 3) {
      recommendations.push('High frame time variance - investigate rendering bottlenecks');
      recommendations.push('Consider implementing dirty rectangle optimization');
    }

    // Memory recommendations
    if (stats.maxMemoryUsage > this.config.thresholds.maxMemoryUsage) {
      recommendations.push('High memory usage - review data structures for leaks');
      recommendations.push('Implement data cleanup and garbage collection strategies');
    }

    if (stats.avgMemoryUsage > this.config.thresholds.maxMemoryUsage * 0.8) {
      recommendations.push('Memory usage approaching limit - consider data streaming');
    }

    // Element count recommendations
    const maxSample = this.samples[this.samples.length - 1];
    if (maxSample && maxSample.nodeCount > 1000) {
      recommendations.push('Large node count - enable virtual scrolling or LOD system');
    }

    if (maxSample && maxSample.edgeCount > 5000) {
      recommendations.push('Large edge count - consider edge bundling or filtering');
    }

    return recommendations;
  }

  /**
   * Export report as JSON
   */
  public exportReport(): string {
    const report = this.generateReport();
    return JSON.stringify(report, (key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value);
      }
      if (value instanceof Set) {
        return Array.from(value);
      }
      return value;
    }, 2);
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Update profiler configuration
   */
  public updateConfig(config: Partial<ProfilerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      thresholds: {
        ...this.config.thresholds,
        ...(config.thresholds || {}),
      },
    };

    this.log('Configuration updated', this.config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): ProfilerConfig {
    return { ...this.config };
  }

  /**
   * Enable/disable profiling
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (enabled && !this.isRunning) {
      this.start();
    } else if (!enabled && this.isRunning) {
      this.stop();
    }
  }

  /**
   * Check if profiler is running
   */
  public isActive(): boolean {
    return this.isRunning;
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Log message if logging enabled
   */
  private log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      if (data) {
        console.log(`[Profiler] ${message}`, data);
      } else {
        console.log(`[Profiler] ${message}`);
      }
    }
  }
}
