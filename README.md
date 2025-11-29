# OmniTrack AI - Supply Chain Resilience Platform

## AWS Global Vibe Hackathon 2025 Submission

**Built entirely with Amazon Kiro** - Demonstrating spec-driven development and AI-powered code generation for enterprise-grade applications.

An adaptive, collaborative, and intelligent supply chain resilience platform powered by autonomous AWS agentic AI.
  
**🚀 Status**: Deployment-ready AWS infrastructure, fully functional local demo

---

## 🎬 Quick Demo (30 Seconds)

```bash
# 1. Start submission prep (verifies everything)
./start-submission-prep.sh

# 2. Launch the application
cd frontend && npm run dev
# Visit http://localhost:3000

# 3. Verify deployment readiness
cd infrastructure && npx cdk synth
# ✅ Generates 2000+ lines of CloudFormation - ready for deployment!
```

## 🤖 Built with Amazon Kiro

This entire project was generated using Kiro's spec-driven development:

- 📋 **Natural Language Specs** → Complete Application
- 🤖 **22+ Lambda Functions** generated from requirements
- ⚛️ **50+ React Components** generated from design specs
- 🏗️ **2000+ Lines of Infrastructure** generated as AWS CDK
- ✅ **One Command Deployment**: `cdk deploy`

### Evidence of Kiro Usage

- **Spec Files**: `.kiro/specs/omnitrack-ai-supply-chain/` and `.kiro/specs/ai-copilot/`
- **Generated Code**: All Lambda functions, React components, and infrastructure
- **Development Time**: Weeks → Days (75-80% time savings)

## 📊 Project Scale

| Metric | Count |
|--------|-------|
| TypeScript Files | 200+ |
| Lines of Code | 15,000+ |
| Lambda Functions | 22+ |
| React Components | 50+ |
| AWS Services | 15+ |
| Spec Documents | 6 |

---

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

## 🚀 Getting Started

### For Hackathon Judges

**See the complete submission package**:
- 📖 **Master Checklist**: `HACKATHON_SUBMISSION_MASTER_CHECKLIST.md`
- 📸 **Screenshot Guide**: `SCREENSHOT_CAPTURE_GUIDE.md`
- 🎬 **Video Script**: `VIDEO_SCRIPT_DETAILED.md`
- 🚀 **Deployment Proof**: `DEPLOYMENT_READINESS_PROOF.md`
- 📝 **Kiro Usage**: `KIRO_USAGE_DOCUMENTATION.md`

### Quick Local Demo

```bash
# Install and verify
./start-submission-prep.sh

# Start frontend
cd frontend
npm install
npm run dev
# Visit http://localhost:3000
```

### Verify Deployment Readiness

```bash
# Verify infrastructure
cd infrastructure
npm install
npx cdk synth
# ✅ Success! Ready for: cdk deploy
```

The infrastructure is **one command away** from full AWS deployment.

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
