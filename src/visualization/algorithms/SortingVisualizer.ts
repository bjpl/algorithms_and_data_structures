/**
 * @file SortingVisualizer - Step-by-step visualization of sorting algorithms
 * @module visualization/algorithms
 *
 * Production-ready component for visualizing common sorting algorithms with
 * animations, step-by-step execution, and performance metrics.
 *
 * Supports: BubbleSort, QuickSort, MergeSort, InsertionSort, SelectionSort
 *
 * @example
 * ```typescript
 * const visualizer = new SortingVisualizer({
 *   algorithm: 'quick',
 *   data: [64, 34, 25, 12, 22, 11, 90],
 *   barWidth: 40,
 *   showValues: true
 * });
 *
 * const steps = visualizer.generateSteps();
 * await visualizer.visualizeStep(steps[0]);
 * console.log(visualizer.getComparisons()); // 15
 * console.log(visualizer.getComplexity()); // { time: 'O(n log n)', space: 'O(log n)' }
 * ```
 */

import type { ExecutionStep } from '../core/AlgorithmExecutor';
import { AlgorithmExecutor } from '../core/AlgorithmExecutor';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Supported sorting algorithms
 */
export type SortingAlgorithm = 'bubble' | 'quick' | 'merge' | 'insertion' | 'selection';

/**
 * Visual state for array elements during sorting
 */
export type ElementState = 'default' | 'comparing' | 'swapping' | 'sorted' | 'pivot';

/**
 * Configuration for SortingVisualizer
 */
export interface SortingVisualizerConfig {
  /** Sorting algorithm to use */
  algorithm: SortingAlgorithm;

  /** Array data to sort */
  data: number[];

  /** Width of each bar in pixels (default: 40) */
  barWidth?: number;

  /** Gap between bars in pixels (default: 4) */
  barGap?: number;

  /** Show numeric values on bars (default: true) */
  showValues?: boolean;

  /** Color for highlighting comparisons (default: '#FFA500') */
  highlightColor?: string;

  /** Color for sorted elements (default: '#4CAF50') */
  sortedColor?: string;

  /** Color for pivot element (default: '#FF5722') */
  pivotColor?: string;

  /** Color for swap operations (default: '#E91E63') */
  swapColor?: string;

  /** Default bar color (default: '#2196F3') */
  defaultColor?: string;
}

/**
 * Visual element representing one array item
 */
export interface VisualElement {
  /** Element value */
  value: number;

  /** Array index */
  index: number;

  /** Current visual state */
  state: ElementState;

  /** Visual properties for rendering */
  visual: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  };
}

/**
 * Sorting step with visualization metadata
 */
export interface SortingStep extends ExecutionStep {
  /** Type of operation */
  action: 'compare' | 'swap' | 'pivot' | 'sorted' | 'merge' | 'complete';

  /** Indices involved in this step */
  indices: number[];

  /** Current array state */
  state: number[];

  /** Elements with visual states */
  elements: VisualElement[];

  /** Performance metrics */
  metrics?: {
    comparisons: number;
    swaps: number;
  };
}

/**
 * Complexity information for algorithms
 */
export interface ComplexityInfo {
  /** Time complexity */
  time: {
    best: string;
    average: string;
    worst: string;
  };

  /** Space complexity */
  space: string;

  /** Stability */
  stable: boolean;

  /** In-place sorting */
  inPlace: boolean;
}

// ============================================================================
// SORTING VISUALIZER CLASS
// ============================================================================

/**
 * SortingVisualizer - Visualizes sorting algorithms with step-by-step animations
 *
 * This class generates execution steps for various sorting algorithms and provides
 * methods to visualize each step with appropriate visual states and animations.
 *
 * Features:
 * - Five sorting algorithms with full visualization support
 * - Performance metrics tracking (comparisons, swaps)
 * - Configurable visual appearance
 * - Integration with AlgorithmExecutor for step management
 * - Complexity analysis for each algorithm
 *
 * @example
 * ```typescript
 * const visualizer = new SortingVisualizer({
 *   algorithm: 'merge',
 *   data: [38, 27, 43, 3, 9, 82, 10],
 *   barWidth: 50,
 *   showValues: true,
 *   highlightColor: '#FF6B6B'
 * });
 *
 * const steps = visualizer.generateSteps();
 * for (const step of steps) {
 *   await visualizer.visualizeStep(step);
 *   await sleep(500); // Animate with delay
 * }
 * ```
 */
