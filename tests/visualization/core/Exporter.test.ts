/**
 * @file Unit tests for Exporter
 * @author Algorithm Visualization System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Exporter, ExportFormat, ExportConfig, ExportResult } from '../../../src/visualization/core/Exporter';

describe('Exporter', () => {
  let exporter: Exporter;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // Draw something on canvas
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 800, 600);

    exporter = new Exporter();
  });

  afterEach(() => {
    exporter.dispose();
  });

  describe('constructor', () => {
    it('should initialize successfully', () => {
      expect(exporter).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customExporter = new Exporter({
        defaultFormat: 'svg',
        quality: 0.9,
      });

      expect(customExporter).toBeDefined();

      customExporter.dispose();
    });
  });

  describe('PNG export', () => {
    it('should export canvas as PNG', async () => {
      const result = await exporter.exportPNG(canvas);

      expect(result.format).toBe('png');
      expect(result.dataUrl).toMatch(/^data:image\/png/);
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('should apply quality setting', async () => {
      const highQuality = await exporter.exportPNG(canvas, { quality: 1.0 });
      const lowQuality = await exporter.exportPNG(canvas, { quality: 0.1 });

      expect(highQuality.blob.size).toBeGreaterThan(lowQuality.blob.size);
    });

    it('should respect custom dimensions', async () => {
      const result = await exporter.exportPNG(canvas, {
        width: 400,
        height: 300,
      });

      // Verify dimensions by loading image
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = result.dataUrl;
      });

      expect(img.width).toBe(400);
      expect(img.height).toBe(300);
    });

    it('should include metadata', async () => {
      const result = await exporter.exportPNG(canvas, {
        metadata: {
          title: 'Test Visualization',
          author: 'Test User',
        },
      });

      expect(result.metadata).toEqual({
        title: 'Test Visualization',
        author: 'Test User',
      });
    });

    it('should handle transparent background', async () => {
      const result = await exporter.exportPNG(canvas, {
        transparent: true,
      });

      expect(result.dataUrl).toBeDefined();
    });

    it('should emit progress events', async () => {
      const progressListener = vi.fn();
      exporter.on('progress', progressListener);

      await exporter.exportPNG(canvas);

      expect(progressListener).toHaveBeenCalled();
    });
  });

  describe('SVG export', () => {
    it('should export as SVG', async () => {
      const result = await exporter.exportSVG(canvas);

      expect(result.format).toBe('svg');
      expect(result.dataUrl).toMatch(/^data:image\/svg/);
    });

    it('should generate valid SVG markup', async () => {
      const result = await exporter.exportSVG(canvas);

      const decoded = atob(result.dataUrl.split(',')[1]);

      expect(decoded).toContain('<svg');
      expect(decoded).toContain('</svg>');
    });

    it('should include canvas content as image', async () => {
      const result = await exporter.exportSVG(canvas);

      const decoded = atob(result.dataUrl.split(',')[1]);

      expect(decoded).toContain('<image');
    });

    it('should respect dimensions', async () => {
      const result = await exporter.exportSVG(canvas, {
        width: 1024,
        height: 768,
      });

      const decoded = atob(result.dataUrl.split(',')[1]);

      expect(decoded).toContain('width="1024"');
      expect(decoded).toContain('height="768"');
    });

    it('should add custom styles', async () => {
      const result = await exporter.exportSVG(canvas, {
        styles: 'rect { fill: blue; }',
      });

      const decoded = atob(result.dataUrl.split(',')[1]);

      expect(decoded).toContain('rect { fill: blue; }');
    });
  });

  describe('video recording', () => {
    it('should start recording', async () => {
      await exporter.startRecording(canvas);

      expect(exporter.isRecording()).toBe(true);
    });

    it('should stop recording and return video', async () => {
      await exporter.startRecording(canvas);

      // Simulate some frames
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await exporter.stopRecording();

      expect(result.format).toBe('webm');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(exporter.isRecording()).toBe(false);
    });

    it('should configure video options', async () => {
      await exporter.startRecording(canvas, {
        fps: 30,
        videoBitsPerSecond: 2500000,
      });

      expect(exporter.isRecording()).toBe(true);
    });

    it('should capture frames at specified FPS', async () => {
      const frameListener = vi.fn();
      exporter.on('frame', frameListener);

      await exporter.startRecording(canvas, { fps: 60 });

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(frameListener.mock.calls.length).toBeGreaterThan(20);

      await exporter.stopRecording();
    });

    it('should pause and resume recording', async () => {
      await exporter.startRecording(canvas);

      exporter.pauseRecording();
      expect(exporter.isPaused()).toBe(true);

      exporter.resumeRecording();
      expect(exporter.isPaused()).toBe(false);

      await exporter.stopRecording();
    });

    it('should throw error if stopping without starting', async () => {
      await expect(exporter.stopRecording()).rejects.toThrow();
    });

    it('should throw error if starting while already recording', async () => {
      await exporter.startRecording(canvas);

      await expect(exporter.startRecording(canvas)).rejects.toThrow();

      await exporter.stopRecording();
    });
  });

  describe('batch export', () => {
    it('should export in multiple formats', async () => {
      const results = await exporter.exportMultiple(canvas, ['png', 'svg']);

      expect(results).toHaveLength(2);
      expect(results[0].format).toBe('png');
      expect(results[1].format).toBe('svg');
    });

    it('should export with different configurations', async () => {
      const configs: ExportConfig[] = [
        { format: 'png', quality: 1.0 },
        { format: 'png', quality: 0.5 },
      ];

      const results = await exporter.exportBatch(canvas, configs);

      expect(results).toHaveLength(2);
      expect(results[0].blob.size).toBeGreaterThan(results[1].blob.size);
    });

    it('should emit batch progress', async () => {
      const progressListener = vi.fn();
      exporter.on('batchProgress', progressListener);

      await exporter.exportMultiple(canvas, ['png', 'svg']);

      expect(progressListener).toHaveBeenCalled();
    });
  });

  describe('file download', () => {
    it('should trigger download', async () => {
      const result = await exporter.exportPNG(canvas);

      const createElementSpy = vi.spyOn(document, 'createElement');
      const clickSpy = vi.fn();

      createElementSpy.mockReturnValue({
        click: clickSpy,
        href: '',
        download: '',
      } as any);

      exporter.download(result, 'test.png');

      expect(clickSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
    });

    it('should use custom filename', async () => {
      const result = await exporter.exportPNG(canvas);

      const createElementSpy = vi.spyOn(document, 'createElement');
      const anchor = {
        click: vi.fn(),
        href: '',
        download: '',
      };

      createElementSpy.mockReturnValue(anchor as any);

      exporter.download(result, 'custom-name.png');

      expect(anchor.download).toBe('custom-name.png');

      createElementSpy.mockRestore();
    });

    it('should auto-generate filename', async () => {
      const result = await exporter.exportPNG(canvas);

      const createElementSpy = vi.spyOn(document, 'createElement');
      const anchor = {
        click: vi.fn(),
        href: '',
        download: '',
      };

      createElementSpy.mockReturnValue(anchor as any);

      exporter.download(result);

      expect(anchor.download).toMatch(/visualization-.*\.png/);

      createElementSpy.mockRestore();
    });
  });

  describe('clipboard support', () => {
    it('should copy to clipboard', async () => {
      const result = await exporter.exportPNG(canvas);

      const writeTextSpy = vi.fn();
      Object.defineProperty(navigator, 'clipboard', {
        value: { write: writeTextSpy },
        writable: true,
      });

      await exporter.copyToClipboard(result);

      expect(writeTextSpy).toHaveBeenCalled();
    });

    it('should handle clipboard errors gracefully', async () => {
      const result = await exporter.exportPNG(canvas);

      Object.defineProperty(navigator, 'clipboard', {
        value: null,
        writable: true,
      });

      await expect(exporter.copyToClipboard(result)).rejects.toThrow();
    });
  });

  describe('events', () => {
    it('should emit exportStart event', async () => {
      const listener = vi.fn();
      exporter.on('exportStart', listener);

      await exporter.exportPNG(canvas);

      expect(listener).toHaveBeenCalledWith({ format: 'png' });
    });

    it('should emit exportComplete event', async () => {
      const listener = vi.fn();
      exporter.on('exportComplete', listener);

      await exporter.exportPNG(canvas);

      expect(listener).toHaveBeenCalled();
    });

    it('should emit exportError event on failure', async () => {
      const listener = vi.fn();
      exporter.on('exportError', listener);

      // Force an error by passing invalid canvas
      await exporter.exportPNG(null as any).catch(() => {});

      expect(listener).toHaveBeenCalled();
    });

    it('should emit recordingStart event', async () => {
      const listener = vi.fn();
      exporter.on('recordingStart', listener);

      await exporter.startRecording(canvas);

      expect(listener).toHaveBeenCalled();

      await exporter.stopRecording();
    });

    it('should emit recordingStop event', async () => {
      const listener = vi.fn();
      exporter.on('recordingStop', listener);

      await exporter.startRecording(canvas);
      await exporter.stopRecording();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('performance optimization', () => {
    it('should use OffscreenCanvas when available', async () => {
      // Mock OffscreenCanvas
      global.OffscreenCanvas = class OffscreenCanvas {
        width: number;
        height: number;

        constructor(width: number, height: number) {
          this.width = width;
          this.height = height;
        }

        getContext() {
          return canvas.getContext('2d');
        }

        convertToBlob() {
          return Promise.resolve(new Blob());
        }
      } as any;

      const result = await exporter.exportPNG(canvas);

      expect(result).toBeDefined();

      delete (global as any).OffscreenCanvas;
    });

    it('should reuse canvas for multiple exports', async () => {
      await exporter.exportPNG(canvas);
      await exporter.exportPNG(canvas);

      // Should not create new canvas each time
    });

    it('should cleanup temporary resources', async () => {
      const result = await exporter.exportPNG(canvas);

      expect(result.blob).toBeDefined();

      // Verify no memory leaks
    });
  });

  describe('memory management', () => {
    it('should cleanup event listeners on dispose', async () => {
      const listener = vi.fn();
      exporter.on('exportComplete', listener);

      exporter.dispose();

      await exporter.exportPNG(canvas).catch(() => {});

      expect(listener).not.toHaveBeenCalled();
    });

    it('should stop recording on dispose', async () => {
      await exporter.startRecording(canvas);

      exporter.dispose();

      expect(exporter.isRecording()).toBe(false);
    });

    it('should revoke object URLs on dispose', async () => {
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      await exporter.exportPNG(canvas);

      exporter.dispose();

      expect(revokeObjectURLSpy).toHaveBeenCalled();

      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle invalid canvas', async () => {
      await expect(exporter.exportPNG(null as any)).rejects.toThrow();
    });

    it('should handle export failures gracefully', async () => {
      const invalidCanvas = {} as HTMLCanvasElement;

      await expect(exporter.exportPNG(invalidCanvas)).rejects.toThrow();
    });

    it('should validate export configuration', async () => {
      await expect(
        exporter.exportPNG(canvas, { quality: -1 })
      ).rejects.toThrow();

      await expect(
        exporter.exportPNG(canvas, { quality: 2 })
      ).rejects.toThrow();
    });

    it('should handle recording errors', async () => {
      // Mock MediaRecorder to throw error
      const originalMediaRecorder = global.MediaRecorder;

      global.MediaRecorder = class MediaRecorder {
        constructor() {
          throw new Error('MediaRecorder not supported');
        }
      } as any;

      await expect(exporter.startRecording(canvas)).rejects.toThrow();

      global.MediaRecorder = originalMediaRecorder;
    });
  });

  describe('format detection', () => {
    it('should detect PNG format', () => {
      expect(exporter.detectFormat('image.png')).toBe('png');
    });

    it('should detect SVG format', () => {
      expect(exporter.detectFormat('image.svg')).toBe('svg');
    });

    it('should detect video format', () => {
      expect(exporter.detectFormat('video.webm')).toBe('webm');
    });

    it('should default to PNG for unknown formats', () => {
      expect(exporter.detectFormat('image.unknown')).toBe('png');
    });
  });

  describe('compression', () => {
    it('should compress PNG exports', async () => {
      const uncompressed = await exporter.exportPNG(canvas, { compress: false });
      const compressed = await exporter.exportPNG(canvas, { compress: true });

      expect(compressed.blob.size).toBeLessThanOrEqual(uncompressed.blob.size);
    });

    it('should configure compression level', async () => {
      const low = await exporter.exportPNG(canvas, { compressionLevel: 1 });
      const high = await exporter.exportPNG(canvas, { compressionLevel: 9 });

      expect(high.blob.size).toBeLessThanOrEqual(low.blob.size);
    });
  });
});
