/**
 * @file Export visualization to various formats
 * @module visualization/core
 */

export type ExportFormat = 'png' | 'svg' | 'webm' | 'gif';

export interface ExportConfig {
  format?: ExportFormat;
  quality?: number;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
  transparent?: boolean;
  compress?: boolean;
  compressionLevel?: number;
  styles?: string;
}

export interface VideoConfig {
  fps?: number;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  mimeType?: string;
}

export interface ExportResult {
  format: ExportFormat;
  dataUrl: string;
  blob: Blob;
  metadata?: Record<string, any>;
  size: number;
}

export type ExportEvent =
  | 'exportStart'
  | 'exportComplete'
  | 'exportError'
  | 'progress'
  | 'recordingStart'
  | 'recordingStop'
  | 'frame'
  | 'batchProgress';

type EventListener<T = any> = (data?: T) => void;

export class Exporter {
  private defaultConfig: ExportConfig;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recording = false;
  private recordingPaused = false;
  private eventListeners: Map<ExportEvent, Set<EventListener>> = new Map();
  private objectUrls: Set<string> = new Set();

  constructor(config: ExportConfig = {}) {
    this.defaultConfig = {
      format: 'png',
      quality: 0.95,
      ...config,
    };
  }

  public async exportPNG(canvas: HTMLCanvasElement, config: ExportConfig = {}): Promise<ExportResult> {
    this.validateCanvas(canvas);
    const mergedConfig = { ...this.defaultConfig, ...config };
    this.emit('exportStart', { format: 'png' });

    try {
      const quality = this.clamp(mergedConfig.quality ?? 0.95, 0, 1);
      const exportCanvas = this.createExportCanvas(canvas, mergedConfig.width, mergedConfig.height);
      const blob = await this.canvasToBlob(exportCanvas, 'image/png', quality);
      const dataUrl = await this.blobToDataUrl(blob);

      const result: ExportResult = {
        format: 'png',
        dataUrl,
        blob,
        metadata: mergedConfig.metadata,
        size: blob.size,
      };

      this.emit('exportComplete', result);
      return result;
    } catch (error) {
      this.emit('exportError', { error });
      throw error;
    }
  }

  public async exportSVG(canvas: HTMLCanvasElement, config: ExportConfig = {}): Promise<ExportResult> {
    this.validateCanvas(canvas);
    const mergedConfig = { ...this.defaultConfig, ...config };
    this.emit('exportStart', { format: 'svg' });

    try {
      const width = mergedConfig.width ?? canvas.width;
      const height = mergedConfig.height ?? canvas.height;
      const imageData = canvas.toDataURL('image/png');

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${mergedConfig.styles ? `<style>${mergedConfig.styles}</style>` : ''}
  <image width="${width}" height="${height}" xlink:href="${imageData}"/>
</svg>`;

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

      const result: ExportResult = {
        format: 'svg',
        dataUrl,
        blob,
        metadata: mergedConfig.metadata,
        size: blob.size,
      };

      this.emit('exportComplete', result);
      return result;
    } catch (error) {
      this.emit('exportError', { error });
      throw error;
    }
  }

  public async startRecording(canvas: HTMLCanvasElement, config: VideoConfig = {}): Promise<void> {
    if (this.recording) {
      throw new Error('Already recording');
    }

    this.validateCanvas(canvas);
    const fps = config.fps ?? 60;
    const mimeType = config.mimeType ?? 'video/webm';
    const stream = canvas.captureStream(fps);

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: config.videoBitsPerSecond,
      audioBitsPerSecond: config.audioBitsPerSecond,
    });

    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
        this.emit('frame', { size: event.data.size });
      }
    };

    this.mediaRecorder.start(1000 / fps);
    this.recording = true;
    this.emit('recordingStart');
  }

  public async stopRecording(): Promise<ExportResult> {
    if (!this.recording || !this.mediaRecorder) {
      throw new Error('Not currently recording');
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const dataUrl = URL.createObjectURL(blob);

        this.objectUrls.add(dataUrl);

        const result: ExportResult = {
          format: 'webm',
          dataUrl,
          blob,
          size: blob.size,
        };

        this.recording = false;
        this.recordingPaused = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];

        this.emit('recordingStop', result);
        resolve(result);
      };

      this.mediaRecorder!.onerror = (error) => {
        this.emit('exportError', { error });
        reject(error);
      };

      this.mediaRecorder!.stop();
    });
  }

  public pauseRecording(): void {
    if (!this.recording || !this.mediaRecorder) {
      throw new Error('Not currently recording');
    }

    this.mediaRecorder.pause();
    this.recordingPaused = true;
  }

  public resumeRecording(): void {
    if (!this.recording || !this.mediaRecorder) {
      throw new Error('Not currently recording');
    }

    this.mediaRecorder.resume();
    this.recordingPaused = false;
  }

  public isRecording(): boolean {
    return this.recording;
  }

  public isPaused(): boolean {
    return this.recordingPaused;
  }

  public async exportMultiple(canvas: HTMLCanvasElement, formats: ExportFormat[]): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    for (let i = 0; i < formats.length; i++) {
      const format = formats[i];
      this.emit('batchProgress', { current: i, total: formats.length, format });

      let result: ExportResult;

      switch (format) {
        case 'png':
          result = await this.exportPNG(canvas);
          break;
        case 'svg':
          result = await this.exportSVG(canvas);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      results.push(result);
    }

    return results;
  }

  public async exportBatch(canvas: HTMLCanvasElement, configs: ExportConfig[]): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      this.emit('batchProgress', { current: i, total: configs.length, format: config.format });

      const format = config.format ?? 'png';
      let result: ExportResult;

      switch (format) {
        case 'png':
          result = await this.exportPNG(canvas, config);
          break;
        case 'svg':
          result = await this.exportSVG(canvas, config);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      results.push(result);
    }

    return results;
  }

  public download(result: ExportResult, filename?: string): void {
    const name = filename ?? `visualization-${Date.now()}.${result.format}`;

    const link = document.createElement('a');
    link.download = name;
    link.href = result.dataUrl;
    link.click();
  }

  public async copyToClipboard(result: ExportResult): Promise<void> {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not available');
    }

    const item = new ClipboardItem({
      [result.blob.type]: result.blob,
    });

    await navigator.clipboard.write([item]);
  }

  public detectFormat(filename: string): ExportFormat {
    const ext = filename.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'png':
        return 'png';
      case 'svg':
        return 'svg';
      case 'webm':
        return 'webm';
      case 'gif':
        return 'gif';
      default:
        return 'png';
    }
  }

  private createExportCanvas(
    source: HTMLCanvasElement,
    width?: number,
    height?: number
  ): HTMLCanvasElement {
    if (!width && !height) {
      return source;
    }

    const targetWidth = width ?? source.width;
    const targetHeight = height ?? source.height;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

    return canvas;
  }

  private async canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        type,
        quality
      );
    });
  }

  private async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private validateCanvas(canvas: HTMLCanvasElement): void {
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Invalid canvas element');
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  public on<T = any>(event: ExportEvent, listener: EventListener<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(listener);

    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  private emit<T = any>(event: ExportEvent, data?: T): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;

    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  public dispose(): void {
    if (this.recording && this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.recording = false;
    }

    this.objectUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.objectUrls.clear();

    this.eventListeners.clear();
  }
}
