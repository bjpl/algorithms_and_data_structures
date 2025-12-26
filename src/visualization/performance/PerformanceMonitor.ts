/**
 * Performance Monitor
 *
 * Real-time performance monitoring dashboard with metrics visualization,
 * warnings, and recommendations.
 *
 * @module visualization/performance/PerformanceMonitor
 */

import { Profiler, type PerformanceReport, type PerformanceWarning } from './Profiler';
import { Optimizer, type OptimizationStats } from './Optimizer';
import { AdaptiveQuality, type QualityLevel } from './AdaptiveQuality';
import type { PerformanceMetrics } from '../core/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Monitor display mode
 */
export type MonitorDisplayMode = 'compact' | 'detailed' | 'dashboard' | 'overlay';

/**
 * Performance monitor configuration
 */
export interface PerformanceMonitorConfig {
  /** Display mode */
  displayMode: MonitorDisplayMode;

  /** Update interval (ms) */
  updateInterval: number;

  /** Show FPS graph */
  showFpsGraph: boolean;

  /** Show memory graph */
  showMemoryGraph: boolean;

  /** Show warnings */
  showWarnings: boolean;

  /** Show recommendations */
  showRecommendations: boolean;

  /** Graph history length (samples) */
  graphHistoryLength: number;

  /** Position on screen */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts: boolean;
}

/**
 * Monitor statistics
 */
export interface MonitorStatistics {
  /** Current metrics */
  current: PerformanceMetrics;

  /** Optimization stats */
  optimization: OptimizationStats;

  /** Current quality level */
  quality: QualityLevel;

  /** Warnings count */
  warningsCount: number;

  /** Recommendations count */
  recommendationsCount: number;

  /** Uptime (ms) */
  uptime: number;
}

// ============================================================================
// PERFORMANCE MONITOR CLASS
// ============================================================================

/**
 * Comprehensive performance monitoring dashboard
 */
