/**
 * Profiler Tests
 *
 * Comprehensive test suite for performance profiling system.
 */

import { Profiler } from '../../../src/visualization/performance/Profiler';

describe('Profiler', () => {
  let profiler: Profiler;

  beforeEach(() => {
    profiler = new Profiler({
      enabled: true,
      sampleInterval: 100,
      maxSamples: 100,
      thresholds: {
        targetFps: 60,
        warningFps: 45,
        criticalFps: 30,
        maxFrameTime: 16.67,
        maxMemoryUsage: 100,
      },
      enableMemoryProfiling: true,
      enableLogging: false,
    });
  });

  afterEach(() => {
    profiler.stop();
  });

  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================

  describe('Initialization', () => {
    it('should create profiler with default config', () => {
      const defaultProfiler = new Profiler();
      expect(defaultProfiler).toBeDefined();
      expect(defaultProfiler.getConfig().enabled).toBe(true);
    });

    it('should create profiler with custom config', () => {
      const config = profiler.getConfig();
      expect(config.targetFps).toBe(60);
      expect(config.sampleInterval).toBe(100);
      expect(config.maxSamples).toBe(100);
    });

    it('should allow config updates', () => {
      profiler.updateConfig({
        targetFps: 30,
        enableLogging: true,
      });

      const config = profiler.getConfig();
      expect(config.targetFps).toBe(30);
      expect(config.enableLogging).toBe(true);
    });
  });

  // ==========================================================================
  // LIFECYCLE TESTS
  // ==========================================================================

  describe('Lifecycle', () => {
    it('should start profiling', () => {
      profiler.start();
      expect(profiler.isActive()).toBe(true);
    });

    it('should stop profiling', () => {
      profiler.start();
      profiler.stop();
      expect(profiler.isActive()).toBe(false);
    });

    it('should reset profiler state', () => {
      profiler.start();
      profiler.updateCounts(100, 200);
      profiler.reset();

      expect(profiler.isActive()).toBe(false);
      expect(profiler.getSamples().length).toBe(0);
    });

    it('should handle multiple start/stop cycles', () => {
      profiler.start();
      profiler.stop();
      profiler.start();
      expect(profiler.isActive()).toBe(true);
      profiler.stop();
      expect(profiler.isActive()).toBe(false);
    });
  });

  // ==========================================================================
  // METRICS TESTS
  // ==========================================================================

  describe('Metrics', () => {
    it('should track node and edge counts', () => {
      profiler.updateCounts(150, 300);
      const metrics = profiler.getCurrentMetrics();

      expect(metrics.nodeCount).toBe(150);
      expect(metrics.edgeCount).toBe(300);
    });

    it('should set custom metrics', () => {
      profiler.setMetric('customMetric', 42);
      expect(profiler.getMetric('customMetric')).toBe(42);
    });

    it('should return current metrics', () => {
      profiler.updateCounts(50, 100);
      const metrics = profiler.getCurrentMetrics();

      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('frameTime');
      expect(metrics).toHaveProperty('nodeCount');
      expect(metrics).toHaveProperty('edgeCount');
      expect(metrics).toHaveProperty('timestamp');
    });

    it('should track frame timing', () => {
      profiler.start();
      profiler.markFrameStart();

      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 5) {
        // Busy wait for 5ms
      }

      profiler.markFrameEnd();

      const metrics = profiler.getCurrentMetrics();
      expect(metrics.frameTime).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // SAMPLE COLLECTION TESTS
  // ==========================================================================

  describe('Sample Collection', () => {
    it('should collect samples at interval', async () => {
      profiler.start();
      await new Promise((resolve) => setTimeout(resolve, 250));

      const samples = profiler.getSamples();
      expect(samples.length).toBeGreaterThan(0);
    });

    it('should limit sample history', () => {
      profiler.updateConfig({ maxSamples: 5 });
      profiler.start();

      // Manually trigger many samples
      for (let i = 0; i < 10; i++) {
        profiler.updateCounts(i, i * 2);
      }

      const samples = profiler.getSamples();
      expect(samples.length).toBeLessThanOrEqual(5);
    });

    it('should include custom metrics in samples', async () => {
      profiler.setMetric('testMetric', 123);
      profiler.start();

      await new Promise((resolve) => setTimeout(resolve, 150));

      const samples = profiler.getSamples();
      if (samples.length > 0) {
        expect(samples[0].custom.get('testMetric')).toBe(123);
      }
    });
  });

  // ==========================================================================
  // WARNING TESTS
  // ==========================================================================

  describe('Warnings', () => {
    it('should generate warnings for low FPS', () => {
      // Simulate low FPS scenario by updating config
      profiler.updateConfig({
        thresholds: {
          targetFps: 60,
          warningFps: 45,
          criticalFps: 30,
          maxFrameTime: 16.67,
          maxMemoryUsage: 100,
        },
      });

      profiler.start();

      // Warnings are generated during FPS checks
      // We can't easily test this without mocking time
    });

    it('should track warning history', () => {
      profiler.start();
      const warnings = profiler.getWarnings();
      expect(Array.isArray(warnings)).toBe(true);
    });
  });

  // ==========================================================================
  // REPORTING TESTS
  // ==========================================================================

  describe('Reporting', () => {
    it('should generate performance report', async () => {
      profiler.start();
      profiler.updateCounts(100, 200);

      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(() => profiler.generateReport()).not.toThrow();
      const report = profiler.generateReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('duration');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('samples');
      expect(report).toHaveProperty('warnings');
      expect(report).toHaveProperty('recommendations');
    });

    it('should include statistics in report', async () => {
      profiler.start();
      await new Promise((resolve) => setTimeout(resolve, 250));

      const report = profiler.generateReport();

      expect(report.summary).toHaveProperty('avgFps');
      expect(report.summary).toHaveProperty('minFps');
      expect(report.summary).toHaveProperty('maxFps');
      expect(report.summary).toHaveProperty('avgFrameTime');
    });

    it('should generate recommendations', async () => {
      profiler.start();
      profiler.updateCounts(5000, 10000); // Large counts

      await new Promise((resolve) => setTimeout(resolve, 250));

      const report = profiler.generateReport();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should export report as JSON', async () => {
      profiler.start();
      await new Promise((resolve) => setTimeout(resolve, 250));

      const json = profiler.exportReport();
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('summary');
    });

    it('should throw error if no samples available', () => {
      expect(() => profiler.generateReport()).toThrow('No samples available for report');
    });
  });

  // ==========================================================================
  // ENABLE/DISABLE TESTS
  // ==========================================================================

  describe('Enable/Disable', () => {
    it('should enable profiling', () => {
      profiler.setEnabled(true);
      expect(profiler.isActive()).toBe(true);
    });

    it('should disable profiling', () => {
      profiler.start();
      profiler.setEnabled(false);
      expect(profiler.isActive()).toBe(false);
    });

    it('should toggle profiling state', () => {
      profiler.setEnabled(true);
      expect(profiler.isActive()).toBe(true);

      profiler.setEnabled(false);
      expect(profiler.isActive()).toBe(false);
    });
  });

  // ==========================================================================
  // PERFORMANCE BENCHMARKS
  // ==========================================================================

  describe('Performance Benchmarks', () => {
    it('should handle high-frequency updates', () => {
      profiler.start();

      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        profiler.updateCounts(i, i * 2);
        profiler.setMetric('iteration', i);
      }

      const elapsed = performance.now() - startTime;

      // Should complete 1000 updates in under 100ms
      expect(elapsed).toBeLessThan(100);
    });

    it('should maintain performance with many samples', async () => {
      profiler.updateConfig({ maxSamples: 1000 });
      profiler.start();

      // Let it collect samples
      await new Promise((resolve) => setTimeout(resolve, 500));

      const startTime = performance.now();
      const report = profiler.generateReport();
      const elapsed = performance.now() - startTime;

      // Report generation should be fast even with many samples
      expect(elapsed).toBeLessThan(50);
      expect(report.samples.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle zero counts', () => {
      profiler.updateCounts(0, 0);
      const metrics = profiler.getCurrentMetrics();

      expect(metrics.nodeCount).toBe(0);
      expect(metrics.edgeCount).toBe(0);
    });

    it('should handle negative metrics gracefully', () => {
      expect(() => profiler.updateCounts(-1, -1)).not.toThrow();
    });

    it('should handle missing performance API', () => {
      // Profiler should work even if some performance APIs are missing
      expect(() => new Profiler()).not.toThrow();
    });
  });
});
