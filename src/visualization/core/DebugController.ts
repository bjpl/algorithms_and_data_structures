/**
 * @file Sophisticated breakpoint debugging system for algorithm visualizations
 * @module visualization/core
 */

import type { ExecutionStep } from './AlgorithmExecutor';

/**
 * Breakpoint types
 */
export type BreakpointType = 'line' | 'conditional' | 'hitCount' | 'logpoint';

/**
 * Execution control actions
 */
export type ExecutionAction =
  | 'stepOver'
  | 'stepInto'
  | 'stepOut'
  | 'continue'
  | 'runToBreakpoint'
  | 'pause'
  | 'resume';

/**
 * Debug state
 */
export type DebugState = 'idle' | 'running' | 'paused' | 'stepping' | 'completed';

/**
 * Debug event types
 */
export type DebugEvent =
  | 'breakpointHit'
  | 'breakpointAdded'
  | 'breakpointRemoved'
  | 'stateChange'
  | 'variableChange'
  | 'watchTriggered'
  | 'logpoint'
  | 'callStackChange'
  | 'executionComplete'
  | 'error';

/**
 * Condition evaluator function
 */
type ConditionEvaluator = (context: DebugContext) => boolean;

/**
 * Log expression evaluator
 */
type LogEvaluator = (context: DebugContext) => string;

/**
 * Event listener type
 */
type EventListener<T = any> = (data?: T) => void;

/**
 * Debug context for condition evaluation
 */
export interface DebugContext {
  /** Current step information */
  step: ExecutionStep;
  /** Current step index */
  stepIndex: number;
  /** All variables at current state */
  variables: Record<string, any>;
  /** Call stack frames */
  callStack: CallFrame[];
  /** Previous context (for comparison) */
  previous?: DebugContext;
}

/**
 * Call stack frame
 */
export interface CallFrame {
  /** Frame identifier */
  id: string;
  /** Function/method name */
  name: string;
  /** Line number */
  line: number;
  /** Scope variables */
  scope: Record<string, any>;
  /** Parent frame */
  parent?: CallFrame;
}

/**
 * Line breakpoint
 */
export interface LineBreakpoint {
  type: 'line';
  /** Line number */
  line: number;
  /** Whether breakpoint is enabled */
  enabled: boolean;
  /** Optional condition */
  condition?: string;
  /** Breakpoint ID */
  id: string;
}

/**
 * Conditional breakpoint
 */
export interface ConditionalBreakpoint {
  type: 'conditional';
  /** Condition expression */
  condition: string;
  /** Condition evaluator */
  evaluator: ConditionEvaluator;
  /** Whether breakpoint is enabled */
  enabled: boolean;
  /** Breakpoint ID */
  id: string;
}

/**
 * Hit count breakpoint
 */
export interface HitCountBreakpoint {
  type: 'hitCount';
  /** Line number */
  line: number;
  /** Target hit count */
  targetCount: number;
  /** Current hit count */
  currentCount: number;
  /** Comparison operator */
  operator: '==' | '>=' | '%';
  /** Whether breakpoint is enabled */
  enabled: boolean;
  /** Breakpoint ID */
  id: string;
}

/**
 * Logpoint (log without pausing)
 */
export interface Logpoint {
  type: 'logpoint';
  /** Line number */
  line: number;
  /** Log message expression */
  message: string;
  /** Message evaluator */
  evaluator: LogEvaluator;
  /** Whether logpoint is enabled */
  enabled: boolean;
  /** Logpoint ID */
  id: string;
}

/**
 * Union of all breakpoint types
 */
export type Breakpoint = LineBreakpoint | ConditionalBreakpoint | HitCountBreakpoint | Logpoint;

/**
 * Watch expression
 */
export interface WatchExpression {
  /** Watch ID */
  id: string;
  /** Expression to watch */
  expression: string;
  /** Evaluator function */
  evaluator: (context: DebugContext) => any;
  /** Last evaluated value */
  lastValue?: any;
  /** Whether to trigger on change */
  triggerOnChange: boolean;
}

/**
 * Memory snapshot
 */
export interface MemorySnapshot {
  /** Snapshot ID */
  id: string;
  /** Step index */
  stepIndex: number;
  /** Timestamp */
  timestamp: number;
  /** All variables */
  variables: Record<string, any>;
  /** Call stack */
  callStack: CallFrame[];
  /** Heap state */
  heap?: Map<string, any>;
}

/**
 * Configuration for DebugController
 */
