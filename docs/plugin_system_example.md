# Formatter Plugin System - Usage Examples

## Overview

The plugin system provides a flexible, extensible architecture for adding formatting capabilities to the UnifiedFormatter without modifying core code.

## Core Components

### 1. BasePlugin Abstract Class

All plugins must inherit from `BasePlugin` and implement required methods:

```python
from src.ui.formatter_plugins import BasePlugin, PluginCapabilities

class MyCustomPlugin(BasePlugin):
    @property
    def name(self) -> str:
        return "my_custom_plugin"

    @property
    def version(self) -> str:
        return "1.0.0"

    def initialize(self, formatter=None):
        self.formatter = formatter
        print(f"Initialized {self.name}")

    def shutdown(self):
        print(f"Shutting down {self.name}")

    def can_handle(self, content_type: str) -> bool:
        return content_type in ["custom", "special"]

    def format(self, content, **options):
        return f"[CUSTOM] {content} [/CUSTOM]"

    def get_capabilities(self):
        return PluginCapabilities(
            content_types={"custom", "special"},
            features={"custom_formatting"},
        )
```

### 2. PluginRegistry

Manages plugin registration and discovery:

```python
from src.ui.formatter_plugins import PluginRegistry

# Create registry
registry = PluginRegistry()

# Register plugin
my_plugin = MyCustomPlugin()
registry.register(my_plugin)

# Find handler for content type
handler = registry.find_handler("custom")
if handler:
    result = handler.format("Hello World")
    print(result)  # "[CUSTOM] Hello World [/CUSTOM]"

# List all plugins
plugins = registry.list_plugins()
print(f"Registered plugins: {plugins}")

# Get plugin by name
plugin = registry.get_plugin("my_custom_plugin")
```

### 3. PluginManager

Handles plugin lifecycle, lazy loading, and dependencies:

```python
from src.ui.formatter_plugins import PluginManager

# Create manager
manager = PluginManager()

# Register plugin
manager.register(my_plugin)

# Initialize all plugins
manager.initialize_all()

# Auto-select and format with best handler
result = manager.format_with_plugin(
    content_type="custom",
    content="Test content",
    color="blue"
)

# Shutdown all plugins
manager.shutdown_all()
```

## Advanced Features

### Priority-Based Conflict Resolution

When multiple plugins handle the same content type, priority determines which is used:

```python
from src.ui.formatter_plugins import PluginPriority

class HighPriorityPlugin(BasePlugin):
    def __init__(self):
        super().__init__()
        self.set_priority(PluginPriority.HIGH)

    @property
    def name(self):
        return "high_priority"

    def can_handle(self, content_type):
        return content_type == "text"

    # ... other methods

class LowPriorityPlugin(BasePlugin):
    def __init__(self):
        super().__init__()
        self.set_priority(PluginPriority.LOW)

    @property
    def name(self):
        return "low_priority"

    def can_handle(self, content_type):
        return content_type == "text"

    # ... other methods

# Register both
manager.register(HighPriorityPlugin())
manager.register(LowPriorityPlugin())

# HighPriorityPlugin will be selected for "text" content
handler = manager.find_handler("text")
print(handler.name)  # "high_priority"
```

### Pre/Post Processing Hooks

Add processing hooks without modifying plugin code:

```python
class MyPlugin(BasePlugin):
    # ... implementation

    def pre_process(self, content, **options):
        # Custom pre-processing
        return content.strip().upper()

    def post_process(self, formatted, **options):
        # Custom post-processing
        return formatted + "\n---"

# Or add hooks dynamically
plugin = MyPlugin()
plugin.add_pre_hook(lambda c, **kw: c.replace("foo", "bar"))
plugin.add_post_hook(lambda f, **kw: f + " [processed]")
```

### Lazy Loading

Register plugins without loading them immediately:

```python
def load_heavy_plugin():
    # Expensive import or initialization
    from .heavy_plugin import HeavyPlugin
    return HeavyPlugin()

# Register lazy loader
manager.register_lazy("heavy_plugin", load_heavy_plugin)

# Plugin is loaded only when first used
result = manager.format_with_plugin(
    content_type="heavy",
    content="data",
    plugin_name="heavy_plugin"
)
# HeavyPlugin loaded here ^
```

### Dependency Resolution

Plugins can declare dependencies:

```python
class BaseFormatterPlugin(BasePlugin):
    @property
    def name(self):
        return "base_formatter"

    def get_capabilities(self):
        return PluginCapabilities(
            content_types={"text"},
            provides={"basic_formatting"}
        )

    # ... other methods

class AdvancedFormatterPlugin(BasePlugin):
    @property
    def name(self):
        return "advanced_formatter"

    def get_capabilities(self):
        return PluginCapabilities(
            content_types={"advanced"},
            dependencies={"base_formatter"},  # Requires base_formatter
            features={"advanced_formatting"}
        )

    # ... other methods

# Register both
manager.register(BaseFormatterPlugin())
manager.register(AdvancedFormatterPlugin())

# Initializing advanced_formatter automatically initializes base_formatter
manager.initialize("advanced_formatter")
```

### Conflict Detection

Prevent conflicting plugins from being active:

```python
class MarkdownPlugin(BasePlugin):
    def get_capabilities(self):
        return PluginCapabilities(
            content_types={"markdown"},
            conflicts_with={"rst_plugin"}  # Cannot coexist with RST plugin
        )

class RSTPlugin(BasePlugin):
    def get_capabilities(self):
        return PluginCapabilities(
            content_types={"rst"},
            conflicts_with={"markdown_plugin"}
        )

# Attempting to activate conflicting plugins raises error
manager.register(MarkdownPlugin())
manager.register(RSTPlugin())
manager.initialize("markdown_plugin")
# manager.initialize("rst_plugin")  # Raises PluginDependencyError
```

