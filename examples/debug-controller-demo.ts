/**
 * @file DebugController demonstration example
 * @module examples
 *
 * This example demonstrates the comprehensive debugging capabilities
 * of the DebugController for algorithm visualizations.
 */

import { DebugController, DebugContext } from '../src/visualization/core/DebugController';
import { ExecutionStep } from '../src/visualization/core/AlgorithmExecutor';

/**
 * Simulates a bubble sort algorithm with full debugging support
 */
function* bubbleSortWithDebug(arr: number[]): Generator<ExecutionStep> {
  const n = arr.length;
  let swaps = 0;
  let comparisons = 0;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;

      // Yield comparison step
      yield {
        index: comparisons,
        description: `Compare arr[${j}] (${arr[j]}) with arr[${j + 1}] (${arr[j + 1]})`,
        affectedNodes: [String(j), String(j + 1)],
        status: 'active',
        data: {
          variables: {
            i,
            j,
            arr: [...arr],
            swaps,
            comparisons,
          },
        },
      };

      if (arr[j] > arr[j + 1]) {
        // Swap
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swaps++;

        // Yield swap step
        yield {
          index: comparisons + swaps,
          description: `Swap arr[${j}] and arr[${j + 1}]`,
          affectedNodes: [String(j), String(j + 1)],
          status: 'active',
          data: {
            variables: {
              i,
              j,
              arr: [...arr],
              swaps,
              comparisons,
            },
          },
        };
      }
    }
  }

  // Final step
  yield {
    index: comparisons + swaps + 1,
    description: 'Sorting complete',
    affectedNodes: [],
    status: 'completed',
    data: {
      variables: {
        i: n - 1,
        j: n - 1,
        arr: [...arr],
        swaps,
        comparisons,
      },
    },
  };
}

/**
 * Demo: Basic Breakpoint Usage
 */
export function demoBasicBreakpoints() {
  console.log('\n=== Demo: Basic Breakpoints ===\n');

  const debugController = new DebugController({
    maxSnapshots: 50,
    autoSnapshot: true,
    snapshotInterval: 5,
  });

  // Add line breakpoint at step 10
  debugController.addLineBreakpoint(10);
  console.log('Added line breakpoint at step 10');

  // Run bubble sort
  const array = [64, 34, 25, 12, 22, 11, 90];
  const generator = bubbleSortWithDebug(array);

  let stepCount = 0;
  for (const step of generator) {
    stepCount++;
    const variables = step.data?.variables || {};

    // Update debug context
    debugController.updateContext(step, stepCount, variables);

    // Check if we should pause
    const hit = debugController.shouldPause(stepCount);
    if (hit) {
      console.log(`\nBreakpoint hit at step ${stepCount}!`);
      console.log(`Description: ${step.description}`);
      console.log(`Variables:`, variables);
      break;
    }
  }

  debugController.dispose();
}

/**
 * Demo: Conditional Breakpoints
 */
export function demoConditionalBreakpoints() {
  console.log('\n=== Demo: Conditional Breakpoints ===\n');

  const debugController = new DebugController();

  // Add conditional breakpoint: pause when swaps > 5
  debugController.addConditionalBreakpoint('swaps > 5');
  console.log('Added conditional breakpoint: swaps > 5');

  // Listen for breakpoint hits
  debugController.on('breakpointHit', (data) => {
    const ctx = data.context as DebugContext;
    console.log(`\nConditional breakpoint triggered!`);
    console.log(`  Swaps: ${ctx.variables.swaps}`);
    console.log(`  Comparisons: ${ctx.variables.comparisons}`);
    console.log(`  Array state: [${ctx.variables.arr}]`);
  });

  // Run bubble sort
  const array = [64, 34, 25, 12, 22, 11, 90];
  const generator = bubbleSortWithDebug(array);

  let stepCount = 0;
  for (const step of generator) {
    stepCount++;
    const variables = step.data?.variables || {};

    debugController.updateContext(step, stepCount, variables);

    const hit = debugController.shouldPause(stepCount);
    if (hit) {
      debugController.pause();
      break;
    }
  }

  debugController.dispose();
}

/**
 * Demo: Watch Expressions
 */
