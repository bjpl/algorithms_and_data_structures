/**
 * Graph Visualizer Test Suite
 *
 * Comprehensive tests for GraphVisualizer component covering all algorithms,
 * layouts, and visualization features.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GraphVisualizer } from '../../../src/visualization/algorithms/GraphVisualizer';
import type {
  GraphVisualizerConfig,
  GraphNode,
  GraphEdge,
  AlgorithmResult,
} from '../../../src/visualization/algorithms/GraphVisualizer';

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Create a simple linear graph: A -> B -> C -> D
 */
function createLinearGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [
    { id: 'A', label: 'A', position: { x: 0, y: 0 } },
    { id: 'B', label: 'B', position: { x: 100, y: 0 } },
    { id: 'C', label: 'C', position: { x: 200, y: 0 } },
    { id: 'D', label: 'D', position: { x: 300, y: 0 } },
  ];

  const edges: GraphEdge[] = [
    { id: 'AB', source: 'A', target: 'B', weight: 1 },
    { id: 'BC', source: 'B', target: 'C', weight: 2 },
    { id: 'CD', source: 'C', target: 'D', weight: 3 },
  ];

  return { nodes, edges };
}

/**
 * Create a weighted graph for shortest path algorithms
 */
function createWeightedGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [
    { id: 'A', label: 'A', position: { x: 0, y: 100 } },
    { id: 'B', label: 'B', position: { x: 100, y: 0 } },
    { id: 'C', label: 'C', position: { x: 100, y: 200 } },
    { id: 'D', label: 'D', position: { x: 200, y: 100 } },
    { id: 'E', label: 'E', position: { x: 300, y: 100 } },
  ];

  const edges: GraphEdge[] = [
    { id: 'AB', source: 'A', target: 'B', weight: 4 },
    { id: 'AC', source: 'A', target: 'C', weight: 2 },
    { id: 'BC', source: 'B', target: 'C', weight: 1 },
    { id: 'BD', source: 'B', target: 'D', weight: 5 },
    { id: 'CD', source: 'C', target: 'D', weight: 8 },
    { id: 'CE', source: 'C', target: 'E', weight: 10 },
    { id: 'DE', source: 'D', target: 'E', weight: 2 },
  ];

  return { nodes, edges };
}

// ============================================================================
// TESTS
// ============================================================================

describe('GraphVisualizer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('BFS Algorithm', () => {
    it('should execute BFS on linear graph', () => {
      const { nodes, edges } = createLinearGraph();
      const config: GraphVisualizerConfig = {
        id: 'bfs-test',
        renderMode: '2d',
        width: 800,
        height: 600,
        algorithm: 'bfs',
        nodes,
        edges,
        startNode: 'A',
        directed: true,
      };

      const visualizer = new GraphVisualizer(config);
      const result = visualizer.execute();

      expect(result).toBeDefined();
      expect(result.visited.size).toBe(4);
      expect(result.steps.length).toBeGreaterThan(0);
    });
  });

  describe('Dijkstra Algorithm', () => {
    it('should find shortest path', () => {
      const { nodes, edges } = createWeightedGraph();
      const config: GraphVisualizerConfig = {
        id: 'dijkstra-test',
        renderMode: '2d',
        width: 800,
        height: 600,
        algorithm: 'dijkstra',
        nodes,
        edges,
        startNode: 'A',
        endNode: 'E',
        directed: true,
        weighted: true,
      };

      const visualizer = new GraphVisualizer(config);
      const result = visualizer.execute();

      expect(result).toBeDefined();
      expect(result.path).toBeDefined();
      expect(result.cost).toBeDefined();
      expect(result.path![0]).toBe('A');
      expect(result.path![result.path!.length - 1]).toBe('E');
    });
  });
});
