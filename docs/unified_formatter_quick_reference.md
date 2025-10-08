# Unified Formatter Quick Reference

## For Developers

### Basic Usage

```python
# Import
from src.ui.formatter import UnifiedFormatter

# Create formatter
formatter = UnifiedFormatter.create()

# Or use presets
lesson_formatter = UnifiedFormatter.create_for_lesson()
cli_formatter = UnifiedFormatter.create_for_cli()
```

### Common Operations

#### Text Formatting
```python
# Basic text
formatter.format_text("Hello, world!")

# With color
formatter.format_text("Success!", color=Color.GREEN)

# Status messages
formatter.success("Operation complete")
formatter.error("Something went wrong")
formatter.warning("Be careful")
formatter.info("FYI: ...")
```

#### Structure

```python
# Create box
formatter.create_box("Important message", title="Alert")

# Create header
formatter.create_header("Section Title", level=1)

# Create divider
formatter.create_divider(title="Section Break")
```

#### Lists and Tables

```python
# Bullet list
items = ["Item 1", "Item 2", "Item 3"]
formatter.format_list(items, style='bullet')

# Numbered list
formatter.format_list(items, style='number')

# Table
headers = ["Name", "Age", "City"]
rows = [
    ["Alice", "30", "NYC"],
    ["Bob", "25", "LA"]
]
formatter.format_table(rows, headers=headers)
```

#### Code

```python
code = """
def hello():
    print("Hello, world!")
"""

formatter.format_code(code, language='python', line_numbers=True)
```

#### Progress

```python
# Simple progress bar
formatter.progress_bar(current=5, total=10, description="Loading")

# Spinner (context manager)
with formatter.spinner("Processing..."):
    # Long-running operation
    time.sleep(2)
```

### Configuration

#### Themes

```python
# Use built-in theme
formatter.set_theme('dark')

# Custom theme
from src.ui.formatter import Theme, Color

custom_theme = Theme(
    name='custom',
    primary=Color.CYAN,
    success=Color.GREEN,
    error=Color.RED
)
formatter.set_theme(custom_theme)
```

#### Enable/Disable Features

```python
# Disable colors
formatter.enable_colors(False)

# Clear cache
formatter.clear_cache()
```

### Plugin Development

#### Create a Plugin

```python
from src.ui.formatter.plugins import Plugin, PluginAPI

class MyPlugin(Plugin):
    @property
    def name(self) -> str:
        return "my_plugin"

    @property
    def version(self) -> str:
        return "1.0.0"

    def initialize(self, formatter: UnifiedFormatter) -> None:
        # Register strategies, add features
        pass

    def cleanup(self) -> None:
        # Cleanup resources
        pass
```

#### Register Plugin

```python
formatter = UnifiedFormatter.create()
formatter.register_plugin(MyPlugin())
```

### Migration from Old Formatters

#### Old Code (Before)

```python
from .formatter import TerminalFormatter
from .lesson_display import LessonDisplay

formatter = TerminalFormatter()
display = LessonDisplay(formatter)

formatter.header("Title", level=1)
display.display_lesson(lesson_data)
```

#### New Code (After)

```python
from .formatter import UnifiedFormatter

formatter = UnifiedFormatter.create_for_lesson()

formatter.create_header("Title", level=1)
formatter.format(lesson_data, content_type='lesson')
```

### Testing

#### Unit Test Example

```python
import pytest
from src.ui.formatter import UnifiedFormatter

def test_format_text():
    formatter = UnifiedFormatter.create(colors=True)
    result = formatter.format_text("Test")
    assert "Test" in result

def test_create_box():
    formatter = UnifiedFormatter.create()
    result = formatter.create_box("Content", title="Title")
    assert "Content" in result
    assert "Title" in result
```

#### Mock Plugin for Testing

```python
class MockPlugin(Plugin):
    def __init__(self):
        self.initialized = False

    @property
    def name(self) -> str:
        return "mock"

    def initialize(self, formatter) -> None:
        self.initialized = True
```

### Performance Tips

1. **Use caching for repeated content**
   ```python
   # Cache is automatic, but you can clear it
   formatter.clear_cache()
   ```

2. **Disable features you don't need**
   ```python
   # Disable colors if not needed
   formatter.enable_colors(False)
   ```

3. **Reuse formatter instances**
   ```python
   # Create once, use many times
   formatter = UnifiedFormatter.create()
   for item in items:
       formatter.format(item)
   ```

4. **Use appropriate content types**
   ```python
   # Specify content type for optimized rendering
   formatter.format(data, content_type='lesson')
   ```

### Troubleshooting

#### Colors not showing on Windows?

```python
# Try enabling explicitly
formatter = UnifiedFormatter.create(
    platform='windows',
    colors=True
)
```

#### Unicode characters broken?

```python
# Disable unicode, use ASCII
formatter = UnifiedFormatter.create(unicode=False)
```

#### Performance slow?

```python
# Check if caching is enabled
formatter.cache.get_stats()

# Profile rendering
import cProfile
cProfile.run('formatter.format(data)')
```

### API Cheat Sheet

| Method | Purpose | Example |
|--------|---------|---------|
| `format_text()` | Format plain text | `format_text("Hello", color=Color.RED)` |
| `success()` | Success message | `success("Done!")` |
| `error()` | Error message | `error("Failed!")` |
| `warning()` | Warning message | `warning("Careful!")` |
| `info()` | Info message | `info("Note: ...")` |
| `create_box()` | Create box | `create_box("Content", title="Box")` |
| `create_header()` | Create header | `create_header("Title", level=1)` |
| `create_divider()` | Create divider | `create_divider(title="Section")` |
| `format_code()` | Format code | `format_code(code, language='python')` |
| `format_list()` | Format list | `format_list(items, style='bullet')` |
| `format_table()` | Format table | `format_table(rows, headers=headers)` |
| `progress_bar()` | Progress bar | `progress_bar(5, 10, "Loading")` |
| `spinner()` | Spinner | `with spinner("Wait..."): ...` |
| `set_theme()` | Change theme | `set_theme('dark')` |
| `register_plugin()` | Add plugin | `register_plugin(MyPlugin())` |

### File Locations

```
src/ui/formatter/
├── __init__.py                    # Public API
├── core/
│   ├── unified_formatter.py       # Main class
│   ├── platform_detector.py       # Platform detection
│   ├── theme_manager.py           # Theme management
│   └── render_pipeline.py         # Rendering pipeline
├── plugins/
│   ├── lesson_formatter.py        # Lesson plugin
│   ├── rich_formatter.py          # Rich plugin
│   ├── markdown.py                # Markdown plugin
│   ├── animation.py               # Animation plugin
│   └── windows_optimizer.py       # Windows plugin
├── strategies/
│   ├── text_strategy.py           # Text rendering
│   ├── code_strategy.py           # Code rendering
│   └── table_strategy.py          # Table rendering
└── compat/
    ├── terminal_formatter.py      # Old wrapper (temporary)
    └── lesson_display.py          # Old wrapper (temporary)
```

### Getting Help

1. **Documentation**: See `docs/unified_formatter_architecture.md`
2. **Examples**: See `docs/SPARC_EXAMPLES.md`
3. **API Reference**: See docstrings in `unified_formatter.py`
4. **Issues**: Report to project maintainer

---

**Quick Start Tip**: For most use cases, just do:
```python
from src.ui.formatter import UnifiedFormatter
formatter = UnifiedFormatter.create()
```

Then explore methods with IDE autocomplete or `dir(formatter)`!
