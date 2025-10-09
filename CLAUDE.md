# Claude Code Configuration - SPARC Development Environment

> **⚠️ IMPORTANT**: This file (CLAUDE.md) is auto-loaded by Claude Code at session start.
> All mandatory directives and critical rules MUST remain in this file.
> External reference files (in `docs/`) are for human readers only and are NOT auto-loaded.

---

## 📋 Quick Navigation

- [🚨 Critical Operating Rules](#critical-operating-rules)
- [⚖️ Mandatory Agent Directives (26)](#mandatory-agent-directives)
- [🎯 Project Configuration](#project-configuration)
- [🚀 Available Agents & Tools](#available-agents--tools)
- [📚 Technical Reference](#technical-reference)
- [📖 Reference Documentation - Keyword Triggers](#reference-documentation---keyword-triggers--summaries)

---

## 🚨 CRITICAL OPERATING RULES

### Concurrent Execution & File Management

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories
4. **USE CLAUDE CODE'S TASK TOOL** for spawning agents concurrently, not just MCP

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool (Claude Code)**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
- **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### 🎯 CRITICAL: Claude Code Task Tool for Agent Execution

**Claude Code's Task tool is the PRIMARY way to spawn agents:**
```javascript
// ✅ CORRECT: Use Claude Code's Task tool for parallel agent execution
[Single Message]:
  Task("Research agent", "Analyze requirements and patterns...", "researcher")
  Task("Coder agent", "Implement core features...", "coder")
  Task("Tester agent", "Create comprehensive tests...", "tester")
  Task("Reviewer agent", "Review code quality...", "reviewer")
  Task("Architect agent", "Design system architecture...", "system-architect")
```

**MCP tools are ONLY for coordination setup:**
- `mcp__claude-flow__swarm_init` - Initialize coordination topology
- `mcp__claude-flow__agent_spawn` - Define agent types for coordination
- `mcp__claude-flow__task_orchestrate` - Orchestrate high-level workflows

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code

### 📝 File Creation & Documentation Policy

**Important Instruction Reminders:**
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files
- Only create documentation files if explicitly requested by the user
- Never save working files, text/mds and tests to the root folder

**Documentation Policy Clarification:**
- Don't create documentation *preemptively* (before features exist)
- DO update documentation *as features are built* (MANDATORY-12)
- Distinction: Necessary updates vs. unnecessary new files

### 📖 MANDATORY: Reference Documentation Reading Protocol

**CRITICAL**: The following reference files are NOT auto-loaded but MUST be read proactively when relevant:

**REQUIRED READING TRIGGERS**:

1. **Agent Selection/Usage** → **MUST READ** `docs/AGENT_REFERENCE.md`
   - When selecting which agent(s) to use for a task
   - When uncertain about agent capabilities
   - When planning multi-agent workflows
   - When user asks about specific agents

2. **SPARC Workflows** → **MUST READ** `docs/SPARC_EXAMPLES.md`
   - When implementing SPARC methodology
   - When user requests TDD workflow
   - When planning complex feature development
   - When uncertain about SPARC phase execution

3. **MCP Setup/Configuration** → **MUST READ** `docs/MCP_SETUP_GUIDE.md`
   - When MCP tools are not working
   - When user asks about MCP setup
   - When troubleshooting swarm coordination
   - When configuring MCP servers

**ENFORCEMENT**:
- Before spawning any agent via Task tool, verify agent capabilities by reading `docs/AGENT_REFERENCE.md`
- Before executing SPARC commands, consult examples in `docs/SPARC_EXAMPLES.md`
- When MCP tools fail or setup is needed, read `docs/MCP_SETUP_GUIDE.md`
- These reads should be batched with other operations when possible

**PATTERN**:
```javascript
// ✅ CORRECT: Read reference docs BEFORE using capabilities
[Single Message]:
  Read "docs/AGENT_REFERENCE.md"  // Verify agent capabilities
  Task("Backend Developer", "...", "backend-dev")  // Use agent
  Task("Code Reviewer", "...", "reviewer")
```

```javascript
// ❌ WRONG: Using agents without verifying capabilities
[Single Message]:
  Task("Some Agent", "...", "unknown-agent")  // May fail
```

---

## ⚖️ MANDATORY AGENT DIRECTIVES

═══════════════════════════════════════════════════════
    AGENT OPERATING INSTRUCTIONS
    ALL DIRECTIVES ARE MANDATORY - STRICT COMPLIANCE
═══════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════╗
║ ⚠️  CRITICAL: SWARM ORCHESTRATION ARCHITECTURE  ⚠️     ║
║                                                       ║
║ MANDATORY COORDINATION PATTERN:                      ║
║ → Topology Setup: Use Claude Flow's MCP (Model       ║
║   Context Protocol) coordination for establishing    ║
║   agent topology and communication patterns          ║
║ → Agent Execution: Use Task tool for actual agent    ║
║   execution, following guidelines in CLAUDE.md       ║
║ → Separation of Concerns: ALWAYS distinguish between ║
║   orchestration layer (Flow/MCP) and execution       ║
║   layer (Task tool)                                  ║
║                                                       ║
║ This pattern must be followed for ALL multi-agent    ║
║ coordination and swarm operations without exception. ║
╚═══════════════════════════════════════════════════════╝

[MANDATORY-1] COMMUNICATION & TRANSPARENCY
→ Explain every action in detail as you perform it
→ Include: what you're doing, why, expected outcomes, context, and rationale
→ Maximize thought exposure: make reasoning visible and understandable

[MANDATORY-2] PROFESSIONAL COMMUNICATION STYLE
→ Avoid sycophancy: Don't over-praise, over-agree, or use excessive enthusiasm
→ Maintain neutral, professional tone: Be direct, clear, and objective
→ Give honest assessments: Point out potential issues, trade-offs, and concerns
→ Don't over-apologize: Acknowledge errors once, then move forward with solutions
→ Challenge when appropriate: Question assumptions and suggest alternatives constructively
→ Skip unnecessary pleasantries: Get to the point efficiently
→ Be appropriately critical: Identify flaws, risks, and weaknesses without sugar-coating
→ Avoid hedging excessively: State things directly unless genuinely uncertain
→ No false validation: Don't agree with problematic ideas just to be agreeable
→ Professional candor over politeness: Prioritize clarity and usefulness over niceties

[MANDATORY-3] VERSION CONTROL & DOCUMENTATION
→ Commit frequently to local and remote repositories
→ Write clear, meaningful commit messages for all changes

[MANDATORY-4] TARGET AUDIENCE & SCOPE
→ Primary user: Individual use (requestor)
→ Future scope: Multi-user, public open-source or paid offering
→ Current priority: Build meaningful, functional features first

[MANDATORY-5] CLARIFICATION PROTOCOL
→ Stop and ask questions when:
  • Instructions unclear or ambiguous
  • Uncertain about requirements or approach
  • Insufficient information for intelligent decisions
  • Multiple valid paths exist

[MANDATORY-6] SWARM ORCHESTRATION APPROACH
→ Topology setup: Use Claude Flow's MCP (Model Context Protocol) coordination for establishing agent topology and communication patterns
→ Agent execution: Use Task tool for actual agent execution, following guidelines specified in CLAUDE.md
→ Separation of concerns: Distinguish between orchestration layer (Flow/MCP) and execution layer (Task tool)

[MANDATORY-7] ERROR HANDLING & RESILIENCE
→ Implement graceful error handling with clear error messages
→ Log errors with context for debugging
→ Validate inputs and outputs at boundaries
→ Provide fallback strategies when operations fail
→ Never fail silently; always surface issues appropriately

[MANDATORY-8] TESTING & QUALITY ASSURANCE
→ Write tests for critical functionality before considering work complete
→ Verify changes work as expected before committing
→ Document test cases and edge cases considered
→ Run existing tests to ensure no regressions

[MANDATORY-9] SECURITY & PRIVACY
→ Never commit secrets, API keys, or sensitive credentials
→ Use environment variables for configuration
→ Sanitize user inputs to prevent injection attacks
→ Consider data privacy implications for future multi-user scenarios
→ Follow principle of least privilege

[MANDATORY-10] ARCHITECTURE & DESIGN
→ Favor simple, readable solutions over clever complexity
→ Design for modularity and reusability from the start
→ Document architectural decisions and trade-offs
→ Consider future extensibility without over-engineering
→ Apply SOLID principles and appropriate design patterns

[MANDATORY-11] INCREMENTAL DELIVERY
→ Break large tasks into small, deployable increments
→ Deliver working functionality frequently (daily if possible)
→ Each commit should leave the system in a working state
→ Prioritize MVP features over perfect implementations
→ Iterate based on feedback and learnings

[MANDATORY-12] DOCUMENTATION STANDARDS
→ Update README.md as features are added
→ Document "why" decisions were made, not just "what"
→ Include setup instructions, dependencies, and usage examples
→ Maintain API documentation for all public interfaces
→ Document known limitations and future considerations

[MANDATORY-13] DEPENDENCY MANAGEMENT
→ Minimize external dependencies; evaluate necessity
→ Pin dependency versions for reproducibility
→ Document why each major dependency was chosen
→ Regularly review and update dependencies for security

[MANDATORY-14] PERFORMANCE AWARENESS
→ Profile before optimizing; avoid premature optimization
→ Consider scalability implications of design choices
→ Document performance characteristics and bottlenecks
→ Optimize for readability first, performance second (unless critical)

[MANDATORY-15] STATE MANAGEMENT
→ Make state transitions explicit and traceable
→ Validate state consistency at critical points
→ Consider idempotency for operations that might retry
→ Document state machine behavior where applicable

[MANDATORY-16] CONTINUOUS LEARNING & IMPROVEMENT
→ Document what worked and what didn't after completing tasks
→ Identify patterns in errors and user requests
→ Suggest process improvements based on observed inefficiencies
→ Build reusable solutions from recurring problems
→ Maintain a decision log for complex choices

[MANDATORY-17] OBSERVABILITY & MONITORING
→ Log key operations with appropriate detail levels
→ Track performance metrics for critical operations
→ Implement health checks for system components
→ Make system state inspectable at any time
→ Alert on anomalies or degraded performance

[MANDATORY-18] RESOURCE OPTIMIZATION
→ Track API calls, token usage, and computational costs
→ Implement caching strategies where appropriate
→ Avoid redundant operations and API calls
→ Consider rate limits and quota constraints
→ Optimize for cost-effectiveness without sacrificing quality

[MANDATORY-19] USER EXPERIENCE
→ Prioritize clarity and usability in all interfaces
→ Provide helpful feedback for all operations
→ Design for accessibility from the start
→ Minimize cognitive load required to use features
→ Make error messages actionable and user-friendly

[MANDATORY-20] DATA QUALITY & INTEGRITY
→ Validate data at system boundaries
→ Implement data consistency checks
→ Handle data migrations carefully with backups
→ Sanitize and normalize inputs
→ Maintain data provenance and audit trails

[MANDATORY-21] CONTEXT PRESERVATION
→ Maintain relevant context across operations
→ Persist important state between sessions
→ Reference previous decisions and outcomes
→ Build on prior work rather than restarting
→ Document assumptions and constraints

[MANDATORY-22] ETHICAL OPERATION
→ Consider bias and fairness implications
→ Respect user privacy and data sovereignty
→ Be transparent about capabilities and limitations
→ Decline tasks that could cause harm
→ Prioritize user agency and informed consent

[MANDATORY-23] AGENT COLLABORATION
→ Share context effectively with other agents
→ Coordinate to avoid duplicated work
→ Escalate appropriately to humans when needed
→ Maintain clear handoff protocols
→ Document inter-agent dependencies

[MANDATORY-24] RECOVERY PROCEDURES
→ Design operations to be reversible when possible
→ Maintain backups before destructive operations
→ Document rollback procedures for changes
→ Test recovery processes regularly
→ Keep system in recoverable state at all times

[MANDATORY-25] TECHNICAL DEBT MANAGEMENT
→ Flag areas needing refactoring with justification
→ Balance shipping fast vs. accumulating debt
→ Schedule time for addressing technical debt
→ Document intentional shortcuts and their trade-offs
→ Prevent debt from compounding unchecked

═══════════════════════════════════════════════════════
    END INSTRUCTIONS - COMPLIANCE REQUIRED
═══════════════════════════════════════════════════════


---

## 🏗️ ARCHITECTURAL ENFORCEMENT CHECKLIST

Before implementing any feature or making significant changes, verify compliance with:

### Design Patterns (MUST FOLLOW)
- [ ] **Command Pattern** for CLI commands (inherit from `BaseCommand`)
- [ ] **Repository Pattern** for data access (inherit from `BaseRepository`)
- [ ] **Service Layer** for business logic orchestration
- [ ] **Plugin Architecture** for extensible features
- [ ] **Factory Pattern** for complex object creation
- [ ] **Component-Based UI** for terminal interfaces

### SOLID Principles (MANDATORY)
- [ ] **Single Responsibility**: Each class has ONE reason to change
- [ ] **Open/Closed**: Open for extension, closed for modification
- [ ] **Liskov Substitution**: Subclasses substitutable for base classes
- [ ] **Interface Segregation**: Specific interfaces, not general ones
- [ ] **Dependency Inversion**: Depend on abstractions, inject dependencies

### Code Organization (REQUIRED)
- [ ] Files under **500 lines** (exceptions must be documented)
- [ ] No circular dependencies
- [ ] Proper directory structure (`src/commands/`, `src/models/`, etc.)
- [ ] Naming conventions followed (see [ARCHITECTURE_GUIDELINES.md](docs/ARCHITECTURE_GUIDELINES.md))
- [ ] Type hints on all function signatures
- [ ] Docstrings on all public methods

### Testing Requirements (MUST HAVE)
- [ ] **TDD followed** for new features (test-first)
- [ ] Unit tests for all public methods
- [ ] Integration tests for cross-layer operations
- [ ] **Coverage ≥80%** for new code
- [ ] No flaky tests (deterministic)

### Security Checklist (CRITICAL)
- [ ] **No secrets committed** (use environment variables)
- [ ] Input validation for user inputs
- [ ] Parameterized queries (prevent SQL injection)
- [ ] Path validation (prevent directory traversal)
- [ ] Dependencies scanned for vulnerabilities

### Documentation (MANDATORY)
- [ ] Module docstrings present
- [ ] Function docstrings with params, returns, raises
- [ ] README updated for user-facing changes
- [ ] **ADR created** for significant architectural decisions
- [ ] CHANGELOG updated

### Quality Gates (AUTOMATED)
- [ ] Linting passes (pylint ≥8.0, flake8, ESLint)
- [ ] Type checking passes (mypy 0 errors)
- [ ] All tests pass (pytest, Jest)
- [ ] Coverage threshold met (≥80%)
- [ ] Security scans pass (bandit, safety)

### Review Before Commit
- [ ] Self-reviewed using [Code Quality Standards](docs/CODE_QUALITY_STANDARDS.md)
- [ ] Ran `black`, `isort`, `pylint` locally
- [ ] Tested manually in development environment
- [ ] Checked for anti-patterns (see CODE_QUALITY_STANDARDS.md)
- [ ] Verified backward compatibility

**Quick References**:
- [Architecture Guidelines](docs/ARCHITECTURE_GUIDELINES.md) - Patterns and principles
- [Code Quality Standards](docs/CODE_QUALITY_STANDARDS.md) - Review checklist and metrics
- [ADR Index](docs/adr/README.md) - Architectural decisions
- [Large File Refactoring](docs/LARGE_FILE_REFACTORING_STRATEGY.md) - File size violations

**Current File Size Violations** (MUST REFACTOR):
```
src/ui/enhanced_interactive.py     - 1665 lines
src/commands/progress_commands.py  - 1584 lines
src/commands/admin_commands.py     - 1478 lines
src/commands/search_commands.py    - 1397 lines
src/commands/content_commands.py   - 1328 lines
src/commands/curriculum_commands.py- 1223 lines
src/ui/interactive.py              - 1133 lines
src/ui/unified_formatter.py        - 1069 lines
src/notes_manager.py               - 1068 lines
```
---

## 🎯 PROJECT CONFIGURATION

### Project Overview

This project uses **SPARC** (Specification, Pseudocode, Architecture, Refinement, Completion) methodology with Claude-Flow orchestration for systematic Test-Driven Development.

### SPARC Workflow Phases

1. **Specification** - Requirements analysis (`sparc run spec-pseudocode`)
2. **Pseudocode** - Algorithm design (`sparc run spec-pseudocode`)
3. **Architecture** - System design (`sparc run architect`)
4. **Refinement** - TDD implementation (`sparc tdd`)
5. **Completion** - Integration (`sparc run integration`)

### Code Style & Best Practices Summary

**See MANDATORY-8 through MANDATORY-14 for complete requirements**

- **Modular Design**: Files under 500 lines
- **Environment Safety**: Never hardcode secrets (MANDATORY-9)
- **Test-First**: Write tests before implementation (MANDATORY-8)
- **Clean Architecture**: Separate concerns (MANDATORY-10)
- **Documentation**: Keep updated as features are built (MANDATORY-12)

### SPARC Commands

#### Core Commands
- `npx claude-flow sparc modes` - List available modes
- `npx claude-flow sparc run <mode> "<task>"` - Execute specific mode
- `npx claude-flow sparc tdd "<feature>"` - Run complete TDD workflow
- `npx claude-flow sparc info <mode>` - Get mode details

#### Batchtools Commands
- `npx claude-flow sparc batch <modes> "<task>"` - Parallel execution
- `npx claude-flow sparc pipeline "<task>"` - Full pipeline processing
- `npx claude-flow sparc concurrent <mode> "<tasks-file>"` - Multi-task processing

#### Build Commands
- `npm run build` - Build project
- `npm run test` - Run tests
- `npm run lint` - Linting
- `npm run typecheck` - Type checking

---

## 🚀 AVAILABLE AGENTS & TOOLS

### Available Agents (54 Total)

#### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

#### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager`

#### Consensus & Distributed
`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `consensus-builder`, `crdt-synchronizer`, `quorum-manager`, `security-manager`

#### Performance & Optimization
`perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent`

#### GitHub & Repository
`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm`

#### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

#### Specialized Development
`backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator`

#### Testing & Validation
`tdd-london-swarm`, `production-validator`

#### Migration & Planning
`migration-planner`, `swarm-init`

> **📖 For detailed agent capabilities**, see `docs/AGENT_REFERENCE.md` (human reference only)

### Claude Code vs MCP Tools

#### Claude Code Handles ALL EXECUTION:
- **Task tool**: Spawn and run agents concurrently for actual work
- File operations (Read, Write, Edit, MultiEdit, Glob, Grep)
- Code generation and programming
- Bash commands and system operations
- Implementation work
- Project navigation and analysis
- TodoWrite and task management
- Git operations
- Package management
- Testing and debugging

#### MCP Tools ONLY COORDINATE:
- Swarm initialization (topology setup)
- Agent type definitions (coordination patterns)
- Task orchestration (high-level planning)
- Memory management
- Neural features
- Performance tracking
- GitHub integration

**KEY**: MCP coordinates the strategy, Claude Code's Task tool executes with real agents.

---

## 📚 TECHNICAL REFERENCE

### Quick Setup

```bash
# Add MCP servers (Claude Flow required, others optional)
claude mcp add claude-flow npx claude-flow@alpha mcp start
claude mcp add ruv-swarm npx ruv-swarm mcp start  # Optional: Enhanced coordination
claude mcp add flow-nexus npx flow-nexus@latest mcp start  # Optional: Cloud features
```

> **📖 For detailed MCP setup**, see `docs/MCP_SETUP_GUIDE.md` (human reference only)

### MCP Tool Categories

#### Coordination
`swarm_init`, `agent_spawn`, `task_orchestrate`

#### Monitoring
`swarm_status`, `agent_list`, `agent_metrics`, `task_status`, `task_results`

#### Memory & Neural
`memory_usage`, `neural_status`, `neural_train`, `neural_patterns`

#### GitHub Integration
`github_swarm`, `repo_analyze`, `pr_enhance`, `issue_triage`, `code_review`

#### System
`benchmark_run`, `features_detect`, `swarm_monitor`

### Flow-Nexus MCP Tools (Optional Advanced Features)

Flow-Nexus extends MCP capabilities with 70+ cloud-based orchestration tools:

**Key MCP Tool Categories:**
- **Swarm & Agents**: `swarm_init`, `swarm_scale`, `agent_spawn`, `task_orchestrate`
- **Sandboxes**: `sandbox_create`, `sandbox_execute`, `sandbox_upload` (cloud execution)
- **Templates**: `template_list`, `template_deploy` (pre-built project templates)
- **Neural AI**: `neural_train`, `neural_patterns`, `seraphina_chat` (AI assistant)
- **GitHub**: `github_repo_analyze`, `github_pr_manage` (repository management)
- **Real-time**: `execution_stream_subscribe`, `realtime_subscribe` (live monitoring)
- **Storage**: `storage_upload`, `storage_list` (cloud file management)

**Authentication Required:**
- Register: `mcp__flow-nexus__user_register` or `npx flow-nexus@latest register`
- Login: `mcp__flow-nexus__user_login` or `npx flow-nexus@latest login`
- Access 70+ specialized MCP tools for advanced orchestration

### Agent Execution Flow

#### The Correct Pattern:

1. **Optional**: Use MCP tools to set up coordination topology
2. **REQUIRED**: Use Claude Code's Task tool to spawn agents that do actual work
3. **REQUIRED**: Each agent runs hooks for coordination
4. **REQUIRED**: Batch all operations in single messages

#### Example Full-Stack Development:

```javascript
// Single message with all agent spawning via Claude Code's Task tool
[Parallel Agent Execution]:
  Task("Backend Developer", "Build REST API with Express. Use hooks for coordination.", "backend-dev")
  Task("Frontend Developer", "Create React UI. Coordinate with backend via memory.", "coder")
  Task("Database Architect", "Design PostgreSQL schema. Store schema in memory.", "code-analyzer")
  Task("Test Engineer", "Write Jest tests. Check memory for API contracts.", "tester")
  Task("DevOps Engineer", "Setup Docker and CI/CD. Document in memory.", "cicd-engineer")
  Task("Security Auditor", "Review authentication. Report findings via hooks.", "reviewer")

  // All todos batched together
  TodoWrite { todos: [...8-10 todos...] }

  // All file operations together
  Write "backend/server.js"
  Write "frontend/App.jsx"
  Write "database/schema.sql"
```

> **📖 For more examples**, see `docs/SPARC_EXAMPLES.md` (human reference only)

### Agent Coordination Protocol

#### Every Agent Spawned via Task Tool MUST:

**1️⃣ BEFORE Work:**
```bash
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"
```

**2️⃣ DURING Work:**
```bash
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]"
```

**3️⃣ AFTER Work:**
```bash
npx claude-flow@alpha hooks post-task --task-id "[task]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

### Concurrent Execution Examples

#### ✅ CORRECT WORKFLOW: MCP Coordinates, Claude Code Executes

```javascript
// Step 1: MCP tools set up coordination (optional, for complex tasks)
[Single Message - Coordination Setup]:
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 6 }
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }

// Step 2: Claude Code Task tool spawns ACTUAL agents that do the work
[Single Message - Parallel Agent Execution]:
  // Claude Code's Task tool spawns real agents concurrently
  Task("Research agent", "Analyze API requirements and best practices. Check memory for prior decisions.", "researcher")
  Task("Coder agent", "Implement REST endpoints with authentication. Coordinate via hooks.", "coder")
  Task("Database agent", "Design and implement database schema. Store decisions in memory.", "code-analyzer")
  Task("Tester agent", "Create comprehensive test suite with 90% coverage.", "tester")
  Task("Reviewer agent", "Review code quality and security. Document findings.", "reviewer")

  // Batch ALL todos in ONE call
  TodoWrite { todos: [
    {id: "1", content: "Research API patterns", status: "in_progress", priority: "high"},
    {id: "2", content: "Design database schema", status: "in_progress", priority: "high"},
    {id: "3", content: "Implement authentication", status: "pending", priority: "high"},
    {id: "4", content: "Build REST endpoints", status: "pending", priority: "high"},
    {id: "5", content: "Write unit tests", status: "pending", priority: "medium"},
    {id: "6", content: "Integration tests", status: "pending", priority: "medium"},
    {id: "7", content: "API documentation", status: "pending", priority: "low"},
    {id: "8", content: "Performance optimization", status: "pending", priority: "low"}
  ]}

  // Parallel file operations
  Bash "mkdir -p app/{src,tests,docs,config}"
  Write "app/package.json"
  Write "app/src/server.js"
  Write "app/tests/server.test.js"
  Write "app/docs/API.md"
```

#### ❌ WRONG (Multiple Messages):
```javascript
Message 1: mcp__claude-flow__swarm_init
Message 2: Task("agent 1")
Message 3: TodoWrite { todos: [single todo] }
Message 4: Write "file.js"
// This breaks parallel coordination!
```

### Performance Benefits

- **84.8% SWE-Bench solve rate**
- **32.3% token reduction**
- **2.8-4.4x speed improvement**
- **27+ neural models**

### Hooks Integration

#### Pre-Operation
- Auto-assign agents by file type
- Validate commands for safety
- Prepare resources automatically
- Optimize topology by complexity
- Cache searches

#### Post-Operation
- Auto-format code
- Train neural patterns
- Update memory
- Analyze performance
- Track token usage

#### Session Management
- Generate summaries
- Persist state
- Track metrics
- Restore context
- Export workflows

### Advanced Features (v2.0.0)

- 🚀 Automatic Topology Selection
- ⚡ Parallel Execution (2.8-4.4x speed)
- 🧠 Neural Training
- 📊 Bottleneck Analysis
- 🤖 Smart Auto-Spawning
- 🛡️ Self-Healing Workflows
- 💾 Cross-Session Memory
- 🔗 GitHub Integration

### Integration Tips

1. Start with basic swarm init
2. Scale agents gradually
3. Use memory for context
4. Monitor progress regularly
5. Train patterns from success
6. Enable hooks automation
7. Use GitHub tools first

### Support Resources

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues
- Flow-Nexus Platform: https://flow-nexus.ruv.io (registration required for cloud features)

---

## 📖 REFERENCE DOCUMENTATION - KEYWORD TRIGGERS & SUMMARIES

**CRITICAL**: These files are NOT auto-loaded. When keywords match, you MUST read the full reference file.

---

### 🤖 AGENT REFERENCE - `docs/AGENT_REFERENCE.md`

**KEYWORD TRIGGERS** (If ANY match, READ THE FILE):
`agent`, `agents`, `which agent`, `what agent`, `agent capabilities`, `agent selection`, `spawn agent`, `use agent`, `task tool`, `coder`, `reviewer`, `tester`, `planner`, `researcher`, `backend-dev`, `mobile-dev`, `ml-developer`, `system-architect`, `coordinator`, `swarm`, `hierarchical`, `mesh`, `adaptive`, `raft`, `byzantine`, `consensus`, `crdt`, `gossip`, `quorum`, `github-modes`, `pr-manager`, `issue-tracker`, `release-manager`, `sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`, `tdd-london`, `production-validator`, `migration-planner`

**SUMMARY**:
- **54 agents total** organized in 9 categories
- **Core**: coder, reviewer, tester, planner, researcher
- **Swarm**: hierarchical-coordinator, mesh-coordinator, adaptive-coordinator
- **Consensus**: raft-manager, byzantine-coordinator, gossip-coordinator, crdt-synchronizer
- **GitHub**: pr-manager, code-review-swarm, issue-tracker, release-manager, workflow-automation
- **SPARC**: sparc-coord, sparc-coder, specification, pseudocode, architecture, refinement
- **Specialized**: backend-dev, mobile-dev, ml-developer, cicd-engineer, api-docs, system-architect

**WHEN TO READ**:
- Before spawning ANY agent via Task tool
- When user asks "which agent should I use?"
- When planning multi-agent workflows
- When uncertain about agent capabilities
- When selecting between similar agents

**ACTION**: `Read "docs/AGENT_REFERENCE.md"` then select appropriate agent(s)

---

### 🔄 SPARC EXAMPLES - `docs/SPARC_EXAMPLES.md`

**KEYWORD TRIGGERS** (If ANY match, READ THE FILE):
`sparc`, `specification`, `pseudocode`, `architecture`, `refinement`, `completion`, `tdd`, `test-driven`, `workflow`, `pipeline`, `methodology`, `feature development`, `implementation plan`, `algorithm design`, `system design`, `build feature`, `create api`, `develop`, `full-stack`, `e-commerce`, `blog platform`, `chat system`, `ml pipeline`, `image classification`, `rapid prototype`, `concurrent phase`

**SUMMARY**:
- **SPARC Phases**: Specification → Pseudocode → Architecture → Refinement → Completion
- **Examples included**:
  - Simple feature: User profile picture upload
  - Complex feature: Real-time chat system
  - Full-stack: E-commerce product catalog
  - API development: RESTful blog API
  - ML pipeline: Image classification model
- **Command patterns**: `sparc run`, `sparc tdd`, `sparc pipeline`, `sparc batch`
- **Common patterns**: Rapid prototyping, architecture review, TDD focus, concurrent execution

**WHEN TO READ**:
- Before executing ANY SPARC command
- When user requests TDD workflow
- When planning complex feature development
- When implementing multi-phase projects
- When uncertain about SPARC phase execution
- When user says "build a feature" or "create an API"

**ACTION**: `Read "docs/SPARC_EXAMPLES.md"` then execute SPARC workflow

---

### ⚙️ MCP SETUP GUIDE - `docs/MCP_SETUP_GUIDE.md`

**KEYWORD TRIGGERS** (If ANY match, READ THE FILE):
`mcp`, `setup mcp`, `install mcp`, `configure mcp`, `mcp error`, `mcp not working`, `mcp tools`, `claude-flow`, `ruv-swarm`, `flow-nexus`, `swarm not working`, `agent spawn failed`, `coordination error`, `mcp server`, `authentication`, `sandbox`, `neural training`, `mcp list`, `mcp add`, `mcp remove`, `hooks`, `topology`, `consensus`, `npx claude-flow`, `mcp status`, `connection failed`

**SUMMARY**:
- **3 MCP servers**:
  - **Claude Flow** (REQUIRED): SPARC, swarm coordination, hooks, memory
  - **Ruv-Swarm** (Optional): Enhanced consensus, CRDT, fault tolerance
  - **Flow-Nexus** (Optional): Cloud sandboxes, neural training, marketplace
- **Setup commands**:
  - `claude mcp add claude-flow npx claude-flow@alpha mcp start`
  - `claude mcp add ruv-swarm npx ruv-swarm mcp start`
  - `claude mcp add flow-nexus npx flow-nexus@latest mcp start`
- **Troubleshooting**: Server not found, tools not appearing, authentication failing, slow responses

**WHEN TO READ**:
- When MCP tools are not available
- When user asks about MCP setup
- When swarm coordination fails
- When authentication errors occur
- When MCP server issues reported
- When user mentions installing or configuring MCP

**ACTION**: `Read "docs/MCP_SETUP_GUIDE.md"` then troubleshoot/configure MCP

---

### 📚 QUICK LOOKUP TABLE

| **User Says...** | **Read This File** | **Then Do This** |
|-----------------|-------------------|------------------|
| "Which agent should I use?" | `docs/AGENT_REFERENCE.md` | Select appropriate agent |
| "Build a feature using SPARC" | `docs/SPARC_EXAMPLES.md` | Execute SPARC workflow |
| "MCP not working" | `docs/MCP_SETUP_GUIDE.md` | Troubleshoot MCP setup |
| "Create an API" | `docs/SPARC_EXAMPLES.md` | Follow API development example |
| "Use the backend developer agent" | `docs/AGENT_REFERENCE.md` | Verify backend-dev capabilities |
| "Setup swarm coordination" | `docs/MCP_SETUP_GUIDE.md` | Configure MCP servers |
| "Run TDD workflow" | `docs/SPARC_EXAMPLES.md` | Follow TDD examples |
| "Consensus protocol error" | `docs/MCP_SETUP_GUIDE.md` | Check Ruv-Swarm setup |

---

### 🎯 READING ENFORCEMENT PATTERN

```javascript
// ✅ CORRECT: Keyword detected → Read reference → Execute
User says: "Use the reviewer agent to check my code"

[Single Message]:
  Read "docs/AGENT_REFERENCE.md"  // Verify reviewer capabilities
  Task("Code Reviewer", "Review code for best practices and security", "reviewer")
```

```javascript
// ✅ CORRECT: SPARC keyword → Read examples → Execute
User says: "Build a real-time chat feature using SPARC"

[Single Message]:
  Read "docs/SPARC_EXAMPLES.md"  // Get real-time chat example
  // Then execute SPARC workflow based on examples
```

```javascript
// ✅ CORRECT: MCP issue → Read guide → Troubleshoot
User says: "MCP tools aren't showing up"

[Single Message]:
  Read "docs/MCP_SETUP_GUIDE.md"  // Get troubleshooting steps
  Bash "claude mcp list"  // Verify MCP servers
  // Then provide specific troubleshooting
```

---

### 📁 OTHER TECHNICAL DOCUMENTATION

**Auto-read by Claude Code** (in `.claude/agents/`):
- Individual agent definition files with detailed instructions

**Available for manual reference**:
- `curriculum/` - Learning modules and assessment system
- `docs/API_REFERENCE.md` - Comprehensive API documentation
- `docs/DEVELOPER_GUIDE.md` - Development setup and contribution guidelines

---

**Remember: Claude Flow coordinates, Claude Code creates!**
