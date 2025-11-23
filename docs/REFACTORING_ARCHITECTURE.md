# Refactoring Architecture Design
## Technical Debt Resolution - File Size Violations

**Version**: 1.0.0
**Date**: 2025-11-19
**Author**: System Architecture Designer
**Status**: Design Phase

---

## Executive Summary

This document outlines the comprehensive architecture for refactoring 9 large files (11,945 total lines) that violate the 500-line limit. The refactoring will maintain 100% test pass rate, ensure backwards compatibility, and follow SOLID principles while creating a more maintainable, modular codebase.

### Target Files

| File | Lines | Violation | Primary Issue |
|------|-------|-----------|---------------|
| `src/ui/enhanced_interactive.py` | 1,665 | 233% over | God Class - single class with 50+ methods |
| `src/commands/progress_commands.py` | 1,584 | 217% over | Multiple command classes in one file |
| `src/commands/admin_commands.py` | 1,478 | 196% over | Multiple command classes in one file |
| `src/commands/search_commands.py` | 1,397 | 179% over | Multiple command classes in one file |
| `src/commands/content_commands.py` | 1,328 | 166% over | Multiple command classes in one file |
| `src/commands/curriculum_commands.py` | 1,223 | 145% over | Multiple command classes in one file |
| `src/ui/interactive.py` | 1,133 | 127% over | Large session management class |
| `src/ui/unified_formatter.py` | 1,069 | 114% over | Complex rendering pipeline |
| `src/notes_manager.py` | 1,068 | 114% over | Repository + Service + Business logic |

**Total Debt**: 11,945 lines across 9 files
**Target**: 24-30 well-structured files (400-500 lines each)

---

## 1. Overall Architecture Strategy

### 1.1 Core Principles

**SOLID Compliance**:
- **S**ingle Responsibility: Each class/module has ONE reason to change
- **O**pen/Closed: Open for extension via inheritance/plugins, closed for modification
- **L**iskov Substitution: All subclasses fully substitutable for base classes
- **I**nterface Segregation: Specific interfaces, not monolithic ones
- **D**ependency Inversion: Depend on abstractions, inject dependencies

**Design Patterns**:
- Command Pattern for CLI operations
- Repository Pattern for data access
- Service Layer for business logic orchestration
- Factory Pattern for complex object creation
- Component Pattern for UI elements
- Strategy Pattern for varying behaviors

**Quality Gates**:
- Files ≤500 lines (strict)
- Methods ≤50 lines (guideline)
- Cyclomatic complexity ≤10
- Test coverage ≥80%
- No circular dependencies
- Type hints on all signatures

### 1.2 Module Boundaries

```
src/
├── commands/                    # Command Layer (CLI operations)
│   ├── base.py                 # Base command classes [EXISTING]
│   ├── curriculum/             # Curriculum commands [NEW]
│   │   ├── __init__.py
│   │   ├── list.py            # CurriculumListCommand
│   │   ├── create.py          # CurriculumCreateCommand
│   │   ├── show.py            # CurriculumShowCommand
│   │   ├── update.py          # CurriculumUpdateCommand
│   │   └── delete.py          # CurriculumDeleteCommand
│   ├── content/               # Content commands [NEW]
│   │   ├── __init__.py
│   │   ├── list.py
│   │   ├── create.py
│   │   ├── update.py
│   │   └── delete.py
│   ├── progress/              # Progress commands [NEW]
│   │   ├── __init__.py
│   │   ├── list.py
│   │   ├── show.py
│   │   ├── track.py
│   │   └── analytics.py
│   ├── admin/                 # Admin commands [NEW]
│   │   ├── __init__.py
│   │   ├── user_management.py
│   │   ├── system_config.py
│   │   └── health.py
│   ├── search/                # Search commands [NEW]
│   │   ├── __init__.py
│   │   ├── search.py
│   │   ├── saved_searches.py
│   │   └── analytics.py
│   └── utils/                 # Command utilities [NEW]
│       ├── __init__.py
│       ├── validators.py      # Input validation
│       ├── formatters.py      # Output formatting helpers
│       └── parsers.py         # Argument parsing utilities
│
├── ui/                        # UI Layer (Terminal interface)
│   ├── components/            # Reusable UI components [NEW]
│   │   ├── __init__.py
│   │   ├── menus.py          # Menu rendering
│   │   ├── progress_bars.py  # Progress visualization
│   │   ├── tables.py         # Table formatting
│   │   ├── panels.py         # Panel/box components
│   │   └── prompts.py        # User input prompts
│   ├── formatters/            # Formatting system [NEW]
│   │   ├── __init__.py
│   │   ├── base.py           # Base formatter
│   │   ├── color.py          # Color/theme system
│   │   ├── platform.py       # Platform detection
│   │   ├── renderers.py      # Rendering pipeline
│   │   └── cache.py          # Formatting cache
│   ├── session/               # Session management [NEW]
│   │   ├── __init__.py
│   │   ├── base_session.py   # Base session class
│   │   ├── learning_session.py  # Learning mode
│   │   ├── quiz_session.py   # Quiz mode
│   │   ├── notes_session.py  # Notes mode
│   │   └── state.py          # Session state management
│   ├── interactive.py         # Main interactive entry [REFACTOR]
│   ├── enhanced_interactive.py # Enhanced entry [REFACTOR]
│   └── unified_formatter.py   # Unified formatter [REFACTOR]
│
├── services/                  # Service Layer (Business logic) [NEW]
│   ├── __init__.py
│   ├── notes_service.py      # Note operations
│   ├── progress_service.py   # Progress tracking
│   ├── search_service.py     # Search operations
│   └── analytics_service.py  # Analytics calculations
│
├── persistence/               # Data Layer [NEW]
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py           # Base repository
│   │   ├── notes_repo.py     # Notes data access
│   │   ├── progress_repo.py  # Progress data access
│   │   └── curriculum_repo.py
│   └── models/               # Data models
│       └── notes.py          # Note models
│
└── utils/                     # Utilities [EXISTING]
    ├── validators.py
    └── helpers.py
```

### 1.3 Dependency Flow

```
Commands Layer
    ↓ (uses)
Services Layer
    ↓ (uses)
Repositories Layer
    ↓ (uses)
Models Layer

UI Layer → Services Layer
UI Components ← UI Session

NO circular dependencies
NO cross-layer violations
```

---

## 2. Command Layer Refactoring (5 files, ~6,000 lines)

### 2.1 Problem Analysis

**Current Issues**:
- Multiple command classes in single file (3-5 classes per file)
- Duplicated validation logic across commands
- Duplicated formatting logic
- Duplicated argument parsing patterns
- No shared utilities

