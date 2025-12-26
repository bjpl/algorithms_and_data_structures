/**
 * @file SortingVisualizer Usage Examples
 * @module examples
 *
 * Demonstrates how to use the SortingVisualizer component for
 * visualizing various sorting algorithms with step-by-step animations.
 */

import { SortingVisualizer } from '../src/visualization/algorithms/SortingVisualizer';

// ============================================================================
// BASIC USAGE
// ============================================================================

/**
 * Example 1: Basic Bubble Sort Visualization
 */
function basicBubbleSortExample() {
  // Create visualizer with default configuration
  const visualizer = new SortingVisualizer({
    algorithm: 'bubble',
    data: [64, 34, 25, 12, 22, 11, 90],
  });

  // Generate all sorting steps
  const steps = visualizer.generateSteps();

  console.log(`Generated ${steps.length} steps for Bubble Sort`);
  console.log(`Comparisons: ${visualizer.getComparisons()}`);
  console.log(`Swaps: ${visualizer.getSwaps()}`);

  // Display complexity information
  const complexity = visualizer.getComplexity();
  console.log(`Time Complexity: ${complexity.time.average}`);
  console.log(`Space Complexity: ${complexity.space}`);
  console.log(`Stable: ${complexity.stable}`);
}

// ============================================================================
// CUSTOM CONFIGURATION
// ============================================================================

/**
 * Example 2: Quick Sort with Custom Colors
 */
function customQuickSortExample() {
  const visualizer = new SortingVisualizer({
    algorithm: 'quick',
    data: [38, 27, 43, 3, 9, 82, 10],
    barWidth: 50,
    barGap: 10,
    showValues: true,
    highlightColor: '#FF6B6B', // Red for comparisons
    sortedColor: '#51CF66',    // Green for sorted
    pivotColor: '#FFD93D',     // Yellow for pivot
    swapColor: '#FF6B9D',      // Pink for swaps
    defaultColor: '#4DABF7',   // Blue for default
  });

  const steps = visualizer.generateSteps();
  console.log(`Quick Sort: ${steps.length} steps generated`);

  // Find pivot steps
  const pivotSteps = steps.filter(step => step.action === 'pivot');
  console.log(`Number of pivot selections: ${pivotSteps.length}`);
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================

/**
 * Example 3: Animated Visualization with Delay
 */
async function animatedMergeSortExample() {
  const visualizer = new SortingVisualizer({
    algorithm: 'merge',
    data: [12, 11, 13, 5, 6, 7],
    barWidth: 60,
    showValues: true,
  });

  const steps = visualizer.generateSteps();

  // Helper function to delay execution
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Animate through steps with 500ms delay
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    visualizer.visualizeStep(step);

    console.log(`Step ${i + 1}/${steps.length}: ${step.description}`);

    // Display current visual state
    const elements = visualizer.getElements();
    const values = elements.map(el => el.value);
    const states = elements.map(el => el.state);

    console.log(`Values: [${values.join(', ')}]`);
    console.log(`States: [${states.join(', ')}]`);
    console.log('---');

    await sleep(500); // Wait 500ms before next step
  }

  console.log('Merge Sort animation complete!');
}

// ============================================================================
// SPEED CONTROL
// ============================================================================

/**
 * Example 4: Variable Speed Animation
 */
async function variableSpeedExample() {
  const visualizer = new SortingVisualizer({
    algorithm: 'insertion',
    data: [5, 2, 4, 6, 1, 3],
  });

  const steps = visualizer.generateSteps();
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Speed multipliers: 0.25x, 0.5x, 1x, 2x, 4x
  const speeds = [2000, 1000, 500, 250, 125]; // milliseconds per step
  let speedIndex = 2; // Start at 1x speed (500ms)

  console.log('Controls: Press [1-5] to change speed');
  console.log('1 = 0.25x, 2 = 0.5x, 3 = 1x, 4 = 2x, 5 = 4x');

  for (let i = 0; i < steps.length; i++) {
    visualizer.visualizeStep(steps[i]);

    console.log(`[${speedIndex + 1}x] ${steps[i].description}`);

    await sleep(speeds[speedIndex]);

    // Simulate speed change (in real app, this would be user input)
    if (i === Math.floor(steps.length / 3)) {
      speedIndex = 3; // Speed up to 2x
      console.log('>>> Speed changed to 2x');
    }
  }
}

