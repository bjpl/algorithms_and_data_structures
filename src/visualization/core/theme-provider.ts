/**
 * Theme Provider Implementation
 *
 * Manages theming, color palettes, and visual styling.
 * Supports light/dark themes and custom theme registration.
 */

import type { IThemeProvider } from './interfaces';
import type { ThemeConfig, UnsubscribeFunction } from './types';

/**
 * Default light theme
 */
const LIGHT_THEME: ThemeConfig = {
  variant: 'light',
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    background: '#ffffff',
    surface: '#f3f4f6',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#d1d5db',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      small: 12,
      medium: 14,
      large: 16,
    },
    fontWeight: {
      normal: 400,
      bold: 700,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  transitions: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

/**
 * Default dark theme
 */
const DARK_THEME: ThemeConfig = {
  variant: 'dark',
  colors: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    accent: '#f472b6',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    border: '#374151',
    error: '#f87171',
    warning: '#fbbf24',
    success: '#34d399',
    info: '#60a5fa',
  },
  typography: LIGHT_THEME.typography,
  spacing: LIGHT_THEME.spacing,
  transitions: LIGHT_THEME.transitions,
};

/**
 * Theme provider implementation
 */
export class ThemeProvider implements IThemeProvider {
  private currentTheme: ThemeConfig;
  private registeredThemes: Map<string, ThemeConfig> = new Map();
  private changeCallbacks: Set<(theme: ThemeConfig) => void> = new Set();

  constructor(initialTheme?: ThemeConfig) {
    // Register default themes
    this.registeredThemes.set('light', LIGHT_THEME);
    this.registeredThemes.set('dark', DARK_THEME);

    // Set initial theme
    this.currentTheme = initialTheme ?? this.detectSystemTheme();
  }

  // ========================================================================
  // THEME MANAGEMENT
  // ========================================================================

  getTheme(): ThemeConfig {
    return { ...this.currentTheme };
  }

  setTheme(theme: ThemeConfig): void {
    this.currentTheme = { ...theme };
    this.notifyThemeChange();
  }

  updateTheme(updates: Partial<ThemeConfig>): void {
    this.currentTheme = {
      ...this.currentTheme,
      ...updates,
      colors: {
        ...this.currentTheme.colors,
        ...(updates.colors ?? {}),
      },
      typography: {
        ...this.currentTheme.typography,
        ...(updates.typography ?? {}),
      },
      spacing: {
        ...this.currentTheme.spacing,
        ...(updates.spacing ?? {}),
      },
      transitions: {
        ...this.currentTheme.transitions,
        ...(updates.transitions ?? {}),
      },
    };

    this.notifyThemeChange();
  }

  registerTheme(name: string, theme: ThemeConfig): void {
    this.registeredThemes.set(name, theme);
  }

  getRegisteredTheme(name: string): ThemeConfig | null {
    return this.registeredThemes.get(name) ?? null;
  }

  listThemes(): string[] {
    return Array.from(this.registeredThemes.keys());
  }

  switchTheme(name: string): void {
    const theme = this.registeredThemes.get(name);
    if (!theme) {
      throw new Error(`Theme "${name}" not found`);
    }

    this.setTheme(theme);
  }

  // ========================================================================
  // COLOR UTILITIES
  // ========================================================================

  getColor(colorKey: keyof ThemeConfig['colors']): string {
    return this.currentTheme.colors[colorKey];
  }

