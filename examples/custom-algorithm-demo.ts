/**
 * Custom Algorithm Plugin Demo
 *
 * Demonstrates how to create and use custom visualization algorithms:
 * - Implementing custom algorithm interface
 * - Registering custom algorithms with the factory
 * - Creating custom step visualizations
 * - Plugin architecture patterns
 *
 * @example
 * ```typescript
 * const demo = new CustomAlgorithmDemo(document.getElementById('app')!);
 * await demo.initialize();
 * await demo.runCustomBellmanFord();
 * ```
 */

import { GraphVisualizer } from '../src/visualization/algorithms/GraphVisualizer';
import type {
  ExecutionStep,
  Node,
  Edge,
  AlgorithmResult,
} from '../src/visualization/core/interfaces';

/**
 * Custom Bellman-Ford Algorithm Implementation
 *
 * Finds shortest paths in graphs with negative edge weights
 */
class BellmanFordAlgorithm {
  private nodes: Node[];
  private edges: Edge[];
  private startNodeId: string;

  constructor(nodes: Node[], edges: Edge[], startNodeId: string) {
    this.nodes = nodes;
    this.edges = edges;
    this.startNodeId = startNodeId;
  }

  /**
   * Execute Bellman-Ford algorithm with step-by-step visualization
   */
  execute(): ExecutionStep[] {
    const steps: ExecutionStep[] = [];
    const distances: Map<string, number> = new Map();
    const predecessors: Map<string, string | null> = new Map();

    // Initialize distances
    for (const node of this.nodes) {
      distances.set(node.id, node.id === this.startNodeId ? 0 : Infinity);
      predecessors.set(node.id, null);
    }

    steps.push({
      index: 0,
      description: `Initialize distances: ${this.startNodeId} = 0, others = ∞`,
      status: 'running',
      affectedNodes: [this.startNodeId],
      affectedEdges: [],
      data: {
        distances: Object.fromEntries(distances),
        phase: 'initialization',
      },
    });

    // Relax edges |V| - 1 times
    const nodeCount = this.nodes.length;
    for (let i = 0; i < nodeCount - 1; i++) {
      let hasUpdate = false;

      for (const edge of this.edges) {
        const u = edge.source;
        const v = edge.target;
        const weight = edge.weight || 1;

        const distU = distances.get(u)!;
        const distV = distances.get(v)!;

        if (distU !== Infinity && distU + weight < distV) {
          distances.set(v, distU + weight);
          predecessors.set(v, u);
          hasUpdate = true;

          steps.push({
            index: steps.length,
            description: `Relax edge ${u}→${v}: ${distV} → ${distU + weight}`,
            status: 'running',
            affectedNodes: [u, v],
            affectedEdges: [edge.id],
            data: {
              distances: Object.fromEntries(distances),
              relaxedEdge: edge.id,
              iteration: i + 1,
              phase: 'relaxation',
            },
          });
        }
      }

      if (!hasUpdate) {
        steps.push({
          index: steps.length,
          description: 'No updates in this iteration, early termination',
          status: 'running',
          affectedNodes: [],
          affectedEdges: [],
          data: {
            iteration: i + 1,
            phase: 'early-termination',
          },
        });
        break;
      }
    }

    // Check for negative cycles
    for (const edge of this.edges) {
      const u = edge.source;
      const v = edge.target;
      const weight = edge.weight || 1;

      if (distances.get(u)! + weight < distances.get(v)!) {
        steps.push({
          index: steps.length,
          description: `Negative cycle detected involving edge ${u}→${v}`,
          status: 'error',
          affectedNodes: [u, v],
          affectedEdges: [edge.id],
          data: {
            phase: 'negative-cycle-detection',
            hasNegativeCycle: true,
          },
        });

        return steps;
      }
    }

    steps.push({
      index: steps.length,
      description: 'Bellman-Ford algorithm completed successfully',
      status: 'completed',
      affectedNodes: [],
      affectedEdges: [],
      data: {
        distances: Object.fromEntries(distances),
        predecessors: Object.fromEntries(predecessors),
        phase: 'completion',
      },
    });

    return steps;
  }

  /**
   * Reconstruct path from start to target
   */
  reconstructPath(targetNodeId: string, predecessors: Map<string, string | null>): string[] {
    const path: string[] = [];
    let current: string | null = targetNodeId;

    while (current !== null) {
      path.unshift(current);
      current = predecessors.get(current) || null;
    }

    return path;
  }
}

/**
 * Custom Bidirectional Search Algorithm
 *
 * Searches from both start and end simultaneously
 */
