# Claude Code Configuration - Otium Property Toolkit

## 🚨 CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool**: Use native Claude Code Task tool for multi-agent workflows (NO external dependencies)
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code

## Project Overview

This project is the **Otium First Home Buyer Property Toolkit** - a comprehensive Australian property calculator with Firebase backend, React frontend, and integrated Goals dashboard system.

## Development Commands

### Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build project for production
- `npm run preview` - Preview built project
- `npm run lint` - Run ESLint code quality checks

### Development Workflow

1. **Analysis** - Use native Claude Code tools to analyze requirements
2. **Planning** - Use TodoWrite to organize tasks systematically
3. **Implementation** - Write/Edit components with proper architecture
4. **Testing** - Test functionality through dev server and manual verification
5. **Integration** - Ensure Firebase and routing work seamlessly

## Code Style & Best Practices

- **Modular Design**: Files under 500 lines
- **Environment Safety**: Never hardcode secrets
- **Test-First**: Write tests before implementation
- **Clean Architecture**: Separate concerns
- **Documentation**: Keep updated

## 🚀 Native Claude Code Multi-Agent Approach

### Available Task Tool Agents
- **general-purpose**: Research, analysis, code review, UI/UX evaluation
- **statusline-setup**: Configure Claude Code status line settings  
- **output-style-setup**: Create Claude Code output styles

### Claude Code Handles Everything:
- **File Operations**: Read, Write, Edit, MultiEdit, Glob, Grep
- **Code Generation**: React components, Firebase integration, calculations
- **System Operations**: Bash commands, package management, dev server
- **Task Management**: TodoWrite for systematic progress tracking
- **Multi-Agent Workflows**: Native Task tool with specialized instructions
- **Testing & Debugging**: Manual verification and code analysis
- **Project Navigation**: Understanding codebase structure and dependencies

### Simple Multi-Agent Pattern:
```javascript
// ✅ CORRECT - Single message with multiple Task agents
Task("Research agent: Analyze Australian property market trends...")
Task("UI/UX agent: Review component design consistency...")  
Task("Code agent: Check Firebase integration and performance...")
```

## 🚀 Quick Setup

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Build for production  
npm run build
```

## 📋 Development Protocol

### Every Development Session:

**1️⃣ BEFORE Work:**
- Use TodoWrite to plan all tasks in one batch
- Read relevant MD files for compliance requirements
- Start dev server to test changes

**2️⃣ DURING Work:**
- Batch all related file operations in single messages
- Use Task tool for complex analysis requiring multiple perspectives
- Test functionality through dev server (localhost:3001)

**3️⃣ AFTER Work:**
- Mark todos as completed immediately after finishing
- Verify site functionality with manual testing
- Update MD files if architecture changes

## 🎯 Concurrent Execution Examples

### ✅ CORRECT (Single Message):
```javascript
// Batch all related operations together
TodoWrite({ todos: [
  {content: "Analyze property market trends", status: "in_progress", activeForm: "Analyzing property market trends"},
  {content: "Review UI component consistency", status: "pending", activeForm: "Reviewing UI component consistency"},
  {content: "Check Firebase integration", status: "pending", activeForm: "Checking Firebase integration"},
  {content: "Test cross-page navigation", status: "pending", activeForm: "Testing cross-page navigation"},
  {content: "Verify Australian compliance", status: "pending", activeForm: "Verifying Australian compliance"}
]});

// Multiple file operations in one message
Read("src/components/FirstHomeBuyerToolkit/FirstHomeBuyerToolkit.jsx");
Read("src/firebase/config.js");
Read("src/pages/Goals.jsx");

// Multiple bash commands together
Bash("npm run lint");
Bash("npm run build");
```

### ❌ WRONG (Multiple Messages):
```javascript
Message 1: TodoWrite({ todos: [single todo] })
Message 2: Read("file1.js")
Message 3: Read("file2.js")
Message 4: Bash("npm run lint")
// This breaks parallel execution patterns!
```

## Performance Benefits

- **Concurrent Operations**: All related tasks in single messages for efficiency
- **Batched File Operations**: Faster file processing with combined Read/Write operations
- **Systematic Task Management**: TodoWrite ensures nothing is forgotten
- **Native Tool Usage**: No external dependencies or setup complexity

## Development Best Practices

### Pre-Development
- Review CLAUDE.md and related MD files for compliance requirements
- Plan all tasks using TodoWrite in comprehensive batches
- Start dev server for real-time testing

### During Development
- Batch all related file operations together
- Use Task tool sparingly for complex analysis only
- Test functionality immediately through localhost dev server
- Follow established patterns in existing codebase

### Post-Development
- Complete todos immediately after finishing tasks
- Verify cross-page navigation works properly
- Check Firebase integration remains functional
- Update documentation if architecture changes

## Project Architecture (v8.2 - Complete)

- 🏠 **Property Calculator**: Complete First Home Buyer Toolkit with 5-step wizard
- ⚡ **Firebase Backend**: Authentication, Firestore, Analytics, Security Rules
- 🎨 **Modern UI**: Tailwind CSS v4, Framer Motion, Radix UI components
- 📱 **Responsive Design**: Mobile-first with professional gradients
- 🔗 **Goals Integration**: Seamless PropertyRealEstate ↔ Goals dashboard navigation
- 🇦🇺 **Australian Compliance**: Government schemes, HEM validation, state grants

## Development Guidelines

1. **File Organization**: Follow existing src/ structure - never save to root
2. **Component Patterns**: Use established FirstHomeBuyerToolkit patterns
3. **State Management**: Follow Firebase integration patterns in existing code
4. **Styling**: Use Tailwind v4 with blue/indigo gradient system
5. **Testing**: Manual verification through dev server at localhost:3001
6. **Documentation**: Update MD files when making architectural changes

---

**Current Status:** Production-ready Property Toolkit with complete Goals integration ✅
