# Formatter Plugin System Documentation

## Overview

The Formatter Plugin System extends the UnifiedFormatter with modular, optional functionality. Plugins provide additional content type handlers, rendering strategies, and formatting capabilities without modifying core code.

## Architecture

```
UnifiedFormatter
    ├── Plugin System (optional, graceful fallback)
    ├── Plugin Manager (coordinates multiple plugins)
    └── Plugins
        ├── GradientPlugin (color transitions)
        ├── AnimationPlugin (spinners, typewriter effects)
        └── WindowsOptimizerPlugin (Windows compatibility)
```

## Core Components

### 1. GradientPlugin

**Location**: `src/ui/formatter_plugins/gradient_plugin.py`

**Purpose**: Text gradient and color transition effects

**Features**:
- Linear gradients (left-to-right color transitions)
- Radial gradients (center-to-edges transitions)
- Rainbow gradients with customizable hue ranges
- Multi-color gradients with custom stops
- Terminal capability detection with ASCII fallbacks
- 256-color support with 16-color fallback

**Usage**:
```python
from src.ui.unified_formatter import UnifiedFormatter
from src.ui.formatter_plugins.gradient_plugin import GradientPlugin

formatter = UnifiedFormatter()
gradient = GradientPlugin()
formatter.attach_plugin(gradient)

# Linear gradient
text = gradient.linear_gradient("Hello World", "cyan", "magenta")

# Rainbow gradient
text = gradient.rainbow_gradient("Rainbow Text!")

# Radial gradient
text = gradient.radial_gradient("Center Focus", "white", "blue")

# Custom gradient
text = gradient.custom_gradient("Multi-color", ["red", "yellow", "green"])
```

**Gradient Types**:
- `LINEAR`: Left to right color transition
- `LINEAR_REVERSE`: Right to left color transition
- `RADIAL`: Center to edges transition
- `RAINBOW`: Full spectrum gradient
- `CUSTOM`: User-defined color stops

### 2. AnimationPlugin

**Location**: `src/ui/formatter_plugins/animation_plugin.py`

**Purpose**: Animation and visual effects for terminal output

**Features**:
- 20+ spinner styles (dots, arrows, blocks, emoji)
- Progress animations with ETA calculation
- Typewriter effects with customizable speed
- Fade in/out animations
- Slide transitions (left, right)
- Non-blocking threaded animations
- Cross-platform with ASCII fallbacks

**Usage**:
```python
from src.ui.unified_formatter import UnifiedFormatter
from src.ui.formatter_plugins.animation_plugin import AnimationPlugin, SpinnerStyle

formatter = UnifiedFormatter()
animation = AnimationPlugin()
formatter.attach_plugin(animation)

# Spinner animation (context manager)
with animation.spinner("Loading...", style=SpinnerStyle.DOTS):
    # Perform long operation
    time.sleep(3)

# Typewriter effect
animation.typewriter("This appears character by character", speed=0.05)

# Fade in effect
animation.fade_in("This text fades in gradually", steps=10, duration=2.0)

# Slide animation
animation.slide("This slides across the screen", direction="left")

# Progress animation
progress = animation.progress_animation(total=100, description="Processing")
for i in range(100):
    progress.update(1)
    time.sleep(0.01)
```

**Spinner Styles**:
- Unicode: DOTS, DOTS2, CIRCLES, ARROWS, BARS, BLOCKS, CLOCK, MOON, EARTH, STAR
- ASCII: ASCII_DOTS, ASCII_BARS, ASCII_ARROWS, ASCII_BLOCKS, ASCII_PLUS

### 3. WindowsOptimizerPlugin

**Location**: `src/ui/formatter_plugins/windows_plugin.py`

**Purpose**: Windows-specific terminal optimizations and compatibility

**Features**:
- Automatic Windows console capability detection
- ANSI escape sequence support via colorama or Windows API
- Safe character sets for Windows console
- Box drawing with ASCII alternatives
- Code page detection and handling
- Console mode verification
- Terminal size detection
- Cursor manipulation

