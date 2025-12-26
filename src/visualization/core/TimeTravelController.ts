/**
 * @file Time-travel debugging controller with efficient state management
 * @module visualization/core
 */

import type { StateSnapshot, VisualNode, VisualEdge, Position } from './types';

/**
 * Time travel event types
 */
export type TimeTravelEvent =
  | 'snapshot:created'
  | 'snapshot:restored'
  | 'history:jump'
  | 'history:step'
  | 'history:clear'
  | 'branch:created'
  | 'state:diff';

/**
 * State diff entry
 */
export interface StateDiff {
  /** Type of change */
  type: 'added' | 'removed' | 'modified';
  /** Entity type */
  entity: 'node' | 'edge' | 'metadata';
  /** Entity ID (if applicable) */
  entityId?: string;
  /** Previous value */
  oldValue?: any;
  /** New value */
  newValue?: any;
  /** Timestamp of change */
  timestamp: number;
}

/**
 * Enhanced snapshot with diff support
 */
export interface TimeTravelSnapshot extends StateSnapshot {
  /** Snapshot ID */
  id: string;
  /** Parent snapshot ID (for branching) */
  parentId?: string;
  /** State diffs from parent */
  diffs?: StateDiff[];
  /** Snapshot description */
  description?: string;
  /** Whether this is a full snapshot (not diff-based) */
  isFull: boolean;
}

/**
 * History branch for recursive algorithms
 */
export interface HistoryBranch {
  /** Branch ID */
  id: string;
  /** Parent branch ID */
  parentId?: string;
  /** Branch name/description */
  name: string;
  /** Snapshots in this branch */
  snapshots: TimeTravelSnapshot[];
  /** Creation timestamp */
  createdAt: number;
}

/**
 * Time travel configuration
 */
export interface TimeTravelConfig {
  /** Maximum number of snapshots to keep */
  maxSnapshots?: number;
  /** Memory limit in MB */
  memoryLimit?: number;
  /** How often to create full snapshots vs diffs */
  fullSnapshotInterval?: number;
  /** Enable state compression */
  enableCompression?: boolean;
  /** Enable branch visualization */
  enableBranching?: boolean;
}

/**
 * History marker for significant points
 */
export interface HistoryMarker {
  /** Marker ID */
  id: string;
  /** Snapshot ID this marker points to */
  snapshotId: string;
  /** Marker label */
  label: string;
  /** Marker color */
  color?: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Event listener type
 */
type EventListener<T = any> = (data: T) => void;

/**
 * Time-travel debugging controller
 *
 * Features:
 * - Jump to any point in execution history
 * - Step backward/forward through algorithm steps
 * - Replay from any point
 * - Fast-forward/rewind controls
 * - Efficient state snapshots (copy-on-write)
 * - State diff tracking
 * - Memory-efficient storage
 * - State restoration
 * - Timeline scrubber visualization
 * - History markers
 * - Branch visualization for recursive algorithms
 * - State comparison view
 *
 * @example
 * ```typescript
 * const controller = new TimeTravelController({
 *   maxSnapshots: 1000,
 *   fullSnapshotInterval: 10,
 *   enableCompression: true
 * });
 *
 * // Create snapshot
 * controller.createSnapshot(currentState);
 *
 * // Jump to previous state
 * controller.jumpToSnapshot(previousSnapshotId);
 *
 * // Step backward
 * controller.stepBackward();
 * ```
 */
export class TimeTravelController {
  private config: Required<TimeTravelConfig>;

  // Snapshot storage
  private snapshots: Map<string, TimeTravelSnapshot> = new Map();
  private snapshotOrder: string[] = [];
  private currentSnapshotIndex = -1;

  // Branching support
  private branches: Map<string, HistoryBranch> = new Map();
  private currentBranchId: string | null = null;

  // History markers
  private markers: Map<string, HistoryMarker> = new Map();

  // Event system
  private eventListeners: Map<TimeTravelEvent, Set<EventListener>> = new Map();

  // Performance tracking
  private snapshotCount = 0;
  private fullSnapshotCount = 0;
  private memoryUsage = 0;

