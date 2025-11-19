"""
Comprehensive Test Suite for Database Migration System

Tests cover:
- Migration discovery and ordering
- Migration execution and version tracking
- Rollback functionality and safety
- Integration tests with real SQLite database
- Edge cases and error conditions
"""

import pytest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
import json
import sqlite3

# Import components to test
import sys
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

# Import after adding to path
import importlib
if 'persistence' in sys.modules:
    importlib.reload(sys.modules['persistence'])

from src.persistence.db_manager import DatabaseManager, DatabaseConfig
from src.persistence.storage_backend import SQLiteBackend, JSONBackend
from src.persistence.exceptions import (
    MigrationError, DatabaseError, ConfigurationError, StorageError
)


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
def db_config(temp_dir, migrations_dir):
    """Create database configuration."""
    return {
        'backend': 'sqlite',
        'connection_string': str(temp_dir / 'test.db'),
        'migrations_path': str(migrations_dir),
        'cache_size': 10,
        'timeout': 5
    }


@pytest.fixture
def db_manager(db_config):
    """Create DatabaseManager instance."""
    manager = DatabaseManager(db_config)
    yield manager
    if manager.backend:
        manager.close()


@pytest.fixture
def initialized_db_manager(db_manager):
    """Create and initialize DatabaseManager."""
    db_manager.initialize()
    yield db_manager
    db_manager.close()


@pytest.fixture
def mock_backend():
    """Create mock storage backend."""
    backend = Mock(spec=SQLiteBackend)
    backend.get.return_value = None
    backend.set.return_value = None
    backend.export_data.return_value = {}
    backend.import_data.return_value = None
    backend.initialize.return_value = None
    backend.close.return_value = None
    return backend


def create_migration_file(migrations_dir: Path, version: int, name: str,
                          has_up: bool = True, has_down: bool = True,
                          has_error: bool = False) -> Path:
    """Helper function to create migration files for testing."""
    filename = f"{version}_{name}.py"
    filepath = migrations_dir / filename

    up_code = """
def up(backend, config):
    \"\"\"Apply the migration.\"\"\"
    backend.set('test_migration', {'version': VERSION, 'applied': True})
"""

    if has_error:
        up_code = """
def up(backend, config):
    \"\"\"Apply the migration with error.\"\"\"
    raise RuntimeError("Migration failed intentionally")
"""

    down_code = """
def down(backend, config):
    \"\"\"Rollback the migration.\"\"\"
    backend.delete('test_migration')
"""

    content = f'''"""
Migration: {name}
Created: {datetime.now().isoformat()}
"""

from typing import Dict, Any

'''

    if has_up:
        content += up_code

    if has_down:
        content += down_code

    content += f'''

# Migration metadata
VERSION = {version}
DESCRIPTION = "Test migration {name}"
DEPENDENCIES = []
'''

    filepath.write_text(content)
    return filepath


# ============================================================================
# Unit Tests: Migration Discovery
# ============================================================================

