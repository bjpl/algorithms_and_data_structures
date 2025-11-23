# ADR-007: Multi-Agent Coordination with MCP/SPARC

## Status
Accepted

## Context

Complex software development tasks benefit from multiple specialized agents working collaboratively:
- Architecture design requires system-level thinking
- Code implementation requires detail-oriented focus
- Testing requires adversarial mindset
- Review requires quality assurance perspective
- Documentation requires clarity and completeness

Traditional single-agent development:
- One perspective on problems
- Limited parallelization
- Sequential task execution
- Bottlenecks on complex decisions
- Single point of failure

Modern AI-assisted development enables:
- Multiple AI agents with specialized roles
- Parallel task execution
- Consensus-based decision making
- Cross-validation and peer review
- Distributed problem-solving

The project needs:
- Coordination mechanism for multiple agents
- Communication protocol between agents
- Task orchestration and distribution
- State management across agents
- Integration with SPARC methodology

## Decision

We will adopt **Multi-Agent Coordination** using Claude Flow's MCP (Model Context Protocol) and SPARC orchestration:

### Coordination Architecture

```
Claude Flow (MCP Coordinator)
├── Agent Swarm Initialization
│   ├── Topology Selection (mesh, hierarchical, adaptive)
│   ├── Agent Role Assignment
│   └── Communication Channels Setup
├── Task Orchestration
│   ├── Task Decomposition
│   ├── Agent Assignment
│   └── Parallel Execution
├── Memory Management
│   ├── Shared State (swarm memory)
│   ├── Agent-Specific Context
│   └── Cross-Session Persistence
└── SPARC Integration
    ├── Phase-Specific Agents
    ├── Multi-Agent Reviews
    └── Consensus Building
```

### Agent Roles (54 Available Agents)

**Core Development Agents**:
- `coder`: Implementation specialist
- `reviewer`: Code quality and security reviewer
- `tester`: Test creation and validation
- `planner`: Task decomposition and planning
- `researcher`: Requirements analysis and research

**SPARC Methodology Agents**:
- `sparc-coord`: Overall SPARC coordination
- `specification`: Requirements and acceptance criteria
- `pseudocode`: Algorithm design
- `architecture`: System architecture and design patterns
- `refinement`: TDD implementation and iteration

**Specialized Agents**:
- `backend-dev`: Backend systems and APIs
- `system-architect`: High-level architecture decisions
- `code-analyzer`: Code analysis and metrics
- `cicd-engineer`: CI/CD pipeline configuration

**Swarm Coordination Agents**:
- `hierarchical-coordinator`: Hierarchical swarm management
- `mesh-coordinator`: Peer-to-peer coordination
- `adaptive-coordinator`: Dynamic topology adaptation
- `consensus-builder`: Multi-agent consensus

See [AGENT_REFERENCE.md](../AGENT_REFERENCE.md) for complete agent catalog.

### Coordination Patterns

#### Pattern 1: Hierarchical Coordination
```
Coordinator Agent
├── Architecture Agent (system design)
├── Backend Agent (API implementation)
├── Frontend Agent (UI implementation)
└── Tester Agent (test creation)
```

**Use Case**: Large features with clear component boundaries

#### Pattern 2: Mesh Coordination (Peer-to-Peer)
```
Coder ←→ Reviewer ←→ Tester
  ↕         ↕         ↕
Researcher ←→ Architect ←→ Documenter
```

**Use Case**: Collaborative design, consensus-building

#### Pattern 3: Pipeline Coordination
```
Specification → Pseudocode → Architecture → Refinement → Completion
```

**Use Case**: SPARC methodology execution

#### Pattern 4: Consensus Coordination
```
Agent 1 (proposal) ─┐
Agent 2 (proposal) ─┼→ Consensus Builder → Final Decision
Agent 3 (proposal) ─┘
```

**Use Case**: Architecture decisions, design reviews

### Integration with SPARC

```bash
# Initialize swarm for SPARC workflow
npx claude-flow swarm init --topology adaptive

# Run SPARC with multi-agent coordination
npx claude-flow sparc pipeline "Build feature X" --agents 5

# Phase-specific agent coordination
npx claude-flow sparc run architect --agents 3  # 3 architects collaborate

# Full-stack development with agents
npx claude-flow swarm assign \
  --agents "backend-dev,coder,tester,reviewer" \
  --task "Build REST API"
```

### Communication Protocol

