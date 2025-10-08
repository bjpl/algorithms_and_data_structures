#!/usr/bin/env python3
"""
Animation Plugin - Comprehensive animation and visual effects system

This plugin provides:
- 20+ spinner styles with frame-based animation
- Progress animations with visual effects
- Typewriter and fade effects
- Slide and transition animations
- Non-blocking threaded animations
- Cross-platform compatibility with ASCII fallbacks
"""

import sys
import time
import threading
from typing import Optional, Any
from enum import Enum

from .base import BasePlugin, PluginCapabilities, PluginMetadata


class SpinnerStyle(Enum):
    """Available spinner animation styles"""
    # Unicode spinners
    DOTS = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    DOTS2 = "⣾⣽⣻⢿⡿⣟⣯⣷"
    CIRCLES = "◐◓◑◒"
    ARROWS = "←↖↑↗→↘↓↙"
    BARS = "▁▃▄▅▆▇█▇▆▅▄▃"
    BLOCKS = "▖▘▝▗"
    BOUNCE = "⠁⠂⠄⠂"
    CLOCK = "🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛"
    MOON = "🌑🌒🌓🌔🌕🌖🌗🌘"
    EARTH = "🌍🌎🌏"
    LINE = "⎯⎼⎽⎼"
    PIPE = "⎸⎹⎺⎹"
    STAR = "✶✸✹✺✹✷"
    SQUARE = "▖▘▝▗"
    TRIANGLE = "◢◣◤◥"
    DIAMOND = "◆◇◈◇"

    # ASCII-only spinners for compatibility
    ASCII_DOTS = ".oO@*"
    ASCII_BARS = "|/-\\"
    ASCII_ARROWS = "<^>v"
    ASCII_BLOCKS = "[]{}()"
    ASCII_PLUS = "+x*"


class AnimationSpeed(Enum):
    """Animation speed presets"""
    VERY_SLOW = 0.3
    SLOW = 0.2
    NORMAL = 0.1
    FAST = 0.05
    VERY_FAST = 0.02