**Files to Refactor**:
1. `curriculum_commands.py` (1,223 lines) → 5 files (~240 lines each)
2. `content_commands.py` (1,328 lines) → 5 files (~260 lines each)
3. `progress_commands.py` (1,584 lines) → 4 files (~400 lines each)
4. `admin_commands.py` (1,478 lines) → 3 files (~490 lines each)
5. `search_commands.py` (1,397 lines) → 3 files (~460 lines each)

### 2.2 Refactoring Strategy

**Step 1: Create Command Utilities Module** (`commands/utils/`)

Extract common patterns into reusable utilities:

```python
# commands/utils/validators.py
"""Command input validation utilities"""

from typing import Any, Optional
from ..core.exceptions import ValidationError

class CommandValidator:
    """Shared validation logic for commands"""

    @staticmethod
    def validate_id(value: Any, entity_type: str) -> int:
        """Validate entity ID"""
        if not isinstance(value, int) or value <= 0:
            raise ValidationError(f"Invalid {entity_type} ID: {value}")
        return value

    @staticmethod
    def validate_status(value: str, allowed: list) -> str:
        """Validate status value"""
        if value not in allowed:
            raise ValidationError(f"Invalid status. Allowed: {allowed}")
        return value

    @staticmethod
    def validate_date(date_str: str) -> datetime:
        """Validate and parse date string"""
        try:
            return datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            raise ValidationError(f"Invalid date format: {date_str}")
```

```python
# commands/utils/formatters.py
"""Command output formatting utilities"""

from typing import List, Dict, Any
from ...ui.formatter import TerminalFormatter

class CommandOutputFormatter:
    """Shared output formatting for commands"""

    def __init__(self, formatter: TerminalFormatter):
        self.formatter = formatter

    def format_list_output(
        self,
        items: List[Dict],
        columns: List[str],
        format_type: str = 'table'
    ) -> str:
        """Format list of items for output"""
        if format_type == 'json':
            return self._format_json(items)
        elif format_type == 'table':
            return self._format_table(items, columns)
        else:
            return self._format_summary(items)

    def _format_table(self, items: List[Dict], columns: List[str]) -> str:
        """Format as table"""
        # Implementation
        pass

    def _format_json(self, items: List[Dict]) -> str:
        """Format as JSON"""
        import json
        return json.dumps(items, indent=2)
```

```python
# commands/utils/parsers.py
"""Argument parsing utilities"""

import argparse
from typing import Callable

class CommandParserBuilder:
    """Builder for common argument patterns"""

    @staticmethod
    def add_filtering_args(parser: argparse.ArgumentParser):
        """Add common filtering arguments"""
        parser.add_argument('--status', help='Filter by status')
        parser.add_argument('--tag', action='append', help='Filter by tags')
        parser.add_argument('--difficulty', help='Filter by difficulty')

    @staticmethod
    def add_sorting_args(parser: argparse.ArgumentParser):
        """Add common sorting arguments"""
        parser.add_argument('--sort', help='Sort field')
        parser.add_argument('--order', choices=['asc', 'desc'], default='asc')

    @staticmethod
    def add_output_args(parser: argparse.ArgumentParser):
        """Add common output arguments"""
        parser.add_argument(
            '--format',
            choices=['table', 'json', 'summary'],
            default='table'
        )
        parser.add_argument('--limit', type=int, help='Limit results')
```

**Step 2: Split Command Classes into Individual Files**

Each command class gets its own file:

```python
# commands/curriculum/list.py
"""Curriculum list command"""

from ..base import BaseCommand, CommandResult, CommandMetadata, CommandCategory
from ..utils.validators import CommandValidator
from ..utils.formatters import CommandOutputFormatter
from ..utils.parsers import CommandParserBuilder

class CurriculumListCommand(BaseCommand):
    """List all curricula with filtering and sorting"""

    def __init__(self, curriculum_service):
        """Initialize with injected service"""
        super().__init__()
        self.curriculum_service = curriculum_service
        self.validator = CommandValidator()
        self.output_formatter = CommandOutputFormatter(self.formatter)

    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="curriculum-list",
            description="List all curricula with filtering",
            category=CommandCategory.CURRICULUM,
            aliases=["curr-list", "list-curr"]
        )

    def setup_parser(self, subparsers):
        parser = self.create_subparser(subparsers, help="List curricula")
        CommandParserBuilder.add_filtering_args(parser)
        CommandParserBuilder.add_sorting_args(parser)
        CommandParserBuilder.add_output_args(parser)

    async def execute_async(self, args: Dict[str, Any]) -> CommandResult:
        """Execute command"""
        # Validate inputs
        filters = self._build_filters(args)

        # Call service
        curricula = await self.curriculum_service.list_curricula(filters)

        # Format output
        output = self.output_formatter.format_list_output(
            curricula,
            columns=['id', 'name', 'status', 'difficulty'],
            format_type=args.get('format', 'table')
        )

        return CommandResult(
            success=True,
            message=f"Found {len(curricula)} curricula",
            data=output
        )

    def _build_filters(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Build filter dict from args"""
        filters = {}
        if args.get('status'):
            filters['status'] = self.validator.validate_status(
                args['status'],
                allowed=['active', 'draft', 'archived']
            )
        # More filter building...
        return filters
```

**Step 3: Create Package Init Files**

```python
# commands/curriculum/__init__.py
"""Curriculum command package"""

from .list import CurriculumListCommand
from .create import CurriculumCreateCommand
from .show import CurriculumShowCommand
from .update import CurriculumUpdateCommand
from .delete import CurriculumDeleteCommand

__all__ = [
    'CurriculumListCommand',
    'CurriculumCreateCommand',
    'CurriculumShowCommand',
    'CurriculumUpdateCommand',
    'CurriculumDeleteCommand',
]
```

### 2.3 Command Refactoring Breakdown

**Curriculum Commands** (`curriculum_commands.py` → `commands/curriculum/`):
- `list.py` (240 lines) - CurriculumListCommand
- `create.py` (280 lines) - CurriculumCreateCommand
- `show.py` (220 lines) - CurriculumShowCommand
- `update.py` (260 lines) - CurriculumUpdateCommand
- `delete.py` (220 lines) - CurriculumDeleteCommand
- **Total: 5 files, ~1,220 lines**

**Content Commands** (`content_commands.py` → `commands/content/`):
- `list.py` (260 lines) - ContentListCommand
- `create.py` (300 lines) - ContentCreateCommand
- `update.py` (280 lines) - ContentUpdateCommand
- `delete.py` (240 lines) - ContentDeleteCommand
- `validate.py` (240 lines) - ContentValidateCommand
- **Total: 5 files, ~1,320 lines**

