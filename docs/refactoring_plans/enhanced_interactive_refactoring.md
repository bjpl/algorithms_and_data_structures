# Refactoring Plan: enhanced_interactive.py

## Current State Analysis

**File:** `/home/user/algorithms_and_data_structures/src/ui/enhanced_interactive.py`
**Current Lines:** 1665 lines (3.3x limit)
**Target:** 500 lines (333% reduction required)
**Severity:** Critical

### Identified Responsibilities

The file contains **8 distinct responsibilities**:

1. **Session Management** (lines 55-103, 179-215)
   - Session initialization
   - Progress tracking
   - Session lifecycle management

2. **Main Menu & Navigation** (lines 211-285)
   - Menu rendering
   - User input handling
   - Navigation flow control

3. **Lesson Mode** (lines 279-369)
   - Lesson content display
   - Step-by-step navigation
   - Content formatting

4. **Note-Taking System** (lines 371-443)
   - Note creation
   - Note storage
   - Note formatting

5. **Practice Mode** (lines 454-635)
   - Problem presentation
   - Solution display
   - Hints system

6. **Quiz Mode** (lines 637-814)
   - Question rendering
   - Answer validation
   - Results calculation

7. **Progress & Export** (lines 1000-1367)
   - Progress calculation
   - Export functionality
   - Report generation

8. **Settings & Configuration** (lines 1369-1520)
   - Animation settings
   - Performance settings
   - System info

### Code Smells Detected

1. **God Object** - EnhancedInteractiveSession handles too many responsibilities
2. **Long Method** - Multiple methods exceed 50 lines (run_enhanced_lesson: 65 lines)
3. **Feature Envy** - Heavy dependency on formatter and notes_manager
4. **Duplicate Code** - Similar menu rendering in multiple methods
5. **Magic Numbers** - Hardcoded values throughout (e.g., timeout values)

---

## Refactoring Strategy

### Phase 1: Extract Session Management (Priority: HIGH)

**New File:** `src/ui/session/session_manager.py` (~150 lines)

```python
class SessionManager:
    """Manages session lifecycle, progress tracking, and persistence"""

    def __init__(self, cli_engine=None):
        self.progress = SessionProgress()
        self.session_start = datetime.now()
        self._init_paths()
        self._load_progress()

    def save_progress(self) -> None: ...
    def load_progress(self) -> None: ...
    def calculate_progress(self) -> float: ...
    def check_achievements(self) -> List[str]: ...
```

**Extracted Code:**
- Lines 55-103 → SessionManager.__init__
- Lines 1623-1651 → SessionManager.load_progress
- Lines 1638-1651 → SessionManager.save_progress
- Lines 1065-1089 → SessionManager.calculate_progress

---

### Phase 2: Extract Menu System (Priority: HIGH)

**New File:** `src/ui/menus/menu_controller.py` (~200 lines)

```python
class MenuController:
    """Handles menu rendering and navigation"""

    def show_main_menu(self) -> str: ...
    def show_lesson_menu(self) -> str: ...
    def show_post_lesson_menu(self) -> str: ...
    def show_export_menu(self) -> str: ...

class MenuItem:
    """Represents a menu item with metadata"""
    ...
```

**Extracted Code:**
- Lines 211-277 → MenuController.show_main_menu
- Lines 432-493 → MenuController.show_post_lesson_menu
- Lines 1126-1159 → MenuController.show_export_menu

---

### Phase 3: Extract Lesson Components (Priority: HIGH)

**New File:** `src/ui/lessons/lesson_controller.py` (~250 lines)

```python
class LessonController:
    """Manages lesson presentation and interaction"""

    def __init__(self, formatter, notes_manager):
        self.formatter = formatter
        self.notes_manager = notes_manager

    def run_lesson(self, topic: str) -> None: ...
    def display_content(self, content: str, step: int, total: int) -> None: ...
    def take_note(self, topic: str) -> Note: ...
```

**New File:** `src/ui/lessons/lesson_renderer.py` (~150 lines)

```python
class LessonRenderer:
    """Renders lesson content with formatting"""

    def render_introduction(self, topic: str) -> str: ...
    def render_content_step(self, content: str, progress: float) -> str: ...
    def render_controls(self) -> str: ...
```

**Extracted Code:**
- Lines 279-369 → LessonController
- Lines 1001-1046 → LessonRenderer

---

### Phase 4: Extract Practice & Quiz (Priority: MEDIUM)

**New File:** `src/ui/practice/practice_controller.py` (~200 lines)

```python
class PracticeController:
    """Manages practice problems and solutions"""

    def show_problem(self, problem: Dict) -> None: ...
    def show_hints(self, hints: List[str]) -> None: ...
    def show_solution(self, problem: Dict) -> None: ...
```

**New File:** `src/ui/quiz/quiz_controller.py` (~250 lines)

```python
class QuizController:
    """Manages quiz presentation and scoring"""

    def run_quiz(self, questions: List[Dict]) -> QuizResult: ...
    def show_question(self, question: Dict, num: int, total: int) -> int: ...
    def show_results(self, score: int, total: int) -> None: ...
```

**Extracted Code:**
- Lines 454-635 → PracticeController
- Lines 637-814 → QuizController

---

### Phase 5: Extract Export System (Priority: MEDIUM)

**New File:** `src/ui/export/export_manager.py` (~200 lines)

