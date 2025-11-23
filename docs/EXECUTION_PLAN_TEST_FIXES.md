# Test Fix Execution Plan - SPARC Phase 2

**Document Version**: 1.0
**Created**: 2025-10-07
**Status**: SPARC Phase 2 - Execution Planning
**Total Time Estimate**: 2.5 hours (realistic)
**Dependencies**: Test Fix Specification, Test Infrastructure Analysis, Jest Failure Analysis

---

## Executive Summary

This execution plan provides a systematic approach to fixing all test failures across Python and JavaScript test suites. The plan is structured to maximize parallel execution, minimize dependencies, and ensure rapid validation cycles.

**Key Metrics**:
- **Python**: 11 collection errors blocking ~100 tests
- **JavaScript**: 1 critical configuration error blocking 100% of tests (10 suites)
- **Total Time**: 2.5 hours (155 minutes)
- **Phases**: 4 sequential phases with parallel sub-tasks
- **Rollback Points**: 5 major checkpoints

---

## Dependency Graph & Critical Path Analysis

### Critical Path Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                     CRITICAL PATH ANALYSIS                      │
│            (Items on critical path marked with ⚡)              │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├─────────────┬─────────────┬─────────────┬─────────────┐
  ▼             ▼             ▼             ▼             ▼
┌────┐       ┌────┐       ┌────┐       ┌────┐       ┌────┐
│P1.1│ ⚡     │P1.2│       │P1.3│ ⚡     │P1.4│       │P1.5│
└────┘       └────┘       └────┘       └────┘       └────┘
  │             │             │             │             │
  │   Python    │  Progress   │   Jest      │  DBManager  │
  │   Imports   │  Repo       │   Config    │   Alias     │
  │   (P0)      │  Alias(P0)  │   (P0)      │   (P1)      │
  │   20min     │  10min      │  25min      │  10min      │
  │             │             │             │             │
  └────┬────────┴─────────┬───┴─────────────┴─────────────┘
       │                  │
       ▼                  ▼
  ┌────────┐        ┌──────────┐
  │ GATE 1 │        │  GATE 2  │
  │ Verify │        │  Verify  │
  │ Python │        │JavaScript│
  │ 10min  │        │  15min   │
  └────────┘        └──────────┘
       │                  │
       └────┬─────────────┘
            │
            ▼
       ┌────────┐
       │ P3     │
       │ Cleanup│
       │ 30min  │
       └────────┘
            │
            ▼
       ┌────────┐
       │ P4     │
       │ Final  │
       │ Test   │
       │ 45min  │
       └────────┘
            │
            ▼
          END

⚡ CRITICAL PATH: P1.1 → P1.3 → GATE1 → GATE2 → P3 → P4
Total Critical Path Time: 20 + 25 + 10 + 15 + 30 + 45 = 145 minutes
```

### Dependency Matrix

| Task ID | Task Name | Depends On | Blocks | Can Parallelize With | Priority |
|---------|-----------|------------|--------|---------------------|----------|
| **P1.1** | Fix Python model imports | None | P2.1, P4.1 | P1.2, P1.3, P1.4 | P0 ⚡ |
| **P1.2** | Fix ProgressRepository alias | None | P2.1, P4.1 | P1.1, P1.3, P1.4 | P0 |
| **P1.3** | Fix Jest configuration | None | P2.2, P4.2 | P1.1, P1.2, P1.4 | P0 ⚡ |
| **P1.4** | Add DBManager alias | None | P2.1 | P1.1, P1.2, P1.3 | P1 |
| **P1.5** | Fix accessibility.test.js | None | P2.2, P4.2 | P1.1, P1.2, P1.4 | P0 |
| **P2.1** | Verify Python imports | P1.1, P1.2 | P3, P4.1 | P2.2 | P0 ⚡ |
| **P2.2** | Verify Jest setup | P1.3, P1.5 | P3, P4.2 | P2.1 | P0 ⚡ |
| **P3** | Test file cleanup | P2.1, P2.2 | P4 | None | P2 |
| **P4.1** | Python full suite | P3 | None | P4.2 | P0 ⚡ |
| **P4.2** | Jest full suite | P3 | None | P4.1 | P0 ⚡ |

### Parallel Execution Opportunities

```
┌─────────────────────────────────────────────────────────────┐
│                 PARALLEL EXECUTION BLOCKS                   │
└─────────────────────────────────────────────────────────────┘

BLOCK 1 (Phase 1 - 25 minutes wall time):
  ┌─────────────┬─────────────┬─────────────┬─────────────┐
  │   P1.1      │   P1.2      │   P1.3      │   P1.4      │
  │  Python     │  Progress   │   Jest      │  DBManager  │
  │  Imports    │    Repo     │   Config    │   Alias     │
  │  20min      │   10min     │   25min     │   10min     │
  └─────────────┴─────────────┴─────────────┴─────────────┘
  Result: 25 minutes (longest task) instead of 65 minutes sequential

