/**
 * Unified API Usage Examples
 *
 * Comprehensive examples demonstrating the unified visualization API:
 * - Factory pattern for creating visualizers
 * - Configuration options and best practices
 * - Theme customization
 * - Animation control
 * - Event handling
 * - Export capabilities
 * - Performance optimization
 *
 * @example
 * ```typescript
 * import { VisualizationFactory } from '../src/visualization/core/factory';
 *
 * // Create a graph visualizer
 * const graphViz = VisualizationFactory.createGraphVisualizer({
 *   algorithm: 'dijkstra',
 *   nodes: [...],
 *   edges: [...],
 * });
 *
 * await graphViz.initialize(container);
 * await graphViz.executeAlgorithm();
 * ```
 */

import { VisualizationFactory } from '../src/visualization/core/factory';
import { ThemeProvider } from '../src/visualization/core/ThemeProvider';
import { AnimationController } from '../src/visualization/core/AnimationController';
import type {
  Node,
  Edge,
  ThemeConfig,
  AnimationConfig,
} from '../src/visualization/core/interfaces';

/**
 * Example 1: Basic Graph Visualization
 */
export async function basicGraphExample(container: HTMLElement) {
  console.log('\n=== Example 1: Basic Graph Visualization ===\n');

  // Create visualizer using factory
  const visualizer = VisualizationFactory.createGraphVisualizer({
    algorithm: 'dijkstra',
    nodes: [
      { id: 'A', label: 'Start', x: 100, y: 200 },
      { id: 'B', label: 'B', x: 300, y: 100 },
      { id: 'C', label: 'C', x: 500, y: 200 },
      { id: 'D', label: 'End', x: 300, y: 300 },
    ],
    edges: [
      { id: 'e1', source: 'A', target: 'B', weight: 4 },
      { id: 'e2', source: 'A', target: 'D', weight: 2 },
      { id: 'e3', source: 'B', target: 'C', weight: 3 },
      { id: 'e4', source: 'D', target: 'C', weight: 1 },
    ],
    startNode: 'A',
    endNode: 'C',
    width: 800,
    height: 600,
  });

  // Initialize and execute
  await visualizer.initialize(container);
  const result = await visualizer.executeAlgorithm();

  console.log('Path found:', result.path);
  console.log('Distance:', result.distance);
}

/**
 * Example 2: Theme Customization
 */
export async function themeCustomizationExample(container: HTMLElement) {
  console.log('\n=== Example 2: Theme Customization ===\n');

  // Create custom theme
  const customTheme: ThemeConfig = {
    colors: {
      primary: '#6366f1',      // Indigo
      secondary: '#8b5cf6',    // Purple
      success: '#10b981',      // Green
      warning: '#f59e0b',      // Amber
      error: '#ef4444',        // Red
      background: '#1f2937',   // Dark gray
      surface: '#374151',      // Gray
      text: '#f3f4f6',         // Light gray
      border: '#4b5563',       // Medium gray
    },
    fonts: {
      body: 'Inter, system-ui, sans-serif',
      heading: 'Inter, system-ui, sans-serif',
      mono: 'Fira Code, monospace',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 16,
    },
  };

  const themeProvider = new ThemeProvider(customTheme);

  // Create visualizer with custom theme
  const visualizer = VisualizationFactory.createGraphVisualizer({
    algorithm: 'bfs',
    nodes: generateGridNodes(4, 4),
    edges: generateGridEdges(4, 4),
    startNode: 'node-0-0',
    theme: themeProvider.getTheme(),
  });

  await visualizer.initialize(container);
  await visualizer.executeAlgorithm();

  console.log('Custom theme applied successfully');
}

/**
 * Example 3: Animation Control
 */
