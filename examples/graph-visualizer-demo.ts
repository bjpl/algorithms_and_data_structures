/**
 * Graph Visualizer Demo
 *
 * Demonstrates all graph algorithms with interactive examples
 */

import { GraphVisualizer } from '../src/visualization/algorithms/GraphVisualizer';
import type { GraphNode, GraphEdge } from '../src/visualization/algorithms/GraphVisualizer';

// ============================================================================
// SAMPLE GRAPHS
// ============================================================================

/**
 * Create a sample weighted graph for pathfinding
 */
function createPathfindingGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [
    { id: 'A', label: 'Start', position: { x: 50, y: 150 } },
    { id: 'B', label: 'B', position: { x: 150, y: 50 } },
    { id: 'C', label: 'C', position: { x: 150, y: 250 } },
    { id: 'D', label: 'D', position: { x: 300, y: 50 } },
    { id: 'E', label: 'E', position: { x: 300, y: 250 } },
    { id: 'F', label: 'Goal', position: { x: 450, y: 150 } },
  ];

  const edges: GraphEdge[] = [
    { id: 'AB', source: 'A', target: 'B', weight: 4 },
    { id: 'AC', source: 'A', target: 'C', weight: 2 },
    { id: 'BD', source: 'B', target: 'D', weight: 5 },
    { id: 'BC', source: 'B', target: 'C', weight: 1 },
    { id: 'CD', source: 'C', target: 'D', weight: 8 },
    { id: 'CE', source: 'C', target: 'E', weight: 10 },
    { id: 'DE', source: 'D', target: 'E', weight: 2 },
    { id: 'DF', source: 'D', target: 'F', weight: 3 },
    { id: 'EF', source: 'E', target: 'F', weight: 1 },
  ];

  return { nodes, edges };
}

/**
 * Create a sample graph for MST algorithms
 */
function createMSTGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [
    { id: 'A', label: 'A' },
    { id: 'B', label: 'B' },
    { id: 'C', label: 'C' },
    { id: 'D', label: 'D' },
    { id: 'E', label: 'E' },
    { id: 'F', label: 'F' },
  ];

  const edges: GraphEdge[] = [
    { id: 'AB', source: 'A', target: 'B', weight: 1 },
    { id: 'AC', source: 'A', target: 'C', weight: 4 },
    { id: 'BC', source: 'B', target: 'C', weight: 2 },
    { id: 'BD', source: 'B', target: 'D', weight: 5 },
    { id: 'CD', source: 'C', target: 'D', weight: 3 },
    { id: 'CE', source: 'C', target: 'E', weight: 6 },
    { id: 'DE', source: 'D', target: 'E', weight: 1 },
    { id: 'DF', source: 'D', target: 'F', weight: 4 },
    { id: 'EF', source: 'E', target: 'F', weight: 2 },
  ];

  return { nodes, edges };
}

// ============================================================================
// DEMO FUNCTIONS
// ============================================================================

/**
 * Demo: BFS Traversal
 */
async function demoBFS() {
  console.log('\n=== BFS (Breadth-First Search) Demo ===\n');

  const { nodes, edges } = createPathfindingGraph();
  const container = document.getElementById('bfs-container')!;

  const visualizer = new GraphVisualizer({
    id: 'bfs-demo',
    renderMode: '2d',
    width: 800,
    height: 600,
    algorithm: 'bfs',
    nodes,
    edges,
    startNode: 'A',
    directed: false,
    layout: 'force',
  });

  await visualizer.initialize(container);
  const result = visualizer.execute();

  console.log(`Visited ${result.visited.size} nodes`);
  console.log(`Generated ${result.steps.length} steps`);

  // Animate traversal
  await visualizer.playSteps(300);

  console.log('BFS traversal complete!');
}

/**
 * Demo: DFS Traversal
 */
async function demoDFS() {
  console.log('\n=== DFS (Depth-First Search) Demo ===\n');

  const { nodes, edges } = createPathfindingGraph();
  const container = document.getElementById('dfs-container')!;

  const visualizer = new GraphVisualizer({
    id: 'dfs-demo',
    renderMode: '2d',
    width: 800,
    height: 600,
    algorithm: 'dfs',
    nodes,
    edges,
    startNode: 'A',
    directed: false,
    layout: 'force',
  });

  await visualizer.initialize(container);
  const result = visualizer.execute();

  console.log(`Visited ${result.visited.size} nodes`);
  console.log(`Generated ${result.steps.length} steps`);

  // Animate traversal
  await visualizer.playSteps(300);

  console.log('DFS traversal complete!');
}

/**
 * Demo: Dijkstra's Shortest Path
 */
