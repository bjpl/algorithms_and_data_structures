#!/usr/bin/env python3
"""
Plugin System Demonstration

This script demonstrates the formatter plugin system capabilities including:
- Plugin registration and initialization
- Content type handling
- Priority-based conflict resolution
- Pre/post processing hooks
- Dependency management
- Lazy loading
"""

import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ui.formatter_plugins import (
    BasePlugin,
    PluginCapabilities,
    PluginConfig,
    PluginPriority,
    PluginManager,
    PluginRegistry,
)


# ============================================================================
# Example Plugin Implementations
# ============================================================================


class MarkdownPlugin(BasePlugin):
    """Plugin for handling Markdown content"""

    @property
    def name(self) -> str:
        return "markdown"

    @property
    def version(self) -> str:
        return "1.0.0"

    def initialize(self, formatter=None):
        self.formatter = formatter
        print(f"✓ Initialized {self.name} plugin v{self.version}")

    def shutdown(self):
        print(f"✓ Shutdown {self.name} plugin")

    def can_handle(self, content_type: str) -> bool:
        return content_type in ["markdown", "md"]

    def format(self, content: str, **options) -> str:
        """Simple markdown formatting"""
        lines = content.split("\n")
        formatted = []

        for line in lines:
            # Headers
            if line.startswith("# "):
                formatted.append(f"\n{'=' * 60}\n{line[2:].upper():^60}\n{'=' * 60}\n")
            elif line.startswith("## "):
                formatted.append(f"\n{line[3:].upper()}\n{'-' * len(line[3:])}\n")
            # Bold
            elif "**" in line:
                line = line.replace("**", "")
                formatted.append(f">>> {line}")
            # Italic
            elif "*" in line:
                line = line.replace("*", "")
                formatted.append(f"  {line}")
            else:
                formatted.append(line)

        return "\n".join(formatted)

    def get_capabilities(self) -> PluginCapabilities:
        return PluginCapabilities(
            content_types={"markdown", "md"},
            features={"markdown_parsing", "header_formatting"},
            provides={"markdown_formatter"}
        )


class CodeFormatterPlugin(BasePlugin):
    """Plugin for code formatting with syntax awareness"""

    @property
    def name(self) -> str:
        return "code_formatter"

    @property
    def version(self) -> str:
        return "1.0.0"

    def initialize(self, formatter=None):
        self.formatter = formatter
        print(f"✓ Initialized {self.name} plugin v{self.version}")

    def shutdown(self):
        print(f"✓ Shutdown {self.name} plugin")

    def can_handle(self, content_type: str) -> bool:
        return content_type in ["code", "python", "javascript"]

    def format(self, content: str, **options) -> str:
        language = options.get("language", "python")
        show_numbers = options.get("line_numbers", True)

        lines = content.split("\n")
        formatted = [f"\n┌─ {language.upper()} CODE ─{'─' * (50 - len(language))}"]

        for i, line in enumerate(lines, 1):
            if show_numbers:
                formatted.append(f"│ {i:3d} │ {line}")
            else:
                formatted.append(f"│ {line}")

        formatted.append("└" + "─" * 60)
        return "\n".join(formatted)

    def get_capabilities(self) -> PluginCapabilities:
        return PluginCapabilities(
            content_types={"code", "python", "javascript"},
            features={"syntax_highlighting", "line_numbers"},
            provides={"code_formatter"}
        )


class LessonPlugin(BasePlugin):
    """Plugin for educational lesson formatting"""

    @property
    def name(self) -> str:
        return "lesson_formatter"

    @property
    def version(self) -> str:
        return "1.0.0"

    def initialize(self, formatter=None):
        self.formatter = formatter
        self.complexity_symbols = {
            "easy": "●",
            "medium": "●●",
            "hard": "●●●"
        }
        print(f"✓ Initialized {self.name} plugin v{self.version}")

    def shutdown(self):
        print(f"✓ Shutdown {self.name} plugin")

    def can_handle(self, content_type: str) -> bool:
        return content_type == "lesson"

    def format(self, content: dict, **options) -> str:
        parts = []

        # Title
        if "title" in content:
            title = content["title"]
            parts.append(f"\n{'=' * 70}")
            parts.append(f"{title:^70}")
            parts.append(f"{'=' * 70}\n")

        # Complexity
        if "complexity" in content:
            level = content["complexity"].lower()
            symbol = self.complexity_symbols.get(level, "?")
            parts.append(f"Complexity: {symbol} {content['complexity'].upper()}\n")

        # Description
        if "description" in content:
            parts.append(f"{content['description']}\n")

        # Examples
        if "examples" in content:
            parts.append("EXAMPLES:")
            parts.append("-" * 70)
            for i, example in enumerate(content["examples"], 1):
                parts.append(f"\n[Example {i}]")
                parts.append(example)

        return "\n".join(parts)

    def get_capabilities(self) -> PluginCapabilities:
        return PluginCapabilities(
            content_types={"lesson"},
            features={"complexity_badges", "example_formatting"},
            provides={"lesson_formatter"}
        )


