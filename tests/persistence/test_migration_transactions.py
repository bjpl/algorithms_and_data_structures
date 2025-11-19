"""
Test Suite for Migration Transaction Support

Tests verify that database migrations use transactions properly:
- Migrations execute atomically
- Failed migrations trigger automatic rollback
- Database integrity is preserved on failure
- All backend types handle transactions correctly
"""

import pytest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
import json

# Import components to test
import sys
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from src.persistence.db_manager import DatabaseManager
from src.persistence.backends import SQLiteBackend, JSONBackend
from src.persistence.exceptions import MigrationError


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def temp_dir():
    """Create temporary directory for test files."""
    temp_path = Path(tempfile.mkdtemp())
    yield temp_path
    shutil.rmtree(temp_path, ignore_errors=True)


@pytest.fixture
def migrations_dir(temp_dir):
    """Create migrations directory."""
    migrations_path = temp_dir / "migrations"
    migrations_path.mkdir(parents=True, exist_ok=True)
    return migrations_path


@pytest.fixture
def sqlite_config(temp_dir, migrations_dir):
    """Create SQLite database configuration."""
    return {
        'backend': 'sqlite',
        'connection_string': str(temp_dir / 'test.db'),
        'migrations_path': str(migrations_dir),
        'cache_size': 10,
        'timeout': 5
    }


@pytest.fixture
def json_config(temp_dir, migrations_dir):
    """Create JSON backend configuration."""
    return {
        'backend': 'json',
        'connection_string': str(temp_dir / 'storage.json'),
        'migrations_path': str(migrations_dir),
        'cache_size': 10
    }


def create_failing_migration(migrations_dir: Path, version: int, name: str, fail_point: str = 'middle') -> Path:
    """
    Create a migration that fails at a specific point.

    Args:
        migrations_dir: Migrations directory
        version: Migration version number
        name: Migration name
        fail_point: When to fail - 'start', 'middle', or 'end'

    Returns:
        Path to created migration file
    """
    filename = f"{version}_{name}.py"
    filepath = migrations_dir / filename

    if fail_point == 'start':
        up_code = """
def up(backend, config):
    \"\"\"Migration that fails immediately.\"\"\"
    raise RuntimeError("Migration failed at start")
"""
    elif fail_point == 'middle':
        up_code = """
def up(backend, config):
    \"\"\"Migration that fails mid-execution.\"\"\"
    # First operation succeeds
    backend.set('migration_data_1', {'status': 'created', 'value': 'test1'})

    # Second operation succeeds
    backend.set('migration_data_2', {'status': 'created', 'value': 'test2'})

    # Simulate failure mid-migration
    raise RuntimeError("Migration failed in the middle")

    # This should never execute
    backend.set('migration_data_3', {'status': 'created', 'value': 'test3'})
"""
    else:  # 'end'
        up_code = """
def up(backend, config):
    \"\"\"Migration that fails at the end.\"\"\"
    backend.set('migration_data_1', {'status': 'created', 'value': 'test1'})
    backend.set('migration_data_2', {'status': 'created', 'value': 'test2'})

    # Fail just before completion
    raise RuntimeError("Migration failed at end")
"""

    down_code = """
def down(backend, config):
    \"\"\"Rollback the migration.\"\"\"
    backend.delete('migration_data_1')
    backend.delete('migration_data_2')
    backend.delete('migration_data_3')
"""

    content = f'''"""
Migration: {name}
Created: {datetime.now().isoformat()}
"""

from typing import Dict, Any

{up_code}

{down_code}

# Migration metadata
VERSION = {version}
DESCRIPTION = "Test migration {name}"
DEPENDENCIES = []
'''

    filepath.write_text(content)
    return filepath


def create_successful_migration(migrations_dir: Path, version: int, name: str) -> Path:
    """Create a successful migration for testing."""
    filename = f"{version}_{name}.py"
    filepath = migrations_dir / filename

    content = f'''"""
Migration: {name}
Created: {datetime.now().isoformat()}
"""

from typing import Dict, Any

def up(backend, config):
    \"\"\"Apply the migration.\"\"\"
    backend.set('successful_migration', {{'version': VERSION, 'applied': True}})
    backend.set('test_data', {{'value': 'success'}})

def down(backend, config):
    \"\"\"Rollback the migration.\"\"\"
    backend.delete('successful_migration')
    backend.delete('test_data')

# Migration metadata
VERSION = {version}
DESCRIPTION = "Successful test migration"
DEPENDENCIES = []
'''

    filepath.write_text(content)
    return filepath