async function demoDijkstra() {
  console.log('\n=== Dijkstra\'s Shortest Path Demo ===\n');

  const { nodes, edges } = createPathfindingGraph();
  const container = document.getElementById('dijkstra-container')!;

  const visualizer = new GraphVisualizer({
    id: 'dijkstra-demo',
    renderMode: '2d',
    width: 800,
    height: 600,
    algorithm: 'dijkstra',
    nodes,
    edges,
    startNode: 'A',
    endNode: 'F',
    directed: true,
    weighted: true,
    showDistances: true,
    highlightPath: true,
    layout: 'force',
  });

  await visualizer.initialize(container);
  const result = visualizer.execute();

  console.log(`Path: ${result.path?.join(' → ')}`);
  console.log(`Cost: ${result.cost}`);
  console.log(`Visited ${result.visited.size} nodes`);

  // Animate pathfinding
  await visualizer.playSteps(500);

  console.log('Dijkstra pathfinding complete!');
}

/**
 * Demo: A* Pathfinding
 */
async function demoAStar() {
  console.log('\n=== A* Pathfinding Demo ===\n');

  const { nodes, edges } = createPathfindingGraph();
  const container = document.getElementById('astar-container')!;

  const visualizer = new GraphVisualizer({
    id: 'astar-demo',
    renderMode: '2d',
    width: 800,
    height: 600,
    algorithm: 'astar',
    nodes,
    edges,
    startNode: 'A',
    endNode: 'F',
    directed: true,
    weighted: true,
    showDistances: true,
    highlightPath: true,
    layout: 'force',
  });

  await visualizer.initialize(container);
  const result = visualizer.execute();

  console.log(`Path: ${result.path?.join(' → ')}`);
  console.log(`Cost: ${result.cost}`);
  console.log(`Visited ${result.visited.size} nodes`);
  console.log(`Steps: ${result.steps.length}`);

  // Animate pathfinding
  await visualizer.playSteps(500);

  console.log('A* pathfinding complete!');
}

/**
 * Demo: Bellman-Ford Algorithm
 */
async function demoBellmanFord() {
  console.log('\n=== Bellman-Ford Algorithm Demo ===\n');

  const { nodes, edges } = createPathfindingGraph();
  const container = document.getElementById('bellman-ford-container')!;

  const visualizer = new GraphVisualizer({
    id: 'bellman-ford-demo',
    renderMode: '2d',
    width: 800,
    height: 600,
    algorithm: 'bellman-ford',
    nodes,
    edges,
    startNode: 'A',
    endNode: 'F',
    directed: true,
    weighted: true,
    showDistances: true,
    highlightPath: true,
    layout: 'hierarchical',
  });

  await visualizer.initialize(container);
  const result = visualizer.execute();

  console.log(`Path: ${result.path?.join(' → ')}`);
  console.log(`Cost: ${result.cost}`);
  console.log(`Steps: ${result.steps.length}`);

  // Animate algorithm
  await visualizer.playSteps(400);

  console.log('Bellman-Ford complete!');
}

/**
 * Demo: Prim's MST
 */
async function demoPrim() {
  console.log('\n=== Prim\'s Minimum Spanning Tree Demo ===\n');

  const { nodes, edges } = createMSTGraph();
  const container = document.getElementById('prim-container')!;

  const visualizer = new GraphVisualizer({
    id: 'prim-demo',
    renderMode: '2d',
    width: 800,
    height: 600,
    algorithm: 'prim',
    nodes,
    edges,
    startNode: 'A',
    directed: false,
    weighted: true,
    layout: 'force',
  });

  await visualizer.initialize(container);
  const result = visualizer.execute();

  console.log(`MST Edges: ${result.mstEdges?.length}`);
  console.log(`MST Weight: ${result.mstWeight}`);
  console.log(`Steps: ${result.steps.length}`);

  // Display MST edges
  if (result.mstEdges) {
    console.log('\nMST Edges:');
    for (const edgeId of result.mstEdges) {
      const edge = edges.find(e => e.id === edgeId);
      if (edge) {
        console.log(`  ${edge.source} -- ${edge.target} (weight: ${edge.weight})`);
      }
    }
  }

  // Animate MST construction
  await visualizer.playSteps(400);

  console.log('Prim\'s MST complete!');
}

/**
 * Demo: Kruskal's MST
 */
