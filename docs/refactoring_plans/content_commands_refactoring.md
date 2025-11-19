# Refactoring Plan: content_commands.py

## Current State Analysis

**File:** `/home/user/algorithms_and_data_structures/src/commands/content_commands.py`
**Current Lines:** 1328 lines (2.7x limit)
**Target:** 500 lines (266% reduction required)
**Severity:** High

### Identified Structure

**5 CRUD Commands** following standard pattern:

1. **ContentListCommand** (lines 27-364, ~337 lines) - List with filtering
2. **ContentCreateCommand** (lines 364-730, ~366 lines) - Create content items
3. **ContentShowCommand** (lines 730-927, ~197 lines) - Show content details
4. **ContentUpdateCommand** (lines 927-1194, ~267 lines) - Update content
5. **ContentDeleteCommand** (lines 1194-1328, ~134 lines) - Delete with safety

### Code Smells (Predicted)

Based on established patterns in similar files:
1. **Repository logic embedded in commands** - No data access layer
2. **Validation scattered** - Validation logic in each command
3. **Display mixed with logic** - Presentation not separated
4. **Duplicate argument patterns** - Repeated filtering/sorting args
5. **No reusable components** - Each command is self-contained

---

## Refactoring Strategy

### Core Pattern: CRUD → Repository + Service + Renderer

All content commands share common needs that should be extracted:

### Phase 1: Extract Repository Layer (Priority: CRITICAL)

**New File:** `src/repositories/content_repository.py` (~200 lines)

```python
class ContentRepository(BaseRepository):
    """Data access layer for content management"""

    async def find_by_id(self, content_id: int) -> Optional[Content]: ...
    async def list_content(self, filters: ContentFilters) -> List[Content]: ...
    async def create(self, content_data: ContentCreateData) -> int: ...
    async def update(self, content_id: int, updates: ContentUpdateData) -> None: ...
    async def delete(self, content_id: int) -> None: ...
    async def check_dependencies(self, content_id: int) -> List[str]: ...
    async def get_related_content(self, content_id: int) -> List[Content]: ...
```

**Expected Extraction:**
- ~150 lines from helper methods across all 5 commands
- Centralizes all database operations
- Removes data access from commands

---

### Phase 2: Extract Shared Models & Filters (Priority: HIGH)

**New File:** `src/models/content_filters.py` (~100 lines)

```python
@dataclass
class ContentFilters:
    """Filter criteria for content queries"""
    type: Optional[str] = None  # lesson, exercise, assessment
    curriculum_id: Optional[int] = None
    status: Optional[str] = None  # draft, published, archived
    author: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    difficulty: Optional[str] = None
    search_query: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    sort_by: str = 'created'
    order: str = 'desc'
    limit: Optional[int] = None
```

---

### Phase 3: Extract Validation Service (Priority: HIGH)

**New File:** `src/validators/content_validator.py` (~150 lines)

```python
class ContentValidator:
    """Validate content data"""

    def validate_create_data(self, data: Dict[str, Any]) -> List[str]: ...
    def validate_update_data(self, data: Dict[str, Any]) -> List[str]: ...
    def validate_content_type(self, content_type: str) -> Optional[str]: ...
    def validate_title(self, title: str) -> Optional[str]: ...
    def validate_body(self, body: str) -> Optional[str]: ...
    def validate_metadata(self, metadata: Dict) -> List[str]: ...
    def validate_relationships(self, prerequisites: List[int]) -> List[str]: ...
```

**Expected Extraction:**
- ~80 lines from ContentCreateCommand
- ~60 lines from ContentUpdateCommand
- Reusable validation logic

---

### Phase 4: Extract Content Renderer (Priority: MEDIUM)

**New File:** `src/ui/renderers/content_renderer.py` (~200 lines)

```python
class ContentRenderer:
    """Renders content data in various formats"""

    def render_content_list(self, content_items: List[Content], format: str = 'table') -> None: ...
    def render_content_details(self, content: Content, include_related: bool = False) -> None: ...
    def render_content_preview(self, content_data: Dict) -> None: ...
    def render_deletion_warning(self, content: Content, dependencies: List[str]) -> None: ...
```

