# Refactoring Plan: curriculum_commands.py

## Current State Analysis

**File:** `/home/user/algorithms_and_data_structures/src/commands/curriculum_commands.py`
**Current Lines:** 1223 lines (2.4x limit)
**Target:** 500 lines (244% reduction required)
**Severity:** Medium-High

### Identified Structure

**5 CRUD Commands** following standard pattern:

1. **CurriculumListCommand** (lines 28-267, ~239 lines) - List curricula with filtering
2. **CurriculumCreateCommand** (lines 267-556, ~289 lines) - Create curriculum
3. **CurriculumShowCommand** (lines 556-781, ~225 lines) - Show curriculum details
4. **CurriculumUpdateCommand** (lines 781-1039, ~258 lines) - Update curriculum
5. **CurriculumDeleteCommand** (lines 1039-1223, ~184 lines) - Delete with cascade checks

---

## Refactoring Strategy

### Same Pattern as Content Commands

This file follows IDENTICAL patterns to content_commands.py. Apply the same refactoring strategy.

### Phase 1: Extract Repository Layer (Priority: CRITICAL)

**New File:** `src/repositories/curriculum_repository.py` (~200 lines)

```python
class CurriculumRepository(BaseRepository):
    """Data access layer for curriculum management"""

    async def find_by_id(self, curriculum_id: int) -> Optional[Curriculum]: ...
    async def list_curricula(self, filters: CurriculumFilters) -> List[Curriculum]: ...
    async def create(self, curriculum_data: CurriculumCreateData) -> int: ...
    async def update(self, curriculum_id: int, updates: CurriculumUpdateData) -> None: ...
    async def delete(self, curriculum_id: int, cascade: bool = False) -> None: ...
    async def check_dependencies(self, curriculum_id: int) -> Dict[str, List[Any]]: ...
    async def get_modules(self, curriculum_id: int) -> List[Module]: ...
    async def get_enrolled_students(self, curriculum_id: int) -> List[User]: ...
```

---

### Phase 2: Extract Models & Filters (Priority: HIGH)

**New File:** `src/models/curriculum_filters.py` (~100 lines)

```python
@dataclass
class CurriculumFilters:
    """Filter criteria for curriculum queries"""
    status: Optional[str] = None  # draft, published, archived
    author: Optional[int] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    search_query: Optional[str] = None
    has_prerequisites: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    sort_by: str = 'created'
    order: str = 'desc'
    limit: Optional[int] = None
    include_modules: bool = False
    include_stats: bool = False
```

---

### Phase 3: Extract Validation Service (Priority: HIGH)

**New File:** `src/validators/curriculum_validator.py` (~150 lines)

```python
class CurriculumValidator:
    """Validate curriculum data"""

    def validate_create_data(self, data: Dict[str, Any]) -> List[str]: ...
    def validate_update_data(self, data: Dict[str, Any]) -> List[str]: ...
    def validate_title(self, title: str) -> Optional[str]: ...
    def validate_description(self, description: str) -> Optional[str]: ...
    def validate_difficulty(self, difficulty: str) -> Optional[str]: ...
    def validate_prerequisites(self, prerequisites: List[int]) -> List[str]: ...
    def validate_module_structure(self, modules: List[Dict]) -> List[str]: ...
```

---

### Phase 4: Extract Curriculum Renderer (Priority: MEDIUM)

**New File:** `src/ui/renderers/curriculum_renderer.py` (~200 lines)

```python
class CurriculumRenderer:
    """Renders curriculum data"""

    def render_curriculum_list(self, curricula: List[Curriculum], include_stats: bool = False) -> None: ...
    def render_curriculum_details(self, curriculum: Curriculum, include_modules: bool = False) -> None: ...
    def render_module_tree(self, modules: List[Module], indent: int = 0) -> None: ...
    def render_enrollment_stats(self, stats: Dict[str, Any]) -> None: ...
    def render_deletion_warning(self, curriculum: Curriculum, dependencies: Dict) -> None: ...
```

---

### Phase 5: Extract Curriculum Service (Priority: MEDIUM)

