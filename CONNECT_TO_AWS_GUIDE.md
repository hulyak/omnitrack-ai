# How to Connect Frontend to AWS Backend 🚀

## Current State

Right now you're seeing **demo data** because:
- Frontend API routes (`frontend/app/api/*`) return mock data
- No connection to AWS Lambda functions
- Works offline for development

## What's Already Built

You have a **complete AWS backend** ready to use:

```
infrastructure/lambda/
├── agents/
│   ├── info-agent.ts          # Anomaly detection
│   ├── scenario-agent.ts      # Scenario simulation  ← For scenarios page
│   ├── strategy-agent.ts      # Strategy recommendations
│   └── impact-agent.ts        # Impact analysis
├── explainability/
│   └── explainability-service.ts  ← For explainability page
├── copilot/                   # AI Copilot backend
├── auth/                      # Authentication
└── iot/                       # IoT data processing
```

## Step-by-Step: Connect to AWS

### Option 1: Quick Deploy (Recommended for Demo)

```bash
# 1. Deploy infrastructure to AWS
cd infrastructure
./deploy.sh

# 2. This creates:
# - Lambda functions
# - API Gateway
# - DynamoDB tables
# - Cognito for auth
# - All AWS resources

# 3. After deployment, you'll get API URLs:
# API_URL: https://abc123.execute-api.us-east-1.amazonaws.com/prod
# WEBSOCKET_URL: wss://xyz789.execute-api.us-east-1.amazonaws.com/prod
```

### Option 2: Update Frontend to Use AWS

Once deployed, update your frontend:

#### A. Update Environment Variables

Create `frontend/.env.production`:

```bash
# From AWS deployment outputs
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-ws-id.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### B. Update API Routes to Call AWS

Replace demo routes with AWS calls:

**Before (Demo):**
```typescript
// frontend/app/api/scenarios/run/route.ts
export async function POST(request: NextRequest) {
  // Generate demo data
  const results = generateScenarioResults(parameters);
  return NextResponse.json({ success: true, data: results });
}
```

**After (AWS):**
```typescript
// frontend/app/api/scenarios/run/route.ts
export async function POST(request: NextRequest) {
  const parameters = await request.json();
  
  // Call AWS Lambda via API Gateway
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/scenarios/simulate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parameters)
    }
  );
  
  const data = await response.json();
  return NextResponse.json({ success: true, data });
}
```

### Option 3: Direct Lambda Calls (No API Gateway)

You can also call Lambda directly from frontend:

```typescript
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambda = new LambdaClient({ region: "us-east-1" });

const response = await lambda.send(new InvokeCommand({
  FunctionName: "omnitrack-scenario-agent",
  Payload: JSON.stringify(parameters)
}));
```

## What Changes When Connected to AWS?

### Scenarios Page

**Demo Mode (Current):**
- Generates fake simulation results
- Instant response
- No real AI analysis

**AWS Mode (After Connection):**
- Calls `scenario-agent.ts` Lambda
- Uses Amazon Bedrock (Claude AI)
- Real supply chain analysis
- Stores results in DynamoDB
- Takes 2-5 seconds (real AI processing)

### Explainability Page

**Demo Mode (Current):**
- Shows static demo data
- Pre-generated decision trees

**AWS Mode (After Connection):**
- Calls `explainability-service.ts` Lambda
- Real AI reasoning from Bedrock
- Dynamic decision trees
- Actual confidence scores

## Cost Considerations

### Demo Mode (Current)
- **Cost**: $0
- **Pros**: Free, fast, works offline
- **Cons**: Fake data, no real AI

### AWS Mode (Connected)
- **Cost**: ~$10-50/month for light usage
  - Lambda: $0.20 per 1M requests
  - DynamoDB: $1.25 per million writes
  - Bedrock: $0.003 per 1K input tokens
  - API Gateway: $3.50 per million requests
- **Pros**: Real AI, production-ready, scalable
- **Cons**: Costs money, requires AWS account

## Quick Start: Deploy to AWS

### 1. Prerequisites

```bash
# Install AWS CLI
brew install awscli  # macOS
# or download from: https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter region: us-east-1
```

### 2. Deploy Infrastructure

```bash
cd infrastructure

