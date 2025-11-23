# Refactoring File Structure - Visual Reference

**Complete directory structure for refactored codebase**

---

## Current Structure (BEFORE)

```
src/
├── commands/
│   ├── base.py
│   ├── admin_commands.py          ❌ 1,478 lines
│   ├── content_commands.py        ❌ 1,328 lines
│   ├── curriculum_commands.py     ❌ 1,223 lines
│   ├── progress_commands.py       ❌ 1,584 lines
│   └── search_commands.py         ❌ 1,397 lines
├── ui/
│   ├── enhanced_interactive.py    ❌ 1,665 lines
│   ├── interactive.py             ❌ 1,133 lines
│   └── unified_formatter.py       ❌ 1,069 lines
└── notes_manager.py               ❌ 1,068 lines

Total: 9 files with 11,945 lines of technical debt
```

---

## Target Structure (AFTER)

```
src/
├── commands/                           # Command Layer
│   ├── base.py                        # ✅ Base command classes (existing)
│   │
│   ├── curriculum/                    # ✅ Curriculum commands (5 files)
│   │   ├── __init__.py               # Package exports
│   │   ├── list.py                   # 240 lines - CurriculumListCommand
│   │   ├── create.py                 # 280 lines - CurriculumCreateCommand
│   │   ├── show.py                   # 220 lines - CurriculumShowCommand
│   │   ├── update.py                 # 260 lines - CurriculumUpdateCommand
│   │   └── delete.py                 # 220 lines - CurriculumDeleteCommand
│   │
│   ├── content/                       # ✅ Content commands (5 files)
│   │   ├── __init__.py
│   │   ├── list.py                   # 260 lines - ContentListCommand
│   │   ├── create.py                 # 300 lines - ContentCreateCommand
│   │   ├── update.py                 # 280 lines - ContentUpdateCommand
│   │   ├── delete.py                 # 240 lines - ContentDeleteCommand
│   │   └── validate.py               # 240 lines - ContentValidateCommand
│   │
│   ├── progress/                      # ✅ Progress commands (4 files)
│   │   ├── __init__.py
│   │   ├── list.py                   # 380 lines - ProgressListCommand
│   │   ├── show.py                   # 380 lines - ProgressShowCommand
│   │   ├── track.py                  # 420 lines - ProgressTrackCommand
│   │   └── analytics.py              # 400 lines - ProgressAnalyticsCommand
│   │
│   ├── admin/                         # ✅ Admin commands (3 files)
│   │   ├── __init__.py
│   │   ├── user_management.py        # 490 lines - UserManagementCommand
│   │   ├── system_config.py          # 480 lines - SystemConfigCommand
│   │   └── health.py                 # 480 lines - SystemHealthCommand
│   │
│   ├── search/                        # ✅ Search commands (3 files)
│   │   ├── __init__.py
│   │   ├── search.py                 # 460 lines - SearchCommand
│   │   ├── saved_searches.py         # 460 lines - SavedSearchCommand
│   │   └── analytics.py              # 460 lines - SearchAnalyticsCommand
│   │
│   └── utils/                         # ✅ NEW: Command utilities (3 files)
│       ├── __init__.py
│       ├── validators.py             # 200 lines - Input validation
│       ├── formatters.py             # 250 lines - Output formatting
│       └── parsers.py                # 150 lines - Argument parsing
│
├── ui/                                # UI Layer
│   ├── components/                    # ✅ NEW: Reusable UI components (5 files)
│   │   ├── __init__.py
│   │   ├── menus.py                  # 300 lines - MenuRenderer
│   │   ├── progress_bars.py          # 200 lines - ProgressBarRenderer
│   │   ├── tables.py                 # 250 lines - TableRenderer
│   │   ├── panels.py                 # 200 lines - PanelRenderer
│   │   └── prompts.py                # 300 lines - Input prompts
│   │
│   ├── formatters/                    # ✅ NEW: Formatting system (6 files)
│   │   ├── __init__.py
│   │   ├── base.py                   # 150 lines - BaseFormatter interface
│   │   ├── color.py                  # 250 lines - Color/theme system
│   │   ├── platform.py               # 200 lines - Platform detection
│   │   ├── renderers.py              # 300 lines - Rendering pipeline
│   │   └── cache.py                  # 150 lines - Formatting cache
│   │
│   ├── session/                       # ✅ NEW: Session management (6 files)
│   │   ├── __init__.py
│   │   ├── base_session.py           # 200 lines - Base session class
│   │   ├── learning_session.py       # 400 lines - Learning mode
│   │   ├── quiz_session.py           # 350 lines - Quiz mode
│   │   ├── notes_session.py          # 350 lines - Notes mode
│   │   └── state.py                  # 150 lines - Session state
│   │
│   ├── interactive.py                 # ✅ REFACTORED: 200 lines (entry point)
│   ├── enhanced_interactive.py        # ✅ REFACTORED: 200 lines (coordinator)
│   └── unified_formatter.py           # ✅ REFACTORED: 200 lines (main entry)
│
├── services/                          # ✅ NEW: Service Layer (business logic)
│   ├── __init__.py
│   ├── notes_service.py              # 400 lines - Note operations
│   ├── progress_service.py           # TBD - Progress tracking
│   ├── search_service.py             # TBD - Search operations
│   └── analytics_service.py          # TBD - Analytics calculations
│
├── persistence/                       # Data Access Layer
│   ├── repositories/                  # ✅ NEW: Repository pattern
│   │   ├── __init__.py
│   │   ├── base.py                   # 200 lines - BaseRepository[T]
│   │   ├── notes_repo.py             # 400 lines - Notes data access
│   │   ├── progress_repo.py          # TBD - Progress data access
│   │   └── curriculum_repo.py        # TBD - Curriculum data access
│   │
│   └── models/                        # Domain models
│       ├── __init__.py
│       └── notes.py                  # 200 lines - Note models
│
├── models/                            # Existing models
│   ├── base.py
│   ├── curriculum.py
│   ├── content.py
│   ├── progress.py
│   └── user.py
│
├── core/                              # Existing core
│   ├── curriculum.py
│   ├── progress.py
│   └── exceptions.py
│
└── utils/                             # Existing utilities
    ├── config_manager.py
    ├── validators.py
    └── helpers.py

Total: 49 modular files (avg 243 lines per file)
```

