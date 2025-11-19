# Refactoring Plan: interactive.py

## Current State Analysis

**File:** `/home/user/algorithms_and_data_structures/src/ui/interactive.py`
**Current Lines:** 1133 lines (2.3x limit)
**Target:** 500 lines (227% reduction required)
**Severity:** Medium

### Identified Responsibilities (from earlier read)

The file contains **InteractiveSession** class with **8 distinct responsibilities**:

1. **Session Initialization** (lines ~25-80) - Setup formatter, engine, notes, progress
2. **Main Menu Loop** (lines ~82-150) - show_main_menu, handle navigation
3. **Lesson Mode** (lines ~152-300) - start_lesson_mode, run_lesson_with_notes
4. **Practice Mode** (lines ~302-450) - Practice problems display and interaction
5. **Quiz Mode** (lines ~452-600) - Quiz presentation and scoring
6. **Note-Taking** (lines ~602-750) - take_note, save_note, note management
7. **Progress Tracking** (lines ~752-900) - SessionProgress, calculate progress
8. **Export Functionality** (lines ~902-1133) - export_session, export formats

### Code Smells Detected

1. **Smaller Version of enhanced_interactive.py** - Similar pattern, fewer features
2. **Mixed Responsibilities** - Session management + UI + business logic
3. **Duplicate Code** - Much overlap with enhanced_interactive.py
4. **Tight Coupling** - Direct dependencies on formatter, notes_manager

---

## Refactoring Strategy

### Key Insight: This is a simpler version of enhanced_interactive.py

Many components can be **shared** with enhanced_interactive after its refactoring:

### Phase 1: Share Components with Enhanced Interactive (Priority: HIGH)

After enhanced_interactive.py refactoring completes, interactive.py should USE the same extracted components:

- **Reuse:** `src/ui/session/session_manager.py` (from enhanced_interactive)
- **Reuse:** `src/ui/lessons/lesson_controller.py` (simplified version)
- **Reuse:** `src/ui/menus/menu_controller.py`
- **Reuse:** `src/ui/export/export_manager.py`

### Phase 2: Create Simplified InteractiveSession (Priority: HIGH)

**New File:** `src/ui/interactive/simple_interactive_session.py` (~150 lines)

```python
class SimpleInteractiveSession:
    """Simplified interactive learning session"""

    def __init__(self, cli_engine=None):
        self.session_manager = SessionManager(cli_engine)
        self.menu_controller = MenuController()
        self.lesson_controller = LessonController(basic_mode=True)
        self.practice_controller = PracticeController()
        self.quiz_controller = QuizController()
        self.export_manager = ExportManager()

    def run(self) -> None:
        """Main session loop - orchestrate only"""
        while True:
            action = self.menu_controller.show_main_menu()
            if action == 'lesson':
                self.lesson_controller.run_lesson()
            elif action == 'practice':
                self.practice_controller.run_practice()
            # ... etc (simple delegation)
```

**Reduces from 1133 lines to ~150 lines by reusing extracted components**

### Phase 3: Extract Session State Manager (Priority: MEDIUM)

**New File:** `src/ui/session/session_state.py` (~80 lines)

```python
@dataclass
class SessionState:
    """Track session state"""
    session_start: datetime
    notes: List[LessonNote]
    progress: SessionProgress
    current_module: Optional[str] = None
    current_lesson: Optional[str] = None

class SessionStateManager:
    """Manage session state transitions"""

    def __init__(self):
        self.state = SessionState(
            session_start=datetime.now(),
            notes=[],
            progress=SessionProgress()
        )

    def update_progress(self, module: str, lesson: str) -> None: ...
    def add_note(self, note: LessonNote) -> None: ...
    def get_session_summary(self) -> Dict: ...
```

---

## Final File Structure

After refactoring:

```
src/ui/
├── interactive/
│   ├── __init__.py
│   └── simple_interactive_session.py  (150 lines) - Main orchestrator
├── session/
│   ├── session_manager.py             (shared with enhanced_interactive)
│   └── session_state.py               (80 lines) - State tracking
├── lessons/
│   └── lesson_controller.py           (shared, basic_mode flag)
├── practice/
│   └── practice_controller.py         (shared)
├── quiz/
│   └── quiz_controller.py             (shared)
├── menus/
│   └── menu_controller.py             (shared)
└── export/
    └── export_manager.py              (shared)
```

**Total for interactive.py-specific:** 230 lines (150 + 80)
**Shared components:** Already counted in enhanced_interactive refactoring

---

## Migration Strategy (2 Days)

**Prerequisites:** Complete enhanced_interactive.py refactoring first

1. **Day 1:** Extract SessionStateManager, wire up shared components
2. **Day 2:** Refactor InteractiveSession to SimpleInteractiveSession, integration testing

---

## Effort Estimate

| Phase | Hours | Priority | Notes |
|-------|-------|----------|-------|
| Share Components | 2-3 | HIGH | After enhanced_interactive done |
| Extract State Manager | 2-3 | MEDIUM | Simple extraction |
| Refactor Main Class | 3-4 | HIGH | Orchestration only |
| Testing | 6 | CRITICAL | Ensure compatibility |

**Total: 13-16 hours (2 days)**

**Note:** Assumes enhanced_interactive.py refactoring completed first

---

## Success Criteria

✅ Main orchestrator under 200 lines
✅ All session management components shared
✅ No duplicate code with enhanced_interactive.py
✅ Backward compatible with existing usage
✅ Test coverage ≥80%
✅ Simple, maintainable codebase

---

## Recommended Approach

1. **Wait for enhanced_interactive.py refactoring** - Don't duplicate effort
2. **Identify unique functionality** - What does interactive.py have that enhanced doesn't?
3. **Share everything possible** - Use extracted components
4. **Keep it simple** - This is the "basic" interactive session
5. **Consider merger** - Evaluate if both files are still needed post-refactoring

---

## Future Consideration: Merge with Enhanced Interactive?

After both refactorings complete, evaluate:
- **Could SimpleInteractiveSession be a "basic mode" flag on EnhancedInteractiveSession?**
- **Is maintaining two separate files worth the cost?**
- **Could we have one unified InteractiveSession with feature flags?**

Potential unified structure:
```python
class InteractiveSession:
    def __init__(self, enhanced_mode: bool = False):
        self.session_manager = SessionManager()
        self.enhanced = enhanced_mode
        # Load enhanced features only if enabled
```

This would reduce total code and maintenance burden.
