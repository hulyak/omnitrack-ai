---
inclusion: manual
contextKey: hooks
---

# Agent Hooks Guide for OmniTrack AI

This guide explains how to set up and use Kiro Agent Hooks to automate development workflows in the OmniTrack AI project.

## What Are Agent Hooks?

Agent hooks are automated triggers that execute agent actions or shell commands when specific events occur in your IDE. They enable:
- Automatic code generation on file changes
- Pre-commit validation and formatting
- Test execution on save
- Documentation updates
- Type generation from specifications

## Recommended Hooks for OmniTrack AI

### 1. Specification Change Hook

**Trigger**: When specification files change
**Action**: Regenerate TypeScript types and update documentation

```yaml
name: "Spec Change Handler"
trigger:
  type: "file_save"
  pattern: ".kiro/specs/**/*.md"
action:
  type: "agent_message"
  message: "The specification file {{file_path}} was updated. Please review the changes and update any affected TypeScript types, API documentation, and test files accordingly."
```

**Use Case**: Ensures types and docs stay in sync with specifications

### 2. Pre-Commit Validation Hook

**Trigger**: Before git commit
**Action**: Run linting and formatting

```yaml
name: "Pre-Commit Validation"
trigger:
  type: "pre_commit"
action:
  type: "shell_command"
  command: "npm run lint && npm run format:check"
  working_directory: "{{workspace_root}}"
```

**Use Case**: Prevents committing code that doesn't meet style guidelines

### 3. Test on Save Hook

**Trigger**: When test files are saved
**Action**: Run related tests

```yaml
name: "Run Tests on Save"
trigger:
  type: "file_save"
  pattern: "**/*.test.ts"
action:
  type: "shell_command"
  command: "npm test -- {{file_name}} --watchAll=false"
  working_directory: "{{file_directory}}"
```

**Use Case**: Immediate feedback on test changes

### 4. Lambda Function Update Hook

**Trigger**: When Lambda function code changes
**Action**: Update CDK deployment code

```yaml
name: "Lambda Function Update"
trigger:
  type: "file_save"
  pattern: "infrastructure/lambda/**/handler.ts"
action:
  type: "agent_message"
  message: "Lambda handler {{file_path}} was modified. Please review the CDK stack definition in infrastructure/lib/infrastructure-stack.ts to ensure the Lambda function configuration is up to date."
```

**Use Case**: Keeps infrastructure code in sync with application code

### 5. Agent Communication Schema Validation

**Trigger**: When agent handler files change
**Action**: Validate message schemas

```yaml
name: "Agent Schema Validation"
trigger:
  type: "file_save"
  pattern: "infrastructure/lambda/agents/**/*.ts"
action:
  type: "agent_message"
  message: "Agent file {{file_path}} was updated. Please validate that all agent communication message schemas are correct and update the agent orchestration flow if needed."
```

**Use Case**: Ensures agent communication remains valid

### 6. Property Test Generation Hook

**Trigger**: When new correctness properties are added to design.md
**Action**: Generate property test stubs

```yaml
name: "Property Test Generator"
trigger:
  type: "file_save"
  pattern: ".kiro/specs/**/design.md"
action:
  type: "agent_message"
  message: "Design document updated. Please check if new correctness properties were added and generate corresponding property-based test stubs using fast-check."
```

**Use Case**: Automates test scaffolding for new properties

### 7. API Documentation Update Hook

**Trigger**: When API handlers change
**Action**: Update OpenAPI specification

```yaml
name: "API Documentation Sync"
trigger:
  type: "file_save"
  pattern: "infrastructure/lambda/api/handlers.ts"
action:
  type: "agent_message"
  message: "API handlers were modified. Please update the OpenAPI specification in docs/api/openapi.yaml to reflect any endpoint changes."
```

**Use Case**: Keeps API documentation current

### 8. Translation Update Hook

**Trigger**: When English translation strings change
**Action**: Update other language files