export async function animationControlExample(container: HTMLElement) {
  console.log('\n=== Example 3: Animation Control ===\n');

  const animationConfig: AnimationConfig = {
    duration: 1000,        // 1 second per step
    easing: 'ease-in-out',
    delay: 200,            // 200ms delay between steps
    fps: 60,
  };

  const visualizer = VisualizationFactory.createSortingVisualizer({
    algorithm: 'quicksort',
    data: [64, 34, 25, 12, 22, 11, 90, 88, 45, 50, 33, 77],
    animationConfig,
  });

  await visualizer.initialize(container);

  // Control playback
  await visualizer.play();

  // Pause after 3 seconds
  setTimeout(() => {
    visualizer.pause();
    console.log('Animation paused');
  }, 3000);

  // Resume after 5 seconds
  setTimeout(() => {
    visualizer.resume();
    console.log('Animation resumed');
  }, 5000);
}

/**
 * Example 4: Event Handling
 */
export async function eventHandlingExample(container: HTMLElement) {
  console.log('\n=== Example 4: Event Handling ===\n');

  const visualizer = VisualizationFactory.createGraphVisualizer({
    algorithm: 'dfs',
    nodes: generateRandomGraph(8).nodes,
    edges: generateRandomGraph(8).edges,
    startNode: 'node-0',
  });

  // Setup event listeners
  visualizer.on('step', (step) => {
    console.log(`Step ${step.index}: ${step.description}`);
  });

  visualizer.on('nodeVisited', (nodeId) => {
    console.log(`Visited node: ${nodeId}`);
  });

  visualizer.on('edgeTraversed', (edgeId) => {
    console.log(`Traversed edge: ${edgeId}`);
  });

  visualizer.on('complete', (result) => {
    console.log('Algorithm completed:', result);
  });

  visualizer.on('error', (error) => {
    console.error('Error occurred:', error);
  });

  await visualizer.initialize(container);
  await visualizer.executeAlgorithm();
}

/**
 * Example 5: Export Capabilities
 */
export async function exportExample(container: HTMLElement) {
  console.log('\n=== Example 5: Export Capabilities ===\n');

  const visualizer = VisualizationFactory.createGraphVisualizer({
    algorithm: 'dijkstra',
    nodes: generateRandomGraph(6).nodes,
    edges: generateRandomGraph(6).edges,
    startNode: 'node-0',
    endNode: 'node-5',
  });

  await visualizer.initialize(container);
  await visualizer.executeAlgorithm();

  // Export as PNG
  const pngBlob = await visualizer.export({ format: 'png', quality: 0.95 });
  console.log('PNG exported:', pngBlob.size, 'bytes');

  // Export as SVG
  const svgBlob = await visualizer.export({ format: 'svg' });
  console.log('SVG exported:', svgBlob.size, 'bytes');

  // Export data as JSON
  const jsonData = visualizer.exportData();
  console.log('Data exported:', JSON.stringify(jsonData, null, 2));
}

/**
 * Example 6: 3D Visualization
 */
export async function visualization3DExample(container: HTMLElement) {
  console.log('\n=== Example 6: 3D Visualization ===\n');

  const visualizer = VisualizationFactory.create3DGraphVisualizer({
    nodes: Array.from({ length: 20 }, (_, i) => ({
      id: `node-${i}`,
      position: {
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        z: (Math.random() - 0.5) * 200,
      },
      style: {
        color: `hsl(${i * 18}, 70%, 60%)`,
        size: 5,
      },
    })),
    edges: [],
    layout: '3d-force',
    enablePhysics: true,
    enableLOD: true,
  });

  await visualizer.initialize(container);

  // Apply different layouts
  console.log('Applying force-directed layout...');
  await visualizer.applyLayout('3d-force');

  setTimeout(async () => {
    console.log('Applying sphere layout...');
    await visualizer.applyLayout('3d-sphere');
  }, 3000);

  setTimeout(async () => {
    console.log('Applying helix layout...');
    await visualizer.applyLayout('3d-helix');
  }, 6000);
}

/**
 * Example 7: Performance Optimization
 */
