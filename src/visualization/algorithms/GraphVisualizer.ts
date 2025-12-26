/**
 * Graph Algorithm Visualizer
 *
 * Production-ready component for visualizing graph algorithms step-by-step.
 * Supports BFS, DFS, Dijkstra, Bellman-Ford, A*, Prim's, and Kruskal's algorithms
 * with configurable layouts and Cytoscape.js integration.
 *
 * @module visualization/algorithms/GraphVisualizer
 */

import { BaseVisualization } from '../core/base-visualization';
import type {
  VisualizationConfig,
  VisualNode,
  VisualEdge,
  ExecutionStep,
  LayoutConfig,
} from '../core/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Supported graph algorithms
 */
export type GraphAlgorithm =
  | 'bfs'
  | 'dfs'
  | 'dijkstra'
  | 'bellman-ford'
  | 'astar'
  | 'prim'
  | 'kruskal';

/**
 * Node states during algorithm execution
 */
export type NodeState =
  | 'default'
  | 'visited'
  | 'current'
  | 'in-queue'
  | 'in-stack'
  | 'start'
  | 'end'
  | 'path';

/**
 * Edge states during algorithm execution
 */
export type EdgeState =
  | 'default'
  | 'traversed'
  | 'path'
  | 'tree-edge'
  | 'back-edge'
  | 'cross-edge'
  | 'forward-edge';

/**
 * Layout algorithms for graph rendering
 */
export type GraphLayout = 'force' | 'hierarchical' | 'circular';

/**
 * Graph node representation
 */
export interface GraphNode {
  /** Unique node identifier */
  id: string;

  /** Node label/display value */
  label: string;

  /** Node data payload */
  data?: any;

  /** Optional initial position */
  position?: { x: number; y: number };
}

/**
 * Graph edge representation
 */
export interface GraphEdge {
  /** Unique edge identifier */
  id: string;

  /** Source node ID */
  source: string;

  /** Target node ID */
  target: string;

  /** Edge weight (for weighted algorithms) */
  weight?: number;

  /** Edge label */
  label?: string;
}

/**
 * Configuration for graph visualizer
 */
export interface GraphVisualizerConfig extends VisualizationConfig {
  /** Algorithm to visualize */
  algorithm: GraphAlgorithm;

  /** Graph nodes */
  nodes: GraphNode[];

  /** Graph edges */
  edges: GraphEdge[];

  /** Start node ID (required for traversal algorithms) */
  startNode?: string;

  /** End node ID (required for pathfinding algorithms) */
  endNode?: string;

  /** Whether graph is directed */
  directed?: boolean;

  /** Whether graph is weighted */
  weighted?: boolean;

  /** Layout algorithm */
  layout?: GraphLayout;

  /** Step delay in milliseconds */
  stepDelay?: number;

  /** Show distances on nodes (for shortest path algorithms) */
  showDistances?: boolean;

  /** Highlight final path */
  highlightPath?: boolean;
}

/**
 * Traversal step information
 */
export interface TraversalStep {
  /** Step index */
  index: number;

  /** Current node being visited */
  currentNode: string;

  /** Nodes visited so far */
  visited: Set<string>;

  /** Queue/stack state (for BFS/DFS) */
  frontier?: string[];

  /** Distances from start (for shortest path) */
  distances?: Map<string, number>;

  /** Previous nodes in path */
  previous?: Map<string, string | null>;

  /** Current edge being explored */
  currentEdge?: string;

  /** Edge classification (for DFS) */
  edgeType?: EdgeState;

  /** Step description */
  description: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Algorithm result
 */
export interface AlgorithmResult {
  /** Final path (for pathfinding algorithms) */
  path?: string[];

  /** Total path cost */
  cost?: number;

  /** All visited nodes */
  visited: Set<string>;

  /** Distances from start */
  distances?: Map<string, number>;

  /** Minimum spanning tree edges (for Prim/Kruskal) */
  mstEdges?: string[];

  /** Total MST weight */
  mstWeight?: number;

  /** All execution steps */
  steps: TraversalStep[];
}

// ============================================================================
// GRAPH VISUALIZER CLASS
// ============================================================================

/**
 * Graph algorithm visualizer with step-by-step execution
 */
export class GraphVisualizer extends BaseVisualization {
  private graphConfig: GraphVisualizerConfig;
  private result: AlgorithmResult | null = null;
  private currentStepIndex = 0;
  private nodeStates: Map<string, NodeState> = new Map();
  private edgeStates: Map<string, EdgeState> = new Map();
  private distances: Map<string, number> = new Map();
  private cytoscapeInstance: any = null; // Cytoscape instance