export class SortingVisualizer {
  private config: Required<SortingVisualizerConfig>;
  private executor: AlgorithmExecutor;
  private steps: SortingStep[] = [];
  private currentData: number[];
  private comparisons = 0;
  private swaps = 0;
  private currentElements: VisualElement[] = [];

  /**
   * Creates a new SortingVisualizer instance
   *
   * @param config - Configuration options for the visualizer
   * @throws {Error} If data array is empty or algorithm is invalid
   */
  constructor(config: SortingVisualizerConfig) {
    // Validate configuration
    this.validateConfig(config);

    // Set defaults and store config
    this.config = {
      barWidth: 40,
      barGap: 4,
      showValues: true,
      highlightColor: '#FFA500',
      sortedColor: '#4CAF50',
      pivotColor: '#FF5722',
      swapColor: '#E91E63',
      defaultColor: '#2196F3',
      ...config,
    };

    // Initialize state
    this.currentData = [...config.data];
    this.executor = new AlgorithmExecutor({
      maxSteps: 100000,
      autoSnapshot: true,
      trackVariables: true,
    });

    // Initialize visual elements
    this.initializeElements();
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Generate all sorting steps for the configured algorithm
   *
   * This method executes the sorting algorithm and captures each step
   * for visualization purposes.
   *
   * @returns Array of sorting steps with visualization metadata
   *
   * @example
   * ```typescript
   * const steps = visualizer.generateSteps();
   * console.log(`Generated ${steps.length} steps`);
   * ```
   */
  public generateSteps(): SortingStep[] {
    this.reset();

    switch (this.config.algorithm) {
      case 'bubble':
        this.bubbleSort();
        break;
      case 'quick':
        this.quickSort(0, this.currentData.length - 1);
        break;
      case 'merge':
        this.mergeSort(0, this.currentData.length - 1);
        break;
      case 'insertion':
        this.insertionSort();
        break;
      case 'selection':
        this.selectionSort();
        break;
      default:
        throw new Error(`Unknown algorithm: ${this.config.algorithm}`);
    }

    // Add final completion step
    this.addStep({
      action: 'complete',
      description: 'Sorting complete',
      indices: Array.from({ length: this.currentData.length }, (_, i) => i),
      state: [...this.currentData],
      elements: this.currentElements.map((el, i) => ({
        ...el,
        state: 'sorted',
        visual: {
          ...el.visual,
          color: this.config.sortedColor,
        },
      })),
    });

    return this.steps;
  }

  /**
   * Visualize a specific sorting step
   *
   * Updates the visual elements to reflect the state of the given step.
   * This method can be called repeatedly to animate through the sorting process.
   *
   * @param step - The sorting step to visualize
   *
   * @example
   * ```typescript
   * const steps = visualizer.generateSteps();
   * await visualizer.visualizeStep(steps[5]);
   * ```
   */
  public visualizeStep(step: SortingStep): void {
    this.currentElements = step.elements.map(el => ({ ...el }));
  }

  /**
   * Get the total number of comparisons performed
   *
   * @returns Total comparison count
   */
  public getComparisons(): number {
    return this.comparisons;
  }

  /**
   * Get the total number of swaps performed
   *
   * @returns Total swap count
   */
  public getSwaps(): number {
    return this.swaps;
  }

  /**
   * Get complexity information for the current algorithm
   *
   * @returns Time and space complexity details
   *
   * @example
   * ```typescript
   * const info = visualizer.getComplexity();
   * console.log(`Best case: ${info.time.best}`);
   * console.log(`Stable: ${info.stable}`);
   * ```
   */
  public getComplexity(): ComplexityInfo {
    const complexities: Record<SortingAlgorithm, ComplexityInfo> = {
      bubble: {
        time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
        space: 'O(1)',
        stable: true,
        inPlace: true,
      },
      insertion: {
        time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
        space: 'O(1)',
        stable: true,
        inPlace: true,
      },
      selection: {
        time: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
        space: 'O(1)',
        stable: false,
        inPlace: true,
      },
      merge: {
        time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
        space: 'O(n)',
        stable: true,
        inPlace: false,
      },
      quick: {
        time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
        space: 'O(log n)',
        stable: false,
        inPlace: true,
      },
    };

    return complexities[this.config.algorithm];
  }

  /**
   * Get current visual elements
   *
   * @returns Array of visual elements with current states
   */
  public getElements(): VisualElement[] {
    return [...this.currentElements];
  }

  /**
   * Get the current configuration
   *
   * @returns Current visualizer configuration
   */
  public getConfig(): Required<SortingVisualizerConfig> {
    return { ...this.config };
  }

  /**
   * Reset the visualizer to initial state
   */
  public reset(): void {
    this.currentData = [...this.config.data];
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.initializeElements();
  }

  // ==========================================================================
  // SORTING ALGORITHMS
  // ==========================================================================

  /**
   * Bubble Sort implementation with step generation
   *
   * Time: O(n²), Space: O(1), Stable: Yes
   */
  private bubbleSort(): void {
    const n = this.currentData.length;

    for (let i = 0; i < n - 1; i++) {
      let swapped = false;

      for (let j = 0; j < n - i - 1; j++) {
        // Compare step
        this.addStep({
          action: 'compare',
          description: `Compare ${this.currentData[j]} and ${this.currentData[j + 1]}`,
          indices: [j, j + 1],
          state: [...this.currentData],
          elements: this.createElements([j, j + 1], 'comparing'),
        });
        this.comparisons++;

        if (this.currentData[j] > this.currentData[j + 1]) {
          // Swap step
          this.addStep({
            action: 'swap',
            description: `Swap ${this.currentData[j]} and ${this.currentData[j + 1]}`,
            indices: [j, j + 1],
            state: [...this.currentData],
            elements: this.createElements([j, j + 1], 'swapping'),
          });

          this.swap(j, j + 1);
          swapped = true;
        }
      }

      // Mark last element as sorted
      this.addStep({
        action: 'sorted',
        description: `Element at index ${n - i - 1} is now sorted`,
        indices: [n - i - 1],
        state: [...this.currentData],
        elements: this.createElements([n - i - 1], 'sorted'),
      });

      if (!swapped) break;
    }
  }

  /**
   * Quick Sort implementation with step generation
   *
   * Time: O(n log n) average, Space: O(log n), Stable: No
   */
  private quickSort(low: number, high: number): void {
    if (low < high) {
      const pivotIndex = this.partition(low, high);
      this.quickSort(low, pivotIndex - 1);
      this.quickSort(pivotIndex + 1, high);
    } else if (low === high) {
      // Single element is sorted
      this.addStep({
        action: 'sorted',
        description: `Element at index ${low} is sorted`,
        indices: [low],
        state: [...this.currentData],
        elements: this.createElements([low], 'sorted'),
      });
    }
  }

  /**
   * Partition helper for QuickSort
   */
  private partition(low: number, high: number): number {
    const pivot = this.currentData[high];

    // Mark pivot
    this.addStep({
      action: 'pivot',
      description: `Pivot: ${pivot} at index ${high}`,
      indices: [high],
      state: [...this.currentData],
      elements: this.createElements([high], 'pivot'),
    });

    let i = low - 1;

    for (let j = low; j < high; j++) {
      // Compare with pivot
      this.addStep({
        action: 'compare',
        description: `Compare ${this.currentData[j]} with pivot ${pivot}`,
        indices: [j, high],
        state: [...this.currentData],
        elements: this.createElements([j, high], 'comparing', { [high]: 'pivot' }),
      });
      this.comparisons++;

      if (this.currentData[j] < pivot) {
        i++;
        if (i !== j) {
          this.addStep({
            action: 'swap',
            description: `Swap ${this.currentData[i]} and ${this.currentData[j]}`,
            indices: [i, j],
            state: [...this.currentData],
            elements: this.createElements([i, j, high], 'swapping', { [high]: 'pivot' }),
          });
          this.swap(i, j);
        }
      }
    }

    // Place pivot in correct position
    this.addStep({
      action: 'swap',
      description: `Place pivot ${pivot} at correct position ${i + 1}`,
      indices: [i + 1, high],
      state: [...this.currentData],
      elements: this.createElements([i + 1, high], 'swapping'),
    });
    this.swap(i + 1, high);

    // Mark pivot as sorted
    this.addStep({
      action: 'sorted',
      description: `Pivot ${pivot} is now sorted at index ${i + 1}`,
      indices: [i + 1],
      state: [...this.currentData],
      elements: this.createElements([i + 1], 'sorted'),
    });

    return i + 1;
  }

  /**
   * Merge Sort implementation with step generation
   *
   * Time: O(n log n), Space: O(n), Stable: Yes
   */
  private mergeSort(left: number, right: number): void {
    if (left < right) {
      const mid = Math.floor((left + right) / 2);

      this.mergeSort(left, mid);
      this.mergeSort(mid + 1, right);
      this.merge(left, mid, right);
    } else if (left === right) {
      this.addStep({
        action: 'sorted',
        description: `Single element at ${left} is sorted`,
        indices: [left],
        state: [...this.currentData],
        elements: this.createElements([left], 'sorted'),
      });
    }
  }

  /**
   * Merge helper for MergeSort
   */
  private merge(left: number, mid: number, right: number): void {
    const leftArr = this.currentData.slice(left, mid + 1);
    const rightArr = this.currentData.slice(mid + 1, right + 1);

    let i = 0, j = 0, k = left;

    while (i < leftArr.length && j < rightArr.length) {
      this.addStep({
        action: 'compare',
        description: `Compare ${leftArr[i]} and ${rightArr[j]}`,
        indices: [k, k + 1],
        state: [...this.currentData],
        elements: this.createElements([k, k + 1], 'comparing'),
      });
      this.comparisons++;

      if (leftArr[i] <= rightArr[j]) {
        this.currentData[k] = leftArr[i];
        i++;
      } else {
        this.currentData[k] = rightArr[j];
        j++;
      }

      this.addStep({
        action: 'merge',
        description: `Merge value ${this.currentData[k]} at index ${k}`,
        indices: [k],
        state: [...this.currentData],
        elements: this.createElements([k], 'swapping'),
      });
      k++;
    }

    while (i < leftArr.length) {
      this.currentData[k] = leftArr[i];
      this.addStep({
        action: 'merge',
        description: `Copy remaining ${this.currentData[k]} to index ${k}`,
        indices: [k],
        state: [...this.currentData],
        elements: this.createElements([k], 'swapping'),
      });
      i++;
      k++;
    }

    while (j < rightArr.length) {
      this.currentData[k] = rightArr[j];
      this.addStep({
        action: 'merge',
        description: `Copy remaining ${this.currentData[k]} to index ${k}`,
        indices: [k],
        state: [...this.currentData],
        elements: this.createElements([k], 'swapping'),
      });
      j++;
      k++;
    }

    // Mark merged range as sorted
    const indices = Array.from({ length: right - left + 1 }, (_, i) => left + i);
    this.addStep({
      action: 'sorted',
      description: `Merged range [${left}, ${right}] is sorted`,
      indices,
      state: [...this.currentData],
      elements: this.createElements(indices, 'sorted'),
    });
  }

  /**
   * Insertion Sort implementation with step generation
   *
   * Time: O(n²), Space: O(1), Stable: Yes
   */
  private insertionSort(): void {
    const n = this.currentData.length;

    for (let i = 1; i < n; i++) {
      const key = this.currentData[i];
      let j = i - 1;

      this.addStep({
        action: 'pivot',
        description: `Select ${key} at index ${i} to insert`,
        indices: [i],
        state: [...this.currentData],
        elements: this.createElements([i], 'pivot'),
      });

      while (j >= 0) {
        this.addStep({
          action: 'compare',
          description: `Compare ${this.currentData[j]} with ${key}`,
          indices: [j, i],
          state: [...this.currentData],
          elements: this.createElements([j, i], 'comparing', { [i]: 'pivot' }),
        });
        this.comparisons++;

        if (this.currentData[j] > key) {
          this.addStep({
            action: 'swap',
            description: `Shift ${this.currentData[j]} to the right`,
            indices: [j, j + 1],
            state: [...this.currentData],
            elements: this.createElements([j, j + 1], 'swapping'),
          });
          this.currentData[j + 1] = this.currentData[j];
          this.swaps++;
          j--;
        } else {
          break;
        }
      }

      this.currentData[j + 1] = key;
      this.addStep({
        action: 'sorted',
        description: `Insert ${key} at position ${j + 1}`,
        indices: [j + 1],
        state: [...this.currentData],
        elements: this.createElements([j + 1], 'sorted'),
      });
    }
  }

  /**
   * Selection Sort implementation with step generation
   *
   * Time: O(n²), Space: O(1), Stable: No
   */
  private selectionSort(): void {
    const n = this.currentData.length;

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;

      this.addStep({
        action: 'pivot',
        description: `Start finding minimum from index ${i}`,
        indices: [i],
        state: [...this.currentData],
        elements: this.createElements([i], 'pivot'),
      });

      for (let j = i + 1; j < n; j++) {
        this.addStep({
          action: 'compare',
          description: `Compare ${this.currentData[j]} with current min ${this.currentData[minIdx]}`,
          indices: [j, minIdx],
          state: [...this.currentData],
          elements: this.createElements([j, minIdx], 'comparing', { [minIdx]: 'pivot' }),
        });
        this.comparisons++;

        if (this.currentData[j] < this.currentData[minIdx]) {
          minIdx = j;
        }
      }

      if (minIdx !== i) {
        this.addStep({
          action: 'swap',
          description: `Swap minimum ${this.currentData[minIdx]} with ${this.currentData[i]}`,
          indices: [i, minIdx],
          state: [...this.currentData],
          elements: this.createElements([i, minIdx], 'swapping'),
        });
        this.swap(i, minIdx);
      }

      this.addStep({
        action: 'sorted',
        description: `Element at index ${i} is now sorted`,
        indices: [i],
        state: [...this.currentData],
        elements: this.createElements([i], 'sorted'),
      });
    }

    // Last element is automatically sorted
    this.addStep({
      action: 'sorted',
      description: `Last element is sorted`,
      indices: [n - 1],
      state: [...this.currentData],
      elements: this.createElements([n - 1], 'sorted'),
    });
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Swap two elements in the array
   */
  private swap(i: number, j: number): void {
    const temp = this.currentData[i];
    this.currentData[i] = this.currentData[j];
    this.currentData[j] = temp;
    this.swaps++;
  }

  /**
   * Add a step to the steps array
   */
  private addStep(step: Omit<SortingStep, 'metrics'>): void {
    this.steps.push({
      ...step,
      metrics: {
        comparisons: this.comparisons,
        swaps: this.swaps,
      },
    });
  }

  /**
   * Initialize visual elements from data
   */
  private initializeElements(): void {
    const maxValue = Math.max(...this.currentData);
    const { barWidth, barGap } = this.config;

    this.currentElements = this.currentData.map((value, index) => ({
      value,
      index,
      state: 'default' as ElementState,
      visual: {
        x: index * (barWidth + barGap),
        y: 0,
        width: barWidth,
        height: (value / maxValue) * 300, // Scale to max height of 300px
        color: this.config.defaultColor,
      },
    }));
  }

  /**
   * Create visual elements with specified states
   */
  private createElements(
    indices: number[],
    defaultState: ElementState,
    customStates?: Record<number, ElementState>
  ): VisualElement[] {
    const maxValue = Math.max(...this.currentData);
    const { barWidth, barGap } = this.config;
    const indexSet = new Set(indices);

    return this.currentData.map((value, index) => {
      const state = customStates?.[index] || (indexSet.has(index) ? defaultState : 'default');
      const color = this.getColorForState(state);

      return {
        value,
        index,
        state,
        visual: {
          x: index * (barWidth + barGap),
          y: 0,
          width: barWidth,
          height: (value / maxValue) * 300,
          color,
        },
      };
    });
  }

  /**
   * Get color for a given element state
   */
  private getColorForState(state: ElementState): string {
    const colorMap: Record<ElementState, string> = {
      default: this.config.defaultColor,
      comparing: this.config.highlightColor,
      swapping: this.config.swapColor,
      sorted: this.config.sortedColor,
      pivot: this.config.pivotColor,
    };

    return colorMap[state];
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: SortingVisualizerConfig): void {
    if (!config.data || config.data.length === 0) {
      throw new Error('Data array cannot be empty');
    }

    const validAlgorithms: SortingAlgorithm[] = ['bubble', 'quick', 'merge', 'insertion', 'selection'];
    if (!validAlgorithms.includes(config.algorithm)) {
      throw new Error(`Invalid algorithm: ${config.algorithm}. Must be one of: ${validAlgorithms.join(', ')}`);
    }

    if (config.barWidth !== undefined && config.barWidth <= 0) {
      throw new Error('Bar width must be positive');
    }

    if (config.barGap !== undefined && config.barGap < 0) {
      throw new Error('Bar gap cannot be negative');
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SortingVisualizer;