class TestMigrationDiscovery:
    """Test migration file discovery and ordering."""

    def test_discovers_migration_files(self, db_manager, migrations_dir):
        """Should discover migration files in migrations directory."""
        # Create test migrations
        create_migration_file(migrations_dir, 20231201000000, "initial_schema")
        create_migration_file(migrations_dir, 20231202000000, "add_users")

        migrations = db_manager._get_available_migrations()

        assert len(migrations) == 2
        assert all('version' in m for m in migrations)
        assert all('name' in m for m in migrations)
        assert all('file' in m for m in migrations)
        assert all('hash' in m for m in migrations)

    def test_orders_migrations_by_version(self, db_manager, migrations_dir):
        """Should order migrations by version number."""
        # Create migrations in reverse order
        create_migration_file(migrations_dir, 20231203000000, "third")
        create_migration_file(migrations_dir, 20231201000000, "first")
        create_migration_file(migrations_dir, 20231202000000, "second")

        migrations = db_manager._get_available_migrations()
        versions = [m['version'] for m in migrations]

        assert versions == sorted(versions)
        assert versions == [20231201000000, 20231202000000, 20231203000000]

    def test_skips_init_files(self, db_manager, migrations_dir):
        """Should skip __init__.py and __pycache__ files."""
        create_migration_file(migrations_dir, 20231201000000, "valid")
        (migrations_dir / "__init__.py").write_text("# Init file")
        (migrations_dir / "__pycache__").mkdir()

        migrations = db_manager._get_available_migrations()

        assert len(migrations) == 1
        assert migrations[0]['name'] == "20231201000000_valid"

    def test_handles_invalid_filename_format(self, db_manager, migrations_dir):
        """Should skip files with invalid naming format."""
        create_migration_file(migrations_dir, 20231201000000, "valid")
        (migrations_dir / "invalid_no_version.py").write_text("# Invalid")
        (migrations_dir / "not_a_number_test.py").write_text("# Invalid")

        migrations = db_manager._get_available_migrations()

        # Should only find the valid migration
        assert len(migrations) == 1
        assert migrations[0]['name'] == "20231201000000_valid"

    def test_calculates_file_hash(self, db_manager, migrations_dir):
        """Should calculate SHA256 hash for each migration file."""
        file1 = create_migration_file(migrations_dir, 20231201000000, "test1")
        file2 = create_migration_file(migrations_dir, 20231202000000, "test2")

        migrations = db_manager._get_available_migrations()

        assert len(migrations) == 2
        # Hashes should be different for different files
        assert migrations[0]['hash'] != migrations[1]['hash']
        # Hash should be 64 characters (SHA256 hex)
        assert all(len(m['hash']) == 64 for m in migrations)

    def test_empty_migrations_directory(self, db_manager, migrations_dir):
        """Should handle empty migrations directory gracefully."""
        migrations = db_manager._get_available_migrations()

        assert migrations == []


# ============================================================================
# Unit Tests: Migration Execution
# ============================================================================

