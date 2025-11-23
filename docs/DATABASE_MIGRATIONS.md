# Database Migration System Documentation

**Version:** 1.0.0
**Last Updated:** 2025-11-19
**Target Audience:** Developers

---

## Table of Contents

1. [Overview](#overview)
2. [Migration Workflow](#migration-workflow)
3. [How-To Guides](#how-to-guides)
4. [Migration File Examples](#migration-file-examples)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [API Reference](#api-reference)
7. [Best Practices](#best-practices)

---

## Overview

The database migration system provides a structured approach to managing schema changes and data transformations across different storage backends (JSON, SQLite, PostgreSQL). It ensures consistent, versioned, and reversible database evolution.

### Key Features

- **Version-based migrations**: Timestamp-based versioning for ordered execution
- **Multi-backend support**: Works with JSON, SQLite, and PostgreSQL
- **Automatic tracking**: Migration history and schema version management
- **Rollback capability**: Reversible migrations with `up()` and `down()` functions
- **File hashing**: Integrity verification for migration files
- **Dependency management**: Support for migration dependencies
- **Backup/Restore**: Built-in database backup and restore functionality

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DatabaseManager                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Migration System                                       │ │
│  │  • Version tracking (_schema_version)                   │ │
│  │  • Migration history (_migration_history)               │ │
│  │  • File hash verification                               │ │
│  │  • Dependency resolution                                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Storage Backends                                       │ │
│  │  • JSONBackend    • SQLiteBackend    • PostgreSQL      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
   ┌─────────────┐      ┌─────────────┐    ┌──────────────┐
   │ JSON Files  │      │  SQLite DB  │    │ PostgreSQL   │
   └─────────────┘      └─────────────┘    └──────────────┘
```

---

## Migration Workflow

### Migration Lifecycle

```
┌──────────────┐
│ Create       │ → Create new migration file with template
│ Migration    │   (create_migration method)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Implement    │ → Write up() and down() functions
│ Logic        │   Define VERSION, DESCRIPTION, DEPENDENCIES
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Test         │ → Test migration in development environment
│ Migration    │   Verify both up() and down() work correctly
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Apply        │ → Run migrations (run_migrations method)
│ Migration    │   Automatic on initialize() or manual trigger
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Verify       │ → Check schema_version updated
│ Success      │   Review migration_history
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Monitor      │ → Track via health_status
│              │   Review logs for any issues
└──────────────┘
```

### When to Create Migrations

Create migrations when you need to:

1. **Schema Changes**
   - Add/remove tables or collections
   - Add/remove columns or fields
   - Modify data types
   - Add/remove indexes or constraints

2. **Data Transformations**
   - Migrate data between formats
   - Populate new fields with calculated values
   - Clean up or normalize existing data
   - Merge or split data structures

3. **Configuration Updates**
   - Update system settings stored in database
   - Initialize new feature flags
   - Set up default values for new features

4. **Maintenance Tasks**
   - Archive old data
   - Remove deprecated fields
   - Optimize data structures

---

## How-To Guides

### How to Create a New Migration

#### Step 1: Generate Migration File

```python
from src.persistence.db_manager import DatabaseManager

# Initialize database manager
config = {
    'backend': 'sqlite',
    'connection_string': 'data/app.db',
    'migrations_path': 'src/persistence/migrations'
}
db_manager = DatabaseManager(config)

# Create new migration
migration_file = db_manager.create_migration(
    name="add_user_preferences",
    description="Add preferences field to user profiles"
)

print(f"Migration created: {migration_file}")
# Output: src/persistence/migrations/20251119_143022_add_user_preferences.py
```

#### Step 2: Implement Migration Logic

Edit the generated migration file:

```python
"""
Migration: add_user_preferences
Description: Add preferences field to user profiles
Created: 2025-11-19T14:30:22
"""

from typing import Dict, Any
from ..storage_backend import StorageBackend


def up(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Apply the migration."""
    # Get all users
    users = backend.list('users')

    # Add default preferences to each user
    for user_key in users:
        user = backend.get(user_key)
        if user and 'preferences' not in user:
            user['preferences'] = {
                'theme': 'light',
                'notifications': True,
                'language': 'en'
            }
            backend.set(user_key, user)


def down(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Rollback the migration."""
    # Get all users
    users = backend.list('users')

    # Remove preferences field
    for user_key in users:
        user = backend.get(user_key)
        if user and 'preferences' in user:
            del user['preferences']
            backend.set(user_key, user)


# Migration metadata
VERSION = 20251119143022
DESCRIPTION = "Add preferences field to user profiles"
DEPENDENCIES = []  # No dependencies
```

---

### How to Apply Migrations

#### Automatic Application (Recommended)

Migrations are applied automatically during initialization:

```python
from src.persistence.db_manager import DatabaseManager

config = {
    'backend': 'sqlite',
    'connection_string': 'data/app.db'
}

db_manager = DatabaseManager(config)
db_manager.initialize()  # Automatically runs pending migrations
```

#### Manual Application

```python
# Initialize without running migrations
db_manager = DatabaseManager(config)
backend = db_manager.get_backend()
backend.initialize()

# Run migrations manually
db_manager.run_migrations()
```

#### Check Migration Status

```python
# Get current schema version
current_version = db_manager._get_schema_version()
print(f"Current schema version: {current_version}")

# Get migration history
history = db_manager.backend.get('_migration_history')
if history:
    for migration in history['migrations']:
        print(f"Applied: {migration['name']} at {migration['applied_at']}")
```

---

### How to Rollback Migrations

The system tracks applied migrations but doesn't provide automatic rollback. To rollback manually:

#### Step 1: Create Rollback Script

```python
# rollback_migration.py
from src.persistence.db_manager import DatabaseManager
import importlib.util

def rollback_last_migration():
    """Rollback the most recently applied migration."""

    # Initialize database
    config = DatabaseManager.DatabaseConfig.get_default()
    db_manager = DatabaseManager(config)
    db_manager.initialize()

    # Get migration history
    history = db_manager.backend.get('_migration_history')
    if not history or not history['migrations']:
        print("No migrations to rollback")
        return

    # Get last migration
    last_migration = history['migrations'][-1]
    migration_name = last_migration['name']
    migration_version = last_migration['version']

    # Find migration file
    migration_files = list(db_manager.migrations_path.glob(f"*{migration_name}.py"))
    if not migration_files:
        print(f"Migration file not found: {migration_name}")
        return

    migration_file = migration_files[0]

    # Load migration module
    spec = importlib.util.spec_from_file_location(migration_name, migration_file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    # Execute down() function
    if hasattr(module, 'down'):
        print(f"Rolling back: {migration_name}")
        module.down(db_manager.backend, db_manager.config)

        # Update schema version to previous
        history['migrations'].pop()
        db_manager.backend.set('_migration_history', history)

        if history['migrations']:
            previous_version = history['migrations'][-1]['version']
            db_manager._set_schema_version(previous_version)
        else:
            db_manager._set_schema_version(0)

        print(f"Rollback complete")
    else:
        print(f"Migration {migration_name} has no down() function")

if __name__ == "__main__":
    rollback_last_migration()
```

#### Step 2: Execute Rollback

```bash
python rollback_migration.py
```

---

### How to Verify Migration Status

```python
from src.persistence.db_manager import DatabaseManager

# Initialize database
config = DatabaseManager.DatabaseConfig.get_default()
db_manager = DatabaseManager(config)
db_manager.initialize()

# Get health status (includes schema version)
health = db_manager.get_health_status()
print(f"Backend: {health['backend_type']}")
print(f"Schema Version: {health['schema_version']}")
print(f"Initialized: {health['initialized']}")

# Get detailed migration history
history = db_manager.backend.get('_migration_history')
if history:
    print(f"\nApplied Migrations ({len(history['migrations'])}):")
    for migration in history['migrations']:
        print(f"  • {migration['name']}")
        print(f"    Version: {migration['version']}")
        print(f"    Applied: {migration['applied_at']}")
        print(f"    Hash: {migration['hash'][:16]}...")
```

---

### How to Handle Migration Conflicts

Migration conflicts occur when:
- Multiple developers create migrations with same timestamp
- Migration files are modified after being applied
- Dependencies are not satisfied

#### Detection

```python
# Check for hash mismatches
def verify_migration_integrity(db_manager):
    """Verify that applied migrations haven't been modified."""

    history = db_manager.backend.get('_migration_history')
    if not history:
        return True

    for migration_record in history['migrations']:
        # Find migration file
        migration_files = list(
            db_manager.migrations_path.glob(f"*{migration_record['name']}.py")
        )

        if not migration_files:
            print(f"WARNING: Migration file missing: {migration_record['name']}")
            continue

        # Calculate current hash
        current_hash = db_manager._get_file_hash(migration_files[0])

        # Compare with recorded hash
        if current_hash != migration_record['hash']:
            print(f"ERROR: Migration modified after application: {migration_record['name']}")
            print(f"  Expected hash: {migration_record['hash']}")
            print(f"  Current hash:  {current_hash}")
            return False

    return True
```

#### Resolution Strategies

1. **Timestamp Conflicts**
   ```bash
   # Rename migration file with new timestamp
   mv 20251119_140000_feature.py 20251119_140001_feature.py

   # Update VERSION in file
   VERSION = 20251119140001
   ```

2. **Hash Mismatches**
   ```python
   # DO NOT modify applied migrations
   # Instead, create a new migration to make additional changes
   migration_file = db_manager.create_migration(
       name="fix_previous_migration",
       description="Correct issues from previous migration"
   )
   ```

3. **Dependency Issues**
   ```python
   # In migration file, specify dependencies
   DEPENDENCIES = [20251119120000, 20251119130000]  # Must run after these versions

   # Check dependencies before applying
   def check_dependencies(backend, dependencies):
       history = backend.get('_migration_history')
       applied_versions = [m['version'] for m in history['migrations']]

       for dep_version in dependencies:
           if dep_version not in applied_versions:
               raise MigrationError(f"Dependency not satisfied: {dep_version}")
   ```

---

## Migration File Examples

### Example 1: Simple Schema Change (Add Column)

```python
"""
Migration: add_email_verification
Description: Add email_verified field to user accounts
Created: 2025-11-19T15:00:00
"""

from typing import Dict, Any
from ..storage_backend import StorageBackend


def up(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Add email_verified field to all users."""
    users = backend.list('users')

    for user_key in users:
        user = backend.get(user_key)
        if user and 'email_verified' not in user:
            user['email_verified'] = False
            user['verification_sent_at'] = None
            backend.set(user_key, user)


def down(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Remove email_verified field from all users."""
    users = backend.list('users')

    for user_key in users:
        user = backend.get(user_key)
        if user:
            user.pop('email_verified', None)
            user.pop('verification_sent_at', None)
            backend.set(user_key, user)


VERSION = 20251119150000
DESCRIPTION = "Add email verification to user accounts"
DEPENDENCIES = []
```

---

### Example 2: Complex Data Transformation

```python
"""
Migration: normalize_phone_numbers
Description: Normalize all phone numbers to E.164 format
Created: 2025-11-19T16:00:00
"""

from typing import Dict, Any
import re
from ..storage_backend import StorageBackend


def normalize_phone(phone: str) -> str:
    """Normalize phone number to E.164 format."""
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)

    # Add country code if missing (assume US)
    if len(digits) == 10:
        digits = '1' + digits

    # Format as E.164
    return f'+{digits}'


def up(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Normalize all phone numbers to E.164 format."""
    users = backend.list('users')

    for user_key in users:
        user = backend.get(user_key)
        if not user:
            continue

        # Store original for rollback
        if 'phone' in user and user['phone']:
            original_phone = user['phone']

            try:
                normalized = normalize_phone(original_phone)
                user['phone'] = normalized
                user['_phone_original'] = original_phone  # Backup for rollback
                backend.set(user_key, user)
            except Exception as e:
                # Log error but continue with other users
                print(f"Failed to normalize phone for {user_key}: {e}")


def down(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Restore original phone number format."""
    users = backend.list('users')

    for user_key in users:
        user = backend.get(user_key)
        if not user:
            continue

        # Restore original if backup exists
        if '_phone_original' in user:
            user['phone'] = user['_phone_original']
            del user['_phone_original']
            backend.set(user_key, user)


VERSION = 20251119160000
DESCRIPTION = "Normalize phone numbers to E.164 format"
DEPENDENCIES = []
```

---

### Example 3: Migration with Dependencies

```python
"""
Migration: add_user_roles
Description: Add role-based access control to users
Created: 2025-11-19T17:00:00
"""

from typing import Dict, Any, List
from ..storage_backend import StorageBackend


def up(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Add role system to users."""

    # Check that user preferences migration was applied
    # (assumes email_verified field exists from previous migration)
    test_users = backend.list('users')
    if test_users:
        test_user = backend.get(test_users[0])
        if 'email_verified' not in test_user:
            raise Exception("Dependency not satisfied: email_verified field required")

    # Create default roles
    roles = {
        'admin': {
            'id': 'admin',
            'name': 'Administrator',
            'permissions': ['read', 'write', 'delete', 'admin']
        },
        'user': {
            'id': 'user',
            'name': 'Standard User',
            'permissions': ['read', 'write']
        },
        'guest': {
            'id': 'guest',
            'name': 'Guest',
            'permissions': ['read']
        }
    }

    # Store roles
    for role_id, role_data in roles.items():
        backend.set(f'role:{role_id}', role_data)

    # Assign default role to users
    users = backend.list('users')
    for user_key in users:
        user = backend.get(user_key)
        if user:
            # Assign based on email verification
            if user.get('email_verified'):
                user['role'] = 'user'
            else:
                user['role'] = 'guest'
            backend.set(user_key, user)


def down(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Remove role system."""

    # Remove roles from users
    users = backend.list('users')
    for user_key in users:
        user = backend.get(user_key)
        if user and 'role' in user:
            del user['role']
            backend.set(user_key, user)

    # Remove role definitions
    roles = ['admin', 'user', 'guest']
    for role_id in roles:
        backend.delete(f'role:{role_id}')


VERSION = 20251119170000
DESCRIPTION = "Add role-based access control"
DEPENDENCIES = [20251119150000]  # Requires email_verification migration
```

---

### Example 4: Rollback-Safe Migration Pattern

```python
"""
Migration: migrate_settings_format
Description: Migrate settings from flat structure to nested
Created: 2025-11-19T18:00:00
"""

from typing import Dict, Any
from ..storage_backend import StorageBackend
import json


def up(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Migrate settings to nested format with backup."""

    settings_key = 'app_settings'
    settings = backend.get(settings_key)

    if not settings:
        return

    # Create backup before transformation
    backup_key = f'{settings_key}_backup_{VERSION}'
    backend.set(backup_key, settings.copy())

    # Transform flat structure to nested
    new_settings = {
        'display': {
            'theme': settings.pop('theme', 'light'),
            'font_size': settings.pop('font_size', 14),
            'show_line_numbers': settings.pop('show_line_numbers', True)
        },
        'editor': {
            'auto_save': settings.pop('auto_save', True),
            'tab_size': settings.pop('tab_size', 4),
            'word_wrap': settings.pop('word_wrap', False)
        },
        'advanced': settings  # Keep any unmapped settings
    }

    backend.set(settings_key, new_settings)


def down(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Restore settings from backup."""

    settings_key = 'app_settings'
    backup_key = f'{settings_key}_backup_{VERSION}'

    # Restore from backup
    backup = backend.get(backup_key)
    if backup:
        backend.set(settings_key, backup)
        backend.delete(backup_key)
    else:
        # Fallback: flatten current structure
        settings = backend.get(settings_key)
        if settings and isinstance(settings, dict):
            flat_settings = {}

            # Flatten nested structure
            for category, values in settings.items():
                if isinstance(values, dict):
                    flat_settings.update(values)
                else:
                    flat_settings[category] = values

            backend.set(settings_key, flat_settings)


VERSION = 20251119180000
DESCRIPTION = "Migrate settings to nested format"
DEPENDENCIES = []
```

---

## Troubleshooting Guide

### Common Migration Errors

#### Error 1: Migration Lock Active

**Symptom:**
```
WARNING: Migration already in progress, skipping
```

**Cause:**
- Concurrent migration execution attempted
- Previous migration crashed without releasing lock

**Solution:**
```python
# Check and reset migration lock
db_manager._migration_lock = False
db_manager.run_migrations()

# Or restart the application
```

---

#### Error 2: Migration File Not Found

**Symptom:**
```
MigrationError: Migration file not found in history
```

**Cause:**
- Migration file deleted after being applied
- Incorrect migrations_path configuration

**Solution:**
```python
# 1. Check migrations path
print(db_manager.migrations_path)
# Ensure path exists and contains migration files

# 2. Restore migration file from version control
git checkout src/persistence/migrations/20251119_feature.py

# 3. Verify file exists
migration_files = list(db_manager.migrations_path.glob("*.py"))
print(f"Found {len(migration_files)} migration files")
```

---

#### Error 3: Schema Version Mismatch

**Symptom:**
```
DatabaseError: Schema version mismatch: backup is 10, current is 15
```

**Cause:**
- Attempting to restore backup from different schema version

**Solution:**
```python
# Option 1: Force restore (may lose data)
db_manager.restore_database(backup_path, force=True)

# Option 2: Create migration path
# Restore to temporary database
temp_config = config.copy()
temp_config['connection_string'] = 'data/temp.db'
temp_manager = DatabaseManager(temp_config)
temp_manager.restore_database(backup_path, force=True)

# Migrate temp database to current version
temp_manager.run_migrations()

# Export data and import to main database
data = temp_manager.backend.export_data()
db_manager.backend.import_data(data)
```

---

#### Error 4: Backend Type Mismatch

**Symptom:**
```
ConfigurationError: Unsupported backend: postgres
```

**Cause:**
- Typo in backend name
- Backend not supported

**Solution:**
```python
# Check supported backends
print(DatabaseManager.SUPPORTED_BACKENDS.keys())
# Output: dict_keys(['json', 'sqlite', 'postgresql'])

# Use correct backend name
config['backend'] = 'postgresql'  # Not 'postgres'
```

---

#### Error 5: Migration Dependency Not Satisfied

**Symptom:**
```
MigrationError: Dependency not satisfied: version 20251119120000
```

**Cause:**
- Required migration not applied
- Migration order incorrect

**Solution:**
```python
# 1. Check current schema version
current = db_manager._get_schema_version()
print(f"Current version: {current}")

# 2. List available migrations
migrations = db_manager._get_available_migrations()
for m in sorted(migrations, key=lambda x: x['version']):
    print(f"{m['version']}: {m['name']}")

# 3. Apply missing migrations manually
# Or ensure migrations run in correct order
```

---

### Recovery Procedures

#### Procedure 1: Recover from Failed Migration

```python
def recover_from_failed_migration():
    """Recover database from failed migration."""

    # 1. Create emergency backup
    print("Creating emergency backup...")
    backup_path = db_manager.backup_database()
    print(f"Backup created: {backup_path}")

    # 2. Get current state
    current_version = db_manager._get_schema_version()
    history = db_manager.backend.get('_migration_history')

    print(f"Current schema version: {current_version}")
    print(f"Migrations applied: {len(history['migrations'])}")

    # 3. Identify failed migration
    migrations = db_manager._get_available_migrations()
    pending = [m for m in migrations if m['version'] > current_version]

    if pending:
        failed_migration = min(pending, key=lambda x: x['version'])
        print(f"Failed migration: {failed_migration['name']}")

        # 4. Options:
        print("\nRecovery options:")
        print("A. Fix migration file and retry")
        print("B. Skip this migration (manual fix required)")
        print("C. Restore from backup")

        choice = input("Select option (A/B/C): ")

        if choice == 'A':
            print("Fix the migration file, then run:")
            print("db_manager.run_migrations()")

        elif choice == 'B':
            # Mark migration as applied (dangerous!)
            print("WARNING: Skipping migration without applying changes")
            db_manager._record_migration(failed_migration)
            db_manager._set_schema_version(failed_migration['version'])

        elif choice == 'C':
            print(f"Restoring from: {backup_path}")
            db_manager.restore_database(backup_path, force=True)
```

---

#### Procedure 2: Backup and Restore

**Creating Backups:**

```python
# Automatic backup (timestamped)
backup_path = db_manager.backup_database()

# Custom backup location
from pathlib import Path
custom_path = Path('backups/pre_migration_backup.json')
backup_path = db_manager.backup_database(custom_path)

# Scheduled backups
import schedule
import time

def create_daily_backup():
    backup_path = db_manager.backup_database()
    print(f"Daily backup created: {backup_path}")

schedule.every().day.at("02:00").do(create_daily_backup)

while True:
    schedule.run_pending()
    time.sleep(60)
```

**Restoring from Backup:**

```python
# Standard restore
db_manager.restore_database(Path('backups/backup.json'))

# Force restore (override version checks)
db_manager.restore_database(
    Path('backups/backup.json'),
    force=True
)

# Selective restore (custom logic)
import json

with open('backups/backup.json', 'r') as f:
    backup_data = json.load(f)

# Extract specific data
user_data = backup_data['data'].get('users', {})

# Restore only users
for user_key, user_value in user_data.items():
    db_manager.backend.set(user_key, user_value)
```

---

#### Procedure 3: Version Conflict Resolution

```python
def resolve_version_conflict():
    """Resolve conflicts between migration versions."""

    # Get all migrations
    migrations = db_manager._get_available_migrations()

    # Check for duplicate versions
    versions = [m['version'] for m in migrations]
    duplicates = [v for v in versions if versions.count(v) > 1]

    if duplicates:
        print(f"Found duplicate versions: {duplicates}")

        for dup_version in duplicates:
            dup_migrations = [m for m in migrations if m['version'] == dup_version]

            print(f"\nConflicting migrations for version {dup_version}:")
            for idx, m in enumerate(dup_migrations):
                print(f"{idx + 1}. {m['name']} ({m['file']})")

            # Resolution: Rename migrations with new timestamps
            for m in dup_migrations[1:]:  # Keep first one
                old_file = m['file']
                new_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                new_name = f"{new_timestamp}_{m['name'].split('_', 1)[1]}"
                new_file = old_file.parent / f"{new_name}.py"

                print(f"Renaming: {old_file.name} -> {new_file.name}")
                old_file.rename(new_file)
```

---

## API Reference

### DatabaseManager Class

#### Constructor

```python
DatabaseManager(config: Dict[str, Any])
```

**Parameters:**
- `config` (dict): Database configuration
  - `backend` (str): Backend type ('json', 'sqlite', 'postgresql')
  - `connection_string` (str): Connection string for backend
  - `migrations_path` (str): Path to migrations directory
  - Additional backend-specific options

**Example:**
```python
config = {
    'backend': 'sqlite',
    'connection_string': 'data/app.db',
    'migrations_path': 'src/persistence/migrations'
}
db_manager = DatabaseManager(config)
```

---

#### Methods

##### initialize()

```python
initialize() -> None
```

Initialize database backend and run pending migrations.

**Raises:**
- `ConfigurationError`: If backend type is unsupported
- `DatabaseError`: If initialization fails
- `MigrationError`: If migration execution fails

**Example:**
```python
db_manager.initialize()
```

---

##### run_migrations()

```python
run_migrations() -> None
```

Run all pending database migrations.

**Behavior:**
- Gets current schema version
- Identifies pending migrations
- Applies migrations in version order
- Updates schema version after each migration
- Records migration history

**Raises:**
- `MigrationError`: If migration fails

**Example:**
```python
db_manager.run_migrations()
```

---

##### create_migration()

```python
create_migration(name: str, description: str = "") -> Path
```

Create a new migration file from template.

**Parameters:**
- `name` (str): Migration name (snake_case recommended)
- `description` (str): Human-readable description

**Returns:**
- `Path`: Path to created migration file

**Example:**
```python
migration_file = db_manager.create_migration(
    name="add_user_avatar",
    description="Add avatar URL field to user profiles"
)
```

---

##### backup_database()

```python
backup_database(backup_path: Optional[Path] = None) -> Path
```

Create a backup of the database.

**Parameters:**
- `backup_path` (Path, optional): Custom backup file path. If None, auto-generates timestamped filename.

**Returns:**
- `Path`: Path to backup file

**Raises:**
- `DatabaseError`: If backup fails

**Backup Format:**
```json
{
  "backend_type": "sqlite",
  "schema_version": 20251119180000,
  "created_at": "2025-11-19T18:30:00",
  "data": {
    "users": {...},
    "settings": {...}
  }
}
```

**Example:**
```python
# Auto-named backup
backup_path = db_manager.backup_database()

# Custom path
backup_path = db_manager.backup_database(Path('backups/manual_backup.json'))
```

---

##### restore_database()

```python
restore_database(backup_path: Path, force: bool = False) -> None
```

Restore database from backup file.

**Parameters:**
- `backup_path` (Path): Path to backup file
- `force` (bool): Force restore even if versions/backends don't match

**Raises:**
- `DatabaseError`: If restore fails or validation fails

**Example:**
```python
# Safe restore (with validation)
db_manager.restore_database(Path('backups/backup.json'))

# Force restore
db_manager.restore_database(Path('backups/backup.json'), force=True)
```

---

##### get_health_status()

```python
get_health_status() -> Dict[str, Any]
```

Get database health status and metrics.

**Returns:**
- `dict`: Health status information
  - `backend_type` (str): Backend type
  - `initialized` (bool): Whether backend is initialized
  - `schema_version` (int): Current schema version
  - `timestamp` (str): Status check timestamp
  - Additional backend-specific stats

**Example:**
```python
health = db_manager.get_health_status()
print(f"Backend: {health['backend_type']}")
print(f"Schema Version: {health['schema_version']}")
print(f"Initialized: {health['initialized']}")
```

---

##### get_backend()

```python
get_backend() -> StorageBackend
```

Get the active storage backend instance.

**Returns:**
- `StorageBackend`: Active backend instance

**Raises:**
- `DatabaseError`: If database not initialized

**Example:**
```python
backend = db_manager.get_backend()
user = backend.get('user:123')
```

---

##### close()

```python
close() -> None
```

Close database connections and cleanup resources.

**Example:**
```python
try:
    db_manager.initialize()
    # ... use database ...
finally:
    db_manager.close()
```

---

### DatabaseConfig Class

Static helper methods for configuration management.

#### from_env()

```python
@staticmethod
from_env() -> Dict[str, Any]
```

Load configuration from environment variables.

**Environment Variables:**
- `DB_BACKEND`: Backend type (default: 'sqlite')
- `DB_CONNECTION_STRING`: Connection string
- `DB_HOST`: Database host (default: 'localhost')
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name (default: 'cli_app')
- `DB_USER`: Username
- `DB_PASSWORD`: Password
- `DB_MIGRATIONS_PATH`: Migrations directory
- `DB_CACHE_SIZE`: Cache size (default: 100)
- `DB_POOL_SIZE`: Connection pool size (default: 10)
- `DB_TIMEOUT`: Operation timeout in seconds (default: 30)

**Example:**
```python
config = DatabaseConfig.from_env()
db_manager = DatabaseManager(config)
```

---

#### from_file()

```python
@staticmethod
from_file(config_path: Path) -> Dict[str, Any]
```

Load configuration from JSON file.

**Parameters:**
- `config_path` (Path): Path to JSON config file

**Example:**
```python
config = DatabaseConfig.from_file(Path('config/database.json'))
db_manager = DatabaseManager(config)
```

---

#### get_default()

```python
@staticmethod
get_default() -> Dict[str, Any]
```

Get default database configuration.

**Returns:**
```python
{
    'backend': 'sqlite',
    'connection_string': 'data/app.db',
    'migrations_path': 'src/persistence/migrations',
    'cache_size': 100,
    'pool_size': 5,
    'timeout': 30,
    'backup_retention': 7
}
```

**Example:**
```python
config = DatabaseConfig.get_default()
db_manager = DatabaseManager(config)
```

---

### Migration File API

#### Required Functions

**up(backend, config)**

Apply the migration.

```python
def up(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Apply the migration."""
    # Implementation here
    pass
```

**down(backend, config)**

Rollback the migration.

```python
def down(backend: StorageBackend, config: Dict[str, Any]) -> None:
    """Rollback the migration."""
    # Implementation here
    pass
```

#### Required Metadata

```python
VERSION = 20251119150000  # Timestamp-based version (YYYYMMDD_HHMMSS)
DESCRIPTION = "Migration description"
DEPENDENCIES = []  # List of version numbers this migration depends on
```

---

### Exception Classes

#### DatabaseError

Base exception for database-related errors.

```python
from src.persistence.exceptions import DatabaseError

try:
    db_manager.initialize()
except DatabaseError as e:
    print(f"Database error: {e}")
```

#### MigrationError

Exception raised during migration operations.

```python
from src.persistence.exceptions import MigrationError

try:
    db_manager.run_migrations()
except MigrationError as e:
    print(f"Migration failed: {e}")
```

#### ConfigurationError

Exception raised for configuration issues.

```python
from src.persistence.exceptions import ConfigurationError

try:
    config = {'backend': 'invalid'}
    db_manager = DatabaseManager(config)
    db_manager.initialize()
except ConfigurationError as e:
    print(f"Configuration error: {e}")
```

---

## Best Practices

### 1. Migration Naming

**Good:**
```
20251119_143022_add_user_preferences.py
20251119_150000_normalize_phone_numbers.py
20251119_163000_create_role_system.py
```

**Bad:**
```
migration1.py
fix_stuff.py
update.py
```

**Guidelines:**
- Use descriptive names that explain what the migration does
- Use snake_case for names
- Prefix with timestamp (handled automatically)
- Keep names concise but clear

---

### 2. Migration Structure

**Always include both up() and down():**

```python
def up(backend, config):
    """Clear description of what this does."""
    # Implementation
    pass

def down(backend, config):
    """Clear description of how to undo this."""
    # Implementation
    pass
```

**Set metadata:**

```python
VERSION = 20251119143022  # Auto-generated
DESCRIPTION = "What this migration accomplishes"
DEPENDENCIES = [previous_version_if_needed]
```

---

### 3. Data Safety

**Create backups before destructive operations:**

```python
def up(backend, config):
    # Backup existing data
    users = backend.list('users')
    backup_key = f'users_backup_{VERSION}'
    backend.set(backup_key, {
        'users': [backend.get(u) for u in users]
    })

    # Perform transformation
    for user_key in users:
        # ... transform data ...
        pass
```

**Validate data before and after:**

```python
def up(backend, config):
    # Validate preconditions
    users = backend.list('users')
    for user_key in users:
        user = backend.get(user_key)
        assert 'email' in user, f"User {user_key} missing email"

    # Perform migration
    # ...

    # Validate postconditions
    for user_key in users:
        user = backend.get(user_key)
        assert 'email_verified' in user, f"Migration failed for {user_key}"
```

---

### 4. Idempotency

Make migrations safe to run multiple times:

```python
def up(backend, config):
    """Add preferences field (idempotent)."""
    users = backend.list('users')

    for user_key in users:
        user = backend.get(user_key)

        # Check if already applied
        if 'preferences' not in user:
            user['preferences'] = get_default_preferences()
            backend.set(user_key, user)
```

---

### 5. Error Handling

**Handle errors gracefully:**

```python
def up(backend, config):
    users = backend.list('users')
    errors = []

    for user_key in users:
        try:
            user = backend.get(user_key)
            # ... transformation ...
            backend.set(user_key, user)
        except Exception as e:
            errors.append((user_key, str(e)))
            continue

    if errors:
        # Log errors but don't fail entirely
        logger.warning(f"Migration completed with {len(errors)} errors")
        for user_key, error in errors:
            logger.error(f"  {user_key}: {error}")
```

---

### 6. Testing Migrations

**Test both up() and down():**

```python
# tests/test_migrations.py
import pytest
from src.persistence.db_manager import DatabaseManager
from src.persistence.storage_backend import JSONBackend

def test_add_user_preferences_migration():
    # Setup
    config = {'backend': 'json', 'connection_string': ':memory:'}
    db_manager = DatabaseManager(config)
    backend = JSONBackend(config)
    backend.initialize()

    # Create test data
    backend.set('user:1', {'id': 1, 'name': 'Test User'})

    # Import and test migration
    from migrations.20251119_143022_add_user_preferences import up, down

    # Test up
    up(backend, config)
    user = backend.get('user:1')
    assert 'preferences' in user
    assert user['preferences']['theme'] == 'light'

    # Test down
    down(backend, config)
    user = backend.get('user:1')
    assert 'preferences' not in user
```

---

### 7. Documentation

**Document complex migrations:**

```python
"""
Migration: normalize_phone_numbers
Description: Normalize all phone numbers to E.164 format

This migration:
1. Finds all user phone numbers
2. Normalizes to E.164 format (+1234567890)
3. Stores original in _phone_original for rollback
4. Handles missing area codes (assumes US +1)

Affects: ~10,000 user records
Estimated time: 2-3 minutes
Risk: Low (reversible, preserves originals)

Testing:
- Verified on staging with 50,000 records
- All formats successfully normalized
- Rollback tested and confirmed

Created: 2025-11-19T16:00:00
"""
```

---

### 8. Performance Considerations

**Batch operations for large datasets:**

```python
def up(backend, config):
    """Process users in batches for better performance."""
    users = backend.list('users')
    batch_size = 100

    for i in range(0, len(users), batch_size):
        batch = users[i:i + batch_size]

        for user_key in batch:
            user = backend.get(user_key)
            # ... transform ...
            backend.set(user_key, user)

        # Log progress
        print(f"Processed {min(i + batch_size, len(users))}/{len(users)} users")
```

---

### 9. Rollback Strategy

**Always provide a working down() function:**

```python
def up(backend, config):
    # Before making changes, create backup
    backup_key = f'_migration_backup_{VERSION}'
    current_state = {
        'users': [backend.get(u) for u in backend.list('users')]
    }
    backend.set(backup_key, current_state)

    # Perform migration
    # ...

def down(backend, config):
    # Restore from backup
    backup_key = f'_migration_backup_{VERSION}'
    backup = backend.get(backup_key)

    if backup:
        for user in backup['users']:
            backend.set(f"user:{user['id']}", user)
        backend.delete(backup_key)
```

---

### 10. Version Control

**Commit migrations atomically:**

```bash
# Good
git add src/persistence/migrations/20251119_143022_add_user_preferences.py
git commit -m "migration: add user preferences field

- Adds preferences dict to all users
- Default theme: light
- Includes rollback function"

# Bad
git add .
git commit -m "updates"
```

**Never modify applied migrations:**

```bash
# If you need to make changes after applying:
# 1. Create a new migration instead
db_manager.create_migration(
    name="fix_user_preferences",
    description="Correct default preferences from previous migration"
)

# 2. NOT: Modify the original migration file
```

---

## Related Documentation

- [Database Architecture](/home/user/algorithms_and_data_structures/docs/DATABASE_ARCHITECTURE.md) - Overall database design
- [Storage Backends](/home/user/algorithms_and_data_structures/src/persistence/storage_backend.py) - Backend implementations
- [API Reference](/home/user/algorithms_and_data_structures/docs/API_REFERENCE.md) - Complete API documentation

---

## Support and Contribution

For issues or questions about migrations:
1. Check this documentation first
2. Review existing migrations for examples
3. Check logs for detailed error messages
4. Create backups before attempting fixes

**Last Updated:** 2025-11-19
**Maintainer:** Development Team
