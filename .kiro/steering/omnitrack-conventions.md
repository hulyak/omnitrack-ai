---
inclusion: always
---

# OmniTrack AI - Development Conventions

This steering file ensures consistent code generation and development practices across the OmniTrack AI project.

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Styling**: TailwindCSS with design system tokens
- **State Management**: React Context + SWR for data fetching
- **Testing**: Jest + React Testing Library + fast-check for property tests
- **Type Safety**: TypeScript with strict mode enabled

### Backend
- **Runtime**: AWS Lambda (Node.js 20+)
- **Infrastructure**: AWS CDK (TypeScript)
- **Database**: DynamoDB with single-table design
- **Caching**: ElastiCache Redis
- **Search**: Amazon OpenSearch
- **AI/ML**: Amazon Bedrock for LLM reasoning
- **Orchestration**: AWS Step Functions for multi-agent workflows

### Testing
- **Unit Tests**: Jest
- **Property-Based Tests**: fast-check (minimum 100 iterations)
- **Integration Tests**: Jest + Supertest
- **E2E Tests**: Playwright

## Code Style

### TypeScript
- Use strict mode
- Explicit return types for all functions
- Avoid `any` type - use `unknown` or proper types
- Use interfaces for data structures
- Prefer `const` over `let`
- Use arrow functions for callbacks

### React Components
- Functional components with hooks only
- Props validation with TypeScript interfaces
- Use `'use client'` directive for client components
- Memoization for expensive computations
- Error boundaries for error handling
- Co-locate tests with components (`.test.tsx` suffix)

### Lambda Functions
- Single responsibility per function
- Stateless design
- Environment variables for configuration
- Structured logging with correlation IDs
- Proper error handling with typed errors
- Export handler as default export

## File Structure

### Frontend
```
frontend/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── [feature]/         # Feature-specific components
│   │   ├── index.ts       # Barrel export
│   │   └── README.md      # Component documentation
├── lib/                    # Utilities and helpers
├── types/                  # TypeScript type definitions
└── __tests__/             # Test files
```

### Backend
```
infrastructure/lambda/
├── [service]/             # Service-specific code
│   ├── [service].ts       # Main service logic
│   ├── handler.ts         # Lambda handler
│   ├── [service].property.test.ts  # Property tests
│   └── README.md          # Service documentation
├── models/                # Data models
├── repositories/          # Data access layer
└── utils/                 # Shared utilities
```

## Naming Conventions

### Files
- React components: `kebab-case.tsx` (e.g., `voice-interface.tsx`)
- TypeScript files: `kebab-case.ts` (e.g., `api-client.ts`)
- Test files: `[name].test.ts` or `[name].property.test.ts`
- Type definitions: `kebab-case.ts` in `types/` folder

### Variables and Functions
- Variables: `camelCase`
- Functions: `camelCase`
- React components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Interfaces: `PascalCase` with descriptive names
- Types: `PascalCase`

### API Endpoints
- REST: `/resource` or `/resource/{id}`
- Use HTTP verbs correctly (GET, POST, PUT, DELETE)
- Versioning: `/v1/resource` (when needed)
- Consistent error responses with correlation IDs

## Property-Based Testing

### Test Annotation Format
Every property-based test MUST include this comment:
```typescript
// Feature: omnitrack-ai-supply-chain, Property {number}: {property_text}
```

### Test Configuration
- Minimum 100 iterations per property test
- Use fast-check for randomized input generation
- Test universal properties, not specific examples
- Focus on invariants, round-trips, idempotence, ordering

### Example
```typescript
// Feature: omnitrack-ai-supply-chain, Property 1: Alert generation timing
it('should generate alerts within 30 seconds for any anomaly', () => {
  fc.assert(
    fc.property(fc.record({
      sensorId: fc.string(),
      value: fc.float(),
      threshold: fc.float()
    }), async (data) => {
      const startTime = Date.now();
      const alert = await generateAlert(data);
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000);
    }),
    { numRuns: 100 }
  );
});
```

## Error Handling

### Lambda Functions
```typescript
try {
  const result = await processRequest(event);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
} catch (error) {
  logger.error('Request failed', {
    correlationId: event.requestContext.requestId,
    error: error.message,
    stack: error.stack
  });
  
  if (error instanceof ValidationError) {
    return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
  }
  
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Internal server error',
      correlationId: event.requestContext.requestId
    })
  };
}
```

### Frontend Components
```typescript
try {
  const data = await apiClient.get('/endpoint');
  setData(data);
} catch (error) {
  setError(error instanceof Error ? error.message : 'Unknown error');
  logger.error('API call failed', { error });
}
```

## Logging

### Structured Logging
Always use structured logging with correlation IDs:
```typescript
logger.info('Processing request', {
  correlationId,
  userId,
  action: 'simulate_scenario',
  scenarioId
});
```

### Log Levels
- **DEBUG**: Detailed diagnostic information
- **INFO**: General informational messages
- **WARNING**: Warning messages for recoverable issues
- **ERROR**: Error messages for failures
- **CRITICAL**: Critical failures requiring immediate attention

## Security

### Authentication
- Use Cognito User Pools for authentication
- JWT tokens for API authentication
- Token validation in middleware
- Role-based access control (RBAC)

### Data Protection
- Encrypt sensitive data at rest (KMS)
- Use TLS 1.3 for data in transit
- Mask sensitive data in logs
- Validate all user inputs
- Sanitize outputs to prevent XSS

### API Security
- Rate limiting per user
- CORS configuration
- Security headers (CSP, HSTS, etc.)
- Input validation middleware
- AWS WAF rules

## Documentation

### Code Comments
- Document complex logic
- Explain "why" not "what"
- Use JSDoc for public APIs
- Keep comments up to date

### README Files
Every feature/service should have a README with:
- Purpose and overview
- Usage examples
- API documentation
- Testing instructions
- Dependencies

## Performance

### Frontend
- Code splitting with dynamic imports
- Image optimization
- Lazy loading for heavy components
- Memoization for expensive computations
- Debouncing for user inputs

### Backend
- Lambda function warming
- DynamoDB query optimization with GSIs
- ElastiCache for frequently accessed data
- CloudFront caching for static assets
- Batch operations where possible

## Accessibility

- Semantic HTML elements
- ARIA labels for screen readers
- Keyboard navigation support
- Color contrast compliance (WCAG AA)
- Focus management
- Alt text for images

## Git Workflow

### Commit Messages
```
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Branch Naming
- Feature: `feature/description`
- Bug fix: `fix/description`
- Hotfix: `hotfix/description`

## References

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [fast-check Documentation](https://fast-check.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
