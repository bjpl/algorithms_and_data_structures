#!/usr/bin/env python3
"""
Notes Manager - Backward-compatible wrapper for refactored notes system

This module provides backward compatibility with the original NotesManager API
while delegating to the refactored service and repository layers.

IMPORTANT: This is a compatibility layer. New code should use NotesService directly.
"""

from typing import List, Dict, Optional
from pathlib import Path

try:
    # Try relative imports first (when used as a package)
    from .services.notes_service import NotesService
    from .models.note import Note
except ImportError:
    # Fall back to absolute imports (when used as standalone)
    try:
        from src.services.notes_service import NotesService
        from src.models.note import Note
    except ImportError:
        # Minimal implementation
        NotesService = None
        Note = None

# For backward compatibility
from rich.console import Console
console = Console()


class NotesManager:
    """
    Backward-compatible wrapper for NotesService

    This class maintains the original NotesManager API while delegating
    to the refactored service layer.
    """

    def __init__(self, db_path: str = "curriculum.db"):
        """Initialize notes manager

        Args:
            db_path: Path to database file
        """
        self.db_path = db_path
        self.service = NotesService(db_path)
        self.notes_dir = self.service.notes_dir
        self.page_size = self.service.page_size
        self.current_page = 1

    def save_note(
        self,
        user_id: int,
        lesson_id: Optional[int],
        content: str,
        module_name: str = "",
        topic: str = "",
        tags: List[str] = None,
        title: str = "",
        note_type: str = "concept",
        priority: int = 2,
        parent_note_id: Optional[int] = None,
        code_snippets: List[Dict] = None
    ) -> int:
        """Save a new note (backward compatible API)"""
        return self.service.create_note(
            user_id=user_id,
            content=content,
            lesson_id=lesson_id,
            module_name=module_name,
            topic=topic,
            tags=tags,
            title=title,
            note_type=note_type,
            priority=priority,
            parent_note_id=parent_note_id,
            code_snippets=code_snippets
        )

    def get_notes(
        self,
        user_id: int,
        lesson_id: Optional[int] = None,
        module_name: Optional[str] = None,
        search_term: Optional[str] = None,
        note_type: Optional[str] = None,
        priority: Optional[int] = None,
        parent_note_id: Optional[int] = None
    ) -> List[Dict]:
        """Get notes (backward compatible - returns dicts)"""
        notes = self.service.get_notes(
            user_id=user_id,
            lesson_id=lesson_id,
            module_name=module_name,
            search_term=search_term,
            note_type=note_type,
            priority=priority,
            parent_note_id=parent_note_id
        )
        return [note.to_dict() for note in notes]

    def format_content(self, content: str) -> str:
        """Format content (backward compatible)"""
        return self.service.format_content(content)

    def update_note(
        self,
        note_id: int,
        content: str = None,
        tags: List[str] = None,
        title: str = None,
        topic: str = None,
        note_type: str = None,
        priority: int = None,
        code_snippets: List[Dict] = None
    ) -> bool:
        """Update note (backward compatible API)"""
        note = self.service.repository.get_by_id(note_id)
        if not note:
            return False

        # Update fields if provided
        if content is not None:
            note.content = content
        if tags is not None:
            note.tags = tags
        if title is not None:
            note.title = title
        if topic is not None:
            note.topic = topic
        if note_type is not None:
            note.note_type = note_type
        if priority is not None:
            note.priority = priority
        if code_snippets is not None:
            from .models.note import CodeSnippet
            note.code_snippets = [
                CodeSnippet(**s) if isinstance(s, dict) else s
                for s in code_snippets
            ]

        return self.service.update_note(note)

    def delete_note(self, note_id: int) -> bool:
        """Delete note (backward compatible)"""
        return self.service.delete_note(note_id)

    def toggle_favorite(self, note_id: int) -> bool:
        """Toggle favorite (backward compatible)"""
        return self.service.toggle_favorite(note_id)

    def export_notes(
        self,
        user_id: int,
        format: str = "markdown",
        output_dir: Optional[str] = None
    ) -> str:
        """Export notes (backward compatible)"""
        return self.service.export_notes(user_id, format, output_dir)

    def get_statistics(self, user_id: int) -> Dict:
        """Get statistics (backward compatible - returns dict)"""
        stats = self.service.get_statistics(user_id)
        return {
            'total_notes': stats.total_notes,
            'by_module': stats.by_module,
            'recent_notes': stats.recent_notes,
            'favorites': stats.favorites
        }

    def display_notes(self, notes: List[Dict], title: str = "Notes"):
        """Display notes (backward compatible - accepts dicts)"""
        # Convert dicts to Note objects if needed
        note_objects = []
        for note in notes:
            if isinstance(note, dict):
                note_objects.append(Note.from_dict(note))
            else:
                note_objects.append(note)

        self.service.display_notes(note_objects, title)

    def get_page(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = None,
        sort_by: str = "created_desc",
        **filters
    ) -> Dict:
        """Get paginated notes (backward compatible - returns dict)"""
        note_page = self.service.get_page(
            user_id=user_id,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            **filters
        )

        return {
            'notes': [note.to_dict() for note in note_page.notes],
            'total_notes': note_page.total_notes,
            'total_pages': note_page.total_pages,
            'current_page': note_page.current_page,
            'page_size': note_page.page_size
        }

    def fuzzy_search(
        self,
        user_id: int,
        query: str,
        threshold: float = 0.6
    ) -> List[Dict]:
        """Fuzzy search (backward compatible - returns dicts)"""
        notes = self.service.fuzzy_search(user_id, query, threshold)
        return [note.to_dict() for note in notes]

    def link_notes(self, parent_id: int, child_id: int) -> bool:
        """Link notes (backward compatible)"""
        return self.service.link_notes(parent_id, child_id)

    def get_child_notes(self, parent_id: int) -> List[Dict]:
        """Get child notes (backward compatible - returns dicts)"""
        notes = self.service.get_child_notes(parent_id)
        return [note.to_dict() for note in notes]

    def add_code_snippet(
        self,
        note_id: int,
        code: str,
        language: str = "python",
        description: str = ""
    ) -> bool:
        """Add code snippet (backward compatible)"""
        return self.service.add_code_snippet(note_id, code, language, description)

    def get_code_snippets(self, note_id: int) -> List[Dict]:
        """Get code snippets (backward compatible)"""
        note = self.service.repository.get_by_id(note_id)
        if not note:
            return []

        return [
            snippet.__dict__ if hasattr(snippet, '__dict__') else snippet
            for snippet in note.code_snippets
        ]

    def cleanup_orphaned_notes(self) -> int:
        """Cleanup orphaned notes (backward compatible)"""
        return self.service.cleanup_orphaned_notes()

    def migrate_old_notes(self) -> int:
        """Migrate old notes (backward compatible)"""
        return self.service.migrate_old_notes()

    # Additional helper methods for internal use
    def _init_database(self):
        """Internal method - handled by repository now"""
        pass  # Initialization is done in repository

    def _migrate_schema(self, cursor):
        """Internal method - handled by repository now"""
        pass  # Migration is done in repository

    def _format_notes_markdown(self, notes: List[Dict]) -> str:
        """Internal method - handled by service now"""
        note_objects = [Note.from_dict(n) for n in notes]
        return self.service._format_notes_markdown(note_objects)

    def _markdown_to_html(self, md_content: str) -> str:
        """Internal method - handled by service now"""
        return self.service._markdown_to_html(md_content)


