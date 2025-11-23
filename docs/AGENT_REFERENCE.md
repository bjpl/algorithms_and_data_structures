# Agent Reference Guide

> **Note**: This file is for human reference and detailed documentation. Core agent lists are in CLAUDE.md (auto-loaded).
> Claude Code can read this file on-demand when detailed agent information is needed.

---

## Quick Reference

**Total Agents**: 54
**Categories**: 9 (Core, Swarm, Consensus, Performance, GitHub, SPARC, Specialized, Testing, Migration)

**Most Used Agents**: `coder`, `reviewer`, `tester`, `researcher`, `planner`

---

## Core Development Agents

### coder
**Purpose**: Implementation specialist for writing clean, efficient code
**Best For**: Feature implementation, bug fixes, refactoring
**Location**: `.claude/agents/core/coder.md`

**Key Capabilities**:
- Write production-ready code following best practices
- Implement features based on specifications
- Refactor existing code for better quality
- Follow TDD principles when appropriate

**When to Use**:
- Implementing new features
- Writing production code
- Code refactoring tasks

### reviewer
**Purpose**: Code review and quality assurance specialist
**Best For**: Code quality checks, best practice validation, security audits
**Location**: `.claude/agents/core/reviewer.md`

**Key Capabilities**:
- Comprehensive code review
- Security vulnerability detection
- Best practices validation
- Architecture assessment

**When to Use**:
- After implementing significant code changes
- Before merging to main branch
- Security audits

### tester
**Purpose**: Comprehensive testing and quality assurance
**Best For**: Test creation, coverage analysis, test strategy
**Location**: `.claude/agents/core/tester.md`

**Key Capabilities**:
- Write unit, integration, and e2e tests
- Test coverage analysis
- Test strategy development
- Edge case identification

**When to Use**:
- TDD workflow (write tests first)
- Adding test coverage
- Test strategy planning

### planner
**Purpose**: Strategic planning and task orchestration
**Best For**: Breaking down complex tasks, creating roadmaps
**Location**: `.claude/agents/core/planner.md`

**Key Capabilities**:
- Task decomposition
- Dependency identification
- Timeline estimation
- Resource allocation planning

**When to Use**:
- Starting new projects
- Planning complex features
- Sprint planning

### researcher
**Purpose**: Deep research and information gathering
**Best For**: Technology evaluation, best practices research
**Location**: `.claude/agents/core/researcher.md`

**Key Capabilities**:
- Technology stack evaluation
- Best practices research
- Competitive analysis
- Documentation synthesis

**When to Use**:
- Evaluating new technologies
- Architecture decision-making
- Learning new domains

---

## Swarm Coordination Agents

### hierarchical-coordinator
**Purpose**: Queen-led hierarchical swarm coordination
**Best For**: Complex projects with clear task delegation
**Location**: `.claude/agents/swarm/hierarchical-coordinator.md`

**Topology**: Tree structure with central coordinator
**Use Case**: Large projects requiring clear authority structure

### mesh-coordinator
**Purpose**: Peer-to-peer mesh network swarm with distributed decision making
**Best For**: Collaborative tasks requiring fault tolerance
**Location**: `.claude/agents/swarm/mesh-coordinator.md`

**Topology**: Full mesh network, all agents communicate
**Use Case**: Resilient, distributed processing

### adaptive-coordinator
**Purpose**: Dynamic topology switching with self-organizing patterns
**Best For**: Complex, evolving tasks requiring flexibility
**Location**: `.claude/agents/swarm/adaptive-coordinator.md`

**Topology**: Adaptive (switches based on task requirements)
**Use Case**: Projects with changing complexity and scale

---

## Consensus & Distributed Systems Agents

### byzantine-coordinator
**Purpose**: Byzantine fault-tolerant consensus with malicious actor detection
**Best For**: Critical systems requiring highest reliability
**Location**: `.claude/agents/consensus/byzantine-coordinator.md`

**Algorithm**: Byzantine Fault Tolerance (BFT)
**Use Case**: Security-critical distributed systems