class AnimationPlugin(BasePlugin):
    """Plugin providing animation and visual effects"""

    def __init__(self):
        """Initialize animation plugin"""
        super().__init__()
        self.formatter = None
        self.color_enabled = True
        self._spinner_active = False
        self._spinner_thread: Optional[threading.Thread] = None

    @property
    def name(self) -> str:
        return "animation"

    @property
    def version(self) -> str:
        return "1.0.0"

    def initialize(self, formatter: Any = None) -> None:
        """Initialize animation resources

        Args:
            formatter: Parent formatter instance
        """
        self.formatter = formatter
        self.color_enabled = getattr(formatter, 'color_enabled', True)
        self._spinner_active = False
        self._spinner_thread = None

    def shutdown(self) -> None:
        """Clean up animation resources"""
        self._stop_all_animations()

    def can_handle(self, content_type: str) -> bool:
        """Check if plugin can handle content type

        Args:
            content_type: Content type identifier

        Returns:
            True if this plugin handles the content type
        """
        return content_type in {'spinner', 'progress', 'animation'}

    def format(self, content: Any, **options) -> str:
        """Format content with animations

        Args:
            content: Content to format
            **options: Animation options

        Returns:
            Formatted string (animations use side effects)
        """
        # Animations are primarily used via context managers
        # This method is for compatibility
        return str(content)

    def get_capabilities(self) -> PluginCapabilities:
        """Get plugin capabilities

        Returns:
            Plugin capabilities
        """
        return PluginCapabilities(
            content_types={'spinner', 'progress', 'animation'},
            features={'spinners', 'progress_bars', 'typewriter', 'transitions'},
            provides={'spinner', 'progress_animation', 'fade_in', 'slide', 'typewriter'}
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
            description="Animation and visual effects for terminal output",
            tags=['animation', 'spinner', 'progress', 'effects']
        )

    def _stop_all_animations(self) -> None:
        """Stop all running animations"""
        self._spinner_active = False
        if self._spinner_thread and self._spinner_thread.is_alive():
            self._spinner_thread.join(timeout=0.2)

    def _supports_unicode(self) -> bool:
        """Check if terminal supports Unicode characters

        Returns:
            True if Unicode is supported
        """
        try:
            test_chars = "⠋◐▁🌑✶"
            for char in test_chars:
                char.encode(sys.stdout.encoding or 'utf-8')
            return True
        except (UnicodeEncodeError, LookupError):
            return False

    def _get_spinner_chars(self, style: SpinnerStyle) -> str:
        """Get spinner characters with fallback to ASCII

        Args:
            style: Desired spinner style

        Returns:
            Spinner character sequence
        """
        ascii_fallback = {
            SpinnerStyle.DOTS: SpinnerStyle.ASCII_DOTS,
            SpinnerStyle.DOTS2: SpinnerStyle.ASCII_DOTS,
            SpinnerStyle.CIRCLES: SpinnerStyle.ASCII_BLOCKS,
            SpinnerStyle.ARROWS: SpinnerStyle.ASCII_ARROWS,
            SpinnerStyle.BARS: SpinnerStyle.ASCII_BARS,
            SpinnerStyle.BLOCKS: SpinnerStyle.ASCII_BLOCKS,
            SpinnerStyle.BOUNCE: SpinnerStyle.ASCII_DOTS,
            SpinnerStyle.CLOCK: SpinnerStyle.ASCII_BARS,
            SpinnerStyle.MOON: SpinnerStyle.ASCII_BLOCKS,
            SpinnerStyle.EARTH: SpinnerStyle.ASCII_BLOCKS,
            SpinnerStyle.LINE: SpinnerStyle.ASCII_BARS,
            SpinnerStyle.PIPE: SpinnerStyle.ASCII_BARS,
            SpinnerStyle.STAR: SpinnerStyle.ASCII_PLUS,
            SpinnerStyle.SQUARE: SpinnerStyle.ASCII_BLOCKS,
            SpinnerStyle.TRIANGLE: SpinnerStyle.ASCII_ARROWS,
            SpinnerStyle.DIAMOND: SpinnerStyle.ASCII_BLOCKS,
        }

        if not self._supports_unicode() and style in ascii_fallback:
            return ascii_fallback[style].value
        return style.value

    def spinner(self, message: str = "Loading...",
                style: SpinnerStyle = SpinnerStyle.DOTS,
                speed: AnimationSpeed = AnimationSpeed.NORMAL) -> 'SpinnerContext':
        """Create a spinner context manager

        Args:
            message: Message to display
            style: Spinner animation style
            speed: Animation speed

        Returns:
            Spinner context manager
        """
        return SpinnerContext(self, message, style, speed)

    def progress_animation(self, total: int, description: str = "",
                          bar_length: int = 40, style: str = "blocks") -> 'AnimatedProgress':
        """Create animated progress bar

        Args:
            total: Total items
            description: Progress description
            bar_length: Bar length
            style: Animation style

        Returns:
            Animated progress instance
        """
        return AnimatedProgress(self, total, description, bar_length, style)

    def fade_in(self, text: str, steps: int = 10, duration: float = 1.0) -> None:
        """Display text with fade-in effect

        Args:
            text: Text to display
            steps: Animation steps
            duration: Total duration
        """
        if not self.color_enabled:
            print(text)
            return

        delay = duration / steps
        for i in range(steps + 1):
            opacity = i / steps
            color_code = "\033[90m" if opacity < 0.3 else "\033[37m" if opacity < 0.6 else "\033[97m"
            sys.stdout.write(f"\r{color_code}{text}\033[0m")
            sys.stdout.flush()
            time.sleep(delay)
        print()

    def slide(self, text: str, direction: str = "left", duration: float = 1.0) -> None:
        """Display text with slide animation

        Args:
            text: Text to slide
            direction: Slide direction
            duration: Animation duration
        """
        if not self.color_enabled:
            print(text)
            return

        steps = 20
        delay = duration / steps

        if direction == "left":
            for i in range(steps + 1):
                offset = len(text) - int((len(text) * i) / steps)
                visible = text[offset:] if offset < len(text) else ""
                sys.stdout.write(f"\r{' ' * offset}{visible}")
                sys.stdout.flush()
                time.sleep(delay)
        elif direction == "right":
            for i in range(steps + 1):
                visible = text[:int((len(text) * i) / steps)]
                sys.stdout.write(f"\r{visible}")
                sys.stdout.flush()
                time.sleep(delay)
        print()

    def typewriter(self, text: str, speed: float = 0.05,
                  pause_on_punctuation: bool = True, cursor_char: str = "▌") -> None:
        """Display text with typewriter effect

        Args:
            text: Text to type
            speed: Typing speed
            pause_on_punctuation: Pause at punctuation
            cursor_char: Cursor character
        """
        if not self.color_enabled:
            print(text)
            return

        if not self._supports_unicode():
            cursor_char = "|"

        sys.stdout.write('\033[?25l')  # Hide cursor
        try:
            displayed = ""
            for char in text:
                displayed += char
                sys.stdout.write(f"\r{displayed}\033[93m{cursor_char}\033[0m")
                sys.stdout.flush()

                if pause_on_punctuation:
                    if char in '.!?':
                        time.sleep(speed * 5)
                    elif char in ',;:':
                        time.sleep(speed * 3)
                    elif char == ' ':
                        time.sleep(speed * 0.5)
                    else:
                        time.sleep(speed)
                else:
                    time.sleep(speed)

            sys.stdout.write(f"\r{displayed}\n")
            sys.stdout.flush()
        finally:
            sys.stdout.write('\033[?25h')  # Show cursor
            sys.stdout.flush()


