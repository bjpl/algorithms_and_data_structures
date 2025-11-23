"""
Storage Backend - Backward Compatibility Module

This module maintains backward compatibility for existing imports.
All implementations have been moved to the backends/ subdirectory.

DEPRECATED: Import from backends/ instead:
    from .backends import StorageBackend, JSONBackend, SQLiteBackend, PostgreSQLBackend
"""

import warnings

# Import from new location
from .backends import (
    StorageBackend,
    JSONBackend,
    SQLiteBackend,
    PostgreSQLBackend
)

# Show deprecation warning when this module is imported
warnings.warn(
    "Importing from storage_backend.py is deprecated. "
    "Use 'from .backends import ...' instead.",
    DeprecationWarning,
    stacklevel=2
)

__all__ = [
    'StorageBackend',
    'JSONBackend',
    'SQLiteBackend',
    'PostgreSQLBackend'
]