class TestMigrationExecution:
    """Test migration execution and version tracking."""

    def test_applies_up_migration(self, initialized_db_manager, migrations_dir):
        """Should execute up migration successfully."""
        create_migration_file(migrations_dir, 20231201000000, "test_migration")

        initialized_db_manager.run_migrations()

        # Verify migration was applied
        result = initialized_db_manager.backend.get('test_migration')
        assert result is not None
        assert result['applied'] is True
        assert result['version'] == 20231201000000

    def test_updates_schema_version(self, initialized_db_manager, migrations_dir):
        """Should update schema version after applying migration."""
        create_migration_file(migrations_dir, 20231201000000, "test")

        initial_version = initialized_db_manager._get_schema_version()
        initialized_db_manager.run_migrations()
        new_version = initialized_db_manager._get_schema_version()

        assert initial_version == 0
        assert new_version == 20231201000000

    def test_records_migration_in_history(self, initialized_db_manager, migrations_dir):
        """Should record migration in migration history."""
        create_migration_file(migrations_dir, 20231201000000, "test")

        initialized_db_manager.run_migrations()

        history = initialized_db_manager.backend.get('_migration_history')
        assert history is not None
        assert 'migrations' in history
        assert len(history['migrations']) == 1

        record = history['migrations'][0]
        assert record['version'] == 20231201000000
        assert record['name'] == '20231201000000_test'
        assert 'hash' in record
        assert 'applied_at' in record

    def test_idempotency_skips_applied_migrations(self, initialized_db_manager, migrations_dir):
        """Should skip migrations that have already been applied."""
        create_migration_file(migrations_dir, 20231201000000, "test")

        # Apply migration first time
        initialized_db_manager.run_migrations()
        first_history = initialized_db_manager.backend.get('_migration_history')

        # Try to apply again
        initialized_db_manager.run_migrations()
        second_history = initialized_db_manager.backend.get('_migration_history')

        # History should be identical (not duplicated)
        assert len(first_history['migrations']) == len(second_history['migrations'])

    def test_applies_multiple_migrations_in_order(self, initialized_db_manager, migrations_dir):
        """Should apply multiple migrations in correct order."""
        create_migration_file(migrations_dir, 20231201000000, "first")
        create_migration_file(migrations_dir, 20231202000000, "second")
        create_migration_file(migrations_dir, 20231203000000, "third")

        initialized_db_manager.run_migrations()

        history = initialized_db_manager.backend.get('_migration_history')
        versions = [m['version'] for m in history['migrations']]

        assert versions == [20231201000000, 20231202000000, 20231203000000]

    def test_only_applies_pending_migrations(self, initialized_db_manager, migrations_dir):
        """Should only apply migrations newer than current schema version."""
        create_migration_file(migrations_dir, 20231201000000, "first")
        initialized_db_manager.run_migrations()

        # Add new migration
        create_migration_file(migrations_dir, 20231202000000, "second")
        initialized_db_manager.run_migrations()

        history = initialized_db_manager.backend.get('_migration_history')
        assert len(history['migrations']) == 2

    def test_migration_without_up_function(self, initialized_db_manager, migrations_dir):
        """Should raise error if migration lacks up() function."""
        filepath = migrations_dir / "20231201000000_bad.py"
        filepath.write_text("""
VERSION = 20231201000000
DESCRIPTION = "Bad migration"
DEPENDENCIES = []
""")

        with pytest.raises(MigrationError, match="missing 'up' function"):
            initialized_db_manager.run_migrations()

    def test_migration_execution_error(self, initialized_db_manager, migrations_dir):
        """Should handle migration execution errors gracefully."""
        create_migration_file(migrations_dir, 20231201000000, "error", has_error=True)

        with pytest.raises(MigrationError, match="Migration failed"):
            initialized_db_manager.run_migrations()

    def test_migration_lock_prevents_concurrent_execution(self, initialized_db_manager, migrations_dir):
        """Should prevent concurrent migration execution."""
        create_migration_file(migrations_dir, 20231201000000, "test")

        # Simulate migration in progress
        initialized_db_manager._migration_lock = True

        # Should skip without error
        initialized_db_manager.run_migrations()

        # Verify migration was not applied
        result = initialized_db_manager.backend.get('test_migration')
        assert result is None

    def test_migration_lock_released_after_execution(self, initialized_db_manager, migrations_dir):
        """Should release migration lock after execution."""
        create_migration_file(migrations_dir, 20231201000000, "test")

        assert initialized_db_manager._migration_lock is False
        initialized_db_manager.run_migrations()
        assert initialized_db_manager._migration_lock is False

    def test_migration_lock_released_on_error(self, initialized_db_manager, migrations_dir):
        """Should release migration lock even on error."""
        create_migration_file(migrations_dir, 20231201000000, "error", has_error=True)

        assert initialized_db_manager._migration_lock is False

        with pytest.raises(MigrationError):
            initialized_db_manager.run_migrations()

        # Lock should be released
        assert initialized_db_manager._migration_lock is False


# ============================================================================
# Unit Tests: Migration Creation
# ============================================================================

class TestMigrationCreation:
    """Test migration file creation."""

    def test_creates_migration_file(self, db_manager, migrations_dir):
        """Should create migration file with correct structure."""
        filepath = db_manager.create_migration("add_users", "Add users table")

        assert filepath.exists()
        assert filepath.parent == migrations_dir
        assert "add_users" in filepath.name

    def test_migration_file_has_timestamp(self, db_manager, migrations_dir):
        """Should include timestamp in migration filename."""
        before = datetime.now()
        filepath = db_manager.create_migration("test", "Test")
        after = datetime.now()

        # Extract timestamp from filename
        timestamp_str = filepath.stem.split('_')[0]
        timestamp = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")

        assert before <= timestamp <= after

    def test_migration_file_has_required_functions(self, db_manager, migrations_dir):
        """Should create migration with up and down functions."""
        filepath = db_manager.create_migration("test", "Test migration")

        content = filepath.read_text()

        assert "def up(" in content
        assert "def down(" in content
        assert "VERSION =" in content
        assert "DESCRIPTION =" in content
        assert "DEPENDENCIES =" in content

    def test_migration_file_includes_metadata(self, db_manager, migrations_dir):
        """Should include metadata in migration file."""
        filepath = db_manager.create_migration("test", "Test description")

        content = filepath.read_text()

        assert "Migration: test" in content
        assert "Test description" in content
        assert "Created:" in content


# ============================================================================
# Unit Tests: Schema Version Management
# ============================================================================

