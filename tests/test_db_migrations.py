"""
Test suite for Database Migration and Rollback System

Tests the enhanced migration logic and rollback functionality for database schema management.
"""

import pytest
import tempfile
import json
from pathlib import Path
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
import hashlib

from src.persistence.db_manager import DatabaseManager, DatabaseConfig
from src.persistence.storage_backend import JSONBackend, SQLiteBackend
from src.persistence.exceptions import DatabaseError, MigrationError


@pytest.fixture
def test_migrations_dir(tmp_path):
    """Create a temporary migrations directory for testing."""
    migrations_dir = tmp_path / "migrations"
    migrations_dir.mkdir()
    return migrations_dir


@pytest.fixture
def test_db_config(tmp_path, test_migrations_dir):
    """Create a test database configuration."""
    return {
        "backend": "json",
        "connection_string": str(tmp_path / "test.json"),
        "migrations_path": str(test_migrations_dir),
        "cache_size": 50
    }


@pytest.fixture
def db_manager(test_db_config):
    """Create a database manager instance for testing."""
    manager = DatabaseManager(test_db_config)
    manager.initialize()
    yield manager
    manager.close()


@pytest.fixture
def create_test_migration():
    """Factory fixture for creating test migration files."""
    def _create_migration(migrations_dir, version, name, has_up=True, has_down=True, dependencies=None):
        """
        Create a test migration file.

        Args:
            migrations_dir: Directory to create migration in
            version: Migration version (timestamp integer)
            name: Migration name
            has_up: Whether to include up function
            has_down: Whether to include down function
            dependencies: List of migration versions this depends on
        """
        filename = f"{version}_{name}.py"
        migration_file = migrations_dir / filename

        dependencies_list = dependencies or []

        content = f'''"""
Migration: {name}
Description: Test migration {name}
Created: {datetime.now().isoformat()}
"""

from typing import Dict, Any
from src.persistence.storage_backend import StorageBackend


'''

        if has_up:
            content += '''def up(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Apply the migration."""
    # Test migration - add test data
    backend.set(f"migration_{VERSION}", {"applied": True, "version": VERSION})


'''

        if has_down:
            content += '''def down(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Rollback the migration."""
    # Test migration - remove test data
    backend.delete(f"migration_{VERSION}")


'''

        content += f'''# Migration metadata
VERSION = {version}
DESCRIPTION = "Test migration {name}"
DEPENDENCIES = {dependencies_list}
'''

        migration_file.write_text(content)
        return migration_file

    return _create_migration


class TestMigrationDiscovery:
    """Test migration file discovery and validation."""

    def test_discover_migrations_in_directory(self, db_manager, create_test_migration, test_migrations_dir):
        """Test that migrations are discovered from the migrations directory."""
        # Create test migrations
        create_test_migration(test_migrations_dir, 20240101_120000, "first_migration")
        create_test_migration(test_migrations_dir, 20240102_120000, "second_migration")

        # Discover migrations
        migrations = db_manager._get_available_migrations()

        assert len(migrations) == 2
        assert migrations[0]['version'] == 20240101120000
        assert migrations[1]['version'] == 20240102120000

    def test_migration_files_have_hash(self, db_manager, create_test_migration, test_migrations_dir):
        """Test that discovered migrations include file hash for integrity checking."""
        create_test_migration(test_migrations_dir, 20240101_120000, "test_migration")

        migrations = db_manager._get_available_migrations()

        assert len(migrations) == 1
        assert 'hash' in migrations[0]
        assert len(migrations[0]['hash']) == 64  # SHA256 hash length

    def test_ignore_invalid_migration_filenames(self, db_manager, test_migrations_dir):
        """Test that invalid migration filenames are ignored."""
        # Create files with invalid names
        (test_migrations_dir / "invalid.py").write_text("# Invalid")
        (test_migrations_dir / "__init__.py").write_text("# Init")
        (test_migrations_dir / "not_a_number_migration.py").write_text("# Bad")

        migrations = db_manager._get_available_migrations()

        # Should ignore all invalid files
        assert len(migrations) == 0

    def test_migrations_sorted_by_version(self, db_manager, create_test_migration, test_migrations_dir):
        """Test that migrations are sorted by version number."""
        # Create migrations out of order
        create_test_migration(test_migrations_dir, 20240103_120000, "third")
        create_test_migration(test_migrations_dir, 20240101_120000, "first")
        create_test_migration(test_migrations_dir, 20240102_120000, "second")

        migrations = db_manager._get_available_migrations()

        # Should be sorted by version
        assert migrations[0]['version'] < migrations[1]['version'] < migrations[2]['version']


