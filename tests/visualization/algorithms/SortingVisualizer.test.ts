/**
 * @file Test Suite for SortingVisualizer
 * @module tests/visualization/algorithms
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SortingVisualizer,
  type SortingVisualizerConfig,
  type SortingStep,
  type SortingAlgorithm,
} from '../../../src/visualization/algorithms/SortingVisualizer';

describe('SortingVisualizer', () => {
  // Test data sets
  const testData = {
    small: [5, 2, 8, 1, 9],
    sorted: [1, 2, 3, 4, 5],
    reverse: [5, 4, 3, 2, 1],
    duplicates: [3, 1, 4, 1, 5, 9, 2, 6, 5],
    single: [42],
    two: [2, 1],
  };

  describe('Constructor', () => {
    it('should create visualizer with valid configuration', () => {
      const config: SortingVisualizerConfig = {
        algorithm: 'bubble',
        data: testData.small,
      };

      const visualizer = new SortingVisualizer(config);
      expect(visualizer).toBeDefined();
      expect(visualizer.getConfig()).toBeDefined();
    });

    it('should apply default configuration values', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'quick',
        data: testData.small,
      });

      const config = visualizer.getConfig();
      expect(config.barWidth).toBe(40);
      expect(config.barGap).toBe(4);
      expect(config.showValues).toBe(true);
      expect(config.highlightColor).toBe('#FFA500');
      expect(config.sortedColor).toBe('#4CAF50');
    });

    it('should accept custom configuration', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'merge',
        data: testData.small,
        barWidth: 50,
        barGap: 10,
        showValues: false,
        highlightColor: '#FF0000',
      });

      const config = visualizer.getConfig();
      expect(config.barWidth).toBe(50);
      expect(config.barGap).toBe(10);
      expect(config.showValues).toBe(false);
      expect(config.highlightColor).toBe('#FF0000');
    });

    it('should throw error for empty data array', () => {
      expect(() => {
        new SortingVisualizer({
          algorithm: 'bubble',
          data: [],
        });
      }).toThrow('Data array cannot be empty');
    });

    it('should throw error for invalid algorithm', () => {
      expect(() => {
        new SortingVisualizer({
          algorithm: 'invalid' as SortingAlgorithm,
          data: testData.small,
        });
      }).toThrow('Invalid algorithm');
    });

    it('should throw error for invalid bar width', () => {
      expect(() => {
        new SortingVisualizer({
          algorithm: 'bubble',
          data: testData.small,
          barWidth: 0,
        });
      }).toThrow('Bar width must be positive');
    });

    it('should throw error for negative bar gap', () => {
      expect(() => {
        new SortingVisualizer({
          algorithm: 'bubble',
          data: testData.small,
          barGap: -1,
        });
      }).toThrow('Bar gap cannot be negative');
    });
  });

  describe('generateSteps()', () => {
    it('should generate steps for bubble sort', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      const steps = visualizer.generateSteps();
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[steps.length - 1].action).toBe('complete');
    });

    it('should generate steps for quick sort', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'quick',
        data: testData.small,
      });

      const steps = visualizer.generateSteps();
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(s => s.action === 'pivot')).toBe(true);
    });

    it('should generate steps for merge sort', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'merge',
        data: testData.small,
      });

      const steps = visualizer.generateSteps();
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(s => s.action === 'merge')).toBe(true);
    });

    it('should generate steps for insertion sort', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'insertion',
        data: testData.small,
      });

      const steps = visualizer.generateSteps();
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(s => s.action === 'compare')).toBe(true);
    });

    it('should generate steps for selection sort', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'selection',
        data: testData.small,
      });

      const steps = visualizer.generateSteps();
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(s => s.action === 'swap')).toBe(true);
    });

    it('should correctly sort the data', () => {
      const algorithms: SortingAlgorithm[] = ['bubble', 'quick', 'merge', 'insertion', 'selection'];

      algorithms.forEach(algorithm => {
        const visualizer = new SortingVisualizer({
          algorithm,
          data: [...testData.small],
        });

        const steps = visualizer.generateSteps();
        const finalStep = steps[steps.length - 1];
        const sorted = [...testData.small].sort((a, b) => a - b);

        expect(finalStep.state).toEqual(sorted);
      });
    });

    it('should handle already sorted data', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.sorted,
      });

      const steps = visualizer.generateSteps();
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[steps.length - 1].state).toEqual(testData.sorted);
    });

    it('should handle reverse sorted data', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'quick',
        data: testData.reverse,
      });

      const steps = visualizer.generateSteps();
      const finalStep = steps[steps.length - 1];
      expect(finalStep.state).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle duplicates correctly', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'merge',
        data: testData.duplicates,
      });

      const steps = visualizer.generateSteps();
      const finalStep = steps[steps.length - 1];
      const sorted = [...testData.duplicates].sort((a, b) => a - b);
      expect(finalStep.state).toEqual(sorted);
    });

    it('should handle single element', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.single,
      });

      const steps = visualizer.generateSteps();
      expect(steps[steps.length - 1].state).toEqual(testData.single);
    });

    it('should handle two elements', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'quick',
        data: testData.two,
      });

      const steps = visualizer.generateSteps();
      expect(steps[steps.length - 1].state).toEqual([1, 2]);
    });
  });

  describe('visualizeStep()', () => {
    it('should update visual elements for a step', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      const steps = visualizer.generateSteps();
      visualizer.visualizeStep(steps[0]);

      const elements = visualizer.getElements();
      expect(elements.length).toBe(testData.small.length);
      expect(elements[0]).toHaveProperty('value');
      expect(elements[0]).toHaveProperty('state');
      expect(elements[0]).toHaveProperty('visual');
    });

    it('should reflect correct element states', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      const steps = visualizer.generateSteps();
      const compareStep = steps.find(s => s.action === 'compare');

      if (compareStep) {
        visualizer.visualizeStep(compareStep);
        const elements = visualizer.getElements();

        // At least some elements should be in comparing state
        const comparingElements = elements.filter(e => e.state === 'comparing');
        expect(comparingElements.length).toBeGreaterThan(0);
      }
    });

    it('should apply correct colors for states', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'quick',
        data: testData.small,
        pivotColor: '#FF0000',
        sortedColor: '#00FF00',
      });

      const steps = visualizer.generateSteps();
      const pivotStep = steps.find(s => s.action === 'pivot');

      if (pivotStep) {
        visualizer.visualizeStep(pivotStep);
        const elements = visualizer.getElements();
        const pivotElements = elements.filter(e => e.state === 'pivot');

        pivotElements.forEach(el => {
          expect(el.visual.color).toBe('#FF0000');
        });
      }
    });

    it('should maintain correct visual dimensions', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
        barWidth: 60,
        barGap: 8,
      });

      const steps = visualizer.generateSteps();
      visualizer.visualizeStep(steps[0]);

      const elements = visualizer.getElements();
      elements.forEach((el, i) => {
        expect(el.visual.width).toBe(60);
        expect(el.visual.x).toBe(i * 68); // barWidth + barGap
      });
    });
  });

  describe('getComparisons() and getSwaps()', () => {
    it('should track comparisons for bubble sort', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      visualizer.generateSteps();
      const comparisons = visualizer.getComparisons();
      expect(comparisons).toBeGreaterThan(0);
    });

    it('should track swaps for bubble sort', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.reverse,
      });

      visualizer.generateSteps();
      const swaps = visualizer.getSwaps();
      expect(swaps).toBeGreaterThan(0);
    });

    it('should have zero swaps for already sorted data', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.sorted,
      });

      visualizer.generateSteps();
      const swaps = visualizer.getSwaps();
      expect(swaps).toBe(0);
    });

    it('should track metrics for all algorithms', () => {
      const algorithms: SortingAlgorithm[] = ['bubble', 'quick', 'merge', 'insertion', 'selection'];

      algorithms.forEach(algorithm => {
        const visualizer = new SortingVisualizer({
          algorithm,
          data: [...testData.small],
        });

        visualizer.generateSteps();
        expect(visualizer.getComparisons()).toBeGreaterThanOrEqual(0);
        expect(visualizer.getSwaps()).toBeGreaterThanOrEqual(0);
      });
    });

    it('should include metrics in steps', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      const steps = visualizer.generateSteps();
      const lastStep = steps[steps.length - 2]; // Before complete step

      expect(lastStep.metrics).toBeDefined();
      expect(lastStep.metrics!.comparisons).toBeGreaterThan(0);
    });
  });

  describe('getComplexity()', () => {
    it('should return correct complexity for bubble sort', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      const complexity = visualizer.getComplexity();
      expect(complexity.time.best).toBe('O(n)');
      expect(complexity.time.average).toBe('O(n²)');
      expect(complexity.time.worst).toBe('O(n²)');
      expect(complexity.space).toBe('O(1)');
      expect(complexity.stable).toBe(true);
      expect(complexity.inPlace).toBe(true);
    });

    it('should return correct complexity for quick sort', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'quick',
        data: testData.small,
      });

      const complexity = visualizer.getComplexity();
      expect(complexity.time.average).toBe('O(n log n)');
      expect(complexity.space).toBe('O(log n)');
      expect(complexity.stable).toBe(false);
      expect(complexity.inPlace).toBe(true);
    });

    it('should return correct complexity for merge sort', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'merge',
        data: testData.small,
      });

      const complexity = visualizer.getComplexity();
      expect(complexity.time.best).toBe('O(n log n)');
      expect(complexity.time.average).toBe('O(n log n)');
      expect(complexity.time.worst).toBe('O(n log n)');
      expect(complexity.space).toBe('O(n)');
      expect(complexity.stable).toBe(true);
      expect(complexity.inPlace).toBe(false);
    });

    it('should return correct complexity for insertion sort', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'insertion',
        data: testData.small,
      });

      const complexity = visualizer.getComplexity();
      expect(complexity.time.best).toBe('O(n)');
      expect(complexity.stable).toBe(true);
      expect(complexity.inPlace).toBe(true);
    });

    it('should return correct complexity for selection sort', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'selection',
        data: testData.small,
      });

      const complexity = visualizer.getComplexity();
      expect(complexity.time.best).toBe('O(n²)');
      expect(complexity.stable).toBe(false);
      expect(complexity.inPlace).toBe(true);
    });
  });

  describe('getElements()', () => {
    it('should return all visual elements', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      const elements = visualizer.getElements();
      expect(elements).toHaveLength(testData.small.length);
    });

    it('should return elements with correct structure', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      const elements = visualizer.getElements();
      const element = elements[0];

      expect(element).toHaveProperty('value');
      expect(element).toHaveProperty('index');
      expect(element).toHaveProperty('state');
      expect(element).toHaveProperty('visual');
      expect(element.visual).toHaveProperty('x');
      expect(element.visual).toHaveProperty('y');
      expect(element.visual).toHaveProperty('width');
      expect(element.visual).toHaveProperty('height');
      expect(element.visual).toHaveProperty('color');
    });

    it('should scale bar heights proportionally', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: [10, 20, 30],
      });

      const elements = visualizer.getElements();
      const heights = elements.map(e => e.visual.height);

      // Heights should be proportional to values
      expect(heights[1]).toBe(heights[0] * 2);
      expect(heights[2]).toBe(heights[0] * 3);
    });
  });

  describe('reset()', () => {
    it('should reset to initial state', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      visualizer.generateSteps();
      const comparisons1 = visualizer.getComparisons();
      const swaps1 = visualizer.getSwaps();

      visualizer.reset();

      expect(visualizer.getComparisons()).toBe(0);
      expect(visualizer.getSwaps()).toBe(0);
    });

    it('should allow regenerating steps after reset', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'quick',
        data: testData.small,
      });

      const steps1 = visualizer.generateSteps();
      visualizer.reset();
      const steps2 = visualizer.generateSteps();

      expect(steps2.length).toBe(steps1.length);
    });

    it('should reset visual elements', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      visualizer.generateSteps();
      visualizer.reset();

      const elements = visualizer.getElements();
      elements.forEach(el => {
        expect(el.state).toBe('default');
      });
    });
  });

  describe('Step Structure', () => {
    it('should include all required properties in steps', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      const steps = visualizer.generateSteps();
      const step = steps[0];

      expect(step).toHaveProperty('action');
      expect(step).toHaveProperty('description');
      expect(step).toHaveProperty('indices');
      expect(step).toHaveProperty('state');
      expect(step).toHaveProperty('elements');
      expect(step).toHaveProperty('metrics');
    });

    it('should have valid descriptions', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      const steps = visualizer.generateSteps();
      steps.forEach(step => {
        expect(step.description).toBeTruthy();
        expect(typeof step.description).toBe('string');
      });
    });

    it('should have valid indices', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      const steps = visualizer.generateSteps();
      steps.forEach(step => {
        expect(Array.isArray(step.indices)).toBe(true);
        step.indices.forEach(idx => {
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(testData.small.length);
        });
      });
    });

    it('should maintain array integrity in state snapshots', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: testData.small,
      });

      const steps = visualizer.generateSteps();
      steps.forEach(step => {
        expect(Array.isArray(step.state)).toBe(true);
        expect(step.state.length).toBe(testData.small.length);
      });
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000));

      const visualizer = new SortingVisualizer({
        algorithm: 'quick',
        data: largeData,
      });

      const startTime = Date.now();
      visualizer.generateSteps();
      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    it('should not exceed maximum step limit for algorithms', () => {
      const visualizer = new SortingVisualizer({
        algorithm: 'bubble',
        data: Array.from({ length: 50 }, (_, i) => 50 - i),
      });

      const steps = visualizer.generateSteps();
      // Should not generate excessive steps
      expect(steps.length).toBeLessThan(10000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all identical elements', () => {
      const identical = [5, 5, 5, 5, 5];
      const visualizer = new SortingVisualizer({
        algorithm: 'merge',
        data: identical,
      });

      const steps = visualizer.generateSteps();
      expect(steps[steps.length - 1].state).toEqual(identical);
    });

    it('should handle negative numbers', () => {
      const negative = [-5, -2, -8, -1, -9];
      const visualizer = new SortingVisualizer({
        algorithm: 'quick',
        data: negative,
      });

      const steps = visualizer.generateSteps();
      const sorted = [-9, -8, -5, -2, -1];
      expect(steps[steps.length - 1].state).toEqual(sorted);
    });

    it('should handle mixed positive and negative numbers', () => {
      const mixed = [3, -1, 4, -5, 2, 0];
      const visualizer = new SortingVisualizer({
        algorithm: 'merge',
        data: mixed,
      });

      const steps = visualizer.generateSteps();
      const sorted = [-5, -1, 0, 2, 3, 4];
      expect(steps[steps.length - 1].state).toEqual(sorted);
    });
  });
});
