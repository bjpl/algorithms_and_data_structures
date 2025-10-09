# Algorithms & Data Structures: Interactive Learning Platform

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![SPARC](https://img.shields.io/badge/Built%20with-SPARC-purple.svg)](CLAUDE.md)

An innovative, **dual-platform** learning system that teaches algorithms and data structures through **intuitive everyday analogies** and **interactive CLI experiences**. Built using the **SPARC methodology** with **Claude Code** and **multi-agent orchestration**.

## 🌟 What Makes This Special

- **🎭 Dual Platform**: Choose Node.js (interactive modules) or Python (offline learning + ML features)
- **🧠 Everyday Analogies**: Complex algorithms explained through familiar concepts
- **🤖 SPARC-Powered**: Developed using systematic Test-Driven Development methodology
- **⚡ Multi-Agent Architecture**: Leverages Claude Code's agent-based development
- **📊 Interactive Learning**: Hands-on exercises with real-time feedback
- **🎯 Progress Tracking**: Your learning journey, visualized and saved

## 🚀 Quick Start

### Option 1: Node.js Platform (Interactive Modules)

**Recommended for**: Interactive learning, modern CLI experience, visualization

```bash
# Prerequisites: Node.js 18+
node --version  # Verify version

# Install dependencies
npm install

# Launch interactive platform
npm start

# Or try specific modules
npm run arrays      # Learn arrays through bookshelf analogy
npm run trees       # Understand trees via organization charts
npm run sorting     # Master sorting with music playlists
```

### Option 2: Python Platform (Offline Learning + ML)

**Recommended for**: Offline study, data processing, machine learning features

```bash
# Prerequisites: Python 3.9+
python --version  # Verify version

# Install dependencies
pip install -r requirements.txt

# Windows users - Double-click this file:
learn.bat

# Or run directly:
python scripts/run_offline.py

# Alternative: Traditional CLI
python main.py
```

### Option 3: SPARC Development Mode

**For developers using Claude Code and multi-agent workflows:**

```bash
# Setup MCP servers (required for SPARC features)
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Explore SPARC methodology
npx claude-flow sparc modes

# Example: Agent-assisted feature development
npx claude-flow sparc tdd "new hash table module"

# See CLAUDE.md for comprehensive development guidelines
```

## 📚 Learning Modules

### Foundation
- **🏗️ Mental Models** - How to think about algorithms (20-30 min)

### Data Structures
- **📚 Arrays** - Organizing books on shelves (45 min)
- **🚂 Linked Lists** - Train cars connected together (50 min)
- **🍽️ Stacks** - Cafeteria plate dispensers (35 min)
- **☕ Queues** - Coffee shop lines (35 min)
- **🏢 Trees** - Organization charts & family trees (60 min)
- **🗺️ Graphs** - City maps & social networks (70 min)

### Algorithms
- **🎵 Sorting** - Organizing music playlists (55 min)
- **📱 Searching** - Finding contacts in your phone (40 min)
- **🪆 Recursion** - Russian nesting dolls (50 min)
- **🚗 Dynamic Programming** - Optimizing road trips (75 min)

## 🎯 Features

### For Learners
- **Intuitive Analogies**: Every concept mapped to real-world experiences
- **Interactive Practice**: Hands-on coding challenges with instant feedback
- **Progress Tracking**: Visual dashboard of your learning journey
- **Multiple Difficulty Levels**: Beginner → Intermediate → Advanced
- **Comprehensive Notes System**: Take notes as you learn

### For Developers
- **SPARC Methodology**: Systematic development using Specification → Pseudocode → Architecture → Refinement → Completion
- **Multi-Agent Orchestration**: Leverage researcher, coder, tester, and reviewer agents
- **MCP Integration**: Claude Flow, Ruv-Swarm, Flow-Nexus for advanced features
- **Test-Driven Development**: Comprehensive test coverage with Jest
- **Clean Architecture**: Modular, extensible, well-documented codebase

## 🛠️ Technology Stack

### Primary Platform (Node.js)
- **Runtime**: Node.js 18+ with ES Modules
- **UI Libraries**: Chalk, Inquirer, CLI-Table3
- **Testing**: Jest with comprehensive coverage
- **Development**: ESLint, TypeScript definitions

### Secondary Platform (Python)
- **Runtime**: Python 3.9+
- **Data Science**: NumPy, Pandas, SciPy
- **Machine Learning**: scikit-learn, TensorFlow (optional)
- **CLI**: Click, Rich, Colorama
- **Database**: SQLAlchemy, Alembic

### Development Infrastructure
- **SPARC Methodology**: Claude Flow orchestration
- **MCP Servers**: Claude Flow (required), Ruv-Swarm (optional), Flow-Nexus (optional)
- **Version Control**: Git with meaningful commits
- **CI/CD**: Automated testing and deployment

## 📖 Documentation

### For Users
- **[Quick Start Guide](docs/QUICK_START.md)** - Get running in 5 minutes
- **[User Guide](docs/USER_GUIDE.md)** - Comprehensive learning guide
- **[Practice Problems](docs/PRACTICAL_LEARNING_WORKFLOW.md)** - Hands-on exercises

### For Developers
- **[CLAUDE.md](CLAUDE.md)** - **START HERE** - Mandatory development directives & SPARC methodology
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Setup, architecture, contribution guidelines
- **[SPARC Examples](docs/SPARC_EXAMPLES.md)** - Real-world SPARC workflow examples
- **[Agent Reference](docs/AGENT_REFERENCE.md)** - 54 available agents and their capabilities
- **[MCP Setup Guide](docs/MCP_SETUP_GUIDE.md)** - Configure Claude Flow, Ruv-Swarm, Flow-Nexus
- **[Contributing Guide](.github/CONTRIBUTING.md)** - How to contribute effectively

### Technical Reference
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and patterns
- **[Testing Guide](docs/TESTING_DOCUMENTATION.md)** - Test strategy and best practices

## 🤝 Contributing

We welcome contributions! This project uses **SPARC methodology** with **multi-agent orchestration** for systematic development.

**Key Guidelines:**
1. **Read [CLAUDE.md](CLAUDE.md) first** - Contains mandatory directives
2. **Use SPARC workflow** - See [docs/SPARC_EXAMPLES.md](docs/SPARC_EXAMPLES.md)
3. **Leverage agents** - Use Task tool for parallel development
4. **Test-Driven Development** - Write tests before implementation
5. **Follow [Contributing Guide](.github/CONTRIBUTING.md)** - Detailed process

**Quick Contribution Workflow:**
```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/algorithms_and_data_structures.git

# Create feature branch
git checkout -b feature/your-feature-name

# Use SPARC methodology for development
npx claude-flow sparc tdd "your feature"

# Run tests
npm test  # Node.js tests
python -m pytest  # Python tests

# Submit pull request
```

## 🎓 Learning Philosophy

This platform is built on three core principles:

1. **Analogies Over Abstractions**: Every algorithm maps to something you already understand
2. **Active Over Passive**: Learn by doing, not just reading
3. **Progressive Over Overwhelming**: Start simple, add complexity gradually

**Example**: Arrays aren't "contiguous memory blocks with O(1) access" - they're **bookshelves where you can instantly grab any book if you know its position**.

## 🌐 SPARC Methodology

This project demonstrates **SPARC** (Specification, Pseudocode, Architecture, Refinement, Completion) methodology in action:

- **84.8% SWE-Bench solve rate** - Proven systematic approach
- **Multi-agent coordination** - Parallel development with researcher, coder, tester agents
- **Test-Driven Development** - Tests first, implementation second
- **Comprehensive documentation** - Every decision explained

**Learn more**: See [CLAUDE.md](CLAUDE.md) for full methodology documentation

## 📊 Project Stats

- **54 Available Agents** for development (see [docs/AGENT_REFERENCE.md](docs/AGENT_REFERENCE.md))
- **11 Learning Modules** from foundations to advanced topics
- **50+ Practice Problems** with automated validation
- **Comprehensive Test Coverage** for quality assurance
- **10+ Hours of Content** structured learning path

## 🔗 Quick Links

- **📘 [Getting Started](docs/QUICK_START.md)** - Launch in 5 minutes
- **🎯 [CLAUDE.md](CLAUDE.md)** - Development directives (developers start here!)
- **🤖 [SPARC Examples](docs/SPARC_EXAMPLES.md)** - See SPARC methodology in action
- **📚 [Full Documentation](docs/README.md)** - Complete documentation hub
- **🐛 [Issue Tracker](https://github.com/your-org/algorithms_and_data_structures/issues)** - Report bugs or request features

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with **Claude Code** and **SPARC methodology**
- Powered by **Claude Flow**, **Ruv-Swarm**, and **Flow-Nexus** MCP servers
- Inspired by everyday experiences and real-world analogies
- Community-driven development with multi-agent coordination

---

**Ready to learn algorithms the intuitive way?** 🚀

```bash
# Node.js Platform
npm start

# Python Platform
python scripts/run_offline.py

# Or just double-click learn.bat (Windows)
```

**For developers**: Start with [CLAUDE.md](CLAUDE.md) to understand the SPARC methodology and mandatory development directives!