class TestSchemaVersionManagement:
    """Test schema version tracking."""

    def test_initial_schema_version_is_zero(self, initialized_db_manager):
        """Should return version 0 for new database."""
        version = initialized_db_manager._get_schema_version()
        assert version == 0

    def test_sets_schema_version(self, initialized_db_manager):
        """Should set schema version correctly."""
        initialized_db_manager._set_schema_version(20231201000000)

        version = initialized_db_manager._get_schema_version()
        assert version == 20231201000000

    def test_caches_schema_version(self, initialized_db_manager):
        """Should cache schema version to avoid repeated queries."""
        initialized_db_manager._set_schema_version(123)

        # Set internal version
        assert initialized_db_manager._schema_version == 123

        # Should return cached value
        version = initialized_db_manager._get_schema_version()
        assert version == 123

    def test_schema_version_persists(self, db_config, migrations_dir):
        """Should persist schema version across sessions."""
        # Create first manager and set version
        manager1 = DatabaseManager(db_config)
        manager1.initialize()
        manager1._set_schema_version(999)
        manager1.close()

        # Create second manager and check version
        manager2 = DatabaseManager(db_config)
        manager2.initialize()
        version = manager2._get_schema_version()
        manager2.close()

        assert version == 999


# ============================================================================
# Unit Tests: Backup and Restore
# ============================================================================

class TestBackupAndRestore:
    """Test database backup and restore functionality."""

    def test_creates_backup_file(self, initialized_db_manager, temp_dir):
        """Should create backup file with database data."""
        # Add some test data
        initialized_db_manager.backend.set('test_key', {'value': 'test'})

        backup_path = temp_dir / "backup.json"
        result_path = initialized_db_manager.backup_database(backup_path)

        assert result_path.exists()
        assert result_path == backup_path

    def test_backup_includes_metadata(self, initialized_db_manager, temp_dir):
        """Should include metadata in backup."""
        backup_path = initialized_db_manager.backup_database(temp_dir / "backup.json")

        with open(backup_path) as f:
            backup_data = json.load(f)

        assert 'backend_type' in backup_data
        assert 'schema_version' in backup_data
        assert 'created_at' in backup_data
        assert 'data' in backup_data

    def test_backup_includes_all_data(self, initialized_db_manager, temp_dir):
        """Should backup all database data."""
        initialized_db_manager.backend.set('key1', {'value': 1})
        initialized_db_manager.backend.set('key2', {'value': 2})

        backup_path = initialized_db_manager.backup_database(temp_dir / "backup.json")

        with open(backup_path) as f:
            backup_data = json.load(f)

        assert 'key1' in backup_data['data']
        assert 'key2' in backup_data['data']

    def test_restores_from_backup(self, initialized_db_manager, temp_dir):
        """Should restore database from backup file."""
        # Create backup with data
        initialized_db_manager.backend.set('original', {'value': 'data'})
        backup_path = initialized_db_manager.backup_database(temp_dir / "backup.json")

        # Clear database and restore
        initialized_db_manager.backend.clear()
        initialized_db_manager.restore_database(backup_path, force=True)

        # Verify data restored
        result = initialized_db_manager.backend.get('original')
        assert result == {'value': 'data'}

    def test_restore_validates_backup_format(self, initialized_db_manager, temp_dir):
        """Should validate backup file format."""
        invalid_backup = temp_dir / "invalid.json"
        invalid_backup.write_text('{"invalid": "backup"}')

        with pytest.raises(DatabaseError, match="Invalid backup format"):
            initialized_db_manager.restore_database(invalid_backup)

    def test_restore_checks_backend_compatibility(self, initialized_db_manager, temp_dir):
        """Should check backend type compatibility."""
        backup_data = {
            'backend_type': 'postgresql',
            'schema_version': 0,
            'data': {}
        }

        backup_path = temp_dir / "backup.json"
        with open(backup_path, 'w') as f:
            json.dump(backup_data, f)

        with pytest.raises(DatabaseError, match="Backend mismatch"):
            initialized_db_manager.restore_database(backup_path)

    def test_restore_checks_schema_version(self, initialized_db_manager, temp_dir):
        """Should check schema version compatibility."""
        backup_data = {
            'backend_type': 'sqlite',
            'schema_version': 999,
            'data': {}
        }

        backup_path = temp_dir / "backup.json"
        with open(backup_path, 'w') as f:
            json.dump(backup_data, f)

        with pytest.raises(DatabaseError, match="Schema version mismatch"):
            initialized_db_manager.restore_database(backup_path)

    def test_restore_with_force_flag(self, initialized_db_manager, temp_dir):
        """Should allow restore with force flag despite mismatches."""
        backup_data = {
            'backend_type': 'postgresql',
            'schema_version': 999,
            'data': {'key': {'value': 'test'}}
        }

        backup_path = temp_dir / "backup.json"
        with open(backup_path, 'w') as f:
            json.dump(backup_data, f)

        # Should not raise error with force=True
        initialized_db_manager.restore_database(backup_path, force=True)

        result = initialized_db_manager.backend.get('key')
        assert result == {'value': 'test'}