export function demoWatchExpressions() {
  console.log('\n=== Demo: Watch Expressions ===\n');

  const debugController = new DebugController();

  // Add watches
  debugController.addWatch('swaps', true);
  debugController.addWatch('comparisons', true);
  debugController.addWatch('arr.length', true);

  console.log('Added watches: swaps, comparisons, arr.length');

  // Listen for watch triggers
  debugController.on('watchTriggered', (data) => {
    console.log(`Watch "${data.watch.expression}" changed: ${data.oldValue} -> ${data.newValue}`);
  });

  // Run bubble sort
  const array = [5, 2, 8, 1, 9];
  const generator = bubbleSortWithDebug(array);

  let stepCount = 0;
  for (const step of generator) {
    stepCount++;
    const variables = step.data?.variables || {};
    debugController.updateContext(step, stepCount, variables);

    // Stop after 10 steps for demo
    if (stepCount >= 10) break;
  }

  debugController.dispose();
}

/**
 * Demo: Hit Count Breakpoints
 */
export function demoHitCountBreakpoints() {
  console.log('\n=== Demo: Hit Count Breakpoints ===\n');

  const debugController = new DebugController();

  // Pause every 5th hit at step 1 (comparison steps)
  debugController.addHitCountBreakpoint(1, 5, '%');
  console.log('Added hit count breakpoint: pause every 5th comparison');

  // Run bubble sort
  const array = [64, 34, 25, 12, 22, 11, 90];
  const generator = bubbleSortWithDebug(array);

  let stepCount = 0;
  let hitCount = 0;

  for (const step of generator) {
    stepCount++;
    const variables = step.data?.variables || {};

    debugController.updateContext(step, stepCount, variables);

    const hit = debugController.shouldPause(1); // Check step 1
    if (hit) {
      hitCount++;
      console.log(`\nHit count breakpoint triggered (hit #${hitCount * 5})`);
      console.log(`  Comparisons: ${variables.comparisons}`);
      console.log(`  Current array: [${variables.arr}]`);

      if (hitCount >= 3) break; // Stop after 3 hits for demo
    }
  }

  debugController.dispose();
}

/**
 * Demo: Logpoints
 */
export function demoLogpoints() {
  console.log('\n=== Demo: Logpoints ===\n');

  const debugController = new DebugController();

  // Add logpoint (logs without pausing)
  debugController.addLogpoint(1, 'Comparison #{comparisons}: arr[{j}]={arr[j]} vs arr[{j+1}]={arr[j+1]}');
  console.log('Added logpoint at step 1\n');

  // Listen for log messages
  debugController.on('logpoint', (data) => {
    console.log(`[LOGPOINT] ${data.message}`);
  });

  // Run bubble sort
  const array = [5, 2, 8, 1];
  const generator = bubbleSortWithDebug(array);

  let stepCount = 0;
  for (const step of generator) {
    stepCount++;
    const variables = step.data?.variables || {};
    debugController.updateContext(step, stepCount, variables);

    // Log without pausing
    debugController.shouldPause(1);

    // Stop after 8 steps for demo
    if (stepCount >= 8) break;
  }

  debugController.dispose();
}

/**
 * Demo: Call Stack Tracking
 */
export function demoCallStackTracking() {
  console.log('\n=== Demo: Call Stack Tracking ===\n');

  const debugController = new DebugController({
    trackCallStack: true,
  });

  // Simulate nested function calls
  function outerSort(arr: number[]) {
    debugController.pushCallFrame('outerSort', 1, { arr: [...arr] });
    console.log('Entered outerSort');

    innerPartition(arr, 0, arr.length - 1);

    debugController.popCallFrame();
    console.log('Exited outerSort');
  }

  function innerPartition(arr: number[], low: number, high: number) {
    debugController.pushCallFrame('innerPartition', 5, { arr: [...arr], low, high });
    console.log('  Entered innerPartition');

    helperSwap(arr, low, high);

    debugController.popCallFrame();
    console.log('  Exited innerPartition');
  }

  function helperSwap(arr: number[], i: number, j: number) {
    debugController.pushCallFrame('helperSwap', 10, { arr: [...arr], i, j });
    console.log('    Entered helperSwap');

    // Print call stack
    const stack = debugController.getCallStack();
    console.log('\n    Call Stack:');
    stack.forEach((frame, idx) => {
      console.log(`      ${idx}. ${frame.name} (line ${frame.line})`);
    });

    debugController.popCallFrame();
    console.log('\n    Exited helperSwap');
  }

  outerSort([5, 2, 8]);

  debugController.dispose();
}

/**
 * Demo: Memory Snapshots
 */
