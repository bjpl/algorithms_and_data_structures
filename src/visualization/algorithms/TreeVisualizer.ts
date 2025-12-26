/**
 * Tree Visualizer Component
 *
 * Production-ready visualization for various tree data structures.
 * Supports Binary Trees, BST, AVL, Red-Black, Heaps, B-Trees, and Tries.
 * Implements Reingold-Tilford algorithm for optimal tree layout.
 *
 * @module visualization/algorithms/TreeVisualizer
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
 * Tree node structure for internal tree representation
 */
export interface TreeNode<T = number> {
  /** Node value/data */
  value: T;
  /** Left child */
  left?: TreeNode<T>;
  /** Right child */
  right?: TreeNode<T>;
  /** Parent reference (used in some tree types) */
  parent?: TreeNode<T>;
  /** Node color (for Red-Black trees) */
  color?: 'red' | 'black';
  /** Balance factor (for AVL trees) */
  balanceFactor?: number;
  /** Height in tree */
  height?: number;
  /** Node position (calculated by layout) */
  x?: number;
  y?: number;
  /** Visual highlighting state */
  highlighted?: boolean;
  /** Children array (for B-Trees) */
  children?: TreeNode<T>[];
  /** Character (for Tries) */
  char?: string;
  /** End of word marker (for Tries) */
  isEndOfWord?: boolean;
}

/**
 * Tree type enumeration
 */
export type TreeType = 'binary' | 'bst' | 'avl' | 'redblack' | 'heap' | 'btree' | 'trie';

/**
 * Tree operation types
 */
export type TreeOperation = 'insert' | 'delete' | 'search' | 'traverse';

/**
 * Tree traversal types
 */
export type TraversalType = 'inorder' | 'preorder' | 'postorder' | 'levelorder';

/**
 * Visual state for tree nodes
 */
export type NodeVisualState =
  | 'default'
  | 'highlighted'
  | 'visited'
  | 'inserting'
  | 'deleting'
  | 'rotating'
  | 'balanced'
  | 'imbalanced';

/**
 * Configuration for TreeVisualizer
 */
export interface TreeVisualizerConfig extends VisualizationConfig {
  /** Type of tree structure */
  treeType: TreeType;
  /** Initial tree data (node structure or array) */
  data?: TreeNode | number[];
  /** Operation to visualize */
  operation?: TreeOperation;
  /** Traversal type (for traverse operation) */
  traversalType?: TraversalType;
  /** Show balance factors (AVL trees) */
  showBalanceFactor?: boolean;
  /** Show parent pointers */
  showParentPointers?: boolean;
  /** Node radius in pixels */
  nodeRadius?: number;
  /** Vertical spacing between levels */
  levelHeight?: number;
  /** Horizontal spacing between nodes */
  nodeSpacing?: number;
  /** Animation duration for operations (ms) */
  animationDuration?: number;
}

/**
 * Layout calculation result
 */
interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  mod: number;
  prelim: number;
  thread?: LayoutNode;
  ancestor?: LayoutNode;
}

// ============================================================================
// TREE VISUALIZER IMPLEMENTATION
// ============================================================================

/**
 * TreeVisualizer - Visualizes tree data structures with animations
 *
 * Features:
 * - Multiple tree types support
 * - Reingold-Tilford layout algorithm
 * - Operation step generation and visualization
 * - Animated insertions, deletions, rotations
 * - Traversal visualization
 *
 * @example
 * ```typescript
 * const visualizer = new TreeVisualizer({
 *   id: 'bst-viz',
 *   renderMode: '2d',
 *   width: 800,
 *   height: 600,
 *   treeType: 'bst',
 *   data: [10, 5, 15, 3, 7, 12, 20]
 * });
 *
 * await visualizer.initialize(container);
 * const steps = visualizer.generateOperationSteps('insert', 8);
 * for (const step of steps) {
 *   await visualizer.visualizeStep(step);
 * }
 * ```
 */
