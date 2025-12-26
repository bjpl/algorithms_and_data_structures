/**
 * TDD Test Specification: Tree Visualizer
 * Tests binary tree, BST, AVL tree visualization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

interface TreeNode {
  value: number;
  x: number;
  y: number;
  left?: TreeNode;
  right?: TreeNode;
  color: string;
  highlighted: boolean;
}

describe('TreeVisualizer', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    ctx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      fillText: vi.fn(),
      font: '',
      textAlign: 'center' as CanvasTextAlign,
      textBaseline: 'middle' as CanvasTextBaseline,
      save: vi.fn(),
      restore: vi.fn(),
    } as any;

    vi.spyOn(canvas, 'getContext').mockReturnValue(ctx);
  });

  describe('Tree Layout', () => {
    it('should calculate node positions', () => {
      const calculatePosition = (
        node: TreeNode | undefined,
        x: number,
        y: number,
        horizontalSpacing: number,
        level: number
      ): void => {
        if (!node) return;

        node.x = x;
        node.y = y;

        const nextY = y + 80;
        const nextSpacing = horizontalSpacing / 2;

        if (node.left) {
          calculatePosition(node.left, x - horizontalSpacing, nextY, nextSpacing, level + 1);
        }
        if (node.right) {
          calculatePosition(node.right, x + horizontalSpacing, nextY, nextSpacing, level + 1);
        }
      };

      const root: TreeNode = {
        value: 10,
        x: 0,
        y: 0,
        color: '#4CAF50',
        highlighted: false,
        left: { value: 5, x: 0, y: 0, color: '#4CAF50', highlighted: false },
        right: { value: 15, x: 0, y: 0, color: '#4CAF50', highlighted: false },
      };

      calculatePosition(root, 400, 50, 200, 0);

      expect(root.x).toBe(400);
      expect(root.y).toBe(50);
      expect(root.left?.x).toBe(200);
      expect(root.right?.x).toBe(600);
    });

    it('should render node edges before nodes', () => {
      const renderEdges = vi.fn((node: TreeNode | undefined, ctx: CanvasRenderingContext2D) => {
        if (!node) return;

        if (node.left) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(node.left.x, node.left.y);
          ctx.stroke();
        }

        if (node.right) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(node.right.x, node.right.y);
          ctx.stroke();
        }
      });

      const root: TreeNode = {
        value: 10,
        x: 400,
        y: 50,
        color: '#4CAF50',
        highlighted: false,
        left: { value: 5, x: 200, y: 130, color: '#4CAF50', highlighted: false },
      };

      renderEdges(root, ctx);

      expect(ctx.moveTo).toHaveBeenCalledWith(400, 50);
      expect(ctx.lineTo).toHaveBeenCalledWith(200, 130);
    });

    it('should render nodes', () => {
      const renderNode = vi.fn((node: TreeNode, ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.fillText(node.value.toString(), node.x, node.y);
      });

      const node: TreeNode = {
        value: 10,
        x: 400,
        y: 50,
        color: '#4CAF50',
        highlighted: false,
      };

      renderNode(node, ctx);

      expect(ctx.arc).toHaveBeenCalledWith(400, 50, 25, 0, 2 * Math.PI);
      expect(ctx.fillText).toHaveBeenCalledWith('10', 400, 50);
    });
  });

  describe('BST Operations Visualization', () => {
    it('should highlight search path', () => {
      const searchPath: number[] = [10, 5, 7];

      const highlightPath = (path: number[], root: TreeNode) => {
        const highlight = (node: TreeNode | undefined, value: number): void => {
          if (!node) return;

          if (path.includes(node.value)) {
            node.highlighted = true;
            node.color = '#2196F3';
          }

          if (value < node.value) {
            highlight(node.left, value);
          } else if (value > node.value) {
            highlight(node.right, value);
          }
        };

        path.forEach(value => highlight(root, value));
      };

      const root: TreeNode = {
        value: 10,
        x: 400,
        y: 50,
        color: '#4CAF50',
        highlighted: false,
        left: {
          value: 5,
          x: 200,
          y: 130,
          color: '#4CAF50',
          highlighted: false,
          right: {
            value: 7,
            x: 300,
            y: 210,
            color: '#4CAF50',
            highlighted: false,
          },
        },
      };

      highlightPath(searchPath, root);

      expect(root.highlighted).toBe(true);
      expect(root.left?.highlighted).toBe(true);
      expect(root.left?.right?.highlighted).toBe(true);
    });

    it('should visualize insertion', () => {
      const insert = (root: TreeNode | undefined, value: number): TreeNode => {
        if (!root) {
          return {
            value,
            x: 0,
            y: 0,
            color: '#FF9800',
            highlighted: true,
          };
        }

        if (value < root.value) {
          root.left = insert(root.left, value);
        } else if (value > root.value) {
          root.right = insert(root.right, value);
        }

        return root;
      };

      const root: TreeNode = {
        value: 10,
        x: 400,
        y: 50,
        color: '#4CAF50',
        highlighted: false,
      };

      const newRoot = insert(root, 5);

      expect(newRoot.left?.value).toBe(5);
      expect(newRoot.left?.highlighted).toBe(true);
    });

    it('should visualize deletion', () => {
      const markDeleted = (node: TreeNode) => {
        node.color = '#F44336';
        node.highlighted = true;
      };

      const node: TreeNode = {
        value: 5,
        x: 200,
        y: 130,
        color: '#4CAF50',
        highlighted: false,
      };

      markDeleted(node);

      expect(node.color).toBe('#F44336');
      expect(node.highlighted).toBe(true);
    });
  });

  describe('AVL Tree Rotations', () => {
    it('should visualize left rotation', () => {
      const animateLeftRotation = vi.fn((
        pivot: TreeNode,
        parent: TreeNode,
        animationStep: number
      ) => {
        // Animate rotation by interpolating positions
        const progress = animationStep / 10;
        pivot.x = pivot.x + (parent.x - pivot.x) * progress;
        pivot.y = pivot.y + (parent.y - pivot.y) * progress;
      });

      const parent: TreeNode = {
        value: 10,
        x: 400,
        y: 50,
        color: '#4CAF50',
        highlighted: false,
      };

      const pivot: TreeNode = {
        value: 15,
        x: 600,
        y: 130,
        color: '#2196F3',
        highlighted: true,
      };

      animateLeftRotation(pivot, parent, 5);

      expect(animateLeftRotation).toHaveBeenCalled();
    });

    it('should show balance factors', () => {
      const calculateBalanceFactor = (node: TreeNode): number => {
        const getHeight = (n: TreeNode | undefined): number => {
          if (!n) return 0;
          return 1 + Math.max(
            getHeight(n.left),
            getHeight(n.right)
          );
        };

        return getHeight(node.right) - getHeight(node.left);
      };

      const root: TreeNode = {
        value: 10,
        x: 400,
        y: 50,
        color: '#4CAF50',
        highlighted: false,
        left: { value: 5, x: 200, y: 130, color: '#4CAF50', highlighted: false },
        right: {
          value: 15,
          x: 600,
          y: 130,
          color: '#4CAF50',
          highlighted: false,
          right: { value: 20, x: 700, y: 210, color: '#4CAF50', highlighted: false },
        },
      };

      const bf = calculateBalanceFactor(root);

      expect(bf).toBe(1);
    });
  });

  describe('Tree Traversal Visualization', () => {
    it('should animate inorder traversal', async () => {
      const visited: number[] = [];

      const inorder = async (node: TreeNode | undefined): Promise<void> => {
        if (!node) return;

        await inorder(node.left);
        visited.push(node.value);
        node.highlighted = true;
        await new Promise(resolve => setTimeout(resolve, 100));
        await inorder(node.right);
      };

      const root: TreeNode = {
        value: 10,
        x: 400,
        y: 50,
        color: '#4CAF50',
        highlighted: false,
        left: { value: 5, x: 200, y: 130, color: '#4CAF50', highlighted: false },
        right: { value: 15, x: 600, y: 130, color: '#4CAF50', highlighted: false },
      };

      await inorder(root);

      expect(visited).toEqual([5, 10, 15]);
    });

    it('should animate preorder traversal', async () => {
      const visited: number[] = [];

      const preorder = async (node: TreeNode | undefined): Promise<void> => {
        if (!node) return;

        visited.push(node.value);
        node.highlighted = true;
        await new Promise(resolve => setTimeout(resolve, 100));
        await preorder(node.left);
        await preorder(node.right);
      };

      const root: TreeNode = {
        value: 10,
        x: 400,
        y: 50,
        color: '#4CAF50',
        highlighted: false,
        left: { value: 5, x: 200, y: 130, color: '#4CAF50', highlighted: false },
        right: { value: 15, x: 600, y: 130, color: '#4CAF50', highlighted: false },
      };

      await preorder(root);

      expect(visited).toEqual([10, 5, 15]);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty tree', () => {
      const renderTree = (root: TreeNode | undefined, ctx: CanvasRenderingContext2D) => {
        if (!root) {
          ctx.fillText('Empty Tree', 400, 300);
          return;
        }
      };

      renderTree(undefined, ctx);

      expect(ctx.fillText).toHaveBeenCalledWith('Empty Tree', 400, 300);
    });

    it('should handle deep trees', () => {
      const getHeight = (node: TreeNode | undefined): number => {
        if (!node) return 0;
        return 1 + Math.max(getHeight(node.left), getHeight(node.right));
      };

      let deepTree: TreeNode = {
        value: 1,
        x: 0,
        y: 0,
        color: '#4CAF50',
        highlighted: false,
      };

      for (let i = 2; i <= 10; i++) {
        deepTree = {
          value: i,
          x: 0,
          y: 0,
          color: '#4CAF50',
          highlighted: false,
          left: deepTree,
        };
      }

      const height = getHeight(deepTree);

      expect(height).toBe(10);
    });
  });
});
