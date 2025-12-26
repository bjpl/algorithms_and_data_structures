/**
 * @file Unit tests for AnimationController
 * @author Algorithm Visualization System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnimationController, AnimationState, AnimationConfig, AnimationEvent } from '../../../src/visualization/core/AnimationController';

describe('AnimationController', () => {
  let controller: AnimationController;
  let config: AnimationConfig;

  beforeEach(() => {
    vi.useFakeTimers();

    config = {
      duration: 1000,
      fps: 60,
      initialSpeed: 1,
      loop: false,
    };

    controller = new AnimationController(config);
  });

  afterEach(() => {
    controller.dispose();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with default state', () => {
      expect(controller.getState()).toBe('idle');
      expect(controller.getCurrentTime()).toBe(0);
      expect(controller.getSpeed()).toBe(1);
      expect(controller.getDuration()).toBe(1000);
    });

    it('should accept custom configuration', () => {
      const customController = new AnimationController({
        duration: 2000,
        fps: 30,
        initialSpeed: 2,
        loop: true,
      });

      expect(customController.getDuration()).toBe(2000);
      expect(customController.getSpeed()).toBe(2);

      customController.dispose();
    });
  });

  describe('playback controls', () => {
    it('should start playing', () => {
      controller.play();

      expect(controller.getState()).toBe('playing');
      expect(controller.isPlaying()).toBe(true);
    });

    it('should pause playback', () => {
      controller.play();
      controller.pause();

      expect(controller.getState()).toBe('paused');
      expect(controller.isPaused()).toBe(true);
    });

    it('should resume from pause', () => {
      controller.play();
      controller.pause();
      controller.resume();

      expect(controller.getState()).toBe('playing');
    });

    it('should stop and reset', () => {
      controller.play();
      vi.advanceTimersByTime(500);
      controller.stop();

      expect(controller.getState()).toBe('idle');
      expect(controller.getCurrentTime()).toBe(0);
    });

    it('should not play when already playing', () => {
      controller.play();
      const stateBefore = controller.getState();

      controller.play();

      expect(controller.getState()).toBe(stateBefore);
    });
  });

  describe('timeline navigation', () => {
    it('should seek to specific time', () => {
      controller.seek(500);

      expect(controller.getCurrentTime()).toBe(500);
    });

    it('should clamp seek to valid range', () => {
      controller.seek(-100);
      expect(controller.getCurrentTime()).toBe(0);

      controller.seek(2000);
      expect(controller.getCurrentTime()).toBe(1000);
    });

    it('should step forward', () => {
      const stepSize = 1000 / 60; // One frame at 60fps
      controller.stepForward();

      expect(controller.getCurrentTime()).toBeCloseTo(stepSize, 1);
    });

    it('should step backward', () => {
      controller.seek(500);
      const stepSize = 1000 / 60;

      controller.stepBackward();

      expect(controller.getCurrentTime()).toBeCloseTo(500 - stepSize, 1);
    });

    it('should not step beyond bounds', () => {
      controller.stepBackward();
      expect(controller.getCurrentTime()).toBe(0);

      controller.seek(1000);
      controller.stepForward();
      expect(controller.getCurrentTime()).toBe(1000);
    });

    it('should get progress as percentage', () => {
      expect(controller.getProgress()).toBe(0);

      controller.seek(500);
      expect(controller.getProgress()).toBe(0.5);

      controller.seek(1000);
      expect(controller.getProgress()).toBe(1);
    });
  });

  describe('speed control', () => {
    it('should change playback speed', () => {
      controller.setSpeed(2);
      expect(controller.getSpeed()).toBe(2);
    });

    it('should support slow motion', () => {
      controller.setSpeed(0.25);
      expect(controller.getSpeed()).toBe(0.25);
    });

    it('should support fast forward', () => {
      controller.setSpeed(4);
      expect(controller.getSpeed()).toBe(4);
    });

    it('should clamp speed to valid range', () => {
      controller.setSpeed(0.1);
      expect(controller.getSpeed()).toBe(0.25);

      controller.setSpeed(10);
      expect(controller.getSpeed()).toBe(4);
    });

    it('should affect playback rate', () => {
      controller.setSpeed(2);
      controller.play();

      vi.advanceTimersByTime(100);

      // At 2x speed, 100ms should advance time by 200ms
      expect(controller.getCurrentTime()).toBeGreaterThanOrEqual(190);
    });
  });

  describe('breakpoints', () => {
    it('should add breakpoint', () => {
      controller.addBreakpoint(500);

      expect(controller.getBreakpoints()).toContain(500);
    });

    it('should remove breakpoint', () => {
      controller.addBreakpoint(500);
      controller.removeBreakpoint(500);

      expect(controller.getBreakpoints()).not.toContain(500);
    });

    it('should clear all breakpoints', () => {
      controller.addBreakpoint(250);
      controller.addBreakpoint(500);
      controller.addBreakpoint(750);

      controller.clearBreakpoints();

      expect(controller.getBreakpoints()).toHaveLength(0);
    });

    it('should pause at breakpoint', () => {
      controller.addBreakpoint(500);

      const pauseListener = vi.fn();
      controller.on('pause', pauseListener);

      controller.play();
      vi.advanceTimersByTime(600);

      expect(controller.getState()).toBe('paused');
      expect(pauseListener).toHaveBeenCalled();
    });

    it('should not add duplicate breakpoints', () => {
      controller.addBreakpoint(500);
      controller.addBreakpoint(500);

      expect(controller.getBreakpoints().filter((b) => b === 500)).toHaveLength(1);
    });

    it('should sort breakpoints', () => {
      controller.addBreakpoint(750);
      controller.addBreakpoint(250);
      controller.addBreakpoint(500);

      const breakpoints = controller.getBreakpoints();

      expect(breakpoints).toEqual([250, 500, 750]);
    });
  });

  describe('frame control', () => {
    it('should advance by frame', () => {
      const frameDuration = 1000 / 60;

      controller.nextFrame();

      expect(controller.getCurrentTime()).toBeCloseTo(frameDuration, 1);
    });

    it('should go back by frame', () => {
      controller.seek(500);
      const frameDuration = 1000 / 60;

      controller.previousFrame();

      expect(controller.getCurrentTime()).toBeCloseTo(500 - frameDuration, 1);
    });

    it('should calculate correct frame number', () => {
      expect(controller.getCurrentFrame()).toBe(0);

      controller.seek(500);
      const expectedFrame = Math.floor((500 / 1000) * 60);

      expect(controller.getCurrentFrame()).toBe(expectedFrame);
    });

    it('should get total frame count', () => {
      expect(controller.getTotalFrames()).toBe(60);
    });
  });

  describe('loop mode', () => {
    it('should loop when enabled', () => {
      const loopController = new AnimationController({
        ...config,
        loop: true,
      });

      loopController.play();
      vi.advanceTimersByTime(1100);

      expect(loopController.getCurrentTime()).toBeLessThan(1000);
      expect(loopController.isPlaying()).toBe(true);

      loopController.dispose();
    });

    it('should stop at end when loop disabled', () => {
      controller.play();
      vi.advanceTimersByTime(1100);

      expect(controller.getCurrentTime()).toBe(1000);
      expect(controller.getState()).toBe('idle');
    });

    it('should toggle loop mode', () => {
      controller.setLoop(true);
      controller.play();
      vi.advanceTimersByTime(1100);

      expect(controller.isPlaying()).toBe(true);
    });
  });

  describe('events', () => {
    it('should emit play event', () => {
      const listener = vi.fn();
      controller.on('play', listener);

      controller.play();

      expect(listener).toHaveBeenCalled();
    });

    it('should emit pause event', () => {
      const listener = vi.fn();
      controller.on('pause', listener);

      controller.play();
      controller.pause();

      expect(listener).toHaveBeenCalled();
    });

    it('should emit stop event', () => {
      const listener = vi.fn();
      controller.on('stop', listener);

      controller.play();
      controller.stop();

      expect(listener).toHaveBeenCalled();
    });

    it('should emit seek event', () => {
      const listener = vi.fn();
      controller.on('seek', listener);

      controller.seek(500);

      expect(listener).toHaveBeenCalledWith({ time: 500 });
    });

    it('should emit update event during playback', () => {
      const listener = vi.fn();
      controller.on('update', listener);

      controller.play();
      vi.advanceTimersByTime(100);

      expect(listener).toHaveBeenCalled();
    });

    it('should emit complete event', () => {
      const listener = vi.fn();
      controller.on('complete', listener);

      controller.play();
      vi.advanceTimersByTime(1100);

      expect(listener).toHaveBeenCalled();
    });

    it('should emit speedChange event', () => {
      const listener = vi.fn();
      controller.on('speedChange', listener);

      controller.setSpeed(2);

      expect(listener).toHaveBeenCalledWith({ speed: 2 });
    });

    it('should emit breakpointHit event', () => {
      controller.addBreakpoint(500);
      const listener = vi.fn();
      controller.on('breakpointHit', listener);

      controller.play();
      vi.advanceTimersByTime(600);

      expect(listener).toHaveBeenCalledWith({ time: 500 });
    });
  });

  describe('performance', () => {
    it('should use requestAnimationFrame for smooth playback', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      controller.play();

      expect(rafSpy).toHaveBeenCalled();

      rafSpy.mockRestore();
    });

    it('should cleanup animation frame on stop', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      controller.play();
      controller.stop();

      expect(cancelSpy).toHaveBeenCalled();

      cancelSpy.mockRestore();
    });

    it('should throttle updates to target FPS', () => {
      const updateListener = vi.fn();
      controller.on('update', updateListener);

      controller.play();
      vi.advanceTimersByTime(1000);

      // Should have ~60 updates for 60fps over 1 second
      expect(updateListener).toHaveBeenCalledTimes(expect.any(Number));
      expect(updateListener.mock.calls.length).toBeGreaterThan(50);
      expect(updateListener.mock.calls.length).toBeLessThan(70);
    });
  });

  describe('time travel debugging', () => {
    it('should record state snapshots', () => {
      controller.enableTimeTravel();

      controller.play();
      vi.advanceTimersByTime(500);

      expect(controller.getSnapshotCount()).toBeGreaterThan(0);
    });

    it('should restore from snapshot', () => {
      controller.enableTimeTravel();

      controller.play();
      vi.advanceTimersByTime(500);
      const snapshot = controller.createSnapshot();

      controller.seek(1000);
      controller.restoreSnapshot(snapshot);

      expect(controller.getCurrentTime()).toBeCloseTo(500, -1);
    });

    it('should limit snapshot history', () => {
      controller.enableTimeTravel({ maxSnapshots: 10 });

      for (let i = 0; i < 20; i++) {
        controller.createSnapshot();
      }

      expect(controller.getSnapshotCount()).toBe(10);
    });
  });

  describe('memory management', () => {
    it('should cleanup event listeners on dispose', () => {
      const listener = vi.fn();
      controller.on('update', listener);

      controller.dispose();
      controller.play();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should cancel animation frame on dispose', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      controller.play();
      controller.dispose();

      expect(cancelSpy).toHaveBeenCalled();

      cancelSpy.mockRestore();
    });

    it('should clear all breakpoints on dispose', () => {
      controller.addBreakpoint(500);
      controller.dispose();

      expect(controller.getBreakpoints()).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid seek values', () => {
      expect(() => controller.seek(NaN)).toThrow();
      expect(() => controller.seek(Infinity)).toThrow();
    });

    it('should handle invalid speed values', () => {
      expect(() => controller.setSpeed(NaN)).toThrow();
      expect(() => controller.setSpeed(0)).toThrow();
      expect(() => controller.setSpeed(-1)).toThrow();
    });

    it('should handle invalid breakpoint values', () => {
      expect(() => controller.addBreakpoint(-100)).toThrow();
      expect(() => controller.addBreakpoint(2000)).toThrow();
    });
  });
});
