/**
 * Adaptive Quality System
 *
 * Dynamically adjusts visualization quality based on performance metrics.
 * Implements LOD (Level of Detail), throttling, and progressive rendering.
 *
 * @module visualization/performance/AdaptiveQuality
 */

import type { PerformanceMetrics } from '../core/types';
import type { Profiler } from './Profiler';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Quality level
 */
export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';

/**
 * LOD (Level of Detail) settings
 */
export interface LODSettings {
  /** Node simplification threshold */
  nodeSimplificationDistance: number;

  /** Edge simplification threshold */
  edgeSimplificationDistance: number;

  /** Label visibility distance */
  labelVisibilityDistance: number;

  /** Animation quality (0-1) */
  animationQuality: number;

  /** Texture resolution scale (0-1) */
  textureScale: number;

  /** Anti-aliasing enabled */
  antialiasing: boolean;

  /** Shadow rendering enabled */
  shadows: boolean;

  /** Particle effects enabled */
  particles: boolean;
}

/**
 * Adaptive quality configuration
 */
export interface AdaptiveQualityConfig {
  /** Enable adaptive quality */
  enabled: boolean;

  /** Target FPS */
  targetFps: number;

  /** FPS tolerance before adjusting */
  fpsTolerance: number;

  /** Adjustment interval (ms) */
  adjustmentInterval: number;

  /** Enable auto-downgrade */
  autoDowngrade: boolean;

  /** Enable auto-upgrade */
  autoUpgrade: boolean;

  /** Minimum quality level */
  minQuality: QualityLevel;

  /** Maximum quality level */
  maxQuality: QualityLevel;

  /** Enable progressive rendering */
  progressiveRendering: boolean;

  /** Progressive render chunk size */
  progressiveChunkSize: number;
}

/**
 * Quality preset
 */
export interface QualityPreset {
  level: QualityLevel;
  lod: LODSettings;
  maxNodes: number;
  maxEdges: number;
  fps: number;
}

// ============================================================================
// ADAPTIVE QUALITY CLASS
// ============================================================================

/**
 * Adaptive quality system for dynamic performance optimization
 */
export class AdaptiveQuality {
  private config: AdaptiveQualityConfig;
  private profiler: Profiler | null = null;
  private currentQuality: QualityLevel = 'high';
  private currentLOD: LODSettings;

  private adjustmentTimer: NodeJS.Timeout | number | null = null;
  private performanceHistory: number[] = [];
  private readonly HISTORY_SIZE = 10;

  private qualityPresets: Map<QualityLevel, QualityPreset>;

  // Progressive rendering state
  private progressiveRenderIndex = 0;
  private progressiveRenderQueue: Array<() => void> = [];

  constructor(config?: Partial<AdaptiveQualityConfig>, profiler?: Profiler) {
    this.config = {
      enabled: config?.enabled ?? true,
      targetFps: config?.targetFps ?? 60,
      fpsTolerance: config?.fpsTolerance ?? 5,
      adjustmentInterval: config?.adjustmentInterval ?? 2000,
      autoDowngrade: config?.autoDowngrade ?? true,
      autoUpgrade: config?.autoUpgrade ?? true,
      minQuality: config?.minQuality ?? 'low',
      maxQuality: config?.maxQuality ?? 'ultra',
      progressiveRendering: config?.progressiveRendering ?? false,
      progressiveChunkSize: config?.progressiveChunkSize ?? 50,
    };

    this.profiler = profiler || null;

    // Initialize quality presets
    this.qualityPresets = this.createQualityPresets();
    this.currentLOD = this.qualityPresets.get(this.currentQuality)!.lod;
  }

  // ==========================================================================
  // QUALITY PRESETS
  // ==========================================================================

  /**
   * Create quality presets
   */
  private createQualityPresets(): Map<QualityLevel, QualityPreset> {
    const presets = new Map<QualityLevel, QualityPreset>();

    // Low quality - maximum performance
    presets.set('low', {
      level: 'low',
      lod: {
        nodeSimplificationDistance: 50,
        edgeSimplificationDistance: 30,
        labelVisibilityDistance: 100,
        animationQuality: 0.3,
        textureScale: 0.5,
        antialiasing: false,
        shadows: false,
        particles: false,
      },
      maxNodes: 5000,
      maxEdges: 10000,
      fps: 30,
    });

    // Medium quality - balanced
    presets.set('medium', {
      level: 'medium',
      lod: {
        nodeSimplificationDistance: 100,
        edgeSimplificationDistance: 75,
        labelVisibilityDistance: 200,
        animationQuality: 0.6,
        textureScale: 0.75,
        antialiasing: false,
        shadows: false,
        particles: false,
      },
      maxNodes: 2000,
      maxEdges: 5000,
      fps: 45,
    });

    // High quality - good visuals
    presets.set('high', {
      level: 'high',
      lod: {
        nodeSimplificationDistance: 200,
        edgeSimplificationDistance: 150,
        labelVisibilityDistance: 400,
        animationQuality: 0.85,
        textureScale: 1.0,
        antialiasing: true,
        shadows: false,
        particles: true,
      },
      maxNodes: 1000,
      maxEdges: 2000,
      fps: 60,
    });

    // Ultra quality - maximum visuals
    presets.set('ultra', {
      level: 'ultra',
      lod: {
        nodeSimplificationDistance: 500,
        edgeSimplificationDistance: 400,
        labelVisibilityDistance: 1000,
        animationQuality: 1.0,
        textureScale: 1.0,
        antialiasing: true,
        shadows: true,
        particles: true,
      },
      maxNodes: 500,
      maxEdges: 1000,
      fps: 60,
    });

    return presets;
  }

