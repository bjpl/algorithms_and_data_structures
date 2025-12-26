/**
 * @file Step-by-step algorithm execution with state tracking
 * @module visualization/core
 */

/**
 * Algorithm function type (generator for step-by-step execution)
 */
export type AlgorithmFunction = (...args: any[]) => Generator<ExecutionStep> | AsyncGenerator<ExecutionStep>;

/**
 * Execution step
 */
export interface ExecutionStep {
  /** Action identifier */
  action: string;
  /** Step description */
  description?: string;
  /** State snapshot */
  state?: any;
  /** Variable values */
  variables?: Record<string, any>;
  /** Additional data */
  data?: any;
  /** Lazy evaluation function */
  lazy?: () => any;
}

/**
 * Execution state
 */
export type ExecutionState = 'idle' | 'running' | 'paused' | 'completed' | 'error';

/**
 * Execution configuration
 */
export interface ExecutionConfig {
  /** Maximum steps allowed */
  maxSteps?: number;
  /** Automatically create snapshots */
  autoSnapshot?: boolean;
  /** Track variable changes */
  trackVariables?: boolean;
  /** Deep clone state */
  deepClone?: boolean;
  /** Maximum snapshots to keep */
  maxSnapshots?: number;
}

/**
 * State snapshot
 */
export interface StateSnapshot {
  /** Step index */
  step: number;
  /** Timestamp */
  timestamp: number;
  /** State data */
  state: any;
  /** Variable values */
  variables?: Record<string, any>;
}

/**
 * Execution history entry
 */
export interface HistoryEntry extends ExecutionStep {
  /** Step index */
  index: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Execution trace for export
 */
export interface ExecutionTrace {
  /** All steps */
  steps: HistoryEntry[];
  /** Total duration */
  duration: number;
  /** Start timestamp */
  timestamp: number;
  /** Final state */
  finalState?: any;
}

/**
 * Execution event types
 */
export type ExecutionEvent =
  | 'executionStart'
  | 'executionComplete'
  | 'executionError'
  | 'stepExecuted'
  | 'stateChange'
  | 'variableChange'
  | 'breakpointHit';

/**
 * Event listener type
 */
type EventListener<T = any> = (data?: T) => void;

/**
 * Conditional breakpoint predicate
 */
type BreakpointCondition = (step: ExecutionStep) => boolean;

/**
 * Algorithm executor with step-by-step execution and time travel debugging
 */
export class AlgorithmExecutor {
  private config: ExecutionConfig;
  private state: ExecutionState = 'idle';
  private steps: ExecutionStep[] = [];
  private currentStep = -1;
  private history: HistoryEntry[] = [];
  private snapshots: StateSnapshot[] = [];
  private variableHistory: Map<string, any[]> = new Map();
  private previousVariables: Record<string, any> = {};
  private startTime = 0;
  private endTime = 0;
  private breakpoints: Set<number> = new Set();
  private conditionalBreakpoints: BreakpointCondition[] = [];
  private timeTravelEnabled = false;
  private eventListeners: Map<ExecutionEvent, Set<EventListener>> = new Map();

  constructor(config: ExecutionConfig = {}) {
    this.config = {
      maxSteps: 100000,
      autoSnapshot: true,
      trackVariables: true,
      deepClone: false,
      maxSnapshots: 1000,
      ...config,
    };
  }

