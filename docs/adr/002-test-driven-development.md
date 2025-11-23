# ADR-002: Test-Driven Development as Standard

## Status
Accepted

## Context

The project requires high code quality, maintainability, and confidence in changes. The codebase includes:
- Complex business logic (curriculum management, progress tracking)
- User-facing CLI with many edge cases
- Multiple integration points (database, external services)
- Terminal UI that must work across different environments

We need a development approach that:
- Catches bugs early in development
- Documents expected behavior
- Enables safe refactoring
- Maintains high code coverage
- Supports continuous delivery

## Decision

We will adopt **Test-Driven Development (TDD)** as the standard development methodology for all new features and significant changes.

### TDD Process

1. **Red**: Write a failing test that defines desired behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code while keeping tests green

### Testing Standards

- **Unit Tests**: All public methods and functions must have unit tests
- **Integration Tests**: Cross-layer operations must have integration tests
- **Coverage Target**: Minimum 80% code coverage
- **Test Organization**: Tests mirror source structure (`tests/` matches `src/`)
- **Test Frameworks**: pytest (Python), Jest (Node.js)

### When TDD Applies

- New features and commands
- Bug fixes (write test reproducing bug first)
- Refactoring large modules
- API changes
- Business logic modifications

### When TDD May Be Relaxed

- Exploratory prototypes (must add tests before merging)
- UI layout/styling tweaks
- Documentation changes
- Configuration updates

## Consequences

### Positive Consequences

1. **Higher Code Quality**
   - Bugs caught during development, not production
   - Edge cases identified early
   - Code designed for testability
   - Clear specification of expected behavior

2. **Better Design**
   - Forces thinking about interfaces first
   - Encourages loose coupling
   - Promotes single responsibility
   - Simpler, more modular code

3. **Confident Refactoring**
   - Tests provide safety net for changes
   - Can refactor large files without fear
   - Regression detection automatic
   - Technical debt easier to address

4. **Living Documentation**
   - Tests document how to use code
   - Examples of expected behavior
   - Always up-to-date (or tests fail)
   - Easier for new developers to understand

5. **Faster Debugging**
   - Failing test pinpoints exact issue
   - Smaller feedback loop
   - Less time in debugger
   - Reproducible issues

6. **Better Collaboration**
   - Tests communicate intent
   - Pull requests easier to review
   - Confidence in merging changes
   - Shared understanding of behavior

### Negative Consequences

1. **Initial Development Slower**
   - Writing tests takes time upfront
   - Learning curve for TDD approach
   - May feel like more work initially
   - Pressure to "just ship" conflicts with TDD

2. **Test Maintenance Overhead**
   - Tests must be updated when requirements change
   - Brittle tests can slow development
   - Test fixtures require maintenance
   - Mock objects need updating

3. **Not All Code Easy to Test**
   - Terminal UI interaction tricky to test
   - External integrations require mocking
   - Async code more complex to test
   - Some tests may be flaky

4. **Coverage ≠ Quality**
   - 80% coverage doesn't guarantee bug-free code
   - Can game metrics with meaningless tests
   - May test implementation details instead of behavior
   - False sense of security

## Testing Strategy

### Unit Testing

```python
def test_create_curriculum_returns_curriculum_with_id():
    """Test that create_curriculum assigns an ID to new curriculum."""
    # Arrange
    repo = CurriculumRepository(storage)
    curriculum = Curriculum(title="Test Course")

    # Act
    result = repo.create(curriculum)

    # Assert
    assert result.id is not None
    assert result.title == "Test Course"
```

### Integration Testing

```python
def test_track_progress_updates_database():
    """Test that track_progress command updates progress in database."""
    # Arrange
    db = setup_test_database()
    command = ProgressTrackCommand(db)

    # Act
    result = command.execute({"lesson_id": "123", "score": 0.85})

    # Assert
    assert result.success is True
    stored_progress = db.query(Progress).filter_by(lesson_id="123").first()
    assert stored_progress.score == 0.85
```

### Test Organization

```
tests/
├── unit/                  # Unit tests (isolated components)
│   ├── test_models.py
│   ├── test_repositories.py
│   └── test_commands.py
├── integration/           # Integration tests (cross-layer)
│   ├── test_curriculum_workflow.py
│   └── test_progress_tracking.py
├── e2e/                   # End-to-end tests (full workflows)
│   └── test_learning_session.py
├── fixtures/              # Shared test data
│   ├── sample_curriculum.json
│   └── test_database.py
└── conftest.py           # pytest configuration
```

