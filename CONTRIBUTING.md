# Contributing to OmniTrack AI

Thank you for your interest in contributing to OmniTrack AI! This document provides guidelines and instructions for contributing to the project.

## Development Setup

Please refer to [SETUP.md](./SETUP.md) for detailed setup instructions.

## Code Standards

### TypeScript

- Use TypeScript strict mode (already configured)
- Avoid `any` types - use proper typing
- Use interfaces for object shapes
- Use type aliases for unions and complex types

### Code Style

- Follow the Prettier configuration (`.prettierrc.json`)
- Run `npm run format` before committing
- ESLint rules are enforced - fix all warnings and errors
- Use meaningful variable and function names
- Add comments for complex logic

### Testing

- Write unit tests for all new functions and components
- Write property-based tests for core logic using fast-check
- Aim for 80% code coverage minimum
- Tests should be deterministic and fast
- Mock external dependencies appropriately

### Commits

- Use clear, descriptive commit messages
- Follow conventional commits format:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `test:` for test additions/changes
  - `refactor:` for code refactoring
  - `chore:` for maintenance tasks

Example:
```
feat: add alert prioritization algorithm
fix: resolve WebSocket connection timeout
docs: update API endpoint documentation
test: add property tests for scenario generation
```

## Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches
- `hotfix/*` - Production hotfixes

### Workflow

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request to `develop`

## Pull Request Process

1. **Before submitting:**
   - Run all tests: `npm run test:all`
   - Run linting: `npm run lint:all`
   - Run formatting: `npm run format:all`
   - Ensure TypeScript compiles: `npm run type-check`

2. **PR Description:**
   - Describe what changes you made and why
   - Reference any related issues
   - Include screenshots for UI changes
   - List any breaking changes

3. **Review Process:**
   - At least one approval required
   - All CI checks must pass
   - Address all review comments
   - Keep PR scope focused and manageable

4. **After Approval:**
   - Squash commits if requested
   - Merge to target branch
   - Delete feature branch

## Testing Guidelines

### Unit Tests

- Test individual functions and components in isolation
- Use descriptive test names: `it('should calculate carbon footprint correctly')`
- Arrange-Act-Assert pattern
- Test edge cases and error conditions

Example:
```typescript
describe('calculateCarbonFootprint', () => {
  it('should return zero for empty route', () => {
    const result = calculateCarbonFootprint([]);
    expect(result).toBe(0);
  });

  it('should calculate footprint for single segment', () => {
    const route = [{ distance: 100, mode: 'truck' }];
    const result = calculateCarbonFootprint(route);
    expect(result).toBeGreaterThan(0);
  });
});
```

### Property-Based Tests

- Use fast-check for testing universal properties
- Run minimum 100 iterations
- Test invariants, round-trips, and idempotence
- Tag with property reference from design doc

Example:
```typescript
// Feature: omnitrack-ai-supply-chain, Property 1: Alert generation timing
it('should generate alerts within 30 seconds for any anomaly', () => {
  fc.assert(
    fc.property(
      fc.record({
        sensorId: fc.string(),
        value: fc.float(),
        threshold: fc.float(),
      }),
      async (anomaly) => {
        const startTime = Date.now();
        await generateAlert(anomaly);
        const duration = Date.now() - startTime;
        return duration < 30000;
      }
    ),
    { numRuns: 100 }
  );
});
```

## Code Review Checklist

### For Authors

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated if needed
- [ ] No console.log or debug code left in
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Performance considerations addressed

### For Reviewers

- [ ] Code is clear and maintainable
- [ ] Tests adequately cover changes
- [ ] No security vulnerabilities introduced
- [ ] Performance impact is acceptable
- [ ] Documentation is accurate
- [ ] Edge cases are handled
- [ ] Error messages are helpful

## Architecture Decisions

When making significant architectural changes:

1. Discuss with the team first
2. Document the decision and rationale
3. Update design documents in `.kiro/specs/`
4. Consider backward compatibility
5. Plan for migration if needed

## Getting Help

- Check existing documentation in `.kiro/specs/`
- Review [SETUP.md](./SETUP.md) for setup issues
- Ask questions in team channels
- Create an issue for bugs or feature requests

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
