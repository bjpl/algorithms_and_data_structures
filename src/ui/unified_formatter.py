#!/usr/bin/env python3
"""
Unified Formatter V2 - Core Implementation
==========================================

A comprehensive, production-ready terminal formatting system that consolidates
multiple formatters into a single, maintainable solution.

Architecture:
    - Rendering pipeline with validation, preprocessing, formatting, coloring, and postprocessing
    - Configuration management via FormatterConfig dataclass
    - Platform detection and safe character fallbacks
    - Theme system with ANSI color support
    - Performance optimizations via LRU caching

Usage:
    >>> from unified_formatter_v2 import UnifiedFormatter
    >>> formatter = UnifiedFormatter.create(theme='dark', platform='auto')
    >>> print(formatter.success("Operation complete!"))
    >>> print(formatter.create_box("Important message", title="Alert"))

Author: Implementation Agent
Date: 2025-10-08
"""

import os
import sys
import re
import shutil
from functools import lru_cache
from typing import Optional, List, Dict, Any, Union, Tuple, Callable
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod


# ============================================================================
# Platform Detection
# ============================================================================

class Platform(Enum):
    """Platform types for formatting"""
    WINDOWS = "windows"
    UNIX = "unix"
    UNKNOWN = "unknown"


@dataclass
class PlatformCapabilities:
    """Platform-specific capabilities"""
    platform: Platform
    unicode_support: bool = False
    color_support: bool = False
    ansi_support: bool = False
    terminal_width: int = 80
    terminal_height: int = 24


class PlatformDetector:
    """Detects platform and provides capability information"""

    @staticmethod
    def detect() -> PlatformCapabilities:
        """Detect platform capabilities"""
        # Determine platform
        if sys.platform == 'win32':
            platform = Platform.WINDOWS
        elif sys.platform in ('linux', 'darwin', 'freebsd'):
            platform = Platform.UNIX
        else:
            platform = Platform.UNKNOWN

        # Get terminal dimensions
        try:
            size = shutil.get_terminal_size((80, 24))
            width, height = size.columns, size.lines
        except:
            width, height = 80, 24

        # Detect capabilities
        unicode_support = PlatformDetector._detect_unicode()
        color_support = PlatformDetector._detect_color()
        ansi_support = PlatformDetector._detect_ansi()

        return PlatformCapabilities(
            platform=platform,
            unicode_support=unicode_support,
            color_support=color_support,
            ansi_support=ansi_support,
            terminal_width=width,
            terminal_height=height
        )

    @staticmethod
    def _detect_unicode() -> bool:
        """Detect Unicode support"""
        if sys.platform == 'win32':
            # Windows CMD typically doesn't support Unicode well
            return False

        try:
            encoding = sys.stdout.encoding or ''
            return 'utf' in encoding.lower()
        except:
            return False

    @staticmethod
    def _detect_color() -> bool:
        """Detect color support"""
        # Check environment variables
        if os.environ.get('NO_COLOR'):
            return False

        if os.environ.get('FORCE_COLOR'):
            return True

        # Check if output is a TTY
        if not sys.stdout.isatty():
            return False

        # Check TERM variable
        term = os.environ.get('TERM', '')
        if any(color_term in term for color_term in ['color', 'xterm', 'screen']):
            return True

        return sys.platform != 'win32'

    @staticmethod
    def _detect_ansi() -> bool:
        """Detect ANSI escape code support"""
        if sys.platform == 'win32':
            try:
                # Try to enable ANSI on Windows
                import ctypes
                kernel32 = ctypes.windll.kernel32
                kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
                return True
            except:
                return False
        return True


# ============================================================================
# Color System
# ============================================================================