  /**
   * Creates a new TimeTravelController
   *
   * @param config - Time travel configuration
   */
  constructor(config?: TimeTravelConfig) {
    this.config = {
      maxSnapshots: config?.maxSnapshots ?? 1000,
      memoryLimit: config?.memoryLimit ?? 100, // 100 MB default
      fullSnapshotInterval: config?.fullSnapshotInterval ?? 10,
      enableCompression: config?.enableCompression ?? false,
      enableBranching: config?.enableBranching ?? false,
    };
  }

  // ============================================================================
  // Time Navigation
  // ============================================================================

  /**
   * Jumps to a specific snapshot in history
   *
   * @param snapshotId - ID of snapshot to jump to
   * @returns The restored snapshot
   * @throws {Error} If snapshot not found
   */
  public jumpToSnapshot(snapshotId: string): TimeTravelSnapshot {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const index = this.snapshotOrder.indexOf(snapshotId);
    if (index === -1) {
      throw new Error(`Snapshot not in order: ${snapshotId}`);
    }

    this.currentSnapshotIndex = index;

    // Reconstruct full state if this is a diff snapshot
    const fullState = this.reconstructState(snapshot);

    this.emit('history:jump', { snapshot: fullState, index });

    return fullState;
  }

  /**
   * Steps backward one snapshot in history
   *
   * @returns The previous snapshot, or null if at beginning
   */
  public stepBackward(): TimeTravelSnapshot | null {
    if (this.currentSnapshotIndex <= 0) {
      return null;
    }

    this.currentSnapshotIndex--;
    const snapshotId = this.snapshotOrder[this.currentSnapshotIndex];
    const snapshot = this.snapshots.get(snapshotId)!;
    const fullState = this.reconstructState(snapshot);

    this.emit('history:step', { snapshot: fullState, direction: 'backward' });

    return fullState;
  }

  /**
   * Steps forward one snapshot in history
   *
   * @returns The next snapshot, or null if at end
   */
  public stepForward(): TimeTravelSnapshot | null {
    if (this.currentSnapshotIndex >= this.snapshotOrder.length - 1) {
      return null;
    }

    this.currentSnapshotIndex++;
    const snapshotId = this.snapshotOrder[this.currentSnapshotIndex];
    const snapshot = this.snapshots.get(snapshotId)!;
    const fullState = this.reconstructState(snapshot);

    this.emit('history:step', { snapshot: fullState, direction: 'forward' });

    return fullState;
  }

  /**
   * Rewinds to the beginning of history
   *
   * @returns The first snapshot, or null if no history
   */
  public rewindToStart(): TimeTravelSnapshot | null {
    if (this.snapshotOrder.length === 0) {
      return null;
    }

    return this.jumpToSnapshot(this.snapshotOrder[0]);
  }

  /**
   * Fast-forwards to the end of history
   *
   * @returns The last snapshot, or null if no history
   */
  public fastForwardToEnd(): TimeTravelSnapshot | null {
    if (this.snapshotOrder.length === 0) {
      return null;
    }

    return this.jumpToSnapshot(this.snapshotOrder[this.snapshotOrder.length - 1]);
  }

  /**
   * Jumps to a specific index in history
   *
   * @param index - History index to jump to
   * @returns The snapshot at that index
   * @throws {Error} If index is invalid
   */
  public jumpToIndex(index: number): TimeTravelSnapshot {
    if (index < 0 || index >= this.snapshotOrder.length) {
      throw new Error(`Invalid history index: ${index}`);
    }

    return this.jumpToSnapshot(this.snapshotOrder[index]);
  }

  /**
   * Gets the current snapshot index
   *
   * @returns Current index, or -1 if no snapshots
   */
  public getCurrentIndex(): number {
    return this.currentSnapshotIndex;
  }

  /**
   * Gets the total number of snapshots
   *
   * @returns Total snapshot count
   */
  public getTotalSnapshots(): number {
    return this.snapshotOrder.length;
  }

  /**
   * Checks if can step backward
   *
   * @returns True if can step backward
   */
  public canStepBackward(): boolean {
    return this.currentSnapshotIndex > 0;
  }

