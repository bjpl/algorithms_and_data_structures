#!/usr/bin/env python3
"""
Formatter Plugin System

This module provides a plugin architecture for extending the UnifiedFormatter.
Plugins can add new content type handlers, rendering strategies, and formatting
capabilities without modifying the core formatter.

Example Usage:
    >>> from src.ui.formatter_plugins import BasePlugin, PluginManager, PluginRegistry
    >>>
    >>> # Create a custom plugin
    >>> class MyPlugin(BasePlugin):
    ...     @property
    ...     def name(self):
    ...         return "my_plugin"
    ...
    ...     def can_handle(self, content_type):
    ...         return content_type == "custom"
    ...
    ...     def format(self, content, **options):
    ...         return f"Custom: {content}"
    >>>
    >>> # Register and use plugin
    >>> manager = PluginManager()
    >>> plugin = MyPlugin()
    >>> manager.register(plugin)
    >>> manager.initialize_all()
    >>>
    >>> handler = manager.find_handler("custom")
    >>> print(handler.format("test"))  # "Custom: test"
"""

from .base import (
    BasePlugin,
    PluginCapabilities,
    PluginConfig,
    PluginMetadata,
    PluginPriority,
    PluginStatus,
    PluginRegistry,
    PluginManager,
    PluginError,
    PluginNotFoundError,
    PluginDependencyError,
    PluginInitializationError,
)

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .animation_plugin import AnimationPlugin
    from .windows_plugin import WindowsOptimizerPlugin
    from .lesson_plugin import LessonFormatterPlugin
    from .rich_plugin import RichFormatterPlugin
    from .markdown_plugin import MarkdownPlugin

__all__ = [
    # Base classes
    "BasePlugin",

    # Data classes
    "PluginCapabilities",
    "PluginConfig",
    "PluginMetadata",
    "PluginPriority",
    "PluginStatus",

    # Management classes
    "PluginRegistry",
    "PluginManager",

    # Exceptions
    "PluginError",
    "PluginNotFoundError",
    "PluginDependencyError",
    "PluginInitializationError",

    # Existing plugins
    'AnimationPlugin',
    'WindowsOptimizerPlugin',
    'LessonFormatterPlugin',

    # New formatter plugins
    'RichFormatterPlugin',
    'MarkdownPlugin',
]

__version__ = "1.0.0"