export interface DebugConfig {
  /** Maximum snapshots to keep */
  maxSnapshots?: number;
  /** Enable automatic snapshots */
  autoSnapshot?: boolean;
  /** Snapshot interval (steps) */
  snapshotInterval?: number;
  /** Enable call stack tracking */
  trackCallStack?: boolean;
  /** Enable memory tracking */
  trackMemory?: boolean;
}

/**
 * Sophisticated breakpoint debugging system for algorithm visualizations
 *
 * Features:
 * - Line, conditional, hit count, and logpoint breakpoints
 * - Step over, step into, step out execution control
 * - Variable watching and expression evaluation
 * - Call stack tracking
 * - Memory snapshots
 * - Integration with AnimationController and AlgorithmExecutor
 *
 * @example
 * ```typescript
 * const debugController = new DebugController({
 *   maxSnapshots: 100,
 *   autoSnapshot: true,
 *   trackCallStack: true
 * });
 *
 * // Add line breakpoint
 * debugController.addLineBreakpoint(10);
 *
 * // Add conditional breakpoint
 * debugController.addConditionalBreakpoint('i > 5');
 *
 * // Watch variable
 * debugController.addWatch('array[0]', true);
 *
 * // Step through execution
 * debugController.stepOver();
 * ```
 */
export class DebugController {
  private config: Required<DebugConfig>;
  private state: DebugState = 'idle';
  private breakpoints: Map<string, Breakpoint> = new Map();
  private watches: Map<string, WatchExpression> = new Map();
  private snapshots: MemorySnapshot[] = [];
  private callStack: CallFrame[] = [];
  private currentContext: DebugContext | null = null;
  private previousContext: DebugContext | null = null;
  private eventListeners: Map<DebugEvent, Set<EventListener>> = new Map();
  private breakpointIdCounter = 0;
  private watchIdCounter = 0;
  private snapshotIdCounter = 0;
  private stepsSinceSnapshot = 0;