export async function performanceOptimizationExample(container: HTMLElement) {
  console.log('\n=== Example 7: Performance Optimization ===\n');

  // Large dataset with virtualization
  const { nodes, edges } = generateRandomGraph(500);

  const visualizer = VisualizationFactory.createGraphVisualizer({
    algorithm: 'bfs',
    nodes,
    edges,
    startNode: 'node-0',
    // Performance optimizations
    enableVirtualization: true,
    virtualizationThreshold: 100,
    enableCulling: true,
    cullingDistance: 1000,
    enableLOD: true,
    lodDistances: [200, 500, 1000],
  });

  await visualizer.initialize(container);

  // Monitor performance
  const startTime = performance.now();
  await visualizer.executeAlgorithm();
  const endTime = performance.now();

  console.log(`Execution time: ${(endTime - startTime).toFixed(2)}ms`);
  console.log('Performance metrics:', visualizer.getMetrics());
}

/**
 * Example 8: Tree Visualization
 */
export async function treeVisualizationExample(container: HTMLElement) {
  console.log('\n=== Example 8: Tree Visualization ===\n');

  const visualizer = VisualizationFactory.createTreeVisualizer({
    treeType: 'avl',
    data: [50, 25, 75, 10, 30, 60, 90, 5, 15, 27, 35],
    showBalanceFactor: true,
    nodeRadius: 30,
    levelHeight: 100,
  });

  await visualizer.initialize(container);

  // Perform operations
  console.log('Inserting value: 20');
  await visualizer.insert(20);

  console.log('Searching for value: 30');
  const found = await visualizer.search(30);
  console.log('Found:', found);

  console.log('Performing inorder traversal');
  const traversal = await visualizer.traverse('inorder');
  console.log('Traversal:', traversal);
}

// Helper functions

function generateGridNodes(rows: number, cols: number): Node[] {
  const nodes: Node[] = [];
  const spacing = 100;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      nodes.push({
        id: `node-${row}-${col}`,
        label: `${row},${col}`,
        x: col * spacing + 100,
        y: row * spacing + 100,
      });
    }
  }

  return nodes;
}

function generateGridEdges(rows: number, cols: number): Edge[] {
  const edges: Edge[] = [];
  let edgeId = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Connect to right neighbor
      if (col < cols - 1) {
        edges.push({
          id: `edge-${edgeId++}`,
          source: `node-${row}-${col}`,
          target: `node-${row}-${col + 1}`,
          weight: 1,
        });
      }

      // Connect to bottom neighbor
      if (row < rows - 1) {
        edges.push({
          id: `edge-${edgeId++}`,
          source: `node-${row}-${col}`,
          target: `node-${row + 1}-${col}`,
          weight: 1,
        });
      }
    }
  }

  return edges;
}

function generateRandomGraph(nodeCount: number): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    label: `N${i}`,
    x: Math.random() * 700 + 50,
    y: Math.random() * 500 + 50,
  }));

  const edges: Edge[] = [];
  let edgeId = 0;

  // Create random edges (approximately 2 per node)
  for (let i = 0; i < nodeCount * 2; i++) {
    const source = Math.floor(Math.random() * nodeCount);
    const target = Math.floor(Math.random() * nodeCount);

    if (source !== target) {
      edges.push({
        id: `edge-${edgeId++}`,
        source: `node-${source}`,
        target: `node-${target}`,
        weight: Math.floor(Math.random() * 10) + 1,
      });
    }
  }

  return { nodes, edges };
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  const container = document.getElementById('app')!;

  await basicGraphExample(container);
  await new Promise(resolve => setTimeout(resolve, 2000));

  await themeCustomizationExample(container);
  await new Promise(resolve => setTimeout(resolve, 2000));

  await animationControlExample(container);
  await new Promise(resolve => setTimeout(resolve, 2000));

  await eventHandlingExample(container);
  await new Promise(resolve => setTimeout(resolve, 2000));

  await exportExample(container);
  await new Promise(resolve => setTimeout(resolve, 2000));

  await visualization3DExample(container);
  await new Promise(resolve => setTimeout(resolve, 2000));

  await performanceOptimizationExample(container);
  await new Promise(resolve => setTimeout(resolve, 2000));

  await treeVisualizationExample(container);

  console.log('\n✓ All API examples completed!');
}
