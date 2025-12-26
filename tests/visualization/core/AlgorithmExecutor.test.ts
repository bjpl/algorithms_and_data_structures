/**
 * @file Unit tests for AlgorithmExecutor
 * @author Algorithm Visualization System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AlgorithmExecutor,
  ExecutionStep,
  ExecutionState,
  ExecutionConfig,
  AlgorithmFunction,
} from '../../../src/visualization/core/AlgorithmExecutor';

describe('AlgorithmExecutor', () => {
  let executor: AlgorithmExecutor;

  beforeEach(() => {
    executor = new AlgorithmExecutor();
  });

  afterEach(() => {
    executor.dispose();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(executor.getState()).toBe('idle');
      expect(executor.getCurrentStep()).toBe(-1);
      expect(executor.getTotalSteps()).toBe(0);
    });

    it('should accept custom configuration', () => {
      const customExecutor = new AlgorithmExecutor({
        maxSteps: 1000,
        autoSnapshot: true,
        trackVariables: true,
      });

      expect(customExecutor).toBeDefined();

      customExecutor.dispose();
    });
  });

  describe('algorithm execution', () => {
    it('should execute simple algorithm', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'start', description: 'Starting algorithm' };
        yield { action: 'step1', description: 'Step 1' };
        yield { action: 'step2', description: 'Step 2' };
        yield { action: 'end', description: 'Algorithm complete' };
      };

      await executor.execute(algorithm);

      expect(executor.getTotalSteps()).toBe(4);
      expect(executor.getState()).toBe('completed');
    });

    it('should track execution state', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'process', data: { value: 1 } };
        yield { action: 'process', data: { value: 2 } };
        yield { action: 'process', data: { value: 3 } };
      };

      await executor.execute(algorithm);

      expect(executor.getTotalSteps()).toBe(3);
    });

    it('should execute with input parameters', async () => {
      const algorithm: AlgorithmFunction = function* (input: any) {
        yield { action: 'received', data: input };
      };

      await executor.execute(algorithm, { arr: [1, 2, 3] });

      const steps = executor.getSteps();
      expect(steps[0].data).toEqual({ arr: [1, 2, 3] });
    });

    it('should handle async operations', async () => {
      const algorithm: AlgorithmFunction = async function* () {
        yield { action: 'start' };
        await new Promise((resolve) => setTimeout(resolve, 10));
        yield { action: 'delayed' };
      };

      await executor.execute(algorithm);

      expect(executor.getTotalSteps()).toBe(2);
    });

    it('should support nested algorithms', async () => {
      const subalgorithm: AlgorithmFunction = function* () {
        yield { action: 'sub1' };
        yield { action: 'sub2' };
      };

      const algorithm: AlgorithmFunction = function* (this: any) {
        yield { action: 'main1' };
        yield* subalgorithm.call(this);
        yield { action: 'main2' };
      };

      await executor.execute(algorithm);

      expect(executor.getTotalSteps()).toBe(4);
    });
  });

  describe('step-by-step execution', () => {
    it('should step forward', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1' };
        yield { action: 'step2' };
        yield { action: 'step3' };
      };

      await executor.load(algorithm);

      await executor.stepForward();
      expect(executor.getCurrentStep()).toBe(0);

      await executor.stepForward();
      expect(executor.getCurrentStep()).toBe(1);
    });

    it('should step backward', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1' };
        yield { action: 'step2' };
        yield { action: 'step3' };
      };

      await executor.load(algorithm);
      await executor.stepForward();
      await executor.stepForward();

      await executor.stepBackward();

      expect(executor.getCurrentStep()).toBe(0);
    });

    it('should not step beyond bounds', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1' };
      };

      await executor.load(algorithm);

      await executor.stepBackward();
      expect(executor.getCurrentStep()).toBe(-1);

      await executor.stepForward();
      await executor.stepForward();
      expect(executor.getCurrentStep()).toBe(0);
    });

    it('should jump to specific step', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1' };
        yield { action: 'step2' };
        yield { action: 'step3' };
        yield { action: 'step4' };
      };

      await executor.load(algorithm);

      await executor.goToStep(2);

      expect(executor.getCurrentStep()).toBe(2);
    });

    it('should reset to beginning', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1' };
        yield { action: 'step2' };
      };

      await executor.load(algorithm);
      await executor.stepForward();
      await executor.stepForward();

      executor.reset();

      expect(executor.getCurrentStep()).toBe(-1);
      expect(executor.getState()).toBe('idle');
    });
  });

  describe('state snapshots', () => {
    it('should create snapshot at each step', async () => {
      const algorithm: AlgorithmFunction = function* () {
        const arr = [3, 1, 2];
        yield { action: 'initial', state: { arr } };

        arr.sort();
        yield { action: 'sorted', state: { arr } };
      };

      await executor.execute(algorithm);

      const steps = executor.getSteps();
      expect(steps[0].state).toEqual({ arr: [3, 1, 2] });
      expect(steps[1].state).toEqual({ arr: [1, 2, 3] });
    });

    it('should support deep state cloning', async () => {
      const algorithm: AlgorithmFunction = function* () {
        const obj = { nested: { value: 1 } };
        yield { action: 'step1', state: obj };

        obj.nested.value = 2;
        yield { action: 'step2', state: obj };
      };

      executor = new AlgorithmExecutor({ deepClone: true });
      await executor.execute(algorithm);

      const steps = executor.getSteps();
      expect(steps[0].state).toEqual({ nested: { value: 1 } });
      expect(steps[1].state).toEqual({ nested: { value: 2 } });
    });

    it('should retrieve snapshot by step', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1', state: { value: 1 } };
        yield { action: 'step2', state: { value: 2 } };
      };

      await executor.execute(algorithm);

      const snapshot = executor.getSnapshot(0);

      expect(snapshot.state).toEqual({ value: 1 });
    });

    it('should restore from snapshot', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1', state: { value: 1 } };
        yield { action: 'step2', state: { value: 2 } };
        yield { action: 'step3', state: { value: 3 } };
      };

      await executor.load(algorithm);
      await executor.goToStep(2);

      const snapshot = executor.getSnapshot(0);
      executor.restoreSnapshot(snapshot);

      expect(executor.getCurrentStep()).toBe(0);
    });
  });

  describe('variable tracking', () => {
    it('should track variable changes', async () => {
      const algorithm: AlgorithmFunction = function* () {
        let x = 0;
        yield { action: 'init', variables: { x } };

        x = 5;
        yield { action: 'update', variables: { x } };

        x = 10;
        yield { action: 'final', variables: { x } };
      };

      await executor.execute(algorithm);

      const history = executor.getVariableHistory('x');

      expect(history).toEqual([0, 5, 10]);
    });

    it('should track multiple variables', async () => {
      const algorithm: AlgorithmFunction = function* () {
        let i = 0;
        let sum = 0;

        yield { action: 'step', variables: { i, sum } };

        i = 1;
        sum = 1;
        yield { action: 'step', variables: { i, sum } };

        i = 2;
        sum = 3;
        yield { action: 'step', variables: { i, sum } };
      };

      await executor.execute(algorithm);

      expect(executor.getVariableHistory('i')).toEqual([0, 1, 2]);
      expect(executor.getVariableHistory('sum')).toEqual([0, 1, 3]);
    });

    it('should get current variable values', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1', variables: { x: 1, y: 2 } };
        yield { action: 'step2', variables: { x: 3, y: 4 } };
      };

      await executor.load(algorithm);
      await executor.stepForward();

      const currentVars = executor.getCurrentVariables();

      expect(currentVars).toEqual({ x: 1, y: 2 });
    });

    it('should highlight changed variables', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1', variables: { x: 1, y: 2 } };
        yield { action: 'step2', variables: { x: 5, y: 2 } };
      };

      await executor.load(algorithm);
      await executor.stepForward();
      await executor.stepForward();

      const changed = executor.getChangedVariables();

      expect(changed).toContain('x');
      expect(changed).not.toContain('y');
    });
  });

  describe('execution history', () => {
    it('should maintain execution history', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1', description: 'First step' };
        yield { action: 'step2', description: 'Second step' };
      };

      await executor.execute(algorithm);

      const history = executor.getHistory();

      expect(history).toHaveLength(2);
      expect(history[0].description).toBe('First step');
    });

    it('should include timestamps', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1' };
        await new Promise((resolve) => setTimeout(resolve, 10));
        yield { action: 'step2' };
      };

      await executor.execute(algorithm);

      const history = executor.getHistory();

      expect(history[0].timestamp).toBeDefined();
      expect(history[1].timestamp).toBeGreaterThan(history[0].timestamp);
    });

    it('should track execution duration', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1' };
        await new Promise((resolve) => setTimeout(resolve, 50));
        yield { action: 'step2' };
      };

      await executor.execute(algorithm);

      const duration = executor.getExecutionDuration();

      expect(duration).toBeGreaterThanOrEqual(50);
    });

    it('should export execution trace', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1', data: { value: 1 } };
        yield { action: 'step2', data: { value: 2 } };
      };

      await executor.execute(algorithm);

      const trace = executor.exportTrace();

      expect(trace.steps).toHaveLength(2);
      expect(trace.duration).toBeDefined();
      expect(trace.timestamp).toBeDefined();
    });
  });

  describe('breakpoints', () => {
    it('should add breakpoint', () => {
      executor.addBreakpoint(2);

      expect(executor.getBreakpoints()).toContain(2);
    });

    it('should remove breakpoint', () => {
      executor.addBreakpoint(2);
      executor.removeBreakpoint(2);

      expect(executor.getBreakpoints()).not.toContain(2);
    });

    it('should pause at breakpoint during execution', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1' };
        yield { action: 'step2' };
        yield { action: 'step3' };
        yield { action: 'step4' };
      };

      await executor.load(algorithm);
      executor.addBreakpoint(1);

      const pauseListener = vi.fn();
      executor.on('breakpointHit', pauseListener);

      await executor.run();

      expect(pauseListener).toHaveBeenCalled();
      expect(executor.getCurrentStep()).toBe(1);
    });

    it('should continue after breakpoint', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1' };
        yield { action: 'step2' };
        yield { action: 'step3' };
      };

      await executor.load(algorithm);
      executor.addBreakpoint(1);

      await executor.run();
      await executor.continue();

      expect(executor.getState()).toBe('completed');
    });

    it('should support conditional breakpoints', async () => {
      const algorithm: AlgorithmFunction = function* () {
        for (let i = 0; i < 5; i++) {
          yield { action: 'loop', variables: { i } };
        }
      };

      await executor.load(algorithm);

      executor.addConditionalBreakpoint((step) => {
        return step.variables?.i === 3;
      });

      const pauseListener = vi.fn();
      executor.on('breakpointHit', pauseListener);

      await executor.run();

      expect(pauseListener).toHaveBeenCalled();
      expect(executor.getCurrentVariables().i).toBe(3);
    });
  });

  describe('events', () => {
    it('should emit executionStart event', async () => {
      const listener = vi.fn();
      executor.on('executionStart', listener);

      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step' };
      };

      await executor.execute(algorithm);

      expect(listener).toHaveBeenCalled();
    });

    it('should emit stepExecuted event', async () => {
      const listener = vi.fn();
      executor.on('stepExecuted', listener);

      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1' };
        yield { action: 'step2' };
      };

      await executor.execute(algorithm);

      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should emit executionComplete event', async () => {
      const listener = vi.fn();
      executor.on('executionComplete', listener);

      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step' };
      };

      await executor.execute(algorithm);

      expect(listener).toHaveBeenCalled();
    });

    it('should emit stateChange event', async () => {
      const listener = vi.fn();
      executor.on('stateChange', listener);

      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step' };
      };

      await executor.execute(algorithm);

      expect(listener).toHaveBeenCalled();
    });

    it('should emit variableChange event', async () => {
      const listener = vi.fn();
      executor.on('variableChange', listener);

      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step', variables: { x: 1 } };
        yield { action: 'step', variables: { x: 2 } };
      };

      await executor.execute(algorithm);

      expect(listener).toHaveBeenCalled();
    });

    it('should emit error event on failure', async () => {
      const listener = vi.fn();
      executor.on('executionError', listener);

      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1' };
        throw new Error('Test error');
      };

      await executor.execute(algorithm).catch(() => {});

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('performance optimization', () => {
    it('should handle large number of steps', async () => {
      const algorithm: AlgorithmFunction = function* () {
        for (let i = 0; i < 10000; i++) {
          yield { action: 'step', data: { i } };
        }
      };

      const startTime = Date.now();
      await executor.execute(algorithm);
      const duration = Date.now() - startTime;

      expect(executor.getTotalSteps()).toBe(10000);
      expect(duration).toBeLessThan(5000); // Should complete in reasonable time
    });

    it('should use lazy evaluation for steps', async () => {
      let evaluationCount = 0;

      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1', lazy: () => evaluationCount++ };
        yield { action: 'step2', lazy: () => evaluationCount++ };
        yield { action: 'step3', lazy: () => evaluationCount++ };
      };

      await executor.load(algorithm);

      expect(evaluationCount).toBe(0);

      await executor.stepForward();

      expect(evaluationCount).toBe(1);
    });

    it('should cleanup old snapshots', async () => {
      executor = new AlgorithmExecutor({ maxSnapshots: 100 });

      const algorithm: AlgorithmFunction = function* () {
        for (let i = 0; i < 200; i++) {
          yield { action: 'step', state: { i } };
        }
      };

      await executor.execute(algorithm);

      const snapshots = executor.getAllSnapshots();

      expect(snapshots.length).toBeLessThanOrEqual(100);
    });
  });

  describe('memory management', () => {
    it('should cleanup event listeners on dispose', async () => {
      const listener = vi.fn();
      executor.on('stepExecuted', listener);

      executor.dispose();

      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step' };
      };

      await executor.execute(algorithm).catch(() => {});

      expect(listener).not.toHaveBeenCalled();
    });

    it('should clear history on dispose', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step' };
      };

      await executor.execute(algorithm);

      executor.dispose();

      expect(executor.getHistory()).toHaveLength(0);
    });

    it('should clear snapshots on dispose', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step', state: { value: 1 } };
      };

      await executor.execute(algorithm);

      executor.dispose();

      expect(executor.getAllSnapshots()).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle algorithm errors gracefully', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step1' };
        throw new Error('Algorithm error');
      };

      await expect(executor.execute(algorithm)).rejects.toThrow('Algorithm error');
    });

    it('should emit error event', async () => {
      const errorListener = vi.fn();
      executor.on('executionError', errorListener);

      const algorithm: AlgorithmFunction = function* () {
        throw new Error('Test error');
      };

      await executor.execute(algorithm).catch(() => {});

      expect(errorListener).toHaveBeenCalled();
    });

    it('should handle invalid step index', async () => {
      const algorithm: AlgorithmFunction = function* () {
        yield { action: 'step' };
      };

      await executor.load(algorithm);

      expect(() => executor.goToStep(-1)).toThrow();
      expect(() => executor.goToStep(100)).toThrow();
    });

    it('should validate algorithm function', async () => {
      await expect(executor.execute(null as any)).rejects.toThrow();
      await expect(executor.execute({} as any)).rejects.toThrow();
    });
  });

  describe('time travel debugging', () => {
    it('should enable time travel mode', () => {
      executor.enableTimeTravel();

      expect(executor.isTimeTravelEnabled()).toBe(true);
    });

    it('should record full state at each step', async () => {
      executor.enableTimeTravel();

      const algorithm: AlgorithmFunction = function* () {
        const arr = [3, 1, 4, 1, 5];
        yield { action: 'initial', state: { arr: [...arr] } };

        arr.sort();
        yield { action: 'sorted', state: { arr: [...arr] } };
      };

      await executor.execute(algorithm);

      const trace = executor.getTimeTravel();

      expect(trace).toHaveLength(2);
      expect(trace[0].state.arr).toEqual([3, 1, 4, 1, 5]);
      expect(trace[1].state.arr).toEqual([1, 1, 3, 4, 5]);
    });

    it('should jump to any point in history', async () => {
      executor.enableTimeTravel();

      const algorithm: AlgorithmFunction = function* () {
        for (let i = 0; i < 5; i++) {
          yield { action: 'step', variables: { i } };
        }
      };

      await executor.execute(algorithm);

      executor.travelToStep(2);

      expect(executor.getCurrentVariables().i).toBe(2);
    });
  });
});
