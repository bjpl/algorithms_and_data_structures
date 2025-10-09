#!/usr/bin/env python3
"""
Gradient Plugin - Text gradient and color transition effects

This plugin provides:
- Linear gradient text effects (left-to-right color transitions)
- Radial gradient effects (center-to-edges transitions)
- Rainbow gradients with customizable hue ranges
- Multi-color gradients with custom stops
- Terminal capability detection with ASCII fallbacks
- Safe degradation for non-color terminals
"""

import sys
import math
from typing import Optional, Any, List, Tuple
from enum import Enum

from .base import BasePlugin, PluginCapabilities, PluginMetadata


class GradientType(Enum):
    """Available gradient types"""
    LINEAR = "linear"           # Left to right
    LINEAR_REVERSE = "reverse"  # Right to left
    RADIAL = "radial"          # Center to edges
    RAINBOW = "rainbow"        # Full spectrum
    CUSTOM = "custom"          # Custom color stops


class GradientPlugin(BasePlugin):
    """Plugin providing gradient text effects"""

    # ANSI 256-color palette for smooth gradients
    COLORS_256 = {
        'red': [196, 160, 124, 88, 52],
        'orange': [208, 172, 136, 100, 64],
        'yellow': [226, 190, 154, 118, 82],
        'green': [46, 40, 34, 28, 22],
        'cyan': [51, 45, 39, 33, 27],
        'blue': [21, 20, 19, 18, 17],
        'magenta': [201, 165, 129, 93, 57],
        'purple': [141, 135, 129, 93, 57],
    }

    # Basic 16-color fallback
    COLORS_16 = {
        'red': '\033[91m',
        'orange': '\033[93m',
        'yellow': '\033[93m',
        'green': '\033[92m',
        'cyan': '\033[96m',
        'blue': '\033[94m',
        'magenta': '\033[95m',
        'purple': '\033[95m',
        'white': '\033[97m',
        'reset': '\033[0m',
    }

    def __init__(self):
        """Initialize gradient plugin"""
        super().__init__()
        self.formatter = None
        self.color_enabled = True
        self.supports_256_colors = False

    @property
    def name(self) -> str:
        return "gradient"

    @property
    def version(self) -> str:
        return "1.0.0"

    def initialize(self, formatter: Any = None) -> None:
        """Initialize gradient resources

        Args:
            formatter: Parent formatter instance
        """
        self.formatter = formatter
        self.color_enabled = getattr(formatter, 'colors_enabled', True)
        self.supports_256_colors = self._detect_256_color_support()

    def shutdown(self) -> None:
        """Clean up gradient resources"""
        pass

    def can_handle(self, content_type: str) -> bool:
        """Check if plugin can handle content type

        Args:
            content_type: Content type identifier

        Returns:
            True if this plugin handles the content type
        """
        return content_type in {'gradient', 'gradient_text', 'rainbow'}

    def format(self, content: Any, **options) -> str:
        """Format content with gradient

        Args:
            content: Content to format (text string)
            **options: Gradient options (gradient_type, colors, etc.)

        Returns:
            Formatted string with gradient
        """
        if not isinstance(content, str):
            content = str(content)

        if not self.color_enabled:
            return content

        gradient_type = options.get('gradient_type', GradientType.LINEAR)
        if isinstance(gradient_type, str):
            gradient_type = GradientType(gradient_type)

        if gradient_type == GradientType.LINEAR:
            start_color = options.get('start_color', 'cyan')
            end_color = options.get('end_color', 'magenta')
            return self.linear_gradient(content, start_color, end_color)

        elif gradient_type == GradientType.LINEAR_REVERSE:
            start_color = options.get('start_color', 'cyan')
            end_color = options.get('end_color', 'magenta')
            return self.linear_gradient(content, end_color, start_color)

        elif gradient_type == GradientType.RADIAL:
            center_color = options.get('center_color', 'white')
            edge_color = options.get('edge_color', 'blue')
            return self.radial_gradient(content, center_color, edge_color)

        elif gradient_type == GradientType.RAINBOW:
            return self.rainbow_gradient(content)

        elif gradient_type == GradientType.CUSTOM:
            colors = options.get('colors', ['cyan', 'magenta'])
            return self.custom_gradient(content, colors)

        return content

    def get_capabilities(self) -> PluginCapabilities:
        """Get plugin capabilities

        Returns:
            Plugin capabilities
        """
        return PluginCapabilities(
            content_types={'gradient', 'gradient_text', 'rainbow'},
            features={'linear_gradient', 'radial_gradient', 'rainbow_gradient', 'custom_gradient'},
            provides={'gradient_text', 'color_transitions', 'rainbow_text'}
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
            description="Gradient and color transition effects for text",
            tags=['gradient', 'color', 'effects', 'rainbow']
        )

    def _detect_256_color_support(self) -> bool:
        """Detect if terminal supports 256 colors

        Returns:
            True if 256 colors are supported
        """
        # Check TERM variable
        term = os.environ.get('TERM', '')
        if '256color' in term:
            return True

        # Check COLORTERM variable
        colorterm = os.environ.get('COLORTERM', '')
        if colorterm in ('truecolor', '24bit'):
            return True

        # Windows 10+ supports 256 colors with ANSI enabled
        if sys.platform == 'win32':
            try:
                import ctypes
                kernel32 = ctypes.windll.kernel32
                return True
            except:
                pass

        return False

    def _get_256_color_code(self, color_num: int) -> str:
        """Get ANSI 256-color escape code

        Args:
            color_num: Color number (0-255)

        Returns:
            ANSI escape code
        """
        return f'\033[38;5;{color_num}m'

    def _interpolate_colors_256(self, start: int, end: int, steps: int) -> List[int]:
        """Interpolate between two 256-color values

        Args:
            start: Start color number
            end: End color number
            steps: Number of interpolation steps

        Returns:
            List of color numbers
        """
        if steps <= 1:
            return [start]

        colors = []
        for i in range(steps):
            ratio = i / (steps - 1)
            color = int(start + (end - start) * ratio)
            colors.append(color)

        return colors

    def linear_gradient(self, text: str, start_color: str, end_color: str) -> str:
        """Apply linear gradient from start to end color

        Args:
            text: Text to apply gradient to
            start_color: Starting color name
            end_color: Ending color name

        Returns:
            Text with gradient applied
        """
        if not self.color_enabled or not text:
            return text

        text_len = len(text)
        if text_len == 0:
            return text

        if self.supports_256_colors and start_color in self.COLORS_256 and end_color in self.COLORS_256:
            # Use 256-color gradient
            start_palette = self.COLORS_256[start_color]
            end_palette = self.COLORS_256[end_color]

            result = []
            for i, char in enumerate(text):
                if char == ' ' or char == '\n':
                    result.append(char)
                    continue

                ratio = i / (text_len - 1) if text_len > 1 else 0
                color_index = int(ratio * (len(start_palette) - 1))
                color_num = start_palette[color_index] if ratio < 0.5 else end_palette[color_index]

                result.append(f'{self._get_256_color_code(color_num)}{char}')

            result.append('\033[0m')
            return ''.join(result)

        else:
            # Fallback to 16-color simple gradient
            start_code = self.COLORS_16.get(start_color, '\033[96m')
            end_code = self.COLORS_16.get(end_color, '\033[95m')

            mid_point = len(text) // 2
            result = []

            for i, char in enumerate(text):
                if i < mid_point:
                    result.append(f'{start_code}{char}')
                else:
                    result.append(f'{end_code}{char}')

            result.append('\033[0m')
            return ''.join(result)

    def radial_gradient(self, text: str, center_color: str, edge_color: str) -> str:
        """Apply radial gradient from center to edges

        Args:
            text: Text to apply gradient to
            center_color: Center color name
            edge_color: Edge color name

        Returns:
            Text with radial gradient
        """
        if not self.color_enabled or not text:
            return text

        text_len = len(text)
        if text_len == 0:
            return text

        center = text_len // 2
        center_code = self.COLORS_16.get(center_color, '\033[97m')
        edge_code = self.COLORS_16.get(edge_color, '\033[94m')

        result = []
        for i, char in enumerate(text):
            if char == ' ' or char == '\n':
                result.append(char)
                continue

            distance_from_center = abs(i - center) / center if center > 0 else 0

            if distance_from_center < 0.5:
                result.append(f'{center_code}{char}')
            else:
                result.append(f'{edge_code}{char}')

        result.append('\033[0m')
        return ''.join(result)

    def rainbow_gradient(self, text: str) -> str:
        """Apply rainbow gradient across text

        Args:
            text: Text to apply rainbow gradient to

        Returns:
            Text with rainbow gradient
        """
        if not self.color_enabled or not text:
            return text

        rainbow_colors = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'magenta']
        text_len = len(text)

        if text_len == 0:
            return text

        result = []
        for i, char in enumerate(text):
            if char == ' ' or char == '\n':
                result.append(char)
                continue

            color_index = int((i / text_len) * len(rainbow_colors))
            if color_index >= len(rainbow_colors):
                color_index = len(rainbow_colors) - 1

            color_name = rainbow_colors[color_index]

            if self.supports_256_colors and color_name in self.COLORS_256:
                color_num = self.COLORS_256[color_name][0]
                result.append(f'{self._get_256_color_code(color_num)}{char}')
            else:
                color_code = self.COLORS_16.get(color_name, '\033[97m')
                result.append(f'{color_code}{char}')

        result.append('\033[0m')
        return ''.join(result)

    def custom_gradient(self, text: str, colors: List[str]) -> str:
        """Apply custom multi-color gradient

        Args:
            text: Text to apply gradient to
            colors: List of color names to transition through

        Returns:
            Text with custom gradient
        """
        if not self.color_enabled or not text or not colors:
            return text

        if len(colors) < 2:
            colors = ['cyan', 'magenta']

        text_len = len(text)
        if text_len == 0:
            return text

        result = []
        for i, char in enumerate(text):
            if char == ' ' or char == '\n':
                result.append(char)
                continue

            # Determine which color segment we're in
            segment_size = text_len / (len(colors) - 1) if len(colors) > 1 else text_len
            segment_index = min(int(i / segment_size), len(colors) - 2)

            color_name = colors[segment_index]

            if self.supports_256_colors and color_name in self.COLORS_256:
                color_num = self.COLORS_256[color_name][0]
                result.append(f'{self._get_256_color_code(color_num)}{char}')
            else:
                color_code = self.COLORS_16.get(color_name, '\033[97m')
                result.append(f'{color_code}{char}')

        result.append('\033[0m')
        return ''.join(result)

    def gradient_box(self, content: str, title: Optional[str] = None,
                    gradient_type: GradientType = GradientType.LINEAR) -> str:
        """Create a box with gradient border

        Args:
            content: Content to box
            title: Optional title
            gradient_type: Type of gradient for border

        Returns:
            Boxed content with gradient border
        """
        if not self.color_enabled:
            # Fallback to simple box
            width = max(len(line) for line in content.split('\n')) if content else 40
            if title:
                width = max(width, len(title) + 4)

            top = '+' + '-' * (width + 2) + '+'
            lines = [top]

            if title:
                lines.append(f'| {title.center(width)} |')
                lines.append(top)

            for line in content.split('\n'):
                lines.append(f'| {line.ljust(width)} |')

            lines.append(top)
            return '\n'.join(lines)

        # Apply gradient to border characters
        width = max(len(line) for line in content.split('\n')) if content else 40
        if title:
            width = max(width, len(title) + 4)

        border_chars = '─' * (width + 2)
        gradient_border = self.format(border_chars, gradient_type=gradient_type)

        lines = []
        lines.append(f'┌{gradient_border}┐')

        if title:
            gradient_title = self.format(title, gradient_type=gradient_type)
            lines.append(f'│ {gradient_title.center(width)} │')
            lines.append(f'├{gradient_border}┤')

        for line in content.split('\n'):
            lines.append(f'│ {line.ljust(width)} │')

        lines.append(f'└{gradient_border}┘')

        return '\n'.join(lines)


# Fix missing import
import os
