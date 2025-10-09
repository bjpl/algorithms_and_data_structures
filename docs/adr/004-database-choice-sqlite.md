# ADR-004: SQLite for Note and Progress Storage

## Status
Accepted

## Context

The learning platform needs to persist:
- User progress and completion data
- Notes and annotations
- Curriculum structures
- Assessment results
- User preferences and settings

Data storage requirements:
- **Reliability**: Data must not be lost
- **Performance**: Fast reads and writes for CLI interactions
- **Portability**: Works across Windows, macOS, Linux
- **Simplicity**: Easy setup, no server management
- **Embeddability**: Runs within the application
- **Backups**: Simple backup and restore
- **Migrations**: Schema evolution support

The application is a single-user CLI tool (currently) with potential multi-user future.

## Decision

We will use **SQLite** as the primary database for all persistent storage.

### Implementation Details

- **SQLite Version**: 3.35+ (via Python's built-in sqlite3 module)
- **ORM**: SQLAlchemy for database abstraction
- **Location**: `curriculum.db` in project root (configurable)
- **Migrations**: Alembic for schema versioning
- **Backups**: File-based backups, versioned in `.migration_backups/`

### Database Structure

```
curriculum.db
├── curriculum (courses, modules, lessons)
├── content (lesson content, code examples)
├── user_progress (completion tracking)
├── notes (user annotations)
├── assessments (quiz results, scores)
├── relationships (curriculum hierarchy)
└── metadata (schema version, settings)
```

### Connection Management

```python
# Single connection per process
# Thread-safe with connection pooling
# Automatic connection cleanup

from src.persistence.storage_backend import StorageBackend

storage = StorageBackend("curriculum.db")
curriculum_repo = CurriculumRepository(storage)
```

## Consequences

### Positive Consequences

1. **Zero Configuration**
   - No database server to install
   - No ports to configure
   - No authentication setup
   - Works out of the box

2. **Portability**
   - Database is a single file
   - Copy file = copy entire database
   - Version control friendly (for test fixtures)
   - Cross-platform compatible

3. **Performance**
   - Fast for single-user scenarios
   - Efficient for read-heavy workloads
   - Low memory footprint
   - No network latency

4. **Simplicity**
   - Embedded in Python standard library
   - Simple backup (copy file)
   - Simple restore (copy file back)
   - Easy to inspect (sqlite3 CLI, DB Browser)

5. **Development Velocity**
   - No database setup in dev environment
   - Easy to reset (delete file)
   - Fast tests (in-memory SQLite)
   - CI/CD simple (no database service)

6. **Reliability**
   - ACID transactions
   - Battle-tested (used in billions of devices)
   - Automatic crash recovery
   - Checksums prevent corruption

### Negative Consequences

1. **Concurrency Limitations**
   - Single writer at a time
   - Not suitable for high concurrency
   - May block on writes
   - Web application would struggle

2. **Scalability Ceiling**
   - Not designed for millions of users
   - Limited to single machine
   - No built-in replication
   - Large databases (> 100 GB) less efficient

3. **Feature Limitations**
   - No user authentication
   - No stored procedures
   - Limited full-text search
   - No built-in analytics

4. **Migration to Multi-User Harder**
   - Would need to migrate to PostgreSQL/MySQL for web
   - Different SQL dialects
   - Different backup strategies
   - Repository layer would need changes

5. **File Locking Issues**
   - Can have issues with network filesystems
   - File permissions matter
   - Antivirus can cause problems
   - Cloud sync (Dropbox) can corrupt

6. **No Native Cloud Support**
   - Can't use managed database services
   - Backup requires manual implementation
   - No automatic scaling
   - Monitoring tools less mature

## Alternatives Considered

### Alternative 1: PostgreSQL

**Description**: Production-grade relational database server.

**Pros**:
- Excellent concurrency support
- Advanced features (stored procedures, full-text search)
- Scales to large datasets
- Industry standard
- Better for multi-user scenarios

**Cons**:
- Requires server installation and management
- More complex setup
- Overkill for single-user CLI
- Higher resource usage
- Network overhead (even locally)
- Complex backup/restore

**Why Not Chosen**: PostgreSQL is excellent for multi-user applications but adds unnecessary complexity for a single-user CLI tool. Setup friction would hurt developer experience.

### Alternative 2: JSON Files

**Description**: Store data as JSON files in filesystem.

**Pros**:
- Extremely simple
- Human-readable
- Easy to edit manually
- No dependencies
- Version control friendly

**Cons**:
- No query capabilities
- No transactions
- No schema validation
- Poor performance for large datasets
- Prone to corruption
- No concurrent access handling
- Manual data integrity

**Why Not Chosen**: JSON files work for small configuration but don't scale to the complexity needed for curriculum, progress tracking, and notes.

### Alternative 3: MongoDB (NoSQL)

**Description**: Document-oriented NoSQL database.

**Pros**:
- Flexible schema
- Good for nested data
- Horizontal scaling
- JSON-like documents

**Cons**:
- Requires server installation
- Overkill for structured data
- More complex queries
- Less mature Python libraries
- Learning curve
- Backup more complex

**Why Not Chosen**: MongoDB's strengths (flexible schema, horizontal scaling) don't align with project needs. SQLite's relational model fits curriculum hierarchy better.

### Alternative 4: Embedded NoSQL (TinyDB)

**Description**: Pure Python document database.

**Pros**:
- Zero dependencies
- Pure Python
- Simple API
- Document-oriented

**Cons**:
- Slower than SQLite
- Limited query capabilities
- No transactions
- Less battle-tested
- Small community
- Migration path unclear

**Why Not Chosen**: TinyDB is interesting but less mature and performant than SQLite. SQLite's reliability and performance are proven.

### Alternative 5: Cloud Database (Supabase, Firebase)

**Description**: Managed cloud database service.

**Pros**:
- Automatic backups
- Scalability built-in
- Real-time sync
- Managed service (no maintenance)

**Cons**:
- Requires internet connection
- Privacy concerns (data in cloud)
- Recurring costs
- Vendor lock-in
- Complexity for local development
- Authentication required

**Why Not Chosen**: Cloud databases require constant internet connection and introduce privacy concerns for personal learning data. Local-first is better for educational tool.

## Migration Path (If Needed)

If the project needs to scale to multi-user web application:

1. **SQLAlchemy Abstraction** already in place
2. **Repository Pattern** isolates database logic
3. **Change connection string** to PostgreSQL
4. **Update SQL dialects** where needed (minimal)
5. **Data migration** script to move SQLite → PostgreSQL
6. **Update backup strategy** to pg_dump
7. **Add connection pooling** for web concurrency

Repository pattern makes this migration feasible without rewriting business logic.

## Implementation Guidelines

### Database Files

```
curriculum.db           # Main database (production)
curriculum_test.db     # Test database (development)
curriculum.db.backup   # Manual backups
```

### Schema Migrations

```bash
# Create migration
alembic revision -m "Add user_preferences table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Backup Strategy

```python
# Automated backups before migrations
def backup_database(db_path: str) -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{db_path}.backup.{timestamp}"
    shutil.copy2(db_path, backup_path)
    return backup_path
```

### Testing Strategy

```python
# In-memory SQLite for fast tests
@pytest.fixture
def test_db():
    storage = StorageBackend(":memory:")
    storage.initialize()
    yield storage
    storage.close()
```

### Performance Optimization

- Use indexes on frequently queried columns
- Batch inserts with transactions
- Use prepared statements (SQLAlchemy handles this)
- Enable WAL mode for better concurrency
- Vacuum database periodically

```python
# Enable WAL mode (Write-Ahead Logging)
connection.execute("PRAGMA journal_mode=WAL")

# Enable foreign keys
connection.execute("PRAGMA foreign_keys=ON")
```

## Monitoring and Maintenance

### Database Health Checks

- File size monitoring (detect bloat)
- Query performance logging
- Integrity checks (`PRAGMA integrity_check`)
- Vacuum schedule (weekly)

### Backup Schedule

- Automatic backup before migrations
- Daily backup for production
- Retention: 7 daily, 4 weekly, 12 monthly
- Backup verification (restore test)

## References

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Migrations](https://alembic.sqlalchemy.org/)
- [When to Use SQLite](https://www.sqlite.org/whentouse.html)

## Related ADRs

- [ADR-001: Hybrid Technology Stack](./001-hybrid-technology-stack.md) - SQLite used in Python layer
- [ADR-005: Unified Formatter Pattern](./005-unified-formatter-pattern.md) - Formatting stored content

---

**Date**: 2025-10-09
**Authors**: Development Team
**Reviewers**: Database Administrator, System Architect
