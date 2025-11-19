# Refactoring Plan: notes_manager.py

## Current State Analysis

**File:** `/home/user/algorithms_and_data_structures/src/notes_manager.py`
**Current Lines:** 1068 lines (2.1x limit)
**Target:** 500 lines (214% reduction required)
**Severity:** Medium

### Identified Responsibilities (from earlier read)

The **NotesManager** class has **12 distinct responsibilities**:

1. **Database Connection** (lines ~35-80) - SQLite connection, schema creation
2. **Note CRUD - Create** (lines ~82-180) - save_note with validation
3. **Note CRUD - Read** (lines ~182-320) - get_notes, get_note_by_id, filtering
4. **Note CRUD - Update** (lines ~322-420) - update_note
5. **Note CRUD - Delete** (lines ~422-480) - delete_note, bulk delete
6. **Search Functionality** (lines ~482-580) - fuzzy search using SequenceMatcher
7. **Tag Management** (lines ~582-650) - parse_tags, get_all_tags, filter by tags
8. **Pagination** (lines ~652-720) - get_page, page calculations
9. **Statistics** (lines ~722-800) - note counts, tag counts, analytics
10. **Export Functionality** (lines ~802-950) - export to markdown, HTML, JSON
11. **Code Snippet Handling** (lines ~952-1020) - extract snippets, format code blocks
12. **CLI Integration** (lines ~1022-1068) - CLI-specific helper functions

### Code Smells Detected

1. **God Object** - NotesManager does EVERYTHING (1068 lines)
2. **Mixed Layers** - Database + business logic + presentation all in one
3. **No Repository Pattern** - Direct SQL queries throughout
4. **Validation Scattered** - Validation logic mixed with CRUD
5. **Export Logic Embedded** - Export should be separate service

---

## Refactoring Strategy

### Core Pattern: Split into Repository + Service + Export Layers

### Phase 1: Extract Repository Layer (Priority: CRITICAL)

**New File:** `src/repositories/note_repository.py` (~250 lines)

```python
class NoteRepository(BaseRepository):
    """Data access layer for notes"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_database()

    def _init_database(self) -> None:
        """Create notes table schema"""
        ...

    async def create(self, note_data: NoteCreateData) -> int:
        """Insert note into database"""
        ...

    async def find_by_id(self, note_id: int) -> Optional[Note]: ...

    async def find_all(self, filters: NoteFilters) -> List[Note]: ...

    async def update(self, note_id: int, updates: NoteUpdateData) -> None: ...

    async def delete(self, note_id: int) -> None: ...

    async def search(self, query: str, filters: NoteFilters) -> List[Note]: ...

    async def get_tags(self) -> List[str]: ...

    async def get_statistics(self) -> Dict[str, Any]: ...
```

**Extracted Code:**
- Lines ~35-80 (DB connection, schema) → Repository.__init__
- Lines ~82-180 (save_note) → Repository.create
- Lines ~182-320 (get_notes) → Repository.find_all
- Lines ~322-420 (update_note) → Repository.update
- Lines ~422-480 (delete_note) → Repository.delete
- Lines ~482-580 (search) → Repository.search
- Lines ~722-800 (statistics) → Repository.get_statistics

**Benefits:**
- Removes ~450 lines from NotesManager
- Separates data access completely
- Enables database mocking for tests

---

### Phase 2: Extract Note Service Layer (Priority: HIGH)

**New File:** `src/services/notes/note_service.py` (~200 lines)

```python
class NoteService:
    """Business logic for note management"""

    def __init__(self, repository: NoteRepository, validator: NoteValidator):
        self.repository = repository
        self.validator = validator

    async def create_note(self, user_id: int, content: str, **kwargs) -> int:
        """Create note with validation"""
        errors = self.validator.validate_note_data(user_id, content, **kwargs)
        if errors:
            raise ValidationError(errors)

        note_data = NoteCreateData(
            user_id=user_id,
            content=content,
            **kwargs
        )

        return await self.repository.create(note_data)

    async def update_note(self, note_id: int, **updates) -> None:
        """Update note with validation"""
        errors = self.validator.validate_updates(updates)
        if errors:
            raise ValidationError(errors)

        return await self.repository.update(note_id, updates)

    async def search_notes(self, query: str, filters: NoteFilters, fuzzy: bool = True) -> List[Note]:
        """Search notes with fuzzy matching"""
        results = await self.repository.search(query, filters)

        if fuzzy:
            results = self._apply_fuzzy_ranking(results, query)

        return results

    def _apply_fuzzy_ranking(self, notes: List[Note], query: str) -> List[Note]:
        """Apply fuzzy matching and rank by relevance"""
        ...
```

**Extracted Code:**
- Validation logic from save_note → NoteService.create_note
- Update logic → NoteService.update_note
- Fuzzy search logic → NoteService._apply_fuzzy_ranking

