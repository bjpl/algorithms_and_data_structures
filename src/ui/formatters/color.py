#!/usr/bin/env python3
"""Color System - Extracted from unified_formatter.py"""

    accent: Color = Color.MAGENTA
    highlight: Color = Color.BRIGHT_CYAN
    header: Color = Color.BRIGHT_MAGENTA  # For header text


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

    def __init__(self, config: Optional[FormatterConfig] = None, theme: Optional[Theme] = None):
        """Initialize formatter with configuration

        Args:
            config: Optional FormatterConfig instance
            theme: Optional Theme instance (for backward compatibility)
        """
        # Detect platform if not provided
        capabilities = PlatformDetector.detect()

        # Initialize config
        if config is None:
            config = FormatterConfig()

        # Apply theme if provided (backward compatibility)
        if theme is not None:
            config.theme = theme

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

        # Initialize plugin system
        self._plugins: List[Any] = []
        self._plugin_manager: Optional[Any] = None

    # ========================================================================
    # Factory Methods
    # ========================================================================

    @classmethod