  public getState(): ExecutionState {
    return this.state;
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public getTotalSteps(): number {
    return this.steps.length;
  }

  public getSteps(): ExecutionStep[] {
    return [...this.steps];
  }

  public async execute(algorithm: AlgorithmFunction, ...args: any[]): Promise<void> {
    await this.load(algorithm, ...args);
    await this.run();
  }

  public async load(algorithm: AlgorithmFunction, ...args: any[]): Promise<void> {
    this.validateAlgorithm(algorithm);
    this.reset();
    this.state = 'running';
    this.startTime = Date.now();
    this.emit('executionStart');

    try {
      const generator = algorithm(...args);
      let result = await generator.next();
      let stepIndex = 0;

      while (!result.done && stepIndex < this.config.maxSteps!) {
        const step: ExecutionStep = result.value;
        this.steps.push(step);

        if (this.config.trackVariables && step.variables) {
          this.trackVariables(step.variables);
        }

        if (this.config.autoSnapshot && step.state) {
          this.createStateSnapshot(stepIndex, step.state, step.variables);
        }

        this.history.push({
          ...step,
          index: stepIndex,
          timestamp: Date.now(),
        });

        stepIndex++;
        result = await generator.next();
      }

      this.endTime = Date.now();
      this.state = 'completed';
      this.emit('executionComplete');
    } catch (error) {
      this.state = 'error';
      this.emit('executionError', { error });
      throw error;
    }
  }

  public async run(): Promise<void> {
    while (this.currentStep < this.steps.length - 1) {
      await this.stepForward();

      if (this.shouldPauseAtBreakpoint()) {
        this.state = 'paused';
        this.emit('breakpointHit', {
          step: this.currentStep,
          data: this.steps[this.currentStep],
        });
        break;
      }
    }
  }

  public async continue(): Promise<void> {
    if (this.state !== 'paused') return;
    this.state = 'running';
    await this.run();
  }

  public async stepForward(): Promise<void> {
    if (this.currentStep >= this.steps.length - 1) return;

    this.currentStep++;
    const step = this.steps[this.currentStep];

    if (step.lazy) {
      step.lazy();
    }

    this.emit('stepExecuted', { step: this.currentStep, data: step });
    this.emit('stateChange', { step: this.currentStep });

    if (step.variables) {
      const changed = this.getChangedVariablesFrom(step.variables);
      if (changed.length > 0) {
        this.emit('variableChange', { variables: changed });
      }
      this.previousVariables = { ...step.variables };
    }
  }

  public async stepBackward(): Promise<void> {
    if (this.currentStep <= -1) return;
    this.currentStep--;
    this.emit('stateChange', { step: this.currentStep });
  }

  public async goToStep(step: number): Promise<void> {
    if (step < -1 || step >= this.steps.length) {
      throw new Error(`Step ${step} is out of bounds`);
    }

    this.currentStep = step;
    this.emit('stateChange', { step: this.currentStep });
  }

  public reset(): void {
    this.state = 'idle';
    this.currentStep = -1;
    this.steps = [];
    this.history = [];
    this.snapshots = [];
    this.variableHistory.clear();
    this.previousVariables = {};
    this.startTime = 0;
    this.endTime = 0;
  }

  public getSnapshot(step: number): StateSnapshot {
    return this.snapshots.find((s) => s.step === step)!;
  }

  private createStateSnapshot(step: number, state: any, variables?: Record<string, any>): void {
    const snapshot: StateSnapshot = {
      step,
      timestamp: Date.now(),
      state: this.config.deepClone ? this.deepClone(state) : state,
      variables,
    };

    this.snapshots.push(snapshot);

    if (this.snapshots.length > this.config.maxSnapshots!) {
      this.snapshots.shift();
    }
  }

  public restoreSnapshot(snapshot: StateSnapshot): void {
    this.currentStep = snapshot.step;
    this.emit('stateChange', { step: this.currentStep });
  }

  public getAllSnapshots(): StateSnapshot[] {
    return [...this.snapshots];
  }

  public getSnapshotCount(): number {
    return this.snapshots.length;
  }

  private trackVariables(variables: Record<string, any>): void {
    Object.entries(variables).forEach(([name, value]) => {
      if (!this.variableHistory.has(name)) {
        this.variableHistory.set(name, []);
      }
      this.variableHistory.get(name)!.push(value);
    });
  }

  public getVariableHistory(name: string): any[] {
    return this.variableHistory.get(name) ?? [];
  }

  public getCurrentVariables(): Record<string, any> {
    if (this.currentStep < 0 || this.currentStep >= this.steps.length) {
      return {};
    }
    return this.steps[this.currentStep].variables ?? {};
  }

  public getChangedVariables(): string[] {
    const current = this.getCurrentVariables();
    return this.getChangedVariablesFrom(current);
  }

  private getChangedVariablesFrom(current: Record<string, any>): string[] {
    const changed: string[] = [];
    Object.keys(current).forEach((key) => {
      if (current[key] !== this.previousVariables[key]) {
        changed.push(key);
      }
    });
    return changed;
  }

  public getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  public getExecutionDuration(): number {
    return this.endTime - this.startTime;
  }

  public exportTrace(): ExecutionTrace {
    return {
      steps: this.history,
      duration: this.getExecutionDuration(),
      timestamp: this.startTime,
      finalState: this.steps[this.steps.length - 1]?.state,
    };
  }

  public addBreakpoint(step: number): void {
    this.breakpoints.add(step);
  }

  public removeBreakpoint(step: number): void {
    this.breakpoints.delete(step);
  }

  public getBreakpoints(): number[] {
    return Array.from(this.breakpoints).sort((a, b) => a - b);
  }

  public addConditionalBreakpoint(condition: BreakpointCondition): void {
    this.conditionalBreakpoints.push(condition);
  }

  private shouldPauseAtBreakpoint(): boolean {
    if (this.breakpoints.has(this.currentStep)) {
      return true;
    }

    const currentStep = this.steps[this.currentStep];
    for (const condition of this.conditionalBreakpoints) {
      try {
        if (condition(currentStep)) {
          return true;
        }
      } catch (error) {
        console.error('Error in conditional breakpoint:', error);
      }
    }

    return false;
  }

  public enableTimeTravel(): void {
    this.timeTravelEnabled = true;
  }

  public isTimeTravelEnabled(): boolean {
    return this.timeTravelEnabled;
  }

  public getTimeTravel(): StateSnapshot[] {
    return this.getAllSnapshots();
  }

  public travelToStep(step: number): void {
    const snapshot = this.snapshots.find((s) => s.step === step);
    if (snapshot) {
      this.restoreSnapshot(snapshot);
    }
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private validateAlgorithm(algorithm: any): void {
    if (typeof algorithm !== 'function') {
      throw new Error('Algorithm must be a generator function');
    }
  }

  public on<T = any>(event: ExecutionEvent, listener: EventListener<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(listener);

    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  private emit<T = any>(event: ExecutionEvent, data?: T): void {
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

  public dispose(): void {
    this.reset();
    this.eventListeners.clear();
    this.breakpoints.clear();
    this.conditionalBreakpoints = [];
  }
}