  // Color schemes for different states
  private readonly nodeColors: Record<NodeState, string> = {
    default: '#94a3b8',
    visited: '#60a5fa',
    current: '#f59e0b',
    'in-queue': '#a78bfa',
    'in-stack': '#ec4899',
    start: '#10b981',
    end: '#ef4444',
    path: '#22c55e',
  };

  private readonly edgeColors: Record<EdgeState, string> = {
    default: '#cbd5e1',
    traversed: '#60a5fa',
    path: '#22c55e',
    'tree-edge': '#10b981',
    'back-edge': '#ef4444',
    'cross-edge': '#f59e0b',
    'forward-edge': '#a78bfa',
  };

  constructor(config: GraphVisualizerConfig) {
    super(config);
    this.graphConfig = config;
    this.validateGraphConfig(config);
  }

  // ========================================================================
  // VALIDATION
  // ========================================================================

  /**
   * Validate graph-specific configuration
   */
  private validateGraphConfig(config: GraphVisualizerConfig): void {
    if (!config.nodes || config.nodes.length === 0) {
      throw new Error('At least one node is required');
    }

    if (!config.edges) {
      config.edges = [];
    }

    // Validate edges reference valid nodes
    const nodeIds = new Set(config.nodes.map((n) => n.id));
    for (const edge of config.edges) {
      if (!nodeIds.has(edge.source)) {
        throw new Error(`Edge ${edge.id}: source node ${edge.source} not found`);
      }
      if (!nodeIds.has(edge.target)) {
        throw new Error(`Edge ${edge.id}: target node ${edge.target} not found`);
      }
    }

    // Validate start node for traversal algorithms
    const needsStart = ['bfs', 'dfs', 'dijkstra', 'bellman-ford', 'astar', 'prim'];
    if (needsStart.includes(config.algorithm) && !config.startNode) {
      throw new Error(`Algorithm ${config.algorithm} requires a start node`);
    }

    if (config.startNode && !nodeIds.has(config.startNode)) {
      throw new Error(`Start node ${config.startNode} not found`);
    }

    // Validate end node for pathfinding
    const needsEnd = ['dijkstra', 'bellman-ford', 'astar'];
    if (needsEnd.includes(config.algorithm) && config.endNode && !nodeIds.has(config.endNode)) {
      throw new Error(`End node ${config.endNode} not found`);
    }

    // Validate weights for weighted algorithms
    const needsWeights = ['dijkstra', 'bellman-ford', 'astar', 'prim', 'kruskal'];
    if (needsWeights.includes(config.algorithm)) {
      for (const edge of config.edges) {
        if (edge.weight === undefined || edge.weight < 0) {
          throw new Error(`Edge ${edge.id} missing valid weight for ${config.algorithm}`);
        }
      }
    }
  }

  // ========================================================================
  // RENDERER IMPLEMENTATION
  // ========================================================================

  protected async initializeRenderer(container: HTMLElement): Promise<void> {
    // Create Cytoscape container
    const cytoscapeDiv = document.createElement('div');
    cytoscapeDiv.style.width = '100%';
    cytoscapeDiv.style.height = '100%';
    container.appendChild(cytoscapeDiv);

    // Initialize Cytoscape (assumes cytoscape is available globally)
    if (typeof window !== 'undefined' && (window as any).cytoscape) {
      const cytoscape = (window as any).cytoscape;

      this.cytoscapeInstance = cytoscape({
        container: cytoscapeDiv,
        style: this.getCytoscapeStyles(),
        layout: this.getLayoutConfig(this.graphConfig.layout || 'force'),
      });

      // Convert graph data to Cytoscape format
      this.updateCytoscapeData();
    } else {
      // Fallback to canvas/SVG rendering
      console.warn('Cytoscape not available, using fallback renderer');
    }
  }

  protected cleanupRenderer(): void {
    if (this.cytoscapeInstance) {
      this.cytoscapeInstance.destroy();
      this.cytoscapeInstance = null;
    }
  }

