"""
PostgreSQL Database Storage Backend

Production-ready database implementation with advanced features like connection
pooling, JSON indexing, and transaction support.
"""

import json
from typing import Dict, Any, List, Optional
from contextlib import contextmanager

try:
    import psycopg2
    import psycopg2.pool
    POSTGRESQL_AVAILABLE = True
except ImportError:
    POSTGRESQL_AVAILABLE = False

from .base import StorageBackend
from ..exceptions import StorageError, QueryError


class PostgreSQLBackend(StorageBackend):
    """PostgreSQL database storage backend."""

    def __init__(self, config: Dict[str, Any]):
        if not POSTGRESQL_AVAILABLE:
            raise StorageError("PostgreSQL support requires psycopg2: pip install psycopg2-binary")

        super().__init__(config)
        self.host = config.get('host', 'localhost')
        self.port = config.get('port', 5432)
        self.database = config.get('database', 'cli_app')
        self.username = config.get('username', 'postgres')
        self.password = config.get('password', '')
        self.pool_size = config.get('pool_size', 10)
        self.timeout = config.get('timeout', 30)

        self.connection_pool: Optional[psycopg2.pool.ThreadedConnectionPool] = None

    def initialize(self) -> None:
        """Initialize PostgreSQL backend."""
        try:
            # Create connection pool
            self.connection_pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=self.pool_size,
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.username,
                password=self.password,
                connect_timeout=self.timeout
            )

            # Test connection and create tables
            with self._get_connection() as conn:
                self._create_tables(conn)

            self.is_initialized = True
            self.logger.info(f"PostgreSQL backend initialized: {self.host}:{self.port}/{self.database}")

        except Exception as e:
            raise StorageError(f"Failed to initialize PostgreSQL backend: {str(e)}")

    def close(self) -> None:
        """Close PostgreSQL connections."""
        if self.connection_pool:
            self.connection_pool.closeall()
            self.connection_pool = None
            self.is_initialized = False
            self.logger.info("PostgreSQL backend closed")

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve value by key."""
        # Check cache first
        cached = self.cache.get(key)
        if cached is not None:
            return cached

        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT value FROM storage WHERE key = %s", (key,))
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
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO storage (key, value, created_at, updated_at)
                        VALUES (%s, %s, NOW(), NOW())
                        ON CONFLICT (key) DO UPDATE SET
                        value = EXCLUDED.value, updated_at = NOW()
                        """,
                        (key, json.dumps(value, default=str))
                    )
                    conn.commit()
                    self.cache.put(key, value)

        except Exception as e:
            raise QueryError(f"Failed to set key '{key}': {str(e)}")

    def delete(self, key: str) -> bool:
        """Delete key."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("DELETE FROM storage WHERE key = %s", (key,))
                    conn.commit()
                    self.cache.delete(key)
                    return cursor.rowcount > 0

        except Exception as e:
            raise QueryError(f"Failed to delete key '{key}': {str(e)}")

    def list_keys(self, prefix: str = "") -> List[str]:
        """List keys with optional prefix filter."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    if prefix:
                        cursor.execute("SELECT key FROM storage WHERE key LIKE %s", (f"{prefix}%",))
                    else:
                        cursor.execute("SELECT key FROM storage")

                    return [row[0] for row in cursor.fetchall()]

        except Exception as e:
            raise QueryError(f"Failed to list keys: {str(e)}")

    def exists(self, key: str) -> bool:
        """Check if key exists."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1 FROM storage WHERE key = %s LIMIT 1", (key,))
                    return cursor.fetchone() is not None

        except Exception as e:
            raise QueryError(f"Failed to check key existence: {str(e)}")

    def clear(self) -> None:
        """Clear all data."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("DELETE FROM storage")
                    conn.commit()
                    self.cache.clear()

        except Exception as e:
            raise QueryError(f"Failed to clear data: {str(e)}")

    def get_stats(self) -> Dict[str, Any]:
        """Get backend statistics."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    # Get table size
                    cursor.execute("SELECT pg_total_relation_size('storage')")
                    table_size = cursor.fetchone()[0]

                    # Get record count
                    cursor.execute("SELECT COUNT(*) FROM storage")
                    key_count = cursor.fetchone()[0]

                    return {
                        'type': 'postgresql',
                        'host': self.host,
                        'database': self.database,
                        'table_size': table_size,
                        'key_count': key_count,
                        'cache_size': len(self.cache),
                        'cache_hit_rate': self.cache.hit_rate,
                        'pool_size': self.pool_size,
                        'is_initialized': self.is_initialized
                    }

        except Exception as e:
            return {'error': str(e), 'type': 'postgresql'}

    def export_data(self) -> Dict[str, Any]:
        """Export all data."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT key, value FROM storage")
                    return {row[0]: json.loads(row[1]) for row in cursor.fetchall()}

        except Exception as e:
            raise QueryError(f"Failed to export data: {str(e)}")

    def import_data(self, data: Dict[str, Any]) -> None:
        """Import data."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    # Clear existing data
                    cursor.execute("DELETE FROM storage")

                    # Insert new data in batch
                    if data:
                        values = [
                            (key, json.dumps(value, default=str))
                            for key, value in data.items()
                        ]
                        cursor.executemany(
                            "INSERT INTO storage (key, value, created_at, updated_at) VALUES (%s, %s, NOW(), NOW())",
                            values
                        )

                    conn.commit()
                    self.cache.clear()

        except Exception as e:
            raise QueryError(f"Failed to import data: {str(e)}")

    @contextmanager
    def transaction(self):
        """PostgreSQL transaction context manager."""
        conn = None
        try:
            conn = self.connection_pool.getconn()
            conn.autocommit = False
            yield conn
            conn.commit()
        except Exception:
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.autocommit = True
                self.connection_pool.putconn(conn)

    @contextmanager
    def _get_connection(self):
        """Get connection from pool."""
        conn = None
        try:
            conn = self.connection_pool.getconn()
            yield conn
        finally:
            if conn:
                self.connection_pool.putconn(conn)

    def _create_tables(self, conn) -> None:
        """Create database tables."""
        with conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS storage (
                    key TEXT PRIMARY KEY,
                    value JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_storage_updated_at ON storage(updated_at);
                CREATE INDEX IF NOT EXISTS idx_storage_value_gin ON storage USING gin(value);

                CREATE TABLE IF NOT EXISTS metadata (
                    key TEXT PRIMARY KEY,
                    value JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
            conn.commit()
