#!/usr/bin/env python3
"""
Shared UI Utilities - Common utility functions for UI components

This module provides utility functions used across multiple UI modules
to reduce code duplication and improve maintainability.
"""

import os
import sys
import time
from typing import Optional, List, Tuple
from pathlib import Path


def get_terminal_size() -> Tuple[int, int]:
    """Get terminal size safely with fallback

    Returns:
        Tuple of (width, height) in characters
    """
    try:
        import shutil
        size = shutil.get_terminal_size((80, 24))
        return size.columns, size.lines
    except Exception:
        return 80, 24


def is_windows() -> bool:
    """Check if running on Windows platform"""
    return os.name == 'nt' or sys.platform == 'win32'


def is_powershell() -> bool:
    """Check if running in PowerShell environment"""
    if not is_windows():
        return False

    # Check for PowerShell-specific environment variables
    return any([
        os.environ.get('PSModulePath'),
        os.environ.get('POWERSHELL_DISTRIBUTION_CHANNEL'),
        'powershell' in os.environ.get('TERM_PROGRAM', '').lower()
    ])


def clear_screen() -> None:
    """Clear terminal screen in a platform-appropriate way"""
    if is_windows():
        os.system('cls')
    else:
        os.system('clear')


def wait_for_keypress(prompt: str = "Press any key to continue...") -> None:
    """Wait for user to press a key

    Args:
        prompt: Prompt message to display
    """
    print(f"\n{prompt}", end='', flush=True)

    if is_windows():
        import msvcrt
        msvcrt.getch()
    else:
        import termios
        import tty
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(fd)
            sys.stdin.read(1)
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)

    print()  # New line after keypress


def smooth_print(text: str, delay: float = 0.03, end: str = '\n') -> None:
    """Print text with typing animation effect

    Args:
        text: Text to print
        delay: Delay between characters in seconds
        end: String to append at the end
    """
    for char in text:
        print(char, end='', flush=True)
        if char not in (' ', '\n'):
            time.sleep(delay)
    print(end, end='', flush=True)


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate text to maximum length with suffix

    Args:
        text: Text to truncate
        max_length: Maximum length including suffix
        suffix: Suffix to add when truncated

    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text

    return text[:max_length - len(suffix)] + suffix


def format_duration(seconds: float) -> str:
    """Format duration in seconds to human-readable string

    Args:
        seconds: Duration in seconds

    Returns:
        Formatted duration (e.g., "2h 30m", "45m", "30s")
    """
    if seconds < 60:
        return f"{int(seconds)}s"

    minutes = int(seconds / 60)
    if minutes < 60:
        return f"{minutes}m"

    hours = int(minutes / 60)
    remaining_minutes = minutes % 60

    if remaining_minutes == 0:
        return f"{hours}h"

    return f"{hours}h {remaining_minutes}m"


def format_percentage(value: float, decimals: int = 1) -> str:
    """Format percentage value

    Args:
        value: Percentage value (0-100)
        decimals: Number of decimal places

    Returns:
        Formatted percentage string
    """
    return f"{value:.{decimals}f}%"


def create_progress_bar(
    current: int,
    total: int,
    width: int = 50,
    fill: str = '█',
    empty: str = '░'
) -> str:
    """Create a text-based progress bar

    Args:
        current: Current progress value
        total: Total/maximum value
        width: Width of progress bar in characters
        fill: Character for filled portion
        empty: Character for empty portion

    Returns:
        Progress bar string
    """
    if total == 0:
        percentage = 0
    else:
        percentage = min(100, (current / total) * 100)

    filled_width = int(width * percentage / 100)
    empty_width = width - filled_width

    bar = fill * filled_width + empty * empty_width
    return f"[{bar}] {percentage:.1f}%"


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe file system usage

    Args:
        filename: Original filename

    Returns:
        Sanitized filename
    """
    # Remove or replace invalid characters
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')

    # Limit length
    max_length = 255
    if len(filename) > max_length:
        name, ext = os.path.splitext(filename)
        name = name[:max_length - len(ext) - 1]
        filename = name + ext

    return filename


def ensure_directory(path: Path) -> Path:
    """Ensure directory exists, create if necessary

    Args:
        path: Directory path

    Returns:
        Path object
    """
    path.mkdir(parents=True, exist_ok=True)
    return path


def count_lines(text: str) -> int:
    """Count number of lines in text

    Args:
        text: Text to count lines in

    Returns:
        Number of lines
    """
    return len(text.splitlines())


def wrap_text(text: str, width: int) -> List[str]:
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
    current_length = 0

    for word in words:
        word_length = len(word)

        if current_length + word_length + len(current_line) <= width:
            current_line.append(word)
            current_length += word_length
        else:
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]
            current_length = word_length

    if current_line:
        lines.append(' '.join(current_line))

    return lines