  protected async applyLayoutInternal(config: LayoutConfig): Promise<void> {
    if (this.cytoscapeInstance) {
      const layout = this.cytoscapeInstance.layout(
        this.getLayoutConfig(this.graphConfig.layout || 'force')
      );
      layout.run();
    }
  }

  render(): void {
    if (!this.isInitialized) {
      return;
    }

    if (this.cytoscapeInstance) {
      this.updateNodeStyles();
      this.updateEdgeStyles();
    }

    this.emit({
      type: 'render:complete',
      timestamp: Date.now(),
      source: this.config.id,
    });
  }

  // ========================================================================
  // CYTOSCAPE INTEGRATION
  // ========================================================================

  /**
   * Get Cytoscape style definitions
   */
  private getCytoscapeStyles(): any[] {
    return [
      {
        selector: 'node',
        style: {
          'background-color': '#94a3b8',
          'label': 'data(label)',
          'width': 40,
          'height': 40,
          'font-size': 12,
          'text-valign': 'center',
          'text-halign': 'center',
          'color': '#ffffff',
        },
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#cbd5e1',
          'target-arrow-color': '#cbd5e1',
          'target-arrow-shape': this.graphConfig.directed ? 'triangle' : 'none',
          'curve-style': 'bezier',
          'label': 'data(label)',
          'font-size': 10,
        },
      },
      // Node state styles
      ...Object.entries(this.nodeColors).map(([state, color]) => ({
        selector: `.state-${state}`,
        style: { 'background-color': color },
      })),
      // Edge state styles
      ...Object.entries(this.edgeColors).map(([state, color]) => ({
        selector: `.edge-state-${state}`,
        style: {
          'line-color': color,
          'target-arrow-color': color,
        },
      })),
    ];
  }

  /**
   * Get layout configuration for Cytoscape
   */
  private getLayoutConfig(layout: GraphLayout): any {
    const configs = {
      force: {
        name: 'cose',
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
      },
      hierarchical: {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 50,
        edgeSep: 10,
        rankSep: 100,
      },
      circular: {
        name: 'circle',
        radius: 200,
        startAngle: -Math.PI / 2,
        sweep: 2 * Math.PI,
      },
    };

    return configs[layout] || configs.force;
  }

