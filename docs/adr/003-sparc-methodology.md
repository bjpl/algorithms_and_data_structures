# ADR-003: SPARC Methodology for Development

## Status
Accepted

## Context

Software development requires a systematic approach to turn requirements into working code. Traditional approaches often lack structure, leading to:
- Unclear requirements and specifications
- Jumping straight to implementation without planning
- Missed edge cases and corner cases
- Poor architectural decisions
- Technical debt accumulation
- Difficulty onboarding new developers

The project needs a methodology that:
- Structures the development process
- Ensures thorough planning before implementation
- Integrates well with TDD
- Supports AI-assisted development
- Provides clear deliverables at each phase
- Scales from simple features to complex systems

## Decision

We will adopt the **SPARC methodology** as our standard development process, integrated with Claude Flow orchestration and multi-agent coordination.

### SPARC Phases

**S - Specification**: Define requirements, acceptance criteria, and constraints
**P - Pseudocode**: Design algorithms and logic flows in plain language
**A - Architecture**: Design system structure, components, and interactions
**R - Refinement**: Implement with TDD, iterative improvement
**C - Completion**: Integration, testing, documentation, deployment

### Phase Details

#### 1. Specification Phase
**Deliverables**:
- Functional requirements document
- User stories and acceptance criteria
- Non-functional requirements
- Constraints and assumptions
- Success metrics

**Tools**: `npx claude-flow sparc run spec`

**Example Output**:
```markdown
## Feature: Curriculum Export

### Functional Requirements
- Users can export curriculum in CSV or JSON format
- Export includes all lessons, modules, and metadata
- Large exports handled efficiently (streaming)

### Acceptance Criteria
- Export completes in < 5 seconds for 100 lessons
- Valid JSON/CSV format
- Handles unicode characters properly
- Error messages for failures

### Constraints
- Must work with existing database schema
- No external dependencies
- CLI-only interface
```

#### 2. Pseudocode Phase
**Deliverables**:
- Algorithm designs in plain language
- Logic flows for complex operations
- Edge case handling
- Performance considerations

**Tools**: `npx claude-flow sparc run pseudocode`

**Example Output**:
```
FUNCTION export_curriculum(curriculum_id, format):
    1. Validate input parameters
       - Check curriculum_id exists
       - Verify format is 'csv' or 'json'

    2. Fetch curriculum data
       - Get curriculum with all nested content
       - Include lessons, modules, metadata

    3. Transform data for export
       IF format == 'json':
           - Convert to JSON structure
           - Handle datetime serialization
       ELSE IF format == 'csv':
           - Flatten nested structure
           - Create header row
           - Generate data rows

    4. Write to file
       - Use streaming for large datasets
       - Handle write errors gracefully

    5. Return file path or error
```

#### 3. Architecture Phase
**Deliverables**:
- System architecture diagrams
- Component responsibilities
- Data flow diagrams
- API contracts
- Database schema changes
- Integration points

**Tools**: `npx claude-flow sparc run architect`

**Example Output**:
```
Components:
1. ExportCommand (CLI interface)
2. CurriculumExportService (business logic)
3. ExportFormatter (format-specific serialization)
4. StreamingWriter (file I/O)

Data Flow:
User → ExportCommand → CurriculumExportService → CurriculumRepository
                                  ↓
                        ExportFormatter (CSV/JSON)
                                  ↓
                         StreamingWriter → File

Patterns:
- Strategy pattern for format selection
- Repository pattern for data access
- Streaming for large datasets
```

#### 4. Refinement Phase
**Deliverables**:
- Working, tested implementation
- Unit tests (TDD)
- Integration tests
- Code review feedback addressed
- Performance validated

**Tools**: `npx claude-flow sparc tdd`

**Process**:
1. Write failing tests (from specifications)
2. Implement minimal code to pass tests
3. Refactor for quality
4. Repeat until complete

#### 5. Completion Phase
**Deliverables**:
- Integrated feature
- End-to-end tests
- User documentation
- API documentation
- Deployment ready
- Changelog updated

**Tools**: `npx claude-flow sparc run integration`

### Integration with Claude Flow

SPARC methodology is orchestrated via Claude Flow:
```bash
# Full SPARC pipeline
npx claude-flow sparc pipeline "Add curriculum export feature"

# Individual phase
npx claude-flow sparc run spec "Export curriculum to CSV/JSON"

# TDD workflow (Refinement phase)
npx claude-flow sparc tdd "Implement curriculum export"

# Batch processing
npx claude-flow sparc batch spec,pseudocode,architect "Feature X"
```

## Consequences

### Positive Consequences

1. **Structured Development**
   - Clear phases with defined outputs
   - Reduces ambiguity and confusion
   - Easier to track progress
   - Natural checkpoints for review

2. **Better Planning**
   - Think before coding
   - Catch issues early (specification phase)
   - Design validated before implementation
   - Reduces rework and technical debt

3. **AI-Assisted Development**
   - Claude Flow automates phase transitions
   - AI generates specifications, pseudocode, architecture
   - Multi-agent coordination for complex features
   - Consistent quality across team

4. **Documentation Built-In**
   - Each phase produces documentation
   - Specifications, pseudocode, architecture preserved
   - Easier onboarding for new developers
   - Historical context maintained

5. **Reduced Risk**
   - Issues identified in planning phases
   - Edge cases caught early
   - Architecture validated before coding
   - Less expensive to fix problems