**Progress Commands** (`progress_commands.py` → `commands/progress/`):
- `list.py` (380 lines) - ProgressListCommand
- `show.py` (380 lines) - ProgressShowCommand
- `track.py` (420 lines) - ProgressTrackCommand
- `analytics.py` (400 lines) - ProgressAnalyticsCommand
- **Total: 4 files, ~1,580 lines**

**Admin Commands** (`admin_commands.py` → `commands/admin/`):
- `user_management.py` (490 lines) - UserManagementCommand
- `system_config.py` (480 lines) - SystemConfigCommand
- `health.py` (480 lines) - SystemHealthCommand
- **Total: 3 files, ~1,450 lines**

**Search Commands** (`search_commands.py` → `commands/search/`):
- `search.py` (460 lines) - SearchCommand
- `saved_searches.py` (460 lines) - SavedSearchCommand
- `analytics.py` (460 lines) - SearchAnalyticsCommand
- **Total: 3 files, ~1,380 lines**

**Command Utilities** (NEW):
- `commands/utils/validators.py` (200 lines)
- `commands/utils/formatters.py` (250 lines)
- `commands/utils/parsers.py` (150 lines)
- **Total: 3 files, ~600 lines**

**Command Layer Summary**:
- **Before**: 5 files, 6,010 lines
- **After**: 23 files, ~6,550 lines (includes utilities)
- **File size**: All files ≤500 lines ✓

---

## 3. UI Layer Refactoring (3 files, ~3,867 lines)

### 3.1 Problem Analysis

**Current Issues**:
- `enhanced_interactive.py`: God Class with 50+ methods, 1,665 lines
- `interactive.py`: Large session class, 1,133 lines
- `unified_formatter.py`: Complex rendering pipeline, 1,069 lines
- Mixing UI rendering, session state, business logic
- No component reusability

### 3.2 Enhanced Interactive Refactoring

**Current Structure**:
```python
class EnhancedInteractiveSession:
    # Session management
    # Menu rendering
    # Navigation
    # Quiz management
    # Notes management
    # Progress tracking
    # Animation effects
    # Input handling
    # ... 50+ methods in one class!
```

**Target Structure**:

```python
# ui/session/base_session.py (200 lines)
"""Base session management"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
from ..formatters.base import BaseFormatter

class SessionState:
    """Session state data"""
    def __init__(self):
        self.start_time = datetime.now()
        self.current_topic = ""
        self.mode = None
        self.progress_data = {}

class BaseSession(ABC):
    """Base class for all interactive sessions"""

    def __init__(self, formatter: BaseFormatter):
        self.formatter = formatter
        self.state = SessionState()

    @abstractmethod
    async def start(self):
        """Start the session"""
        pass

    @abstractmethod
    async def handle_input(self, user_input: str):
        """Handle user input"""
        pass

    def save_state(self):
        """Save session state"""
        pass

    def restore_state(self):
        """Restore session state"""
        pass
```

```python
# ui/session/learning_session.py (400 lines)
"""Learning mode session"""

from .base_session import BaseSession
from ..components.menus import MenuRenderer
from ..components.progress_bars import ProgressBarRenderer
from ...services.progress_service import ProgressService

class LearningSession(BaseSession):
    """Interactive learning session"""

    def __init__(self, formatter, progress_service: ProgressService):
        super().__init__(formatter)
        self.progress_service = progress_service
        self.menu_renderer = MenuRenderer(formatter)
        self.progress_renderer = ProgressBarRenderer(formatter)

    async def start(self):
        """Start learning session"""
        self._show_welcome()
        await self._main_loop()

    async def _main_loop(self):
        """Main interaction loop"""
        while True:
            choice = await self._show_main_menu()
            if choice == 'quit':
                break
            await self._handle_choice(choice)

    def _show_welcome(self):
        """Show welcome screen"""
        self.menu_renderer.render_welcome_banner()

    async def _show_main_menu(self) -> str:
        """Show main menu and get choice"""
        menu_items = [
            "Start Lesson",
            "Take Quiz",
            "Review Notes",
            "View Progress",
            "Quit"
        ]
        return await self.menu_renderer.show_menu(
            title="Learning Menu",
            items=menu_items
        )
```

```python
# ui/session/quiz_session.py (350 lines)
"""Quiz mode session"""

from .base_session import BaseSession
from ..components.prompts import QuestionPrompt
from ...services.quiz_service import QuizService

class QuizSession(BaseSession):
    """Interactive quiz session"""

    def __init__(self, formatter, quiz_service: QuizService):
        super().__init__(formatter)
        self.quiz_service = quiz_service
        self.question_prompt = QuestionPrompt(formatter)
        self.score = 0

    async def start(self):
        """Start quiz session"""
        quiz = await self.quiz_service.get_quiz(self.state.current_topic)
        await self._run_quiz(quiz)
        self._show_results()

    async def _run_quiz(self, quiz):
        """Run through quiz questions"""
        for question in quiz.questions:
            answer = await self.question_prompt.ask_question(question)
            if self._check_answer(answer, question):
                self.score += 1
```

```python
# ui/session/notes_session.py (350 lines)
"""Notes mode session"""

from .base_session import BaseSession
from ..components.prompts import TextInputPrompt
from ...services.notes_service import NotesService

class NotesSession(BaseSession):
    """Interactive notes session"""

    def __init__(self, formatter, notes_service: NotesService):
        super().__init__(formatter)
        self.notes_service = notes_service
        self.input_prompt = TextInputPrompt(formatter)

    async def start(self):
        """Start notes session"""
        await self._notes_menu()

    async def _notes_menu(self):
        """Show notes management menu"""
        while True:
            choice = await self._show_menu()
            if choice == 'back':
                break
            await self._handle_notes_action(choice)
```

**Enhanced Interactive Split**:
- `ui/session/base_session.py` (200 lines) - Base session class
- `ui/session/learning_session.py` (400 lines) - Learning mode
- `ui/session/quiz_session.py` (350 lines) - Quiz mode
- `ui/session/notes_session.py` (350 lines) - Notes mode
- `ui/session/state.py` (150 lines) - Session state management
- `ui/enhanced_interactive.py` (200 lines) - Entry point/coordinator
- **Total: 6 files, ~1,650 lines**

### 3.3 Unified Formatter Refactoring

**Current Structure**: Monolithic rendering pipeline in one file

**Target Structure**:

```python
# ui/formatters/base.py (150 lines)
"""Base formatter interface"""

from abc import ABC, abstractmethod
from typing import Optional

class BaseFormatter(ABC):
    """Base interface for all formatters"""

    @abstractmethod
    def format_text(self, text: str, style: str) -> str:
        """Format text with style"""
        pass

    @abstractmethod
    def format_table(self, data: list, headers: list) -> str:
        """Format table"""
        pass
```