  /**
   * Checks if can step forward
   *
   * @returns True if can step forward
   */
  public canStepForward(): boolean {
    return this.currentSnapshotIndex < this.snapshotOrder.length - 1;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Creates a snapshot of the current state
   *
   * @param state - State to snapshot
   * @param description - Optional description
   * @returns The created snapshot
   */
  public createSnapshot(state: StateSnapshot, description?: string): TimeTravelSnapshot {
    // Determine if this should be a full snapshot or diff
    const shouldBeFull =
      this.snapshotCount % this.config.fullSnapshotInterval === 0 ||
      this.snapshotOrder.length === 0;

    const snapshot: TimeTravelSnapshot = {
      ...state,
      id: this.generateSnapshotId(),
      description,
      isFull: shouldBeFull,
      parentId: this.currentSnapshotIndex >= 0
        ? this.snapshotOrder[this.currentSnapshotIndex]
        : undefined,
    };

    // Calculate diffs if not a full snapshot
    if (!shouldBeFull && snapshot.parentId) {
      const parent = this.snapshots.get(snapshot.parentId);
      if (parent) {
        const fullParent = this.reconstructState(parent);
        snapshot.diffs = this.calculateDiffs(fullParent, state);

        // Store only diffs, not full state (for memory efficiency)
        if (!this.config.enableCompression) {
          // Clear full state data to save memory
          snapshot.nodes = [];
          snapshot.edges = [];
        }
      }
    }

    if (shouldBeFull) {
      this.fullSnapshotCount++;
    }

    // Store snapshot
    this.snapshots.set(snapshot.id, snapshot);

    // Handle history pruning if at capacity
    if (this.currentSnapshotIndex < this.snapshotOrder.length - 1) {
      // Remove forward history when creating new snapshot from middle
      const toRemove = this.snapshotOrder.slice(this.currentSnapshotIndex + 1);
      toRemove.forEach(id => this.snapshots.delete(id));
      this.snapshotOrder.splice(this.currentSnapshotIndex + 1);
    }

    this.snapshotOrder.push(snapshot.id);
    this.currentSnapshotIndex = this.snapshotOrder.length - 1;
    this.snapshotCount++;

    // Enforce memory limits
    this.enforceMemoryLimits();

    this.emit('snapshot:created', { snapshot });

    return snapshot;
  }

  /**
   * Restores state from a snapshot
   *
   * @param snapshotId - ID of snapshot to restore
   * @returns The full reconstructed state
   */
  public restoreSnapshot(snapshotId: string): TimeTravelSnapshot {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const fullState = this.reconstructState(snapshot);

    this.emit('snapshot:restored', { snapshot: fullState });

    return fullState;
  }

  /**
   * Reconstructs full state from a snapshot (handling diffs)
   *
   * @param snapshot - Snapshot to reconstruct
   * @returns Full state snapshot
   */
  private reconstructState(snapshot: TimeTravelSnapshot): TimeTravelSnapshot {
    if (snapshot.isFull) {
      return snapshot;
    }

    // Reconstruct from parent + diffs
    if (!snapshot.parentId || !snapshot.diffs) {
      throw new Error('Invalid diff snapshot: missing parent or diffs');
    }

    const parent = this.snapshots.get(snapshot.parentId);
    if (!parent) {
      throw new Error(`Parent snapshot not found: ${snapshot.parentId}`);
    }

    const fullParent = this.reconstructState(parent);

    // Apply diffs to reconstruct state
    const reconstructed = this.applyDiffs(fullParent, snapshot.diffs);

    return {
      ...snapshot,
      ...reconstructed,
      isFull: true, // Mark as full after reconstruction
    };
  }

  /**
   * Calculates diffs between two states
   *
   * @param oldState - Previous state
   * @param newState - New state
   * @returns Array of state diffs
   */
  private calculateDiffs(oldState: StateSnapshot, newState: StateSnapshot): StateDiff[] {
    const diffs: StateDiff[] = [];
    const timestamp = Date.now();

    // Node diffs
    const oldNodes = new Map(oldState.nodes.map(n => [n.id, n]));
    const newNodes = new Map(newState.nodes.map(n => [n.id, n]));

    // Removed nodes
    oldNodes.forEach((node, id) => {
      if (!newNodes.has(id)) {
        diffs.push({
          type: 'removed',
          entity: 'node',
          entityId: id,
          oldValue: node,
          timestamp,
        });
      }
    });

    // Added and modified nodes
    newNodes.forEach((node, id) => {
      const oldNode = oldNodes.get(id);
      if (!oldNode) {
        diffs.push({
          type: 'added',
          entity: 'node',
          entityId: id,
          newValue: node,
          timestamp,
        });
      } else if (JSON.stringify(oldNode) !== JSON.stringify(node)) {
        diffs.push({
          type: 'modified',
          entity: 'node',
          entityId: id,
          oldValue: oldNode,
          newValue: node,
          timestamp,
        });
      }
    });

    // Edge diffs
    const oldEdges = new Map(oldState.edges.map(e => [e.id, e]));
    const newEdges = new Map(newState.edges.map(e => [e.id, e]));

    oldEdges.forEach((edge, id) => {
      if (!newEdges.has(id)) {
        diffs.push({
          type: 'removed',
          entity: 'edge',
          entityId: id,
          oldValue: edge,
          timestamp,
        });
      }
    });

    newEdges.forEach((edge, id) => {
      const oldEdge = oldEdges.get(id);
      if (!oldEdge) {
        diffs.push({
          type: 'added',
          entity: 'edge',
          entityId: id,
          newValue: edge,
          timestamp,
        });
      } else if (JSON.stringify(oldEdge) !== JSON.stringify(edge)) {
        diffs.push({
          type: 'modified',
          entity: 'edge',
          entityId: id,
          oldValue: oldEdge,
          newValue: edge,
          timestamp,
        });
      }
    });

    // Metadata diffs
    if (JSON.stringify(oldState.metadata) !== JSON.stringify(newState.metadata)) {
      diffs.push({
        type: 'modified',
        entity: 'metadata',
        oldValue: oldState.metadata,
        newValue: newState.metadata,
        timestamp,
      });
    }

    return diffs;
  }

  /**
   * Applies diffs to a state to reconstruct new state
   *
   * @param baseState - Base state to apply diffs to
   * @param diffs - Diffs to apply
   * @returns Reconstructed state
   */
  private applyDiffs(
    baseState: TimeTravelSnapshot,
    diffs: StateDiff[]
  ): Pick<StateSnapshot, 'nodes' | 'edges' | 'metadata'> {
    const nodes = new Map(baseState.nodes.map(n => [n.id, { ...n }]));
    const edges = new Map(baseState.edges.map(e => [e.id, { ...e }]));
    let metadata = { ...baseState.metadata };

    diffs.forEach(diff => {
      switch (diff.entity) {
        case 'node':
          if (diff.type === 'added' && diff.newValue) {
            nodes.set(diff.entityId!, diff.newValue);
          } else if (diff.type === 'removed') {
            nodes.delete(diff.entityId!);
          } else if (diff.type === 'modified' && diff.newValue) {
            nodes.set(diff.entityId!, diff.newValue);
          }
          break;

        case 'edge':
          if (diff.type === 'added' && diff.newValue) {
            edges.set(diff.entityId!, diff.newValue);
          } else if (diff.type === 'removed') {
            edges.delete(diff.entityId!);
          } else if (diff.type === 'modified' && diff.newValue) {
            edges.set(diff.entityId!, diff.newValue);
          }
          break;

        case 'metadata':
          if (diff.newValue) {
            metadata = diff.newValue;
          }
          break;
      }
    });

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
      metadata,
    };
  }

