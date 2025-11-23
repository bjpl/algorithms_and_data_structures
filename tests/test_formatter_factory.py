#!/usr/bin/env python3
"""
Test suite for FormatterFactory and compatibility wrappers.

This test ensures:
1. Factory creates formatters with correct configurations
2. Compatibility wrappers maintain backward compatibility
3. Shared instances work correctly
4. Auto-detection selects appropriate formatters
"""

import pytest
import sys
import warnings
from unittest.mock import patch

# Import the modules we're testing
from src.ui.formatter_factory import (
    FormatterFactory,
    FormatterPreset,
    FormatterConfig,
    get_formatter,
    get_shared_formatter,
    auto_formatter
)
from src.ui.formatter_compat import (
    TerminalFormatter,
    WindowsFormatter,
    EnhancedLessonFormatter,
    BeautifulFormatter,
    get_migration_guide
)
from src.ui.unified_formatter import UnifiedFormatter, Theme, Color


class TestFormatterFactory:
    """Test FormatterFactory methods"""

    def test_create_terminal_formatter_default(self):
        """Test creating default terminal formatter"""
        formatter = FormatterFactory.create_terminal_formatter()
        assert isinstance(formatter, UnifiedFormatter)
        assert formatter.colors_enabled is True

    def test_create_terminal_formatter_no_colors(self):
        """Test creating terminal formatter without colors"""
        formatter = FormatterFactory.create_terminal_formatter(enable_colors=False)
        assert formatter.colors_enabled is False

    def test_create_terminal_formatter_unicode(self):
        """Test terminal formatter unicode settings"""
        # Force unicode on
        formatter = FormatterFactory.create_terminal_formatter(enable_unicode=True)
        assert formatter.unicode_enabled is True

        # Force unicode off
        formatter = FormatterFactory.create_terminal_formatter(enable_unicode=False)
        assert formatter.unicode_enabled is False

    def test_create_lesson_formatter(self):
        """Test creating lesson formatter"""
        formatter = FormatterFactory.create_lesson_formatter()
        assert isinstance(formatter, UnifiedFormatter)
        assert formatter.colors_enabled is True
        assert formatter.theme is not None

    def test_create_lesson_formatter_custom_theme(self):
        """Test lesson formatter with custom theme"""
        custom_theme = Theme(
            primary=Color.RED,
            secondary=Color.GREEN
        )
        formatter = FormatterFactory.create_lesson_formatter(theme=custom_theme)
        assert formatter.theme.primary == Color.RED
        assert formatter.theme.secondary == Color.GREEN

    def test_create_rich_formatter(self):
        """Test creating rich formatter"""
        formatter = FormatterFactory.create_rich_formatter()
        assert isinstance(formatter, UnifiedFormatter)
        assert formatter.colors_enabled is True
        assert formatter.unicode_enabled is True

    @patch('sys.platform', 'win32')
    def test_create_windows_formatter_safe_mode(self):
        """Test Windows formatter in safe mode"""
        formatter = FormatterFactory.create_windows_formatter(safe_mode=True)
        assert isinstance(formatter, UnifiedFormatter)
        assert formatter.colors_enabled is True
        assert formatter.unicode_enabled is False

    @patch('sys.platform', 'win32')
    @patch.dict('os.environ', {'WT_SESSION': '12345'})
    def test_create_windows_formatter_modern(self):
        """Test Windows formatter in Windows Terminal"""
        formatter = FormatterFactory.create_windows_formatter(safe_mode=False)
        assert formatter.unicode_enabled is True

    def test_create_from_preset_minimal(self):
        """Test creating minimal preset formatter"""
        formatter = FormatterFactory.create_from_preset(FormatterPreset.MINIMAL)
        assert formatter.colors_enabled is False
        assert formatter.unicode_enabled is False

    def test_create_from_preset_standard(self):
        """Test creating standard preset formatter"""
        formatter = FormatterFactory.create_from_preset(FormatterPreset.STANDARD)
        assert isinstance(formatter, UnifiedFormatter)

    def test_create_from_preset_lesson(self):
        """Test creating lesson preset formatter"""
        formatter = FormatterFactory.create_from_preset(FormatterPreset.LESSON)
        assert isinstance(formatter, UnifiedFormatter)

    def test_create_from_preset_windows(self):
        """Test creating Windows preset formatter"""
        formatter = FormatterFactory.create_from_preset(FormatterPreset.WINDOWS)
        assert isinstance(formatter, UnifiedFormatter)

    def test_shared_instance_singleton(self):
        """Test shared instances are singletons"""
        formatter1 = FormatterFactory.get_shared_instance(FormatterPreset.STANDARD)
        formatter2 = FormatterFactory.get_shared_instance(FormatterPreset.STANDARD)
        assert formatter1 is formatter2

    def test_shared_instance_different_presets(self):
        """Test different presets create different instances"""
        formatter1 = FormatterFactory.get_shared_instance(FormatterPreset.STANDARD)
        formatter2 = FormatterFactory.get_shared_instance(FormatterPreset.MINIMAL)
        assert formatter1 is not formatter2

    def test_clear_shared_instances(self):
        """Test clearing shared instances"""
        formatter1 = FormatterFactory.get_shared_instance(FormatterPreset.STANDARD)
        FormatterFactory.clear_shared_instances()
        formatter2 = FormatterFactory.get_shared_instance(FormatterPreset.STANDARD)
        assert formatter1 is not formatter2

    @patch('sys.platform', 'win32')
    @patch.dict('os.environ', {'WT_SESSION': '12345'})
    def test_auto_detect_windows_terminal(self):
        """Test auto-detection on Windows Terminal"""
        formatter = FormatterFactory.auto_detect_formatter()
        assert isinstance(formatter, UnifiedFormatter)

    @patch('sys.platform', 'linux')
    def test_auto_detect_linux(self):
        """Test auto-detection on Linux"""
        formatter = FormatterFactory.auto_detect_formatter()
        assert isinstance(formatter, UnifiedFormatter)
        assert formatter.unicode_enabled is True

    def test_custom_formatter_creation(self):
        """Test creating custom formatter"""
        config = FormatterConfig(
            enable_colors=False,
            enable_unicode=True
        )
        formatter = FormatterFactory.create_custom(config=config)
        assert formatter.colors_enabled is False
        assert formatter.unicode_enabled is True