```python
# ui/formatters/color.py (250 lines)
"""Color and theme system"""

from enum import Enum
from dataclasses import dataclass

class Color(Enum):
    """ANSI color codes"""
    BLACK = "\033[30m"
    RED = "\033[31m"
    # ... more colors

@dataclass
class Theme:
    """Color theme configuration"""
    primary: Color
    secondary: Color
    success: Color
    warning: Color
    error: Color

class ColorFormatter:
    """Color formatting logic"""

    def __init__(self, theme: Theme):
        self.theme = theme

    def colorize(self, text: str, color: Color) -> str:
        """Apply color to text"""
        return f"{color.value}{text}\033[0m"
```

```python
# ui/formatters/platform.py (200 lines)
"""Platform detection and capabilities"""

import sys
import shutil
from dataclasses import dataclass

@dataclass
class PlatformCapabilities:
    """Platform-specific capabilities"""
    unicode_support: bool
    color_support: bool
    ansi_support: bool
    terminal_width: int
    terminal_height: int

class PlatformDetector:
    """Detect platform capabilities"""

    @staticmethod
    def detect() -> PlatformCapabilities:
        """Detect current platform"""
        # Implementation
        pass
```

```python
# ui/formatters/renderers.py (300 lines)
"""Rendering pipeline components"""

from typing import List, Callable

class RenderPipeline:
    """Configurable rendering pipeline"""

    def __init__(self):
        self.stages: List[Callable] = []

    def add_stage(self, stage: Callable):
        """Add rendering stage"""
        self.stages.append(stage)

    def render(self, content: str) -> str:
        """Execute rendering pipeline"""
        result = content
        for stage in self.stages:
            result = stage(result)
        return result

class BoxRenderer:
    """Box/panel rendering"""

    def render_box(self, content: str, title: str = "") -> str:
        """Render content in box"""
        # Implementation
        pass
```

```python
# ui/formatters/cache.py (150 lines)
"""Formatting result caching"""

from functools import lru_cache
from typing import Any

class FormatterCache:
    """Cache formatted results"""

    def __init__(self, max_size: int = 128):
        self.max_size = max_size
        self._cache = {}

    @lru_cache(maxsize=128)
    def get_formatted(self, key: str, formatter: callable) -> str:
        """Get cached or format new"""
        # Implementation
        pass
```

```python
# ui/unified_formatter.py (200 lines)
"""Unified formatter - main entry point"""

from .formatters.base import BaseFormatter
from .formatters.color import ColorFormatter, Theme
from .formatters.platform import PlatformDetector
from .formatters.renderers import RenderPipeline, BoxRenderer
from .formatters.cache import FormatterCache

class UnifiedFormatter(BaseFormatter):
    """Main unified formatter"""

    def __init__(self):
        capabilities = PlatformDetector.detect()
        theme = self._select_theme(capabilities)

        self.color_formatter = ColorFormatter(theme)
        self.pipeline = RenderPipeline()
        self.box_renderer = BoxRenderer()
        self.cache = FormatterCache()

        self._setup_pipeline(capabilities)

    def _setup_pipeline(self, capabilities):
        """Configure rendering pipeline"""
        # Add stages based on capabilities
        pass

    def format_text(self, text: str, style: str) -> str:
        """Format text"""
        return self.pipeline.render(text)
```

**Unified Formatter Split**:
- `ui/formatters/base.py` (150 lines) - Base interface
- `ui/formatters/color.py` (250 lines) - Color system
- `ui/formatters/platform.py` (200 lines) - Platform detection
- `ui/formatters/renderers.py` (300 lines) - Rendering components
- `ui/formatters/cache.py` (150 lines) - Caching
- `ui/unified_formatter.py` (200 lines) - Main entry
- **Total: 6 files, ~1,250 lines**

### 3.4 UI Components Extraction

Extract reusable components from both session files:

```python
# ui/components/menus.py (300 lines)
"""Menu rendering components"""

class MenuRenderer:
    """Render interactive menus"""

    def show_menu(self, title: str, items: list) -> str:
        """Show menu and return choice"""
        pass

    def render_welcome_banner(self):
        """Render welcome banner"""
        pass
```

```python
# ui/components/progress_bars.py (200 lines)
"""Progress bar components"""

class ProgressBarRenderer:
    """Render progress bars and visualizations"""

    def render_progress(self, current: int, total: int) -> str:
        """Render progress bar"""
        pass
```

```python
# ui/components/tables.py (250 lines)
"""Table rendering components"""

class TableRenderer:
    """Render data tables"""

    def render_table(self, data: list, headers: list) -> str:
        """Render formatted table"""
        pass
```

```python
# ui/components/panels.py (200 lines)
"""Panel/box components"""

class PanelRenderer:
    """Render panels and boxes"""

    def render_panel(self, content: str, title: str = "") -> str:
        """Render content in panel"""
        pass
```

```python
# ui/components/prompts.py (300 lines)
"""User input prompt components"""

class TextInputPrompt:
    """Text input prompt"""

    async def ask_text(self, question: str) -> str:
        """Ask for text input"""
        pass

class QuestionPrompt:
    """Quiz question prompt"""

    async def ask_question(self, question) -> str:
        """Ask quiz question"""
        pass
```

**UI Components**:
- `ui/components/menus.py` (300 lines)
- `ui/components/progress_bars.py` (200 lines)
- `ui/components/tables.py` (250 lines)
- `ui/components/panels.py` (200 lines)
- `ui/components/prompts.py` (300 lines)
- **Total: 5 files, ~1,250 lines**

### 3.5 Interactive.py Refactoring

Similar approach as enhanced_interactive:
- Extract to `ui/session/` modules
- Reuse components
- Simplify main file to coordinator

**Interactive Split**:
- Reuse `ui/session/` modules created above
- `ui/interactive.py` (200 lines) - Simplified entry point
- **Total: Reuses existing modules**

**UI Layer Summary**:
- **Before**: 3 files, 3,867 lines
- **After**: 23 files, ~4,350 lines (includes components)
- **File size**: All files ≤500 lines ✓

---

## 4. Service Layer Refactoring (1 file, 1,068 lines)

### 4.1 Notes Manager Refactoring

**Current Issues**:
- `notes_manager.py` mixes Repository + Service + Business Logic
- Direct database operations in same class as business rules
- No separation of concerns

**Target Structure**:

