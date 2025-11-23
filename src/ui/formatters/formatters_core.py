#!/usr/bin/env python3
"""Core Formatters - Extracted from unified_formatter.py"""

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

    def enable_colors(self) -> None:
        """Enable color output"""
        self.config.colors_enabled = True

    def disable_colors(self) -> None:
        """Disable color output"""
        self.config.colors_enabled = False

    def set_unicode(self, enabled: bool) -> None:
        """Set Unicode character support"""
        self.config.unicode_enabled = enabled

    # ========================================================================
    # Convenience Properties (Backward Compatibility)
    # ========================================================================

    @property
    def theme(self) -> Theme:
        """Get current theme"""
        return self.config.theme

    @property
    def colors_enabled(self) -> bool:
        """Check if colors are enabled"""
        return self.config.colors_enabled

    @property
    def unicode_enabled(self) -> bool:
        """Check if Unicode is enabled"""
        return self.config.unicode_enabled

    @property
    def color(self) -> Color:
        """Alias for primary theme color (backward compatibility)"""
        return self.config.theme.primary

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

