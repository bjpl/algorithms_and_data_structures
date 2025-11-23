#!/usr/bin/env python3
"""
Test Plugin System - Verify formatter plugin implementation

This test verifies:
1. GradientPlugin creation and initialization
2. AnimationPlugin integration
3. WindowsOptimizerPlugin integration
4. Plugin attachment mechanism
5. Graceful error handling
"""

import pytest
from src.ui.unified_formatter import UnifiedFormatter
from src.ui.formatter_factory import FormatterFactory


def test_gradient_plugin_import():
    """Test that GradientPlugin can be imported"""
    from src.ui.formatter_plugins.gradient_plugin import GradientPlugin
    plugin = GradientPlugin()
    assert plugin.name == "gradient"
    assert plugin.version == "1.0.0"


def test_animation_plugin_import():
    """Test that AnimationPlugin can be imported"""
    from src.ui.formatter_plugins.animation_plugin import AnimationPlugin
    plugin = AnimationPlugin()
    assert plugin.name == "animation"
    assert plugin.version == "1.0.0"


def test_windows_plugin_import():
    """Test that WindowsOptimizerPlugin can be imported"""
    from src.ui.formatter_plugins.windows_plugin import WindowsOptimizerPlugin
    plugin = WindowsOptimizerPlugin()
    assert plugin.name == "windows_optimizer"
    assert plugin.version == "1.0.0"


def test_attach_plugin_to_formatter():
    """Test attaching a plugin to UnifiedFormatter"""
    from src.ui.formatter_plugins.gradient_plugin import GradientPlugin

    formatter = UnifiedFormatter()
    plugin = GradientPlugin()

    # Should not raise
    formatter.attach_plugin(plugin)

    # Plugin should be in list
    assert "gradient" in formatter.list_plugins()


def test_attach_multiple_plugins():
    """Test attaching multiple plugins"""
    from src.ui.formatter_plugins.gradient_plugin import GradientPlugin
    from src.ui.formatter_plugins.animation_plugin import AnimationPlugin

    formatter = UnifiedFormatter()

    formatter.attach_plugin(GradientPlugin())
    formatter.attach_plugin(AnimationPlugin())

    plugins = formatter.list_plugins()
    assert "gradient" in plugins
    assert "animation" in plugins


def test_get_plugin():
    """Test retrieving attached plugin"""
    from src.ui.formatter_plugins.gradient_plugin import GradientPlugin

    formatter = UnifiedFormatter()
    formatter.attach_plugin(GradientPlugin())

    plugin = formatter.get_plugin("gradient")
    assert plugin is not None
    assert plugin.name == "gradient"


def test_detach_plugin():
    """Test detaching a plugin"""
    from src.ui.formatter_plugins.gradient_plugin import GradientPlugin

    formatter = UnifiedFormatter()
    formatter.attach_plugin(GradientPlugin())

    assert "gradient" in formatter.list_plugins()

    result = formatter.detach_plugin("gradient")
    assert result is True
    assert "gradient" not in formatter.list_plugins()


def test_formatter_factory_rich_with_plugins():
    """Test FormatterFactory creates rich formatter with plugins"""
    formatter = FormatterFactory.create_rich_formatter(
        gradient_enabled=True,
        animations_enabled=True
    )

    # Formatter should work even if plugins fail to load
    assert formatter is not None
    assert hasattr(formatter, 'attach_plugin')


def test_formatter_factory_windows_with_plugin():
    """Test FormatterFactory creates Windows formatter with plugin"""
    formatter = FormatterFactory.create_windows_formatter(safe_mode=True)

    # Formatter should work even if plugin fails to load
    assert formatter is not None
    assert hasattr(formatter, 'attach_plugin')


def test_gradient_plugin_capabilities():
    """Test GradientPlugin capabilities"""
    from src.ui.formatter_plugins.gradient_plugin import GradientPlugin

    plugin = GradientPlugin()
    plugin.initialize()

    caps = plugin.get_capabilities()
    assert 'gradient' in caps.content_types
    assert 'linear_gradient' in caps.features


def test_gradient_plugin_linear_gradient():
    """Test GradientPlugin linear gradient"""
    from src.ui.formatter_plugins.gradient_plugin import GradientPlugin

    plugin = GradientPlugin()
    plugin.initialize()

    # Should not raise
    result = plugin.linear_gradient("Hello World", "cyan", "magenta")
    assert result is not None
    assert isinstance(result, str)


def test_gradient_plugin_rainbow():
    """Test GradientPlugin rainbow gradient"""
    from src.ui.formatter_plugins.gradient_plugin import GradientPlugin

    plugin = GradientPlugin()
    plugin.initialize()

    # Should not raise
    result = plugin.rainbow_gradient("Rainbow Text")
    assert result is not None
    assert isinstance(result, str)


def test_animation_plugin_capabilities():
    """Test AnimationPlugin capabilities"""
    from src.ui.formatter_plugins.animation_plugin import AnimationPlugin

    plugin = AnimationPlugin()
    plugin.initialize()

    caps = plugin.get_capabilities()
    assert 'spinner' in caps.content_types
    assert 'spinners' in caps.features


def test_windows_plugin_capabilities():
    """Test WindowsOptimizerPlugin capabilities"""
    from src.ui.formatter_plugins.windows_plugin import WindowsOptimizerPlugin

    plugin = WindowsOptimizerPlugin()
    plugin.initialize()

    caps = plugin.get_capabilities()
    assert 'windows_box' in caps.content_types
    assert 'windows_ansi' in caps.features


def test_windows_plugin_detect_capabilities():
    """Test WindowsOptimizerPlugin capability detection"""
    from src.ui.formatter_plugins.windows_plugin import WindowsOptimizerPlugin

    plugin = WindowsOptimizerPlugin()
    plugin.initialize()

    caps = plugin.detect_capabilities()
    assert 'platform' in caps
    assert 'ansi' in caps
    assert 'unicode' in caps


def test_plugin_graceful_failure():
    """Test that invalid plugin attachment fails gracefully"""
    formatter = UnifiedFormatter()

    # Create invalid plugin (missing required methods)
    class InvalidPlugin:
        pass

    invalid = InvalidPlugin()

    # Should raise TypeError (not crash)
    with pytest.raises(TypeError):
        formatter.attach_plugin(invalid)


def test_formatter_still_works_without_plugins():
    """Test that formatter works even without plugins"""
    formatter = UnifiedFormatter()

    # Core formatter methods should work
    result = formatter.success("Test message")
    assert result is not None

    result = formatter.error("Error message")
    assert result is not None

    result = formatter.header("Header", level=1)
    assert result is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