### raft-manager
**Purpose**: Raft consensus algorithm with leader election
**Best For**: Distributed systems requiring strong consistency
**Location**: `.claude/agents/consensus/raft-manager.md`

**Algorithm**: Raft consensus
**Use Case**: Distributed databases, configuration management

### gossip-coordinator
**Purpose**: Gossip-based consensus for scalable eventually consistent systems
**Best For**: Large-scale distributed systems
**Location**: `.claude/agents/consensus/gossip-coordinator.md`

**Algorithm**: Gossip protocol
**Use Case**: Large-scale monitoring, peer discovery

### crdt-synchronizer
**Purpose**: Conflict-free Replicated Data Types for eventual consistency
**Best For**: Offline-first applications, collaborative editing
**Location**: `.claude/agents/consensus/crdt-synchronizer.md`

**Algorithm**: CRDTs (Conflict-free Replicated Data Types)
**Use Case**: Collaborative tools, offline-capable apps

### quorum-manager
**Purpose**: Dynamic quorum adjustment and intelligent membership management
**Best For**: Distributed databases and consensus systems
**Location**: `.claude/agents/consensus/quorum-manager.md`

**Algorithm**: Quorum-based consensus
**Use Case**: Distributed storage, voting systems

### security-manager
**Purpose**: Comprehensive security mechanisms for distributed consensus
**Best For**: Security hardening of distributed systems
**Location**: `.claude/agents/consensus/security-manager.md`

**Focus**: Security, authentication, authorization
**Use Case**: Securing distributed protocols

---

## Performance & Optimization Agents

### perf-analyzer
**Purpose**: Performance bottleneck analyzer
**Best For**: Identifying and resolving workflow inefficiencies
**Location**: `.claude/agents/templates/performance-analyzer.md`

**Capabilities**: Profiling, bottleneck detection, optimization recommendations

### performance-benchmarker
**Purpose**: Comprehensive performance benchmarking
**Best For**: Measuring and validating performance improvements
**Location**: `.claude/agents/consensus/performance-benchmarker.md`

**Capabilities**: Benchmark creation, regression detection, performance tracking

### task-orchestrator
**Purpose**: Central coordination for task decomposition and execution planning
**Best For**: Complex multi-step workflows
**Location**: `.claude/agents/templates/orchestrator-task.md`

**Capabilities**: Task planning, dependency management, result synthesis

### memory-coordinator
**Purpose**: Manage persistent memory across sessions
**Best For**: Context preservation, cross-agent memory sharing
**Location**: `.claude/agents/templates/memory-coordinator.md`

**Capabilities**: Memory persistence, context management, state tracking

### smart-agent
**Purpose**: Intelligent agent coordination and dynamic spawning
**Best For**: Adaptive workflow automation
**Location**: `.claude/agents/templates/automation-smart-agent.md`

**Capabilities**: Dynamic agent spawning, intelligent routing, workflow optimization

---

## GitHub & Repository Agents

### github-modes
**Purpose**: Comprehensive GitHub integration modes
**Best For**: Workflow orchestration, PR management, repository coordination
**Location**: `.claude/agents/github/github-modes.md`

**Capabilities**: Multi-mode GitHub operations with batch optimization

### pr-manager
**Purpose**: Comprehensive pull request management
**Best For**: PR creation, review coordination, merge workflows
**Location**: `.claude/agents/github/pr-manager.md`

**Capabilities**: PR lifecycle management, automated reviews, merge coordination

### code-review-swarm
**Purpose**: Specialized AI agents for comprehensive code reviews
**Best For**: Deep code analysis beyond static tools
**Location**: `.claude/agents/github/code-review-swarm.md`

**Capabilities**: Multi-agent review, security analysis, best practices validation

### issue-tracker
**Purpose**: Intelligent issue management and project coordination
**Best For**: Issue tracking, progress monitoring, team coordination
**Location**: `.claude/agents/github/issue-tracker.md`

**Capabilities**: Automated tracking, progress monitoring, team coordination

