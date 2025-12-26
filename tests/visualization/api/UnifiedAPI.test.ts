/**
 * UnifiedAPI Tests
 *
 * Test suite for unified API functionality, ensuring consistent
 * behavior across all visualizer types.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnifiedAPI } from '../../../src/visualization/api/UnifiedAPI';
import type { IVisualization } from '../../../src/visualization/core/interfaces';
import type {
  VisualizationConfig,
  VisualNode,
  VisualEdge,
} from '../../../src/visualization/core/types';

// ============================================================================
// MOCK VISUALIZER
// ============================================================================

class MockVisualizer implements IVisualization {
  private config: VisualizationConfig;
  private nodes: VisualNode[] = [];
  private edges: VisualEdge[] = [];
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(config: VisualizationConfig) {
    this.config = config;
  }

  getConfig(): VisualizationConfig {
    return this.config;
  }

  updateConfig(updates: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getRenderMode() {
    return this.config.renderMode;
  }

  setData(nodes: VisualNode[], edges?: VisualEdge[]): void {
    this.nodes = nodes;
    this.edges = edges || [];
  }

  getNodes(): VisualNode[] {
    return this.nodes;
  }

  getEdges(): VisualEdge[] {
    return this.edges;
  }

  updateNode(nodeId: string, updates: Partial<VisualNode>): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node) {
      Object.assign(node, updates);
    }
  }

  updateEdge(edgeId: string, updates: Partial<VisualEdge>): void {
    const edge = this.edges.find((e) => e.id === edgeId);
    if (edge) {
      Object.assign(edge, updates);
    }
  }

  addNode(node: VisualNode): void {
    this.nodes.push(node);
  }

  addEdge(edge: VisualEdge): void {
    this.edges.push(edge);
  }

  removeNode(nodeId: string): void {
    this.nodes = this.nodes.filter((n) => n.id !== nodeId);
  }

  removeEdge(edgeId: string): void {
    this.edges = this.edges.filter((e) => e.id !== edgeId);
  }

  clear(): void {
    this.nodes = [];
    this.edges = [];
  }

  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  render(): void {
    // Mock render
  }

  forceRender(): void {
    this.render();
  }

  resize(): void {
    // Mock resize
  }

  destroy(): void {
    // Mock destroy
  }

  getState() {
    return {
      timestamp: Date.now(),
      stepIndex: 0,
      nodes: this.nodes,
      edges: this.edges,
    };
  }

  setState(): void {
    // Mock setState
  }

  reset(): void {
    this.clear();
  }

  on(eventType: string, handler: Function) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
    return () => this.off(eventType, handler);
  }

  off(eventType: string, handler: Function): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event: any): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }
  }

  async applyLayout(): Promise<void> {
    return Promise.resolve();
  }

  getLayout() {
    return null;
  }

  getCameraPosition() {
    return null;
  }

  setCameraPosition(): void {
    // Mock
  }

  resetCamera(): void {
    // Mock
  }

  fitToView(): void {
    // Mock
  }

  getViewBounds() {
    return {
      min: { x: 0, y: 0 },
      max: { x: 100, y: 100 },
    };
  }

  getMetrics() {
    return {
      fps: 60,
      frameTime: 16.67,
      nodeCount: this.nodes.length,
      edgeCount: this.edges.length,
      timestamp: Date.now(),
    };
  }

  setPerformanceMonitoring(): void {
    // Mock
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('UnifiedAPI', () => {
  let mockVisualizer: MockVisualizer;
  let api: UnifiedAPI;
  let mockConfig: VisualizationConfig;

  beforeEach(() => {
    mockConfig = {
      id: 'test-viz',
      renderMode: '2d',
      width: 800,
      height: 600,
    };

    mockVisualizer = new MockVisualizer(mockConfig);
    api = new UnifiedAPI(mockVisualizer);
  });

  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================

  describe('Initialization', () => {
    it('should create API instance with visualizer', () => {
      expect(api).toBeInstanceOf(UnifiedAPI);
      expect(api.getVisualizer()).toBe(mockVisualizer);
    });

    it('should initialize visualizer with container', async () => {
      const container = document.createElement('div');
      const result = await api.initialize(container);

      expect(result.success).toBe(true);
      expect(result.metadata?.duration).toBeGreaterThanOrEqual(0);
    });

    it('should track initialization state', async () => {
      expect(api.isInitialized()).toBe(false);

      const container = document.createElement('div');
      await api.initialize(container);

      expect(api.isInitialized()).toBe(true);
    });
  });

  // ==========================================================================
  // DATA MANAGEMENT TESTS
  // ==========================================================================

  describe('Data Management', () => {
    it('should set data successfully', () => {
      const nodes: VisualNode[] = [
        { id: '1', data: {}, position: { x: 0, y: 0 } },
        { id: '2', data: {}, position: { x: 100, y: 100 } },
      ];

      const result = api.setData({ nodes });

      expect(result.success).toBe(true);
      expect(result.metadata?.nodeCount).toBe(2);
    });

    it('should get data successfully', () => {
      const nodes: VisualNode[] = [
        { id: '1', data: {}, position: { x: 0, y: 0 } },
      ];

      api.setData({ nodes });
      const result = api.getData();

      expect(result.success).toBe(true);
      expect(result.data?.nodes).toHaveLength(1);
    });

    it('should update node successfully', () => {
      const nodes: VisualNode[] = [
        { id: '1', data: {}, position: { x: 0, y: 0 } },
      ];

      api.setData({ nodes });
      const result = api.updateNode('1', {
        position: { x: 50, y: 50 },
      });

      expect(result.success).toBe(true);

      const dataResult = api.getData();
      expect(dataResult.data?.nodes[0].position.x).toBe(50);
    });

    it('should add node successfully', () => {
      const result = api.addNode({
        id: '1',
        data: {},
        position: { x: 0, y: 0 },
      });

      expect(result.success).toBe(true);

      const dataResult = api.getData();
      expect(dataResult.data?.nodes).toHaveLength(1);
    });

    it('should remove node successfully', () => {
      const nodes: VisualNode[] = [
        { id: '1', data: {}, position: { x: 0, y: 0 } },
      ];

      api.setData({ nodes });
      const result = api.removeNode('1');

      expect(result.success).toBe(true);

      const dataResult = api.getData();
      expect(dataResult.data?.nodes).toHaveLength(0);
    });

    it('should clear all data', () => {
      const nodes: VisualNode[] = [
        { id: '1', data: {}, position: { x: 0, y: 0 } },
        { id: '2', data: {}, position: { x: 100, y: 100 } },
      ];

      api.setData({ nodes });
      const result = api.clear();

      expect(result.success).toBe(true);

      const dataResult = api.getData();
      expect(dataResult.data?.nodes).toHaveLength(0);
    });
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('should render successfully', () => {
      const result = api.render();

      expect(result.success).toBe(true);
      expect(result.data?.frameTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.fps).toBeGreaterThan(0);
    });

    it('should track rendering state', () => {
      expect(api.isRendering()).toBe(false);
      // Rendering is synchronous in mock, so can't test during render
    });

    it('should resize visualization', () => {
      const result = api.resize(1024, 768);

      expect(result.success).toBe(true);

      const configResult = api.getConfig();
      expect(configResult.data?.width).toBe(1024);
      expect(configResult.data?.height).toBe(768);
    });
  });

  // ==========================================================================
  // CONFIGURATION TESTS
  // ==========================================================================

  describe('Configuration', () => {
    it('should get current configuration', () => {
      const result = api.getConfig();

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('test-viz');
    });

    it('should update configuration', () => {
      const result = api.updateConfig({
        backgroundColor: '#000000',
      });

      expect(result.success).toBe(true);

      const configResult = api.getConfig();
      expect(configResult.data?.backgroundColor).toBe('#000000');
    });
  });

  // ==========================================================================
  // PERFORMANCE TESTS
  // ==========================================================================

  describe('Performance', () => {
    it('should get performance metrics', () => {
      const result = api.getMetrics();

      expect(result.success).toBe(true);
      expect(result.data?.fps).toBeDefined();
      expect(result.data?.frameTime).toBeDefined();
    });

    it('should enable performance monitoring', () => {
      const result = api.setPerformanceMonitoring(true);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // TYPE GUARDS TESTS
  // ==========================================================================

  describe('Type Guards', () => {
    it('should identify 2D mode', () => {
      expect(api.is3DMode()).toBe(false);
    });

    it('should identify 3D mode', () => {
      const config3D: VisualizationConfig = {
        ...mockConfig,
        renderMode: '3d',
      };
      const viz3D = new MockVisualizer(config3D);
      const api3D = new UnifiedAPI(viz3D);

      expect(api3D.is3DMode()).toBe(true);
    });
  });

  // ==========================================================================
  // CLEANUP TESTS
  // ==========================================================================

  describe('Cleanup', () => {
    it('should destroy visualizer', () => {
      const result = api.destroy();

      expect(result.success).toBe(true);
      expect(api.isInitialized()).toBe(false);
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle errors in ApiResult', () => {
      const throwingViz = new MockVisualizer(mockConfig);
      throwingViz.render = () => {
        throw new Error('Render failed');
      };

      const throwingApi = new UnifiedAPI(throwingViz);
      const result = throwingApi.render();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Render failed');
    });
  });
});
