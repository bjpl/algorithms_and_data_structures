# Algorithms and Data Structures: Interactive Learning Platform

A dual-platform learning system that teaches algorithms and data structures through intuitive everyday analogies and interactive CLI experiences.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Learning Modules](#learning-modules)
- [Technology Stack](#technology-stack)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Overview

An innovative dual-platform learning system that teaches algorithms and data structures through intuitive everyday analogies and interactive CLI experiences. Built using the SPARC methodology with Claude Code and multi-agent orchestration.

The platform offers two implementation options: Node.js for interactive modules and modern CLI experience, or Python for offline learning with machine learning features. Both platforms utilize systematic Test-Driven Development methodology for robust, maintainable code.

## Features

### For Learners
- Intuitive analogies mapping complex concepts to real-world experiences
- Interactive practice with hands-on coding challenges and instant feedback
- Progress tracking with visual dashboard
- Multiple difficulty levels from beginner to advanced
- Comprehensive notes system

### For Developers
- SPARC methodology for systematic development
- Multi-agent orchestration with researcher, coder, tester, and reviewer agents
- MCP integration with Claude Flow, Ruv-Swarm, and Flow-Nexus
- Test-driven development with comprehensive coverage
- Clean architecture with modular, extensible codebase

## Technical Overview

This project demonstrates educational software engineering through an innovative dual-platform learning system that makes complex computer science concepts accessible through everyday analogies and interactive experiences.

**Key Technologies:**
- Node.js 18+ with ES Modules for modern JavaScript runtime
- Python 3.9+ for offline learning capabilities
- React for interactive user interfaces
- Chalk, Inquirer, and cli-table3 for rich CLI experiences
- Jest 29.7 with comprehensive test coverage
- SPARC methodology for systematic development

**Implementation Highlights:**
- Intuitive analogies mapping abstract data structures to real-world concepts
- Interactive CLI with hands-on coding challenges and instant feedback
- Multi-agent orchestration using researcher, coder, tester, and reviewer agents
- Test-driven development with comprehensive test coverage
- Clean architecture enabling platform-agnostic learning modules
- Progressive difficulty levels from beginner to advanced

## Exploring the Code

The project showcases dual-platform architecture with modular design:

```
algorithms_and_data_structures/
├── src/                    # Platform-agnostic source code
├── tests/                  # Comprehensive test suite
└── docs/                   # Educational documentation
    ├── QUICK_START.md      # Getting started guide
    ├── USER_GUIDE.md       # Learning path documentation
    ├── DEVELOPER_GUIDE.md  # Technical implementation details
    └── SPARC_EXAMPLES.md   # SPARC methodology examples
```

**Learning Modules Demonstrate:**
- Mental Models - Algorithm thinking patterns (20-30 min)
- Data Structures - Arrays, Linked Lists, Stacks, Queues, Trees, Graphs (35-70 min each)
- Algorithms - Sorting, Searching, Recursion, Dynamic Programming (40-75 min each)

**Development Practices:**
- SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology
- Multi-agent collaboration with MCP integration
- Systematic Test-Driven Development approach
- Clean code principles with modular, extensible architecture

**For Technical Review:**

Those interested in the implementation details can explore:
- `/src` for interactive module implementations
- `/tests` for TDD test suite
- `/docs/DEVELOPER_GUIDE.md` for architecture decisions
- `/docs/SPARC_EXAMPLES.md` for methodology examples

<details>
<summary>Local Development Setup (Optional)</summary>

**Node.js Platform:**
```bash
# Clone repository
git clone https://github.com/bjpl/algorithms_and_data_structures.git
cd algorithms_and_data_structures

# Install dependencies
npm install

# Launch interactive platform
npm start

# Or try specific modules
npm run arrays      # Arrays through bookshelf analogy
npm run trees       # Trees via organization charts
npm run sorting     # Sorting with music playlists
```

**Python Platform (Offline Learning):**
```bash
# Install dependencies
pip install -r requirements.txt

# Run offline learning
python scripts/run_offline.py
```

**SPARC Development Mode:**
```bash
# Explore SPARC methodology
npx claude-flow sparc modes

# Example: Agent-assisted development
npx claude-flow sparc tdd "new feature"
```

</details>

## Project Structure

```
algorithms_and_data_structures/
├── src/                    # Source code
├── tests/                  # Test suite
├── docs/                   # Documentation
│   ├── QUICK_START.md
│   ├── USER_GUIDE.md
│   ├── DEVELOPER_GUIDE.md
│   ├── SPARC_EXAMPLES.md
│   └── API_REFERENCE.md
├── CLAUDE.md              # Development directives
└── README.md              # Project overview
```

## Learning Modules

### Foundation
- Mental Models - How to think about algorithms (20-30 min)

### Data Structures
- Arrays - Organizing books on shelves (45 min)
- Linked Lists - Train cars connected together (50 min)
- Stacks - Cafeteria plate dispensers (35 min)
- Queues - Coffee shop lines (35 min)
- Trees - Organization charts and family trees (60 min)
- Graphs - City maps and social networks (70 min)

### Algorithms
- Sorting - Organizing music playlists (55 min)
- Searching - Finding contacts in your phone (40 min)
- Recursion - Russian nesting dolls (50 min)
- Dynamic Programming - Optimizing road trips (75 min)

## Technology Stack

### Primary Platform (Node.js)
- Runtime: Node.js 18+ with ES Modules
- UI Libraries: Chalk 5.6, Inquirer 9.3, cli-table3 0.6
- Testing: Jest 29.7 with comprehensive test coverage
- Development: TypeScript 5.3 definitions, ESLint

### Development Infrastructure
- Version Control: Git with meaningful commits
- CI/CD: GitHub Actions pipeline for automated testing
- Module System: ESM (ES Modules) for modern JavaScript
- Documentation: Technology stack analysis available

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run tests
npm run test:coverage    # Generate coverage report
npm run test:watch       # Run tests in watch mode

# Code Quality
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run typecheck        # Type checking
```

## Contributing

Contributions are welcome. This project uses SPARC methodology with multi-agent orchestration for systematic development.

### Key Guidelines
1. Read CLAUDE.md first - Contains mandatory directives
2. Use SPARC workflow
3. Leverage agents using Task tool for parallel development
4. Test-driven development - Write tests before implementation
5. Follow Contributing Guide

### Quick Contribution Workflow

```bash
# Fork and clone the repository
git clone https://github.com/bjpl/algorithms_and_data_structures.git

# Create feature branch
git checkout -b feature/your-feature-name

# Use SPARC methodology for development
npx claude-flow sparc tdd "your feature"

# Run tests
npm test  # Node.js tests
python -m pytest  # Python tests

# Submit pull request
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
