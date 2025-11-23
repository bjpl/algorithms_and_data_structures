# ADR-005: Unified Formatter Pattern

## Status
Accepted

## Context

The application displays various types of content in the terminal:
- Curriculum listings (courses, modules, lessons)
- Lesson content (text, code examples, diagrams)
- Progress reports and analytics
- Search results
- User notes and annotations
- Error messages and status updates

Initial implementation had:
- Multiple formatter implementations (15+ formatter files)
- Duplicated formatting logic across UI components
- Inconsistent styling and layout
- Difficult to maintain and extend
- Large files (some >1000 lines)
- Hard to test in isolation

The codebase had grown organically with formatters scattered across:
- `src/ui/formatter/` - Generic formatters
- `src/ui/interactive.py` - Interactive formatters
- `src/ui/enhanced_interactive.py` - Enhanced formatters
- Various command files - Inline formatting logic

This created maintenance burden and inconsistent user experience.

## Decision

We will implement a **Unified Formatter Pattern** with a plugin architecture:

### Core Components

1. **UnifiedFormatter**: Central formatter coordinating all formatting
2. **FormatterPlugin**: Base class for all formatter plugins
3. **FormatterFactory**: Creates appropriate formatters dynamically
4. **Plugin Registry**: Discovers and registers formatter plugins

### Architecture

```
UnifiedFormatter (src/ui/unified_formatter.py)
├── Plugin Registry (loads plugins from src/ui/formatter_plugins/)
├── FormatterFactory (creates formatters by type)
└── Plugins:
    ├── LessonFormatterPlugin (lesson content)
    ├── ListFormatterPlugin (curriculum lists)
    ├── ProgressFormatterPlugin (progress reports)
    ├── SearchFormatterPlugin (search results)
    ├── NotesFormatterPlugin (user notes)
    └── [Custom plugins...]
```

### Plugin Interface

```python
class FormatterPlugin(ABC):
    """Base class for all formatter plugins."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Plugin identifier."""
        pass

    @property
    @abstractmethod
    def supported_types(self) -> List[str]:
        """Content types this plugin can format."""
        pass

    @abstractmethod
    def format(self, content: Any, options: Dict[str, Any]) -> str:
        """Format content and return rich markup."""
        pass

    def validate(self, content: Any) -> bool:
        """Validate content can be formatted by this plugin."""
        return True
```

### Usage

```python
# Initialize unified formatter
formatter = UnifiedFormatter()

# Automatic plugin discovery
formatter.discover_plugins("src/ui/formatter_plugins/")

# Format any content type
formatted = formatter.format(lesson, content_type="lesson")
formatted = formatter.format(progress, content_type="progress")
formatted = formatter.format(results, content_type="search")
```

## Consequences

### Positive Consequences

1. **Consolidation**
   - 15+ formatter files reduced to 5 plugins + core
   - Eliminated 5,000+ lines of duplicate code
   - Single source of truth for formatting
   - Easier to locate formatting logic

2. **Extensibility**
   - New content types = new plugin (no core changes)
   - Plugins can override default formatting
   - Third-party plugins possible
   - A/B test formatting styles easily

3. **Consistency**
   - All content uses same styling framework
   - Consistent color schemes
   - Uniform layout patterns
   - Better user experience

4. **Maintainability**
   - Changes isolated to specific plugins
   - Core formatter rarely needs changes
   - Plugins testable in isolation
   - Clear responsibility boundaries

5. **Testability**
   - Unit test each plugin independently
   - Mock plugins for testing consumers
   - Test plugin discovery mechanism
   - Easier to verify formatting correctness

6. **Performance**
   - Plugins loaded on-demand (lazy loading)
   - Cache formatted content
   - Avoid redundant formatting
   - Faster startup (fewer imports)

### Negative Consequences

1. **Initial Migration Effort**
   - Had to refactor 15+ files
   - Risk of breaking existing functionality
   - Testing burden for refactoring
   - Temporarily maintained both old and new

2. **Abstraction Overhead**
   - More files (core + plugins vs monolithic)
   - Indirection makes simple cases harder to trace
   - Plugin interface learning curve
   - Debugging spans multiple files

3. **Plugin Complexity**
   - Need to understand plugin system
   - Registration and discovery mechanism
   - Plugin lifecycle management
   - Error handling across plugin boundary

4. **Potential Over-Engineering**
   - May be overkill if formatting doesn't vary much
   - Factory pattern adds boilerplate
   - Plugin system more complex than needed initially
   - Future flexibility may not be used

## Migration Strategy

The migration from scattered formatters to unified pattern happened in phases:

### Phase 1: Core Framework
- Implemented `UnifiedFormatter` base
- Created `FormatterPlugin` interface
- Built plugin discovery mechanism
- Added plugin registry

### Phase 2: Convert Existing Formatters
- Converted lesson formatter → `LessonFormatterPlugin`
- Converted list formatter → `ListFormatterPlugin`
- Converted progress formatter → `ProgressFormatterPlugin`
- Tested each conversion thoroughly

### Phase 3: Update Consumers
- Updated commands to use `UnifiedFormatter`
- Updated UI components to use new formatters
- Maintained backward compatibility temporarily
- Gradual rollout with feature flags

### Phase 4: Cleanup
- Removed old formatter files
- Deleted duplicate code
- Updated documentation
- Removed backward compatibility shims

