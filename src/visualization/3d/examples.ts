/**
 * Graph 3D Visualizer Examples
 *
 * Comprehensive examples demonstrating all features of the Graph3DVisualizer.
 *
 * @module visualization/3d/examples
 */

import { Graph3DVisualizer, type Node3D, type Edge3D } from './Graph3DVisualizer';

// ============================================================================
// EXAMPLE 1: Basic 3D Force-Directed Graph
// ============================================================================

/**
 * Create a simple 3D force-directed graph visualization
 */
export async function basicForceDirectedGraph(container: HTMLElement): Promise<Graph3DVisualizer> {
  // Create nodes in 3D space
  const nodes: Node3D[] = [
    {
      id: 'A',
      data: { label: 'Node A' },
      position: { x: 0, y: 0, z: 0 },
      style: { color: '#3498db', size: 10, label: 'A' },
    },
    {
      id: 'B',
      data: { label: 'Node B' },
      position: { x: 50, y: 50, z: 50 },
      style: { color: '#e74c3c', size: 10, label: 'B' },
    },
    {
      id: 'C',
      data: { label: 'Node C' },
      position: { x: -50, y: 50, z: -50 },
      style: { color: '#2ecc71', size: 10, label: 'C' },
    },
    {
      id: 'D',
      data: { label: 'Node D' },
      position: { x: 0, y: -50, z: 50 },
      style: { color: '#f39c12', size: 10, label: 'D' },
    },
  ];

  // Create edges
  const edges: Edge3D[] = [
    {
      id: 'AB',
      source: 'A',
      target: 'B',
      weight: 1,
      style: { color: '#95a5a6', width: 2 },
    },
    {
      id: 'AC',
      source: 'A',
      target: 'C',
      weight: 1,
      style: { color: '#95a5a6', width: 2 },
    },
    {
      id: 'AD',
      source: 'A',
      target: 'D',
      weight: 1,
      style: { color: '#95a5a6', width: 2 },
    },
    {
      id: 'BC',
      source: 'B',
      target: 'C',
      weight: 1,
      style: { color: '#95a5a6', width: 2 },
    },
  ];

  // Create visualizer
  const visualizer = new Graph3DVisualizer({
    id: 'basic-3d-graph',
    renderMode: '3d',
    width: 800,
    height: 600,
    nodes,
    edges,
    layout: '3d-force',
    enablePhysics: true,
    showLabels: true,
    backgroundColor: '#1a1a1a',
    cameraPosition: {
      x: 0,
      y: 0,
      z: 300,
      fov: 75,
    },
  });

  await visualizer.initialize(container);

  return visualizer;
}

// ============================================================================
// EXAMPLE 2: Sphere Layout with Many Nodes
// ============================================================================

/**
 * Create a 3D sphere layout with many nodes
 */
export async function sphereLayoutExample(container: HTMLElement): Promise<Graph3DVisualizer> {
  const nodeCount = 50;
  const nodes: Node3D[] = [];
  const edges: Edge3D[] = [];

  // Generate nodes
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      data: { index: i },
      position: { x: 0, y: 0, z: 0 }, // Will be positioned by sphere layout
      style: {
        color: `hsl(${(i / nodeCount) * 360}, 70%, 50%)`,
        size: 5,
        label: `${i}`,
      },
    });
  }

  // Create some random edges
  for (let i = 0; i < nodeCount; i++) {
    const connections = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < connections; j++) {
      const target = Math.floor(Math.random() * nodeCount);
      if (target !== i) {
        edges.push({
          id: `edge-${i}-${target}`,
          source: `node-${i}`,
          target: `node-${target}`,
          style: { color: '#333', width: 1, opacity: 0.3 },
        });
      }
    }
  }

  const visualizer = new Graph3DVisualizer({
    id: 'sphere-layout',
    renderMode: '3d',
    width: 800,
    height: 600,
    nodes,
    edges,
    layout: '3d-sphere',
    enablePhysics: false,
    showLabels: false,
    backgroundColor: '#0a0a0a',
    enableLOD: true,
    lodDistances: [150, 300, 600],
    cameraPosition: {
      x: 0,
      y: 0,
      z: 400,
    },
  });

  await visualizer.initialize(container);

  // Animate rotation
  visualizer.animate(30000, 0.001);

  return visualizer;
}

