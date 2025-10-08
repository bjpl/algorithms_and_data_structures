# Scripts Directory

This directory contains utility scripts for project management, setup, and migration tasks.

## Available Scripts

### Migration & Maintenance

#### `migrate_formatters.py`
Automated formatter migration helper for transitioning from legacy formatter imports to the unified formatter architecture.

**Features:**
- Analyze current formatter usage
- Generate migration reports
- Auto-update imports with backup
- Validate changes
- Rollback capability
- Dry-run mode
- Progress reporting

**Usage:**
```bash
# Analyze current usage
python scripts/migrate_formatters.py analyze

# Show migration plan
python scripts/migrate_formatters.py plan

# Migrate specific file
python scripts/migrate_formatters.py migrate path/to/file.py

# Migrate all files (dry-run)
python scripts/migrate_formatters.py migrate-all --dry-run

# Migrate all files
python scripts/migrate_formatters.py migrate-all

# Rollback changes
python scripts/migrate_formatters.py rollback
```

**Documentation:**
- Full Guide: [`docs/MIGRATION_GUIDE.md`](../docs/MIGRATION_GUIDE.md)
- Quick Reference: [`docs/MIGRATION_QUICK_REFERENCE.md`](../docs/MIGRATION_QUICK_REFERENCE.md)

### Project Setup

#### `setup.py`
Project setup and configuration script.

**Usage:**
```bash
python scripts/setup.py
```

#### `quickstart.py`
Quick start script for new users.

**Usage:**
```bash
python scripts/quickstart.py
```

### Curriculum & Learning

#### `load_curriculum.py`
Load and manage curriculum data.

**Usage:**
```bash
python scripts/load_curriculum.py
```

### Launch Scripts

#### `launch_beautiful.py`
Launch the application with beautiful formatting enabled.

**Usage:**
```bash
python scripts/launch_beautiful.py
```

#### `launch_menu.py`
Launch the interactive menu system.

**Usage:**
```bash
python scripts/launch_menu.py
```

#### `run_offline.py`
Run the application in offline mode.

**Usage:**
```bash
python scripts/run_offline.py
```

### Maintenance

#### `cleanup_project.py`
Clean up temporary files, caches, and build artifacts.

**Usage:**
```bash
python scripts/cleanup_project.py
```

## Script Categories

### 🔄 Migration Tools
- `migrate_formatters.py` - Formatter migration automation

### ⚙️ Setup & Configuration
- `setup.py` - Project setup
- `quickstart.py` - Quick start guide

### 📚 Curriculum Management
- `load_curriculum.py` - Curriculum loader

### 🚀 Launch Scripts
- `launch_beautiful.py` - Beautiful UI launcher
- `launch_menu.py` - Menu system launcher
- `run_offline.py` - Offline mode launcher

### 🧹 Maintenance
- `cleanup_project.py` - Project cleanup

## Adding New Scripts

When adding new scripts to this directory:

1. **Use descriptive names**: `verb_noun.py` format (e.g., `migrate_formatters.py`)
2. **Add docstrings**: Include module-level docstring with description and usage
3. **Add to this README**: Document the script in the appropriate category
4. **Make executable**: Add shebang line `#!/usr/bin/env python3`
5. **Add help text**: Implement `--help` flag using `argparse`
6. **Error handling**: Include proper error handling and user feedback
7. **Progress reporting**: Show progress for long-running operations

### Script Template

```python
#!/usr/bin/env python3
"""
Script Name - Brief Description

Detailed description of what the script does.

Features:
- Feature 1
- Feature 2

Usage:
    python scripts/script_name.py [options]
"""

import argparse
import sys
from pathlib import Path


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Script description',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    # Add arguments
    parser.add_argument('--option', help='Option description')

    args = parser.parse_args()

    # Script logic here
    print("Script running...")

    return 0


if __name__ == '__main__':
    sys.exit(main())
```

## Best Practices

1. **Always provide `--help`**: Users should be able to discover functionality
2. **Handle errors gracefully**: Provide clear error messages
3. **Show progress**: For long operations, show progress indicators
4. **Create backups**: For destructive operations, create backups first
5. **Validate inputs**: Check inputs before processing
6. **Use dry-run mode**: For risky operations, provide `--dry-run` option
7. **Log operations**: Maintain logs for debugging
8. **Exit codes**: Use appropriate exit codes (0 = success, 1 = error)

## Environment Requirements

Most scripts require:
- Python 3.8+
- Dependencies from `requirements.txt`
- Project root as working directory

Some scripts may have additional requirements documented in their docstrings.

## Troubleshooting

### Script not found
```bash
# Ensure you're in the project root
cd /path/to/project

# Run script with full path
python scripts/script_name.py
```

### Permission denied
```bash
# On Unix/Linux/Mac, make executable
chmod +x scripts/script_name.py

# Then run directly
./scripts/script_name.py
```

### Import errors
```bash
# Ensure dependencies are installed
pip install -r requirements.txt

# Check Python path includes project root
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

## Contributing

When contributing new scripts:

1. Follow the script template above
2. Add comprehensive help text
3. Include error handling
4. Update this README
5. Add tests if applicable
6. Document in commit message

## Support

For issues with scripts:
1. Check script's `--help` output
2. Review script documentation
3. Check project documentation in `docs/`
4. Open an issue on GitHub

---

**Last Updated:** 2025-01-15