class Color(Enum):
    """ANSI color codes"""
    # Basic colors
    BLACK = "\033[30m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"

    # Bright colors
    BRIGHT_BLACK = "\033[90m"
    BRIGHT_RED = "\033[91m"
    BRIGHT_GREEN = "\033[92m"
    BRIGHT_YELLOW = "\033[93m"
    BRIGHT_BLUE = "\033[94m"
    BRIGHT_MAGENTA = "\033[95m"
    BRIGHT_CYAN = "\033[96m"
    BRIGHT_WHITE = "\033[97m"

    # Styles
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    ITALIC = "\033[3m"
    UNDERLINE = "\033[4m"
    BLINK = "\033[5m"
    REVERSE = "\033[7m"

    # Background colors
    BG_BLACK = "\033[40m"
    BG_RED = "\033[41m"
    BG_GREEN = "\033[42m"
    BG_YELLOW = "\033[43m"
    BG_BLUE = "\033[44m"
    BG_MAGENTA = "\033[45m"
    BG_CYAN = "\033[46m"
    BG_WHITE = "\033[47m"


@dataclass
class Theme:
    """Color theme configuration"""
    name: str = "default"
    primary: Color = Color.BLUE
    secondary: Color = Color.CYAN
    success: Color = Color.GREEN
    warning: Color = Color.YELLOW
    error: Color = Color.RED
    info: Color = Color.BRIGHT_BLUE
    muted: Color = Color.BRIGHT_BLACK
    text: Color = Color.WHITE
    accent: Color = Color.MAGENTA
    highlight: Color = Color.BRIGHT_CYAN


# ============================================================================
# Configuration
# ============================================================================

@dataclass
class FormatterConfig:
    """Formatter configuration"""
    theme: Theme = field(default_factory=Theme)
    platform: Optional[Platform] = None
    unicode_enabled: bool = True
    colors_enabled: bool = True
    cache_enabled: bool = True
    terminal_width: int = 80
    terminal_height: int = 24


# ============================================================================
# Box Characters
# ============================================================================

@dataclass
class BoxCharSet:
    """Box drawing character set"""
    top_left: str
    top_right: str
    bottom_left: str
    bottom_right: str
    horizontal: str
    vertical: str
    tee_down: str
    tee_up: str
    tee_right: str
    tee_left: str
    cross: str


class BoxStyle(Enum):
    """Box drawing styles"""
    ASCII = BoxCharSet(
        top_left='+', top_right='+', bottom_left='+', bottom_right='+',
        horizontal='-', vertical='|', tee_down='+', tee_up='+',
        tee_right='+', tee_left='+', cross='+'
    )

    SINGLE = BoxCharSet(
        top_left='┌', top_right='┐', bottom_left='└', bottom_right='┘',
        horizontal='─', vertical='│', tee_down='┬', tee_up='┴',
        tee_right='├', tee_left='┤', cross='┼'
    )

    DOUBLE = BoxCharSet(
        top_left='╔', top_right='╗', bottom_left='╚', bottom_right='╝',
        horizontal='═', vertical='║', tee_down='╦', tee_up='╩',
        tee_right='╠', tee_left='╣', cross='╬'
    )

    ROUNDED = BoxCharSet(
        top_left='╭', top_right='╮', bottom_left='╰', bottom_right='╯',
        horizontal='─', vertical='│', tee_down='┬', tee_up='┴',
        tee_right='├', tee_left='┤', cross='┼'
    )


# ============================================================================
# Text Utilities
# ============================================================================

