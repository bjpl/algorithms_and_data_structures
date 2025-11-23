#!/usr/bin/env python3
"""
Formatter Migration Helper Script

Automates the migration from legacy formatter imports to the unified formatter
architecture with backward compatibility layer.

Features:
- Analyze current formatter usage
- Generate migration reports
- Auto-update imports with backup
- Validate changes
- Rollback capability
- Dry-run mode
- Progress reporting

Usage:
    python scripts/migrate_formatters.py analyze
    python scripts/migrate_formatters.py plan
    python scripts/migrate_formatters.py migrate path/to/file.py
    python scripts/migrate_formatters.py migrate-all [--dry-run]
    python scripts/migrate_formatters.py rollback
"""

import ast
import os
import sys
import shutil
import argparse
import json
from pathlib import Path
from typing import List, Dict, Set, Tuple, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
import re


@dataclass
class ImportStatement:
    """Represents a formatter import statement"""
    line_number: int
    module: str  # e.g., 'src.ui.formatter'
    items: List[str]  # e.g., ['TerminalFormatter', 'Color']
    raw_line: str


@dataclass
class MigrationAction:
    """Represents a migration action to perform"""
    file_path: str
    old_import: ImportStatement
    new_import: str
    action_type: str  # 'update', 'add_deprecation_comment', 'no_change'


@dataclass
class MigrationReport:
    """Summary report of migration analysis"""
    total_files: int
    files_to_migrate: int
    total_imports: int
    imports_by_module: Dict[str, int]
    actions: List[MigrationAction]
    timestamp: str