#### Shared Memory (Swarm Memory)
```python
# Agent writes to memory
memory.store("swarm/design/api_contract", {
  "endpoints": [...],
  "authentication": "JWT"
})

# Another agent reads from memory
api_contract = memory.retrieve("swarm/design/api_contract")
```

#### Hooks Integration
```bash
# Agent A completes task, notifies swarm
npx claude-flow hooks post-task --task-id "design-api"

# Agent B listens for completion
npx claude-flow hooks session-restore --session-id "swarm-123"
```

#### Consensus Protocol
```python
# Agents vote on proposal
votes = [
    ("agent-1", "approve", 0.9),
    ("agent-2", "approve", 0.8),
    ("agent-3", "reject", 0.3)
]

# Consensus builder determines outcome
consensus = ConsensusBuilder.decide(votes, threshold=0.7)
# Result: "approved" (2/3 agents approved with high confidence)
```

## Consequences

### Positive Consequences

1. **Parallel Execution**
   - Multiple agents work simultaneously
   - 2.8-4.4x speed improvement (measured)
   - Reduced wall-clock time for complex tasks
   - Better resource utilization

2. **Specialized Expertise**
   - Each agent optimized for specific role
   - Higher quality outputs
   - Fewer mistakes from lack of expertise
   - Depth in each domain

3. **Cross-Validation**
   - Multiple perspectives on problems
   - Peer review built-in
   - Catch errors earlier
   - Consensus-based decisions

4. **Scalability**
   - Add more agents for larger tasks
   - Scale horizontally
   - Graceful degradation if agents fail
   - Self-healing workflows

5. **Improved Quality**
   - 84.8% SWE-Bench solve rate (measured)
   - Multiple review passes
   - Adversarial testing mindset
   - Comprehensive coverage

6. **Context Preservation**
   - Shared memory across agents
   - Cross-session persistence
   - Historical decisions accessible
   - Learning from past interactions

### Negative Consequences

1. **Complexity Increase**
   - More moving parts
   - Coordination overhead
   - Harder to debug
   - Learning curve for team

2. **Communication Overhead**
   - Agents must synchronize state
   - Memory reads/writes
   - Network latency (if distributed)
   - Potential conflicts

3. **Resource Usage**
   - Multiple agents = more API calls
   - Higher token consumption (offset by parallelization)
   - Memory overhead for swarm state
   - Coordination services needed

4. **Potential Conflicts**
   - Agents may disagree
   - Consensus takes time
   - Deadlock possible
   - Merge conflicts in code

5. **Tooling Dependency**
   - Requires Claude Flow infrastructure
   - MCP servers must be running
   - Node.js environment needed
   - Setup complexity

6. **Observability Challenges**
   - Hard to trace decisions across agents
   - Debug logs scattered
   - Accountability unclear
   - Monitoring complex

## Coordination Workflows

### Workflow 1: Feature Development

```bash
# 1. Initialize swarm
npx claude-flow swarm init --topology mesh --agents 4

# 2. Assign roles
Researcher → Analyze requirements
Architect → Design system structure
Coder → Implement features
Tester → Create test suite

# 3. Execute in parallel
npx claude-flow task orchestrate --parallel

# 4. Review and integrate
Reviewer → Review all outputs
Integration → Merge and deploy
```

### Workflow 2: Architecture Review

```bash
# 3 architects propose designs
Agent 1: Microservices approach
Agent 2: Monolithic approach
Agent 3: Modular monolith approach

# Consensus builder evaluates
- Evaluates trade-offs
- Scores proposals
- Makes recommendation

# Team decides based on consensus
```

### Workflow 3: TDD with Agents

```bash
# Agent 1: Write tests (red phase)
tester → Create comprehensive test suite

# Agent 2: Implement code (green phase)
coder → Minimal implementation to pass tests

# Agent 3: Refactor (refactor phase)
reviewer → Improve code quality, suggest optimizations

# Agent 4: Validate (acceptance)
planner → Verify acceptance criteria met
```

## Agent Selection Guidelines

### When to Use Single Agent
- Simple, well-defined tasks
- Quick fixes and bug fixes
- Documentation updates
- Prototyping and exploration

### When to Use Multiple Agents
- Complex features (multiple components)
- Architecture decisions (benefit from multiple perspectives)
- Large refactorings (parallel work)
- Cross-cutting concerns
- High-risk changes (need validation)

### Recommended Agent Combinations