// ============================================================================
// COMPARISON OF ALGORITHMS
// ============================================================================

/**
 * Example 5: Compare Performance of Different Algorithms
 */
function compareAlgorithms() {
  const testData = [64, 34, 25, 12, 22, 11, 90, 88, 45, 50];
  const algorithms = ['bubble', 'quick', 'merge', 'insertion', 'selection'] as const;

  console.log('Algorithm Performance Comparison');
  console.log('================================');

  algorithms.forEach(algorithm => {
    const visualizer = new SortingVisualizer({
      algorithm,
      data: [...testData], // Clone array for each test
    });

    const startTime = Date.now();
    const steps = visualizer.generateSteps();
    const duration = Date.now() - startTime;

    const complexity = visualizer.getComplexity();

    console.log(`\n${algorithm.toUpperCase()} SORT:`);
    console.log(`  Steps: ${steps.length}`);
    console.log(`  Comparisons: ${visualizer.getComparisons()}`);
    console.log(`  Swaps: ${visualizer.getSwaps()}`);
    console.log(`  Generation time: ${duration}ms`);
    console.log(`  Time complexity: ${complexity.time.average}`);
    console.log(`  Space complexity: ${complexity.space}`);
    console.log(`  Stable: ${complexity.stable}`);
    console.log(`  In-place: ${complexity.inPlace}`);
  });
}

// ============================================================================
// STEP-BY-STEP NAVIGATION
// ============================================================================

/**
 * Example 6: Manual Step Navigation
 */
function stepNavigationExample() {
  const visualizer = new SortingVisualizer({
    algorithm: 'selection',
    data: [29, 10, 14, 37, 13],
  });

  const steps = visualizer.generateSteps();
  let currentStepIndex = 0;

  // Helper to display current step
  const displayStep = (index: number) => {
    if (index < 0 || index >= steps.length) {
      console.log('No more steps');
      return;
    }

    visualizer.visualizeStep(steps[index]);
    const elements = visualizer.getElements();

    console.log(`\nStep ${index + 1}/${steps.length}`);
    console.log(`Action: ${steps[index].action}`);
    console.log(`Description: ${steps[index].description}`);
    console.log(`Values: [${elements.map(e => e.value).join(', ')}]`);
    console.log(`Comparisons so far: ${steps[index].metrics?.comparisons}`);
    console.log(`Swaps so far: ${steps[index].metrics?.swaps}`);
  };

  // Simulate navigation
  console.log('=== Step Navigation Demo ===');

  // Forward navigation
  for (let i = 0; i < 5 && i < steps.length; i++) {
    displayStep(i);
    currentStepIndex = i;
  }

  // Jump to specific step
  console.log('\n>>> Jumping to final step...');
  displayStep(steps.length - 1);
}

// ============================================================================
// LARGE DATASET VISUALIZATION
// ============================================================================

/**
 * Example 7: Handling Large Datasets
 */
function largeDatasetExample() {
  // Generate random dataset
  const size = 100;
  const largeData = Array.from({ length: size }, () =>
    Math.floor(Math.random() * 1000)
  );

  const visualizer = new SortingVisualizer({
    algorithm: 'quick',
    data: largeData,
    barWidth: 8,  // Smaller bars for more elements
    barGap: 1,     // Minimal gap
  });

  const startTime = Date.now();
  const steps = visualizer.generateSteps();
  const duration = Date.now() - startTime;

  console.log(`\nLarge Dataset (${size} elements):`);
  console.log(`  Algorithm: Quick Sort`);
  console.log(`  Total steps: ${steps.length}`);
  console.log(`  Generation time: ${duration}ms`);
  console.log(`  Comparisons: ${visualizer.getComparisons()}`);
  console.log(`  Swaps: ${visualizer.getSwaps()}`);
  console.log(`  Avg steps per element: ${(steps.length / size).toFixed(2)}`);
}

// ============================================================================
// RESET AND REPLAY
// ============================================================================

/**
 * Example 8: Reset and Replay Visualization
 */
async function resetAndReplayExample() {
  const visualizer = new SortingVisualizer({
    algorithm: 'bubble',
    data: [3, 1, 4, 1, 5, 9, 2, 6],
  });

  console.log('First run:');
  let steps = visualizer.generateSteps();
  console.log(`  Steps: ${steps.length}`);
  console.log(`  Final state: [${steps[steps.length - 1].state.join(', ')}]`);

  console.log('\nResetting visualizer...');
  visualizer.reset();
  console.log(`  Comparisons after reset: ${visualizer.getComparisons()}`);
  console.log(`  Swaps after reset: ${visualizer.getSwaps()}`);

  console.log('\nSecond run with same data:');
  steps = visualizer.generateSteps();
  console.log(`  Steps: ${steps.length}`);
  console.log(`  Final state: [${steps[steps.length - 1].state.join(', ')}]`);
}