```python
# persistence/repositories/notes_repo.py (400 lines)
"""Notes repository - data access only"""

from typing import List, Optional
from .base import BaseRepository
from ...models.notes import Note

class NotesRepository(BaseRepository[Note]):
    """Data access for notes"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_database()

    async def create(self, note: Note) -> Note:
        """Create new note in database"""
        # Pure database operation
        pass

    async def get(self, note_id: int) -> Optional[Note]:
        """Get note by ID"""
        # Pure database operation
        pass

    async def search(self, query: str, filters: dict) -> List[Note]:
        """Search notes with filters"""
        # Pure database operation with SQL
        pass

    def _init_database(self):
        """Initialize database schema"""
        # Schema creation
        pass
```

```python
# services/notes_service.py (400 lines)
"""Notes service - business logic"""

from typing import List, Optional
from ..persistence.repositories.notes_repo import NotesRepository
from ..models.notes import Note, NoteType, Priority

class NotesService:
    """Business logic for notes operations"""

    def __init__(self, notes_repo: NotesRepository):
        self.notes_repo = notes_repo

    async def create_note(
        self,
        user_id: int,
        content: str,
        note_type: NoteType,
        **kwargs
    ) -> Note:
        """Create note with validation and business rules"""
        # Validate content
        if not content or len(content) < 10:
            raise ValueError("Note content too short")

        # Apply business rules
        note = Note(
            user_id=user_id,
            content=content,
            note_type=note_type,
            priority=self._calculate_priority(note_type),
            **kwargs
        )

        # Save via repository
        saved_note = await self.notes_repo.create(note)

        # Post-creation actions
        await self._index_note(saved_note)

        return saved_note

    async def search_notes(
        self,
        user_id: int,
        query: str,
        filters: dict
    ) -> List[Note]:
        """Search with relevance ranking"""
        # Get results from repo
        notes = await self.notes_repo.search(query, filters)

        # Apply business logic: ranking, filtering
        ranked_notes = self._rank_by_relevance(notes, query)

        return ranked_notes

    def _calculate_priority(self, note_type: NoteType) -> Priority:
        """Calculate note priority based on type"""
        # Business rule implementation
        pass

    def _rank_by_relevance(self, notes: List[Note], query: str) -> List[Note]:
        """Rank notes by relevance"""
        # Ranking algorithm
        pass
```

```python
# models/notes.py (200 lines)
"""Note domain models"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import List, Optional

class NoteType(Enum):
    """Note type enumeration"""
    CONCEPT = "concept"
    EXAMPLE = "example"
    QUESTION = "question"
    SUMMARY = "summary"

class Priority(Enum):
    """Note priority levels"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3

@dataclass
class Note:
    """Note domain model"""
    id: Optional[int]
    user_id: int
    content: str
    note_type: NoteType
    priority: Priority
    title: str = ""
    tags: List[str] = None
    created_at: datetime = None
    updated_at: datetime = None

    def __post_init__(self):
        """Initialize defaults"""
        if self.tags is None:
            self.tags = []
        if self.created_at is None:
            self.created_at = datetime.now()

    def validate(self) -> bool:
        """Validate note data"""
        if not self.content:
            return False
        if len(self.content) < 10:
            return False
        return True
```

**Notes Manager Split**:
- `persistence/repositories/notes_repo.py` (400 lines) - Data access
- `services/notes_service.py` (400 lines) - Business logic
- `models/notes.py` (200 lines) - Domain models
- **Total: 3 files, ~1,000 lines**

**Service Layer Summary**:
- **Before**: 1 file, 1,068 lines
- **After**: 3 files, ~1,000 lines
- **File size**: All files ≤500 lines ✓

---

## 5. Consolidated Refactoring Summary

### 5.1 File Count Changes

| Category | Before | After | Change |
|----------|--------|-------|--------|
| Command Layer | 5 files | 23 files | +18 |
| UI Layer | 3 files | 23 files | +20 |
| Service Layer | 1 file | 3 files | +2 |
| **Total** | **9 files** | **49 files** | **+40** |

### 5.2 Line Distribution

| Category | Before (lines) | After (lines) | Avg per file |
|----------|---------------|---------------|--------------|
| Command Layer | 6,010 | ~6,550 | ~285 |
| UI Layer | 3,867 | ~4,350 | ~189 |
| Service Layer | 1,068 | ~1,000 | ~333 |
| **Total** | **11,945** | **~11,900** | **~243** |

**Quality Metrics**:
- Max file size: 490 lines (admin/user_management.py) ✓
- Avg file size: 243 lines ✓
- All files ≤500 lines ✓

### 5.3 Architectural Improvements

**Before**:
- ❌ God Classes (1,665 lines)
- ❌ Multiple responsibilities per file
- ❌ Mixed concerns (UI + Business + Data)
- ❌ Duplicated code across files
- ❌ Hard to test in isolation

**After**:
- ✅ Single Responsibility Principle
- ✅ Separation of Concerns (Command → Service → Repository)
- ✅ Reusable components and utilities
- ✅ Easy to test (dependency injection)
- ✅ Clear module boundaries
- ✅ No circular dependencies

---

## 6. Migration Strategy

### 6.1 Phase Overview

**5 Phases** over ~4-6 weeks:

1. **Phase 1**: Extract shared utilities (Week 1)
2. **Phase 2**: Create base classes and interfaces (Week 1)
3. **Phase 3**: Split large files (Week 2-3)
4. **Phase 4**: Update tests (Week 4)
5. **Phase 5**: Integration validation (Week 5-6)

### 6.2 Phase 1: Extract Shared Utilities (Week 1, Days 1-3)

**Objective**: Create shared utility modules to eliminate code duplication

**Tasks**:
1. Create `commands/utils/` package
   - Extract validation logic → `validators.py`
   - Extract formatting logic → `formatters.py`
   - Extract parsing logic → `parsers.py`

2. Create `ui/components/` package
   - Extract menu rendering → `menus.py`
   - Extract progress bars → `progress_bars.py`
   - Extract table rendering → `tables.py`
   - Extract panels → `panels.py`
   - Extract prompts → `prompts.py`

3. Create `ui/formatters/` package
   - Extract color system → `color.py`
   - Extract platform detection → `platform.py`
   - Extract renderers → `renderers.py`
   - Extract caching → `cache.py`

**Success Criteria**:
- All utility modules pass tests
- No breaking changes to existing code
- Documentation complete
- Code review approved

**Testing**:
```bash
# Unit tests for utilities
pytest tests/commands/utils/
pytest tests/ui/components/
pytest tests/ui/formatters/

# Integration tests still pass
pytest tests/ --cov=src
```

### 6.3 Phase 2: Create Base Classes (Week 1, Days 4-5)

**Objective**: Establish foundation classes and interfaces

**Tasks**:
1. Create `persistence/repositories/base.py`
   - Define `BaseRepository[T]` interface
   - Implement common CRUD patterns

2. Create `ui/session/base_session.py`
   - Define `BaseSession` abstract class
   - Implement `SessionState` dataclass

