# Formatter Factory & Compatibility Layer Guide

## Overview

The **FormatterFactory** and **Compatibility Layer** provide a clean, centralized way to create and configure formatters while maintaining 100% backward compatibility with existing code.

## What Was Created

### 1. FormatterFactory (`src/ui/formatter_factory.py`) - 363 lines

A comprehensive factory for creating pre-configured formatters with:

- **Factory Methods** for different use cases:
  - `create_terminal_formatter()` - Standard terminal output
  - `create_lesson_formatter()` - Curriculum display optimization
  - `create_rich_formatter()` - Maximum visual effects
  - `create_windows_formatter()` - Windows-optimized with safe characters
  - `create_custom()` - Custom configuration

- **Preset System** with `FormatterPreset` enum:
  - `MINIMAL` - No plugins, basic formatting only
  - `STANDARD` - Platform-appropriate defaults
  - `FULL` / `RICH` - All features enabled
  - `WINDOWS` - Windows-optimized
  - `LESSON` - Curriculum display
  - `TERMINAL` - Generic compatibility
  - `CUSTOM` - User-defined

- **Singleton Pattern** for shared instances:
  - `get_shared_instance()` - Reuse formatter across modules
  - `clear_shared_instances()` - Reset singletons

- **Auto-Detection**:
  - `auto_detect_formatter()` - Best formatter for platform
  - Detects Windows Terminal vs. legacy console
  - Detects Linux/macOS for unicode support

### 2. Compatibility Wrappers (`src/ui/formatter_compat.py`) - 337 lines

Backward compatibility layer providing:

- **TerminalFormatter** - Wraps UnifiedFormatter with legacy API
- **WindowsFormatter** - Windows-optimized wrapper
- **EnhancedLessonFormatter** - Lesson display wrapper
- **BeautifulFormatter** - Rich effects wrapper

All wrappers:
- ✅ Show deprecation warnings
- ✅ Maintain exact same API as old formatters
- ✅ Delegate to UnifiedFormatter
- ✅ Zero breaking changes for existing code

### 3. Migration Guide

Built-in migration guide accessible via:
```python
from src.ui.formatter_compat import get_migration_guide, print_migration_guide

# Get guide as string
guide = get_migration_guide()

# Print to console
print_migration_guide()
```

### 4. Comprehensive Tests (`tests/test_formatter_factory.py`)

37 tests covering:
- ✅ All factory methods
- ✅ All presets
- ✅ Singleton behavior
- ✅ Auto-detection
- ✅ Compatibility wrappers
- ✅ Deprecation warnings
- ✅ API compatibility
- ✅ Edge cases

**Test Results**: 37/37 passing ✅

## Usage Examples

### Basic Usage - Factory Pattern

```python
from src.ui.formatter_factory import FormatterFactory, FormatterPreset

# Create standard terminal formatter
formatter = FormatterFactory.create_terminal_formatter()

# Create lesson formatter
formatter = FormatterFactory.create_lesson_formatter()

# Create Windows-optimized formatter
formatter = FormatterFactory.create_windows_formatter(safe_mode=True)

# Create rich formatter with all effects
formatter = FormatterFactory.create_rich_formatter()
```

### Preset-Based Creation

```python
from src.ui.formatter_factory import FormatterFactory, FormatterPreset

# Use preset
formatter = FormatterFactory.create_from_preset(FormatterPreset.STANDARD)

# Minimal formatter (no colors, no unicode)
formatter = FormatterFactory.create_from_preset(FormatterPreset.MINIMAL)

# Full-featured formatter
formatter = FormatterFactory.create_from_preset(FormatterPreset.FULL)
```

### Shared Instances (Singleton)

```python
from src.ui.formatter_factory import FormatterFactory, FormatterPreset

# Get shared instance (created once, reused everywhere)
formatter1 = FormatterFactory.get_shared_instance(FormatterPreset.STANDARD)
formatter2 = FormatterFactory.get_shared_instance(FormatterPreset.STANDARD)
assert formatter1 is formatter2  # Same instance

# Clear all shared instances
FormatterFactory.clear_shared_instances()
```

### Auto-Detection

```python
from src.ui.formatter_factory import FormatterFactory

# Let factory choose best formatter for platform
formatter = FormatterFactory.auto_detect_formatter()

# On Windows: Returns Windows-optimized formatter
# On Windows Terminal: Enables unicode
# On Linux/macOS: Returns full-featured formatter
```

### Convenience Functions

```python
from src.ui.formatter_factory import get_formatter, get_shared_formatter, auto_formatter

# Quick factory access
formatter = get_formatter(FormatterPreset.STANDARD)

# Quick shared instance
formatter = get_shared_formatter(FormatterPreset.STANDARD)

# Quick auto-detection
formatter = auto_formatter()
```

### Custom Configuration

```python
from src.ui.formatter_factory import FormatterFactory, FormatterConfig
from src.ui.unified_formatter import Theme, Color

# Custom theme
theme = Theme(
    primary=Color.BRIGHT_CYAN,
    success=Color.BRIGHT_GREEN,
    error=Color.BRIGHT_RED
)

# Custom config
config = FormatterConfig(
    enable_colors=True,
    enable_unicode=False,
    theme=theme
)

formatter = FormatterFactory.create_custom(config=config, theme=theme)
```

## Backward Compatibility

### Using Compatibility Wrappers

Existing code continues to work with deprecation warnings:

```python
# OLD CODE (still works, shows deprecation warning)
from src.ui.formatter import TerminalFormatter
formatter = TerminalFormatter()

# NEW CODE (recommended)
from src.ui.formatter_factory import FormatterFactory
formatter = FormatterFactory.create_terminal_formatter()
```