```yaml
name: "Translation Sync"
trigger:
  type: "file_save"
  pattern: "frontend/locales/en.json"
action:
  type: "agent_message"
  message: "English translations were updated. Please review and update translations in other language files (es.json, fr.json, etc.) to maintain consistency."
```

**Use Case**: Maintains translation consistency (if i18n is added)

### 9. Component Documentation Hook

**Trigger**: When new React components are created
**Action**: Generate component README

```yaml
name: "Component Documentation"
trigger:
  type: "file_create"
  pattern: "frontend/components/**/*.tsx"
action:
  type: "agent_message"
  message: "New component {{file_path}} was created. Please generate a README.md in the same directory documenting the component's purpose, props, usage examples, and any relevant notes."
```

**Use Case**: Ensures all components are documented

### 10. Security Review Hook

**Trigger**: When authentication or security code changes
**Action**: Trigger security review

```yaml
name: "Security Review Trigger"
trigger:
  type: "file_save"
  pattern: "infrastructure/lambda/auth/**/*.ts"
action:
  type: "agent_message"
  message: "Security-sensitive file {{file_path}} was modified. Please review the changes for potential security vulnerabilities, ensure proper input validation, and verify that authentication flows remain secure."
```

**Use Case**: Prompts security review for sensitive code

## Setting Up Hooks

### Method 1: Using Kiro UI

1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Search for "Open Kiro Hook UI"
3. Click "Create New Hook"
4. Fill in trigger and action details
5. Save and enable the hook

### Method 2: Using Explorer View

1. Open Kiro Explorer panel
2. Navigate to "Agent Hooks" section
3. Click "+" to create new hook
4. Configure trigger and action
5. Enable the hook

### Method 3: Manual Configuration

Create hook files in `.kiro/hooks/` directory:

```
.kiro/hooks/
├── spec-change.yaml
├── pre-commit.yaml
├── test-on-save.yaml
└── lambda-update.yaml
```

## Hook Configuration Reference

### Trigger Types

**file_save**: Triggered when a file is saved
```yaml
trigger:
  type: "file_save"
  pattern: "**/*.ts"  # Glob pattern
```

**file_create**: Triggered when a file is created
```yaml
trigger:
  type: "file_create"
  pattern: "frontend/components/**/*.tsx"
```

**file_delete**: Triggered when a file is deleted
```yaml
trigger:
  type: "file_delete"
  pattern: "**/*.ts"
```

**pre_commit**: Triggered before git commit
```yaml
trigger:
  type: "pre_commit"
```

**message_sent**: Triggered when a message is sent to agent
```yaml
trigger:
  type: "message_sent"
```

**agent_complete**: Triggered when agent execution completes
```yaml
trigger:
  type: "agent_complete"
```

**session_start**: Triggered on first message in new session
```yaml
trigger:
  type: "session_start"
```

**manual**: Triggered by user clicking button
```yaml
trigger:
  type: "manual"
  button_label: "Run Spell Check"
```

### Action Types

**agent_message**: Send message to agent
```yaml
action:
  type: "agent_message"
  message: "Please review {{file_path}}"
```

**shell_command**: Execute shell command
```yaml
action:
  type: "shell_command"
  command: "npm test"
  working_directory: "{{workspace_root}}"
```

### Available Variables

- `{{file_path}}`: Full path to the file
- `{{file_name}}`: Name of the file
- `{{file_directory}}`: Directory containing the file
- `{{workspace_root}}`: Root directory of workspace
- `{{message}}`: Message content (for message_sent trigger)

## Best Practices

### DO:
✅ Use specific file patterns to avoid unnecessary triggers
✅ Provide clear, actionable messages to the agent
✅ Test hooks with sample files before enabling
✅ Document hook purpose and expected behavior
✅ Use shell commands for simple, deterministic tasks
✅ Use agent messages for complex, context-aware tasks

### DON'T:
❌ Create hooks that trigger on every file save
❌ Use vague messages like "check this file"
❌ Run expensive operations in hooks
❌ Create circular dependencies between hooks
❌ Forget to handle errors in shell commands

