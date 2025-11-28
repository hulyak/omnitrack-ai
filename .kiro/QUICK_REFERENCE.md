# Kiro Quick Reference for OmniTrack AI

Quick reference for using Kiro effectively in the OmniTrack AI project.

## 🎯 Context Keys

Use these to load specific steering files:

| Key | Purpose | Example |
|-----|---------|---------|
| `#hooks` | Agent hooks guide | "Set up a pre-commit hook #hooks" |
| `#amazon-q` | Amazon Q integration | "How do I use Amazon Q with Kiro? #amazon-q" |

## 📋 Common Commands

### Spec-Driven Development

```
"Review the IoT Simulator requirements"
"Implement task 30 from the tasks.md"
"Generate property-based tests for Property 46"
"Update the design document with new service"
```

### Code Generation

```
"Create a new Lambda function for [purpose]"
"Generate a React component for [feature]"
"Add property-based tests for [function]"
"Create API endpoint for [resource]"
```

### Code Review & Refactoring

```
"Review this code for security issues"
"Refactor this to follow our conventions"
"Add error handling to this function"
"Optimize this code for performance"
```

### Testing

```
"Generate unit tests for this component"
"Create property-based tests with fast-check"
"Run tests for the voice interface"
"Fix failing tests in [file]"
```

### Documentation

```
"Generate README for this component"
"Update API documentation for [endpoint]"
"Add JSDoc comments to this function"
"Create usage examples for [feature]"
```

## 🔧 MCP Server Queries

### AWS Documentation

```
"Query AWS docs for Lambda error handling patterns"
"Show me DynamoDB single-table design examples"
"How do I configure Step Functions retry logic?"
"What are the latest Bedrock API options?"
```

### NPM Package Lookup

```
"What's the latest version of fast-check?"
"Show me alternatives to [package]"
"Check peer dependencies for React 19"
```

## ⚙️ Agent Hooks

### Setting Up Hooks

```
"Create a hook to run tests on save #hooks"
"Set up pre-commit validation #hooks"
"Add a hook for spec changes #hooks"
```

### Managing Hooks

```
"List all active hooks #hooks"
"Disable the test-on-save hook #hooks"
"Show me hook examples #hooks"
```

## 🚀 Amazon Q Developer

### Quick Commands

```bash
# Generate CDK code
q "Generate CDK code for Lambda function"

# Security scan
q security-scan infrastructure/lambda/auth/

# Generate tests
q "Generate Jest tests for this code" < file.ts

# Explain code
q "Explain this code" < file.ts
```

### Integration with Kiro

1. Generate with Amazon Q: `q "Generate [code]"`
2. Integrate with Kiro: "Integrate this code following our conventions"

## 📁 File Patterns

### Frontend

```
frontend/
├── app/[page]/page.tsx          # Next.js pages
├── components/[feature]/        # Feature components
├── types/[feature].ts           # Type definitions
└── __tests__/[feature]/         # Tests
```

### Backend

```
infrastructure/lambda/
├── [service]/[service].ts       # Service logic
├── [service]/handler.ts         # Lambda handler
├── [service]/*.property.test.ts # Property tests
└── [service]/README.md          # Documentation
```

## 🧪 Testing Patterns

### Property-Based Test Template

```typescript
// Feature: omnitrack-ai-supply-chain, Property X: Description
it('should [behavior] for any [input]', () => {
  fc.assert(
    fc.property(
      fc.[generator](),
      async (input) => {
        const result = await functionUnderTest(input);
        expect(result).to[assertion];
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Template

```typescript
describe('ComponentName', () => {
  it('should [behavior]', () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

## 🔒 Security Checklist

When working with security-sensitive code:

- [ ] Input validation
- [ ] Output sanitization
- [ ] Authentication checks
- [ ] Authorization verification
- [ ] Error handling (no sensitive data in errors)
- [ ] Logging (no sensitive data in logs)
- [ ] Rate limiting
- [ ] CORS configuration

## 📊 Code Quality Checklist

Before committing:

- [ ] TypeScript strict mode compliance
- [ ] ESLint passing
- [ ] Prettier formatted
- [ ] Tests passing
- [ ] Property tests included (if applicable)
- [ ] Documentation updated
- [ ] Error handling added
- [ ] Logging added

## 🎨 Code Style Quick Reference

### TypeScript

```typescript
// ✅ Good
export interface UserProfile {
  userId: string;
  email: string;
  role: UserRole;
}

export async function getUser(userId: string): Promise<UserProfile> {
  // Implementation
}

// ❌ Bad
export function getUser(userId: any) {
  // Implementation
}
```

### React

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ❌ Bad
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### Lambda

```typescript
// ✅ Good
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const correlationId = event.requestContext.requestId;
  
  try {
    logger.info('Processing request', { correlationId });
    const result = await processRequest(event);
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    logger.error('Request failed', { correlationId, error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// ❌ Bad
export const handler = async (event: any) => {
  const result = await processRequest(event);
  return { statusCode: 200, body: JSON.stringify(result) };
};
```

## 🔍 Debugging Tips

### Check Diagnostics

```
"Check for errors in this file"
"Show me TypeScript errors"
"Run diagnostics on [file]"
```

### Review Logs

```
"Show me the execution log"
"What errors occurred?"
"Review the test output"
```

### Get Help

```
"Explain this error message"
"Why is this test failing?"
"How do I fix this TypeScript error?"
```

## 📚 Resources

- **Specs**: `.kiro/specs/omnitrack-ai-supply-chain/`
- **Steering**: `.kiro/steering/`
- **Docs**: `docs/`
- **Examples**: Look for `README.md` in component directories

## 🆘 Troubleshooting

### Kiro Not Following Conventions

```
"Review the project conventions"
"Follow the patterns in omnitrack-conventions.md"
"Use the same style as [existing file]"
```

### MCP Not Working

```
"Query AWS docs for [topic]"
"Check MCP server status"
"Use MCP to find [information]"
```

### Tests Failing

```
"Fix the failing tests"
"Run tests for [file]"
"Show me the test output"
```

## 💡 Pro Tips

1. **Be Specific**: "Create a Lambda function for IoT data processing" is better than "Create a function"

2. **Reference Files**: "Following the pattern in voice-interface.tsx, create..."

3. **Use Context Keys**: Add `#hooks` or `#amazon-q` when relevant

4. **Iterate**: Start with "Review the spec", then "Implement task X"

5. **Check Work**: "Review this code for issues" before committing

6. **Use MCP**: "Query AWS docs for..." to get current best practices

7. **Combine Tools**: Use Amazon Q for CLI, Kiro for IDE tasks

## 🎯 Common Workflows

### New Feature

1. "Review requirement X in requirements.md"
2. "Review the design for [feature]"
3. "Implement task Y from tasks.md"
4. "Generate property-based tests"
5. "Run all tests"
6. "Create documentation"

### Bug Fix

1. "Explain this error"
2. "Review the code in [file]"
3. "Fix the issue"
4. "Add tests to prevent regression"
5. "Run tests to verify fix"

### Refactoring

1. "Review this code for improvements"
2. "Refactor to follow our conventions"
3. "Add error handling"
4. "Update tests"
5. "Verify all tests pass"

---

**Quick Start**: Just ask Kiro! It has access to all project context and conventions.

**Need Help?**: Type "Show me the steering files" or "Explain the project structure"