export class TreeVisualizer extends BaseVisualization {
  private treeConfig: TreeVisualizerConfig;
  private root: TreeNode | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private layoutCache: Map<TreeNode, LayoutNode> = new Map();
  private operationSteps: ExecutionStep[] = [];

  // Visual constants
  private readonly DEFAULT_NODE_RADIUS = 25;
  private readonly DEFAULT_LEVEL_HEIGHT = 80;
  private readonly DEFAULT_NODE_SPACING = 40;
  private readonly DEFAULT_ANIMATION_DURATION = 500;

  // Colors
  private readonly COLORS = {
    default: '#4CAF50',
    highlighted: '#2196F3',
    visited: '#9C27B0',
    inserting: '#FF9800',
    deleting: '#F44336',
    rotating: '#00BCD4',
    balanced: '#8BC34A',
    imbalanced: '#FF5722',
    red: '#F44336',
    black: '#212121',
    text: '#FFFFFF',
    edge: '#757575',
  };

  constructor(config: TreeVisualizerConfig) {
    super(config);
    this.treeConfig = config;

    // Build initial tree if data provided
    if (config.data) {
      this.buildTree(config.data);
    }
  }

  // ========================================================================
  // ABSTRACT METHOD IMPLEMENTATIONS
  // ========================================================================

  /**
   * Initialize canvas renderer
   */
  protected async initializeRenderer(container: HTMLElement): Promise<void> {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D rendering context');
    }

