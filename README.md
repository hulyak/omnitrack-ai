# OmniTrack AI - Supply Chain Resilience Platform

An adaptive, collaborative, and intelligent supply chain resilience platform powered by autonomous AWS agentic AI.

## Project Structure

```
.
├── frontend/           # Next.js 15 + React 19 web application
├── infrastructure/     # AWS CDK infrastructure as code
├── .github/           # GitHub Actions CI/CD workflows
└── .kiro/             # Kiro specs and documentation
```

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)

## Getting Started

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Infrastructure Development

```bash
cd infrastructure
npm install
npm run build
npm run cdk synth
```

## Available Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode

### Infrastructure

- `npm run build` - Compile TypeScript
- `npm run watch` - Watch for changes and compile
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run cdk` - Run CDK commands
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Testing

This project uses:
- **Jest** for unit testing
- **fast-check** for property-based testing
- **React Testing Library** for component testing (frontend)

Run tests with:
```bash
npm test
```

## CI/CD

GitHub Actions workflows are configured for:
- **Frontend CI**: Linting, testing, and building on push/PR
- **Infrastructure CI**: Linting, testing, and CDK synth on push/PR
- **Deploy to Staging**: Automatic deployment to staging environment
- **Deploy to Production**: Automatic deployment to production environment

## Architecture

OmniTrack AI is built on AWS infrastructure with:
- **Frontend**: Next.js 15 with React 19, TailwindCSS
- **Backend**: AWS Lambda functions with specialized AI agents
- **Orchestration**: AWS Step Functions for multi-agent coordination
- **AI/ML**: Amazon Bedrock for LLM reasoning, SageMaker for ML models
- **Data**: DynamoDB, OpenSearch, ElastiCache
- **Real-time**: API Gateway WebSocket, AWS IoT Core

## Documentation

Detailed documentation is available in the `.kiro/specs/omnitrack-ai-supply-chain/` directory:
- `requirements.md` - Feature requirements and acceptance criteria
- `design.md` - System architecture and design decisions
- `tasks.md` - Implementation plan and task list

## License

Proprietary - All rights reserved
