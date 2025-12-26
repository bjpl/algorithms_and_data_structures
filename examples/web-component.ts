/**
 * Web Components Integration Example
 *
 * Demonstrates how to create Custom Elements (Web Components) for the visualization system:
 * - Autonomous custom elements
 * - Shadow DOM encapsulation
 * - Attribute-based configuration
 * - Event dispatching
 * - Lifecycle callbacks
 *
 * @example
 * ```html
 * <graph-visualizer
 *   algorithm="dijkstra"
 *   start-node="A"
 *   end-node="E">
 * </graph-visualizer>
 *
 * <sorting-visualizer
 *   algorithm="quicksort"
 *   data="64,34,25,12,22,11,90">
 * </sorting-visualizer>
 *
 * <script type="module">
 *   import './examples/web-component.js';
 * </script>
 * ```
 */

import { GraphVisualizer } from '../src/visualization/algorithms/GraphVisualizer';
import { SortingVisualizer } from '../src/visualization/algorithms/SortingVisualizer';
import type {
  Node,
  Edge,
  GraphAlgorithm,
  SortingAlgorithm,
  ExecutionStep,
} from '../src/visualization/core/interfaces';

/**
 * Graph Visualizer Web Component
 *
 * Usage:
 * ```html
 * <graph-visualizer
 *   algorithm="dijkstra"
 *   start-node="A"
 *   end-node="E"
 *   width="800"
 *   height="600">
 * </graph-visualizer>
 * ```
 */
class GraphVisualizerElement extends HTMLElement {
  private visualizer: GraphVisualizer | null = null;
  private shadow: ShadowRoot;
  private container: HTMLDivElement;

  static get observedAttributes() {
    return ['algorithm', 'start-node', 'end-node', 'width', 'height'];
  }

  constructor() {
    super();

    // Create shadow DOM
    this.shadow = this.attachShadow({ mode: 'open' });

    // Create container
    this.container = document.createElement('div');
    this.container.style.cssText = `
      width: 100%;
      height: 100%;
      min-height: 400px;
    `;

    // Create styles
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        position: relative;
      }

      .controls {
        margin-bottom: 15px;
        display: flex;
        gap: 10px;
      }

      button {
        padding: 8px 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        transition: background 0.2s;
      }

      button:hover:not(:disabled) {
        background: #f0f0f0;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .info {
        margin-top: 15px;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 4px;
        font-size: 14px;
      }
    `;

    // Build UI
    const controls = this.createControls();
    const info = document.createElement('div');
    info.className = 'info';
    info.textContent = 'Ready to visualize';

    this.shadow.appendChild(style);
    this.shadow.appendChild(controls);
    this.shadow.appendChild(this.container);
    this.shadow.appendChild(info);
  }

  connectedCallback() {
    this.initialize();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue && this.visualizer) {
      // Reinitialize when attributes change
      this.initialize();
    }
  }

  private async initialize() {
    this.cleanup();

    const algorithm = (this.getAttribute('algorithm') || 'dijkstra') as GraphAlgorithm;
    const startNode = this.getAttribute('start-node') || 'A';
    const endNode = this.getAttribute('end-node') || 'E';
    const width = parseInt(this.getAttribute('width') || '800');
    const height = parseInt(this.getAttribute('height') || '600');

    // Get or generate graph data
    const { nodes, edges } = this.getGraphData();

    this.visualizer = new GraphVisualizer({
      id: `graph-viz-${Date.now()}`,
      renderMode: '2d',
      width,
      height,
      algorithm,
      nodes,
      edges,
      startNode,
      endNode,
    });

    await this.visualizer.initialize(this.container);

    // Setup event listeners
    this.visualizer.onStep((step) => {
      this.updateInfo(step);
      this.dispatchCustomEvent('step', { step });
    });

    this.dispatchCustomEvent('initialized', { visualizer: this.visualizer });
  }

  private cleanup() {
    if (this.visualizer) {
      this.visualizer.destroy();
      this.visualizer = null;
    }
  }

  private createControls(): HTMLElement {
    const controls = document.createElement('div');
    controls.className = 'controls';

    const playBtn = document.createElement('button');
    playBtn.textContent = '▶ Play';
    playBtn.onclick = () => this.play();

    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = '⏸ Pause';
    pauseBtn.onclick = () => this.pause();

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '⏹ Reset';
    resetBtn.onclick = () => this.reset();

    controls.appendChild(playBtn);
    controls.appendChild(pauseBtn);
    controls.appendChild(resetBtn);

    return controls;
  }

  private updateInfo(step: ExecutionStep) {
    const info = this.shadow.querySelector('.info');
    if (info) {
      info.textContent = `Step ${step.index}: ${step.description}`;
    }
  }

  private dispatchCustomEvent(name: string, detail: any) {
    this.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
    }));
  }

  private getGraphData(): { nodes: Node[]; edges: Edge[] } {
    // Check for data in slot or generate default
    const dataScript = this.querySelector('script[type="application/json"]');

    if (dataScript) {
      try {
        return JSON.parse(dataScript.textContent || '{}');
      } catch (e) {
        console.warn('Failed to parse graph data, using default');
      }
    }

    // Default graph
    return {
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
    };
  }

  // Public API
  public async play() {
    if (this.visualizer) {
      await this.visualizer.executeAlgorithm();
      this.dispatchCustomEvent('complete', {});
    }
  }

  public pause() {
    this.visualizer?.pause();
  }

  public reset() {
    this.visualizer?.reset();
    this.updateInfo({
      index: 0,
      description: 'Reset to initial state',
      status: 'running',
      affectedNodes: [],
      affectedEdges: [],
    });
  }
}

/**
 * Sorting Visualizer Web Component
 *
 * Usage:
 * ```html
 * <sorting-visualizer
 *   algorithm="quicksort"
 *   data="64,34,25,12,22,11,90">
 * </sorting-visualizer>
 * ```
 */
class SortingVisualizerElement extends HTMLElement {
  private visualizer: SortingVisualizer | null = null;
  private shadow: ShadowRoot;
  private container: HTMLDivElement;

  static get observedAttributes() {
    return ['algorithm', 'data', 'width', 'height'];
  }

  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: 'open' });

    this.container = document.createElement('div');
    this.container.style.cssText = `
      width: 100%;
      height: 100%;
      min-height: 300px;
    `;

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
      }

      .controls {
        margin-bottom: 15px;
        display: flex;
        gap: 10px;
      }

      button {
        padding: 8px 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
        cursor: pointer;
      }

      button:hover {
        background: #f0f0f0;
      }

      .stats {
        margin-top: 15px;
        display: flex;
        gap: 20px;
        font-size: 14px;
      }
    `;

