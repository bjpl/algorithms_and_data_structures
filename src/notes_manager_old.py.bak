#!/usr/bin/env python3
"""
Notes Manager - Comprehensive note management system for the curriculum
"""

import sqlite3
import json
import os
import re
import math
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from difflib import SequenceMatcher
from rich.console import Console
try:
    import markdown
    HAS_MARKDOWN = True
except ImportError:
    HAS_MARKDOWN = False
from rich.table import Table
from rich.panel import Panel
from rich.markdown import Markdown as RichMarkdown

console = Console()

class NotesManager:
    """Manages all note-taking operations for the curriculum"""

    def __init__(self, db_path: str = "curriculum.db"):
        self.db_path = db_path
        self.notes_dir = Path("notes")
        self.notes_dir.mkdir(exist_ok=True)
        self.page_size = 10  # Default pagination size
        self.current_page = 1
        self._init_database()
    
    def _init_database(self):
        """Initialize notes table if it doesn't exist"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # Create dedicated notes table with enhanced schema
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    lesson_id INTEGER,
                    module_name TEXT,
                    topic TEXT,
                    title TEXT DEFAULT '',
                    content TEXT NOT NULL,
                    note_type TEXT DEFAULT 'concept',
                    priority INTEGER DEFAULT 2,
                    formatted_content TEXT,
                    parent_note_id INTEGER,
                    code_snippets TEXT,
                    tags TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_favorite BOOLEAN DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (lesson_id) REFERENCES lessons(id),
                    FOREIGN KEY (parent_note_id) REFERENCES notes(id)
                )
            """)
            
            # Create notes indices for faster searching
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_notes_user
                ON notes(user_id, created_at DESC)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_notes_lesson
                ON notes(lesson_id, user_id)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_notes_type
                ON notes(note_type, priority)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_notes_parent
                ON notes(parent_note_id)
            """)
            
            # Ensure progress table exists and has notes column (if it exists)
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='progress'
            """)
            if cursor.fetchone():
                # Table exists, check for notes column
                cursor.execute("PRAGMA table_info(progress)")
                columns = [col[1] for col in cursor.fetchall()]
                if 'notes' not in columns:
                    try:
                        cursor.execute("ALTER TABLE progress ADD COLUMN notes TEXT")
                    except sqlite3.OperationalError:
                        pass  # Column might already exist

            # Migrate existing notes table to enhanced schema
            try:
                self._migrate_schema(cursor)
            except Exception as e:
                # Migration errors should not prevent initialization
                console.print(f"[yellow]Schema migration note: {e}[/yellow]")

            conn.commit()

    def _migrate_schema(self, cursor):
        """Migrate existing notes table to enhanced schema"""
        # Check if notes table exists
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='notes'
        """)
        if not cursor.fetchone():
            return

        # Get current columns
        cursor.execute("PRAGMA table_info(notes)")
        columns = {col[1]: col[2] for col in cursor.fetchall()}

        # Add missing columns with proper defaults
        migrations = [
            ("title", "TEXT DEFAULT ''"),
            ("note_type", "TEXT DEFAULT 'concept'"),
            ("priority", "INTEGER DEFAULT 2"),
            ("formatted_content", "TEXT"),
            ("parent_note_id", "INTEGER"),
            ("code_snippets", "TEXT")
        ]

        for col_name, col_type in migrations:
            if col_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE notes ADD COLUMN {col_name} {col_type}")
                    console.print(f"[green]✓ Added column: {col_name}[/green]")
                except sqlite3.OperationalError:
                    # Column might already exist
                    pass

        # Update indices if they don't exist
        try:
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_notes_type
                ON notes(note_type, priority)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_notes_parent
                ON notes(parent_note_id)
            """)
        except sqlite3.OperationalError:
            pass
    
    def save_note(self, user_id: int, lesson_id: Optional[int],
                  content: str, module_name: str = "",
                  topic: str = "", tags: List[str] = None,
                  title: str = "", note_type: str = "concept",
                  priority: int = 2, parent_note_id: Optional[int] = None,
                  code_snippets: List[Dict] = None) -> int:
        """Save a new note to the database with enhanced fields

        Args:
            user_id: User ID who owns the note
            lesson_id: Optional lesson ID for association
            content: Note content (supports markdown)
            module_name: Module/category name
            topic: Note topic/subject
            tags: List of tags for organization
            title: Note title (defaults to topic if empty)
            note_type: Type of note (concept/example/question/insight/todo/reference)
            priority: Priority level (1=LOW, 2=MEDIUM, 3=HIGH, 4=CRITICAL, 5=URGENT)
            parent_note_id: Parent note ID for hierarchical notes
            code_snippets: List of code snippet dictionaries

        Returns:
            The ID of the created note

        Raises:
            ValueError: If user_id is invalid or content is empty/None
        """
        # Validate inputs
        if user_id is None or user_id <= 0:
            raise ValueError("User ID must be a positive integer")

        if content is None or (isinstance(content, str) and not content.strip()):
            raise ValueError("Note content cannot be empty")

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # Prepare data
            tags_str = json.dumps(tags) if tags else "[]"
            title = title or topic or "Untitled"
            formatted_content = self.format_content(content)
            code_snippets_str = json.dumps(code_snippets) if code_snippets else "[]"

            cursor.execute("""
                INSERT INTO notes (user_id, lesson_id, module_name, topic, title,
                                 content, note_type, priority, formatted_content,
                                 parent_note_id, code_snippets, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, lesson_id, module_name, topic, title, content,
                  note_type, priority, formatted_content, parent_note_id,
                  code_snippets_str, tags_str))

            note_id = cursor.lastrowid

            # Also update progress table if lesson_id exists and table exists
            if lesson_id:
                cursor.execute("""
                    SELECT name FROM sqlite_master
                    WHERE type='table' AND name='progress'
                """)
                if cursor.fetchone():
                    try:
                        cursor.execute("""
                            UPDATE progress
                            SET notes = COALESCE(notes || '\n---\n' || ?, ?)
                            WHERE user_id = ? AND lesson_id = ?
                        """, (content, content, user_id, lesson_id))
                    except sqlite3.OperationalError:
                        pass  # Progress table might not have notes column

            conn.commit()
            return note_id
    
    def get_notes(self, user_id: int, lesson_id: Optional[int] = None,
                  module_name: Optional[str] = None,
                  search_term: Optional[str] = None,
                  note_type: Optional[str] = None,
                  priority: Optional[int] = None,
                  parent_note_id: Optional[int] = None) -> List[Dict]:
        """Retrieve notes with optional filters

        Args:
            user_id: User ID to filter by
            lesson_id: Optional lesson ID filter
            module_name: Optional module name filter
            search_term: Search in content, topic, tags, title
            note_type: Filter by note type
            priority: Filter by priority level
            parent_note_id: Filter by parent note (for hierarchical notes)

        Returns:
            List of note dictionaries with all fields
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # Check if lessons table exists
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='lessons'
            """)
            has_lessons_table = cursor.fetchone() is not None

            if has_lessons_table:
                query = """
                    SELECT n.id, n.user_id, n.lesson_id, n.module_name, n.topic, n.title,
                           n.content, n.note_type, n.priority, n.formatted_content,
                           n.parent_note_id, n.code_snippets, n.tags,
                           n.created_at, n.updated_at, n.is_favorite,
                           l.title as lesson_title
                    FROM notes n
                    LEFT JOIN lessons l ON n.lesson_id = l.id
                    WHERE n.user_id = ?
                """
            else:
                query = """
                    SELECT n.id, n.user_id, n.lesson_id, n.module_name, n.topic, n.title,
                           n.content, n.note_type, n.priority, n.formatted_content,
                           n.parent_note_id, n.code_snippets, n.tags,
                           n.created_at, n.updated_at, n.is_favorite,
                           NULL as lesson_title
                    FROM notes n
                    WHERE n.user_id = ?
                """
            params = [user_id]

            if lesson_id:
                query += " AND n.lesson_id = ?"
                params.append(lesson_id)

            if module_name:
                query += " AND n.module_name = ?"
                params.append(module_name)

            if note_type:
                query += " AND n.note_type = ?"
                params.append(note_type)

            if priority is not None:
                query += " AND n.priority = ?"
                params.append(priority)

            if parent_note_id is not None:
                query += " AND n.parent_note_id = ?"
                params.append(parent_note_id)

            if search_term:
                query += " AND (n.content LIKE ? OR n.topic LIKE ? OR n.title LIKE ? OR n.tags LIKE ?)"
                search_pattern = f"%{search_term}%"
                params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

            query += " ORDER BY n.id DESC"  # Use ID for ordering (monotonically increasing)

            cursor.execute(query, params)
            columns = [desc[0] for desc in cursor.description]
            notes = []

            for row in cursor.fetchall():
                note = dict(zip(columns, row))
                # Deserialize JSON fields
                note['tags'] = json.loads(note['tags']) if note['tags'] else []
                note['code_snippets'] = json.loads(note['code_snippets']) if note.get('code_snippets') else []
                notes.append(note)

            return notes
    
    def format_content(self, content: str) -> str:
        """Apply rich formatting to content (markdown-like)

        Supports:
        - **bold** or __bold__
        - *italic* or _italic_
        - `code`
        - # Headers
        - - Lists
        - 1. Numbered lists

        Args:
            content: Raw content string

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

        # Headers: # Header
        formatted = re.sub(r'^# (.*?)$', r'\033[1m\033[94m\1\033[0m', formatted, flags=re.MULTILINE)
        formatted = re.sub(r'^## (.*?)$', r'\033[1m\033[96m\1\033[0m', formatted, flags=re.MULTILINE)

        # Lists: - item or * item
        formatted = re.sub(r'^[\-\*] (.*?)$', r'\033[92m•\033[0m \1', formatted, flags=re.MULTILINE)

        # Numbered lists: 1. item
        formatted = re.sub(r'^(\d+)\. (.*?)$', r'\033[93m\1.\033[0m \2', formatted, flags=re.MULTILINE)

        return formatted

    def update_note(self, note_id: int, content: str = None,
                    tags: List[str] = None, title: str = None,
                    topic: str = None, note_type: str = None,
                    priority: int = None, code_snippets: List[Dict] = None) -> bool:
        """Update an existing note

        Args:
            note_id: ID of note to update
            content: New content (optional)
            tags: New tags list (optional)
            title: New title (optional)
            topic: New topic (optional)
            note_type: New note type (optional)
            priority: New priority (optional)
            code_snippets: New code snippets (optional)

        Returns:
            True if update successful, False otherwise
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            updates = []
            params = []

            if content is not None:
                updates.append("content = ?")
                params.append(content)
                updates.append("formatted_content = ?")
                params.append(self.format_content(content))

            if tags is not None:
                updates.append("tags = ?")
                params.append(json.dumps(tags))

            if title is not None:
                updates.append("title = ?")
                params.append(title)

            if topic is not None:
                updates.append("topic = ?")
                params.append(topic)

            if note_type is not None:
                updates.append("note_type = ?")
                params.append(note_type)

            if priority is not None:
                updates.append("priority = ?")
                params.append(priority)

            if code_snippets is not None:
                updates.append("code_snippets = ?")
                params.append(json.dumps(code_snippets))

            if not updates:
                return False

            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.append(note_id)

            query = f"UPDATE notes SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, params)

            conn.commit()
            return cursor.rowcount > 0
    
    def delete_note(self, note_id: int) -> bool:
        """Delete a note"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def toggle_favorite(self, note_id: int) -> bool:
        """Toggle favorite status of a note"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE notes 
                SET is_favorite = NOT is_favorite,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (note_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def export_notes(self, user_id: int, format: str = "markdown",
                     output_dir: Optional[str] = None) -> str:
        """Export notes to file"""
        notes = self.get_notes(user_id)
        
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
            content = json.dumps(notes, indent=2, default=str)
        
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return str(filename)
    
    def _format_notes_markdown(self, notes: List[Dict]) -> str:
        """Format notes as markdown"""
        lines = ["# 📚 Learning Notes\n"]
        lines.append(f"*Exported on {datetime.now().strftime('%Y-%m-%d %H:%M')}*\n\n")
        
        # Group by module
        modules = {}
        for note in notes:
            module = note.get('module_name', 'General')
            if module not in modules:
                modules[module] = []
            modules[module].append(note)
        
        for module, module_notes in modules.items():
            lines.append(f"## 📂 {module}\n")
            
            for note in module_notes:
                lines.append(f"### 📝 {note.get('topic', 'Note')}")
                
                if note.get('lesson_title'):
                    lines.append(f"*Lesson: {note['lesson_title']}*")
                
                lines.append(f"*Created: {note['created_at']}*")
                
                if note.get('is_favorite'):
                    lines.append("⭐ **Favorited**")
                
                if note.get('tags'):
                    tags_str = " ".join([f"`{tag}`" for tag in note['tags']])
                    lines.append(f"Tags: {tags_str}")
                
                lines.append(f"\n{note['content']}\n")
                lines.append("---\n")
        
        return "\n".join(lines)
    
    def _markdown_to_html(self, md_content: str) -> str:
        """Convert markdown to HTML with styling"""
        if HAS_MARKDOWN:
            html_body = markdown.markdown(md_content, extensions=['extra', 'codehilite'])
        else:
            # Basic conversion without markdown library
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
        blockquote {{
            border-left: 4px solid #3498db;
            padding-left: 20px;
            margin-left: 0;
            color: #666;
        }}
        hr {{
            border: none;
            border-top: 1px solid #e0e0e0;
            margin: 30px 0;
        }}
        em {{ color: #666; }}
    </style>
</head>
<body>
{html_body}
</body>
</html>"""
        return html
    
    def get_statistics(self, user_id: int) -> Dict:
        """Get note-taking statistics"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Total notes
            cursor.execute("SELECT COUNT(*) FROM notes WHERE user_id = ?", (user_id,))
            total_notes = cursor.fetchone()[0]
            
            # Notes by module
            cursor.execute("""
                SELECT module_name, COUNT(*) as count
                FROM notes 
                WHERE user_id = ?
                GROUP BY module_name
                ORDER BY count DESC
            """, (user_id,))
            by_module = dict(cursor.fetchall())
            
            # Recent notes
            cursor.execute("""
                SELECT COUNT(*) 
                FROM notes 
                WHERE user_id = ? 
                AND datetime(created_at) > datetime('now', '-7 days')
            """, (user_id,))
            recent_notes = cursor.fetchone()[0]
            
            # Favorite notes
            cursor.execute("""
                SELECT COUNT(*) 
                FROM notes 
                WHERE user_id = ? AND is_favorite = 1
            """, (user_id,))
            favorites = cursor.fetchone()[0]
            
            return {
                'total_notes': total_notes,
                'by_module': by_module,
                'recent_notes': recent_notes,
                'favorites': favorites
            }
    
    def display_notes(self, notes: List[Dict], title: str = "Notes"):
        """Display notes in a formatted table"""
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
        
        for note in notes[:20]:  # Show max 20 notes in table
            content_preview = note['content'][:100] + "..." if len(note['content']) > 100 else note['content']
            tags_str = ", ".join(note.get('tags', []))[:30]
            created = datetime.fromisoformat(note['created_at']).strftime("%m/%d %H:%M")
            fav = "⭐" if note.get('is_favorite') else ""
            
            table.add_row(
                str(note['id']),
                note.get('module_name', 'General')[:20],
                note.get('topic', 'Note')[:30],
                content_preview,
                tags_str,
                created,
                fav
            )
        
        console.print(table)
        
        if len(notes) > 20:
            console.print(f"\n[dim]Showing 20 of {len(notes)} notes. Use filters to narrow results.[/dim]")
    
    def get_page(self, user_id: int, page: int = 1, page_size: int = None,
                 sort_by: str = "created_desc", **filters) -> Dict:
        """Get a paginated page of notes

        Args:
            user_id: User ID
            page: Page number (1-indexed)
            page_size: Notes per page (defaults to self.page_size)
            sort_by: Sort order (created_desc/created_asc/updated_desc/title_asc)
            **filters: Additional filters for get_notes()

        Returns:
            Dictionary with notes, total_notes, total_pages, current_page
        """
        page_size = page_size or self.page_size
        self.current_page = max(1, page)

        # Get all filtered notes
        all_notes = self.get_notes(user_id, **filters)

        # Calculate pagination
        total_notes = len(all_notes)
        total_pages = max(1, math.ceil(total_notes / page_size))
        self.current_page = min(self.current_page, total_pages)

        # Apply sorting
        sort_key = lambda n: n.get('created_at', '')
        reverse = True
        if sort_by == "created_asc":
            reverse = False
        elif sort_by == "updated_desc":
            sort_key = lambda n: n.get('updated_at', '')
        elif sort_by == "title_asc":
            sort_key = lambda n: n.get('title', '')
            reverse = False

        all_notes.sort(key=sort_key, reverse=reverse)

        # Get page slice
        start_idx = (self.current_page - 1) * page_size
        end_idx = start_idx + page_size
        page_notes = all_notes[start_idx:end_idx]

        return {
            'notes': page_notes,
            'total_notes': total_notes,
            'total_pages': total_pages,
            'current_page': self.current_page,
            'page_size': page_size
        }

    def fuzzy_search(self, user_id: int, query: str, threshold: float = 0.6) -> List[Dict]:
        """Perform fuzzy search on notes using SequenceMatcher

        Args:
            user_id: User ID
            query: Search query
            threshold: Minimum similarity threshold (0.0-1.0)

        Returns:
            List of notes sorted by relevance score
        """
        if not query:
            return self.get_notes(user_id)

        query_lower = query.lower()
        all_notes = self.get_notes(user_id)
        scored_notes = []

        for note in all_notes:
            # Calculate similarity scores for different fields
            title_score = SequenceMatcher(None, query_lower,
                                         note.get('title', '').lower()).ratio()
            topic_score = SequenceMatcher(None, query_lower,
                                         note.get('topic', '').lower()).ratio()
            content_score = SequenceMatcher(None, query_lower,
                                           note.get('content', '')[:200].lower()).ratio()
            module_score = SequenceMatcher(None, query_lower,
                                          note.get('module_name', '').lower()).ratio()

            # Check tags
            tag_score = 0
            for tag in note.get('tags', []):
                tag_score = max(tag_score,
                               SequenceMatcher(None, query_lower, tag.lower()).ratio())

            # Calculate weighted final score
            final_score = max(
                title_score * 1.8,  # Title has highest weight
                topic_score * 1.5,
                content_score * 1.0,
                module_score * 0.8,
                tag_score * 1.2
            )

            if final_score >= threshold:
                note['relevance_score'] = final_score
                scored_notes.append(note)

        # Sort by relevance score
        scored_notes.sort(key=lambda x: x['relevance_score'], reverse=True)
        return scored_notes

    def link_notes(self, parent_id: int, child_id: int) -> bool:
        """Link two notes in a parent-child relationship

        Args:
            parent_id: ID of parent note
            child_id: ID of child note

        Returns:
            True if successful, False otherwise
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # Verify both notes exist
            cursor.execute("SELECT id FROM notes WHERE id IN (?, ?)",
                          (parent_id, child_id))
            if len(cursor.fetchall()) != 2:
                return False

            # Update child note's parent
            cursor.execute("""
                UPDATE notes
                SET parent_note_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (parent_id, child_id))

            conn.commit()
            return cursor.rowcount > 0

    def get_child_notes(self, parent_id: int) -> List[Dict]:
        """Get all child notes of a parent note

        Args:
            parent_id: ID of parent note

        Returns:
            List of child notes
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # Get parent note's user_id first
            cursor.execute("SELECT user_id FROM notes WHERE id = ?", (parent_id,))
            result = cursor.fetchone()
            if not result:
                return []

            user_id = result[0]
            return self.get_notes(user_id, parent_note_id=parent_id)

    def add_code_snippet(self, note_id: int, code: str, language: str = "python",
                        description: str = "") -> bool:
        """Add a code snippet to a note

        Args:
            note_id: Note ID
            code: Code content
            language: Programming language
            description: Optional description

        Returns:
            True if successful
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # Get current snippets
            cursor.execute("SELECT code_snippets FROM notes WHERE id = ?", (note_id,))
            result = cursor.fetchone()
            if not result:
                return False

            snippets = json.loads(result[0]) if result[0] else []

            # Add new snippet
            snippets.append({
                'code': code,
                'language': language,
                'description': description,
                'added_at': datetime.now().isoformat()
            })

            # Update note
            cursor.execute("""
                UPDATE notes
                SET code_snippets = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (json.dumps(snippets), note_id))

            conn.commit()
            return cursor.rowcount > 0

    def get_code_snippets(self, note_id: int) -> List[Dict]:
        """Get all code snippets from a note

        Args:
            note_id: Note ID

        Returns:
            List of code snippet dictionaries
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT code_snippets FROM notes WHERE id = ?", (note_id,))
            result = cursor.fetchone()
            if not result or not result[0]:
                return []

            return json.loads(result[0])

    def cleanup_orphaned_notes(self) -> int:
        """Remove notes with invalid references"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # Find orphaned notes (lessons that don't exist)
            cursor.execute("""
                DELETE FROM notes
                WHERE lesson_id IS NOT NULL
                AND lesson_id NOT IN (SELECT id FROM lessons)
            """)

            deleted = cursor.rowcount
            conn.commit()

            return deleted
    
    def migrate_old_notes(self) -> int:
        """Migrate notes from progress table to notes table"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Get all notes from progress table
            cursor.execute("""
                SELECT p.user_id, p.lesson_id, p.notes, l.title
                FROM progress p
                LEFT JOIN lessons l ON p.lesson_id = l.id
                WHERE p.notes IS NOT NULL AND p.notes != ''
            """)
            
            migrated = 0
            for row in cursor.fetchall():
                user_id, lesson_id, notes_content, lesson_title = row
                
                # Use lesson title or default module name
                module_name = "General"
                if lesson_title:
                    # Extract module from title if possible
                    if ':' in lesson_title:
                        module_name = lesson_title.split(':')[0].strip()
                    elif '-' in lesson_title:
                        module_name = lesson_title.split('-')[0].strip()
                
                # Check if already migrated
                cursor.execute("""
                    SELECT COUNT(*) FROM notes 
                    WHERE user_id = ? AND lesson_id = ? AND content = ?
                """, (user_id, lesson_id, notes_content))
                
                if cursor.fetchone()[0] == 0:
                    # Migrate the note
                    cursor.execute("""
                        INSERT INTO notes (user_id, lesson_id, module_name, topic, content)
                        VALUES (?, ?, ?, ?, ?)
                    """, (user_id, lesson_id, module_name, lesson_title or "Note", notes_content))
                    migrated += 1
            
            conn.commit()
            return migrated


# CLI Integration Functions
def integrate_with_cli(cli_instance):
    """Integrate notes manager with the CLI"""
    notes_mgr = NotesManager()
    
    # Add notes commands to CLI
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
        
        # Get current context from CLI
        user_id = getattr(cli_instance, 'current_user_id', 1)
        lesson_id = getattr(cli_instance, 'current_lesson_id', None)
        module_name = getattr(cli_instance, 'current_module', 'General')
        
        note_id = notes_mgr.save_note(
            user_id, lesson_id, content, 
            module_name, topic, tags
        )
        
        console.print(f"[green]✓ Note saved with ID: {note_id}[/green]")
    
    def cmd_note_list(args):
        """List notes with optional filters"""
        user_id = getattr(cli_instance, 'current_user_id', 1)
        
        # Handle args being a dict, string, or None
        if isinstance(args, dict):
            search = args.get('search')
            module = args.get('module')
        else:
            search = None
            module = None
        
        notes = notes_mgr.get_notes(user_id, module_name=module, search_term=search)
        notes_mgr.display_notes(notes, title="Your Notes")
    
    def cmd_note_export(args):
        """Export notes to file"""
        user_id = getattr(cli_instance, 'current_user_id', 1)
        
        # Handle args being a dict, string, or None
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
        """Clean up orphaned notes and migrate old ones"""
        # Migrate old notes
        migrated = notes_mgr.migrate_old_notes()
        if migrated > 0:
            console.print(f"[green]✓ Migrated {migrated} notes from old system[/green]")
        
        # Clean orphaned
        deleted = notes_mgr.cleanup_orphaned_notes()
        if deleted > 0:
            console.print(f"[yellow]⚠ Removed {deleted} orphaned notes[/yellow]")
        
        console.print("[green]✓ Notes cleanup complete[/green]")
    
    # Register commands with CLI
    cli_commands = {
        'note': cmd_note_add,
        'notes': cmd_note_list,
        'note-export': cmd_note_export,
        'note-stats': cmd_note_stats,
        'note-cleanup': cmd_note_cleanup
    }
    
    return cli_commands


if __name__ == "__main__":
    # Standalone testing
    mgr = NotesManager()
    
    # Initialize and migrate
    console.print("[bold]Initializing Notes System...[/bold]")
    
    # Clean up and migrate
    migrated = mgr.migrate_old_notes()
    deleted = mgr.cleanup_orphaned_notes()
    
    console.print(f"[green]✓ System initialized[/green]")
    if migrated:
        console.print(f"  • Migrated {migrated} notes")
    if deleted:
        console.print(f"  • Cleaned {deleted} orphaned notes")
    
    # Show stats
    stats = mgr.get_statistics(1)
    console.print(f"\n[bold]Current Statistics:[/bold]")
    console.print(f"  • Total notes: {stats['total_notes']}")
    console.print(f"  • Favorites: {stats['favorites']}")
    console.print(f"  • Recent notes: {stats['recent_notes']}")