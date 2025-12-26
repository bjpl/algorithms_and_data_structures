/**
 * Export and Recording Demo
 *
 * Demonstrates various export capabilities:
 * - PNG screenshot export
 * - Video recording (WebM/MP4)
 * - GIF animation export
 * - Comparison exports (before/after)
 * - 3D model export (OBJ, GLTF, STL)
 *
 * @example
 * ```typescript
 * const demo = new ExportDemo(document.getElementById('app')!);
 * await demo.initialize();
 *
 * // Export PNG
 * const pngBlob = await demo.exportPNG();
 *
 * // Record video
 * demo.startRecording();
 * await demo.runAnimation();
 * const videoBlob = await demo.stopRecording();
 * ```
 */

import { GraphVisualizer } from '../src/visualization/algorithms/GraphVisualizer';
import { Graph3DVisualizer } from '../src/visualization/3d/Graph3DVisualizer';
import type { ExportFormat, ExportOptions } from '../src/visualization/core/interfaces';

export class ExportDemo {
  private container: HTMLElement;
  private visualizer2D: GraphVisualizer | null = null;
  private visualizer3D: Graph3DVisualizer | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async initialize(): Promise<void> {
    console.log('Initializing Export Demo...');

    // Create 2D visualizer
    this.visualizer2D = new GraphVisualizer({
      id: 'export-2d',
      renderMode: '2d',
      width: 800,
      height: 600,
      algorithm: 'dijkstra',
      nodes: [
        { id: 'A', label: 'A', x: 100, y: 100 },
        { id: 'B', label: 'B', x: 300, y: 100 },
        { id: 'C', label: 'C', x: 500, y: 100 },
        { id: 'D', label: 'D', x: 200, y: 300 },
        { id: 'E', label: 'E', x: 400, y: 300 },
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', weight: 4 },
        { id: 'e2', source: 'B', target: 'C', weight: 2 },
        { id: 'e3', source: 'A', target: 'D', weight: 3 },
        { id: 'e4', source: 'D', target: 'E', weight: 1 },
        { id: 'e5', source: 'E', target: 'C', weight: 2 },
      ],
      startNode: 'A',
      endNode: 'C',
    });

    // Create 3D visualizer
    this.visualizer3D = new Graph3DVisualizer({
      id: 'export-3d',
      renderMode: '3d',
      width: 800,
      height: 600,
      nodes: Array.from({ length: 15 }, (_, i) => ({
        id: `node-${i}`,
        position: {
          x: (Math.random() - 0.5) * 150,
          y: (Math.random() - 0.5) * 150,
          z: (Math.random() - 0.5) * 150,
        },
        style: {
          color: `hsl(${i * 24}, 70%, 60%)`,
          size: 4,
        },
      })),
      edges: [],
      layout: '3d-force',
    });

    const container2D = document.createElement('div');
    container2D.id = 'export-2d-container';
    this.container.appendChild(container2D);

    await this.visualizer2D.initialize(container2D);

    console.log('✓ Export demo initialized');
  }