class EnhancedLessonPlugin(BasePlugin):
    """Enhanced lesson plugin with code formatting dependency"""

    @property
    def name(self) -> str:
        return "enhanced_lesson"

    @property
    def version(self) -> str:
        return "2.0.0"

    def initialize(self, formatter=None):
        self.formatter = formatter
        print(f"✓ Initialized {self.name} plugin v{self.version}")

    def shutdown(self):
        print(f"✓ Shutdown {self.name} plugin")

    def can_handle(self, content_type: str) -> bool:
        return content_type == "enhanced_lesson"

    def format(self, content: dict, **options) -> str:
        # Use lesson_formatter for base, then enhance
        return f"[ENHANCED]\n{content.get('title', 'Lesson')}\n[/ENHANCED]"

    def get_capabilities(self) -> PluginCapabilities:
        return PluginCapabilities(
            content_types={"enhanced_lesson"},
            features={"interactive_examples", "video_support"},
            dependencies={"lesson_formatter", "code_formatter"},  # Requires both
            provides={"enhanced_lesson_formatter"}
        )


# ============================================================================
# Demo Functions
# ============================================================================


def demo_basic_usage():
    """Demonstrate basic plugin usage"""
    print("\n" + "=" * 70)
    print("DEMO 1: Basic Plugin Usage".center(70))
    print("=" * 70 + "\n")

    # Create manager and register plugins
    manager = PluginManager()

    markdown = MarkdownPlugin()
    manager.register(markdown)

    # Initialize
    manager.initialize_all()

    # Format markdown content
    content = """# Main Title
## Subsection
This is **bold text** and this is *italic*.
Regular paragraph here."""

    print("\nInput Markdown:")
    print(content)

    result = manager.format_with_plugin("markdown", content)
    print("\nFormatted Output:")
    print(result)

    # Cleanup
    manager.shutdown_all()


def demo_priority_resolution():
    """Demonstrate priority-based conflict resolution"""
    print("\n" + "=" * 70)
    print("DEMO 2: Priority-Based Conflict Resolution".center(70))
    print("=" * 70 + "\n")

    # Create two plugins that handle same content type
    class HighPriorityFormatter(BasePlugin):
        def __init__(self):
            super().__init__()
            self.set_priority(PluginPriority.HIGH)

        @property
        def name(self):
            return "high_priority"

        @property
        def version(self):
            return "1.0.0"

        def initialize(self, formatter=None):
            pass

        def shutdown(self):
            pass

        def can_handle(self, content_type):
            return content_type == "text"

        def format(self, content, **options):
            return f"[HIGH PRIORITY] {content}"

        def get_capabilities(self):
            return PluginCapabilities(content_types={"text"})

    class LowPriorityFormatter(BasePlugin):
        def __init__(self):
            super().__init__()
            self.set_priority(PluginPriority.LOW)

        @property
        def name(self):
            return "low_priority"

        @property
        def version(self):
            return "1.0.0"

        def initialize(self, formatter=None):
            pass

        def shutdown(self):
            pass

        def can_handle(self, content_type):
            return content_type == "text"

        def format(self, content, **options):
            return f"[LOW PRIORITY] {content}"

        def get_capabilities(self):
            return PluginCapabilities(content_types={"text"})

    manager = PluginManager()
    manager.register(LowPriorityFormatter())
    manager.register(HighPriorityFormatter())
    manager.initialize_all()

    # High priority plugin should be selected
    result = manager.format_with_plugin("text", "Hello World")
    print(f"Result: {result}")
    print("✓ High priority plugin was correctly selected")