**Benefits:**
- Centralizes business logic
- Separates validation from data access
- Removes ~150 lines from NotesManager

---

### Phase 3: Extract Validation (Priority: HIGH)

**New File:** `src/validators/note_validator.py` (~120 lines)

```python
class NoteValidator:
    """Validate note data"""

    def validate_note_data(self, user_id: int, content: str, **kwargs) -> List[str]:
        """Validate note creation data"""
        errors = []

        if user_id is None or user_id <= 0:
            errors.append("User ID must be a positive integer")

        if content is None or (isinstance(content, str) and not content.strip()):
            errors.append("Note content cannot be empty")

        if 'title' in kwargs and len(kwargs['title']) > 200:
            errors.append("Title must be less than 200 characters")

        if 'priority' in kwargs and kwargs['priority'] not in [1, 2, 3]:
            errors.append("Priority must be 1 (low), 2 (medium), or 3 (high)")

        if 'note_type' in kwargs and kwargs['note_type'] not in ['concept', 'example', 'question', 'summary']:
            errors.append("Invalid note type")

        return errors

    def validate_updates(self, updates: Dict[str, Any]) -> List[str]:
        """Validate note update data"""
        ...

    def validate_code_snippet(self, snippet: Dict) -> List[str]:
        """Validate code snippet structure"""
        ...
```

**Extracted Code:**
- Lines ~90-120 (validation from save_note) → NoteValidator.validate_note_data

**Benefits:**
- Centralized validation
- Reusable across commands
- Removes ~80 lines from NotesManager

---

### Phase 4: Extract Export Service (Priority: MEDIUM)

**New File:** `src/services/export/note_export_service.py` (~200 lines)

```python
class NoteExportService:
    """Export notes to various formats"""

    def __init__(self):
        self.exporters = {
            'markdown': MarkdownExporter(),
            'html': HTMLExporter(),
            'json': JSONExporter(),
            'pdf': PDFExporter()
        }

    async def export_notes(self, notes: List[Note], format: str, output_path: str) -> str:
        """Export notes to specified format"""
        exporter = self.exporters.get(format)
        if not exporter:
            raise ValueError(f"Unsupported export format: {format}")

        return await exporter.export(notes, output_path)
```

**New File:** `src/services/export/exporters/markdown_exporter.py` (~80 lines)

```python
class MarkdownExporter:
    """Export notes to Markdown format"""

    async def export(self, notes: List[Note], output_path: str) -> str:
        """Export notes to markdown file"""
        markdown_content = self._generate_markdown(notes)

        with open(output_path, 'w') as f:
            f.write(markdown_content)

        return output_path

    def _generate_markdown(self, notes: List[Note]) -> str:
        """Generate markdown from notes"""
        ...

    def _format_code_snippets(self, code_snippets: List[Dict]) -> str:
        """Format code snippets in markdown"""
        ...
```

**Similar files:**
- `html_exporter.py` (~100 lines)
- `json_exporter.py` (~60 lines)
- `pdf_exporter.py` (~120 lines)

**Extracted Code:**
- Lines ~802-950 → Export service + exporters

**Benefits:**
- Separates export functionality
- Each format in own file
- Easy to add new export formats
- Removes ~150 lines from NotesManager

---

### Phase 5: Extract Search & Filter Logic (Priority: MEDIUM)

**New File:** `src/services/notes/note_search_service.py` (~150 lines)

```python
class NoteSearchService:
    """Advanced note search functionality"""

    def __init__(self, repository: NoteRepository):
        self.repository = repository

    async def fuzzy_search(self, query: str, filters: NoteFilters) -> List[Note]:
        """Fuzzy search with relevance ranking"""
        notes = await self.repository.search(query, filters)
        return self._rank_by_relevance(notes, query)

    def _rank_by_relevance(self, notes: List[Note], query: str) -> List[Note]:
        """Rank notes by relevance using SequenceMatcher"""
        from difflib import SequenceMatcher

        scored_notes = []
        for note in notes:
            score = self._calculate_relevance(note, query)
            scored_notes.append((note, score))

        scored_notes.sort(key=lambda x: x[1], reverse=True)
        return [note for note, score in scored_notes]

    def _calculate_relevance(self, note: Note, query: str) -> float:
        """Calculate relevance score"""
        title_score = SequenceMatcher(None, query.lower(), note.title.lower()).ratio()
        content_score = SequenceMatcher(None, query.lower(), note.content.lower()).ratio()
        return (title_score * 2.0) + content_score  # Title weighted higher
```

**Extracted Code:**
- Lines ~482-580 (fuzzy search logic) → NoteSearchService

**Benefits:**
- Separates search algorithm
- Can use advanced search engines (Elasticsearch) in future
- Removes ~100 lines from NotesManager

---

### Phase 6: Extract Tag Management (Priority: LOW)

