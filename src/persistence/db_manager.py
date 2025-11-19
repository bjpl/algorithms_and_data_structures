"""
Database Manager - Handles database connections, migrations, and lifecycle management.
"""

import os
import logging
import json
from typing import Dict, Any, Optional, List, Type
from pathlib import Path
from datetime import datetime
import hashlib

from .backends import StorageBackend, JSONBackend, SQLiteBackend, PostgreSQLBackend
from .exceptions import DatabaseError, MigrationError, ConfigurationError


class DatabaseManager:
    """
    Manages database connections, migrations, and configuration for multiple storage backends.
    """
    
    SUPPORTED_BACKENDS = {
        'json': JSONBackend,
        'sqlite': SQLiteBackend,  
        'postgresql': PostgreSQLBackend
    }
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the database manager.
        
        Args:
            config: Database configuration dictionary
        """
        self.config = config
        self.backend_type = config.get('backend', 'sqlite').lower()
        self.connection_string = config.get('connection_string', '')
        self.migrations_path = Path(config.get('migrations_path', 'src/persistence/migrations'))
        self.logger = logging.getLogger(__name__)
        
        # Initialize backend
        self.backend: Optional[StorageBackend] = None
        self._schema_version = None
        self._migration_lock = False
        
        # Ensure migrations directory exists
        self.migrations_path.mkdir(parents=True, exist_ok=True)
        
    def initialize(self) -> None:
        """Initialize the database backend and run migrations."""
        try:
            # Create backend instance
            backend_class = self.SUPPORTED_BACKENDS.get(self.backend_type)
            if not backend_class:
                raise ConfigurationError(f"Unsupported backend: {self.backend_type}")
                
            self.backend = backend_class(self.config)
            
            # Initialize backend
            self.backend.initialize()
            
            # Run migrations
            self.run_migrations()
            
            self.logger.info(f"Database initialized with {self.backend_type} backend")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize database: {str(e)}")
            raise DatabaseError(f"Database initialization failed: {str(e)}")
    
    def get_backend(self) -> StorageBackend:
        """Get the active storage backend."""
        if not self.backend:
            raise DatabaseError("Database not initialized. Call initialize() first.")
        return self.backend
    
    def close(self) -> None:
        """Close database connections and cleanup resources."""
        if self.backend:
            self.backend.close()
            self.logger.info("Database connections closed")
    
    def run_migrations(self) -> None:
        """Run pending database migrations."""
        if self._migration_lock:
            self.logger.warning("Migration already in progress, skipping")
            return
            
        try:
            self._migration_lock = True
            
            # Get current schema version
            current_version = self._get_schema_version()
            
            # Get available migrations
            migrations = self._get_available_migrations()
            
            # Filter migrations that need to be applied
            pending_migrations = [
                m for m in migrations 
                if m['version'] > current_version
            ]
            
            if not pending_migrations:
                self.logger.info("No pending migrations")
                return
                
            self.logger.info(f"Running {len(pending_migrations)} pending migrations")
            
            # Apply each migration in order
            for migration in sorted(pending_migrations, key=lambda x: x['version']):
                self._apply_migration(migration)
                
        except Exception as e:
            self.logger.error(f"Migration failed: {str(e)}")
            raise MigrationError(f"Migration failed: {str(e)}")
        finally:
            self._migration_lock = False
    
    def create_migration(self, name: str, description: str = "") -> Path:
        """
        Create a new migration file.
        
        Args:
            name: Migration name
            description: Migration description
            
        Returns:
            Path to the created migration file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{name}.py"
        migration_file = self.migrations_path / filename
        
        template = f'''"""
Migration: {name}
Description: {description}
Created: {datetime.now().isoformat()}
"""

from typing import Dict, Any
from ..backends import StorageBackend


def up(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Apply the migration."""
    # TODO: Implement migration logic
    pass


def down(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Rollback the migration."""
    # TODO: Implement rollback logic
    pass


# Migration metadata
VERSION = {int(timestamp)}
DESCRIPTION = "{description}"
DEPENDENCIES = []  # List of migration versions this depends on
'''
        
        with open(migration_file, 'w') as f:
            f.write(template)
            
        self.logger.info(f"Created migration: {migration_file}")
        return migration_file
    
    def backup_database(self, backup_path: Optional[Path] = None) -> Path:
        """
        Create a backup of the database.

        Args:
            backup_path: Optional backup file path

        Returns:
            Path to the backup file
        """
        if not backup_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            # Get the directory of the connection string for consistent backup location
            if self.backend_type == 'json' and self.connection_string:
                backup_dir = Path(self.connection_string).parent
            else:
                backup_dir = Path.cwd()

            backup_path = backup_dir / f"backup_{self.backend_type}_{timestamp}.json"

        try:
            # Ensure backup directory exists
            backup_path.parent.mkdir(parents=True, exist_ok=True)

            backup_data = {
                'backend_type': self.backend_type,
                'schema_version': self._get_schema_version(),
                'created_at': datetime.now().isoformat(),
                'data': self.backend.export_data() if self.backend else {}
            }

            with open(backup_path, 'w') as f:
                json.dump(backup_data, f, indent=2, default=str)

            self.logger.info(f"Database backup created: {backup_path}")
            return backup_path

        except Exception as e:
            self.logger.error(f"Backup failed: {str(e)}")
            raise DatabaseError(f"Backup failed: {str(e)}")
    
    def restore_database(self, backup_path: Path, force: bool = False) -> None:
        """
        Restore database from backup.
        
        Args:
            backup_path: Path to backup file
            force: Force restore even if schema versions don't match
        """
        try:
            with open(backup_path, 'r') as f:
                backup_data = json.load(f)
                
            # Validate backup format
            required_fields = ['backend_type', 'schema_version', 'data']
            for field in required_fields:
                if field not in backup_data:
                    raise DatabaseError(f"Invalid backup format: missing {field}")
            
            # Check backend compatibility
            if backup_data['backend_type'] != self.backend_type and not force:
                raise DatabaseError(
                    f"Backend mismatch: backup is {backup_data['backend_type']}, "
                    f"current is {self.backend_type}. Use force=True to override."
                )
            
            # Check schema version compatibility  
            backup_version = backup_data['schema_version']
            current_version = self._get_schema_version()
            
            if backup_version != current_version and not force:
                raise DatabaseError(
                    f"Schema version mismatch: backup is {backup_version}, "
                    f"current is {current_version}. Use force=True to override."
                )
            
            # Restore data
            if self.backend:
                self.backend.import_data(backup_data['data'])
                
            self.logger.info(f"Database restored from: {backup_path}")
            
        except Exception as e:
            self.logger.error(f"Restore failed: {str(e)}")
            raise DatabaseError(f"Restore failed: {str(e)}")
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get database health status and metrics."""
        try:
            status = {
                'backend_type': self.backend_type,
                'initialized': self.backend is not None,
                'schema_version': self._get_schema_version(),
                'timestamp': datetime.now().isoformat()
            }
            
            if self.backend:
                status.update(self.backend.get_stats())
                
            return status
            
        except Exception as e:
            self.logger.error(f"Health check failed: {str(e)}")
            return {
                'backend_type': self.backend_type,
                'initialized': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _get_schema_version(self) -> int:
        """Get current database schema version."""
        if self._schema_version is not None:
            return self._schema_version
            
        try:
            if not self.backend:
                return 0
                
            # Try to get version from backend
            version_data = self.backend.get('_schema_version')
            if version_data and 'version' in version_data:
                self._schema_version = int(version_data['version'])
            else:
                self._schema_version = 0
                
            return self._schema_version
            
        except Exception:
            # If we can't get version, assume it's 0 (initial state)
            self._schema_version = 0
            return 0
    
    def _set_schema_version(self, version: int) -> None:
        """Set the current schema version."""
        try:
            if self.backend:
                self.backend.set('_schema_version', {'version': version})
                self._schema_version = version
                
        except Exception as e:
            raise MigrationError(f"Failed to set schema version: {str(e)}")
    
    def _get_available_migrations(self) -> List[Dict[str, Any]]:
        """Get list of available migration files, sorted by version."""
        migrations = []

        for migration_file in self.migrations_path.glob("*.py"):
            if migration_file.name.startswith("__"):
                continue

            try:
                # Extract timestamp from filename
                # Supports two formats:
                # 1. YYYYMMDDHHMMSS_name.py (version as single number)
                # 2. YYYYMMDD_HHMMSS_name.py (version as date_time)
                parts = migration_file.stem.split('_')
                if len(parts) < 2:
                    raise ValueError(f"Invalid filename format: {migration_file.name}")

                # Try to parse first part as version
                first_part = parts[0]

                # If first part is already 14 digits (YYYYMMDDHHMMSS), use it directly
                if len(first_part) == 14 and first_part.isdigit():
                    version = int(first_part)
                # Otherwise, try combining first two parts (YYYYMMDD + HHMMSS)
                elif len(first_part) == 8 and first_part.isdigit() and len(parts) >= 2:
                    second_part = parts[1]
                    if len(second_part) == 6 and second_part.isdigit():
                        # Format: YYYYMMDD_HHMMSS_name.py
                        version = int(first_part + second_part)
                    else:
                        raise ValueError(f"Invalid time format in filename: {migration_file.name}")
                else:
                    raise ValueError(f"Invalid version format in filename: {migration_file.name}")

                migrations.append({
                    'version': version,
                    'name': migration_file.stem,
                    'file': migration_file,
                    'hash': self._get_file_hash(migration_file)
                })

            except (ValueError, IndexError) as e:
                self.logger.warning(f"Invalid migration filename: {migration_file} - {e}")
                continue

        # Sort migrations by version number
        migrations.sort(key=lambda x: x['version'])

        return migrations
    
    def _apply_migration(self, migration: Dict[str, Any]) -> None:
        """
        Apply a single migration with transaction safety.

        Wraps migration execution in a transaction to ensure atomic operations.
        On failure, the transaction is automatically rolled back, preventing
        database corruption.
        """
        migration_file = migration['file']

        try:
            self.logger.info(f"Applying migration: {migration['name']}")

            # Validate dependencies before applying
            self._validate_migration_dependencies(migration)

            # Load migration module
            module = self._load_migration_module(migration_file, migration['name'])

            # Create backup if migration is marked as risky
            if hasattr(module, 'RISKY') and module.RISKY:
                self.logger.warning(f"Creating backup before risky migration: {migration['name']}")
                self.backup_database()

            # Execute migration within transaction for atomicity
            with self.backend.transaction():
                # Execute migration
                if hasattr(module, 'up'):
                    module.up(self.backend, self.config)
                else:
                    raise MigrationError(f"Migration {migration['name']} missing 'up' function")

                # Update schema version (within transaction)
                self._set_schema_version(migration['version'])

                # Record migration in history (within transaction)
                self._record_migration(migration)

            # Transaction committed successfully
            self.logger.info(f"Migration {migration['name']} applied successfully")

        except Exception as e:
            # Transaction was automatically rolled back
            self.logger.error(f"Migration {migration['name']} failed and was rolled back: {str(e)}")
            raise MigrationError(f"Migration {migration['name']} failed: {str(e)}")
    
    def _record_migration(self, migration: Dict[str, Any]) -> None:
        """Record migration in migration history."""
        try:
            if not self.backend:
                return
                
            history_key = '_migration_history'
            history = self.backend.get(history_key) or {'migrations': []}
            
            migration_record = {
                'version': migration['version'],
                'name': migration['name'], 
                'hash': migration['hash'],
                'applied_at': datetime.now().isoformat()
            }
            
            history['migrations'].append(migration_record)
            self.backend.set(history_key, history)
            
        except Exception as e:
            self.logger.warning(f"Failed to record migration history: {str(e)}")
    
    def _get_file_hash(self, file_path: Path) -> str:
        """Calculate SHA256 hash of a file."""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()

    def _load_migration_module(self, migration_file: Path, module_name: str):
        """Load a migration module from file."""
        import importlib.util

        spec = importlib.util.spec_from_file_location(module_name, migration_file)
        if not spec or not spec.loader:
            raise MigrationError(f"Could not load migration module: {module_name}")

        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        return module

    def _validate_migration_dependencies(self, migration: Dict[str, Any]) -> None:
        """Validate that migration dependencies are met."""
        try:
            # Load migration module to check dependencies
            module = self._load_migration_module(migration['file'], migration['name'])

            if not hasattr(module, 'DEPENDENCIES'):
                return  # No dependencies to check

            dependencies = module.DEPENDENCIES
            if not dependencies:
                return  # Empty dependencies list

            # Get current migration history
            history = self.backend.get('_migration_history') or {'migrations': []}
            applied_versions = {m['version'] for m in history['migrations']}

            # Check each dependency
            for dep_version in dependencies:
                if dep_version not in applied_versions:
                    raise MigrationError(
                        f"Migration {migration['name']} has unmet dependency: "
                        f"version {dep_version} must be applied first"
                    )

        except MigrationError:
            raise
        except Exception as e:
            self.logger.warning(f"Could not validate dependencies for {migration['name']}: {str(e)}")

    def rollback_migration(self, steps: int = 1) -> None:
        """
        Rollback the last N migrations.

        Args:
            steps: Number of migrations to rollback (default: 1)

        Raises:
            MigrationError: If rollback fails
        """
        if self._migration_lock:
            self.logger.warning("Migration operation already in progress, skipping rollback")
            return

        try:
            self._migration_lock = True

            # Get migration history
            history = self.backend.get('_migration_history')
            if not history or not history.get('migrations'):
                raise MigrationError("No migrations to rollback")

            applied_migrations = history['migrations']

            if steps > len(applied_migrations):
                raise MigrationError(
                    f"Cannot rollback {steps} migrations, only {len(applied_migrations)} applied"
                )

            # Get migrations to rollback (in reverse order)
            migrations_to_rollback = applied_migrations[-steps:]
            migrations_to_rollback.reverse()

            self.logger.info(f"Rolling back {steps} migration(s)")

            # Create backup before rollback
            self.logger.info("Creating backup before rollback")
            self.backup_database()

            # Rollback each migration
            for migration_record in migrations_to_rollback:
                self._rollback_single_migration(migration_record)

            self.logger.info(f"Successfully rolled back {steps} migration(s)")

        except Exception as e:
            self.logger.error(f"Rollback failed: {str(e)}")
            raise MigrationError(f"Rollback failed: {str(e)}")
        finally:
            self._migration_lock = False

    def rollback_to_version(self, target_version: int) -> None:
        """
        Rollback migrations to a specific version.

        Args:
            target_version: Target schema version (0 for complete rollback)

        Raises:
            MigrationError: If rollback fails
        """
        if self._migration_lock:
            self.logger.warning("Migration operation already in progress, skipping rollback")
            return

        try:
            self._migration_lock = True

            current_version = self._get_schema_version()

            if target_version == current_version:
                self.logger.info(f"Already at version {target_version}")
                return

            if target_version > current_version:
                raise MigrationError(
                    f"Invalid version: {target_version} not found in migration history "
                    f"(current version: {current_version})"
                )

            # Get migration history
            history = self.backend.get('_migration_history')
            if not history or not history.get('migrations'):
                if target_version == 0:
                    self.logger.info("No migrations applied, already at version 0")
                    return
                raise MigrationError("No migrations to rollback")

            applied_migrations = history['migrations']

            # Find migrations to rollback
            migrations_to_rollback = [
                m for m in applied_migrations
                if m['version'] > target_version
            ]

            if not migrations_to_rollback and target_version != 0:
                raise MigrationError(f"Invalid version: {target_version} not found in migration history")

            # Sort in reverse order for rollback
            migrations_to_rollback.sort(key=lambda x: x['version'], reverse=True)

            self.logger.info(
                f"Rolling back from version {current_version} to {target_version} "
                f"({len(migrations_to_rollback)} migration(s))"
            )

            # Create backup before rollback
            self.logger.info("Creating backup before rollback")
            self.backup_database()

            # Rollback each migration
            for migration_record in migrations_to_rollback:
                self._rollback_single_migration(migration_record)

            # Set final schema version
            self._set_schema_version(target_version)

            self.logger.info(f"Successfully rolled back to version {target_version}")

        except Exception as e:
            self.logger.error(f"Rollback to version {target_version} failed: {str(e)}")
            raise MigrationError(f"Rollback failed: {str(e)}")
        finally:
            self._migration_lock = False

    def _rollback_single_migration(self, migration_record: Dict[str, Any]) -> None:
        """
        Rollback a single migration.

        Args:
            migration_record: Migration record from history

        Raises:
            MigrationError: If rollback fails
        """
        try:
            version = migration_record['version']
            name = migration_record['name']

            self.logger.info(f"Rolling back migration: {name} (version {version})")

            # Find migration file
            migration_file = None
            for mig in self._get_available_migrations():
                if mig['version'] == version:
                    migration_file = mig['file']
                    break

            if not migration_file:
                raise MigrationError(
                    f"Migration file not found for {name} (version {version})"
                )

            # Load migration module
            module = self._load_migration_module(migration_file, name)

            # Verify hash matches recorded hash (integrity check)
            current_hash = self._get_file_hash(migration_file)
            if current_hash != migration_record.get('hash', ''):
                self.logger.warning(
                    f"Migration file hash mismatch for {name}. "
                    f"File may have been modified since application."
                )

            # Execute down migration
            if hasattr(module, 'down'):
                module.down(self.backend, self.config)
            else:
                raise MigrationError(f"Migration {name} missing 'down' function")

            # Remove from migration history
            history = self.backend.get('_migration_history') or {'migrations': []}
            history['migrations'] = [
                m for m in history['migrations']
                if m['version'] != version
            ]
            self.backend.set('_migration_history', history)

            # Record rollback in rollback history
            self._record_rollback(migration_record)

            # Update schema version to previous migration or 0
            if history['migrations']:
                new_version = max(m['version'] for m in history['migrations'])
                self._set_schema_version(new_version)
            else:
                self._set_schema_version(0)

            self.logger.info(f"Migration {name} rolled back successfully")

        except Exception as e:
            self.logger.error(f"Failed to rollback migration {migration_record.get('name')}: {str(e)}")
            raise MigrationError(f"Rollback of {migration_record.get('name')} failed: {str(e)}")

    def _record_rollback(self, migration_record: Dict[str, Any]) -> None:
        """Record a rollback in rollback history."""
        try:
            if not self.backend:
                return

            rollback_key = '_rollback_history'
            rollback_history = self.backend.get(rollback_key) or {'rollbacks': []}

            rollback_record = {
                'version': migration_record['version'],
                'name': migration_record['name'],
                'rolled_back_at': datetime.now().isoformat()
            }

            rollback_history['rollbacks'].append(rollback_record)
            self.backend.set(rollback_key, rollback_history)

        except Exception as e:
            self.logger.warning(f"Failed to record rollback history: {str(e)}")

    def get_migration_history(self) -> List[Dict[str, Any]]:
        """
        Get the history of applied migrations.

        Returns:
            List of migration records
        """
        try:
            if not self.backend:
                return []

            history = self.backend.get('_migration_history')
            if not history or 'migrations' not in history:
                return []

            return history['migrations']

        except Exception as e:
            self.logger.error(f"Failed to get migration history: {str(e)}")
            return []

    def get_rollback_history(self) -> List[Dict[str, Any]]:
        """
        Get the history of rolled back migrations.

        Returns:
            List of rollback records
        """
        try:
            if not self.backend:
                return []

            history = self.backend.get('_rollback_history')
            if not history or 'rollbacks' not in history:
                return []

            return history['rollbacks']

        except Exception as e:
            self.logger.error(f"Failed to get rollback history: {str(e)}")
            return []

    def check_rollback_safety(self, version: int) -> Dict[str, Any]:
        """
        Check if rolling back a migration is safe (won't cause data loss).

        Args:
            version: Migration version to check

        Returns:
            Dictionary with safety information
        """
        try:
            # Find migration file
            migration_file = None
            migration_name = None
            for mig in self._get_available_migrations():
                if mig['version'] == version:
                    migration_file = mig['file']
                    migration_name = mig['name']
                    break

            if not migration_file:
                return {
                    'safe': False,
                    'data_destructive': None,
                    'warning': f"Migration file not found for version {version}"
                }

            # Load migration module
            module = self._load_migration_module(migration_file, migration_name)

            # Check if marked as data destructive
            data_destructive = getattr(module, 'DATA_DESTRUCTIVE', False)

            result = {
                'safe': not data_destructive,
                'data_destructive': data_destructive,
                'version': version,
                'name': migration_name
            }

            if data_destructive:
                result['warning'] = (
                    f"Rolling back migration {migration_name} may result in data loss. "
                    f"Ensure you have a recent backup before proceeding."
                )

            return result

        except Exception as e:
            return {
                'safe': False,
                'data_destructive': None,
                'error': str(e),
                'warning': f"Could not determine rollback safety: {str(e)}"
            }


class DatabaseConfig:
    """Helper class for database configuration management."""

    @staticmethod
    def from_env() -> Dict[str, Any]:
        """Load database configuration from environment variables."""
        return {
            'backend': os.getenv('DB_BACKEND', 'sqlite'),
            'connection_string': os.getenv('DB_CONNECTION_STRING', ''),
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', '5432')),
            'database': os.getenv('DB_NAME', 'cli_app'),
            'username': os.getenv('DB_USER', ''),
            'password': os.getenv('DB_PASSWORD', ''),
            'migrations_path': os.getenv('DB_MIGRATIONS_PATH', 'src/persistence/migrations'),
            'cache_size': int(os.getenv('DB_CACHE_SIZE', '100')),
            'pool_size': int(os.getenv('DB_POOL_SIZE', '10')),
            'timeout': int(os.getenv('DB_TIMEOUT', '30'))
        }

    @staticmethod
    def from_file(config_path: Path) -> Dict[str, Any]:
        """Load database configuration from JSON file."""
        with open(config_path, 'r') as f:
            return json.load(f)

    @staticmethod
    def get_default() -> Dict[str, Any]:
        """Get default database configuration."""
        return {
            'backend': 'sqlite',
            'connection_string': 'data/app.db',
            'migrations_path': 'src/persistence/migrations',
            'cache_size': 100,
            'pool_size': 5,
            'timeout': 30,
            'backup_retention': 7  # days
        }


# Backward compatibility alias
DBManager = DatabaseManager