---

## File Size Distribution

### Commands Layer (23 files)

```
curriculum/
  list.py          ████████████████░░░░  240 lines  ✓
  create.py        ██████████████████░░  280 lines  ✓
  show.py          ███████████████░░░░░  220 lines  ✓
  update.py        █████████████████░░░  260 lines  ✓
  delete.py        ███████████████░░░░░  220 lines  ✓

content/
  list.py          █████████████████░░░  260 lines  ✓
  create.py        ████████████████████  300 lines  ✓
  update.py        ██████████████████░░  280 lines  ✓
  delete.py        ████████████████░░░░  240 lines  ✓
  validate.py      ████████████████░░░░  240 lines  ✓

progress/
  list.py          ████████████████████  380 lines  ✓
  show.py          ████████████████████  380 lines  ✓
  track.py         ████████████████████  420 lines  ✓
  analytics.py     ████████████████████  400 lines  ✓

admin/
  user_mgmt.py     ████████████████████  490 lines  ✓
  sys_config.py    ████████████████████  480 lines  ✓
  health.py        ████████████████████  480 lines  ✓

search/
  search.py        ████████████████████  460 lines  ✓
  saved.py         ████████████████████  460 lines  ✓
  analytics.py     ████████████████████  460 lines  ✓

utils/
  validators.py    ████████████░░░░░░░░  200 lines  ✓
  formatters.py    █████████████░░░░░░░  250 lines  ✓
  parsers.py       ██████████░░░░░░░░░░  150 lines  ✓
```

### UI Layer (23 files)

```
components/
  menus.py         ████████████████████  300 lines  ✓
  progress.py      ████████████░░░░░░░░  200 lines  ✓
  tables.py        █████████████░░░░░░░  250 lines  ✓
  panels.py        ████████████░░░░░░░░  200 lines  ✓
  prompts.py       ████████████████████  300 lines  ✓

formatters/
  base.py          ██████████░░░░░░░░░░  150 lines  ✓
  color.py         █████████████░░░░░░░  250 lines  ✓
  platform.py      ████████████░░░░░░░░  200 lines  ✓
  renderers.py     ████████████████████  300 lines  ✓
  cache.py         ██████████░░░░░░░░░░  150 lines  ✓

session/
  base.py          ████████████░░░░░░░░  200 lines  ✓
  learning.py      ████████████████████  400 lines  ✓
  quiz.py          ██████████████████░░  350 lines  ✓
  notes.py         ██████████████████░░  350 lines  ✓
  state.py         ██████████░░░░░░░░░░  150 lines  ✓

Entry points:
  interactive.py   ████████████░░░░░░░░  200 lines  ✓
  enhanced_int.py  ████████████░░░░░░░░  200 lines  ✓
  unified_fmt.py   ████████████░░░░░░░░  200 lines  ✓
```

### Service Layer (3 files)