    const controls = this.createControls();
    const stats = document.createElement('div');
    stats.className = 'stats';

    this.shadow.appendChild(style);
    this.shadow.appendChild(controls);
    this.shadow.appendChild(this.container);
    this.shadow.appendChild(stats);
  }

  connectedCallback() {
    this.initialize();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  attributeChangedCallback() {
    if (this.visualizer) {
      this.initialize();
    }
  }

  private async initialize() {
    this.cleanup();

    const algorithm = (this.getAttribute('algorithm') || 'quicksort') as SortingAlgorithm;
    const dataStr = this.getAttribute('data') || '64,34,25,12,22,11,90';
    const data = dataStr.split(',').map(Number);
    const width = parseInt(this.getAttribute('width') || '800');
    const height = parseInt(this.getAttribute('height') || '400');

    this.visualizer = new SortingVisualizer({
      id: `sort-viz-${Date.now()}`,
      renderMode: '2d',
      width,
      height,
      algorithm,
      data,
    });

    await this.visualizer.initialize(this.container);

    this.visualizer.onStep((step) => {
      this.updateStats(step);
    });

    this.dispatchEvent(new CustomEvent('initialized', {
      detail: { visualizer: this.visualizer },
    }));
  }

  private cleanup() {
    if (this.visualizer) {
      this.visualizer.destroy();
      this.visualizer = null;
    }
  }

  private createControls(): HTMLElement {
    const controls = document.createElement('div');
    controls.className = 'controls';

    const sortBtn = document.createElement('button');
    sortBtn.textContent = '▶ Sort';
    sortBtn.onclick = () => this.sort();

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '⏹ Reset';
    resetBtn.onclick = () => this.reset();

    controls.appendChild(sortBtn);
    controls.appendChild(resetBtn);

    return controls;
  }

  private updateStats(step: ExecutionStep) {
    const stats = this.shadow.querySelector('.stats');
    if (stats && step.data) {
      stats.innerHTML = `
        <div><strong>Comparisons:</strong> ${step.data.comparisons || 0}</div>
        <div><strong>Swaps:</strong> ${step.data.swaps || 0}</div>
      `;
    }
  }

  public async sort() {
    if (this.visualizer) {
      await this.visualizer.executeAlgorithm();
      this.dispatchEvent(new CustomEvent('complete'));
    }
  }

  public reset() {
    this.visualizer?.reset();
  }
}

// Register custom elements
customElements.define('graph-visualizer', GraphVisualizerElement);
customElements.define('sorting-visualizer', SortingVisualizerElement);

// Export for module usage
export { GraphVisualizerElement, SortingVisualizerElement };
