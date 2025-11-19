#!/usr/bin/env python3
"""
Note Models - Data structures for the notes system
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum


class NoteType(Enum):
    """Types of notes"""
    CONCEPT = "concept"
    EXAMPLE = "example"
    QUESTION = "question"
    INSIGHT = "insight"
    TODO = "todo"
    REFERENCE = "reference"


class Priority(Enum):
    """Note priority levels"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4
    URGENT = 5


@dataclass
class CodeSnippet:
    """Code snippet attached to a note"""
    code: str
    language: str = "python"
    description: str = ""
    added_at: Optional[str] = None

    def __post_init__(self):
        if self.added_at is None:
            self.added_at = datetime.now().isoformat()


@dataclass
class Note:
    """
    Note data model

    Represents a single note in the learning system with rich metadata,
    hierarchical relationships, and code snippet support.

    Attributes:
        id: Unique note identifier
        user_id: ID of the user who owns this note
        lesson_id: Optional ID of associated lesson
        module_name: Module/category name
        topic: Note topic/subject
        title: Note title
        content: Main note content (supports markdown)
        note_type: Type of note (concept/example/question/etc.)
        priority: Priority level (1-5)
        formatted_content: Pre-formatted content with ANSI codes
        parent_note_id: ID of parent note for hierarchical notes
        code_snippets: List of code snippets
        tags: List of tags for categorization
        created_at: Creation timestamp
        updated_at: Last update timestamp
        is_favorite: Favorite status
        lesson_title: Title of associated lesson (from join)
        relevance_score: Search relevance score (when applicable)
    """
    id: Optional[int] = None
    user_id: int = 0
    lesson_id: Optional[int] = None
    module_name: str = "General"
    topic: str = "Note"
    title: str = ""
    content: str = ""
    note_type: str = "concept"
    priority: int = 2
    formatted_content: Optional[str] = None
    parent_note_id: Optional[int] = None
    code_snippets: List[CodeSnippet] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    is_favorite: bool = False
    lesson_title: Optional[str] = None
    relevance_score: Optional[float] = None

    def __post_init__(self):
        """Initialize computed fields"""
        if not self.title:
            self.title = self.topic or "Untitled"

    @classmethod
    def from_dict(cls, data: Dict) -> 'Note':
        """Create Note from dictionary (database row)

        Args:
            data: Dictionary with note data

        Returns:
            Note instance
        """
        # Handle code snippets
        code_snippets = data.get('code_snippets', [])
        if isinstance(code_snippets, str):
            import json
            code_snippets = json.loads(code_snippets) if code_snippets else []

        # Convert code snippet dicts to CodeSnippet objects
        if code_snippets and isinstance(code_snippets[0], dict):
            code_snippets = [
                CodeSnippet(**snippet) for snippet in code_snippets
            ]

        # Handle tags
        tags = data.get('tags', [])
        if isinstance(tags, str):
            import json
            tags = json.loads(tags) if tags else []

        return cls(
            id=data.get('id'),
            user_id=data.get('user_id', 0),
            lesson_id=data.get('lesson_id'),
            module_name=data.get('module_name', 'General'),
            topic=data.get('topic', 'Note'),
            title=data.get('title', ''),
            content=data.get('content', ''),
            note_type=data.get('note_type', 'concept'),
            priority=data.get('priority', 2),
            formatted_content=data.get('formatted_content'),
            parent_note_id=data.get('parent_note_id'),
            code_snippets=code_snippets,
            tags=tags,
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at'),
            is_favorite=bool(data.get('is_favorite', False)),
            lesson_title=data.get('lesson_title'),
            relevance_score=data.get('relevance_score')
        )

    def to_dict(self) -> Dict:
        """Convert Note to dictionary

        Returns:
            Dictionary representation
        """
        import json

        return {
            'id': self.id,
            'user_id': self.user_id,
            'lesson_id': self.lesson_id,
            'module_name': self.module_name,
            'topic': self.topic,
            'title': self.title,
            'content': self.content,
            'note_type': self.note_type,
            'priority': self.priority,
            'formatted_content': self.formatted_content,
            'parent_note_id': self.parent_note_id,
            'code_snippets': [
                snippet.__dict__ if hasattr(snippet, '__dict__') else snippet
                for snippet in self.code_snippets
            ],
            'tags': self.tags,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'is_favorite': self.is_favorite,
            'lesson_title': self.lesson_title,
            'relevance_score': self.relevance_score
        }


@dataclass
class NoteStatistics:
    """Statistics about notes for a user"""
    total_notes: int = 0
    by_module: Dict[str, int] = field(default_factory=dict)
    recent_notes: int = 0
    favorites: int = 0
    by_type: Dict[str, int] = field(default_factory=dict)
    by_priority: Dict[int, int] = field(default_factory=dict)


@dataclass
class NotePage:
    """Paginated notes result"""
    notes: List[Note]
    total_notes: int
    total_pages: int
    current_page: int
    page_size: int
