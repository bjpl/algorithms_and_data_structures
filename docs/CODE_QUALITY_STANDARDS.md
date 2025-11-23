# Code Quality Standards

## Overview

This document defines code quality standards, review processes, and enforcement mechanisms for the Algorithms and Data Structures Learning Platform. All code contributions must meet these standards before merging.

## Code Review Checklist

Use this checklist for all pull requests:

### Architecture & Design

- [ ] **Follows architectural patterns** (Command, Repository, Service, Plugin)
- [ ] **SOLID principles applied** appropriately
- [ ] **Separation of concerns** maintained
- [ ] **Dependencies properly injected**, not hardcoded
- [ ] **Interfaces/abstractions used** for key boundaries
- [ ] **Design patterns documented** if used
- [ ] **No circular dependencies**
- [ ] **Module boundaries respected**

### Code Organization

- [ ] **File size under 500 lines** (or documented exception)
- [ ] **Single Responsibility Principle** - one purpose per class/function
- [ ] **Appropriate directory structure** used
- [ ] **Naming conventions followed** (see guidelines)
- [ ] **Related code grouped together**
- [ ] **Clear module organization**
- [ ] **No duplicate code** (DRY principle)
- [ ] **Imports organized** (stdlib → third-party → local)

### Code Readability

- [ ] **Clear, descriptive names** for variables, functions, classes
- [ ] **Functions under 50 lines** (guideline, not hard limit)
- [ ] **Minimal nesting depth** (prefer early returns)
- [ ] **Comments explain WHY**, not what
- [ ] **No commented-out code** (use version control)
- [ ] **Magic numbers eliminated** (use named constants)
- [ ] **Complex logic documented** with rationale
- [ ] **Type hints provided** for all function signatures

### Testing

- [ ] **Tests written** (unit and integration where appropriate)
- [ ] **TDD followed** for new features (test-first)
- [ ] **Test coverage >80%** for new code
- [ ] **Tests pass** locally and in CI
- [ ] **Edge cases covered** in tests
- [ ] **Test names descriptive** (test_method_scenario_expected)
- [ ] **No flaky tests** (deterministic results)
- [ ] **Mocks used appropriately** (external dependencies)

### Documentation

- [ ] **Module docstrings** present and accurate
- [ ] **Class docstrings** describe purpose and usage
- [ ] **Method docstrings** document params, returns, raises
- [ ] **README updated** if user-facing changes
- [ ] **API docs updated** for public interfaces
- [ ] **Architecture docs updated** if structure changes
- [ ] **CHANGELOG updated** with notable changes
- [ ] **ADR created** for significant decisions

### Error Handling

- [ ] **Exceptions caught** at appropriate level
- [ ] **Custom exceptions used** for domain errors
- [ ] **Error messages informative** and actionable
- [ ] **No silent failures** (always log or raise)
- [ ] **Cleanup code in finally blocks** where needed
- [ ] **Resources properly closed** (context managers)
- [ ] **Graceful degradation** for non-critical failures

### Security

- [ ] **No secrets committed** (API keys, passwords)
- [ ] **Input validation** for all user inputs
- [ ] **SQL injection prevented** (parameterized queries)
- [ ] **Path traversal prevented** (validate file paths)
- [ ] **Sensitive data logged carefully** (no PII in logs)
- [ ] **Dependencies reviewed** for known vulnerabilities
- [ ] **Principle of least privilege** applied

### Performance

- [ ] **No obvious performance issues** (N+1 queries, etc.)
- [ ] **Appropriate data structures** used
- [ ] **Caching used** where beneficial
- [ ] **Database queries optimized** (indexes, pagination)
- [ ] **Large datasets handled** efficiently (streaming)
- [ ] **No premature optimization** (profile first)
- [ ] **Memory leaks prevented** (proper cleanup)

### Backwards Compatibility

- [ ] **API changes backward compatible** or versioned
- [ ] **Database migrations reversible**
- [ ] **Configuration changes documented**
- [ ] **Deprecation warnings** for removed features
- [ ] **Migration guide** provided if breaking changes

### Git & Version Control

