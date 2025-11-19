#!/usr/bin/env python3
"""
Notes Repository - Database operations for notes

This repository handles all database operations for the notes system following
the Repository pattern. It provides a clean interface for CRUD operations and
database-specific logic.
"""

import sqlite3
import json
from typing import List, Dict, Optional, Tuple
from pathlib import Path
from datetime import datetime

from .base import BaseRepository
from ...models.note import Note, CodeSnippet, NoteStatistics


class NotesRepository(BaseRepository):
    """Repository for notes database operations"""

    def __init__(self, db_path: str = "curriculum.db"):
        """Initialize notes repository

        Args:
            db_path: Path to SQLite database file
        """
        super().__init__(db_path)
        self._init_database()

    def _init_database(self):
        """Initialize notes table and indices"""
        with self.get_connection() as conn:
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

            # Create indices for faster searching
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

            # Migrate schema if needed
            self._migrate_schema(cursor)

            conn.commit()

    def _migrate_schema(self, cursor):
        """Migrate existing notes table to enhanced schema

        Args:
            cursor: Database cursor
        """
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
                except sqlite3.OperationalError:
                    pass  # Column might already exist

    def create(self, note: Note) -> int:
        """Create a new note

        Args:
            note: Note object to create

        Returns:
            ID of created note

        Raises:
            ValueError: If user_id is invalid or content is empty
        """
        if note.user_id is None or note.user_id <= 0:
            raise ValueError("User ID must be a positive integer")

        if not note.content or not note.content.strip():
            raise ValueError("Note content cannot be empty")

        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Prepare JSON fields
            tags_str = json.dumps(note.tags) if note.tags else "[]"
            code_snippets_str = json.dumps([
                snippet.__dict__ if hasattr(snippet, '__dict__') else snippet
                for snippet in note.code_snippets
            ]) if note.code_snippets else "[]"

            cursor.execute("""
                INSERT INTO notes (user_id, lesson_id, module_name, topic, title,
                                 content, note_type, priority, formatted_content,
                                 parent_note_id, code_snippets, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (note.user_id, note.lesson_id, note.module_name, note.topic,
                  note.title, note.content, note.note_type, note.priority,
                  note.formatted_content, note.parent_note_id,
                  code_snippets_str, tags_str))

            note_id = cursor.lastrowid
            conn.commit()
            return note_id

    def get_by_id(self, note_id: int) -> Optional[Note]:
        """Get note by ID

        Args:
            note_id: Note ID

        Returns:
            Note object or None if not found
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT n.*, l.title as lesson_title
                FROM notes n
                LEFT JOIN lessons l ON n.lesson_id = l.id
                WHERE n.id = ?
            """, (note_id,))

            row = cursor.fetchone()
            if not row:
                return None

            columns = [desc[0] for desc in cursor.description]
            data = dict(zip(columns, row))

            return Note.from_dict(data)

    def find(
        self,
        user_id: int,
        lesson_id: Optional[int] = None,
        module_name: Optional[str] = None,
        search_term: Optional[str] = None,
        note_type: Optional[str] = None,
        priority: Optional[int] = None,
        parent_note_id: Optional[int] = None
    ) -> List[Note]:
        """Find notes with optional filters

        Args:
            user_id: User ID to filter by
            lesson_id: Optional lesson ID filter
            module_name: Optional module name filter
            search_term: Search in content, topic, tags, title
            note_type: Filter by note type
            priority: Filter by priority level
            parent_note_id: Filter by parent note

        Returns:
            List of Note objects
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Check if lessons table exists
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='lessons'
            """)
            has_lessons_table = cursor.fetchone() is not None

            # Build query
            if has_lessons_table:
                query = """
                    SELECT n.*, l.title as lesson_title
                    FROM notes n
                    LEFT JOIN lessons l ON n.lesson_id = l.id
                    WHERE n.user_id = ?
                """
            else:
                query = """
                    SELECT n.*, NULL as lesson_title
                    FROM notes n
                    WHERE n.user_id = ?
                """

            params = [user_id]

            # Add filters
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
                params.extend([search_pattern] * 4)

            query += " ORDER BY n.id DESC"

            cursor.execute(query, params)
            columns = [desc[0] for desc in cursor.description]

            notes = []
            for row in cursor.fetchall():
                data = dict(zip(columns, row))
                notes.append(Note.from_dict(data))

            return notes

    def update(self, note: Note) -> bool:
        """Update an existing note

        Args:
            note: Note object with updated data

        Returns:
            True if update successful
        """
        if not note.id:
            raise ValueError("Note ID required for update")

        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Prepare JSON fields
            tags_str = json.dumps(note.tags) if note.tags else "[]"
            code_snippets_str = json.dumps([
                snippet.__dict__ if hasattr(snippet, '__dict__') else snippet
                for snippet in note.code_snippets
            ]) if note.code_snippets else "[]"

            cursor.execute("""
                UPDATE notes
                SET content = ?, tags = ?, title = ?, topic = ?,
                    note_type = ?, priority = ?, formatted_content = ?,
                    code_snippets = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (note.content, tags_str, note.title, note.topic,
                  note.note_type, note.priority, note.formatted_content,
                  code_snippets_str, note.id))

            conn.commit()
            return cursor.rowcount > 0

    def delete(self, note_id: int) -> bool:
        """Delete a note

        Args:
            note_id: Note ID to delete

        Returns:
            True if deletion successful
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
            conn.commit()
            return cursor.rowcount > 0

    def toggle_favorite(self, note_id: int) -> bool:
        """Toggle favorite status of a note

        Args:
            note_id: Note ID

        Returns:
            True if successful
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE notes
                SET is_favorite = NOT is_favorite,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (note_id,))
            conn.commit()
            return cursor.rowcount > 0

    def link_notes(self, parent_id: int, child_id: int) -> bool:
        """Link two notes in parent-child relationship

        Args:
            parent_id: ID of parent note
            child_id: ID of child note

        Returns:
            True if successful
        """
        with self.get_connection() as conn:
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

    def get_child_notes(self, parent_id: int) -> List[Note]:
        """Get all child notes of a parent note

        Args:
            parent_id: ID of parent note

        Returns:
            List of child Note objects
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Get parent note's user_id first
            cursor.execute("SELECT user_id FROM notes WHERE id = ?", (parent_id,))
            result = cursor.fetchone()
            if not result:
                return []

            user_id = result[0]
            return self.find(user_id, parent_note_id=parent_id)

    def get_statistics(self, user_id: int) -> NoteStatistics:
        """Get note-taking statistics for a user

        Args:
            user_id: User ID

        Returns:
            NoteStatistics object
        """
        with self.get_connection() as conn:
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

            # Recent notes (last 7 days)
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

            # Notes by type
            cursor.execute("""
                SELECT note_type, COUNT(*) as count
                FROM notes
                WHERE user_id = ?
                GROUP BY note_type
            """, (user_id,))
            by_type = dict(cursor.fetchall())

            # Notes by priority
            cursor.execute("""
                SELECT priority, COUNT(*) as count
                FROM notes
                WHERE user_id = ?
                GROUP BY priority
            """, (user_id,))
            by_priority = dict(cursor.fetchall())

            return NoteStatistics(
                total_notes=total_notes,
                by_module=by_module,
                recent_notes=recent_notes,
                favorites=favorites,
                by_type=by_type,
                by_priority=by_priority
            )

    def cleanup_orphaned_notes(self) -> int:
        """Remove notes with invalid lesson references

        Returns:
            Number of notes deleted
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                DELETE FROM notes
                WHERE lesson_id IS NOT NULL
                AND lesson_id NOT IN (SELECT id FROM lessons)
            """)

            deleted = cursor.rowcount
            conn.commit()
            return deleted

    def migrate_from_progress_table(self) -> int:
        """Migrate notes from old progress table to notes table

        Returns:
            Number of notes migrated
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Check if progress table exists with notes column
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='progress'
            """)
            if not cursor.fetchone():
                return 0

            # Get all notes from progress table
            try:
                cursor.execute("""
                    SELECT p.user_id, p.lesson_id, p.notes, l.title
                    FROM progress p
                    LEFT JOIN lessons l ON p.lesson_id = l.id
                    WHERE p.notes IS NOT NULL AND p.notes != ''
                """)
            except sqlite3.OperationalError:
                return 0  # Progress table doesn't have notes column

            migrated = 0
            for row in cursor.fetchall():
                user_id, lesson_id, notes_content, lesson_title = row

                # Determine module name
                module_name = "General"
                if lesson_title:
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
                    """, (user_id, lesson_id, module_name,
                          lesson_title or "Note", notes_content))
                    migrated += 1

            conn.commit()
            return migrated
