#!/usr/bin/env python3
"""
Markdown Formatter Plugin
Parse and render Markdown to terminal-friendly output
"""

import re
from typing import Any, Dict, List, Optional
from .base import BasePlugin as FormatterPlugin


class MarkdownPlugin(FormatterPlugin):
    """Markdown parsing and rendering plugin"""

    def __init__(self):
        super().__init__()
        self.formatter: Optional[Any] = None
        self.indent_level = 0
        self.list_counters: List[int] = []

    @property
    def name(self) -> str:
        return "markdown_parser"

    @property
    def version(self) -> str:
        return "1.0.0"

    def initialize(self, formatter: Any = None) -> None:
        """Initialize Markdown parser

        Args:
            formatter: Parent formatter instance
        """
        self.formatter = formatter
        self._config.enabled = True

    def shutdown(self) -> None:
        """Cleanup resources"""
        self.indent_level = 0
        self.list_counters.clear()

    def can_handle(self, content_type: str) -> bool:
        """Check if plugin can handle content type"""
        return content_type == 'markdown'

    def format(self, content: Any, **options) -> str:
        """Format markdown content"""
        return self.parse_markdown(content, options.get('width'))

    def get_capabilities(self):
        """Get plugin capabilities"""
        from .base import PluginCapabilities
        return PluginCapabilities(
            content_types={'markdown'},
            features={'headings', 'lists', 'code_blocks', 'inline_formatting', 'links'},
            provides={'markdown_parsing'}
        )

    def parse_markdown(self, markdown_text: str, width: Optional[int] = None) -> str:
        """Parse markdown text to formatted output"""
        if not self._config.enabled:
            return markdown_text

        if width is None:
            width = getattr(self.formatter, 'width', 80)
            if hasattr(self.formatter, 'capabilities'):
                width = self.formatter.capabilities.width

        lines = markdown_text.split('\n')
        result = []
        in_code_block = False
        code_lines = []
        code_language = "text"

        for line in lines:
            if line.strip().startswith('```'):
                if in_code_block:
                    result.append(self.format_code_block('\n'.join(code_lines), code_language, width))
                    code_lines = []
                    in_code_block = False
                else:
                    in_code_block = True
                    code_language = line.strip('`').strip() or "text"
                continue

            if in_code_block:
                code_lines.append(line)
                continue

            formatted_line = self._process_line(line, width)
            if formatted_line is not None:
                result.append(formatted_line)

        return '\n'.join(result)

    def _process_line(self, line: str, width: int) -> Optional[str]:
        """Process a single markdown line"""
        if not line.strip():
            return ''

        if line.lstrip().startswith('#'):
            return self.format_heading(line, width)

        if line.lstrip().startswith('>'):
            return self.format_blockquote(line.lstrip()[1:].strip(), width)

        if re.match(r'^\s*[-*+]\s+', line):
            return self.format_list_item(line, ordered=False, width=width)

        if re.match(r'^\s*\d+\.\s+', line):
            return self.format_list_item(line, ordered=True, width=width)

        if re.match(r'^\s*[-*]{3,}\s*$', line):
            return self.format_horizontal_rule(width)

        return self.format_paragraph(line, width)

    def format_heading(self, line: str, width: int) -> str:
        """Format markdown heading"""
        level = len(line) - len(line.lstrip('#'))
        text = line.lstrip('#').strip()
        text = self._process_inline_formatting(text)

        if level == 1:
            if hasattr(self.formatter, '_colorize'):
                from ..formatter.enhanced_formatter import Color
                colored_text = self.formatter._colorize(text.upper(), Color.BRIGHT_YELLOW, Color.BOLD)
                underline = self.formatter._colorize('=' * len(text), Color.BRIGHT_YELLOW)
                return f'\n{colored_text}\n{underline}\n'
            return f'\n{text.upper()}\n{"=" * len(text)}\n'

        elif level == 2:
            if hasattr(self.formatter, '_colorize'):
                from ..formatter.enhanced_formatter import Color
                arrow = self.formatter._colorize('->', Color.BRIGHT_CYAN, Color.BOLD)
                heading_text = self.formatter._colorize(text, Color.BRIGHT_CYAN, Color.BOLD)
                return f'\n{arrow} {heading_text}\n'
            return f'\n-> {text}\n'

        else:
            if hasattr(self.formatter, '_colorize'):
                from ..formatter.enhanced_formatter import Color
                bullet = self.formatter._colorize('>', Color.BRIGHT_GREEN)
                heading_text = self.formatter._colorize(text, Color.BRIGHT_GREEN, Color.BOLD)
                return f'\n  {bullet} {heading_text}\n'
            return f'\n  > {text}\n'

    def format_list_item(self, line: str, ordered: bool, width: int) -> str:
        """Format list item"""
        indent = len(line) - len(line.lstrip())

        if ordered:
            match = re.match(r'\s*(\d+)\.\s+(.*)', line)
            if match:
                number = match.group(1)
                content = match.group(2)
        else:
            match = re.match(r'\s*[-*+]\s+(.*)', line)
            if match:
                content = match.group(1)

        content = self._process_inline_formatting(content)
        prefix = '  ' * (indent // 2)

        if ordered:
            if hasattr(self.formatter, '_colorize'):
                from ..formatter.enhanced_formatter import Color
                num_colored = self.formatter._colorize(f"{number}.", Color.BRIGHT_YELLOW, Color.BOLD)
                text_colored = self.formatter._colorize(content, Color.WHITE)
                return f"{prefix}  {num_colored} {text_colored}"
            return f"{prefix}  {number}. {content}"
        else:
            if hasattr(self.formatter, '_colorize'):
                from ..formatter.enhanced_formatter import Color
                bullet = self.formatter._colorize('*', Color.BRIGHT_CYAN, Color.BOLD)
                text_colored = self.formatter._colorize(content, Color.WHITE)
                return f"{prefix}  {bullet} {text_colored}"
            return f"{prefix}  * {content}"

    def format_code_block(self, code: str, language: str, width: int) -> str:
        """Format code block"""
        lines = code.split('\n')
        max_len = max(len(line) for line in lines) if lines else 0
        box_width = min(max_len + 8, width - 4)

        result = []
        header = f" Code: {language} "
        result.append('+' + header + '-' * (box_width - len(header) - 1) + '+')

        for i, line in enumerate(lines, 1):
            line_num = f"{i:3} "
            padded_line = line.ljust(box_width - 8)
            result.append(f'| {line_num}| {padded_line} |')

        result.append('+' + '-' * (box_width - 2) + '+')
        return '\n'.join(result)

    def format_blockquote(self, text: str, width: int) -> str:
        """Format blockquote"""
        text = self._process_inline_formatting(text)

        if hasattr(self.formatter, '_colorize'):
            from ..formatter.enhanced_formatter import Color
            bar = self.formatter._colorize('|', Color.BRIGHT_BLACK)
            text_colored = self.formatter._colorize(text, Color.BRIGHT_BLACK)
            return f'  {bar} {text_colored}'
        return f'  | {text}'

    def format_paragraph(self, text: str, width: int) -> str:
        """Format paragraph"""
        text = self._process_inline_formatting(text)

        if len(text) > width - 4:
            import textwrap
            wrapped = textwrap.fill(text, width=width - 4, initial_indent='  ', subsequent_indent='  ')
            text = wrapped
        else:
            text = f'  {text}'

        if hasattr(self.formatter, '_colorize'):
            from ..formatter.enhanced_formatter import Color
            return self.formatter._colorize(text, Color.WHITE)
        return text

    def format_horizontal_rule(self, width: int) -> str:
        """Format horizontal rule"""
        rule = '-' * (width - 4)
        if hasattr(self.formatter, '_colorize'):
            from ..formatter.enhanced_formatter import Color
            return '  ' + self.formatter._colorize(rule, Color.BRIGHT_BLACK)
        return '  ' + rule

    def _process_inline_formatting(self, text: str) -> str:
        """Process inline markdown formatting"""
        text = re.sub(r'\*\*(.+?)\*\*', lambda m: self._format_bold(m.group(1)), text)
        text = re.sub(r'__(.+?)__', lambda m: self._format_bold(m.group(1)), text)
        text = re.sub(r'\*(.+?)\*', lambda m: self._format_italic(m.group(1)), text)
        text = re.sub(r'_(.+?)_', lambda m: self._format_italic(m.group(1)), text)
        text = re.sub(r'`(.+?)`', lambda m: self._format_inline_code(m.group(1)), text)
        text = re.sub(r'\[(.+?)\]\((.+?)\)', lambda m: self._format_link(m.group(1), m.group(2)), text)
        text = re.sub(r'~~(.+?)~~', lambda m: self._format_strikethrough(m.group(1)), text)
        return text

    def _format_bold(self, text: str) -> str:
        """Format bold text"""
        if hasattr(self.formatter, '_colorize'):
            from ..formatter.enhanced_formatter import Color
            return self.formatter._colorize(text, Color.BRIGHT_WHITE, Color.BOLD)
        return text

    def _format_italic(self, text: str) -> str:
        """Format italic text"""
        if hasattr(self.formatter, '_colorize'):
            from ..formatter.enhanced_formatter import Color
            return self.formatter._colorize(text, Color.WHITE, Color.ITALIC)
        return f'_{text}_'

    def _format_inline_code(self, text: str) -> str:
        """Format inline code"""
        if hasattr(self.formatter, '_colorize'):
            from ..formatter.enhanced_formatter import Color
            return self.formatter._colorize(text, Color.BRIGHT_CYAN)
        return f'`{text}`'

    def _format_link(self, text: str, url: str) -> str:
        """Format link"""
        if hasattr(self.formatter, '_colorize'):
            from ..formatter.enhanced_formatter import Color
            link_text = self.formatter._colorize(text, Color.BRIGHT_BLUE, Color.UNDERLINE)
            return f'{link_text} ({url})'
        return f'{text} ({url})'

    def _format_strikethrough(self, text: str) -> str:
        """Format strikethrough text"""
        if hasattr(self.formatter, '_colorize'):
            from ..formatter.enhanced_formatter import Color
            return self.formatter._colorize(text, Color.BRIGHT_BLACK, Color.STRIKETHROUGH)
        return f'~~{text}~~'