### Mocking Strategy

- **Mock External Services**: API calls, file system, network
- **Use Test Doubles**: Repositories, databases in unit tests
- **Real Dependencies**: Integration tests use real database (test instance)
- **Avoid Over-Mocking**: Don't mock what you own, test it

### Continuous Integration

- All tests must pass before merging
- Coverage reports generated on every commit
- Failed tests block deployment
- Flaky tests are bugs (must be fixed or removed)

## Alternatives Considered

### Alternative 1: Code-First Development (Write Tests After)

**Description**: Write implementation first, add tests later.

**Pros**:
- Faster initial development
- More flexibility during exploration
- Natural coding flow for some developers

**Cons**:
- Tests often never written
- Code designed without testability in mind
- Higher coupling, harder to test
- Less confidence in correctness

**Why Not Chosen**: Experience shows tests are rarely added comprehensively after the fact. TDD forces better design and ensures tests exist.

### Alternative 2: No Mandatory Testing

**Description**: Testing optional, left to developer discretion.

**Pros**:
- Maximum developer freedom
- Fastest development speed
- No test maintenance overhead

**Cons**:
- Regressions frequent
- Refactoring dangerous
- Code quality varies wildly
- Difficult to maintain long-term

**Why Not Chosen**: Without mandatory testing, code quality degrades over time. The project requires long-term maintainability.

### Alternative 3: 100% Code Coverage Required

**Description**: Require 100% test coverage for all code.

**Pros**:
- Every line tested
- Maximum confidence
- No untested code paths

**Cons**:
- Diminishing returns on effort
- Forces testing trivial code
- Can encourage gaming metrics
- May slow development significantly

**Why Not Chosen**: 80% coverage provides excellent safety net without excessive overhead. Last 20% often trivial or not worth effort.

### Alternative 4: BDD (Behavior-Driven Development)

**Description**: Use Given-When-Then style specifications with tools like Cucumber.

**Pros**:
- Non-technical stakeholders can read tests
- Clear behavior specifications
- Focus on user outcomes

**Cons**:
- Additional tooling overhead
- Gherkin syntax learning curve
- May be overkill for developer-focused tool
- Python BDD tools less mature

**Why Not Chosen**: BDD provides marginal benefit for a developer-focused CLI tool. TDD with clear test names achieves similar clarity.

## Implementation Guidelines

### Test Naming Convention

```python
def test_{method}_{scenario}_{expected}():
    """Human-readable description of what's being tested."""
    pass
```

Examples:
```python
def test_create_curriculum_raises_error_when_duplicate_id():
def test_format_lesson_truncates_long_content_to_80_chars():
def test_track_progress_updates_completion_percentage():
```

### AAA Pattern (Arrange-Act-Assert)

```python
def test_example():
    """Test description."""
    # Arrange: Set up test data and dependencies
    user = User(id="123", name="Test User")
    repo = MockRepository()

    # Act: Execute the code under test
    result = repo.save(user)

    # Assert: Verify expected outcomes
    assert result.success is True
    assert repo.get("123") == user
```

### Test Data Management

- Use fixtures for common test data
- Keep test data minimal (only what's needed)
- Use factories for complex objects
- Clear test data between tests

## Metrics and Monitoring

### Coverage Tracking

- Generate coverage reports in CI
- Trend coverage over time
- Flag PRs that decrease coverage
- Review uncovered critical paths

### Test Performance

- Unit tests: < 10ms each
- Integration tests: < 100ms each
- Full test suite: < 5 minutes
- Identify and optimize slow tests

## References

- [pytest Documentation](https://docs.pytest.org/)
- [Test-Driven Development by Example (Kent Beck)](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Testing Documentation](../TESTING_DOCUMENTATION.md)
- [pytest Configuration](../../pytest.ini)

## Related ADRs

- [ADR-003: SPARC Methodology](./003-sparc-methodology.md) - TDD integrated into SPARC refinement phase
- [ADR-005: Unified Formatter Pattern](./005-unified-formatter-pattern.md) - Testing formatter plugins

---

**Date**: 2025-10-09
**Authors**: Development Team
**Reviewers**: QA Lead, System Architect