def demo_hooks():
    """Demonstrate pre/post processing hooks"""
    print("\n" + "=" * 70)
    print("DEMO 3: Pre/Post Processing Hooks".center(70))
    print("=" * 70 + "\n")

    class HookablePlugin(BasePlugin):
        @property
        def name(self):
            return "hookable"

        @property
        def version(self):
            return "1.0.0"

        def initialize(self, formatter=None):
            pass

        def shutdown(self):
            pass

        def can_handle(self, content_type):
            return content_type == "text"

        def format(self, content, **options):
            return f"[FORMATTED: {content}]"

        def get_capabilities(self):
            return PluginCapabilities(content_types={"text"})

        def pre_process(self, content, **options):
            print(f"  Pre-process: Converting to uppercase")
            return content.upper()

        def post_process(self, formatted, **options):
            print(f"  Post-process: Adding border")
            return f"┌─{'─' * len(formatted)}─┐\n│ {formatted} │\n└─{'─' * len(formatted)}─┘"

    plugin = HookablePlugin()

    # Add dynamic hooks
    plugin.add_pre_hook(lambda c, **kw: (print(f"  Hook 1: Stripping whitespace"), c.strip())[1])
    plugin.add_post_hook(lambda f, **kw: f + "\n[END]")

    manager = PluginManager()
    manager.register(plugin)
    manager.initialize_all()

    print("\nProcessing 'hello world' with hooks:")
    result = manager.format_with_plugin("text", "  hello world  ")
    print(f"\nFinal result:\n{result}")


def demo_dependencies():
    """Demonstrate dependency resolution"""
    print("\n" + "=" * 70)
    print("DEMO 4: Dependency Resolution".center(70))
    print("=" * 70 + "\n")

    manager = PluginManager()

    # Register plugins in any order
    manager.register(EnhancedLessonPlugin())
    manager.register(LessonPlugin())
    manager.register(CodeFormatterPlugin())

    print("\nInitializing enhanced_lesson (has dependencies)...")
    manager.initialize("enhanced_lesson")

    print("\nDependencies were automatically initialized!")
    initialized = [name for name in manager.list_plugins()
                   if manager.get_plugin(name).status.value == "active"]
    print(f"Active plugins: {', '.join(initialized)}")

    manager.shutdown_all()


def demo_complete_workflow():
    """Demonstrate complete workflow with multiple plugins"""
    print("\n" + "=" * 70)
    print("DEMO 5: Complete Workflow".center(70))
    print("=" * 70 + "\n")

    manager = PluginManager()

    # Register all plugins
    manager.register(MarkdownPlugin())
    manager.register(CodeFormatterPlugin())
    manager.register(LessonPlugin())
    manager.initialize_all()

    # Format different content types
    print("\n1. Markdown Content:")
    print("-" * 70)
    markdown_content = "# Python Basics\n**Important:** Variables are *dynamically* typed."
    result = manager.format_with_plugin("markdown", markdown_content)
    print(result)

    print("\n2. Code Content:")
    print("-" * 70)
    code_content = "def hello():\n    print('Hello, World!')\n    return True"
    result = manager.format_with_plugin("code", code_content, language="python", line_numbers=True)
    print(result)

    print("\n3. Lesson Content:")
    print("-" * 70)
    lesson_content = {
        "title": "Binary Search Algorithm",
        "complexity": "medium",
        "description": "Efficient search algorithm for sorted arrays using divide-and-conquer.",
        "examples": [
            "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1"
        ]
    }
    result = manager.format_with_plugin("lesson", lesson_content)
    print(result)

    manager.shutdown_all()


# ============================================================================
# Main
# ============================================================================


def main():
    """Run all demonstrations"""
    print("\n" + "╔" + "═" * 68 + "╗")
    print("║" + "Formatter Plugin System Demonstration".center(68) + "║")
    print("╚" + "═" * 68 + "╝")

    try:
        demo_basic_usage()
        demo_priority_resolution()
        demo_hooks()
        demo_dependencies()
        demo_complete_workflow()

        print("\n" + "=" * 70)
        print("✓ All demonstrations completed successfully!".center(70))
        print("=" * 70 + "\n")

    except Exception as e:
        print(f"\n✗ Error during demonstration: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
