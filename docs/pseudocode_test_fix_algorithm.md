# SPARC Phase 2: Pseudocode - Python Test Fix Algorithm

**Date**: 2025-10-07
**Phase**: Pseudocode (Algorithm Design)
**Objective**: Fix 11 collection errors in Python test suite (509 total tests)

---

## ALGORITHM: FixPythonTestFailures

**Context**: Test collection failures due to missing class aliases and import path inconsistencies

**Root Causes Identified**:
1. `ProgressRepository` class exists but alias missing in test imports
2. `DBManager` alias missing (actual class: `DatabaseManager`)
3. Import path confusion: `models.*` vs `src.models.*`
4. Fragile mock patterns in 2 test files

---

## DATA STRUCTURES

```
TestFixContext:
    Type: Dictionary
    Fields:
        - branch_name: String (feature branch for fixes)
        - backup_created: Boolean (rollback safety flag)
        - affected_files: List<FilePath>
        - validation_checkpoints: List<CheckpointResult>
        - rollback_triggers: Set<ErrorCondition>
        - current_phase: Integer (1-6)

    Operations:
        - add_checkpoint(name, status): O(1)
        - should_rollback(): O(1)
        - get_progress(): O(1)

FileModification:
    Type: Record
    Fields:
        - file_path: String
        - modification_type: Enum (ADD_ALIAS, FIX_IMPORT, UPDATE_MOCK)
        - original_content: String
        - new_content: String
        - validation_status: Boolean

    Operations:
        - apply(): Boolean
        - revert(): Boolean
        - validate(): Boolean

ValidationCheckpoint:
    Type: Record
    Fields:
        - checkpoint_id: Integer
        - phase_name: String
        - test_count_before: Integer
        - test_count_after: Integer
        - errors_before: List<String>
        - errors_after: List<String>
        - status: Enum (PASS, FAIL, ROLLBACK_REQUIRED)
        - timestamp: DateTime
```

---

## MAIN ALGORITHM