class SpinnerContext:
    """Context manager for spinner animations"""

    def __init__(self, plugin: AnimationPlugin, message: str,
                 style: SpinnerStyle, speed: AnimationSpeed):
        self.plugin = plugin
        self.message = message
        self.style = style
        self.speed = speed.value
        self.active = False
        self.thread: Optional[threading.Thread] = None

    def __enter__(self):
        if not self.plugin.color_enabled:
            print(f"{self.message}")
            return self

        self.active = True
        self.thread = threading.Thread(target=self._animate)
        self.thread.daemon = True
        self.thread.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.active = False
        if self.thread:
            self.thread.join(timeout=0.2)

        if self.plugin.color_enabled:
            sys.stdout.write("\r" + " " * (len(self.message) + 10) + "\r")
            sys.stdout.flush()

    def update_message(self, message: str) -> None:
        """Update spinner message"""
        self.message = message

    def _animate(self) -> None:
        """Run spinner animation loop"""
        chars = self.plugin._get_spinner_chars(self.style)
        i = 0

        while self.active:
            char = chars[i % len(chars)]
            sys.stdout.write(f"\r\033[96m{char}\033[0m \033[97m{self.message}\033[0m")
            sys.stdout.flush()
            time.sleep(self.speed)
            i += 1


class AnimatedProgress:
    """Animated progress bar with visual effects"""

    def __init__(self, plugin: AnimationPlugin, total: int,
                 description: str, bar_length: int, style: str):
        self.plugin = plugin
        self.total = total
        self.description = description
        self.bar_length = bar_length
        self.style = style
        self.current = 0
        self.animation_frame = 0
        self.start_time = time.time()

    def update(self, amount: int = 1) -> None:
        """Update progress"""
        self.current = min(self.current + amount, self.total)
        self._render()

    def set_progress(self, value: int) -> None:
        """Set absolute progress"""
        self.current = min(max(value, 0), self.total)
        self._render()

    def _render(self) -> None:
        """Render animated progress bar"""
        if not self.plugin.color_enabled:
            percent = (self.current / self.total) * 100 if self.total > 0 else 0
            sys.stdout.write(f"\r{self.description}: {self.current}/{self.total} ({percent:.1f}%)")
            sys.stdout.flush()
            return

        percent = self.current / self.total if self.total > 0 else 0
        filled_length = int(self.bar_length * percent)

        # Create bar based on style
        if self.style == "blocks":
            filled = "█" * filled_length
            empty = "░" * (self.bar_length - filled_length)
        elif self.style == "dots":
            filled = "●" * filled_length
            empty = "○" * (self.bar_length - filled_length)
        elif self.style == "arrows":
            filled = "►" * filled_length
            empty = "─" * (self.bar_length - filled_length)
        elif self.style == "pulse":
            pulse_chars = ["◐", "◓", "◑", "◒"]
            pulse = pulse_chars[self.animation_frame % len(pulse_chars)]
            filled = "█" * max(0, filled_length - 1) + (pulse if filled_length > 0 else "")
            empty = "░" * (self.bar_length - filled_length)
            self.animation_frame += 1
        else:
            filled = "#" * filled_length
            empty = "-" * (self.bar_length - filled_length)

        # Color based on progress
        bar_color = "\033[92m" if percent >= 1.0 else "\033[93m" if percent >= 0.7 else "\033[96m"
        bar = f"{bar_color}{filled}{empty}\033[0m"

        # Calculate ETA
        elapsed = time.time() - self.start_time
        if self.current > 0:
            rate = self.current / elapsed
            eta_sec = (self.total - self.current) / rate if rate > 0 else 0
            eta_str = f"ETA: {eta_sec:.0f}s" if eta_sec > 0 else "Done"
        else:
            eta_str = "ETA: --"

        percent_str = f"{percent * 100:5.1f}%"
        line = f"\r{self.description} [{bar}] {percent_str} ({self.current}/{self.total}) {eta_str}"

        sys.stdout.write(line)
        sys.stdout.flush()

        if self.current >= self.total:
            print()

    def finish(self) -> None:
        """Complete the progress bar"""
        self.current = self.total
        self._render()