BLOCK 2 (Phase 2 - 15 minutes wall time):
  ┌──────────────────┬──────────────────┐
  │      P2.1        │      P2.2        │
  │  Verify Python   │  Verify Jest     │
  │     10min        │     15min        │
  └──────────────────┴──────────────────┘
  Result: 15 minutes instead of 25 minutes sequential

BLOCK 3 (Phase 4 - 45 minutes wall time):
  ┌──────────────────┬──────────────────┐
  │      P4.1        │      P4.2        │
  │  Python Suite    │  Jest Suite      │
  │     45min        │     30min        │
  └──────────────────┴──────────────────┘
  Result: 45 minutes instead of 75 minutes sequential

TOTAL SAVINGS: (65 + 25 + 75) - (25 + 15 + 45) = 80 minutes saved
```

---

## Git Branching Strategy

### Branch Structure

```
main (protected)
  │
  └──► fix/test-import-errors (base branch)
         │
         ├──► fix/python-imports (P1.1, P1.2, P1.4)
         │      └──► [MERGE → fix/test-import-errors]
         │
         ├──► fix/jest-configuration (P1.3, P1.5)
         │      └──► [MERGE → fix/test-import-errors]
         │
         └──► fix/test-cleanup (P3) [after P1 branches merged]
                └──► [MERGE → fix/test-import-errors]

FINAL: fix/test-import-errors → main (via PR)
```

### Branch Operations

**Phase 0: Setup**
```bash
# Create base branch from main
git checkout main
git pull origin main
git checkout -b fix/test-import-errors
git push -u origin fix/test-import-errors

# Document current state
python -m pytest --collect-only -q > docs/test_baseline_before.txt
npm test -- --listTests > docs/jest_baseline_before.txt 2>&1 || true
git add docs/test_baseline_*.txt
git commit -m "docs: Capture test baseline before fixes

- Python: 509 collected / 11 errors / 1 skipped
- Jest: 0% executable (SyntaxError in accessibility.test.js)
- Baseline for comparison after fixes"
```

**Phase 1: Parallel Fix Branches**
```bash
# Terminal 1: Python fixes
git checkout fix/test-import-errors
git checkout -b fix/python-imports

# Terminal 2: Jest fixes
git checkout fix/test-import-errors
git checkout -b fix/jest-configuration
```

### Commit Message Format

**Template**:
```
<type>(<scope>): <subject>

<body>

<footer>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**:
- `fix`: Bug fix
- `refactor`: Code restructuring
- `test`: Test infrastructure changes
- `chore`: Build/config changes
- `docs`: Documentation

**Examples**:
```bash
# Good commit message
git commit -m "$(cat <<'EOF'
fix(imports): Correct model import paths in service layers

- Changed models.* to src.models.* in:
  - src/app.py
  - src/services/curriculum_service.py
  - src/services/content_service.py
- Fixes 7 cascading import errors
- Unblocks 11 test files

Resolves #123

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Phase-by-Phase Execution Plan

## Phase 1: Critical Import Fixes (P0)
**Goal**: Enable all tests to load and initialize
**Wall Time**: 25 minutes (with parallelization)
**Sequential Time**: 65 minutes
**Parallel Efficiency**: 62% time savings

### Phase 1.1: Fix Python Model Import Paths ⚡ CRITICAL PATH
**Branch**: `fix/python-imports`
**Time**: 20 minutes
**Priority**: P0
**Depends On**: None
**Blocks**: All Python test collection

#### Steps:

**1.1.1 - Checkout and prepare (2 min)**
```bash
git checkout fix/test-import-errors
git checkout -b fix/python-imports
```

**1.1.2 - Fix src/app.py (5 min)**
```bash
# Open file
code src/app.py

# Find and replace (lines ~5-15):
# FROM:
from models.user_profile import UserProfile, UserSession, UserProgress
from models.content_models import Topic, Problem, Concept
from models.analytics_models import PerformanceMetrics, LearningAnalytics

# TO:
from src.models.user import UserProfile, UserSession, UserProgress
from src.models.content import Topic, Problem, Concept
from src.models.progress import PerformanceMetrics, LearningAnalytics
```

**Verification**:
```bash
python -c "from src.app import *" && echo "✅ src/app.py imports OK"
```

**1.1.3 - Fix src/services/curriculum_service.py (5 min)**
```bash
code src/services/curriculum_service.py

# Find and replace (lines ~8-15):
# FROM:
from models.content_models import Topic, Problem, Concept, LearningPath
from models.user_profile import UserProfile, UserProgress
from data.database_manager import DatabaseManager
from utils.logging_config import get_logger

