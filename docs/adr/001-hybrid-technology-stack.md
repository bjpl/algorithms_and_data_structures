# ADR-001: Hybrid Technology Stack (Node.js + Python)

## Status
Accepted

## Context

The Algorithms and Data Structures Learning Platform requires both:
1. A robust CLI and learning management system with complex business logic
2. Integration with modern AI/ML tools and orchestration frameworks
3. Rich terminal UI capabilities for interactive learning
4. External integrations with npm-based tools (Claude Flow, MCP servers)

The project needs to balance development velocity, maintainability, library ecosystems, and integration requirements.

## Decision

We will use a **hybrid technology stack**:

### Python (Primary Language)
- **Core application**: CLI, business logic, data models
- **Use cases**: Learning system, curriculum management, progress tracking, terminal UI
- **Key libraries**: Rich (terminal UI), Click (CLI), SQLAlchemy (database), pytest (testing)
- **Location**: `src/` directory

### Node.js (Integration Layer)
- **Orchestration**: SPARC methodology, multi-agent coordination
- **Use cases**: Claude Flow integration, MCP server communication, swarm coordination
- **Key libraries**: Claude Flow, MCP tools, task orchestration
- **Location**: Root-level scripts, `coordination/` directory

### Communication Between Languages
- File-based communication (JSON, SQLite database)
- Subprocess execution (Python calls npm commands)
- Shared configuration files
- Memory/state management via Claude Flow

## Consequences

### Positive Consequences

1. **Best of Both Ecosystems**
   - Python's rich CLI/terminal libraries (Rich, Prompt Toolkit)
   - Node.js's AI/ML orchestration tools (Claude Flow, MCP)
   - Each language used for its strengths

2. **Better Library Support**
   - Python: Scientific computing, data processing, terminal UI
   - Node.js: Modern AI tooling, real-time coordination, npm ecosystem

3. **Developer Experience**
   - Python: Easier to write business logic, better for beginners
   - Node.js: Necessary for Claude Flow and MCP integration
   - Clear separation of concerns

4. **Future Extensibility**
   - Can add Python ML libraries (scikit-learn, pandas) easily
   - Can integrate Node.js services (web APIs, cloud platforms)
   - Plugin architecture works in both languages

### Negative Consequences

1. **Increased Complexity**
   - Two dependency management systems (pip + npm)
   - Two testing frameworks (pytest + Jest)
   - Two linting/formatting setups (pylint/black + ESLint/Prettier)
   - Developers need knowledge of both languages

2. **Build Process Overhead**
   - Must manage both Python virtual environment and node_modules
   - CI/CD must install and test both stacks
   - Setup scripts more complex

3. **Integration Challenges**
   - Inter-process communication required
   - Type safety breaks at language boundary
   - Debugging across language boundaries harder
   - Shared state management more complex

4. **Deployment Considerations**
   - Must package both Python and Node.js runtimes
   - Larger distribution size
   - More potential dependency conflicts

## Alternatives Considered

### Alternative 1: Python Only

**Description**: Implement entire system in Python, including Claude Flow-like orchestration.

**Pros**:
- Single language, simpler stack
- Easier dependency management
- Better type safety across codebase
- Simpler CI/CD

**Cons**:
- Would need to reimplement Claude Flow functionality
- MCP server integration more difficult
- Lose npm ecosystem for AI tools
- Significant development time for orchestration

**Why Not Chosen**: Claude Flow and MCP are essential for the SPARC methodology and multi-agent coordination. Reimplementing would be substantial effort and maintain compatibility issues.

### Alternative 2: Node.js Only

**Description**: Implement entire system in Node.js/TypeScript.

**Pros**:
- Single language, simpler stack
- Native Claude Flow integration
- Modern async/await patterns
- Good for web services

**Cons**:
- Weaker terminal UI libraries (Ink not as mature as Rich)
- Less mature CLI frameworks compared to Click
- Weaker data science ecosystem
- Team more familiar with Python for educational content

**Why Not Chosen**: Python's Rich library provides superior terminal UI capabilities, and the learning system business logic is more naturally expressed in Python. The terminal UX is critical for the user experience.

### Alternative 3: Microservices Architecture

**Description**: Separate Python and Node.js into independent services communicating via HTTP/gRPC.

**Pros**:
- Complete separation of concerns
- Independently deployable
- Language-agnostic communication
- Scalable architecture

**Cons**:
- Massive overhead for a CLI tool
- Network latency between services
- Complex local development setup
- Over-engineered for current scale

**Why Not Chosen**: The application is a CLI tool, not a distributed system. Microservices architecture would add unnecessary complexity without meaningful benefits at current scale.

## Implementation Guidelines

### When to Use Python
- Business logic and domain models
- Database operations
- Terminal UI components
- CLI command implementations
- Data processing and analysis
- User-facing features

### When to Use Node.js
- Claude Flow orchestration
- MCP server communication
- Multi-agent coordination
- SPARC methodology execution
- Integration scripts
- Build/deployment automation

### Integration Patterns
```python
# Python calling Node.js
import subprocess
result = subprocess.run(['npx', 'claude-flow', 'sparc', 'run', 'spec'],
                       capture_output=True, text=True)
```

```javascript
// Node.js calling Python
const { spawn } = require('child_process');
const python = spawn('python', ['src/main.py', '--command', 'list']);
```

## References

- [Claude Flow Documentation](https://github.com/ruvnet/claude-flow)
- [Rich Terminal Library](https://rich.readthedocs.io/)
- [MCP (Model Context Protocol)](https://github.com/anthropics/mcp)
- [SPARC Methodology](../SPARC_EXAMPLES.md)

## Related ADRs

- [ADR-003: SPARC Methodology](./003-sparc-methodology.md)
- [ADR-007: Multi-Agent Coordination](./007-multi-agent-coordination.md)

---

**Date**: 2025-10-09
**Authors**: Development Team
**Reviewers**: System Architect