  /**
   * Get quality preset
   */
  public getPreset(level: QualityLevel): QualityPreset | undefined {
    return this.qualityPresets.get(level);
  }

  /**
   * Register custom quality preset
   */
  public registerPreset(preset: QualityPreset): void {
    this.qualityPresets.set(preset.level, preset);
  }

  // ==========================================================================
  // QUALITY MANAGEMENT
  // ==========================================================================

  /**
   * Start adaptive quality monitoring
   */
  public start(): void {
    if (!this.config.enabled) {
      return;
    }

    // Start monitoring performance
    if (typeof window !== 'undefined') {
      this.adjustmentTimer = window.setInterval(() => {
        this.evaluatePerformance();
      }, this.config.adjustmentInterval);
    } else if (typeof global !== 'undefined') {
      this.adjustmentTimer = setInterval(() => {
        this.evaluatePerformance();
      }, this.config.adjustmentInterval);
    }
  }

  /**
   * Stop adaptive quality monitoring
   */
  public stop(): void {
    if (this.adjustmentTimer !== null) {
      if (typeof window !== 'undefined') {
        window.clearInterval(this.adjustmentTimer as number);
      } else {
        clearInterval(this.adjustmentTimer as NodeJS.Timeout);
      }
      this.adjustmentTimer = null;
    }
  }

  /**
   * Evaluate current performance and adjust quality
   */
  private evaluatePerformance(): void {
    if (!this.profiler) {
      return;
    }

    const metrics = this.profiler.getCurrentMetrics();
    this.performanceHistory.push(metrics.fps);

    // Keep history size limited
    if (this.performanceHistory.length > this.HISTORY_SIZE) {
      this.performanceHistory.shift();
    }

    // Need enough history to make decision
    if (this.performanceHistory.length < this.HISTORY_SIZE) {
      return;
    }

    // Calculate average FPS
    const avgFps = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;

    // Determine if adjustment needed
    const targetFps = this.config.targetFps;
    const tolerance = this.config.fpsTolerance;

    if (avgFps < targetFps - tolerance && this.config.autoDowngrade) {
      // Performance below target - downgrade quality
      this.downgradeQuality();
    } else if (avgFps > targetFps + tolerance && this.config.autoUpgrade) {
      // Performance above target - try upgrading quality
      this.upgradeQuality();
    }
  }

  /**
   * Downgrade quality level
   */
  public downgradeQuality(): boolean {
    const levels: QualityLevel[] = ['ultra', 'high', 'medium', 'low'];
    const currentIndex = levels.indexOf(this.currentQuality);

    if (currentIndex >= levels.length - 1) {
      return false; // Already at lowest
    }

    const minIndex = levels.indexOf(this.config.minQuality);
    if (currentIndex >= minIndex) {
      return false; // At minimum allowed quality
    }

    const newQuality = levels[currentIndex + 1];
    this.setQuality(newQuality);

    console.log(`Quality downgraded: ${this.currentQuality} → ${newQuality}`);
    return true;
  }

  /**
   * Upgrade quality level
   */
  public upgradeQuality(): boolean {
    const levels: QualityLevel[] = ['ultra', 'high', 'medium', 'low'];
    const currentIndex = levels.indexOf(this.currentQuality);

    if (currentIndex <= 0) {
      return false; // Already at highest
    }

    const maxIndex = levels.indexOf(this.config.maxQuality);
    if (currentIndex <= maxIndex) {
      return false; // At maximum allowed quality
    }

    const newQuality = levels[currentIndex - 1];
    this.setQuality(newQuality);

    console.log(`Quality upgraded: ${this.currentQuality} → ${newQuality}`);
    return true;
  }

  /**
   * Set quality level
   */
  public setQuality(level: QualityLevel): void {
    const preset = this.qualityPresets.get(level);
    if (!preset) {
      throw new Error(`Unknown quality level: ${level}`);
    }

    this.currentQuality = level;
    this.currentLOD = preset.lod;

    // Clear performance history when manually changing
    this.performanceHistory = [];
  }

  /**
   * Get current quality level
   */
  public getQuality(): QualityLevel {
    return this.currentQuality;
  }

  /**
   * Get current LOD settings
   */
  public getLOD(): LODSettings {
    return { ...this.currentLOD };
  }

  // ==========================================================================
  // LOD UTILITIES
  // ==========================================================================

  /**
   * Check if node should be rendered at distance
   */
  public shouldRenderNode(distance: number): boolean {
    return distance <= this.currentLOD.nodeSimplificationDistance;
  }