### release-manager
**Purpose**: Automated release coordination and deployment
**Best For**: Version management, testing, deployment
**Location**: `.claude/agents/github/release-manager.md`

**Capabilities**: Release orchestration, changelog generation, deployment automation

### workflow-automation
**Purpose**: GitHub Actions workflow automation
**Best For**: CI/CD pipeline creation and optimization
**Location**: `.claude/agents/github/workflow-automation.md`

**Capabilities**: Intelligent CI/CD pipelines, adaptive multi-agent coordination

### project-board-sync
**Purpose**: Synchronize AI swarms with GitHub Projects
**Best For**: Visual task management, progress tracking
**Location**: `.claude/agents/github/project-board-sync.md`

**Capabilities**: Project board automation, task synchronization, team coordination

### repo-architect
**Purpose**: Repository structure optimization
**Best For**: Multi-repo management, scalable project architecture
**Location**: `.claude/agents/github/repo-architect.md`

**Capabilities**: Repo structure design, multi-repo coordination

### multi-repo-swarm
**Purpose**: Cross-repository swarm orchestration
**Best For**: Organization-wide automation
**Location**: `.claude/agents/github/multi-repo-swarm.md`

**Capabilities**: Cross-repo coordination, organization-level operations

---

## SPARC Methodology Agents

### sparc-coord
**Purpose**: SPARC methodology orchestrator
**Best For**: Systematic development phase coordination
**Location**: `.claude/agents/templates/sparc-coordinator.md`

**Phases**: Specification → Pseudocode → Architecture → Refinement → Completion

### sparc-coder
**Purpose**: Transform specifications into working code with TDD
**Best For**: SPARC-based implementation
**Location**: `.claude/agents/templates/implementer-sparc-coder.md`

**Capabilities**: Spec-to-code transformation, TDD practices

### specification
**Purpose**: SPARC Specification phase specialist
**Best For**: Requirements analysis
**Location**: `.claude/agents/sparc/specification.md`

**Phase**: Specification (requirements gathering and analysis)

### pseudocode
**Purpose**: SPARC Pseudocode phase specialist
**Best For**: Algorithm design
**Location**: `.claude/agents/sparc/pseudocode.md`

**Phase**: Pseudocode (algorithm design and logic planning)

### architecture
**Purpose**: SPARC Architecture phase specialist
**Best For**: System design
**Location**: `.claude/agents/sparc/architecture.md`

**Phase**: Architecture (system structure and component design)

### refinement
**Purpose**: SPARC Refinement phase specialist
**Best For**: Iterative improvement
**Location**: `.claude/agents/sparc/refinement.md`

**Phase**: Refinement (iterative enhancement and optimization)

---

## Specialized Development Agents

### backend-dev
**Purpose**: Backend API development specialist
**Best For**: REST and GraphQL endpoint development
**Location**: `.claude/agents/development/backend/dev-backend-api.md`

**Capabilities**: API design, database integration, authentication

### mobile-dev
**Purpose**: React Native mobile application development
**Best For**: iOS and Android development
**Location**: `.claude/agents/specialized/mobile/spec-mobile-react-native.md`

**Capabilities**: Cross-platform mobile development, native features

### ml-developer
**Purpose**: Machine learning model development
**Best For**: ML model training and deployment
**Location**: `.claude/agents/data/ml/data-ml-model.md`

**Capabilities**: Model training, inference, MLOps

### cicd-engineer
**Purpose**: CI/CD pipeline creation and optimization
**Best For**: Automated build, test, and deployment pipelines
**Location**: `.claude/agents/devops/ci-cd/ops-cicd-github.md`

**Capabilities**: Pipeline design, automation, optimization

### api-docs
**Purpose**: OpenAPI/Swagger documentation specialist
**Best For**: API documentation creation and maintenance
**Location**: `.claude/agents/documentation/api-docs/docs-api-openapi.md`

**Capabilities**: API spec generation, documentation maintenance

### system-architect
**Purpose**: System architecture design and technical decisions
**Best For**: High-level architectural planning
**Location**: `.claude/agents/analysis/system-design/arch-system-design.md`