  /**
   * Enforces memory limits by removing old snapshots
   */
  private enforceMemoryLimits(): void {
    // Remove oldest snapshots if over limit
    while (this.snapshotOrder.length > this.config.maxSnapshots) {
      const oldestId = this.snapshotOrder.shift();
      if (oldestId) {
        this.snapshots.delete(oldestId);
        this.currentSnapshotIndex--;

        // Also remove markers pointing to this snapshot
        this.markers.forEach((marker, markerId) => {
          if (marker.snapshotId === oldestId) {
            this.markers.delete(markerId);
          }
        });

        // Update parent references for affected snapshots
        this.snapshots.forEach(snapshot => {
          if (snapshot.parentId === oldestId) {
            // Need to find new parent or make this a full snapshot
            const index = this.snapshotOrder.indexOf(snapshot.id);
            if (index > 0) {
              snapshot.parentId = this.snapshotOrder[index - 1];
            } else {
              // No parent available, make it a full snapshot
              snapshot.parentId = undefined;
              snapshot.isFull = true;
              snapshot.diffs = undefined;
            }
          }
        });
      }
    }

    // TODO: Implement actual memory usage tracking
    // For now, just use snapshot count as proxy
    this.memoryUsage = this.snapshots.size * 0.01; // Rough estimate
  }

