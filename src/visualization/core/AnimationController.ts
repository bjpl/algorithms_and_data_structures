/**
 * @file Timeline-based animation controller
 * @module visualization/core
 */

/**
 * Animation state
 */
export type AnimationState = 'idle' | 'playing' | 'paused';

/**
 * Animation event types
 */
export type AnimationEvent =
  | 'play'
  | 'pause'
  | 'stop'
  | 'resume'
  | 'seek'
  | 'update'
  | 'complete'
  | 'speedChange'
  | 'breakpointHit';

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Total duration in milliseconds */
  duration: number;
  /** Target frames per second */
  fps?: number;
  /** Initial playback speed multiplier */
  initialSpeed?: number;
  /** Whether to loop the animation */
  loop?: boolean;
}

/**
 * Time travel debugging configuration
 */
export interface TimeTravelConfig {
  /** Maximum number of snapshots to keep */
  maxSnapshots?: number;
}

/**
 * Animation snapshot for time travel
 */
export interface AnimationSnapshot {
  /** Snapshot timestamp */
  time: number;
  /** State at this time */
  state: any;
}

/**
 * Event listener type
 */
type EventListener<T = any> = (data?: T) => void;

/**
 * Conditional breakpoint predicate
 */
type BreakpointCondition = (data: any) => boolean;

/**
 * Timeline-based animation controller
 *
 * Provides precise control over animation playback:
 * - Play, pause, resume, stop
 * - Speed control (0.25x to 4x)
 * - Step forward/backward
 * - Breakpoint support
 * - Frame-by-frame control
 * - Time travel debugging
 *
 * @example
 * ```typescript
 * const controller = new AnimationController({
 *   duration: 5000,
 *   fps: 60,
 *   initialSpeed: 1
 * });
 *
 * controller.on('update', (data) => {
 *   console.log('Current time:', data.time);
 * });
 *
 * controller.play();
 * ```
 */
export class AnimationController {
  private duration: number;
  private fps: number;
  private speed: number;
  private loop: boolean;

  private state: AnimationState = 'idle';
  private currentTime = 0;
  private animationFrameId: number | null = null;
  private lastTickTime = 0;

  // Breakpoints
  private breakpoints: Set<number> = new Set();
  private conditionalBreakpoints: BreakpointCondition[] = [];

  // Time travel
  private timeTravelEnabled = false;
  private snapshots: AnimationSnapshot[] = [];
  private maxSnapshots = 1000;

  // Event system
  private eventListeners: Map<AnimationEvent, Set<EventListener>> = new Map();

  /**
   * Creates a new AnimationController
   *
   * @param config - Animation configuration
   */
  constructor(config: AnimationConfig) {
    this.duration = config.duration;
    this.fps = config.fps ?? 60;
    this.speed = config.initialSpeed ?? 1;
    this.loop = config.loop ?? false;
  }

  /**
   * Gets the current state
   *
   * @returns The current state
   */
  public getState(): AnimationState {
    return this.state;
  }

  /**
   * Checks if currently playing
   *
   * @returns True if playing
   */
  public isPlaying(): boolean {
    return this.state === 'playing';
  }

  /**
   * Checks if currently paused
   *
   * @returns True if paused
   */
  public isPaused(): boolean {
    return this.state === 'paused';
  }

  /**
   * Gets the current time
   *
   * @returns Current time in milliseconds
   */
  public getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Gets the total duration
   *
   * @returns Duration in milliseconds
   */
  public getDuration(): number {
    return this.duration;
  }

  /**
   * Gets current progress as a percentage
   *
   * @returns Progress from 0 to 1
   */
  public getProgress(): number {
    return this.currentTime / this.duration;
  }

  /**
   * Gets the current playback speed
   *
   * @returns Speed multiplier
   */
  public getSpeed(): number {
    return this.speed;
  }