# ============================================================================
# Transaction Rollback Tests - SQLite Backend
# ============================================================================

class TestSQLiteTransactionRollback:
    """Test transaction rollback with SQLite backend."""

    def test_failed_migration_rolls_back_all_changes(self, sqlite_config, migrations_dir):
        """Should rollback all changes when migration fails."""
        create_failing_migration(migrations_dir, 20231201000000, "failing_migration", "middle")

        manager = DatabaseManager(sqlite_config)
        manager.initialize()

        # Migration should fail
        with pytest.raises(MigrationError, match="failed"):
            manager.run_migrations()

        # Verify NO data was committed (rollback successful)
        assert manager.backend.get('migration_data_1') is None
        assert manager.backend.get('migration_data_2') is None
        assert manager.backend.get('migration_data_3') is None

        # Verify schema version was NOT updated
        assert manager._get_schema_version() == 0

        # Verify migration was NOT recorded in history
        history = manager.backend.get('_migration_history')
        if history:
            assert len(history.get('migrations', [])) == 0

        manager.close()

    def test_database_integrity_preserved_after_failed_migration(self, sqlite_config, migrations_dir):
        """Should preserve existing data when migration fails."""
        manager = DatabaseManager(sqlite_config)
        manager.initialize()

        # Insert some existing data
        manager.backend.set('existing_data', {'important': 'value'})
        manager.backend.set('another_key', {'another': 'value'})

        # Create failing migration
        create_failing_migration(migrations_dir, 20231201000000, "failing", "middle")

        # Migration should fail
        with pytest.raises(MigrationError):
            manager.run_migrations()

        # Verify existing data is still intact
        assert manager.backend.get('existing_data') == {'important': 'value'}
        assert manager.backend.get('another_key') == {'another': 'value'}

        # Verify no partial migration data exists
        assert manager.backend.get('migration_data_1') is None
        assert manager.backend.get('migration_data_2') is None

        manager.close()

    def test_successful_migration_after_failed_one(self, sqlite_config, migrations_dir):
        """Should apply successful migrations after a failed one is fixed."""
        # Create a failing migration
        create_failing_migration(migrations_dir, 20231201000000, "initial_fail", "middle")

        manager = DatabaseManager(sqlite_config)
        manager.initialize()

        # First migration should fail
        with pytest.raises(MigrationError):
            manager.run_migrations()

        # Verify nothing was committed
        assert manager._get_schema_version() == 0

        manager.close()

        # Fix the migration by replacing with successful one
        create_successful_migration(migrations_dir, 20231201000000, "initial_success")

        # Reinitialize and run again
        manager = DatabaseManager(sqlite_config)
        manager.initialize()
        manager.run_migrations()

        # Now it should succeed
        assert manager._get_schema_version() == 20231201000000
        assert manager.backend.get('successful_migration') is not None

        manager.close()

    def test_partial_migration_batch_rollback(self, sqlite_config, migrations_dir):
        """Should rollback entire batch if one migration fails."""
        # Create successful migration
        create_successful_migration(migrations_dir, 20231201000000, "first_success")

        # Create failing migration
        create_failing_migration(migrations_dir, 20231202000000, "second_fail", "middle")

        manager = DatabaseManager(sqlite_config)
        manager.initialize()

        # First migration succeeds, second fails
        with pytest.raises(MigrationError, match="second_fail"):
            manager.run_migrations()

        # First migration should have committed
        assert manager._get_schema_version() == 20231201000000
        assert manager.backend.get('successful_migration') is not None

        # Second migration should have rolled back
        assert manager.backend.get('migration_data_1') is None
        assert manager.backend.get('migration_data_2') is None

        manager.close()


# ============================================================================
# Transaction Rollback Tests - JSON Backend
# ============================================================================

