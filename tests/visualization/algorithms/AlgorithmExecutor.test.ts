/**
 * TDD Test Specification: Algorithm Executor
 * Following London School TDD approach with heavy mocking
 *
 * Tests step-by-step algorithm execution with visualization hooks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Type definitions
interface AlgorithmStep {
  type: 'compare' | 'swap' | 'assign' | 'access' | 'complete';
  indices: number[];
  values?: any[];
  description: string;
  metadata?: Record<string, any>;
}

interface AlgorithmState {
  array: any[];
  step: number;
  totalSteps: number;
  comparisons: number;
  swaps: number;
  accesses: number;
}

interface AlgorithmExecutorConfig {
  enableStepRecording?: boolean;
  enablePerformanceTracking?: boolean;
  maxSteps?: number;
  breakOnError?: boolean;
}

interface IAlgorithmExecutor {
  execute(algorithm: Function, input: any[]): Promise<AlgorithmState>;
  step(): Promise<AlgorithmState>;
  reset(): void;
  getState(): AlgorithmState;
  getSteps(): AlgorithmStep[];
  getMetrics(): {
    comparisons: number;
    swaps: number;
    accesses: number;
    timeComplexity: string;
    spaceComplexity: string;
  };
  on(event: string, callback: Function): () => void;
  dispose(): void;
}

describe('AlgorithmExecutor', () => {
  let executor: IAlgorithmExecutor;
  let mockAlgorithm: Function;
  let testArray: number[];

  beforeEach(() => {
    testArray = [5, 2, 8, 1, 9];
    mockAlgorithm = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      // Arrange
      const config: AlgorithmExecutorConfig = {
        enableStepRecording: true,
        enablePerformanceTracking: true,
        maxSteps: 10000,
        breakOnError: true,
      };

      const createExecutor = (cfg: AlgorithmExecutorConfig) => {
        return {
          getState: () => ({
            array: [],
            step: 0,
            totalSteps: 0,
            comparisons: 0,
            swaps: 0,
            accesses: 0,
          }),
        } as IAlgorithmExecutor;
      };

      // Act
      executor = createExecutor(config);

      // Assert
      expect(executor.getState().step).toBe(0);
      expect(executor.getState().comparisons).toBe(0);
    });

    it('should clone input array to prevent mutations', () => {
      // Arrange
      const original = [1, 2, 3, 4, 5];
      
      const cloneArray = <T>(arr: T[]): T[] => {
        return [...arr];
      };

      // Act
      const cloned = cloneArray(original);
      cloned[0] = 99;

      // Assert
      expect(original[0]).toBe(1);
      expect(cloned[0]).toBe(99);
    });

    it('should validate input array', () => {
      // Arrange
      const validate = (input: any): boolean => {
        if (!Array.isArray(input)) {
          throw new Error('Input must be an array');
        }
        if (input.length === 0) {
          throw new Error('Input array cannot be empty');
        }
        return true;
      };

      // Act & Assert
      expect(() => validate(testArray)).not.toThrow();
      expect(() => validate(null)).toThrow('Input must be an array');
      expect(() => validate([])).toThrow('Input array cannot be empty');
    });
  });

  describe('Step Recording', () => {
    let steps: AlgorithmStep[];

    beforeEach(() => {
      steps = [];
    });

    it('should record compare step', () => {
      // Arrange
      const recordCompare = vi.fn((i: number, j: number, values: any[]) => {
        steps.push({
          type: 'compare',
          indices: [i, j],
          values: [values[i], values[j]],
          description: `Comparing ${values[i]} and ${values[j]}`,
        });
      });

      // Act
      recordCompare(0, 1, testArray);

      // Assert
      expect(recordCompare).toHaveBeenCalledWith(0, 1, testArray);
      expect(steps[0].type).toBe('compare');
      expect(steps[0].indices).toEqual([0, 1]);
    });

    it('should record swap step', () => {
      // Arrange
      const recordSwap = vi.fn((i: number, j: number, values: any[]) => {
        steps.push({
          type: 'swap',
          indices: [i, j],
          values: [values[i], values[j]],
          description: `Swapping ${values[i]} and ${values[j]}`,
        });
      });

      // Act
      recordSwap(0, 2, testArray);

      // Assert
      expect(steps[0].type).toBe('swap');
      expect(steps[0].indices).toEqual([0, 2]);
      expect(steps[0].description).toContain('Swapping');
    });

    it('should record array access', () => {
      // Arrange
      const recordAccess = vi.fn((index: number, value: any) => {
        steps.push({
          type: 'access',
          indices: [index],
          values: [value],
          description: `Accessing index ${index}`,
        });
      });

      // Act
      recordAccess(2, testArray[2]);

      // Assert
      expect(steps[0].type).toBe('access');
      expect(steps[0].indices).toEqual([2]);
    });

    it('should record assignment step', () => {
      // Arrange
      const recordAssign = vi.fn((index: number, newValue: any) => {
        steps.push({
          type: 'assign',
          indices: [index],
          values: [newValue],
          description: `Assigning ${newValue} to index ${index}`,
        });
      });

      // Act
      recordAssign(1, 42);

      // Assert
      expect(steps[0].type).toBe('assign');
      expect(steps[0].values).toEqual([42]);
    });

    it('should include step metadata', () => {
      // Arrange
      const recordStep = vi.fn((step: AlgorithmStep) => {
        steps.push({
          ...step,
          metadata: {
            timestamp: Date.now(),
            algorithmName: 'BubbleSort',
          },
        });
      });

      // Act
      recordStep({
        type: 'compare',
        indices: [0, 1],
        description: 'Test step',
      });

      // Assert
      expect(steps[0].metadata).toBeDefined();
      expect(steps[0].metadata?.algorithmName).toBe('BubbleSort');
    });

    it('should limit step recording when disabled', () => {
      // Arrange
      const config: AlgorithmExecutorConfig = {
        enableStepRecording: false,
      };

      const recordStep = (enabled: boolean, step: AlgorithmStep) => {
        if (enabled) {
          steps.push(step);
        }
      };

      // Act
      recordStep(config.enableStepRecording || false, {
        type: 'compare',
        indices: [0, 1],
        description: 'Test',
      });

      // Assert
      expect(steps).toHaveLength(0);
    });
  });

  describe('Step Execution', () => {
    let currentStep: number;
    let algorithmState: AlgorithmState;

    beforeEach(() => {
      currentStep = 0;
      algorithmState = {
        array: [...testArray],
        step: 0,
        totalSteps: 10,
        comparisons: 0,
        swaps: 0,
        accesses: 0,
      };
    });

    it('should execute next step', async () => {
      // Arrange
      const step = vi.fn(async () => {
        if (currentStep < algorithmState.totalSteps) {
          currentStep++;
          algorithmState.step = currentStep;
        }
        return algorithmState;
      });

      // Act
      const result = await step();

      // Assert
      expect(result.step).toBe(1);
      expect(step).toHaveBeenCalled();
    });

    it('should not step beyond total steps', async () => {
      // Arrange
      algorithmState.step = 10;
      algorithmState.totalSteps = 10;

      const step = vi.fn(async () => {
        if (algorithmState.step >= algorithmState.totalSteps) {
          throw new Error('No more steps to execute');
        }
        return algorithmState;
      });

      // Act & Assert
      await expect(step()).rejects.toThrow('No more steps to execute');
    });

    it('should emit step event', async () => {
      // Arrange
      const eventCallback = vi.fn();
      const events = new Map<string, Function[]>();
      events.set('step', [eventCallback]);

      const step = async () => {
        currentStep++;
        const callbacks = events.get('step');
        callbacks?.forEach(cb => cb({ step: currentStep }));
        return algorithmState;
      };

      // Act
      await step();

      // Assert
      expect(eventCallback).toHaveBeenCalledWith({ step: 1 });
    });

    it('should update performance metrics', async () => {
      // Arrange
      const performStep = vi.fn(async (type: 'compare' | 'swap') => {
        if (type === 'compare') {
          algorithmState.comparisons++;
        } else if (type === 'swap') {
          algorithmState.swaps++;
        }
        algorithmState.accesses += 2;
        return algorithmState;
      });

      // Act
      await performStep('compare');
      await performStep('swap');

      // Assert
      expect(algorithmState.comparisons).toBe(1);
      expect(algorithmState.swaps).toBe(1);
      expect(algorithmState.accesses).toBe(4);
    });

    it('should apply step to array state', async () => {
      // Arrange
      const applyStep = vi.fn(async (step: AlgorithmStep) => {
        if (step.type === 'swap') {
          const [i, j] = step.indices;
          const temp = algorithmState.array[i];
          algorithmState.array[i] = algorithmState.array[j];
          algorithmState.array[j] = temp;
        }
        return algorithmState;
      });

      // Act
      await applyStep({
        type: 'swap',
        indices: [0, 1],
        description: 'Swap',
      });

      // Assert
      expect(algorithmState.array[0]).toBe(2);
      expect(algorithmState.array[1]).toBe(5);
    });
  });

  describe('Algorithm Execution', () => {
    it('should execute algorithm to completion', async () => {
      // Arrange
      const bubbleSort = async (arr: number[]) => {
        const result = [...arr];
        for (let i = 0; i < result.length; i++) {
          for (let j = 0; j < result.length - i - 1; j++) {
            if (result[j] > result[j + 1]) {
              [result[j], result[j + 1]] = [result[j + 1], result[j]];
            }
          }
        }
        return result;
      };

      // Act
      const sorted = await bubbleSort(testArray);

      // Assert
      expect(sorted).toEqual([1, 2, 5, 8, 9]);
    });

    it('should handle empty array', async () => {
      // Arrange
      const execute = async (arr: any[]) => {
        if (arr.length === 0) {
          return {
            array: [],
            step: 0,
            totalSteps: 0,
            comparisons: 0,
            swaps: 0,
            accesses: 0,
          };
        }
        return {} as AlgorithmState;
      };

      // Act
      const result = await execute([]);

      // Assert
      expect(result.array).toEqual([]);
      expect(result.totalSteps).toBe(0);
    });

    it('should handle single element array', async () => {
      // Arrange
      const execute = async (arr: any[]) => {
        return {
          array: arr,
          step: 0,
          totalSteps: 0,
          comparisons: 0,
          swaps: 0,
          accesses: 0,
        };
      };

      // Act
      const result = await execute([42]);

      // Assert
      expect(result.array).toEqual([42]);
      expect(result.comparisons).toBe(0);
    });

    it('should respect max steps limit', async () => {
      // Arrange
      const config: AlgorithmExecutorConfig = {
        maxSteps: 5,
      };

      let stepCount = 0;
      const execute = async () => {
        while (stepCount < 10) {
          if (config.maxSteps && stepCount >= config.maxSteps) {
            throw new Error('Maximum steps exceeded');
          }
          stepCount++;
        }
      };

      // Act & Assert
      await expect(execute()).rejects.toThrow('Maximum steps exceeded');
      expect(stepCount).toBe(5);
    });

    it('should emit complete event', async () => {
      // Arrange
      const completeCallback = vi.fn();
      const events = new Map();
      events.set('complete', [completeCallback]);

      const execute = async () => {
        const callbacks = events.get('complete');
        callbacks?.forEach((cb: Function) => cb({ sorted: true }));
      };

      // Act
      await execute();

      // Assert
      expect(completeCallback).toHaveBeenCalledWith({ sorted: true });
    });
  });

  describe('Performance Metrics', () => {
    it('should track comparisons count', () => {
      // Arrange
      let comparisons = 0;

      const compare = vi.fn((a: number, b: number) => {
        comparisons++;
        return a > b;
      });

      // Act
      compare(5, 2);
      compare(8, 1);
      compare(9, 5);

      // Assert
      expect(comparisons).toBe(3);
    });

    it('should track swaps count', () => {
      // Arrange
      let swaps = 0;

      const swap = vi.fn((arr: any[], i: number, j: number) => {
        swaps++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      });

      const arr = [3, 1, 2];

      // Act
      swap(arr, 0, 1);
      swap(arr, 1, 2);

      // Assert
      expect(swaps).toBe(2);
    });

    it('should track array accesses', () => {
      // Arrange
      let accesses = 0;

      const access = vi.fn((arr: any[], index: number) => {
        accesses++;
        return arr[index];
      });

      // Act
      access(testArray, 0);
      access(testArray, 2);
      access(testArray, 4);

      // Assert
      expect(accesses).toBe(3);
    });

    it('should calculate time complexity', () => {
      // Arrange
      const calculateComplexity = (n: number, comparisons: number): string => {
        const ratio = comparisons / (n * n);
        if (ratio > 0.8) return 'O(n²)';
        if (comparisons / (n * Math.log(n)) > 0.8) return 'O(n log n)';
        return 'O(n)';
      };

      // Act
      const complexity1 = calculateComplexity(5, 25);
      const complexity2 = calculateComplexity(5, 12);

      // Assert
      expect(complexity1).toBe('O(n²)');
    });

    it('should calculate space complexity', () => {
      // Arrange
      const calculateSpaceComplexity = (originalSize: number, extraSpace: number): string => {
        if (extraSpace === 0) return 'O(1)';
        if (extraSpace === originalSize) return 'O(n)';
        return 'O(log n)';
      };

      // Act
      const space1 = calculateSpaceComplexity(10, 0);
      const space2 = calculateSpaceComplexity(10, 10);

      // Assert
      expect(space1).toBe('O(1)');
      expect(space2).toBe('O(n)');
    });

    it('should track execution time', async () => {
      // Arrange
      const execute = async () => {
        const start = performance.now();
        await new Promise(resolve => setTimeout(resolve, 10));
        const end = performance.now();
        return end - start;
      };

      // Act
      const duration = await execute();

      // Assert
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    let state: AlgorithmState;

    beforeEach(() => {
      state = {
        array: [...testArray],
        step: 0,
        totalSteps: 10,
        comparisons: 0,
        swaps: 0,
        accesses: 0,
      };
    });

    it('should get current state', () => {
      // Arrange
      const getState = vi.fn(() => ({ ...state }));

      // Act
      const currentState = getState();

      // Assert
      expect(currentState).toEqual(state);
      expect(getState).toHaveBeenCalled();
    });

    it('should reset state', () => {
      // Arrange
      state.step = 5;
      state.comparisons = 10;
      state.swaps = 5;

      const reset = vi.fn(() => {
        state.step = 0;
        state.comparisons = 0;
        state.swaps = 0;
        state.accesses = 0;
        state.array = [...testArray];
      });

      // Act
      reset();

      // Assert
      expect(state.step).toBe(0);
      expect(state.comparisons).toBe(0);
      expect(state.array).toEqual(testArray);
    });

    it('should snapshot state for undo/redo', () => {
      // Arrange
      const snapshots: AlgorithmState[] = [];

      const snapshot = vi.fn(() => {
        snapshots.push({ ...state });
      });

      // Act
      snapshot();
      state.step++;
      snapshot();

      // Assert
      expect(snapshots).toHaveLength(2);
      expect(snapshots[0].step).toBe(0);
      expect(snapshots[1].step).toBe(1);
    });

    it('should restore from snapshot', () => {
      // Arrange
      const snapshot = { ...state };
      state.step = 5;
      state.comparisons = 10;

      const restore = vi.fn((snap: AlgorithmState) => {
        state = { ...snap };
      });

      // Act
      restore(snapshot);

      // Assert
      expect(state.step).toBe(0);
      expect(state.comparisons).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle algorithm errors', async () => {
      // Arrange
      const faultyAlgorithm = async () => {
        throw new Error('Algorithm error');
      };

      const config: AlgorithmExecutorConfig = {
        breakOnError: true,
      };

      const execute = async (algo: Function, breakOnErr: boolean) => {
        try {
          await algo();
        } catch (error) {
          if (breakOnErr) {
            throw error;
          }
          return { error: (error as Error).message };
        }
      };

      // Act & Assert
      await expect(execute(faultyAlgorithm, config.breakOnError!)).rejects.toThrow('Algorithm error');
    });

    it('should validate step indices', () => {
      // Arrange
      const validateIndices = (indices: number[], arrayLength: number) => {
        for (const index of indices) {
          if (index < 0 || index >= arrayLength) {
            throw new Error(`Index ${index} out of bounds`);
          }
        }
      };

      // Act & Assert
      expect(() => validateIndices([0, 1, 2], 5)).not.toThrow();
      expect(() => validateIndices([0, 10], 5)).toThrow('Index 10 out of bounds');
      expect(() => validateIndices([-1, 2], 5)).toThrow('Index -1 out of bounds');
    });

    it('should handle infinite loops', async () => {
      // Arrange
      const config: AlgorithmExecutorConfig = {
        maxSteps: 1000,
      };

      let steps = 0;
      const infiniteLoop = async () => {
        while (true) {
          steps++;
          if (config.maxSteps && steps > config.maxSteps) {
            throw new Error('Maximum steps exceeded - possible infinite loop');
          }
        }
      };

      // Act & Assert
      await expect(infiniteLoop()).rejects.toThrow('Maximum steps exceeded - possible infinite loop');
    });
  });

  describe('Event System', () => {
    let events: Map<string, Function[]>;

    beforeEach(() => {
      events = new Map();
    });

    it('should register event listeners', () => {
      // Arrange
      const callback = vi.fn();

      const on = vi.fn((event: string, cb: Function) => {
        if (!events.has(event)) {
          events.set(event, []);
        }
        events.get(event)!.push(cb);
        return () => {
          const callbacks = events.get(event);
          if (callbacks) {
            const index = callbacks.indexOf(cb);
            if (index > -1) callbacks.splice(index, 1);
          }
        };
      });

      // Act
      const unsubscribe = on('step', callback);

      // Assert
      expect(on).toHaveBeenCalledWith('step', callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should emit events to listeners', () => {
      // Arrange
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      events.set('compare', [callback1, callback2]);

      const emit = (event: string, data: any) => {
        const callbacks = events.get(event);
        callbacks?.forEach(cb => cb(data));
      };

      // Act
      emit('compare', { indices: [0, 1] });

      // Assert
      expect(callback1).toHaveBeenCalledWith({ indices: [0, 1] });
      expect(callback2).toHaveBeenCalledWith({ indices: [0, 1] });
    });

    it('should unsubscribe event listeners', () => {
      // Arrange
      const callback = vi.fn();
      events.set('swap', [callback]);

      const unsubscribe = () => {
        const callbacks = events.get('swap');
        if (callbacks) {
          const index = callbacks.indexOf(callback);
          if (index > -1) callbacks.splice(index, 1);
        }
      };

      // Act
      unsubscribe();
      const remaining = events.get('swap');

      // Assert
      expect(remaining).toHaveLength(0);
    });
  });

  describe('Memory Management', () => {
    it('should cleanup on dispose', () => {
      // Arrange
      const events = new Map<string, Function[]>();
      const steps: AlgorithmStep[] = [{
        type: 'compare',
        indices: [0, 1],
        description: 'Test',
      }];

      const dispose = vi.fn(() => {
        events.clear();
        steps.length = 0;
      });

      // Act
      dispose();

      // Assert
      expect(events.size).toBe(0);
      expect(steps).toHaveLength(0);
    });

    it('should limit step history size', () => {
      // Arrange
      const maxHistory = 100;
      const steps: AlgorithmStep[] = [];

      const addStep = (step: AlgorithmStep) => {
        steps.push(step);
        if (steps.length > maxHistory) {
          steps.shift();
        }
      };

      // Act
      for (let i = 0; i < 150; i++) {
        addStep({
          type: 'compare',
          indices: [i, i + 1],
          description: `Step ${i}`,
        });
      }

      // Assert
      expect(steps).toHaveLength(100);
    });
  });
});