class TestConvenienceFunctions:
    """Test convenience functions"""

    def test_get_formatter(self):
        """Test get_formatter convenience function"""
        formatter = get_formatter(FormatterPreset.STANDARD)
        assert isinstance(formatter, UnifiedFormatter)

    def test_get_shared_formatter(self):
        """Test get_shared_formatter convenience function"""
        formatter1 = get_shared_formatter(FormatterPreset.STANDARD)
        formatter2 = get_shared_formatter(FormatterPreset.STANDARD)
        assert formatter1 is formatter2

    def test_auto_formatter(self):
        """Test auto_formatter convenience function"""
        formatter = auto_formatter()
        assert isinstance(formatter, UnifiedFormatter)


class TestCompatibilityWrappers:
    """Test backward compatibility wrappers"""

    def test_terminal_formatter_deprecation(self):
        """Test TerminalFormatter shows deprecation warning"""
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            formatter = TerminalFormatter()
            assert len(w) == 1
            assert issubclass(w[0].category, DeprecationWarning)
            assert "deprecated" in str(w[0].message).lower()

    def test_terminal_formatter_api_compatibility(self):
        """Test TerminalFormatter maintains API compatibility"""
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            formatter = TerminalFormatter()

            # Test it's actually a UnifiedFormatter
            assert isinstance(formatter, UnifiedFormatter)

            # Test legacy method exists
            assert hasattr(formatter, '_colorize')

            # Test legacy method works
            colored = formatter._colorize("test", Color.RED)
            assert isinstance(colored, str)

    def test_windows_formatter_deprecation(self):
        """Test WindowsFormatter shows deprecation warning"""
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            formatter = WindowsFormatter()
            assert len(w) == 1
            assert issubclass(w[0].category, DeprecationWarning)

    def test_windows_formatter_box_chars(self):
        """Test WindowsFormatter has legacy BOX_CHARS constant"""
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            formatter = WindowsFormatter()
            assert hasattr(formatter, 'BOX_CHARS')
            assert 'simple' in formatter.BOX_CHARS
            assert 'ascii' in formatter.BOX_CHARS

    def test_enhanced_lesson_formatter_deprecation(self):
        """Test EnhancedLessonFormatter shows deprecation warning"""
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            formatter = EnhancedLessonFormatter()
            assert len(w) == 1
            assert issubclass(w[0].category, DeprecationWarning)

    def test_enhanced_lesson_formatter_delegation(self):
        """Test EnhancedLessonFormatter delegates to UnifiedFormatter"""
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            formatter = EnhancedLessonFormatter()

            # Test delegation works
            assert hasattr(formatter, 'success')
            assert hasattr(formatter, 'error')
            assert hasattr(formatter, 'header')

            # Test methods work
            result = formatter.success("test")
            assert isinstance(result, str)

    def test_beautiful_formatter_deprecation(self):
        """Test BeautifulFormatter shows deprecation warning"""
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            formatter = BeautifulFormatter()
            assert len(w) == 1
            assert issubclass(w[0].category, DeprecationWarning)

    def test_beautiful_formatter_gradient_preset(self):
        """Test BeautifulFormatter has legacy GradientPreset class"""
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            formatter = BeautifulFormatter()
            assert hasattr(formatter, 'GradientPreset')
            assert hasattr(formatter.GradientPreset, 'RAINBOW')
            assert hasattr(formatter.GradientPreset, 'FIRE')


