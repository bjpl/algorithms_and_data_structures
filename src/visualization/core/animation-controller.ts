/**
 * Animation Controller Implementation
 *
 * Manages animation timeline, playback control, and frame synchronization.
 * Uses requestAnimationFrame for smooth 60fps animations.
 */

import type { IAnimationController } from './interfaces';
import type {
  AnimationConfig,
  AnimationState,
  UnsubscribeFunction,
} from './types';

/**
 * Default animation configuration
 */
const DEFAULT_CONFIG: AnimationConfig = {
  duration: 1000,
  easing: 'ease-in-out',
  delay: 0,
  repeat: 0,
  autoPlay: false,
  speed: 1.0,
};

/**
 * Easing functions for animation timing
 */
const EASING_FUNCTIONS: Record<string, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

/**
 * Animation controller implementation
 */
export class AnimationController implements IAnimationController {
  private config: AnimationConfig;
  private state: AnimationState = 'idle';
  private currentTime = 0;
  private startTime = 0;
  private pausedTime = 0;
  private animationFrameId: number | null = null;
  private loopEnabled = false;
  private currentRepeat = 0;

  // Event callbacks
  private completeCallbacks: Set<() => void> = new Set();
  private updateCallbacks: Set<(progress: number) => void> = new Set();
  private stateChangeCallbacks: Set<(state: AnimationState) => void> = new Set();