# TO:
from src.models.content import Topic, Problem, Concept, LearningPath
from src.models.user import UserProfile
from src.models.progress import UserProgress
from src.persistence.db_manager import DatabaseManager
from src.utils.logging import get_logger
```

**Verification**:
```bash
python -c "from src.services.curriculum_service import CurriculumService" && echo "✅ curriculum_service.py imports OK"
```

**1.1.4 - Fix src/services/content_service.py (5 min)**
```bash
code src/services/content_service.py

# Apply same pattern as curriculum_service.py
# Update all model imports: models.* → src.models.*
```

**Verification**:
```bash
python -c "from src.services.content_service import ContentService" && echo "✅ content_service.py imports OK"
```

**1.1.5 - Commit (3 min)**
```bash
git add src/app.py src/services/curriculum_service.py src/services/content_service.py

git commit -m "$(cat <<'EOF'
fix(imports): Correct model import paths in service layers

Changes:
- src/app.py: models.* → src.models.*
- src/services/curriculum_service.py: models.* → src.models.*
- src/services/content_service.py: models.* → src.models.*

Impact:
- Fixes 7 cascading import errors
- Unblocks 11 Python test files
- Resolves test collection failures

Test verification:
✅ All service modules import successfully
✅ No circular dependency issues

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

git push -u origin fix/python-imports
```

---

### Phase 1.2: Fix ProgressRepository Export
**Branch**: `fix/python-imports` (same as 1.1)
**Time**: 10 minutes
**Priority**: P0
**Depends On**: None
**Blocks**: ~30-50 tests

#### Steps:

**1.2.1 - Add alias to progress_repo.py (5 min)**
```bash
code src/persistence/repositories/progress_repo.py

# Add at end of file (after UserProgressRepository class):
# Create alias for backward compatibility
ProgressRepository = UserProgressRepository

__all__ = [
    'UserProgressRepository',
    'ProgressRepository',  # Alias
    'AchievementRepository',
    'LearningSessionRepository',
    'AssessmentRepository'
]
```

**1.2.2 - Update __init__.py (3 min)**
```bash
code src/persistence/repositories/__init__.py

# Update imports:
from .progress_repo import (
    UserProgressRepository,
    ProgressRepository,  # Add alias
    AchievementRepository,
    LearningSessionRepository,
    AssessmentRepository
)

# Update __all__:
__all__ = [
    'UserProgressRepository',
    'ProgressRepository',  # Add alias
    # ... rest
]
```

**Verification**:
```bash
python -c "from src.persistence.repositories import ProgressRepository" && echo "✅ ProgressRepository alias OK"
python -c "from src.persistence.repositories import UserProgressRepository" && echo "✅ UserProgressRepository OK"
```

**1.2.3 - Commit (2 min)**
```bash
git add src/persistence/repositories/progress_repo.py src/persistence/repositories/__init__.py

git commit -m "$(cat <<'EOF'
fix(persistence): Add ProgressRepository alias for backward compatibility

Changes:
- src/persistence/repositories/progress_repo.py: Add ProgressRepository = UserProgressRepository
- src/persistence/repositories/__init__.py: Export both names

Impact:
- Maintains backward compatibility with existing tests
- Unblocks 6 test files importing ProgressRepository
- No breaking changes to existing code

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

git push
```

---

### Phase 1.3: Fix Jest Configuration ⚡ CRITICAL PATH
**Branch**: `fix/jest-configuration`
**Time**: 25 minutes
**Priority**: P0
**Depends On**: None
**Blocks**: ALL JavaScript tests (100%)

#### Steps:

**1.3.1 - Checkout and prepare (2 min)**
```bash
git checkout fix/test-import-errors
git checkout -b fix/jest-configuration
```

**1.3.2 - Install missing dependencies (8 min)**
```bash
npm install --save-dev ts-jest@29.1.2 jest-junit@16.0.0

# Note: Skipping jest-watch-typeahead for now (optional)
# Can be added later without blocking tests
```

**Verification**:
```bash
npm list ts-jest jest-junit
```

**1.3.3 - Create Babel configuration (5 min)**
```bash
cat > babel.config.json <<'EOF'
{
  "$schema": "https://json.schemastore.org/babelrc.json",
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "current"
        }
      }
    ]
  ]
}
EOF
```

**Install Babel preset if missing**:
```bash
npm install --save-dev @babel/preset-env@7.23.9
```

**1.3.4 - Create TypeScript configuration (5 min)**
```bash
cat > tsconfig.json <<'EOF'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "types": ["jest", "node"],
    "baseUrl": ".",
    "paths": {
      "src/*": ["src/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "tests/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build"
  ]
}
EOF
```

**1.3.5 - Update jest.config.js (optional optimization) (2 min)**
```bash
code jest.config.js

# Comment out watch plugins (lines 90-93):
// watchPlugins: [
//   'jest-watch-typeahead/filename',
//   'jest-watch-typeahead/testname'
// ],
```

**Verification**:
```bash
npx jest --showConfig > /dev/null && echo "✅ Jest config valid"
npx tsc --noEmit && echo "✅ TypeScript config valid"
```

**1.3.6 - Commit (3 min)**
```bash
git add package.json package-lock.json babel.config.json tsconfig.json jest.config.js

