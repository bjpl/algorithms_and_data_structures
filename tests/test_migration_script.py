#!/usr/bin/env python3
"""
Tests for the formatter migration script.

Tests the migration helper functionality including:
- File analysis
- Migration plan generation
- Import detection
- Backup creation
- Syntax validation
"""

import pytest
import tempfile
import shutil
from pathlib import Path
import sys
import os

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'scripts'))

from migrate_formatters import FormatterMigrator, ImportStatement, MigrationAction


class TestFormatterMigrator:
    """Test suite for FormatterMigrator"""

    @pytest.fixture
    def temp_project_dir(self):
        """Create a temporary project directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)

    @pytest.fixture
    def migrator(self, temp_project_dir):
        """Create a FormatterMigrator instance"""
        return FormatterMigrator(root_dir=str(temp_project_dir))

    @pytest.fixture
    def sample_file(self, temp_project_dir):
        """Create a sample Python file with formatter imports"""
        file_path = temp_project_dir / 'test_file.py'
        content = '''#!/usr/bin/env python3
"""Sample test file"""

# DEPRECATED: Migrated to compatibility layer - use FormatterFactory or UnifiedFormatter directly
from src.ui.formatter_compat import TerminalFormatter, Color

def test_something():
    formatter = TerminalFormatter()
    result = formatter.color("test", Color.GREEN)
    return result
'''
        file_path.write_text(content)
        return file_path

    @pytest.fixture
    def sample_file_windows(self, temp_project_dir):
        """Create a sample file with WindowsFormatter import"""
        file_path = temp_project_dir / 'test_windows.py'
        content = '''from src.ui.windows_formatter import WindowsFormatter, WindowsColor

formatter = WindowsFormatter()
'''
        file_path.write_text(content)
        return file_path

    def test_find_python_files(self, migrator, temp_project_dir):
        """Test finding Python files"""
        # Create test files
        (temp_project_dir / 'file1.py').write_text('# test')
        (temp_project_dir / 'file2.py').write_text('# test')
        (temp_project_dir / 'not_python.txt').write_text('# test')

        # Create excluded directory
        excluded_dir = temp_project_dir / '__pycache__'
        excluded_dir.mkdir()
        (excluded_dir / 'excluded.py').write_text('# test')

        files = migrator.find_python_files()

        assert len(files) == 2
        assert all(f.suffix == '.py' for f in files)
        assert not any('__pycache__' in str(f) for f in files)

    def test_analyze_file_simple_import(self, migrator, sample_file):
        """Test analyzing file with simple import"""
        imports = migrator.analyze_file(sample_file)

        assert len(imports) == 1
        imp = imports[0]
        assert imp.module == 'src.ui.formatter'
        assert 'TerminalFormatter' in imp.items
        assert 'Color' in imp.items
        assert imp.line_number == 4

    def test_analyze_file_windows_import(self, migrator, sample_file_windows):
        """Test analyzing file with WindowsFormatter import"""
        imports = migrator.analyze_file(sample_file_windows)

        assert len(imports) == 1
        imp = imports[0]
        assert imp.module == 'src.ui.windows_formatter'
        assert 'WindowsFormatter' in imp.items
        assert 'WindowsColor' in imp.items

    def test_generate_new_import(self, migrator):
        """Test generating new import statement"""
        old_import = ImportStatement(
            line_number=10,
            module='src.ui.formatter',
            items=['TerminalFormatter', 'Color'],
            raw_line='from src.ui.formatter import TerminalFormatter, Color'
        )

        new_import = migrator.generate_new_import(old_import)

        assert new_import == 'from src.ui.formatter_compat import TerminalFormatter, Color'

    def test_generate_new_import_windows(self, migrator):
        """Test generating new import for WindowsFormatter"""
        old_import = ImportStatement(
            line_number=5,
            module='src.ui.windows_formatter',
            items=['WindowsFormatter'],
            raw_line='from src.ui.windows_formatter import WindowsFormatter'
        )

        new_import = migrator.generate_new_import(old_import)

        assert new_import == 'from src.ui.formatter_compat import WindowsFormatter'

    def test_create_migration_plan(self, migrator, sample_file):
        """Test creating migration plan"""
        files = [sample_file]
        report = migrator.create_migration_plan(files)

        assert report.total_files == 1
        assert report.files_to_migrate == 1
        assert report.total_imports == 1
        assert len(report.actions) == 1
        assert 'src.ui.formatter' in report.imports_by_module

    def test_backup_file(self, migrator, sample_file):
        """Test file backup creation"""
        backup_path = migrator.backup_file(sample_file)

        assert backup_path.exists()
        assert backup_path.read_text() == sample_file.read_text()
        assert str(migrator.backup_dir) in str(backup_path)

    def test_validate_syntax_valid(self, migrator, sample_file):
        """Test syntax validation with valid file"""
        assert migrator.validate_syntax(sample_file) is True

    def test_validate_syntax_invalid(self, migrator, temp_project_dir):
        """Test syntax validation with invalid file"""
        invalid_file = temp_project_dir / 'invalid.py'
        invalid_file.write_text('def broken(\n  # missing closing paren')

        assert migrator.validate_syntax(invalid_file) is False

    def test_migrate_file_dry_run(self, migrator, sample_file):
        """Test file migration in dry-run mode"""
        result = migrator.migrate_file(sample_file, dry_run=True)

        assert result['status'] == 'dry_run'
        assert len(result['changes']) == 1
        assert result['changes'][0]['line'] == 4

        # Verify file wasn't changed
        content = sample_file.read_text()
        assert 'formatter_compat' not in content

    def test_migrate_file_actual(self, migrator, sample_file):
        """Test actual file migration"""
        original_content = sample_file.read_text()

        result = migrator.migrate_file(sample_file, dry_run=False)

        assert result['status'] == 'success'
        assert 'backup' in result

        # Verify file was changed
        new_content = sample_file.read_text()
        assert 'formatter_compat' in new_content
        assert 'DEPRECATED' in new_content

        # Verify backup exists
        backup_path = Path(result['backup'])
        assert backup_path.exists()
        assert backup_path.read_text() == original_content

    def test_migrate_file_no_changes_needed(self, migrator, temp_project_dir):
        """Test migration when no changes are needed"""
        # File without formatter imports
        file_path = temp_project_dir / 'no_formatter.py'
        file_path.write_text('import os\nimport sys\n')

        result = migrator.migrate_file(file_path)

        assert result['status'] == 'skipped'
        assert result['reason'] == 'no_formatter_imports'

    def test_exclude_patterns(self, migrator, temp_project_dir):
        """Test that excluded patterns are properly excluded"""
        # Create files in excluded directories
        for excluded in ['__pycache__', 'archive', 'old_code_backup']:
            excluded_dir = temp_project_dir / excluded
            excluded_dir.mkdir()
            (excluded_dir / 'test.py').write_text('# test')

        files = migrator.find_python_files()

        assert len(files) == 0

    def test_exclude_core_formatter_files(self, migrator, temp_project_dir):
        """Test that core formatter files are excluded"""
        # Create core formatter files
        ui_dir = temp_project_dir / 'src' / 'ui'
        ui_dir.mkdir(parents=True)

        for excluded_file in ['formatter_compat.py', 'unified_formatter.py', 'formatter_factory.py']:
            (ui_dir / excluded_file).write_text('# core formatter')

        files = migrator.find_python_files()

        # None of these files should be included
        file_names = [f.name for f in files]
        assert 'formatter_compat.py' not in file_names
        assert 'unified_formatter.py' not in file_names
        assert 'formatter_factory.py' not in file_names

    def test_multiline_import_detection(self, migrator, temp_project_dir):
        """Test detection of multiline imports"""
        file_path = temp_project_dir / 'multiline.py'
        content = '''from src.ui.formatter import (
    TerminalFormatter,
    Color,
    Theme
)
'''
        file_path.write_text(content)

        imports = migrator.analyze_file(file_path)

        assert len(imports) == 1
        imp = imports[0]
        assert len(imp.items) == 3
        assert 'TerminalFormatter' in imp.items
        assert 'Color' in imp.items
        assert 'Theme' in imp.items

    def test_migration_preserves_functionality(self, migrator, sample_file):
        """Test that migration preserves file functionality"""
        # Migrate the file
        result = migrator.migrate_file(sample_file, dry_run=False)
        assert result['status'] == 'success'

        # Verify syntax is still valid
        assert migrator.validate_syntax(sample_file)

        # Verify file content was updated
        content = sample_file.read_text()
        assert 'formatter_compat' in content
        assert 'DEPRECATED' in content

        # Verify the old import is gone and new import exists
        assert 'from src.ui.formatter_compat import' in content


class TestMigrationReport:
    """Test migration report generation"""

    def test_report_creation(self):
        """Test creating a migration report"""
        from migrate_formatters import MigrationReport

        report = MigrationReport(
            total_files=10,
            files_to_migrate=5,
            total_imports=8,
            imports_by_module={'src.ui.formatter': 8},
            actions=[],
            timestamp='2025-01-15T10:00:00'
        )

        assert report.total_files == 10
        assert report.files_to_migrate == 5
        assert report.total_imports == 8


class TestImportStatement:
    """Test ImportStatement dataclass"""

    def test_import_statement_creation(self):
        """Test creating an ImportStatement"""
        imp = ImportStatement(
            line_number=10,
            module='src.ui.formatter',
            items=['TerminalFormatter'],
            raw_line='from src.ui.formatter import TerminalFormatter'
        )

        assert imp.line_number == 10
        assert imp.module == 'src.ui.formatter'
        assert imp.items == ['TerminalFormatter']


class TestMigrationAction:
    """Test MigrationAction dataclass"""

    def test_migration_action_creation(self):
        """Test creating a MigrationAction"""
        old_import = ImportStatement(
            line_number=10,
            module='src.ui.formatter',
            items=['TerminalFormatter'],
            raw_line='from src.ui.formatter import TerminalFormatter'
        )

        action = MigrationAction(
            file_path='/path/to/file.py',
            old_import=old_import,
            new_import='from src.ui.formatter_compat import TerminalFormatter',
            action_type='update'
        )

        assert action.file_path == '/path/to/file.py'
        assert action.action_type == 'update'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