## Example Workflows

### Workflow 1: Spec-Driven Development

1. Update specification in `.kiro/specs/omnitrack-ai-supply-chain/design.md`
2. **Hook triggers**: "Spec Change Handler"
3. Agent reviews changes and updates:
   - TypeScript type definitions
   - API documentation
   - Test stubs for new properties
4. Developer implements the changes
5. **Hook triggers**: "Test on Save" when tests are written
6. Tests run automatically
7. **Hook triggers**: "Pre-Commit Validation" before commit
8. Code is committed with confidence

### Workflow 2: Lambda Development

1. Create new Lambda handler in `infrastructure/lambda/new-service/handler.ts`
2. **Hook triggers**: "Lambda Function Update"
3. Agent prompts to update CDK stack
4. Developer updates `infrastructure-stack.ts`
5. **Hook triggers**: "API Documentation Sync"
6. Agent updates OpenAPI spec
7. **Hook triggers**: "Pre-Commit Validation"
8. Code is validated and committed

### Workflow 3: Component Development

1. Create new React component in `frontend/components/feature/new-component.tsx`
2. **Hook triggers**: "Component Documentation"
3. Agent generates README template
4. Developer fills in component details
5. **Hook triggers**: "Test on Save" when tests are added
6. Tests run automatically
7. Component is ready for use

## Troubleshooting

### Hook Not Triggering

**Check**:
- Hook is enabled in Kiro UI
- File pattern matches correctly
- No syntax errors in hook configuration
- Kiro has necessary permissions

**Solution**:
- Review hook configuration
- Test with simpler pattern
- Check Kiro logs for errors

### Hook Triggering Too Often

**Check**:
- File pattern is too broad
- Multiple hooks triggering on same event

**Solution**:
- Make file pattern more specific
- Consolidate related hooks
- Add debouncing if available

### Shell Command Failing

**Check**:
- Command is valid in terminal
- Working directory is correct
- Required tools are installed
- Permissions are sufficient

**Solution**:
- Test command manually first
- Use absolute paths if needed
- Add error handling
- Check command output

## Advanced Patterns

### Conditional Execution

Use agent messages with conditional logic:
```yaml
action:
  type: "agent_message"
  message: "File {{file_path}} was updated. If this is a Lambda handler, update the CDK stack. If this is a React component, update the component documentation."
```

### Chained Hooks

Create hooks that trigger subsequent actions:
```yaml
# Hook 1: Generate types
name: "Generate Types"
trigger:
  type: "file_save"
  pattern: ".kiro/specs/**/design.md"
action:
  type: "agent_message"
  message: "Generate TypeScript types from updated specification"

# Hook 2: Run type check (triggers after types are generated)
name: "Type Check"
trigger:
  type: "file_save"
  pattern: "frontend/types/**/*.ts"
action:
  type: "shell_command"
  command: "npm run type-check"
```

### Context-Aware Hooks

Provide rich context to agent:
```yaml
action:
  type: "agent_message"
  message: |
    File {{file_path}} was modified.
    
    Context:
    - This is part of the {{feature_name}} feature
    - Related files: {{related_files}}
    - Recent changes: {{git_diff}}
    
    Please review and update:
    1. Related test files
    2. API documentation
    3. Type definitions
```

## Resources

- [Kiro Agent Hooks Documentation](https://docs.kiro.ai/hooks)
- [Hook Examples Repository](https://github.com/kiro-ai/hook-examples)
- [Community Hook Library](https://kiro.ai/hooks)

## Summary

Agent hooks automate repetitive tasks and ensure consistency across the OmniTrack AI codebase. By setting up the recommended hooks, you can:

- ✅ Keep specifications and code in sync
- ✅ Maintain code quality with automated checks
- ✅ Generate boilerplate automatically
- ✅ Ensure documentation stays current
- ✅ Catch issues early in development
- ✅ Improve developer productivity

Start with a few essential hooks and expand as you identify more automation opportunities!
