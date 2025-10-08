#!/usr/bin/env python3
"""
Rich Formatter Plugin
Integrates Rich library for advanced terminal formatting with fallback support
"""

from typing import Any, Dict, List, Optional, Union
from .base import BasePlugin as FormatterPlugin

# Try to import Rich, but provide fallback
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.syntax import Syntax
    from rich.markdown import Markdown
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
    from rich.live import Live
    from rich.layout import Layout
    from rich.tree import Tree
    from rich.text import Text
    from rich.style import Style
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    Console = None
    Panel = None
    Table = None
    Syntax = None
    Markdown = None


class RichFormatterPlugin(FormatterPlugin):
    """Rich library integration plugin with ASCII fallback"""

    def __init__(self):
        """Initialize Rich plugin"""
        super().__init__()
        self.formatter: Optional[Any] = None
        self.console: Optional[Console] = None
        self._progress_context = None
        self._live_context = None

    @property
    def name(self) -> str:
        return "rich_formatter"

    @property
    def version(self) -> str:
        return "1.0.0"

    def initialize(self, formatter: Any = None) -> None:
        """Initialize Rich console if available

        Args:
            formatter: Parent formatter instance
        """
        self.formatter = formatter
        if RICH_AVAILABLE:
            try:
                self.console = Console(
                    force_terminal=True,
                    force_interactive=False,
                    width=self.formatter.capabilities.width if hasattr(self.formatter, 'capabilities') else 80,
                    legacy_windows=True  # Better Windows compatibility
                )
                self._config.enabled = True
            except Exception as e:
                # Fallback to disabled if Rich fails
                self._config.enabled = False
                self.console = None
        else:
            self._config.enabled = False
            self.console = None

    def shutdown(self) -> None:
        """Cleanup Rich resources"""
        if self._progress_context:
            try:
                self._progress_context.__exit__(None, None, None)
            except:
                pass
            self._progress_context = None

        if self._live_context:
            try:
                self._live_context.__exit__(None, None, None)
            except:
                pass
            self._live_context = None

    def can_handle(self, content_type: str) -> bool:
        """Check if plugin can handle content type"""
        return content_type in ['panel', 'table', 'syntax', 'markdown', 'progress']

    def format(self, content: Any, **options) -> str:
        """Format content based on type"""
        content_type = options.get('type', 'panel')

        if content_type == 'panel':
            return self.format_panel(content, **options)
        elif content_type == 'table':
            return self.format_table(content.get('data', []), **options)
        elif content_type == 'syntax':
            return self.format_syntax(content, **options)
        elif content_type == 'markdown':
            return self.format_markdown(content)

        return str(content)

    def get_capabilities(self):
        """Get plugin capabilities"""
        from .base import PluginCapabilities
        return PluginCapabilities(
            content_types={'panel', 'table', 'syntax', 'markdown', 'progress'},
            features={'rich_formatting', 'live_display', 'progress_bars'},
            provides={'advanced_formatting'}
        )

    def format_panel(
        self,
        content: str,
        title: Optional[str] = None,
        border_style: str = "cyan",
        width: Optional[int] = None,
        padding: int = 1
    ) -> str:
        """Format content in a panel with Rich or fallback to ASCII

        Args:
            content: Content to display in panel
            title: Optional panel title
            border_style: Border color/style
            width: Panel width (auto if None)
            padding: Internal padding

        Returns:
            Formatted panel string
        """
        if self._config.enabled and self.console and RICH_AVAILABLE:
            try:
                panel = Panel(
                    content,
                    title=title,
                    border_style=border_style,
                    width=width,
                    padding=(padding, padding * 2)
                )
                # Capture Rich output as string
                from io import StringIO
                buffer = StringIO()
                temp_console = Console(file=buffer, force_terminal=True, width=width or 80)
                temp_console.print(panel)
                return buffer.getvalue()
            except Exception:
                pass

        # Fallback to formatter's create_panel if available
        if hasattr(self.formatter, 'create_panel'):
            from ..formatter.enhanced_formatter import Color
            return self.formatter.create_panel(
                title or "Panel",
                content,
                width=width,
                color=Color.BRIGHT_CYAN,
                padding=padding
            )

        # Basic ASCII fallback
        return self._fallback_panel(content, title, width or 80)

    def format_table(
        self,
        data: List[List[str]],
        headers: Optional[List[str]] = None,
        title: Optional[str] = None,
        style: str = "cyan"
    ) -> str:
        """Format data as a table with Rich or fallback

        Args:
            data: Table data rows
            headers: Optional column headers
            title: Optional table title
            style: Table style/color

        Returns:
            Formatted table string
        """
        if self.enabled and self.console and RICH_AVAILABLE and Table:
            try:
                table = Table(
                    title=title,
                    show_header=bool(headers),
                    header_style=f"bold {style}",
                    border_style=style
                )

                # Add columns
                if headers:
                    for header in headers:
                        table.add_column(header)

                # Add rows
                for row in data:
                    table.add_row(*[str(cell) for cell in row])

                # Capture output
                from io import StringIO
                buffer = StringIO()
                temp_console = Console(file=buffer, force_terminal=True)
                temp_console.print(table)
                return buffer.getvalue()
            except Exception:
                pass

        # Fallback to formatter's create_table
        if hasattr(self.formatter, 'create_table'):
            from ..formatter.enhanced_formatter import TableStyle
            return self.formatter.create_table(
                data,
                headers=headers,
                style=TableStyle.GRID
            )

        # Basic ASCII fallback
        return self._fallback_table(data, headers)

    def format_syntax(
        self,
        code: str,
        language: str = "python",
        theme: str = "monokai",
        line_numbers: bool = True
    ) -> str:
        """Format code with syntax highlighting

        Args:
            code: Source code to format
            language: Programming language
            theme: Color theme
            line_numbers: Show line numbers

        Returns:
            Formatted code string
        """
        if self.enabled and self.console and RICH_AVAILABLE and Syntax:
            try:
                syntax = Syntax(
                    code,
                    language,
                    theme=theme,
                    line_numbers=line_numbers,
                    word_wrap=True
                )

                # Capture output
                from io import StringIO
                buffer = StringIO()
                temp_console = Console(file=buffer, force_terminal=True)
                temp_console.print(syntax)
                return buffer.getvalue()
            except Exception:
                pass

        # Fallback to lesson_display highlighting
        if hasattr(self.formatter, '_highlight_code'):
            return self.formatter._highlight_code(code, language)

        # Basic code block
        return self._fallback_code_block(code, language)

    def format_markdown(self, markdown_text: str) -> str:
        """Format markdown text with Rich or fallback

        Args:
            markdown_text: Markdown content

        Returns:
            Formatted markdown string
        """
        if self.enabled and self.console and RICH_AVAILABLE and Markdown:
            try:
                md = Markdown(markdown_text)

                # Capture output
                from io import StringIO
                buffer = StringIO()
                temp_console = Console(file=buffer, force_terminal=True)
                temp_console.print(md)
                return buffer.getvalue()
            except Exception:
                pass

        # Fallback to markdown plugin if available
        return markdown_text  # Will be processed by MarkdownPlugin

    def create_progress(
        self,
        tasks: List[Dict[str, Any]],
        description: str = "Processing..."
    ) -> 'ProgressContext':
        """Create a progress display context

        Args:
            tasks: List of tasks with 'name' and 'total' keys
            description: Progress description

        Returns:
            Progress context manager
        """
        if self.enabled and self.console and RICH_AVAILABLE and Progress:
            try:
                progress = Progress(
                    SpinnerColumn(),
                    TextColumn("[progress.description]{task.description}"),
                    BarColumn(),
                    TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                    console=self.console
                )
                return RichProgressContext(progress, tasks)
            except Exception:
                pass

        # Fallback to simple progress
        return FallbackProgressContext(self.formatter, tasks, description)

    def create_live_display(self, content: Any) -> 'LiveContext':
        """Create a live updating display

        Args:
            content: Content to display live

        Returns:
            Live display context manager
        """
        if self.enabled and self.console and RICH_AVAILABLE and Live:
            try:
                return RichLiveContext(Live(content, console=self.console))
            except Exception:
                pass

        return FallbackLiveContext()

    def _fallback_panel(self, content: str, title: Optional[str], width: int) -> str:
        """ASCII fallback for panel"""
        lines = content.split('\n')
        result = []

        # Top border
        top = '+' + '-' * (width - 2) + '+'
        if title:
            title_text = f' {title} '
            top = '+' + title_text + '-' * (width - len(title_text) - 2) + '+'
        result.append(top)

        # Content
        for line in lines:
            result.append('| ' + line.ljust(width - 4) + ' |')

        # Bottom border
        result.append('+' + '-' * (width - 2) + '+')

        return '\n'.join(result)

    def _fallback_table(self, data: List[List[str]], headers: Optional[List[str]]) -> str:
        """ASCII fallback for table"""
        # Calculate column widths
        all_rows = [headers] + data if headers else data
        col_widths = []
        for col_idx in range(len(all_rows[0])):
            max_width = max(len(str(row[col_idx])) for row in all_rows if col_idx < len(row))
            col_widths.append(max_width)

        result = []

        # Top border
        result.append('+' + '+'.join('-' * (w + 2) for w in col_widths) + '+')

        # Headers
        if headers:
            header_row = '|' + '|'.join(f' {str(h).ljust(col_widths[i])} ' for i, h in enumerate(headers)) + '|'
            result.append(header_row)
            result.append('+' + '+'.join('=' * (w + 2) for w in col_widths) + '+')

        # Data rows
        for row in data:
            data_row = '|' + '|'.join(f' {str(row[i]).ljust(col_widths[i])} ' if i < len(row) else ' ' * (col_widths[i] + 2) for i in range(len(col_widths))) + '|'
            result.append(data_row)

        # Bottom border
        result.append('+' + '+'.join('-' * (w + 2) for w in col_widths) + '+')

        return '\n'.join(result)

    def _fallback_code_block(self, code: str, language: str) -> str:
        """ASCII fallback for code block"""
        lines = code.split('\n')
        result = [f'  Code ({language}):']
        result.append('  +' + '-' * 76 + '+')
        for i, line in enumerate(lines, 1):
            result.append(f'  | {str(i).rjust(3)} | {line.ljust(70)} |')
        result.append('  +' + '-' * 76 + '+')
        return '\n'.join(result)