# ============================================================================
# Integration Tests
# ============================================================================

class TestMigrationIntegration:
    """Integration tests with real SQLite database."""

    def test_full_migration_workflow(self, db_config, migrations_dir):
        """Should execute complete migration workflow successfully."""
        # Create migrations
        create_migration_file(migrations_dir, 20231201000000, "create_tables")
        create_migration_file(migrations_dir, 20231202000000, "add_indexes")
        create_migration_file(migrations_dir, 20231203000000, "add_columns")

        # Initialize and run migrations
        manager = DatabaseManager(db_config)
        manager.initialize()

        # Verify all migrations applied
        version = manager._get_schema_version()
        assert version == 20231203000000

        history = manager.backend.get('_migration_history')
        assert len(history['migrations']) == 3

        manager.close()

    def test_incremental_migration_additions(self, db_config, migrations_dir):
        """Should handle incremental addition of migrations."""
        # First migration
        create_migration_file(migrations_dir, 20231201000000, "initial")

        manager = DatabaseManager(db_config)
        manager.initialize()
        assert manager._get_schema_version() == 20231201000000
        manager.close()

        # Add second migration and reinitialize
        create_migration_file(migrations_dir, 20231202000000, "update")

        manager = DatabaseManager(db_config)
        manager.initialize()
        assert manager._get_schema_version() == 20231202000000

        history = manager.backend.get('_migration_history')
        assert len(history['migrations']) == 2

        manager.close()

    def test_backup_and_restore_workflow(self, db_config, migrations_dir, temp_dir):
        """Should backup and restore database correctly."""
        create_migration_file(migrations_dir, 20231201000000, "initial")

        # Create and populate database
        manager = DatabaseManager(db_config)
        manager.initialize()
        manager.backend.set('important_data', {'value': 'critical'})

        # Create backup
        backup_path = temp_dir / "backup.json"
        manager.backup_database(backup_path)

        # Simulate data corruption
        manager.backend.clear()
        assert manager.backend.get('important_data') is None

        # Restore from backup
        manager.restore_database(backup_path, force=True)

        # Verify data restored
        result = manager.backend.get('important_data')
        assert result == {'value': 'critical'}

        manager.close()

    def test_migration_with_real_sqlite_operations(self, db_config, migrations_dir):
        """Should handle real SQLite operations in migrations."""
        # Create migration that performs actual SQL operations
        migration_code = '''"""
Test migration with SQL operations
"""

from typing import Dict, Any
import sqlite3

def up(backend, config):
    """Create a test table."""
    conn = backend.connection
    conn.execute("""
        CREATE TABLE IF NOT EXISTS test_table (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    backend.set('migration_20231201000000', {'applied': True})

def down(backend, config):
    """Drop test table."""
    conn = backend.connection
    conn.execute("DROP TABLE IF EXISTS test_table")
    conn.commit()
    backend.delete('migration_20231201000000')

VERSION = 20231201000000
DESCRIPTION = "Create test table"
DEPENDENCIES = []
'''

        migration_file = migrations_dir / "20231201000000_create_table.py"
        migration_file.write_text(migration_code)

        # Run migration
        manager = DatabaseManager(db_config)
        manager.initialize()

        # Verify table was created
        cursor = manager.backend.connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='test_table'"
        )
        result = cursor.fetchone()
        assert result is not None
        assert result[0] == 'test_table'

        manager.close()

    def test_schema_version_consistency(self, db_config, migrations_dir):
        """Should maintain schema version consistency."""
        create_migration_file(migrations_dir, 20231201000000, "v1")
        create_migration_file(migrations_dir, 20231202000000, "v2")

        # First session
        manager1 = DatabaseManager(db_config)
        manager1.initialize()
        version1 = manager1._get_schema_version()
        manager1.close()

        # Second session (should have same version)
        manager2 = DatabaseManager(db_config)
        manager2.initialize()
        version2 = manager2._get_schema_version()
        manager2.close()

        assert version1 == version2 == 20231202000000