class TestMigrationValidation:
    """Test migration file validation and dependency checking."""

    def test_validate_migration_has_up_function(self, db_manager, create_test_migration, test_migrations_dir):
        """Test validation that migration has up function."""
        migration_file = create_test_migration(test_migrations_dir, 20240101_120000, "test", has_up=False)

        # Should raise error when migration missing up function
        with pytest.raises(MigrationError, match="missing 'up' function"):
            db_manager.run_migrations()

    def test_validate_migration_has_down_function_for_rollback(self, db_manager, create_test_migration, test_migrations_dir):
        """Test validation that migration has down function for rollback."""
        create_test_migration(test_migrations_dir, 20240101_120000, "test", has_down=False)

        # Apply migration
        db_manager.run_migrations()

        # Rollback should fail without down function
        with pytest.raises(MigrationError, match="missing 'down' function"):
            db_manager.rollback_migration()

    def test_validate_migration_dependencies(self, db_manager, create_test_migration, test_migrations_dir):
        """Test that migration dependencies are validated."""
        # Create migration with dependency on non-existent migration
        create_test_migration(
            test_migrations_dir,
            20240102_120000,
            "dependent",
            dependencies=[20240101120000]  # Depends on migration that doesn't exist
        )

        # Should raise error when dependency not met
        with pytest.raises(MigrationError, match="dependency|dependencies"):
            db_manager.run_migrations()

    def test_migration_integrity_check(self, db_manager, create_test_migration, test_migrations_dir):
        """Test that migration file integrity is verified using hash."""
        # Create and apply migration
        migration_file = create_test_migration(test_migrations_dir, 20240101_120000, "test")
        db_manager.run_migrations()

        # Get original hash from history
        history = db_manager.backend.get('_migration_history')
        original_hash = history['migrations'][0]['hash']

        # Modify migration file
        content = migration_file.read_text()
        migration_file.write_text(content + "\n# Modified")

        # Calculate new hash
        new_hash = db_manager._get_file_hash(migration_file)

        # Hashes should be different
        assert original_hash != new_hash


class TestMigrationExecution:
    """Test migration execution and schema version tracking."""

    def test_apply_single_migration(self, db_manager, create_test_migration, test_migrations_dir):
        """Test applying a single migration."""
        create_test_migration(test_migrations_dir, 20240101_120000, "test")

        # Initial version should be 0
        assert db_manager._get_schema_version() == 0

        # Run migrations
        db_manager.run_migrations()

        # Version should be updated
        assert db_manager._get_schema_version() == 20240101120000

    def test_apply_multiple_migrations_in_order(self, db_manager, create_test_migration, test_migrations_dir):
        """Test applying multiple migrations in correct order."""
        create_test_migration(test_migrations_dir, 20240101_120000, "first")
        create_test_migration(test_migrations_dir, 20240102_120000, "second")
        create_test_migration(test_migrations_dir, 20240103_120000, "third")

        db_manager.run_migrations()

        # Should have applied all three migrations
        assert db_manager._get_schema_version() == 20240103120000

        # Check migration history
        history = db_manager.backend.get('_migration_history')
        assert len(history['migrations']) == 3

    def test_skip_already_applied_migrations(self, db_manager, create_test_migration, test_migrations_dir):
        """Test that already-applied migrations are skipped."""
        create_test_migration(test_migrations_dir, 20240101_120000, "first")

        # Apply migrations
        db_manager.run_migrations()
        assert db_manager._get_schema_version() == 20240101120000

        # Add new migration
        create_test_migration(test_migrations_dir, 20240102_120000, "second")

        # Run migrations again
        db_manager.run_migrations()

        # Should only apply the new migration
        assert db_manager._get_schema_version() == 20240102120000
        history = db_manager.backend.get('_migration_history')
        assert len(history['migrations']) == 2

    def test_migration_failure_rollback(self, db_manager, test_migrations_dir):
        """Test that failed migrations don't update schema version."""
        # Create migration that will fail
        bad_migration = test_migrations_dir / "20240101_120000_bad.py"
        bad_migration.write_text('''
def up(backend, config):
    raise Exception("Migration failed")

VERSION = 20240101120000
DESCRIPTION = "Bad migration"
DEPENDENCIES = []
''')

        # Migrations should fail
        with pytest.raises(MigrationError):
            db_manager.run_migrations()

        # Version should not be updated
        assert db_manager._get_schema_version() == 0

    def test_migration_idempotency(self, db_manager, create_test_migration, test_migrations_dir):
        """Test that running migrations multiple times is safe."""
        create_test_migration(test_migrations_dir, 20240101_120000, "test")

        # Run migrations twice
        db_manager.run_migrations()
        version_after_first = db_manager._get_schema_version()

        db_manager.run_migrations()
        version_after_second = db_manager._get_schema_version()

        # Version should be the same
        assert version_after_first == version_after_second