**Usage**:
```python
from src.ui.unified_formatter import UnifiedFormatter
from src.ui.formatter_plugins.windows_plugin import WindowsOptimizerPlugin

formatter = UnifiedFormatter()
windows = WindowsOptimizerPlugin()
formatter.attach_plugin(windows)

# Detect capabilities
caps = windows.detect_capabilities()
print(f"ANSI support: {caps['ansi']}")
print(f"Unicode support: {caps['unicode']}")

# Create safe box
box = windows.create_safe_box(
    "Content here",
    title="Safe Box",
    style="simple"
)

# Safe progress bar
bar = windows.create_progress_bar(75, 100, width=40)

# Get safe characters
check_mark = windows.safe_characters('check')  # ✓ or 'v'
bullet = windows.safe_characters('bullet')     # • or '*'
```

## Plugin Management

### Attaching Plugins

```python
from src.ui.unified_formatter import UnifiedFormatter
from src.ui.formatter_plugins.gradient_plugin import GradientPlugin

formatter = UnifiedFormatter()

# Attach single plugin
gradient = GradientPlugin()
formatter.attach_plugin(gradient)

# Attach multiple plugins
formatter.attach_plugin(AnimationPlugin())
formatter.attach_plugin(WindowsOptimizerPlugin())
```

### Listing Plugins

```python
# List all attached plugins
plugins = formatter.list_plugins()
print(plugins)  # ['gradient', 'animation', 'windows_optimizer']
```

### Getting Plugins

```python
# Get specific plugin
gradient = formatter.get_plugin('gradient')
if gradient:
    text = gradient.rainbow_gradient("Rainbow!")
```

### Detaching Plugins

```python
# Detach specific plugin
success = formatter.detach_plugin('gradient')
print(f"Detached: {success}")  # True if successful
```

## FormatterFactory Integration

The `FormatterFactory` automatically attaches appropriate plugins based on formatter type:

### Rich Formatter

```python
from src.ui.formatter_factory import FormatterFactory

# Create rich formatter with plugins
formatter = FormatterFactory.create_rich_formatter(
    gradient_enabled=True,      # Attach GradientPlugin
    animations_enabled=True     # Attach AnimationPlugin
)
```

### Windows Formatter

```python
# Create Windows-optimized formatter with optimizer plugin
formatter = FormatterFactory.create_windows_formatter(
    safe_mode=True  # Automatically attaches WindowsOptimizerPlugin
)
```

### Custom Formatter

```python
from src.ui.formatter_plugins.gradient_plugin import GradientPlugin
from src.ui.formatter_plugins.animation_plugin import AnimationPlugin

# Create custom formatter with specific plugins
formatter = FormatterFactory.create_custom(
    plugins=[
        GradientPlugin(),
        AnimationPlugin()
    ]
)
```

## Error Handling

The plugin system is designed to fail gracefully:

1. **Missing Plugins**: If a plugin module is not available, formatters continue working without it
2. **Plugin Initialization Errors**: Logged as warnings, don't crash the formatter
3. **Invalid Plugins**: Raise `TypeError` with helpful message
4. **Platform Incompatibility**: Plugins automatically detect and adapt

```python
# Safe plugin attachment with error handling
try:
    from src.ui.formatter_plugins.gradient_plugin import GradientPlugin
    formatter.attach_plugin(GradientPlugin())
except ImportError:
    print("Gradient plugin not available")
except Exception as e:
    print(f"Plugin error: {e}")
```

## Creating Custom Plugins

### Basic Plugin Structure

```python
from src.ui.formatter_plugins.base import BasePlugin, PluginCapabilities, PluginMetadata

class MyCustomPlugin(BasePlugin):
    @property
    def name(self) -> str:
        return "my_plugin"

    @property
    def version(self) -> str:
        return "1.0.0"

    def initialize(self, formatter=None):
        """Initialize plugin with formatter instance"""
        self.formatter = formatter
        # Setup resources here

    def shutdown(self):
        """Clean up plugin resources"""
        # Cleanup here
        pass

    def can_handle(self, content_type: str) -> bool:
        """Check if plugin can handle content type"""
        return content_type in {'my_content', 'custom'}

    def format(self, content, **options) -> str:
        """Format content using this plugin"""
        # Custom formatting logic
        return f"[CUSTOM] {content}"

    def get_capabilities(self) -> PluginCapabilities:
        """Describe plugin capabilities"""
        return PluginCapabilities(
            content_types={'my_content', 'custom'},
            features={'custom_formatting'},
            provides={'my_custom_feature'}
        )
```

