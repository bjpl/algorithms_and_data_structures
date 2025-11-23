# Formatter Migration Quick Reference

## Quick Start

```bash
# 1. Analyze current usage
python scripts/migrate_formatters.py analyze

# 2. Review migration plan
python scripts/migrate_formatters.py plan

# 3. Dry run (preview changes)
python scripts/migrate_formatters.py migrate-all --dry-run

# 4. Execute migration
python scripts/migrate_formatters.py migrate-all

# 5. Verify with tests
pytest

# 6. Rollback if needed
python scripts/migrate_formatters.py rollback
```

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `analyze` | Show current formatter usage | `python scripts/migrate_formatters.py analyze` |
| `plan` | Show detailed migration plan | `python scripts/migrate_formatters.py plan` |
| `migrate FILE` | Migrate single file | `python scripts/migrate_formatters.py migrate tests/test_file.py` |
| `migrate FILE --dry-run` | Preview single file changes | `python scripts/migrate_formatters.py migrate tests/test_file.py --dry-run` |
| `migrate-all` | Migrate all files | `python scripts/migrate_formatters.py migrate-all` |
| `migrate-all --dry-run` | Preview all changes | `python scripts/migrate_formatters.py migrate-all --dry-run` |
| `rollback` | Restore from backups | `python scripts/migrate_formatters.py rollback` |

## Migration Patterns

### Pattern 1: TerminalFormatter
```python
# Before
from src.ui.formatter import TerminalFormatter

# After
from src.ui.formatter_compat import TerminalFormatter
```

### Pattern 2: WindowsFormatter
```python
# Before
from src.ui.windows_formatter import WindowsFormatter

# After
from src.ui.formatter_compat import WindowsFormatter
```

### Pattern 3: UnifiedFormatter
```python
# Before
from src.ui.unified_formatter import UnifiedFormatter

# After
from src.ui.formatter_compat import UnifiedFormatter
```

### Pattern 4: Multiple Imports
```python
# Before
from src.ui.formatter import TerminalFormatter, Color, Theme

# After
from src.ui.formatter_compat import TerminalFormatter, Color, Theme
```

## Safety Features

✅ **Automatic Backups**: Every file is backed up before migration
✅ **Syntax Validation**: Changes are validated before saving
✅ **Auto-Rollback**: Failed migrations are automatically rolled back
✅ **Dry-Run Mode**: Preview all changes without modifying files
✅ **Excluded Files**: Core formatter modules are automatically excluded

## Common Issues

### Issue: Import errors after migration
**Solution:**
```bash
# Check if formatter_compat.py exists
ls src/ui/formatter_compat.py

# Rollback if needed
python scripts/migrate_formatters.py rollback
```

### Issue: Tests failing
**Solution:**
```bash
# Run specific test to see error
pytest tests/test_file.py -v

# Check syntax
python -m py_compile path/to/file.py
```

### Issue: Deprecation warnings
**Solution:**
```python
# Suppress warnings (temporary)
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

# Better: Modernize the code
from src.ui.formatter_factory import FormatterFactory
formatter = FormatterFactory.create_terminal_formatter()
```

## Backup Location

Backups are stored in: `.migration_backups/`

Each backup is timestamped: `YYYYMMDD_HHMMSS_path_to_file.py`

To manually restore:
```bash
cp .migration_backups/20250115_103000_tests_conftest.py tests/conftest.py
```

## Excluded Files

The following files are automatically excluded from migration:
- `formatter_compat.py` (compatibility layer itself)
- `unified_formatter.py` (core formatter)
- `formatter_factory.py` (factory)
- `formatter_plugins/*` (plugin system)
- Files in `archive/`, `old_code_backup/`

## Verification Checklist

After migration:

- [ ] Run full test suite: `pytest`
- [ ] Check for syntax errors: `python -m py_compile $(find . -name "*.py")`
- [ ] Verify imports work: `python -c "from src.ui.formatter_compat import TerminalFormatter"`
- [ ] Review deprecation warnings
- [ ] Check git diff: `git diff`
- [ ] Commit changes: `git commit -m "chore: Migrate to formatter compatibility layer"`

## Modernization Path (After Migration)

```python
# Step 1: Replace compat imports with factory
# OLD
from src.ui.formatter_compat import TerminalFormatter
formatter = TerminalFormatter()

# NEW
from src.ui.formatter_factory import FormatterFactory
formatter = FormatterFactory.create_terminal_formatter()

# Step 2: Use auto-detection
from src.ui.formatter_factory import FormatterFactory
formatter = FormatterFactory.create_auto()  # Detects platform automatically

# Step 3: Use presets
from src.ui.formatter_factory import FormatterFactory, FormatterPreset
formatter = FormatterFactory.create(FormatterPreset.MODERN)
```

## Rollback Safety

If something goes wrong:

```bash
# Option 1: Automatic rollback
python scripts/migrate_formatters.py rollback

# Option 2: Git restore (if committed)
git checkout HEAD~1 -- path/to/file.py

# Option 3: Manual restore from backup
cp .migration_backups/latest_backup.py path/to/file.py
```

## Tips

1. **Always run dry-run first**: `--dry-run` flag shows changes without modifying files
2. **Migrate incrementally**: Test one file at a time for critical code
3. **Run tests frequently**: After each migration or group of migrations
4. **Commit regularly**: Commit after successful migrations
5. **Monitor warnings**: Track deprecation warnings to plan modernization

## Support

For detailed migration guide, see: `docs/MIGRATION_GUIDE.md`

For issues, check the troubleshooting section or open a GitHub issue.
