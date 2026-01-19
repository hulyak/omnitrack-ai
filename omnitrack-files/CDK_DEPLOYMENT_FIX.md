# CDK Deployment Fix

## The Problem

You're getting this error:
```
--app is required either in command-line, in cdk.json or in ~/.cdk.json
```

This happens when you run CDK commands from the wrong directory.

## The Solution

CDK commands must be run from the `infrastructure/` directory where `cdk.json` is located.

### Option 1: Use the Deployment Script (Recommended)

```bash
./infrastructure/cdk-deploy.sh
```

This script:
- Changes to the correct directory
- Checks AWS credentials
- Installs dependencies
- Bootstraps CDK (if needed)
- Synthesizes and deploys the stack

### Option 2: Manual Deployment

```bash
# Change to infrastructure directory
cd infrastructure

# Install dependencies (first time only)
npm install

# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy
npx cdk deploy
```

### Option 3: Run from Root Directory

If you want to run from the root directory, specify the app:

```bash
cdk deploy --app "npx ts-node --prefer-ts-exts infrastructure/bin/infrastructure.ts"
```

## Pre-Deployment Checklist

Before deploying, ensure:

1. **AWS Credentials Configured**
   ```bash
   aws configure
   # Or check existing credentials:
   aws sts get-caller-identity
   ```

2. **Dependencies Installed**
   ```bash
   cd infrastructure
   npm install
   ```

3. **Environment Variables Set** (if needed)
   ```bash
   # Create infrastructure/.env if you need custom configuration
   cp infrastructure/.env.example infrastructure/.env
   ```

4. **Docker Not Required**
   - We've configured local bundling for all Lambda functions
   - No Docker needed for deployment

## Common CDK Commands

All commands should be run from the `infrastructure/` directory:

```bash
cd infrastructure

# Synthesize CloudFormation template
npx cdk synth

# Show differences between deployed and local
npx cdk diff

# Deploy stack
npx cdk deploy

# Destroy stack (careful!)
npx cdk destroy

# List all stacks
npx cdk list
```

## Troubleshooting

### Error: "Unable to resolve AWS account"
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### Error: "Need to perform AWS calls for account"
```bash
cd infrastructure
npx cdk bootstrap
```

### Error: "Cannot find module"
```bash
cd infrastructure
npm install
```

### Error: "esbuild not found"
```bash
cd infrastructure
npm install --save-dev esbuild
```

## What Gets Deployed

The CDK stack deploys:

- **DynamoDB Tables**: User data, supply chain nodes, scenarios, alerts
- **Lambda Functions**: 22+ functions for agents, auth, IoT processing
- **API Gateway**: REST API endpoints
- **WebSocket API**: Real-time communication for AI Copilot
- **Cognito User Pool**: Authentication
- **ElastiCache Redis**: Caching layer
- **OpenSearch**: Search functionality
- **Step Functions**: Multi-agent orchestration
- **CloudWatch**: Monitoring and logging

## After Deployment

1. **Get API URLs**
   ```bash
   cd infrastructure
   npx cdk deploy --outputs-file outputs.json
   cat outputs.json
   ```

2. **Update Frontend Configuration**
   ```bash
   # Copy the API Gateway URL from outputs
   # Update frontend/.env.local:
   NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
   ```

3. **Test Deployment**
   ```bash
   ./infrastructure/verify-deployment.sh
   ```

## Quick Deploy (All-in-One)

```bash
# From project root
./infrastructure/cdk-deploy.sh
```

This handles everything automatically.

## Need Help?

- Check AWS Console CloudFormation for stack status
- View CloudWatch Logs for Lambda errors
- Run `npx cdk doctor` to diagnose CDK issues
- Ensure you're in the `infrastructure/` directory

---

**Last Updated**: November 29, 2025
**Status**: ✅ Ready to Deploy
