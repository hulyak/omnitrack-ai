# OmniTrack AI - Project Setup Guide

This document provides detailed setup instructions for the OmniTrack AI project.

## Project Structure

```
omnitrack-ai/
├── frontend/                    # Next.js 15 + React 19 application
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   ├── lib/                    # Utility functions and helpers
│   ├── __tests__/              # Jest test files
│   ├── jest.config.ts          # Jest configuration
│   ├── jest.setup.ts           # Jest setup file
│   ├── .prettierrc.json        # Prettier configuration
│   ├── eslint.config.mjs       # ESLint configuration
│   └── tsconfig.json           # TypeScript configuration
│
├── infrastructure/              # AWS CDK infrastructure
│   ├── bin/                    # CDK app entry point
│   ├── lib/                    # CDK stack definitions
│   ├── test/                   # Infrastructure tests
│   ├── .prettierrc.json        # Prettier configuration
│   ├── .eslintrc.json          # ESLint configuration
│   └── tsconfig.json           # TypeScript configuration
│
├── .github/                     # GitHub Actions workflows
│   └── workflows/
│       ├── frontend-ci.yml     # Frontend CI pipeline
│       ├── infrastructure-ci.yml # Infrastructure CI pipeline
│       ├── deploy-staging.yml  # Staging deployment
│       └── deploy-production.yml # Production deployment
│
├── .kiro/                       # Kiro specs and documentation
│   └── specs/
│       └── omnitrack-ai-supply-chain/
│           ├── requirements.md  # Feature requirements
│           ├── design.md       # System design
│           └── tasks.md        # Implementation tasks
│
├── README.md                    # Project overview
├── SETUP.md                     # This file
└── .gitignore                   # Git ignore rules
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.x or higher
  - Check: `node --version`
  - Install: https://nodejs.org/

- **npm**: Comes with Node.js
  - Check: `npm --version`

- **AWS CLI**: For AWS operations
  - Check: `aws --version`
  - Install: https://aws.amazon.com/cli/

- **AWS CDK CLI**: For infrastructure deployment
  - Install: `npm install -g aws-cdk`
  - Check: `cdk --version`

- **Git**: For version control
  - Check: `git --version`

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd omnitrack-ai
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

**Verify the setup:**
```bash
npm run type-check    # TypeScript type checking
npm run lint          # ESLint
npm test              # Run tests
npm run dev           # Start development server
```

The development server will start at `http://localhost:3000`

### 3. Infrastructure Setup

```bash
cd infrastructure
npm install
npm run build
```

**Verify the setup:**
```bash
npm run type-check    # TypeScript type checking
npm run lint          # ESLint
npm test              # Run tests
npm run cdk synth     # Synthesize CloudFormation template
```

## Development Workflow

### Frontend Development

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Run tests in watch mode:**
   ```bash
   npm run test:watch
   ```

3. **Format code:**
   ```bash
   npm run format
   ```

4. **Check for linting issues:**
   ```bash
   npm run lint
   ```

### Infrastructure Development

1. **Watch for TypeScript changes:**
   ```bash
   cd infrastructure
   npm run watch
   ```

2. **Synthesize CloudFormation:**
   ```bash
   npm run cdk synth
   ```

3. **Deploy to AWS:**
   ```bash
   npm run cdk deploy
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## Testing

### Unit Tests

Both frontend and infrastructure use Jest for unit testing:

```bash
# Frontend
cd frontend
npm test

# Infrastructure
cd infrastructure
npm test
```

### Property-Based Tests

The project uses `fast-check` for property-based testing. Example tests are in:
- `frontend/__tests__/example.test.ts`
- `infrastructure/test/example.test.ts`

Property-based tests run automatically with `npm test` and execute 100 iterations by default.

### Test Coverage

Generate coverage reports:

```bash
# Frontend
cd frontend
npm test -- --coverage

# Infrastructure
cd infrastructure
npm test -- --coverage
```

## Code Quality

### Linting

ESLint is configured with TypeScript support and Prettier integration:

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Formatting

Prettier is configured for consistent code formatting:

```bash
# Format all files
npm run format

# Check formatting without modifying files
npm run format:check
```

### Type Checking

TypeScript strict mode is enabled:

```bash
npm run type-check
```

## CI/CD

### GitHub Actions Workflows

The project includes four CI/CD workflows:

1. **Frontend CI** (`.github/workflows/frontend-ci.yml`)
   - Runs on push/PR to `main` or `develop`
   - Linting, type checking, testing, building
   - Uploads coverage reports

2. **Infrastructure CI** (`.github/workflows/infrastructure-ci.yml`)
   - Runs on push/PR to `main` or `develop`
   - Linting, type checking, testing, CDK synth
   - Uploads CDK artifacts

3. **Deploy to Staging** (`.github/workflows/deploy-staging.yml`)
   - Runs on push to `develop` branch
   - Deploys infrastructure and frontend to staging

4. **Deploy to Production** (`.github/workflows/deploy-production.yml`)
   - Runs on push to `main` branch
   - Deploys infrastructure and frontend to production

### Required GitHub Secrets

Configure these secrets in your GitHub repository:

- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `STAGING_API_URL` - Staging API endpoint
- `STAGING_WS_URL` - Staging WebSocket endpoint
- `PRODUCTION_API_URL` - Production API endpoint
- `PRODUCTION_WS_URL` - Production WebSocket endpoint

## AWS Configuration

### Configure AWS Credentials

```bash
aws configure
```

Provide:
- AWS Access Key ID
- AWS Secret Access Key
- Default region name
- Default output format (json)

### Bootstrap CDK (First Time Only)

```bash
cd infrastructure
npm run cdk bootstrap
```

This creates the necessary AWS resources for CDK deployments.

## Environment Variables

### Frontend Environment Variables

Create `.env.local` in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Infrastructure Environment Variables

Environment-specific variables are set in the CDK stack code.

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Run `npm install` in the affected directory
   - Clear node_modules: `rm -rf node_modules && npm install`

2. **TypeScript errors**
   - Ensure TypeScript version matches: `npm list typescript`
   - Run `npm run type-check` to see all errors

3. **CDK deployment fails**
   - Verify AWS credentials: `aws sts get-caller-identity`
   - Ensure CDK is bootstrapped: `cdk bootstrap`

4. **Tests failing**
   - Clear Jest cache: `npm test -- --clearCache`
   - Check for missing dependencies

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [fast-check Documentation](https://fast-check.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Support

For questions or issues, please refer to:
- Project documentation in `.kiro/specs/`
- GitHub Issues
- Team communication channels