class BidirectionalSearchAlgorithm {
  private nodes: Node[];
  private edges: Edge[];
  private startNodeId: string;
  private endNodeId: string;

  constructor(nodes: Node[], edges: Edge[], startNodeId: string, endNodeId: string) {
    this.nodes = nodes;
    this.edges = edges;
    this.startNodeId = startNodeId;
    this.endNodeId = endNodeId;
  }

  execute(): ExecutionStep[] {
    const steps: ExecutionStep[] = [];
    const forwardQueue: string[] = [this.startNodeId];
    const backwardQueue: string[] = [this.endNodeId];
    const forwardVisited = new Set<string>([this.startNodeId]);
    const backwardVisited = new Set<string>([this.endNodeId]);
    const forwardParent = new Map<string, string>();
    const backwardParent = new Map<string, string>();

    steps.push({
      index: 0,
      description: 'Start bidirectional search from both ends',
      status: 'running',
      affectedNodes: [this.startNodeId, this.endNodeId],
      affectedEdges: [],
      data: {
        phase: 'initialization',
        direction: 'both',
      },
    });

    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    for (const edge of this.edges) {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
      adjacency.get(edge.source)!.push(edge.target);
      adjacency.get(edge.target)!.push(edge.source);
    }

    let meetingNode: string | null = null;

    while (forwardQueue.length > 0 && backwardQueue.length > 0 && !meetingNode) {
      // Forward search step
      if (forwardQueue.length > 0) {
        const current = forwardQueue.shift()!;
        const neighbors = adjacency.get(current) || [];

        for (const neighbor of neighbors) {
          if (!forwardVisited.has(neighbor)) {
            forwardVisited.add(neighbor);
            forwardQueue.push(neighbor);
            forwardParent.set(neighbor, current);

            steps.push({
              index: steps.length,
              description: `Forward: Visit ${neighbor} from ${current}`,
              status: 'running',
              affectedNodes: [current, neighbor],
              affectedEdges: this.edges
                .filter((e) => (e.source === current && e.target === neighbor) ||
                              (e.source === neighbor && e.target === current))
                .map((e) => e.id),
              data: {
                direction: 'forward',
                current,
                neighbor,
              },
            });

            // Check if paths meet
            if (backwardVisited.has(neighbor)) {
              meetingNode = neighbor;
              break;
            }
          }
        }
      }

      if (meetingNode) break;

      // Backward search step
      if (backwardQueue.length > 0) {
        const current = backwardQueue.shift()!;
        const neighbors = adjacency.get(current) || [];

        for (const neighbor of neighbors) {
          if (!backwardVisited.has(neighbor)) {
            backwardVisited.add(neighbor);
            backwardQueue.push(neighbor);
            backwardParent.set(neighbor, current);

            steps.push({
              index: steps.length,
              description: `Backward: Visit ${neighbor} from ${current}`,
              status: 'running',
              affectedNodes: [current, neighbor],
              affectedEdges: this.edges
                .filter((e) => (e.source === current && e.target === neighbor) ||
                              (e.source === neighbor && e.target === current))
                .map((e) => e.id),
              data: {
                direction: 'backward',
                current,
                neighbor,
              },
            });

            // Check if paths meet
            if (forwardVisited.has(neighbor)) {
              meetingNode = neighbor;
              break;
            }
          }
        }
      }
    }

    if (meetingNode) {
      const path = this.reconstructPath(meetingNode, forwardParent, backwardParent);

      steps.push({
        index: steps.length,
        description: `Paths meet at ${meetingNode}! Path found.`,
        status: 'completed',
        affectedNodes: path,
        affectedEdges: [],
        data: {
          meetingNode,
          path,
          pathLength: path.length,
        },
      });
    } else {
      steps.push({
        index: steps.length,
        description: 'No path found between start and end',
        status: 'error',
        affectedNodes: [],
        affectedEdges: [],
        data: {},
      });
    }

    return steps;
  }

  private reconstructPath(
    meetingNode: string,
    forwardParent: Map<string, string>,
    backwardParent: Map<string, string>
  ): string[] {
    // Build forward path
    const forwardPath: string[] = [];
    let current: string | undefined = meetingNode;
    while (current !== undefined) {
      forwardPath.unshift(current);
      current = forwardParent.get(current);
    }

    // Build backward path
    const backwardPath: string[] = [];
    current = backwardParent.get(meetingNode);
    while (current !== undefined) {
      backwardPath.push(current);
      current = backwardParent.get(current);
    }

    return [...forwardPath, ...backwardPath];
  }
}

