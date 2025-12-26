/**
 * @file Unit tests for Visualization base class
 * @author Algorithm Visualization System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Visualization, VisualizationConfig, VisualizationEvent, VisualizationError } from '../../../src/visualization/core/Visualization';

/**
 * Concrete implementation of Visualization for testing
 */
class TestVisualization extends Visualization {
  public renderCallCount = 0;
  public updateCallCount = 0;

  protected doRender(): void {
    this.renderCallCount++;
  }

  protected doUpdate(deltaTime: number): void {
    this.updateCallCount++;
  }
}

describe('Visualization', () => {
  let canvas: HTMLCanvasElement;
  let config: VisualizationConfig;
  let visualization: TestVisualization;

  beforeEach(() => {
    // Create a mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    config = {
      canvas,
      width: 800,
      height: 600,
      theme: 'dark',
      renderer: 'canvas' as const,
    };

    visualization = new TestVisualization(config);
  });

  afterEach(() => {
    visualization.dispose();
  });

  describe('constructor', () => {
    it('should initialize with valid configuration', () => {
      expect(visualization).toBeDefined();
      expect(visualization.getWidth()).toBe(800);
      expect(visualization.getHeight()).toBe(600);
      expect(visualization.isInitialized()).toBe(false);
    });

    it('should throw error for invalid canvas', () => {
      const invalidConfig = { ...config, canvas: null as any };
      expect(() => new TestVisualization(invalidConfig)).toThrow(VisualizationError);
    });

    it('should throw error for invalid dimensions', () => {
      const invalidConfig = { ...config, width: -100 };
      expect(() => new TestVisualization(invalidConfig)).toThrow(VisualizationError);
    });
  });

  describe('lifecycle methods', () => {
    it('should initialize successfully', async () => {
      await visualization.init();
      expect(visualization.isInitialized()).toBe(true);
    });

    it('should not initialize twice', async () => {
      await visualization.init();
      await expect(visualization.init()).rejects.toThrow(VisualizationError);
    });

    it('should dispose and clean up resources', () => {
      const listenerSpy = vi.fn();
      visualization.on('render', listenerSpy);

      visualization.dispose();

      visualization.emit('render');
      expect(listenerSpy).not.toHaveBeenCalled();
      expect(visualization.isDisposed()).toBe(true);
    });

    it('should throw error when using after disposal', () => {
      visualization.dispose();
      expect(() => visualization.render()).toThrow(VisualizationError);
    });
  });

  describe('event system', () => {
    it('should subscribe to events', () => {
      const listener = vi.fn();
      visualization.on('render', listener);

      visualization.emit('render');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe from events', () => {
      const listener = vi.fn();
      const unsubscribe = visualization.on('render', listener);

      unsubscribe();
      visualization.emit('render');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      visualization.on('render', listener1);
      visualization.on('render', listener2);

      visualization.emit('render');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should pass data to event listeners', () => {
      const listener = vi.fn();
      visualization.on('stateChange', listener);

      const data = { state: 'active' };
      visualization.emit('stateChange', data);

      expect(listener).toHaveBeenCalledWith(data);
    });

    it('should handle errors in event listeners', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const validListener = vi.fn();

      visualization.on('render', errorListener);
      visualization.on('render', validListener);

      expect(() => visualization.emit('render')).not.toThrow();
      expect(validListener).toHaveBeenCalled();
    });
  });

  describe('rendering', () => {
    it('should render when initialized', async () => {
      await visualization.init();
      visualization.render();

      expect(visualization.renderCallCount).toBe(1);
    });

    it('should not render when not initialized', () => {
      expect(() => visualization.render()).toThrow(VisualizationError);
    });

    it('should emit render event', async () => {
      await visualization.init();
      const listener = vi.fn();
      visualization.on('render', listener);

      visualization.render();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('update loop', () => {
    it('should start update loop', async () => {
      await visualization.init();
      visualization.startUpdateLoop();

      // Wait for a few frames
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(visualization.updateCallCount).toBeGreaterThan(0);
    });

    it('should stop update loop', async () => {
      await visualization.init();
      visualization.startUpdateLoop();

      await new Promise((resolve) => setTimeout(resolve, 50));
      const countBefore = visualization.updateCallCount;

      visualization.stopUpdateLoop();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(visualization.updateCallCount).toBe(countBefore);
    });

    it('should not start loop twice', async () => {
      await visualization.init();
      visualization.startUpdateLoop();

      expect(() => visualization.startUpdateLoop()).toThrow(VisualizationError);
    });
  });

  describe('resize', () => {
    it('should resize canvas', async () => {
      await visualization.init();
      visualization.resize(1024, 768);

      expect(visualization.getWidth()).toBe(1024);
      expect(visualization.getHeight()).toBe(768);
      expect(canvas.width).toBe(1024);
      expect(canvas.height).toBe(768);
    });

    it('should throw error for invalid dimensions', async () => {
      await visualization.init();
      expect(() => visualization.resize(-100, 600)).toThrow(VisualizationError);
    });

    it('should emit resize event', async () => {
      await visualization.init();
      const listener = vi.fn();
      visualization.on('resize', listener);

      visualization.resize(1024, 768);

      expect(listener).toHaveBeenCalledWith({ width: 1024, height: 768 });
    });
  });

  describe('theme support', () => {
    it('should get current theme', () => {
      expect(visualization.getTheme()).toBe('dark');
    });

    it('should set theme', async () => {
      await visualization.init();
      visualization.setTheme('light');

      expect(visualization.getTheme()).toBe('light');
    });

    it('should emit theme change event', async () => {
      await visualization.init();
      const listener = vi.fn();
      visualization.on('themeChange', listener);

      visualization.setTheme('light');

      expect(listener).toHaveBeenCalledWith({ theme: 'light' });
    });
  });

  describe('performance optimization', () => {
    it('should use requestAnimationFrame for updates', async () => {
      await visualization.init();
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      visualization.startUpdateLoop();

      expect(rafSpy).toHaveBeenCalled();

      rafSpy.mockRestore();
    });

    it('should cancel animation frame on stop', async () => {
      await visualization.init();
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      visualization.startUpdateLoop();
      visualization.stopUpdateLoop();

      expect(cancelSpy).toHaveBeenCalled();

      cancelSpy.mockRestore();
    });
  });

  describe('memory management', () => {
    it('should remove all event listeners on dispose', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      visualization.on('render', listener1);
      visualization.on('stateChange', listener2);

      visualization.dispose();

      visualization.emit('render');
      visualization.emit('stateChange');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should cancel pending animation frames on dispose', async () => {
      await visualization.init();
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      visualization.startUpdateLoop();
      visualization.dispose();

      expect(cancelSpy).toHaveBeenCalled();

      cancelSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should create VisualizationError with proper context', () => {
      const error = new VisualizationError('Test error', 'TEST_ERROR', { foo: 'bar' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.context).toEqual({ foo: 'bar' });
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle rendering errors gracefully', async () => {
      class ErrorVisualization extends Visualization {
        protected doRender(): void {
          throw new Error('Render error');
        }

        protected doUpdate(deltaTime: number): void {}
      }

      const errorVis = new ErrorVisualization(config);
      await errorVis.init();

      const errorListener = vi.fn();
      errorVis.on('error', errorListener);

      errorVis.render();

      expect(errorListener).toHaveBeenCalled();

      errorVis.dispose();
    });
  });

  describe('WebGL rendering mode', () => {
    it('should support WebGL renderer', () => {
      const webglConfig: VisualizationConfig = {
        ...config,
        renderer: 'webgl',
      };

      const webglVis = new TestVisualization(webglConfig);

      expect(webglVis.getRenderer()).toBe('webgl');

      webglVis.dispose();
    });

    it('should fallback to canvas if WebGL not supported', () => {
      const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
      getContextSpy.mockImplementation((type) => {
        if (type === 'webgl' || type === 'webgl2') {
          return null;
        }
        return {} as any;
      });

      const webglConfig: VisualizationConfig = {
        ...config,
        renderer: 'webgl',
      };

      const webglVis = new TestVisualization(webglConfig);

      expect(webglVis.getRenderer()).toBe('canvas');

      webglVis.dispose();
      getContextSpy.mockRestore();
    });
  });
});