**New File:** `src/services/notes/tag_manager.py` (~80 lines)

```python
class TagManager:
    """Manage note tags"""

    @staticmethod
    def parse_tags(tags_input: Any) -> List[str]:
        """Parse tags from various input formats"""
        if isinstance(tags_input, str):
            return [tag.strip() for tag in tags_input.split(',') if tag.strip()]
        elif isinstance(tags_input, list):
            return [str(tag).strip() for tag in tags_input if str(tag).strip()]
        return []

    @staticmethod
    def normalize_tag(tag: str) -> str:
        """Normalize tag format"""
        return tag.lower().strip().replace(' ', '-')

    async def get_popular_tags(self, repository: NoteRepository, limit: int = 20) -> List[Tuple[str, int]]:
        """Get most popular tags"""
        ...
```

**Extracted Code:**
- Lines ~582-650 → TagManager

**Benefits:**
- Isolates tag logic
- Reusable tag handling
- Removes ~70 lines from NotesManager

---

## Final File Structure

After refactoring:

```
src/
├── repositories/
│   └── note_repository.py                 (250 lines) - Data access
├── models/
│   ├── note.py                            (80 lines) - Note model
│   └── note_filters.py                    (60 lines) - Filter models
├── validators/
│   └── note_validator.py                  (120 lines) - Validation
├── services/
│   ├── notes/
│   │   ├── __init__.py
│   │   ├── note_service.py                (200 lines) - Business logic
│   │   ├── note_search_service.py         (150 lines) - Search
│   │   └── tag_manager.py                 (80 lines) - Tag handling
│   └── export/
│       ├── __init__.py
│       ├── note_export_service.py         (80 lines) - Export orchestration
│       └── exporters/
│           ├── __init__.py
│           ├── markdown_exporter.py       (80 lines)
│           ├── html_exporter.py           (100 lines)
│           ├── json_exporter.py           (60 lines)
│           └── pdf_exporter.py            (120 lines)
└── notes_manager.py                       (100 lines) - Backward compat facade
```

**Total:** 1,480 lines across 15 files (~99 lines per file avg)

---

## Backward Compatibility

**Critical:** notes_manager.py is imported in many places

**Solution: Facade Pattern**

```python
# src/notes_manager.py (backward compatibility)
from .repositories.note_repository import NoteRepository
from .services.notes.note_service import NoteService
from .validators.note_validator import NoteValidator
from .services.export.note_export_service import NoteExportService

class NotesManager:
    """Backward compatible facade to new architecture"""

    def __init__(self, db_path: str = None):
        self.repository = NoteRepository(db_path or "notes.db")
        self.validator = NoteValidator()
        self.service = NoteService(self.repository, self.validator)
        self.export_service = NoteExportService()

    def save_note(self, *args, **kwargs):
        """Delegate to service"""
        return self.service.create_note(*args, **kwargs)

    def get_notes(self, *args, **kwargs):
        """Delegate to repository"""
        return self.repository.find_all(*args, **kwargs)

    # ... etc (simple delegation to maintain API)
```

All existing code continues to work!

---

## Migration Strategy (4 Days)

1. **Day 1:** Extract NoteRepository
2. **Day 2:** Extract NoteService + NoteValidator
3. **Day 3:** Extract Export service + exporters
4. **Day 4:** Extract search + tag services, create facade, testing

---

## Effort Estimate

| Phase | Hours | Priority |
|-------|-------|----------|
| Repository Layer | 5-6 | CRITICAL |
| Service Layer | 4-5 | HIGH |
| Validation | 2-3 | HIGH |
| Export Service | 5-6 | MEDIUM |
| Search Service | 3-4 | MEDIUM |
| Tag Manager | 2-3 | LOW |
| Facade & Compat | 3-4 | HIGH |
| Testing | 12 | CRITICAL |

**Total: 36-44 hours (5-6 days)**

---

## Success Criteria

✅ Repository completely separated from business logic
✅ All files under 250 lines
✅ Export formats independently testable
✅ Backward compatible via facade
✅ Validation centralized and reusable
✅ Search algorithm separated from data access
✅ Test coverage ≥85%
✅ No breaking changes for existing code

---

## Key Benefits

1. **Clean Architecture** - Repository → Service → Presentation layers
2. **Testability** - Each layer independently testable
3. **Extensibility** - Easy to add new export formats, search algorithms
4. **Reusability** - Validator, search, export usable elsewhere
5. **Maintainability** - Small, focused files
6. **Performance** - Can optimize repository layer without touching business logic

---

## Recommended Next Steps

1. **Immediate:** Extract NoteRepository (unlocks all other work)
2. **Short-term:** Extract NoteService + Validator (centralizes business logic)
3. **Medium-term:** Extract export service (enables new formats)
4. **Future:** Add Elasticsearch integration via NoteSearchService