git commit -m "$(cat <<'EOF'
fix(jest): Add missing dependencies and configuration files

Changes:
- Install ts-jest and jest-junit
- Create babel.config.json for JavaScript transformation
- Create tsconfig.json for TypeScript support
- Comment out optional watch plugins

Impact:
- Unblocks all 10 Jest test suites
- Enables TypeScript test execution
- Enables proper code transformation

Dependencies added:
- ts-jest@29.1.2
- jest-junit@16.0.0
- @babel/preset-env@7.23.9

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

git push -u origin fix/jest-configuration
```

---

### Phase 1.4: Add DBManager Alias
**Branch**: `fix/python-imports` (same as 1.1, 1.2)
**Time**: 10 minutes
**Priority**: P1
**Depends On**: None
**Blocks**: ~3 test files

#### Steps:

**1.4.1 - Add alias to db_manager.py (5 min)**
```bash
code src/persistence/db_manager.py

# Add at end of file (after DatabaseManager class):
# Alias for backward compatibility
DBManager = DatabaseManager
```

**1.4.2 - Update __init__.py (3 min)**
```bash
code src/persistence/__init__.py

# Update imports:
from .db_manager import DatabaseManager, DBManager

# Update __all__:
__all__ = [
    'DatabaseManager',
    'DBManager',  # Alias
    # ... rest
]
```

**Verification**:
```bash
python -c "from src.persistence.db_manager import DBManager" && echo "✅ DBManager alias OK"
python -c "from src.persistence import DBManager" && echo "✅ DBManager import OK"
```

**1.4.3 - Commit (2 min)**
```bash
git add src/persistence/db_manager.py src/persistence/__init__.py

git commit -m "$(cat <<'EOF'
fix(persistence): Add DBManager alias for backward compatibility

Changes:
- src/persistence/db_manager.py: Add DBManager = DatabaseManager
- src/persistence/__init__.py: Export both names

Impact:
- Maintains backward compatibility with existing tests
- Unblocks 3 test files using DBManager import
- No breaking changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

git push
```

---

### Phase 1.5: Fix accessibility.test.js File Corruption
**Branch**: `fix/jest-configuration` (same as 1.3)
**Time**: 15 minutes
**Priority**: P0
**Depends On**: None
**Blocks**: Jest execution

#### Steps:

**1.5.1 - Read and analyze current file (3 min)**
```bash
# Check file status
wc -l tests/ui/components/accessibility.test.js
file tests/ui/components/accessibility.test.js

# Create backup
cp tests/ui/components/accessibility.test.js tests/ui/components/accessibility.test.js.backup
```

**1.5.2 - Fix line terminators with prettier (5 min)**
```bash
# Install prettier if not already installed
npm install --save-dev prettier@3.1.1

# Format file to fix line terminators
npx prettier --write tests/ui/components/accessibility.test.js
```

**1.5.3 - Fix template literal syntax errors (5 min)**
```bash
code tests/ui/components/accessibility.test.js

# Find (around line 233):
return `[${='▓'.repeat(Math.floor(percentage / 5))}${='░'.repeat(20 - Math.floor(percentage / 5))}] ${percentage}%`;

# Replace with:
return `[${'▓'.repeat(Math.floor(percentage / 5))}${'░'.repeat(20 - Math.floor(percentage / 5))}] ${percentage}%`;
```

**Verification**:
```bash
# Check file has lines now
wc -l tests/ui/components/accessibility.test.js

# Verify syntax is valid
node -c tests/ui/components/accessibility.test.js && echo "✅ Syntax valid"

# Verify Jest can parse it
npx jest tests/ui/components/accessibility.test.js --listTests
```

**1.5.4 - Commit (2 min)**
```bash
git add tests/ui/components/accessibility.test.js package.json

git commit -m "$(cat <<'EOF'
fix(tests): Repair corrupted accessibility.test.js file