class TestMigrationRollback:
    """Test migration rollback functionality."""

    def test_rollback_last_migration(self, db_manager, create_test_migration, test_migrations_dir):
        """Test rolling back the most recent migration."""
        create_test_migration(test_migrations_dir, 20240101_120000, "first")
        create_test_migration(test_migrations_dir, 20240102_120000, "second")

        # Apply migrations
        db_manager.run_migrations()
        assert db_manager._get_schema_version() == 20240102120000

        # Rollback last migration
        db_manager.rollback_migration()

        # Should rollback to first migration
        assert db_manager._get_schema_version() == 20240101120000

    def test_rollback_to_specific_version(self, db_manager, create_test_migration, test_migrations_dir):
        """Test rolling back to a specific version."""
        create_test_migration(test_migrations_dir, 20240101_120000, "first")
        create_test_migration(test_migrations_dir, 20240102_120000, "second")
        create_test_migration(test_migrations_dir, 20240103_120000, "third")

        # Apply all migrations
        db_manager.run_migrations()
        assert db_manager._get_schema_version() == 20240103120000

        # Rollback to first migration
        db_manager.rollback_to_version(20240101120000)

        # Should rollback to specified version
        assert db_manager._get_schema_version() == 20240101120000

    def test_rollback_to_zero_version(self, db_manager, create_test_migration, test_migrations_dir):
        """Test rolling back all migrations (version 0)."""
        create_test_migration(test_migrations_dir, 20240101_120000, "first")
        create_test_migration(test_migrations_dir, 20240102_120000, "second")

        # Apply migrations
        db_manager.run_migrations()
        assert db_manager._get_schema_version() == 20240102120000

        # Rollback all migrations
        db_manager.rollback_to_version(0)

        # Should be at version 0
        assert db_manager._get_schema_version() == 0

    def test_rollback_creates_backup(self, db_manager, create_test_migration, test_migrations_dir, tmp_path):
        """Test that rollback creates a backup before executing."""
        create_test_migration(test_migrations_dir, 20240101_120000, "test")

        # Apply migration
        db_manager.run_migrations()

        # Add test data
        db_manager.backend.set("test_data", {"value": "important"})

        # Rollback should create backup
        db_manager.rollback_migration()

        # Check that backup was created
        backup_files = list(tmp_path.glob("backup_*.json"))
        assert len(backup_files) > 0

    def test_rollback_safety_check_warns_on_data_loss(self, db_manager, test_migrations_dir):
        """Test that rollback warns when data loss may occur."""
        # Create migration that adds a table/data
        migration_file = test_migrations_dir / "20240101_120000_add_table.py"
        migration_file.write_text('''
from typing import Dict, Any
from src.persistence.storage_backend import StorageBackend

def up(backend: StorageBackend, config: Dict[str, Any]) -> None:
    backend.set("users:1", {"name": "John", "email": "john@example.com"})
    backend.set("users:2", {"name": "Jane", "email": "jane@example.com"})

def down(backend: StorageBackend, config: Dict[str, Any]) -> None:
    # This will delete user data
    backend.delete("users:1")
    backend.delete("users:2")

VERSION = 20240101120000
DESCRIPTION = "Add users table"
DEPENDENCIES = []
DATA_DESTRUCTIVE = True  # Flag indicating data loss on rollback
''')

        # Apply migration
        db_manager.run_migrations()

        # Rollback should check for data loss
        # (In practice, this might prompt user or require force flag)
        result = db_manager.check_rollback_safety(20240101120000)

        assert result['data_destructive'] is True
        assert 'warning' in result

    def test_rollback_without_down_function_fails(self, db_manager, test_migrations_dir):
        """Test that rollback fails if migration has no down function."""
        migration_file = test_migrations_dir / "20240101_120000_no_down.py"
        migration_file.write_text('''
def up(backend, config):
    backend.set("test_key", {"data": "test"})

VERSION = 20240101120000
DESCRIPTION = "Migration without down"
DEPENDENCIES = []
''')

        # Apply migration
        db_manager.run_migrations()

        # Rollback should fail
        with pytest.raises(MigrationError, match="missing 'down' function"):
            db_manager.rollback_migration()

    def test_rollback_execution_order(self, db_manager, create_test_migration, test_migrations_dir):
        """Test that rollbacks execute in reverse order."""
        create_test_migration(test_migrations_dir, 20240101_120000, "first")
        create_test_migration(test_migrations_dir, 20240102_120000, "second")
        create_test_migration(test_migrations_dir, 20240103_120000, "third")

        # Apply all migrations
        db_manager.run_migrations()

        # Rollback to first version
        db_manager.rollback_to_version(20240101120000)

        # Check rollback history
        rollback_history = db_manager.get_rollback_history()

        # Should have rolled back third, then second
        assert len(rollback_history) == 2
        assert rollback_history[0]['version'] == 20240103120000
        assert rollback_history[1]['version'] == 20240102120000


