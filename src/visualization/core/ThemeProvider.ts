/**
 * @file Theme provider for visualization styling
 * @module visualization/core
 */

/**
 * Supported themes
 */
export type Theme = 'dark' | 'light' | 'custom' | 'high-contrast' | 'deuteranopia' | string;

/**
 * Color scheme for a theme
 */
export interface ColorScheme {
  // Base colors
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;

  // Algorithm state colors
  active: string;
  visited: string;
  current: string;
  completed: string;

  // Status colors
  error: string;
  warning: string;
  success: string;
  info: string;

  // Data structure colors
  node: string;
  edge: string;
  highlight: string;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Default theme to use */
  defaultTheme?: Theme;
  /** CSS variable prefix */
  cssPrefix?: string;
}

/**
 * RGB color components
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Theme event types
 */
export type ThemeEvent = 'themeChange' | 'colorChange';

/**
 * Event listener type
 */
type EventListener<T = any> = (data?: T) => void;

/**
 * Theme export data
 */
export interface ThemeExport {
  name: string;
  colors: ColorScheme;
}

/**
 * Theme provider with support for dark/light themes and custom color schemes
 *
 * Features:
 * - Built-in dark/light themes
 * - Custom theme registration
 * - CSS variable integration
 * - Theme persistence
 * - Color utilities
 * - Accessibility helpers
 * - System theme detection
 *
 * @example
 * ```typescript
 * const themeProvider = new ThemeProvider();
 *
 * // Switch themes
 * themeProvider.setTheme('light');
 *
 * // Get colors
 * const colors = themeProvider.getColors();
 *
 * // Apply to CSS
 * themeProvider.applyCSSVariables();
 * ```
 */
export class ThemeProvider {
  private currentTheme: Theme;
  private themes: Map<Theme, ColorScheme> = new Map();
  private cssPrefix: string;

  // Event system
  private eventListeners: Map<ThemeEvent, Set<EventListener>> = new Map();

  // System theme listener
  private mediaQuery?: MediaQueryList;

  /**
   * Creates a new ThemeProvider
   *
   * @param config - Configuration options
   */
  constructor(config: ThemeConfig = {}) {
    this.cssPrefix = config.cssPrefix ?? 'theme';

    // Register built-in themes
    this.registerBuiltInThemes();

    // Load theme from localStorage or use default
    const savedTheme = this.loadThemeFromStorage();
    this.currentTheme = savedTheme ?? config.defaultTheme ?? 'dark';
  }

  /**
   * Registers built-in themes
   */
  private registerBuiltInThemes(): void {
    // Dark theme
    this.themes.set('dark', {
      background: '#1a1a1a',
      foreground: '#ffffff',
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#f59e0b',
      active: '#10b981',
      visited: '#6366f1',
      current: '#ef4444',
      completed: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#22c55e',
      info: '#3b82f6',
      node: '#60a5fa',
      edge: '#9ca3af',
      highlight: '#fbbf24',
    });

    // Light theme
    this.themes.set('light', {
      background: '#ffffff',
      foreground: '#1a1a1a',
      primary: '#2563eb',
      secondary: '#7c3aed',
      accent: '#d97706',
      active: '#059669',
      visited: '#4f46e5',
      current: '#dc2626',
      completed: '#16a34a',
      error: '#dc2626',
      warning: '#d97706',
      success: '#16a34a',
      info: '#2563eb',
      node: '#3b82f6',
      edge: '#6b7280',
      highlight: '#f59e0b',
    });

    // High contrast theme
    this.themes.set('high-contrast', {
      background: '#000000',
      foreground: '#ffffff',
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      active: '#00ff00',
      visited: '#0000ff',
      current: '#ff0000',
      completed: '#00ff00',
      error: '#ff0000',
      warning: '#ffff00',
      success: '#00ff00',
      info: '#00ffff',
      node: '#ffffff',
      edge: '#cccccc',
      highlight: '#ffff00',
    });

    // Deuteranopia-friendly theme
    this.themes.set('deuteranopia', {
      background: '#1a1a1a',
      foreground: '#ffffff',
      primary: '#0099cc',
      secondary: '#9966cc',
      accent: '#ffcc00',
      active: '#0099cc',
      visited: '#6666cc',
      current: '#cc6600',
      completed: '#009999',
      error: '#cc3300',
      warning: '#ffcc00',
      success: '#009999',
      info: '#0099cc',
      node: '#0099cc',
      edge: '#999999',
      highlight: '#ffcc00',
    });
  }