3. Create `ui/formatters/base.py`
   - Define `BaseFormatter` interface

4. Create `services/` package structure
   - Define service interfaces

**Success Criteria**:
- All base classes tested
- Interface contracts defined
- Documentation complete
- No impact on existing functionality

**Testing**:
```bash
# Test base classes
pytest tests/persistence/repositories/test_base.py
pytest tests/ui/session/test_base_session.py
pytest tests/ui/formatters/test_base.py

# Verify no regressions
pytest tests/ --cov=src
```

### 6.4 Phase 3: Split Large Files (Weeks 2-3)

**Objective**: Split all 9 large files into modular components

**Execution Order** (lowest risk first):

#### Week 2, Days 1-2: Notes Manager (Lowest Risk)
```bash
# 1. Create repository
src/persistence/repositories/notes_repo.py

# 2. Create service
src/services/notes_service.py

# 3. Create models
src/models/notes.py

# 4. Update imports in dependent files

# 5. Run tests
pytest tests/services/test_notes_service.py
pytest tests/persistence/test_notes_repo.py
pytest tests/ --cov=src/services/notes_service.py

# 6. Deprecate old file (keep for compatibility)
# src/notes_manager.py → Add deprecation warning
```

#### Week 2, Day 3: Unified Formatter
```bash
# 1. Create formatter modules
src/ui/formatters/color.py
src/ui/formatters/platform.py
src/ui/formatters/renderers.py
src/ui/formatters/cache.py

# 2. Update main formatter
src/ui/unified_formatter.py

# 3. Update all imports

# 4. Run tests
pytest tests/ui/formatters/
pytest tests/ui/test_unified_formatter.py
```

#### Week 2, Days 4-5: Interactive Sessions
```bash
# 1. Create session modules
src/ui/session/base_session.py
src/ui/session/learning_session.py
src/ui/session/quiz_session.py
src/ui/session/notes_session.py
src/ui/session/state.py

# 2. Update entry points
src/ui/enhanced_interactive.py
src/ui/interactive.py

# 3. Run tests
pytest tests/ui/session/
pytest tests/ui/test_interactive.py
pytest tests/ui/test_enhanced_interactive.py
```

#### Week 3, Days 1-2: Command Files (1/2)
```bash
# Split curriculum_commands.py
src/commands/curriculum/list.py
src/commands/curriculum/create.py
src/commands/curriculum/show.py
src/commands/curriculum/update.py
src/commands/curriculum/delete.py

# Split content_commands.py
src/commands/content/list.py
src/commands/content/create.py
src/commands/content/update.py
src/commands/content/delete.py
src/commands/content/validate.py

# Run tests
pytest tests/commands/curriculum/
pytest tests/commands/content/
```

#### Week 3, Days 3-5: Command Files (2/2)
```bash
# Split progress_commands.py
src/commands/progress/list.py
src/commands/progress/show.py
src/commands/progress/track.py
src/commands/progress/analytics.py

# Split admin_commands.py
src/commands/admin/user_management.py
src/commands/admin/system_config.py
src/commands/admin/health.py

# Split search_commands.py
src/commands/search/search.py
src/commands/search/saved_searches.py
src/commands/search/analytics.py

# Run tests
pytest tests/commands/progress/
pytest tests/commands/admin/
pytest tests/commands/search/
```

**Success Criteria for Phase 3**:
- All 9 files split successfully
- 100% test pass rate maintained
- No functionality regressions
- All imports updated
- Old files marked as deprecated

### 6.5 Phase 4: Update Tests (Week 4)

**Objective**: Update test structure to match new architecture

**Tasks**:
1. Reorganize test directory structure
2. Update import statements in all tests
3. Create tests for new modules
4. Update fixtures and test utilities
5. Ensure coverage ≥80% maintained

**New Test Structure**:
```
tests/
├── commands/
│   ├── curriculum/
│   │   ├── test_list.py
│   │   ├── test_create.py
│   │   ├── test_show.py
│   │   ├── test_update.py
│   │   └── test_delete.py
│   ├── content/
│   ├── progress/
│   ├── admin/
│   ├── search/
│   └── utils/
│       ├── test_validators.py
│       ├── test_formatters.py
│       └── test_parsers.py
├── ui/
│   ├── session/
│   │   ├── test_base_session.py
│   │   ├── test_learning_session.py
│   │   ├── test_quiz_session.py
│   │   └── test_notes_session.py
│   ├── components/
│   │   ├── test_menus.py
│   │   ├── test_progress_bars.py
│   │   └── test_prompts.py
│   └── formatters/
│       ├── test_color.py
│       ├── test_platform.py
│       └── test_renderers.py
├── services/
│   └── test_notes_service.py
└── persistence/
    └── repositories/
        └── test_notes_repo.py
```

**Testing Commands**:
```bash
# Run all tests
pytest tests/ -v

# Check coverage
pytest tests/ --cov=src --cov-report=html

# Verify coverage threshold
pytest tests/ --cov=src --cov-fail-under=80

# Run specific test suites
pytest tests/commands/ -v
pytest tests/ui/ -v
pytest tests/services/ -v
```

**Success Criteria**:
- All tests passing (100%)
- Coverage ≥80% maintained
- No flaky tests
- Test execution time <5 minutes

### 6.6 Phase 5: Integration Validation (Weeks 5-6)

**Objective**: Validate complete system integration and remove deprecated code

**Week 5 Tasks**:
1. End-to-end integration testing
2. Performance regression testing
3. Manual testing of all features
4. Documentation updates
5. Code review

**Week 6 Tasks**:
1. Remove deprecated files
2. Update all references
3. Final regression testing
4. Deploy to staging
5. Production deployment

**Integration Test Scenarios**:
```python
# Test complete workflows
async def test_complete_learning_workflow():
    """Test full learning session"""
    # Start session
    session = LearningSession(formatter, progress_service)
    await session.start()

    # Complete lesson
    await session.complete_lesson("python-basics")

    # Take quiz
    score = await session.take_quiz("python-basics-quiz")
    assert score >= 0.7

    # Review notes
    notes = await session.get_notes()
    assert len(notes) > 0

    # Check progress
    progress = await session.get_progress()
    assert progress.lessons_completed == 1

async def test_complete_command_workflow():
    """Test command execution chain"""
    # Create curriculum
    result = await curriculum_create_cmd.execute({
        'name': 'Test Curriculum',
        'difficulty': 'beginner'
    })
    assert result.success

    # Add content
    result = await content_create_cmd.execute({
        'curriculum_id': result.data['id'],
        'type': 'lesson',
        'title': 'Test Lesson'
    })
    assert result.success

    # Track progress
    result = await progress_track_cmd.execute({
        'user_id': 1,
        'content_id': result.data['id'],
        'status': 'completed'
    })
    assert result.success
```