class TestJSONTransactionRollback:
    """Test transaction rollback with JSON backend."""

    def test_json_backend_rolls_back_on_failure(self, json_config, migrations_dir):
        """Should rollback JSON backend changes when migration fails."""
        create_failing_migration(migrations_dir, 20231201000000, "failing_json", "middle")

        manager = DatabaseManager(json_config)
        manager.initialize()

        # Migration should fail
        with pytest.raises(MigrationError):
            manager.run_migrations()

        # Verify NO data was committed
        assert manager.backend.get('migration_data_1') is None
        assert manager.backend.get('migration_data_2') is None

        # Verify schema version was NOT updated
        assert manager._get_schema_version() == 0

        manager.close()

    def test_json_file_not_corrupted_on_failure(self, json_config, migrations_dir):
        """Should not corrupt JSON file when migration fails."""
        manager = DatabaseManager(json_config)
        manager.initialize()

        # Add some existing data
        manager.backend.set('existing', {'data': 'important'})
        manager.close()

        # Read file to verify it's valid JSON
        with open(json_config['connection_string'], 'r') as f:
            original_data = json.load(f)

        # Create failing migration
        create_failing_migration(migrations_dir, 20231201000000, "failing", "middle")

        # Reinitialize and try migration
        manager = DatabaseManager(json_config)
        manager.initialize()

        with pytest.raises(MigrationError):
            manager.run_migrations()

        manager.close()

        # Verify JSON file is still valid and contains original data
        with open(json_config['connection_string'], 'r') as f:
            current_data = json.load(f)

        # Existing data should be intact
        assert 'existing' in current_data
        assert current_data['existing'] == {'data': 'important'}

        # No partial migration data
        assert 'migration_data_1' not in current_data
        assert 'migration_data_2' not in current_data

    def test_json_backend_in_memory_rollback(self, json_config, migrations_dir):
        """Should use in-memory rollback for JSON backend."""
        manager = DatabaseManager(json_config)
        manager.initialize()

        # Add data before migration
        manager.backend.set('before_migration', {'value': 1})

        # Create and apply failing migration
        create_failing_migration(migrations_dir, 20231201000000, "fail", "middle")

        with pytest.raises(MigrationError):
            manager.run_migrations()

        # Verify original data still exists
        assert manager.backend.get('before_migration') == {'value': 1}

        # Verify failed migration data was rolled back
        assert manager.backend.get('migration_data_1') is None

        manager.close()


# ============================================================================
# Transaction Atomicity Tests
# ============================================================================

class TestTransactionAtomicity:
    """Test atomic execution of migrations."""

    def test_all_or_nothing_migration(self, sqlite_config, migrations_dir):
        """Should execute migration as atomic all-or-nothing operation."""
        # Create migration that does multiple operations
        migration_code = '''"""
Multi-operation migration
"""

from typing import Dict, Any

def up(backend, config):
    """Migration with multiple operations."""
    # Operation 1
    backend.set('op1', {'executed': True})

    # Operation 2
    backend.set('op2', {'executed': True})

    # Operation 3 - FAILS
    raise RuntimeError("Simulated failure")

    # Operation 4 - should never execute
    backend.set('op4', {'executed': True})

def down(backend, config):
    backend.delete('op1')
    backend.delete('op2')
    backend.delete('op4')

VERSION = 20231201000000
DESCRIPTION = "Multi-op migration"
DEPENDENCIES = []
'''

        migration_file = migrations_dir / "20231201000000_multiop.py"
        migration_file.write_text(migration_code)

        manager = DatabaseManager(sqlite_config)
        manager.initialize()

        with pytest.raises(MigrationError):
            manager.run_migrations()

        # ALL operations should be rolled back (atomicity)
        assert manager.backend.get('op1') is None
        assert manager.backend.get('op2') is None
        assert manager.backend.get('op4') is None

        manager.close()

    def test_schema_version_not_updated_on_failure(self, sqlite_config, migrations_dir):
        """Should not update schema version if migration fails."""
        create_failing_migration(migrations_dir, 20231201000000, "fail", "end")

        manager = DatabaseManager(sqlite_config)
        manager.initialize()

        initial_version = manager._get_schema_version()

        with pytest.raises(MigrationError):
            manager.run_migrations()

        # Schema version should remain unchanged
        assert manager._get_schema_version() == initial_version
        assert manager._get_schema_version() == 0

        manager.close()

    def test_migration_history_not_recorded_on_failure(self, sqlite_config, migrations_dir):
        """Should not record migration in history if it fails."""
        create_failing_migration(migrations_dir, 20231201000000, "fail", "middle")

        manager = DatabaseManager(sqlite_config)
        manager.initialize()

        with pytest.raises(MigrationError):
            manager.run_migrations()

        # Migration should not be in history
        history = manager.backend.get('_migration_history')
        if history and 'migrations' in history:
            failing_migration = [
                m for m in history['migrations']
                if m['version'] == 20231201000000
            ]
            assert len(failing_migration) == 0

        manager.close()