# Copy environment template
cp .env.example .env

# Edit .env with your AWS account ID
# AWS_ACCOUNT_ID=your-account-id
# AWS_REGION=us-east-1

# Deploy (takes 10-15 minutes)
./deploy.sh
```

### 3. Enable Bedrock Access

```bash
# Go to AWS Console → Amazon Bedrock
# Click "Model access"
# Request access to "Claude 3.5 Sonnet"
# (Usually approved instantly)
```

### 4. Update Frontend

```bash
cd frontend

# Copy the API URLs from deployment output
# Update .env.production with the URLs

# Rebuild frontend
npm run build
```

### 5. Test Connection

```bash
# Test the scenarios API
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/scenarios/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioType": "supplier_disruption",
    "severity": "high",
    "duration": 30
  }'
```

## Hybrid Approach (Best for Development)

You can use **both** demo and AWS:

```typescript
// frontend/lib/api/client.ts
const USE_AWS = process.env.NEXT_PUBLIC_USE_AWS === 'true';

export async function runScenario(params: any) {
  if (USE_AWS) {
    // Call AWS Lambda
    return await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios/simulate`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  } else {
    // Use demo data
    return await fetch('/api/scenarios/run', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }
}
```

Then toggle with environment variable:

```bash
# Use demo data
NEXT_PUBLIC_USE_AWS=false npm run dev

# Use AWS
NEXT_PUBLIC_USE_AWS=true npm run dev
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CURRENT (Demo Mode)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Browser → Next.js API Routes → Generate Demo Data → Return │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   AFTER AWS CONNECTION                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Browser → API Gateway → Lambda Functions → Bedrock (AI)    │
│                              ↓                               │
│                         DynamoDB (Storage)                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Files to Modify for AWS Connection

### 1. Scenarios Page
```
frontend/app/api/scenarios/run/route.ts
→ Replace generateScenarioResults() with AWS Lambda call
→ Call: infrastructure/lambda/agents/scenario-agent.ts
```

### 2. Explainability Page
```
frontend/app/api/explainability/analyze/route.ts
→ Replace generateExplainabilityData() with AWS Lambda call
→ Call: infrastructure/lambda/explainability/explainability-service.ts
```

### 3. Dashboard
```
frontend/app/api/agents/*/route.ts
→ Connect to respective Lambda functions
→ info-agent.ts, scenario-agent.ts, strategy-agent.ts, impact-agent.ts
```

## Next Steps

Choose your path:

### Path A: Keep Demo Mode (Current)
- ✅ No setup needed
- ✅ Works now
- ✅ Free
- ❌ Fake data
- **Good for**: Development, testing UI

### Path B: Deploy to AWS
- ⏱️ 30 minutes setup
- 💰 ~$10-50/month
- ✅ Real AI
- ✅ Production-ready
- **Good for**: Real demos, production

### Path C: Hybrid (Recommended)
- ✅ Best of both worlds
- ✅ Toggle between demo/AWS
- ✅ Develop with demo, demo with AWS
- **Good for**: Active development

## Quick Commands

```bash
# Check if AWS is configured
aws sts get-caller-identity

# Deploy to AWS
cd infrastructure && ./deploy.sh

# Test AWS connection
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/health

# View Lambda logs
aws logs tail /aws/lambda/omnitrack-scenario-agent --follow

# Destroy AWS resources (cleanup)
cd infrastructure && ./destroy.sh
```

## Need Help?

1. **AWS Setup Issues**: Check `infrastructure/DEPLOYMENT.md`
2. **Cost Questions**: See AWS Free Tier (12 months free)
3. **Bedrock Access**: Usually instant, check AWS Console
4. **Lambda Errors**: Check CloudWatch Logs

---

**TL;DR**: You have a complete AWS backend ready. Run `./deploy.sh` in the `infrastructure` folder to deploy it, then update the frontend API routes to call AWS instead of generating demo data.

**Current**: Demo data (free, instant, fake)  
**After AWS**: Real AI (costs $, takes seconds, production-ready)
