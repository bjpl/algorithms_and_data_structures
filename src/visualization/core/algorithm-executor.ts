/**
 * Algorithm Executor Implementation
 *
 * Manages step-based algorithm execution with visualization integration.
 * Supports forward/backward stepping, auto-play, and lifecycle hooks.
 */

import type { IAlgorithmExecutor, IVisualization } from './interfaces';
import type { ExecutionStep, UnsubscribeFunction } from './types';

/**
 * Algorithm executor implementation
 */
export class AlgorithmExecutor implements IAlgorithmExecutor {
  private steps: ExecutionStep[] = [];
  private currentStepIndex = -1;
  private isExecutingFlag = false;
  private autoExecutionTimeoutId: NodeJS.Timeout | null = null;
  private visualization: IVisualization | null = null;

  // Lifecycle hooks
  private beforeStepCallbacks: Set<
    (step: ExecutionStep) => void | Promise<void>
  > = new Set();
  private afterStepCallbacks: Set<
    (step: ExecutionStep) => void | Promise<void>
  > = new Set();
  private errorCallbacks: Set<(step: ExecutionStep, error: Error) => void> =
    new Set();

  // ========================================================================
  // STEP MANAGEMENT
  // ========================================================================

  addStep(step: ExecutionStep): void {
    this.steps.push({
      ...step,
      status: 'pending',
      timestamp: step.timestamp ?? Date.now(),
    });
  }

  getSteps(): ExecutionStep[] {
    return [...this.steps];
  }

  getStep(index: number): ExecutionStep | null {
    return this.steps[index] ?? null;
  }

  getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  getTotalSteps(): number {
    return this.steps.length;
  }

  clearSteps(): void {
    this.stopExecution();
    this.steps = [];
    this.currentStepIndex = -1;
  }

  // ========================================================================
  // EXECUTION CONTROL
  // ========================================================================

  async executeNextStep(): Promise<void> {
    if (this.currentStepIndex >= this.steps.length - 1) {
      throw new Error('No more steps to execute');
    }

    this.currentStepIndex++;
    await this.executeCurrentStep();
  }

  async executePreviousStep(): Promise<void> {
    if (this.currentStepIndex < 0) {
      throw new Error('No previous step to execute');
    }

    this.currentStepIndex--;

    if (this.currentStepIndex >= 0) {
      await this.executeCurrentStep();
    } else {
      // Reset to initial state
      if (this.visualization) {
        this.visualization.reset();
      }
    }
  }

  async executeStep(index: number): Promise<void> {
    if (index < 0 || index >= this.steps.length) {
      throw new Error(`Invalid step index: ${index}`);
    }

    this.currentStepIndex = index;
    await this.executeCurrentStep();
  }

  async executeAll(delayMs = 500): Promise<void> {
    if (this.isExecutingFlag) {
      throw new Error('Already executing');
    }

    this.isExecutingFlag = true;

    try {
      for (let i = 0; i <= this.currentStepIndex; i++) {
        this.steps[i].status = 'completed';
      }

      while (this.currentStepIndex < this.steps.length - 1) {
        await this.executeNextStep();

        // Wait for specified delay between steps
        await new Promise((resolve) => {
          this.autoExecutionTimeoutId = setTimeout(resolve, delayMs);
        });

        // Check if execution was stopped
        if (!this.isExecutingFlag) {
          break;
        }
      }
    } finally {
      this.isExecutingFlag = false;
      this.autoExecutionTimeoutId = null;
    }
  }

  stopExecution(): void {
    this.isExecutingFlag = false;

    if (this.autoExecutionTimeoutId !== null) {
      clearTimeout(this.autoExecutionTimeoutId);
      this.autoExecutionTimeoutId = null;
    }
  }

  isExecuting(): boolean {
    return this.isExecutingFlag;
  }

  // ========================================================================
  // STEP LIFECYCLE HOOKS
  // ========================================================================

  onBeforeStep(
    callback: (step: ExecutionStep) => void | Promise<void>
  ): UnsubscribeFunction {
    this.beforeStepCallbacks.add(callback);
    return () => this.beforeStepCallbacks.delete(callback);
  }

  onAfterStep(
    callback: (step: ExecutionStep) => void | Promise<void>
  ): UnsubscribeFunction {
    this.afterStepCallbacks.add(callback);
    return () => this.afterStepCallbacks.delete(callback);
  }

