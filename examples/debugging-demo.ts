/**
 * Debugging and Time-Travel Demo
 *
 * Demonstrates advanced debugging features for algorithm visualization:
 * - Breakpoints on specific steps
 * - Time-travel through execution history
 * - State inspection at each step
 * - Variable watching and logging
 * - Step-by-step debugging controls
 */

import { AlgorithmExecutor } from '../src/visualization/core/AlgorithmExecutor';
import { GraphVisualizer } from '../src/visualization/algorithms/GraphVisualizer';
import type { ExecutionStep } from '../src/visualization/core/types';

export class DebuggingDemo {
  private executor: AlgorithmExecutor;
  private visualizer: GraphVisualizer;
  private breakpoints: Set<number> = new Set();
  private stepHistory: ExecutionStep[] = [];
  private currentHistoryIndex: number = -1;

  constructor(private container: HTMLElement) {
    this.executor = new AlgorithmExecutor({
      maxSteps: 10000,
      autoSnapshot: true,
      trackVariables: true,
    });

    this.visualizer = new GraphVisualizer({
      id: 'debug-demo',
      renderMode: '2d',
      width: 800,
      height: 600,
      algorithm: 'dijkstra',
      nodes: [
        { id: 'A', label: 'A' },
        { id: 'B', label: 'B' },
        { id: 'C', label: 'C' },
        { id: 'D', label: 'D' },
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', weight: 4 },
        { id: 'e2', source: 'A', target: 'C', weight: 2 },
        { id: 'e3', source: 'B', target: 'D', weight: 5 },
        { id: 'e4', source: 'C', target: 'D', weight: 1 },
      ],
      startNode: 'A',
      endNode: 'D',
    });
  }

  async initialize(): Promise<void> {
    await this.visualizer.initialize(this.container);
    this.executor.setVisualization(this.visualizer);

    // Set up debugging hooks
    this.setupDebugHooks();

    console.log('✓ Debugging demo initialized');
    console.log('  Available commands:');
    console.log('    setBreakpoint(step) - Break at step number');
    console.log('    stepForward() - Execute next step');
    console.log('    stepBackward() - Go back one step');
    console.log('    continue() - Run until next breakpoint');
  }

  private setupDebugHooks(): void {
    this.executor.onBeforeStep((step) => {
      this.stepHistory.push(step);
      this.currentHistoryIndex = this.stepHistory.length - 1;

      // Check if we hit a breakpoint
      if (this.breakpoints.has(step.index)) {
        console.log(`🔴 Breakpoint hit at step ${step.index}`);
        console.log(`   Description: ${step.description}`);
        this.inspectState(step);
        return Promise.reject(new Error('BREAKPOINT'));
      }
    });

    this.executor.onAfterStep((step) => {
      console.log(`✓ Step ${step.index}: ${step.description}`);
    });
  }

  setBreakpoint(stepIndex: number): void {
    this.breakpoints.add(stepIndex);
    console.log(`✓ Breakpoint set at step ${stepIndex}`);
  }

  clearBreakpoint(stepIndex: number): void {
    this.breakpoints.delete(stepIndex);
    console.log(`✓ Breakpoint cleared at step ${stepIndex}`);
  }

  async stepForward(): Promise<void> {
    try {
      await this.executor.executeNextStep();
    } catch (error) {
      if (error instanceof Error && error.message === 'BREAKPOINT') {
        // Expected breakpoint
        return;
      }
      throw error;
    }
  }

  async stepBackward(): Promise<void> {
    if (this.currentHistoryIndex > 0) {
      this.currentHistoryIndex--;
      const step = this.stepHistory[this.currentHistoryIndex];
      await this.executor.executeStep(step.index);
      console.log(`⏪ Stepped back to step ${step.index}`);
    } else {
      console.log('Already at first step');
    }
  }

  async continue(): Promise<void> {
    console.log('▶ Continuing execution...');

    while (this.executor.getCurrentStepIndex() < this.executor.getTotalSteps()) {
      try {
        await this.executor.executeNextStep();
      } catch (error) {
        if (error instanceof Error && error.message === 'BREAKPOINT') {
          return; // Stop at breakpoint
        }
        throw error;
      }
    }

    console.log('✓ Execution complete');
  }

  private inspectState(step: ExecutionStep): void {
    console.log('\n📊 State Inspection:');
    console.log('  Step Index:', step.index);
    console.log('  Status:', step.status);
    console.log('  Affected Nodes:', step.affectedNodes);
    console.log('  Affected Edges:', step.affectedEdges);
    
    if (step.data) {
      console.log('  Data:', JSON.stringify(step.data, null, 2));
    }

    const execState = this.executor.getExecutionState();
    console.log('  Total Steps:', execState.totalSteps);
    console.log('  History Length:', execState.stepHistory.length);
    console.log('');
  }

  async runWithDebugger(): Promise<void> {
    console.log('\n=== Running with Debugger ===\n');

    // Set breakpoints
    this.setBreakpoint(5);
    this.setBreakpoint(10);

    // Start execution
    await this.continue();

    console.log('\n✓ Debugging session complete');
  }
}

export async function runDemo(containerId: string = 'app'): Promise<void> {
  const container = document.getElementById(containerId)!;
  const demo = new DebuggingDemo(container);
  
  await demo.initialize();
  await demo.runWithDebugger();
}