export class CustomAlgorithmDemo {
  private container: HTMLElement;
  private visualizer: GraphVisualizer | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async initialize(): Promise<void> {
    console.log('Initializing Custom Algorithm Demo...');
    console.log('✓ Custom algorithms loaded');
  }

  /**
   * Demonstrate custom Bellman-Ford algorithm
   */
  async runCustomBellmanFord(): Promise<void> {
    console.log('\n=== Custom Bellman-Ford Algorithm ===\n');

    const nodes: Node[] = [
      { id: 'A', label: 'A', x: 100, y: 200 },
      { id: 'B', label: 'B', x: 300, y: 100 },
      { id: 'C', label: 'C', x: 500, y: 200 },
      { id: 'D', label: 'D', x: 300, y: 300 },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B', weight: 4 },
      { id: 'e2', source: 'A', target: 'D', weight: 5 },
      { id: 'e3', source: 'B', target: 'C', weight: 3 },
      { id: 'e4', source: 'D', target: 'C', weight: -2 }, // Negative weight!
      { id: 'e5', source: 'D', target: 'B', weight: -3 },
    ];

    const algorithm = new BellmanFordAlgorithm(nodes, edges, 'A');
    const steps = algorithm.execute();

    console.log(`Generated ${steps.length} execution steps`);

    // Visualize steps
    for (const step of steps) {
      console.log(`Step ${step.index}: ${step.description}`);
      if (step.data?.distances) {
        console.log('  Distances:', step.data.distances);
      }
      await this.sleep(500);
    }

    console.log('\n✓ Bellman-Ford demo complete');
  }

  /**
   * Demonstrate bidirectional search
   */
  async runBidirectionalSearch(): Promise<void> {
    console.log('\n=== Bidirectional Search Algorithm ===\n');

    const nodes: Node[] = Array.from({ length: 12 }, (_, i) => ({
      id: `node-${i}`,
      label: `N${i}`,
      x: (i % 4) * 150 + 100,
      y: Math.floor(i / 4) * 150 + 100,
    }));

    const edges: Edge[] = [
      { id: 'e1', source: 'node-0', target: 'node-1' },
      { id: 'e2', source: 'node-0', target: 'node-4' },
      { id: 'e3', source: 'node-1', target: 'node-2' },
      { id: 'e4', source: 'node-1', target: 'node-5' },
      { id: 'e5', source: 'node-2', target: 'node-3' },
      { id: 'e6', source: 'node-4', target: 'node-5' },
      { id: 'e7', source: 'node-5', target: 'node-6' },
      { id: 'e8', source: 'node-6', target: 'node-7' },
      { id: 'e9', source: 'node-7', target: 'node-11' },
      { id: 'e10', source: 'node-8', target: 'node-9' },
      { id: 'e11', source: 'node-9', target: 'node-10' },
      { id: 'e12', source: 'node-10', target: 'node-11' },
    ];

    const algorithm = new BidirectionalSearchAlgorithm(nodes, edges, 'node-0', 'node-11');
    const steps = algorithm.execute();

    console.log(`Generated ${steps.length} execution steps`);

    for (const step of steps) {
      const direction = step.data?.direction || 'both';
      console.log(`Step ${step.index} [${direction}]: ${step.description}`);
      await this.sleep(400);
    }

    console.log('\n✓ Bidirectional search demo complete');
  }

  /**
   * Demonstrate plugin registration pattern
   */
  demonstratePluginPattern(): void {
    console.log('\n=== Plugin Architecture Pattern ===\n');

    console.log('Custom algorithms can be registered with the factory:');
    console.log(`
// Define custom algorithm
class MyCustomAlgorithm {
  execute(nodes, edges, params): ExecutionStep[] {
    // Custom algorithm logic
    return steps;
  }
}

// Register with factory
VisualizationFactory.registerAlgorithm('my-algorithm', MyCustomAlgorithm);

// Use in visualizer
const visualizer = new GraphVisualizer({
  algorithm: 'my-algorithm',
  // ... other options
});
    `);

    console.log('✓ Plugin pattern demonstrated');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy(): void {
    this.visualizer?.destroy();
    this.container.innerHTML = '';
  }
}

export async function runDemo(containerId: string = 'app'): Promise<void> {
  const container = document.getElementById(containerId)!;
  const demo = new CustomAlgorithmDemo(container);

  await demo.initialize();
  await demo.runCustomBellmanFord();
  await demo.runBidirectionalSearch();
  demo.demonstratePluginPattern();
}
