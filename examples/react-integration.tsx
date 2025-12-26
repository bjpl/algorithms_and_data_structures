/**
 * React Integration Example
 *
 * Demonstrates how to integrate the visualization system with React:
 * - Custom React hooks for visualization
 * - Component lifecycle management
 * - Props-driven configuration
 * - Event handling and callbacks
 * - State synchronization
 *
 * @example
 * ```tsx
 * import { GraphVisualizerComponent } from './examples/react-integration';
 *
 * function App() {
 *   return (
 *     <GraphVisualizerComponent
 *       algorithm="dijkstra"
 *       nodes={nodes}
 *       edges={edges}
 *       onPathFound={(path) => console.log('Path:', path)}
 *     />
 *   );
 * }
 * ```
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GraphVisualizer } from '../src/visualization/algorithms/GraphVisualizer';
import { SortingVisualizer } from '../src/visualization/algorithms/SortingVisualizer';
import type {
  Node,
  Edge,
  GraphAlgorithm,
  SortingAlgorithm,
  ExecutionStep,
} from '../src/visualization/core/interfaces';

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Hook for managing GraphVisualizer lifecycle
 */
function useGraphVisualizer(
  config: {
    algorithm: GraphAlgorithm;
    nodes: Node[];
    edges: Edge[];
    startNode?: string;
    endNode?: string;
    width?: number;
    height?: number;
  }
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<GraphVisualizer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentStep, setCurrentStep] = useState<ExecutionStep | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize visualizer
  useEffect(() => {
    if (!containerRef.current) return;

    const visualizer = new GraphVisualizer({
      id: `graph-viz-${Date.now()}`,
      renderMode: '2d',
      width: config.width || 800,
      height: config.height || 600,
      algorithm: config.algorithm,
      nodes: config.nodes,
      edges: config.edges,
      startNode: config.startNode,
      endNode: config.endNode,
    });

    visualizer.initialize(containerRef.current).then(() => {
      visualizerRef.current = visualizer;
      setIsInitialized(true);

      // Setup step listener
      visualizer.onStep((step) => {
        setCurrentStep(step);
      });
    });

    // Cleanup on unmount
    return () => {
      visualizer.destroy();
      visualizerRef.current = null;
      setIsInitialized(false);
    };
  }, [config.algorithm, config.nodes, config.edges, config.startNode, config.endNode]);

  const play = useCallback(async () => {
    if (!visualizerRef.current) return;
    setIsPlaying(true);
    await visualizerRef.current.executeAlgorithm();
    setIsPlaying(false);
  }, []);

  const pause = useCallback(() => {
    visualizerRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    visualizerRef.current?.reset();
    setCurrentStep(null);
    setIsPlaying(false);
  }, []);

  const stepForward = useCallback(async () => {
    if (!visualizerRef.current) return;
    await visualizerRef.current.executeNextStep();
  }, []);

  const stepBackward = useCallback(async () => {
    if (!visualizerRef.current) return;
    await visualizerRef.current.executePreviousStep();
  }, []);

  return {
    containerRef,
    visualizer: visualizerRef.current,
    isInitialized,
    currentStep,
    isPlaying,
    play,
    pause,
    reset,
    stepForward,
    stepBackward,
  };
}

/**
 * Hook for managing SortingVisualizer lifecycle
 */
function useSortingVisualizer(
  config: {
    algorithm: SortingAlgorithm;
    data: number[];
    width?: number;
    height?: number;
  }
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<SortingVisualizer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState({ comparisons: 0, swaps: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const visualizer = new SortingVisualizer({
      id: `sort-viz-${Date.now()}`,
      renderMode: '2d',
      width: config.width || 800,
      height: config.height || 400,
      algorithm: config.algorithm,
      data: config.data,
    });

    visualizer.initialize(containerRef.current).then(() => {
      visualizerRef.current = visualizer;
      setIsInitialized(true);

      // Setup statistics listener
      visualizer.onStep((step) => {
        if (step.data?.comparisons !== undefined) {
          setStats({
            comparisons: step.data.comparisons,
            swaps: step.data.swaps || 0,
          });
        }
      });
    });

    return () => {
      visualizer.destroy();
      visualizerRef.current = null;
      setIsInitialized(false);
    };
  }, [config.algorithm, config.data]);

  const play = useCallback(async () => {
    if (!visualizerRef.current) return;
    setIsPlaying(true);
    await visualizerRef.current.executeAlgorithm();
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    visualizerRef.current?.reset();
    setStats({ comparisons: 0, swaps: 0 });
    setIsPlaying(false);
  }, []);

  return {
    containerRef,
    visualizer: visualizerRef.current,
    isInitialized,
    stats,
    isPlaying,
    play,
    reset,
  };
}

// ============================================================================
// React Components
// ============================================================================

interface GraphVisualizerComponentProps {
  algorithm: GraphAlgorithm;
  nodes: Node[];
  edges: Edge[];
  startNode?: string;
  endNode?: string;
  width?: number;
  height?: number;
  onPathFound?: (path: string[]) => void;
  onStepChange?: (step: ExecutionStep) => void;
}

/**
 * Graph Visualizer React Component
 */
