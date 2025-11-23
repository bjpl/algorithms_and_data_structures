# Quick Start Guide - Algorithms & Data Structures CLI

> **Platform Choice**: This project supports **both Node.js and Python**. Choose the platform that fits your needs best!

## 🚀 Fastest Way to Start Learning

### Option 1: Node.js Platform (Interactive Modules) ⭐ RECOMMENDED

**Best for**: Interactive learning, modern CLI experience, real-time visualization

```bash
# Prerequisite: Node.js 18+
node --version  # Verify you have Node.js 18 or higher

# One-time setup
npm install

# Launch the platform
npm start

# Or try specific modules
npm run arrays      # Learn arrays through bookshelf analogy
npm run sorting     # Master sorting algorithms
npm run trees       # Understand tree structures
```

### Option 2: Python Platform (Offline Learning)

**Best for**: Offline study, data processing, machine learning features

#### Windows Users (Simplest)
Just double-click the `learn.bat` file in your project folder!

#### Command Line (Any OS)
```bash
# Prerequisite: Python 3.9+
python --version  # Verify you have Python 3.9 or higher

# One-time setup
pip install -r requirements.txt

# Launch the platform
python scripts/run_offline.py

# Alternative launch method
python cli.py --offline
```

### Option 3: SPARC Development Mode (For Developers)

**Best for**: Contributing to the project, using multi-agent workflows

```bash
# Setup MCP servers first
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Explore SPARC commands
npx claude-flow sparc modes

# Use agent-assisted development
npx claude-flow sparc tdd "your feature"

# See CLAUDE.md for comprehensive development guidelines
```

## 📚 What You Can Do

Once the CLI starts, you'll see a menu with these options:

1. **Browse Curriculum** - See all available lessons organized by topic
2. **Continue Learning** - Pick up where you left off
3. **Manage Notes** - Take and review notes for each lesson
4. **View Progress** - Track your learning journey
5. **Practice Problems** - Test your knowledge with exercises
6. **Claude AI Guide** - Tips for using Claude as a learning companion
7. **Settings** - Customize your experience
8. **Advanced Mode** - Access additional features
9. **Interactive Mode** - Engage in hands-on learning

## 🎯 First Time User?

1. Start with option **1** to browse the curriculum
2. Choose **Foundations** module
3. Begin with **Big O Notation** lesson
4. Take notes as you learn (option 3)
5. Test yourself with practice problems (option 5)

## 💡 Learning Path

The curriculum is organized progressively:

**Foundations** → **Data Structures** → **Algorithms** → **Advanced Topics**

Each lesson includes:
- Clear explanations with real-world analogies
- Interactive examples
- Practice problems
- Progress tracking

## 🔧 Troubleshooting

### Node.js Platform Issues

**Error: "node: command not found"**
- Install Node.js 18+ from [nodejs.org](https://nodejs.org/)
- Verify installation: `node --version`

**Error: "npm install" fails**
- Try: `npm install --force`
- Or delete `node_modules` and `package-lock.json`, then retry

**Modules don't run**
- Ensure you ran `npm install` first
- Check Node.js version is 18 or higher

### Python Platform Issues

**Error: "python: command not found"**
- Install Python 3.9+ from [python.org](https://www.python.org/)
- Verify installation: `python --version` or `python3 --version`

**Error: "No module named X"**
- Install dependencies: `pip install -r requirements.txt`
- Try: `pip3 install -r requirements.txt` on some systems

**learn.bat doesn't work**
- Make sure you're on Windows
- Run from command line: `python scripts/run_offline.py`

### SPARC/MCP Issues

**MCP tools not available**
- See [MCP Setup Guide](MCP_SETUP_GUIDE.md) for detailed instructions
- Verify MCP servers: `claude mcp list`

**For more help**: See [User Guide](USER_GUIDE.md) or [Developer Guide](DEVELOPER_GUIDE.md)

## 📝 Features That Work Offline

✅ All lessons and curriculum
✅ Progress tracking
✅ Note-taking system
✅ Practice problems
✅ Interactive learning sessions
✅ Performance statistics
✅ Achievement system

## 🌐 Cloud Features (Optional)

The CLI works perfectly offline. Cloud features are completely optional and include:
- Cross-device sync
- Global leaderboards
- Community challenges

To enable later: `python cli.py --setup-cloud`

## 🎓 Ready to Learn!

You're all set! The CLI is designed to be your personal algorithms tutor, guiding you through computer science fundamentals at your own pace.

**Remember**: Learning algorithms is like learning to cook - start with simple recipes, practice regularly, and soon you'll be creating masterpieces!

Happy Learning! 🚀