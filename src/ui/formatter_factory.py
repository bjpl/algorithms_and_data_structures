#!/usr/bin/env python3
"""
Formatter Factory - Centralized formatter creation and configuration

This module provides factory methods for creating pre-configured formatters
with appropriate plugins and settings based on use case and platform.
"""

import sys
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass

from .unified_formatter import UnifiedFormatter, Theme, Color


class FormatterPreset(Enum):
    """Predefined formatter configurations"""
    MINIMAL = "minimal"      # No plugins, basic formatting only
    STANDARD = "standard"    # Platform-appropriate defaults
    FULL = "full"           # All features enabled
    WINDOWS = "windows"     # Windows-optimized with safe characters
    RICH = "rich"          # Maximum visual effects
    LESSON = "lesson"      # Optimized for curriculum display
    TERMINAL = "terminal"  # Generic terminal compatibility
    CUSTOM = "custom"      # User-defined configuration


@dataclass
class FormatterConfig:
    """Configuration for formatter creation"""
    preset: FormatterPreset = FormatterPreset.STANDARD
    theme: Optional[Theme] = None
    plugins: Optional[List[str]] = None
    enable_unicode: Optional[bool] = None
    enable_colors: Optional[bool] = None
    terminal_width: Optional[int] = None
    custom_settings: Optional[Dict[str, Any]] = None