## Real-World Example: Lesson Formatter Plugin

```python
from src.ui.formatter_plugins import BasePlugin, PluginCapabilities
from typing import Dict, Any

class LessonFormatterPlugin(BasePlugin):
    """Plugin for formatting educational lesson content"""

    @property
    def name(self) -> str:
        return "lesson_formatter"

    @property
    def version(self) -> str:
        return "1.0.0"

    def initialize(self, formatter=None):
        self.formatter = formatter
        self.complexity_colors = {
            "easy": "green",
            "medium": "yellow",
            "hard": "red"
        }

    def shutdown(self):
        pass

    def can_handle(self, content_type: str) -> bool:
        return content_type in ["lesson", "lesson_header", "practice_problem"]

    def format(self, content: Dict[str, Any], **options) -> str:
        if not isinstance(content, dict):
            return str(content)

        parts = []

        # Format title
        if "title" in content:
            parts.append(self._format_header(content["title"]))

        # Format complexity badge
        if "complexity" in content:
            parts.append(self._format_complexity(content["complexity"]))

        # Format description
        if "description" in content:
            parts.append(content["description"])

        # Format code examples
        if "examples" in content:
            for example in content["examples"]:
                parts.append(self._format_code(example))

        return "\n\n".join(parts)

    def get_capabilities(self) -> PluginCapabilities:
        return PluginCapabilities(
            content_types={"lesson", "lesson_header", "practice_problem"},
            features={"complexity_badges", "code_examples"},
            provides={"lesson_formatting"}
        )

    def _format_header(self, title: str) -> str:
        return f"{'=' * 60}\n{title:^60}\n{'=' * 60}"

    def _format_complexity(self, level: str) -> str:
        color = self.complexity_colors.get(level.lower(), "white")
        return f"Complexity: [{level.upper()}]"

    def _format_code(self, code: str) -> str:
        return f"```\n{code}\n```"

# Usage
lesson_data = {
    "title": "Binary Search Algorithm",
    "complexity": "medium",
    "description": "Efficient search algorithm for sorted arrays",
    "examples": [
        "def binary_search(arr, target):\n    # implementation"
    ]
}

manager = PluginManager()
plugin = LessonFormatterPlugin()
manager.register(plugin)
manager.initialize_all()

result = manager.format_with_plugin("lesson", lesson_data)
print(result)
```

## Plugin Configuration

Plugins can be configured with options:

```python
from src.ui.formatter_plugins import PluginConfig, PluginPriority

config = PluginConfig(
    enabled=True,
    priority=PluginPriority.HIGH,
    options={
        "color_scheme": "dark",
        "show_line_numbers": True,
        "max_width": 80
    }
)

plugin = MyPlugin()
plugin.configure(config)

# Access options
color_scheme = plugin.get_option("color_scheme", default="light")
max_width = plugin.get_option("max_width", default=100)
```

## Error Handling

The plugin system provides specific exceptions:

```python
from src.ui.formatter_plugins import (
    PluginError,
    PluginNotFoundError,
    PluginDependencyError,
    PluginInitializationError
)

try:
    manager.initialize("nonexistent_plugin")
except PluginNotFoundError as e:
    print(f"Plugin not found: {e}")

try:
    manager.format_with_plugin("unknown_type", "content")
except PluginNotFoundError as e:
    print(f"No handler for content type: {e}")

try:
    # Plugin with unresolved dependencies
    manager.initialize("dependent_plugin")
except PluginDependencyError as e:
    print(f"Dependency error: {e}")
```

## Best Practices

1. **Single Responsibility**: Each plugin should handle one specific content type or feature
2. **Graceful Degradation**: Provide fallbacks for when dependencies are missing
3. **Minimal Dependencies**: Avoid heavy dependencies that slow down initialization
4. **Clear Capabilities**: Accurately declare what the plugin provides
5. **Resource Cleanup**: Always implement proper shutdown logic
6. **Error Handling**: Handle errors gracefully and log useful information
7. **Documentation**: Document plugin capabilities and usage

## Integration with UnifiedFormatter

The plugin system integrates seamlessly with UnifiedFormatter:

```python
from src.ui.formatter.unified_formatter import UnifiedFormatter

# Create formatter with plugins
formatter = UnifiedFormatter.create(
    plugins=["lesson_formatter", "markdown", "code_highlighter"]
)

# Plugins are automatically initialized
result = formatter.format(lesson_data, content_type="lesson")
```

## Testing Plugins

```python
import pytest
from src.ui.formatter_plugins import BasePlugin, PluginManager

class TestMyPlugin:
    @pytest.fixture
    def plugin(self):
        return MyCustomPlugin()

    @pytest.fixture
    def manager(self, plugin):
        mgr = PluginManager()
        mgr.register(plugin)
        mgr.initialize_all()
        return mgr

    def test_plugin_registration(self, manager):
        assert manager.get_plugin("my_custom_plugin") is not None

    def test_content_handling(self, plugin):
        assert plugin.can_handle("custom") is True
        assert plugin.can_handle("unknown") is False

    def test_formatting(self, manager):
        result = manager.format_with_plugin("custom", "test")
        assert "[CUSTOM]" in result
        assert "test" in result
```
