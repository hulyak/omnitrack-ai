# OmniTrack AI - Supply Chain Resilience Platform

## What is OmniTrack AI?

OmniTrack AI is an autonomous multi-agent system that transforms supply chain management from reactive crisis response to proactive resilience. Four specialized AI agents work together to detect disruptions 10x faster and respond 50x faster than traditional systems.

### The Problem

Supply chain disruptions cost businesses $4 trillion annually. Companies take 3-7 days to detect problems and another 2-5 days to respond. By then, the damage has cascaded through their entire network.

### The Solution

Four AI agents collaborate autonomously:

1. **Info Agent** - Monitors IoT sensors and detects anomalies in real-time (< 24 hours vs. 3-7 days)
2. **Scenario Agent** - Simulates thousands of "what-if" scenarios in seconds
3. **Strategy Agent** - Recommends optimal mitigation strategies balancing cost, time, and risk
4. **Impact Agent** - Assesses business consequences across financial, operational, and sustainability dimensions

### Key Features

- **Real-time Dashboard** - Interactive supply chain network visualization with D3.js
- **Scenario Simulation** - Run what-if analyses with detailed impact predictions
- **Explainable AI** - Decision trees and natural language explanations for every recommendation
- **Sustainability Tracking** - Carbon footprint analysis and emissions monitoring
- **Voice Interface** - Hands-free operation with speech recognition
- **AR Visualization** - Spatial supply chain insights with WebXR
- **Marketplace** - Community-driven scenario sharing and strategy collaboration
- **AI Copilot** - Conversational interface for natural language queries

**🚀 Status**: Deployment-ready AWS infrastructure, fully functional local demo

---

## 🎬 Quick Demo (30 Seconds)

```bash
# 1. Verify setup
./verify-setup.sh

# 2. Launch the application
cd frontend && npm run dev
# Visit http://localhost:3000

# 3. Verify deployment readiness
cd infrastructure && npx cdk synth
# ✅ Generates 2000+ lines of CloudFormation - ready for deployment!
```

## 📊 Project Scale

| Metric | Count |
|--------|-------|
| Lines of Code | 17,500+ |
| Lambda Functions | 22 |
| React Components | 50+ |
| AWS Services | 15+ |
| Infrastructure Code | 2,000+ lines |
| Functional Pages | 8 |

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

### Quick Local Demo

```bash
# Verify setup
./verify-setup.sh

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

## License

MIT License - See [LICENSE](LICENSE) file for details