  /**
   * Export current visualization as PNG
   */
  async exportPNG(options: ExportOptions = {}): Promise<Blob> {
    console.log('Exporting PNG...');

    const canvas = this.visualizer2D!.getCanvas();
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', options.quality || 0.95);
    });

    this.downloadBlob(blob, 'visualization.png');
    console.log('✓ PNG exported successfully');

    return blob;
  }

  /**
   * Start recording video of the visualization
   */
  async startRecording(options: { mimeType?: string; videoBitsPerSecond?: number } = {}): Promise<void> {
    console.log('Starting video recording...');

    const canvas = this.visualizer2D!.getCanvas();
    const stream = canvas.captureStream(30); // 30 FPS

    const mimeType = options.mimeType || 'video/webm;codecs=vp9';

    if (!MediaRecorder.isTypeSupported(mimeType)) {
      console.warn(`${mimeType} not supported, falling back to webm`);
    }

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
      videoBitsPerSecond: options.videoBitsPerSecond || 2500000,
    });

    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
    console.log('✓ Recording started');
  }

  /**
   * Stop recording and return video blob
   */
  async stopRecording(): Promise<Blob> {
    console.log('Stopping recording...');

    if (!this.mediaRecorder) {
      throw new Error('No recording in progress');
    }

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder!.mimeType,
        });

        this.downloadBlob(blob, 'visualization-recording.webm');
        console.log('✓ Recording stopped and saved');

        resolve(blob);
      };

      this.mediaRecorder!.stop();
    });
  }

  /**
   * Export as animated GIF
   */
  async exportGIF(duration: number = 5000): Promise<Blob> {
    console.log(`Exporting GIF (${duration}ms duration)...`);

    // Record frames
    const frames: ImageData[] = [];
    const fps = 10;
    const frameCount = Math.floor(duration / 1000 * fps);
    const frameDelay = 1000 / fps;

    for (let i = 0; i < frameCount; i++) {
      const canvas = this.visualizer2D!.getCanvas();
      const ctx = canvas.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      frames.push(imageData);

      await this.sleep(frameDelay);
    }

    // In a real implementation, you would use a library like gif.js
    // For this demo, we'll just show the concept
    console.log(`✓ Captured ${frames.length} frames`);
    console.log('  Note: GIF encoding requires gif.js library');

    // Mock blob for demonstration
    const mockBlob = new Blob(['GIF89a'], { type: 'image/gif' });
    return mockBlob;
  }

  /**
   * Export comparison (before/after side-by-side)
   */
  async exportComparison(): Promise<Blob> {
    console.log('Exporting before/after comparison...');

    const canvas = this.visualizer2D!.getCanvas();
    const width = canvas.width;
    const height = canvas.height;

    // Create comparison canvas (2x width)
    const comparisonCanvas = document.createElement('canvas');
    comparisonCanvas.width = width * 2;
    comparisonCanvas.height = height;
    const ctx = comparisonCanvas.getContext('2d')!;

    // Draw "before" state (initial)
    await this.visualizer2D!.reset();
    ctx.drawImage(canvas, 0, 0);

    // Draw "after" state (completed algorithm)
    await this.visualizer2D!.executeAlgorithm();
    ctx.drawImage(canvas, width, 0);

    // Add labels
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Before', 20, 40);
    ctx.fillText('After', width + 20, 40);

    const blob = await new Promise<Blob>((resolve) => {
      comparisonCanvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', 0.95);
    });

    this.downloadBlob(blob, 'comparison.png');
    console.log('✓ Comparison exported successfully');

    return blob;
  }

  /**
   * Export 3D model (OBJ format)
   */
  async export3DModel(format: '3d-obj' | '3d-gltf' | '3d-stl' = '3d-obj'): Promise<Blob> {
    console.log(`Exporting 3D model as ${format.toUpperCase()}...`);

    // In a real implementation, you would extract geometry from Three.js scene
    // and convert to the desired format using libraries like:
    // - OBJExporter for OBJ
    // - GLTFExporter for GLTF
    // - STLExporter for STL

    const mockData = `# ${format.toUpperCase()} Export\n# Generated from 3D Graph Visualization\n`;
    const blob = new Blob([mockData], {
      type: format === '3d-gltf' ? 'model/gltf+json' : 'text/plain'
    });

    const extension = format.replace('3d-', '');
    this.downloadBlob(blob, `graph-3d.${extension}`);

    console.log('✓ 3D model exported successfully');
    console.log(`  Note: Full ${format.toUpperCase()} export requires appropriate exporter library`);

    return blob;
  }

  /**
   * Run animation sequence for recording
   */
  async runAnimation(): Promise<void> {
    console.log('Running animation sequence...');

    await this.visualizer2D!.executeAlgorithm();

    console.log('✓ Animation complete');
  }

  /**
   * Demonstrate full export workflow
   */
  async runFullExportDemo(): Promise<void> {
    console.log('\n=== Full Export Demo ===\n');

    // 1. Export PNG screenshot
    await this.exportPNG();
    await this.sleep(1000);

    // 2. Record video
    await this.startRecording();
    await this.runAnimation();
    await this.stopRecording();
    await this.sleep(1000);

    // 3. Export comparison
    await this.exportComparison();
    await this.sleep(1000);

    // 4. Export GIF
    await this.visualizer2D!.reset();
    await this.exportGIF(3000);
    await this.sleep(1000);

    console.log('\n✓ All export demos complete!');
    console.log('  Check your downloads folder for exported files');
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy(): void {
    this.visualizer2D?.destroy();
    this.visualizer3D?.destroy();
    this.container.innerHTML = '';
  }
}

export async function runDemo(containerId: string = 'app'): Promise<void> {
  const container = document.getElementById(containerId)!;
  const demo = new ExportDemo(container);

  await demo.initialize();
  await demo.runFullExportDemo();
}
