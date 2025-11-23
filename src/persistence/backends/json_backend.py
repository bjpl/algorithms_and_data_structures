"""
JSON File-Based Storage Backend

Simple file-based storage implementation for development and testing.
"""

import json
import threading
from typing import Dict, Any, List, Optional
from pathlib import Path
from contextlib import contextmanager

from .base import StorageBackend
from ..exceptions import StorageError


class JSONBackend(StorageBackend):
    """Simple JSON file-based storage backend."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.file_path = Path(config.get('connection_string', 'data/storage.json'))
        self.data: Dict[str, Any] = {}
        self._lock = threading.RLock()
        self.auto_save = config.get('auto_save', True)
        self.backup_count = config.get('backup_count', 3)
        self._transaction_backup: Optional[Dict[str, Any]] = None

    def initialize(self) -> None:
        """Initialize JSON storage backend."""
        try:
            # Ensure directory exists
            self.file_path.parent.mkdir(parents=True, exist_ok=True)

            # Load existing data
            if self.file_path.exists():
                with open(self.file_path, 'r') as f:
                    self.data = json.load(f)
            else:
                self.data = {}
                self._save()

            self.is_initialized = True
            self.logger.info(f"JSON backend initialized: {self.file_path}")

        except Exception as e:
            raise StorageError(f"Failed to initialize JSON backend: {str(e)}")

    def close(self) -> None:
        """Close JSON backend and save data."""
        if self.is_initialized:
            self._save()
            self.is_initialized = False
            self.logger.info("JSON backend closed")

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve value by key."""
        # Check cache first
        cached = self.cache.get(key)
        if cached is not None:
            return cached

        with self._lock:
            value = self.data.get(key)
            if value is not None:
                self.cache.put(key, value)
            return value

    def set(self, key: str, value: Dict[str, Any]) -> None:
        """Store value with key."""
        with self._lock:
            self.data[key] = value
            self.cache.put(key, value)

            if self.auto_save:
                self._save()

    def delete(self, key: str) -> bool:
        """Delete key."""
        with self._lock:
            existed = key in self.data
            if existed:
                del self.data[key]
                self.cache.delete(key)

                if self.auto_save:
                    self._save()

            return existed

    def list_keys(self, prefix: str = "") -> List[str]:
        """List all keys with optional prefix filter."""
        with self._lock:
            if prefix:
                return [k for k in self.data.keys() if k.startswith(prefix)]
            return list(self.data.keys())

    def exists(self, key: str) -> bool:
        """Check if key exists."""
        with self._lock:
            return key in self.data

    def clear(self) -> None:
        """Clear all data."""
        with self._lock:
            self.data.clear()
            self.cache.clear()

            if self.auto_save:
                self._save()

    def get_stats(self) -> Dict[str, Any]:
        """Get backend statistics."""
        return {
            'type': 'json',
            'file_path': str(self.file_path),
            'file_size': self.file_path.stat().st_size if self.file_path.exists() else 0,
            'key_count': len(self.data),
            'cache_size': len(self.cache),
            'cache_hit_rate': self.cache.hit_rate,
            'is_initialized': self.is_initialized
        }

    def export_data(self) -> Dict[str, Any]:
        """Export all data."""
        with self._lock:
            return dict(self.data)

    def import_data(self, data: Dict[str, Any]) -> None:
        """Import data."""
        with self._lock:
            self.data = dict(data)
            self.cache.clear()

            if self.auto_save:
                self._save()

    def _save(self) -> None:
        """Save data to file with backup rotation."""
        try:
            # Create backup if file exists
            if self.file_path.exists() and self.backup_count > 0:
                self._rotate_backups()

            # Write to temporary file first, then rename (atomic operation)
            temp_path = self.file_path.with_suffix('.tmp')
            with open(temp_path, 'w') as f:
                json.dump(self.data, f, indent=2, default=str)

            temp_path.replace(self.file_path)

        except Exception as e:
            self.logger.error(f"Failed to save JSON data: {str(e)}")
            raise StorageError(f"Failed to save data: {str(e)}")

    def _rotate_backups(self) -> None:
        """Rotate backup files."""
        for i in range(self.backup_count - 1, 0, -1):
            old_backup = self.file_path.with_suffix(f'.bak{i}')
            new_backup = self.file_path.with_suffix(f'.bak{i + 1}')

            if old_backup.exists():
                if new_backup.exists():
                    new_backup.unlink()
                old_backup.rename(new_backup)

        # Create first backup
        backup_path = self.file_path.with_suffix('.bak1')
        if backup_path.exists():
            backup_path.unlink()
        self.file_path.rename(backup_path)

    @contextmanager
    def transaction(self):
        """
        Transaction context manager for JSONBackend.

        Uses in-memory backup for rollback support since JSON doesn't have native transactions.
        Creates a deep copy of data at transaction start, and restores it on error.
        """
        with self._lock:
            # Create backup of current data
            import copy
            self._transaction_backup = copy.deepcopy(self.data)

            try:
                yield self
                # Commit: Save to disk
                if self.auto_save:
                    self._save()
                self._transaction_backup = None
            except Exception:
                # Rollback: Restore from backup
                if self._transaction_backup is not None:
                    self.data = self._transaction_backup
                    self._transaction_backup = None
                    # Clear cache to ensure fresh reads after rollback
                    self.cache.clear()
                    # Don't save - keep file as it was
                    self.logger.info("Transaction rolled back successfully")
                raise