  /**
   * Gets estimated memory usage in MB
   *
   * @returns Memory usage estimate
   */
  public getMemoryUsage(): number {
    return this.memoryUsage;
  }

  /**
   * Gets snapshot statistics
   *
   * @returns Statistics object
   */
  public getStats(): {
    totalSnapshots: number;
    fullSnapshots: number;
    diffSnapshots: number;
    memoryUsage: number;
    compressionRatio: number;
  } {
    const fullSnapshots = Array.from(this.snapshots.values()).filter(s => s.isFull).length;

    return {
      totalSnapshots: this.snapshotOrder.length,
      fullSnapshots,
      diffSnapshots: this.snapshotOrder.length - fullSnapshots,
      memoryUsage: this.memoryUsage,
      compressionRatio: fullSnapshots > 0
        ? this.snapshotOrder.length / fullSnapshots
        : 1,
    };
  }

  // ============================================================================
  // History Markers
  // ============================================================================

  /**
   * Adds a marker to the current snapshot
   *
   * @param label - Marker label
   * @param color - Optional marker color
   * @returns The created marker
   * @throws {Error} If no current snapshot
   */
  public addMarker(label: string, color?: string): HistoryMarker {
    if (this.currentSnapshotIndex < 0) {
      throw new Error('No current snapshot to mark');
    }

    const marker: HistoryMarker = {
      id: this.generateMarkerId(),
      snapshotId: this.snapshotOrder[this.currentSnapshotIndex],
      label,
      color,
      timestamp: Date.now(),
    };

    this.markers.set(marker.id, marker);

    return marker;
  }

  /**
   * Removes a marker
   *
   * @param markerId - ID of marker to remove
   */
  public removeMarker(markerId: string): void {
    this.markers.delete(markerId);
  }

  /**
   * Gets all markers
   *
   * @returns Array of markers
   */
  public getMarkers(): HistoryMarker[] {
    return Array.from(this.markers.values());
  }

  /**
   * Jumps to a marker
   *
   * @param markerId - ID of marker to jump to
   * @returns The snapshot at the marker
   */
  public jumpToMarker(markerId: string): TimeTravelSnapshot {
    const marker = this.markers.get(markerId);
    if (!marker) {
      throw new Error(`Marker not found: ${markerId}`);
    }

    return this.jumpToSnapshot(marker.snapshotId);
  }

  // ============================================================================
  // Branch Management
  // ============================================================================

  /**
   * Creates a new history branch from current point
   *
   * @param name - Branch name
   * @returns The created branch
   * @throws {Error} If branching is not enabled
   */
  public createBranch(name: string): HistoryBranch {
    if (!this.config.enableBranching) {
      throw new Error('Branching is not enabled');
    }

    const branch: HistoryBranch = {
      id: this.generateBranchId(),
      parentId: this.currentBranchId ?? undefined,
      name,
      snapshots: [],
      createdAt: Date.now(),
    };

    this.branches.set(branch.id, branch);
    this.currentBranchId = branch.id;

    this.emit('branch:created', { branch });

    return branch;
  }

  /**
   * Switches to a different branch
   *
   * @param branchId - ID of branch to switch to
   * @throws {Error} If branch not found
   */
  public switchBranch(branchId: string): void {
    const branch = this.branches.get(branchId);
    if (!branch) {
      throw new Error(`Branch not found: ${branchId}`);
    }

    this.currentBranchId = branchId;
  }

  /**
   * Gets all branches
   *
   * @returns Array of branches
   */
  public getBranches(): HistoryBranch[] {
    return Array.from(this.branches.values());
  }

  /**
   * Gets the current branch
   *
   * @returns Current branch or null
   */
  public getCurrentBranch(): HistoryBranch | null {
    return this.currentBranchId
      ? this.branches.get(this.currentBranchId) ?? null
      : null;
  }