class FormatterMigrator:
    """Main migration helper class"""

    # Mapping of old imports to new compatibility layer
    MIGRATION_MAP = {
        'src.ui.formatter': 'src.ui.formatter_compat',
        'src.ui.windows_formatter': 'src.ui.formatter_compat',
        'src.ui.enhanced_formatter': 'src.ui.formatter_compat',
        'src.ui.unified_formatter': 'src.ui.formatter_compat',
    }

    # Items that should be imported from formatter_compat
    COMPAT_ITEMS = {
        'TerminalFormatter', 'WindowsFormatter', 'BeautifulFormatter',
        'UnifiedFormatter', 'Color', 'Theme', 'WindowsColor', 'GradientPreset'
    }

    # Patterns to detect formatter imports
    IMPORT_PATTERNS = [
        r'from\s+(src\.ui\.(?:formatter|windows_formatter|enhanced_formatter|unified_formatter))\s+import\s+(.+)',
        r'import\s+(src\.ui\.(?:formatter|windows_formatter|enhanced_formatter|unified_formatter))',
    ]

    def __init__(self, root_dir: str = None, backup_dir: str = None):
        """
        Initialize migrator

        Args:
            root_dir: Root directory to search for files (default: project root)
            backup_dir: Directory to store backups (default: .migration_backups)
        """
        self.root_dir = Path(root_dir) if root_dir else Path.cwd()
        self.backup_dir = Path(backup_dir) if backup_dir else self.root_dir / '.migration_backups'
        self.backup_dir.mkdir(exist_ok=True)

        # Exclude patterns
        self.exclude_patterns = [
            '__pycache__', '.git', 'node_modules', 'venv', 'env',
            '.migration_backups', 'archive', 'old_code_backup'
        ]

        # Exclude specific files (don't migrate these)
        self.exclude_files = [
            'formatter_compat.py',  # Don't migrate the compatibility layer itself
            'unified_formatter.py',  # Core formatter modules
            'formatter_factory.py',
            'formatter_plugins'
        ]

    def find_python_files(self) -> List[Path]:
        """Find all Python files to analyze"""
        python_files = []

        for path in self.root_dir.rglob('*.py'):
            # Check if path contains any exclude pattern
            if any(pattern in str(path) for pattern in self.exclude_patterns):
                continue

            # Check if file should be excluded
            if any(exclude_file in path.name for exclude_file in self.exclude_files):
                continue

            python_files.append(path)

        return sorted(python_files)

    def analyze_file(self, file_path: Path) -> List[ImportStatement]:
        """
        Analyze a file for formatter imports

        Args:
            file_path: Path to Python file

        Returns:
            List of ImportStatement objects found in the file
        """
        imports = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')

            # Use regex to find imports (more reliable than AST for this)
            for i, line in enumerate(lines, 1):
                for pattern in self.IMPORT_PATTERNS:
                    match = re.match(pattern, line.strip())
                    if match:
                        module = match.group(1)
                        # Parse imported items
                        items = []
                        if 'import' in line and 'from' in line:
                            # from X import Y, Z
                            import_part = line.split('import')[1].strip()
                            # Handle parenthesized imports
                            if '(' in import_part:
                                # Multi-line import - need to handle specially
                                items = self._parse_multiline_import(lines, i - 1)
                            else:
                                items = [item.strip() for item in import_part.split(',')]

                        imports.append(ImportStatement(
                            line_number=i,
                            module=module,
                            items=items,
                            raw_line=line
                        ))

        except Exception as e:
            print(f"Warning: Could not analyze {file_path}: {e}")

        return imports

    def _parse_multiline_import(self, lines: List[str], start_idx: int) -> List[str]:
        """Parse multiline import statement"""
        items = []
        current_line = lines[start_idx]

        # Find opening parenthesis
        if '(' not in current_line:
            return []

        # Collect all lines until closing parenthesis
        import_text = current_line.split('import')[1]
        idx = start_idx

        while ')' not in import_text and idx < len(lines) - 1:
            idx += 1
            import_text += ' ' + lines[idx]

        # Remove parentheses and split
        import_text = import_text.replace('(', '').replace(')', '')
        items = [item.strip() for item in import_text.split(',') if item.strip()]

        return items

    def generate_new_import(self, old_import: ImportStatement) -> str:
        """
        Generate the new import statement

        Args:
            old_import: Original ImportStatement

        Returns:
            New import string
        """
        new_module = self.MIGRATION_MAP.get(old_import.module, old_import.module)

        if old_import.items:
            # Filter items that should be imported from compat layer
            compat_items = [item for item in old_import.items if item in self.COMPAT_ITEMS]

            if compat_items:
                items_str = ', '.join(compat_items)
                return f"from {new_module} import {items_str}"

        return old_import.raw_line  # No change needed

    def create_migration_plan(self, files: List[Path]) -> MigrationReport:
        """
        Analyze files and create migration plan

        Args:
            files: List of files to analyze

        Returns:
            MigrationReport with all actions needed
        """
        actions = []
        imports_by_module = {}
        total_imports = 0
        files_to_migrate = set()

        for file_path in files:
            imports = self.analyze_file(file_path)

            for imp in imports:
                total_imports += 1
                imports_by_module[imp.module] = imports_by_module.get(imp.module, 0) + 1

                # Check if migration needed
                if imp.module in self.MIGRATION_MAP:
                    new_import = self.generate_new_import(imp)

                    if new_import != imp.raw_line:
                        files_to_migrate.add(str(file_path))
                        actions.append(MigrationAction(
                            file_path=str(file_path),
                            old_import=imp,
                            new_import=new_import,
                            action_type='update'
                        ))

        return MigrationReport(
            total_files=len(files),
            files_to_migrate=len(files_to_migrate),
            total_imports=total_imports,
            imports_by_module=imports_by_module,
            actions=actions,
            timestamp=datetime.now().isoformat()
        )

    def backup_file(self, file_path: Path) -> Path:
        """
        Create backup of file

        Args:
            file_path: File to backup

        Returns:
            Path to backup file
        """
        # Create timestamped backup
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        relative_path = file_path.relative_to(self.root_dir)
        backup_path = self.backup_dir / f"{timestamp}_{relative_path}"

        # Ensure backup directory exists
        backup_path.parent.mkdir(parents=True, exist_ok=True)

        # Copy file
        shutil.copy2(file_path, backup_path)

        return backup_path

    def migrate_file(self, file_path: Path, dry_run: bool = False) -> Dict[str, any]:
        """
        Migrate a single file

        Args:
            file_path: File to migrate
            dry_run: If True, only show what would be done

        Returns:
            Dictionary with migration results
        """
        imports = self.analyze_file(file_path)

        if not imports:
            return {
                'status': 'skipped',
                'reason': 'no_formatter_imports',
                'file': str(file_path)
            }

        # Read file content
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        changes_made = []
        new_lines = lines.copy()

        # Process imports in reverse order to maintain line numbers
        for imp in sorted(imports, key=lambda x: x.line_number, reverse=True):
            if imp.module in self.MIGRATION_MAP:
                new_import = self.generate_new_import(imp)

                if new_import != imp.raw_line:
                    # Add deprecation notice comment
                    deprecation_comment = (
                        f"# DEPRECATED: Migrated to compatibility layer - "
                        f"use FormatterFactory or UnifiedFormatter directly\n"
                    )

                    # Replace the line
                    line_idx = imp.line_number - 1
                    new_lines[line_idx] = new_import + '\n'

                    # Add comment before import if not already there
                    if line_idx > 0 and 'DEPRECATED' not in new_lines[line_idx - 1]:
                        new_lines.insert(line_idx, deprecation_comment)

                    changes_made.append({
                        'line': imp.line_number,
                        'old': imp.raw_line,
                        'new': new_import
                    })

        if not changes_made:
            return {
                'status': 'skipped',
                'reason': 'no_changes_needed',
                'file': str(file_path)
            }

        if dry_run:
            return {
                'status': 'dry_run',
                'file': str(file_path),
                'changes': changes_made
            }

        # Backup original file
        backup_path = self.backup_file(file_path)

        # Write migrated content
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)

            # Validate syntax
            if self.validate_syntax(file_path):
                return {
                    'status': 'success',
                    'file': str(file_path),
                    'backup': str(backup_path),
                    'changes': changes_made
                }
            else:
                # Rollback on syntax error
                shutil.copy2(backup_path, file_path)
                return {
                    'status': 'failed',
                    'reason': 'syntax_error',
                    'file': str(file_path),
                    'backup': str(backup_path)
                }

        except Exception as e:
            # Rollback on any error
            shutil.copy2(backup_path, file_path)
            return {
                'status': 'failed',
                'reason': str(e),
                'file': str(file_path),
                'backup': str(backup_path)
            }

    def validate_syntax(self, file_path: Path) -> bool:
        """
        Validate Python syntax of file

        Args:
            file_path: File to validate

        Returns:
            True if syntax is valid, False otherwise
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                ast.parse(f.read())
            return True
        except SyntaxError:
            return False

    def rollback_all(self) -> Dict[str, any]:
        """
        Rollback all migrations using latest backups

        Returns:
            Dictionary with rollback results
        """
        if not self.backup_dir.exists():
            return {
                'status': 'failed',
                'reason': 'no_backups_found'
            }

        # Find all backups
        backups = list(self.backup_dir.rglob('*.py'))

        if not backups:
            return {
                'status': 'failed',
                'reason': 'no_backups_found'
            }

        # Group backups by original file
        backup_groups = {}
        for backup in backups:
            # Extract original path from backup name
            # Format: timestamp_path_to_file.py
            name_parts = backup.name.split('_', 1)
            if len(name_parts) == 2:
                relative_path = Path(name_parts[1])
                original_path = self.root_dir / relative_path

                if str(original_path) not in backup_groups:
                    backup_groups[str(original_path)] = []
                backup_groups[str(original_path)].append(backup)

        # Restore latest backup for each file
        restored = []
        failed = []

        for original_path, backups in backup_groups.items():
            # Get most recent backup
            latest_backup = max(backups, key=lambda p: p.stat().st_mtime)

            try:
                shutil.copy2(latest_backup, original_path)
                restored.append(original_path)
            except Exception as e:
                failed.append({
                    'file': original_path,
                    'error': str(e)
                })

        return {
            'status': 'success',
            'restored': len(restored),
            'failed': len(failed),
            'files_restored': restored,
            'files_failed': failed
        }

    def print_analysis_report(self, report: MigrationReport):
        """Print analysis report to console"""
        print("\n" + "=" * 80)
        print("FORMATTER MIGRATION ANALYSIS REPORT")
        print("=" * 80)
        print(f"\nTimestamp: {report.timestamp}")
        print(f"\nTotal files analyzed: {report.total_files}")
        print(f"Files requiring migration: {report.files_to_migrate}")
        print(f"Total formatter imports found: {report.total_imports}")

        print("\n" + "-" * 80)
        print("IMPORTS BY MODULE:")
        print("-" * 80)
        for module, count in sorted(report.imports_by_module.items()):
            print(f"  {module:50} {count:5} imports")

        if report.actions:
            print("\n" + "-" * 80)
            print("MIGRATION ACTIONS NEEDED:")
            print("-" * 80)

            for action in report.actions[:10]:  # Show first 10
                print(f"\nFile: {action.file_path}")
                print(f"  Line {action.old_import.line_number}:")
                print(f"    OLD: {action.old_import.raw_line}")
                print(f"    NEW: {action.new_import}")

            if len(report.actions) > 10:
                print(f"\n  ... and {len(report.actions) - 10} more actions")

        print("\n" + "=" * 80)

    def print_migration_plan(self, report: MigrationReport):
        """Print migration plan"""
        print("\n" + "=" * 80)
        print("FORMATTER MIGRATION PLAN")
        print("=" * 80)

        print(f"\nTotal files to migrate: {report.files_to_migrate}")
        print(f"Total changes to make: {len(report.actions)}")

        # Group by file
        files_map = {}
        for action in report.actions:
            if action.file_path not in files_map:
                files_map[action.file_path] = []
            files_map[action.file_path].append(action)

        print("\n" + "-" * 80)
        print("FILES TO MIGRATE:")
        print("-" * 80)

        for file_path, actions in sorted(files_map.items()):
            print(f"\n{file_path} ({len(actions)} changes):")
            for action in actions:
                print(f"  Line {action.old_import.line_number}:")
                print(f"    {action.old_import.raw_line.strip()}")
                print(f"    → {action.new_import.strip()}")

        print("\n" + "=" * 80)
        print("\nTo execute migration, run:")
        print("  python scripts/migrate_formatters.py migrate-all")
        print("\nFor dry-run (no changes), add --dry-run:")
        print("  python scripts/migrate_formatters.py migrate-all --dry-run")
        print("=" * 80 + "\n")


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description='Automated formatter migration helper',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to execute')

    # Analyze command
    subparsers.add_parser('analyze', help='Analyze current formatter usage')

    # Plan command
    subparsers.add_parser('plan', help='Show migration plan')

    # Migrate command
    migrate_parser = subparsers.add_parser('migrate', help='Migrate specific file')
    migrate_parser.add_argument('file', help='File to migrate')
    migrate_parser.add_argument('--dry-run', action='store_true', help='Show changes without applying')

    # Migrate-all command
    migrate_all_parser = subparsers.add_parser('migrate-all', help='Migrate all files')
    migrate_all_parser.add_argument('--dry-run', action='store_true', help='Show changes without applying')

    # Rollback command
    subparsers.add_parser('rollback', help='Rollback all migrations')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    # Initialize migrator
    migrator = FormatterMigrator()

    if args.command == 'analyze':
        files = migrator.find_python_files()
        report = migrator.create_migration_plan(files)
        migrator.print_analysis_report(report)

    elif args.command == 'plan':
        files = migrator.find_python_files()
        report = migrator.create_migration_plan(files)
        migrator.print_migration_plan(report)

    elif args.command == 'migrate':
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"Error: File not found: {file_path}")
            return 1

        result = migrator.migrate_file(file_path, dry_run=args.dry_run)
        print(f"\nMigration result: {result['status']}")
        print(json.dumps(result, indent=2))

    elif args.command == 'migrate-all':
        files = migrator.find_python_files()
        report = migrator.create_migration_plan(files)

        if not report.actions:
            print("\nNo migrations needed!")
            return 0

        print(f"\nMigrating {report.files_to_migrate} files...")

        results = {
            'success': [],
            'failed': [],
            'skipped': [],
            'dry_run': []
        }

        # Get unique files to migrate
        files_to_migrate = set(action.file_path for action in report.actions)

        for file_path in files_to_migrate:
            result = migrator.migrate_file(Path(file_path), dry_run=args.dry_run)
            results[result['status']].append(result)

            # Print progress
            if args.dry_run:
                status_icon = '○'  # Dry run indicator
            else:
                status_icon = '✓' if result['status'] == 'success' else '✗'
            print(f"{status_icon} {file_path}")

        # Print summary
        print("\n" + "=" * 80)
        print("MIGRATION SUMMARY")
        print("=" * 80)

        if args.dry_run:
            print(f"Files to migrate: {len(results['dry_run'])}")
            print(f"Total changes: {sum(len(r.get('changes', [])) for r in results['dry_run'])}")
        else:
            print(f"Successful: {len(results['success'])}")
            print(f"Failed: {len(results['failed'])}")
            print(f"Skipped: {len(results['skipped'])}")

        if args.dry_run:
            print("\n[DRY RUN - No changes were made]")
        else:
            print(f"\nBackups stored in: {migrator.backup_dir}")

        print("=" * 80 + "\n")

    elif args.command == 'rollback':
        print("\nRolling back migrations...")
        result = migrator.rollback_all()

        print(f"\nRollback result: {result['status']}")
        print(json.dumps(result, indent=2))

    return 0


if __name__ == '__main__':
    sys.exit(main())
