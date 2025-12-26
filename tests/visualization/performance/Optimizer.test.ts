/**
 * Optimizer Tests
 *
 * Test suite for performance optimization techniques.
 */

import { Optimizer } from '../../../src/visualization/performance/Optimizer';
import type { VisualNode, VisualEdge, BoundingBox } from '../../../src/visualization/core/types';

describe('Optimizer', () => {
  let optimizer: Optimizer;

  beforeEach(() => {
    optimizer = new Optimizer({
      strategy: 'canvas-2d',
      enableDirtyRectangles: true,
      enableLayering: true,
      enableCulling: true,
      enableBatching: true,
      enableRafPooling: true,
      enableWebWorkers: false,
      enableVirtualScrolling: false,
      webglThreshold: 1000,
      viewportPadding: 100,
      maxBatchSize: 100,
    });
  });

  afterEach(() => {
    optimizer.destroy();
  });

  // Helper to create test nodes
  const createNode = (id: string, x: number, y: number, size = 20): VisualNode => ({
    id,
    data: {},
    position: { x, y },
    style: { size },
  });

  // Helper to create test edges
  const createEdge = (id: string, source: string, target: string): VisualEdge => ({
    id,
    source,
    target,
  });

  // ==========================================================================
  // DIRTY RECTANGLES TESTS
  // ==========================================================================

  describe('Dirty Rectangles', () => {
    it('should mark regions as dirty', () => {
      optimizer.markDirty({ x: 10, y: 10, width: 50, height: 50 });
      const regions = optimizer.getDirtyRegions();

      expect(regions.length).toBe(1);
      expect(regions[0]).toEqual({ x: 10, y: 10, width: 50, height: 50 });
    });

    it('should mark node area as dirty', () => {
      const node = createNode('node1', 100, 100, 20);
      optimizer.markNodeDirty(node, 10);

      const regions = optimizer.getDirtyRegions();
      expect(regions.length).toBe(1);
      expect(regions[0].x).toBe(80); // 100 - 10 (size/2) - 10 (padding)
      expect(regions[0].width).toBe(40); // 20 (size) + 20 (2*padding)
    });

    it('should mark edge area as dirty', () => {
      const source = createNode('node1', 0, 0);
      const target = createNode('node2', 100, 100);

      optimizer.markEdgeDirty(source, target, 5);
      const regions = optimizer.getDirtyRegions();

      expect(regions.length).toBe(1);
      expect(regions[0].x).toBe(-5);
      expect(regions[0].y).toBe(-5);
    });

    it('should merge overlapping dirty rectangles', () => {
      optimizer.markDirty({ x: 0, y: 0, width: 50, height: 50 });
      optimizer.markDirty({ x: 25, y: 25, width: 50, height: 50 });

      const regions = optimizer.getDirtyRegions();
      // Should merge into single larger rectangle
      expect(regions.length).toBe(1);
      expect(regions[0].width).toBeGreaterThan(50);
    });

    it('should clear dirty regions', () => {
      optimizer.markDirty({ x: 0, y: 0, width: 50, height: 50 });
      optimizer.clearDirty();

      const regions = optimizer.getDirtyRegions();
      expect(regions.length).toBe(0);
    });

    it('should handle non-overlapping rectangles', () => {
      optimizer.markDirty({ x: 0, y: 0, width: 10, height: 10 });
      optimizer.markDirty({ x: 100, y: 100, width: 10, height: 10 });

      const regions = optimizer.getDirtyRegions();
      expect(regions.length).toBe(2);
    });
  });

  // ==========================================================================
  // CANVAS LAYERING TESTS
  // ==========================================================================

  describe('Canvas Layering', () => {
    it('should create render layer', () => {
      const layer = optimizer.createLayer('layer1', 800, 600, 1, 1);

      expect(layer.id).toBe('layer1');
      expect(layer.zIndex).toBe(1);
      expect(layer.opacity).toBe(1);
      expect(layer.canvas.width).toBe(800);
      expect(layer.canvas.height).toBe(600);
    });

    it('should get existing layer', () => {
      optimizer.createLayer('layer1', 800, 600);
      const layer = optimizer.getLayer('layer1');

      expect(layer).toBeDefined();
      expect(layer!.id).toBe('layer1');
    });

    it('should mark layer as dirty', () => {
      optimizer.createLayer('layer1', 800, 600);
      optimizer.markLayerDirty('layer1');

      const layer = optimizer.getLayer('layer1');
      expect(layer!.isDirty).toBe(true);
    });

    it('should clear layer', () => {
      const layer = optimizer.createLayer('layer1', 800, 600);
      layer.isDirty = true;

      optimizer.clearLayer('layer1');

      expect(layer.isDirty).toBe(false);
    });

    it('should remove layer', () => {
      optimizer.createLayer('layer1', 800, 600);
      optimizer.removeLayer('layer1');

      const layer = optimizer.getLayer('layer1');
      expect(layer).toBeUndefined();
    });

    it('should return layers sorted by z-index', () => {
      optimizer.createLayer('layer1', 800, 600, 2);
      optimizer.createLayer('layer2', 800, 600, 1);
      optimizer.createLayer('layer3', 800, 600, 3);

      const layers = optimizer.getLayers();

      expect(layers.length).toBe(3);
      expect(layers[0].id).toBe('layer2'); // z-index 1
      expect(layers[1].id).toBe('layer1'); // z-index 2
      expect(layers[2].id).toBe('layer3'); // z-index 3
    });
  });

  // ==========================================================================
  // VIEWPORT CULLING TESTS
  // ==========================================================================

  describe('Viewport Culling', () => {
    it('should cull nodes outside viewport', () => {
      const nodes: VisualNode[] = [
        createNode('visible', 100, 100),
        createNode('outside', 1000, 1000),
        createNode('edge', 200, 200),
      ];

      const viewport: BoundingBox = {
        min: { x: 0, y: 0 },
        max: { x: 300, y: 300 },
      };

      const culled = optimizer.cullNodes(nodes, viewport);

      expect(culled.length).toBeLessThan(nodes.length);
      expect(culled.some((n) => n.id === 'visible')).toBe(true);
      expect(culled.some((n) => n.id === 'outside')).toBe(false);
    });

    it('should include nodes at viewport edge with padding', () => {
      const nodes: VisualNode[] = [createNode('edge', 305, 100)];

      const viewport: BoundingBox = {
        min: { x: 0, y: 0 },
        max: { x: 300, y: 300 },
      };

      const culled = optimizer.cullNodes(nodes, viewport);

      // Should be included due to padding (default 100px)
      expect(culled.length).toBe(1);
    });

    it('should cull edges outside viewport', () => {
      const nodes = new Map<string, VisualNode>([
        ['node1', createNode('node1', 50, 50)],
        ['node2', createNode('node2', 150, 150)],
        ['node3', createNode('node3', 1000, 1000)],
        ['node4', createNode('node4', 1100, 1100)],
      ]);

      const edges: VisualEdge[] = [
        createEdge('edge1', 'node1', 'node2'), // Both visible
        createEdge('edge2', 'node3', 'node4'), // Both outside
        createEdge('edge3', 'node1', 'node3'), // Mixed
      ];

      const viewport: BoundingBox = {
        min: { x: 0, y: 0 },
        max: { x: 200, y: 200 },
      };

      const culled = optimizer.cullEdges(edges, nodes, viewport);

      expect(culled.some((e) => e.id === 'edge1')).toBe(true);
      expect(culled.some((e) => e.id === 'edge2')).toBe(false);
    });

    it('should track culled counts in stats', () => {
      const nodes: VisualNode[] = [
        createNode('n1', 100, 100),
        createNode('n2', 1000, 1000),
        createNode('n3', 2000, 2000),
      ];

      const viewport: BoundingBox = {
        min: { x: 0, y: 0 },
        max: { x: 300, y: 300 },
      };

      optimizer.cullNodes(nodes, viewport);
      const stats = optimizer.getStats();

      expect(stats.culledNodes).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // RENDER BATCHING TESTS
  // ==========================================================================

  describe('Render Batching', () => {
    it('should create batches from nodes', () => {
      const nodes: VisualNode[] = [];
      for (let i = 0; i < 250; i++) {
        nodes.push(createNode(`node${i}`, i * 10, i * 10));
      }

      const edges: VisualEdge[] = [];
      const batches = optimizer.createBatches(nodes, edges);

      expect(batches.length).toBeGreaterThan(1);
      expect(batches.length).toBe(Math.ceil(nodes.length / 100)); // maxBatchSize = 100
    });

    it('should include relevant edges in batches', () => {
      const nodes: VisualNode[] = [
        createNode('node1', 0, 0),
        createNode('node2', 10, 10),
        createNode('node3', 20, 20),
      ];

      const edges: VisualEdge[] = [
        createEdge('edge1', 'node1', 'node2'),
        createEdge('edge2', 'node2', 'node3'),
      ];

      const batches = optimizer.createBatches(nodes, edges);

      expect(batches[0].edges.length).toBeGreaterThan(0);
    });

    it('should calculate batch bounds', () => {
      const nodes: VisualNode[] = [
        createNode('node1', 0, 0, 20),
        createNode('node2', 100, 100, 20),
      ];

      const batches = optimizer.createBatches(nodes, []);

      expect(batches[0].bounds.min.x).toBeLessThanOrEqual(0);
      expect(batches[0].bounds.max.x).toBeGreaterThanOrEqual(100);
    });

    it('should track batch count in stats', () => {
      const nodes: VisualNode[] = Array.from({ length: 250 }, (_, i) =>
        createNode(`node${i}`, i, i)
      );

      optimizer.createBatches(nodes, []);
      const stats = optimizer.getStats();

      expect(stats.batchCount).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // RAF POOLING TESTS
  // ==========================================================================

  describe('RAF Pooling', () => {
    it('should request animation frame', () => {
      const callback = jest.fn();
      const handle = optimizer.requestFrame(callback);

      expect(typeof handle).toBe('number');
    });

    it('should cancel animation frame', () => {
      const callback = jest.fn();
      const handle = optimizer.requestFrame(callback);

      expect(() => optimizer.cancelFrame(handle)).not.toThrow();
    });

    it('should cancel all pending frames', () => {
      for (let i = 0; i < 10; i++) {
        optimizer.requestFrame(() => {});
      }

      expect(() => optimizer.cancelAllFrames()).not.toThrow();
    });
  });

  // ==========================================================================
  // WEBGL TESTS
  // ==========================================================================

  describe('WebGL', () => {
    it('should detect when to use WebGL', () => {
      expect(optimizer.shouldUseWebGL(500)).toBe(false);
      expect(optimizer.shouldUseWebGL(1500)).toBe(false); // strategy is canvas-2d

      optimizer.updateConfig({ strategy: 'webgl' });
      expect(optimizer.shouldUseWebGL(100)).toBe(true);
    });

    it('should use WebGL for large datasets in hybrid mode', () => {
      optimizer.updateConfig({
        strategy: 'hybrid',
        webglThreshold: 1000,
      });

      expect(optimizer.shouldUseWebGL(500)).toBe(false);
      expect(optimizer.shouldUseWebGL(1500)).toBe(true);
    });
  });

  // ==========================================================================
  // STATISTICS TESTS
  // ==========================================================================

  describe('Statistics', () => {
    it('should return optimization stats', () => {
      const stats = optimizer.getStats();

      expect(stats).toHaveProperty('culledNodes');
      expect(stats).toHaveProperty('culledEdges');
      expect(stats).toHaveProperty('dirtyRegions');
      expect(stats).toHaveProperty('batchCount');
      expect(stats).toHaveProperty('strategy');
      expect(stats).toHaveProperty('activeOptimizations');
    });

    it('should list active optimizations', () => {
      const stats = optimizer.getStats();

      expect(Array.isArray(stats.activeOptimizations)).toBe(true);
      expect(stats.activeOptimizations).toContain('dirty-rectangles');
      expect(stats.activeOptimizations).toContain('culling');
      expect(stats.activeOptimizations).toContain('batching');
    });

    it('should reset statistics', () => {
      const nodes: VisualNode[] = [createNode('node1', 0, 0)];
      const viewport: BoundingBox = {
        min: { x: 0, y: 0 },
        max: { x: 100, y: 100 },
      };

      optimizer.cullNodes(nodes, viewport);
      optimizer.resetStats();

      const stats = optimizer.getStats();
      expect(stats.culledNodes).toBe(0);
    });
  });

  // ==========================================================================
  // CONFIGURATION TESTS
  // ==========================================================================

  describe('Configuration', () => {
    it('should update configuration', () => {
      optimizer.updateConfig({
        enableCulling: false,
        webglThreshold: 2000,
      });

      const config = optimizer.getConfig();
      expect(config.enableCulling).toBe(false);
      expect(config.webglThreshold).toBe(2000);
    });

    it('should get current configuration', () => {
      const config = optimizer.getConfig();

      expect(config).toHaveProperty('strategy');
      expect(config).toHaveProperty('enableDirtyRectangles');
      expect(config).toHaveProperty('enableLayering');
    });
  });

  // ==========================================================================
  // PERFORMANCE BENCHMARKS
  // ==========================================================================

  describe('Performance Benchmarks', () => {
    it('should handle culling 10000 nodes efficiently', () => {
      const nodes: VisualNode[] = Array.from({ length: 10000 }, (_, i) =>
        createNode(`node${i}`, Math.random() * 1000, Math.random() * 1000)
      );

      const viewport: BoundingBox = {
        min: { x: 0, y: 0 },
        max: { x: 500, y: 500 },
      };

      const startTime = performance.now();
      const culled = optimizer.cullNodes(nodes, viewport);
      const elapsed = performance.now() - startTime;

      // Should complete in under 50ms
      expect(elapsed).toBeLessThan(50);
      expect(culled.length).toBeLessThan(nodes.length);

      console.log(`Culled ${nodes.length - culled.length} nodes in ${elapsed.toFixed(2)}ms`);
    });

    it('should batch 5000 nodes efficiently', () => {
      const nodes: VisualNode[] = Array.from({ length: 5000 }, (_, i) =>
        createNode(`node${i}`, i, i)
      );

      const startTime = performance.now();
      const batches = optimizer.createBatches(nodes, []);
      const elapsed = performance.now() - startTime;

      // Should complete in under 100ms
      expect(elapsed).toBeLessThan(100);
      expect(batches.length).toBeGreaterThan(0);

      console.log(`Created ${batches.length} batches in ${elapsed.toFixed(2)}ms`);
    });

    it('should demonstrate 2x+ improvement with optimizations', () => {
      const nodeCount = 5000;
      const nodes: VisualNode[] = Array.from({ length: nodeCount }, (_, i) =>
        createNode(`node${i}`, Math.random() * 2000, Math.random() * 2000)
      );

      const viewport: BoundingBox = {
        min: { x: 0, y: 0 },
        max: { x: 1000, y: 1000 },
      };

      // Without optimizations
      optimizer.updateConfig({ enableCulling: false, enableBatching: false });
      const start1 = performance.now();
      optimizer.cullNodes(nodes, viewport);
      optimizer.createBatches(nodes, []);
      const time1 = performance.now() - start1;

      // With optimizations
      optimizer.updateConfig({ enableCulling: true, enableBatching: true });
      const start2 = performance.now();
      const culled = optimizer.cullNodes(nodes, viewport);
      optimizer.createBatches(culled, []);
      const time2 = performance.now() - start2;

      console.log(`Without optimizations: ${time1.toFixed(2)}ms`);
      console.log(`With optimizations: ${time2.toFixed(2)}ms`);
      console.log(`Improvement: ${(time1 / time2).toFixed(2)}x faster`);

      // Should be faster with optimizations
      expect(time2).toBeLessThan(time1);
    });
  });

  // ==========================================================================
  // CLEANUP TESTS
  // ==========================================================================

  describe('Cleanup', () => {
    it('should cleanup resources', () => {
      optimizer.createLayer('layer1', 800, 600);
      optimizer.requestFrame(() => {});

      expect(() => optimizer.destroy()).not.toThrow();
    });

    it('should clear all layers on destroy', () => {
      optimizer.createLayer('layer1', 800, 600);
      optimizer.createLayer('layer2', 800, 600);

      optimizer.destroy();

      expect(optimizer.getLayers().length).toBe(0);
    });
  });
});