**Expected Extraction:**
- ~100 lines from ContentListCommand (display logic)
- ~70 lines from ContentShowCommand
- ~30 lines from ContentDeleteCommand
- Removes all presentation logic from commands

---

### Phase 5: Extract Import/Export Service (Priority: MEDIUM)

**New File:** `src/services/import_export/content_import_export_service.py` (~150 lines)

```python
class ContentImportExportService:
    """Handle content import/export"""

    async def export_content(self, filters: ContentFilters, format: str, output_file: str) -> str: ...
    async def import_content(self, input_file: str, format: str, dry_run: bool = False) -> ImportResult: ...
    def export_to_json(self, content_items: List[Content], output_file: str) -> None: ...
    def export_to_markdown(self, content_items: List[Content], output_dir: str) -> None: ...
    def import_from_json(self, input_file: str) -> List[Dict]: ...
    def import_from_markdown(self, input_dir: str) -> List[Dict]: ...
```

---

### Phase 6: Extract Argument Mixins (Priority: LOW)

**New File:** `src/commands/shared/content_args.py` (~100 lines)

```python
class ContentArgumentMixin:
    """Shared argument patterns for content commands"""

    @staticmethod
    def add_content_filters(parser): ...

    @staticmethod
    def add_content_type_filter(parser): ...

    @staticmethod
    def add_status_filter(parser): ...

    @staticmethod
    def add_sort_options(parser): ...
```

---

## Final File Structure

After refactoring:

```
src/
├── commands/
│   ├── content/
│   │   ├── __init__.py
│   │   ├── content_list_command.py       (80 lines)
│   │   ├── content_create_command.py     (100 lines)
│   │   ├── content_show_command.py       (70 lines)
│   │   ├── content_update_command.py     (90 lines)
│   │   └── content_delete_command.py     (60 lines)
│   └── shared/
│       └── content_args.py                (100 lines)
├── repositories/
│   └── content_repository.py              (200 lines)
├── models/
│   ├── content_filters.py                 (100 lines)
│   └── content.py                         (80 lines) - Enhanced model
├── validators/
│   └── content_validator.py               (150 lines)
├── services/
│   └── import_export/
│       └── content_import_export_service.py (150 lines)
└── ui/
    └── renderers/
        └── content_renderer.py            (200 lines)
```

**Total:** 1,380 lines across 12 files (~115 lines per file avg)

---

## Migration Strategy (5 Days)

1. **Day 1:** Extract ContentRepository
2. **Day 2:** Extract ContentValidator + ContentFilters
3. **Day 3:** Extract ContentRenderer
4. **Day 4:** Extract ImportExportService + ArgumentMixin
5. **Day 5:** Refactor all 5 commands + integration testing

---

## Effort Estimate

| Phase | Hours | Priority |
|-------|-------|----------|
| Repository Layer | 4-5 | CRITICAL |
| Models & Filters | 2-3 | HIGH |
| Validation | 3-4 | HIGH |
| Renderer | 4-5 | MEDIUM |
| Import/Export | 4-5 | MEDIUM |
| Argument Mixins | 2-3 | LOW |
| Command Refactoring | 6-8 | HIGH |
| Testing | 20 | CRITICAL |

**Total: 45-53 hours (6-7 days)**

---

## Success Criteria

✅ All command files under 100 lines
✅ Repository completely separated
✅ Validation centralized and reusable
✅ Presentation layer independent
✅ Import/export reusable across entities
✅ Test coverage ≥85%
✅ No breaking changes to CLI interface

---

## Key Benefits

1. **Reduces duplication** - Repository pattern eliminates repeated data access code
2. **Improves testability** - Each layer independently testable
3. **Enables reuse** - Validator, renderer, import/export usable for other entities
4. **Simplifies commands** - Each command becomes simple orchestration
5. **Maintains separation** - Clear boundaries between layers

---

## Recommended Next Steps

1. **Immediate:** Extract ContentRepository (highest impact)
2. **Short-term:** Extract ContentValidator (prevents duplicate validation)
3. **Medium-term:** Extract ContentRenderer (separates presentation)
4. **Future:** Add versioning system using repository pattern
