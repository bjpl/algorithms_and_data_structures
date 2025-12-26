/**
 * Tree Visualizer Integration Demo
 *
 * Comprehensive demonstration of tree data structure visualization including:
 * - AVL tree self-balancing operations
 * - BST insertions and deletions
 * - Tree traversals (inorder, preorder, postorder, level-order)
 * - Interactive node manipulation
 *
 * @example
 * ```typescript
 * const demo = new TreeVisualizerDemo(document.getElementById('app')!);
 * await demo.initialize();
 * await demo.runAVLBalancingDemo();
 * ```
 */

import { TreeVisualizer } from '../src/visualization/algorithms/TreeVisualizer';
import type {
  TreeType,
  TreeOperation,
  TraversalType,
} from '../src/visualization/algorithms/TreeVisualizer';

export class TreeVisualizerDemo {
  private container: HTMLElement;
  private visualizer: TreeVisualizer | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async initialize(): Promise<void> {
    console.log('Initializing Tree Visualizer Demo...');
    
    // Create AVL tree visualizer
    this.visualizer = new TreeVisualizer({
      id: 'tree-demo',
      renderMode: '2d',
      width: 800,
      height: 600,
      treeType: 'avl',
      data: [50, 25, 75, 10, 30, 60, 90],
      showBalanceFactor: true,
      nodeRadius: 25,
      levelHeight: 80,
    });

    // Create container
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'tree-canvas';
    canvasContainer.style.cssText = `
      border: 2px solid #ddd;
      border-radius: 8px;
      background: white;
      min-height: 600px;
    `;
    this.container.appendChild(canvasContainer);

    await this.visualizer.initialize(canvasContainer);
    
    console.log('✓ Tree visualizer initialized');
  }

  /**
   * Demonstrate AVL tree self-balancing
   */
  async runAVLBalancingDemo(): Promise<void> {
    console.log('\n=== AVL Tree Self-Balancing Demo ===\n');

    const insertions = [15, 20, 35];

    for (const value of insertions) {
      console.log(`Inserting ${value}...`);
      
      const steps = this.visualizer!.generateOperationSteps('insert', value);
      
      for (const step of steps) {
        await this.visualizer!.visualizeStep(step);
        await this.sleep(800);
      }

      await this.sleep(1500);
    }

    console.log('\n✓ AVL balancing complete!');
    console.log(`  Tree height: ${this.visualizer!.getTreeHeight()}`);
    console.log(`  Is balanced: ${this.visualizer!.isBalanced()}`);
  }

  /**
   * Demonstrate tree traversals
   */
  async runTraversalDemo(): Promise<void> {
    console.log('\n=== Tree Traversal Demo ===\n');

    const traversals: TraversalType[] = ['inorder', 'preorder', 'postorder', 'levelorder'];

    for (const traversal of traversals) {
      console.log(`\n${traversal.toUpperCase()} traversal:`);
      
      const steps = this.visualizer!.generateOperationSteps('traverse');
      
      for (const step of steps) {
        await this.visualizer!.visualizeStep(step);
        await this.sleep(500);
      }

      await this.sleep(1500);
      this.visualizer!.reset();
    }

    console.log('\n✓ All traversals complete!');
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
  const demo = new TreeVisualizerDemo(container);
  await demo.initialize();
  await demo.runAVLBalancingDemo();
  await demo.runTraversalDemo();
}
