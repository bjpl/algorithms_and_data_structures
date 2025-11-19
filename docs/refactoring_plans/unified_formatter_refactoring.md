# Refactoring Plan: unified_formatter.py

## Current State Analysis

**File:** `/home/user/algorithms_and_data_structures/src/ui/unified_formatter.py`
**Current Lines:** 1069 lines (2.1x limit)
**Target:** 500 lines (214% reduction required)
**Severity:** Medium

### Identified Components (from earlier read)

1. **PlatformDetector** (lines ~30-100, ~70 lines) - OS detection, capabilities
2. **Color System** (lines ~102-180, ~78 lines) - Color enum with ANSI codes
3. **Theme System** (lines ~182-250, ~68 lines) - Theme dataclass with color schemes
4. **BoxStyle** (lines ~252-320, ~68 lines) - Box drawing characters (ASCII/Unicode)
5. **TextUtils** (lines ~322-480, ~158 lines) - strip_ansi, display_width, pad, wrap
6. **UnifiedFormatter** (lines ~482-1069, ~587 lines) - Main formatter class with 40+ methods

### Code Smells Detected

1. **God Object** - UnifiedFormatter has 587 lines with 40+ methods
2. **Mixed Responsibilities** - Platform detection + text utilities + rendering
3. **Long Method** - Many methods exceed 50 lines
4. **Duplicate Logic** - Similar formatting patterns repeated

---

## Refactoring Strategy

### Phase 1: Extract Platform Detection (Priority: HIGH)

**New File:** `src/ui/platform/platform_detector.py` (~100 lines)

```python
class PlatformDetector:
    """Detect platform capabilities"""

    @staticmethod
    def detect() -> PlatformCapabilities: ...

    @staticmethod
    def _detect_unicode() -> bool: ...

    @staticmethod
    def _detect_color() -> bool: ...

    @staticmethod
    def _detect_terminal_size() -> Tuple[int, int]: ...
```

**Extracted:** Lines ~30-100 (70 lines)

---

### Phase 2: Extract Theme System (Priority: HIGH)

**New File:** `src/ui/themes/theme_manager.py` (~150 lines)

```python
class ThemeManager:
    """Manage color themes"""

    def __init__(self):
        self.themes = {
            'default': DefaultTheme(),
            'dark': DarkTheme(),
            'light': LightTheme(),
            'high_contrast': HighContrastTheme()
        }
        self.current_theme = 'default'

    def get_color(self, color_type: str) -> str:
        """Get ANSI color code for color type"""
        ...

    def set_theme(self, theme_name: str) -> None: ...
```

**New File:** `src/ui/themes/themes.py` (~100 lines)

```python
@dataclass
class Theme:
    """Theme color scheme"""
    primary: str
    secondary: str
    success: str
    warning: str
    error: str
    info: str
    muted: str
    # ... etc

class DefaultTheme(Theme): ...
class DarkTheme(Theme): ...
class LightTheme(Theme): ...
```

**Extracted:** Lines ~102-250 (~148 lines)

---

### Phase 3: Extract Box Drawing (Priority: MEDIUM)

**New File:** `src/ui/rendering/box_renderer.py` (~120 lines)

```python
class BoxRenderer:
    """Render boxes and borders"""

    def __init__(self, style: BoxStyle = BoxStyle.ROUNDED):
        self.style = style

    def render_box(self, content: str, title: Optional[str] = None, width: Optional[int] = None) -> str: ...

    def render_border(self, width: int, style: str = 'top') -> str:
        """Render top/middle/bottom border"""
        ...

    def render_titled_section(self, title: str, content: str) -> str: ...
```

**Extracted:** Lines ~252-320 + box rendering methods from UnifiedFormatter (~150 lines total)

---

### Phase 4: Extract Text Utilities (Priority: HIGH)

**New File:** `src/ui/utils/text_utils.py` (~200 lines)

```python
class TextUtils:
    """Text manipulation utilities"""

    @staticmethod
    def strip_ansi(text: str) -> str:
        """Remove ANSI escape codes"""
        ...

    @staticmethod
    def display_width(text: str) -> int:
        """Calculate display width (excluding ANSI codes)"""
        ...

    @staticmethod
    def pad(text: str, width: int, align: str = 'left') -> str:
        """Pad text to width"""
        ...

    @staticmethod
    def wrap(text: str, width: int, indent: int = 0) -> List[str]:
        """Wrap text to width"""
        ...

    @staticmethod
    def truncate(text: str, max_width: int, ellipsis: str = '...') -> str: ...

    @staticmethod
    def align(text: str, width: int, alignment: str = 'left') -> str: ...
```

**Extracted:** Lines ~322-480 (158 lines)

---

### Phase 5: Split UnifiedFormatter into Specialized Renderers (Priority: CRITICAL)

**Current:** UnifiedFormatter has 40+ methods (587 lines)

**Split into 4 specialized renderers:**

**New File:** `src/ui/rendering/text_renderer.py` (~150 lines)

