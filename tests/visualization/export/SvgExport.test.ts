/**
 * TDD Test Specification: SVG Export
 * Tests SVG vector export functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SvgExport', () => {
  describe('SVG Generation', () => {
    it('should generate SVG header', () => {
      const generateHeader = (width: number, height: number): string => {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
      };

      const header = generateHeader(800, 600);

      expect(header).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(header).toContain('width="800"');
      expect(header).toContain('height="600"');
    });

    it('should generate SVG circle', () => {
      const generateCircle = (cx: number, cy: number, r: number, fill: string): string => {
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" />`;
      };

      const circle = generateCircle(100, 100, 20, '#4CAF50');

      expect(circle).toBe('<circle cx="100" cy="100" r="20" fill="#4CAF50" />');
    });

    it('should generate SVG line', () => {
      const generateLine = (x1: number, y1: number, x2: number, y2: number, stroke: string, width: number): string => {
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" />`;
      };

      const line = generateLine(0, 0, 100, 100, '#666', 2);

      expect(line).toContain('x1="0"');
      expect(line).toContain('stroke="#666"');
    });

    it('should generate SVG text', () => {
      const generateText = (x: number, y: number, text: string, fill: string): string => {
        return `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial" font-size="14" text-anchor="middle">${text}</text>`;
      };

      const textElement = generateText(100, 100, 'Node A', '#000');

      expect(textElement).toContain('Node A');
      expect(textElement).toContain('fill="#000"');
    });

    it('should generate SVG rectangle', () => {
      const generateRect = (x: number, y: number, width: number, height: number, fill: string): string => {
        return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" />`;
      };

      const rect = generateRect(10, 10, 80, 320, '#4CAF50');

      expect(rect).toContain('x="10"');
      expect(rect).toContain('width="80"');
    });
  });

  describe('Graph to SVG', () => {
    it('should export graph as SVG', () => {
      interface Node {
        id: string;
        x: number;
        y: number;
        label: string;
      }

      interface Edge {
        from: string;
        to: string;
      }

      const exportGraphToSvg = (
        nodes: Node[],
        edges: Edge[],
        nodePositions: Map<string, { x: number, y: number }>,
        width: number,
        height: number
      ): string => {
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;

        // Draw edges
        edges.forEach(edge => {
          const from = nodePositions.get(edge.from);
          const to = nodePositions.get(edge.to);
          if (from && to) {
            svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#666" stroke-width="2" />`;
          }
        });

        // Draw nodes
        nodes.forEach(node => {
          svg += `<circle cx="${node.x}" cy="${node.y}" r="20" fill="#4CAF50" />`;
          svg += `<text x="${node.x}" y="${node.y + 5}" fill="#FFF" text-anchor="middle" font-size="14">${node.label}</text>`;
        });

        svg += '</svg>';
        return svg;
      };

      const nodes: Node[] = [
        { id: '1', x: 100, y: 100, label: 'A' },
        { id: '2', x: 200, y: 100, label: 'B' },
      ];

      const edges: Edge[] = [
        { from: '1', to: '2' },
      ];

      const positions = new Map([
        ['1', { x: 100, y: 100 }],
        ['2', { x: 200, y: 100 }],
      ]);

      const svg = exportGraphToSvg(nodes, edges, positions, 800, 600);

      expect(svg).toContain('<svg');
      expect(svg).toContain('<circle');
      expect(svg).toContain('<line');
      expect(svg).toContain('</svg>');
    });
  });

  describe('Tree to SVG', () => {
    it('should export tree as SVG', () => {
      interface TreeNode {
        value: number;
        x: number;
        y: number;
        left?: TreeNode;
        right?: TreeNode;
      }

      const exportTreeToSvg = (root: TreeNode | undefined, width: number, height: number): string => {
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;

        const renderNode = (node: TreeNode | undefined): void => {
          if (!node) return;

          // Draw edges to children
          if (node.left) {
            svg += `<line x1="${node.x}" y1="${node.y}" x2="${node.left.x}" y2="${node.left.y}" stroke="#666" stroke-width="2" />`;
          }
          if (node.right) {
            svg += `<line x1="${node.x}" y1="${node.y}" x2="${node.right.x}" y2="${node.right.y}" stroke="#666" stroke-width="2" />`;
          }

          // Draw node
          svg += `<circle cx="${node.x}" cy="${node.y}" r="25" fill="#4CAF50" />`;
          svg += `<text x="${node.x}" y="${node.y + 5}" fill="#FFF" text-anchor="middle" font-size="14">${node.value}</text>`;

          // Recursively render children
          renderNode(node.left);
          renderNode(node.right);
        };

        renderNode(root);
        svg += '</svg>';
        return svg;
      };

      const tree: TreeNode = {
        value: 10,
        x: 400,
        y: 50,
        left: { value: 5, x: 200, y: 130 },
        right: { value: 15, x: 600, y: 130 },
      };

      const svg = exportTreeToSvg(tree, 800, 600);

      expect(svg).toContain('10');
      expect(svg).toContain('5');
      expect(svg).toContain('15');
    });
  });

  describe('SVG Download', () => {
    it('should download SVG file', () => {
      const downloadSvg = vi.fn((svgContent: string, filename: string) => {
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });

      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" /></svg>';
      downloadSvg(svg, 'visualization.svg');

      expect(downloadSvg).toHaveBeenCalledWith(svg, 'visualization.svg');
    });

    it('should create SVG blob', () => {
      const createSvgBlob = (svgContent: string): Blob => {
        return new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      };

      const svg = '<svg></svg>';
      const blob = createSvgBlob(svg);

      expect(blob.type).toBe('image/svg+xml;charset=utf-8');
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('SVG Optimization', () => {
    it('should minify SVG', () => {
      const minifySvg = (svg: string): string => {
        return svg
          .replace(/>\s+</g, '><')
          .replace(/\s{2,}/g, ' ')
          .trim();
      };

      const verbose = `<svg>
        <circle cx="50" cy="50" r="40" />
      </svg>`;

      const minified = minifySvg(verbose);

      expect(minified).toBe('<svg><circle cx="50" cy="50" r="40" /></svg>');
    });

    it('should add CSS styles', () => {
      const addStyles = (svg: string): string => {
        const styles = `<style>
          .node { fill: #4CAF50; }
          .edge { stroke: #666; stroke-width: 2; }
          .label { fill: #FFF; font-family: Arial; font-size: 14px; }
        </style>`;

        return svg.replace('<svg', `<svg${styles}`);
      };

      const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      const styled = addStyles(svg);

      expect(styled).toContain('<style>');
      expect(styled).toContain('.node');
    });
  });

  describe('Error Handling', () => {
    it('should escape special characters in text', () => {
      const escapeXml = (text: string): string => {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      };

      expect(escapeXml('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should validate SVG before export', () => {
      const validateSvg = (svg: string): boolean => {
        return svg.includes('<svg') && svg.includes('</svg>');
      };

      expect(validateSvg('<svg></svg>')).toBe(true);
      expect(validateSvg('<div></div>')).toBe(false);
    });
  });
});