**Success Criteria**:
- All integration tests passing
- Performance metrics maintained or improved
- No breaking changes for users
- Documentation complete and accurate
- Production deployment successful

---

## 7. Testing Strategy

### 7.1 Test Coverage Requirements

**Coverage Targets**:
- Overall: ≥80%
- New modules: ≥90%
- Critical paths: 100%

### 7.2 Test Types

**Unit Tests**:
- Test individual classes and functions
- Mock all dependencies
- Fast execution (<10ms per test)

Example:
```python
# tests/commands/utils/test_validators.py
import pytest
from src.commands.utils.validators import CommandValidator
from src.core.exceptions import ValidationError

class TestCommandValidator:
    """Unit tests for CommandValidator"""

    def test_validate_id_with_valid_input(self):
        """Test ID validation with valid input"""
        result = CommandValidator.validate_id(123, "user")
        assert result == 123

    def test_validate_id_with_invalid_input(self):
        """Test ID validation raises error for invalid input"""
        with pytest.raises(ValidationError):
            CommandValidator.validate_id(-1, "user")

    def test_validate_id_with_non_integer(self):
        """Test ID validation raises error for non-integer"""
        with pytest.raises(ValidationError):
            CommandValidator.validate_id("abc", "user")
```

**Integration Tests**:
- Test cross-layer interactions
- Test with real dependencies
- Moderate execution time (<100ms per test)

Example:
```python
# tests/services/test_notes_service.py
import pytest
from src.services.notes_service import NotesService
from src.persistence.repositories.notes_repo import NotesRepository
from src.models.notes import NoteType, Priority

@pytest.fixture
async def notes_service():
    """Create notes service with test database"""
    repo = NotesRepository(db_path=":memory:")
    service = NotesService(repo)
    yield service

class TestNotesService:
    """Integration tests for NotesService"""

    async def test_create_note_saves_to_database(self, notes_service):
        """Test note creation persists to database"""
        note = await notes_service.create_note(
            user_id=1,
            content="Test note content",
            note_type=NoteType.CONCEPT
        )

        assert note.id is not None
        retrieved = await notes_service.get_note(note.id)
        assert retrieved.content == "Test note content"

    async def test_search_notes_returns_relevant_results(self, notes_service):
        """Test search returns relevant notes"""
        # Create test notes
        await notes_service.create_note(1, "Python basics", NoteType.CONCEPT)
        await notes_service.create_note(1, "JavaScript intro", NoteType.CONCEPT)

        # Search
        results = await notes_service.search_notes(1, "python", {})
        assert len(results) == 1
        assert "Python" in results[0].content
```

**End-to-End Tests**:
- Test complete user workflows
- Test with production-like setup
- Slower execution (acceptable for E2E)

Example:
```python
# tests/e2e/test_learning_workflow.py
import pytest
from src.ui.session.learning_session import LearningSession
from src.services.progress_service import ProgressService

@pytest.mark.e2e
async def test_complete_learning_session():
    """Test complete learning session workflow"""
    # Setup
    session = LearningSession(formatter, progress_service)

    # Start session
    await session.start()

    # Navigate to lesson
    await session.navigate_to_lesson("python-basics")

    # Complete lesson
    result = await session.complete_current_lesson()
    assert result.success

    # Take notes
    await session.add_note("Important concept about variables")

    # Take quiz
    score = await session.take_quiz()
    assert score >= 0.7

    # Verify progress
    progress = await session.get_session_progress()
    assert progress.lessons_completed == 1
    assert progress.notes_taken == 1
```

### 7.3 Test Data Management

**Test Fixtures**:
```python
# tests/conftest.py
import pytest
from src.persistence.repositories.notes_repo import NotesRepository
from src.services.notes_service import NotesService

@pytest.fixture
def test_db():
    """Provide in-memory test database"""
    return ":memory:"

@pytest.fixture
def notes_repo(test_db):
    """Provide notes repository with test database"""
    return NotesRepository(test_db)

@pytest.fixture
def notes_service(notes_repo):
    """Provide notes service with test repository"""
    return NotesService(notes_repo)

@pytest.fixture
def sample_notes():
    """Provide sample note data"""
    return [
        {
            "user_id": 1,
            "content": "Python basics note",
            "note_type": "concept"
        },
        {
            "user_id": 1,
            "content": "Advanced Python note",
            "note_type": "example"
        }
    ]
```

### 7.4 Regression Testing

**Automated Regression Suite**:
```bash
# Run full regression suite before each phase
pytest tests/ -v --cov=src --cov-report=html

# Run performance regression tests
pytest tests/performance/ -v

# Run specific regression scenarios
pytest tests/ -m regression -v
```

**Performance Benchmarks**:
```python
# tests/performance/test_benchmarks.py
import pytest
from time import time

@pytest.mark.performance
def test_command_execution_performance():
    """Ensure commands execute within time limit"""
    start = time()
    result = command.execute(args)
    duration = time() - start

    assert duration < 0.2  # 200ms limit
    assert result.success
```

---

## 8. Risk Mitigation Plan

### 8.1 Identified Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking backwards compatibility | High | Medium | Maintain deprecated wrappers, extensive testing |
| Test failures during migration | High | Medium | Phase-by-phase validation, rollback plan |
| Import path changes break users | Medium | High | Compatibility imports, clear migration guide |
| Performance degradation | Medium | Low | Performance benchmarks, profiling |
| Circular dependencies | High | Low | Dependency graph analysis, strict layering |
| Missing test coverage | Medium | Medium | Coverage requirements ≥80% per phase |

### 8.2 Rollback Strategy

**Each Phase has Rollback Plan**:

1. **Git branching strategy**:
   ```bash
   main
   └── refactor/phase-1-utilities
       └── refactor/phase-2-base-classes
           └── refactor/phase-3-split-files
               └── refactor/phase-4-tests
                   └── refactor/phase-5-integration
   ```

2. **Rollback procedure**:
   ```bash
   # If phase fails, revert to previous branch
   git checkout refactor/phase-N-1

   # Cherry-pick any critical fixes
   git cherry-pick <commit-hash>

   # Resume from stable state
   ```

3. **Backwards compatibility layer**:
   ```python
   # src/notes_manager.py (deprecated wrapper)
   import warnings
   from .services.notes_service import NotesService
   from .persistence.repositories.notes_repo import NotesRepository

   class NotesManager:
       """DEPRECATED: Use NotesService instead"""

       def __init__(self, db_path: str):
           warnings.warn(
               "NotesManager is deprecated. Use NotesService instead.",
               DeprecationWarning,
               stacklevel=2
           )
           repo = NotesRepository(db_path)
           self._service = NotesService(repo)

       def __getattr__(self, name):
           """Proxy to new service"""
           return getattr(self._service, name)
   ```

