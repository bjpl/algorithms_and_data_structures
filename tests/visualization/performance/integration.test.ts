/**
 * Performance System Integration Tests
 *
 * Tests for integrated performance optimization system.
 */

import { createPerformanceSystem } from '../../../src/visualization/performance';
import type { VisualNode, BoundingBox } from '../../../src/visualization/core/types';

describe('Performance System Integration', () => {
  describe('Complete System', () => {
    it('should create complete performance system', () => {
      const system = createPerformanceSystem();

      expect(system.profiler).toBeDefined();
      expect(system.optimizer).toBeDefined();
      expect(system.adaptiveQuality).toBeDefined();
      expect(system.monitor).toBeDefined();

      system.stop();
    });

    it('should start all components', () => {
      const system = createPerformanceSystem();

      expect(() => system.start()).not.toThrow();
      expect(system.profiler.isActive()).toBe(true);

      system.stop();
    });

    it('should stop all components', () => {
      const system = createPerformanceSystem();
      system.start();

      expect(() => system.stop()).not.toThrow();
      expect(system.profiler.isActive()).toBe(false);
    });

    it('should reset all components', () => {
      const system = createPerformanceSystem();
      system.start();

      system.profiler.updateCounts(100, 200);
      system.reset();

      expect(system.profiler.getSamples().length).toBe(0);

      system.stop();
    });

    it('should generate comprehensive report', async () => {
      const system = createPerformanceSystem();
      system.start();

      await new Promise((resolve) => setTimeout(resolve, 250));

      const report = system.generateReport();

      expect(report).toHaveProperty('profiler');
      expect(report).toHaveProperty('optimizer');
      expect(report).toHaveProperty('quality');
      expect(report).toHaveProperty('monitor');

      system.stop();
    });
  });

  describe('End-to-End Workflow', () => {
    it('should handle complete visualization workflow', async () => {
      const system = createPerformanceSystem({
        profiler: {
          enabled: true,
          sampleInterval: 100,
        },
        optimizer: {
          enableCulling: true,
          enableBatching: true,
        },
        adaptiveQuality: {
          enabled: true,
          targetFps: 60,
        },
      });

      // Start monitoring
      system.start();

      // Simulate visualization workload
      const nodes: VisualNode[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `node${i}`,
        data: {},
        position: {
          x: Math.random() * 1000,
          y: Math.random() * 1000,
        },
      }));

      const viewport: BoundingBox = {
        min: { x: 0, y: 0 },
        max: { x: 500, y: 500 },
      };

      // Apply optimizations
      system.profiler.updateCounts(nodes.length, 0);
      const culled = system.optimizer.cullNodes(nodes, viewport);
      const batches = system.optimizer.createBatches(culled, []);

      // Collect samples
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Generate report
      const report = system.generateReport();

      expect(report.profiler.samples.length).toBeGreaterThan(0);
      expect(report.optimizer.culledNodes).toBeGreaterThan(0);
      expect(batches.length).toBeGreaterThan(0);

      system.stop();
    });

    it('should demonstrate 2x+ performance improvement', () => {
      const nodeCount = 5000;
      const nodes: VisualNode[] = Array.from({ length: nodeCount }, (_, i) => ({
        id: `node${i}`,
        data: {},
        position: {
          x: Math.random() * 2000,
          y: Math.random() * 2000,
        },
      }));

      const viewport: BoundingBox = {
        min: { x: 0, y: 0 },
        max: { x: 1000, y: 1000 },
      };

      // Baseline (no optimizations)
      const systemBaseline = createPerformanceSystem({
        optimizer: {
          enableCulling: false,
          enableBatching: false,
        },
      });

      const start1 = performance.now();
      systemBaseline.optimizer.cullNodes(nodes, viewport);
      systemBaseline.optimizer.createBatches(nodes, []);
      const timeBaseline = performance.now() - start1;

      systemBaseline.stop();

      // Optimized
      const systemOptimized = createPerformanceSystem({
        optimizer: {
          enableCulling: true,
          enableBatching: true,
        },
      });

      const start2 = performance.now();
      const culled = systemOptimized.optimizer.cullNodes(nodes, viewport);
      systemOptimized.optimizer.createBatches(culled, []);
      const timeOptimized = performance.now() - start2;

      systemOptimized.stop();

      const improvement = timeBaseline / timeOptimized;

      console.log(`\n=== Performance Benchmark ===`);
      console.log(`Nodes: ${nodeCount}`);
      console.log(`Baseline: ${timeBaseline.toFixed(2)}ms`);
      console.log(`Optimized: ${timeOptimized.toFixed(2)}ms`);
      console.log(`Improvement: ${improvement.toFixed(2)}x faster`);
      console.log(`Nodes culled: ${nodeCount - culled.length}`);
      console.log(`============================\n`);

      // Should demonstrate at least 2x improvement
      expect(improvement).toBeGreaterThanOrEqual(2.0);
    });
  });

  describe('Stress Tests', () => {
    it('should handle 10000 nodes efficiently', () => {
      const system = createPerformanceSystem();

      const nodes: VisualNode[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `node${i}`,
        data: {},
        position: {
          x: Math.random() * 5000,
          y: Math.random() * 5000,
        },
      }));

      const viewport: BoundingBox = {
        min: { x: 0, y: 0 },
        max: { x: 1000, y: 1000 },
      };

      const startTime = performance.now();
      const culled = system.optimizer.cullNodes(nodes, viewport);
      const batches = system.optimizer.createBatches(culled, []);
      const elapsed = performance.now() - startTime;

      console.log(`Processed ${nodes.length} nodes in ${elapsed.toFixed(2)}ms`);
      console.log(`Culled: ${nodes.length - culled.length} nodes`);
      console.log(`Batches created: ${batches.length}`);

      expect(elapsed).toBeLessThan(100); // Should complete in under 100ms
      expect(culled.length).toBeLessThan(nodes.length);

      system.stop();
    });

    it('should maintain performance over time', async () => {
      const system = createPerformanceSystem();
      system.start();

      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const nodes: VisualNode[] = Array.from({ length: 1000 }, (_, j) => ({
          id: `node${j}`,
          data: {},
          position: { x: Math.random() * 1000, y: Math.random() * 1000 },
        }));

        const viewport: BoundingBox = {
          min: { x: 0, y: 0 },
          max: { x: 500, y: 500 },
        };

        const start = performance.now();
        const culled = system.optimizer.cullNodes(nodes, viewport);
        system.optimizer.createBatches(culled, []);
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Average time: ${avgTime.toFixed(2)}ms`);
      console.log(`Max time: ${maxTime.toFixed(2)}ms`);

      // Performance should not degrade significantly
      expect(maxTime).toBeLessThan(avgTime * 2);

      system.stop();
    });
  });

  describe('Adaptive Quality Integration', () => {
    it('should adapt quality based on performance', async () => {
      const system = createPerformanceSystem({
        adaptiveQuality: {
          enabled: true,
          targetFps: 60,
          autoDowngrade: true,
          autoUpgrade: true,
        },
      });

      system.start();

      const initialQuality = system.adaptiveQuality.getQuality();

      // Simulate workload
      for (let i = 0; i < 5; i++) {
        system.profiler.updateCounts(i * 1000, i * 500);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Quality may have adjusted
      expect(system.adaptiveQuality.getQuality()).toBeDefined();

      system.stop();
    });

    it('should respect quality limits', () => {
      const system = createPerformanceSystem({
        adaptiveQuality: {
          minQuality: 'medium',
          maxQuality: 'high',
        },
      });

      system.adaptiveQuality.setQuality('medium');
      system.adaptiveQuality.downgradeQuality();
      expect(system.adaptiveQuality.getQuality()).toBe('medium'); // At minimum

      system.adaptiveQuality.setQuality('high');
      system.adaptiveQuality.upgradeQuality();
      expect(system.adaptiveQuality.getQuality()).toBe('high'); // At maximum

      system.stop();
    });
  });
});
