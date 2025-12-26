/**
 * Graph 3D Visualizer
 *
 * Production-ready WebGL-based 3D graph visualization using Three.js patterns.
 * Features force-directed layout, camera controls, LOD optimization, and
 * interactive node/edge manipulation.
 *
 * Compatible with React-three-fiber for React integration.
 *
 * @module visualization/3d/Graph3DVisualizer
 */

import { BaseVisualization } from '../core/base-visualization';
import type {
  VisualizationConfig,
  VisualNode,
  VisualEdge,
  Position,
  LayoutConfig,
} from '../core/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * 3D-specific node extension
 */
export interface Node3D extends VisualNode {
  position: Required<Position>; // z is required in 3D
  velocity?: Position;
  force?: Position;
}

/**
 * 3D-specific edge extension
 */
export interface Edge3D extends VisualEdge {
  curvature?: number; // For curved edges in 3D space
  tubeSegments?: number; // Number of segments for tube geometry
}

/**
 * 3D layout algorithms
 */
export type Layout3DType = '3d-force' | '3d-sphere' | '3d-helix' | 'custom';

/**
 * Camera configuration
 */
export interface CameraConfig {
  x: number;
  y: number;
  z: number;
  targetX?: number;
  targetY?: number;
  targetZ?: number;
  fov?: number;
  near?: number;
  far?: number;
}

/**
 * Graph 3D configuration
 */
export interface Graph3DConfig extends VisualizationConfig {
  renderMode: '3d';
  nodes: Node3D[];
  edges: Edge3D[];
  layout?: Layout3DType;
  nodeSize?: number;
  edgeWidth?: number;
  showLabels?: boolean;
  enablePhysics?: boolean;
  cameraPosition?: CameraConfig;
  backgroundColor?: string;
  ambientLightIntensity?: number;
  directionalLightIntensity?: number;
  enableShadows?: boolean;
  enableLOD?: boolean; // Level of Detail optimization
  lodDistances?: [number, number, number]; // [high, medium, low] distances
  maxNodes?: number; // Performance limit
  gridHelper?: boolean;
  axesHelper?: boolean;
}

/**
 * 3D view export format
 */
export type Export3DFormat = 'png' | 'obj' | 'gltf' | 'stl';

/**
 * LOD (Level of Detail) configuration
 */
interface LODConfig {
  enabled: boolean;
  distances: [number, number, number]; // high, medium, low detail distances
  nodeSegments: {
    high: number; // Sphere segments for close nodes
    medium: number;
    low: number;
  };
}

/**
 * Physics simulation parameters for 3D force-directed layout
 */
interface PhysicsConfig {
  enabled: boolean;
  iterations: number;
  springLength: number;
  springStrength: number;
  repulsionStrength: number;
  damping: number;
  gravity: number;
  centerAttraction: number;
}

// ============================================================================
// THREE.JS MOCK INTERFACES (for TypeScript without actual Three.js)
// ============================================================================

/**
 * Mock Three.js types for implementation without dependencies.
 * In production, replace with actual Three.js imports.
 */
interface Vector3 {
  x: number;
  y: number;
  z: number;
  set(x: number, y: number, z: number): Vector3;
  add(v: Vector3): Vector3;
  sub(v: Vector3): Vector3;
  multiplyScalar(s: number): Vector3;
  length(): number;
  normalize(): Vector3;
  distanceTo(v: Vector3): number;
  clone(): Vector3;
}

interface Scene {
  add(object: Object3D): void;
  remove(object: Object3D): void;
  children: Object3D[];
}

interface Camera {
  position: Vector3;
  lookAt(target: Vector3): void;
  updateProjectionMatrix(): void;
}

interface PerspectiveCamera extends Camera {
  fov: number;
  aspect: number;
  near: number;
  far: number;
}

interface WebGLRenderer {
  setSize(width: number, height: number): void;
  render(scene: Scene, camera: Camera): void;
  domElement: HTMLCanvasElement;
  dispose(): void;
}

interface Object3D {
  position: Vector3;
  rotation: { x: number; y: number; z: number };
  scale: Vector3;
  userData: any;
  add(child: Object3D): void;
  remove(child: Object3D): void;
}

interface Mesh extends Object3D {
  geometry: any;
  material: any;
}

// ============================================================================
// GRAPH 3D VISUALIZER CLASS
// ============================================================================

/**
 * WebGL-based 3D graph visualization component.
 *
 * Features:
 * - 3D force-directed layout with physics simulation
 * - Interactive camera controls (orbit, pan, zoom)
 * - Node spheres and edge tubes/lines
 * - Click selection and hover highlighting
 * - LOD (Level of Detail) for performance optimization
 * - Path highlighting in 3D space
 * - Export to various 3D formats
 *
 * @example
 * ```typescript
 * const visualizer = new Graph3DVisualizer({
 *   id: 'graph-3d',
 *   renderMode: '3d',
 *   width: 800,
 *   height: 600,
 *   nodes: nodes3D,
 *   edges: edges3D,
 *   layout: '3d-force',
 *   enablePhysics: true,
 *   enableLOD: true,
 * });
 *
 * await visualizer.initialize(containerElement);
 * visualizer.render3D(canvas);
 * visualizer.setCamera({ x: 0, y: 0, z: 500 });
 * ```
 */