### Advanced Plugin Features

```python
class AdvancedPlugin(BasePlugin):
    def __init__(self):
        super().__init__()
        self.custom_state = {}

    def pre_process(self, content, **options):
        """Pre-process content before formatting"""
        # Modify content before formatting
        return content.upper()

    def post_process(self, formatted, **options):
        """Post-process formatted content"""
        # Modify formatted output
        return formatted + " [processed]"

    def validate_content(self, content) -> bool:
        """Validate content before formatting"""
        return isinstance(content, str) and len(content) > 0

    def get_metadata(self) -> PluginMetadata:
        """Provide detailed plugin metadata"""
        return PluginMetadata(
            name=self.name,
            version=self.version,
            author="Your Name",
            description="Advanced plugin with custom features",
            tags=['advanced', 'custom']
        )
```

## Testing Plugins

All plugins should have comprehensive tests:

```python
import pytest
from src.ui.unified_formatter import UnifiedFormatter
from src.ui.formatter_plugins.gradient_plugin import GradientPlugin

def test_gradient_plugin():
    """Test gradient plugin functionality"""
    formatter = UnifiedFormatter()
    gradient = GradientPlugin()

    # Test attachment
    formatter.attach_plugin(gradient)
    assert 'gradient' in formatter.list_plugins()

    # Test functionality
    result = gradient.linear_gradient("Test", "cyan", "magenta")
    assert result is not None
    assert isinstance(result, str)
```

## Performance Considerations

1. **Lazy Loading**: Plugins are only loaded when attached
2. **Graceful Degradation**: Core formatter works without plugins
3. **Minimal Overhead**: Plugins don't impact formatter performance when not used
4. **Thread Safety**: Animation plugins use daemon threads that clean up automatically

## Best Practices

1. **Always use try-except**: Wrap plugin imports and attachments in error handlers
2. **Check capabilities**: Use `detect_capabilities()` for platform-specific features
3. **Provide fallbacks**: Always have ASCII/simple alternatives for visual effects
4. **Test thoroughly**: Test on multiple platforms (Windows, macOS, Linux)
5. **Document clearly**: Include usage examples and limitations
6. **Version carefully**: Use semantic versioning for plugin versions

## Troubleshooting

### Plugin Not Found

```python
# Check if plugin is available
try:
    from src.ui.formatter_plugins.gradient_plugin import GradientPlugin
    print("Plugin available")
except ImportError:
    print("Plugin not found - check installation")
```

### Plugin Not Initializing

```python
# Enable logging to see plugin errors
import logging
logging.basicConfig(level=logging.DEBUG)

formatter = UnifiedFormatter()
formatter.attach_plugin(GradientPlugin())  # Check logs for errors
```

### Features Not Working

```python
# Check platform capabilities
from src.ui.formatter_plugins.windows_plugin import WindowsOptimizerPlugin

windows = WindowsOptimizerPlugin()
windows.initialize()
caps = windows.detect_capabilities()

print(f"Colors supported: {caps['colors']}")
print(f"Unicode supported: {caps['unicode']}")
print(f"ANSI supported: {caps['ansi']}")
```

## Examples

See `examples/plugin_demo.py` for comprehensive demonstrations of all plugin features.

## API Reference

### UnifiedFormatter Plugin Methods

- `attach_plugin(plugin)`: Attach a plugin instance
- `detach_plugin(name)`: Detach plugin by name
- `get_plugin(name)`: Retrieve plugin by name
- `list_plugins()`: List all attached plugin names

### Plugin Base Class Methods

- `initialize(formatter)`: Initialize plugin with formatter
- `shutdown()`: Clean up plugin resources
- `can_handle(content_type)`: Check if plugin handles content type
- `format(content, **options)`: Format content
- `get_capabilities()`: Get plugin capabilities
- `get_metadata()`: Get plugin metadata
- `pre_process(content, **options)`: Pre-process content
- `post_process(formatted, **options)`: Post-process formatted output

## Version History

- **1.0.0** (2025-01-09): Initial plugin system implementation
  - GradientPlugin with 5 gradient types
  - AnimationPlugin with 20+ styles
  - WindowsOptimizerPlugin with full Windows support
  - Plugin management system in UnifiedFormatter
  - FormatterFactory integration
