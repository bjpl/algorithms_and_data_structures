/**
 * Visualization Factory
 *
 * Factory pattern for creating visualization instances with all dependencies.
 * Provides convenient creation methods for common use cases.
 */

import type {
  IVisualizationFactory,
  IVisualization,
  IAnimationController,
  IAlgorithmExecutor,
  IExporter,
  IThemeProvider,
} from './interfaces';
import type { VisualizationConfig, AnimationConfig } from './types';
import { AnimationController } from './animation-controller';
import { AlgorithmExecutor } from './algorithm-executor';
import { ThemeProvider } from './theme-provider';
import { Exporter } from './Exporter';

/**
 * Visualization factory implementation
 */
export class VisualizationFactory implements IVisualizationFactory {
  private visualizationConstructor: new (config: VisualizationConfig) => IVisualization;

  /**
   * Create factory for specific visualization type
   * @param VisualizationClass - Constructor for concrete visualization implementation
   */
  constructor(
    VisualizationClass: new (config: VisualizationConfig) => IVisualization
  ) {
    this.visualizationConstructor = VisualizationClass;
  }

  /**
   * Create basic visualization instance
   */
  create(config: VisualizationConfig): IVisualization {
    return new this.visualizationConstructor(config);
  }

  /**
   * Create visualization with animation controller
   */
  createWithAnimation(
    config: VisualizationConfig,
    animationConfig?: AnimationConfig
  ): {
    visualization: IVisualization;
    animation: IAnimationController;
  } {
    const visualization = this.create(config);
    const animation = new AnimationController(animationConfig);

    // Wire up animation controller to visualization
    (visualization as any).setAnimationController?.(animation);

    return { visualization, animation };
  }

  /**
   * Create visualization with algorithm executor
   */
  createWithExecutor(config: VisualizationConfig): {
    visualization: IVisualization;
    executor: IAlgorithmExecutor;
  } {
    const visualization = this.create(config);
    const executor = new AlgorithmExecutor();

    // Wire up executor to visualization
    executor.setVisualization(visualization);
    (visualization as any).setAlgorithmExecutor?.(executor);

    return { visualization, executor };
  }

  /**
   * Create complete visualization system with all features
   */
  createComplete(
    config: VisualizationConfig,
    animationConfig?: AnimationConfig
  ): {
    visualization: IVisualization;
    animation: IAnimationController;
    executor: IAlgorithmExecutor;
    exporter: IExporter;
    theme: IThemeProvider;
  } {
    const visualization = this.create(config);
    const animation = new AnimationController(animationConfig);
    const executor = new AlgorithmExecutor();
    const exporter = new Exporter({}) as any as IExporter;
    const theme = new ThemeProvider();

    // Wire up all components
    (visualization as any).setAnimationController?.(animation);
    executor.setVisualization(visualization);
    (visualization as any).setAlgorithmExecutor?.(executor);

    // Apply theme to visualization if supported
    if (config.backgroundColor === undefined) {
      config.backgroundColor = theme.getColor('background');
    }

    return {
      visualization,
      animation,
      executor,
      exporter,
      theme,
    };
  }

  /**
   * Create visualization from saved state
   */
  createFromState(
    config: VisualizationConfig,
    stateData: {
      nodes: any[];
      edges: any[];
      steps?: any[];
      currentStepIndex?: number;
    }
  ): {
    visualization: IVisualization;
    executor: IAlgorithmExecutor;
  } {
    const { visualization, executor } = this.createWithExecutor(config);

    // Restore data
    visualization.setData(stateData.nodes, stateData.edges);

    // Restore execution steps if available
    if (stateData.steps) {
      const restoredExecutor = AlgorithmExecutor.fromJSON({
        steps: stateData.steps,
        currentStepIndex: stateData.currentStepIndex,
      });

      restoredExecutor.setVisualization(visualization);
      (visualization as any).setAlgorithmExecutor?.(restoredExecutor);

      return { visualization, executor: restoredExecutor };
    }

    return { visualization, executor };
  }
}

/**
 * Convenience function to create factory for specific visualization type
 */
export function createFactory<T extends IVisualization>(
  VisualizationClass: new (config: VisualizationConfig) => T
): IVisualizationFactory {
  return new VisualizationFactory(VisualizationClass);
}
