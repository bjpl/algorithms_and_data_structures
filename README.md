# 🎓 Algorithms & Data Structures Learning Environment

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Integrated-purple)](https://claude.ai/code)
[![SPARC](https://img.shields.io/badge/SPARC-Methodology-green)](https://github.com/ruvnet/claude-flow)

A comprehensive, AI-powered learning system for mastering algorithms and data structures through interactive lessons, real-world applications, and intelligent tutoring powered by Claude Code and SPARC methodology.

## 🌟 Features

### 🤖 AI-Powered Learning
- **Claude Code Integration**: Leverage AI assistance for personalized learning experiences
- **SPARC Methodology**: Systematic approach using Specification, Pseudocode, Architecture, Refinement, and Completion
- **Multi-Agent Swarm Coordination**: Distributed learning agents for comprehensive topic coverage
- **Neural Pattern Recognition**: Adaptive learning based on your progress patterns

### 📚 Comprehensive Curriculum
- **7 Learning Modules**: From foundations to advanced applications
- **40+ Algorithms**: Sorting, searching, graph algorithms, dynamic programming, and more
- **25+ Data Structures**: Arrays, lists, trees, graphs, heaps, hash tables, and beyond
- **Real-World Applications**: See how algorithms power Netflix, Google, Uber, and more
- **Interactive Examples**: Hands-on coding exercises with immediate feedback

### 🎯 Learning Features
- **Progress Tracking**: Automatic save/resume functionality with SQLite backend
- **Interactive Lessons**: Step-by-step tutorials with syntax-highlighted code
- **Comprehension Checks**: Built-in quizzes and exercises
- **Note-Taking System**: Integrated markdown notes with HTML export
- **Beautiful CLI**: Rich terminal UI with colors, animations, and responsive design
- **Multi-Language Support**: Examples in Python, JavaScript, Java, and more

### 🛠️ Development Tools
- **Test-Driven Development**: Comprehensive test suite with pytest
- **CI/CD Pipeline**: GitHub Actions for automated testing and deployment
- **MCP Integration**: Model Context Protocol for enhanced AI capabilities
- **Flow Nexus Cloud**: Optional cloud features for distributed computing
- **Extensive Documentation**: API references, guides, and tutorials

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Node.js 16+ (for TypeScript features)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/bjpl/algorithms_and_data_structures.git
cd algorithms_and_data_structures

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies (optional, for advanced features)
npm install

# Run the application
python main.py
```

### Alternative Quick Start Options

```bash
# Windows users
./start.bat

# PowerShell users
./Start-Learning.ps1

# Unix/Linux/Mac users
./install.sh && python main.py
```

## 📖 Usage

### Basic Commands

```bash
# Start learning journey
python main.py

# Navigate menu with arrow keys
# Select lessons with Enter
# Take notes with 'n'
# View progress with 'p'
# Exit with 'q' or Ctrl+C
```

### Advanced Features with Claude Flow

```bash
# Initialize SPARC workflow for TDD
npx claude-flow sparc tdd "implement binary search tree"

# Run comprehensive algorithm analysis
npx claude-flow sparc run analyzer "analyze quicksort complexity"

# Launch multi-agent learning swarm
npx claude-flow swarm init mesh --task "learn graph algorithms"
```

### MCP Server Integration (Optional)

```bash
# Add Claude Flow MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Add Flow Nexus for cloud features (optional)
claude mcp add flow-nexus npx flow-nexus@latest mcp start

# Use with Claude Code
# Type / in Claude Code to see available commands
```

## 📚 Curriculum Overview

### Module 1: Foundations
- Computational Thinking
- Algorithm Analysis
- Big O Notation
- Space-Time Tradeoffs

### Module 2: Core Concepts
- Recursion and Iteration
- Divide and Conquer
- Greedy Algorithms
- Backtracking

### Module 3: Data Structures
- Linear Structures (Arrays, Lists, Stacks, Queues)
- Trees (Binary, BST, AVL, Red-Black, B-Trees)
- Graphs (Directed, Undirected, Weighted)
- Hash Tables and Heaps

### Module 4: Algorithm Patterns
- Sorting (Quick, Merge, Heap, Radix)
- Searching (Binary, DFS, BFS, A*)
- Dynamic Programming
- Graph Algorithms (Dijkstra, Bellman-Ford, Floyd-Warshall)

### Module 5: Problem Solving
- Two Pointers Technique
- Sliding Window
- Fast & Slow Pointers
- Merge Intervals

### Module 6: Implementation
- Test-Driven Development
- Code Optimization
- Debugging Strategies
- Performance Profiling

### Module 7: Real-World Applications
- System Design Patterns
- Database Algorithms
- Network Protocols
- Machine Learning Algorithms

## 🎨 User Interface

The CLI features a beautiful, responsive interface with:
- **Color-coded output** for better readability
- **Progress bars** for tracking completion
- **Syntax highlighting** for code examples
- **Animated transitions** between screens
- **Responsive layout** that adapts to terminal size

## 🧪 Testing

```bash
# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=src

# Run specific test suite
python -m pytest tests/unit/

# Run with verbose output
python -m pytest -v

# Run tests in parallel
python -m pytest -n auto
```

## 📊 Project Structure

```
algorithms_and_data_structures/
├── src/                    # Source code
│   ├── core/              # Core algorithms & data structures
│   ├── ui/                # Terminal UI components
│   ├── commands/          # CLI command handlers
│   ├── services/          # Business logic services
│   ├── models/            # Data models
│   ├── persistence/       # Database & storage
│   ├── utils/             # Utility functions
│   └── integrations/      # External integrations
├── tests/                 # Test suites
├── docs/                  # Documentation
├── curriculum/            # Learning content
├── examples/              # Code examples
├── .claude/               # Claude Code configuration
│   ├── agents/           # AI agent definitions
│   ├── commands/         # Custom commands
│   └── output-styles/    # Learning styles
├── scripts/              # Utility scripts
└── config/               # Configuration files
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Follow PEP 8 for Python code
- Use ESLint configuration for TypeScript
- Write comprehensive tests for new features
- Update documentation as needed

## 📈 Roadmap

- [ ] Web-based interface
- [ ] Mobile application
- [ ] Video tutorials integration
- [ ] Collaborative learning features
- [ ] More programming language examples
- [ ] Advanced visualization tools
- [ ] Competition and leaderboards
- [ ] Certificate generation

## 🏆 Acknowledgments

- **Claude by Anthropic** - AI-powered assistance
- **SPARC Methodology** - Systematic development approach
- **Open Source Community** - For invaluable contributions
- **Algorithm Researchers** - For foundational work

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/bjpl/algorithms_and_data_structures/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bjpl/algorithms_and_data_structures/discussions)
- **Email**: brandon@brandonjplambert.com

## 🔗 Links

- [Documentation](docs/)
- [Claude Code](https://claude.ai/code)
- [SPARC Framework](https://github.com/ruvnet/claude-flow)
- [Flow Nexus Platform](https://flow-nexus.ruv.io)

---

<div align="center">

**Built with ❤️ for learners everywhere**

*Master algorithms, transform your thinking, build the future*

</div>