export function demoMemorySnapshots() {
  console.log('\n=== Demo: Memory Snapshots ===\n');

  const debugController = new DebugController({
    autoSnapshot: true,
    snapshotInterval: 3, // Snapshot every 3 steps
  });

  // Run bubble sort
  const array = [5, 2, 8, 1, 9];
  const generator = bubbleSortWithDebug(array);

  let stepCount = 0;
  for (const step of generator) {
    stepCount++;
    const variables = step.data?.variables || {};
    debugController.updateContext(step, stepCount, variables);

    // Stop after 10 steps
    if (stepCount >= 10) break;
  }

  // Examine snapshots
  const snapshots = debugController.getSnapshots();
  console.log(`\nCreated ${snapshots.length} snapshots:`);

  snapshots.forEach((snapshot, idx) => {
    console.log(`\nSnapshot ${idx + 1} (Step ${snapshot.stepIndex}):`);
    console.log(`  Array: [${snapshot.variables.arr}]`);
    console.log(`  Swaps: ${snapshot.variables.swaps}`);
    console.log(`  Comparisons: ${snapshot.variables.comparisons}`);
  });

  debugController.dispose();
}

/**
 * Demo: Expression Evaluation
 */
export function demoExpressionEvaluation() {
  console.log('\n=== Demo: Expression Evaluation ===\n');

  const debugController = new DebugController();

  const step: ExecutionStep = {
    index: 1,
    description: 'Test',
    affectedNodes: [],
    status: 'active',
  };

  const variables = {
    i: 5,
    j: 10,
    arr: [1, 2, 3, 4, 5],
    threshold: 3,
  };

  debugController.updateContext(step, 1, variables);

  // Evaluate various expressions
  console.log('Variables:', variables);
  console.log('\nExpression Evaluation:');
  console.log(`  i + j = ${debugController.evaluateExpression('i + j')}`);
  console.log(`  arr.length = ${debugController.evaluateExpression('arr.length')}`);
  console.log(`  arr[2] = ${debugController.evaluateExpression('arr[2]')}`);
  console.log(`  Math.max(...arr) = ${debugController.evaluateExpression('Math.max(...arr)')}`);
  console.log(`  arr.filter(x => x > threshold).length = ${debugController.evaluateExpression('arr.filter(x => x > threshold).length')}`);

  debugController.dispose();
}

/**
 * Demo: Complete Debugging Workflow
 */
export function demoCompleteWorkflow() {
  console.log('\n=== Demo: Complete Debugging Workflow ===\n');

  const debugController = new DebugController({
    maxSnapshots: 100,
    autoSnapshot: true,
    snapshotInterval: 5,
    trackCallStack: true,
  });

  // Setup debugging
  debugController.addLineBreakpoint(15);
  debugController.addConditionalBreakpoint('swaps > 3');
  debugController.addWatch('comparisons', true);
  debugController.addWatch('swaps', true);
  debugController.addLogpoint(1, 'Step {comparisons}: comparing {arr[j]} and {arr[j+1]}');

  console.log('Debug Setup:');
  console.log('  - Line breakpoint at step 15');
  console.log('  - Conditional breakpoint: swaps > 3');
  console.log('  - Watches: comparisons, swaps');
  console.log('  - Logpoint at step 1\n');

  // Event listeners
  debugController.on('breakpointHit', (data) => {
    const ctx = data.context as DebugContext;
    console.log(`\n🔴 BREAKPOINT HIT`);
    console.log(`  Step: ${ctx.stepIndex}`);
    console.log(`  Description: ${ctx.step.description}`);
    console.log(`  Variables:`, ctx.variables);
  });

  debugController.on('watchTriggered', (data) => {
    console.log(`👁️  Watch "${data.watch.expression}": ${data.oldValue} -> ${data.newValue}`);
  });

  debugController.on('logpoint', (data) => {
    console.log(`📝 ${data.message}`);
  });

  // Run algorithm
  const array = [64, 34, 25, 12, 22];
  const generator = bubbleSortWithDebug(array);

  let stepCount = 0;
  for (const step of generator) {
    stepCount++;
    const variables = step.data?.variables || {};

    debugController.updateContext(step, stepCount, variables);

    const hit = debugController.shouldPause(stepCount);
    if (hit) {
      debugController.pause();
      break;
    }

    // Stop after 20 steps for demo
    if (stepCount >= 20) break;
  }

  console.log(`\nExecution paused. Created ${debugController.getSnapshotCount()} snapshots.`);

  debugController.dispose();
}

// Run all demos
if (require.main === module) {
  demoBasicBreakpoints();
  demoConditionalBreakpoints();
  demoWatchExpressions();
  demoHitCountBreakpoints();
  demoLogpoints();
  demoCallStackTracking();
  demoMemorySnapshots();
  demoExpressionEvaluation();
  demoCompleteWorkflow();
}
