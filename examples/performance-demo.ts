/**
 * Performance and Large Dataset Demo
 *
 * Demonstrates optimization techniques for handling large datasets:
 * - Virtualization for 1000+ nodes
 * - LOD (Level of Detail) optimization
 * - Web Workers for heavy computation
 * - Streaming data updates
 * - Performance profiling and metrics
 *
 * @example
 * ```typescript
 * const demo = new PerformanceDemo(document.getElementById('app')!);
 * await demo.initialize();
 * await demo.runLargeDatasetTest(1000);
 * ```
 */

import { GraphVisualizer } from '../src/visualization/algorithms/GraphVisualizer';
import { Graph3DVisualizer } from '../src/visualization/3d/Graph3DVisualizer';
import type { Node, Edge } from '../src/visualization/core/interfaces';

interface PerformanceMetrics {
  renderTime: number;
  fps: number;
  memoryUsage: number;
  nodeCount: number;
  edgeCount: number;
  generationTime: number;
}

export class PerformanceDemo {
  private container: HTMLElement;
  private visualizer: GraphVisualizer | Graph3DVisualizer | null = null;
  private metricsElement: HTMLElement | null = null;
  private performanceObserver: PerformanceObserver | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async initialize(): Promise<void> {
    console.log('Initializing Performance Demo...');

    // Create metrics display
    this.metricsElement = document.createElement('div');
    this.metricsElement.id = 'performance-metrics';
    this.metricsElement.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      font-family: monospace;
      padding: 15px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 1000;
    `;
    this.container.appendChild(this.metricsElement);

    // Setup performance observer
    this.setupPerformanceMonitoring();

    console.log('✓ Performance demo initialized');
  }

  /**
   * Generate large random graph dataset
   */
  private generateLargeDataset(nodeCount: number): { nodes: Node[]; edges: Edge[] } {
    console.log(`Generating dataset with ${nodeCount} nodes...`);
    const startTime = performance.now();

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Generate nodes in a grid pattern for better visualization
    const gridSize = Math.ceil(Math.sqrt(nodeCount));
    const spacing = 50;

    for (let i = 0; i < nodeCount; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;

      nodes.push({
        id: `node-${i}`,
        label: `N${i}`,
        x: col * spacing,
        y: row * spacing,
      });
    }

    // Generate edges (approximately 2-3 edges per node for sparse graph)
    const edgesPerNode = 2.5;
    const totalEdges = Math.floor(nodeCount * edgesPerNode);

    for (let i = 0; i < totalEdges; i++) {
      const sourceIdx = Math.floor(Math.random() * nodeCount);
      const targetIdx = Math.floor(Math.random() * nodeCount);

      if (sourceIdx !== targetIdx) {
        edges.push({
          id: `edge-${i}`,
          source: nodes[sourceIdx].id,
          target: nodes[targetIdx].id,
          weight: Math.floor(Math.random() * 10) + 1,
        });
      }
    }

    const generationTime = performance.now() - startTime;
    console.log(`✓ Dataset generated in ${generationTime.toFixed(2)}ms`);
    console.log(`  Nodes: ${nodes.length}, Edges: ${edges.length}`);

    return { nodes, edges };
  }

  /**
   * Test with large 2D dataset using virtualization
   */
  async runLargeDatasetTest(nodeCount: number): Promise<PerformanceMetrics> {
    console.log(`\n=== Large Dataset Test (${nodeCount} nodes) ===\n`);

    const { nodes, edges } = this.generateLargeDataset(nodeCount);
    const generationTime = performance.now();

    // Create visualizer with virtualization enabled
    this.visualizer = new GraphVisualizer({
      id: 'perf-test',
      renderMode: '2d',
      width: 1200,
      height: 800,
      algorithm: 'dijkstra',
      nodes,
      edges,
      startNode: nodes[0].id,
      endNode: nodes[Math.floor(nodes.length / 2)].id,
      enableVirtualization: nodeCount > 100,
      virtualizationThreshold: 100,
      enableCulling: true,
      cullingDistance: 1000,
    });

    const visualizerContainer = document.createElement('div');
    visualizerContainer.id = 'perf-visualizer';
    this.container.appendChild(visualizerContainer);

    const renderStart = performance.now();
    await this.visualizer.initialize(visualizerContainer);
    const renderTime = performance.now() - renderStart;

    // Measure FPS
    const fps = await this.measureFPS(2000);

    // Measure memory
    const memoryUsage = this.getMemoryUsage();

    const metrics: PerformanceMetrics = {
      renderTime,
      fps,
      memoryUsage,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      generationTime: performance.now() - generationTime,
    };

    this.displayMetrics(metrics);

    console.log('\n=== Performance Metrics ===');
    console.log(`  Generation Time: ${metrics.generationTime.toFixed(2)}ms`);
    console.log(`  Render Time: ${metrics.renderTime.toFixed(2)}ms`);
    console.log(`  FPS: ${metrics.fps.toFixed(1)}`);
    console.log(`  Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Nodes: ${metrics.nodeCount}`);
    console.log(`  Edges: ${metrics.edgeCount}`);

    return metrics;
  }

  /**
   * Test 3D performance with LOD
   */
  async run3DLODTest(nodeCount: number): Promise<PerformanceMetrics> {
    console.log(`\n=== 3D LOD Test (${nodeCount} nodes) ===\n`);

    const { nodes, edges } = this.generateLargeDataset(nodeCount);
    const generationTime = performance.now();

    // Convert to 3D nodes
    const nodes3D = nodes.map((node, i) => ({
      id: node.id,
      position: {
        x: (Math.random() - 0.5) * 300,
        y: (Math.random() - 0.5) * 300,
        z: (Math.random() - 0.5) * 300,
      },
      style: {
        color: `hsl(${(i / nodeCount) * 360}, 70%, 60%)`,
        size: 3,
      },
    }));

    const edges3D = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      style: {
        width: 1,
        color: '#666666',
        opacity: 0.3,
      },
    }));

    // Create 3D visualizer with LOD
    this.visualizer = new Graph3DVisualizer({
      id: 'perf-3d-test',
      renderMode: '3d',
      width: 1200,
      height: 800,
      nodes: nodes3D,
      edges: edges3D,
      layout: '3d-force',
      enablePhysics: nodeCount < 500, // Disable physics for very large datasets
      enableLOD: true,
      lodDistances: [200, 500, 1000],
      showLabels: nodeCount < 200,
    });

    const visualizerContainer = document.createElement('div');
    visualizerContainer.id = 'perf-3d-visualizer';
    this.container.appendChild(visualizerContainer);

    const renderStart = performance.now();
    await this.visualizer.initialize(visualizerContainer);
    const renderTime = performance.now() - renderStart;

    // Measure FPS
    const fps = await this.measureFPS(2000);

    // Measure memory
    const memoryUsage = this.getMemoryUsage();

    const metrics: PerformanceMetrics = {
      renderTime,
      fps,
      memoryUsage,
      nodeCount: nodes3D.length,
      edgeCount: edges3D.length,
      generationTime: performance.now() - generationTime,
    };

    this.displayMetrics(metrics);

    console.log('\n=== 3D Performance Metrics ===');
    console.log(`  Generation Time: ${metrics.generationTime.toFixed(2)}ms`);
    console.log(`  Render Time: ${metrics.renderTime.toFixed(2)}ms`);
    console.log(`  FPS: ${metrics.fps.toFixed(1)}`);
    console.log(`  Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  LOD Enabled: true`);

    return metrics;
  }

  /**
   * Benchmark different dataset sizes
   */
  async runScalabilityBenchmark(): Promise<void> {
    console.log('\n=== Scalability Benchmark ===\n');

    const sizes = [50, 100, 250, 500, 1000, 2000];
    const results: Array<{ size: number; metrics: PerformanceMetrics }> = [];

    for (const size of sizes) {
      console.log(`\nTesting with ${size} nodes...`);
      const metrics = await this.runLargeDatasetTest(size);
      results.push({ size, metrics });

      // Cleanup
      this.visualizer?.destroy();
      await this.sleep(500);
    }

    // Display comparison
    console.log('\n=== Scalability Results ===');
    console.table(
      results.map((r) => ({
        'Nodes': r.size,
        'Render (ms)': r.metrics.renderTime.toFixed(2),
        'FPS': r.metrics.fps.toFixed(1),
        'Memory (MB)': (r.metrics.memoryUsage / 1024 / 1024).toFixed(2),
      }))
    );
  }

  /**
   * Demonstrate streaming data updates
   */
  async runStreamingDemo(): Promise<void> {
    console.log('\n=== Streaming Data Demo ===\n');

    // Start with small dataset
    const { nodes, edges } = this.generateLargeDataset(50);

    this.visualizer = new GraphVisualizer({
      id: 'streaming-test',
      renderMode: '2d',
      width: 1200,
      height: 800,
      algorithm: 'bfs',
      nodes,
      edges,
      startNode: nodes[0].id,
    });

    const container = document.createElement('div');
    this.container.appendChild(container);
    await this.visualizer.initialize(container);

    console.log('Streaming 500 new nodes over 10 seconds...');

    // Simulate streaming: add nodes gradually
    for (let i = 0; i < 500; i++) {
      const newNode: Node = {
        id: `stream-${i}`,
        label: `S${i}`,
        x: Math.random() * 1000,
        y: Math.random() * 800,
      };

      await this.visualizer.addNode(newNode);

      // Add edge to random existing node
      if (Math.random() > 0.3) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        await this.visualizer.addEdge({
          id: `stream-edge-${i}`,
          source: randomNode.id,
          target: newNode.id,
          weight: Math.floor(Math.random() * 10) + 1,
        });
      }

      if (i % 50 === 0) {
        console.log(`  Added ${i + 1} nodes...`);
      }

      await this.sleep(20);
    }

    console.log('✓ Streaming complete');
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }

  /**
   * Measure FPS over time period
   */
  private async measureFPS(duration: number): Promise<number> {
    const frames: number[] = [];
    const startTime = performance.now();

    return new Promise((resolve) => {
      const measureFrame = () => {
        const currentTime = performance.now();
        frames.push(currentTime);

        if (currentTime - startTime < duration) {
          requestAnimationFrame(measureFrame);
        } else {
          // Calculate average FPS
          const totalTime = (currentTime - startTime) / 1000; // seconds
          const fps = frames.length / totalTime;
          resolve(fps);
        }
      };

      requestAnimationFrame(measureFrame);
    });
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Display metrics in overlay
   */
  private displayMetrics(metrics: PerformanceMetrics): void {
    if (!this.metricsElement) return;

    this.metricsElement.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px;">Performance Metrics</div>
      <div>Nodes: ${metrics.nodeCount.toLocaleString()}</div>
      <div>Edges: ${metrics.edgeCount.toLocaleString()}</div>
      <div>Generation: ${metrics.generationTime.toFixed(2)}ms</div>
      <div>Render: ${metrics.renderTime.toFixed(2)}ms</div>
      <div>FPS: ${metrics.fps.toFixed(1)}</div>
      <div>Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB</div>
    `;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy(): void {
    this.visualizer?.destroy();
    this.performanceObserver?.disconnect();
    this.container.innerHTML = '';
  }
}

export async function runDemo(containerId: string = 'app'): Promise<void> {
  const container = document.getElementById(containerId)!;
  const demo = new PerformanceDemo(container);

  await demo.initialize();
  await demo.runScalabilityBenchmark();
}