- [ ] **Commit messages clear** and descriptive
- [ ] **Commits atomic** (one logical change each)
- [ ] **Branch named appropriately** (feature/*, fix/*)
- [ ] **No merge conflicts**
- [ ] **Rebased on latest main** (if applicable)
- [ ] **Signed commits** (if required)

## Quality Metrics and Thresholds

### Code Coverage

| Metric | Threshold | Enforcement |
|--------|-----------|-------------|
| Overall Coverage | ≥80% | CI blocks if below |
| New Code Coverage | ≥90% | PR review guideline |
| Critical Paths | 100% | Manual review required |

### Complexity Metrics

| Metric | Threshold | Action |
|--------|-----------|--------|
| Cyclomatic Complexity | ≤10 | Warning at 10, fail at 15 |
| Function Length | ≤50 lines | Warning (guideline) |
| File Length | ≤500 lines | Hard limit (exceptions documented) |
| Nesting Depth | ≤4 levels | Refactor if exceeded |

### Code Quality Scores

| Tool | Score | Enforcement |
|------|-------|-------------|
| pylint | ≥8.0/10 | CI warning below threshold |
| mypy | 0 errors | CI blocks on errors |
| ESLint (JS) | 0 errors | CI blocks on errors |
| pytest | 0 failures | CI blocks on failures |

### Performance Metrics

| Metric | Threshold | Measurement |
|--------|-----------|-------------|
| Unit Test Speed | <10ms each | Automated |
| Integration Test | <100ms each | Automated |
| Full Test Suite | <5 minutes | CI monitoring |
| CLI Response Time | <200ms | Manual testing |

## Anti-Patterns to Avoid

### Architecture Anti-Patterns

❌ **God Class**: One class doing too much
```python
# Bad: Massive class with many responsibilities
class CurriculumManager:
    def create_curriculum(self): pass
    def format_curriculum(self): pass
    def send_email_notification(self): pass
    def generate_pdf_report(self): pass
    def update_analytics(self): pass
```

✅ **Solution**: Separate concerns
```python
class CurriculumService:
    def create_curriculum(self): pass

class CurriculumFormatter:
    def format(self): pass

class NotificationService:
    def send(self): pass
```

---

❌ **Circular Dependencies**
```python
# Bad: Module A imports B, B imports A
# module_a.py
from module_b import ClassB

# module_b.py
from module_a import ClassA  # Circular!
```

✅ **Solution**: Extract interface or common module
```python
# interfaces.py
class InterfaceA(ABC): pass

# module_a.py
from interfaces import InterfaceA

# module_b.py
from interfaces import InterfaceA
```

---

❌ **Hardcoded Dependencies**
```python
# Bad: Creating dependencies internally
class CommandHandler:
    def __init__(self):
        self.repo = CurriculumRepository()  # Hardcoded!
        self.db = Database("curriculum.db")  # Hardcoded!
```

✅ **Solution**: Dependency injection
```python
class CommandHandler:
    def __init__(self, repo: CurriculumRepository, db: Database):
        self.repo = repo
        self.db = db
```

### Code Anti-Patterns

❌ **Magic Numbers**
```python
# Bad: What do these numbers mean?
if score > 0.75 and attempts < 3:
    pass
```

✅ **Solution**: Named constants
```python
PASSING_SCORE_THRESHOLD = 0.75
MAX_RETRY_ATTEMPTS = 3

if score > PASSING_SCORE_THRESHOLD and attempts < MAX_RETRY_ATTEMPTS:
    pass
```

---

❌ **Deep Nesting**
```python
# Bad: Hard to follow logic
def process(data):
    if data:
        if data.valid:
            if data.user:
                if data.user.active:
                    # Finally do something
                    return result
```

✅ **Solution**: Early returns (guard clauses)
```python
def process(data):
    if not data:
        return None
    if not data.valid:
        return None
    if not data.user:
        return None
    if not data.user.active:
        return None

    # Main logic at top level
    return result
```

---

❌ **Mutable Default Arguments**
```python
# Bad: Dangerous mutable default
def add_item(item, items=[]):  # BUG!
    items.append(item)
    return items
```

✅ **Solution**: Use None and create inside
```python
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

---

❌ **Catch-All Exception Handling**
```python
# Bad: Hides all errors
try:
    result = dangerous_operation()
except Exception:  # Too broad!
    pass  # Silent failure!
```

✅ **Solution**: Catch specific exceptions
```python
try:
    result = dangerous_operation()
except ValueError as e:
    logger.error(f"Invalid input: {e}")
    raise
except ConnectionError as e:
    logger.error(f"Connection failed: {e}")
    return fallback_value
```

---

❌ **Boolean Flags**
```python
# Bad: What does True mean?
process_data(data, True, False, True)
```

✅ **Solution**: Named parameters or enums
```python
process_data(
    data,
    include_metadata=True,
    validate=False,
    cache=True
)
```

### Testing Anti-Patterns

❌ **Testing Implementation Details**
```python
# Bad: Test internal implementation
def test_curriculum_uses_correct_dict():
    curriculum = Curriculum()
    assert isinstance(curriculum._internal_data, dict)  # Don't test privates!
```

✅ **Solution**: Test behavior, not implementation
```python
def test_curriculum_stores_and_retrieves_lessons():
    curriculum = Curriculum()
    lesson = Lesson(id="1", title="Test")
    curriculum.add_lesson(lesson)

    assert curriculum.get_lesson("1") == lesson
```

---

❌ **Overly Complex Test Setup**
```python
# Bad: Test setup larger than test itself
def test_feature():
    # 50 lines of setup...
    # 2 lines of test
    assert something
```

✅ **Solution**: Use fixtures and factories
```python
@pytest.fixture
def curriculum_with_lessons():
    # Setup extracted to reusable fixture
    return create_test_curriculum()

def test_feature(curriculum_with_lessons):
    assert curriculum_with_lessons.lesson_count > 0
```

## Best Practices

### 1. Write Self-Documenting Code

```python
# Bad: Unclear code needing comments
def calc(a, b, c):  # Calculate something
    return (a * b) / c if c != 0 else 0

# Good: Clear code with descriptive names
def calculate_average_score(total_points, num_questions, weight):
    if weight == 0:
        return 0
    return (total_points * num_questions) / weight
```

### 2. Use Type Hints

```python
# Bad: No type information
def process_curriculum(data):
    return data.format()

# Good: Clear types
def process_curriculum(curriculum: Curriculum) -> FormattedOutput:
    return curriculum.format()
```

### 3. Keep Functions Small and Focused

```python
# Bad: Function doing multiple things
def process_user_request(request):
    # Validate
    # Parse
    # Query database
    # Format response
    # Log activity
    # Send email
    pass

# Good: Single responsibility
def validate_request(request: Request) -> bool: pass
def parse_request(request: Request) -> ParsedData: pass
def query_curriculum(data: ParsedData) -> Curriculum: pass
def format_response(curriculum: Curriculum) -> Response: pass
```

### 4. Fail Fast with Validation

```python
# Bad: Late validation
def create_user(name, email, age):
    user = User()
    user.save()  # Might fail here with invalid data

# Good: Early validation
def create_user(name: str, email: str, age: int) -> User:
    if not name:
        raise ValueError("Name is required")
    if not is_valid_email(email):
        raise ValueError("Invalid email format")
    if age < 13:
        raise ValueError("User must be 13 or older")

    user = User(name=name, email=email, age=age)
    user.save()
    return user
```

### 5. Use Context Managers for Resources

```python
# Bad: Manual cleanup
file = open("data.txt")
data = file.read()
file.close()  # Might not execute if exception

# Good: Automatic cleanup
with open("data.txt") as file:
    data = file.read()
# File automatically closed
```

### 6. Prefer Composition Over Inheritance

```python
# Bad: Deep inheritance hierarchy
class Animal: pass
class Mammal(Animal): pass
class Dog(Mammal): pass
class ServiceDog(Dog): pass

# Good: Composition with mixins/interfaces
class Animal:
    def __init__(self):
        self.movement = WalkingBehavior()
        self.sound = BarkingBehavior()
```

### 7. Use Dataclasses for Data Structures

```python
# Bad: Manual __init__ and __repr__
class Lesson:
    def __init__(self, id, title, content):
        self.id = id
        self.title = title
        self.content = content

    def __repr__(self):
        return f"Lesson({self.id}, {self.title})"

# Good: Dataclass
from dataclasses import dataclass

@dataclass
class Lesson:
    id: str
    title: str
    content: str
```

### 8. Log Appropriately

```python
# Bad: Print statements
print("User logged in")
print(f"Error: {error}")

# Good: Proper logging
import logging
logger = logging.getLogger(__name__)

logger.info("User logged in", extra={"user_id": user.id})
logger.error("Failed to load curriculum", exc_info=True)
```

## Enforcement Tools

### Python Tools

**Linting & Formatting**:
```bash
# Black - Auto-formatting
black src/ tests/

# isort - Import sorting
isort src/ tests/

# pylint - Code quality
pylint src/ tests/

# flake8 - Style guide enforcement
flake8 src/ tests/
```

**Type Checking**:
```bash
# mypy - Static type checking
mypy src/
```

**Testing**:
```bash
# pytest - Test runner
pytest tests/ --cov=src --cov-report=html

# pytest-xdist - Parallel testing
pytest -n auto
```

**Security**:
```bash
# bandit - Security linter
bandit -r src/

# safety - Dependency vulnerability scanning
safety check
```

### JavaScript/Node.js Tools

**Linting & Formatting**:
```bash
# ESLint - Linting
eslint *.js --fix

# Prettier - Formatting
prettier --write "**/*.js"
```

**Testing**:
```bash
# Jest - Test runner
jest --coverage
```

### Pre-commit Hooks

Install pre-commit hooks to enforce standards automatically:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black

  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.3.0
    hooks:
      - id: mypy
```

Install hooks:
```bash
pip install pre-commit
pre-commit install
```

### CI/CD Enforcement

Quality gates in CI pipeline:

```yaml
# .github/workflows/quality.yml
name: Code Quality

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run linting
        run: |
          pylint src/ tests/
          flake8 src/ tests/

      - name: Run type checking
        run: mypy src/

      - name: Run tests with coverage
        run: |
          pytest --cov=src --cov-report=xml
          coverage report --fail-under=80

      - name: Security scan
        run: bandit -r src/
```

## Code Review Process

### 1. Self-Review (Author)

Before requesting review:
1. Run all quality tools locally
2. Review own changes using checklist
3. Add tests for new functionality
4. Update relevant documentation
5. Write clear PR description

### 2. Automated Review (CI)

Automated checks must pass:
- Linting (pylint, flake8, ESLint)
- Type checking (mypy)
- Tests (pytest, Jest)
- Coverage thresholds (≥80%)
- Security scans (bandit, safety)

### 3. Peer Review (Team)

Human reviewers check:
- Architecture and design
- Code readability
- Test quality
- Documentation accuracy
- Edge cases handled
- Security considerations

### 4. Approval Requirements

- At least 1 approval from team member
- All automated checks pass
- No unresolved comments
- Up-to-date with main branch

## Documentation Standards

### Code Documentation

```python
def calculate_progress_percentage(
    completed: int,
    total: int,
    weight: float = 1.0
) -> float:
    """
    Calculate weighted progress percentage.

    Args:
        completed: Number of completed items
        total: Total number of items
        weight: Weight factor for calculation (default: 1.0)

    Returns:
        Progress percentage as float (0.0 to 100.0)

    Raises:
        ValueError: If total is 0 or negative
        ValueError: If completed > total

    Example:
        >>> calculate_progress_percentage(7, 10)
        70.0
        >>> calculate_progress_percentage(5, 10, weight=2.0)
        100.0
    """
    if total <= 0:
        raise ValueError("Total must be positive")
    if completed > total:
        raise ValueError("Completed cannot exceed total")

    return (completed / total) * 100.0 * weight
```

### README Structure

```markdown
# Component Name

## Overview
Brief description of component purpose

## Installation
How to install/setup

## Usage
Basic usage examples

## API Reference
Link to detailed API docs

## Configuration
Configuration options

## Examples
Common use cases with code examples

## Testing
How to run tests

## Contributing
Contribution guidelines

## License
License information
```

## References

- [Architecture Guidelines](./ARCHITECTURE_GUIDELINES.md)
- [Testing Documentation](./TESTING_DOCUMENTATION.md)
- [ADR Index](./adr/README.md)
- [Python PEP 8](https://pep8.org/)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)

---

**Last Updated**: 2025-10-09
**Version**: 1.0.0
