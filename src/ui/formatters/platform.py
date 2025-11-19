#!/usr/bin/env python3
"""Platform Detection - Extracted from unified_formatter.py"""

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