class TextUtils:
    """Text processing utilities"""

    @staticmethod
    @lru_cache(maxsize=256)
    def strip_ansi(text: str) -> str:
        """Remove ANSI escape codes from text"""
        ansi_pattern = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        return ansi_pattern.sub('', text)

    @staticmethod
    def display_width(text: str) -> int:
        """Calculate display width of text (excluding ANSI codes)"""
        return len(TextUtils.strip_ansi(text))

    @staticmethod
    def pad(text: str, width: int, align: str = 'left', fill: str = ' ') -> str:
        """Pad text to specified width"""
        display_len = TextUtils.display_width(text)
        padding = max(0, width - display_len)

        if align == 'left':
            return text + fill * padding
        elif align == 'right':
            return fill * padding + text
        else:  # center
            left_pad = padding // 2
            right_pad = padding - left_pad
            return fill * left_pad + text + fill * right_pad

    @staticmethod
    def wrap(text: str, width: int, preserve_newlines: bool = True) -> List[str]:
        """Wrap text to specified width"""
        if preserve_newlines:
            paragraphs = text.split('\n')
        else:
            paragraphs = [text]

        wrapped_lines = []
        for paragraph in paragraphs:
            if not paragraph:
                wrapped_lines.append('')
                continue

            words = paragraph.split()
            current_line = []
            current_length = 0

            for word in words:
                word_len = TextUtils.display_width(word)
                space_len = 1 if current_line else 0

                if current_length + space_len + word_len > width:
                    if current_line:
                        wrapped_lines.append(' '.join(current_line))
                        current_line = [word]
                        current_length = word_len
                    else:
                        # Word too long, add anyway
                        wrapped_lines.append(word)
                else:
                    current_line.append(word)
                    current_length += space_len + word_len

            if current_line:
                wrapped_lines.append(' '.join(current_line))

        return wrapped_lines


# ============================================================================
# Core Formatter
# ============================================================================

