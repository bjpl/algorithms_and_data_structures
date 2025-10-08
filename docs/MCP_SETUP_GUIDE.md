# MCP Setup Guide

> **Note**: This file provides detailed MCP configuration instructions.
> Quick setup instructions are in CLAUDE.md (auto-loaded).
> Claude Code can read this file on-demand when detailed setup guidance is needed.

---

## Table of Contents

1. [MCP Overview](#mcp-overview)
2. [Prerequisites](#prerequisites)
3. [Claude Flow MCP Setup](#claude-flow-mcp-setup)
4. [Ruv-Swarm MCP Setup](#ruv-swarm-mcp-setup)
5. [Flow-Nexus MCP Setup](#flow-nexus-mcp-setup)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Configuration](#advanced-configuration)

---

## MCP Overview

**MCP** (Model Context Protocol) enables Claude Code to access external tools and services for enhanced capabilities.

**Available MCP Servers**:
- **Claude Flow** (Required) - Core swarm orchestration and SPARC methodology
- **Ruv-Swarm** (Optional) - Enhanced coordination and consensus protocols
- **Flow-Nexus** (Optional) - Cloud-based features (sandboxes, neural training, marketplace)

**Key Distinction**:
- MCP servers provide **coordination and orchestration**
- Claude Code's Task tool handles **actual execution**

---

## Prerequisites

### System Requirements
- Node.js v16+ installed
- npm or yarn package manager
- Claude Code CLI installed
- Terminal/command line access

### Check Installations

```bash
# Verify Node.js
node --version  # Should be v16.0.0 or higher

# Verify npm
npm --version

# Verify Claude Code CLI
claude --version
```

---

## Claude Flow MCP Setup

**Status**: **REQUIRED** - Core functionality for SPARC methodology and swarm orchestration

### Installation

```bash
# Add Claude Flow MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

### What This Provides

**Core Features**:
- SPARC methodology commands
- Multi-agent swarm coordination
- Hooks system for automation
- Memory management across sessions
- Neural pattern training
- Performance analytics

**Available Tools**:
- `swarm_init` - Initialize swarm topology
- `agent_spawn` - Define agent types
- `task_orchestrate` - Orchestrate high-level workflows
- `memory_usage` - Cross-session memory
- `neural_train` - Train patterns from workflows
- `github_swarm` - GitHub integration
- `benchmark_run` - Performance benchmarking

### Verification

```bash
# Verify Claude Flow is installed
claude mcp list

# Expected output should include:
# - claude-flow: npx claude-flow@alpha mcp start

# Test Claude Flow commands
npx claude-flow sparc modes

# Expected: List of SPARC modes (specification, pseudocode, architect, etc.)
```

### Configuration

Claude Flow typically requires no additional configuration. Default settings:

```javascript
{
  "topology": "adaptive",  // Auto-selects best topology
  "maxAgents": 10,         // Default concurrent agents
  "memoryPersistence": true,
  "neuralTraining": false  // Enable manually if desired
}
```

To enable neural training:

```bash
npx claude-flow config set neuralTraining true
```

---

## Ruv-Swarm MCP Setup

**Status**: **OPTIONAL** - Enhanced coordination with consensus protocols

### Installation

```bash
# Add Ruv-Swarm MCP server
claude mcp add ruv-swarm npx ruv-swarm mcp start
```

### What This Provides

**Enhanced Features**:
- Advanced consensus algorithms (Raft, Byzantine, Gossip)
- CRDT synchronization for distributed state
- Dynamic quorum management
- Security hardening for distributed systems
- Load balancing and topology optimization

**Additional Tools**:
- `raft_init` - Initialize Raft consensus
- `byzantine_protect` - Byzantine fault tolerance
- `gossip_protocol` - Gossip-based coordination
- `crdt_sync` - Conflict-free state replication
- `quorum_manage` - Dynamic quorum adjustment

### When to Use Ruv-Swarm

**Use Cases**:
- Distributed systems requiring consensus
- Multi-agent tasks needing fault tolerance
- Critical systems requiring Byzantine fault tolerance
- Large-scale coordination (>20 agents)

**Skip If**:
- Simple single-agent tasks
- Basic SPARC workflows
- Small projects (<5 agents)

### Verification

```bash
# Verify Ruv-Swarm is installed
claude mcp list | grep ruv-swarm

# Test Ruv-Swarm tools
npx ruv-swarm status

# Expected: Ruv-Swarm MCP server running
```

---

## Flow-Nexus MCP Setup

**Status**: **OPTIONAL** - Cloud-based advanced features

### Installation

```bash
# Add Flow-Nexus MCP server
claude mcp add flow-nexus npx flow-nexus@latest mcp start
```

### What This Provides

**Cloud-Based Features**:
- E2B sandbox execution (isolated code environments)
- Neural network training in the cloud
- Application marketplace and templates
- Real-time execution streaming
- Cloud storage integration
- Coding challenges and achievements
- Payment and credit management

**70+ MCP Tools** including:

#### Swarm & Agents
- `swarm_init`, `swarm_scale`, `agent_spawn`, `task_orchestrate`

#### Sandboxes (Cloud Execution)
- `sandbox_create` - Create isolated execution environment
- `sandbox_execute` - Run code in sandbox
- `sandbox_upload` - Upload files to sandbox
- `sandbox_delete` - Clean up sandbox

#### Templates
- `template_list` - Browse available templates
- `template_deploy` - Deploy pre-built projects
- `template_create` - Create custom templates

#### Neural AI
- `neural_train` - Train models on cloud infrastructure
- `neural_patterns` - Extract learned patterns
- `seraphina_chat` - AI assistant integration

#### GitHub
- `github_repo_analyze` - Deep repository analysis
- `github_pr_manage` - Comprehensive PR management

#### Real-time Features
- `execution_stream_subscribe` - Live execution monitoring
- `realtime_subscribe` - Real-time event streams

#### Storage
- `storage_upload`, `storage_list`, `storage_download`

### Authentication Required

Flow-Nexus requires account creation and authentication:

```bash
# Option 1: Register via MCP tool
# (In Claude Code session after adding Flow-Nexus MCP)
Use mcp__flow-nexus__user_register tool with:
- email
- password
- username

# Option 2: Register via CLI
npx flow-nexus@latest register

# Login after registration
# Option 1: Via MCP tool
Use mcp__flow-nexus__user_login tool with credentials

# Option 2: Via CLI
npx flow-nexus@latest login
```

### When to Use Flow-Nexus

**Use Cases**:
- Need cloud-based code execution (sandboxes)
- Training ML models without local GPU
- Deploying from marketplace templates
- Real-time collaboration features
- Cloud storage for project assets

**Skip If**:
- Offline development only
- No need for cloud execution
- Simple local workflows
- Privacy concerns about cloud execution

### Verification

```bash
# Verify Flow-Nexus is installed
claude mcp list | grep flow-nexus

# Check authentication status
npx flow-nexus@latest whoami

# Expected: Your username if logged in
```

---

## Verification

### Verify All MCP Servers

```bash
# List all configured MCP servers
claude mcp list

# Expected output:
# claude-flow: npx claude-flow@alpha mcp start
# ruv-swarm: npx ruv-swarm mcp start (if installed)
# flow-nexus: npx flow-nexus@latest mcp start (if installed)
```

### Test MCP Tool Access

Start a Claude Code session and verify tool access:

```bash
# Start Claude Code
claude

# In Claude Code session, test MCP tools are available
# The tools should appear in your available tools list
```

**Expected MCP Tools** (minimum with Claude Flow):
- `mcp__claude-flow__swarm_init`
- `mcp__claude-flow__agent_spawn`
- `mcp__claude-flow__task_orchestrate`
- `mcp__claude-flow__memory_usage`

---

## Troubleshooting

### Issue: MCP server not found

**Error**: `MCP server 'claude-flow' not found`

**Solutions**:

```bash
# Re-add the MCP server
claude mcp remove claude-flow
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Verify Node.js and npx are accessible
which npx
npx --version
```

### Issue: MCP tools not appearing in Claude Code

**Symptoms**: MCP tools not listed in available tools

**Solutions**:

```bash
# Restart Claude Code session
# Exit current session and start new one
claude

# Verify MCP servers are running
claude mcp status

# Check MCP logs
claude mcp logs claude-flow
```

### Issue: Authentication failing (Flow-Nexus)

**Error**: `Authentication required`

**Solutions**:

```bash
# Re-login
npx flow-nexus@latest login

# Clear credentials and re-authenticate
npx flow-nexus@latest logout
npx flow-nexus@latest login

# Verify credentials
npx flow-nexus@latest whoami
```

### Issue: Slow MCP tool responses

**Symptoms**: MCP tools taking >30 seconds to respond

**Solutions**:

```bash
# Check network connectivity
ping flow-nexus.ruv.io

# Restart MCP servers
claude mcp restart claude-flow

# Clear MCP cache
claude mcp clear-cache
```

### Issue: Version conflicts

**Error**: `Incompatible MCP version`

**Solutions**:

```bash
# Update MCP servers to latest versions
claude mcp update claude-flow
claude mcp update ruv-swarm
claude mcp update flow-nexus

# Or update globally
npm update -g claude-flow ruv-swarm flow-nexus
```

---

## Advanced Configuration

### Custom MCP Server Configuration

Create a configuration file for advanced MCP settings:

**Location**: `~/.claude/mcp-config.json`

```json
{
  "claude-flow": {
    "topology": "hierarchical",
    "maxAgents": 20,
    "memoryPersistence": true,
    "neuralTraining": true,
    "hooks": {
      "preTask": true,
      "postTask": true,
      "postEdit": true
    },
    "performance": {
      "trackMetrics": true,
      "benchmarking": true
    }
  },
  "ruv-swarm": {
    "consensus": "raft",
    "quorumSize": 3,
    "faultTolerance": "byzantine"
  },
  "flow-nexus": {
    "region": "us-west-2",
    "sandboxTimeout": 300000,
    "storageQuota": "10GB"
  }
}
```

### Environment Variables

Set environment variables for MCP configuration:

```bash
# Claude Flow settings
export CLAUDE_FLOW_TOPOLOGY=mesh
export CLAUDE_FLOW_MAX_AGENTS=15
export CLAUDE_FLOW_MEMORY_PERSIST=true

# Flow-Nexus settings
export FLOW_NEXUS_API_KEY=your_api_key
export FLOW_NEXUS_REGION=us-west-2

# Ruv-Swarm settings
export RUV_SWARM_CONSENSUS=raft
export RUV_SWARM_QUORUM_SIZE=3
```

### Proxy Configuration

If behind a corporate proxy:

```bash
# Set proxy environment variables
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# Add MCP servers with proxy
claude mcp add claude-flow npx claude-flow@alpha mcp start --proxy=$HTTP_PROXY
```

### Custom MCP Server Ports

Specify custom ports for MCP servers:

```bash
# Claude Flow on custom port
claude mcp add claude-flow npx claude-flow@alpha mcp start --port=9001

# Ruv-Swarm on custom port
claude mcp add ruv-swarm npx ruv-swarm mcp start --port=9002
```

---

## Performance Optimization

### MCP Server Caching

Enable caching for faster MCP responses:

```bash
# Enable global MCP caching
claude mcp config set cache.enabled true
claude mcp config set cache.ttl 3600  # 1 hour cache

# Per-server caching
npx claude-flow config set cache.enabled true
```

### Connection Pooling

For high-volume MCP usage:

```json
{
  "connectionPool": {
    "minConnections": 2,
    "maxConnections": 10,
    "idleTimeout": 30000
  }
}
```

### Rate Limiting

Configure rate limits to prevent overload:

```bash
# Set rate limits
claude mcp config set rateLimit.requests 100
claude mcp config set rateLimit.window 60000  # per minute
```

---

## Security Best Practices

1. **API Key Management**
   - Store API keys in environment variables
   - Never commit API keys to version control
   - Rotate API keys regularly

2. **Network Security**
   - Use HTTPS for all MCP communication
   - Verify TLS certificates
   - Use VPN for sensitive operations

3. **Access Control**
   - Limit MCP server access to authorized users
   - Use role-based access control (RBAC)
   - Audit MCP tool usage

4. **Data Privacy**
   - Review data sharing policies for cloud MCPs
   - Use local MCPs for sensitive data
   - Encrypt data at rest and in transit

---

## Monitoring & Logging

### Enable MCP Logging

```bash
# Enable debug logging
export CLAUDE_MCP_LOG_LEVEL=debug

# Log to file
export CLAUDE_MCP_LOG_FILE=~/.claude/mcp.log

# View logs
tail -f ~/.claude/mcp.log
```

### Metrics Collection

```bash
# Enable metrics
claude mcp config set metrics.enabled true

# View metrics
claude mcp metrics

# Export metrics
claude mcp metrics export --format=json > mcp-metrics.json
```

---

## Updating MCP Servers

### Update All MCP Servers

```bash
# Update to latest versions
claude mcp update-all

# Or update individually
claude mcp update claude-flow
claude mcp update ruv-swarm
claude mcp update flow-nexus
```

### Version Pinning

Pin specific MCP versions for stability:

```bash
# Pin Claude Flow to specific version
claude mcp add claude-flow npx claude-flow@2.1.0 mcp start

# List available versions
npm show claude-flow versions
```

---

## Removing MCP Servers

### Remove Individual Server

```bash
# Remove Flow-Nexus (example)
claude mcp remove flow-nexus
```

### Remove All MCP Servers

```bash
# Warning: This removes all configured MCP servers
claude mcp clear
```

---

## Quick Reference

### Essential Commands

```bash
# List MCP servers
claude mcp list

# Add MCP server
claude mcp add <name> <command>

# Remove MCP server
claude mcp remove <name>

# Restart MCP server
claude mcp restart <name>

# View MCP logs
claude mcp logs <name>

# Update MCP server
claude mcp update <name>

# MCP server status
claude mcp status
```

### Claude Flow Commands

```bash
# SPARC workflow
npx claude-flow sparc modes
npx claude-flow sparc run <mode> "<task>"
npx claude-flow sparc tdd "<feature>"
npx claude-flow sparc pipeline "<task>"

# Configuration
npx claude-flow config list
npx claude-flow config set <key> <value>

# Hooks management
npx claude-flow hooks setup
npx claude-flow hooks list
```

### Flow-Nexus Commands

```bash
# Authentication
npx flow-nexus@latest register
npx flow-nexus@latest login
npx flow-nexus@latest whoami

# Sandboxes
npx flow-nexus@latest sandbox create
npx flow-nexus@latest sandbox list

# Templates
npx flow-nexus@latest template list
npx flow-nexus@latest template deploy <name>
```

---

**For MCP tool usage in workflows, see CLAUDE.md**
**For complete examples, see docs/SPARC_EXAMPLES.md**