  constructor(config: Partial<AnimationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.repeat === -1) {
      this.loopEnabled = true;
    }
  }

  // ========================================================================
  // PLAYBACK CONTROL
  // ========================================================================

  play(): void {
    if (this.state === 'playing') {
      return;
    }

    if (this.state === 'idle' || this.state === 'stopped') {
      this.currentTime = 0;
      this.currentRepeat = 0;
    }

    this.setState('playing');
    this.startTime = performance.now() - this.currentTime;
    this.animate();
  }

  pause(): void {
    if (this.state !== 'playing') {
      return;
    }

    this.setState('paused');
    this.pausedTime = this.currentTime;
    this.cancelAnimation();
  }

  stop(): void {
    this.setState('stopped');
    this.currentTime = 0;
    this.currentRepeat = 0;
    this.cancelAnimation();
  }

  resume(): void {
    if (this.state !== 'paused') {
      return;
    }

    this.setState('playing');
    this.startTime = performance.now() - this.pausedTime;
    this.animate();
  }

  getState(): AnimationState {
    return this.state;
  }

  private setState(newState: AnimationState): void {
    if (this.state === newState) {
      return;
    }

    this.state = newState;
    this.stateChangeCallbacks.forEach((callback) => callback(newState));
  }

  // ========================================================================
  // TIMELINE NAVIGATION
  // ========================================================================

  seek(time: number): void {
    const duration = this.getDuration();
    this.currentTime = Math.max(0, Math.min(time, duration));

    if (this.state === 'playing') {
      this.startTime = performance.now() - this.currentTime;
    }

    const progress = this.calculateProgress();
    this.updateCallbacks.forEach((callback) => callback(progress));
  }

  stepForward(): void {
    const frameTime = 1000 / 60; // Assume 60fps
    this.seek(this.currentTime + frameTime);
  }

  stepBackward(): void {
    const frameTime = 1000 / 60;
    this.seek(this.currentTime - frameTime);
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getDuration(): number {
    return this.config.duration ?? DEFAULT_CONFIG.duration!;
  }

  getCurrentFrame(): number {
    const fps = 60;
    return Math.floor((this.currentTime / 1000) * fps);
  }

  getTotalFrames(): number {
    const fps = 60;
    return Math.floor((this.getDuration() / 1000) * fps);
  }

  // ========================================================================
  // SPEED CONTROL
  // ========================================================================

  setSpeed(speed: number): void {
    if (speed <= 0) {
      throw new Error('Speed must be positive');
    }

    this.config.speed = speed;

    if (this.state === 'playing') {
      // Recalculate start time to maintain current position
      this.startTime = performance.now() - this.currentTime / speed;
    }
  }

  getSpeed(): number {
    return this.config.speed ?? DEFAULT_CONFIG.speed!;
  }

  // ========================================================================
  // CONFIGURATION
  // ========================================================================

  updateConfig(config: Partial<AnimationConfig>): void {
    const wasPlaying = this.state === 'playing';

    if (wasPlaying) {
      this.pause();
    }

    this.config = { ...this.config, ...config };

    if (config.repeat === -1) {
      this.loopEnabled = true;
    } else if (config.repeat !== undefined) {
      this.loopEnabled = false;
    }

    if (wasPlaying) {
      this.resume();
    }
  }

  getConfig(): AnimationConfig {
    return { ...this.config };
  }

  // ========================================================================
  // LOOP CONTROL
  // ========================================================================

  setLoop(enabled: boolean): void {
    this.loopEnabled = enabled;
    if (enabled) {
      this.config.repeat = -1;
    }
  }

  isLooping(): boolean {
    return this.loopEnabled;
  }

  // ========================================================================
  // EVENT HOOKS
  // ========================================================================

  onComplete(callback: () => void): UnsubscribeFunction {
    this.completeCallbacks.add(callback);
    return () => this.completeCallbacks.delete(callback);
  }

  onUpdate(callback: (progress: number) => void): UnsubscribeFunction {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  onStateChange(callback: (state: AnimationState) => void): UnsubscribeFunction {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  // ========================================================================
  // ANIMATION LOOP
  // ========================================================================

  private animate = (): void => {
    if (this.state !== 'playing') {
      return;
    }

    const now = performance.now();
    const elapsed = (now - this.startTime) * this.getSpeed();
    const duration = this.getDuration();
    const delay = this.config.delay ?? 0;

    // Handle delay
    if (elapsed < delay) {
      this.animationFrameId = requestAnimationFrame(this.animate);
      return;
    }

    this.currentTime = elapsed - delay;

    // Check if animation completed
    if (this.currentTime >= duration) {
      this.currentRepeat++;

      const maxRepeats = this.config.repeat ?? 0;
      const shouldRepeat = this.loopEnabled || this.currentRepeat < maxRepeats;

      if (shouldRepeat) {
        // Reset for next iteration
        this.currentTime = 0;
        this.startTime = now;
      } else {
        // Animation complete
        this.currentTime = duration;
        this.setState('idle');
        this.completeCallbacks.forEach((callback) => callback());
        return;
      }
    }

    // Calculate progress with easing
    const progress = this.calculateProgress();
    this.updateCallbacks.forEach((callback) => callback(progress));

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private calculateProgress(): number {
    const duration = this.getDuration();
    const rawProgress = Math.min(1, this.currentTime / duration);

    // Apply easing function
    const easingName = this.config.easing ?? 'ease-in-out';

    if (easingName === 'cubic-bezier' && this.config.cubicBezier) {
      return this.cubicBezier(rawProgress, this.config.cubicBezier);
    }

    const easingFn = EASING_FUNCTIONS[easingName] || EASING_FUNCTIONS.linear;
    return easingFn(rawProgress);
  }

  private cubicBezier(
    t: number,
    [p1x, p1y, p2x, p2y]: [number, number, number, number]
  ): number {
    // Simplified cubic bezier approximation
    // For production, use a proper bezier-easing library
    const cx = 3 * p1x;
    const bx = 3 * (p2x - p1x) - cx;
    const ax = 1 - cx - bx;

    const cy = 3 * p1y;
    const by = 3 * (p2y - p1y) - cy;
    const ay = 1 - cy - by;

    const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
    const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;

    // Newton-Raphson iteration to find t for given x
    let t2 = t;
    for (let i = 0; i < 8; i++) {
      const x = sampleCurveX(t2) - t;
      if (Math.abs(x) < 1e-7) break;
      const d = 3 * ax * t2 * t2 + 2 * bx * t2 + cx;
      if (Math.abs(d) < 1e-6) break;
      t2 -= x / d;
    }

    return sampleCurveY(t2);
  }

  private cancelAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // ========================================================================
  // CLEANUP
  // ========================================================================

  destroy(): void {
    this.stop();
    this.completeCallbacks.clear();
    this.updateCallbacks.clear();
    this.stateChangeCallbacks.clear();
  }
}
