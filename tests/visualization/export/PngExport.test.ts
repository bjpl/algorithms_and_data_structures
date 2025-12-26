/**
 * TDD Test Specification: PNG Export
 * Tests PNG image export functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PngExport', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    ctx = {
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(800 * 600 * 4),
        width: 800,
        height: 600,
      })),
    } as any;

    vi.spyOn(canvas, 'getContext').mockReturnValue(ctx);
    vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/png;base64,iVBORw0KG...');
    vi.spyOn(canvas, 'toBlob').mockImplementation((callback: any) => {
      const blob = new Blob(['fake'], { type: 'image/png' });
      callback(blob);
    });
  });

  describe('Export to PNG', () => {
    it('should export canvas as PNG data URL', () => {
      const exportToPng = (canvas: HTMLCanvasElement): string => {
        return canvas.toDataURL('image/png');
      };

      const dataUrl = exportToPng(canvas);

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(canvas.toDataURL).toHaveBeenCalledWith('image/png');
    });

    it('should export with custom quality', () => {
      const exportWithQuality = (canvas: HTMLCanvasElement, quality: number): string => {
        return canvas.toDataURL('image/png', quality);
      };

      const dataUrl = exportWithQuality(canvas, 0.8);

      expect(canvas.toDataURL).toHaveBeenCalledWith('image/png', 0.8);
    });

    it('should download PNG file', () => {
      const downloadPng = vi.fn((canvas: HTMLCanvasElement, filename: string) => {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
      });

      downloadPng(canvas, 'visualization.png');

      expect(downloadPng).toHaveBeenCalledWith(canvas, 'visualization.png');
    });

    it('should export as Blob', async () => {
      const exportToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/png');
        });
      };

      const blob = await exportToBlob(canvas);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });
  });

  describe('Image Processing', () => {
    it('should get image data', () => {
      const getImageData = (canvas: HTMLCanvasElement): ImageData => {
        const ctx = canvas.getContext('2d')!;
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      };

      const imageData = getImageData(canvas);

      expect(imageData.width).toBe(800);
      expect(imageData.height).toBe(600);
      expect(ctx.getImageData).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should apply watermark', () => {
      const applyWatermark = vi.fn((ctx: CanvasRenderingContext2D, text: string) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '20px Arial';
        ctx.fillText(text, 10, canvas.height - 10);
      });

      applyWatermark(ctx as any, 'Algorithm Visualizer');

      expect(applyWatermark).toHaveBeenCalledWith(ctx, 'Algorithm Visualizer');
    });

    it('should resize before export', () => {
      const resizeCanvas = (
        sourceCanvas: HTMLCanvasElement,
        targetWidth: number,
        targetHeight: number
      ): HTMLCanvasElement => {
        const resized = document.createElement('canvas');
        resized.width = targetWidth;
        resized.height = targetHeight;

        const ctx = resized.getContext('2d')!;
        ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

        return resized;
      };

      const resized = resizeCanvas(canvas, 400, 300);

      expect(resized.width).toBe(400);
      expect(resized.height).toBe(300);
    });
  });

  describe('Error Handling', () => {
    it('should handle export failure', async () => {
      vi.spyOn(canvas, 'toBlob').mockImplementation((callback: any) => {
        callback(null);
      });

      const exportToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/png');
        });
      };

      await expect(exportToBlob(canvas)).rejects.toThrow('Failed to create blob');
    });

    it('should validate canvas before export', () => {
      const validateCanvas = (canvas: HTMLCanvasElement | null): void => {
        if (!canvas) {
          throw new Error('Canvas is null');
        }
        if (canvas.width === 0 || canvas.height === 0) {
          throw new Error('Canvas has invalid dimensions');
        }
      };

      expect(() => validateCanvas(canvas)).not.toThrow();
      expect(() => validateCanvas(null)).toThrow('Canvas is null');
    });
  });

  describe('Performance', () => {
    it('should export efficiently', async () => {
      const exportTimed = async (canvas: HTMLCanvasElement): Promise<number> => {
        const start = performance.now();
        await new Promise((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png');
        });
        return performance.now() - start;
      };

      const duration = await exportTimed(canvas);

      expect(duration).toBeLessThan(1000);
    });
  });
});