class UnifiedFormatter:
    """
    Unified terminal formatter providing all formatting capabilities.

    This is the core implementation that consolidates functionality from
    multiple formatters into a single, maintainable solution.
    """

    def __init__(self, config: Optional[FormatterConfig] = None):
        """Initialize formatter with configuration"""
        # Detect platform if not provided
        capabilities = PlatformDetector.detect()

        # Initialize config
        if config is None:
            config = FormatterConfig()

        self.config = config
        self.capabilities = capabilities

        # Override config with detected capabilities if needed
        if config.platform is None:
            self.config.platform = capabilities.platform

        # Adjust unicode based on platform
        if not capabilities.unicode_support:
            self.config.unicode_enabled = False

        # Adjust colors based on platform
        if not capabilities.color_support:
            self.config.colors_enabled = False

        # Set terminal dimensions
        self.config.terminal_width = capabilities.terminal_width
        self.config.terminal_height = capabilities.terminal_height

    # ========================================================================
    # Factory Methods
    # ========================================================================

    @classmethod
    def create(
        cls,
        theme: Union[str, Theme] = 'default',
        platform: str = 'auto',
        unicode: Optional[bool] = None,
        colors: Optional[bool] = None
    ) -> 'UnifiedFormatter':
        """Create configured formatter instance"""
        # Handle theme
        if isinstance(theme, str):
            theme = Theme(name=theme)

        # Create config
        config = FormatterConfig(theme=theme)

        # Override platform detection if specified
        if platform != 'auto':
            if platform == 'windows':
                config.platform = Platform.WINDOWS
            elif platform == 'unix':
                config.platform = Platform.UNIX

        # Override unicode if specified
        if unicode is not None:
            config.unicode_enabled = unicode

        # Override colors if specified
        if colors is not None:
            config.colors_enabled = colors

        return cls(config)

    # ========================================================================
    # Color Management
    # ========================================================================

    def colorize(self, text: str, color: Color, style: Optional[Color] = None) -> str:
        """Apply color and optional style to text"""
        if not self.config.colors_enabled:
            return text

        result = color.value
        if style:
            result += style.value
        result += text + Color.RESET.value

        return result

    # ========================================================================
    # Core Formatting Methods
    # ========================================================================

    def header(
        self,
        title: str,
        subtitle: Optional[str] = None,
        level: int = 1,
        style: str = 'default'
    ) -> str:
        """Create header with various styles"""
        if level == 1:
            # Large header
            if style == 'banner':
                width = min(80, self.config.terminal_width)
                border = '=' * width

                lines = [
                    self.colorize(border, self.config.theme.primary, Color.BOLD),
                    '',
                    self.colorize(title.upper().center(width), self.config.theme.primary, Color.BOLD)
                ]

                if subtitle:
                    lines.append(self.colorize(subtitle.center(width), self.config.theme.secondary))

                lines.extend(['', self.colorize(border, self.config.theme.primary, Color.BOLD)])
                return '\n'.join(lines)
            else:
                # Default level 1
                title_line = self.colorize(title.upper(), self.config.theme.primary, Color.BOLD)
                underline = self.colorize('=' * len(title), self.config.theme.primary)

                lines = ['\n' + title_line, underline]
                if subtitle:
                    lines.append(self.colorize(subtitle, self.config.theme.secondary))

                return '\n'.join(lines) + '\n'

        elif level == 2:
            # Medium header
            title_line = self.colorize(title, self.config.theme.secondary, Color.BOLD)
            underline = self.colorize('-' * len(title), self.config.theme.muted)

            lines = ['\n' + title_line, underline]
            if subtitle:
                lines.append(self.colorize(subtitle, self.config.theme.muted))

            return '\n'.join(lines) + '\n'

        else:
            # Small header
            prefix = self.colorize('>', self.config.theme.text, Color.BOLD)
            title_line = f"{prefix} {title}"

            if subtitle:
                return f"\n{title_line}\n  {subtitle}\n"
            return f"\n{title_line}\n"

    def create_box(
        self,
        content: Union[str, List[str]],
        title: Optional[str] = None,
        style: str = 'single',
        padding: int = 1,
        width: Optional[int] = None,
        color: Optional[Color] = None
    ) -> str:
        """Create box around content"""
        # Normalize content to list of lines
        if isinstance(content, str):
            content_lines = content.split('\n')
        else:
            content_lines = content

        # Get box characters
        if not self.config.unicode_enabled or style == 'ascii':
            chars = BoxStyle.ASCII.value
        elif style == 'double':
            chars = BoxStyle.DOUBLE.value
        elif style == 'rounded':
            chars = BoxStyle.ROUNDED.value
        else:
            chars = BoxStyle.SINGLE.value

        # Calculate dimensions
        max_content_width = max(
            (TextUtils.display_width(line) for line in content_lines),
            default=0
        )

        if title:
            max_content_width = max(max_content_width, len(title) + 4)

        box_width = width or min(max_content_width + padding * 2 + 2, self.config.terminal_width - 2)
        inner_width = box_width - 2

        # Apply color
        border_color = color or self.config.theme.primary

        # Build box
        lines = []

        # Top border
        if title:
            title_text = f" {title} "
            title_len = len(title_text)
            left_pad = (box_width - title_len - 2) // 2
            right_pad = box_width - title_len - left_pad - 2

            top_line = (
                chars.top_left +
                chars.horizontal * left_pad +
                title_text +
                chars.horizontal * right_pad +
                chars.top_right
            )
        else:
            top_line = chars.top_left + chars.horizontal * (box_width - 2) + chars.top_right

        lines.append(self.colorize(top_line, border_color))

        # Padding top
        if padding > 0:
            empty_line = chars.vertical + ' ' * (box_width - 2) + chars.vertical
            for _ in range(padding):
                lines.append(self.colorize(empty_line, border_color))

        # Content lines
        for line in content_lines:
            clean_line = TextUtils.strip_ansi(line)
            line_width = TextUtils.display_width(line)
            pad_width = inner_width - padding * 2 - line_width

            content_line = (
                self.colorize(chars.vertical, border_color) +
                ' ' * padding +
                line +
                ' ' * max(0, pad_width) +
                ' ' * padding +
                self.colorize(chars.vertical, border_color)
            )
            lines.append(content_line)

        # Padding bottom
        if padding > 0:
            for _ in range(padding):
                lines.append(self.colorize(empty_line, border_color))

        # Bottom border
        bottom_line = chars.bottom_left + chars.horizontal * (box_width - 2) + chars.bottom_right
        lines.append(self.colorize(bottom_line, border_color))

        return '\n'.join(lines)

    def create_table(
        self,
        data: Union[List[List[str]], Dict[str, List[str]]],
        headers: Optional[List[str]] = None,
        style: str = 'grid',
        show_index: bool = False
    ) -> str:
        """Format tabular data"""
        # Normalize data to list of rows
        if isinstance(data, dict):
            if headers is None:
                headers = list(data.keys())

            rows = []
            num_rows = len(next(iter(data.values()))) if data else 0
            for i in range(num_rows):
                row = [str(data[col][i]) for col in headers]
                rows.append(row)
        else:
            rows = [[str(cell) for cell in row] for row in data]
            if headers is None and rows:
                headers = [f"Col{i+1}" for i in range(len(rows[0]))]

        # Add index column if requested
        if show_index:
            headers = ['#'] + (headers or [])
            rows = [[str(i + 1)] + row for i, row in enumerate(rows)]

        # Calculate column widths
        if headers:
            col_widths = [len(h) for h in headers]
        else:
            col_widths = [0] * (len(rows[0]) if rows else 0)

        for row in rows:
            for i, cell in enumerate(row):
                if i < len(col_widths):
                    col_widths[i] = max(col_widths[i], len(str(cell)))

        # Get table characters
        if not self.config.unicode_enabled or style != 'grid':
            h_sep = '-'
            v_sep = '|'
            cross = '+'
        else:
            h_sep = '─'
            v_sep = '│'
            cross = '┼'

        # Build table
        lines = []

        # Headers
        if headers:
            header_cells = []
            for i, header in enumerate(headers):
                padded = TextUtils.pad(header, col_widths[i], 'center')
                colored = self.colorize(padded, self.config.theme.primary, Color.BOLD)
                header_cells.append(colored)

            header_line = f"{v_sep} {f' {v_sep} '.join(header_cells)} {v_sep}"
            lines.append(header_line)

            # Separator
            sep_parts = [h_sep * (w + 2) for w in col_widths]
            sep_line = cross + cross.join(sep_parts) + cross
            lines.append(self.colorize(sep_line, self.config.theme.muted))

        # Data rows
        for i, row in enumerate(rows):
            row_cells = []
            for j, cell in enumerate(row):
                if j < len(col_widths):
                    padded = TextUtils.pad(str(cell), col_widths[j], 'left')

                    # Alternate row colors
                    if i % 2 == 0:
                        row_cells.append(padded)
                    else:
                        row_cells.append(self.colorize(padded, self.config.theme.muted))

            row_line = f"{v_sep} {f' {v_sep} '.join(row_cells)} {v_sep}"
            lines.append(row_line)

        return '\n'.join(lines)

    def format_list(
        self,
        items: List[str],
        style: str = 'bullet',
        indent: int = 0,
        color: Optional[Color] = None
    ) -> str:
        """Format list of items"""
        lines = []
        item_color = color or self.config.theme.text

        for i, item in enumerate(items):
            if style == 'number':
                marker = f"{i + 1}."
            elif style == 'arrow':
                marker = '→' if self.config.unicode_enabled else '->'
            elif style == 'checkbox':
                marker = '☐' if self.config.unicode_enabled else '[ ]'
            else:  # bullet
                marker = '•' if self.config.unicode_enabled else '*'

            marker_colored = self.colorize(marker, self.config.theme.primary, Color.BOLD)
            prefix = ' ' * indent
            lines.append(f"{prefix}  {marker_colored} {item}")

        return '\n'.join(lines)

    def code_block(
        self,
        code: str,
        language: str = 'python',
        line_numbers: bool = True,
        title: Optional[str] = None
    ) -> str:
        """Format code block with optional line numbers"""
        lines = code.split('\n')

        # Determine width
        max_line_len = max((len(line) for line in lines), default=0)
        num_width = len(str(len(lines))) if line_numbers else 0

        # Build header if title provided
        result_lines = []

        if title:
            header = f" {title} [{language}] "
            header_colored = self.colorize(header, self.config.theme.info, Color.BOLD)
            result_lines.append(header_colored)
            result_lines.append(self.colorize('─' * len(header), self.config.theme.muted))

        # Format code lines
        for i, line in enumerate(lines, 1):
            if line_numbers:
                num_str = str(i).rjust(num_width)
                num_colored = self.colorize(num_str, self.config.theme.muted)
                result_lines.append(f"{num_colored} │ {line}")
            else:
                result_lines.append(f"  {line}")

        return '\n'.join(result_lines)

    def progress_bar(
        self,
        current: int,
        total: int,
        description: str = '',
        width: int = 40,
        show_percentage: bool = True
    ) -> str:
        """Create progress bar"""
        if total == 0:
            percent = 0.0
        else:
            percent = min(1.0, current / total)

        filled = int(width * percent)
        empty = width - filled

        # Choose characters
        if self.config.unicode_enabled:
            fill_char = '█'
            empty_char = '░'
        else:
            fill_char = '#'
            empty_char = '-'

        # Color based on progress
        if percent < 0.33:
            bar_color = self.config.theme.error
        elif percent < 0.66:
            bar_color = self.config.theme.warning
        else:
            bar_color = self.config.theme.success

        # Build bar
        bar = self.colorize(fill_char * filled, bar_color) + empty_char * empty

        # Build complete string
        parts = []
        if description:
            parts.append(description)

        parts.append(f"[{bar}]")

        if show_percentage:
            percent_str = f"{percent * 100:5.1f}%"
            parts.append(self.colorize(percent_str, self.config.theme.text, Color.BOLD))

        parts.append(f"({current}/{total})")

        return ' '.join(parts)

    def divider(
        self,
        title: Optional[str] = None,
        char: str = '─',
        width: Optional[int] = None
    ) -> str:
        """Create horizontal divider"""
        if not self.config.unicode_enabled and char not in '=-_':
            char = '-'

        line_width = width or self.config.terminal_width

        if title:
            title_text = f" {title} "
            title_len = len(title_text)
            left_pad = (line_width - title_len) // 2
            right_pad = line_width - title_len - left_pad

            line = char * left_pad + title_text + char * right_pad
            return self.colorize(line, self.config.theme.secondary)
        else:
            line = char * line_width
            return self.colorize(line, self.config.theme.muted)

    # ========================================================================
    # Convenience Methods
    # ========================================================================

    def success(self, text: str, icon: str = "✓") -> str:
        """Format success message"""
        if not self.config.unicode_enabled:
            icon = "[OK]"

        message = f"{icon} {text}"
        return self.colorize(message, self.config.theme.success, Color.BOLD)

    def error(self, text: str, icon: str = "✗") -> str:
        """Format error message"""
        if not self.config.unicode_enabled:
            icon = "[ERROR]"

        message = f"{icon} {text}"
        return self.colorize(message, self.config.theme.error, Color.BOLD)

    def warning(self, text: str, icon: str = "⚠") -> str:
        """Format warning message"""
        if not self.config.unicode_enabled:
            icon = "[WARN]"

        message = f"{icon} {text}"
        return self.colorize(message, self.config.theme.warning, Color.BOLD)

    def info(self, text: str, icon: str = "ℹ") -> str:
        """Format info message"""
        if not self.config.unicode_enabled:
            icon = "[INFO]"

        message = f"{icon} {text}"
        return self.colorize(message, self.config.theme.info)

    # ========================================================================
    # Text Utilities (Exposed)
    # ========================================================================

    def wrap_text(self, text: str, width: Optional[int] = None) -> str:
        """Wrap text to specified width"""
        wrap_width = width or self.config.terminal_width - 4
        lines = TextUtils.wrap(text, wrap_width)
        return '\n'.join(lines)

    def strip_ansi(self, text: str) -> str:
        """Remove ANSI codes from text"""
        return TextUtils.strip_ansi(text)

    def clear_screen(self):
        """Clear terminal screen"""
        if sys.platform == 'win32':
            os.system('cls')
        else:
            os.system('clear')


# ============================================================================
# Module-level convenience functions
# ============================================================================

# Create default formatter instance
_default_formatter = UnifiedFormatter.create()


def get_formatter() -> UnifiedFormatter:
    """Get the default formatter instance"""
    return _default_formatter


def set_default_formatter(formatter: UnifiedFormatter):
    """Set the default formatter instance"""
    global _default_formatter
    _default_formatter = formatter