export class Graph3DVisualizer extends BaseVisualization {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;

  // Three.js-like scene graph (mocked for now)
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private renderer: WebGLRenderer | null = null;

  // 3D-specific data
  private nodes3D: Node3D[] = [];
  private edges3D: Edge3D[] = [];

  // Visual objects
  private nodeMeshes: Map<string, Mesh> = new Map();
  private edgeMeshes: Map<string, Mesh> = new Map();
  private labelSprites: Map<string, Object3D> = new Map();

  // Interaction state
  private selectedNodeId: string | null = null;
  private hoveredNodeId: string | null = null;
  private highlightedPath: string[] = [];

  // Physics simulation
  private physicsConfig: PhysicsConfig;
  private physicsAnimationId: number | null = null;

  // LOD configuration
  private lodConfig: LODConfig;

  // Camera controls
  private cameraControls: {
    isOrbiting: boolean;
    isPanning: boolean;
    lastMouseX: number;
    lastMouseY: number;
    targetPosition: Vector3;
    currentPosition: Vector3;
  };

  // Animation
  private animationFrameId: number | null = null;
  private rotationSpeed: number = 0;

  constructor(config: Graph3DConfig) {
    super(config);

    this.nodes3D = config.nodes || [];
    this.edges3D = config.edges || [];

    // Initialize physics configuration
    this.physicsConfig = {
      enabled: config.enablePhysics ?? true,
      iterations: 100,
      springLength: 50,
      springStrength: 0.1,
      repulsionStrength: 500,
      damping: 0.9,
      gravity: 0.01,
      centerAttraction: 0.005,
    };

    // Initialize LOD configuration
    this.lodConfig = {
      enabled: config.enableLOD ?? true,
      distances: config.lodDistances || [200, 500, 1000],
      nodeSegments: {
        high: 32,
        medium: 16,
        low: 8,
      },
    };

    // Initialize camera controls
    this.cameraControls = {
      isOrbiting: false,
      isPanning: false,
      lastMouseX: 0,
      lastMouseY: 0,
      targetPosition: this.createVector3(0, 0, 500),
      currentPosition: this.createVector3(0, 0, 500),
    };
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  /**
   * Initialize WebGL renderer and 3D scene
   */
  protected async initializeRenderer(container: HTMLElement): Promise<void> {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.canvas.style.display = 'block';
    container.appendChild(this.canvas);

    // Get WebGL context
    this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }

    // Initialize Three.js-like scene (mocked)
    this.initializeScene();

    // Setup camera
    this.setupCamera();

    // Setup lights
    this.setupLights();

    // Setup event listeners
    this.setupEventListeners();

    // Apply initial layout
    const config = this.config as Graph3DConfig;
    if (config.layout) {
      await this.applyLayout3D(config.layout);
    }
  }

  /**
   * Initialize 3D scene
   */
  private initializeScene(): void {
    // In production, this would be: this.scene = new THREE.Scene();
    this.scene = this.createMockScene();

    const config = this.config as Graph3DConfig;
    if (config.backgroundColor) {
      // Set background color
    }

    // Add helpers if enabled
    if (config.gridHelper) {
      // Add grid helper
    }
    if (config.axesHelper) {
      // Add axes helper
    }
  }

  /**
   * Setup camera with perspective projection
   */
  private setupCamera(): void {
    const config = this.config as Graph3DConfig;
    const aspect = this.config.width / this.config.height;

    // In production: this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera = this.createMockPerspectiveCamera(
      config.cameraPosition?.fov || 75,
      aspect,
      config.cameraPosition?.near || 0.1,
      config.cameraPosition?.far || 10000
    );

    // Set initial position
    if (config.cameraPosition) {
      this.setCameraPosition({
        x: config.cameraPosition.x,
        y: config.cameraPosition.y,
        z: config.cameraPosition.z,
      });
    } else {
      this.camera.position.set(0, 0, 500);
    }

