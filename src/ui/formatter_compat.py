#!/usr/bin/env python3
"""
Formatter Compatibility Layer - Backward compatibility wrappers

This module provides compatibility wrappers for legacy formatter classes,
allowing existing code to continue working while migrating to the unified
formatter architecture.

All classes in this module are deprecated and will be removed in a future release.
New code should use UnifiedFormatter directly or use FormatterFactory.
"""

import warnings
from typing import Optional, List, Dict, Any, Union

from .unified_formatter import UnifiedFormatter, Theme, Color
from .formatter_factory import FormatterFactory, FormatterPreset


class TerminalFormatter(UnifiedFormatter):
    """
    Backward compatibility wrapper for TerminalFormatter.

    This class provides the same API as the legacy TerminalFormatter but
    delegates to UnifiedFormatter. New code should use UnifiedFormatter
    directly or create formatters via FormatterFactory.

    Deprecated:
        Use UnifiedFormatter or FormatterFactory.create_terminal_formatter() instead.
    """

    def __init__(self, *args, **kwargs):
        """Initialize with deprecation warning"""
        warnings.warn(
            "TerminalFormatter is deprecated and will be removed in version 2.0. "
            "Use UnifiedFormatter or FormatterFactory.create_terminal_formatter() instead.",
            DeprecationWarning,
            stacklevel=2
        )
        super().__init__(*args, **kwargs)

        # Set defaults to match legacy TerminalFormatter behavior
        self.enable_colors()
        self.set_unicode(not self.__class__._is_windows())

    @staticmethod
    def _is_windows() -> bool:
        """Check if running on Windows"""
        import sys
        return sys.platform == 'win32'

    # Legacy method aliases for backward compatibility
    def _colorize(self, text: str, color: Color) -> str:
        """Legacy alias for colorize() method"""
        return self.colorize(text, color)


class WindowsFormatter(UnifiedFormatter):
    """
    Backward compatibility wrapper for WindowsFormatter.

    This class provides the same API as the legacy WindowsFormatter with
    Windows-specific optimizations. New code should use
    FormatterFactory.create_windows_formatter() instead.

    Deprecated:
        Use FormatterFactory.create_windows_formatter() instead.
    """

    def __init__(self, safe_mode: bool = True, *args, **kwargs):
        """Initialize with deprecation warning"""
        warnings.warn(
            "WindowsFormatter is deprecated and will be removed in version 2.0. "
            "Use FormatterFactory.create_windows_formatter() instead.",
            DeprecationWarning,
            stacklevel=2
        )
        super().__init__(*args, **kwargs)

        # Apply Windows-specific settings
        self.enable_colors()
        self.set_unicode(not safe_mode)

    # Windows-specific box character constants for compatibility
    BOX_CHARS = {
        'simple': {
            'tl': '+', 'tr': '+', 'bl': '+', 'br': '+',
            'h': '-', 'v': '|', 'cross': '+'
        },
        'ascii': {
            'tl': '+', 'tr': '+', 'bl': '+', 'br': '+',
            'h': '-', 'v': '|', 'cross': '+'
        },
        'double': {
            'tl': '+', 'tr': '+', 'bl': '+', 'br': '+',
            'h': '=', 'v': '|', 'cross': '+'
        }
    }


class EnhancedLessonFormatter:
    """
    Backward compatibility wrapper for EnhancedLessonFormatter.

    This class maintains the exact same API as the legacy EnhancedLessonFormatter
    but uses UnifiedFormatter as its backend. This ensures zero breaking changes
    for existing lesson display code.

    Deprecated:
        Use FormatterFactory.create_lesson_formatter() instead, or migrate to
        using UnifiedFormatter directly with custom lesson rendering logic.
    """

    def __init__(self, formatter: Optional[UnifiedFormatter] = None):
        """
        Initialize lesson formatter with optional custom formatter.

        Args:
            formatter: Optional UnifiedFormatter instance (creates one if None)
        """
        warnings.warn(
            "EnhancedLessonFormatter compatibility wrapper is deprecated. "
            "Use FormatterFactory.create_lesson_formatter() instead.",
            DeprecationWarning,
            stacklevel=2
        )

        if formatter is None:
            # Create lesson-optimized formatter
            formatter = FormatterFactory.create_lesson_formatter()

        self.formatter = formatter

    # Delegate all attribute access to the underlying formatter
    def __getattr__(self, name):
        """Delegate attribute access to underlying formatter"""
        return getattr(self.formatter, name)


