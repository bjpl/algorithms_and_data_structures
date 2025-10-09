# SPARC Workflow Examples

> **Note**: This file provides extended examples of SPARC methodology workflows.
> Core SPARC documentation is in CLAUDE.md (auto-loaded).
> Claude Code can read this file on-demand when detailed examples are needed.

---

## Table of Contents

1. [SPARC Overview](#sparc-overview)
2. [Simple Feature Example](#simple-feature-example)
3. [Complex Feature Example](#complex-feature-example)
4. [Full-Stack Development Example](#full-stack-development-example)
5. [API Development Example](#api-development-example)
6. [Machine Learning Pipeline Example](#machine-learning-pipeline-example)
7. [Common Patterns](#common-patterns)

---

## SPARC Overview

**SPARC Phases**:
1. **S**pecification - Requirements analysis and definition
2. **P**seudocode - Algorithm design and logic planning
3. **A**rchitecture - System structure and component design
4. **R**efinement - Iterative improvement and TDD implementation
5. **C**ompletion - Integration and final validation

---

## Simple Feature Example

### Task: Add User Profile Picture Upload

#### Phase 1: Specification

```bash
npx claude-flow sparc run specification "User profile picture upload feature"
```

**Output**:
```markdown
# Specification: User Profile Picture Upload

## Requirements
- Users can upload profile pictures
- Support JPG, PNG, WebP formats
- Max file size: 5MB
- Images auto-resized to 400x400px
- Store in cloud storage (S3/CloudFlare R2)
- Update user model with image URL

## Constraints
- Must validate file type and size client-side and server-side
- Graceful fallback to default avatar
- Progress indicator during upload

## Success Criteria
- Upload completes in < 5 seconds for 5MB file
- 99.9% upload success rate
- Images properly cached (CDN)
```

#### Phase 2: Pseudocode

```bash
npx claude-flow sparc run pseudocode "User profile picture upload logic"
```

**Output**:
```python
# Pseudocode: Profile Picture Upload

function uploadProfilePicture(file, userId):
    # Validation
    if not isValidImageType(file):
        return error("Invalid file type")

    if file.size > MAX_FILE_SIZE:
        return error("File too large")

    # Processing
    resizedImage = resizeImage(file, 400, 400)
    optimizedImage = optimizeImage(resizedImage)

    # Upload
    uploadUrl = generatePresignedUrl(userId)
    uploadResult = uploadToStorage(optimizedImage, uploadUrl)

    if uploadResult.success:
        imageUrl = uploadResult.publicUrl
        updateUserProfile(userId, imageUrl)
        return success(imageUrl)
    else:
        return error("Upload failed")

function isValidImageType(file):
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    return file.type in allowedTypes

function resizeImage(file, width, height):
    # Use image processing library
    return resized_image

function optimizeImage(image):
    # Compress and optimize
    return optimized_image
```

#### Phase 3: Architecture

```bash
npx claude-flow sparc run architect "Profile picture upload architecture"
```

**Output**:
```markdown
# Architecture: Profile Picture Upload

## Components

### Frontend
- UploadButton component (React)
- ImageCropper component
- ProgressIndicator component
- AvatarDisplay component

### Backend
- POST /api/users/:id/profile-picture endpoint
- Image validation middleware
- S3/R2 upload service
- Image processing service (Sharp/ImageMagick)

### Storage
- Cloud storage bucket (S3/R2)
- CDN for image delivery
- Database field: user.profilePictureUrl

## Data Flow
1. User selects image → Frontend validation
2. Image preview with crop tool → User adjusts
3. Upload request → Backend validation
4. Backend processes → Resize & optimize
5. Upload to cloud storage → Get public URL
6. Update database → Return URL to frontend
7. Frontend displays new avatar

## Error Handling
- Client-side: File type/size validation
- Server-side: Double validation + virus scan
- Upload failures: Retry with exponential backoff
- Storage failures: Fallback to default avatar

## Security
- Presigned URLs with 5-minute expiration
- CORS configuration for upload endpoint
- Content-Type verification
- Virus scanning on upload
```

#### Phase 4: Refinement (TDD)

```bash
npx claude-flow sparc tdd "Profile picture upload feature"
```

**TDD Workflow**:

```javascript
// 1. Write tests first
describe('ProfilePictureUpload', () => {
  test('validates file type', () => {
    const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
    expect(validateImageType(invalidFile)).toBe(false);
  });

  test('validates file size', () => {
    const largeFile = new File(['x'.repeat(6000000)], 'large.jpg', { type: 'image/jpeg' });
    expect(validateFileSize(largeFile)).toBe(false);
  });

  test('resizes image to 400x400', async () => {
    const image = await loadTestImage();
    const resized = await resizeImage(image, 400, 400);
    expect(resized.width).toBe(400);
    expect(resized.height).toBe(400);
  });
});

// 2. Run tests (they fail)
// npm test

// 3. Implement code to pass tests
function validateImageType(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return allowedTypes.includes(file.type);
}

function validateFileSize(file) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  return file.size <= MAX_SIZE;
}

async function resizeImage(file, width, height) {
  const sharp = require('sharp');
  return await sharp(file)
    .resize(width, height, { fit: 'cover' })
    .toBuffer();
}

// 4. Tests pass → Refactor if needed
// 5. Repeat for all functionality
```

#### Phase 5: Completion

```bash
npx claude-flow sparc run integration "Profile picture upload"
```

**Integration Tasks**:
- API endpoint tested with Postman/HTTPie
- Frontend integration tested manually
- E2E tests written and passing
- Documentation updated
- Security review completed
- Performance benchmarks met

---

## Complex Feature Example

### Task: Build Real-Time Chat System

#### Phase 1: Specification

```markdown
# Specification: Real-Time Chat System

## Requirements
- User-to-user private messaging
- Group chat rooms (max 100 members)
- Real-time message delivery (WebSocket)
- Message history persistence
- Read receipts and typing indicators
- File sharing (images, documents)
- Message search functionality

## Technical Constraints
- Support 10,000 concurrent connections
- Message delivery latency < 100ms
- 99.9% uptime SLA
- GDPR compliant (data retention, deletion)

## Non-Functional Requirements
- Horizontal scalability
- Message encryption in transit and at rest
- Offline message queueing
- Mobile app support (React Native)
```

#### Phase 2: Pseudocode

```python
# Message Send Flow
function sendMessage(senderId, recipientId, content, attachments):
    # Validation
    if not isValidUser(senderId) or not isValidUser(recipientId):
        return error("Invalid user")

    # Create message
    message = {
        id: generateId(),
        sender: senderId,
        recipient: recipientId,
        content: encrypt(content),
        attachments: processAttachments(attachments),
        timestamp: now(),
        status: "sent"
    }

    # Persist
    saveToDatabase(message)

    # Real-time delivery
    if isUserOnline(recipientId):
        sendViaWebSocket(recipientId, message)
        updateMessageStatus(message.id, "delivered")
    else:
        queueForOfflineDelivery(recipientId, message)

    return success(message)

# WebSocket Connection Management
function handleWebSocketConnection(socket, userId):
    # Authentication
    if not validateToken(socket.token):
        socket.close()
        return

    # Register connection
    registerActiveConnection(userId, socket)

    # Deliver queued messages
    queuedMessages = getQueuedMessages(userId)
    for message in queuedMessages:
        socket.send(message)
        updateMessageStatus(message.id, "delivered")

    # Handle incoming messages
    socket.on('message', (data) => {
        processIncomingMessage(userId, data)
    })

    # Cleanup on disconnect
    socket.on('disconnect', () => {
        unregisterActiveConnection(userId)
    })
```

#### Phase 3: Architecture

```markdown
# Architecture: Real-Time Chat System

## System Components

### Frontend (React/React Native)
- ChatList component (active conversations)
- ChatWindow component (message thread)
- MessageComposer component (input + attachments)
- WebSocket client (Socket.io)
- Local storage (IndexedDB for offline)

### Backend Services
- WebSocket Server (Node.js + Socket.io)
- REST API (Express.js)
- Message Queue (Redis/RabbitMQ)
- File Storage Service
- Notification Service

### Data Layer
- Primary DB: PostgreSQL (message history, users)
- Cache: Redis (online users, recent messages)
- Object Storage: S3 (file attachments)

### Infrastructure
- Load Balancer (Nginx)
- WebSocket scaling (Redis adapter for Socket.io)
- CDN for static assets
- Monitoring (Prometheus + Grafana)

## Communication Patterns
- WebSocket for real-time messaging
- REST API for message history, search
- Redis Pub/Sub for cross-server WebSocket sync
- Message queue for background jobs (notifications, analytics)

## Scalability Strategy
- Horizontal scaling of WebSocket servers
- Redis cluster for session management
- Database read replicas
- CDN for file attachments
- Rate limiting per user

## Security
- JWT authentication
- TLS 1.3 for all connections
- End-to-end encryption option
- Rate limiting and DDoS protection
- Content scanning for malware
```

#### Phase 4 & 5: Implementation with TDD

```javascript
// Execute full TDD workflow
npx claude-flow sparc tdd "Real-time chat system"

// This orchestrates:
// 1. Unit tests for message validation
// 2. Integration tests for WebSocket connections
// 3. E2E tests for message delivery
// 4. Performance tests for concurrent connections
// 5. Security tests for authentication
```

---

## Full-Stack Development Example

### Task: Build E-Commerce Product Catalog

#### Using Parallel Agent Execution

```javascript
// Step 1: Specification Phase (single agent)
Task("Specification Agent", "Analyze requirements for e-commerce product catalog with filters, search, and pagination", "specification")

// Step 2: Architecture Phase (multiple parallel agents)
[Single Message - Parallel Architecture]:
  Task("Backend Architect", "Design REST API for product catalog", "backend-dev")
  Task("Frontend Architect", "Design React component hierarchy for catalog", "system-architect")
  Task("Database Architect", "Design product schema with search optimization", "code-analyzer")
  Task("Performance Analyst", "Define caching strategy and load requirements", "perf-analyzer")

// Step 3: Implementation (parallel with coordination)
[Single Message - Parallel Implementation]:
  Task("Backend Developer", "Implement product API with filtering and search", "backend-dev")
  Task("Frontend Developer", "Implement product listing with infinite scroll", "coder")
  Task("Test Engineer", "Write comprehensive test suite for catalog features", "tester")

// Step 4: Review and Refinement
[Single Message - Parallel Review]:
  Task("Code Reviewer", "Review implementation for best practices", "reviewer")
  Task("Security Auditor", "Audit API security and input validation", "reviewer")
  Task("Performance Tester", "Benchmark catalog performance under load", "performance-benchmarker")
```

---

## API Development Example

### Task: Build RESTful API for Blog Platform

```bash
# Full SPARC pipeline in one command
npx claude-flow sparc pipeline "RESTful blog API with posts, comments, and authentication"
```

**This executes all phases sequentially**:

1. **Specification**: Requirements for blog API endpoints
2. **Pseudocode**: Request/response flows, validation logic
3. **Architecture**: API structure, database schema, authentication
4. **Refinement**: TDD implementation of all endpoints
5. **Completion**: Integration tests, documentation, deployment

**Generated Structure**:
```
src/
  ├── routes/
  │   ├── posts.js
  │   ├── comments.js
  │   └── auth.js
  ├── models/
  │   ├── Post.js
  │   ├── Comment.js
  │   └── User.js
  ├── middleware/
  │   ├── auth.js
  │   └── validation.js
  └── services/
      ├── postService.js
      └── authService.js

tests/
  ├── unit/
  ├── integration/
  └── e2e/

docs/
  └── api-documentation.md
```

---

## Machine Learning Pipeline Example

### Task: Build Image Classification Model

```javascript
// Phase 1: Specification
Task("ML Researcher", "Define requirements for image classification: dataset, accuracy, latency targets", "researcher")

// Phase 2-3: Design (parallel)
[Single Message]:
  Task("ML Architect", "Design model architecture and training pipeline", "ml-developer")
  Task("Data Engineer", "Design data preprocessing and augmentation strategy", "coder")
  Task("Infrastructure Planner", "Plan compute resources and deployment strategy", "planner")

// Phase 4: Implementation
[Single Message]:
  Task("ML Developer", "Implement and train classification model", "ml-developer")
  Task("Backend Developer", "Build inference API", "backend-dev")
  Task("DevOps Engineer", "Setup MLOps pipeline for model deployment", "cicd-engineer")

// Phase 5: Validation
[Single Message]:
  Task("ML Tester", "Validate model accuracy and performance", "tester")
  Task("Performance Analyst", "Benchmark inference latency", "perf-analyzer")
  Task("Production Validator", "Ensure deployment readiness", "production-validator")
```

---

## Common Patterns

### Pattern 1: Rapid Prototyping

```bash
# Quick iteration: Specification + Pseudocode only
npx claude-flow sparc batch spec-pseudocode "Quick prototype of feature X"
```

### Pattern 2: Architecture Review

```bash
# Focus on architecture before implementation
npx claude-flow sparc run architect "Design pattern for feature X"
```

### Pattern 3: TDD Focus

```bash
# Jump straight to TDD if requirements are clear
npx claude-flow sparc tdd "Implement well-defined feature X"
```

### Pattern 4: Concurrent Phase Execution

```bash
# Run multiple SPARC phases on different features simultaneously
npx claude-flow sparc concurrent spec-pseudocode features.txt
# Where features.txt contains one feature per line
```

### Pattern 5: Incremental Refinement

```javascript
// Iterate on existing code
Task("Refinement Agent", "Improve performance of feature X based on profiling results", "refinement")
Task("Code Analyzer", "Suggest refactoring opportunities", "code-analyzer")
Task("Tester", "Add missing test coverage", "tester")
```

---

## Best Practices

1. **Always start with Specification** - Clear requirements prevent rework
2. **Use Pseudocode for complex logic** - Validate algorithm before coding
3. **Architecture before coding** - Design saves debugging time
4. **TDD during Refinement** - Tests first, implementation second
5. **Parallel execution when possible** - Speed up with concurrent agents
6. **Document as you go** - Update docs during Completion phase

---

## Troubleshooting

**Issue**: SPARC pipeline too slow
**Solution**: Use `sparc batch` to run only needed phases in parallel

**Issue**: Unclear requirements
**Solution**: Spend more time in Specification phase, use `researcher` agent

**Issue**: Complex architecture decisions
**Solution**: Use `system-architect` agent with specific constraints

**Issue**: Poor test coverage
**Solution**: Use `tdd-london-swarm` for comprehensive TDD approach

---

## 🚨 Error Handling & Common Failures

### When SPARC Commands Fail

#### Error: `claude-flow: command not found`

**Cause**: MCP server not installed or not in PATH

**Solution**:
```bash
# Install Claude Flow MCP
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Verify installation
claude mcp list

# Test it works
npx claude-flow sparc modes
```

**See**: [MCP Setup Guide](MCP_SETUP_GUIDE.md) for detailed troubleshooting

---

#### Error: `Agent spawn failed` or `Task orchestration timeout`

**Cause**: MCP server not running or agent coordination issues

**Solution**:
```bash
# Check MCP server status
claude mcp status

# Restart if needed
claude mcp restart claude-flow

# If using Ruv-Swarm
claude mcp restart ruv-swarm

# Enable debug logging
export CLAUDE_FLOW_DEBUG=true
npx claude-flow sparc run specification "test"
```

**Alternative**: Fall back to manual development without agents

---

#### Error: `Specification phase failed - unclear requirements`

**Cause**: Task description too vague or missing context

**Bad Example**:
```bash
npx claude-flow sparc run specification "add feature"  # ❌ Too vague
```

**Good Example**:
```bash
npx claude-flow sparc run specification "
Add user authentication feature:
- Email/password login
- JWT tokens
- Password reset via email
- Session management
- OAuth integration (Google, GitHub)
Target: Web application with React frontend and Node.js backend
"  # ✅ Clear, detailed
```

**Recovery**:
1. Add more context and constraints
2. Use `researcher` agent first to gather requirements
3. Break into smaller, well-defined tasks

---

#### Error: `TDD workflow generated failing tests`

**Cause**: This is EXPECTED in TDD! Red → Green → Refactor

**What to do**:
```bash
# 1. Tests fail (expected)
npm test  # ❌ Failures are good at this stage

# 2. Implement code to pass tests
# (Edit your implementation files)

# 3. Tests pass
npm test  # ✅ All pass

# 4. Refactor if needed
# (Improve code while keeping tests green)

# 5. Tests still pass
npm test  # ✅ Still passing
```

**This is correct TDD workflow** - don't panic when tests fail initially!

---

#### Error: `Architecture phase suggests unfamiliar technology`

**Cause**: Agent selected technology stack you're not comfortable with

**Solution**:
```bash
# Be specific about your tech stack in the prompt
npx claude-flow sparc run architect "
Design authentication system
CONSTRAINTS:
- Must use Express.js (not Fastify or Koa)
- Must use PostgreSQL (not MongoDB)
- Must use JWT (not session cookies)
- No microservices - monolithic architecture preferred
"
```

**Lesson**: Add constraints upfront to guide architecture decisions

---

### Common Gotchas

#### Gotcha #1: Forgetting to Batch Operations

**❌ Wrong (Multiple Messages)**:
```javascript
// Message 1
Task("Research agent", "Research authentication")

// Message 2
Task("Coder agent", "Implement auth")

// Message 3
TodoWrite([...todos])
```

**✅ Correct (Single Message)**:
```javascript
// Single message with all operations
Task("Research agent", "Research authentication")
Task("Coder agent", "Implement based on research")
Task("Tester agent", "Write tests for auth")
TodoWrite([...todos])  // All todos at once
```

**Why**: CLAUDE.md [MANDATORY] requires concurrent operations in single message

---

#### Gotcha #2: Not Reading Agent Capabilities First

**❌ Wrong**:
```javascript
Task("Mystery Agent", "Do something", "agent-i-guessed")  // May not exist
```

**✅ Correct**:
```javascript
// First, check available agents
Read("docs/AGENT_REFERENCE.md")

// Then use appropriate agent
Task("Backend Developer", "Build REST API", "backend-dev")  // Verified agent
```

**Rule**: Always verify agent exists before using (see [AGENT_REFERENCE.md](AGENT_REFERENCE.md))

---

#### Gotcha #3: Skipping Specification Phase

**❌ Wrong**:
```bash
# Jump straight to coding
npx claude-flow sparc tdd "build something"  # What are we building?
```

**✅ Correct**:
```bash
# Start with specification
npx claude-flow sparc run specification "detailed requirements"

# Review the spec
# THEN proceed to implementation

npx claude-flow sparc tdd "implement based on spec"
```

**Why**: Specification prevents wasted effort and rework

---

#### Gotcha #4: Ignoring Test Failures

**❌ Wrong**:
```bash
npm test  # 5 failures
# "I'll fix that later..." (narrator: they didn't)
git commit -m "added feature"
```

**✅ Correct**:
```bash
npm test  # 5 failures

# Fix ALL failures before committing
# ... fix code ...

npm test  # ✅ All pass
git commit -m "added feature with tests"
```

**Rule**: CLAUDE.md [MANDATORY-8] requires tests before considering work complete

---

### Debugging SPARC Workflows

#### Enable Debug Mode

```bash
# Set debug environment variable
export CLAUDE_FLOW_DEBUG=true
export CLAUDE_FLOW_LOG_LEVEL=debug

# Run SPARC command
npx claude-flow sparc run specification "test"

# Output will include detailed logs
```

#### Check MCP Logs

```bash
# View Claude Flow logs
claude mcp logs claude-flow

# View Ruv-Swarm logs (if using)
claude mcp logs ruv-swarm

# Tail logs in real-time
claude mcp logs claude-flow --follow
```

#### Verify Agent Coordination

```bash
# Check swarm status
npx claude-flow@alpha swarm status

# List active agents
npx claude-flow@alpha agent list

# Check task status
npx claude-flow@alpha task status
```

---

### Recovery Procedures

#### When Everything Goes Wrong

**Emergency Recovery Steps**:

```bash
# 1. Stop all MCP servers
claude mcp stop-all

# 2. Clear any cached state
rm -rf ~/.claude/mcp-cache/  # Unix/Mac
del /F /Q "%USERPROFILE%\.claude\mcp-cache\*"  # Windows

# 3. Restart MCP servers
claude mcp restart claude-flow
claude mcp restart ruv-swarm  # If using

# 4. Verify health
claude mcp status
npx claude-flow sparc modes

# 5. Try simple command
npx claude-flow sparc run specification "simple test"
```

#### Fall Back to Manual Development

**If SPARC agents aren't working, you can still develop manually**:

```bash
# Traditional development workflow
npm test  # Run tests
npm run lint  # Check code quality
npm run build  # Build project

# Document what you're doing in comments
# Follow TDD principles manually
# Reference CLAUDE.md for guidelines
```

**Remember**: SPARC is a tool to enhance development, not a requirement. Manual development following TDD principles is always valid.

---

## 📖 Additional Resources

**For more help**:
- **[CLAUDE.md](../CLAUDE.md)** - Mandatory development directives
- **[MCP Setup Guide](MCP_SETUP_GUIDE.md)** - Detailed MCP troubleshooting
- **[Agent Reference](AGENT_REFERENCE.md)** - Complete agent catalog
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Development best practices

**Community Support**:
- GitHub Issues - Report SPARC-related problems
- GitHub Discussions - Ask questions about workflows
- CLAUDE.md [MANDATORY-5] - Ask for clarification when uncertain

---

**For SPARC command reference, see CLAUDE.md**
**For agent capabilities, see docs/AGENT_REFERENCE.md**