// ============================================================================
// EDGE CASES
// ============================================================================

/**
 * Example 9: Edge Cases and Special Data
 */
function edgeCasesExample() {
  const testCases = [
    { name: 'Single element', data: [42] },
    { name: 'Two elements', data: [2, 1] },
    { name: 'Already sorted', data: [1, 2, 3, 4, 5] },
    { name: 'Reverse sorted', data: [5, 4, 3, 2, 1] },
    { name: 'All identical', data: [7, 7, 7, 7] },
    { name: 'With duplicates', data: [3, 1, 4, 1, 5, 9, 2, 6, 5] },
    { name: 'Negative numbers', data: [-5, -2, -8, -1, -9] },
    { name: 'Mixed signs', data: [3, -1, 4, -5, 2, 0] },
  ];

  console.log('Edge Cases Testing');
  console.log('==================\n');

  testCases.forEach(({ name, data }) => {
    const visualizer = new SortingVisualizer({
      algorithm: 'merge',
      data: [...data],
    });

    const steps = visualizer.generateSteps();
    const finalState = steps[steps.length - 1].state;

    console.log(`${name}:`);
    console.log(`  Input:  [${data.join(', ')}]`);
    console.log(`  Output: [${finalState.join(', ')}]`);
    console.log(`  Steps:  ${steps.length}`);
    console.log(`  Comparisons: ${visualizer.getComparisons()}\n`);
  });
}

// ============================================================================
// VISUAL ELEMENTS INSPECTION
// ============================================================================

/**
 * Example 10: Inspecting Visual Elements
 */
function visualElementsExample() {
  const visualizer = new SortingVisualizer({
    algorithm: 'quick',
    data: [40, 20, 60, 10, 50, 30],
    barWidth: 50,
    barGap: 5,
  });

  const steps = visualizer.generateSteps();

  // Find a pivot step
  const pivotStep = steps.find(s => s.action === 'pivot');
  if (pivotStep) {
    visualizer.visualizeStep(pivotStep);

    console.log('\nVisual Elements at Pivot Step:');
    console.log('==============================');

    const elements = visualizer.getElements();
    elements.forEach((el, i) => {
      console.log(`\nElement ${i}:`);
      console.log(`  Value: ${el.value}`);
      console.log(`  State: ${el.state}`);
      console.log(`  Color: ${el.visual.color}`);
      console.log(`  Position: (${el.visual.x}, ${el.visual.y})`);
      console.log(`  Size: ${el.visual.width}x${el.visual.height}`);
    });
  }
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

async function main() {
  console.log('SortingVisualizer Examples\n');
  console.log('==========================\n');

  console.log('\n--- Example 1: Basic Bubble Sort ---');
  basicBubbleSortExample();

  console.log('\n--- Example 2: Custom Quick Sort ---');
  customQuickSortExample();

  console.log('\n--- Example 3: Animated Merge Sort ---');
  // await animatedMergeSortExample(); // Uncomment to see animation

  console.log('\n--- Example 4: Variable Speed ---');
  // await variableSpeedExample(); // Uncomment to see variable speed

  console.log('\n--- Example 5: Algorithm Comparison ---');
  compareAlgorithms();

  console.log('\n--- Example 6: Step Navigation ---');
  stepNavigationExample();

  console.log('\n--- Example 7: Large Dataset ---');
  largeDatasetExample();

  console.log('\n--- Example 8: Reset and Replay ---');
  await resetAndReplayExample();

  console.log('\n--- Example 9: Edge Cases ---');
  edgeCasesExample();

  console.log('\n--- Example 10: Visual Elements ---');
  visualElementsExample();

  console.log('\n\nAll examples completed!');
}

// Run examples if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  basicBubbleSortExample,
  customQuickSortExample,
  animatedMergeSortExample,
  variableSpeedExample,
  compareAlgorithms,
  stepNavigationExample,
  largeDatasetExample,
  resetAndReplayExample,
  edgeCasesExample,
  visualElementsExample,
};