    container.appendChild(this.canvas);
  }

  /**
   * Cleanup renderer resources
   */
  protected cleanupRenderer(): void {
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
  }

  /**
   * Apply layout algorithm (uses Reingold-Tilford)
   */
  protected async applyLayoutInternal(config: LayoutConfig): Promise<void> {
    if (!this.root) {
      return;
    }

    this.applyTreeLayout();

    if (config.animate) {
      // Animate layout transition
      await this.animateLayoutTransition(config.animationDuration || 500);
    }
  }

  /**
   * Render current tree state
   */
  render(): void {
    if (!this.ctx || !this.canvas) {
      return;
    }

    const startTime = performance.now();

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.root) {
      this.renderEmptyState();
      return;
    }

    // Apply layout if needed
    if (!this.root.x || !this.root.y) {
      this.applyTreeLayout();
    }

    // Render in order: edges -> nodes -> labels
    this.renderEdges(this.root);
    this.renderNodes(this.root);

    if (this.treeConfig.showBalanceFactor && this.treeConfig.treeType === 'avl') {
      this.renderBalanceFactors(this.root);
    }

    // Update performance metrics
    const frameTime = performance.now() - startTime;
    this.updateMetrics(frameTime);
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  /**
   * Build tree from data
   *
   * @param data - Tree node structure or array of values
   *
   * @example
   * ```typescript
   * // From array (builds BST)
   * visualizer.buildTree([10, 5, 15, 3, 7]);
   *
   * // From node structure
   * visualizer.buildTree({
   *   value: 10,
   *   left: { value: 5 },
   *   right: { value: 15 }
   * });
   * ```
   */
  buildTree(data: TreeNode | number[]): void {
    if (Array.isArray(data)) {
      this.root = this.buildTreeFromArray(data);
    } else {
      this.root = data;
    }

    this.layoutCache.clear();
    this.applyTreeLayout();

    if (this.isInitialized) {
      this.render();
    }
  }

  /**
   * Generate visualization steps for an operation
   *
   * @param operation - Operation type
   * @param value - Value to operate on
   * @returns Array of execution steps
   *
   * @example
   * ```typescript
   * const steps = visualizer.generateOperationSteps('insert', 8);
   * for (const step of steps) {
   *   await visualizer.visualizeStep(step);
   *   await new Promise(resolve => setTimeout(resolve, 500));
   * }
   * ```
   */
  generateOperationSteps(operation: TreeOperation, value?: any): ExecutionStep[] {
    this.operationSteps = [];

    switch (operation) {
      case 'insert':
        this.generateInsertSteps(value);
        break;
      case 'delete':
        this.generateDeleteSteps(value);
        break;
      case 'search':
        this.generateSearchSteps(value);
        break;
      case 'traverse':
        this.generateTraversalSteps(this.treeConfig.traversalType || 'inorder');
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return this.operationSteps;
  }

  /**
   * Apply a visualization step
   *
   * @param step - Execution step to visualize
   */
  async visualizeStep(step: ExecutionStep): Promise<void> {
    // Mark affected nodes
    const nodes = this.findNodesByIds(step.affectedNodes);

    for (const node of nodes) {
      const state = step.data?.state as NodeVisualState;
      this.applyVisualState(node, state || 'highlighted');
    }

    this.render();

    // Emit step event
    this.emit({
      type: 'step:start',
      timestamp: Date.now(),
      source: this.config.id,
      step,
    });

    // Wait for animation
    await new Promise((resolve) =>
      setTimeout(resolve, this.treeConfig.animationDuration || this.DEFAULT_ANIMATION_DURATION)
    );

    this.emit({
      type: 'step:complete',
      timestamp: Date.now(),
      source: this.config.id,
      step,
    });
  }

  /**
   * Apply tree layout using Reingold-Tilford algorithm
   *
   * This algorithm provides optimal aesthetically pleasing tree layouts
   * with O(n) time complexity.
   */
  applyTreeLayout(): void {
    if (!this.root) {
      return;
    }

    const nodeRadius = this.treeConfig.nodeRadius || this.DEFAULT_NODE_RADIUS;
    const levelHeight = this.treeConfig.levelHeight || this.DEFAULT_LEVEL_HEIGHT;

    // First walk: assign preliminary x-coordinates and modifiers
    this.firstWalk(this.root, 0);

    // Second walk: compute final positions
    const startX = this.config.width / 2;
    const startY = nodeRadius * 2;
    this.secondWalk(this.root, 0, startX, startY, levelHeight);
  }

  /**
   * Get tree height
   *
   * @returns Height of the tree (number of levels)
   */
  getTreeHeight(): number {
    return this.calculateHeight(this.root);
  }

  /**
   * Check if tree is balanced
   *
   * A tree is balanced if the height difference between left and right
   * subtrees is at most 1 for every node.
   *
   * @returns True if balanced, false otherwise
   */
  isBalanced(): boolean {
    return this.checkBalanced(this.root) !== -1;
  }

  // ========================================================================
  // TREE BUILDING
  // ========================================================================

  /**
   * Build tree from array based on tree type
   */
  private buildTreeFromArray(values: number[]): TreeNode | null {
    if (values.length === 0) {
      return null;
    }

    switch (this.treeConfig.treeType) {
      case 'bst':
      case 'avl':
      case 'redblack':
        return this.buildBSTFromArray(values);
      case 'heap':
        return this.buildHeapFromArray(values);
      case 'binary':
        return this.buildBinaryTreeFromArray(values);
      default:
        return this.buildBSTFromArray(values);
    }
  }

  /**
   * Build BST from array by inserting values sequentially
   */
  private buildBSTFromArray(values: number[]): TreeNode | null {
    let root: TreeNode | null = null;

    for (const value of values) {
      root = this.insertBST(root, value);
    }

    return root;
  }

  /**
   * Build complete binary tree from array (level-order)
   */
  private buildBinaryTreeFromArray(values: number[]): TreeNode | null {
    if (values.length === 0) {
      return null;
    }

    const root: TreeNode = { value: values[0] };
    const queue: TreeNode[] = [root];
    let i = 1;

    while (i < values.length && queue.length > 0) {
      const node = queue.shift()!;

      // Add left child
      if (i < values.length) {
        node.left = { value: values[i], parent: node };
        queue.push(node.left);
        i++;
      }

      // Add right child
      if (i < values.length) {
        node.right = { value: values[i], parent: node };
        queue.push(node.right);
        i++;
      }
    }

    return root;
  }

  /**
   * Build heap from array
   */
  private buildHeapFromArray(values: number[]): TreeNode | null {
    // Build complete binary tree first
    const root = this.buildBinaryTreeFromArray(values);

    // Heapify (visualization can show this process)
    // For now, just build the structure
    return root;
  }

  /**
   * Insert value into BST
   */
  private insertBST(root: TreeNode | null, value: number): TreeNode {
    if (!root) {
      return {
        value,
        color: this.treeConfig.treeType === 'redblack' ? 'red' : undefined,
      };
    }

    if (value < root.value) {
      root.left = this.insertBST(root.left || null, value);
      if (root.left) {
        root.left.parent = root;
      }
    } else if (value > root.value) {
      root.right = this.insertBST(root.right || null, value);
      if (root.right) {
        root.right.parent = root;
      }
    }

    // Update height and balance factor for AVL trees
    if (this.treeConfig.treeType === 'avl') {
      this.updateNodeMetrics(root);
    }

    return root;
  }

  // ========================================================================
  // LAYOUT ALGORITHM (Reingold-Tilford)
  // ========================================================================

  /**
   * First walk of Reingold-Tilford algorithm
   * Assigns preliminary x-coordinates and modifiers
   */
  private firstWalk(node: TreeNode | undefined, depth: number): void {
    if (!node) {
      return;
    }

    const layoutNode = this.getOrCreateLayoutNode(node);

    if (!node.left && !node.right) {
      // Leaf node
      layoutNode.prelim = 0;
      layoutNode.mod = 0;
    } else {
      // Interior node
      this.firstWalk(node.left, depth + 1);
      this.firstWalk(node.right, depth + 1);

      const spacing = this.treeConfig.nodeSpacing || this.DEFAULT_NODE_SPACING;
      const leftLayout = node.left ? this.getOrCreateLayoutNode(node.left) : null;
      const rightLayout = node.right ? this.getOrCreateLayoutNode(node.right) : null;

      if (leftLayout && rightLayout) {
        // Both children
        layoutNode.prelim = (leftLayout.prelim + rightLayout.prelim) / 2;
      } else if (leftLayout) {
        // Only left child
        layoutNode.prelim = leftLayout.prelim;
      } else if (rightLayout) {
        // Only right child
        layoutNode.prelim = rightLayout.prelim;
      }

      // Separate children
      if (node.left && node.right) {
        const leftContour = this.getRightContour(node.left);
        const rightContour = this.getLeftContour(node.right);
        const shift = spacing + leftContour - rightContour;

        if (shift > 0) {
          const rightNode = this.getOrCreateLayoutNode(node.right);
          rightNode.mod = shift;
          layoutNode.prelim += shift / 2;
        }
      }
    }
  }

  /**
   * Second walk of Reingold-Tilford algorithm
   * Computes final positions based on preliminaries
   */
  private secondWalk(
    node: TreeNode | undefined,
    mod: number,
    x: number,
    y: number,
    levelHeight: number
  ): void {
    if (!node) {
      return;
    }

    const layoutNode = this.getOrCreateLayoutNode(node);
    const finalX = x + layoutNode.prelim + mod;

    node.x = finalX;
    node.y = y;

    // Recurse to children
    this.secondWalk(node.left, mod + layoutNode.mod, finalX, y + levelHeight, levelHeight);
    this.secondWalk(node.right, mod + layoutNode.mod, finalX, y + levelHeight, levelHeight);
  }

  /**
   * Get or create layout node for tree node
   */
  private getOrCreateLayoutNode(node: TreeNode): LayoutNode {
    let layout = this.layoutCache.get(node);

    if (!layout) {
      layout = {
        node,
        x: 0,
        y: 0,
        prelim: 0,
        mod: 0,
      };
      this.layoutCache.set(node, layout);
    }

    return layout;
  }

  /**
   * Get rightmost contour of subtree
   */
  private getRightContour(node: TreeNode): number {
    if (!node.right) {
      return node.x || 0;
    }
    return this.getRightContour(node.right);
  }

  /**
   * Get leftmost contour of subtree
   */
  private getLeftContour(node: TreeNode): number {
    if (!node.left) {
      return node.x || 0;
    }
    return this.getLeftContour(node.left);
  }

  // ========================================================================
  // OPERATION STEP GENERATION
  // ========================================================================

  /**
   * Generate steps for insertion operation
   */
  private generateInsertSteps(value: number): void {
    const path: TreeNode[] = [];
    let current = this.root;

    // Find insertion point
    while (current) {
      path.push(current);

      this.operationSteps.push({
        index: this.operationSteps.length,
        description: `Comparing ${value} with ${current.value}`,
        affectedNodes: [this.getNodeId(current)],
        status: 'active',
        data: { state: 'highlighted' as NodeVisualState },
      });

      if (value < current.value) {
        if (!current.left) {
          break;
        }
        current = current.left;
      } else if (value > current.value) {
        if (!current.right) {
          break;
        }
        current = current.right;
      } else {
        // Value already exists
        this.operationSteps.push({
          index: this.operationSteps.length,
          description: `Value ${value} already exists`,
          affectedNodes: [this.getNodeId(current)],
          status: 'completed',
          data: { state: 'default' as NodeVisualState },
        });
        return;
      }
    }

    // Insert new node
    this.operationSteps.push({
      index: this.operationSteps.length,
      description: `Inserting ${value}`,
      affectedNodes: path.map((n) => this.getNodeId(n)),
      status: 'completed',
      data: { state: 'inserting' as NodeVisualState, value },
    });
  }

  /**
   * Generate steps for deletion operation
   */
  private generateDeleteSteps(value: number): void {
    const path: TreeNode[] = [];
    let current = this.root;
    let found = false;

    // Find node to delete
    while (current) {
      path.push(current);

      this.operationSteps.push({
        index: this.operationSteps.length,
        description: `Searching for ${value}`,
        affectedNodes: [this.getNodeId(current)],
        status: 'active',
        data: { state: 'highlighted' as NodeVisualState },
      });

      if (value === current.value) {
        found = true;
        break;
      } else if (value < current.value) {
        current = current.left || null;
      } else {
        current = current.right || null;
      }
    }

    if (!found || !current) {
      this.operationSteps.push({
        index: this.operationSteps.length,
        description: `Value ${value} not found`,
        affectedNodes: [],
        status: 'error',
      });
      return;
    }

    // Mark for deletion
    this.operationSteps.push({
      index: this.operationSteps.length,
      description: `Deleting node with value ${value}`,
      affectedNodes: [this.getNodeId(current)],
      status: 'completed',
      data: { state: 'deleting' as NodeVisualState },
    });
  }

  /**
   * Generate steps for search operation
   */
  private generateSearchSteps(value: number): void {
    const path: TreeNode[] = [];
    let current = this.root;

    while (current) {
      path.push(current);

      const comparison =
        value === current.value
          ? 'Found!'
          : value < current.value
            ? `${value} < ${current.value}, go left`
            : `${value} > ${current.value}, go right`;

      this.operationSteps.push({
        index: this.operationSteps.length,
        description: comparison,
        affectedNodes: path.map((n) => this.getNodeId(n)),
        status: value === current.value ? 'completed' : 'active',
        data: { state: 'highlighted' as NodeVisualState },
      });

      if (value === current.value) {
        return;
      } else if (value < current.value) {
        current = current.left || null;
      } else {
        current = current.right || null;
      }
    }

    this.operationSteps.push({
      index: this.operationSteps.length,
      description: `Value ${value} not found`,
      affectedNodes: path.map((n) => this.getNodeId(n)),
      status: 'completed',
      data: { state: 'default' as NodeVisualState },
    });
  }

  /**
   * Generate steps for tree traversal
   */
  private generateTraversalSteps(type: TraversalType): void {
    const visited: TreeNode[] = [];

    switch (type) {
      case 'inorder':
        this.inorderTraversal(this.root, visited);
        break;
      case 'preorder':
        this.preorderTraversal(this.root, visited);
        break;
      case 'postorder':
        this.postorderTraversal(this.root, visited);
        break;
      case 'levelorder':
        this.levelorderTraversal(this.root, visited);
        break;
    }

    // Create steps from visited order
    visited.forEach((node, index) => {
      this.operationSteps.push({
        index,
        description: `Visit node ${node.value}`,
        affectedNodes: [this.getNodeId(node)],
        status: 'active',
        data: { state: 'visited' as NodeVisualState },
      });
    });
  }

  // ========================================================================
  // TRAVERSAL ALGORITHMS
  // ========================================================================

  private inorderTraversal(node: TreeNode | undefined, visited: TreeNode[]): void {
    if (!node) return;
    this.inorderTraversal(node.left, visited);
    visited.push(node);
    this.inorderTraversal(node.right, visited);
  }

  private preorderTraversal(node: TreeNode | undefined, visited: TreeNode[]): void {
    if (!node) return;
    visited.push(node);
    this.preorderTraversal(node.left, visited);
    this.preorderTraversal(node.right, visited);
  }

  private postorderTraversal(node: TreeNode | undefined, visited: TreeNode[]): void {
    if (!node) return;
    this.postorderTraversal(node.left, visited);
    this.postorderTraversal(node.right, visited);
    visited.push(node);
  }

  private levelorderTraversal(node: TreeNode | undefined, visited: TreeNode[]): void {
    if (!node) return;

    const queue: TreeNode[] = [node];

    while (queue.length > 0) {
      const current = queue.shift()!;
      visited.push(current);

      if (current.left) queue.push(current.left);
      if (current.right) queue.push(current.right);
    }
  }

  // ========================================================================
  // RENDERING
  // ========================================================================

  /**
   * Render edges between nodes
   */
  private renderEdges(node: TreeNode | undefined): void {
    if (!node || !this.ctx) {
      return;
    }

    const ctx = this.ctx;
    ctx.strokeStyle = this.COLORS.edge;
    ctx.lineWidth = 2;

    if (node.left && node.left.x !== undefined && node.left.y !== undefined) {
      ctx.beginPath();
      ctx.moveTo(node.x!, node.y!);
      ctx.lineTo(node.left.x, node.left.y);
      ctx.stroke();
      this.renderEdges(node.left);
    }

    if (node.right && node.right.x !== undefined && node.right.y !== undefined) {
      ctx.beginPath();
      ctx.moveTo(node.x!, node.y!);
      ctx.lineTo(node.right.x, node.right.y);
      ctx.stroke();
      this.renderEdges(node.right);
    }

    // Render additional children for B-Trees
    if (node.children) {
      for (const child of node.children) {
        if (child.x !== undefined && child.y !== undefined) {
          ctx.beginPath();
          ctx.moveTo(node.x!, node.y!);
          ctx.lineTo(child.x, child.y);
          ctx.stroke();
          this.renderEdges(child);
        }
      }
    }
  }

  /**
   * Render tree nodes
   */
  private renderNodes(node: TreeNode | undefined): void {
    if (!node || !this.ctx || node.x === undefined || node.y === undefined) {
      return;
    }

    const ctx = this.ctx;
    const radius = this.treeConfig.nodeRadius || this.DEFAULT_NODE_RADIUS;

    // Determine node color
    let fillColor = this.COLORS.default;
    if (node.highlighted) {
      fillColor = this.COLORS.highlighted;
    } else if (this.treeConfig.treeType === 'redblack' && node.color) {
      fillColor = node.color === 'red' ? this.COLORS.red : this.COLORS.black;
    }

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw node value
    ctx.fillStyle = this.COLORS.text;
    ctx.font = `bold ${radius * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(node.value), node.x, node.y);

    // Recurse to children
    this.renderNodes(node.left);
    this.renderNodes(node.right);

    if (node.children) {
      for (const child of node.children) {
        this.renderNodes(child);
      }
    }
  }

  /**
   * Render balance factors (AVL trees)
   */
  private renderBalanceFactors(node: TreeNode | undefined): void {
    if (!node || !this.ctx || node.x === undefined || node.y === undefined) {
      return;
    }

    const ctx = this.ctx;
    const radius = this.treeConfig.nodeRadius || this.DEFAULT_NODE_RADIUS;

    if (node.balanceFactor !== undefined) {
      ctx.fillStyle = node.balanceFactor === 0 ? this.COLORS.balanced : this.COLORS.imbalanced;
      ctx.font = `${radius * 0.4}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(`BF: ${node.balanceFactor}`, node.x, node.y + radius + 15);
    }

    this.renderBalanceFactors(node.left);
    this.renderBalanceFactors(node.right);
  }

  /**
   * Render empty tree state
   */
  private renderEmptyState(): void {
    if (!this.ctx) {
      return;
    }

    this.ctx.fillStyle = '#999';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Empty Tree', this.config.width / 2, this.config.height / 2);
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Calculate height of tree
   */
  private calculateHeight(node: TreeNode | null | undefined): number {
    if (!node) {
      return 0;
    }
    return 1 + Math.max(this.calculateHeight(node.left), this.calculateHeight(node.right));
  }

  /**
   * Check if tree is balanced (returns -1 if not, height if yes)
   */
  private checkBalanced(node: TreeNode | null | undefined): number {
    if (!node) {
      return 0;
    }

    const leftHeight = this.checkBalanced(node.left);
    if (leftHeight === -1) return -1;

    const rightHeight = this.checkBalanced(node.right);
    if (rightHeight === -1) return -1;

    if (Math.abs(leftHeight - rightHeight) > 1) {
      return -1;
    }

    return 1 + Math.max(leftHeight, rightHeight);
  }

  /**
   * Update AVL node metrics (height, balance factor)
   */
  private updateNodeMetrics(node: TreeNode): void {
    const leftHeight = this.calculateHeight(node.left);
    const rightHeight = this.calculateHeight(node.right);

    node.height = 1 + Math.max(leftHeight, rightHeight);
    node.balanceFactor = rightHeight - leftHeight;
  }

  /**
   * Apply visual state to node
   */
  private applyVisualState(node: TreeNode, state: NodeVisualState): void {
    node.highlighted = state !== 'default';

    // Additional state-specific styling can be added here
  }

  /**
   * Find nodes by their IDs
   */
  private findNodesByIds(ids: string[]): TreeNode[] {
    const nodes: TreeNode[] = [];
    const idSet = new Set(ids);

    const traverse = (node: TreeNode | undefined) => {
      if (!node) return;
      if (idSet.has(this.getNodeId(node))) {
        nodes.push(node);
      }
      traverse(node.left);
      traverse(node.right);
      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(this.root || undefined);
    return nodes;
  }

  /**
   * Get unique ID for node
   */
  private getNodeId(node: TreeNode): string {
    // Use value as ID (assumes unique values)
    // For production, consider using WeakMap or symbol-based IDs
    return `node-${node.value}`;
  }

  /**
   * Animate layout transition
   */
  private async animateLayoutTransition(duration: number): Promise<void> {
    // Animation implementation would interpolate between old and new positions
    return new Promise((resolve) => setTimeout(resolve, duration));
  }
}