**Capabilities**: Architecture design, technology selection, design patterns

### code-analyzer
**Purpose**: Advanced code quality analysis
**Best For**: Comprehensive code reviews and improvements
**Location**: `.claude/agents/analysis/code-analyzer.md`

**Capabilities**: Code quality metrics, refactoring recommendations

### base-template-generator
**Purpose**: Foundational templates and boilerplate generation
**Best For**: Project scaffolding, component templates
**Location**: `.claude/agents/base-template-generator.md`

**Capabilities**: Template generation, boilerplate creation

---

## Testing & Validation Agents

### tdd-london-swarm
**Purpose**: TDD London School specialist for mock-driven development
**Best For**: Outside-in TDD with mocking
**Location**: `.claude/agents/testing/unit/tdd-london-swarm.md`

**Approach**: London School TDD (mockist approach)

### production-validator
**Purpose**: Production validation ensuring deployment-readiness
**Best For**: Pre-deployment validation
**Location**: `.claude/agents/testing/validation/production-validator.md`

**Capabilities**: Deployment readiness checks, validation automation

---

## Migration & Planning Agents

### migration-planner
**Purpose**: Comprehensive migration plan creation
**Best For**: System migrations and upgrades
**Location**: `.claude/agents/templates/migration-plan.md`

**Capabilities**: Migration strategy, risk assessment, rollback planning

### swarm-init
**Purpose**: Swarm initialization and topology optimization
**Best For**: Setting up multi-agent workflows
**Location**: `.claude/agents/templates/coordinator-swarm-init.md`

**Capabilities**: Swarm topology selection, agent coordination setup

---

## Usage Patterns

### Sequential Workflow
```javascript
// Use agents in sequence for complex features
Task("Researcher", "Research best practices for authentication", "researcher")
// Wait for results, then:
Task("Planner", "Create implementation plan based on research", "planner")
// Wait for plan, then:
Task("Coder", "Implement authentication based on plan", "coder")
// After implementation:
Task("Tester", "Write comprehensive tests for authentication", "tester")
Task("Reviewer", "Review authentication implementation", "reviewer")
```

### Parallel Workflow
```javascript
// Use agents in parallel for independent tasks
[Single Message]:
  Task("Backend Dev", "Build REST API", "backend-dev")
  Task("Frontend Dev", "Build UI components", "coder")
  Task("Database Architect", "Design schema", "code-analyzer")
  Task("DevOps", "Setup CI/CD", "cicd-engineer")
```

### Swarm Coordination
```javascript
// For complex, multi-faceted projects
Task("Swarm Init", "Initialize mesh topology for distributed task", "swarm-init")
// Then spawn coordinated agents:
Task("Hierarchical Coordinator", "Manage complex feature development", "hierarchical-coordinator")
```

---

## Agent Selection Guidelines

**For Code Implementation**: `coder`, `backend-dev`, `mobile-dev`, `sparc-coder`

**For Code Quality**: `reviewer`, `code-analyzer`, `production-validator`

**For Testing**: `tester`, `tdd-london-swarm`

**For Planning**: `planner`, `researcher`, `system-architect`

**For GitHub Operations**: `pr-manager`, `github-modes`, `workflow-automation`, `issue-tracker`

**For Performance**: `perf-analyzer`, `performance-benchmarker`

**For Coordination**: `task-orchestrator`, `hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`

**For Distributed Systems**: `raft-manager`, `byzantine-coordinator`, `gossip-coordinator`, `crdt-synchronizer`

---

## Best Practices

1. **Start Simple**: Use core agents (`coder`, `reviewer`, `tester`) for most tasks
2. **Scale Up**: Add specialized agents as complexity increases
3. **Coordinate**: Use swarm coordinators for multi-agent tasks
4. **Test Always**: Include `tester` agent in all feature work
5. **Review Important Code**: Use `reviewer` for critical implementations
6. **Plan Complex Work**: Use `planner` before starting large features

---

**For more information on specific agents, read their definition files in `.claude/agents/`**