async function demoKruskal() {
  console.log('\n=== Kruskal\'s Minimum Spanning Tree Demo ===\n');

  const { nodes, edges } = createMSTGraph();
  const container = document.getElementById('kruskal-container')!;

  const visualizer = new GraphVisualizer({
    id: 'kruskal-demo',
    renderMode: '2d',
    width: 800,
    height: 600,
    algorithm: 'kruskal',
    nodes,
    edges,
    directed: false,
    weighted: true,
    layout: 'circular',
  });

  await visualizer.initialize(container);
  const result = visualizer.execute();

  console.log(`MST Edges: ${result.mstEdges?.length}`);
  console.log(`MST Weight: ${result.mstWeight}`);
  console.log(`Steps: ${result.steps.length}`);

  // Display MST edges
  if (result.mstEdges) {
    console.log('\nMST Edges:');
    for (const edgeId of result.mstEdges) {
      const edge = edges.find(e => e.id === edgeId);
      if (edge) {
        console.log(`  ${edge.source} -- ${edge.target} (weight: ${edge.weight})`);
      }
    }
  }

  // Animate MST construction
  await visualizer.playSteps(400);

  console.log('Kruskal\'s MST complete!');
}

/**
 * Demo: Step-by-Step Control
 */
async function demoStepControl() {
  console.log('\n=== Step-by-Step Control Demo ===\n');

  const { nodes, edges } = createPathfindingGraph();
  const container = document.getElementById('step-control-container')!;

  const visualizer = new GraphVisualizer({
    id: 'step-control-demo',
    renderMode: '2d',
    width: 800,
    height: 600,
    algorithm: 'dijkstra',
    nodes,
    edges,
    startNode: 'A',
    endNode: 'F',
    directed: true,
    weighted: true,
    showDistances: true,
    highlightPath: true,
  });

  await visualizer.initialize(container);
  const result = visualizer.execute();

  // Listen to step events
  visualizer.on('step:complete', (event) => {
    console.log(`Step ${event.step.index}: ${event.step.description}`);
  });

  // Manual step control
  for (let i = 0; i < result.steps.length; i++) {
    visualizer.visualizeStep(result.steps[i]);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Show progress
    const visitedCount = visualizer.getVisitedCount();
    console.log(`  Visited: ${visitedCount} nodes`);
  }

  // Highlight final path
  if (result.path) {
    console.log(`\nFinal path: ${result.path.join(' → ')}`);
    visualizer.highlightPath(result.path);
  }

  console.log('Step control demo complete!');
}

/**
 * Demo: Comparison - Dijkstra vs A*
 */
async function demoComparison() {
  console.log('\n=== Algorithm Comparison: Dijkstra vs A* ===\n');

  const { nodes, edges } = createPathfindingGraph();

  // Run Dijkstra
  const dijkstraViz = new GraphVisualizer({
    id: 'dijkstra-comparison',
    renderMode: '2d',
    width: 800,
    height: 600,
    algorithm: 'dijkstra',
    nodes,
    edges,
    startNode: 'A',
    endNode: 'F',
    directed: true,
    weighted: true,
  });

  const dijkstraResult = dijkstraViz.execute();

  // Run A*
  const astarViz = new GraphVisualizer({
    id: 'astar-comparison',
    renderMode: '2d',
    width: 800,
    height: 600,
    algorithm: 'astar',
    nodes,
    edges,
    startNode: 'A',
    endNode: 'F',
    directed: true,
    weighted: true,
  });

  const astarResult = astarViz.execute();

  // Compare results
  console.log('Dijkstra:');
  console.log(`  Visited: ${dijkstraResult.visited.size} nodes`);
  console.log(`  Steps: ${dijkstraResult.steps.length}`);
  console.log(`  Path: ${dijkstraResult.path?.join(' → ')}`);
  console.log(`  Cost: ${dijkstraResult.cost}`);

  console.log('\nA*:');
  console.log(`  Visited: ${astarResult.visited.size} nodes`);
  console.log(`  Steps: ${astarResult.steps.length}`);
  console.log(`  Path: ${astarResult.path?.join(' → ')}`);
  console.log(`  Cost: ${astarResult.cost}`);

  console.log('\nEfficiency:');
  console.log(`  A* visited ${dijkstraResult.visited.size - astarResult.visited.size} fewer nodes`);
  console.log(`  A* used ${((astarResult.visited.size / dijkstraResult.visited.size) * 100).toFixed(1)}% of Dijkstra's node visits`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('Graph Visualizer Demo\n');
  console.log('=====================================\n');

  try {
    // Run all demos
    await demoBFS();
    await demoDFS();
    await demoDijkstra();
    await demoAStar();
    await demoBellmanFord();
    await demoPrim();
    await demoKruskal();
    await demoStepControl();
    await demoComparison();

    console.log('\n=====================================');
    console.log('All demos complete!');
  } catch (error) {
    console.error('Demo error:', error);
  }
}

// Run if executed directly
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

export {
  demoBFS,
  demoDFS,
  demoDijkstra,
  demoAStar,
  demoBellmanFord,
  demoPrim,
  demoKruskal,
  demoStepControl,
  demoComparison,
};
