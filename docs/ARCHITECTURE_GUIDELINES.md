# Architecture Guidelines

## Overview

This document defines the architectural patterns, design principles, and organizational standards for the Algorithms and Data Structures Learning Platform. All development must align with these guidelines to maintain consistency, quality, and maintainability.

## Core Architectural Patterns

### 1. Command Pattern (CLI Commands)

**Location**: `src/commands/`

**Purpose**: Encapsulates CLI operations as command objects for better organization, testability, and extensibility.

**Structure**:
```python
class BaseCommand(ABC):
    """Abstract base for all commands"""

    @abstractmethod
    def execute(self, args: Dict[str, Any]) -> CommandResult:
        """Execute the command"""
        pass

    @abstractmethod
    def validate(self, args: Dict[str, Any]) -> bool:
        """Validate command arguments"""
        pass
```

**Implementation Requirements**:
- All CLI commands MUST inherit from `BaseCommand`
- Commands MUST implement `execute()` and `validate()` methods
- Commands SHOULD be stateless - dependencies injected via constructor
- Commands MUST return `CommandResult` objects with status, message, and data
- Commands SHOULD be organized by domain (content, curriculum, progress, admin, search)

**Naming Convention**: `{Domain}{Action}Command` (e.g., `ContentListCommand`, `ProgressTrackCommand`)

### 2. Repository Pattern (Data Access)

**Location**: `src/persistence/repositories/`

**Purpose**: Abstracts data access logic from business logic, providing a clean interface for CRUD operations.

**Structure**:
```python
class BaseRepository(ABC, Generic[T]):
    """Abstract base for all repositories"""

    @abstractmethod
    async def create(self, entity: T) -> T:
        """Create new entity"""
        pass

    @abstractmethod
    async def get(self, entity_id: str) -> Optional[T]:
        """Retrieve entity by ID"""
        pass

    @abstractmethod
    async def update(self, entity: T) -> T:
        """Update existing entity"""
        pass

    @abstractmethod
    async def delete(self, entity_id: str) -> bool:
        """Delete entity"""
        pass
```

**Implementation Requirements**:
- All repositories MUST inherit from `BaseRepository[T]`
- Repositories MUST be async-capable
- Repositories SHOULD implement caching where appropriate
- Repositories MUST handle database transactions properly
- Repositories SHOULD raise domain-specific exceptions (not database exceptions)

**Naming Convention**: `{Entity}Repository` (e.g., `CurriculumRepository`, `ContentRepository`)

### 3. Model-Domain Pattern (Data Models)

**Location**: `src/models/`

**Purpose**: Defines core domain entities with validation, business rules, and relationships.

**Structure**:
```python
@dataclass
class BaseModel:
    """Base class for all domain models"""
    id: str
    created_at: datetime
    updated_at: datetime

    def validate(self) -> bool:
        """Validate model state"""
        pass

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        pass
```

**Implementation Requirements**:
- All models MUST inherit from `BaseModel`
- Models SHOULD use dataclasses for immutability where possible
- Models MUST implement validation logic
- Models SHOULD use Enums for fixed value sets
- Models MUST document all fields with type hints
- Models SHOULD separate data structure from business logic

**Naming Convention**: Clear entity names (e.g., `Curriculum`, `Lesson`, `UserProgress`)

### 4. Service Layer Pattern (Business Logic)

**Location**: `src/core/`, `src/integrations/`

**Purpose**: Coordinates business operations across multiple repositories and models.

**Implementation Requirements**:
- Services SHOULD orchestrate multiple repositories
- Services MUST NOT contain presentation logic
- Services SHOULD implement transaction boundaries
- Services MUST validate business rules
- Services SHOULD be stateless with injected dependencies

**Naming Convention**: `{Domain}Service` or `{Domain}Manager` (e.g., `CurriculumManager`, `ProgressTracker`)

### 5. Plugin Architecture Pattern

**Location**: `src/ui/formatter_plugins/`, `plugins/`

**Purpose**: Enables extensibility through dynamically loaded modules.