class BeautifulFormatter(UnifiedFormatter):
    """
    Backward compatibility wrapper for BeautifulFormatter (enhanced_formatter.py).

    This class provides the same API as the legacy BeautifulFormatter with
    advanced visual effects. New code should use
    FormatterFactory.create_rich_formatter() instead.

    Deprecated:
        Use FormatterFactory.create_rich_formatter() instead.
    """

    def __init__(self, *args, **kwargs):
        """Initialize with deprecation warning"""
        warnings.warn(
            "BeautifulFormatter is deprecated and will be removed in version 2.0. "
            "Use FormatterFactory.create_rich_formatter() instead.",
            DeprecationWarning,
            stacklevel=2
        )
        super().__init__(*args, **kwargs)

        # Enable all visual features
        self.enable_colors()
        self.set_unicode(True)  # BeautifulFormatter always used unicode

    # Gradient presets for backward compatibility
    class GradientPreset:
        """Legacy gradient preset constants"""
        RAINBOW = "rainbow"
        FIRE = "fire"
        OCEAN = "ocean"
        FOREST = "forest"
        SUNSET = "sunset"
        CYBERPUNK = "cyberpunk"
        MATRIX = "matrix"
        GALAXY = "galaxy"
        CANDY = "candy"
        LAVA = "lava"
        ICE = "ice"
        GOLD = "gold"


# Factory function aliases for backward compatibility
def create_terminal_formatter(enable_colors: bool = True,
                              enable_unicode: Optional[bool] = None) -> UnifiedFormatter:
    """
    Create a terminal formatter (compatibility function).

    Deprecated:
        Use FormatterFactory.create_terminal_formatter() instead.
    """
    warnings.warn(
        "create_terminal_formatter() is deprecated. "
        "Use FormatterFactory.create_terminal_formatter() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return FormatterFactory.create_terminal_formatter(enable_colors, enable_unicode)


def create_windows_formatter(safe_mode: bool = True) -> UnifiedFormatter:
    """
    Create a Windows formatter (compatibility function).

    Deprecated:
        Use FormatterFactory.create_windows_formatter() instead.
    """
    warnings.warn(
        "create_windows_formatter() is deprecated. "
        "Use FormatterFactory.create_windows_formatter() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return FormatterFactory.create_windows_formatter(safe_mode)


def create_lesson_formatter(theme: Optional[Theme] = None) -> UnifiedFormatter:
    """
    Create a lesson formatter (compatibility function).

    Deprecated:
        Use FormatterFactory.create_lesson_formatter() instead.
    """
    warnings.warn(
        "create_lesson_formatter() is deprecated. "
        "Use FormatterFactory.create_lesson_formatter() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return FormatterFactory.create_lesson_formatter(theme)


# Migration helper function
def get_migration_guide() -> str:
    """
    Get migration guide for updating from legacy formatters.

    Returns:
        String with migration instructions
    """
    return """
# Formatter Migration Guide

## Migrating from Legacy Formatters

### TerminalFormatter → UnifiedFormatter or FormatterFactory
```python
# OLD:
from src.ui.formatter_compat import TerminalFormatter
formatter = TerminalFormatter()

# NEW (Option 1 - Direct):
from src.ui.unified_formatter import UnifiedFormatter
formatter = UnifiedFormatter()

# NEW (Option 2 - Factory):
from src.ui.formatter_factory import FormatterFactory
formatter = FormatterFactory.create_terminal_formatter()
```

### WindowsFormatter → FormatterFactory
```python
# OLD:
from src.ui.windows_formatter import WindowsFormatter
formatter = WindowsFormatter(safe_mode=True)

# NEW:
from src.ui.formatter_factory import FormatterFactory
formatter = FormatterFactory.create_windows_formatter(safe_mode=True)
```

### EnhancedLessonFormatter → FormatterFactory
```python
# OLD:
from src.ui.enhanced_lesson_formatter import EnhancedLessonFormatter
formatter = EnhancedLessonFormatter()

# NEW:
from src.ui.formatter_factory import FormatterFactory
formatter = FormatterFactory.create_lesson_formatter()
```

### BeautifulFormatter → FormatterFactory
```python
# OLD:
from src.ui.enhanced_formatter import BeautifulFormatter
formatter = BeautifulFormatter()

# NEW:
from src.ui.formatter_factory import FormatterFactory
formatter = FormatterFactory.create_rich_formatter()
```

## Auto-Detection
Let the factory choose the best formatter for your platform:
```python
from src.ui.formatter_factory import FormatterFactory
formatter = FormatterFactory.auto_detect_formatter()
```

## Shared Instances
Use singleton pattern for shared formatter across modules:
```python
from src.ui.formatter_factory import FormatterFactory, FormatterPreset
formatter = FormatterFactory.get_shared_instance(FormatterPreset.STANDARD)
```

## All API methods remain the same!
The migration only changes HOW you create formatters, not how you use them.
All existing method calls (success(), error(), header(), box(), etc.) work identically.
"""


# Print migration guide helper
def print_migration_guide() -> None:
    """Print the migration guide to stdout"""
    print(get_migration_guide())


# Module-level compatibility instance for drop-in replacement
_compat_formatter = None


def get_compat_formatter() -> UnifiedFormatter:
    """
    Get a module-level shared formatter for compatibility.

    This provides a drop-in replacement for code that expects a module-level
    formatter instance.

    Returns:
        Shared UnifiedFormatter instance
    """
    global _compat_formatter
    if _compat_formatter is None:
        _compat_formatter = FormatterFactory.auto_detect_formatter()
    return _compat_formatter


# Export Color as WindowsColor for backward compatibility
WindowsColor = Color