Issues fixed:
1. File had no line terminators (20,492 chars in one line)
2. Invalid template literal syntax: ${= instead of ${

Changes:
- Reformatted file with prettier to restore line breaks
- Fixed template literal syntax in getProgressIndicator method
- Added prettier as dev dependency

Impact:
- File now parseable by JavaScript engine
- Unblocks Jest test execution
- Test file now has ~450 lines (was 0 lines before)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

git push
```

---

## Phase 2: Validation Gates (P0)
**Goal**: Verify Phase 1 fixes work correctly
**Wall Time**: 15 minutes (with parallelization)
**Sequential Time**: 25 minutes

### Phase 2.1: Verify Python Import Fixes ⚡ GATE 1
**Branch**: `fix/python-imports`
**Time**: 10 minutes
**Priority**: P0
**Depends On**: P1.1, P1.2, P1.4

#### Steps:

**2.1.1 - Run pytest collection (5 min)**
```bash
# Full collection check
python -m pytest --collect-only -q > docs/test_collection_after_fixes.txt

# Check for errors
grep -i error docs/test_collection_after_fixes.txt && echo "❌ Errors found" || echo "✅ No errors"

# Count collected tests
grep "collected" docs/test_collection_after_fixes.txt
```

**Expected Output**:
```
509 items collected
```

**2.1.2 - Test specific previously-failing imports (3 min)**
```bash
# Test files that were blocked
python -m pytest tests/test_cli_startup.py --collect-only -v
python -m pytest tests/test_models.py --collect-only -v
python -m pytest tests/test_progress_persistence.py --collect-only -v
python -m pytest tests/test_integration.py --collect-only -v
```

**Success Criteria**:
- ✅ 0 collection errors (down from 11)
- ✅ 509 tests collected
- ✅ All previously failing test files now collect successfully

**2.1.3 - Commit verification results (2 min)**
```bash
git add docs/test_collection_after_fixes.txt

git commit -m "$(cat <<'EOF'
docs: Verify Python import fixes - all tests now collectible

Results:
- ✅ 509 tests collected (was 509 / 11 errors)
- ✅ 0 collection errors (was 11)
- ✅ 11 previously blocked test files now working

Test files verified:
- test_cli_startup.py
- test_models.py
- test_progress_persistence.py
- test_integration.py
- test_lessons.py
- test_formatting.py
- (and 5 more)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

git push
```

---

### Phase 2.2: Verify Jest Configuration ⚡ GATE 2
**Branch**: `fix/jest-configuration`
**Time**: 15 minutes
**Priority**: P0
**Depends On**: P1.3, P1.5

#### Steps:

**2.2.1 - Verify Jest can list tests (5 min)**
```bash
# List all test files
npm test -- --listTests > docs/jest_tests_after_fixes.txt

# Check output
cat docs/jest_tests_after_fixes.txt
```

**Expected Output**: List of 10 test suite files

**2.2.2 - Run single test file (5 min)**
```bash
# Run the fixed accessibility test
npm test -- tests/ui/components/accessibility.test.js --no-coverage
```

**2.2.3 - Run all Jest tests (dry run) (3 min)**
```bash
# Run with --listTests to verify all can be discovered
npm test -- --listTests --verbose
```

**Success Criteria**:
- ✅ All 10 test suites listed
- ✅ No SyntaxError in accessibility.test.js
- ✅ Jest configuration loads without errors
- ✅ TypeScript files recognized by ts-jest

**2.2.4 - Commit verification (2 min)**
```bash
git add docs/jest_tests_after_fixes.txt

git commit -m "$(cat <<'EOF'
docs: Verify Jest configuration - all test suites loadable

Results:
- ✅ 10 test suites discoverable (was 0)
- ✅ accessibility.test.js syntax fixed
- ✅ TypeScript transformation working
- ✅ Babel transformation working

Test suites verified:
- UI Components (4 suites)
- UI Integration (4 suites)
- UI Navigation (5 TypeScript suites)
- UI Performance (3 suites)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

git push
```

---

## Phase 3: Test File Cleanup (P2)
**Goal**: Remove fragile patterns and improve reliability
**Wall Time**: 30 minutes
**Sequential Time**: 30 minutes (no parallelization possible)

### Phase 3.1: Merge Python Fixes to Base Branch
**Time**: 5 minutes

```bash
# Switch to base branch
git checkout fix/test-import-errors

# Merge Python fixes
git merge --no-ff fix/python-imports -m "$(cat <<'EOF'
Merge branch 'fix/python-imports' into fix/test-import-errors

Python import fixes completed:
- ✅ Model import paths corrected (models.* → src.models.*)
- ✅ ProgressRepository alias added
- ✅ DBManager alias added
- ✅ 11 collection errors resolved
- ✅ 509 tests now collectible

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

git push
```

### Phase 3.2: Merge Jest Fixes to Base Branch
**Time**: 5 minutes

```bash
# Merge Jest fixes
git merge --no-ff fix/jest-configuration -m "$(cat <<'EOF'
Merge branch 'fix/jest-configuration' into fix/test-import-errors

Jest configuration fixes completed:
- ✅ Dependencies installed (ts-jest, jest-junit)
- ✅ Babel configuration created
- ✅ TypeScript configuration created
- ✅ accessibility.test.js corruption fixed
- ✅ 10 test suites now loadable

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

git push
```

### Phase 3.3: Refactor test_cli_engine.py (10 min)
**Branch**: `fix/test-import-errors`

```bash
code tests/test_cli_engine.py

# Replace try/except pattern with pytest skipif
# FROM:
try:
    from src.commands.base import BaseCommand, CommandMetadata
except ImportError:
    BaseCommand = None
    CommandMetadata = None

class MockCommand(BaseCommand):  # NameError if import failed
    pass

# TO:
import pytest
from src.commands.base import BaseCommand, CommandMetadata

# Add module-level marker if needed
pytestmark = pytest.mark.skipif(
    not hasattr(BaseCommand, '__bases__'),
    reason="BaseCommand not available"
)

class MockCommand(BaseCommand):
    pass
```

**Commit**:
```bash
git add tests/test_cli_engine.py

git commit -m "$(cat <<'EOF'
refactor(tests): Remove fragile try/except pattern in test_cli_engine

Changes:
- Replaced try/except with proper pytest skipif
- Tests now either run or skip cleanly
- No more NameError when imports fail

Impact:
- More reliable test execution
- Clear error messages if dependencies missing
- Follows pytest best practices

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Phase 3.4: Refactor test_commands.py (10 min)
**Branch**: `fix/test-import-errors`

```bash
# Same pattern as test_cli_engine.py
code tests/test_commands.py

# Apply same refactoring
# ... (similar changes)

git add tests/test_commands.py
git commit -m "refactor(tests): Remove fragile try/except pattern in test_commands ..."
git push
```

---

## Phase 4: Comprehensive Testing & Final Validation (P0)
**Goal**: Ensure all fixes work together; no regressions
**Wall Time**: 45 minutes (with parallelization)
**Sequential Time**: 75 minutes

### Phase 4.1: Python Test Suite ⚡ FINAL GATE
**Time**: 45 minutes

**4.1.1 - Full collection check (5 min)**
```bash
python -m pytest tests/ --collect-only -v > docs/pytest_final_collection.txt

# Analyze results
cat docs/pytest_final_collection.txt | tail -20
```

**4.1.2 - Run subset of critical tests (15 min)**
```bash
# Run tests that were previously blocked
python -m pytest tests/test_cli_startup.py tests/test_models.py tests/test_integration.py -v --tb=short
```

**4.1.3 - Run full test suite (20 min)**
```bash
# Run all tests with coverage
python -m pytest tests/ -v --cov=src --cov-report=term --cov-report=html --tb=short > docs/pytest_final_run.txt 2>&1

# Check exit code
echo "Exit code: $?"
```

**4.1.4 - Document results (5 min)**
```bash
# Capture metrics
grep -E "passed|failed|error" docs/pytest_final_run.txt > docs/pytest_summary.txt

git add docs/pytest_*.txt docs/pytest_summary.txt
git commit -m "docs: Final Python test suite validation results"
git push
```

**Success Criteria**:
- ✅ 509 tests collected (0 errors)
- ✅ All import statements resolve
- ✅ No new errors introduced
- ✅ Test count unchanged from baseline

---

### Phase 4.2: Jest Test Suite ⚡ FINAL GATE
**Time**: 30 minutes (can run in parallel with 4.1)

**4.2.1 - Verify all tests discoverable (5 min)**
```bash
npm test -- --listTests > docs/jest_final_list.txt
cat docs/jest_final_list.txt
```

**4.2.2 - Run single suite for sanity check (10 min)**
```bash
npm test -- tests/ui/components/accessibility.test.js
```

**4.2.3 - Run full Jest suite (10 min)**
```bash
npm test > docs/jest_final_run.txt 2>&1

# Check exit code
echo "Exit code: $?"
```

**4.2.4 - Document results (5 min)**
```bash
# Extract summary
grep -E "Tests:|Suites:" docs/jest_final_run.txt > docs/jest_summary.txt

git add docs/jest_*.txt docs/jest_summary.txt
git commit -m "docs: Final Jest test suite validation results"
git push
```

**Success Criteria**:
- ✅ 10 test suites executable
- ✅ No SyntaxError or configuration errors
- ✅ TypeScript tests run successfully
- ✅ Coverage reporting works

---

## Rollback Plan & Recovery Procedures

### Rollback Triggers

**CRITICAL - Immediate Rollback Required**:
- ❌ More than 20 tests fail that were passing before
- ❌ New import errors introduced (Python)
- ❌ New syntax errors introduced (JavaScript)
- ❌ Test suite cannot complete (crashes/hangs)

**HIGH - Rollback Recommended**:
- ⚠️ More than 10 tests fail that were passing before
- ⚠️ Coverage drops below baseline by >5%
- ⚠️ Critical path tests fail

**MEDIUM - Investigate Before Rollback**:
- ⚠️ 1-5 tests fail that were passing before
- ⚠️ Coverage drops by 1-5%
- ⚠️ New warnings appear

### Rollback Procedures

**Level 1: Rollback Specific File**
```bash
# Undo changes to a single file
git checkout HEAD -- path/to/file.py

# Or restore from specific commit
git checkout abc123 -- path/to/file.py
```

**Level 2: Rollback Specific Phase**
```bash
# Rollback to before Phase 3
git reset --hard <commit-hash-after-phase-2>

# Or use reflog to find specific point
git reflog
git reset --hard HEAD@{5}
```

**Level 3: Rollback Entire Branch**
```bash
# Return to main
git checkout main

# Delete feature branch
git branch -D fix/test-import-errors

# Restart from scratch
git checkout -b fix/test-import-errors-v2
```

**Level 4: Emergency Rollback (Production)**
```bash
# If changes were already merged to main
git revert <merge-commit-hash>

# Or hard reset (only if safe)
git reset --hard <commit-before-merge>
git push --force  # ⚠️ Only if no one else has pulled
```

### Safe Rollback Points

**Checkpoint 1**: After Phase 1.1 (Python imports)
```bash
git tag checkpoint-python-imports
```

**Checkpoint 2**: After Phase 1.3 (Jest config)
```bash
git tag checkpoint-jest-config
```

**Checkpoint 3**: After Phase 2 (Validation gates)
```bash
git tag checkpoint-validation-complete
```

**Checkpoint 4**: After Phase 3 (Cleanup)
```bash
git tag checkpoint-cleanup-complete
```

**Checkpoint 5**: After Phase 4 (Final validation)
```bash
git tag checkpoint-all-tests-passing
```

### Recovery Procedures

**If pytest collection still has errors**:
```bash
# Generate detailed error report
python -m pytest --collect-only -v 2>&1 | tee pytest_errors.log

# Analyze specific error
python -m pytest tests/test_failing_file.py --collect-only -v

# Isolate problem
python -c "import problematic_module"
```

**If Jest still fails to run**:
```bash
# Verify configuration
npx jest --showConfig > jest_config_dump.json

# Check syntax of specific file
node -c tests/ui/components/problem-file.test.js

# Run with debug output
npm test -- --verbose --no-coverage
```

**If imports are broken**:
```bash
# Verify Python path
python -c "import sys; print('\n'.join(sys.path))"

# Test specific import
python -c "from src.models.content import Topic"

# Check for circular imports
python -c "import src.app"
```

---

## Success Milestones & Validation Gates

### Milestone 1: Phase 1 Complete ✅
**Criteria**:
- ✅ All Python import paths fixed (3 files modified)
- ✅ ProgressRepository and DBManager aliases added
- ✅ Jest dependencies installed
- ✅ accessibility.test.js corruption fixed
- ✅ Babel and TypeScript configs created

**Validation**:
```bash
# Python
python -c "from src.app import *" && \
python -c "from src.services.curriculum_service import CurriculumService" && \
python -c "from src.persistence.repositories import ProgressRepository" && \
echo "✅ Milestone 1 Python OK"

# Jest
npx jest --showConfig > /dev/null && \
node -c tests/ui/components/accessibility.test.js && \
echo "✅ Milestone 1 Jest OK"
```

---

### Milestone 2: Phase 2 Complete ✅
**Criteria**:
- ✅ 509 Python tests collected (0 errors)
- ✅ 10 Jest test suites loadable
- ✅ No import errors
- ✅ No syntax errors

**Validation**:
```bash
# Python
python -m pytest --collect-only -q | grep -E "509.*collected" && echo "✅ Milestone 2 Python OK"

# Jest
npm test -- --listTests | wc -l | grep -E "10" && echo "✅ Milestone 2 Jest OK"
```

---

### Milestone 3: Phase 3 Complete ✅
**Criteria**:
- ✅ Branches merged to base branch
- ✅ Fragile try/except patterns removed
- ✅ Tests use best practices
- ✅ No new failures introduced

**Validation**:
```bash
# Check for try/except around imports (should be 0 or minimal)
grep -r "except ImportError:" tests/*.py | wc -l

# Verify tests still collect
python -m pytest --collect-only -q && echo "✅ Milestone 3 OK"
```

---

### Milestone 4: Phase 4 Complete ✅ (FINAL)
**Criteria**:
- ✅ Full Python test suite runs to completion
- ✅ Full Jest test suite runs to completion
- ✅ All tests that were passing before still pass
- ✅ Previously blocked tests now run
- ✅ Coverage reports generate successfully
- ✅ No regressions

**Validation**:
```bash
# Python
python -m pytest tests/ -v --cov=src --cov-report=term | tee final_pytest.log
grep -E "passed|failed|error" final_pytest.log

# Jest
npm test | tee final_jest.log
grep -E "Tests:|Suites:" final_jest.log
```

**Final Success Criteria**:
```
✅ Python: 509 tests collected, 0 errors
✅ Jest: 10 test suites, all loadable
✅ Import errors: 0 (was 11)
✅ Syntax errors: 0 (was 1)
✅ Test coverage: ≥80% (Python), ≥70% (Jest)
✅ No new failures introduced
✅ All documentation updated
```

---

## Timeline Summary

### Optimistic (Best Case) - 110 minutes
- Phase 1: 45 min (all parallel tasks complete quickly)
- Phase 2: 15 min (validation smooth)
- Phase 3: 20 min (minimal issues)
- Phase 4: 30 min (all tests pass first try)

### Realistic (Expected) - 155 minutes (2.5 hours) ⚡
- Phase 1: 25 min (wall time, parallelized)
- Phase 2: 15 min (wall time, parallelized)
- Phase 3: 30 min (sequential)
- Phase 4: 45 min (wall time, parallelized)
- Buffer: 40 min (debugging, commits, verification)

### Pessimistic (Worst Case) - 225 minutes (3.75 hours)
- Phase 1: 90 min (issues with dependencies, file corruption)
- Phase 2: 30 min (unexpected import issues)
- Phase 3: 45 min (complex refactoring needed)
- Phase 4: 60 min (test failures, debugging)

**Confidence**: High (80%) for realistic estimate

---

## Risk Mitigation Strategies

### Before Starting
```bash
# 1. Create clean branch
git checkout main
git pull origin main
git checkout -b fix/test-import-errors

# 2. Document baseline
python -m pytest --collect-only -q > docs/baseline_pytest.txt
npm test -- --listTests > docs/baseline_jest.txt 2>&1 || true

# 3. Commit baseline
git add docs/baseline_*.txt
git commit -m "docs: Capture test baseline before fixes"
git push -u origin fix/test-import-errors

# 4. Create safety tags
git tag safety-checkpoint-start
```

### During Execution
```bash
# After each phase, create checkpoint
git tag checkpoint-phase-1
git tag checkpoint-phase-2
git tag checkpoint-phase-3
git tag checkpoint-phase-4

# Test incrementally
# After each file change:
python -m pytest --collect-only -q
npm test -- --listTests
```

### After Completion
```bash
# 1. Compare before/after
diff docs/baseline_pytest.txt docs/final_pytest.txt
diff docs/baseline_jest.txt docs/final_jest.txt

# 2. Generate summary report
cat > docs/FIX_SUMMARY.md <<EOF
# Test Fix Summary

## Python
- Before: 509 collected / 11 errors
- After: 509 collected / 0 errors
- Improvement: 11 collection errors resolved

## Jest
- Before: 0% executable (SyntaxError)
- After: 10 suites, 100% loadable
- Improvement: 100% test availability

## Time Spent
- Planned: 155 minutes
- Actual: [TO BE FILLED]
- Efficiency: [TO BE CALCULATED]

## Files Modified
[List files]
EOF

# 3. Create PR
gh pr create --title "Fix: Resolve all test import and configuration errors" \
  --body "$(cat docs/FIX_SUMMARY.md)"
```

---

## Communication & Reporting

### Status Updates (Hourly)
```bash
# Generate status update
cat > status_update.txt <<EOF
## Test Fix Progress - $(date)

✅ Completed:
- [List completed tasks]

🔄 In Progress:
- [Current task]

⏳ Remaining:
- [Upcoming tasks]

⏱️ Time: [X] of 155 minutes spent
📊 Progress: [X]%

Issues encountered:
- [Any blockers or challenges]
EOF
```

### Final Report Template
```markdown
# Test Fix Implementation Report

**Date**: 2025-10-07
**Duration**: [ACTUAL TIME]
**Status**: ✅ Complete / ⚠️ Partial / ❌ Failed

## Summary

[High-level overview]

## Changes Made

### Python
- src/app.py: [Description]
- src/services/curriculum_service.py: [Description]
- src/services/content_service.py: [Description]
- src/persistence/repositories/progress_repo.py: [Description]
- src/persistence/db_manager.py: [Description]

### JavaScript
- tests/ui/components/accessibility.test.js: [Description]
- jest.config.js: [Description]
- babel.config.json: [Created]
- tsconfig.json: [Created]
- package.json: [Dependencies added]

## Results

### Python Tests
- Collected: 509 (was 509 / 11 errors)
- Errors: 0 (was 11)
- Success Rate: 100% collection

### Jest Tests
- Suites: 10 (was 0)
- Loadable: 100% (was 0%)
- Success Rate: 100% availability

## Lessons Learned

[What went well, what could be improved]

## Next Steps

[Recommendations for follow-up work]
```

---

## Appendix: Quick Reference Commands

### Essential Commands
```bash
# Python test collection
python -m pytest --collect-only -q

# Python test run
python -m pytest tests/ -v

# Jest test list
npm test -- --listTests

# Jest test run
npm test

# Verify Python imports
python -c "from src.app import *"

# Verify Jest config
npx jest --showConfig

# Check file syntax
node -c file.test.js
python -m py_compile file.py
```

### Debugging Commands
```bash
# Python import debugging
python -c "import sys; print(sys.path)"
python -m pytest tests/test_file.py --collect-only -v

# Jest debugging
npm test -- --verbose --no-coverage
npx jest --showConfig | jq .

# Git debugging
git status
git diff
git log --oneline -10
git reflog
```

---

**End of Execution Plan**
**Ready for Phase 3: Implementation**
