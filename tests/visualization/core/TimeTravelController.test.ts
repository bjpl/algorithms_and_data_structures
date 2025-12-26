/**
 * @file Tests for TimeTravelController
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TimeTravelController,
  type TimeTravelConfig,
  type TimeTravelSnapshot,
  type HistoryMarker,
  type HistoryBranch,
  type StateDiff,
} from '../../../src/visualization/core/TimeTravelController';
import type { StateSnapshot, VisualNode, VisualEdge } from '../../../src/visualization/core/types';

describe('TimeTravelController', () => {
  let controller: TimeTravelController;

  const createMockState = (
    nodeCount: number = 3,
    edgeCount: number = 2,
    stepIndex: number = 0
  ): StateSnapshot => ({
    timestamp: Date.now(),
    stepIndex,
    nodes: Array.from({ length: nodeCount }, (_, i) => ({
      id: `node-${i}`,
      data: { value: i },
      position: { x: i * 100, y: i * 100 },
    })),
    edges: Array.from({ length: edgeCount }, (_, i) => ({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
    })),
    metadata: { test: true },
  });

  beforeEach(() => {
    controller = new TimeTravelController({
      maxSnapshots: 100,
      fullSnapshotInterval: 5,
      enableCompression: false,
      enableBranching: true,
    });
  });

  describe('Snapshot Creation', () => {
    it('should create initial snapshot as full snapshot', () => {
      const state = createMockState();
      const snapshot = controller.createSnapshot(state, 'Initial state');

      expect(snapshot.isFull).toBe(true);
      expect(snapshot.description).toBe('Initial state');
      expect(snapshot.nodes).toHaveLength(3);
      expect(snapshot.edges).toHaveLength(2);
    });

    it('should create diff snapshots after full snapshot', () => {
      // Create full snapshot
      const state1 = createMockState();
      controller.createSnapshot(state1);

      // Create diff snapshots
      for (let i = 1; i < 5; i++) {
        const state = createMockState(3, 2, i);
        const snapshot = controller.createSnapshot(state);
        expect(snapshot.isFull).toBe(false);
        expect(snapshot.diffs).toBeDefined();
      }
    });

    it('should create full snapshot at specified interval', () => {
      const config: TimeTravelConfig = {
        fullSnapshotInterval: 3,
      };
      const ctrl = new TimeTravelController(config);

      const snapshots = [];
      for (let i = 0; i < 10; i++) {
        const state = createMockState(3, 2, i);
        snapshots.push(ctrl.createSnapshot(state));
      }

      // Check that every 3rd snapshot is full (indices 0, 3, 6, 9)
      expect(snapshots[0].isFull).toBe(true);
      expect(snapshots[1].isFull).toBe(false);
      expect(snapshots[2].isFull).toBe(false);
      expect(snapshots[3].isFull).toBe(true);
      expect(snapshots[6].isFull).toBe(true);
    });

    it('should calculate diffs correctly', () => {
      const state1 = createMockState(3, 2, 0);
      controller.createSnapshot(state1);

      // Modify state
      const state2: StateSnapshot = {
        ...state1,
        nodes: [
          ...state1.nodes.slice(0, 2),
          { ...state1.nodes[2], position: { x: 300, y: 300 } },
        ],
      };
      const snapshot = controller.createSnapshot(state2);

      expect(snapshot.diffs).toBeDefined();
      expect(snapshot.diffs!.length).toBeGreaterThan(0);

      const modifiedDiff = snapshot.diffs!.find(
        d => d.type === 'modified' && d.entity === 'node'
      );
      expect(modifiedDiff).toBeDefined();
    });

    it('should track added and removed entities', () => {
      const state1 = createMockState(3, 2, 0);
      controller.createSnapshot(state1);

      // Add node, remove edge
      const state2: StateSnapshot = {
        ...state1,
        nodes: [
          ...state1.nodes,
          {
            id: 'node-3',
            data: { value: 3 },
            position: { x: 300, y: 300 },
          },
        ],
        edges: state1.edges.slice(0, 1),
      };
      const snapshot = controller.createSnapshot(state2);

      const addedNode = snapshot.diffs?.find(
        d => d.type === 'added' && d.entity === 'node'
      );
      const removedEdge = snapshot.diffs?.find(
        d => d.type === 'removed' && d.entity === 'edge'
      );

      expect(addedNode).toBeDefined();
      expect(removedEdge).toBeDefined();
    });
  });

  describe('Time Navigation', () => {
    beforeEach(() => {
      // Create history with 10 snapshots
      for (let i = 0; i < 10; i++) {
        const state = createMockState(3, 2, i);
        controller.createSnapshot(state, `State ${i}`);
      }
    });

    it('should step backward through history', () => {
      expect(controller.getCurrentIndex()).toBe(9);

      const snapshot = controller.stepBackward();
      expect(snapshot).not.toBeNull();
      expect(controller.getCurrentIndex()).toBe(8);
    });

    it('should step forward through history', () => {
      controller.jumpToIndex(5);

      const snapshot = controller.stepForward();
      expect(snapshot).not.toBeNull();
      expect(controller.getCurrentIndex()).toBe(6);
    });

    it('should return null when stepping backward at beginning', () => {
      controller.rewindToStart();
      const snapshot = controller.stepBackward();
      expect(snapshot).toBeNull();
    });

    it('should return null when stepping forward at end', () => {
      const snapshot = controller.stepForward();
      expect(snapshot).toBeNull();
    });

    it('should jump to specific snapshot by ID', () => {
      const snapshots = controller.getAllSnapshots();
      const targetSnapshot = snapshots[5];

      const jumped = controller.jumpToSnapshot(targetSnapshot.id);
      expect(jumped.id).toBe(targetSnapshot.id);
      expect(controller.getCurrentIndex()).toBe(5);
    });

    it('should jump to specific index', () => {
      const snapshot = controller.jumpToIndex(3);
      expect(controller.getCurrentIndex()).toBe(3);
      expect(snapshot.stepIndex).toBe(3);
    });

    it('should rewind to start', () => {
      const snapshot = controller.rewindToStart();
      expect(snapshot).not.toBeNull();
      expect(controller.getCurrentIndex()).toBe(0);
    });

    it('should fast-forward to end', () => {
      controller.rewindToStart();

      const snapshot = controller.fastForwardToEnd();
      expect(snapshot).not.toBeNull();
      expect(controller.getCurrentIndex()).toBe(9);
    });

    it('should throw error for invalid snapshot ID', () => {
      expect(() => {
        controller.jumpToSnapshot('invalid-id');
      }).toThrow('Snapshot not found');
    });

    it('should throw error for invalid index', () => {
      expect(() => {
        controller.jumpToIndex(100);
      }).toThrow('Invalid history index');
    });

    it('should check navigation bounds correctly', () => {
      controller.rewindToStart();
      expect(controller.canStepBackward()).toBe(false);
      expect(controller.canStepForward()).toBe(true);

      controller.fastForwardToEnd();
      expect(controller.canStepBackward()).toBe(true);
      expect(controller.canStepForward()).toBe(false);
    });
  });

  describe('State Reconstruction', () => {
    it('should reconstruct full state from diffs', () => {
      const state1 = createMockState(3, 2, 0);
      controller.createSnapshot(state1);

      // Create several diff snapshots
      for (let i = 1; i < 5; i++) {
        const state = createMockState(3, 2, i);
        state.nodes[0].position.x += i * 10;
        controller.createSnapshot(state);
      }

      // Restore a diff snapshot
      const snapshots = controller.getAllSnapshots();
      const diffSnapshot = snapshots[3];
      expect(diffSnapshot.isFull).toBe(false);

      const restored = controller.restoreSnapshot(diffSnapshot.id);
      expect(restored.nodes).toHaveLength(3);
      expect(restored.edges).toHaveLength(2);
      expect(restored.nodes[0].position.x).toBe(30); // Original + 3*10
    });

    it('should handle complex state changes across multiple diffs', () => {
      const state1 = createMockState(3, 2, 0);
      controller.createSnapshot(state1);

      // Progressively modify state
      let currentState = state1;
      for (let i = 1; i < 5; i++) {
        currentState = {
          ...currentState,
          nodes: currentState.nodes.map(n => ({
            ...n,
            position: { x: n.position.x + 10, y: n.position.y + 10 },
          })),
        };
        controller.createSnapshot(currentState);
      }

      const snapshots = controller.getAllSnapshots();
      const lastSnapshot = snapshots[4];
      const restored = controller.restoreSnapshot(lastSnapshot.id);

      expect(restored.nodes[0].position.x).toBe(40); // 0 + 4*10
      expect(restored.nodes[0].position.y).toBe(40);
    });
  });

  describe('History Markers', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        const state = createMockState(3, 2, i);
        controller.createSnapshot(state);
      }
    });

    it('should add marker to current snapshot', () => {
      controller.jumpToIndex(2);

      const marker = controller.addMarker('Important Point', '#ff0000');
      expect(marker.label).toBe('Important Point');
      expect(marker.color).toBe('#ff0000');
      expect(marker.snapshotId).toBe(controller.getAllSnapshots()[2].id);
    });

    it('should throw error when adding marker with no current snapshot', () => {
      const emptyController = new TimeTravelController();

      expect(() => {
        emptyController.addMarker('Test');
      }).toThrow('No current snapshot to mark');
    });

    it('should retrieve all markers', () => {
      controller.jumpToIndex(1);
      controller.addMarker('Marker 1');

      controller.jumpToIndex(3);
      controller.addMarker('Marker 2');

      const markers = controller.getMarkers();
      expect(markers).toHaveLength(2);
      expect(markers.map(m => m.label)).toContain('Marker 1');
      expect(markers.map(m => m.label)).toContain('Marker 2');
    });

    it('should remove marker', () => {
      const marker = controller.addMarker('Test Marker');
      expect(controller.getMarkers()).toHaveLength(1);

      controller.removeMarker(marker.id);
      expect(controller.getMarkers()).toHaveLength(0);
    });

    it('should jump to marker', () => {
      controller.jumpToIndex(2);
      const marker = controller.addMarker('Jump Target');

      controller.jumpToIndex(4);
      expect(controller.getCurrentIndex()).toBe(4);

      controller.jumpToMarker(marker.id);
      expect(controller.getCurrentIndex()).toBe(2);
    });

    it('should throw error when jumping to non-existent marker', () => {
      expect(() => {
        controller.jumpToMarker('invalid-marker-id');
      }).toThrow('Marker not found');
    });
  });

  describe('Branch Management', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        const state = createMockState(3, 2, i);
        controller.createSnapshot(state);
      }
    });

    it('should create branch', () => {
      const branch = controller.createBranch('Feature Branch');
      expect(branch.name).toBe('Feature Branch');
      expect(branch.id).toBeDefined();
    });

    it('should throw error when creating branch with branching disabled', () => {
      const ctrl = new TimeTravelController({ enableBranching: false });

      expect(() => {
        ctrl.createBranch('Test');
      }).toThrow('Branching is not enabled');
    });

    it('should switch between branches', () => {
      const branch1 = controller.createBranch('Branch 1');
      const branch2 = controller.createBranch('Branch 2');

      expect(controller.getCurrentBranch()?.id).toBe(branch2.id);

      controller.switchBranch(branch1.id);
      expect(controller.getCurrentBranch()?.id).toBe(branch1.id);
    });

    it('should retrieve all branches', () => {
      controller.createBranch('Branch 1');
      controller.createBranch('Branch 2');
      controller.createBranch('Branch 3');

      const branches = controller.getBranches();
      expect(branches).toHaveLength(3);
    });

    it('should throw error when switching to non-existent branch', () => {
      expect(() => {
        controller.switchBranch('invalid-branch-id');
      }).toThrow('Branch not found');
    });
  });

  describe('State Comparison', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        const state = createMockState(3, 2, i);
        state.nodes[0].position.x += i * 10;
        controller.createSnapshot(state);
      }
    });

    it('should compare two snapshots', () => {
      const snapshots = controller.getAllSnapshots();
      const diffs = controller.compareSnapshots(snapshots[0].id, snapshots[2].id);

      expect(diffs).toBeDefined();
      expect(diffs.length).toBeGreaterThan(0);
    });

    it('should get current diff', () => {
      controller.jumpToIndex(2);
      const diffs = controller.getCurrentDiff();

      expect(diffs).not.toBeNull();
      expect(diffs!.length).toBeGreaterThan(0);
    });

    it('should return null for current diff at beginning', () => {
      controller.rewindToStart();
      const diffs = controller.getCurrentDiff();
      expect(diffs).toBeNull();
    });

    it('should identify all types of changes', () => {
      // Create a simple controller for this test
      const testController = new TimeTravelController({
        fullSnapshotInterval: 1, // Always create full snapshots
        enableCompression: true, // Keep full state data
      });

      const state1 = createMockState(3, 2, 0);
      testController.createSnapshot(state1);

      // Create state with added node, removed edge, and modified node
      const state2: StateSnapshot = {
        ...state1,
        timestamp: Date.now() + 1000,
        nodes: [
          ...state1.nodes.slice(0, 2), // Keep first 2 nodes
          { ...state1.nodes[2], position: { x: 999, y: 999 } }, // Modify 3rd node
          {
            id: 'node-3',
            data: { value: 3 },
            position: { x: 300, y: 300 },
          }, // Add new node
        ],
        edges: state1.edges.slice(0, 1), // Remove one edge
        metadata: { test: false, newField: 'added' },
      };
      testController.createSnapshot(state2);

      const snapshots = testController.getAllSnapshots();
      const diffs = testController.compareSnapshots(snapshots[0].id, snapshots[1].id);

      const hasAdded = diffs.some(d => d.type === 'added' && d.entity === 'node');
      const hasRemoved = diffs.some(d => d.type === 'removed' && d.entity === 'edge');
      const hasModified = diffs.some(d => d.type === 'modified');

      expect(hasAdded).toBe(true);
      expect(hasRemoved).toBe(true);
      expect(hasModified).toBe(true);
    });
  });

  describe('Timeline Visualization', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        const state = createMockState(3, 2, i);
        controller.createSnapshot(state, `State ${i}`);
      }

      controller.jumpToIndex(2);
      controller.addMarker('Marker 1');
      controller.jumpToIndex(4);
      controller.addMarker('Marker 2');
    });

    it('should provide timeline data', () => {
      const timeline = controller.getTimelineData();

      expect(timeline.snapshots).toHaveLength(5);
      expect(timeline.totalSnapshots).toBe(5);
      expect(timeline.currentIndex).toBe(4);
    });

    it('should include snapshot details in timeline', () => {
      const timeline = controller.getTimelineData();
      const snapshot = timeline.snapshots[2];

      expect(snapshot.description).toBe('State 2');
      expect(snapshot.markers).toHaveLength(1);
      expect(snapshot.markers[0].label).toBe('Marker 1');
    });

    it('should mark current snapshot in timeline', () => {
      controller.jumpToIndex(2);
      const timeline = controller.getTimelineData();

      expect(timeline.snapshots[2].isCurrent).toBe(true);
      expect(timeline.snapshots[0].isCurrent).toBe(false);
      expect(timeline.snapshots[4].isCurrent).toBe(false);
    });
  });

  describe('Memory Management', () => {
    it('should enforce snapshot limit', () => {
      const ctrl = new TimeTravelController({ maxSnapshots: 5 });

      for (let i = 0; i < 10; i++) {
        const state = createMockState(3, 2, i);
        ctrl.createSnapshot(state);
      }

      // Should not exceed maxSnapshots
      expect(ctrl.getTotalSnapshots()).toBeLessThanOrEqual(5);
    });

    it('should track memory usage', () => {
      for (let i = 0; i < 10; i++) {
        const state = createMockState(3, 2, i);
        controller.createSnapshot(state);
      }

      const usage = controller.getMemoryUsage();
      expect(usage).toBeGreaterThan(0);
    });

    it('should provide statistics', () => {
      for (let i = 0; i < 10; i++) {
        const state = createMockState(3, 2, i);
        controller.createSnapshot(state);
      }

      const stats = controller.getStats();
      expect(stats.totalSnapshots).toBe(10);
      expect(stats.fullSnapshots).toBeGreaterThan(0);
      expect(stats.diffSnapshots).toBeGreaterThan(0);
      expect(stats.compressionRatio).toBeGreaterThan(1);
    });
  });

  describe('Event System', () => {
    it('should emit snapshot:created event', () => {
      const listener = vi.fn();
      controller.on('snapshot:created', listener);

      const state = createMockState();
      controller.createSnapshot(state);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ snapshot: expect.any(Object) })
      );
    });

    it('should emit history:jump event', () => {
      const listener = vi.fn();

      for (let i = 0; i < 5; i++) {
        const state = createMockState(3, 2, i);
        controller.createSnapshot(state);
      }

      controller.on('history:jump', listener);

      const snapshots = controller.getAllSnapshots();
      controller.jumpToSnapshot(snapshots[2].id);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should emit history:step event', () => {
      const listener = vi.fn();

      for (let i = 0; i < 5; i++) {
        const state = createMockState(3, 2, i);
        controller.createSnapshot(state);
      }

      controller.on('history:step', listener);

      controller.stepBackward();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'backward' })
      );

      controller.stepForward();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'forward' })
      );
    });

    it('should emit branch:created event', () => {
      const listener = vi.fn();
      controller.on('branch:created', listener);

      controller.createBranch('Test Branch');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing from events', () => {
      const listener = vi.fn();
      const unsubscribe = controller.on('snapshot:created', listener);

      const state = createMockState();
      controller.createSnapshot(state);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      controller.createSnapshot(state);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        const state = createMockState(3, 2, i);
        controller.createSnapshot(state);
      }
    });

    it('should clear all history', () => {
      expect(controller.getTotalSnapshots()).toBe(5);

      controller.clearHistory();

      expect(controller.getTotalSnapshots()).toBe(0);
      expect(controller.getCurrentIndex()).toBe(-1);
      expect(controller.getMarkers()).toHaveLength(0);
    });

    it('should get all snapshots', () => {
      const snapshots = controller.getAllSnapshots();
      expect(snapshots).toHaveLength(5);
    });

    it('should get snapshot by ID', () => {
      const snapshots = controller.getAllSnapshots();
      const snapshot = controller.getSnapshot(snapshots[2].id);

      expect(snapshot).toBeDefined();
      expect(snapshot?.id).toBe(snapshots[2].id);
    });

    it('should return undefined for non-existent snapshot', () => {
      const snapshot = controller.getSnapshot('invalid-id');
      expect(snapshot).toBeUndefined();
    });

    it('should get current snapshot', () => {
      const current = controller.getCurrentSnapshot();
      expect(current).not.toBeNull();
      expect(current?.stepIndex).toBe(4);
    });

    it('should return null when no current snapshot', () => {
      const ctrl = new TimeTravelController();
      expect(ctrl.getCurrentSnapshot()).toBeNull();
    });
  });

  describe('Integration with AnimationController', () => {
    it('should support saving animation state', () => {
      const animationState: StateSnapshot = {
        timestamp: Date.now(),
        stepIndex: 0,
        nodes: [],
        edges: [],
        metadata: {
          animationTime: 1500,
          playbackSpeed: 2.0,
          isPlaying: true,
        },
      };

      const snapshot = controller.createSnapshot(animationState);
      expect(snapshot.metadata?.animationTime).toBe(1500);
      expect(snapshot.metadata?.playbackSpeed).toBe(2.0);
    });

    it('should preserve camera position in 3D mode', () => {
      const state: StateSnapshot = {
        timestamp: Date.now(),
        stepIndex: 0,
        nodes: [],
        edges: [],
        cameraPosition: { x: 100, y: 200, z: 300 },
      };

      const snapshot = controller.createSnapshot(state);
      const restored = controller.restoreSnapshot(snapshot.id);

      expect(restored.cameraPosition).toEqual({ x: 100, y: 200, z: 300 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty state', () => {
      const state: StateSnapshot = {
        timestamp: Date.now(),
        stepIndex: 0,
        nodes: [],
        edges: [],
      };

      const snapshot = controller.createSnapshot(state);
      expect(snapshot.nodes).toHaveLength(0);
      expect(snapshot.edges).toHaveLength(0);
    });

    it('should handle rapid snapshot creation', () => {
      for (let i = 0; i < 100; i++) {
        const state = createMockState(3, 2, i);
        controller.createSnapshot(state);
      }

      expect(controller.getTotalSnapshots()).toBe(100);
    });

    it('should handle branching from middle of history', () => {
      for (let i = 0; i < 5; i++) {
        const state = createMockState(3, 2, i);
        controller.createSnapshot(state);
      }

      controller.jumpToIndex(2);
      const state = createMockState(3, 2, 10);
      controller.createSnapshot(state);

      // Forward history should be removed
      expect(controller.getTotalSnapshots()).toBe(4);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in event listeners gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      controller.on('snapshot:created', errorListener);
      controller.on('snapshot:created', normalListener);

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const state = createMockState();
      controller.createSnapshot(state);

      expect(consoleError).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should dispose controller cleanly', () => {
      for (let i = 0; i < 5; i++) {
        const state = createMockState(3, 2, i);
        controller.createSnapshot(state);
      }

      controller.dispose();

      expect(controller.getTotalSnapshots()).toBe(0);
      expect(controller.getCurrentIndex()).toBe(-1);
    });
  });
});