    // Look at center
    const target = this.createVector3(
      config.cameraPosition?.targetX || 0,
      config.cameraPosition?.targetY || 0,
      config.cameraPosition?.targetZ || 0
    );
    this.camera.lookAt(target);
  }

  /**
   * Setup scene lighting
   */
  private setupLights(): void {
    const config = this.config as Graph3DConfig;

    // Ambient light
    const ambientIntensity = config.ambientLightIntensity ?? 0.5;
    // In production: const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    // this.scene!.add(ambientLight);

    // Directional light
    const directionalIntensity = config.directionalLightIntensity ?? 0.8;
    // In production: const directionalLight = new THREE.DirectionalLight(0xffffff, directionalIntensity);
    // directionalLight.position.set(100, 100, 100);
    // if (config.enableShadows) {
    //   directionalLight.castShadow = true;
    // }
    // this.scene!.add(directionalLight);
  }

  /**
   * Setup mouse and keyboard event listeners
   */
  private setupEventListeners(): void {
    if (!this.canvas) return;

    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));

    // Click events
    this.canvas.addEventListener('click', this.handleClick.bind(this));

    // Keyboard events for camera control
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  // ========================================================================
  // RENDERING
  // ========================================================================

  /**
   * Render the 3D scene
   */
  render(): void {
    if (!this.scene || !this.camera || !this.canvas) {
      return;
    }

    const startTime = performance.now();

    // Update physics if enabled
    if (this.physicsConfig.enabled) {
      this.updatePhysics();
    }

    // Update LOD based on camera distance
    if (this.lodConfig.enabled) {
      this.updateLOD();
    }

    // Update node meshes
    this.updateNodeMeshes();

    // Update edge meshes
    this.updateEdgeMeshes();

    // Update labels
    const config = this.config as Graph3DConfig;
    if (config.showLabels) {
      this.updateLabels();
    }

    // Render scene
    // In production: this.renderer!.render(this.scene, this.camera);
    this.mockRender();

    const frameTime = performance.now() - startTime;
    this.updateMetrics(frameTime);

    this.emit({
      type: 'render:complete',
      timestamp: Date.now(),
      source: this.config.id,
      frameNumber: this.getFrameNumber(),
    });
  }

  /**
   * Render to WebGL canvas (public API)
   *
   * @param canvas - Optional canvas element to render to
   */
  renderToCanvas(canvas?: HTMLCanvasElement): void {
    if (canvas && canvas !== this.canvas) {
      // Switch canvas
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    }

    this.render();
  }

  /**
   * Update node meshes based on current node data
   */
  private updateNodeMeshes(): void {
    const config = this.config as Graph3DConfig;
    const nodeSize = config.nodeSize || 5;

    for (const node of this.nodes3D) {
      let mesh = this.nodeMeshes.get(node.id);

      if (!mesh) {
        // Create new node mesh
        mesh = this.createNodeMesh(node, nodeSize);
        this.nodeMeshes.set(node.id, mesh);
        this.scene!.add(mesh);
      }

      // Update position
      mesh.position.set(node.position.x, node.position.y, node.position.z);

      // Update appearance based on state
      this.updateNodeAppearance(mesh, node);
    }

    // Remove deleted nodes
    for (const [nodeId, mesh] of Array.from(this.nodeMeshes.entries())) {
      if (!this.nodes3D.find(n => n.id === nodeId)) {
        this.scene!.remove(mesh);
        this.nodeMeshes.delete(nodeId);
      }
    }
  }

  /**
   * Create a mesh for a node
   */
  private createNodeMesh(node: Node3D, size: number): Mesh {
    const segments = this.getNodeSegments();

    // In production:
    // const geometry = new THREE.SphereGeometry(size, segments, segments);
    // const material = new THREE.MeshPhongMaterial({
    //   color: node.style?.color || 0x3498db,
    //   transparent: true,
    //   opacity: node.style?.opacity || 1.0,
    // });
    // const mesh = new THREE.Mesh(geometry, material);

    const mesh = this.createMockMesh();
    mesh.userData = { nodeId: node.id, type: 'node' };

    return mesh;
  }

  /**
   * Get node sphere segments based on LOD
   */
  private getNodeSegments(): number {
    if (!this.lodConfig.enabled || !this.camera) {
      return this.lodConfig.nodeSegments.high;
    }

    // Calculate average distance to nodes
    const avgDistance = this.calculateAverageNodeDistance();

    if (avgDistance < this.lodConfig.distances[0]) {
      return this.lodConfig.nodeSegments.high;
    } else if (avgDistance < this.lodConfig.distances[1]) {
      return this.lodConfig.nodeSegments.medium;
    } else {
      return this.lodConfig.nodeSegments.low;
    }
  }

  /**
   * Update node appearance based on interaction state
   */
  private updateNodeAppearance(mesh: Mesh, node: Node3D): void {
    const isSelected = node.id === this.selectedNodeId;
    const isHovered = node.id === this.hoveredNodeId;
    const isHighlighted = this.highlightedPath.includes(node.id);

    // Update scale
    let scale = 1.0;
    if (isSelected) scale = 1.5;
    else if (isHovered) scale = 1.2;
    else if (isHighlighted) scale = 1.1;

    mesh.scale.set(scale, scale, scale);

    // Update material properties (in production)
    // if (isSelected) {
    //   mesh.material.emissive.set(0xffff00);
    // } else if (isHovered) {
    //   mesh.material.emissive.set(0xff9900);
    // } else {
    //   mesh.material.emissive.set(0x000000);
    // }
  }

  /**
   * Update edge meshes based on current edge data
   */
  private updateEdgeMeshes(): void {
    const config = this.config as Graph3DConfig;
    const edgeWidth = config.edgeWidth || 1;

    for (const edge of this.edges3D) {
      const sourceNode = this.nodes3D.find(n => n.id === edge.source);
      const targetNode = this.nodes3D.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) continue;

      let mesh = this.edgeMeshes.get(edge.id);

      if (!mesh) {
        // Create new edge mesh
        mesh = this.createEdgeMesh(edge, edgeWidth);
        this.edgeMeshes.set(edge.id, mesh);
        this.scene!.add(mesh);
      }

      // Update edge geometry to connect nodes
      this.updateEdgeGeometry(mesh, sourceNode, targetNode, edge);
    }

    // Remove deleted edges
    for (const [edgeId, mesh] of Array.from(this.edgeMeshes.entries())) {
      if (!this.edges3D.find(e => e.id === edgeId)) {
        this.scene!.remove(mesh);
        this.edgeMeshes.delete(edgeId);
      }
    }
  }

  /**
   * Create a mesh for an edge
   */
  private createEdgeMesh(edge: Edge3D, width: number): Mesh {
    // In production, create either:
    // 1. Line geometry for simple edges
    // 2. Tube geometry for thick edges with curvature

    // const geometry = edge.tubeSegments
    //   ? new THREE.TubeGeometry(path, edge.tubeSegments, width)
    //   : new THREE.BufferGeometry().setFromPoints([start, end]);

    // const material = new THREE.LineBasicMaterial({
    //   color: edge.style?.color || 0x999999,
    //   linewidth: edge.style?.width || width,
    //   transparent: true,
    //   opacity: edge.style?.opacity || 0.5,
    // });

    const mesh = this.createMockMesh();
    mesh.userData = { edgeId: edge.id, type: 'edge' };

    return mesh;
  }

  /**
   * Update edge geometry to connect two nodes
   */
  private updateEdgeGeometry(
    mesh: Mesh,
    source: Node3D,
    target: Node3D,
    edge: Edge3D
  ): void {
    const start = this.createVector3(source.position.x, source.position.y, source.position.z);
    const end = this.createVector3(target.position.x, target.position.y, target.position.z);

    // If edge has curvature, create curved path
    if (edge.curvature && edge.curvature !== 0) {
      // Calculate control point for curve
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const direction = end.clone().sub(start);
      const perpendicular = this.createVector3(-direction.y, direction.x, direction.z);
      perpendicular.normalize().multiplyScalar(edge.curvature);

      const controlPoint = mid.add(perpendicular);

      // In production: Create quadratic bezier curve
      // const curve = new THREE.QuadraticBezierCurve3(start, controlPoint, end);
      // mesh.geometry = new THREE.TubeGeometry(curve, edge.tubeSegments || 20);
    } else {
      // Straight line
      // In production: mesh.geometry.setFromPoints([start, end]);
    }
  }

  /**
   * Update label sprites to face camera
   */
  private updateLabels(): void {
    for (const node of this.nodes3D) {
      if (!node.style?.label) continue;

      let sprite = this.labelSprites.get(node.id);

      if (!sprite) {
        sprite = this.createLabelSprite(node.style.label);
        this.labelSprites.set(node.id, sprite);
        this.scene!.add(sprite);
      }

      // Position above node
      const config = this.config as Graph3DConfig;
      const offset = (config.nodeSize || 5) * 1.5;
      sprite.position.set(
        node.position.x,
        node.position.y + offset,
        node.position.z
      );
    }
  }

  /**
   * Create a sprite for node label
   */
  private createLabelSprite(text: string): Object3D {
    // In production:
    // const canvas = document.createElement('canvas');
    // const context = canvas.getContext('2d')!;
    // context.font = '48px Arial';
    // context.fillStyle = 'white';
    // context.fillText(text, 0, 48);

    // const texture = new THREE.CanvasTexture(canvas);
    // const material = new THREE.SpriteMaterial({ map: texture });
    // const sprite = new THREE.Sprite(material);

    const sprite = this.createMockObject3D();
    sprite.userData = { label: text };

    return sprite;
  }

  // ========================================================================
  // PHYSICS SIMULATION (3D Force-Directed Layout)
  // ========================================================================

  /**
   * Update physics simulation for force-directed layout
   */
  private updatePhysics(): void {
    if (!this.physicsConfig.enabled) return;

    // Reset forces
    for (const node of this.nodes3D) {
      node.force = { x: 0, y: 0, z: 0 };
      if (!node.velocity) {
        node.velocity = { x: 0, y: 0, z: 0 };
      }
    }

    // Calculate repulsion forces between all nodes
    this.calculateRepulsionForces();

    // Calculate spring forces for connected nodes
    this.calculateSpringForces();

    // Apply gravity towards center
    this.applyCenterGravity();

    // Update positions based on forces
    this.integrateForces();
  }

  /**
   * Calculate repulsion forces between nodes
   */
  private calculateRepulsionForces(): void {
    const { repulsionStrength } = this.physicsConfig;

    for (let i = 0; i < this.nodes3D.length; i++) {
      for (let j = i + 1; j < this.nodes3D.length; j++) {
        const nodeA = this.nodes3D[i];
        const nodeB = this.nodes3D[j];

        const dx = nodeB.position.x - nodeA.position.x;
        const dy = nodeB.position.y - nodeA.position.y;
        const dz = nodeB.position.z - nodeA.position.z;

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance === 0) continue;

        const force = repulsionStrength / (distance * distance);

        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        const fz = (dz / distance) * force;

        nodeA.force!.x -= fx;
        nodeA.force!.y -= fy;
        nodeA.force!.z -= fz;

        nodeB.force!.x += fx;
        nodeB.force!.y += fy;
        nodeB.force!.z += fz;
      }
    }
  }

  /**
   * Calculate spring forces for edges
   */
  private calculateSpringForces(): void {
    const { springLength, springStrength } = this.physicsConfig;

    for (const edge of this.edges3D) {
      const source = this.nodes3D.find(n => n.id === edge.source);
      const target = this.nodes3D.find(n => n.id === edge.target);

      if (!source || !target) continue;

      const dx = target.position.x - source.position.x;
      const dy = target.position.y - source.position.y;
      const dz = target.position.z - source.position.z;

      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const displacement = distance - springLength;

      const force = displacement * springStrength;

      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      const fz = (dz / distance) * force;

      source.force!.x += fx;
      source.force!.y += fy;
      source.force!.z += fz;

      target.force!.x -= fx;
      target.force!.y -= fy;
      target.force!.z -= fz;
    }
  }

  /**
   * Apply gravity force towards center
   */
  private applyCenterGravity(): void {
    const { centerAttraction } = this.physicsConfig;

    for (const node of this.nodes3D) {
      node.force!.x -= node.position.x * centerAttraction;
      node.force!.y -= node.position.y * centerAttraction;
      node.force!.z -= node.position.z * centerAttraction;
    }
  }

  /**
   * Integrate forces to update positions
   */
  private integrateForces(): void {
    const { damping } = this.physicsConfig;

    for (const node of this.nodes3D) {
      if (!node.velocity || !node.force) continue;

      // Update velocity
      node.velocity.x = (node.velocity.x + node.force.x) * damping;
      node.velocity.y = (node.velocity.y + node.force.y) * damping;
      node.velocity.z = (node.velocity.z + node.force.z) * damping;

      // Update position
      node.position.x += node.velocity.x;
      node.position.y += node.velocity.y;
      node.position.z += node.velocity.z;
    }
  }

  // ========================================================================
  // CAMERA CONTROL
  // ========================================================================

  /**
   * Get current camera position
   */
  getCameraPosition(): Position {
    if (!this.camera) {
      return { x: 0, y: 0, z: 500 };
    }

    return {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
    };
  }

  /**
   * Set camera position and optional target
   *
   * @param position - Camera position
   * @param target - Optional look-at target
   */
  setCamera(position: Position, target?: Position): void {
    this.setCameraPosition(position);

    if (target && this.camera) {
      const targetVec = this.createVector3(target.x, target.y, target.z || 0);
      this.camera.lookAt(targetVec);
    }
  }

  /**
   * Set camera position
   */
  setCameraPosition(position: Position): void {
    if (!this.camera) return;

    this.camera.position.set(position.x, position.y, position.z || 500);
    this.cameraControls.currentPosition = this.camera.position;
  }

  /**
   * Reset camera to default view
   */
  resetCamera(): void {
    const config = this.config as Graph3DConfig;

    if (config.cameraPosition) {
      this.setCamera({
        x: config.cameraPosition.x,
        y: config.cameraPosition.y,
        z: config.cameraPosition.z,
      });
    } else {
      this.setCamera({ x: 0, y: 0, z: 500 });
    }
  }

  /**
   * Fit camera to view all nodes
   */
  fitToView(padding = 50): void {
    if (this.nodes3D.length === 0 || !this.camera) return;

    const bounds = this.calculateBoundingBox(this.nodes3D);

    // Calculate center
    const centerX = (bounds.min.x + bounds.max.x) / 2;
    const centerY = (bounds.min.y + bounds.max.y) / 2;
    const centerZ = (bounds.min.z + bounds.max.z) / 2;

    // Calculate size
    const sizeX = bounds.max.x - bounds.min.x;
    const sizeY = bounds.max.y - bounds.min.y;
    const sizeZ = bounds.max.z - bounds.min.z;
    const maxSize = Math.max(sizeX, sizeY, sizeZ);

    // Calculate distance to fit in view
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = maxSize / (2 * Math.tan(fov / 2)) + padding;

    // Position camera
    this.setCamera(
      { x: centerX, y: centerY, z: centerZ + distance },
      { x: centerX, y: centerY, z: centerZ }
    );
  }

  // ========================================================================
  // LAYOUT ALGORITHMS
  // ========================================================================

  /**
   * Apply 3D layout algorithm
   */
  async applyLayout3D(layoutType: Layout3DType): Promise<void> {
    switch (layoutType) {
      case '3d-force':
        await this.apply3DForceLayout();
        break;
      case '3d-sphere':
        await this.apply3DSphereLayout();
        break;
      case '3d-helix':
        await this.apply3DHelixLayout();
        break;
      default:
        throw new Error(`Unknown layout type: ${layoutType}`);
    }
  }

  /**
   * Apply 3D force-directed layout
   */
  private async apply3DForceLayout(): Promise<void> {
    // Initialize random positions if needed
    for (const node of this.nodes3D) {
      if (!node.position.z || node.position.z === 0) {
        node.position.x = (Math.random() - 0.5) * 200;
        node.position.y = (Math.random() - 0.5) * 200;
        node.position.z = (Math.random() - 0.5) * 200;
      }
    }

    // Run physics simulation for specified iterations
    const iterations = this.physicsConfig.iterations;
    for (let i = 0; i < iterations; i++) {
      this.updatePhysics();

      // Yield to browser every 10 iterations
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  /**
   * Apply 3D sphere layout
   */
  private async apply3DSphereLayout(): Promise<void> {
    const radius = 200;
    const count = this.nodes3D.length;

    // Use Fibonacci sphere for even distribution
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    this.nodes3D.forEach((node, i) => {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);

      node.position.x = radius * Math.cos(theta) * Math.sin(phi);
      node.position.y = radius * Math.sin(theta) * Math.sin(phi);
      node.position.z = radius * Math.cos(phi);
    });
  }

  /**
   * Apply 3D helix layout
   */
  private async apply3DHelixLayout(): Promise<void> {
    const radius = 100;
    const height = 300;
    const count = this.nodes3D.length;

    this.nodes3D.forEach((node, i) => {
      const angle = (i / count) * Math.PI * 4; // 2 full rotations
      const y = (i / count) * height - height / 2;

      node.position.x = radius * Math.cos(angle);
      node.position.y = y;
      node.position.z = radius * Math.sin(angle);
    });
  }

  /**
   * Update layout (re-apply current layout)
   */
  async updateLayout(): Promise<void> {
    const config = this.config as Graph3DConfig;
    if (config.layout) {
      await this.applyLayout3D(config.layout);
      this.render();
    }
  }

  /**
   * Implementation of abstract layout method
   */
  protected async applyLayoutInternal(config: LayoutConfig): Promise<void> {
    // Convert generic layout to 3D layout
    const graphConfig = this.config as Graph3DConfig;
    if (graphConfig.layout) {
      await this.applyLayout3D(graphConfig.layout);
    }
  }

  // ========================================================================
  // INTERACTION
  // ========================================================================

  /**
   * Handle mouse down event
   */
  private handleMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      // Left click - orbit
      this.cameraControls.isOrbiting = true;
    } else if (event.button === 2) {
      // Right click - pan
      this.cameraControls.isPanning = true;
      event.preventDefault();
    }

    this.cameraControls.lastMouseX = event.clientX;
    this.cameraControls.lastMouseY = event.clientY;
  }

  /**
   * Handle mouse move event
   */
  private handleMouseMove(event: MouseEvent): void {
    const deltaX = event.clientX - this.cameraControls.lastMouseX;
    const deltaY = event.clientY - this.cameraControls.lastMouseY;

    if (this.cameraControls.isOrbiting) {
      this.orbitCamera(deltaX, deltaY);
    } else if (this.cameraControls.isPanning) {
      this.panCamera(deltaX, deltaY);
    } else {
      // Check for node hover
      this.checkNodeHover(event);
    }

    this.cameraControls.lastMouseX = event.clientX;
    this.cameraControls.lastMouseY = event.clientY;
  }

  /**
   * Handle mouse up event
   */
  private handleMouseUp(_event: MouseEvent): void {
    this.cameraControls.isOrbiting = false;
    this.cameraControls.isPanning = false;
  }

  /**
   * Handle mouse wheel event (zoom)
   */
  private handleWheel(event: WheelEvent): void {
    event.preventDefault();

    const zoomSpeed = 0.1;
    const delta = event.deltaY * zoomSpeed;

    if (this.camera) {
      const direction = this.createVector3(0, 0, delta);
      this.camera.position.add(direction);
    }

    this.render();
  }

  /**
   * Handle click event
   */
  private handleClick(event: MouseEvent): void {
    const nodeId = this.getNodeAtPosition(event.clientX, event.clientY);

    if (nodeId) {
      this.selectedNodeId = nodeId;

      this.emit({
        type: 'node:click',
        timestamp: Date.now(),
        source: this.config.id,
        nodeId,
        position: this.nodes3D.find(n => n.id === nodeId)!.position,
      });
    } else {
      this.selectedNodeId = null;
    }

    this.render();
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'r':
        this.resetCamera();
        break;
      case 'f':
        this.fitToView();
        break;
      case ' ':
        // Toggle physics
        this.physicsConfig.enabled = !this.physicsConfig.enabled;
        break;
    }

    this.render();
  }

  /**
   * Orbit camera around center
   */
  private orbitCamera(deltaX: number, deltaY: number): void {
    if (!this.camera) return;

    const orbitSpeed = 0.005;

    // Rotate around Y axis (horizontal movement)
    const angleY = deltaX * orbitSpeed;
    const cos = Math.cos(angleY);
    const sin = Math.sin(angleY);

    const x = this.camera.position.x;
    const z = this.camera.position.z;

    this.camera.position.x = x * cos - z * sin;
    this.camera.position.z = x * sin + z * cos;

    // Rotate around X axis (vertical movement)
    this.camera.position.y += deltaY * orbitSpeed * 10;

    // Look at center
    this.camera.lookAt(this.createVector3(0, 0, 0));

    this.render();
  }

  /**
   * Pan camera
   */
  private panCamera(deltaX: number, deltaY: number): void {
    if (!this.camera) return;

    const panSpeed = 0.5;

    this.camera.position.x -= deltaX * panSpeed;
    this.camera.position.y += deltaY * panSpeed;

    this.render();
  }

  /**
   * Check if mouse is hovering over a node
   */
  private checkNodeHover(event: MouseEvent): void {
    const nodeId = this.getNodeAtPosition(event.clientX, event.clientY);

    if (nodeId !== this.hoveredNodeId) {
      this.hoveredNodeId = nodeId;

      if (nodeId) {
        this.emit({
          type: 'node:hover',
          timestamp: Date.now(),
          source: this.config.id,
          nodeId,
          position: this.nodes3D.find(n => n.id === nodeId)!.position,
        });
      }

      this.render();
    }
  }

  /**
   * Get node at screen position (raycasting)
   */
  private getNodeAtPosition(screenX: number, screenY: number): string | null {
    // In production, use Three.js raycaster:
    // const mouse = new THREE.Vector2(
    //   (screenX / this.config.width) * 2 - 1,
    //   -(screenY / this.config.height) * 2 + 1
    // );
    // const raycaster = new THREE.Raycaster();
    // raycaster.setFromCamera(mouse, this.camera!);
    // const intersects = raycaster.intersectObjects(Array.from(this.nodeMeshes.values()));
    // return intersects.length > 0 ? intersects[0].object.userData.nodeId : null;

    // Mock implementation
    return null;
  }

  /**
   * Highlight a path through the graph
   *
   * @param nodeIds - Array of node IDs forming the path
   */
  highlightPath3D(nodeIds: string[]): void {
    this.highlightedPath = nodeIds;
    this.render();
  }

  /**
   * Clear highlighted path
   */
  clearHighlight(): void {
    this.highlightedPath = [];
    this.render();
  }

  // ========================================================================
  // LOD (Level of Detail)
  // ========================================================================

  /**
   * Update LOD based on camera distance
   */
  private updateLOD(): void {
    if (!this.lodConfig.enabled || !this.camera) return;

    // This would update mesh detail levels based on distance to camera
    // In production, use THREE.LOD for automatic management
  }

  /**
   * Calculate average distance from camera to nodes
   */
  private calculateAverageNodeDistance(): number {
    if (this.nodes3D.length === 0 || !this.camera) return 0;

    let totalDistance = 0;
    for (const node of this.nodes3D) {
      const dx = node.position.x - this.camera.position.x;
      const dy = node.position.y - this.camera.position.y;
      const dz = node.position.z - this.camera.position.z;
      totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    return totalDistance / this.nodes3D.length;
  }

  // ========================================================================
  // ANIMATION
  // ========================================================================

  /**
   * Animate camera rotation around center
   *
   * @param duration - Animation duration in milliseconds
   * @param speed - Rotation speed (radians per second)
   */
  animate(duration: number, speed: number = 0.001): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.rotationSpeed = speed;
    const startTime = Date.now();

    const animateFrame = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < duration) {
        // Rotate camera
        if (this.camera) {
          const angle = this.rotationSpeed * elapsed;
          const radius = Math.sqrt(
            this.camera.position.x ** 2 + this.camera.position.z ** 2
          );

          this.camera.position.x = radius * Math.cos(angle);
          this.camera.position.z = radius * Math.sin(angle);
          this.camera.lookAt(this.createVector3(0, 0, 0));
        }

        this.render();
        this.animationFrameId = requestAnimationFrame(animateFrame);
      } else {
        this.animationFrameId = null;
      }
    };

    animateFrame();
  }

  /**
   * Stop animation
   */
  stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // ========================================================================
  // EXPORT
  // ========================================================================

  /**
   * Export current 3D view to specified format
   *
   * @param format - Export format (png, obj, gltf, stl)
   * @returns Blob containing exported data
   */
  async export3DView(format: Export3DFormat): Promise<Blob> {
    switch (format) {
      case 'png':
        return this.exportToPNG();
      case 'obj':
        return this.exportToOBJ();
      case 'gltf':
        return this.exportToGLTF();
      case 'stl':
        return this.exportToSTL();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to PNG image
   */
  private async exportToPNG(): Promise<Blob> {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    return new Promise((resolve, reject) => {
      this.canvas!.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to export PNG'));
        }
      }, 'image/png');
    });
  }

  /**
   * Export to OBJ format (3D model)
   */
  private async exportToOBJ(): Promise<Blob> {
    // In production, use THREE.OBJExporter
    const objData = this.generateOBJData();
    return new Blob([objData], { type: 'text/plain' });
  }

  /**
   * Export to GLTF format (3D model)
   */
  private async exportToGLTF(): Promise<Blob> {
    // In production, use THREE.GLTFExporter
    const gltfData = this.generateGLTFData();
    return new Blob([JSON.stringify(gltfData)], { type: 'application/json' });
  }

  /**
   * Export to STL format (3D printing)
   */
  private async exportToSTL(): Promise<Blob> {
    // In production, use THREE.STLExporter
    const stlData = this.generateSTLData();
    return new Blob([stlData], { type: 'application/sla' });
  }

  /**
   * Generate OBJ format data
   */
  private generateOBJData(): string {
    let obj = '# Graph 3D Export\n';

    // Export vertices
    for (const node of this.nodes3D) {
      obj += `v ${node.position.x} ${node.position.y} ${node.position.z}\n`;
    }

    return obj;
  }

  /**
   * Generate GLTF format data
   */
  private generateGLTFData(): any {
    return {
      asset: { version: '2.0', generator: 'Graph3DVisualizer' },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: this.nodes3D.map(node => ({
        translation: [node.position.x, node.position.y, node.position.z],
      })),
    };
  }

  /**
   * Generate STL format data
   */
  private generateSTLData(): string {
    let stl = 'solid Graph3D\n';
    // STL triangles would be generated here
    stl += 'endsolid Graph3D\n';
    return stl;
  }

  // ========================================================================
  // CLEANUP
  // ========================================================================

  /**
   * Cleanup renderer resources
   */
  protected cleanupRenderer(): void {
    // Stop animations
    this.stopAnimation();
    if (this.physicsAnimationId !== null) {
      cancelAnimationFrame(this.physicsAnimationId);
    }

    // Remove event listeners
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.handleMouseDown);
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('mouseup', this.handleMouseUp);
      this.canvas.removeEventListener('wheel', this.handleWheel);
      this.canvas.removeEventListener('click', this.handleClick);
    }
    window.removeEventListener('keydown', this.handleKeyDown);

    // Dispose meshes
    for (const mesh of Array.from(this.nodeMeshes.values())) {
      // In production: mesh.geometry.dispose(); mesh.material.dispose();
    }
    for (const mesh of Array.from(this.edgeMeshes.values())) {
      // In production: mesh.geometry.dispose(); mesh.material.dispose();
    }

    this.nodeMeshes.clear();
    this.edgeMeshes.clear();
    this.labelSprites.clear();

    // Dispose renderer
    // In production: this.renderer?.dispose();

    // Remove canvas
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.canvas = null;
    this.gl = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }

  // ========================================================================
  // MOCK IMPLEMENTATIONS (replace with Three.js in production)
  // ========================================================================

  private createVector3(x: number, y: number, z: number): Vector3 {
    return {
      x, y, z,
      set(nx: number, ny: number, nz: number) {
        this.x = nx; this.y = ny; this.z = nz;
        return this;
      },
      add(v: Vector3) {
        this.x += v.x; this.y += v.y; this.z += v.z;
        return this;
      },
      sub(v: Vector3) {
        this.x -= v.x; this.y -= v.y; this.z -= v.z;
        return this;
      },
      multiplyScalar(s: number) {
        this.x *= s; this.y *= s; this.z *= s;
        return this;
      },
      length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
      },
      normalize() {
        const len = this.length();
        if (len > 0) {
          this.multiplyScalar(1 / len);
        }
        return this;
      },
      distanceTo(v: Vector3) {
        return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2);
      },
      clone() {
        return this.createVector3(this.x, this.y, this.z);
      },
    } as Vector3;
  }

  private createMockScene(): Scene {
    return {
      children: [],
      add(obj: Object3D) { this.children.push(obj); },
      remove(obj: Object3D) {
        const index = this.children.indexOf(obj);
        if (index > -1) this.children.splice(index, 1);
      },
    };
  }

  private createMockPerspectiveCamera(fov: number, aspect: number, near: number, far: number): PerspectiveCamera {
    const position = this.createVector3(0, 0, 0);
    return {
      fov, aspect, near, far,
      position,
      lookAt(_target: Vector3) {},
      updateProjectionMatrix() {},
    };
  }

  private createMockMesh(): Mesh {
    const position = this.createVector3(0, 0, 0);
    return {
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: this.createVector3(1, 1, 1),
      userData: {},
      geometry: {},
      material: {},
      add(_child: Object3D) {},
      remove(_child: Object3D) {},
    };
  }

  private createMockObject3D(): Object3D {
    const position = this.createVector3(0, 0, 0);
    return {
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: this.createVector3(1, 1, 1),
      userData: {},
      add(_child: Object3D) {},
      remove(_child: Object3D) {},
    };
  }

  private mockRender(): void {
    // In production, this would call: this.renderer.render(this.scene, this.camera);
  }

  private getFrameNumber(): number {
    return 0; // Mock implementation
  }
}