6. **Consistent Process**
   - All features developed the same way
   - Predictable timelines
   - Easier code review
   - Knowledge transfer simplified

### Negative Consequences

1. **Overhead for Small Changes**
   - Full SPARC may be excessive for trivial changes
   - Process can feel bureaucratic
   - May slow simple bug fixes
   - Balance needed between rigor and agility

2. **Learning Curve**
   - Team must learn SPARC methodology
   - Claude Flow setup required
   - New tools and commands to master
   - Initial productivity dip

3. **Rigid Process**
   - May not fit all development scenarios
   - Exploration and experimentation harder
   - Can discourage rapid prototyping
   - Needs flexibility for edge cases

4. **Documentation Maintenance**
   - Generated docs must be kept up-to-date
   - Phase outputs can become stale
   - Additional review burden
   - Storage requirements for artifacts

5. **Dependency on Tooling**
   - Claude Flow required for full workflow
   - Node.js environment needed
   - Tool failures block development
   - Vendor lock-in risk

## Alternatives Considered

### Alternative 1: Agile/Scrum Without SPARC

**Description**: Standard Agile/Scrum with user stories, sprints, retrospectives.

**Pros**:
- Industry standard, well understood
- Flexible and adaptive
- Focus on working software
- Regular customer feedback

**Cons**:
- Lacks technical structure within sprints
- Planning often informal
- Architecture decisions ad-hoc
- Less AI-friendly

**Why Not Chosen**: Agile is a project management methodology, not a technical development process. SPARC complements Agile by providing structure within sprint work.

### Alternative 2: Waterfall Development

**Description**: Sequential phases: requirements → design → implementation → testing → deployment.

**Pros**:
- Clear phase boundaries
- Comprehensive documentation
- Predictable timelines
- Well-understood process

**Cons**:
- Inflexible to changes
- Late feedback from testing
- High risk of rework
- Poor fit for iterative development

**Why Not Chosen**: Waterfall is too rigid for modern software development. SPARC provides structure while maintaining flexibility.

### Alternative 3: Informal "Just Write Code"

**Description**: No formal process, developers implement features as they see fit.

**Pros**:
- Maximum flexibility
- Fast for experienced developers
- No process overhead
- Rapid prototyping

**Cons**:
- Inconsistent quality
- Poor documentation
- Knowledge silos
- Difficult to collaborate
- High technical debt

**Why Not Chosen**: Informal processes don't scale. SPARC provides needed structure without excessive overhead.

### Alternative 4: Design Docs + TDD (No SPARC)

**Description**: Write design documents, then TDD implementation, without formal phases.

**Pros**:
- Simpler than SPARC
- Familiar to most developers
- Combines planning and testing
- Less tooling required

**Cons**:
- Design docs often skipped
- No standard structure
- Varies by developer
- Harder to automate with AI

**Why Not Chosen**: Less structured than SPARC, harder to integrate with AI assistance, and design docs often incomplete or outdated.

## Implementation Guidelines

### When to Use Full SPARC

- New features (medium to large)
- Architecture changes
- Complex algorithms
- Cross-cutting concerns
- High-risk changes
- Learning new domain

### When to Skip/Abbreviate SPARC

- Bug fixes (write test, fix bug)
- Trivial changes (typos, simple refactors)
- Documentation updates
- Configuration changes
- Hot fixes (post-mortem after)

### Abbreviated SPARC for Small Features

```bash
# Combined spec + pseudocode
npx claude-flow sparc run spec-pseudocode "Feature"

# Skip architecture for simple changes
npx claude-flow sparc batch spec,refinement "Feature"
```

### SPARC with Multi-Agent Coordination

For complex features, use agent swarms:
```bash
# Initialize swarm topology
npx claude-flow swarm init --topology mesh

# Run SPARC with coordinated agents
npx claude-flow sparc run architect --agents 3
```

Agents collaborate on:
- Specification review
- Architecture design alternatives
- Code review during refinement
- Integration testing

### SPARC Output Storage

```
.sparc/
├── specifications/
│   └── {feature-name}-spec.md
├── pseudocode/
│   └── {feature-name}-pseudo.md
├── architecture/
│   └── {feature-name}-arch.md
└── reports/
    └── {feature-name}-completion.md
```

## Metrics and Monitoring

Track SPARC effectiveness:
- Time spent per phase
- Issues caught in each phase
- Rework percentage
- Test coverage by phase
- Documentation completeness

## Training and Adoption

### Developer Onboarding

1. Read SPARC examples documentation
2. Observe experienced developer using SPARC
3. Pair program with SPARC methodology
4. Solo SPARC for small feature (mentored)
5. Independent work with review

### Resources

- [SPARC Examples Documentation](../SPARC_EXAMPLES.md)
- [Claude Flow SPARC Guide](https://github.com/ruvnet/claude-flow)
- Internal SPARC workshop recordings
- SPARC workflow cheat sheet

## References

- [SPARC Examples](../SPARC_EXAMPLES.md)
- [Claude Flow Documentation](https://github.com/ruvnet/claude-flow)
- [Test-Driven Development](./002-test-driven-development.md)
- [Multi-Agent Coordination](./007-multi-agent-coordination.md)

## Related ADRs

- [ADR-002: Test-Driven Development](./002-test-driven-development.md) - TDD in refinement phase
- [ADR-007: Multi-Agent Coordination](./007-multi-agent-coordination.md) - Agent swarms for SPARC

---

**Date**: 2025-10-09
**Authors**: Development Team
**Reviewers**: System Architect, Tech Lead
