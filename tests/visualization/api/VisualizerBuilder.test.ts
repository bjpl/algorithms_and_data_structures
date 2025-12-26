/**
 * VisualizerBuilder Tests
 *
 * Test suite for builder pattern functionality.
 */

import { describe, it, expect } from 'vitest';
import { VisualizerBuilder } from '../../../src/visualization/api/VisualizerBuilder';

describe('VisualizerBuilder', () => {
  // ==========================================================================
  // TYPE SELECTION TESTS
  // ==========================================================================

  describe('Type Selection', () => {
    it('should set visualizer type', () => {
      const builder = new VisualizerBuilder().ofType('graph');
      const state = builder.getState();

      expect(state.type).toBe('graph');
    });

    it('should create sorting visualizer', () => {
      const builder = new VisualizerBuilder().sorting();
      const state = builder.getState();

      expect(state.type).toBe('sorting');
      expect(state.config.renderMode).toBe('2d');
    });

    it('should create graph visualizer', () => {
      const builder = new VisualizerBuilder().graph();
      const state = builder.getState();

      expect(state.type).toBe('graph');
    });

    it('should create tree visualizer', () => {
      const builder = new VisualizerBuilder().tree();
      const state = builder.getState();

      expect(state.type).toBe('tree');
    });

    it('should create 3D graph visualizer', () => {
      const builder = new VisualizerBuilder().graph3D();
      const state = builder.getState();

      expect(state.type).toBe('graph3d');
      expect(state.config.renderMode).toBe('3d');
    });
  });

  // ==========================================================================
  // BASIC CONFIGURATION TESTS
  // ==========================================================================

  describe('Basic Configuration', () => {
    it('should set ID', () => {
      const builder = new VisualizerBuilder().withId('test-viz');
      const state = builder.getState();

      expect(state.config.id).toBe('test-viz');
    });

    it('should set title', () => {
      const builder = new VisualizerBuilder().withTitle('My Graph');
      const state = builder.getState();

      expect(state.config.title).toBe('My Graph');
    });

    it('should set dimensions', () => {
      const builder = new VisualizerBuilder().withDimensions(1024, 768);
      const state = builder.getState();

      expect(state.config.width).toBe(1024);
      expect(state.config.height).toBe(768);
    });

    it('should set width and height separately', () => {
      const builder = new VisualizerBuilder()
        .withWidth(1920)
        .withHeight(1080);

      const state = builder.getState();

      expect(state.config.width).toBe(1920);
      expect(state.config.height).toBe(1080);
    });

    it('should set background color', () => {
      const builder = new VisualizerBuilder().withBackground('#000000');
      const state = builder.getState();

      expect(state.config.backgroundColor).toBe('#000000');
    });

    it('should enable auto-scale', () => {
      const builder = new VisualizerBuilder().withAutoScale(true);
      const state = builder.getState();

      expect(state.config.autoScale).toBe(true);
    });

    it('should set padding', () => {
      const builder = new VisualizerBuilder().withPadding(10, 20, 30, 40);
      const state = builder.getState();

      expect(state.config.padding).toEqual({
        top: 10,
        right: 20,
        bottom: 30,
        left: 40,
      });
    });

    it('should set uniform padding', () => {
      const builder = new VisualizerBuilder().withPadding(20);
      const state = builder.getState();

      expect(state.config.padding).toEqual({
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      });
    });
  });

  // ==========================================================================
  // RENDER MODE TESTS
  // ==========================================================================

  describe('Render Mode', () => {
    it('should set 2D mode', () => {
      const builder = new VisualizerBuilder().with2DMode();
      const state = builder.getState();

      expect(state.config.renderMode).toBe('2d');
    });

    it('should set 3D mode', () => {
      const builder = new VisualizerBuilder().with3DMode();
      const state = builder.getState();

      expect(state.config.renderMode).toBe('3d');
    });
  });

  // ==========================================================================
  // ANIMATION CONFIGURATION TESTS
  // ==========================================================================

  describe('Animation Configuration', () => {
    it('should set animation duration', () => {
      const builder = new VisualizerBuilder().withAnimationDuration(1000);
      const state = builder.getState();

      expect(state.animation?.duration).toBe(1000);
    });

    it('should set animation easing', () => {
      const builder = new VisualizerBuilder().withAnimationEasing('ease-in');
      const state = builder.getState();

      expect(state.animation?.easing).toBe('ease-in');
    });

    it('should enable auto-play', () => {
      const builder = new VisualizerBuilder().withAutoPlay(true);
      const state = builder.getState();

      expect(state.animation?.autoPlay).toBe(true);
    });
  });

  // ==========================================================================
  // LAYOUT CONFIGURATION TESTS
  // ==========================================================================

  describe('Layout Configuration', () => {
    it('should set layout algorithm', () => {
      const builder = new VisualizerBuilder().withLayoutAlgorithm('hierarchical');
      const state = builder.getState();

      expect(state.layout?.algorithm).toBe('hierarchical');
    });

    it('should use force-directed layout', () => {
      const builder = new VisualizerBuilder().withForceDirectedLayout({
        forceDirected: {
          springLength: 100,
        },
      });

      const state = builder.getState();

      expect(state.layout?.algorithm).toBe('force-directed');
      expect(state.layout?.options?.forceDirected?.springLength).toBe(100);
    });

    it('should use hierarchical layout', () => {
      const builder = new VisualizerBuilder().withHierarchicalLayout('LR');
      const state = builder.getState();

      expect(state.layout?.algorithm).toBe('hierarchical');
      expect(state.layout?.options?.hierarchical?.direction).toBe('LR');
    });

    it('should use circular layout', () => {
      const builder = new VisualizerBuilder().withCircularLayout(200);
      const state = builder.getState();

      expect(state.layout?.algorithm).toBe('circular');
      expect(state.layout?.options?.circular?.radius).toBe(200);
    });
  });

  // ==========================================================================
  // DATA CONFIGURATION TESTS
  // ==========================================================================

  describe('Data Configuration', () => {
    it('should set nodes and edges', () => {
      const nodes = [
        { id: '1', data: {}, position: { x: 0, y: 0 } },
        { id: '2', data: {}, position: { x: 100, y: 100 } },
      ];

      const edges = [{ id: 'e1', source: '1', target: '2' }];

      const builder = new VisualizerBuilder().withData(nodes, edges);
      const state = builder.getState();

      expect(state.initialData?.nodes).toHaveLength(2);
      expect(state.initialData?.edges).toHaveLength(1);
    });

    it('should set nodes only', () => {
      const nodes = [
        { id: '1', data: {}, position: { x: 0, y: 0 } },
      ];

      const builder = new VisualizerBuilder().withNodes(nodes);
      const state = builder.getState();

      expect(state.initialData?.nodes).toHaveLength(1);
      expect(state.initialData?.edges).toBeUndefined();
    });
  });

  // ==========================================================================
  // METHOD CHAINING TESTS
  // ==========================================================================

  describe('Method Chaining', () => {
    it('should support fluent interface', () => {
      const builder = new VisualizerBuilder()
        .graph()
        .withId('chained-test')
        .withDimensions(800, 600)
        .withDarkTheme()
        .withAnimationDuration(500)
        .withForceDirectedLayout();

      const state = builder.getState();

      expect(state.type).toBe('graph');
      expect(state.config.id).toBe('chained-test');
      expect(state.config.width).toBe(800);
      expect(state.animation?.duration).toBe(500);
    });
  });

  // ==========================================================================
  // PRESET TESTS
  // ==========================================================================

  describe('Presets', () => {
    it('should apply default-sorting preset', () => {
      const builder = new VisualizerBuilder().withPreset('default-sorting');
      const state = builder.getState();

      expect(state.type).toBe('sorting');
      expect(state.config.renderMode).toBe('2d');
      expect(state.config.width).toBe(800);
    });

    it('should apply default-graph preset', () => {
      const builder = new VisualizerBuilder().withPreset('default-graph');
      const state = builder.getState();

      expect(state.type).toBe('graph');
      expect(state.layout?.algorithm).toBe('force-directed');
    });
  });

  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================

  describe('Validation', () => {
    it('should validate successfully with all required fields', () => {
      const builder = new VisualizerBuilder()
        .graph()
        .withDimensions(800, 600)
        .withId('valid-viz');

      const validation = builder.validate();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation without type', () => {
      const builder = new VisualizerBuilder()
        .withDimensions(800, 600);

      const validation = builder.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Visualizer type is required');
    });

    it('should fail validation without dimensions', () => {
      const builder = new VisualizerBuilder().graph();

      const validation = builder.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Width and height are required');
    });

    it('should warn about missing ID', () => {
      const builder = new VisualizerBuilder()
        .graph()
        .withDimensions(800, 600);

      const validation = builder.validate();

      expect(validation.warnings).toContain(
        'No ID specified, will generate default'
      );
    });

    it('should detect 3D/type mismatch', () => {
      const builder = new VisualizerBuilder()
        .graph()
        .with3DMode()
        .withDimensions(800, 600);

      const validation = builder.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        '3D render mode requires graph3d type'
      );
    });
  });

  // ==========================================================================
  // IMMUTABILITY TESTS
  // ==========================================================================

  describe('Immutability', () => {
    it('should create new instance on each method call', () => {
      const builder1 = new VisualizerBuilder();
      const builder2 = builder1.withId('test');

      expect(builder1).not.toBe(builder2);
    });

    it('should not mutate original state', () => {
      const builder1 = new VisualizerBuilder().withWidth(800);
      const state1 = builder1.getState();

      const builder2 = builder1.withWidth(1024);
      const state2 = builder2.getState();

      expect(state1.config.width).toBe(800);
      expect(state2.config.width).toBe(1024);
    });
  });

  // ==========================================================================
  // THEME TESTS
  // ==========================================================================

  describe('Theme Configuration', () => {
    it('should use dark theme', () => {
      const builder = new VisualizerBuilder().withDarkTheme();
      const state = builder.getState();

      expect(state.theme?.variant).toBe('dark');
    });

    it('should use light theme', () => {
      const builder = new VisualizerBuilder().withLightTheme();
      const state = builder.getState();

      expect(state.theme?.variant).toBe('light');
    });
  });
});