```
ALGORITHM: FixPythonTestFailures
INPUT: None (operates on current test suite state)
OUTPUT: Boolean (success/failure), TestFixContext (execution details)

CONSTANTS:
    EXPECTED_TEST_COUNT = 509
    MAX_ALLOWED_ERRORS = 0
    BRANCH_NAME = "fix/test-collection-errors"
    BACKUP_TAG = "backup-before-test-fix"

GLOBAL VARIABLES:
    context: TestFixContext
    modifications: List<FileModification>

BEGIN
    // ═══════════════════════════════════════════════════════════
    // PHASE 1: PRE-FLIGHT CHECKS & SAFETY SETUP
    // Why: Ensure we can safely make changes and rollback if needed
    // ═══════════════════════════════════════════════════════════

    PRINT "🚀 Starting Python Test Fix Algorithm"
    PRINT "Target: Fix 11 collection errors in 509 tests"

    context ← InitializeContext()
    context.current_phase ← 1

    // Step 1.1: Verify we're on main branch
    current_branch ← ExecuteCommand("git branch --show-current")

    IF current_branch ≠ "main" THEN
        PRINT "❌ ERROR: Must start from main branch"
        PRINT "Current branch: " + current_branch
        RETURN (False, "Not on main branch")
    END IF

    checkpoint_1a ← CreateCheckpoint("Pre-flight: Branch verification", PASS)
    context.add_checkpoint(checkpoint_1a)

    // Step 1.2: Ensure working directory is clean
    git_status ← ExecuteCommand("git status --porcelain")

    IF git_status.length > 0 THEN
        PRINT "⚠️ WARNING: Uncommitted changes detected"
        user_input ← PromptUser("Stash changes and continue? (y/n)")

        IF user_input = "y" THEN
            ExecuteCommand("git stash push -m 'Auto-stash before test fix'")
            PRINT "✓ Changes stashed"
        ELSE
            PRINT "❌ Aborting: Clean working directory required"
            RETURN (False, "Dirty working directory")
        END IF
    END IF

    checkpoint_1b ← CreateCheckpoint("Pre-flight: Clean workspace", PASS)
    context.add_checkpoint(checkpoint_1b)

    // Step 1.3: Create safety backup tag
    backup_command ← "git tag " + BACKUP_TAG + " -m 'Backup before test fixes'"
    ExecuteCommand(backup_command)
    context.backup_created ← True

    PRINT "✓ Safety backup created: " + BACKUP_TAG

    checkpoint_1c ← CreateCheckpoint("Pre-flight: Backup created", PASS)
    context.add_checkpoint(checkpoint_1c)

    // Step 1.4: Baseline test collection
    PRINT "📊 Running baseline test collection..."
    baseline_result ← ExecuteCommand("python -m pytest tests/ --collect-only -q 2>&1")

    baseline_stats ← ParseTestOutput(baseline_result)
    context.validation_checkpoints.append({
        "phase": "baseline",
        "total_tests": baseline_stats.total,
        "errors": baseline_stats.errors,
        "error_list": baseline_stats.error_messages
    })

    PRINT "Baseline: " + baseline_stats.total + " tests, " + baseline_stats.errors + " errors"

    IF baseline_stats.errors ≠ 11 THEN
        PRINT "⚠️ WARNING: Expected 11 errors, found " + baseline_stats.errors
        PRINT "Phase 1 specification may be outdated"
    END IF

    checkpoint_1d ← CreateCheckpoint("Pre-flight: Baseline established", PASS)
    context.add_checkpoint(checkpoint_1d)

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: CREATE FEATURE BRANCH
    // Why: Isolate changes for easy rollback and review
    // ═══════════════════════════════════════════════════════════

    context.current_phase ← 2
    PRINT "\n🌿 Creating feature branch: " + BRANCH_NAME

    // Step 2.1: Create and checkout feature branch
    create_branch_cmd ← "git checkout -b " + BRANCH_NAME
    branch_result ← ExecuteCommand(create_branch_cmd)

    IF branch_result.exit_code ≠ 0 THEN
        PRINT "❌ ERROR: Failed to create branch"
        CALL RollbackToBackup(context)
        RETURN (False, "Branch creation failed")
    END IF

    context.branch_name ← BRANCH_NAME
    PRINT "✓ Feature branch created and checked out"

    checkpoint_2 ← CreateCheckpoint("Branch: Feature branch created", PASS)
    context.add_checkpoint(checkpoint_2)

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: FIX MISSING CLASS ALIASES
    // Why: Tests import DBManager and ProgressRepository but they don't exist
    //      as exported aliases in the module __init__ files
    // ═══════════════════════════════════════════════════════════

    context.current_phase ← 3
    PRINT "\n🔧 Phase 3: Adding missing class aliases"

    // Step 3.1: Add DBManager alias to persistence/__init__.py
    PRINT "  → Adding DBManager alias..."

    persistence_init_path ← "src/persistence/__init__.py"
    persistence_content ← ReadFile(persistence_init_path)

    // Check if DatabaseManager is already imported
    IF NOT Contains(persistence_content, "from .db_manager import DatabaseManager") THEN
        PRINT "❌ ERROR: DatabaseManager import not found"
        CALL RollbackToBackup(context)
        RETURN (False, "DatabaseManager import missing")
    END IF

    // Add DBManager alias after DatabaseManager import
    new_alias_line ← "DBManager = DatabaseManager  # Alias for backward compatibility"

    IF NOT Contains(persistence_content, "DBManager") THEN
        // Find the line with DatabaseManager import
        import_line_idx ← FindLineIndex(persistence_content, "from .db_manager import DatabaseManager")

        // Insert alias after import
        modified_content ← InsertLineAfter(persistence_content, import_line_idx, new_alias_line)

        // Update __all__ export list
        modified_content ← UpdateExportList(modified_content, "DBManager")

        // Create file modification record
        mod_dbmanager ← FileModification{
            file_path: persistence_init_path,
            modification_type: ADD_ALIAS,
            original_content: persistence_content,
            new_content: modified_content,
            validation_status: False
        }

        // Apply modification
        WriteFile(persistence_init_path, modified_content)
        modifications.append(mod_dbmanager)

        PRINT "  ✓ DBManager alias added"
    ELSE
        PRINT "  ⊙ DBManager alias already exists"
    END IF

    // Step 3.2: Verify ProgressRepository is properly exported
    PRINT "  → Verifying ProgressRepository export..."

    // ProgressRepository class exists, verify it's in __all__
    repo_init_path ← "src/persistence/repositories/__init__.py"
    repo_content ← ReadFile(repo_init_path)

    IF Contains(repo_content, "ProgressRepository") THEN
        PRINT "  ✓ ProgressRepository properly exported"
    ELSE
        PRINT "❌ ERROR: ProgressRepository not in __all__"
        CALL RollbackToBackup(context)
        RETURN (False, "ProgressRepository export missing")
    END IF

    // Step 3.3: Validation checkpoint after alias additions
    PRINT "  → Validating alias additions..."

    alias_test_result ← ExecuteCommand("python -c 'from src.persistence import DBManager, ProgressRepository; print(DBManager, ProgressRepository)'")

    IF alias_test_result.exit_code ≠ 0 THEN
        PRINT "❌ ERROR: Alias validation failed"
        PRINT "Output: " + alias_test_result.stderr
        CALL RollbackToBackup(context)
        RETURN (False, "Alias import validation failed")
    END IF

    PRINT "  ✓ All aliases validated successfully"

    checkpoint_3 ← CreateCheckpoint("Aliases: All aliases added and validated", PASS)
    context.add_checkpoint(checkpoint_3)

    // Step 3.4: Run test collection to measure improvement
    PRINT "  → Running test collection after alias fixes..."

    post_alias_result ← ExecuteCommand("python -m pytest tests/ --collect-only -q 2>&1")
    post_alias_stats ← ParseTestOutput(post_alias_result)

    PRINT "  Post-alias: " + post_alias_stats.total + " tests, " + post_alias_stats.errors + " errors"

    IF post_alias_stats.errors ≥ baseline_stats.errors THEN
        PRINT "⚠️ WARNING: Error count did not decrease"
        PRINT "Expected improvement, investigating..."
        // Continue but flag for review
    END IF

    context.validation_checkpoints.append({
        "phase": "post_alias",
        "total_tests": post_alias_stats.total,
        "errors": post_alias_stats.errors,
        "error_list": post_alias_stats.error_messages
    })

    // ═══════════════════════════════════════════════════════════
    // PHASE 4: FIX IMPORT PATH ISSUES
    // Why: Some tests use 'models.*' instead of 'src.models.*'
    //      This causes import failures in test collection
    // ═══════════════════════════════════════════════════════════

    context.current_phase ← 4
    PRINT "\n🔧 Phase 4: Fixing import path inconsistencies"

    // Step 4.1: Identify files with incorrect import paths
    PRINT "  → Scanning for incorrect import patterns..."

    incorrect_imports ← ExecuteCommand("grep -r 'from models\\.' tests/ --include='*.py' -l")
    files_to_fix ← ParseFileList(incorrect_imports.stdout)

    PRINT "  Found " + files_to_fix.length + " files with incorrect imports"

    IF files_to_fix.length = 0 THEN
        PRINT "  ⊙ No import path issues found (expected)"
    ELSE
        // Step 4.2: Fix each file
        FOR EACH file IN files_to_fix DO
            PRINT "  → Fixing imports in: " + file

            file_content ← ReadFile(file)
            original_content ← file_content

            // Replace 'from models.' with 'from src.models.'
            fixed_content ← ReplaceAll(file_content, "from models.", "from src.models.")

            // Replace 'import models.' with 'import src.models.'
            fixed_content ← ReplaceAll(fixed_content, "import models.", "import src.models.")

            // Create modification record
            mod_import ← FileModification{
                file_path: file,
                modification_type: FIX_IMPORT,
                original_content: original_content,
                new_content: fixed_content,
                validation_status: False
            }

            WriteFile(file, fixed_content)
            modifications.append(mod_import)

            PRINT "  ✓ Fixed imports in: " + file
        END FOR
    END IF

    checkpoint_4a ← CreateCheckpoint("Imports: Path corrections applied", PASS)
    context.add_checkpoint(checkpoint_4a)

    // Step 4.3: Validate import fixes
    PRINT "  → Validating import path fixes..."

    post_import_result ← ExecuteCommand("python -m pytest tests/ --collect-only -q 2>&1")
    post_import_stats ← ParseTestOutput(post_import_result)

    PRINT "  Post-import: " + post_import_stats.total + " tests, " + post_import_stats.errors + " errors"

    context.validation_checkpoints.append({
        "phase": "post_import",
        "total_tests": post_import_stats.total,
        "errors": post_import_stats.errors,
        "error_list": post_import_stats.error_messages
    })

    checkpoint_4b ← CreateCheckpoint("Imports: Validation complete", PASS)
    context.add_checkpoint(checkpoint_4b)

    // ═══════════════════════════════════════════════════════════
    // PHASE 5: FIX FRAGILE MOCK PATTERNS (if errors remain)
    // Why: 2 test files have fragile mocking that may break
    //      during test collection
    // ═══════════════════════════════════════════════════════════

    context.current_phase ← 5

    IF post_import_stats.errors > 0 THEN
        PRINT "\n🔧 Phase 5: Investigating remaining errors"
        PRINT "  Errors remaining: " + post_import_stats.errors

        // Step 5.1: Analyze remaining error messages
        remaining_errors ← post_import_stats.error_messages

        FOR EACH error IN remaining_errors DO
            PRINT "\n  Error: " + error.file
            PRINT "  Message: " + error.message

            // Step 5.2: Classify error type
            error_type ← ClassifyError(error)

            IF error_type = "MOCK_PATTERN" THEN
                PRINT "  → Detected fragile mock pattern"

                // Read affected test file
                test_file_content ← ReadFile(error.file)

                // Analyze mock usage
                mock_analysis ← AnalyzeMockPatterns(test_file_content)

                IF mock_analysis.has_fragile_patterns THEN
                    PRINT "  → Refactoring mock patterns..."

                    // Refactor to more robust mocking
                    refactored_content ← RefactorMockPatterns(test_file_content, mock_analysis)

                    mod_mock ← FileModification{
                        file_path: error.file,
                        modification_type: UPDATE_MOCK,
                        original_content: test_file_content,
                        new_content: refactored_content,
                        validation_status: False
                    }

                    WriteFile(error.file, refactored_content)
                    modifications.append(mod_mock)

                    PRINT "  ✓ Mock patterns refactored"
                END IF

            ELSE IF error_type = "MISSING_DEPENDENCY" THEN
                PRINT "  → Missing test dependency detected"
                PRINT "  → Manual intervention required"
                context.rollback_triggers.add("MISSING_DEPENDENCY")

            ELSE IF error_type = "SYNTAX_ERROR" THEN
                PRINT "  → Syntax error in test file"
                PRINT "  → Manual intervention required"
                context.rollback_triggers.add("SYNTAX_ERROR")

            ELSE
                PRINT "  → Unknown error type: " + error_type
                PRINT "  → Logging for manual review"
            END IF
        END FOR

        // Step 5.3: Re-run test collection after mock fixes
        PRINT "\n  → Re-running test collection..."

        post_mock_result ← ExecuteCommand("python -m pytest tests/ --collect-only -q 2>&1")
        post_mock_stats ← ParseTestOutput(post_mock_result)

        PRINT "  Post-mock: " + post_mock_stats.total + " tests, " + post_mock_stats.errors + " errors"

        context.validation_checkpoints.append({
            "phase": "post_mock",
            "total_tests": post_mock_stats.total,
            "errors": post_mock_stats.errors,
            "error_list": post_mock_stats.error_messages
        })

        checkpoint_5 ← CreateCheckpoint("Mocks: Pattern refactoring complete", PASS)
        context.add_checkpoint(checkpoint_5)
    ELSE
        PRINT "\n✓ Phase 5: Skipped (no errors remaining)"
        checkpoint_5 ← CreateCheckpoint("Mocks: Skipped (not needed)", PASS)
        context.add_checkpoint(checkpoint_5)
    END IF

    // ═══════════════════════════════════════════════════════════
    // PHASE 6: FINAL VALIDATION & COMMIT
    // Why: Verify all fixes work and commit changes
    // ═══════════════════════════════════════════════════════════

    context.current_phase ← 6
    PRINT "\n✅ Phase 6: Final validation and commit"

    // Step 6.1: Run comprehensive test collection
    PRINT "  → Running final test collection..."

    final_result ← ExecuteCommand("python -m pytest tests/ --collect-only -v 2>&1")
    final_stats ← ParseTestOutput(final_result)

    PRINT "\n📊 FINAL RESULTS:"
    PRINT "  Total tests: " + final_stats.total
    PRINT "  Errors: " + final_stats.errors
    PRINT "  Collected successfully: " + (final_stats.total - final_stats.errors)

    context.validation_checkpoints.append({
        "phase": "final",
        "total_tests": final_stats.total,
        "errors": final_stats.errors,
        "error_list": final_stats.error_messages
    })

    // Step 6.2: Determine success criteria
    success_criteria_met ← (
        final_stats.errors = 0 AND
        final_stats.total = EXPECTED_TEST_COUNT
    )

    IF NOT success_criteria_met THEN
        PRINT "\n❌ SUCCESS CRITERIA NOT MET"
        PRINT "  Expected: " + EXPECTED_TEST_COUNT + " tests, 0 errors"
        PRINT "  Got: " + final_stats.total + " tests, " + final_stats.errors + " errors"

        // Check if rollback required
        IF context.should_rollback() OR final_stats.errors > baseline_stats.errors THEN
            PRINT "  → Triggering rollback (made things worse)"
            CALL RollbackToBackup(context)
            RETURN (False, "Fixes made situation worse - rolled back")
        ELSE
            PRINT "  → Improvements made but not complete"
            PRINT "  → Manual review recommended"

            user_decision ← PromptUser("Continue with commit? (y/n)")

            IF user_decision ≠ "y" THEN
                PRINT "  → User aborted, rolling back"
                CALL RollbackToBackup(context)
                RETURN (False, "User aborted incomplete fix")
            END IF
        END IF
    END IF

    // Step 6.3: Commit changes
    PRINT "\n  → Preparing commit..."

    // Stage all modified files
    FOR EACH mod IN modifications DO
        ExecuteCommand("git add " + mod.file_path)
        PRINT "  ✓ Staged: " + mod.file_path
    END FOR

    // Create detailed commit message
    commit_message ← GenerateCommitMessage(context, final_stats, baseline_stats)

    PRINT "\n  Commit message:"
    PRINT "  ─────────────────────────────────────────"
    PRINT commit_message
    PRINT "  ─────────────────────────────────────────"

    // Execute commit
    commit_cmd ← "git commit -m '" + commit_message + "'"
    commit_result ← ExecuteCommand(commit_cmd)

    IF commit_result.exit_code ≠ 0 THEN
        PRINT "❌ ERROR: Commit failed"
        CALL RollbackToBackup(context)
        RETURN (False, "Commit failed")
    END IF

    PRINT "  ✓ Changes committed successfully"

    checkpoint_6 ← CreateCheckpoint("Final: Changes committed", PASS)
    context.add_checkpoint(checkpoint_6)

    // Step 6.4: Generate summary report
    PRINT "\n" + "═" * 60
    PRINT "🎉 TEST FIX ALGORITHM COMPLETED SUCCESSFULLY"
    PRINT "═" * 60

    CALL GenerateSummaryReport(context, baseline_stats, final_stats)

    // Step 6.5: Provide next steps
    PRINT "\n📋 NEXT STEPS:"
    PRINT "  1. Review changes: git diff main.." + BRANCH_NAME
    PRINT "  2. Run full test suite: python -m pytest tests/ -v"
    PRINT "  3. If tests pass, merge to main: git checkout main && git merge " + BRANCH_NAME
    PRINT "  4. Push changes: git push origin main"
    PRINT "  5. Delete backup tag: git tag -d " + BACKUP_TAG
    PRINT "  6. Delete feature branch: git branch -d " + BRANCH_NAME

    RETURN (True, context)
END


// ═══════════════════════════════════════════════════════════
// SUBROUTINE: RollbackToBackup
// Why: Safely revert all changes if fixes fail
// ═══════════════════════════════════════════════════════════

SUBROUTINE: RollbackToBackup
INPUT: context (TestFixContext)
OUTPUT: None

BEGIN
    PRINT "\n🔄 INITIATING ROLLBACK PROCEDURE"
    PRINT "═" * 60

    // Step 1: Checkout main branch
    PRINT "  → Returning to main branch..."
    ExecuteCommand("git checkout main")

    // Step 2: Delete feature branch (if exists)
    IF context.branch_name IS NOT NULL THEN
        PRINT "  → Deleting feature branch: " + context.branch_name
        ExecuteCommand("git branch -D " + context.branch_name)
    END IF

    // Step 3: Reset to backup tag
    IF context.backup_created THEN
        PRINT "  → Resetting to backup: " + BACKUP_TAG
        ExecuteCommand("git reset --hard " + BACKUP_TAG)
        ExecuteCommand("git tag -d " + BACKUP_TAG)
    END IF

    // Step 4: Restore stashed changes (if any)
    stash_list ← ExecuteCommand("git stash list")

    IF Contains(stash_list.stdout, "Auto-stash before test fix") THEN
        PRINT "  → Restoring stashed changes..."
        ExecuteCommand("git stash pop")
    END IF

    PRINT "\n✓ Rollback complete - all changes reverted"
    PRINT "  Working directory restored to pre-fix state"
    PRINT "═" * 60
END


// ═══════════════════════════════════════════════════════════
// SUBROUTINE: GenerateCommitMessage
// Why: Create detailed, informative commit message
// ═══════════════════════════════════════════════════════════

SUBROUTINE: GenerateCommitMessage
INPUT: context (TestFixContext), final_stats, baseline_stats
OUTPUT: message (String)

BEGIN
    improvement ← baseline_stats.errors - final_stats.errors

    message ← "fix(tests): Resolve test collection errors\n\n"
    message ← message + "Fixed " + improvement + " test collection errors by:\n"
    message ← message + "- Adding DBManager alias for backward compatibility\n"
    message ← message + "- Verifying ProgressRepository exports\n"

    IF Contains(context.modifications, "FIX_IMPORT") THEN
        message ← message + "- Correcting import paths (models.* → src.models.*)\n"
    END IF

    IF Contains(context.modifications, "UPDATE_MOCK") THEN
        message ← message + "- Refactoring fragile mock patterns\n"
    END IF

    message ← message + "\nTest collection results:\n"
    message ← message + "- Before: " + baseline_stats.total + " tests, " + baseline_stats.errors + " errors\n"
    message ← message + "- After: " + final_stats.total + " tests, " + final_stats.errors + " errors\n"
    message ← message + "- Improvement: " + improvement + " errors resolved\n"
    message ← message + "\nPhases executed:\n"

    FOR EACH checkpoint IN context.validation_checkpoints DO
        message ← message + "- " + checkpoint.phase + ": " + checkpoint.status + "\n"
    END FOR

    message ← message + "\n🤖 Generated with Claude Code\n"
    message ← message + "Co-Authored-By: Claude <noreply@anthropic.com>"

    RETURN message
END


// ═══════════════════════════════════════════════════════════
// SUBROUTINE: ParseTestOutput
// Why: Extract meaningful statistics from pytest output
// ═══════════════════════════════════════════════════════════

SUBROUTINE: ParseTestOutput
INPUT: output (String - pytest command output)
OUTPUT: stats (TestStatistics)

BEGIN
    stats ← TestStatistics{}

    // Extract total test count
    IF Contains(output, "collected") THEN
        collected_line ← ExtractLine(output, "collected")
        stats.total ← ExtractNumber(collected_line, before: "items")
    ELSE
        stats.total ← 0
    END IF

    // Extract error count
    error_lines ← ExtractAllLines(output, "ERROR")
    stats.errors ← error_lines.length

    // Extract error details
    stats.error_messages ← []

    FOR EACH error_line IN error_lines DO
        error_detail ← {
            file: ExtractFilePath(error_line),
            message: ExtractErrorMessage(error_line),
            type: ClassifyErrorType(error_line)
        }
        stats.error_messages.append(error_detail)
    END FOR

    // Calculate success rate
    IF stats.total > 0 THEN
        stats.success_rate ← ((stats.total - stats.errors) / stats.total) * 100
    ELSE
        stats.success_rate ← 0
    END IF

    RETURN stats
END


// ═══════════════════════════════════════════════════════════
// SUBROUTINE: ClassifyError
// Why: Identify error type for appropriate fix strategy
// ═══════════════════════════════════════════════════════════

SUBROUTINE: ClassifyError
INPUT: error (ErrorDetail)
OUTPUT: error_type (Enum)

BEGIN
    message ← error.message.toLowerCase()

    // Check for import errors
    IF Contains(message, "importerror") OR Contains(message, "cannot import") THEN
        IF Contains(message, "progressrepository") OR Contains(message, "dbmanager") THEN
            RETURN "MISSING_ALIAS"
        ELSE IF Contains(message, "models.") THEN
            RETURN "IMPORT_PATH"
        ELSE
            RETURN "MISSING_DEPENDENCY"
        END IF
    END IF

    // Check for mock-related errors
    IF Contains(message, "mock") OR Contains(message, "patch") THEN
        RETURN "MOCK_PATTERN"
    END IF

    // Check for syntax errors
    IF Contains(message, "syntaxerror") OR Contains(message, "invalid syntax") THEN
        RETURN "SYNTAX_ERROR"
    END IF

    // Check for attribute errors
    IF Contains(message, "attributeerror") THEN
        RETURN "ATTRIBUTE_ERROR"
    END IF

    // Unknown error type
    RETURN "UNKNOWN"
END


// ═══════════════════════════════════════════════════════════
// SUBROUTINE: GenerateSummaryReport
// Why: Provide comprehensive report of all fixes applied
// ═══════════════════════════════════════════════════════════

SUBROUTINE: GenerateSummaryReport
INPUT: context, baseline_stats, final_stats
OUTPUT: None (prints to console)

BEGIN
    PRINT "\n📊 EXECUTION SUMMARY"
    PRINT "─" * 60

    // Overall statistics
    PRINT "Overall Progress:"
    PRINT "  Baseline errors: " + baseline_stats.errors
    PRINT "  Final errors: " + final_stats.errors
    PRINT "  Errors resolved: " + (baseline_stats.errors - final_stats.errors)
    PRINT "  Success rate: " + final_stats.success_rate + "%"

    // Phase breakdown
    PRINT "\nPhase Execution:"

    FOR EACH checkpoint IN context.validation_checkpoints DO
        status_icon ← checkpoint.status = PASS ? "✓" : "✗"
        PRINT "  " + status_icon + " " + checkpoint.phase_name

        IF checkpoint.test_count_after IS NOT NULL THEN
            PRINT "    Tests: " + checkpoint.test_count_after
            PRINT "    Errors: " + checkpoint.errors.length
        END IF
    END FOR

    // File modifications
    PRINT "\nFiles Modified:"

    modification_summary ← GroupBy(context.modifications, "modification_type")

    FOR EACH mod_type IN modification_summary.keys DO
        files ← modification_summary[mod_type]
        PRINT "  " + mod_type + ": " + files.length + " files"

        FOR EACH file IN files DO
            PRINT "    - " + file.file_path
        END FOR
    END FOR

    // Validation checkpoints
    PRINT "\nValidation Checkpoints Passed: " + context.validation_checkpoints.length

    PRINT "─" * 60
END
```