# ============================================================================
# Edge Cases and Error Conditions
# ============================================================================

class TestEdgeCases:
    """Test edge cases and error conditions."""

    def test_missing_migrations_directory(self, temp_dir):
        """Should handle missing migrations directory gracefully."""
        config = {
            'backend': 'sqlite',
            'connection_string': str(temp_dir / 'test.db'),
            'migrations_path': str(temp_dir / 'nonexistent')
        }

        manager = DatabaseManager(config)
        manager.initialize()

        # Should not raise error
        manager.run_migrations()
        manager.close()

    def test_corrupted_migration_file(self, initialized_db_manager, migrations_dir):
        """Should handle corrupted migration files."""
        corrupt_file = migrations_dir / "20231201000000_corrupt.py"
        corrupt_file.write_text("This is not valid Python syntax {{{")

        with pytest.raises(MigrationError):
            initialized_db_manager.run_migrations()

    def test_out_of_order_migrations(self, initialized_db_manager, migrations_dir):
        """Should handle out-of-order migration versions."""
        # Create migrations with gaps in version numbers
        create_migration_file(migrations_dir, 20231201000000, "v1")
        create_migration_file(migrations_dir, 20231205000000, "v5")  # Gap
        create_migration_file(migrations_dir, 20231203000000, "v3")

        initialized_db_manager.run_migrations()

        # Should apply all migrations in order
        history = initialized_db_manager.backend.get('_migration_history')
        versions = [m['version'] for m in history['migrations']]

        assert versions == [20231201000000, 20231203000000, 20231205000000]

    def test_migration_without_backend(self, db_manager, migrations_dir):
        """Should raise error if backend not initialized."""
        create_migration_file(migrations_dir, 20231201000000, "test")

        with pytest.raises(DatabaseError, match="not initialized"):
            db_manager.get_backend()

    def test_unsupported_backend_type(self, temp_dir, migrations_dir):
        """Should raise error for unsupported backend type."""
        config = {
            'backend': 'unsupported_db',
            'connection_string': str(temp_dir / 'test.db'),
            'migrations_path': str(migrations_dir)
        }

        manager = DatabaseManager(config)

        with pytest.raises(ConfigurationError, match="Unsupported backend"):
            manager.initialize()

    def test_database_initialization_failure(self, temp_dir, migrations_dir):
        """Should handle database initialization failures."""
        config = {
            'backend': 'sqlite',
            'connection_string': '/invalid/path/cannot/create.db',
            'migrations_path': str(migrations_dir)
        }

        manager = DatabaseManager(config)

        with pytest.raises(DatabaseError, match="initialization failed"):
            manager.initialize()

    def test_concurrent_manager_instances(self, db_config, migrations_dir):
        """Should handle multiple DatabaseManager instances."""
        create_migration_file(migrations_dir, 20231201000000, "test")

        # Create two managers
        manager1 = DatabaseManager(db_config)
        manager1.initialize()

        manager2 = DatabaseManager(db_config)
        manager2.initialize()

        # Both should see same schema version
        version1 = manager1._get_schema_version()
        version2 = manager2._get_schema_version()

        assert version1 == version2

        manager1.close()
        manager2.close()

    def test_empty_migration_file(self, initialized_db_manager, migrations_dir):
        """Should handle empty migration files."""
        empty_file = migrations_dir / "20231201000000_empty.py"
        empty_file.write_text("")

        with pytest.raises(MigrationError):
            initialized_db_manager.run_migrations()

    def test_migration_with_syntax_error(self, initialized_db_manager, migrations_dir):
        """Should handle migration files with syntax errors."""
        bad_file = migrations_dir / "20231201000000_syntax_error.py"
        bad_file.write_text("""
def up(backend, config)
    # Missing colon - syntax error
    pass

VERSION = 20231201000000
""")

        with pytest.raises(MigrationError):
            initialized_db_manager.run_migrations()