  /**
   * Sets the playback speed
   *
   * @param speed - Speed multiplier (0.25 to 4)
   * @throws {Error} If speed is invalid
   */
  public setSpeed(speed: number): void {
    if (!isFinite(speed) || speed <= 0) {
      throw new Error('Speed must be a positive finite number');
    }

    // Clamp to valid range
    this.speed = Math.max(0.25, Math.min(4, speed));
    this.emit('speedChange', { speed: this.speed });
  }

  /**
   * Starts playback
   */
  public play(): void {
    if (this.state === 'playing') return;

    this.state = 'playing';
    this.lastTickTime = performance.now();
    this.tick();
    this.emit('play');
  }

  /**
   * Pauses playback
   */
  public pause(): void {
    if (this.state !== 'playing') return;

    this.state = 'paused';
    this.stopTick();
    this.emit('pause');
  }

  /**
   * Resumes from pause
   */
  public resume(): void {
    if (this.state !== 'paused') return;

    this.state = 'playing';
    this.lastTickTime = performance.now();
    this.tick();
    this.emit('resume');
  }

  /**
   * Stops and resets to beginning
   */
  public stop(): void {
    this.state = 'idle';
    this.currentTime = 0;
    this.stopTick();
    this.emit('stop');
  }

  /**
   * Stops the animation tick
   */
  private stopTick(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Animation tick loop
   */
  private tick = (): void => {
    if (this.state !== 'playing') return;

    const now = performance.now();
    const deltaTime = now - this.lastTickTime;
    this.lastTickTime = now;

    // Advance time
    const frameDuration = 1000 / this.fps;
    if (deltaTime >= frameDuration) {
      this.currentTime += deltaTime * this.speed;

      // Check breakpoints
      if (this.shouldPauseAtBreakpoint()) {
        this.pause();
        this.emit('breakpointHit', { time: this.currentTime });
        return;
      }

      // Handle completion
      if (this.currentTime >= this.duration) {
        if (this.loop) {
          this.currentTime = this.currentTime % this.duration;
        } else {
          this.currentTime = this.duration;
          this.state = 'idle';
          this.emit('complete');
          this.stopTick();
          return;
        }
      }

      this.emit('update', { time: this.currentTime, deltaTime });
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  /**
   * Seeks to a specific time
   *
   * @param time - Time in milliseconds
   * @throws {Error} If time is invalid
   */
  public seek(time: number): void {
    if (!isFinite(time)) {
      throw new Error('Time must be a finite number');
    }

    this.currentTime = Math.max(0, Math.min(this.duration, time));
    this.emit('seek', { time: this.currentTime });
  }

  /**
   * Steps forward by one frame
   */
  public stepForward(): void {
    const frameDuration = 1000 / this.fps;
    this.seek(this.currentTime + frameDuration);
  }

  /**
   * Steps backward by one frame
   */
  public stepBackward(): void {
    const frameDuration = 1000 / this.fps;
    this.seek(this.currentTime - frameDuration);
  }

  /**
   * Advances to next frame (alias for stepForward)
   */
  public nextFrame(): void {
    this.stepForward();
  }

  /**
   * Goes back to previous frame (alias for stepBackward)
   */
  public previousFrame(): void {
    this.stepBackward();
  }

  /**
   * Gets the current frame number
   *
   * @returns Frame number
   */
  public getCurrentFrame(): number {
    return Math.floor((this.currentTime / this.duration) * this.getTotalFrames());
  }

  /**
   * Gets the total number of frames
   *
   * @returns Total frames
   */
  public getTotalFrames(): number {
    return Math.floor((this.duration / 1000) * this.fps);
  }

  /**
   * Adds a breakpoint at a specific time
   *
   * @param time - Time in milliseconds
   * @throws {Error} If time is invalid
   */
  public addBreakpoint(time: number): void {
    if (time < 0 || time > this.duration) {
      throw new Error('Breakpoint time must be within animation duration');
    }

    this.breakpoints.add(time);
  }

  /**
   * Removes a breakpoint
   *
   * @param time - Time in milliseconds
   */
  public removeBreakpoint(time: number): void {
    this.breakpoints.delete(time);
  }

  /**
   * Clears all breakpoints
   */
  public clearBreakpoints(): void {
    this.breakpoints.clear();
    this.conditionalBreakpoints = [];
  }

  /**
   * Gets all breakpoints
   *
   * @returns Array of breakpoint times
   */
  public getBreakpoints(): number[] {
    return Array.from(this.breakpoints).sort((a, b) => a - b);
  }

  /**
   * Adds a conditional breakpoint
   *
   * @param condition - Predicate function
   */
  public addConditionalBreakpoint(condition: BreakpointCondition): void {
    this.conditionalBreakpoints.push(condition);
  }

  /**
   * Checks if should pause at a breakpoint
   *
   * @returns True if should pause
   */
  private shouldPauseAtBreakpoint(): boolean {
    // Check time-based breakpoints
    for (const breakpoint of Array.from(this.breakpoints)) {
      const frameDuration = 1000 / this.fps;
      if (
        this.currentTime >= breakpoint &&
        this.currentTime - breakpoint < frameDuration
      ) {
        return true;
      }
    }

    // Check conditional breakpoints
    for (const condition of this.conditionalBreakpoints) {
      try {
        if (condition({ time: this.currentTime })) {
          return true;
        }
      } catch (error) {
        console.error('Error in conditional breakpoint:', error);
      }
    }

    return false;
  }

  /**
   * Enables loop mode
   *
   * @param enabled - Whether to loop
   */
  public setLoop(enabled: boolean): void {
    this.loop = enabled;
  }

  /**
   * Checks if loop is enabled
   *
   * @returns True if looping
   */
  public isLooping(): boolean {
    return this.loop;
  }

  /**
   * Enables time travel debugging
   *
   * @param config - Time travel configuration
   */
  public enableTimeTravel(config?: TimeTravelConfig): void {
    this.timeTravelEnabled = true;
    if (config?.maxSnapshots) {
      this.maxSnapshots = config.maxSnapshots;
    }
  }

  /**
   * Checks if time travel is enabled
   *
   * @returns True if enabled
   */
  public isTimeTravelEnabled(): boolean {
    return this.timeTravelEnabled;
  }

  /**
   * Creates a snapshot of current state
   *
   * @param state - State to snapshot
   * @returns The snapshot
   */
  public createSnapshot(state?: any): AnimationSnapshot {
    const snapshot: AnimationSnapshot = {
      time: this.currentTime,
      state,
    };

    if (this.timeTravelEnabled) {
      this.snapshots.push(snapshot);

      // Limit snapshot count
      if (this.snapshots.length > this.maxSnapshots) {
        this.snapshots.shift();
      }
    }

    return snapshot;
  }

  /**
   * Restores from a snapshot
   *
   * @param snapshot - Snapshot to restore
   */
  public restoreSnapshot(snapshot: AnimationSnapshot): void {
    this.seek(snapshot.time);
  }

  /**
   * Gets the number of snapshots
   *
   * @returns Snapshot count
   */
  public getSnapshotCount(): number {
    return this.snapshots.length;
  }

  /**
   * Gets all snapshots
   *
   * @returns Array of snapshots
   */
  public getAllSnapshots(): AnimationSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Subscribes to an event
   *
   * @param event - Event type
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  public on<T = any>(event: AnimationEvent, listener: EventListener<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(listener);

    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  /**
   * Emits an event
   *
   * @param event - Event type
   * @param data - Event data
   */
  private emit<T = any>(event: AnimationEvent, data?: T): void {
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
   * Disposes the controller and cleans up resources
   */
  public dispose(): void {
    this.stopTick();
    this.eventListeners.clear();
    this.breakpoints.clear();
    this.conditionalBreakpoints = [];
    this.snapshots = [];
  }
}
