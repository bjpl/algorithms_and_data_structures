"""
Abstract Storage Backend Base Class

Defines the interface that all storage backends must implement.
"""

import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from contextlib import contextmanager

from ..cache import LRUCache


class StorageBackend(ABC):
    """Abstract base class for storage backends."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize storage backend.

        Args:
            config: Backend configuration dictionary
        """
        self.config = config
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        self.cache = LRUCache(config.get('cache_size', 100))
        self.is_initialized = False

    @abstractmethod
    def initialize(self) -> None:
        """Initialize the storage backend."""
        pass

    @abstractmethod
    def close(self) -> None:
        """Close connections and cleanup resources."""
        pass

    @abstractmethod
    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve a value by key."""
        pass

    @abstractmethod
    def set(self, key: str, value: Dict[str, Any]) -> None:
        """Store a value with the given key."""
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete a value by key. Returns True if key existed."""
        pass

    @abstractmethod
    def list_keys(self, prefix: str = "") -> List[str]:
        """List all keys, optionally filtered by prefix."""
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Check if a key exists."""
        pass

    @abstractmethod
    def clear(self) -> None:
        """Clear all data."""
        pass

    @abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        """Get backend statistics."""
        pass

    @abstractmethod
    def export_data(self) -> Dict[str, Any]:
        """Export all data for backup purposes."""
        pass

    @abstractmethod
    def import_data(self, data: Dict[str, Any]) -> None:
        """Import data from backup."""
        pass

    @contextmanager
    def transaction(self):
        """Context manager for transactions."""
        # Default implementation - subclasses should override for real transactions
        try:
            yield self
        except Exception:
            # In base class, we can't rollback, so just re-raise
            raise

    def batch_get(self, keys: List[str]) -> Dict[str, Optional[Dict[str, Any]]]:
        """Get multiple values in a batch operation."""
        result = {}
        for key in keys:
            result[key] = self.get(key)
        return result

    def batch_set(self, items: Dict[str, Dict[str, Any]]) -> None:
        """Set multiple key-value pairs in a batch operation."""
        for key, value in items.items():
            self.set(key, value)

    def batch_delete(self, keys: List[str]) -> Dict[str, bool]:
        """Delete multiple keys in a batch operation."""
        result = {}
        for key in keys:
            result[key] = self.delete(key)
        return result