class RichProgressContext:
    """Context manager for Rich progress"""

    def __init__(self, progress: Any, tasks: List[Dict[str, Any]]):
        self.progress = progress
        self.task_ids = {}
        self.tasks_config = tasks

    def __enter__(self):
        self.progress.__enter__()
        for task_config in self.tasks_config:
            task_id = self.progress.add_task(
                task_config.get('name', 'Task'),
                total=task_config.get('total', 100)
            )
            self.task_ids[task_config.get('name', 'Task')] = task_id
        return self

    def __exit__(self, *args):
        self.progress.__exit__(*args)

    def update(self, task_name: str, advance: int = 1):
        """Update task progress"""
        if task_name in self.task_ids:
            self.progress.update(self.task_ids[task_name], advance=advance)


class FallbackProgressContext:
    """Fallback progress context"""

    def __init__(self, formatter: Any, tasks: List[Dict[str, Any]], description: str):
        self.formatter = formatter
        self.tasks = {t.get('name', 'Task'): {'current': 0, 'total': t.get('total', 100)} for t in tasks}
        self.description = description

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def update(self, task_name: str, advance: int = 1):
        """Update task progress"""
        if task_name in self.tasks:
            self.tasks[task_name]['current'] += advance
            progress = self.tasks[task_name]['current'] / self.tasks[task_name]['total']
            if hasattr(self.formatter, 'create_progress_bar'):
                bar = self.formatter.create_progress_bar(progress)
                print(f'\r{task_name}: {bar}', end='', flush=True)


class RichLiveContext:
    """Context manager for Rich live display"""

    def __init__(self, live: Any):
        self.live = live

    def __enter__(self):
        return self.live.__enter__()

    def __exit__(self, *args):
        return self.live.__exit__(*args)


class FallbackLiveContext:
    """Fallback live display context"""

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def update(self, content: Any):
        """Update display (no-op in fallback)"""
        pass