# CLI Integration Functions (backward compatible)
def integrate_with_cli(cli_instance):
    """
    Integrate notes manager with the CLI (backward compatible)

    Args:
        cli_instance: CLI instance

    Returns:
        Dictionary of CLI commands
    """
    notes_mgr = NotesManager()

    def cmd_note_add(args):
        """Add a new note"""
        content = input("Enter note content (press Enter twice to finish):\n")
        lines = []
        while True:
            line = input()
            if not line:
                break
            lines.append(line)
        content = "\n".join([content] + lines)

        topic = input("Topic (optional): ").strip() or "General Note"
        tags_input = input("Tags (comma-separated, optional): ").strip()
        tags = [t.strip() for t in tags_input.split(",")] if tags_input else []

        user_id = getattr(cli_instance, 'current_user_id', 1)
        lesson_id = getattr(cli_instance, 'current_lesson_id', None)
        module_name = getattr(cli_instance, 'current_module', 'General')

        note_id = notes_mgr.save_note(
            user_id, lesson_id, content,
            module_name, topic, tags
        )

        console.print(f"[green]✓ Note saved with ID: {note_id}[/green]")

    def cmd_note_list(args):
        """List notes"""
        user_id = getattr(cli_instance, 'current_user_id', 1)

        if isinstance(args, dict):
            search = args.get('search')
            module = args.get('module')
        else:
            search = None
            module = None

        notes = notes_mgr.get_notes(user_id, module_name=module, search_term=search)
        notes_mgr.display_notes(notes, title="Your Notes")

    def cmd_note_export(args):
        """Export notes"""
        user_id = getattr(cli_instance, 'current_user_id', 1)

        if isinstance(args, dict):
            format = args.get('format', 'markdown')
        else:
            format = 'markdown'

        filename = notes_mgr.export_notes(user_id, format)
        if filename:
            console.print(f"[green]✓ Notes exported to: {filename}[/green]")
        else:
            console.print("[yellow]No notes to export.[/yellow]")

    def cmd_note_stats(args):
        """Show note statistics"""
        from rich.panel import Panel

        user_id = getattr(cli_instance, 'current_user_id', 1)
        stats = notes_mgr.get_statistics(user_id)

        panel = Panel(
            f"""[bold cyan]📊 Note Statistics[/bold cyan]

📝 Total Notes: [bold]{stats['total_notes']}[/bold]
⭐ Favorites: [bold]{stats['favorites']}[/bold]
📅 Recent (7 days): [bold]{stats['recent_notes']}[/bold]

[bold]Notes by Module:[/bold]
{chr(10).join([f"  • {m}: {c}" for m, c in stats['by_module'].items()])}
            """,
            expand=False,
            border_style="cyan"
        )
        console.print(panel)

    def cmd_note_cleanup(args):
        """Clean up notes"""
        migrated = notes_mgr.migrate_old_notes()
        if migrated > 0:
            console.print(f"[green]✓ Migrated {migrated} notes[/green]")

        deleted = notes_mgr.cleanup_orphaned_notes()
        if deleted > 0:
            console.print(f"[yellow]⚠ Removed {deleted} orphaned notes[/yellow]")

        console.print("[green]✓ Notes cleanup complete[/green]")

    return {
        'note': cmd_note_add,
        'notes': cmd_note_list,
        'note-export': cmd_note_export,
        'note-stats': cmd_note_stats,
        'note-cleanup': cmd_note_cleanup
    }


# Main entry point for testing
if __name__ == "__main__":
    mgr = NotesManager()

    console.print("[bold]Initializing Notes System...[/bold]")

    migrated = mgr.migrate_old_notes()
    deleted = mgr.cleanup_orphaned_notes()

    console.print(f"[green]✓ System initialized[/green]")
    if migrated:
        console.print(f"  • Migrated {migrated} notes")
    if deleted:
        console.print(f"  • Cleaned {deleted} orphaned notes")

    stats = mgr.get_statistics(1)
    console.print(f"\n[bold]Current Statistics:[/bold]")
    console.print(f"  • Total notes: {stats['total_notes']}")
    console.print(f"  • Favorites: {stats['favorites']}")
    console.print(f"  • Recent notes: {stats['recent_notes']}")