  getContrastColor(backgroundColor: string): string {
    const rgb = this.hexToRgb(backgroundColor);
    if (!rgb) {
      return this.currentTheme.colors.text;
    }

    // Calculate relative luminance
    const luminance =
      (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;

    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  generatePalette(primaryColor: string): ThemeConfig['colors'] {
    const baseRgb = this.hexToRgb(primaryColor);
    if (!baseRgb) {
      throw new Error('Invalid color format');
    }

    // Generate complementary and analogous colors
    const secondary = this.rotateHue(primaryColor, 60);
    const accent = this.rotateHue(primaryColor, 180);

    // Determine if base color is light or dark
    const isLight =
      (0.2126 * baseRgb.r + 0.7152 * baseRgb.g + 0.0722 * baseRgb.b) / 255 > 0.5;

    return {
      primary: primaryColor,
      secondary,
      accent,
      background: isLight ? '#ffffff' : '#111827',
      surface: isLight ? '#f3f4f6' : '#1f2937',
      text: isLight ? '#1f2937' : '#f9fafb',
      textSecondary: isLight ? '#6b7280' : '#9ca3af',
      border: isLight ? '#d1d5db' : '#374151',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981',
      info: primaryColor,
    };
  }

  // ========================================================================
  // CSS GENERATION
  // ========================================================================

  toCSSVariables(): Record<string, string> {
    const vars: Record<string, string> = {};

    // Colors
    Object.entries(this.currentTheme.colors).forEach(([key, value]) => {
      vars[`--color-${this.kebabCase(key)}`] = value;
    });

    // Typography
    vars['--font-family'] = this.currentTheme.typography.fontFamily;
    Object.entries(this.currentTheme.typography.fontSize).forEach(
      ([key, value]) => {
        vars[`--font-size-${key}`] = `${value}px`;
      }
    );
    Object.entries(this.currentTheme.typography.fontWeight).forEach(
      ([key, value]) => {
        vars[`--font-weight-${key}`] = value.toString();
      }
    );

    // Spacing
    Object.entries(this.currentTheme.spacing).forEach(([key, value]) => {
      vars[`--spacing-${key}`] = `${value}px`;
    });

    // Transitions
    Object.entries(this.currentTheme.transitions).forEach(([key, value]) => {
      vars[`--transition-${key}`] = `${value}ms`;
    });

    return vars;
  }

  applyToDOM(rootElement?: HTMLElement): void {
    const root = rootElement ?? document.documentElement;
    const cssVars = this.toCSSVariables();

    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }

  // ========================================================================
  // EVENT HOOKS
  // ========================================================================

  onThemeChange(callback: (theme: ThemeConfig) => void): UnsubscribeFunction {
    this.changeCallbacks.add(callback);
    return () => this.changeCallbacks.delete(callback);
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private notifyThemeChange(): void {
    this.changeCallbacks.forEach((callback) => {
      try {
        callback(this.currentTheme);
      } catch (error) {
        console.error('Error in theme change callback:', error);
      }
    });
  }

  private detectSystemTheme(): ThemeConfig {
    if (typeof window === 'undefined') {
      return LIGHT_THEME;
    }

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? DARK_THEME : LIGHT_THEME;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private rgbToHsl(
    r: number,
    g: number,
    b: number
  ): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) {
      return { h: 0, s: 0, l };
    }

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    let h = 0;
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / d + 2) / 6;
    } else {
      h = ((r - g) / d + 4) / 6;
    }

    return { h: h * 360, s, l };
  }

  private hslToRgb(
    h: number,
    s: number,
    l: number
  ): { r: number; g: number; b: number } {
    h /= 360;

    if (s === 0) {
      const gray = Math.round(l * 255);
      return { r: gray, g: gray, b: gray };
    }

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
      r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    };
  }

  private rotateHue(hex: string, degrees: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.h = (hsl.h + degrees) % 360;
    if (hsl.h < 0) hsl.h += 360;

    const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  // ========================================================================
  // PRESET THEMES
  // ========================================================================

  static createHighContrastTheme(): ThemeConfig {
    return {
      variant: 'dark',
      colors: {
        primary: '#ffffff',
        secondary: '#ffff00',
        accent: '#00ffff',
        background: '#000000',
        surface: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#cccccc',
        border: '#ffffff',
        error: '#ff0000',
        warning: '#ffff00',
        success: '#00ff00',
        info: '#00ffff',
      },
      typography: LIGHT_THEME.typography,
      spacing: LIGHT_THEME.spacing,
      transitions: LIGHT_THEME.transitions,
    };
  }

  static createMonochromeTheme(): ThemeConfig {
    return {
      variant: 'light',
      colors: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#333333',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#000000',
        textSecondary: '#666666',
        border: '#cccccc',
        error: '#000000',
        warning: '#666666',
        success: '#000000',
        info: '#333333',
      },
      typography: LIGHT_THEME.typography,
      spacing: LIGHT_THEME.spacing,
      transitions: LIGHT_THEME.transitions,
    };
  }
}
