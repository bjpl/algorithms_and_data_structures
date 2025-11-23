# Formatter Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from legacy formatter imports to the unified formatter architecture with backward compatibility layer.

## Table of Contents

1. [Why Migrate?](#why-migrate)
2. [Migration Strategy](#migration-strategy)
3. [Using the Migration Tool](#using-the-migration-tool)
4. [Manual Migration](#manual-migration)
5. [Before and After Examples](#before-and-after-examples)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedures](#rollback-procedures)
8. [Best Practices](#best-practices)

---

## Why Migrate?

### Benefits

1. **Unified API**: Single formatter interface across all platforms
2. **Better Maintainability**: Centralized formatter logic
3. **Cross-Platform Support**: Automatic platform detection and optimization
4. **Backward Compatibility**: Existing code continues to work during migration
5. **Future-Proof**: Preparation for version 2.0 when legacy formatters will be removed

### Deprecation Timeline

- **Current Version (1.x)**: Legacy formatters work with deprecation warnings
- **Version 2.0**: Legacy formatter modules will be removed
- **Recommended Action**: Migrate now to avoid breaking changes

---

## Migration Strategy

### Phase 1: Assessment (Current)

1. Run analysis to identify all formatter imports
2. Review migration plan
3. Understand impact on your codebase

### Phase 2: Compatibility Layer Migration

1. Update imports to use `formatter_compat`
2. Add deprecation comments
3. Ensure all tests pass

### Phase 3: Modernization (Recommended)

1. Replace compatibility wrappers with `UnifiedFormatter`
2. Use `FormatterFactory` for creating formatters
3. Update to modern API patterns

### Phase 4: Cleanup

1. Remove all legacy imports
2. Update documentation
3. Final testing

---

## Using the Migration Tool

The automated migration tool (`scripts/migrate_formatters.py`) handles the entire migration process.

### Step 1: Analyze Current Usage

```bash
python scripts/migrate_formatters.py analyze
```

**Output:**
```
================================================================================
FORMATTER MIGRATION ANALYSIS REPORT
================================================================================

Timestamp: 2025-01-15T10:30:00

Total files analyzed: 120
Files requiring migration: 45
Total formatter imports found: 78

--------------------------------------------------------------------------------
IMPORTS BY MODULE:
--------------------------------------------------------------------------------
  src.ui.formatter                                     42 imports
  src.ui.windows_formatter                             18 imports
  src.ui.unified_formatter                             12 imports
  src.ui.enhanced_formatter                             6 imports

--------------------------------------------------------------------------------
MIGRATION ACTIONS NEEDED:
--------------------------------------------------------------------------------

File: tests/test_beautiful_formatting.py
  Line 13:
    OLD: from src.ui.formatter import TerminalFormatter, Color
    NEW: from src.ui.formatter_compat import TerminalFormatter, Color

File: tests/conftest.py
  Line 25:
    OLD: from src.ui.formatter import TerminalFormatter
    NEW: from src.ui.formatter_compat import TerminalFormatter

... and 43 more actions
================================================================================
```

### Step 2: Review Migration Plan

```bash
python scripts/migrate_formatters.py plan
```

**Output:**
```
================================================================================
FORMATTER MIGRATION PLAN
================================================================================

Total files to migrate: 45
Total changes to make: 78

--------------------------------------------------------------------------------
FILES TO MIGRATE:
--------------------------------------------------------------------------------

tests/test_beautiful_formatting.py (2 changes):
  Line 13:
    from src.ui.formatter import TerminalFormatter, Color
    → from src.ui.formatter_compat import TerminalFormatter, Color

tests/conftest.py (1 change):
  Line 25:
    from src.ui.formatter import TerminalFormatter
    → from src.ui.formatter_compat import TerminalFormatter

================================================================================

To execute migration, run:
  python scripts/migrate_formatters.py migrate-all

For dry-run (no changes), add --dry-run:
  python scripts/migrate_formatters.py migrate-all --dry-run
================================================================================
```

### Step 3: Dry Run (Optional but Recommended)

```bash
python scripts/migrate_formatters.py migrate-all --dry-run
```

This shows exactly what changes will be made without modifying any files.

### Step 4: Execute Migration

```bash
python scripts/migrate_formatters.py migrate-all
```

**Output:**
```
Migrating 45 files...

✓ tests/test_beautiful_formatting.py
✓ tests/conftest.py
✓ tests/test_ui_formatter.py
✓ tests/test_ui_components.py
...

================================================================================
MIGRATION SUMMARY
================================================================================
Successful: 45
Failed: 0
Skipped: 0

Backups stored in: .migration_backups
================================================================================
```

### Step 5: Verify Changes

```bash
# Run tests to ensure nothing broke
pytest

# Check for any syntax errors
python -m py_compile $(find . -name "*.py")
```

### Step 6: Rollback (If Needed)

```bash
python scripts/migrate_formatters.py rollback
```

---

## Manual Migration

If you prefer manual migration or need to migrate specific patterns:

### Pattern 1: Simple TerminalFormatter Import

**Before:**
```python
from src.ui.formatter import TerminalFormatter
```

**After:**
```python
# DEPRECATED: Migrated to compatibility layer - use FormatterFactory or UnifiedFormatter directly
from src.ui.formatter_compat import TerminalFormatter
```

### Pattern 2: Multiple Imports

**Before:**
```python
from src.ui.formatter import TerminalFormatter, Color, Theme
```

**After:**
```python
# DEPRECATED: Migrated to compatibility layer - use FormatterFactory or UnifiedFormatter directly
from src.ui.formatter_compat import TerminalFormatter, Color, Theme
```

### Pattern 3: WindowsFormatter

**Before:**
```python
from src.ui.windows_formatter import WindowsFormatter, WindowsColor
```

**After:**
```python
# DEPRECATED: Migrated to compatibility layer - use FormatterFactory or UnifiedFormatter directly
from src.ui.formatter_compat import WindowsFormatter, WindowsColor
```

### Pattern 4: UnifiedFormatter (Already Modern)

**Before:**
```python
from src.ui.unified_formatter import UnifiedFormatter, Theme, Color
```

**After:**
```python
# DEPRECATED: Migrated to compatibility layer - use FormatterFactory or UnifiedFormatter directly
from src.ui.formatter_compat import UnifiedFormatter, Theme, Color
```

---

## Before and After Examples

### Example 1: Test File Migration

**Before:**
```python
import pytest
from src.ui.formatter import TerminalFormatter, Color

class TestFormatting:
    def setup_method(self):
        self.formatter = TerminalFormatter()

    def test_color_output(self):
        result = self.formatter.color("test", Color.GREEN)
        assert result
```

**After (Compatibility Layer):**
```python
import pytest
# DEPRECATED: Migrated to compatibility layer - use FormatterFactory or UnifiedFormatter directly
from src.ui.formatter_compat import TerminalFormatter, Color

class TestFormatting:
    def setup_method(self):
        self.formatter = TerminalFormatter()

    def test_color_output(self):
        result = self.formatter.color("test", Color.GREEN)
        assert result
```

**After (Modernized):**
```python
import pytest
from src.ui.formatter_factory import FormatterFactory
from src.ui.unified_formatter import Color

class TestFormatting:
    def setup_method(self):
        self.formatter = FormatterFactory.create_terminal_formatter()

    def test_color_output(self):
        result = self.formatter.color("test", Color.GREEN)
        assert result
```

### Example 2: CLI Application

**Before:**
```python
from src.ui.formatter import TerminalFormatter
from src.ui.windows_formatter import WindowsFormatter
import sys

def get_formatter():
    if sys.platform == 'win32':
        return WindowsFormatter()
    return TerminalFormatter()

formatter = get_formatter()
print(formatter.header("Welcome!"))
```

**After (Compatibility Layer):**
```python
# DEPRECATED: Migrated to compatibility layer - use FormatterFactory or UnifiedFormatter directly
from src.ui.formatter_compat import TerminalFormatter, WindowsFormatter
import sys

def get_formatter():
    if sys.platform == 'win32':
        return WindowsFormatter()
    return TerminalFormatter()

formatter = get_formatter()
print(formatter.header("Welcome!"))
```

**After (Modernized):**
```python
from src.ui.formatter_factory import FormatterFactory

# Factory automatically detects platform and selects appropriate formatter
formatter = FormatterFactory.create_auto()
print(formatter.header("Welcome!"))
```

### Example 3: Custom Formatter Configuration

**Before:**
```python
from src.ui.formatter import TerminalFormatter, Theme, Color

formatter = TerminalFormatter()
formatter.enable_colors()

# Custom theme
custom_theme = Theme(
    primary=Color.CYAN,
    secondary=Color.MAGENTA,
    success=Color.GREEN,
    error=Color.RED
)

print(formatter.panel("Title", "Content", theme=custom_theme))
```

**After (Modernized):**
```python
from src.ui.formatter_factory import FormatterFactory, FormatterPreset
from src.ui.unified_formatter import Theme, Color

# Create formatter with preset
formatter = FormatterFactory.create(FormatterPreset.MODERN)

# Custom theme
custom_theme = Theme(
    primary=Color.CYAN,
    secondary=Color.MAGENTA,
    success=Color.GREEN,
    error=Color.RED
)

print(formatter.panel("Title", "Content", theme=custom_theme))
```

---

## Troubleshooting

### Issue 1: Import Errors After Migration

**Symptom:**
```python
ImportError: cannot import name 'TerminalFormatter' from 'src.ui.formatter_compat'
```

**Solution:**
Ensure `formatter_compat.py` exists and contains the backward compatibility wrappers.

```bash
# Check if file exists
ls src/ui/formatter_compat.py

# If missing, you may need to create it or restore from backup
python scripts/migrate_formatters.py rollback
```

### Issue 2: Deprecation Warnings During Tests

**Symptom:**
```
DeprecationWarning: TerminalFormatter is deprecated and will be removed in version 2.0.
Use UnifiedFormatter or FormatterFactory.create_terminal_formatter() instead.
```

**Solution:**
This is expected behavior. The warnings remind you to modernize the code. To suppress warnings temporarily:

```python
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
```

**Better Solution:**
Modernize the code to use `UnifiedFormatter` or `FormatterFactory`:

```python
from src.ui.formatter_factory import FormatterFactory
formatter = FormatterFactory.create_terminal_formatter()
```

### Issue 3: Tests Fail After Migration

**Symptom:**
Tests that passed before migration now fail.

**Solution:**

1. **Check syntax errors:**
   ```bash
   python -m py_compile path/to/file.py
   ```

2. **Verify imports:**
   ```bash
   python -c "from src.ui.formatter_compat import TerminalFormatter"
   ```

3. **Run specific test to see error:**
   ```bash
   pytest tests/test_file.py -v
   ```

4. **Rollback if needed:**
   ```bash
   python scripts/migrate_formatters.py rollback
   ```

### Issue 4: Circular Import Errors

**Symptom:**
```python
ImportError: cannot import name 'X' from partially initialized module
```

**Solution:**
This usually happens when `formatter_compat` imports from modules that import it back.

1. Check import order in `formatter_compat.py`
2. Ensure no circular dependencies
3. Use lazy imports if necessary:

```python
def get_formatter():
    from src.ui.unified_formatter import UnifiedFormatter
    return UnifiedFormatter()
```

### Issue 5: Platform-Specific Issues

**Symptom:**
Works on Linux/Mac but fails on Windows (or vice versa).

**Solution:**

1. **Test on target platform:**
   ```bash
   pytest tests/ --platform-specific
   ```

2. **Use FormatterFactory for automatic detection:**
   ```python
   from src.ui.formatter_factory import FormatterFactory
   formatter = FormatterFactory.create_auto()
   ```

3. **Check platform-specific code paths:**
   ```python
   import sys
   if sys.platform == 'win32':
       # Windows-specific logic
   ```

---

## Rollback Procedures

### Automatic Rollback

The migration tool creates backups automatically. To rollback all changes:

```bash
python scripts/migrate_formatters.py rollback
```

**Output:**
```json
{
  "status": "success",
  "restored": 45,
  "failed": 0,
  "files_restored": [
    "tests/test_beautiful_formatting.py",
    "tests/conftest.py",
    ...
  ],
  "files_failed": []
}
```

### Manual Rollback

1. **Find backups:**
   ```bash
   ls -la .migration_backups/
   ```

2. **Restore specific file:**
   ```bash
   # Backups are named: timestamp_path_to_file.py
   cp .migration_backups/20250115_103000_tests_conftest.py tests/conftest.py
   ```

3. **Restore from Git (if committed):**
   ```bash
   git checkout HEAD~1 -- path/to/file.py
   ```

### Verification After Rollback

```bash
# Verify syntax
python -m py_compile $(find . -name "*.py")

# Run tests
pytest

# Check git status
git status
```

---

## Best Practices

### 1. Always Use Dry Run First

```bash
python scripts/migrate_formatters.py migrate-all --dry-run
```

Review changes before applying them.

### 2. Migrate in Stages

Instead of migrating everything at once:

```bash
# Migrate one file at a time
python scripts/migrate_formatters.py migrate tests/test_file.py

# Test
pytest tests/test_file.py

# If successful, continue with next file
```

### 3. Run Tests Frequently

```bash
# After each migration
pytest

# Run full test suite
pytest --cov=src --cov-report=html
```

### 4. Commit After Each Stage

```bash
# Commit compatibility layer migration
git add .
git commit -m "chore: Migrate to formatter compatibility layer"

# Later, commit modernization
git add .
git commit -m "refactor: Modernize to use UnifiedFormatter and FormatterFactory"
```

### 5. Update Documentation

After migration, update:

- Code comments
- README files
- API documentation
- Developer guides

### 6. Plan for Modernization

The compatibility layer is a temporary bridge. Plan to modernize:

**Timeline:**
1. **Week 1-2**: Migrate to compatibility layer
2. **Week 3-4**: Modernize critical paths
3. **Week 5-6**: Modernize remaining code
4. **Week 7**: Remove compatibility layer (when ready for 2.0)

**Modernization checklist:**
- [ ] Replace `TerminalFormatter()` with `FormatterFactory.create_terminal_formatter()`
- [ ] Replace `WindowsFormatter()` with `FormatterFactory.create_windows_formatter()`
- [ ] Use `FormatterFactory.create_auto()` for automatic platform detection
- [ ] Update tests to use modern API
- [ ] Remove all `# DEPRECATED` comments

### 7. Monitor Deprecation Warnings

```bash
# Show all deprecation warnings
pytest -W default::DeprecationWarning

# Count deprecation warnings
pytest 2>&1 | grep DeprecationWarning | wc -l
```

Track and reduce warnings over time.

---

## Migration Checklist

Use this checklist to track your migration progress:

### Phase 1: Assessment
- [ ] Run analysis: `python scripts/migrate_formatters.py analyze`
- [ ] Review migration plan: `python scripts/migrate_formatters.py plan`
- [ ] Identify critical files that need special attention
- [ ] Backup entire project: `git commit -a -m "Pre-migration checkpoint"`

### Phase 2: Compatibility Layer Migration
- [ ] Run dry-run: `python scripts/migrate_formatters.py migrate-all --dry-run`
- [ ] Execute migration: `python scripts/migrate_formatters.py migrate-all`
- [ ] Verify all files migrated successfully
- [ ] Run test suite: `pytest`
- [ ] Check for deprecation warnings
- [ ] Commit changes: `git commit -a -m "Migrate to formatter compatibility layer"`

### Phase 3: Modernization (Optional but Recommended)
- [ ] Identify high-priority files for modernization
- [ ] Replace compatibility wrappers with `UnifiedFormatter`
- [ ] Use `FormatterFactory` for creating formatters
- [ ] Update test mocks and fixtures
- [ ] Run tests after each change
- [ ] Commit incrementally

### Phase 4: Cleanup
- [ ] Remove all deprecation comments
- [ ] Update documentation
- [ ] Final test run: `pytest --cov=src`
- [ ] Code review
- [ ] Final commit: `git commit -a -m "Complete formatter modernization"`

### Phase 5: Monitoring
- [ ] Monitor for issues in production
- [ ] Track deprecation warnings
- [ ] Plan removal of compatibility layer (for 2.0)

---

## FAQ

### Q: Will migration break my code?

**A:** No, the compatibility layer ensures existing code continues to work. The migration tool only updates import paths and adds deprecation comments.

### Q: How long does migration take?

**A:** For most projects:
- Small (<50 files): 5-10 minutes
- Medium (50-200 files): 15-30 minutes
- Large (200+ files): 30-60 minutes

Modernization takes longer and should be done incrementally.

### Q: Can I migrate only part of my codebase?

**A:** Yes, you can migrate specific files:

```bash
python scripts/migrate_formatters.py migrate path/to/file.py
```

### Q: What if migration fails?

**A:** The tool creates automatic backups. You can always rollback:

```bash
python scripts/migrate_formatters.py rollback
```

### Q: Do I need to migrate tests too?

**A:** Yes, tests using formatter imports should also be migrated to ensure consistent behavior.

### Q: When will legacy formatters be removed?

**A:** Legacy formatters will be removed in version 2.0. Exact date TBD, but you'll have ample warning.

### Q: Can I use both old and new formatters during migration?

**A:** Yes, the compatibility layer allows mixing both styles during the transition period.

---

## Support

If you encounter issues during migration:

1. **Check this guide** for troubleshooting steps
2. **Review the tool output** for specific error messages
3. **Use rollback** if something goes wrong
4. **Open an issue** on GitHub with:
   - Migration command used
   - Error message
   - Affected files
   - Python version and platform

---

## Summary

The formatter migration is designed to be safe and reversible:

✅ **Automated tool** handles most of the work
✅ **Automatic backups** protect your code
✅ **Dry-run mode** lets you preview changes
✅ **Rollback capability** if anything goes wrong
✅ **Backward compatibility** ensures nothing breaks
✅ **Incremental migration** allows gradual transition

Follow this guide step-by-step, and your migration will be smooth and successful!