### Migration Path

1. **Phase 1**: Continue using old formatters (with warnings)
2. **Phase 2**: Update imports to use FormatterFactory
3. **Phase 3**: Remove deprecated imports

All existing method calls remain unchanged:
```python
# These work with ALL formatter types
formatter.success("Success!")
formatter.error("Error!")
formatter.header("Title")
formatter.create_box("Content", title="Box")
formatter.create_table(headers, rows)
formatter.progress_bar(50, 100)
```

## Architecture Benefits

### Before (5 Formatters):
```
TerminalFormatter (1510 lines, 65% duplication)
WindowsFormatter (758 lines, 76% duplication)
UnifiedFormatter (398 lines, 50% duplication)
BeautifulFormatter (892 lines, 70% duplication)
EnhancedLessonFormatter (563 lines, 0% duplication)
```

### After (Factory + Wrappers):
```
UnifiedFormatter (398 lines, core)
FormatterFactory (363 lines, creation logic)
Compatibility Wrappers (337 lines, legacy support)
```

### Improvements:
- ✅ **Single source of truth** - UnifiedFormatter is core
- ✅ **Centralized creation** - Factory handles all configuration
- ✅ **Zero breaking changes** - Wrappers maintain compatibility
- ✅ **Platform detection** - Auto-selects best formatter
- ✅ **Shared instances** - Singleton pattern reduces memory
- ✅ **Easy testing** - Factory makes mocking simple
- ✅ **Clear migration path** - Deprecation warnings guide users

## Configuration Presets

| Preset | Colors | Unicode | Best For |
|--------|--------|---------|----------|
| `MINIMAL` | ❌ | ❌ | Testing, logs, minimal output |
| `STANDARD` | ✅ | Platform-based | General terminal use |
| `TERMINAL` | ✅ | Platform-based | Generic terminal compatibility |
| `WINDOWS` | ✅ | Safe mode | Windows console (legacy) |
| `LESSON` | ✅ | Platform-based | Curriculum display |
| `RICH` | ✅ | ✅ | Maximum visual effects |
| `FULL` | ✅ | ✅ | All features enabled |
| `CUSTOM` | User-defined | User-defined | Custom requirements |

## Platform Detection

The factory automatically detects:

- **Windows Legacy Console**: Safe mode, ASCII-only
- **Windows Terminal**: Full unicode support
- **Linux/macOS**: Full features enabled

## Next Steps

### Immediate (Complete ✅):
- ✅ FormatterFactory with all preset methods
- ✅ Compatibility wrappers with deprecation warnings
- ✅ Comprehensive test suite (37 tests passing)
- ✅ Platform auto-detection
- ✅ Singleton pattern for shared instances

### Future Enhancements:
- 🔄 Plugin integration (gradient, animation, windows optimizer)
- 🔄 Configuration file support (.formatter_config.yaml)
- 🔄 Plugin registry for third-party formatters
- 🔄 Performance optimization (caching, lazy loading)

## API Reference

### FormatterFactory Methods

```python
class FormatterFactory:
    # Factory methods
    @classmethod
    def create_terminal_formatter(cls, enable_colors=True, enable_unicode=None) -> UnifiedFormatter

    @classmethod
    def create_lesson_formatter(cls, theme=None) -> UnifiedFormatter

    @classmethod
    def create_rich_formatter(cls, gradient_enabled=True, animations_enabled=True) -> UnifiedFormatter

    @classmethod
    def create_windows_formatter(cls, safe_mode=True) -> UnifiedFormatter

    @classmethod
    def create_custom(cls, plugins=None, config=None, theme=None) -> UnifiedFormatter

    # Preset creation
    @classmethod
    def create_from_preset(cls, preset: FormatterPreset, **kwargs) -> UnifiedFormatter

    # Singleton management
    @classmethod
    def get_shared_instance(cls, preset=FormatterPreset.STANDARD) -> UnifiedFormatter

    @classmethod
    def clear_shared_instances(cls) -> None

    # Auto-detection
    @classmethod
    def auto_detect_formatter(cls) -> UnifiedFormatter
```

### Convenience Functions

```python
# Quick factory access
def get_formatter(preset=FormatterPreset.STANDARD) -> UnifiedFormatter

# Quick shared instance
def get_shared_formatter(preset=FormatterPreset.STANDARD) -> UnifiedFormatter

# Quick auto-detection
def auto_formatter() -> UnifiedFormatter
```

### Compatibility Wrappers

```python
# All show deprecation warnings and delegate to UnifiedFormatter
class TerminalFormatter(UnifiedFormatter)
class WindowsFormatter(UnifiedFormatter)
class BeautifulFormatter(UnifiedFormatter)
class EnhancedLessonFormatter  # Delegates via __getattr__
```

## File Locations

```
src/ui/
├── formatter_factory.py      # Factory for creating formatters (363 lines)
├── formatter_compat.py        # Compatibility wrappers (337 lines)
├── unified_formatter.py       # Core formatter (398 lines)
└── formatter_plugins/         # Plugin system (future)

tests/
└── test_formatter_factory.py  # Comprehensive tests (37 tests, 100% pass)

docs/
└── FORMATTER_FACTORY_GUIDE.md # This guide
```

## Summary

The FormatterFactory and Compatibility Layer provide:

1. **Clean API** - Centralized formatter creation
2. **Zero Breaking Changes** - 100% backward compatible
3. **Platform Optimization** - Auto-detection and safe defaults
4. **Easy Migration** - Deprecation warnings and guide
5. **Testability** - Comprehensive test coverage
6. **Future-Proof** - Plugin system ready

All existing code continues to work while new code can adopt the cleaner factory pattern.