**New File:** `src/services/curriculum/curriculum_service.py` (~150 lines)

```python
class CurriculumService:
    """Business logic for curriculum management"""

    def __init__(self, repository: CurriculumRepository, validator: CurriculumValidator):
        self.repository = repository
        self.validator = validator

    async def create_curriculum_with_modules(self, curriculum_data: Dict, modules: List[Dict]) -> int: ...
    async def clone_curriculum(self, curriculum_id: int, new_title: str) -> int: ...
    async def publish_curriculum(self, curriculum_id: int) -> None: ...
    async def archive_curriculum(self, curriculum_id: int) -> None: ...
    async def get_completion_stats(self, curriculum_id: int) -> Dict: ...
```

---

### Phase 6: Extract Argument Mixins (Priority: LOW)

**New File:** `src/commands/shared/curriculum_args.py` (~80 lines)

```python
class CurriculumArgumentMixin:
    """Shared argument patterns for curriculum commands"""

    @staticmethod
    def add_curriculum_filters(parser): ...

    @staticmethod
    def add_status_filter(parser): ...

    @staticmethod
    def add_difficulty_filter(parser): ...

    @staticmethod
    def add_sort_options(parser): ...
```

---

## Final File Structure

After refactoring:

```
src/
├── commands/
│   ├── curriculum/
│   │   ├── __init__.py
│   │   ├── curriculum_list_command.py    (70 lines)
│   │   ├── curriculum_create_command.py  (90 lines)
│   │   ├── curriculum_show_command.py    (70 lines)
│   │   ├── curriculum_update_command.py  (80 lines)
│   │   └── curriculum_delete_command.py  (70 lines)
│   └── shared/
│       └── curriculum_args.py             (80 lines)
├── repositories/
│   └── curriculum_repository.py           (200 lines)
├── models/
│   ├── curriculum_filters.py              (100 lines)
│   └── curriculum.py                      (100 lines) - Enhanced model
├── validators/
│   └── curriculum_validator.py            (150 lines)
├── services/
│   └── curriculum/
│       └── curriculum_service.py          (150 lines)
└── ui/
    └── renderers/
        └── curriculum_renderer.py         (200 lines)
```

**Total:** 1,360 lines across 12 files (~113 lines per file avg)

---

## Migration Strategy (4 Days)

1. **Day 1:** Extract CurriculumRepository
2. **Day 2:** Extract CurriculumValidator + CurriculumFilters + CurriculumService
3. **Day 3:** Extract CurriculumRenderer + ArgumentMixin
4. **Day 4:** Refactor all 5 commands + integration testing

---

## Effort Estimate

| Phase | Hours | Priority |
|-------|-------|----------|
| Repository Layer | 4-5 | CRITICAL |
| Models & Filters | 2-3 | HIGH |
| Validation | 3-4 | HIGH |
| Service Layer | 3-4 | MEDIUM |
| Renderer | 4-5 | MEDIUM |
| Argument Mixins | 2-3 | LOW |
| Command Refactoring | 5-7 | HIGH |
| Testing | 18 | CRITICAL |

**Total: 41-51 hours (5-6 days)**

---

## Success Criteria

✅ All command files under 100 lines
✅ Repository completely separated
✅ Service layer handles complex curriculum operations
✅ Validation centralized
✅ Presentation layer independent
✅ Test coverage ≥85%
✅ No breaking changes to CLI interface

---

## Key Differences from Content Commands

1. **Module Management** - Curricula contain modules (hierarchical structure)
2. **Enrollment Tracking** - Need to track student enrollments
3. **Cascade Deletion** - Deleting curriculum affects modules and progress
4. **Cloning** - Support curriculum cloning/duplication
5. **Publishing Workflow** - Draft → Published → Archived lifecycle

---

## Recommended Next Steps

1. **Immediate:** Extract CurriculumRepository (enables parallel work)
2. **Short-term:** Extract CurriculumService (handles complex operations like cloning)
3. **Medium-term:** Extract CurriculumRenderer + Validator
4. **Future:** Add curriculum templating system