class TestMigrationHistory:
    """Test migration history tracking."""

    def test_record_migration_in_history(self, db_manager, create_test_migration, test_migrations_dir):
        """Test that applied migrations are recorded in history."""
        create_test_migration(test_migrations_dir, 20240101_120000, "test")

        db_manager.run_migrations()

        history = db_manager.backend.get('_migration_history')

        assert history is not None
        assert 'migrations' in history
        assert len(history['migrations']) == 1
        assert history['migrations'][0]['version'] == 20240101120000
        assert 'applied_at' in history['migrations'][0]
        assert 'hash' in history['migrations'][0]

    def test_get_migration_history(self, db_manager, create_test_migration, test_migrations_dir):
        """Test retrieving migration history."""
        create_test_migration(test_migrations_dir, 20240101_120000, "first")
        create_test_migration(test_migrations_dir, 20240102_120000, "second")

        db_manager.run_migrations()

        history = db_manager.get_migration_history()

        assert len(history) == 2
        assert history[0]['version'] == 20240101120000
        assert history[1]['version'] == 20240102120000

    def test_migration_history_persistence(self, test_db_config, create_test_migration, test_migrations_dir):
        """Test that migration history persists across sessions."""
        # Create and apply migration
        create_test_migration(test_migrations_dir, 20240101_120000, "test")

        manager1 = DatabaseManager(test_db_config)
        manager1.initialize()
        manager1.run_migrations()
        manager1.close()

        # Create new manager instance
        manager2 = DatabaseManager(test_db_config)
        manager2.initialize()

        # History should persist
        history = manager2.get_migration_history()
        assert len(history) == 1
        assert history[0]['version'] == 20240101120000

        manager2.close()


class TestMigrationErrors:
    """Test error handling in migration system."""

    def test_migration_lock_prevents_concurrent_migrations(self, db_manager, create_test_migration, test_migrations_dir):
        """Test that migration lock prevents concurrent execution."""
        create_test_migration(test_migrations_dir, 20240101_120000, "test")

        # Set migration lock
        db_manager._migration_lock = True

        # Should not run migrations while locked
        db_manager.run_migrations()

        # Version should still be 0
        assert db_manager._get_schema_version() == 0

    def test_invalid_migration_version_format(self, db_manager, test_migrations_dir):
        """Test handling of invalid migration version format."""
        # Create migration with invalid version
        bad_migration = test_migrations_dir / "invalid_version_test.py"
        bad_migration.write_text('''
def up(backend, config): pass
def down(backend, config): pass

VERSION = "not_a_number"
DESCRIPTION = "Bad version"
DEPENDENCIES = []
''')

        # Should handle gracefully and skip
        migrations = db_manager._get_available_migrations()
        assert len(migrations) == 0

    def test_rollback_to_invalid_version_fails(self, db_manager, create_test_migration, test_migrations_dir):
        """Test that rolling back to invalid version fails."""
        create_test_migration(test_migrations_dir, 20240101_120000, "test")
        db_manager.run_migrations()

        # Try to rollback to non-existent version
        with pytest.raises(MigrationError, match="Invalid version|not found"):
            db_manager.rollback_to_version(99999999999999)

    def test_rollback_when_no_migrations_applied(self, db_manager):
        """Test that rollback fails gracefully when no migrations applied."""
        with pytest.raises(MigrationError, match="No migrations to rollback"):
            db_manager.rollback_migration()