class FormatterFactory:
    """
    Factory for creating pre-configured formatters.

    This class provides factory methods to create formatters with appropriate
    plugins and settings based on platform, use case, and user preferences.
    """

    # Singleton instances for shared formatters
    _instances: Dict[str, UnifiedFormatter] = {}

    # Platform detection
    IS_WINDOWS = sys.platform == 'win32'
    IS_MACOS = sys.platform == 'darwin'
    IS_LINUX = sys.platform.startswith('linux')

    @classmethod
    def create_terminal_formatter(cls,
                                  enable_colors: bool = True,
                                  enable_unicode: Optional[bool] = None) -> UnifiedFormatter:
        """
        Create a standard terminal formatter with platform detection.

        Args:
            enable_colors: Whether to enable ANSI colors
            enable_unicode: Whether to use Unicode characters (auto-detected if None)

        Returns:
            UnifiedFormatter configured for general terminal use
        """
        # Auto-detect unicode support
        if enable_unicode is None:
            enable_unicode = not cls.IS_WINDOWS

        formatter = UnifiedFormatter()

        if not enable_colors:
            formatter.disable_colors()
        else:
            formatter.enable_colors()

        formatter.set_unicode(enable_unicode)

        return formatter

    @classmethod
    def create_lesson_formatter(cls,
                               theme: Optional[Theme] = None) -> UnifiedFormatter:
        """
        Create a formatter optimized for lesson/curriculum display.

        Args:
            theme: Optional color theme (uses lesson-optimized theme if None)

        Returns:
            UnifiedFormatter configured for lesson display
        """
        # Lesson-optimized theme with good contrast
        if theme is None:
            theme = Theme(
                primary=Color.BRIGHT_BLUE,
                secondary=Color.CYAN,
                success=Color.BRIGHT_GREEN,
                warning=Color.BRIGHT_YELLOW,
                error=Color.BRIGHT_RED,
                info=Color.BRIGHT_CYAN,
                header=Color.BRIGHT_MAGENTA,
                accent=Color.MAGENTA
            )

        formatter = UnifiedFormatter(theme=theme)

        # Lesson formatters typically need unicode for better display
        formatter.set_unicode(not cls.IS_WINDOWS)
        formatter.enable_colors()

        return formatter

    @classmethod
    def create_rich_formatter(cls,
                             gradient_enabled: bool = True,
                             animations_enabled: bool = True) -> UnifiedFormatter:
        """
        Create a formatter with Rich integration and maximum visual effects.

        Args:
            gradient_enabled: Enable gradient text effects
            animations_enabled: Enable spinner/progress animations

        Returns:
            UnifiedFormatter with all visual enhancements
        """
        # Use vibrant theme for rich display
        theme = Theme(
            primary=Color.BRIGHT_CYAN,
            secondary=Color.BRIGHT_BLUE,
            success=Color.BRIGHT_GREEN,
            warning=Color.BRIGHT_YELLOW,
            error=Color.BRIGHT_RED,
            info=Color.BRIGHT_CYAN,
            header=Color.BRIGHT_MAGENTA,
            accent=Color.MAGENTA
        )

        formatter = UnifiedFormatter(theme=theme)

        # Enable all visual features
        formatter.enable_colors()
        formatter.set_unicode(True)  # Rich formatter always uses unicode

        # Attach gradient and animation plugins
        try:
            if gradient_enabled:
                from .formatter_plugins.gradient_plugin import GradientPlugin
                formatter.attach_plugin(GradientPlugin())
        except ImportError:
            # Gradient plugin not available, continue without it
            pass
        except Exception as e:
            # Log error but continue - plugins are optional
            import logging
            logging.debug(f"Failed to load gradient plugin: {e}")

        try:
            if animations_enabled:
                from .formatter_plugins.animation_plugin import AnimationPlugin
                formatter.attach_plugin(AnimationPlugin())
        except ImportError:
            # Animation plugin not available, continue without it
            pass
        except Exception as e:
            # Log error but continue - plugins are optional
            import logging
            logging.debug(f"Failed to load animation plugin: {e}")

        return formatter

    @classmethod
    def create_windows_formatter(cls,
                                safe_mode: bool = True) -> UnifiedFormatter:
        """
        Create a Windows-optimized formatter with safe characters.

        Args:
            safe_mode: Use ASCII-only characters for maximum compatibility

        Returns:
            UnifiedFormatter optimized for Windows terminals
        """
        formatter = UnifiedFormatter()

        # Enable colors (Windows 10+ supports ANSI)
        formatter.enable_colors()

        # Disable unicode in safe mode, otherwise allow it for modern Windows Terminal
        if safe_mode:
            formatter.set_unicode(False)
        else:
            # Check if running in Windows Terminal (supports unicode)
            import os
            in_windows_terminal = os.environ.get('WT_SESSION') is not None
            formatter.set_unicode(in_windows_terminal)

        # Attach Windows optimizer plugin
        try:
            from .formatter_plugins.windows_plugin import WindowsOptimizerPlugin
            formatter.attach_plugin(WindowsOptimizerPlugin())
        except ImportError:
            # Windows optimizer plugin not available, continue without it
            pass
        except Exception as e:
            # Log error but continue - plugins are optional
            import logging
            logging.debug(f"Failed to load Windows optimizer plugin: {e}")

        return formatter

    @classmethod
    def create_custom(cls,
                     plugins: Optional[List[Any]] = None,
                     config: Optional[FormatterConfig] = None,
                     theme: Optional[Theme] = None) -> UnifiedFormatter:
        """
        Create a custom-configured formatter.

        Args:
            plugins: List of plugin instances to attach
            config: Custom configuration object
            theme: Custom color theme

        Returns:
            UnifiedFormatter with custom configuration
        """
        if config is None:
            config = FormatterConfig()

        # Use provided theme or config theme or default
        formatter_theme = theme or config.theme or Theme()
        formatter = UnifiedFormatter(theme=formatter_theme)

        # Apply configuration
        if config.enable_colors is not None:
            if config.enable_colors:
                formatter.enable_colors()
            else:
                formatter.disable_colors()

        if config.enable_unicode is not None:
            formatter.set_unicode(config.enable_unicode)

        # Attach plugins if provided
        if plugins:
            for plugin in plugins:
                try:
                    formatter.attach_plugin(plugin)
                except Exception as e:
                    # Log error but continue - plugins are optional
                    import logging
                    logging.warning(f"Failed to attach plugin: {e}")

        return formatter

    @classmethod
    def create_from_preset(cls,
                          preset: FormatterPreset,
                          **kwargs) -> UnifiedFormatter:
        """
        Create a formatter from a predefined preset.

        Args:
            preset: The preset configuration to use
            **kwargs: Additional arguments passed to specific factory method

        Returns:
            UnifiedFormatter configured according to preset
        """
        if preset == FormatterPreset.MINIMAL:
            formatter = UnifiedFormatter()
            formatter.disable_colors()
            formatter.set_unicode(False)
            return formatter

        elif preset == FormatterPreset.STANDARD:
            return cls.create_terminal_formatter(**kwargs)

        elif preset == FormatterPreset.FULL:
            return cls.create_rich_formatter(**kwargs)

        elif preset == FormatterPreset.WINDOWS:
            return cls.create_windows_formatter(**kwargs)

        elif preset == FormatterPreset.RICH:
            return cls.create_rich_formatter(**kwargs)

        elif preset == FormatterPreset.LESSON:
            return cls.create_lesson_formatter(**kwargs)

        elif preset == FormatterPreset.TERMINAL:
            return cls.create_terminal_formatter(**kwargs)

        elif preset == FormatterPreset.CUSTOM:
            return cls.create_custom(**kwargs)

        else:
            # Default fallback
            return cls.create_terminal_formatter()

    @classmethod
    def get_shared_instance(cls,
                           preset: FormatterPreset = FormatterPreset.STANDARD) -> UnifiedFormatter:
        """
        Get a shared singleton instance of a formatter.

        This is useful when multiple parts of the application need to share
        the same formatter instance to maintain consistent state.

        Args:
            preset: The preset to use for the shared instance

        Returns:
            Shared UnifiedFormatter instance
        """
        preset_key = preset.value

        if preset_key not in cls._instances:
            cls._instances[preset_key] = cls.create_from_preset(preset)

        return cls._instances[preset_key]

    @classmethod
    def clear_shared_instances(cls) -> None:
        """Clear all shared formatter instances."""
        cls._instances.clear()

    @classmethod
    def auto_detect_formatter(cls) -> UnifiedFormatter:
        """
        Auto-detect the best formatter based on platform and environment.

        Returns:
            UnifiedFormatter optimized for current environment
        """
        # Windows detection
        if cls.IS_WINDOWS:
            import os
            # Check for modern Windows Terminal
            if os.environ.get('WT_SESSION'):
                return cls.create_windows_formatter(safe_mode=False)
            else:
                return cls.create_windows_formatter(safe_mode=True)

        # macOS/Linux - use full features
        return cls.create_terminal_formatter(
            enable_colors=True,
            enable_unicode=True
        )


# Convenience functions for quick formatter creation
def get_formatter(preset: FormatterPreset = FormatterPreset.STANDARD) -> UnifiedFormatter:
    """
    Get a formatter instance from a preset.

    Args:
        preset: The preset configuration to use

    Returns:
        UnifiedFormatter instance
    """
    return FormatterFactory.create_from_preset(preset)


def get_shared_formatter(preset: FormatterPreset = FormatterPreset.STANDARD) -> UnifiedFormatter:
    """
    Get a shared singleton formatter instance.

    Args:
        preset: The preset configuration to use

    Returns:
        Shared UnifiedFormatter instance
    """
    return FormatterFactory.get_shared_instance(preset)


def auto_formatter() -> UnifiedFormatter:
    """
    Auto-detect and return the best formatter for current environment.

    Returns:
        UnifiedFormatter optimized for current platform
    """
    return FormatterFactory.auto_detect_formatter()