**Full-Stack Feature**:
- `backend-dev` + `coder` (frontend) + `tester` + `reviewer`

**Architecture Design**:
- `system-architect` + `code-analyzer` + `researcher`

**SPARC Pipeline**:
- `specification` + `pseudocode` + `architecture` + `refinement` (coder+tester)

**Code Review**:
- `reviewer` + `code-analyzer` + `security-manager`

## Alternatives Considered

### Alternative 1: Single Agent Development

**Description**: One AI agent handles all development tasks.

**Pros**:
- Simpler coordination
- No communication overhead
- Single source of truth
- Easier to debug

**Cons**:
- Sequential execution (slower)
- Limited expertise breadth
- No cross-validation
- Single point of failure

**Why Not Chosen**: Single agent is bottleneck. Multi-agent provides speed and quality benefits that outweigh complexity.

### Alternative 2: Human-Only Team Coordination

**Description**: Human developers without AI agents.

**Pros**:
- No AI coordination needed
- Human intuition and creativity
- Direct communication
- Proven approach

**Cons**:
- Much slower
- Higher cost
- Human errors
- Limited availability

**Why Not Chosen**: AI agents augment human capabilities. Hybrid human+AI approach is most effective.

### Alternative 3: Microservices Agent Architecture

**Description**: Each agent as independent service with API.

**Pros**:
- Complete isolation
- Language-agnostic
- Independently scalable
- Fault-tolerant

**Cons**:
- Massive infrastructure overhead
- Network latency
- Complex deployment
- Over-engineered

**Why Not Chosen**: MCP provides lightweight coordination without microservices overhead.

### Alternative 4: Manual Agent Coordination

**Description**: Developers manually coordinate multiple agent invocations.

**Pros**:
- Full control
- No coordination framework needed
- Simple to understand
- Flexible

**Cons**:
- Manual effort required
- Error-prone
- Not scalable
- No state management

**Why Not Chosen**: Claude Flow MCP automates coordination, reducing manual effort and errors.

## Implementation Guidelines

### Initializing Swarm

```bash
# Mesh topology (peer-to-peer)
npx claude-flow swarm init --topology mesh --max-agents 6

# Hierarchical topology (coordinator + workers)
npx claude-flow swarm init --topology hierarchical --coordinator "sparc-coord"

# Adaptive topology (automatically selects best topology)
npx claude-flow swarm init --topology adaptive
```

### Agent Communication

```python
# Agent A writes decision
from claude_flow import Memory

memory = Memory()
memory.store("swarm/decisions/database", {
    "choice": "SQLite",
    "rationale": "...",
    "agent": "architect-1"
})

# Agent B reads decision
db_decision = memory.retrieve("swarm/decisions/database")
```

### Consensus Building

```python
from claude_flow import ConsensusBuilder

# Collect agent proposals
proposals = [
    {"agent": "architect-1", "proposal": "Microservices", "confidence": 0.8},
    {"agent": "architect-2", "proposal": "Monolith", "confidence": 0.9},
    {"agent": "architect-3", "proposal": "Modular", "confidence": 0.85}
]

# Build consensus
consensus = ConsensusBuilder.decide(
    proposals=proposals,
    strategy="weighted_vote",
    threshold=0.75
)
```

### Monitoring Swarm

```bash
# Check swarm status
npx claude-flow swarm status

# View agent metrics
npx claude-flow agent metrics --agent-id "coder-1"

# Monitor task progress
npx claude-flow task status --task-id "feature-123"
```

## Performance Metrics

Based on measured performance:
- **Speed**: 2.8-4.4x faster than single agent
- **Quality**: 84.8% SWE-Bench solve rate
- **Efficiency**: 32.3% token reduction via coordination
- **Parallelization**: 4-6 agents optimal for most tasks

## References

- [Claude Flow Documentation](https://github.com/ruvnet/claude-flow)
- [MCP Specification](https://github.com/anthropics/mcp)
- [Agent Reference](../AGENT_REFERENCE.md)
- [SPARC Examples](../SPARC_EXAMPLES.md)
- [MCP Setup Guide](../MCP_SETUP_GUIDE.md)

## Related ADRs

- [ADR-003: SPARC Methodology](./003-sparc-methodology.md) - SPARC integration
- [ADR-001: Hybrid Technology Stack](./001-hybrid-technology-stack.md) - Node.js for coordination

---

**Date**: 2025-10-09
**Authors**: Development Team
**Reviewers**: System Architect, AI/ML Lead
