# OmniTrack AI - Kiro Steering Files

This directory contains steering files that guide Kiro's behavior when working on the OmniTrack AI project. These files ensure consistent code generation, proper use of tools, and adherence to project conventions.

## What Are Steering Files?

Steering files provide context and instructions to Kiro that are automatically included (or manually referenced) during AI-assisted development. They help Kiro:

- Follow project-specific conventions
- Use the right tools at the right time
- Generate code that matches your architecture
- Maintain consistency across the codebase

## Available Steering Files

### 1. `omnitrack-conventions.md` (Always Included)

**Purpose**: Core development conventions for OmniTrack AI

**Contains**:
- Technology stack (Next.js 15, AWS Lambda, DynamoDB, etc.)
- Code style guidelines (TypeScript, React, Lambda)
- File structure and naming conventions
- Property-based testing patterns
- Error handling patterns
- Security best practices
- Performance guidelines
- Accessibility requirements

**When It's Used**: Automatically included in all Kiro interactions

**Key Sections**:
- Technology Stack
- Code Style
- File Structure
- Naming Conventions
- Property-Based Testing
- Error Handling
- Logging
- Security
- Documentation
- Performance
- Accessibility

### 2. `mcp-integration.md` (Always Included)

**Purpose**: Guide for using Model Context Protocol (MCP) servers

**Contains**:
- Available MCP servers (AWS Docs, NPM Lookup)
- Integration patterns
- Query best practices
- Example use cases
- Troubleshooting tips

**When It's Used**: Automatically included to help Kiro leverage MCP servers

**Key Sections**:
- Available MCP Servers
- Integration Patterns
- MCP Query Best Practices
- Integration Workflow
- Example Use Cases

### 3. `agent-hooks-guide.md` (Manual - Use `#hooks`)

**Purpose**: Guide for setting up and using Kiro Agent Hooks

**Contains**:
- Recommended hooks for OmniTrack AI
- Hook configuration examples
- Setup instructions
- Best practices
- Troubleshooting

**When It's Used**: Reference with `#hooks` context key when working with automation

**Key Sections**:
- What Are Agent Hooks
- Recommended Hooks
- Setting Up Hooks
- Hook Configuration Reference
- Best Practices
- Example Workflows

### 4. `amazon-q-integration.md` (Manual - Use `#amazon-q`)

**Purpose**: Guide for using Amazon Q Developer alongside Kiro

**Contains**:
- When to use Amazon Q vs Kiro
- Installation and setup
- Common use cases
- CLI command reference
- Integration workflows

**When It's Used**: Reference with `#amazon-q` when discussing CLI tools

**Key Sections**:
- Overview
- Installation and Setup
- Common Use Cases
- Integration with OmniTrack AI Workflow
- Amazon Q CLI Commands Reference
- Best Practices

## How to Use Steering Files

### Automatic Inclusion

Files marked with `inclusion: always` are automatically included in Kiro's context:

```yaml
---
inclusion: always
---
```

These files are always active and don't need to be explicitly referenced.

### Manual Reference

Files marked with `inclusion: manual` need to be referenced using context keys:

```yaml
---
inclusion: manual
contextKey: hooks
---
```

To use these files, reference them in chat:
- `#hooks` - Loads agent-hooks-guide.md
- `#amazon-q` - Loads amazon-q-integration.md

### File-Specific Inclusion

You can also configure files to be included only when specific files are open:

```yaml
---
inclusion: fileMatch
fileMatchPattern: 'infrastructure/**/*.ts'
---
```

## Quick Reference

### When Generating Code

Kiro automatically follows:
- ✅ TypeScript strict mode
- ✅ Next.js 15 patterns
- ✅ AWS Lambda best practices
- ✅ Property-based testing with fast-check
- ✅ Structured logging
- ✅ Error handling patterns

### When Using MCP Servers

Kiro can query:
- 🔍 AWS Documentation for service examples
- 📦 NPM Package Lookup for dependency info
- 📄 Project files for existing patterns

### When Setting Up Automation

Reference `#hooks` to:
- ⚙️ Create agent hooks
- 🔄 Automate workflows
- ✅ Set up validation
- 📝 Generate documentation

### When Using CLI Tools

Reference `#amazon-q` to:
- 🚀 Generate AWS CDK snippets
- 🔒 Scan for security issues
- 🧪 Generate test structures
- 📖 Explain complex code

## Example Workflows

### Workflow 1: Implementing a New Feature