**Structure**:
```python
class BasePlugin(ABC):
    """Base class for all plugins"""

    @property
    @abstractmethod
    def name(self) -> str:
        """Plugin name"""
        pass

    @abstractmethod
    def initialize(self, config: Dict[str, Any]) -> None:
        """Initialize plugin"""
        pass
```

**Implementation Requirements**:
- Plugins MUST inherit from appropriate base class
- Plugins MUST be self-contained with minimal dependencies
- Plugins SHOULD provide configuration schemas
- Plugins MUST handle errors gracefully
- Plugins SHOULD register capabilities at initialization

See: [ADR-006: Plugin Architecture](#) for detailed decisions.

### 6. Factory Pattern (Object Creation)

**Location**: Used in `src/ui/unified_formatter.py`, `src/command_router.py`

**Purpose**: Centralized object creation for complex initialization logic.

**Implementation Requirements**:
- Factories SHOULD handle object creation complexity
- Factories MUST validate configuration before creation
- Factories SHOULD cache instances where appropriate
- Factories MUST provide clear error messages

### 7. Component-Based UI Pattern

**Location**: `src/ui/components/`

**Purpose**: Reusable, composable UI elements for terminal interfaces.

**Implementation Requirements**:
- Components SHOULD be pure functions where possible
- Components MUST handle edge cases (narrow terminals, missing data)
- Components SHOULD be testable in isolation
- Components MUST follow terminal compatibility guidelines

## Design Principles

### SOLID Principles

#### Single Responsibility Principle (SRP)
- Each class/module has ONE reason to change
- Commands handle command execution ONLY
- Repositories handle data access ONLY
- Models represent domain entities ONLY
- **Violation Example**: A command that also formats output AND saves to database
- **Correct Example**: Command calls service, service uses repository, formatter handles display

#### Open/Closed Principle (OCP)
- Open for extension (via inheritance, plugins)
- Closed for modification (stable interfaces)
- Use plugin system for extensibility
- Use abstract base classes for variation points

#### Liskov Substitution Principle (LSP)
- Subclasses must be substitutable for base classes
- All Commands must work with CommandRouter
- All Repositories must work with generic data access code
- Preserve behavioral contracts

#### Interface Segregation Principle (ISP)
- Many specific interfaces better than one general interface
- Don't force clients to depend on methods they don't use
- Example: `AsyncCommand` vs `SyncCommand` base classes

#### Dependency Inversion Principle (DIP)
- Depend on abstractions, not concretions
- Use abstract base classes and protocols
- Inject dependencies rather than creating them
- Example: Commands receive repository instances, not database connections

### Additional Design Principles

#### DRY (Don't Repeat Yourself)
- Extract common logic into utilities
- Use base classes for shared behavior
- Create reusable components
- **But**: Avoid premature abstraction - 3 instances before abstracting

#### KISS (Keep It Simple, Stupid)
- Prefer simple solutions over clever ones
- Avoid unnecessary complexity
- Clear code over compact code
- Optimize for readability first, performance second

#### YAGNI (You Aren't Gonna Need It)
- Don't implement features before they're needed
- Build for current requirements
- Design for extensibility without implementing unused features

#### Principle of Least Surprise
- Code should behave as users expect
- Follow established conventions
- Use clear, descriptive names
- Consistent patterns across codebase

## Module Organization Standards

### Directory Structure

```
src/
├── commands/          # CLI commands (Command pattern)
│   ├── base.py       # Command base classes
│   ├── content_commands.py
│   ├── curriculum_commands.py
│   ├── progress_commands.py
│   ├── admin_commands.py
│   └── search_commands.py
├── core/             # Core business logic
│   ├── curriculum.py
│   ├── progress.py
│   ├── exceptions.py
│   └── plugin_manager.py
├── models/           # Domain models
│   ├── base.py
│   ├── curriculum.py
│   ├── content.py
│   ├── progress.py
│   ├── relationships.py
│   └── user.py
├── persistence/      # Data access layer
│   ├── repositories/
│   │   ├── base.py
│   │   ├── curriculum_repo.py
│   │   ├── content_repo.py
│   │   └── progress_repo.py
│   ├── storage_backend.py
│   ├── cache.py
│   └── migrations/
├── ui/               # User interface layer
│   ├── components/   # Reusable UI elements
│   ├── formatter_plugins/
│   └── unified_formatter.py
├── integrations/     # External service integrations
│   ├── flow_nexus.py
│   └── collaboration.py
└── utils/           # Utility functions
    ├── config_manager.py
    ├── validators.py
    └── helpers.py
```

### Organization Rules

1. **Separation of Concerns**
   - UI code separate from business logic
   - Business logic separate from data access
   - External integrations isolated
   - Configuration separate from code

2. **Module Independence**
   - Minimize cross-module dependencies
   - Use dependency injection
   - Define clear interfaces between layers
   - Avoid circular dependencies

3. **Cohesion**
   - Related functionality grouped together
   - Files organized by domain/feature
   - Clear boundaries between modules

## File Size Guidelines

### Maximum File Size: 500 Lines

**Rationale**: Files exceeding 500 lines become difficult to understand, test, and maintain.

**Enforcement**:
- Automated checks in CI/CD pipeline
- Pre-commit hooks to warn developers
- Regular refactoring of large files

**Current Violations**:
```
src/ui/enhanced_interactive.py     - 1665 lines (MUST REFACTOR)
src/commands/progress_commands.py  - 1584 lines (MUST REFACTOR)
src/commands/admin_commands.py     - 1478 lines (MUST REFACTOR)
src/commands/search_commands.py    - 1397 lines (MUST REFACTOR)
src/commands/content_commands.py   - 1328 lines (MUST REFACTOR)
src/commands/curriculum_commands.py- 1223 lines (MUST REFACTOR)
src/ui/interactive.py              - 1133 lines (MUST REFACTOR)
src/ui/unified_formatter.py        - 1069 lines (MUST REFACTOR)
src/notes_manager.py               - 1068 lines (MUST REFACTOR)
```

**Refactoring Strategy**: See [docs/LARGE_FILE_REFACTORING_STRATEGY.md](./LARGE_FILE_REFACTORING_STRATEGY.md)

### Refactoring Approaches

1. **Extract Classes**: Multiple commands in one file → separate files
2. **Extract Functions**: Large methods → smaller utility functions
3. **Extract Modules**: Related functions → new utility module
4. **Decompose Domain**: Large command → multiple specialized commands

## Naming Conventions

### Python Naming Standards

- **Modules/Packages**: `lowercase_with_underscores`
- **Classes**: `PascalCase`
- **Functions/Methods**: `lowercase_with_underscores`
- **Constants**: `UPPERCASE_WITH_UNDERSCORES`
- **Private Members**: `_leading_underscore`
- **Magic Methods**: `__double_leading_and_trailing__`

### Domain-Specific Conventions

- **Commands**: `{Domain}{Action}Command` (e.g., `ProgressTrackCommand`)
- **Repositories**: `{Entity}Repository` (e.g., `CurriculumRepository`)
- **Services**: `{Domain}Manager` or `{Domain}Service`
- **Models**: Clear entity names (e.g., `Lesson`, `UserProgress`)
- **Exceptions**: `{Error}Error` (e.g., `ValidationError`, `RepositoryError`)
- **Plugins**: `{Capability}Plugin` (e.g., `LessonFormatterPlugin`)

### Variable Naming

- **Clarity over brevity**: `user_progress` not `up`
- **Descriptive names**: `filtered_active_courses` not `courses2`
- **Avoid abbreviations**: `curriculum_manager` not `curr_mgr`
- **Boolean variables**: `is_active`, `has_completed`, `can_edit`
- **Collections**: Plural nouns `lessons`, `users`, `repositories`

## Dependency Management Rules

### Dependency Principles

1. **Minimize External Dependencies**
   - Evaluate necessity before adding libraries
   - Prefer standard library when possible
   - Consider maintenance burden and security

2. **Pin Versions**
   - Use exact versions in `requirements.txt`
   - Document why major dependencies were chosen
   - Track dependency updates in changelog

3. **Layer Dependencies**
   ```
   UI Layer → Service Layer → Repository Layer → Models
   ↓
   External Integrations (isolated)
   ```

4. **Dependency Injection**
   - Pass dependencies via constructors
   - Don't create dependencies internally
   - Use factories for complex initialization

### Allowed Dependencies by Layer

**Models Layer**:
- Standard library only
- Dataclasses, datetime, enum, typing
- No external dependencies

**Repository Layer**:
- Database drivers (SQLite, SQLAlchemy)
- Caching libraries
- Models layer

**Service Layer**:
- Repository layer
- Models layer
- Business logic libraries

**Command Layer**:
- Service layer
- Formatters
- Input validation

**UI Layer**:
- Rich, Prompt Toolkit (terminal UI)
- Component libraries
- NO business logic dependencies

## Error Handling Patterns

### Exception Hierarchy

```python
CLIError                    # Base for all app exceptions
├── ValidationError         # Input/data validation failures
├── ConfigurationError      # Configuration issues
├── CommandError           # Command execution errors
│   └── CommandNotFoundError
├── RepositoryError        # Data access errors
│   ├── EntityNotFoundError
│   └── DuplicateEntityError
└── IntegrationError       # External service errors
```

### Error Handling Guidelines

1. **Catch Specific Exceptions**
   ```python
   # Good
   try:
       user = repo.get_user(user_id)
   except EntityNotFoundError as e:
       return CommandResult(success=False, message=f"User not found: {user_id}")

   # Bad
   try:
       user = repo.get_user(user_id)
   except Exception as e:  # Too broad
       return CommandResult(success=False, message="Error")
   ```

2. **Fail Fast**
   - Validate inputs early
   - Raise exceptions immediately on invalid state
   - Don't silently ignore errors

3. **Provide Context**
   - Include relevant data in error messages
   - Log errors with full context
   - Help users understand what went wrong

4. **Graceful Degradation**
   - UI continues to work if optional features fail
   - Display user-friendly error messages
   - Offer recovery options where possible

5. **Logging Strategy**
   ```python
   logger.debug("Detailed diagnostic info")
   logger.info("Normal operational events")
   logger.warning("Unexpected but handled events")
   logger.error("Error conditions with context")
   logger.critical("System-level failures")
   ```

## Code Organization Structure

### Class Organization

```python
class MyClass:
    """Docstring explaining class purpose"""

    # 1. Class variables
    CLASS_CONSTANT = "value"

    # 2. Constructor
    def __init__(self, dependency: Dependency):
        """Initialize with dependencies"""
        self.dependency = dependency
        self._private_state = None

    # 3. Public methods (in logical order)
    def public_method(self) -> Result:
        """Public API method"""
        pass

    # 4. Private methods (in logical order)
    def _private_helper(self) -> None:
        """Internal helper method"""
        pass

    # 5. Properties
    @property
    def computed_value(self) -> str:
        """Computed property"""
        return self._calculate()

    # 6. Static/Class methods
    @staticmethod
    def utility_function(arg: str) -> str:
        """Utility function"""
        pass

    # 7. Magic methods (if custom behavior needed)
    def __str__(self) -> str:
        """String representation"""
        pass
```

### Module Organization

```python
"""
Module docstring explaining purpose and usage.

Example:
    >>> from mymodule import MyClass
    >>> obj = MyClass()
"""

# 1. Standard library imports
import os
from datetime import datetime
from typing import Dict, List

# 2. Third-party imports
from rich.console import Console
import click

# 3. Local imports
from .models import User
from .repositories import UserRepository

# 4. Constants
DEFAULT_TIMEOUT = 30
MAX_RETRIES = 3

# 5. Module-level variables (if needed)
_cache: Dict[str, Any] = {}

# 6. Classes and functions
class MyClass:
    """Class definition"""
    pass

def my_function() -> None:
    """Function definition"""
    pass

# 7. Main execution block (if script)
if __name__ == "__main__":
    main()
```

## Testing Requirements

### Test Organization

- Tests mirror source structure: `tests/commands/test_content_commands.py`
- Unit tests for individual components
- Integration tests for cross-layer operations
- End-to-end tests for full workflows

### Testing Standards

- All public methods MUST have tests
- Critical paths MUST have integration tests
- Aim for 80%+ code coverage
- Tests MUST be deterministic (no flaky tests)
- Tests MUST be fast (mock external dependencies)

### Test Naming

```python
def test_{method_name}_{scenario}_{expected_result}():
    """
    Test that {method} {does something} when {scenario}.
    """
    # Arrange
    # Act
    # Assert
```

Example:
```python
def test_create_curriculum_raises_error_when_duplicate_id():
    """Test that create_curriculum raises error when ID already exists."""
    # Test implementation
```

## Performance Considerations

### Optimization Guidelines

1. **Profile Before Optimizing**
   - Use profiling tools to identify bottlenecks
   - Don't optimize prematurely
   - Focus on algorithmic improvements first

2. **Caching Strategy**
   - Cache expensive computations
   - Cache database queries for read-heavy data
   - Implement cache invalidation properly
   - Use TTL for time-sensitive data

3. **Async Operations**
   - Use async/await for I/O-bound operations
   - Database queries should be async
   - Don't block event loop

4. **Database Performance**
   - Use indexes on frequently queried fields
   - Limit result sets (pagination)
   - Use batch operations for multiple inserts
   - Avoid N+1 query problems

## Security Guidelines

### Input Validation

- Validate all user input
- Sanitize data before database operations
- Use parameterized queries (prevent SQL injection)
- Validate file paths (prevent directory traversal)

### Secrets Management

- NEVER commit secrets to repository
- Use environment variables for sensitive data
- Use `.env` files for local development (gitignored)
- Rotate secrets regularly

### Access Control

- Implement proper authentication
- Check authorization before sensitive operations
- Log security-relevant events
- Follow principle of least privilege

## Documentation Requirements

### Code Documentation

1. **Module Docstrings**: Explain module purpose and usage
2. **Class Docstrings**: Describe class responsibility and key methods
3. **Method Docstrings**: Document parameters, returns, raises
4. **Inline Comments**: Explain WHY, not WHAT
5. **Type Hints**: Required for all function signatures

### API Documentation

- Document all public interfaces
- Include usage examples
- Specify error conditions
- Keep examples up-to-date

### Architecture Documentation

- Document major design decisions (ADRs)
- Maintain architecture diagrams
- Update docs when architecture changes
- Explain trade-offs and constraints

## Version Control Guidelines

### Commit Standards

- Small, focused commits
- Clear, descriptive commit messages
- Reference issue numbers where applicable
- Commit working code (tests pass)

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(commands): Add curriculum export command

Implements CSV and JSON export formats for curriculum data.
Includes validation and error handling for large datasets.

Closes #123
```

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `fix/*`: Bug fixes
- `refactor/*`: Code improvements

## Review Checklist

Before submitting code for review:

- [ ] Follows architectural patterns
- [ ] File size under 500 lines
- [ ] Proper naming conventions
- [ ] SOLID principles applied
- [ ] Error handling implemented
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] No hardcoded secrets
- [ ] Performance acceptable
- [ ] Backwards compatible (or breaking changes documented)

## References

- [ADR Index](./adr/README.md)
- [Code Quality Standards](./CODE_QUALITY_STANDARDS.md)
- [Plugin System Documentation](./PLUGIN_SYSTEM.md)
- [Large File Refactoring Strategy](./LARGE_FILE_REFACTORING_STRATEGY.md)
- [Testing Documentation](./TESTING_DOCUMENTATION.md)

---

**Last Updated**: 2025-10-09
**Version**: 1.0.0