# ============================================================================
# Cross-Backend Transaction Tests
# ============================================================================

class TestCrossBackendTransactions:
    """Test transaction support across different backends."""

    @pytest.mark.parametrize("config_fixture", ["sqlite_config", "json_config"])
    def test_transaction_rollback_all_backends(self, config_fixture, migrations_dir, request):
        """Should rollback transactions on all backend types."""
        config = request.getfixturevalue(config_fixture)

        create_failing_migration(migrations_dir, 20231201000000, "fail", "middle")

        manager = DatabaseManager(config)
        manager.initialize()

        with pytest.raises(MigrationError):
            manager.run_migrations()

        # Verify rollback worked regardless of backend
        assert manager.backend.get('migration_data_1') is None
        assert manager.backend.get('migration_data_2') is None
        assert manager._get_schema_version() == 0

        manager.close()

    @pytest.mark.parametrize("config_fixture", ["sqlite_config", "json_config"])
    def test_successful_migration_commits_all_backends(self, config_fixture, migrations_dir, request):
        """Should commit successful migrations on all backend types."""
        config = request.getfixturevalue(config_fixture)

        create_successful_migration(migrations_dir, 20231201000000, "success")

        manager = DatabaseManager(config)
        manager.initialize()
        manager.run_migrations()

        # Verify commit worked
        assert manager.backend.get('successful_migration') is not None
        assert manager._get_schema_version() == 20231201000000

        manager.close()


# ============================================================================
# Error Scenario Tests
# ============================================================================

class TestErrorScenarios:
    """Test various error scenarios with transactions."""

    def test_migration_with_exception_in_backend_operation(self, sqlite_config, migrations_dir):
        """Should handle exceptions from backend operations gracefully."""
        # Create migration that causes backend error
        migration_code = '''"""
Migration causing backend error
"""

def up(backend, config):
    # Valid operation
    backend.set('valid_key', {'data': 'test'})

    # Try to set with invalid data type (simulate backend error)
    # This should fail and rollback the valid operation above
    raise TypeError("Invalid data type")

def down(backend, config):
    backend.delete('valid_key')

VERSION = 20231201000000
DESCRIPTION = "Backend error migration"
DEPENDENCIES = []
'''

        migration_file = migrations_dir / "20231201000000_backend_error.py"
        migration_file.write_text(migration_code)

        manager = DatabaseManager(sqlite_config)
        manager.initialize()

        with pytest.raises(MigrationError):
            manager.run_migrations()

        # Even valid operations should be rolled back
        assert manager.backend.get('valid_key') is None

        manager.close()

    def test_nested_exception_handling(self, sqlite_config, migrations_dir):
        """Should handle nested exceptions during rollback."""
        create_failing_migration(migrations_dir, 20231201000000, "nested_fail", "middle")

        manager = DatabaseManager(sqlite_config)
        manager.initialize()

        # Should raise MigrationError (outer exception)
        with pytest.raises(MigrationError) as exc_info:
            manager.run_migrations()

        # Error message should indicate the migration failed
        assert "nested_fail" in str(exc_info.value)

        # Rollback should have occurred despite exception
        assert manager.backend.get('migration_data_1') is None

        manager.close()


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