export class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private profiler: Profiler;
  private optimizer: Optimizer;
  private adaptiveQuality: AdaptiveQuality;

  private containerElement: HTMLElement | null = null;
  private updateTimer: NodeJS.Timeout | number | null = null;
  private startTime = 0;
  private isVisible = true;

  // Graph data
  private fpsHistory: number[] = [];
  private memoryHistory: number[] = [];
  private frameTimeHistory: number[] = [];

  constructor(
    config?: Partial<PerformanceMonitorConfig>,
    profiler?: Profiler,
    optimizer?: Optimizer,
    adaptiveQuality?: AdaptiveQuality
  ) {
    this.config = {
      displayMode: config?.displayMode ?? 'overlay',
      updateInterval: config?.updateInterval ?? 500,
      showFpsGraph: config?.showFpsGraph ?? true,
      showMemoryGraph: config?.showMemoryGraph ?? true,
      showWarnings: config?.showWarnings ?? true,
      showRecommendations: config?.showRecommendations ?? true,
      graphHistoryLength: config?.graphHistoryLength ?? 60,
      position: config?.position ?? 'top-right',
      enableKeyboardShortcuts: config?.enableKeyboardShortcuts ?? true,
    };

    this.profiler = profiler || new Profiler();
    this.optimizer = optimizer || new Optimizer();
    this.adaptiveQuality = adaptiveQuality || new AdaptiveQuality(undefined, this.profiler);
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Initialize and attach monitor to DOM
   */
  public initialize(parentContainer?: HTMLElement): void {
    if (typeof document === 'undefined') {
      return;
    }

    // Create container
    this.containerElement = this.createMonitorElement();

    // Attach to DOM
    const parent = parentContainer || document.body;
    parent.appendChild(this.containerElement);

    // Setup keyboard shortcuts
    if (this.config.enableKeyboardShortcuts) {
      this.setupKeyboardShortcuts();
    }

    // Start profiler
    this.profiler.start();
    this.adaptiveQuality.start();

    this.startTime = performance.now();

    // Start update loop
    if (typeof window !== 'undefined') {
      this.updateTimer = window.setInterval(() => {
        this.update();
      }, this.config.updateInterval);
    } else if (typeof global !== 'undefined') {
      this.updateTimer = setInterval(() => {
        this.update();
      }, this.config.updateInterval);
    }
  }

  /**
   * Destroy monitor and cleanup
   */
  public destroy(): void {
    if (this.updateTimer !== null) {
      if (typeof window !== 'undefined') {
        window.clearInterval(this.updateTimer as number);
      } else {
        clearInterval(this.updateTimer as NodeJS.Timeout);
      }
      this.updateTimer = null;
    }

    if (this.containerElement) {
      this.containerElement.remove();
      this.containerElement = null;
    }

    this.profiler.stop();
    this.adaptiveQuality.stop();
  }

  // ==========================================================================
  // UI CREATION
  // ==========================================================================

  /**
   * Create monitor DOM element
   */
  private createMonitorElement(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'performance-monitor';
    container.style.cssText = this.getContainerStyles();

    // Add content based on display mode
    switch (this.config.displayMode) {
      case 'compact':
        this.createCompactView(container);
        break;
      case 'detailed':
        this.createDetailedView(container);
        break;
      case 'dashboard':
        this.createDashboardView(container);
        break;
      case 'overlay':
        this.createOverlayView(container);
        break;
    }

    return container;
  }

  /**
   * Get container styles
   */
  private getContainerStyles(): string {
    const baseStyles = `
      position: fixed;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      user-select: none;
      backdrop-filter: blur(4px);
    `;

    const positionStyles = {
      'top-left': 'top: 10px; left: 10px;',
      'top-right': 'top: 10px; right: 10px;',
      'bottom-left': 'bottom: 10px; left: 10px;',
      'bottom-right': 'bottom: 10px; right: 10px;',
    }[this.config.position];

    const sizeStyles = {
      compact: 'min-width: 150px;',
      detailed: 'min-width: 250px;',
      dashboard: 'min-width: 400px; max-width: 600px;',
      overlay: 'min-width: 200px;',
    }[this.config.displayMode];

    return baseStyles + positionStyles + sizeStyles;
  }

  /**
   * Create compact view
   */
  private createCompactView(container: HTMLElement): void {
    container.innerHTML = `
      <div id="perf-fps" style="color: #4ade80; font-weight: bold;">FPS: --</div>
      <div id="perf-memory" style="color: #60a5fa;">MEM: --</div>
      <div id="perf-nodes" style="color: #a78bfa;">Nodes: --</div>
    `;
  }

  /**
   * Create detailed view
   */
  private createDetailedView(container: HTMLElement): void {
    container.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #444; padding-bottom: 4px;">
        Performance Monitor
      </div>
      <div id="perf-fps" style="color: #4ade80;">FPS: --</div>
      <div id="perf-frametime" style="color: #fbbf24;">Frame: -- ms</div>
      <div id="perf-memory" style="color: #60a5fa;">Memory: -- MB</div>
      <div id="perf-nodes" style="color: #a78bfa;">Nodes: --</div>
      <div id="perf-edges" style="color: #ec4899;">Edges: --</div>
      <div id="perf-quality" style="color: #f59e0b; margin-top: 4px;">Quality: --</div>
      ${this.config.showWarnings ? '<div id="perf-warnings" style="margin-top: 8px; color: #ef4444;"></div>' : ''}
    `;
  }

  /**
   * Create dashboard view
   */
  private createDashboardView(container: HTMLElement): void {
    container.innerHTML = `
      <div style="font-weight: bold; font-size: 14px; margin-bottom: 12px; border-bottom: 2px solid #444; padding-bottom: 6px;">
        Performance Dashboard
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <div style="font-weight: bold; color: #888; font-size: 10px; margin-bottom: 4px;">RENDERING</div>
          <div id="perf-fps" style="color: #4ade80;">FPS: --</div>
          <div id="perf-frametime" style="color: #fbbf24;">Frame: -- ms</div>
          <div id="perf-quality" style="color: #f59e0b;">Quality: --</div>
        </div>

        <div>
          <div style="font-weight: bold; color: #888; font-size: 10px; margin-bottom: 4px;">RESOURCES</div>
          <div id="perf-memory" style="color: #60a5fa;">Memory: -- MB</div>
          <div id="perf-nodes" style="color: #a78bfa;">Nodes: --</div>
          <div id="perf-edges" style="color: #ec4899;">Edges: --</div>
        </div>
      </div>

      ${this.config.showFpsGraph ? '<canvas id="perf-fps-graph" width="380" height="60" style="margin-top: 12px; background: #111; border-radius: 2px;"></canvas>' : ''}

      <div id="perf-optimization" style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #444; font-size: 10px; color: #888;">
        <div style="font-weight: bold; margin-bottom: 4px;">OPTIMIZATIONS</div>
        <div id="perf-culled"></div>
        <div id="perf-batches"></div>
      </div>

      ${this.config.showWarnings ? '<div id="perf-warnings" style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #444;"></div>' : ''}
      ${this.config.showRecommendations ? '<div id="perf-recommendations" style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #444;"></div>' : ''}

      <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #444; font-size: 10px; color: #666; text-align: center;">
        Press 'P' to toggle • 'R' to reset
      </div>
    `;
  }

  /**
   * Create overlay view
   */
  private createOverlayView(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display: flex; gap: 12px; align-items: center;">
        <div id="perf-fps" style="color: #4ade80; font-weight: bold;">-- FPS</div>
        <div id="perf-frametime" style="color: #fbbf24;">-- ms</div>
        <div id="perf-quality" style="color: #f59e0b; font-size: 10px;">--</div>
      </div>
      ${this.config.showWarnings ? '<div id="perf-warnings-count" style="margin-top: 4px; font-size: 10px;"></div>' : ''}
    `;
  }

  // ==========================================================================
  // UPDATE LOGIC
  // ==========================================================================

  /**
   * Update monitor display
   */
  private update(): void {
    if (!this.containerElement || !this.isVisible) {
      return;
    }

    const metrics = this.profiler.getCurrentMetrics();
    const stats = this.optimizer.getStats();
    const quality = this.adaptiveQuality.getQuality();
    const warnings = this.profiler.getWarnings();

    // Update history
    this.updateHistory(metrics);

    // Update UI elements
    this.updateElement('perf-fps', `FPS: ${metrics.fps.toFixed(1)}`, this.getFpsColor(metrics.fps));
    this.updateElement('perf-frametime', `Frame: ${metrics.frameTime.toFixed(2)} ms`, this.getFrameTimeColor(metrics.frameTime));
    this.updateElement('perf-memory', `Memory: ${metrics.memoryUsage.toFixed(1)} MB`, this.getMemoryColor(metrics.memoryUsage));
    this.updateElement('perf-nodes', `Nodes: ${metrics.nodeCount}`);
    this.updateElement('perf-edges', `Edges: ${metrics.edgeCount}`);
    this.updateElement('perf-quality', `Quality: ${quality.toUpperCase()}`, this.getQualityColor(quality));

    // Update optimization stats
    if (this.config.displayMode === 'dashboard') {
      this.updateElement('perf-culled', `Culled: ${stats.culledNodes} nodes, ${stats.culledEdges} edges`);
      this.updateElement('perf-batches', `Batches: ${stats.batchCount} • Strategy: ${stats.strategy}`);
    }

    // Update graphs
    if (this.config.showFpsGraph && this.config.displayMode === 'dashboard') {
      this.drawFpsGraph();
    }

    // Update warnings
    if (this.config.showWarnings) {
      this.updateWarnings(warnings);
    }

    // Update recommendations
    if (this.config.showRecommendations && this.config.displayMode === 'dashboard') {
      this.updateRecommendations();
    }
  }

  /**
   * Update history data
   */
  private updateHistory(metrics: PerformanceMetrics): void {
    this.fpsHistory.push(metrics.fps);
    this.memoryHistory.push(metrics.memoryUsage);
    this.frameTimeHistory.push(metrics.frameTime);

    const maxLength = this.config.graphHistoryLength;
    if (this.fpsHistory.length > maxLength) {
      this.fpsHistory.shift();
      this.memoryHistory.shift();
      this.frameTimeHistory.shift();
    }
  }

  /**
   * Update DOM element
   */
  private updateElement(id: string, text: string, color?: string): void {
    if (!this.containerElement) {
      return;
    }

    const element = this.containerElement.querySelector(`#${id}`);
    if (element) {
      element.textContent = text;
      if (color) {
        (element as HTMLElement).style.color = color;
      }
    }
  }

  /**
   * Draw FPS graph
   */
  private drawFpsGraph(): void {
    if (!this.containerElement) {
      return;
    }

    const canvas = this.containerElement.querySelector('#perf-fps-graph') as HTMLCanvasElement;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    if (this.fpsHistory.length < 2) {
      return;
    }

    // Draw grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw FPS line
    const maxFps = 60;
    const step = width / this.config.graphHistoryLength;

    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < this.fpsHistory.length; i++) {
      const x = i * step;
      const fps = Math.min(this.fpsHistory[i], maxFps);
      const y = height - (fps / maxFps) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw target FPS line
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const targetY = height - (60 / maxFps) * height;
    ctx.beginPath();
    ctx.moveTo(0, targetY);
    ctx.lineTo(width, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText('60', 4, targetY - 2);
    ctx.fillText('0', 4, height - 4);
  }

  /**
   * Update warnings display
   */
  private updateWarnings(warnings: PerformanceWarning[]): void {
    if (!this.containerElement) {
      return;
    }

    const warningsElement = this.containerElement.querySelector('#perf-warnings') as HTMLElement;
    const warningsCountElement = this.containerElement.querySelector('#perf-warnings-count') as HTMLElement;

    if (!warningsElement && !warningsCountElement) {
      return;
    }

    // Get recent warnings (last 5)
    const recentWarnings = warnings.slice(-5);

    if (warningsCountElement) {
      if (warnings.length > 0) {
        const critical = warnings.filter((w) => w.severity === 'critical').length;
        warningsCountElement.textContent = `⚠ ${critical} critical, ${warnings.length - critical} warnings`;
        warningsCountElement.style.color = critical > 0 ? '#ef4444' : '#fbbf24';
      } else {
        warningsCountElement.textContent = '✓ No warnings';
        warningsCountElement.style.color = '#4ade80';
      }
    }

    if (warningsElement) {
      if (recentWarnings.length === 0) {
        warningsElement.innerHTML = '<div style="color: #4ade80;">✓ No warnings</div>';
      } else {
        const html = recentWarnings
          .map((w) => {
            const color = w.severity === 'critical' ? '#ef4444' : w.severity === 'warning' ? '#fbbf24' : '#60a5fa';
            const icon = w.severity === 'critical' ? '⚠' : w.severity === 'warning' ? '⚡' : 'ℹ';
            return `<div style="color: ${color}; font-size: 10px; margin-bottom: 2px;">${icon} ${w.message}</div>`;
          })
          .join('');

        warningsElement.innerHTML = `<div style="font-weight: bold; margin-bottom: 4px; color: #888; font-size: 10px;">WARNINGS</div>${html}`;
      }
    }
  }

  /**
   * Update recommendations display
   */
  private updateRecommendations(): void {
    if (!this.containerElement) {
      return;
    }

    const element = this.containerElement.querySelector('#perf-recommendations') as HTMLElement;
    if (!element) {
      return;
    }

    try {
      const report = this.profiler.generateReport();
      const recommendations = report.recommendations.slice(0, 3);

      if (recommendations.length === 0) {
        element.innerHTML = '<div style="color: #4ade80; font-size: 10px;">✓ Performance optimal</div>';
      } else {
        const html = recommendations
          .map((r) => `<div style="font-size: 10px; color: #888; margin-bottom: 2px;">• ${r}</div>`)
          .join('');

        element.innerHTML = `<div style="font-weight: bold; margin-bottom: 4px; color: #888; font-size: 10px;">RECOMMENDATIONS</div>${html}`;
      }
    } catch {
      // Not enough samples yet
      element.innerHTML = '';
    }
  }

  // ==========================================================================
  // COLOR UTILITIES
  // ==========================================================================

  /**
   * Get FPS color
   */
  private getFpsColor(fps: number): string {
    if (fps >= 55) return '#4ade80'; // Green
    if (fps >= 45) return '#fbbf24'; // Yellow
    if (fps >= 30) return '#fb923c'; // Orange
    return '#ef4444'; // Red
  }

  /**
   * Get frame time color
   */
  private getFrameTimeColor(frameTime: number): string {
    if (frameTime <= 16.67) return '#4ade80'; // Green
    if (frameTime <= 22) return '#fbbf24'; // Yellow
    if (frameTime <= 33) return '#fb923c'; // Orange
    return '#ef4444'; // Red
  }

  /**
   * Get memory color
   */
  private getMemoryColor(memory: number): string {
    if (memory < 50) return '#4ade80';
    if (memory < 100) return '#fbbf24';
    if (memory < 200) return '#fb923c';
    return '#ef4444';
  }

  /**
   * Get quality color
   */
  private getQualityColor(quality: QualityLevel): string {
    switch (quality) {
      case 'ultra':
        return '#a78bfa';
      case 'high':
        return '#4ade80';
      case 'medium':
        return '#fbbf24';
      case 'low':
        return '#fb923c';
      default:
        return '#888';
    }
  }

  // ==========================================================================
  // KEYBOARD SHORTCUTS
  // ==========================================================================

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        this.toggleVisibility();
      } else if (e.key === 'r' || e.key === 'R') {
        this.reset();
      }
    });
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Toggle visibility
   */
  public toggleVisibility(): void {
    this.isVisible = !this.isVisible;
    if (this.containerElement) {
      this.containerElement.style.display = this.isVisible ? 'block' : 'none';
    }
  }

  /**
   * Show monitor
   */
  public show(): void {
    this.isVisible = true;
    if (this.containerElement) {
      this.containerElement.style.display = 'block';
    }
  }

  /**
   * Hide monitor
   */
  public hide(): void {
    this.isVisible = false;
    if (this.containerElement) {
      this.containerElement.style.display = 'none';
    }
  }

  /**
   * Reset profiler
   */
  public reset(): void {
    this.profiler.reset();
    this.optimizer.resetStats();
    this.fpsHistory = [];
    this.memoryHistory = [];
    this.frameTimeHistory = [];
    this.startTime = performance.now();
  }

  /**
   * Generate and download performance report
   */
  public downloadReport(): void {
    const report = this.profiler.generateReport();
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Get current statistics
   */
  public getStatistics(): MonitorStatistics {
    return {
      current: this.profiler.getCurrentMetrics(),
      optimization: this.optimizer.getStats(),
      quality: this.adaptiveQuality.getQuality(),
      warningsCount: this.profiler.getWarnings().length,
      recommendationsCount: 0, // Will be calculated from report
      uptime: performance.now() - this.startTime,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PerformanceMonitorConfig>): void {
    this.config = { ...this.config, ...config };

    // Recreate UI if display mode changed
    if (config.displayMode && this.containerElement) {
      const parent = this.containerElement.parentElement;
      this.containerElement.remove();
      this.containerElement = this.createMonitorElement();
      if (parent) {
        parent.appendChild(this.containerElement);
      }
    }
  }

  /**
   * Get profiler instance
   */
  public getProfiler(): Profiler {
    return this.profiler;
  }

  /**
   * Get optimizer instance
   */
  public getOptimizer(): Optimizer {
    return this.optimizer;
  }

  /**
   * Get adaptive quality instance
   */
  public getAdaptiveQuality(): AdaptiveQuality {
    return this.adaptiveQuality;
  }
}