### 8.3 Communication Plan

**Stakeholder Updates**:
- Weekly progress reports
- Migration status dashboard
- Risk register updates
- Test coverage reports

**Documentation Updates**:
- Migration guide for users
- API changes documentation
- Architecture decision records (ADRs)
- Updated README files

---

## 9. Success Metrics

### 9.1 Quantitative Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Files over 500 lines | 9 | 0 | File size check |
| Average file size | 1,327 lines | <300 lines | `wc -l` analysis |
| Test coverage | TBD | ≥80% | pytest --cov |
| Test pass rate | 100% | 100% | pytest results |
| Build time | TBD | No degradation | CI/CD metrics |
| Code duplication | TBD | <5% | Static analysis |
| Cyclomatic complexity | TBD | ≤10 avg | Linting tools |

### 9.2 Qualitative Metrics

**Code Quality**:
- ✅ SOLID principles followed
- ✅ Clear separation of concerns
- ✅ Consistent naming conventions
- ✅ Comprehensive documentation
- ✅ No circular dependencies

**Maintainability**:
- ✅ New features easier to add
- ✅ Bugs easier to isolate and fix
- ✅ Code easier to understand
- ✅ Tests easier to write

**Developer Experience**:
- ✅ Faster onboarding for new developers
- ✅ Clear module boundaries
- ✅ Better IDE navigation
- ✅ Improved code discoverability

---

## 10. Architectural Decision Records (ADRs)

### ADR-001: Command File Organization

**Status**: Proposed
**Context**: 5 command files with multiple classes each (3-5 classes per file)
**Decision**: Split into one file per command class
**Rationale**:
- Easier to locate specific command
- Smaller, focused files
- Better git diff tracking
- Follows Single Responsibility Principle

**Consequences**:
- More files (23 vs 5)
- Clearer organization
- Easier maintenance

### ADR-002: Service Layer Introduction

**Status**: Proposed
**Context**: Business logic mixed with data access in notes_manager.py
**Decision**: Introduce Service Layer pattern
**Rationale**:
- Separate business logic from data access
- Enable dependency injection
- Improve testability
- Follow Clean Architecture

**Consequences**:
- Additional layer of abstraction
- More files but clearer responsibilities
- Better separation of concerns

### ADR-003: UI Component Library

**Status**: Proposed
**Context**: Duplicated UI rendering logic across interactive files
**Decision**: Extract reusable component library
**Rationale**:
- Eliminate code duplication
- Consistent UI experience
- Easier to test UI elements
- Follows DRY principle

**Consequences**:
- Initial extraction effort
- Long-term maintainability improvement
- Reusable across different UI modes

### ADR-004: Session Management Hierarchy

**Status**: Proposed
**Context**: Large interactive session classes with many responsibilities
**Decision**: Create base session class with specialized subclasses
**Rationale**:
- Single Responsibility Principle
- Clearer code organization
- Easier to extend with new modes
- Better testability

**Consequences**:
- More classes but clearer purpose
- Inheritance hierarchy to maintain
- Better extensibility

---

## 11. Implementation Checklist

### Pre-Implementation
- [ ] Review and approve architecture design
- [ ] Set up feature branches
- [ ] Create project tracking board
- [ ] Schedule team reviews
- [ ] Prepare test environment

### Phase 1: Utilities
- [ ] Create `commands/utils/` package
- [ ] Implement validators.py
- [ ] Implement formatters.py
- [ ] Implement parsers.py
- [ ] Create `ui/components/` package
- [ ] Implement all UI components
- [ ] Create `ui/formatters/` package
- [ ] Implement all formatter modules
- [ ] Write unit tests for all utilities
- [ ] Documentation complete
- [ ] Code review approved

### Phase 2: Base Classes
- [ ] Create `persistence/repositories/base.py`
- [ ] Create `ui/session/base_session.py`
- [ ] Create `ui/formatters/base.py`
- [ ] Create `services/` package structure
- [ ] Write unit tests for base classes
- [ ] Documentation complete
- [ ] Code review approved

### Phase 3: Split Files
- [ ] Split notes_manager.py
- [ ] Split unified_formatter.py
- [ ] Split enhanced_interactive.py
- [ ] Split interactive.py
- [ ] Split curriculum_commands.py
- [ ] Split content_commands.py
- [ ] Split progress_commands.py
- [ ] Split admin_commands.py
- [ ] Split search_commands.py
- [ ] Update all imports
- [ ] Mark old files as deprecated
- [ ] All tests passing

### Phase 4: Tests
- [ ] Reorganize test structure
- [ ] Update import statements
- [ ] Create tests for new modules
- [ ] Update fixtures
- [ ] Coverage ≥80% verified
- [ ] All tests passing
- [ ] Performance tests passing

### Phase 5: Integration
- [ ] End-to-end testing complete
- [ ] Performance regression testing
- [ ] Manual feature testing
- [ ] Documentation updates
- [ ] Remove deprecated files
- [ ] Final regression testing
- [ ] Production deployment

### Post-Implementation
- [ ] Monitor production metrics
- [ ] Gather developer feedback
- [ ] Update coding guidelines
- [ ] Knowledge transfer sessions
- [ ] Celebrate success! 🎉

---

## 12. Conclusion

This refactoring architecture provides a comprehensive plan to resolve technical debt by splitting 9 large files (11,945 lines) into 49 well-structured, maintainable files averaging 243 lines each.

**Key Benefits**:
- ✅ All files ≤500 lines (compliance achieved)
- ✅ SOLID principles applied throughout
- ✅ Clear separation of concerns (Command → Service → Repository)
- ✅ Reusable components and utilities
- ✅ Improved testability and maintainability
- ✅ No breaking changes (backwards compatibility maintained)
- ✅ 100% test pass rate throughout migration

**Next Steps**:
1. Review and approve this architecture design
2. Create detailed task breakdown for Phase 1
3. Set up project tracking and monitoring
4. Begin implementation with Phase 1: Extract Utilities

---

**Document Metadata**:
- **Version**: 1.0.0
- **Last Updated**: 2025-11-19
- **Author**: System Architecture Designer
- **Status**: Awaiting Approval
- **Review Required**: Yes

**Related Documents**:
- [Architecture Guidelines](/home/user/algorithms_and_data_structures/docs/ARCHITECTURE_GUIDELINES.md)
- [Code Quality Standards](/home/user/algorithms_and_data_structures/docs/CODE_QUALITY_STANDARDS.md)
- [Large File Refactoring Strategy](/home/user/algorithms_and_data_structures/docs/LARGE_FILE_REFACTORING_STRATEGY.md)
