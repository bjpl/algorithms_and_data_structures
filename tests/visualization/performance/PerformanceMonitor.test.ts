/**
 * PerformanceMonitor Tests
 *
 * Test suite for performance monitoring dashboard.
 */

import { PerformanceMonitor } from '../../../src/visualization/performance/PerformanceMonitor';
import { Profiler } from '../../../src/visualization/performance/Profiler';
import { Optimizer } from '../../../src/visualization/performance/Optimizer';
import { AdaptiveQuality } from '../../../src/visualization/performance/AdaptiveQuality';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let profiler: Profiler;
  let optimizer: Optimizer;
  let adaptiveQuality: AdaptiveQuality;

  beforeEach(() => {
    profiler = new Profiler({ enableLogging: false });
    optimizer = new Optimizer();
    adaptiveQuality = new AdaptiveQuality(undefined, profiler);

    monitor = new PerformanceMonitor(
      {
        displayMode: 'overlay',
        updateInterval: 500,
        showFpsGraph: true,
        showMemoryGraph: true,
        showWarnings: true,
        showRecommendations: true,
        graphHistoryLength: 60,
        position: 'top-right',
        enableKeyboardShortcuts: false, // Disable for tests
      },
      profiler,
      optimizer,
      adaptiveQuality
    );
  });

  afterEach(() => {
    monitor.destroy();
    profiler.stop();
    optimizer.destroy();
    adaptiveQuality.destroy();
  });

  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================

  describe('Initialization', () => {
    it('should create monitor with default config', () => {
      const defaultMonitor = new PerformanceMonitor();
      expect(defaultMonitor).toBeDefined();
      defaultMonitor.destroy();
    });

    it('should create monitor with custom config', () => {
      expect(monitor).toBeDefined();
    });

    it('should have access to component instances', () => {
      expect(monitor.getProfiler()).toBe(profiler);
      expect(monitor.getOptimizer()).toBe(optimizer);
      expect(monitor.getAdaptiveQuality()).toBe(adaptiveQuality);
    });
  });

  // ==========================================================================
  // DISPLAY MODES TESTS
  // ==========================================================================

  describe('Display Modes', () => {
    it('should support compact mode', () => {
      const compactMonitor = new PerformanceMonitor({
        displayMode: 'compact',
      });

      expect(() => compactMonitor.initialize()).not.toThrow();
      compactMonitor.destroy();
    });

    it('should support detailed mode', () => {
      const detailedMonitor = new PerformanceMonitor({
        displayMode: 'detailed',
      });

      expect(() => detailedMonitor.initialize()).not.toThrow();
      detailedMonitor.destroy();
    });

    it('should support dashboard mode', () => {
      const dashboardMonitor = new PerformanceMonitor({
        displayMode: 'dashboard',
      });

      expect(() => dashboardMonitor.initialize()).not.toThrow();
      dashboardMonitor.destroy();
    });

    it('should support overlay mode', () => {
      expect(() => monitor.initialize()).not.toThrow();
    });

    it('should switch display modes', () => {
      monitor.initialize();
      monitor.updateConfig({ displayMode: 'dashboard' });

      // Should recreate UI
      expect(() => monitor.updateConfig({ displayMode: 'compact' })).not.toThrow();
    });
  });

  // ==========================================================================
  // VISIBILITY TESTS
  // ==========================================================================

  describe('Visibility', () => {
    beforeEach(() => {
      monitor.initialize();
    });

    it('should toggle visibility', () => {
      monitor.toggleVisibility();
      monitor.toggleVisibility();
      expect(() => monitor.toggleVisibility()).not.toThrow();
    });

    it('should show monitor', () => {
      monitor.hide();
      monitor.show();
      expect(() => monitor.show()).not.toThrow();
    });

    it('should hide monitor', () => {
      monitor.show();
      monitor.hide();
      expect(() => monitor.hide()).not.toThrow();
    });
  });

  // ==========================================================================
  // STATISTICS TESTS
  // ==========================================================================

  describe('Statistics', () => {
    it('should get current statistics', () => {
      const stats = monitor.getStatistics();

      expect(stats).toHaveProperty('current');
      expect(stats).toHaveProperty('optimization');
      expect(stats).toHaveProperty('quality');
      expect(stats).toHaveProperty('warningsCount');
      expect(stats).toHaveProperty('recommendationsCount');
      expect(stats).toHaveProperty('uptime');
    });

    it('should track uptime', async () => {
      monitor.initialize();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = monitor.getStatistics();
      expect(stats.uptime).toBeGreaterThan(0);
    });

    it('should include quality level', () => {
      const stats = monitor.getStatistics();
      expect(['low', 'medium', 'high', 'ultra']).toContain(stats.quality);
    });
  });

  // ==========================================================================
  // RESET TESTS
  // ==========================================================================

  describe('Reset', () => {
    it('should reset profiler', () => {
      monitor.initialize();
      profiler.updateCounts(100, 200);

      monitor.reset();

      expect(profiler.getSamples().length).toBe(0);
    });

    it('should reset optimizer stats', () => {
      monitor.reset();
      const stats = optimizer.getStats();

      expect(stats.culledNodes).toBe(0);
      expect(stats.culledEdges).toBe(0);
    });
  });

  // ==========================================================================
  // REPORT TESTS
  // ==========================================================================

  describe('Report Download', () => {
    it('should generate downloadable report', async () => {
      profiler.start();
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(() => monitor.downloadReport()).not.toThrow();
    });
  });

  // ==========================================================================
  // CONFIGURATION TESTS
  // ==========================================================================

  describe('Configuration', () => {
    it('should update configuration', () => {
      monitor.updateConfig({
        updateInterval: 1000,
        showWarnings: false,
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should support all position options', () => {
      const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;

      for (const position of positions) {
        const posMonitor = new PerformanceMonitor({ position });
        expect(() => posMonitor.initialize()).not.toThrow();
        posMonitor.destroy();
      }
    });
  });

  // ==========================================================================
  // LIFECYCLE TESTS
  // ==========================================================================

  describe('Lifecycle', () => {
    it('should initialize', () => {
      expect(() => monitor.initialize()).not.toThrow();
    });

    it('should destroy', () => {
      monitor.initialize();
      expect(() => monitor.destroy()).not.toThrow();
    });

    it('should handle multiple init/destroy cycles', () => {
      monitor.initialize();
      monitor.destroy();
      monitor.initialize();
      monitor.destroy();
      expect(true).toBe(true);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle initialization without DOM', () => {
      const origDocument = global.document;
      (global as any).document = undefined;

      expect(() => monitor.initialize()).not.toThrow();

      (global as any).document = origDocument;
    });

    it('should handle destroy without initialization', () => {
      const uninitMonitor = new PerformanceMonitor();
      expect(() => uninitMonitor.destroy()).not.toThrow();
    });

    it('should handle visibility toggle without initialization', () => {
      const uninitMonitor = new PerformanceMonitor();
      expect(() => uninitMonitor.toggleVisibility()).not.toThrow();
      uninitMonitor.destroy();
    });
  });
});