---

## COMPLEXITY ANALYSIS

### Time Complexity

**Per Phase**:
1. **Pre-flight checks**: O(1) - Fixed number of git operations
2. **Branch creation**: O(1) - Single git command
3. **Alias additions**: O(k) where k = number of files to modify (k ≤ 3)
4. **Import path fixes**: O(n × m) where n = test files, m = average file size
5. **Mock refactoring**: O(p × q) where p = files with mock issues, q = mock pattern complexity
6. **Validation & commit**: O(1) - Fixed operations

**Total**: O(n × m) dominated by import path scanning

### Space Complexity

- **Context storage**: O(1) - Fixed structure size
- **File modifications list**: O(k) where k = modified files
- **Checkpoint history**: O(c) where c = number of checkpoints (≤ 10)
- **Error message storage**: O(e) where e = number of errors

**Total**: O(k + e) where k is typically small (< 20 files)

---

## VALIDATION GATES

Each phase has a validation gate that must pass before proceeding:

### Gate 1: Pre-flight
- ✓ On main branch
- ✓ Clean working directory
- ✓ Backup created
- ✓ Baseline established

### Gate 2: Branch Creation
- ✓ Feature branch created successfully
- ✓ Checked out to feature branch

### Gate 3: Alias Additions
- ✓ DBManager alias added
- ✓ ProgressRepository verified
- ✓ Import validation passes