  /**
   * Check if edge should be rendered at distance
   */
  public shouldRenderEdge(distance: number): boolean {
    return distance <= this.currentLOD.edgeSimplificationDistance;
  }

  /**
   * Check if label should be visible at distance
   */
  public shouldShowLabel(distance: number): boolean {
    return distance <= this.currentLOD.labelVisibilityDistance;
  }

  /**
   * Get animation quality factor
   */
  public getAnimationQuality(): number {
    return this.currentLOD.animationQuality;
  }

  /**
   * Get texture scale factor
   */
  public getTextureScale(): number {
    return this.currentLOD.textureScale;
  }

  /**
   * Check if antialiasing enabled
   */
  public isAntialiasingEnabled(): boolean {
    return this.currentLOD.antialiasing;
  }

  /**
   * Check if shadows enabled
   */
  public areShadowsEnabled(): boolean {
    return this.currentLOD.shadows;
  }

  /**
   * Check if particles enabled
   */
  public areParticlesEnabled(): boolean {
    return this.currentLOD.particles;
  }

  // ==========================================================================
  // PROGRESSIVE RENDERING
  // ==========================================================================

  /**
   * Setup progressive rendering
   */
  public setupProgressiveRender(renderFunctions: Array<() => void>): void {
    if (!this.config.progressiveRendering) {
      // Render all immediately if progressive rendering disabled
      renderFunctions.forEach((fn) => fn());
      return;
    }

    this.progressiveRenderQueue = renderFunctions;
    this.progressiveRenderIndex = 0;
  }

  /**
   * Execute next progressive render chunk
   */
  public executeProgressiveChunk(): boolean {
    if (this.progressiveRenderIndex >= this.progressiveRenderQueue.length) {
      return false; // Rendering complete
    }

    const chunkSize = this.config.progressiveChunkSize;
    const endIndex = Math.min(
      this.progressiveRenderIndex + chunkSize,
      this.progressiveRenderQueue.length
    );

    // Execute chunk
    for (let i = this.progressiveRenderIndex; i < endIndex; i++) {
      this.progressiveRenderQueue[i]();
    }

    this.progressiveRenderIndex = endIndex;
    return this.progressiveRenderIndex < this.progressiveRenderQueue.length;
  }

  /**
   * Get progressive render progress (0-1)
   */
  public getProgressiveProgress(): number {
    if (this.progressiveRenderQueue.length === 0) {
      return 1;
    }

    return this.progressiveRenderIndex / this.progressiveRenderQueue.length;
  }

  /**
   * Reset progressive rendering
   */
  public resetProgressiveRender(): void {
    this.progressiveRenderQueue = [];
    this.progressiveRenderIndex = 0;
  }

  /**
   * Check if progressive rendering is active
   */
  public isProgressiveRenderActive(): boolean {
    return this.progressiveRenderIndex < this.progressiveRenderQueue.length;
  }

  // ==========================================================================
  // DEVICE DETECTION
  // ==========================================================================

  /**
   * Detect device capabilities and recommend quality
   */
  public detectOptimalQuality(): QualityLevel {
    if (typeof window === 'undefined') {
      return 'medium';
    }

    // Check for high-performance indicators
    const hasWebGL = this.hasWebGLSupport();
    const hasHighDPI = window.devicePixelRatio > 1;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const memory = (performance as any).memory?.jsHeapSizeLimit || 0;

    // Calculate quality score
    let score = 0;

    if (hasWebGL) score += 2;
    if (hasHighDPI) score += 1;
    if (hardwareConcurrency >= 8) score += 2;
    if (hardwareConcurrency >= 4) score += 1;
    if (memory > 1024 * 1024 * 1024) score += 2; // > 1GB

    // Map score to quality
    if (score >= 7) return 'ultra';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * Check WebGL support
   */
  private hasWebGLSupport(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl !== null;
    } catch {
      return false;
    }
  }

  /**
   * Check if running on low-end device
   */
  public isLowEndDevice(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const cores = navigator.hardwareConcurrency || 4;
    const memory = (performance as any).memory?.jsHeapSizeLimit || Infinity;

    return cores < 4 || memory < 512 * 1024 * 1024; // < 512MB
  }

  // ==========================================================================
  // THROTTLING
  // ==========================================================================

  /**
   * Calculate throttle delay based on current performance
   */
  public getThrottleDelay(): number {
    if (!this.profiler) {
      return 0;
    }

    const metrics = this.profiler.getCurrentMetrics();
    const targetFrameTime = 1000 / this.config.targetFps;

    if (metrics.frameTime > targetFrameTime * 1.5) {
      // Slow rendering - add delay
      return Math.floor(metrics.frameTime - targetFrameTime);
    }

    return 0;
  }

  /**
   * Check if should throttle current operation
   */
  public shouldThrottle(): boolean {
    return this.getThrottleDelay() > 0;
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AdaptiveQualityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): AdaptiveQualityConfig {
    return { ...this.config };
  }

  /**
   * Set profiler instance
   */
  public setProfiler(profiler: Profiler): void {
    this.profiler = profiler;
  }

  /**
   * Enable/disable adaptive quality
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stop();
    this.performanceHistory = [];
    this.progressiveRenderQueue = [];
  }
}
