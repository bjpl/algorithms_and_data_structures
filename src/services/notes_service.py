#!/usr/bin/env python3
"""
Notes Service - Business logic for notes management

This service layer provides high-level business logic for the notes system,
including search, export, pagination, and display operations.
"""

import re
import math
import json
from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime
from difflib import SequenceMatcher

try:
    import markdown
    HAS_MARKDOWN = True
except ImportError:
    HAS_MARKDOWN = False

from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from ..models.note import Note, NotePage, NoteStatistics, CodeSnippet
from ..persistence.repositories.notes_repo import NotesRepository


console = Console()


class NotesService:
    """Service for notes business logic and operations"""

    def __init__(self, db_path: str = "curriculum.db"):
        """Initialize notes service

        Args:
            db_path: Path to database file
        """
        self.repository = NotesRepository(db_path)
        self.notes_dir = Path("notes")
        self.notes_dir.mkdir(exist_ok=True)
        self.page_size = 10

    def create_note(
        self,
        user_id: int,
        content: str,
        lesson_id: Optional[int] = None,
        module_name: str = "",
        topic: str = "",
        tags: List[str] = None,
        title: str = "",
        note_type: str = "concept",
        priority: int = 2,
        parent_note_id: Optional[int] = None,
        code_snippets: List[Dict] = None
    ) -> int:
        """Create a new note

        Args:
            user_id: User ID who owns the note
            content: Note content
            lesson_id: Optional lesson ID
            module_name: Module/category name
            topic: Note topic
            tags: List of tags
            title: Note title
            note_type: Type of note
            priority: Priority level (1-5)
            parent_note_id: Parent note ID for hierarchical notes
            code_snippets: List of code snippets

        Returns:
            Note ID
        """
        # Convert code snippet dicts to CodeSnippet objects
        snippets = []
        if code_snippets:
            snippets = [
                CodeSnippet(**snippet) if isinstance(snippet, dict) else snippet
                for snippet in code_snippets
            ]

        # Create note object
        note = Note(
            user_id=user_id,
            lesson_id=lesson_id,
            module_name=module_name or "General",
            topic=topic or "Note",
            title=title or topic or "Untitled",
            content=content,
            note_type=note_type,
            priority=priority,
            formatted_content=self.format_content(content),
            parent_note_id=parent_note_id,
            code_snippets=snippets,
            tags=tags or []
        )

        return self.repository.create(note)

    def get_notes(
        self,
        user_id: int,
        lesson_id: Optional[int] = None,
        module_name: Optional[str] = None,
        search_term: Optional[str] = None,
        note_type: Optional[str] = None,
        priority: Optional[int] = None,
        parent_note_id: Optional[int] = None
    ) -> List[Note]:
        """Get notes with optional filters

        Args:
            user_id: User ID
            lesson_id: Optional lesson ID filter
            module_name: Optional module name filter
            search_term: Search term
            note_type: Note type filter
            priority: Priority filter
            parent_note_id: Parent note filter

        Returns:
            List of Note objects
        """
        return self.repository.find(
            user_id=user_id,
            lesson_id=lesson_id,
            module_name=module_name,
            search_term=search_term,
            note_type=note_type,
            priority=priority,
            parent_note_id=parent_note_id
        )

    def get_page(
        self,
        user_id: int,
        page: int = 1,
        page_size: Optional[int] = None,
        sort_by: str = "created_desc",
        **filters
    ) -> NotePage:
        """Get a paginated page of notes

        Args:
            user_id: User ID
            page: Page number (1-indexed)
            page_size: Notes per page
            sort_by: Sort order (created_desc/created_asc/updated_desc/title_asc)
            **filters: Additional filters

        Returns:
            NotePage object
        """
        page_size = page_size or self.page_size
        page = max(1, page)

        # Get all filtered notes
        all_notes = self.repository.find(user_id, **filters)

        # Apply sorting
        sort_key = lambda n: n.created_at or ''
        reverse = True

        if sort_by == "created_asc":
            reverse = False
        elif sort_by == "updated_desc":
            sort_key = lambda n: n.updated_at or ''
        elif sort_by == "title_asc":
            sort_key = lambda n: n.title or ''
            reverse = False

        all_notes.sort(key=sort_key, reverse=reverse)

        # Calculate pagination
        total_notes = len(all_notes)
        total_pages = max(1, math.ceil(total_notes / page_size))
        current_page = min(page, total_pages)

        # Get page slice
        start_idx = (current_page - 1) * page_size
        end_idx = start_idx + page_size
        page_notes = all_notes[start_idx:end_idx]

        return NotePage(
            notes=page_notes,
            total_notes=total_notes,
            total_pages=total_pages,
            current_page=current_page,
            page_size=page_size
        )

    def fuzzy_search(
        self,
        user_id: int,
        query: str,
        threshold: float = 0.6
    ) -> List[Note]:
        """Perform fuzzy search on notes

        Args:
            user_id: User ID
            query: Search query
            threshold: Minimum similarity threshold (0.0-1.0)

        Returns:
            List of notes sorted by relevance
        """
        if not query:
            return self.repository.find(user_id)

        query_lower = query.lower()
        all_notes = self.repository.find(user_id)

        scored_notes = []
        for note in all_notes:
            # Calculate similarity scores
            title_score = SequenceMatcher(
                None, query_lower, (note.title or '').lower()
            ).ratio()

            topic_score = SequenceMatcher(
                None, query_lower, (note.topic or '').lower()
            ).ratio()

            content_score = SequenceMatcher(
                None, query_lower, (note.content or '')[:200].lower()
            ).ratio()

            module_score = SequenceMatcher(
                None, query_lower, (note.module_name or '').lower()
            ).ratio()

            # Check tags
            tag_score = 0
            for tag in note.tags:
                tag_score = max(
                    tag_score,
                    SequenceMatcher(None, query_lower, tag.lower()).ratio()
                )

            # Calculate weighted final score
            final_score = max(
                title_score * 1.8,
                topic_score * 1.5,
                content_score * 1.0,
                module_score * 0.8,
                tag_score * 1.2
            )

            if final_score >= threshold:
                note.relevance_score = final_score
                scored_notes.append(note)

        # Sort by relevance
        scored_notes.sort(key=lambda x: x.relevance_score or 0, reverse=True)
        return scored_notes

    def export_notes(
        self,
        user_id: int,
        format: str = "markdown",
        output_dir: Optional[str] = None
    ) -> Optional[str]:
        """Export notes to file

        Args:
            user_id: User ID
            format: Export format (markdown/html/json)
            output_dir: Output directory

        Returns:
            Path to exported file or None if no notes
        """
        notes = self.repository.find(user_id)

        if not notes:
            return None

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = Path(output_dir or "notes/exports")
        output_dir.mkdir(parents=True, exist_ok=True)

        if format == "markdown":
            filename = output_dir / f"notes_export_{timestamp}.md"
            content = self._format_notes_markdown(notes)

        elif format == "html":
            filename = output_dir / f"notes_export_{timestamp}.html"
            md_content = self._format_notes_markdown(notes)
            content = self._markdown_to_html(md_content)

        elif format == "json":
            filename = output_dir / f"notes_export_{timestamp}.json"
            notes_data = [note.to_dict() for note in notes]
            content = json.dumps(notes_data, indent=2, default=str)

        else:
            raise ValueError(f"Unsupported format: {format}")

        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)

        return str(filename)

    def _format_notes_markdown(self, notes: List[Note]) -> str:
        """Format notes as markdown

        Args:
            notes: List of notes

        Returns:
            Markdown string
        """
        lines = ["# 📚 Learning Notes\n"]
        lines.append(f"*Exported on {datetime.now().strftime('%Y-%m-%d %H:%M')}*\n\n")

        # Group by module
        modules: Dict[str, List[Note]] = {}
        for note in notes:
            module = note.module_name or 'General'
            if module not in modules:
                modules[module] = []
            modules[module].append(note)

        for module, module_notes in modules.items():
            lines.append(f"## 📂 {module}\n")

            for note in module_notes:
                lines.append(f"### 📝 {note.topic}")

                if note.lesson_title:
                    lines.append(f"*Lesson: {note.lesson_title}*")

                if note.created_at:
                    lines.append(f"*Created: {note.created_at}*")

                if note.is_favorite:
                    lines.append("⭐ **Favorited**")

                if note.tags:
                    tags_str = " ".join([f"`{tag}`" for tag in note.tags])
                    lines.append(f"Tags: {tags_str}")

                lines.append(f"\n{note.content}\n")
                lines.append("---\n")

        return "\n".join(lines)

    def _markdown_to_html(self, md_content: str) -> str:
        """Convert markdown to HTML

        Args:
            md_content: Markdown content

        Returns:
            HTML string
        """
        if HAS_MARKDOWN:
            html_body = markdown.markdown(
                md_content,
                extensions=['extra', 'codehilite']
            )
        else:
            html_body = md_content.replace('\n', '<br>\n')

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Learning Notes</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        h3 {{ color: #7f8c8d; }}
        code {{
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        pre {{
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }}
    </style>
</head>
<body>
{html_body}
</body>
</html>"""
        return html

    def format_content(self, content: str) -> str:
        """Apply rich formatting to content (markdown-like)

        Args:
            content: Raw content

        Returns:
            Formatted content with ANSI codes
        """
        if not content:
            return ""

        formatted = content

        # Bold: **text** or __text__
        formatted = re.sub(r'\*\*(.*?)\*\*', r'\033[1m\1\033[0m', formatted)
        formatted = re.sub(r'__(.*?)__', r'\033[1m\1\033[0m', formatted)

        # Italic: *text* or _text_
        formatted = re.sub(r'\*(.*?)\*', r'\033[3m\1\033[0m', formatted)
        formatted = re.sub(r'_(.*?)_', r'\033[3m\1\033[0m', formatted)

        # Code: `code`
        formatted = re.sub(r'`(.*?)`', r'\033[93m\033[40m\1\033[0m', formatted)

        # Headers
        formatted = re.sub(
            r'^# (.*?)$', r'\033[1m\033[94m\1\033[0m',
            formatted, flags=re.MULTILINE
        )
        formatted = re.sub(
            r'^## (.*?)$', r'\033[1m\033[96m\1\033[0m',
            formatted, flags=re.MULTILINE
        )

        # Lists
        formatted = re.sub(
            r'^[\-\*] (.*?)$', r'\033[92m•\033[0m \1',
            formatted, flags=re.MULTILINE
        )

        # Numbered lists
        formatted = re.sub(
            r'^(\d+)\. (.*?)$', r'\033[93m\1.\033[0m \2',
            formatted, flags=re.MULTILINE
        )

        return formatted

    def display_notes(self, notes: List[Note], title: str = "Notes"):
        """Display notes in a formatted table

        Args:
            notes: List of notes to display
            title: Table title
        """
        if not notes:
            console.print("[yellow]No notes found.[/yellow]")
            return

        table = Table(title=title, show_header=True, header_style="bold cyan")
        table.add_column("ID", style="dim", width=6)
        table.add_column("Module", style="magenta")
        table.add_column("Topic", style="green")
        table.add_column("Content", style="white", overflow="fold")
        table.add_column("Tags", style="blue")
        table.add_column("Created", style="dim")
        table.add_column("⭐", justify="center", width=3)

        for note in notes[:20]:  # Show max 20 notes
            content_preview = note.content[:100] + "..." if len(note.content) > 100 else note.content
            tags_str = ", ".join(note.tags)[:30] if note.tags else ""

            created = ""
            if note.created_at:
                try:
                    dt = datetime.fromisoformat(note.created_at)
                    created = dt.strftime("%m/%d %H:%M")
                except (ValueError, TypeError):
                    created = str(note.created_at)[:16]

            fav = "⭐" if note.is_favorite else ""

            table.add_row(
                str(note.id or ''),
                (note.module_name or 'General')[:20],
                (note.topic or 'Note')[:30],
                content_preview,
                tags_str,
                created,
                fav
            )

        console.print(table)

        if len(notes) > 20:
            console.print(
                f"\n[dim]Showing 20 of {len(notes)} notes. "
                "Use filters to narrow results.[/dim]"
            )

    def get_statistics(self, user_id: int) -> NoteStatistics:
        """Get note statistics for a user

        Args:
            user_id: User ID

        Returns:
            NoteStatistics object
        """
        return self.repository.get_statistics(user_id)

    def update_note(self, note: Note) -> bool:
        """Update a note

        Args:
            note: Note object with updates

        Returns:
            True if successful
        """
        # Re-format content
        if note.content:
            note.formatted_content = self.format_content(note.content)

        return self.repository.update(note)

    def delete_note(self, note_id: int) -> bool:
        """Delete a note

        Args:
            note_id: Note ID

        Returns:
            True if successful
        """
        return self.repository.delete(note_id)

    def toggle_favorite(self, note_id: int) -> bool:
        """Toggle favorite status

        Args:
            note_id: Note ID

        Returns:
            True if successful
        """
        return self.repository.toggle_favorite(note_id)

    def link_notes(self, parent_id: int, child_id: int) -> bool:
        """Link two notes

        Args:
            parent_id: Parent note ID
            child_id: Child note ID

        Returns:
            True if successful
        """
        return self.repository.link_notes(parent_id, child_id)

    def get_child_notes(self, parent_id: int) -> List[Note]:
        """Get child notes

        Args:
            parent_id: Parent note ID

        Returns:
            List of child notes
        """
        return self.repository.get_child_notes(parent_id)

    def add_code_snippet(
        self,
        note_id: int,
        code: str,
        language: str = "python",
        description: str = ""
    ) -> bool:
        """Add code snippet to a note

        Args:
            note_id: Note ID
            code: Code content
            language: Programming language
            description: Description

        Returns:
            True if successful
        """
        note = self.repository.get_by_id(note_id)
        if not note:
            return False

        snippet = CodeSnippet(
            code=code,
            language=language,
            description=description
        )

        note.code_snippets.append(snippet)
        return self.repository.update(note)

    def cleanup_orphaned_notes(self) -> int:
        """Clean up orphaned notes

        Returns:
            Number of notes deleted
        """
        return self.repository.cleanup_orphaned_notes()

    def migrate_old_notes(self) -> int:
        """Migrate notes from old progress table

        Returns:
            Number of notes migrated
        """
        return self.repository.migrate_from_progress_table()