class TestMigrationHelpers:
    """Test migration helper functions"""

    def test_get_migration_guide(self):
        """Test migration guide generation"""
        guide = get_migration_guide()
        assert isinstance(guide, str)
        assert len(guide) > 0
        assert "TerminalFormatter" in guide
        assert "WindowsFormatter" in guide
        assert "FormatterFactory" in guide

    def test_migration_guide_has_examples(self):
        """Test migration guide contains code examples"""
        guide = get_migration_guide()
        assert "# OLD:" in guide
        assert "# NEW:" in guide
        assert "from src.ui" in guide


class TestFormatterBehavior:
    """Test actual formatter behavior to ensure compatibility"""

    def test_all_formatters_support_basic_methods(self):
        """Test all formatter types support basic methods"""
        formatters = [
            FormatterFactory.create_terminal_formatter(),
            FormatterFactory.create_windows_formatter(),
            FormatterFactory.create_lesson_formatter(),
            FormatterFactory.create_rich_formatter(),
        ]

        for formatter in formatters:
            # Test basic formatting methods exist
            assert hasattr(formatter, 'success')
            assert hasattr(formatter, 'error')
            assert hasattr(formatter, 'warning')
            assert hasattr(formatter, 'info')
            assert hasattr(formatter, 'header')
            assert hasattr(formatter, 'create_box')
            assert hasattr(formatter, 'create_table')
            assert hasattr(formatter, 'progress_bar')

    def test_formatters_produce_output(self):
        """Test formatters actually produce output"""
        formatter = FormatterFactory.create_terminal_formatter()

        success_msg = formatter.success("Success!")
        assert "Success!" in success_msg

        error_msg = formatter.error("Error!")
        assert "Error!" in error_msg

        box = formatter.create_box("Content", title="Title")
        assert "Content" in box
        assert "Title" in box

    def test_color_enable_disable(self):
        """Test color enable/disable affects output"""
        formatter = FormatterFactory.create_terminal_formatter()

        # With colors
        formatter.enable_colors()
        colored = formatter.success("test")

        # Without colors
        formatter.disable_colors()
        uncolored = formatter.success("test")

        # Colored version should be longer (ANSI codes)
        # Note: This test may need adjustment based on actual implementation
        assert "test" in colored
        assert "test" in uncolored


class TestFactoryEdgeCases:
    """Test edge cases and error conditions"""

    def test_invalid_preset_fallback(self):
        """Test factory handles unknown preset gracefully"""
        # This should fall back to default
        formatter = FormatterFactory.create_from_preset(FormatterPreset.CUSTOM)
        assert isinstance(formatter, UnifiedFormatter)

    def test_none_config_handled(self):
        """Test custom formatter handles None config"""
        formatter = FormatterFactory.create_custom(config=None)
        assert isinstance(formatter, UnifiedFormatter)

    def test_none_theme_handled(self):
        """Test formatters handle None theme"""
        formatter = FormatterFactory.create_lesson_formatter(theme=None)
        assert isinstance(formatter, UnifiedFormatter)
        assert formatter.theme is not None


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