  /**
   * Gets the current theme name
   *
   * @returns Current theme
   */
  public getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Sets the current theme
   *
   * @param theme - Theme name
   * @throws {Error} If theme doesn't exist
   */
  public setTheme(theme: Theme): void {
    if (!this.hasTheme(theme)) {
      throw new Error(`Theme '${theme}' is not registered`);
    }

    this.currentTheme = theme;
    this.saveThemeToStorage(theme);
    this.emit('themeChange', { theme });
    this.emit('colorChange');
  }

  /**
   * Checks if a theme exists
   *
   * @param theme - Theme name
   * @returns True if theme exists
   */
  public hasTheme(theme: Theme): boolean {
    return this.themes.has(theme);
  }

  /**
   * Gets available themes
   *
   * @returns Array of theme names
   */
  public getAvailableThemes(): Theme[] {
    return Array.from(this.themes.keys());
  }

  /**
   * Registers a custom theme
   *
   * @param name - Theme name
   * @param colors - Color scheme
   */
  public registerTheme(name: Theme, colors: ColorScheme): void {
    this.themes.set(name, colors);
  }

  /**
   * Gets the color scheme for current theme
   *
   * @returns Color scheme
   */
  public getColors(): ColorScheme {
    return this.themes.get(this.currentTheme)!;
  }

