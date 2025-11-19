"""
SQLite Database Storage Backend

Local database implementation with SQL capabilities for structured data.
"""

import json
import sqlite3
import threading
from typing import Dict, Any, List, Optional
from pathlib import Path
from datetime import datetime
from contextlib import contextmanager

from .base import StorageBackend
from ..exceptions import StorageError, QueryError


class SQLiteBackend(StorageBackend):
    """SQLite database storage backend."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.db_path = Path(config.get('connection_string', 'data/storage.db'))
        self.connection: Optional[sqlite3.Connection] = None
        self._lock = threading.RLock()
        self.timeout = config.get('timeout', 30)
        self._in_transaction = False

    def initialize(self) -> None:
        """Initialize SQLite backend."""
        try:
            # Ensure directory exists
            self.db_path.parent.mkdir(parents=True, exist_ok=True)

            # Connect to database
            self.connection = sqlite3.connect(
                str(self.db_path),
                timeout=self.timeout,
                check_same_thread=False
            )

            # Enable WAL mode for better concurrency
            self.connection.execute("PRAGMA journal_mode=WAL")
            self.connection.execute("PRAGMA synchronous=NORMAL")
            self.connection.execute("PRAGMA cache_size=10000")
            self.connection.execute("PRAGMA temp_store=MEMORY")

            # Create tables
            self._create_tables()

            self.is_initialized = True
            self.logger.info(f"SQLite backend initialized: {self.db_path}")

        except Exception as e:
            raise StorageError(f"Failed to initialize SQLite backend: {str(e)}")

    def close(self) -> None:
        """Close SQLite connection."""
        if self.connection:
            self.connection.close()
            self.connection = None
            self.is_initialized = False
            self.logger.info("SQLite backend closed")

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve value by key."""
        # Check cache first
        cached = self.cache.get(key)
        if cached is not None:
            return cached

        try:
            with self._lock:
                cursor = self.connection.execute(
                    "SELECT value FROM storage WHERE key = ?", (key,)
                )
                row = cursor.fetchone()

                if row:
                    value = json.loads(row[0])
                    self.cache.put(key, value)
                    return value

                return None

        except Exception as e:
            raise QueryError(f"Failed to get key '{key}': {str(e)}")

    def set(self, key: str, value: Dict[str, Any]) -> None:
        """Store value with key."""
        try:
            with self._lock:
                self.connection.execute(
                    "INSERT OR REPLACE INTO storage (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)",
                    (key, json.dumps(value, default=str), datetime.now(), datetime.now())
                )
                # Only commit if not in a transaction
                if not self._in_transaction:
                    self.connection.commit()
                self.cache.put(key, value)

        except Exception as e:
            raise QueryError(f"Failed to set key '{key}': {str(e)}")

    def delete(self, key: str) -> bool:
        """Delete key."""
        try:
            with self._lock:
                cursor = self.connection.execute("DELETE FROM storage WHERE key = ?", (key,))
                # Only commit if not in a transaction
                if not self._in_transaction:
                    self.connection.commit()
                self.cache.delete(key)
                return cursor.rowcount > 0

        except Exception as e:
            raise QueryError(f"Failed to delete key '{key}': {str(e)}")

    def list_keys(self, prefix: str = "") -> List[str]:
        """List keys with optional prefix filter."""
        try:
            with self._lock:
                if prefix:
                    cursor = self.connection.execute(
                        "SELECT key FROM storage WHERE key LIKE ?", (f"{prefix}%",)
                    )
                else:
                    cursor = self.connection.execute("SELECT key FROM storage")

                return [row[0] for row in cursor.fetchall()]

        except Exception as e:
            raise QueryError(f"Failed to list keys: {str(e)}")

    def exists(self, key: str) -> bool:
        """Check if key exists."""
        try:
            with self._lock:
                cursor = self.connection.execute(
                    "SELECT 1 FROM storage WHERE key = ? LIMIT 1", (key,)
                )
                return cursor.fetchone() is not None

        except Exception as e:
            raise QueryError(f"Failed to check key existence: {str(e)}")

    def clear(self) -> None:
        """Clear all data."""
        try:
            with self._lock:
                self.connection.execute("DELETE FROM storage")
                # Only commit if not in a transaction
                if not self._in_transaction:
                    self.connection.commit()
                self.cache.clear()

        except Exception as e:
            raise QueryError(f"Failed to clear data: {str(e)}")

    def get_stats(self) -> Dict[str, Any]:
        """Get backend statistics."""
        try:
            with self._lock:
                # Get database size
                cursor = self.connection.execute("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")
                db_size = cursor.fetchone()[0]

                # Get record count
                cursor = self.connection.execute("SELECT COUNT(*) FROM storage")
                key_count = cursor.fetchone()[0]

                return {
                    'type': 'sqlite',
                    'db_path': str(self.db_path),
                    'db_size': db_size,
                    'key_count': key_count,
                    'cache_size': len(self.cache),
                    'cache_hit_rate': self.cache.hit_rate,
                    'is_initialized': self.is_initialized
                }

        except Exception as e:
            return {'error': str(e), 'type': 'sqlite'}

    def export_data(self) -> Dict[str, Any]:
        """Export all data."""
        try:
            with self._lock:
                cursor = self.connection.execute("SELECT key, value FROM storage")
                return {row[0]: json.loads(row[1]) for row in cursor.fetchall()}

        except Exception as e:
            raise QueryError(f"Failed to export data: {str(e)}")

    def import_data(self, data: Dict[str, Any]) -> None:
        """Import data."""
        try:
            with self._lock:
                # Clear existing data
                self.connection.execute("DELETE FROM storage")

                # Insert new data
                for key, value in data.items():
                    self.connection.execute(
                        "INSERT INTO storage (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)",
                        (key, json.dumps(value, default=str), datetime.now(), datetime.now())
                    )

                # Only commit if not in a transaction
                if not self._in_transaction:
                    self.connection.commit()
                self.cache.clear()

        except Exception as e:
            raise QueryError(f"Failed to import data: {str(e)}")

    @contextmanager
    def transaction(self):
        """SQLite transaction context manager."""
        with self._lock:
            # Set transaction flag to prevent auto-commits
            old_in_transaction = self._in_transaction
            old_isolation_level = self.connection.isolation_level
            try:
                self._in_transaction = True
                # Set to None to enter manual transaction mode
                self.connection.isolation_level = None
                self.connection.execute("BEGIN")
                yield self
                self.connection.execute("COMMIT")
            except Exception:
                try:
                    self.connection.execute("ROLLBACK")
                    # Clear cache on rollback to ensure fresh reads
                    self.cache.clear()
                except Exception as rollback_error:
                    # If rollback fails, log but don't hide the original error
                    self.logger.warning(f"Rollback failed: {rollback_error}")
                raise
            finally:
                # Restore flags
                self._in_transaction = old_in_transaction
                self.connection.isolation_level = old_isolation_level

    def _create_tables(self) -> None:
        """Create database tables."""
        self.connection.executescript("""
            CREATE TABLE IF NOT EXISTS storage (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_storage_updated_at ON storage(updated_at);

            CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        self.connection.commit()