export function GraphVisualizerComponent(props: GraphVisualizerComponentProps) {
  const {
    containerRef,
    isInitialized,
    currentStep,
    isPlaying,
    play,
    pause,
    reset,
    stepForward,
    stepBackward,
  } = useGraphVisualizer({
    algorithm: props.algorithm,
    nodes: props.nodes,
    edges: props.edges,
    startNode: props.startNode,
    endNode: props.endNode,
    width: props.width,
    height: props.height,
  });

  // Notify parent of step changes
  useEffect(() => {
    if (currentStep && props.onStepChange) {
      props.onStepChange(currentStep);
    }

    // Check if path was found
    if (currentStep?.status === 'completed' && currentStep.data?.path) {
      props.onPathFound?.(currentStep.data.path);
    }
  }, [currentStep, props]);

  return (
    <div className="graph-visualizer-component" style={{ padding: '20px' }}>
      <div className="controls" style={{ marginBottom: '15px' }}>
        <button onClick={play} disabled={isPlaying || !isInitialized}>
          ▶ Play
        </button>
        <button onClick={pause} disabled={!isPlaying}>
          ⏸ Pause
        </button>
        <button onClick={reset} disabled={!isInitialized}>
          ⏹ Reset
        </button>
        <button onClick={stepForward} disabled={isPlaying || !isInitialized}>
          ⏭ Step Forward
        </button>
        <button onClick={stepBackward} disabled={isPlaying || !isInitialized}>
          ⏮ Step Backward
        </button>
      </div>

      <div
        ref={containerRef}
        style={{
          border: '2px solid #ddd',
          borderRadius: '8px',
          background: 'white',
        }}
      />

      {currentStep && (
        <div className="step-info" style={{ marginTop: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
          <strong>Step {currentStep.index}:</strong> {currentStep.description}
        </div>
      )}
    </div>
  );
}

interface SortingVisualizerComponentProps {
  algorithm: SortingAlgorithm;
  data: number[];
  width?: number;
  height?: number;
  onSortComplete?: () => void;
}

/**
 * Sorting Visualizer React Component
 */
export function SortingVisualizerComponent(props: SortingVisualizerComponentProps) {
  const {
    containerRef,
    isInitialized,
    stats,
    isPlaying,
    play,
    reset,
  } = useSortingVisualizer({
    algorithm: props.algorithm,
    data: props.data,
    width: props.width,
    height: props.height,
  });

  return (
    <div className="sorting-visualizer-component" style={{ padding: '20px' }}>
      <div className="controls" style={{ marginBottom: '15px' }}>
        <button onClick={play} disabled={isPlaying || !isInitialized}>
          ▶ Sort
        </button>
        <button onClick={reset} disabled={!isInitialized}>
          ⏹ Reset
        </button>
      </div>

      <div className="stats" style={{ marginBottom: '15px', display: 'flex', gap: '20px' }}>
        <div>
          <strong>Comparisons:</strong> {stats.comparisons}
        </div>
        <div>
          <strong>Swaps:</strong> {stats.swaps}
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          border: '2px solid #ddd',
          borderRadius: '8px',
          background: 'white',
        }}
      />
    </div>
  );
}

// ============================================================================
// Example App
// ============================================================================

/**
 * Example application using the React components
 */
export function ExampleApp() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<GraphAlgorithm>('dijkstra');
  const [pathFound, setPathFound] = useState<string[] | null>(null);

  const nodes: Node[] = [
    { id: 'A', label: 'A', x: 100, y: 100 },
    { id: 'B', label: 'B', x: 300, y: 100 },
    { id: 'C', label: 'C', x: 500, y: 100 },
    { id: 'D', label: 'D', x: 200, y: 300 },
    { id: 'E', label: 'E', x: 400, y: 300 },
  ];

  const edges: Edge[] = [
    { id: 'e1', source: 'A', target: 'B', weight: 4 },
    { id: 'e2', source: 'B', target: 'C', weight: 2 },
    { id: 'e3', source: 'A', target: 'D', weight: 3 },
    { id: 'e4', source: 'D', target: 'E', weight: 1 },
    { id: 'e5', source: 'E', target: 'C', weight: 2 },
  ];

  const sortData = [64, 34, 25, 12, 22, 11, 90, 88, 45, 50];

  return (
    <div className="app" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Visualization System - React Integration</h1>

      <section style={{ marginBottom: '40px' }}>
        <h2>Graph Algorithms</h2>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Algorithm:{' '}
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value as GraphAlgorithm)}
            >
              <option value="dijkstra">Dijkstra</option>
              <option value="bfs">BFS</option>
              <option value="dfs">DFS</option>
              <option value="astar">A*</option>
            </select>
          </label>
        </div>

        <GraphVisualizerComponent
          algorithm={selectedAlgorithm}
          nodes={nodes}
          edges={edges}
          startNode="A"
          endNode="C"
          onPathFound={(path) => {
            setPathFound(path);
            console.log('Path found:', path);
          }}
        />

        {pathFound && (
          <div style={{ marginTop: '15px', padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
            <strong>Path Found:</strong> {pathFound.join(' → ')}
          </div>
        )}
      </section>

      <section>
        <h2>Sorting Algorithms</h2>

        <SortingVisualizerComponent
          algorithm="quicksort"
          data={sortData}
          onSortComplete={() => {
            console.log('Sort complete!');
          }}
        />
      </section>
    </div>
  );
}

export default ExampleApp;
