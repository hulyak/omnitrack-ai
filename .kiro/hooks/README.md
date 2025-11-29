# OmniTrack AI - Kiro Hooks

This directory contains automated hooks that trigger on specific events during development.

## Available Hooks

### 1. Test on Save (`test-on-save.json`)
**Status**: ✅ Enabled  
**Trigger**: When test files (`*.test.ts`, `*.test.tsx`) are saved  
**Action**: Runs the specific test file with Jest  
**Purpose**: Immediate feedback on test changes

### 2. Lint on Save (`lint-on-save.json`)
**Status**: ✅ Enabled  
**Trigger**: When frontend TypeScript/React files are saved  
**Action**: Runs ESLint on the saved file  
**Purpose**: Catch linting errors immediately

### 3. Type Check on Save (`typecheck-on-save.json`)
**Status**: ✅ Enabled  
**Trigger**: When any TypeScript file is saved  
**Action**: Runs TypeScript compiler in check mode (`tsc --noEmit`)  
**Purpose**: Catch type errors before runtime

### 4. Format on Save (`format-on-save.json`)
**Status**: ✅ Enabled  
**Trigger**: When code or markdown files are saved  
**Action**: Runs Prettier to format the file  
**Purpose**: Maintain consistent code formatting

### 5. CDK Synth Check (`cdk-synth-check.json`)
**Status**: ✅ Enabled  
**Trigger**: When infrastructure TypeScript files are saved  
**Action**: Runs `cdk synth` to validate CloudFormation templates  
**Purpose**: Catch infrastructure errors early

### 6. Accessibility Check (`accessibility-check.json`)
**Status**: ⚠️ Disabled (manual trigger recommended)  
**Trigger**: When React components are saved  
**Action**: Sends message to Kiro to review accessibility  
**Purpose**: Ensure WCAG AA compliance

## Managing Hooks

### Enable/Disable Hooks

Edit the hook JSON file and change the `enabled` field:

```json
{
  "enabled": true  // or false
}
```

### View Active Hooks

Use the Kiro IDE:
1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Search for "Kiro: View Agent Hooks"
3. See all configured hooks and their status

### Create Custom Hooks

1. Create a new JSON file in `.kiro/hooks/`
2. Use this template:

```json
{
  "name": "Hook Name",
  "description": "What this hook does",
  "enabled": true,
  "trigger": {
    "type": "onFileSave",
    "filePattern": "**/*.ts"
  },
  "action": {
    "type": "executeCommand",
    "command": "your-command-here",
    "workingDirectory": "."
  }
}
```

### Trigger Types

- `onFileSave` - When a file matching the pattern is saved
- `onMessage` - When a message is sent to Kiro
- `onSessionStart` - When a new Kiro session starts
- `onAgentComplete` - When an agent execution completes

### Action Types

- `executeCommand` - Run a shell command
- `sendMessage` - Send a message to Kiro agent

## Best Practices

### Performance Considerations

Some hooks can slow down your workflow if they run on every save:

- **Type checking** can be slow on large projects
- **CDK synth** takes 5-10 seconds
- **Accessibility checks** require AI processing

**Recommendation**: Disable heavy hooks during active development, enable before commits.

### Hook Combinations

These hooks work well together:
- Format → Lint → Type Check (in that order)
- Test on Save (only for test files)
- CDK Synth (only for infrastructure)

### Debugging Hooks

If a hook isn't working:
1. Check the hook is enabled (`"enabled": true`)
2. Verify the file pattern matches your files
3. Test the command manually in terminal
4. Check Kiro output panel for errors

## Project-Specific Hooks

### Frontend Development
- ✅ `format-on-save.json` - Keep code formatted
- ✅ `lint-on-save.json` - Catch style issues
- ✅ `typecheck-on-save.json` - Catch type errors
- ✅ `test-on-save.json` - Run tests immediately

### Infrastructure Development
- ✅ `cdk-synth-check.json` - Validate CDK code
- ✅ `typecheck-on-save.json` - Check TypeScript types

### Component Development
- ⚠️ `accessibility-check.json` - Manual WCAG review
- ✅ `format-on-save.json` - Format JSX/TSX
- ✅ `lint-on-save.json` - Lint React code

## Troubleshooting

### Hook Not Triggering

**Problem**: Hook doesn't run when file is saved  
**Solution**: 
- Check file pattern matches your file path
- Verify hook is enabled
- Restart Kiro IDE

### Command Fails

**Problem**: Hook command returns error  
**Solution**:
- Run command manually to see full error
- Check working directory is correct
- Verify dependencies are installed

### Too Slow

**Problem**: Hooks slow down development  
**Solution**:
- Disable heavy hooks temporarily
- Use more specific file patterns
- Run checks manually before commits

## Examples

### Custom Hook: Run Property Tests

```json
{
  "name": "Run Property Tests",
  "description": "Run property-based tests for Lambda functions",
  "enabled": true,
  "trigger": {
    "type": "onFileSave",
    "filePattern": "infrastructure/lambda/**/*.property.test.ts"
  },
  "action": {
    "type": "executeCommand",
    "command": "npm test -- ${filePath}",
    "workingDirectory": "infrastructure"
  }
}
```

### Custom Hook: Validate OpenAPI Spec

```json
{
  "name": "Validate OpenAPI",
  "description": "Validate OpenAPI specification",
  "enabled": true,
  "trigger": {
    "type": "onFileSave",
    "filePattern": "docs/api/openapi.yaml"
  },
  "action": {
    "type": "executeCommand",
    "command": "npx swagger-cli validate ${filePath}",
    "workingDirectory": "."
  }
}
```

### Custom Hook: Security Scan

```json
{
  "name": "Security Scan",
  "description": "Run security scan on Lambda functions",
  "enabled": false,
  "trigger": {
    "type": "onFileSave",
    "filePattern": "infrastructure/lambda/**/*.ts"
  },
  "action": {
    "type": "executeCommand",
    "command": "npm audit",
    "workingDirectory": "infrastructure"
  }
}
```

## Resources

- [Kiro Hooks Documentation](https://docs.kiro.ai/hooks)
- [Agent Hooks Guide](.kiro/steering/agent-hooks-guide.md)
- [OmniTrack Conventions](.kiro/steering/omnitrack-conventions.md)

---

**Last Updated**: November 30, 2025  
**Project**: OmniTrack AI