class TestMigrationBackups:
    """Test backup functionality for migrations."""

    def test_automatic_backup_before_migration(self, db_manager, create_test_migration, test_migrations_dir, tmp_path):
        """Test that backup is created before risky migrations."""
        # Create migration marked as risky
        migration_file = test_migrations_dir / "20240101_120000_risky.py"
        migration_file.write_text('''
def up(backend, config):
    backend.set("test", {"data": "value"})

def down(backend, config):
    backend.delete("test")

VERSION = 20240101120000
DESCRIPTION = "Risky migration"
DEPENDENCIES = []
RISKY = True  # Flag for automatic backup
''')

        # Add some data first
        db_manager.backend.set("important_data", {"value": "important"})

        # Run migrations
        db_manager.run_migrations()

        # Backup should have been created
        backups = list(tmp_path.glob("backup_*.json"))
        assert len(backups) > 0

    def test_restore_from_backup_after_failed_migration(self, db_manager, create_test_migration, test_migrations_dir, tmp_path):
        """Test restoring from backup after migration failure."""
        # Add initial data
        db_manager.backend.set("important_data", {"value": "keep_this"})

        # Create backup
        backup_path = db_manager.backup_database()

        # Create failing migration
        migration_file = test_migrations_dir / "20240101_120000_failing.py"
        migration_file.write_text('''
def up(backend, config):
    backend.set("test", {"data": "value"})
    raise Exception("Migration failed")

VERSION = 20240101120000
DESCRIPTION = "Failing migration"
DEPENDENCIES = []
''')

        # Try to run migrations (will fail)
        try:
            db_manager.run_migrations()
        except MigrationError:
            pass

        # Restore from backup
        db_manager.restore_database(backup_path, force=True)

        # Original data should be restored
        assert db_manager.backend.get("important_data")["value"] == "keep_this"
        assert db_manager.backend.get("test") is None


class TestSQLiteMigrations:
    """Test migrations with SQLite backend."""

    @pytest.fixture
    def sqlite_db_config(self, tmp_path, test_migrations_dir):
        """Create SQLite database configuration."""
        return {
            "backend": "sqlite",
            "connection_string": str(tmp_path / "test.db"),
            "migrations_path": str(test_migrations_dir),
            "timeout": 30
        }

    @pytest.fixture
    def sqlite_manager(self, sqlite_db_config):
        """Create SQLite database manager."""
        manager = DatabaseManager(sqlite_db_config)
        manager.initialize()
        yield manager
        manager.close()

    def test_sqlite_schema_migrations(self, sqlite_manager, test_migrations_dir):
        """Test SQLite-specific schema migrations."""
        # Create migration with SQL DDL
        migration_file = test_migrations_dir / "20240101_120000_create_table.py"
        migration_file.write_text('''
from src.persistence.storage_backend import SQLiteBackend

def up(backend, config):
    if isinstance(backend, SQLiteBackend):
        backend.connection.execute("""
            CREATE TABLE IF NOT EXISTS test_table (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        backend.connection.commit()

def down(backend, config):
    if isinstance(backend, SQLiteBackend):
        backend.connection.execute("DROP TABLE IF EXISTS test_table")
        backend.connection.commit()

VERSION = 20240101120000
DESCRIPTION = "Create test table"
DEPENDENCIES = []
''')

        # Run migrations
        sqlite_manager.run_migrations()

        # Verify table was created
        cursor = sqlite_manager.backend.connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='test_table'"
        )
        assert cursor.fetchone() is not None

        # Rollback
        sqlite_manager.rollback_migration()

        # Verify table was dropped
        cursor = sqlite_manager.backend.connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='test_table'"
        )
        assert cursor.fetchone() is None