  /**
   * Update Cytoscape data from graph config
   */
  private updateCytoscapeData(): void {
    if (!this.cytoscapeInstance) {
      return;
    }

    const elements = [
      ...this.graphConfig.nodes.map((node) => ({
        data: {
          id: node.id,
          label: node.label,
        },
        position: node.position,
      })),
      ...this.graphConfig.edges.map((edge) => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.weight !== undefined ? String(edge.weight) : (edge.label || ''),
        },
      })),
    ];

    this.cytoscapeInstance.elements().remove();
    this.cytoscapeInstance.add(elements);
  }

  /**
   * Update node styles based on current states
   */
  private updateNodeStyles(): void {
    if (!this.cytoscapeInstance) {
      return;
    }

    for (const node of this.graphConfig.nodes) {
      const state = this.nodeStates.get(node.id) || 'default';
      const cyNode = this.cytoscapeInstance.getElementById(node.id);

      // Remove all state classes
      Object.keys(this.nodeColors).forEach((s) => {
        cyNode.removeClass(`state-${s}`);
      });

      // Add current state class
      cyNode.addClass(`state-${state}`);

      // Show distance if available
      if (this.graphConfig.showDistances && this.distances.has(node.id)) {
        const dist = this.distances.get(node.id);
        cyNode.data('label', `${node.label}\n(${dist === Infinity ? '∞' : dist})`);
      }
    }
  }

  /**
   * Update edge styles based on current states
   */
  private updateEdgeStyles(): void {
    if (!this.cytoscapeInstance) {
      return;
    }

    for (const edge of this.graphConfig.edges) {
      const state = this.edgeStates.get(edge.id) || 'default';
      const cyEdge = this.cytoscapeInstance.getElementById(edge.id);

      // Remove all state classes
      Object.keys(this.edgeColors).forEach((s) => {
        cyEdge.removeClass(`edge-state-${s}`);
      });

      // Add current state class
      cyEdge.addClass(`edge-state-${state}`);
    }
  }

  // ========================================================================
  // ALGORITHM EXECUTION
  // ========================================================================

  /**
   * Generate traversal steps for the selected algorithm
   */
  public generateTraversalSteps(
    graph?: { nodes: GraphNode[]; edges: GraphEdge[] },
    algorithm?: GraphAlgorithm,
    startNode?: string,
    endNode?: string
  ): AlgorithmResult {
    const nodes = graph?.nodes || this.graphConfig.nodes;
    const edges = graph?.edges || this.graphConfig.edges;
    const algo = algorithm || this.graphConfig.algorithm;
    const start = startNode || this.graphConfig.startNode;
    const end = endNode || this.graphConfig.endNode;

    // Build adjacency list
    const adjacencyList = this.buildAdjacencyList(nodes, edges);

    switch (algo) {
      case 'bfs':
        return this.executeBFS(adjacencyList, start!, nodes);
      case 'dfs':
        return this.executeDFS(adjacencyList, start!, nodes);
      case 'dijkstra':
        return this.executeDijkstra(adjacencyList, start!, end, nodes, edges);
      case 'bellman-ford':
        return this.executeBellmanFord(adjacencyList, start!, end, nodes, edges);
      case 'astar':
        return this.executeAStar(adjacencyList, start!, end!, nodes, edges);
      case 'prim':
        return this.executePrim(adjacencyList, start!, nodes, edges);
      case 'kruskal':
        return this.executeKruskal(nodes, edges);
      default:
        throw new Error(`Unknown algorithm: ${algo}`);
    }
  }

  /**
   * Build adjacency list from nodes and edges
   */
  private buildAdjacencyList(
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): Map<string, Array<{ node: string; weight: number; edgeId: string }>> {
    const adj = new Map<string, Array<{ node: string; weight: number; edgeId: string }>>();

    // Initialize with all nodes
    for (const node of nodes) {
      adj.set(node.id, []);
    }

    // Add edges
    for (const edge of edges) {
      adj.get(edge.source)!.push({
        node: edge.target,
        weight: edge.weight ?? 1,
        edgeId: edge.id,
      });

      // Add reverse edge for undirected graphs
      if (!this.graphConfig.directed) {
        adj.get(edge.target)!.push({
          node: edge.source,
          weight: edge.weight ?? 1,
          edgeId: edge.id,
        });
      }
    }

    return adj;
  }

  // ========================================================================
  // BFS ALGORITHM
  // ========================================================================

  /**
   * Execute Breadth-First Search
   */
  private executeBFS(
    adj: Map<string, Array<{ node: string; weight: number; edgeId: string }>>,
    start: string,
    nodes: GraphNode[]
  ): AlgorithmResult {
    const steps: TraversalStep[] = [];
    const visited = new Set<string>();
    const queue: string[] = [start];
    let stepIndex = 0;

    steps.push({
      index: stepIndex++,
      currentNode: start,
      visited: new Set(visited),
      frontier: [...queue],
      description: `Initialize BFS with start node ${start}`,
    });

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      steps.push({
        index: stepIndex++,
        currentNode: current,
        visited: new Set(visited),
        frontier: [...queue],
        description: `Visit node ${current}`,
      });

      // Explore neighbors
      for (const { node: neighbor, edgeId } of adj.get(current) || []) {
        if (!visited.has(neighbor) && !queue.includes(neighbor)) {
          queue.push(neighbor);

          steps.push({
            index: stepIndex++,
            currentNode: current,
            visited: new Set(visited),
            frontier: [...queue],
            currentEdge: edgeId,
            edgeType: 'tree-edge',
            description: `Enqueue neighbor ${neighbor}`,
          });
        }
      }
    }

    return {
      visited,
      steps,
    };
  }

  // ========================================================================
  // DFS ALGORITHM
  // ========================================================================

  /**
   * Execute Depth-First Search
   */
  private executeDFS(
    adj: Map<string, Array<{ node: string; weight: number; edgeId: string }>>,
    start: string,
    nodes: GraphNode[]
  ): AlgorithmResult {
    const steps: TraversalStep[] = [];
    const visited = new Set<string>();
    const stack: string[] = [start];
    let stepIndex = 0;

    steps.push({
      index: stepIndex++,
      currentNode: start,
      visited: new Set(visited),
      frontier: [...stack],
      description: `Initialize DFS with start node ${start}`,
    });

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      steps.push({
        index: stepIndex++,
        currentNode: current,
        visited: new Set(visited),
        frontier: [...stack],
        description: `Visit node ${current}`,
      });

      // Explore neighbors (reverse order to maintain left-to-right traversal)
      const neighbors = adj.get(current) || [];
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const { node: neighbor, edgeId } = neighbors[i];

        if (!visited.has(neighbor)) {
          stack.push(neighbor);

          steps.push({
            index: stepIndex++,
            currentNode: current,
            visited: new Set(visited),
            frontier: [...stack],
            currentEdge: edgeId,
            edgeType: 'tree-edge',
            description: `Push neighbor ${neighbor} onto stack`,
          });
        }
      }
    }

    return {
      visited,
      steps,
    };
  }

  // ========================================================================
  // DIJKSTRA'S ALGORITHM
  // ========================================================================

  /**
   * Execute Dijkstra's shortest path algorithm
   */
  private executeDijkstra(
    adj: Map<string, Array<{ node: string; weight: number; edgeId: string }>>,
    start: string,
    end: string | undefined,
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): AlgorithmResult {
    const steps: TraversalStep[] = [];
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const visited = new Set<string>();
    const pq: Array<{ node: string; dist: number }> = [];
    let stepIndex = 0;

    // Initialize distances
    for (const node of nodes) {
      distances.set(node.id, node.id === start ? 0 : Infinity);
      previous.set(node.id, null);
    }

    pq.push({ node: start, dist: 0 });

    steps.push({
      index: stepIndex++,
      currentNode: start,
      visited: new Set(visited),
      distances: new Map(distances),
      previous: new Map(previous),
      description: `Initialize Dijkstra's algorithm from ${start}`,
    });

    while (pq.length > 0) {
      // Get node with minimum distance
      pq.sort((a, b) => a.dist - b.dist);
      const { node: current, dist: currentDist } = pq.shift()!;

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      steps.push({
        index: stepIndex++,
        currentNode: current,
        visited: new Set(visited),
        distances: new Map(distances),
        previous: new Map(previous),
        description: `Visit node ${current} with distance ${currentDist}`,
      });

      // Early termination if target reached
      if (end && current === end) {
        steps.push({
          index: stepIndex++,
          currentNode: current,
          visited: new Set(visited),
          distances: new Map(distances),
          previous: new Map(previous),
          description: `Reached target node ${end}`,
        });
        break;
      }

      // Explore neighbors
      for (const { node: neighbor, weight, edgeId } of adj.get(current) || []) {
        if (visited.has(neighbor)) {
          continue;
        }

        const newDist = currentDist + weight;
        const oldDist = distances.get(neighbor)!;

        if (newDist < oldDist) {
          distances.set(neighbor, newDist);
          previous.set(neighbor, current);
          pq.push({ node: neighbor, dist: newDist });

          steps.push({
            index: stepIndex++,
            currentNode: current,
            visited: new Set(visited),
            distances: new Map(distances),
            previous: new Map(previous),
            currentEdge: edgeId,
            description: `Update distance to ${neighbor}: ${oldDist} → ${newDist}`,
          });
        }
      }
    }

    // Reconstruct path if end node specified
    let path: string[] | undefined;
    let cost: number | undefined;

    if (end && previous.get(end) !== undefined) {
      path = [];
      let current: string | null = end;

      while (current !== null) {
        path.unshift(current);
        current = previous.get(current) || null;
      }

      cost = distances.get(end);
    }

    return {
      visited,
      distances,
      path,
      cost,
      steps,
    };
  }

  // ========================================================================
  // BELLMAN-FORD ALGORITHM
  // ========================================================================

  /**
   * Execute Bellman-Ford shortest path algorithm
   */
  private executeBellmanFord(
    adj: Map<string, Array<{ node: string; weight: number; edgeId: string }>>,
    start: string,
    end: string | undefined,
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): AlgorithmResult {
    const steps: TraversalStep[] = [];
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const visited = new Set<string>();
    let stepIndex = 0;

    // Initialize distances
    for (const node of nodes) {
      distances.set(node.id, node.id === start ? 0 : Infinity);
      previous.set(node.id, null);
    }

    steps.push({
      index: stepIndex++,
      currentNode: start,
      visited: new Set(visited),
      distances: new Map(distances),
      previous: new Map(previous),
      description: `Initialize Bellman-Ford from ${start}`,
    });

    // Relax edges |V| - 1 times
    for (let i = 0; i < nodes.length - 1; i++) {
      let updated = false;

      for (const edge of edges) {
        const u = edge.source;
        const v = edge.target;
        const weight = edge.weight!;

        const distU = distances.get(u)!;
        const distV = distances.get(v)!;

        if (distU !== Infinity && distU + weight < distV) {
          distances.set(v, distU + weight);
          previous.set(v, u);
          updated = true;

          steps.push({
            index: stepIndex++,
            currentNode: u,
            visited: new Set(visited),
            distances: new Map(distances),
            previous: new Map(previous),
            currentEdge: edge.id,
            description: `Iteration ${i + 1}: Relax edge ${u}→${v}, distance ${distV} → ${distU + weight}`,
          });
        }
      }

      if (!updated) {
        break;
      }
    }

    // Reconstruct path
    let path: string[] | undefined;
    let cost: number | undefined;

    if (end) {
      path = [];
      let current: string | null = end;

      while (current !== null) {
        path.unshift(current);
        visited.add(current);
        current = previous.get(current) || null;
      }

      cost = distances.get(end);
    }

    return {
      visited,
      distances,
      path,
      cost,
      steps,
    };
  }

  // ========================================================================
  // A* ALGORITHM
  // ========================================================================

  /**
   * Execute A* pathfinding algorithm
   */
  private executeAStar(
    adj: Map<string, Array<{ node: string; weight: number; edgeId: string }>>,
    start: string,
    end: string,
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): AlgorithmResult {
    const steps: TraversalStep[] = [];
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const visited = new Set<string>();
    const openSet: Array<{ node: string; f: number }> = [];
    let stepIndex = 0;

    // Heuristic: Euclidean distance (requires node positions)
    const heuristic = (nodeId: string): number => {
      const node = nodes.find((n) => n.id === nodeId);
      const endNode = nodes.find((n) => n.id === end);

      if (!node?.position || !endNode?.position) {
        return 0; // Fallback if positions not available
      }

      const dx = node.position.x - endNode.position.x;
      const dy = node.position.y - endNode.position.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Initialize
    for (const node of nodes) {
      gScore.set(node.id, node.id === start ? 0 : Infinity);
      fScore.set(node.id, node.id === start ? heuristic(start) : Infinity);
      previous.set(node.id, null);
    }

    openSet.push({ node: start, f: fScore.get(start)! });

    steps.push({
      index: stepIndex++,
      currentNode: start,
      visited: new Set(visited),
      distances: new Map(gScore),
      previous: new Map(previous),
      description: `Initialize A* from ${start} to ${end}`,
    });

    while (openSet.length > 0) {
      // Get node with lowest f-score
      openSet.sort((a, b) => a.f - b.f);
      const { node: current } = openSet.shift()!;

      if (current === end) {
        visited.add(current);
        steps.push({
          index: stepIndex++,
          currentNode: current,
          visited: new Set(visited),
          distances: new Map(gScore),
          previous: new Map(previous),
          description: `Reached target node ${end}`,
        });
        break;
      }

      visited.add(current);

      steps.push({
        index: stepIndex++,
        currentNode: current,
        visited: new Set(visited),
        distances: new Map(gScore),
        previous: new Map(previous),
        description: `Visit node ${current}, f=${fScore.get(current)?.toFixed(2)}`,
      });

      // Explore neighbors
      for (const { node: neighbor, weight, edgeId } of adj.get(current) || []) {
        if (visited.has(neighbor)) {
          continue;
        }

        const tentativeG = gScore.get(current)! + weight;

        if (tentativeG < gScore.get(neighbor)!) {
          previous.set(neighbor, current);
          gScore.set(neighbor, tentativeG);
          fScore.set(neighbor, tentativeG + heuristic(neighbor));

          // Add to open set if not already present
          if (!openSet.some((item) => item.node === neighbor)) {
            openSet.push({ node: neighbor, f: fScore.get(neighbor)! });
          }

          steps.push({
            index: stepIndex++,
            currentNode: current,
            visited: new Set(visited),
            distances: new Map(gScore),
            previous: new Map(previous),
            currentEdge: edgeId,
            description: `Update ${neighbor}: g=${tentativeG.toFixed(2)}, h=${heuristic(neighbor).toFixed(2)}, f=${fScore.get(neighbor)!.toFixed(2)}`,
          });
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let current: string | null = end;

    while (current !== null) {
      path.unshift(current);
      current = previous.get(current) || null;
    }

    return {
      visited,
      distances: gScore,
      path,
      cost: gScore.get(end),
      steps,
    };
  }

  // ========================================================================
  // PRIM'S ALGORITHM
  // ========================================================================

  /**
   * Execute Prim's minimum spanning tree algorithm
   */
  private executePrim(
    adj: Map<string, Array<{ node: string; weight: number; edgeId: string }>>,
    start: string,
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): AlgorithmResult {
    const steps: TraversalStep[] = [];
    const visited = new Set<string>();
    const mstEdges: string[] = [];
    const pq: Array<{ node: string; weight: number; edgeId: string; from: string | null }> = [];
    let mstWeight = 0;
    let stepIndex = 0;

    pq.push({ node: start, weight: 0, edgeId: '', from: null });

    steps.push({
      index: stepIndex++,
      currentNode: start,
      visited: new Set(visited),
      description: `Initialize Prim's MST from ${start}`,
    });

    while (pq.length > 0) {
      // Get edge with minimum weight
      pq.sort((a, b) => a.weight - b.weight);
      const { node: current, weight, edgeId, from } = pq.shift()!;

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      if (from !== null) {
        mstEdges.push(edgeId);
        mstWeight += weight;
      }

      steps.push({
        index: stepIndex++,
        currentNode: current,
        visited: new Set(visited),
        currentEdge: edgeId || undefined,
        edgeType: edgeId ? 'tree-edge' : undefined,
        description: `Add node ${current} to MST${weight > 0 ? ` (edge weight: ${weight})` : ''}`,
        metadata: { mstWeight },
      });

      // Add all adjacent edges
      for (const { node: neighbor, weight: edgeWeight, edgeId: adjEdgeId } of adj.get(current) || []) {
        if (!visited.has(neighbor)) {
          pq.push({
            node: neighbor,
            weight: edgeWeight,
            edgeId: adjEdgeId,
            from: current,
          });
        }
      }
    }

    return {
      visited,
      mstEdges,
      mstWeight,
      steps,
    };
  }

  // ========================================================================
  // KRUSKAL'S ALGORITHM
  // ========================================================================

  /**
   * Execute Kruskal's minimum spanning tree algorithm
   */
  private executeKruskal(nodes: GraphNode[], edges: GraphEdge[]): AlgorithmResult {
    const steps: TraversalStep[] = [];
    const visited = new Set<string>();
    const mstEdges: string[] = [];
    let mstWeight = 0;
    let stepIndex = 0;

    // Union-Find data structure
    const parent = new Map<string, string>();
    const rank = new Map<string, number>();

    // Initialize
    for (const node of nodes) {
      parent.set(node.id, node.id);
      rank.set(node.id, 0);
    }

    const find = (x: string): string => {
      if (parent.get(x) !== x) {
        parent.set(x, find(parent.get(x)!));
      }
      return parent.get(x)!;
    };

    const union = (x: string, y: string): boolean => {
      const rootX = find(x);
      const rootY = find(y);

      if (rootX === rootY) {
        return false;
      }

      const rankX = rank.get(rootX)!;
      const rankY = rank.get(rootY)!;

      if (rankX < rankY) {
        parent.set(rootX, rootY);
      } else if (rankX > rankY) {
        parent.set(rootY, rootX);
      } else {
        parent.set(rootY, rootX);
        rank.set(rootX, rankX + 1);
      }

      return true;
    };

    // Sort edges by weight
    const sortedEdges = [...edges].sort((a, b) => (a.weight || 0) - (b.weight || 0));

    steps.push({
      index: stepIndex++,
      currentNode: sortedEdges[0]?.source || nodes[0].id,
      visited: new Set(visited),
      description: `Initialize Kruskal's MST, sort ${edges.length} edges`,
    });

    // Process edges
    for (const edge of sortedEdges) {
      if (union(edge.source, edge.target)) {
        mstEdges.push(edge.id);
        mstWeight += edge.weight || 0;
        visited.add(edge.source);
        visited.add(edge.target);

        steps.push({
          index: stepIndex++,
          currentNode: edge.source,
          visited: new Set(visited),
          currentEdge: edge.id,
          edgeType: 'tree-edge',
          description: `Add edge ${edge.source}-${edge.target} (weight: ${edge.weight}) to MST`,
          metadata: { mstWeight },
        });
      } else {
        steps.push({
          index: stepIndex++,
          currentNode: edge.source,
          visited: new Set(visited),
          currentEdge: edge.id,
          description: `Skip edge ${edge.source}-${edge.target} (would create cycle)`,
        });
      }

      // MST complete when we have n-1 edges
      if (mstEdges.length === nodes.length - 1) {
        break;
      }
    }

    return {
      visited,
      mstEdges,
      mstWeight,
      steps,
    };
  }

  // ========================================================================
  // VISUALIZATION CONTROL
  // ========================================================================

  /**
   * Visualize a specific step
   */
  public visualizeStep(step: TraversalStep): void {
    this.currentStepIndex = step.index;

    // Reset all states
    this.nodeStates.clear();
    this.edgeStates.clear();

    // Mark start node
    if (this.graphConfig.startNode) {
      this.nodeStates.set(this.graphConfig.startNode, 'start');
    }

    // Mark end node
    if (this.graphConfig.endNode) {
      this.nodeStates.set(this.graphConfig.endNode, 'end');
    }

    // Mark visited nodes
    for (const nodeId of Array.from(step.visited)) {
      if (nodeId !== this.graphConfig.startNode && nodeId !== this.graphConfig.endNode) {
        this.nodeStates.set(nodeId, 'visited');
      }
    }

    // Mark current node
    this.nodeStates.set(step.currentNode, 'current');

    // Mark frontier (queue/stack)
    if (step.frontier) {
      for (const nodeId of step.frontier) {
        if (!step.visited.has(nodeId)) {
          this.nodeStates.set(
            nodeId,
            this.graphConfig.algorithm === 'bfs' ? 'in-queue' : 'in-stack'
          );
        }
      }
    }

    // Mark current edge
    if (step.currentEdge) {
      this.edgeStates.set(step.currentEdge, step.edgeType || 'traversed');
    }

    // Update distances
    if (step.distances) {
      this.distances = new Map(step.distances);
    }

    // Render
    this.render();

    // Emit step event
    this.emit({
      type: 'step:complete',
      timestamp: Date.now(),
      source: this.config.id,
      step: {
        index: step.index,
        description: step.description,
        affectedNodes: [step.currentNode],
        affectedEdges: step.currentEdge ? [step.currentEdge] : undefined,
        status: 'completed',
        data: step.metadata,
      },
    });
  }

  /**
   * Highlight the final path
   */
  public highlightPath(nodeIds: string[]): void {
    // Mark path nodes
    for (let i = 0; i < nodeIds.length; i++) {
      const nodeId = nodeIds[i];

      // Don't override start/end states
      if (nodeId === this.graphConfig.startNode) {
        continue;
      }
      if (nodeId === this.graphConfig.endNode) {
        continue;
      }

      this.nodeStates.set(nodeId, 'path');

      // Mark path edges
      if (i < nodeIds.length - 1) {
        const nextNodeId = nodeIds[i + 1];
        const edge = this.graphConfig.edges.find(
          (e) =>
            (e.source === nodeId && e.target === nextNodeId) ||
            (!this.graphConfig.directed && e.source === nextNodeId && e.target === nodeId)
        );

        if (edge) {
          this.edgeStates.set(edge.id, 'path');
        }
      }
    }

    this.render();
  }

  /**
   * Show distances on nodes
   */
  public showDistances(distances: Map<string, number>): void {
    this.distances = new Map(distances);
    this.render();
  }

  /**
   * Get count of visited nodes
   */
  public getVisitedCount(): number {
    return Array.from(this.nodeStates.values()).filter((state) => state === 'visited' || state === 'current').length;
  }

  /**
   * Get current algorithm result
   */
  public getResult(): AlgorithmResult | null {
    return this.result;
  }

  /**
   * Execute algorithm and store result
   */
  public execute(): AlgorithmResult {
    this.result = this.generateTraversalSteps();
    return this.result;
  }

  /**
   * Play through all steps with animation
   */
  public async playSteps(delayMs: number = this.graphConfig.stepDelay || 500): Promise<void> {
    if (!this.result) {
      this.execute();
    }

    if (!this.result) {
      throw new Error('No algorithm result available');
    }

    for (const step of this.result.steps) {
      this.visualizeStep(step);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Highlight final path if available
    if (this.graphConfig.highlightPath && this.result.path) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      this.highlightPath(this.result.path);
    }
  }
}