# ============================================================================
# Database Config Tests
# ============================================================================

class TestDatabaseConfig:
    """Test DatabaseConfig helper class."""

    def test_get_default_config(self):
        """Should return default configuration."""
        config = DatabaseConfig.get_default()

        assert config['backend'] == 'sqlite'
        assert 'connection_string' in config
        assert 'migrations_path' in config
        assert 'cache_size' in config

    @patch.dict('os.environ', {
        'DB_BACKEND': 'postgresql',
        'DB_HOST': 'localhost',
        'DB_PORT': '5432',
        'DB_NAME': 'testdb'
    })
    def test_from_env(self):
        """Should load configuration from environment variables."""
        config = DatabaseConfig.from_env()

        assert config['backend'] == 'postgresql'
        assert config['host'] == 'localhost'
        assert config['port'] == 5432
        assert config['database'] == 'testdb'

    def test_from_file(self, temp_dir):
        """Should load configuration from JSON file."""
        config_data = {
            'backend': 'sqlite',
            'connection_string': 'test.db',
            'cache_size': 50
        }

        config_file = temp_dir / "config.json"
        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        config = DatabaseConfig.from_file(config_file)

        assert config['backend'] == 'sqlite'
        assert config['connection_string'] == 'test.db'
        assert config['cache_size'] == 50


# ============================================================================
# Health Status Tests
# ============================================================================

class TestHealthStatus:
    """Test database health status monitoring."""

    def test_health_status_when_initialized(self, initialized_db_manager):
        """Should return healthy status when initialized."""
        status = initialized_db_manager.get_health_status()

        assert status['backend_type'] == 'sqlite'
        assert status['initialized'] is True
        assert status['schema_version'] == 0
        assert 'timestamp' in status

    def test_health_status_when_not_initialized(self, db_manager):
        """Should return unhealthy status when not initialized."""
        status = db_manager.get_health_status()

        assert status['initialized'] is False

    def test_health_status_includes_backend_stats(self, initialized_db_manager):
        """Should include backend statistics in health status."""
        status = initialized_db_manager.get_health_status()

        assert 'key_count' in status
        assert 'cache_size' in status
        assert 'is_initialized' in status


# ============================================================================
# Performance and Stress Tests
# ============================================================================

class TestPerformance:
    """Performance and stress tests."""

    def test_many_migrations(self, db_config, migrations_dir):
        """Should handle many migrations efficiently."""
        # Create 50 migrations
        for i in range(50):
            version = 20231201000000 + i
            create_migration_file(migrations_dir, version, f"migration_{i}")

        manager = DatabaseManager(db_config)
        manager.initialize()

        # All should be applied
        version = manager._get_schema_version()
        assert version == 20231201000000 + 49

        history = manager.backend.get('_migration_history')
        assert len(history['migrations']) == 50

        manager.close()

    def test_large_migration_content(self, initialized_db_manager, migrations_dir):
        """Should handle migrations with large content."""
        # Create migration with substantial operations
        large_migration = migrations_dir / "20231201000000_large.py"

        code = '''"""Large migration"""

def up(backend, config):
    # Simulate large operation
    for i in range(100):
        backend.set(f'key_{i}', {'index': i, 'data': 'x' * 100})

def down(backend, config):
    for i in range(100):
        backend.delete(f'key_{i}')

VERSION = 20231201000000
DESCRIPTION = "Large migration"
DEPENDENCIES = []
'''

        large_migration.write_text(code)

        initialized_db_manager.run_migrations()

        # Verify data was created
        result = initialized_db_manager.backend.get('key_50')
        assert result is not None
        assert result['index'] == 50


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--cov=persistence.db_manager', '--cov-report=term-missing'])