// ============================================================================
// EXAMPLE 3: Helix Layout for Hierarchical Data
// ============================================================================

/**
 * Create a 3D helix layout for hierarchical data
 */
export async function helixLayoutExample(container: HTMLElement): Promise<Graph3DVisualizer> {
  const levels = 10;
  const nodesPerLevel = 5;
  const nodes: Node3D[] = [];
  const edges: Edge3D[] = [];

  let nodeId = 0;

  // Generate nodes in layers
  for (let level = 0; level < levels; level++) {
    for (let i = 0; i < nodesPerLevel; i++) {
      const id = `node-${nodeId}`;
      nodes.push({
        id,
        data: { level, index: i },
        position: { x: 0, y: 0, z: 0 }, // Will be positioned by helix layout
        style: {
          color: `hsl(${(level / levels) * 240}, 60%, 50%)`,
          size: 8,
          label: `L${level}-${i}`,
        },
      });

      // Connect to previous level
      if (level > 0) {
        const prevLevelStart = (level - 1) * nodesPerLevel;
        const targetIndex = prevLevelStart + (i % nodesPerLevel);
        edges.push({
          id: `edge-${nodeId}`,
          source: id,
          target: `node-${targetIndex}`,
          style: { color: '#4a4a4a', width: 2, opacity: 0.5 },
        });
      }

      nodeId++;
    }
  }

  const visualizer = new Graph3DVisualizer({
    id: 'helix-layout',
    renderMode: '3d',
    width: 800,
    height: 600,
    nodes,
    edges,
    layout: '3d-helix',
    enablePhysics: false,
    showLabels: true,
    backgroundColor: '#1a1a2e',
    cameraPosition: {
      x: 200,
      y: 50,
      z: 200,
    },
  });

  await visualizer.initialize(container);

  return visualizer;
}

// ============================================================================
// EXAMPLE 4: Interactive Graph with Path Highlighting
// ============================================================================

/**
 * Create an interactive graph with path highlighting
 */
export async function interactiveGraphExample(container: HTMLElement): Promise<Graph3DVisualizer> {
  // Create a small network
  const nodes: Node3D[] = [
    { id: '1', data: {}, position: { x: 0, y: 0, z: 0 }, style: { color: '#3498db', size: 12, label: '1' } },
    { id: '2', data: {}, position: { x: 100, y: 0, z: 0 }, style: { color: '#3498db', size: 12, label: '2' } },
    { id: '3', data: {}, position: { x: 200, y: 0, z: 0 }, style: { color: '#3498db', size: 12, label: '3' } },
    { id: '4', data: {}, position: { x: 0, y: 100, z: 0 }, style: { color: '#3498db', size: 12, label: '4' } },
    { id: '5', data: {}, position: { x: 100, y: 100, z: 0 }, style: { color: '#3498db', size: 12, label: '5' } },
    { id: '6', data: {}, position: { x: 200, y: 100, z: 0 }, style: { color: '#3498db', size: 12, label: '6' } },
  ];

  const edges: Edge3D[] = [
    { id: 'e1', source: '1', target: '2', style: { color: '#7f8c8d', width: 2 } },
    { id: 'e2', source: '2', target: '3', style: { color: '#7f8c8d', width: 2 } },
    { id: 'e3', source: '1', target: '4', style: { color: '#7f8c8d', width: 2 } },
    { id: 'e4', source: '2', target: '5', style: { color: '#7f8c8d', width: 2 } },
    { id: 'e5', source: '3', target: '6', style: { color: '#7f8c8d', width: 2 } },
    { id: 'e6', source: '4', target: '5', style: { color: '#7f8c8d', width: 2 } },
    { id: 'e7', source: '5', target: '6', style: { color: '#7f8c8d', width: 2 } },
  ];

  const visualizer = new Graph3DVisualizer({
    id: 'interactive-graph',
    renderMode: '3d',
    width: 800,
    height: 600,
    nodes,
    edges,
    layout: '3d-force',
    enablePhysics: true,
    showLabels: true,
    backgroundColor: '#ecf0f1',
  });

  await visualizer.initialize(container);

  // Setup event listeners
  visualizer.on('node:click', (event) => {
    const nodeId = 'nodeId' in event ? event.nodeId : undefined;
    console.log('Node clicked:', nodeId);
    // Highlight a path
    visualizer.highlightPath3D(['1', '2', '5', '6']);
  });

  visualizer.on('node:hover', (event) => {
    const nodeId = 'nodeId' in event ? event.nodeId : undefined;
    console.log('Node hovered:', nodeId);
  });

  return visualizer;
}