### Gate 4: Import Fixes
- ✓ All import paths corrected
- ✓ Test collection shows improvement

### Gate 5: Mock Refactoring
- ✓ Fragile patterns identified
- ✓ Refactoring applied
- ✓ No new errors introduced

### Gate 6: Final Validation
- ✓ 0 collection errors
- ✓ 509 tests collected
- ✓ Changes committed

---

## ROLLBACK TRIGGERS

The algorithm will automatically rollback if:

1. **Error count increases** after any phase
2. **Critical dependency missing** that cannot be fixed
3. **Syntax errors** introduced by automated fixes
4. **User abort** when prompted for manual intervention
5. **Commit fails** due to git issues
6. **Success criteria not met** and situation worse than baseline

---

## SUCCESS CRITERIA

The algorithm succeeds if and only if:

1. **All 509 tests** are collected successfully
2. **0 collection errors** remain
3. **All validation gates** pass
4. **Changes committed** to feature branch
5. **No rollback triggered** during execution

---

## EDGE CASES HANDLED

1. **Dirty working directory**: Stash changes with user consent
2. **Unexpected error count**: Flag for manual review but continue
3. **Partial improvement**: Prompt user for decision
4. **Unknown error types**: Log for manual investigation
5. **Git operations fail**: Immediate rollback
6. **File not found**: Validate existence before modification
7. **Already fixed items**: Skip gracefully without error

---

## OPTIMIZATION NOTES

1. **Parallel test collection**: Could run test collection in background during file modifications
2. **Batch file operations**: Group related file modifications together
3. **Incremental validation**: Test only affected files after each fix
4. **Cache parsed results**: Store parsed test output to avoid re-parsing
5. **Smart error classification**: Use ML to improve error type detection

---

## IMPLEMENTATION ROADMAP

### Immediate (Phase 3-4)
1. Implement alias addition logic
2. Implement import path correction
3. Basic validation checkpoints

### Short-term (Phase 5)
4. Mock pattern analysis
5. Error classification system
6. Rollback mechanism

### Long-term (Refinement)
7. Automated fix suggestion system
8. Pattern learning from past fixes
9. Integration with CI/CD pipeline

---

**Algorithm designed by**: Claude (Pseudocode Agent)
**Date**: 2025-10-07
**Ready for Phase 3**: Architecture & Implementation Design