### Phase 5: Optimization
- Added caching layer
- Implemented lazy plugin loading
- Performance testing and optimization
- Monitoring and metrics

## Alternatives Considered

### Alternative 1: Keep Separate Formatters

**Description**: Maintain individual formatter files without unification.

**Pros**:
- No migration effort
- No abstraction overhead
- Simple to understand
- Direct imports

**Cons**:
- Continued duplication
- Inconsistent styling
- Hard to maintain
- Large files
- Testing difficult

**Why Not Chosen**: Technical debt was accumulating. Duplication and inconsistency were hurting maintainability. Short-term pain for long-term gain.

### Alternative 2: Single Monolithic Formatter

**Description**: One large formatter class handling all content types.

**Pros**:
- All formatting in one place
- Simple imports
- Easy to find code
- No plugin complexity

**Cons**:
- Massive file (1500+ lines)
- Hard to test
- Violates Single Responsibility
- Difficult to extend
- High coupling

**Why Not Chosen**: Would create an unmaintainable monolith. Violates SOLID principles. Plugin architecture provides better separation of concerns.

### Alternative 3: Template Engine (Jinja2)

**Description**: Use Jinja2 templates for formatting.

**Pros**:
- Declarative templates
- Designers can edit templates
- Clear separation logic/presentation
- Powerful template features

**Cons**:
- Overkill for terminal output
- Terminal formatting different from web
- Rich markup not template-friendly
- Learning curve
- Additional dependency

**Why Not Chosen**: Jinja2 designed for web templates. Terminal formatting is programmatic (Rich library). Templates don't offer significant value for terminal UI.

### Alternative 4: Strategy Pattern (No Plugins)

**Description**: Strategy pattern with factory, but without plugin discovery.

**Pros**:
- Simpler than full plugin system
- No plugin discovery overhead
- Explicit registration
- Easier to debug

**Cons**:
- Less extensible
- Hard to add third-party formatters
- Manual registration required
- Less flexible

**Why Not Chosen**: Plugin discovery is minimal overhead and provides valuable extensibility. Future theme packs and custom formatters would be harder without plugins.

## Implementation Guidelines

### Creating New Formatter Plugin

```python
# src/ui/formatter_plugins/my_plugin.py

from .base import FormatterPlugin
from typing import Any, Dict, List

class MyFormatterPlugin(FormatterPlugin):
    """Format custom content type."""

    @property
    def name(self) -> str:
        return "my_formatter"

    @property
    def supported_types(self) -> List[str]:
        return ["my_type", "my_other_type"]

    def format(self, content: Any, options: Dict[str, Any]) -> str:
        # Implement formatting logic
        theme = options.get("theme", "default")
        width = options.get("width", 80)

        # Use Rich library for styling
        from rich.console import Console
        from rich.panel import Panel

        console = Console(width=width)
        # Format content...
        return formatted_output

    def validate(self, content: Any) -> bool:
        # Validate content structure
        return hasattr(content, 'required_field')
```

### Using UnifiedFormatter

```python
# In command or UI component
from src.ui.unified_formatter import UnifiedFormatter

formatter = UnifiedFormatter()

# Format content (automatic plugin selection)
output = formatter.format(
    content=my_content,
    content_type="my_type",
    theme="dracula",
    width=100
)

console.print(output)
```

### Plugin Discovery

```python
# Automatic discovery (looks for *_plugin.py files)
formatter.discover_plugins("src/ui/formatter_plugins/")

# Manual registration (for custom plugins)
formatter.register_plugin(MyCustomPlugin())

# List available plugins
plugins = formatter.list_plugins()
```

### Testing Plugins

```python
def test_my_formatter_plugin():
    """Test custom formatter plugin."""
    plugin = MyFormatterPlugin()

    # Test supported types
    assert "my_type" in plugin.supported_types

    # Test formatting
    content = MyContent(data="test")
    result = plugin.format(content, options={})

    assert "test" in result
    assert isinstance(result, str)
```

## Performance Considerations

### Lazy Loading

Plugins loaded on first use:
```python
def get_plugin(self, content_type: str) -> FormatterPlugin:
    if content_type not in self._loaded_plugins:
        self._loaded_plugins[content_type] = self._load_plugin(content_type)
    return self._loaded_plugins[content_type]
```

### Caching

Cache formatted content:
```python
@lru_cache(maxsize=128)
def format_cached(self, content_hash: str, content_type: str) -> str:
    return self.format(content, content_type)
```

### Benchmarking

Measure formatting performance:
```python
@profile_formatter
def format(self, content: Any, options: Dict[str, Any]) -> str:
    # Formatting logic
    pass
```

## References

- [Unified Formatter Architecture](../unified_formatter_architecture.md)
- [Formatter Migration Guide](../FORMATTER_MIGRATION_COMPLETE.md)
- [Plugin System Documentation](../PLUGIN_SYSTEM.md)
- [Rich Library Documentation](https://rich.readthedocs.io/)

## Related ADRs

- [ADR-006: Plugin Architecture](./006-plugin-architecture.md) - General plugin system
- [ADR-001: Hybrid Technology Stack](./001-hybrid-technology-stack.md) - Python for UI

---

**Date**: 2025-10-09
**Authors**: Development Team
**Reviewers**: UI/UX Lead, System Architect
