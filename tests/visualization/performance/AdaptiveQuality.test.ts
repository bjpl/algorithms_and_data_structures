/**
 * AdaptiveQuality Tests
 *
 * Test suite for adaptive quality system.
 */

import { AdaptiveQuality } from '../../../src/visualization/performance/AdaptiveQuality';
import { Profiler } from '../../../src/visualization/performance/Profiler';

describe('AdaptiveQuality', () => {
  let adaptiveQuality: AdaptiveQuality;
  let profiler: Profiler;

  beforeEach(() => {
    profiler = new Profiler();
    adaptiveQuality = new AdaptiveQuality(
      {
        enabled: true,
        targetFps: 60,
        fpsTolerance: 5,
        adjustmentInterval: 1000,
        autoDowngrade: true,
        autoUpgrade: true,
        minQuality: 'low',
        maxQuality: 'ultra',
        progressiveRendering: false,
        progressiveChunkSize: 50,
      },
      profiler
    );
  });

  afterEach(() => {
    adaptiveQuality.destroy();
    profiler.stop();
  });

  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================

  describe('Initialization', () => {
    it('should create with default config', () => {
      const defaultAQ = new AdaptiveQuality();
      expect(defaultAQ).toBeDefined();
      expect(defaultAQ.getQuality()).toBe('high');
    });

    it('should create with custom config', () => {
      const config = adaptiveQuality.getConfig();
      expect(config.targetFps).toBe(60);
      expect(config.fpsTolerance).toBe(5);
    });

    it('should start with default quality', () => {
      expect(adaptiveQuality.getQuality()).toBe('high');
    });
  });

  // ==========================================================================
  // QUALITY MANAGEMENT TESTS
  // ==========================================================================

  describe('Quality Management', () => {
    it('should set quality level', () => {
      adaptiveQuality.setQuality('low');
      expect(adaptiveQuality.getQuality()).toBe('low');

      adaptiveQuality.setQuality('ultra');
      expect(adaptiveQuality.getQuality()).toBe('ultra');
    });

    it('should downgrade quality', () => {
      adaptiveQuality.setQuality('high');
      const downgraded = adaptiveQuality.downgradeQuality();

      expect(downgraded).toBe(true);
      expect(adaptiveQuality.getQuality()).toBe('medium');
    });

    it('should upgrade quality', () => {
      adaptiveQuality.setQuality('medium');
      const upgraded = adaptiveQuality.upgradeQuality();

      expect(upgraded).toBe(true);
      expect(adaptiveQuality.getQuality()).toBe('high');
    });

    it('should not downgrade below minimum', () => {
      adaptiveQuality.setQuality('low');
      const downgraded = adaptiveQuality.downgradeQuality();

      expect(downgraded).toBe(false);
      expect(adaptiveQuality.getQuality()).toBe('low');
    });

    it('should not upgrade above maximum', () => {
      adaptiveQuality.setQuality('ultra');
      const upgraded = adaptiveQuality.upgradeQuality();

      expect(upgraded).toBe(false);
      expect(adaptiveQuality.getQuality()).toBe('ultra');
    });

    it('should respect min quality limit', () => {
      adaptiveQuality.updateConfig({ minQuality: 'medium' });
      adaptiveQuality.setQuality('medium');

      const downgraded = adaptiveQuality.downgradeQuality();
      expect(downgraded).toBe(false);
    });

    it('should respect max quality limit', () => {
      adaptiveQuality.updateConfig({ maxQuality: 'high' });
      adaptiveQuality.setQuality('high');

      const upgraded = adaptiveQuality.upgradeQuality();
      expect(upgraded).toBe(false);
    });
  });

  // ==========================================================================
  // QUALITY PRESETS TESTS
  // ==========================================================================

  describe('Quality Presets', () => {
    it('should get quality preset', () => {
      const preset = adaptiveQuality.getPreset('high');

      expect(preset).toBeDefined();
      expect(preset!.level).toBe('high');
      expect(preset!.lod).toBeDefined();
    });

    it('should have all quality levels', () => {
      expect(adaptiveQuality.getPreset('low')).toBeDefined();
      expect(adaptiveQuality.getPreset('medium')).toBeDefined();
      expect(adaptiveQuality.getPreset('high')).toBeDefined();
      expect(adaptiveQuality.getPreset('ultra')).toBeDefined();
    });

    it('should register custom preset', () => {
      adaptiveQuality.registerPreset({
        level: 'low',
        lod: {
          nodeSimplificationDistance: 25,
          edgeSimplificationDistance: 20,
          labelVisibilityDistance: 50,
          animationQuality: 0.2,
          textureScale: 0.25,
          antialiasing: false,
          shadows: false,
          particles: false,
        },
        maxNodes: 10000,
        maxEdges: 20000,
        fps: 30,
      });

      const preset = adaptiveQuality.getPreset('low');
      expect(preset!.lod.nodeSimplificationDistance).toBe(25);
    });
  });

  // ==========================================================================
  // LOD TESTS
  // ==========================================================================

  describe('LOD (Level of Detail)', () => {
    it('should get current LOD settings', () => {
      const lod = adaptiveQuality.getLOD();

      expect(lod).toHaveProperty('nodeSimplificationDistance');
      expect(lod).toHaveProperty('edgeSimplificationDistance');
      expect(lod).toHaveProperty('labelVisibilityDistance');
      expect(lod).toHaveProperty('animationQuality');
    });

    it('should determine node render distance', () => {
      adaptiveQuality.setQuality('high');
      expect(adaptiveQuality.shouldRenderNode(50)).toBe(true);
      expect(adaptiveQuality.shouldRenderNode(500)).toBe(false);
    });

    it('should determine edge render distance', () => {
      adaptiveQuality.setQuality('medium');
      expect(adaptiveQuality.shouldRenderEdge(50)).toBe(true);
      expect(adaptiveQuality.shouldRenderEdge(200)).toBe(false);
    });

    it('should determine label visibility', () => {
      adaptiveQuality.setQuality('low');
      expect(adaptiveQuality.shouldShowLabel(50)).toBe(true);
      expect(adaptiveQuality.shouldShowLabel(150)).toBe(false);
    });

    it('should provide animation quality factor', () => {
      adaptiveQuality.setQuality('low');
      expect(adaptiveQuality.getAnimationQuality()).toBe(0.3);

      adaptiveQuality.setQuality('ultra');
      expect(adaptiveQuality.getAnimationQuality()).toBe(1.0);
    });

    it('should provide texture scale', () => {
      adaptiveQuality.setQuality('low');
      expect(adaptiveQuality.getTextureScale()).toBe(0.5);

      adaptiveQuality.setQuality('high');
      expect(adaptiveQuality.getTextureScale()).toBe(1.0);
    });

    it('should indicate antialiasing state', () => {
      adaptiveQuality.setQuality('low');
      expect(adaptiveQuality.isAntialiasingEnabled()).toBe(false);

      adaptiveQuality.setQuality('high');
      expect(adaptiveQuality.isAntialiasingEnabled()).toBe(true);
    });

    it('should indicate shadow state', () => {
      adaptiveQuality.setQuality('high');
      expect(adaptiveQuality.areShadowsEnabled()).toBe(false);

      adaptiveQuality.setQuality('ultra');
      expect(adaptiveQuality.areShadowsEnabled()).toBe(true);
    });

    it('should indicate particle effects state', () => {
      adaptiveQuality.setQuality('low');
      expect(adaptiveQuality.areParticlesEnabled()).toBe(false);

      adaptiveQuality.setQuality('high');
      expect(adaptiveQuality.areParticlesEnabled()).toBe(true);
    });
  });

  // ==========================================================================
  // PROGRESSIVE RENDERING TESTS
  // ==========================================================================

  describe('Progressive Rendering', () => {
    it('should setup progressive render', () => {
      const renderFns = [() => {}, () => {}, () => {}];

      adaptiveQuality.updateConfig({ progressiveRendering: true });
      adaptiveQuality.setupProgressiveRender(renderFns);

      expect(adaptiveQuality.isProgressiveRenderActive()).toBe(true);
    });

    it('should execute progressive chunks', () => {
      let executed = 0;
      const renderFns = Array.from({ length: 150 }, () => () => {
        executed++;
      });

      adaptiveQuality.updateConfig({
        progressiveRendering: true,
        progressiveChunkSize: 50,
      });
      adaptiveQuality.setupProgressiveRender(renderFns);

      // Execute first chunk
      const hasMore1 = adaptiveQuality.executeProgressiveChunk();
      expect(hasMore1).toBe(true);
      expect(executed).toBe(50);

      // Execute second chunk
      const hasMore2 = adaptiveQuality.executeProgressiveChunk();
      expect(hasMore2).toBe(true);
      expect(executed).toBe(100);

      // Execute final chunk
      const hasMore3 = adaptiveQuality.executeProgressiveChunk();
      expect(hasMore3).toBe(false);
      expect(executed).toBe(150);
    });

    it('should track progressive render progress', () => {
      const renderFns = Array.from({ length: 100 }, () => () => {});

      adaptiveQuality.updateConfig({
        progressiveRendering: true,
        progressiveChunkSize: 25,
      });
      adaptiveQuality.setupProgressiveRender(renderFns);

      expect(adaptiveQuality.getProgressiveProgress()).toBe(0);

      adaptiveQuality.executeProgressiveChunk();
      expect(adaptiveQuality.getProgressiveProgress()).toBe(0.25);

      adaptiveQuality.executeProgressiveChunk();
      expect(adaptiveQuality.getProgressiveProgress()).toBe(0.5);
    });

    it('should reset progressive render', () => {
      const renderFns = [() => {}, () => {}];

      adaptiveQuality.updateConfig({ progressiveRendering: true });
      adaptiveQuality.setupProgressiveRender(renderFns);
      adaptiveQuality.executeProgressiveChunk();

      adaptiveQuality.resetProgressiveRender();

      expect(adaptiveQuality.isProgressiveRenderActive()).toBe(false);
      expect(adaptiveQuality.getProgressiveProgress()).toBe(1);
    });

    it('should render immediately when progressive disabled', () => {
      let executed = 0;
      const renderFns = Array.from({ length: 10 }, () => () => {
        executed++;
      });

      adaptiveQuality.updateConfig({ progressiveRendering: false });
      adaptiveQuality.setupProgressiveRender(renderFns);

      // All should execute immediately
      expect(executed).toBe(10);
    });
  });

  // ==========================================================================
  // DEVICE DETECTION TESTS
  // ==========================================================================

  describe('Device Detection', () => {
    it('should detect optimal quality', () => {
      const quality = adaptiveQuality.detectOptimalQuality();
      expect(['low', 'medium', 'high', 'ultra']).toContain(quality);
    });

    it('should detect low-end devices', () => {
      const isLowEnd = adaptiveQuality.isLowEndDevice();
      expect(typeof isLowEnd).toBe('boolean');
    });
  });

  // ==========================================================================
  // THROTTLING TESTS
  // ==========================================================================

  describe('Throttling', () => {
    it('should calculate throttle delay', () => {
      const delay = adaptiveQuality.getThrottleDelay();
      expect(typeof delay).toBe('number');
      expect(delay).toBeGreaterThanOrEqual(0);
    });

    it('should indicate when to throttle', () => {
      const shouldThrottle = adaptiveQuality.shouldThrottle();
      expect(typeof shouldThrottle).toBe('boolean');
    });
  });

  // ==========================================================================
  // CONFIGURATION TESTS
  // ==========================================================================

  describe('Configuration', () => {
    it('should update configuration', () => {
      adaptiveQuality.updateConfig({
        targetFps: 30,
        autoDowngrade: false,
      });

      const config = adaptiveQuality.getConfig();
      expect(config.targetFps).toBe(30);
      expect(config.autoDowngrade).toBe(false);
    });

    it('should get current configuration', () => {
      const config = adaptiveQuality.getConfig();

      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('targetFps');
      expect(config).toHaveProperty('fpsTolerance');
    });

    it('should set profiler instance', () => {
      const newProfiler = new Profiler();
      adaptiveQuality.setProfiler(newProfiler);

      // Should not throw
      expect(() => adaptiveQuality.start()).not.toThrow();

      newProfiler.stop();
    });

    it('should enable/disable adaptive quality', () => {
      adaptiveQuality.setEnabled(false);
      expect(adaptiveQuality.getConfig().enabled).toBe(false);

      adaptiveQuality.setEnabled(true);
      expect(adaptiveQuality.getConfig().enabled).toBe(true);
    });
  });

  // ==========================================================================
  // LIFECYCLE TESTS
  // ==========================================================================

  describe('Lifecycle', () => {
    it('should start monitoring', () => {
      expect(() => adaptiveQuality.start()).not.toThrow();
    });

    it('should stop monitoring', () => {
      adaptiveQuality.start();
      expect(() => adaptiveQuality.stop()).not.toThrow();
    });

    it('should destroy resources', () => {
      adaptiveQuality.start();
      expect(() => adaptiveQuality.destroy()).not.toThrow();
    });
  });

  // ==========================================================================
  // ADAPTIVE BEHAVIOR TESTS
  // ==========================================================================

  describe('Adaptive Behavior', () => {
    it('should not adjust immediately with insufficient history', async () => {
      profiler.start();
      adaptiveQuality.start();

      const initialQuality = adaptiveQuality.getQuality();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should not have changed yet
      expect(adaptiveQuality.getQuality()).toBe(initialQuality);
    });

    it('should clear history on manual quality change', () => {
      adaptiveQuality.start();
      adaptiveQuality.setQuality('low');

      // History should be cleared, allowing new baseline
      expect(() => adaptiveQuality.setQuality('high')).not.toThrow();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle invalid quality level', () => {
      expect(() => adaptiveQuality.setQuality('invalid' as any)).toThrow();
    });

    it('should handle zero distance checks', () => {
      expect(adaptiveQuality.shouldRenderNode(0)).toBe(true);
      expect(adaptiveQuality.shouldRenderEdge(0)).toBe(true);
      expect(adaptiveQuality.shouldShowLabel(0)).toBe(true);
    });

    it('should handle negative distances', () => {
      expect(adaptiveQuality.shouldRenderNode(-10)).toBe(true);
    });

    it('should handle empty render functions', () => {
      adaptiveQuality.updateConfig({ progressiveRendering: true });
      adaptiveQuality.setupProgressiveRender([]);

      expect(adaptiveQuality.getProgressiveProgress()).toBe(1);
      expect(adaptiveQuality.isProgressiveRenderActive()).toBe(false);
    });
  });
});
