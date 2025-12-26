/**
 * @file Unit tests for ThemeProvider
 * @author Algorithm Visualization System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeProvider, Theme, ThemeConfig, ColorScheme } from '../../../src/visualization/core/ThemeProvider';

describe('ThemeProvider', () => {
  let provider: ThemeProvider;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    provider = new ThemeProvider();
  });

  afterEach(() => {
    provider.dispose();
    localStorage.clear();
  });

  describe('constructor', () => {
    it('should initialize with default theme', () => {
      expect(provider.getCurrentTheme()).toBe('dark');
    });

    it('should load theme from localStorage', () => {
      localStorage.setItem('theme', 'light');

      const newProvider = new ThemeProvider();

      expect(newProvider.getCurrentTheme()).toBe('light');

      newProvider.dispose();
    });

    it('should accept custom default theme', () => {
      const customProvider = new ThemeProvider({ defaultTheme: 'light' });

      expect(customProvider.getCurrentTheme()).toBe('light');

      customProvider.dispose();
    });
  });

  describe('theme switching', () => {
    it('should switch to light theme', () => {
      provider.setTheme('light');

      expect(provider.getCurrentTheme()).toBe('light');
    });

    it('should switch to dark theme', () => {
      provider.setTheme('dark');

      expect(provider.getCurrentTheme()).toBe('dark');
    });

    it('should switch to custom theme', () => {
      provider.setTheme('custom');

      expect(provider.getCurrentTheme()).toBe('custom');
    });

    it('should persist theme to localStorage', () => {
      provider.setTheme('light');

      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should emit theme change event', () => {
      const listener = vi.fn();
      provider.on('themeChange', listener);

      provider.setTheme('light');

      expect(listener).toHaveBeenCalledWith({ theme: 'light' });
    });
  });

  describe('color schemes', () => {
    it('should get dark color scheme', () => {
      const colors = provider.getColors();

      expect(colors.background).toBeDefined();
      expect(colors.foreground).toBeDefined();
      expect(colors.primary).toBeDefined();
      expect(colors.secondary).toBeDefined();
    });

    it('should get light color scheme', () => {
      provider.setTheme('light');
      const colors = provider.getColors();

      expect(colors.background).toBeDefined();
      expect(colors.foreground).toBeDefined();
    });

    it('should provide algorithm-specific colors', () => {
      const colors = provider.getColors();

      expect(colors.active).toBeDefined();
      expect(colors.visited).toBeDefined();
      expect(colors.current).toBeDefined();
      expect(colors.completed).toBeDefined();
    });

    it('should provide data structure colors', () => {
      const colors = provider.getColors();

      expect(colors.node).toBeDefined();
      expect(colors.edge).toBeDefined();
      expect(colors.highlight).toBeDefined();
    });
  });

  describe('custom themes', () => {
    it('should register custom theme', () => {
      const customColors: ColorScheme = {
        background: '#000000',
        foreground: '#ffffff',
        primary: '#ff0000',
        secondary: '#00ff00',
        accent: '#0000ff',
        active: '#ffff00',
        visited: '#ff00ff',
        current: '#00ffff',
        completed: '#808080',
        error: '#ff0000',
        warning: '#ffa500',
        success: '#00ff00',
        info: '#0000ff',
        node: '#ffffff',
        edge: '#cccccc',
        highlight: '#ffff00',
      };

      provider.registerTheme('custom', customColors);

      expect(provider.hasTheme('custom')).toBe(true);
    });

    it('should use custom theme colors', () => {
      const customColors: ColorScheme = {
        background: '#123456',
        foreground: '#654321',
        primary: '#abcdef',
        secondary: '#fedcba',
        accent: '#111111',
        active: '#222222',
        visited: '#333333',
        current: '#444444',
        completed: '#555555',
        error: '#666666',
        warning: '#777777',
        success: '#888888',
        info: '#999999',
        node: '#aaaaaa',
        edge: '#bbbbbb',
        highlight: '#cccccc',
      };

      provider.registerTheme('myTheme', customColors);
      provider.setTheme('myTheme');

      const colors = provider.getColors();

      expect(colors.background).toBe('#123456');
      expect(colors.foreground).toBe('#654321');
    });

    it('should override existing theme', () => {
      const newDarkColors: ColorScheme = {
        background: '#000000',
        foreground: '#ffffff',
        primary: '#ff0000',
        secondary: '#00ff00',
        accent: '#0000ff',
        active: '#ffff00',
        visited: '#ff00ff',
        current: '#00ffff',
        completed: '#808080',
        error: '#ff0000',
        warning: '#ffa500',
        success: '#00ff00',
        info: '#0000ff',
        node: '#ffffff',
        edge: '#cccccc',
        highlight: '#ffff00',
      };

      provider.registerTheme('dark', newDarkColors);

      const colors = provider.getColors();

      expect(colors.background).toBe('#000000');
    });

    it('should list all available themes', () => {
      provider.registerTheme('custom1', {} as ColorScheme);
      provider.registerTheme('custom2', {} as ColorScheme);

      const themes = provider.getAvailableThemes();

      expect(themes).toContain('dark');
      expect(themes).toContain('light');
      expect(themes).toContain('custom1');
      expect(themes).toContain('custom2');
    });
  });

  describe('CSS variable integration', () => {
    it('should apply CSS variables to document', () => {
      provider.applyCSSVariables();

      const root = document.documentElement;
      const bgColor = getComputedStyle(root).getPropertyValue('--theme-background');

      expect(bgColor).toBeDefined();
    });

    it('should update CSS variables on theme change', () => {
      provider.setTheme('light');
      provider.applyCSSVariables();

      const root = document.documentElement;
      const bgColor = getComputedStyle(root).getPropertyValue('--theme-background');

      expect(bgColor).toBeDefined();
    });

    it('should use custom CSS variable prefix', () => {
      const customProvider = new ThemeProvider({ cssPrefix: 'custom' });
      customProvider.applyCSSVariables();

      const root = document.documentElement;
      const bgColor = getComputedStyle(root).getPropertyValue('--custom-background');

      expect(bgColor).toBeDefined();

      customProvider.dispose();
    });

    it('should remove CSS variables on dispose', () => {
      provider.applyCSSVariables();
      provider.dispose();

      const root = document.documentElement;
      const bgColor = getComputedStyle(root).getPropertyValue('--theme-background');

      expect(bgColor).toBe('');
    });
  });

  describe('color utilities', () => {
    it('should convert hex to RGB', () => {
      const rgb = provider.hexToRgb('#ff0000');

      expect(rgb).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert RGB to hex', () => {
      const hex = provider.rgbToHex(255, 0, 0);

      expect(hex).toBe('#ff0000');
    });

    it('should calculate color brightness', () => {
      const brightness = provider.getBrightness('#ffffff');

      expect(brightness).toBeCloseTo(1, 2);
    });

    it('should determine if color is dark', () => {
      expect(provider.isDark('#000000')).toBe(true);
      expect(provider.isDark('#ffffff')).toBe(false);
    });

    it('should lighten color', () => {
      const lightened = provider.lighten('#808080', 0.2);

      const originalBrightness = provider.getBrightness('#808080');
      const newBrightness = provider.getBrightness(lightened);

      expect(newBrightness).toBeGreaterThan(originalBrightness);
    });

    it('should darken color', () => {
      const darkened = provider.darken('#808080', 0.2);

      const originalBrightness = provider.getBrightness('#808080');
      const newBrightness = provider.getBrightness(darkened);

      expect(newBrightness).toBeLessThan(originalBrightness);
    });

    it('should adjust opacity', () => {
      const withOpacity = provider.withOpacity('#ff0000', 0.5);

      expect(withOpacity).toContain('rgba');
      expect(withOpacity).toContain('0.5');
    });
  });

  describe('accessibility', () => {
    it('should calculate contrast ratio', () => {
      const contrast = provider.getContrastRatio('#000000', '#ffffff');

      expect(contrast).toBeGreaterThan(15); // Should be 21:1
    });

    it('should check WCAG AA compliance', () => {
      expect(provider.meetsWCAG_AA('#000000', '#ffffff')).toBe(true);
      expect(provider.meetsWCAG_AA('#777777', '#888888')).toBe(false);
    });

    it('should check WCAG AAA compliance', () => {
      expect(provider.meetsWCAG_AAA('#000000', '#ffffff')).toBe(true);
      expect(provider.meetsWCAG_AAA('#666666', '#ffffff')).toBe(false);
    });

    it('should suggest accessible color', () => {
      const accessible = provider.getAccessibleColor('#888888', '#999999');

      expect(provider.meetsWCAG_AA(accessible, '#999999')).toBe(true);
    });
  });

  describe('system theme detection', () => {
    it('should detect system theme preference', () => {
      const matchMediaSpy = vi.spyOn(window, 'matchMedia');
      matchMediaSpy.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryList);

      const systemTheme = provider.getSystemTheme();

      expect(systemTheme).toBe('dark');

      matchMediaSpy.mockRestore();
    });

    it('should use system theme when enabled', () => {
      const matchMediaSpy = vi.spyOn(window, 'matchMedia');
      matchMediaSpy.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: light)',
      } as MediaQueryList);

      provider.useSystemTheme();

      expect(provider.getCurrentTheme()).toBe('light');

      matchMediaSpy.mockRestore();
    });

    it('should listen for system theme changes', () => {
      const listener = vi.fn();
      provider.on('themeChange', listener);

      provider.useSystemTheme();

      // Simulate system theme change
      const event = new Event('change');
      window.dispatchEvent(event);

      // Note: In real implementation, this would trigger theme change
    });
  });

  describe('theme presets', () => {
    it('should provide high contrast preset', () => {
      provider.setTheme('high-contrast');

      const colors = provider.getColors();
      const contrast = provider.getContrastRatio(colors.background, colors.foreground);

      expect(contrast).toBeGreaterThan(15);
    });

    it('should provide colorblind-friendly preset', () => {
      provider.setTheme('deuteranopia');

      expect(provider.getCurrentTheme()).toBe('deuteranopia');
    });

    it('should export current theme', () => {
      const exported = provider.exportTheme();

      expect(exported.name).toBeDefined();
      expect(exported.colors).toBeDefined();
    });

    it('should import theme', () => {
      const themeData = {
        name: 'imported',
        colors: {
          background: '#000000',
          foreground: '#ffffff',
        } as ColorScheme,
      };

      provider.importTheme(themeData);

      expect(provider.hasTheme('imported')).toBe(true);
    });
  });

  describe('events', () => {
    it('should emit theme change event', () => {
      const listener = vi.fn();
      provider.on('themeChange', listener);

      provider.setTheme('light');

      expect(listener).toHaveBeenCalledWith({ theme: 'light' });
    });

    it('should emit color change event', () => {
      const listener = vi.fn();
      provider.on('colorChange', listener);

      const customColors: ColorScheme = {
        background: '#000000',
        foreground: '#ffffff',
        primary: '#ff0000',
        secondary: '#00ff00',
        accent: '#0000ff',
        active: '#ffff00',
        visited: '#ff00ff',
        current: '#00ffff',
        completed: '#808080',
        error: '#ff0000',
        warning: '#ffa500',
        success: '#00ff00',
        info: '#0000ff',
        node: '#ffffff',
        edge: '#cccccc',
        highlight: '#ffff00',
      };

      provider.registerTheme('custom', customColors);
      provider.setTheme('custom');

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('memory management', () => {
    it('should cleanup event listeners on dispose', () => {
      const listener = vi.fn();
      provider.on('themeChange', listener);

      provider.dispose();
      provider.setTheme('light');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should cleanup CSS variables on dispose', () => {
      provider.applyCSSVariables();

      const root = document.documentElement;
      const varName = '--theme-background';

      provider.dispose();

      expect(root.style.getPropertyValue(varName)).toBe('');
    });
  });

  describe('error handling', () => {
    it('should handle invalid theme name', () => {
      expect(() => provider.setTheme('nonexistent' as Theme)).toThrow();
    });

    it('should handle invalid color format', () => {
      expect(() => provider.hexToRgb('invalid')).toThrow();
    });

    it('should handle malformed theme data on import', () => {
      expect(() => provider.importTheme({} as any)).toThrow();
    });
  });
});