1. **Review Spec**: Open `.kiro/specs/omnitrack-ai-supply-chain/design.md`
2. **Ask Kiro**: "Implement the IoT Simulator backend service"
3. **Kiro Uses**: `omnitrack-conventions.md` for code style
4. **Kiro Queries**: MCP for AWS Lambda patterns
5. **Result**: Code that follows all conventions

### Workflow 2: Setting Up Automation

1. **Reference Hooks**: Type `#hooks` in chat
2. **Ask Kiro**: "Set up a hook to run tests when I save test files"
3. **Kiro Uses**: `agent-hooks-guide.md` for patterns
4. **Result**: Configured hook with proper triggers

### Workflow 3: Generating Infrastructure

1. **Use Amazon Q**: `q "Generate CDK code for Lambda function"`
2. **Copy Output**: Paste into project
3. **Ask Kiro**: "Integrate this Lambda function following our conventions"
4. **Kiro Uses**: `omnitrack-conventions.md` + `amazon-q-integration.md`
5. **Result**: Properly integrated infrastructure code

### Workflow 4: Security Review

1. **Use Amazon Q**: `q security-scan infrastructure/lambda/auth/`
2. **Review Findings**: Check flagged issues
3. **Ask Kiro**: "Fix the security vulnerabilities in this file"
4. **Kiro Uses**: `omnitrack-conventions.md` for secure patterns
5. **Result**: Secure, convention-compliant code

## Customizing Steering Files

### Adding New Conventions

Edit `omnitrack-conventions.md`:

```markdown
## New Section

### Your Convention

Description and examples...
```

### Adding New MCP Servers

Edit `mcp-integration.md`:

```markdown
### 3. Your MCP Server

**Purpose**: What it does

**Usage**: How to use it
```

### Adding New Hooks

Edit `agent-hooks-guide.md`:

```markdown
### 11. Your Hook

**Trigger**: When it runs
**Action**: What it does
```

## Best Practices

### DO:

✅ Keep steering files up to date with project changes
✅ Add examples for complex patterns
✅ Document "why" not just "what"
✅ Reference steering files in chat when needed
✅ Use specific context keys for manual files

### DON'T:

❌ Duplicate information across files
❌ Add too much detail (keep it concise)
❌ Forget to update after major changes
❌ Make files too long (split if needed)
❌ Use vague language

## Troubleshooting

### Kiro Not Following Conventions

**Check**:
- Is `omnitrack-conventions.md` marked as `inclusion: always`?
- Are conventions clearly stated?
- Are examples provided?

**Solution**:
- Review and clarify conventions
- Add more examples
- Explicitly reference in chat

### MCP Queries Not Working

**Check**:
- Are MCP servers configured in `.kiro/settings/mcp.json`?
- Is `mcp-integration.md` included?
- Are queries specific enough?

**Solution**:
- Configure MCP servers
- Make queries more specific
- Check MCP server status

### Hooks Not Triggering

**Check**:
- Are hooks enabled?
- Is file pattern correct?
- Is `agent-hooks-guide.md` referenced?

**Solution**:
- Enable hooks in Kiro UI
- Test file patterns
- Review hook configuration

## Resources

- [Kiro Documentation](https://docs.kiro.ai/)
- [Kiro Steering Guide](https://docs.kiro.ai/steering)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Amazon Q Developer](https://docs.aws.amazon.com/amazonq/)

## File Structure

```
.kiro/steering/
├── README.md                      # This file
├── omnitrack-conventions.md       # Core conventions (always included)
├── mcp-integration.md             # MCP usage guide (always included)
├── agent-hooks-guide.md           # Hooks guide (manual: #hooks)
└── amazon-q-integration.md        # Amazon Q guide (manual: #amazon-q)
```

## Summary

Steering files make Kiro more effective by providing:

- 📋 **Conventions**: Consistent code style and patterns
- 🔧 **Tools**: Proper use of MCP servers and CLI tools
- ⚙️ **Automation**: Agent hooks for workflow automation
- 🤝 **Integration**: Seamless use of Amazon Q Developer

By maintaining these steering files, you ensure that Kiro generates code that:
- ✅ Follows project conventions
- ✅ Uses the right tools
- ✅ Maintains consistency
- ✅ Meets quality standards
- ✅ Integrates smoothly

---

**Last Updated**: November 27, 2025
**Project**: OmniTrack AI
**Maintained By**: Development Team