  onStepError(
    callback: (step: ExecutionStep, error: Error) => void
  ): UnsubscribeFunction {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  // ========================================================================
  // VISUALIZATION INTEGRATION
  // ========================================================================

  setVisualization(visualization: IVisualization): void {
    this.visualization = visualization;
  }

  getVisualization(): IVisualization | null {
    return this.visualization;
  }

  async applyStepToVisualization(step: ExecutionStep): Promise<void> {
    if (!this.visualization) {
      return;
    }

    // Update affected nodes
    for (const nodeId of step.affectedNodes) {
      try {
        this.visualization.updateNode(nodeId, {
          animationState: 'active',
        });
      } catch (error) {
        console.warn(`Failed to update node ${nodeId}:`, error);
      }
    }

    // Update affected edges if any
    if (step.affectedEdges) {
      for (const edgeId of step.affectedEdges) {
        try {
          this.visualization.updateEdge(edgeId, {
            style: {
              ...this.visualization.getEdges().find((e) => e.id === edgeId)
                ?.style,
              animated: true,
            },
          });
        } catch (error) {
          console.warn(`Failed to update edge ${edgeId}:`, error);
        }
      }
    }

    // Apply custom step data if available
    if (step.data?.customVisualUpdate) {
      // Allow steps to define custom visualization updates
      const updateFn = step.data.customVisualUpdate as (
        viz: IVisualization
      ) => void | Promise<void>;
      await Promise.resolve(updateFn(this.visualization));
    }
  }

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  getExecutionState(): {
    currentStep: number;
    totalSteps: number;
    isExecuting: boolean;
    stepHistory: ExecutionStep[];
  } {
    return {
      currentStep: this.currentStepIndex,
      totalSteps: this.steps.length,
      isExecuting: this.isExecutingFlag,
      stepHistory: this.steps
        .slice(0, this.currentStepIndex + 1)
        .filter((s) => s.status === 'completed'),
    };
  }

  reset(): void {
    this.stopExecution();
    this.currentStepIndex = -1;

    // Reset all steps to pending
    for (const step of this.steps) {
      step.status = 'pending';
    }

    if (this.visualization) {
      this.visualization.reset();
    }
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private async executeCurrentStep(): Promise<void> {
    if (this.currentStepIndex < 0 || this.currentStepIndex >= this.steps.length) {
      return;
    }

    const step = this.steps[this.currentStepIndex];

    // Mark step as active
    step.status = 'active';
    step.timestamp = Date.now();

    try {
      // Execute before-step hooks
      await this.runCallbacks(this.beforeStepCallbacks, step);

      // Apply step to visualization
      await this.applyStepToVisualization(step);

      // Mark step as completed
      step.status = 'completed';

      // Execute after-step hooks
      await this.runCallbacks(this.afterStepCallbacks, step);

      // Emit step event
      if (this.visualization) {
        this.visualization.emit({
          type: 'step:complete',
          step,
          timestamp: Date.now(),
          source: this.visualization.getConfig().id,
        });
      }
    } catch (error) {
      // Mark step as error
      step.status = 'error';

      // Execute error callbacks
      this.errorCallbacks.forEach((callback) => {
        try {
          callback(step, error as Error);
        } catch (callbackError) {
          console.error('Error in error callback:', callbackError);
        }
      });

      // Emit error event
      if (this.visualization) {
        this.visualization.emit({
          type: 'step:error',
          step,
          timestamp: Date.now(),
          source: this.visualization.getConfig().id,
        });
      }

      throw error;
    }
  }

  private async runCallbacks(
    callbacks: Set<(step: ExecutionStep) => void | Promise<void>>,
    step: ExecutionStep
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    callbacks.forEach((callback) => {
      try {
        const result = callback(step);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        console.error('Error in step callback:', error);
      }
    });

    await Promise.all(promises);
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Create steps from algorithm trace data
   */
  static fromTrace(trace: Array<{
    description: string;
    affectedNodes: string[];
    affectedEdges?: string[];
    data?: Record<string, any>;
  }>): AlgorithmExecutor {
    const executor = new AlgorithmExecutor();

    trace.forEach((item, index) => {
      executor.addStep({
        index,
        description: item.description,
        affectedNodes: item.affectedNodes,
        affectedEdges: item.affectedEdges,
        status: 'pending',
        data: item.data,
      });
    });

    return executor;
  }

  /**
   * Export execution history as JSON
   */
  toJSON(): {
    steps: ExecutionStep[];
    currentStepIndex: number;
    totalSteps: number;
  } {
    return {
      steps: this.steps,
      currentStepIndex: this.currentStepIndex,
      totalSteps: this.steps.length,
    };
  }

  /**
   * Import execution from JSON
   */
  static fromJSON(data: {
    steps: ExecutionStep[];
    currentStepIndex?: number;
  }): AlgorithmExecutor {
    const executor = new AlgorithmExecutor();
    executor.steps = data.steps;
    executor.currentStepIndex = data.currentStepIndex ?? -1;
    return executor;
  }
}
