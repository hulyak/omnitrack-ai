# Docker & AWS Deployment Options 🚀

## Current Status

✅ **Fixed**: Deprecated DynamoDB warnings (updated to `pointInTimeRecoverySpecification`)
❌ **Issue**: Docker not installed - CDK needs Docker to build Lambda functions

## Your Options

### Option 1: Install Docker (Recommended for AWS Deployment)

**Why**: AWS CDK uses Docker to build Lambda functions with the correct runtime environment.

**Install Docker Desktop**:
```bash
# Download from: https://www.docker.com/products/docker-desktop/

# Or install via Homebrew:
brew install --cask docker

# Start Docker Desktop
open /Applications/Docker.app

# Verify installation
docker --version
# Should show: Docker version 24.x.x or higher
```

**Then deploy**:
```bash
cd infrastructure
./deploy.sh
```

### Option 2: Use Your Working Demo (Recommended for Now)

**Why**: Your app is already fully functional with demo data!

**What you have**:
- ✅ Professional UI with realistic data
- ✅ Scenarios page with simulations
- ✅ Explainability page with AI transparency
- ✅ Perfect for demos and development

**Test it**:
```bash
cd frontend
npm run dev

# Visit:
# http://localhost:3000/scenarios
# http://localhost:3000/explainability
```

### Option 3: Deploy Without Docker (Advanced)

**Use SAM CLI instead of CDK**:
```bash
# Install SAM CLI
brew install aws-sam-cli

# Build and deploy
cd infrastructure
sam build
sam deploy --guided
```

### Option 4: Use Pre-built Lambda Layers

**Modify CDK to skip Docker bundling**:

Edit `infrastructure/lib/infrastructure-stack.ts`:

```typescript
// Instead of NodejsFunction, use regular Function with pre-built code
const registerFunction = new lambda.Function(this, 'RegisterFunction', {
  functionName: 'omnitrack-auth-register',
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/auth/dist')),
  // ... rest of config
});
```

Then build Lambda code locally:
```bash
cd infrastructure/lambda/auth
npm install
npm run build  # Creates dist/ folder
```

## Recommended Path Forward

### For Immediate Demo/Development:
**Use Option 2** - Your demo is working perfectly!

### For AWS Deployment Later:
**Use Option 1** - Install Docker when you're ready for real AWS integration.

## What I Fixed

Updated all DynamoDB table configurations from:
```typescript
pointInTimeRecovery: true,
```

To:
```typescript
pointInTimeRecoverySpecification: {
  pointInTimeRecoveryEnabled: true,
},
```

This fixes the deprecation warnings you saw.

## Quick Decision Matrix

| Goal | Best Option | Time to Setup |
|------|-------------|---------------|
| Demo the app now | Option 2 (Demo mode) | 0 min ✅ |
| Deploy to AWS soon | Option 1 (Install Docker) | 5 min |
| Deploy without Docker | Option 3 (SAM CLI) | 15 min |
| Custom deployment | Option 4 (Pre-built) | 30 min |

## Next Steps

**If you want to demo now**:
```bash
cd frontend && npm run dev
```

**If you want to deploy to AWS**:
1. Install Docker Desktop
2. Start Docker
3. Run `cd infrastructure && ./deploy.sh`

**If you have questions**:
- Docker installation issues? Check Docker Desktop logs
- Deployment errors? Share the error message
- Want to modify the demo? The code is in `frontend/lib/demo-data-store.ts`

## Current App Status

Your OmniTrack AI app is **production-ready** for demos:
- ✅ Professional UI design
- ✅ Realistic supply chain scenarios
- ✅ AI explainability features
- ✅ Interactive simulations
- ✅ Clean, modern interface

The only thing missing is real AWS backend integration, which you can add later when needed!
