#!/usr/bin/env python3
"""
Windows Optimizer Plugin - Windows-specific terminal enhancements

This plugin provides:
- Automatic Windows console capability detection
- ANSI escape sequence support via colorama or Windows API
- Fallback strategies for limited terminal support
- Safe character sets for Windows console
- Box drawing with ASCII alternatives
- Color compatibility layer
"""

import sys
import os
import re
from typing import Optional, Dict, Any, Tuple
from .base import BasePlugin, PluginCapabilities, PluginMetadata


class WindowsOptimizerPlugin(BasePlugin):
    """Plugin for Windows-specific terminal optimizations"""

    # Windows-safe box drawing characters
    BOX_CHARS = {
        'ascii': {
            'top_left': '+', 'top_right': '+',
            'bottom_left': '+', 'bottom_right': '+',
            'horizontal': '-', 'vertical': '|',
            'cross': '+', 'tee_down': '+',
            'tee_up': '+', 'tee_right': '+', 'tee_left': '+'
        },
        'simple': {
            'top_left': '+', 'top_right': '+',
            'bottom_left': '+', 'bottom_right': '+',
            'horizontal': '=', 'vertical': '|',
            'cross': '+', 'tee_down': '=',
            'tee_up': '=', 'tee_right': '|', 'tee_left': '|'
        },
        'double': {
            'top_left': '#', 'top_right': '#',
            'bottom_left': '#', 'bottom_right': '#',
            'horizontal': '=', 'vertical': '#',
            'cross': '#', 'tee_down': '#',
            'tee_up': '#', 'tee_right': '#', 'tee_left': '#'
        }
    }

    # Safe Unicode characters that work on most Windows consoles
    SAFE_UNICODE = {
        'bullet': '•', 'arrow_right': '→', 'arrow_left': '←',
        'check': '✓', 'cross': '✗', 'star': '★',
        'heart': '♥', 'diamond': '◆', 'club': '♣', 'spade': '♠',
    }

    # ASCII fallbacks
    ASCII_FALLBACK = {
        'bullet': '*', 'arrow_right': '>', 'arrow_left': '<',
        'check': 'v', 'cross': 'x', 'star': '*',
        'heart': '<3', 'diamond': '<>', 'club': '&', 'spade': '^',
    }

    def __init__(self):
        """Initialize Windows optimizer plugin"""
        super().__init__()
        self.formatter = None
        self.is_windows = sys.platform == 'win32'
        self.ansi_supported = False
        self.unicode_supported = False
        self.colorama_available = False
        self.capabilities: Dict[str, Any] = {}

    @property
    def name(self) -> str:
        return "windows_optimizer"

    @property
    def version(self) -> str:
        return "1.0.0"

    def initialize(self, formatter: Any = None) -> None:
        """Initialize Windows optimizations

        Args:
            formatter: Parent formatter instance
        """
        self.formatter = formatter

        if self.is_windows:
            self.ansi_supported = self._enable_windows_ansi()
            self.unicode_supported = self._detect_unicode_support()
            self.capabilities = self.detect_capabilities()
        else:
            # Non-Windows systems typically support everything
            self.ansi_supported = True
            self.unicode_supported = True
            self.capabilities = {
                'ansi': True,
                'unicode': True,
                'colors': True,
                'box_drawing': True,
                'emoji': True
            }

    def shutdown(self) -> None:
        """Clean up Windows optimizations"""
        if self.colorama_available:
            try:
                import colorama
                colorama.deinit()
            except:
                pass

    def can_handle(self, content_type: str) -> bool:
        """Check if plugin can handle content type

        Args:
            content_type: Content type identifier

        Returns:
            True if this plugin handles the content type
        """
        # This plugin provides utilities, not content handling
        return content_type in {'windows_box', 'windows_text'}

    def format(self, content: Any, **options) -> str:
        """Format content for Windows

        Args:
            content: Content to format
            **options: Formatting options

        Returns:
            Windows-optimized string
        """
        if isinstance(content, str):
            return self.optimize_for_windows(content)
        return str(content)

    def get_capabilities(self) -> PluginCapabilities:
        """Get plugin capabilities

        Returns:
            Plugin capabilities
        """
        return PluginCapabilities(
            content_types={'windows_box', 'windows_text'},
            features={'windows_ansi', 'safe_chars', 'box_drawing', 'capability_detection'},
            provides={'optimize_for_windows', 'safe_characters', 'detect_capabilities'}
        )

    def get_metadata(self) -> PluginMetadata:
        """Get plugin metadata

        Returns:
            Plugin metadata
        """
        return PluginMetadata(
            name=self.name,
            version=self.version,
            author="Algorithm Learning System",
            description="Windows-specific terminal optimizations and compatibility",
            tags=['windows', 'ansi', 'compatibility', 'optimization']
        )

    def _enable_windows_ansi(self) -> bool:
        """Enable ANSI color support on Windows

        Returns:
            True if ANSI is supported
        """
        # Try colorama first
        try:
            import colorama
            colorama.init(autoreset=False, convert=True, strip=False)
            self.colorama_available = True
            return True
        except ImportError:
            pass

        # Fallback to Windows API
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            stdout_handle = kernel32.GetStdHandle(-11)
            mode = ctypes.c_ulong()
            kernel32.GetConsoleMode(stdout_handle, ctypes.byref(mode))
            mode.value |= 0x0004  # ENABLE_VIRTUAL_TERMINAL_PROCESSING
            kernel32.SetConsoleMode(stdout_handle, mode)
            return True
        except:
            return False

    def _detect_unicode_support(self) -> bool:
        """Detect Unicode support in Windows console

        Returns:
            True if Unicode is supported
        """
        try:
            test_chars = "•→✓★◆"
            for char in test_chars:
                char.encode(sys.stdout.encoding or 'utf-8')
            return True
        except (UnicodeEncodeError, LookupError):
            return False

    def detect_capabilities(self) -> Dict[str, Any]:
        """Detect Windows console capabilities

        Returns:
            Dictionary of supported capabilities
        """
        capabilities = {
            'platform': 'windows' if self.is_windows else sys.platform,
            'ansi': self.ansi_supported,
            'unicode': self.unicode_supported,
            'colors': self.ansi_supported,
            'box_drawing': False,
            'emoji': False,
            'colorama': self.colorama_available,
            'encoding': sys.stdout.encoding or 'utf-8'
        }

        # Test box drawing characters
        try:
            "┌─┐│└┘".encode(sys.stdout.encoding or 'utf-8')
            capabilities['box_drawing'] = True
        except:
            capabilities['box_drawing'] = False

        # Test emoji support
        try:
            "🎨🚀✨".encode(sys.stdout.encoding or 'utf-8')
            capabilities['emoji'] = True
        except:
            capabilities['emoji'] = False

        return capabilities

    def optimize_for_windows(self, text: str) -> str:
        """Optimize text for Windows console

        Args:
            text: Text to optimize

        Returns:
            Optimized text
        """
        if not self.is_windows:
            return text

        # Replace problematic Unicode with safe alternatives
        if not self.unicode_supported:
            for unicode_char, ascii_char in self.ASCII_FALLBACK.items():
                if unicode_char in self.SAFE_UNICODE:
                    text = text.replace(self.SAFE_UNICODE[unicode_char], ascii_char)

        return text

    def safe_characters(self, char_type: str) -> str:
        """Get safe character for Windows

        Args:
            char_type: Character type

        Returns:
            Safe character
        """
        if self.unicode_supported and char_type in self.SAFE_UNICODE:
            return self.SAFE_UNICODE[char_type]
        elif char_type in self.ASCII_FALLBACK:
            return self.ASCII_FALLBACK[char_type]
        return '*'

    def get_box_chars(self, style: str = 'simple') -> Dict[str, str]:
        """Get box drawing characters

        Args:
            style: Box style

        Returns:
            Dictionary of box characters
        """
        if self.is_windows or not self.capabilities.get('box_drawing', False):
            if style == 'double':
                return self.BOX_CHARS['double']
            elif style == 'simple':
                return self.BOX_CHARS['simple']
            else:
                return self.BOX_CHARS['ascii']

        return self.BOX_CHARS.get(style, self.BOX_CHARS['ascii'])

    def create_safe_box(self, content: str, title: Optional[str] = None,
                       width: Optional[int] = None, style: str = 'simple') -> str:
        """Create a safe box for Windows

        Args:
            content: Content to box
            title: Optional box title
            width: Box width
            style: Box style

        Returns:
            Boxed content
        """
        lines = content.split('\n')
        max_width = max(len(line) for line in lines) if lines else 0

        if title:
            max_width = max(max_width, len(title) + 4)

        box_width = width if width else max_width + 4
        chars = self.get_box_chars(style)

        # Top border
        if title:
            title_line = f" {title} "
            padding = (box_width - len(title_line) - 2) // 2
            top = (chars['top_left'] +
                  chars['horizontal'] * padding +
                  title_line +
                  chars['horizontal'] * (box_width - padding - len(title_line) - 2) +
                  chars['top_right'])
        else:
            top = chars['top_left'] + chars['horizontal'] * (box_width - 2) + chars['top_right']

        # Content lines
        boxed_lines = [top]
        for line in lines:
            padded = line.ljust(box_width - 4)
            boxed_lines.append(f"{chars['vertical']} {padded} {chars['vertical']}")

        # Bottom border
        bottom = chars['bottom_left'] + chars['horizontal'] * (box_width - 2) + chars['bottom_right']
        boxed_lines.append(bottom)

        return '\n'.join(boxed_lines)

    def create_progress_bar(self, current: int, total: int,
                          width: int = 40, filled_char: str = '#',
                          empty_char: str = '-') -> str:
        """Create a Windows-safe progress bar

        Args:
            current: Current progress
            total: Total items
            width: Bar width
            filled_char: Filled character
            empty_char: Empty character

        Returns:
            Progress bar string
        """
        if total <= 0:
            return empty_char * width

        percent = current / total
        filled_length = int(width * percent)
        return filled_char * filled_length + empty_char * (width - filled_length)

    def strip_ansi(self, text: str) -> str:
        """Strip ANSI codes from text

        Args:
            text: Text with ANSI codes

        Returns:
            Text without ANSI codes
        """
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        return ansi_escape.sub('', text)

    def get_display_width(self, text: str) -> int:
        """Get display width of text

        Args:
            text: Text to measure

        Returns:
            Display width
        """
        return len(self.strip_ansi(text))

    def wrap_text(self, text: str, width: int) -> list:
        """Wrap text to specified width

        Args:
            text: Text to wrap
            width: Maximum line width

        Returns:
            List of wrapped lines
        """
        words = text.split()
        lines = []
        current_line = []
        current_width = 0

        for word in words:
            word_width = len(word)

            if current_width + word_width + len(current_line) > width:
                if current_line:
                    lines.append(' '.join(current_line))
                    current_line = [word]
                    current_width = word_width
                else:
                    lines.append(word[:width])
                    if len(word) > width:
                        current_line = [word[width:]]
                        current_width = len(word[width:])
                    else:
                        current_line = []
                        current_width = 0
            else:
                current_line.append(word)
                current_width += word_width

        if current_line:
            lines.append(' '.join(current_line))

        return lines

    def get_terminal_size(self) -> Tuple[int, int]:
        """Get terminal size on Windows

        Returns:
            Tuple of (width, height)
        """
        try:
            import shutil
            size = shutil.get_terminal_size()
            return size.columns, size.lines
        except:
            return 80, 24

    def clear_line(self) -> None:
        """Clear current line"""
        if self.ansi_supported:
            sys.stdout.write('\r\033[K')
            sys.stdout.flush()
        else:
            width, _ = self.get_terminal_size()
            sys.stdout.write('\r' + ' ' * width + '\r')
            sys.stdout.flush()

    def move_cursor(self, row: int = 0, col: int = 0) -> None:
        """Move cursor to position

        Args:
            row: Row position
            col: Column position
        """
        if self.ansi_supported:
            sys.stdout.write(f'\033[{row};{col}H')
            sys.stdout.flush()

    def save_cursor_position(self) -> None:
        """Save current cursor position"""
        if self.ansi_supported:
            sys.stdout.write('\033[s')
            sys.stdout.flush()

    def restore_cursor_position(self) -> None:
        """Restore saved cursor position"""
        if self.ansi_supported:
            sys.stdout.write('\033[u')
            sys.stdout.flush()