```python
class ExportManager:
    """Handles session export in multiple formats"""

    def export_session(self, session_data: Dict, format: str) -> str: ...
    def export_notes(self, notes: List[Note]) -> str: ...
    def export_progress_report(self, progress: SessionProgress) -> str: ...
    def export_web_portfolio(self, session_data: Dict) -> str: ...
```

**Extracted Code:**
- Lines 1126-1367 → ExportManager

---

### Phase 6: Extract Settings (Priority: LOW)

**New File:** `src/ui/settings/settings_controller.py` (~150 lines)

```python
class SettingsController:
    """Manages application settings and configuration"""

    def show_settings_menu(self) -> None: ...
    def animation_settings(self) -> None: ...
    def performance_settings(self) -> None: ...
    def system_info(self) -> None: ...
```

**Extracted Code:**
- Lines 1369-1520 → SettingsController

---

## Final File Structure

After refactoring, the enhanced_interactive.py will be split into:

```
src/ui/
├── enhanced_interactive.py          (300 lines) - Main orchestrator
├── session/
│   ├── __init__.py
│   ├── session_manager.py           (150 lines) - Session lifecycle
│   └── session_progress.py          (80 lines) - Progress tracking
├── menus/
│   ├── __init__.py
│   ├── menu_controller.py           (200 lines) - Menu rendering
│   └── menu_item.py                 (50 lines) - Menu data models
├── lessons/
│   ├── __init__.py
│   ├── lesson_controller.py         (250 lines) - Lesson orchestration
│   └── lesson_renderer.py           (150 lines) - Content rendering
├── practice/
│   ├── __init__.py
│   └── practice_controller.py       (200 lines) - Practice problems
├── quiz/
│   ├── __init__.py
│   └── quiz_controller.py           (250 lines) - Quiz management
├── export/
│   ├── __init__.py
│   └── export_manager.py            (200 lines) - Export functionality
└── settings/
    ├── __init__.py
    └── settings_controller.py       (150 lines) - Settings management
```

**Total:** 1,980 lines across 15 files (~132 lines per file avg)

---

## Migration Strategy

### Step 1: Create Base Infrastructure
1. Create directory structure
2. Extract SessionManager (no dependencies)
3. Extract menu data models
4. Run existing tests to ensure no breakage

### Step 2: Extract Controllers
1. Extract LessonController
2. Extract PracticeController
3. Extract QuizController
4. Update imports in main file

### Step 3: Extract Utilities
1. Extract ExportManager
2. Extract SettingsController
3. Extract MenuController

### Step 4: Refactor Main File
1. Update EnhancedInteractiveSession to orchestrate extracted components
2. Remove duplicate code
3. Update all imports
4. Run full test suite

---

## Test Impact Assessment

### Affected Test Files
- `tests/ui/test_enhanced_interactive.py` - MAJOR CHANGES
- `tests/ui/test_session.py` - NEW FILE NEEDED
- `tests/ui/test_lessons.py` - NEW FILE NEEDED

### Test Migration Strategy
1. **Preserve existing integration tests** - Keep high-level test coverage
2. **Add unit tests for new components** - Test each extracted class independently
3. **Update imports** - Fix all import paths
4. **Add new test files** - One per new module

### Estimated Test Effort
- Update existing tests: 4 hours
- Create new unit tests: 8 hours
- Integration testing: 4 hours
**Total: 16 hours**

---

## Dependencies & Risks

### External Dependencies
- `formatter.TerminalFormatter` - Heavy usage, consider injecting interface
- `notes.NotesManager` - Direct coupling, should use dependency injection
- `navigation.*` - Multiple imports, consolidate
- `cli_engine.curriculum` - Optional dependency, handle gracefully

### Risk Assessment

**HIGH RISKS:**
1. Session state management across multiple files
2. Circular dependencies between controllers
3. Formatter coupling throughout codebase

**MITIGATION:**
1. Use dependency injection for all external dependencies
2. Create clear interfaces for cross-component communication
3. Extract formatter interface, pass as constructor argument

### Breaking Changes
- ❌ Public API changes: EnhancedInteractiveSession constructor signature
- ❌ Module paths: All imports will change
- ✅ Internal methods: Can be freely refactored

---

## Effort Estimate

| Phase | Complexity | Hours | Priority |
|-------|-----------|-------|----------|
| Phase 1: Session | Medium | 3-4 | HIGH |
| Phase 2: Menus | Low | 2-3 | HIGH |
| Phase 3: Lessons | High | 4-6 | HIGH |
| Phase 4: Practice/Quiz | Medium | 5-7 | MEDIUM |
| Phase 5: Export | Low | 2-3 | MEDIUM |
| Phase 6: Settings | Low | 1-2 | LOW |
| Testing | High | 16 | CRITICAL |

**Total: 33-41 hours (4-5 days)**

---

## Success Criteria

✅ All files under 500 lines
✅ Each class has single responsibility
✅ No circular dependencies
✅ 100% test coverage maintained
✅ No breaking changes to public API
✅ Clear separation of concerns
✅ Reduced coupling between components

---

## Recommended Next Steps

1. **Immediate:** Extract SessionManager (low risk, high value)
2. **Short-term:** Extract Lesson & Menu controllers (enables parallel work)
3. **Medium-term:** Extract Practice/Quiz (moderate complexity)
4. **Long-term:** Extract Export & Settings (nice-to-have improvements)