// ============================================================================
// EXAMPLE 5: Large Graph with LOD Optimization
// ============================================================================

/**
 * Create a large graph demonstrating LOD optimization
 */
export async function largeGraphWithLOD(container: HTMLElement): Promise<Graph3DVisualizer> {
  const nodeCount = 200;
  const nodes: Node3D[] = [];
  const edges: Edge3D[] = [];

  // Generate nodes
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `n${i}`,
      data: { index: i },
      position: {
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 500,
        z: (Math.random() - 0.5) * 500,
      },
      style: {
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        size: 3 + Math.random() * 7,
      },
    });
  }

  // Generate edges (scale-free network)
  for (let i = 0; i < nodeCount * 2; i++) {
    const source = Math.floor(Math.random() * nodeCount);
    const target = Math.floor(Math.random() * nodeCount);
    if (source !== target) {
      edges.push({
        id: `e${i}`,
        source: `n${source}`,
        target: `n${target}`,
        style: { color: '#444', width: 1, opacity: 0.2 },
      });
    }
  }

  const visualizer = new Graph3DVisualizer({
    id: 'large-graph-lod',
    renderMode: '3d',
    width: 1200,
    height: 800,
    nodes,
    edges,
    layout: '3d-force',
    enablePhysics: true,
    showLabels: false,
    backgroundColor: '#0d1117',
    enableLOD: true,
    lodDistances: [200, 400, 800],
    maxNodes: 1000,
    cameraPosition: {
      x: 0,
      y: 0,
      z: 600,
    },
  });

  await visualizer.initialize(container);

  // Enable performance monitoring
  visualizer.setPerformanceMonitoring(true);

  // Log metrics every second
  setInterval(() => {
    const metrics = visualizer.getMetrics();
    console.log('Performance:', {
      fps: metrics.fps.toFixed(1),
      frameTime: metrics.frameTime.toFixed(2) + 'ms',
      nodes: metrics.nodeCount,
      edges: metrics.edgeCount,
    });
  }, 1000);

  return visualizer;
}

// ============================================================================
// EXAMPLE 6: Curved Edges and Advanced Styling
// ============================================================================

/**
 * Demonstrate curved edges and advanced styling
 */
export async function curvedEdgesExample(container: HTMLElement): Promise<Graph3DVisualizer> {
  const nodes: Node3D[] = [
    { id: 'A', data: {}, position: { x: -100, y: 0, z: 0 }, style: { color: '#e91e63', size: 15, label: 'A' } },
    { id: 'B', data: {}, position: { x: 100, y: 0, z: 0 }, style: { color: '#9c27b0', size: 15, label: 'B' } },
    { id: 'C', data: {}, position: { x: 0, y: 100, z: 100 }, style: { color: '#673ab7', size: 15, label: 'C' } },
  ];

  const edges: Edge3D[] = [
    {
      id: 'AB',
      source: 'A',
      target: 'B',
      curvature: 50,
      tubeSegments: 32,
      style: { color: '#ff5722', width: 3, opacity: 0.8 },
    },
    {
      id: 'BC',
      source: 'B',
      target: 'C',
      curvature: -30,
      tubeSegments: 32,
      style: { color: '#ff9800', width: 3, opacity: 0.8 },
    },
    {
      id: 'CA',
      source: 'C',
      target: 'A',
      curvature: 40,
      tubeSegments: 32,
      style: { color: '#ffc107', width: 3, opacity: 0.8 },
    },
  ];

  const visualizer = new Graph3DVisualizer({
    id: 'curved-edges',
    renderMode: '3d',
    width: 800,
    height: 600,
    nodes,
    edges,
    enablePhysics: false,
    showLabels: true,
    backgroundColor: '#212121',
    ambientLightIntensity: 0.6,
    directionalLightIntensity: 1.0,
    enableShadows: true,
    cameraPosition: {
      x: 150,
      y: 150,
      z: 250,
    },
  });

  await visualizer.initialize(container);

  return visualizer;
}