  /**
   * Applies theme colors as CSS variables
   */
  public applyCSSVariables(): void {
    const colors = this.getColors();
    const root = document.documentElement;

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${this.cssPrefix}-${key}`, value);
    });
  }

  /**
   * Removes CSS variables
   */
  private removeCSSVariables(): void {
    const colors = this.getColors();
    const root = document.documentElement;

    Object.keys(colors).forEach((key) => {
      root.style.removeProperty(`--${this.cssPrefix}-${key}`);
    });
  }

  /**
   * Converts hex color to RGB
   *
   * @param hex - Hex color string
   * @returns RGB components
   * @throws {Error} If hex format is invalid
   */
  public hexToRgb(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    if (!result) {
      throw new Error(`Invalid hex color: ${hex}`);
    }

    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }

  /**
   * Converts RGB to hex
   *
   * @param r - Red component (0-255)
   * @param g - Green component (0-255)
   * @param b - Blue component (0-255)
   * @returns Hex color string
   */
  public rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Calculates color brightness (0-1)
   *
   * @param color - Hex color
   * @returns Brightness value
   */
  public getBrightness(color: string): number {
    const { r, g, b } = this.hexToRgb(color);
    return (r * 299 + g * 587 + b * 114) / (255 * 1000);
  }

  /**
   * Determines if a color is dark
   *
   * @param color - Hex color
   * @returns True if dark
   */
  public isDark(color: string): boolean {
    return this.getBrightness(color) < 0.5;
  }

  /**
   * Lightens a color
   *
   * @param color - Hex color
   * @param amount - Amount to lighten (0-1)
   * @returns Lightened color
   */
  public lighten(color: string, amount: number): string {
    const { r, g, b } = this.hexToRgb(color);

    const lighten = (c: number) =>
      Math.min(255, Math.round(c + (255 - c) * amount));

    return this.rgbToHex(lighten(r), lighten(g), lighten(b));
  }

  /**
   * Darkens a color
   *
   * @param color - Hex color
   * @param amount - Amount to darken (0-1)
   * @returns Darkened color
   */
  public darken(color: string, amount: number): string {
    const { r, g, b } = this.hexToRgb(color);

    const darken = (c: number) => Math.max(0, Math.round(c * (1 - amount)));

    return this.rgbToHex(darken(r), darken(g), darken(b));
  }

  /**
   * Adds opacity to a color
   *
   * @param color - Hex color
   * @param opacity - Opacity (0-1)
   * @returns RGBA color string
   */
  public withOpacity(color: string, opacity: number): string {
    const { r, g, b } = this.hexToRgb(color);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * Calculates contrast ratio between two colors
   *
   * @param color1 - First color
   * @param color2 - Second color
   * @returns Contrast ratio
   */
  public getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getBrightness(color1);
    const l2 = this.getBrightness(color2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Checks if color combination meets WCAG AA standard
   *
   * @param foreground - Foreground color
   * @param background - Background color
   * @returns True if meets AA standard
   */
  public meetsWCAG_AA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 4.5;
  }

  /**
   * Checks if color combination meets WCAG AAA standard
   *
   * @param foreground - Foreground color
   * @param background - Background color
   * @returns True if meets AAA standard
   */
  public meetsWCAG_AAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 7;
  }

  /**
   * Gets an accessible color for given background
   *
   * @param foreground - Desired foreground color
   * @param background - Background color
   * @returns Accessible foreground color
   */
  public getAccessibleColor(foreground: string, background: string): string {
    if (this.meetsWCAG_AA(foreground, background)) {
      return foreground;
    }

    // Try lightening/darkening until accessible
    let adjusted = foreground;
    const isDarkBg = this.isDark(background);

    for (let i = 0.1; i <= 1; i += 0.1) {
      adjusted = isDarkBg ? this.lighten(foreground, i) : this.darken(foreground, i);

      if (this.meetsWCAG_AA(adjusted, background)) {
        return adjusted;
      }
    }

    // Fallback to black or white
    return isDarkBg ? '#ffffff' : '#000000';
  }

  /**
   * Detects system theme preference
   *
   * @returns System theme
   */
  public getSystemTheme(): Theme {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Uses system theme preference
   */
  public useSystemTheme(): void {
    this.setTheme(this.getSystemTheme());

    // Listen for system theme changes
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const listener = (e: MediaQueryListEvent) => {
        this.setTheme(e.matches ? 'dark' : 'light');
      };

      if (this.mediaQuery.addEventListener) {
        this.mediaQuery.addEventListener('change', listener);
      } else {
        // Fallback for older browsers
        this.mediaQuery.addListener(listener);
      }
    }
  }

  /**
   * Exports current theme
   *
   * @returns Theme export data
   */
  public exportTheme(): ThemeExport {
    return {
      name: this.currentTheme,
      colors: this.getColors(),
    };
  }

  /**
   * Imports a theme
   *
   * @param data - Theme data
   * @throws {Error} If data is invalid
   */
  public importTheme(data: ThemeExport): void {
    if (!data.name || !data.colors) {
      throw new Error('Invalid theme data');
    }

    this.registerTheme(data.name, data.colors);
  }

  /**
   * Loads theme from localStorage
   *
   * @returns Saved theme or null
   */
  private loadThemeFromStorage(): Theme | null {
    try {
      return localStorage.getItem('theme') as Theme;
    } catch {
      return null;
    }
  }

  /**
   * Saves theme to localStorage
   *
   * @param theme - Theme to save
   */
  private saveThemeToStorage(theme: Theme): void {
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Subscribes to an event
   *
   * @param event - Event type
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  public on<T = any>(event: ThemeEvent, listener: EventListener<T>): () => void {
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
  private emit<T = any>(event: ThemeEvent, data?: T): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;

    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Disposes the provider and cleans up resources
   */
  public dispose(): void {
    this.removeCSSVariables();
    this.eventListeners.clear();

    // Remove media query listener
    if (this.mediaQuery) {
      if (this.mediaQuery.removeEventListener) {
        this.mediaQuery.removeEventListener('change', () => {});
      } else {
        // Fallback for older browsers
        this.mediaQuery.removeListener(() => {});
      }
    }
  }
}
