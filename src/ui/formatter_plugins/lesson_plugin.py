#!/usr/bin/env python3
"""
Lesson Formatter Plugin
Specialized formatting for lesson content including complexity badges,
code examples, practice problems, and interactive elements.
"""

import re
import textwrap
from typing import Dict, List, Any, Optional, Union

from .base import BasePlugin, PluginMetadata, PluginCapabilities, PluginStatus

# Import formatter components - handle both EnhancedFormatter and legacy
try:
    from ..formatter import EnhancedFormatter, Color
except ImportError:
    from ..formatter.enhanced_formatter import EnhancedFormatter, Color


class LessonFormatterPlugin(BasePlugin):
    """Plugin for lesson-specific formatting with beautiful visual presentation"""

    def __init__(self):
        """Initialize lesson formatter plugin"""
        super().__init__()
        self.formatter = None
        self.width = 80

    @property
    def name(self) -> str:
        """Plugin name"""
        return "lesson_formatter"

    @property
    def version(self) -> str:
        """Plugin version"""
        return "1.0.0"

    def initialize(self, formatter: Any = None) -> None:
        """Initialize plugin resources"""
        self.formatter = formatter
        if formatter:
            self.width = min(getattr(formatter.capabilities, 'width', 80), 80)
        self._status = PluginStatus.ACTIVE if self._config.enabled else PluginStatus.INITIALIZED

    def shutdown(self) -> None:
        """Cleanup plugin resources"""
        self.formatter = None
        self._status = PluginStatus.UNINITIALIZED

    def can_handle(self, content_type: str) -> bool:
        """Check if plugin can handle content type"""
        supported_types = [
            'lesson', 'lesson_content', 'concept', 'example',
            'practice_problem', 'complexity', 'lesson_header'
        ]
        return content_type.lower() in supported_types

    def get_capabilities(self) -> PluginCapabilities:
        """Get plugin capabilities"""
        return PluginCapabilities(
            content_types={'lesson', 'lesson_content', 'concept', 'example',
                          'practice_problem', 'complexity', 'lesson_header'},
            features={'complexity_badges', 'code_examples', 'practice_problems',
                     'syntax_highlighting', 'interactive_options'},
            dependencies=set(),
            conflicts_with=set(),
            provides={'lesson_formatting', 'educational_content'}
        )

    def get_metadata(self) -> PluginMetadata:
        """Get plugin metadata"""
        return PluginMetadata(
            name=self.name,
            version=self.version,
            author="System Architect",
            description="Formats lesson content with complexity badges, code examples, and practice problems",
            tags=["lesson", "education", "formatting", "syntax-highlighting"]
        )

    def format(self, content: Any, **options) -> str:
        """Format content using this plugin"""
        if isinstance(content, dict):
            # Full lesson formatting
            if 'title' in content or 'content' in content:
                return self.format_lesson(content)
            # Single concept
            elif 'concept' in content:
                return self.format_concept(content['concept'])
            # Single example
            elif 'code' in content:
                return self.format_example(content)
        elif isinstance(content, str):
            return self._format_content(content)

        return str(content)

    # ===== Main Lesson Formatting =====

    def format_lesson(self, lesson: Dict[str, Any]) -> str:
        """
        Format complete lesson with beautiful consistent styling

        Args:
            lesson: Lesson data dictionary

        Returns:
            Formatted lesson string
        """
        parts = []

        # Lesson header
        if 'title' in lesson:
            parts.append(self._format_lesson_header(lesson))

        # Key topics
        if 'key_topics' in lesson:
            parts.append(self._format_key_topics(lesson['key_topics']))

        # Lesson info panel
        parts.append(self._format_lesson_info(lesson))

        # Main content
        if 'content' in lesson:
            parts.append(self._format_content(lesson['content']))

        # Code examples
        if 'code_examples' in lesson:
            parts.append(self._format_code_examples(lesson['code_examples']))

        # Practice problems
        if 'practice_problems' in lesson:
            parts.append(self._format_practice_problems(lesson['practice_problems']))

        # Interactive options
        parts.append(self._format_interactive_options())

        return '\n\n'.join(filter(None, parts))

    def _format_lesson_header(self, lesson: Dict[str, Any]) -> str:
        """Format lesson header with title and subtitle"""
        title = lesson.get('title', 'Untitled Lesson')
        subtitle = lesson.get('subtitle', '')

        lines = []
        lines.append('')

        # Create header using formatter's header method if available
        if hasattr(self.formatter, 'create_header'):
            header = self.formatter.create_header(
                title,
                style=getattr(self.formatter, 'HeaderStyle', None) and
                      self.formatter.HeaderStyle.BANNER or 'banner',
                color=Color.BRIGHT_CYAN
            )
            lines.append(header)
        else:
            # Fallback to colorize
            lines.append(self._colorize(title.center(70), Color.BRIGHT_CYAN, Color.BOLD))

        if subtitle:
            lines.append(self._colorize(subtitle.center(70), Color.BRIGHT_MAGENTA))

        lines.append('')
        return '\n'.join(lines)

    def _format_key_topics(self, topics: List[str]) -> str:
        """Format key topics section"""
        lines = []
        lines.append(self._colorize(">>> 🎯 Key Topics >>>", Color.BRIGHT_MAGENTA, Color.BOLD))
        lines.append(self._colorize("-" * 40, Color.BRIGHT_MAGENTA))

        for i, topic in enumerate(topics, 1):
            bullet = self._colorize(f"{i}.", Color.BRIGHT_CYAN, Color.BOLD)
            topic_text = self._colorize(topic, Color.WHITE)
            lines.append(f"  {bullet} {topic_text}")

        return '\n'.join(lines)

    def _format_lesson_info(self, lesson: Dict[str, Any]) -> str:
        """Format lesson metadata panel"""
        sections = []

        # Time complexity
        if 'time_complexity' in lesson:
            complexity_info = self.format_complexity_badge(lesson['time_complexity'])
            sections.append(("⏱️ Time Complexity", complexity_info))

        # Space complexity
        if 'space_complexity' in lesson:
            space_info = self.format_complexity_badge(lesson['space_complexity'])
            sections.append(("💾 Space Complexity", space_info))

        # Prerequisites
        if 'prerequisites' in lesson:
            prereq_content = "\n".join(f"  • {p}" for p in lesson['prerequisites'])
            sections.append(("📚 Prerequisites", prereq_content))

        # Difficulty and time
        meta_content = []
        if 'difficulty' in lesson:
            badge = self._create_difficulty_badge(lesson['difficulty'])
            meta_content.append(f"Difficulty: {badge}")
        if 'est_time' in lesson:
            time_str = self._colorize(f"{lesson['est_time']} min", Color.BRIGHT_YELLOW)
            meta_content.append(f"Est. Time: {time_str}")

        if meta_content:
            sections.append(("📊 Lesson Info", "  " + "    ".join(meta_content)))

        if not sections:
            return ""

        # Create panel
        lines = []
        lines.append(self._colorize("┌" + "─" * 68 + "┐", Color.BRIGHT_CYAN))
        lines.append(self._colorize("│" + " Lesson Overview ".center(68) + "│",
                                   Color.BRIGHT_CYAN, Color.BOLD))
        lines.append(self._colorize("├" + "─" * 68 + "┤", Color.BRIGHT_CYAN))

        for header, content in sections:
            lines.append(self._colorize(f"│ {header:<66} │",
                                       Color.BRIGHT_YELLOW, Color.BOLD))
            for line in content.split('\n'):
                if line.strip():
                    display_line = line[:67] if len(line) > 67 else line
                    lines.append(self._colorize(f"│{display_line:<68}│", Color.WHITE))

        lines.append(self._colorize("└" + "─" * 68 + "┘", Color.BRIGHT_CYAN))

        return '\n'.join(lines)

    # ===== Content Formatting =====

    def _format_content(self, content: Any) -> str:
        """Format main lesson content"""
        lines = []
        lines.append(self._colorize(">>> 📖 Lesson Content >>>",
                                   Color.BRIGHT_CYAN, Color.BOLD))
        lines.append(self._colorize("=" * 60, Color.BRIGHT_CYAN))
        lines.append('')

        # Normalize content to string
        content_str = self._normalize_content(content)
        if not content_str:
            lines.append(self._colorize("  No detailed content available yet.", Color.WHITE))
            return '\n'.join(lines)

        # Parse content sections
        content_lines = content_str.split('\n')
        in_code_block = False
        code_lines = []
        code_lang = "python"

        for line in content_lines:
            # Handle code blocks
            if line.strip().startswith('```'):
                if in_code_block:
                    # End code block
                    lines.append(self._format_code_block(code_lines, code_lang))
                    code_lines = []
                    in_code_block = False
                else:
                    # Start code block
                    lang_match = re.match(r'```(\w+)?', line.strip())
                    if lang_match and lang_match.group(1):
                        code_lang = lang_match.group(1)
                    in_code_block = True
                continue

            if in_code_block:
                code_lines.append(line)
                continue

            # Format different line types
            lines.append(self._format_content_line(line))

        return '\n'.join(lines)

    def _format_content_line(self, line: str) -> str:
        """Format single content line based on type"""
        stripped = line.strip()

        # Headers
        if stripped.startswith('###'):
            text = stripped.strip('#').strip()
            return f"\n{self._colorize(f'    ▸ {text}', Color.BRIGHT_GREEN, Color.BOLD)}\n"
        elif stripped.startswith('##'):
            text = stripped.strip('#').strip()
            return f"\n{self._colorize(f'  ▶ {text}', Color.BRIGHT_CYAN, Color.BOLD)}\n{self._colorize('  ' + '-' * len(text), Color.BRIGHT_CYAN)}\n"
        elif stripped.startswith('#'):
            text = stripped.strip('#').strip()
            return f"\n{self._colorize(text.upper(), Color.BRIGHT_YELLOW, Color.BOLD)}\n{self._colorize('=' * len(text), Color.BRIGHT_YELLOW)}\n"

        # Bullet points
        elif stripped.startswith(('- ', '* ')):
            text = stripped[2:]
            bullet = self._colorize("•", Color.BRIGHT_CYAN, Color.BOLD)
            formatted_text = self._process_inline_formatting(text)
            wrapped = textwrap.fill(formatted_text, width=self.width - 4,
                                   initial_indent="", subsequent_indent="    ")
            return f"  {bullet} {wrapped}"

        # Numbered lists
        elif re.match(r'^\d+\.', stripped):
            parts = stripped.split('.', 1)
            if len(parts) == 2:
                num = self._colorize(f"{parts[0]}.", Color.BRIGHT_YELLOW, Color.BOLD)
                text = self._process_inline_formatting(parts[1].strip())
                wrapped = textwrap.fill(text, width=self.width - 6,
                                       initial_indent="", subsequent_indent="     ")
                return f"  {num} {wrapped}"

        # Important/highlighted
        elif stripped.startswith('>'):
            text = stripped[1:].strip()
            return self._colorize(f"  ➤ {text}", Color.BRIGHT_MAGENTA, Color.BOLD)

        # Regular paragraphs
        elif stripped:
            formatted = self._process_inline_formatting(stripped)
            wrapped = textwrap.fill(formatted, width=self.width - 4,
                                   initial_indent="  ", subsequent_indent="  ")
            return wrapped

        # Empty lines
        else:
            return ""

    def _process_inline_formatting(self, text: str) -> str:
        """Process inline markdown-style formatting"""
        # Bold text
        text = re.sub(r'\*\*([^*]+)\*\*',
                     lambda m: self._colorize(m.group(1), Color.BRIGHT_WHITE, Color.BOLD),
                     text)

        # Italic (displayed as dim)
        text = re.sub(r'\*([^*]+)\*',
                     lambda m: self._colorize(m.group(1), Color.WHITE, Color.DIM),
                     text)

        # Inline code
        text = re.sub(r'`([^`]+)`',
                     lambda m: self._colorize(m.group(1), Color.BRIGHT_CYAN),
                     text)

        return text

    # ===== Specialized Formatting Methods =====

    def format_concept(self, concept: Union[str, Dict[str, Any]]) -> str:
        """Format concept explanation"""
        if isinstance(concept, str):
            return self._format_content(concept)
        elif isinstance(concept, dict):
            return self._format_content(concept.get('explanation', ''))
        return ""

    def format_example(self, example: Dict[str, Any]) -> str:
        """Format single code example"""
        lines = []

        # Example title
        title = example.get('title', 'Example')
        lines.append(self._colorize(f"▸ {title}", Color.BRIGHT_YELLOW, Color.BOLD))

        # Description
        if 'description' in example:
            desc = self._process_inline_formatting(example['description'])
            wrapped = textwrap.fill(desc, width=self.width - 4,
                                   initial_indent="  ", subsequent_indent="  ")
            lines.append(wrapped)
            lines.append('')

        # Code
        if 'code' in example:
            code_lines = example['code'].split('\n')
            lines.append(self._format_code_block(code_lines,
                                                example.get('language', 'python')))

        # Output
        if 'output' in example:
            lines.append(self._colorize("  Output:", Color.BRIGHT_CYAN, Color.BOLD))
            output_lines = str(example['output']).split('\n')
            for line in output_lines:
                lines.append(self._colorize(f"    {line}", Color.GREEN))
            lines.append('')

        return '\n'.join(lines)

    def _format_code_examples(self, examples: List[Dict[str, Any]]) -> str:
        """Format code examples section"""
        lines = []
        lines.append(self._colorize(">>> 💻 Code Examples >>>",
                                   Color.BRIGHT_GREEN, Color.BOLD))
        lines.append(self._colorize("=" * 60, Color.BRIGHT_GREEN))
        lines.append('')

        for i, example in enumerate(examples, 1):
            lines.append(self.format_example(example))
            if i < len(examples):
                lines.append('')

        return '\n'.join(lines)

    def _format_code_block(self, lines: List[str], language: str = "python") -> str:
        """Format code block with syntax highlighting"""
        if not lines:
            return ""

        result_lines = []

        # Create bordered box for code
        max_line_len = max(len(line) for line in lines) if lines else 0
        box_width = min(max_line_len + 6, self.width - 4)

        # Top border
        result_lines.append("  " + self._colorize("┌" + "─" * (box_width - 2) + "┐",
                                                  Color.BRIGHT_BLACK))

        # Code lines with syntax highlighting
        for i, line in enumerate(lines, 1):
            line_num = self._colorize(f"{i:3d}", Color.BRIGHT_BLACK)
            highlighted = self._syntax_highlight(line, language)

            # Ensure proper padding
            display_line = highlighted[:box_width - 8] if len(line) > box_width - 8 else highlighted
            padded = display_line.ljust(box_width - 8)

            border = self._colorize("│", Color.BRIGHT_BLACK)
            result_lines.append(f"  {border} {line_num} {padded} {border}")

        # Bottom border
        result_lines.append("  " + self._colorize("└" + "─" * (box_width - 2) + "┘",
                                                  Color.BRIGHT_BLACK))

        return '\n'.join(result_lines)

    def _syntax_highlight(self, line: str, language: str) -> str:
        """Apply syntax highlighting to code"""
        if language.lower() in ['python', 'py']:
            # Python keywords
            keywords = ['def', 'return', 'if', 'else', 'elif', 'for', 'while',
                       'in', 'not', 'and', 'or', 'class', 'import', 'from',
                       'try', 'except', 'with', 'as', 'None', 'True', 'False']

            highlighted = line
            for keyword in keywords:
                pattern = r'\b' + keyword + r'\b'
                highlighted = re.sub(pattern,
                                   lambda m: self._colorize(m.group(),
                                                          Color.BRIGHT_MAGENTA,
                                                          Color.BOLD),
                                   highlighted)

            # Strings
            highlighted = re.sub(r'"[^"]*"',
                               lambda m: self._colorize(m.group(), Color.BRIGHT_GREEN),
                               highlighted)
            highlighted = re.sub(r"'[^']*'",
                               lambda m: self._colorize(m.group(), Color.BRIGHT_GREEN),
                               highlighted)

            # Comments
            if '#' in highlighted:
                parts = highlighted.split('#', 1)
                if len(parts) == 2:
                    highlighted = parts[0] + self._colorize('#' + parts[1],
                                                           Color.BRIGHT_BLACK)

            # Numbers
            highlighted = re.sub(r'\b\d+\b',
                               lambda m: self._colorize(m.group(), Color.BRIGHT_YELLOW),
                               highlighted)

            return highlighted

        # Default: return with base color
        return self._colorize(line, Color.BRIGHT_BLUE)

    def format_practice_problem(self, problem: Dict[str, Any],
                               problem_num: int = 1) -> str:
        """Format single practice problem"""
        lines = []

        # Problem header
        title = problem.get('title', f'Problem {problem_num}')
        difficulty = problem.get('difficulty', 'medium')
        badge = self._create_difficulty_badge(difficulty)

        header = f"Problem {problem_num}: {title} {badge}"
        lines.append(self._colorize(header, Color.BRIGHT_YELLOW, Color.BOLD))
        lines.append(self._colorize("-" * 40, Color.BRIGHT_YELLOW))

        # Description
        if 'description' in problem:
            desc = self._process_inline_formatting(problem['description'])
            wrapped = textwrap.fill(desc, width=self.width - 4,
                                   initial_indent="  ", subsequent_indent="  ")
            lines.append(wrapped)
            lines.append('')

        # Example
        if 'example' in problem:
            lines.append(self._colorize("  Example:", Color.BRIGHT_CYAN, Color.BOLD))
            example_text = problem['example']
            for line in example_text.split('\n'):
                lines.append(self._colorize(f"    {line}", Color.CYAN))
            lines.append('')

        # Hint
        if 'hint' in problem:
            hint_text = self._colorize("[Hint available - press 'h' to reveal]",
                                      Color.BRIGHT_BLACK)
            lines.append(f"  {hint_text}")
            lines.append('')

        return '\n'.join(lines)

    def _format_practice_problems(self, problems: List[Dict[str, Any]]) -> str:
        """Format practice problems section"""
        lines = []
        lines.append(self._colorize(">>> 🎯 Practice Exercises >>>",
                                   Color.BRIGHT_MAGENTA, Color.BOLD))
        lines.append(self._colorize("=" * 60, Color.BRIGHT_MAGENTA))
        lines.append('')

        for i, problem in enumerate(problems, 1):
            lines.append(self.format_practice_problem(problem, i))

        return '\n'.join(lines)

    def format_complexity_badge(self, complexity: str) -> str:
        """Format complexity notation with color coding"""
        # Determine color based on complexity
        if 'O(1)' in complexity:
            color = Color.BRIGHT_GREEN
            label = "Constant"
        elif 'O(log' in complexity:
            color = Color.BRIGHT_CYAN
            label = "Logarithmic"
        elif 'O(n)' in complexity and 'O(n^' not in complexity:
            color = Color.BRIGHT_YELLOW
            label = "Linear"
        elif 'O(n log n)' in complexity:
            color = Color.YELLOW
            label = "Linearithmic"
        elif 'O(n^2)' in complexity or 'O(n²)' in complexity:
            color = Color.BRIGHT_RED
            label = "Quadratic"
        else:
            color = Color.BRIGHT_MAGENTA
            label = "Complex"

        formatted = self._colorize(complexity, color, Color.BOLD)
        return f"  {formatted} - {label}"

    def format_progress_indicator(self, progress: Dict[str, Any]) -> str:
        """Format lesson progress indicator"""
        current = progress.get('current', 0)
        total = progress.get('total', 1)
        percentage = (current / total * 100) if total > 0 else 0

        # Use formatter's progress bar if available
        if hasattr(self.formatter, 'create_progress_bar'):
            return self.formatter.create_progress_bar(
                current / total if total > 0 else 0,
                width=50,
                show_percentage=True
            )

        # Fallback: simple text progress
        return self._colorize(f"Progress: {current}/{total} ({percentage:.1f}%)",
                            Color.BRIGHT_CYAN)

    def format_related_topics(self, topics: List[str]) -> str:
        """Format related topics suggestions"""
        if not topics:
            return ""

        lines = []
        lines.append(self._colorize(">>> 🔗 Related Topics >>>",
                                   Color.BRIGHT_BLUE, Color.BOLD))
        lines.append(self._colorize("=" * 40, Color.BRIGHT_BLUE))

        for topic in topics:
            lines.append(self._colorize(f"  → {topic}", Color.CYAN))

        return '\n'.join(lines)

    def _format_interactive_options(self) -> str:
        """Format interactive menu options"""
        lines = []
        lines.append('')
        lines.append(self._colorize("═" * 30 + " Interactive Options " + "═" * 19,
                                   Color.BRIGHT_CYAN, Color.BOLD))

        options = [
            ("[1]", "📝", "Take Notes", "Capture your thoughts and insights"),
            ("[2]", "🤖", "Claude Questions", "Get AI-powered explanations"),
            ("[3]", "💡", "Practice Problems", "8 problems available"),
            ("[4]", "🏃", "Mark Complete", "Finish and earn points"),
            ("[5]", "⏭️", "Skip to Next", "Continue without completing"),
            ("[0]", "🔙", "Back", "Return to curriculum")
        ]

        for key, icon, title, desc in options:
            key_colored = self._colorize(key, Color.BRIGHT_YELLOW, Color.BOLD)
            icon_colored = self._colorize(icon, Color.BRIGHT_CYAN)
            title_colored = self._colorize(title, Color.WHITE, Color.BOLD)
            desc_colored = self._colorize(f"- {desc}", Color.BRIGHT_BLACK)

            lines.append(f"  {key_colored} {icon_colored} {title_colored} {desc_colored}")

        lines.append('')
        return '\n'.join(lines)

    # ===== Helper Methods =====

    def _create_difficulty_badge(self, difficulty: str) -> str:
        """Create color-coded difficulty badge"""
        difficulty_lower = difficulty.lower()

        if difficulty_lower in ['easy', 'beginner', 'basic']:
            return self._colorize(f"[{difficulty.upper()}]",
                                Color.BRIGHT_GREEN, Color.BOLD)
        elif difficulty_lower in ['medium', 'intermediate', 'normal']:
            return self._colorize(f"[{difficulty.upper()}]",
                                Color.BRIGHT_YELLOW, Color.BOLD)
        elif difficulty_lower in ['hard', 'advanced', 'expert']:
            return self._colorize(f"[{difficulty.upper()}]",
                                Color.BRIGHT_RED, Color.BOLD)
        else:
            return self._colorize(f"[{difficulty.upper()}]",
                                Color.WHITE, Color.BOLD)

    def _normalize_content(self, content: Any) -> str:
        """Normalize content to string format"""
        if content is None:
            return ""

        if isinstance(content, str):
            return content

        if isinstance(content, dict):
            parts = []
            for key, value in content.items():
                if key in ['title', 'subtitle']:
                    continue
                parts.append(f"## {key.replace('_', ' ').title()}")
                if isinstance(value, list):
                    for item in value:
                        parts.append(f"- {item}")
                else:
                    parts.append(str(value))
            return '\n\n'.join(parts)

        if isinstance(content, list):
            return '\n\n'.join(str(item) for item in content)

        return str(content)

    def _colorize(self, text: str, color: Color,
                 style: Optional[Color] = None) -> str:
        """Apply color and style to text"""
        if hasattr(self.formatter, 'colorize'):
            return self.formatter.colorize(text, color, style=style)

        # Fallback: manual ANSI codes
        result = color.value + text
        if style:
            result = style.value + result
        result += Color.RESET.value
        return result