  /**
   * Creates a new DebugController
   *
   * @param config - Debug configuration
   */
  constructor(config: DebugConfig = {}) {
    this.config = {
      maxSnapshots: config.maxSnapshots ?? 1000,
      autoSnapshot: config.autoSnapshot ?? true,
      snapshotInterval: config.snapshotInterval ?? 10,
      trackCallStack: config.trackCallStack ?? true,
      trackMemory: config.trackMemory ?? true,
    };
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /**
   * Gets the current debug state
   *
   * @returns Current state
   */
  public getState(): DebugState {
    return this.state;
  }

  /**
   * Updates the current execution context
   *
   * @param step - Current execution step
   * @param stepIndex - Current step index
   * @param variables - Current variables
   */
  public updateContext(step: ExecutionStep, stepIndex: number, variables: Record<string, any>): void {
    this.previousContext = this.currentContext;
    this.currentContext = {
      step,
      stepIndex,
      variables,
      callStack: [...this.callStack],
      previous: this.previousContext ?? undefined,
    };

    // Check watches
    this.checkWatches();

    // Auto snapshot
    if (this.config.autoSnapshot) {
      this.stepsSinceSnapshot++;
      if (this.stepsSinceSnapshot >= this.config.snapshotInterval) {
        this.createSnapshot();
        this.stepsSinceSnapshot = 0;
      }
    }

    this.emit('stateChange', { context: this.currentContext });
  }

  /**
   * Gets the current debug context
   *
   * @returns Current context or null
   */
  public getCurrentContext(): DebugContext | null {
    return this.currentContext;
  }

  // ============================================================================
  // BREAKPOINT MANAGEMENT
  // ============================================================================

  /**
   * Adds a line breakpoint
   *
   * @param line - Line number
   * @param condition - Optional condition
   * @returns Breakpoint ID
   */
  public addLineBreakpoint(line: number, condition?: string): string {
    const id = `bp-${this.breakpointIdCounter++}`;
    const breakpoint: LineBreakpoint = {
      type: 'line',
      line,
      enabled: true,
      condition,
      id,
    };

    this.breakpoints.set(id, breakpoint);
    this.emit('breakpointAdded', { breakpoint });
    return id;
  }

  /**
   * Adds a conditional breakpoint
   *
   * @param condition - Condition expression
   * @returns Breakpoint ID
   * @throws {Error} If condition is invalid
   */
  public addConditionalBreakpoint(condition: string): string {
    const id = `bp-${this.breakpointIdCounter++}`;
    const evaluator = this.createConditionEvaluator(condition);

    const breakpoint: ConditionalBreakpoint = {
      type: 'conditional',
      condition,
      evaluator,
      enabled: true,
      id,
    };

    this.breakpoints.set(id, breakpoint);
    this.emit('breakpointAdded', { breakpoint });
    return id;
  }

  /**
   * Adds a hit count breakpoint
   *
   * @param line - Line number
   * @param count - Target hit count
   * @param operator - Comparison operator (== for exact, >= for at least, % for modulo)
   * @returns Breakpoint ID
   */
  public addHitCountBreakpoint(
    line: number,
    count: number,
    operator: '==' | '>=' | '%' = '=='
  ): string {
    const id = `bp-${this.breakpointIdCounter++}`;
    const breakpoint: HitCountBreakpoint = {
      type: 'hitCount',
      line,
      targetCount: count,
      currentCount: 0,
      operator,
      enabled: true,
      id,
    };

    this.breakpoints.set(id, breakpoint);
    this.emit('breakpointAdded', { breakpoint });
    return id;
  }

  /**
   * Adds a logpoint (logs without pausing)
   *
   * @param line - Line number
   * @param message - Log message expression
   * @returns Logpoint ID
   */
  public addLogpoint(line: number, message: string): string {
    const id = `bp-${this.breakpointIdCounter++}`;
    const evaluator = this.createLogEvaluator(message);

    const logpoint: Logpoint = {
      type: 'logpoint',
      line,
      message,
      evaluator,
      enabled: true,
      id,
    };

    this.breakpoints.set(id, logpoint);
    this.emit('breakpointAdded', { breakpoint: logpoint });
    return id;
  }

  /**
   * Removes a breakpoint by ID
   *
   * @param id - Breakpoint ID
   * @returns True if removed, false if not found
   */
  public removeBreakpoint(id: string): boolean {
    const breakpoint = this.breakpoints.get(id);
    if (!breakpoint) return false;

    this.breakpoints.delete(id);
    this.emit('breakpointRemoved', { breakpoint });
    return true;
  }

  /**
   * Removes breakpoints by line number
   *
   * @param line - Line number
   * @returns Number of breakpoints removed
   */
  public removeBreakpointsByLine(line: number): number {
    let removed = 0;
    for (const [id, bp] of Array.from(this.breakpoints)) {
      if ('line' in bp && bp.line === line) {
        this.removeBreakpoint(id);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Clears all breakpoints
   */
  public clearBreakpoints(): void {
    this.breakpoints.clear();
  }

  /**
   * Enables or disables a breakpoint
   *
   * @param id - Breakpoint ID
   * @param enabled - Whether to enable
   * @returns True if updated, false if not found
   */
  public setBreakpointEnabled(id: string, enabled: boolean): boolean {
    const breakpoint = this.breakpoints.get(id);
    if (!breakpoint) return false;

    breakpoint.enabled = enabled;
    return true;
  }

  /**
   * Gets all breakpoints
   *
   * @returns Array of breakpoints
   */
  public getBreakpoints(): Breakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  /**
   * Gets breakpoints by type
   *
   * @param type - Breakpoint type
   * @returns Array of breakpoints
   */
  public getBreakpointsByType<T extends BreakpointType>(type: T): Breakpoint[] {
    return this.getBreakpoints().filter((bp) => bp.type === type);
  }

  /**
   * Checks if execution should pause at current context
   *
   * @param line - Current line number
   * @returns Breakpoint that was hit, or null
   */
  public shouldPause(line: number): Breakpoint | null {
    if (!this.currentContext) return null;

    for (const breakpoint of Array.from(this.breakpoints.values())) {
      if (!breakpoint.enabled) continue;

      try {
        switch (breakpoint.type) {
          case 'line':
            if (breakpoint.line === line) {
              if (breakpoint.condition) {
                const evaluator = this.createConditionEvaluator(breakpoint.condition);
                if (evaluator(this.currentContext)) {
                  return breakpoint;
                }
              } else {
                return breakpoint;
              }
            }
            break;

          case 'conditional':
            if (breakpoint.evaluator(this.currentContext)) {
              return breakpoint;
            }
            break;

          case 'hitCount':
            if (breakpoint.line === line) {
              breakpoint.currentCount++;
              if (this.checkHitCount(breakpoint)) {
                return breakpoint;
              }
            }
            break;

          case 'logpoint':
            if (breakpoint.line === line) {
              const message = breakpoint.evaluator(this.currentContext);
              this.emit('logpoint', { message, line, context: this.currentContext });
            }
            break;
        }
      } catch (error) {
        this.emit('error', { error, breakpoint });
      }
    }

    return null;
  }

  /**
   * Checks if hit count condition is met
   *
   * @param breakpoint - Hit count breakpoint
   * @returns True if should pause
   */
  private checkHitCount(breakpoint: HitCountBreakpoint): boolean {
    switch (breakpoint.operator) {
      case '==':
        return breakpoint.currentCount === breakpoint.targetCount;
      case '>=':
        return breakpoint.currentCount >= breakpoint.targetCount;
      case '%':
        return breakpoint.currentCount % breakpoint.targetCount === 0;
      default:
        return false;
    }
  }

  // ============================================================================
  // WATCH EXPRESSIONS
  // ============================================================================

  /**
   * Adds a watch expression
   *
   * @param expression - Expression to watch
   * @param triggerOnChange - Whether to trigger event on value change
   * @returns Watch ID
   */
  public addWatch(expression: string, triggerOnChange = true): string {
    const id = `watch-${this.watchIdCounter++}`;
    const evaluator = this.createExpressionEvaluator(expression);

    const watch: WatchExpression = {
      id,
      expression,
      evaluator,
      triggerOnChange,
    };

    this.watches.set(id, watch);
    return id;
  }

  /**
   * Removes a watch expression
   *
   * @param id - Watch ID
   * @returns True if removed
   */
  public removeWatch(id: string): boolean {
    return this.watches.delete(id);
  }

  /**
   * Gets all watch expressions
   *
   * @returns Array of watches
   */
  public getWatches(): WatchExpression[] {
    return Array.from(this.watches.values());
  }

  /**
   * Evaluates a watch expression
   *
   * @param id - Watch ID
   * @returns Evaluated value or undefined
   */
  public evaluateWatch(id: string): any {
    const watch = this.watches.get(id);
    if (!watch || !this.currentContext) return undefined;

    try {
      return watch.evaluator(this.currentContext);
    } catch (error) {
      this.emit('error', { error, watch });
      return undefined;
    }
  }

  /**
   * Checks all watches for changes
   */
  private checkWatches(): void {
    if (!this.currentContext) return;

    for (const watch of Array.from(this.watches.values())) {
      try {
        const value = watch.evaluator(this.currentContext);

        if (watch.triggerOnChange && watch.lastValue !== undefined && watch.lastValue !== value) {
          this.emit('watchTriggered', {
            watch,
            oldValue: watch.lastValue,
            newValue: value,
            context: this.currentContext,
          });
        }

        watch.lastValue = value;
      } catch (error) {
        this.emit('error', { error, watch });
      }
    }
  }

  /**
   * Evaluates an arbitrary expression in current context
   *
   * @param expression - Expression to evaluate
   * @returns Evaluated value
   * @throws {Error} If no current context or evaluation fails
   */
  public evaluateExpression(expression: string): any {
    if (!this.currentContext) {
      throw new Error('No current execution context');
    }

    const evaluator = this.createExpressionEvaluator(expression);
    return evaluator(this.currentContext);
  }

  // ============================================================================
  // CALL STACK TRACKING
  // ============================================================================

  /**
   * Pushes a new call frame onto the stack
   *
   * @param name - Function name
   * @param line - Line number
   * @param scope - Scope variables
   * @returns Frame ID
   */
  public pushCallFrame(name: string, line: number, scope: Record<string, any> = {}): string {
    const id = `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const parent = this.callStack.length > 0 ? this.callStack[this.callStack.length - 1] : undefined;

    const frame: CallFrame = {
      id,
      name,
      line,
      scope,
      parent,
    };

    this.callStack.push(frame);
    this.emit('callStackChange', { callStack: [...this.callStack] });
    return id;
  }

  /**
   * Pops the top call frame from the stack
   *
   * @returns Popped frame or null
   */
  public popCallFrame(): CallFrame | null {
    const frame = this.callStack.pop() ?? null;
    this.emit('callStackChange', { callStack: [...this.callStack] });
    return frame;
  }

  /**
   * Gets the current call stack
   *
   * @returns Array of call frames
   */
  public getCallStack(): CallFrame[] {
    return [...this.callStack];
  }

  /**
   * Gets the current call frame (top of stack)
   *
   * @returns Current frame or null
   */
  public getCurrentFrame(): CallFrame | null {
    return this.callStack.length > 0 ? this.callStack[this.callStack.length - 1] : null;
  }

  /**
   * Clears the call stack
   */
  public clearCallStack(): void {
    this.callStack = [];
    this.emit('callStackChange', { callStack: [] });
  }

  // ============================================================================
  // MEMORY SNAPSHOTS
  // ============================================================================

  /**
   * Creates a memory snapshot of current state
   *
   * @returns Snapshot ID
   */
  public createSnapshot(): string {
    if (!this.currentContext) {
      throw new Error('No current execution context');
    }

    const id = `snapshot-${this.snapshotIdCounter++}`;
    const snapshot: MemorySnapshot = {
      id,
      stepIndex: this.currentContext.stepIndex,
      timestamp: Date.now(),
      variables: { ...this.currentContext.variables },
      callStack: this.callStack.map((frame) => ({ ...frame })),
    };

    this.snapshots.push(snapshot);

    // Limit snapshot count
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift();
    }

    return id;
  }

  /**
   * Gets a snapshot by ID
   *
   * @param id - Snapshot ID
   * @returns Snapshot or null
   */
  public getSnapshot(id: string): MemorySnapshot | null {
    return this.snapshots.find((s) => s.id === id) ?? null;
  }

  /**
   * Gets all snapshots
   *
   * @returns Array of snapshots
   */
  public getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
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
   * Clears all snapshots
   */
  public clearSnapshots(): void {
    this.snapshots = [];
  }

  // ============================================================================
  // EXPRESSION EVALUATION
  // ============================================================================

  /**
   * Creates a condition evaluator from expression string
   *
   * @param condition - Condition expression
   * @returns Evaluator function
   */
  private createConditionEvaluator(condition: string): ConditionEvaluator {
    return (context: DebugContext): boolean => {
      try {
        // Create a safe evaluation context
        const vars = context.variables;
        const step = context.step;
        const stepIndex = context.stepIndex;

        // Use Function constructor for safe evaluation
        // eslint-disable-next-line no-new-func
        const fn = new Function('vars', 'step', 'stepIndex', `
          with (vars) {
            return Boolean(${condition});
          }
        `);

        return fn(vars, step, stepIndex);
      } catch (error) {
        console.error('Error evaluating condition:', condition, error);
        return false;
      }
    };
  }

  /**
   * Creates a log message evaluator
   *
   * @param message - Message template
   * @returns Evaluator function
   */
  private createLogEvaluator(message: string): LogEvaluator {
    return (context: DebugContext): string => {
      try {
        const vars = context.variables;
        const step = context.step;
        const stepIndex = context.stepIndex;

        // Replace template expressions like {variable}
        return message.replace(/\{([^}]+)\}/g, (_, expr) => {
          try {
            // eslint-disable-next-line no-new-func
            const fn = new Function('vars', 'step', 'stepIndex', `
              with (vars) {
                return ${expr};
              }
            `);
            return String(fn(vars, step, stepIndex));
          } catch {
            return `{${expr}}`;
          }
        });
      } catch (error) {
        console.error('Error evaluating log message:', message, error);
        return message;
      }
    };
  }

  /**
   * Creates an expression evaluator
   *
   * @param expression - Expression to evaluate
   * @returns Evaluator function
   */
  private createExpressionEvaluator(expression: string): (context: DebugContext) => any {
    return (context: DebugContext): any => {
      try {
        const vars = context.variables;
        const step = context.step;
        const stepIndex = context.stepIndex;

        // eslint-disable-next-line no-new-func
        const fn = new Function('vars', 'step', 'stepIndex', `
          with (vars) {
            return ${expression};
          }
        `);

        return fn(vars, step, stepIndex);
      } catch (error) {
        console.error('Error evaluating expression:', expression, error);
        throw error;
      }
    };
  }

  // ============================================================================
  // EXECUTION CONTROL
  // ============================================================================

  /**
   * Sets the debug state
   *
   * @param state - New state
   */
  public setState(state: DebugState): void {
    if (this.state !== state) {
      this.state = state;
      this.emit('stateChange', { state });
    }
  }

  /**
   * Pauses execution
   */
  public pause(): void {
    this.setState('paused');
  }

  /**
   * Resumes execution
   */
  public resume(): void {
    this.setState('running');
  }

  /**
   * Marks execution as completed
   */
  public complete(): void {
    this.setState('completed');
    this.emit('executionComplete');
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  /**
   * Subscribes to an event
   *
   * @param event - Event type
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  public on<T = any>(event: DebugEvent, listener: EventListener<T>): () => void {
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
  private emit<T = any>(event: DebugEvent, data?: T): void {
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
    this.breakpoints.clear();
    this.watches.clear();
    this.snapshots = [];
    this.callStack = [];
    this.eventListeners.clear();
    this.currentContext = null;
    this.previousContext = null;
    this.state = 'idle';
  }

  /**
   * Resets the controller to initial state
   */
  public reset(): void {
    this.snapshots = [];
    this.callStack = [];
    this.currentContext = null;
    this.previousContext = null;
    this.stepsSinceSnapshot = 0;
    this.state = 'idle';

    // Reset hit counts
    for (const bp of Array.from(this.breakpoints.values())) {
      if (bp.type === 'hitCount') {
        bp.currentCount = 0;
      }
    }
  }
}
