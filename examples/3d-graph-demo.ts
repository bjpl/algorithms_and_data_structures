/**
 * 3D Graph Visualization Demo
 *
 * Demonstrates WebGL-based 3D force-directed graph visualization with:
 * - Interactive camera controls (orbit, pan, zoom)
 * - Force-directed layout in 3D space
 * - Path highlighting in 3D
 * - LOD (Level of Detail) optimization
 * - Multiple layout algorithms (sphere, helix, force)
 *
 * @example
 * ```typescript
 * const demo = new Graph3DDemo(document.getElementById('app')!);
 * await demo.initialize();
 * demo.animate();
 * ```
 */

import { Graph3DVisualizer } from '../src/visualization/3d/Graph3DVisualizer';
import type { Node3D, Edge3D, Layout3DType } from '../src/visualization/3d/Graph3DVisualizer';

export class Graph3DDemo {
  private container: HTMLElement;
  private visualizer: Graph3DVisualizer | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async initialize(): Promise<void> {
    console.log('Initializing 3D Graph Demo...');

    // Create sample 3D graph
    const nodes: Node3D[] = Array.from({ length: 20 }, (_, i) => ({
      id: `node-${i}`,
      position: {
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        z: (Math.random() - 0.5) * 200,
      },
      style: {
        color: `hsl(${i * 18}, 70%, 60%)`,
        size: 5 + Math.random() * 5,
        label: `N${i}`,
      },
    }));

    const edges: Edge3D[] = [];
    for (let i = 0; i < 30; i++) {
      const source = Math.floor(Math.random() * nodes.length);
      const target = Math.floor(Math.random() * nodes.length);

      if (source !== target) {
        edges.push({
          id: `edge-${i}`,
          source: nodes[source].id,
          target: nodes[target].id,
          style: {
            width: 1,
            color: '#999999',
            opacity: 0.6,
          },
        });
      }
    }

    this.visualizer = new Graph3DVisualizer({
      id: '3d-graph-demo',
      renderMode: '3d',
      width: 800,
      height: 600,
      nodes,
      edges,
      layout: '3d-force',
      enablePhysics: true,
      enableLOD: true,
      showLabels: true,
      backgroundColor: '#1a1a1a',
      cameraPosition: {
        x: 0,
        y: 0,
        z: 500,
        fov: 75,
      },
    });

    await this.visualizer.initialize(this.container);

    console.log('✓ 3D Graph initialized');
    console.log('  Use mouse to orbit, right-click to pan, scroll to zoom');
    console.log('  Press R to reset camera, F to fit to view');
  }

  /**
   * Demonstrate different 3D layouts
   */
  async runLayoutDemo(): Promise<void> {
    const layouts: Layout3DType[] = ['3d-force', '3d-sphere', '3d-helix'];

    for (const layout of layouts) {
      console.log(`\nApplying ${layout} layout...`);
      await this.visualizer!.applyLayout3D(layout);
      await this.sleep(3000);
    }

    console.log('\n✓ Layout demo complete!');
  }

  /**
   * Animate camera rotation
   */
  animate(duration: number = 10000): void {
    console.log('Starting camera animation...');
    this.visualizer!.animate(duration, 0.001);
  }

  /**
   * Highlight a path through the graph in 3D
   */
  highlightPath(): void {
    const nodes = this.visualizer!.getNodes();
    const pathNodeIds = nodes.slice(0, 5).map(n => n.id);

    console.log(`Highlighting path: ${pathNodeIds.join(' → ')}`);
    this.visualizer!.highlightPath3D(pathNodeIds);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy(): void {
    this.visualizer?.stopAnimation();
    this.visualizer?.destroy();
    this.container.innerHTML = '';
  }
}

export async function runDemo(containerId: string = 'app'): Promise<void> {
  const container = document.getElementById(containerId)!;
  const demo = new Graph3DDemo(container);

  await demo.initialize();
  await demo.runLayoutDemo();
  demo.animate(15000);

  setTimeout(() => demo.highlightPath(), 2000);
}