  // ============================================================================
  // State Comparison
  // ============================================================================

  /**
   * Compares two snapshots and returns the differences
   *
   * @param snapshotId1 - First snapshot ID
   * @param snapshotId2 - Second snapshot ID
   * @returns Array of differences
   */
  public compareSnapshots(snapshotId1: string, snapshotId2: string): StateDiff[] {
    const snapshot1 = this.restoreSnapshot(snapshotId1);
    const snapshot2 = this.restoreSnapshot(snapshotId2);

    const diffs = this.calculateDiffs(snapshot1, snapshot2);

    this.emit('state:diff', { snapshot1, snapshot2, diffs });

    return diffs;
  }

  /**
   * Gets the diff between current and previous snapshot
   *
   * @returns Diffs or null if at beginning
   */
  public getCurrentDiff(): StateDiff[] | null {
    if (this.currentSnapshotIndex <= 0) {
      return null;
    }

    const currentId = this.snapshotOrder[this.currentSnapshotIndex];
    const previousId = this.snapshotOrder[this.currentSnapshotIndex - 1];

    return this.compareSnapshots(previousId, currentId);
  }

  // ============================================================================
  // Timeline Visualization
  // ============================================================================

  /**
   * Gets timeline data for visualization
   *
   * @returns Timeline data
   */
  public getTimelineData(): {
    snapshots: Array<{
      id: string;
      index: number;
      timestamp: number;
      description?: string;
      isCurrent: boolean;
      isFull: boolean;
      markers: HistoryMarker[];
    }>;
    currentIndex: number;
    totalSnapshots: number;
  } {
    return {
      snapshots: this.snapshotOrder.map((id, index) => {
        const snapshot = this.snapshots.get(id)!;
        const markers = this.getMarkers().filter(m => m.snapshotId === id);

        return {
          id,
          index,
          timestamp: snapshot.timestamp,
          description: snapshot.description,
          isCurrent: index === this.currentSnapshotIndex,
          isFull: snapshot.isFull,
          markers,
        };
      }),
      currentIndex: this.currentSnapshotIndex,
      totalSnapshots: this.snapshotOrder.length,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Clears all history
   */
  public clearHistory(): void {
    this.snapshots.clear();
    this.snapshotOrder = [];
    this.currentSnapshotIndex = -1;
    this.markers.clear();
    this.branches.clear();
    this.currentBranchId = null;
    this.snapshotCount = 0;
    this.fullSnapshotCount = 0;
    this.memoryUsage = 0;

    this.emit('history:clear', {});
  }

  /**
   * Gets all snapshots
   *
   * @returns Array of all snapshots
   */
  public getAllSnapshots(): TimeTravelSnapshot[] {
    return this.snapshotOrder.map(id => this.snapshots.get(id)!);
  }

  /**
   * Gets a snapshot by ID
   *
   * @param snapshotId - Snapshot ID
   * @returns Snapshot or undefined
   */
  public getSnapshot(snapshotId: string): TimeTravelSnapshot | undefined {
    return this.snapshots.get(snapshotId);
  }

  /**
   * Gets the current snapshot
   *
   * @returns Current snapshot or null
   */
  public getCurrentSnapshot(): TimeTravelSnapshot | null {
    if (this.currentSnapshotIndex < 0) {
      return null;
    }

    const id = this.snapshotOrder[this.currentSnapshotIndex];
    return this.snapshots.get(id) ?? null;
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Subscribes to an event
   *
   * @param event - Event type
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  public on<T = any>(event: TimeTravelEvent, listener: EventListener<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(listener);

    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  /**
   * Emits an event
   *
   * @param event - Event type
   * @param data - Event data
   */
  private emit<T = any>(event: TimeTravelEvent, data: T): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;

    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in time-travel event listener for ${event}:`, error);
      }
    });
  }

  // ============================================================================
  // ID Generation
  // ============================================================================

  private generateSnapshotId(): string {
    return `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMarkerId(): string {
    return `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBranchId(): string {
    return `branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Disposes the controller and cleans up resources
   */
  public dispose(): void {
    this.clearHistory();
    this.eventListeners.clear();
  }
}