```
services/
  notes.py         ████████████████████  400 lines  ✓
  progress.py      TBD
  search.py        TBD
  analytics.py     TBD

repositories/
  base.py          ████████████░░░░░░░░  200 lines  ✓
  notes.py         ████████████████████  400 lines  ✓
  progress.py      TBD
  curriculum.py    TBD

models/
  notes.py         ████████████░░░░░░░░  200 lines  ✓
```

**Legend**: ░ = 50 lines, █ = 50 lines (filled)

---

## Dependency Flow

```
┌─────────────────────────────────────────────────────────────┐
│  COMMANDS LAYER                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ curriculum/ │  │  content/   │  │  progress/  │        │
│  │ admin/      │  │  search/    │  │   utils/    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                 │                 │                │
│         └─────────────────┴─────────────────┘                │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              SERVICES LAYER                          │   │
│  │  notes_service, progress_service, search_service     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            REPOSITORIES LAYER                        │   │
│  │  notes_repo, progress_repo, curriculum_repo          │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              MODELS LAYER                            │   │
│  │  Note, Progress, Curriculum, Content                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  UI LAYER                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ components/ │  │ formatters/ │  │  session/   │        │
│  │ menus       │  │ color       │  │ learning    │        │
│  │ tables      │  │ renderers   │  │ quiz        │        │
│  │ prompts     │  │ platform    │  │ notes       │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                 │                 │                │
│         └─────────────────┴─────────────────┘                │
│                           │                                  │
│                           ▼                                  │
│                    SERVICES LAYER                            │
│              (UI coordinates via services)                   │
└─────────────────────────────────────────────────────────────┘

NO CIRCULAR DEPENDENCIES
NO CROSS-LAYER VIOLATIONS
```

---

## Import Path Changes

### Before (Monolithic)

```python
# Old imports
from src.commands.curriculum_commands import (
    CurriculumListCommand,
    CurriculumCreateCommand,
    CurriculumShowCommand,
    CurriculumUpdateCommand,
    CurriculumDeleteCommand
)

from src.ui.enhanced_interactive import EnhancedInteractiveSession
from src.notes_manager import NotesManager
```

### After (Modular)

```python
# New imports - cleaner, more specific
from src.commands.curriculum import (
    CurriculumListCommand,
    CurriculumCreateCommand,
    CurriculumShowCommand,
    CurriculumUpdateCommand,
    CurriculumDeleteCommand
)

from src.ui.session import LearningSession, QuizSession
from src.services.notes_service import NotesService
from src.persistence.repositories.notes_repo import NotesRepository
```

### Backwards Compatibility (Transition Period)

```python
# Deprecated wrappers maintained for compatibility
from src.notes_manager import NotesManager  # Still works, shows warning
from src.ui.enhanced_interactive import EnhancedInteractiveSession  # Wrapper

# Warnings guide users to new imports
# DeprecationWarning: Use NotesService instead of NotesManager
```

---

## Migration Checklist

### Phase 1: Utilities ✓
- [ ] Create `commands/utils/` with 3 files
- [ ] Create `ui/components/` with 5 files
- [ ] Create `ui/formatters/` with 6 files
- [ ] All tests passing

### Phase 2: Base Classes ✓
- [ ] Create `persistence/repositories/base.py`
- [ ] Create `ui/session/base_session.py`
- [ ] Create `ui/formatters/base.py`
- [ ] All tests passing

### Phase 3: Split Files ✓
- [ ] Split notes_manager.py → 3 files
- [ ] Split unified_formatter.py → 6 files
- [ ] Split enhanced_interactive.py → 6 files
- [ ] Split interactive.py → reuse session/
- [ ] Split curriculum_commands.py → 5 files
- [ ] Split content_commands.py → 5 files
- [ ] Split progress_commands.py → 4 files
- [ ] Split admin_commands.py → 3 files
- [ ] Split search_commands.py → 3 files
- [ ] All tests passing

### Phase 4: Tests ✓
- [ ] Reorganize test structure
- [ ] Update all imports
- [ ] Create new module tests
- [ ] Coverage ≥80%

### Phase 5: Integration ✓
- [ ] E2E testing
- [ ] Remove deprecated files
- [ ] Production deployment

---

## Related Documentation

- **Full Architecture**: `/home/user/algorithms_and_data_structures/docs/REFACTORING_ARCHITECTURE.md`
- **Executive Summary**: `/home/user/algorithms_and_data_structures/docs/REFACTORING_SUMMARY.md`
- **File Structure** (this doc): `/home/user/algorithms_and_data_structures/docs/REFACTORING_FILE_STRUCTURE.md`

---

**Last Updated**: 2025-11-19
**Version**: 1.0.0
**Status**: Reference Document