```python
class TextRenderer:
    """Render text with formatting"""

    def header(self, text: str, level: int = 1) -> None: ...
    def paragraph(self, text: str) -> None: ...
    def success(self, text: str) -> None: ...
    def error(self, text: str) -> None: ...
    def warning(self, text: str) -> None: ...
    def info(self, text: str) -> None: ...
    def muted(self, text: str) -> None: ...
```

**New File:** `src/ui/rendering/table_renderer.py` (~180 lines)

```python
class TableRenderer:
    """Render tables"""

    def render_table(self, data: List[Dict], headers: Optional[List[str]] = None) -> None: ...

    def render_key_value_pairs(self, pairs: Dict, indent: int = 0) -> None: ...

    def calculate_column_widths(self, data: List[Dict], headers: List[str]) -> Dict[str, int]: ...
```

**New File:** `src/ui/rendering/list_renderer.py` (~120 lines)

```python
class ListRenderer:
    """Render lists and trees"""

    def render_list(self, items: List[str], numbered: bool = False) -> None: ...

    def render_tree(self, tree: Dict, indent: int = 0) -> None: ...

    def render_progress_bar(self, current: int, total: int, width: int = 40) -> None: ...
```

**New File:** `src/ui/rendering/unified_formatter.py` (~150 lines)

```python
class UnifiedFormatter:
    """Unified interface to all renderers"""

    def __init__(self):
        self.text_renderer = TextRenderer()
        self.table_renderer = TableRenderer()
        self.list_renderer = ListRenderer()
        self.box_renderer = BoxRenderer()
        self.theme_manager = ThemeManager()
        self.text_utils = TextUtils()

    # Delegate to specialized renderers
    def header(self, text: str, level: int = 1) -> None:
        return self.text_renderer.header(text, level)

    def table(self, data: List[Dict], headers: Optional[List[str]] = None) -> None:
        return self.table_renderer.render_table(data, headers)

    # ... etc (simple delegation)
```

**Extracted:** Lines ~482-1069 split into 4 renderers + delegation facade

---

## Final File Structure

After refactoring:

```
src/ui/
├── platform/
│   ├── __init__.py
│   └── platform_detector.py           (100 lines)
├── themes/
│   ├── __init__.py
│   ├── theme_manager.py               (150 lines)
│   └── themes.py                      (100 lines)
├── utils/
│   ├── __init__.py
│   └── text_utils.py                  (200 lines)
├── rendering/
│   ├── __init__.py
│   ├── text_renderer.py               (150 lines)
│   ├── table_renderer.py              (180 lines)
│   ├── list_renderer.py               (120 lines)
│   ├── box_renderer.py                (120 lines)
│   └── unified_formatter.py           (150 lines) - Facade/delegation
└── formatter.py                       (50 lines) - Backward compat alias
```

**Total:** 1,320 lines across 11 files (~120 lines per file avg)

---

## Migration Strategy (3 Days)

1. **Day 1:** Extract PlatformDetector, ThemeManager, TextUtils
2. **Day 2:** Split UnifiedFormatter into specialized renderers
3. **Day 3:** Create facade for backward compatibility + testing

---

## Effort Estimate

| Phase | Hours | Priority |
|-------|-------|----------|
| Platform Detection | 2-3 | HIGH |
| Theme System | 3-4 | HIGH |
| Box Rendering | 2-3 | MEDIUM |
| Text Utilities | 2-3 | HIGH |
| Split Renderers | 6-8 | CRITICAL |
| Facade & Compat | 3-4 | HIGH |
| Testing | 10 | CRITICAL |

**Total: 28-35 hours (4-5 days)**

---

## Backward Compatibility Strategy

**Critical:** unified_formatter.py is used **everywhere** in the codebase.

**Solution: Facade Pattern**

```python
# src/ui/formatter.py (backward compatibility)
from .rendering.unified_formatter import UnifiedFormatter

class TerminalFormatter(UnifiedFormatter):
    """Backward compatible alias"""
    pass

# Old imports still work:
# from ..ui.formatter import TerminalFormatter
```

All existing code continues to work while new code can use specialized renderers directly.

---

## Success Criteria

✅ All renderer files under 200 lines
✅ Clear separation: platform, themes, utils, rendering
✅ Backward compatible via facade
✅ No breaking changes to existing usage
✅ Specialized renderers independently testable
✅ Test coverage ≥85%

---

## Key Benefits

1. **Single Responsibility** - Each renderer has one job
2. **Testability** - Can test table rendering independently from text rendering
3. **Extensibility** - Easy to add new renderers (chart, diagram, etc.)
4. **Reusability** - TextUtils, ThemeManager usable across app
5. **Maintainability** - Small, focused files easier to understand and modify

---

## Recommended Next Steps

1. **Immediate:** Extract TextUtils (most reusable, no dependencies)
2. **Short-term:** Extract ThemeManager (enables theme customization)
3. **Medium-term:** Split into specialized renderers
4. **Future:** Add new renderers (ChartRenderer, DiagramRenderer)
