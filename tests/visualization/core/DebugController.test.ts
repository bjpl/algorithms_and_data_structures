/**
 * @file Comprehensive tests for DebugController
 * @module tests/visualization/core
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DebugController } from '../../../src/visualization/core/DebugController';
import type { ExecutionStep } from '../../../src/visualization/core/AlgorithmExecutor';

describe('DebugController', () => {
  let debugController: DebugController;

  beforeEach(() => {
    debugController = new DebugController({
      maxSnapshots: 100,
      autoSnapshot: true,
      snapshotInterval: 5,
      trackCallStack: true,
      trackMemory: true,
    });
  });

  // ============================================================================
  // INITIALIZATION & STATE MANAGEMENT
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with idle state', () => {
      expect(debugController.getState()).toBe('idle');
    });

    it('should accept custom configuration', () => {
      const custom = new DebugController({
        maxSnapshots: 50,
        autoSnapshot: false,
      });

      expect(custom.getSnapshotCount()).toBe(0);
    });

    it('should initialize with empty breakpoints', () => {
      expect(debugController.getBreakpoints()).toHaveLength(0);
    });

    it('should initialize with empty call stack', () => {
      expect(debugController.getCallStack()).toHaveLength(0);
    });
  });

  describe('State Management', () => {
    it('should update debug state', () => {
      debugController.setState('running');
      expect(debugController.getState()).toBe('running');
    });

    it('should emit state change event', () => {
      const listener = vi.fn();
      debugController.on('stateChange', listener);

      debugController.setState('paused');

      expect(listener).toHaveBeenCalledWith({ state: 'paused' });
    });

    it('should update execution context', () => {
      const step: ExecutionStep = {
        index: 0,
        description: 'Initialize',
        affectedNodes: ['node1'],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 0, j: 1 });

      const context = debugController.getCurrentContext();
      expect(context).toBeDefined();
      expect(context?.step).toEqual(step);
      expect(context?.variables).toEqual({ i: 0, j: 1 });
    });

    it('should track previous context', () => {
      const step1: ExecutionStep = {
        index: 0,
        description: 'Step 1',
        affectedNodes: [],
        status: 'active',
      };

      const step2: ExecutionStep = {
        index: 1,
        description: 'Step 2',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step1, 0, { i: 0 });
      debugController.updateContext(step2, 1, { i: 1 });

      const context = debugController.getCurrentContext();
      expect(context?.previous).toBeDefined();
      expect(context?.previous?.step).toEqual(step1);
    });
  });

  // ============================================================================
  // LINE BREAKPOINTS
  // ============================================================================

  describe('Line Breakpoints', () => {
    it('should add line breakpoint', () => {
      const id = debugController.addLineBreakpoint(10);

      expect(id).toBeDefined();
      expect(debugController.getBreakpoints()).toHaveLength(1);
    });

    it('should add conditional line breakpoint', () => {
      const id = debugController.addLineBreakpoint(10, 'i > 5');

      const breakpoints = debugController.getBreakpoints();
      expect(breakpoints).toHaveLength(1);
      expect(breakpoints[0].type).toBe('line');
    });

    it('should remove line breakpoint', () => {
      const id = debugController.addLineBreakpoint(10);
      const removed = debugController.removeBreakpoint(id);

      expect(removed).toBe(true);
      expect(debugController.getBreakpoints()).toHaveLength(0);
    });

    it('should remove breakpoints by line', () => {
      debugController.addLineBreakpoint(10);
      debugController.addLineBreakpoint(10);
      debugController.addLineBreakpoint(20);

      const removed = debugController.removeBreakpointsByLine(10);

      expect(removed).toBe(2);
      expect(debugController.getBreakpoints()).toHaveLength(1);
    });

    it('should pause at line breakpoint', () => {
      debugController.addLineBreakpoint(10);

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, {});

      const hit = debugController.shouldPause(10);
      expect(hit).toBeDefined();
      expect(hit?.type).toBe('line');
    });

    it('should not pause at disabled breakpoint', () => {
      const id = debugController.addLineBreakpoint(10);
      debugController.setBreakpointEnabled(id, false);

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, {});

      const hit = debugController.shouldPause(10);
      expect(hit).toBeNull();
    });

    it('should pause at conditional line breakpoint when condition is true', () => {
      debugController.addLineBreakpoint(10, 'i > 5');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 6 });

      const hit = debugController.shouldPause(10);
      expect(hit).toBeDefined();
    });

    it('should not pause at conditional line breakpoint when condition is false', () => {
      debugController.addLineBreakpoint(10, 'i > 5');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 3 });

      const hit = debugController.shouldPause(10);
      expect(hit).toBeNull();
    });
  });

  // ============================================================================
  // CONDITIONAL BREAKPOINTS
  // ============================================================================

  describe('Conditional Breakpoints', () => {
    it('should add conditional breakpoint', () => {
      const id = debugController.addConditionalBreakpoint('i > 5');

      expect(id).toBeDefined();
      const breakpoints = debugController.getBreakpoints();
      expect(breakpoints).toHaveLength(1);
      expect(breakpoints[0].type).toBe('conditional');
    });

    it('should pause when condition evaluates to true', () => {
      debugController.addConditionalBreakpoint('i > 5');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 10 });

      const hit = debugController.shouldPause(0);
      expect(hit).toBeDefined();
      expect(hit?.type).toBe('conditional');
    });

    it('should not pause when condition evaluates to false', () => {
      debugController.addConditionalBreakpoint('i > 5');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 3 });

      const hit = debugController.shouldPause(0);
      expect(hit).toBeNull();
    });

    it('should handle complex conditions', () => {
      debugController.addConditionalBreakpoint('i > 5 && j < 10');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 7, j: 8 });

      const hit = debugController.shouldPause(0);
      expect(hit).toBeDefined();
    });

    it('should handle array access in conditions', () => {
      debugController.addConditionalBreakpoint('arr[0] > 10');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { arr: [15, 20, 25] });

      const hit = debugController.shouldPause(0);
      expect(hit).toBeDefined();
    });
  });

  // ============================================================================
  // HIT COUNT BREAKPOINTS
  // ============================================================================

  describe('Hit Count Breakpoints', () => {
    it('should add hit count breakpoint', () => {
      const id = debugController.addHitCountBreakpoint(10, 3);

      expect(id).toBeDefined();
      const breakpoints = debugController.getBreakpoints();
      expect(breakpoints).toHaveLength(1);
      expect(breakpoints[0].type).toBe('hitCount');
    });

    it('should pause on exact hit count (==)', () => {
      debugController.addHitCountBreakpoint(10, 3, '==');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, {});

      // First two hits should not pause
      expect(debugController.shouldPause(10)).toBeNull();
      expect(debugController.shouldPause(10)).toBeNull();

      // Third hit should pause
      const hit = debugController.shouldPause(10);
      expect(hit).toBeDefined();
      expect(hit?.type).toBe('hitCount');
    });

    it('should pause on minimum hit count (>=)', () => {
      debugController.addHitCountBreakpoint(10, 2, '>=');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, {});

      // First hit should not pause
      expect(debugController.shouldPause(10)).toBeNull();

      // Second and subsequent hits should pause
      expect(debugController.shouldPause(10)).toBeDefined();
      expect(debugController.shouldPause(10)).toBeDefined();
    });

    it('should pause on modulo hit count (%)', () => {
      debugController.addHitCountBreakpoint(10, 2, '%');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, {});

      // Odd hits should not pause
      expect(debugController.shouldPause(10)).toBeNull();

      // Even hits should pause
      expect(debugController.shouldPause(10)).toBeDefined();
      expect(debugController.shouldPause(10)).toBeNull();
      expect(debugController.shouldPause(10)).toBeDefined();
    });

    it('should reset hit counts on reset', () => {
      const id = debugController.addHitCountBreakpoint(10, 2, '==');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, {});
      debugController.shouldPause(10);

      debugController.reset();

      // After reset, hit count should be 0 again
      expect(debugController.shouldPause(10)).toBeNull();
    });
  });

  // ============================================================================
  // LOGPOINTS
  // ============================================================================

  describe('Logpoints', () => {
    it('should add logpoint', () => {
      const id = debugController.addLogpoint(10, 'Value of i: {i}');

      expect(id).toBeDefined();
      const breakpoints = debugController.getBreakpoints();
      expect(breakpoints).toHaveLength(1);
      expect(breakpoints[0].type).toBe('logpoint');
    });

    it('should emit log event without pausing', () => {
      const logListener = vi.fn();
      debugController.on('logpoint', logListener);

      debugController.addLogpoint(10, 'i = {i}');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 42 });

      const hit = debugController.shouldPause(10);
      expect(hit).toBeNull(); // Should not pause

      expect(logListener).toHaveBeenCalled();
      const logData = logListener.mock.calls[0][0];
      expect(logData.message).toBe('i = 42');
    });

    it('should evaluate complex expressions in logpoints', () => {
      const logListener = vi.fn();
      debugController.on('logpoint', logListener);

      debugController.addLogpoint(10, 'Sum: {i + j}');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 10, j: 20 });
      debugController.shouldPause(10);

      const logData = logListener.mock.calls[0][0];
      expect(logData.message).toBe('Sum: 30');
    });
  });

  // ============================================================================
  // WATCH EXPRESSIONS
  // ============================================================================

  describe('Watch Expressions', () => {
    it('should add watch expression', () => {
      const id = debugController.addWatch('i');

      expect(id).toBeDefined();
      expect(debugController.getWatches()).toHaveLength(1);
    });

    it('should evaluate watch expression', () => {
      const id = debugController.addWatch('i * 2');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 5 });

      const value = debugController.evaluateWatch(id);
      expect(value).toBe(10);
    });

    it('should trigger watch event on value change', () => {
      const watchListener = vi.fn();
      debugController.on('watchTriggered', watchListener);

      debugController.addWatch('i', true);

      const step1: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      const step2: ExecutionStep = {
        index: 1,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step1, 0, { i: 5 });
      debugController.updateContext(step2, 1, { i: 10 });

      expect(watchListener).toHaveBeenCalled();
      const eventData = watchListener.mock.calls[0][0];
      expect(eventData.oldValue).toBe(5);
      expect(eventData.newValue).toBe(10);
    });

    it('should not trigger watch event if value unchanged', () => {
      const watchListener = vi.fn();
      debugController.on('watchTriggered', watchListener);

      debugController.addWatch('i', true);

      const step1: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      const step2: ExecutionStep = {
        index: 1,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step1, 0, { i: 5 });
      debugController.updateContext(step2, 1, { i: 5 });

      expect(watchListener).not.toHaveBeenCalled();
    });

    it('should remove watch expression', () => {
      const id = debugController.addWatch('i');
      const removed = debugController.removeWatch(id);

      expect(removed).toBe(true);
      expect(debugController.getWatches()).toHaveLength(0);
    });

    it('should evaluate complex watch expressions', () => {
      const id = debugController.addWatch('arr.length');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { arr: [1, 2, 3, 4, 5] });

      const value = debugController.evaluateWatch(id);
      expect(value).toBe(5);
    });
  });

  // ============================================================================
  // EXPRESSION EVALUATION
  // ============================================================================

  describe('Expression Evaluation', () => {
    it('should evaluate arbitrary expression', () => {
      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { a: 10, b: 20 });

      const result = debugController.evaluateExpression('a + b');
      expect(result).toBe(30);
    });

    it('should throw error if no current context', () => {
      expect(() => {
        debugController.evaluateExpression('i + 1');
      }).toThrow('No current execution context');
    });

    it('should evaluate array operations', () => {
      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { arr: [10, 20, 30] });

      const result = debugController.evaluateExpression('arr[1]');
      expect(result).toBe(20);
    });

    it('should evaluate object property access', () => {
      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { obj: { x: 42, y: 100 } });

      const result = debugController.evaluateExpression('obj.x');
      expect(result).toBe(42);
    });
  });

  // ============================================================================
  // CALL STACK TRACKING
  // ============================================================================

  describe('Call Stack Tracking', () => {
    it('should push call frame', () => {
      const id = debugController.pushCallFrame('main', 1, { x: 10 });

      expect(id).toBeDefined();
      expect(debugController.getCallStack()).toHaveLength(1);
    });

    it('should pop call frame', () => {
      debugController.pushCallFrame('main', 1);
      const frame = debugController.popCallFrame();

      expect(frame).toBeDefined();
      expect(frame?.name).toBe('main');
      expect(debugController.getCallStack()).toHaveLength(0);
    });

    it('should track nested call frames', () => {
      debugController.pushCallFrame('main', 1);
      debugController.pushCallFrame('helper', 5);
      debugController.pushCallFrame('inner', 10);

      const stack = debugController.getCallStack();
      expect(stack).toHaveLength(3);
      expect(stack[0].name).toBe('main');
      expect(stack[1].name).toBe('helper');
      expect(stack[2].name).toBe('inner');
    });

    it('should get current frame', () => {
      debugController.pushCallFrame('main', 1);
      debugController.pushCallFrame('helper', 5);

      const current = debugController.getCurrentFrame();
      expect(current?.name).toBe('helper');
    });

    it('should emit call stack change event', () => {
      const listener = vi.fn();
      debugController.on('callStackChange', listener);

      debugController.pushCallFrame('main', 1);

      expect(listener).toHaveBeenCalled();
    });

    it('should clear call stack', () => {
      debugController.pushCallFrame('main', 1);
      debugController.pushCallFrame('helper', 5);

      debugController.clearCallStack();

      expect(debugController.getCallStack()).toHaveLength(0);
    });
  });

  // ============================================================================
  // MEMORY SNAPSHOTS
  // ============================================================================

  describe('Memory Snapshots', () => {
    it('should create snapshot', () => {
      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 5 });

      const id = debugController.createSnapshot();

      expect(id).toBeDefined();
      expect(debugController.getSnapshotCount()).toBe(1);
    });

    it('should get snapshot by ID', () => {
      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 5 });

      const id = debugController.createSnapshot();
      const snapshot = debugController.getSnapshot(id);

      expect(snapshot).toBeDefined();
      expect(snapshot?.variables).toEqual({ i: 5 });
    });

    it('should auto-create snapshots at interval', () => {
      const controller = new DebugController({
        autoSnapshot: true,
        snapshotInterval: 2,
      });

      const step1: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      const step2: ExecutionStep = {
        index: 1,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      const step3: ExecutionStep = {
        index: 2,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      controller.updateContext(step1, 0, { i: 1 });
      expect(controller.getSnapshotCount()).toBe(0);

      controller.updateContext(step2, 1, { i: 2 });
      expect(controller.getSnapshotCount()).toBe(1);

      controller.updateContext(step3, 2, { i: 3 });
      expect(controller.getSnapshotCount()).toBe(1);
    });

    it('should limit snapshot count', () => {
      const controller = new DebugController({
        maxSnapshots: 3,
        autoSnapshot: false,
      });

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      controller.updateContext(step, 0, { i: 1 });

      // Create more snapshots than max
      controller.createSnapshot();
      controller.createSnapshot();
      controller.createSnapshot();
      controller.createSnapshot();

      expect(controller.getSnapshotCount()).toBe(3);
    });

    it('should clear snapshots', () => {
      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 5 });
      debugController.createSnapshot();

      debugController.clearSnapshots();

      expect(debugController.getSnapshotCount()).toBe(0);
    });

    it('should include call stack in snapshot', () => {
      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 5 });
      debugController.pushCallFrame('main', 1);
      debugController.pushCallFrame('helper', 5);

      const id = debugController.createSnapshot();
      const snapshot = debugController.getSnapshot(id);

      expect(snapshot?.callStack).toHaveLength(2);
    });
  });

  // ============================================================================
  // BREAKPOINT MANAGEMENT
  // ============================================================================

  describe('Breakpoint Management', () => {
    it('should enable/disable breakpoint', () => {
      const id = debugController.addLineBreakpoint(10);

      debugController.setBreakpointEnabled(id, false);

      const breakpoints = debugController.getBreakpoints();
      expect(breakpoints[0].enabled).toBe(false);
    });

    it('should get breakpoints by type', () => {
      debugController.addLineBreakpoint(10);
      debugController.addConditionalBreakpoint('i > 5');
      debugController.addHitCountBreakpoint(20, 3);

      const lineBreakpoints = debugController.getBreakpointsByType('line');
      expect(lineBreakpoints).toHaveLength(1);

      const conditionalBreakpoints = debugController.getBreakpointsByType('conditional');
      expect(conditionalBreakpoints).toHaveLength(1);

      const hitCountBreakpoints = debugController.getBreakpointsByType('hitCount');
      expect(hitCountBreakpoints).toHaveLength(1);
    });

    it('should clear all breakpoints', () => {
      debugController.addLineBreakpoint(10);
      debugController.addConditionalBreakpoint('i > 5');
      debugController.addHitCountBreakpoint(20, 3);

      debugController.clearBreakpoints();

      expect(debugController.getBreakpoints()).toHaveLength(0);
    });
  });

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  describe('Event System', () => {
    it('should subscribe to events', () => {
      const listener = vi.fn();
      const unsubscribe = debugController.on('stateChange', listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe from events', () => {
      const listener = vi.fn();
      const unsubscribe = debugController.on('stateChange', listener);

      unsubscribe();
      debugController.setState('running');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should emit breakpoint added event', () => {
      const listener = vi.fn();
      debugController.on('breakpointAdded', listener);

      debugController.addLineBreakpoint(10);

      expect(listener).toHaveBeenCalled();
    });

    it('should emit breakpoint removed event', () => {
      const listener = vi.fn();
      debugController.on('breakpointRemoved', listener);

      const id = debugController.addLineBreakpoint(10);
      debugController.removeBreakpoint(id);

      expect(listener).toHaveBeenCalled();
    });

    it('should handle errors in event listeners gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Event listener error');
      });

      debugController.on('stateChange', errorListener);

      // Should not throw
      expect(() => {
        debugController.setState('running');
      }).not.toThrow();
    });
  });

  // ============================================================================
  // EXECUTION CONTROL
  // ============================================================================

  describe('Execution Control', () => {
    it('should pause execution', () => {
      debugController.pause();
      expect(debugController.getState()).toBe('paused');
    });

    it('should resume execution', () => {
      debugController.pause();
      debugController.resume();
      expect(debugController.getState()).toBe('running');
    });

    it('should complete execution', () => {
      const listener = vi.fn();
      debugController.on('executionComplete', listener);

      debugController.complete();

      expect(debugController.getState()).toBe('completed');
      expect(listener).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // DISPOSAL & RESET
  // ============================================================================

  describe('Disposal and Reset', () => {
    it('should dispose and clean up resources', () => {
      debugController.addLineBreakpoint(10);
      debugController.addWatch('i');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 5 });

      debugController.dispose();

      expect(debugController.getBreakpoints()).toHaveLength(0);
      expect(debugController.getWatches()).toHaveLength(0);
      expect(debugController.getSnapshotCount()).toBe(0);
      expect(debugController.getState()).toBe('idle');
    });

    it('should reset to initial state', () => {
      debugController.addLineBreakpoint(10);

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, { i: 5 });
      debugController.createSnapshot();
      debugController.pushCallFrame('main', 1);
      debugController.setState('running');

      debugController.reset();

      expect(debugController.getSnapshotCount()).toBe(0);
      expect(debugController.getCallStack()).toHaveLength(0);
      expect(debugController.getCurrentContext()).toBeNull();
      expect(debugController.getState()).toBe('idle');
      expect(debugController.getBreakpoints()).toHaveLength(1); // Breakpoints persist
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe('Integration Scenarios', () => {
    it('should handle complex debugging workflow', () => {
      // Setup
      debugController.addLineBreakpoint(5);
      debugController.addConditionalBreakpoint('i > 10');
      const watchId = debugController.addWatch('i * 2');

      const watchListener = vi.fn();
      debugController.on('watchTriggered', watchListener);

      // Step 1: i = 5
      const step1: ExecutionStep = {
        index: 0,
        description: 'Initialize',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step1, 0, { i: 5 });

      // Should pause at line breakpoint
      let hit = debugController.shouldPause(5);
      expect(hit).toBeDefined();

      // Watch should evaluate to 10
      expect(debugController.evaluateWatch(watchId)).toBe(10);

      // Step 2: i = 15
      const step2: ExecutionStep = {
        index: 1,
        description: 'Increment',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step2, 1, { i: 15 });

      // Should pause at conditional breakpoint
      hit = debugController.shouldPause(10);
      expect(hit).toBeDefined();

      // Watch should have changed
      expect(watchListener).toHaveBeenCalled();
      expect(debugController.evaluateWatch(watchId)).toBe(30);
    });

    it('should support time-travel debugging with snapshots', () => {
      const controller = new DebugController({
        autoSnapshot: true,
        snapshotInterval: 1,
      });

      // Create sequence of steps
      for (let i = 0; i < 5; i++) {
        const step: ExecutionStep = {
          index: i,
          description: `Step ${i}`,
          affectedNodes: [],
          status: 'active',
        };

        controller.updateContext(step, i, { counter: i });
      }

      // Should have created snapshots
      expect(controller.getSnapshotCount()).toBeGreaterThan(0);

      const snapshots = controller.getSnapshots();
      expect(snapshots[0].variables.counter).toBe(0);
    });

    it('should track nested function calls', () => {
      debugController.pushCallFrame('main', 1, { x: 10 });
      debugController.pushCallFrame('helper', 5, { y: 20 });
      debugController.pushCallFrame('nested', 10, { z: 30 });

      const stack = debugController.getCallStack();
      expect(stack).toHaveLength(3);

      // Current frame should be nested
      const current = debugController.getCurrentFrame();
      expect(current?.name).toBe('nested');
      expect(current?.scope).toEqual({ z: 30 });

      // Pop and verify
      debugController.popCallFrame();
      expect(debugController.getCurrentFrame()?.name).toBe('helper');
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle invalid condition expressions gracefully', () => {
      const errorListener = vi.fn();
      debugController.on('error', errorListener);

      debugController.addConditionalBreakpoint('invalid syntax {]');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, {});

      // Should not throw
      expect(() => {
        debugController.shouldPause(0);
      }).not.toThrow();
    });

    it('should handle watch evaluation errors', () => {
      const errorListener = vi.fn();
      debugController.on('error', errorListener);

      const id = debugController.addWatch('undefined.property');

      const step: ExecutionStep = {
        index: 0,
        description: 'Test',
        affectedNodes: [],
        status: 'active',
      };

      debugController.updateContext(step, 0, {});

      // Should not crash
      const value = debugController.evaluateWatch(id);
      expect(value).toBeUndefined();
    });
  });
});