// ============================================================================
// EXAMPLE 7: Export Functionality
// ============================================================================

/**
 * Demonstrate export functionality
 */
export async function exportExample(container: HTMLElement): Promise<void> {
  const visualizer = await basicForceDirectedGraph(container);

  // Export to PNG after 1 second
  setTimeout(async () => {
    const pngBlob = await visualizer.export3DView('png');
    const url = URL.createObjectURL(pngBlob);
    console.log('PNG exported:', url);

    // Download the image
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph-3d.png';
    a.click();
  }, 1000);

  // Export to OBJ format
  setTimeout(async () => {
    const objBlob = await visualizer.export3DView('obj');
    const url = URL.createObjectURL(objBlob);
    console.log('OBJ exported:', url);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph-3d.obj';
    a.click();
  }, 2000);
}

// ============================================================================
// EXAMPLE 8: Camera Control and Animation
// ============================================================================

/**
 * Demonstrate camera control and animation
 */
export async function cameraControlExample(container: HTMLElement): Promise<Graph3DVisualizer> {
  const visualizer = await basicForceDirectedGraph(container);

  // Camera controls
  const controls = document.createElement('div');
  controls.innerHTML = `
    <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 10px; border-radius: 5px;">
      <h4>Camera Controls</h4>
      <button id="reset-camera">Reset Camera (R)</button><br/>
      <button id="fit-view">Fit to View (F)</button><br/>
      <button id="animate">Animate Rotation</button><br/>
      <button id="toggle-physics">Toggle Physics (Space)</button><br/>
      <p style="font-size: 12px; margin-top: 10px;">
        • Left Click + Drag: Orbit<br/>
        • Right Click + Drag: Pan<br/>
        • Scroll: Zoom
      </p>
    </div>
  `;
  container.appendChild(controls);

  // Add button handlers
  document.getElementById('reset-camera')?.addEventListener('click', () => {
    visualizer.resetCamera();
  });

  document.getElementById('fit-view')?.addEventListener('click', () => {
    visualizer.fitToView(50);
  });

  document.getElementById('animate')?.addEventListener('click', () => {
    visualizer.animate(10000, 0.002);
  });

  document.getElementById('toggle-physics')?.addEventListener('click', () => {
    // This would toggle physics in the config
    console.log('Physics toggled');
  });

  return visualizer;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a random graph with specified properties
 */
export function createRandomGraph(
  nodeCount: number,
  edgeProbability: number = 0.1
): { nodes: Node3D[]; edges: Edge3D[] } {
  const nodes: Node3D[] = [];
  const edges: Edge3D[] = [];

  // Create nodes
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      data: { index: i },
      position: {
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        z: (Math.random() - 0.5) * 200,
      },
      style: {
        color: `hsl(${(i / nodeCount) * 360}, 60%, 50%)`,
        size: 5,
      },
    });
  }

  // Create random edges
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (Math.random() < edgeProbability) {
        edges.push({
          id: `edge-${i}-${j}`,
          source: `node-${i}`,
          target: `node-${j}`,
          style: { color: '#666', width: 1, opacity: 0.4 },
        });
      }
    }
  }

  return { nodes, edges };
}

/**
 * Run all examples in sequence
 */
export async function runAllExamples(container: HTMLElement): Promise<void> {
  console.log('Running Graph 3D Visualizer Examples...');

  // Example 1
  console.log('Example 1: Basic Force-Directed Graph');
  await basicForceDirectedGraph(container);

  // Clear and run next example after delay
  setTimeout(async () => {
    container.innerHTML = '';
    console.log('Example 2: Sphere Layout');
    await sphereLayoutExample(container);
  }, 5000);

  setTimeout(async () => {
    container.innerHTML = '';
    console.log('Example 3: Helix Layout');
    await helixLayoutExample(container);
  }, 10000);

  // Continue with other examples...
}
