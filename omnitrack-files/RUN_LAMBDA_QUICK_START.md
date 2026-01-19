# 🚀 Run Lambda Functions - Quick Start

Your Lambda functions are ready to run **without Docker**!

## ⚡ Fastest Way: Deploy to AWS

```bash
cd infrastructure
cdk deploy --all
```

**Time**: 30-60 seconds (10x faster than Docker!)

## 🧪 Test Locally (Without Deploying)

### Method 1: Direct Node.js Test

```bash
# Test a specific function
cd infrastructure/lambda/auth

# Create test event
cat > test-event.json << 'EOF'
{
  "body": "{\"username\":\"test@example.com\",\"password\":\"Test123!\"}",
  "requestContext": { "requestId": "test-123" }
}
EOF

# Run the function
npx ts-node -e "
const { handler } = require('./login.ts');
const event = require('./test-event.json');
handler(event).then(console.log);
"
```

### Method 2: Use the Test Script

```bash
./test-lambda-locally.sh
```

Choose option 1 for fastest testing.

## 📋 Available Lambda Functions

Your infrastructure has **22 Lambda functions**:

### Authentication (4 functions)
- `omnitrack-auth-register` - User registration
- `omnitrack-auth-login` - User login
- `omnitrack-auth-logout` - User logout
- `omnitrack-auth-refresh` - Token refresh

### API Handlers (8+ functions)
- Digital Twin state management
- IoT data processing
- Agent orchestration
- WebSocket handlers

### Copilot (3 functions)
- WebSocket connection handler
- Message handler
- Disconnect handler

### Others
- IoT processor
- Alert generators
- Notification services

## 🎯 Quick Deploy & Test Workflow

### 1. Deploy to AWS
```bash
cd infrastructure
cdk deploy --all
```

### 2. Get Function Names
```bash
aws lambda list-functions --query 'Functions[*].FunctionName' --output table
```

### 3. Test a Function
```bash
# Test login function
aws lambda invoke \
  --function-name omnitrack-auth-login \
  --payload '{"body":"{\"username\":\"test@example.com\",\"password\":\"Test123!\"}"}' \
  response.json

cat response.json
```

### 4. View Logs
```bash
aws logs tail /aws/lambda/omnitrack-auth-login --follow
```

## 🔧 Development Workflow

### Make Changes
```bash
# Edit Lambda function
vim infrastructure/lambda/auth/login.ts
```

### Deploy Changes
```bash
cd infrastructure
cdk deploy --all  # Only 30-60 seconds!
```

### Test Changes
```bash
aws lambda invoke \
  --function-name omnitrack-auth-login \
  --payload '{"body":"{}"}' \
  response.json
```

## 💡 Pro Tips

### Faster Iteration
```bash
# Deploy only changed functions
cdk deploy InfrastructureStack --hotswap
```

### Watch Logs in Real-Time
```bash
aws logs tail /aws/lambda/omnitrack-auth-login --follow
```

### Test Multiple Functions
```bash
# Create a test script
cat > test-all.sh << 'EOF'
#!/bin/bash
for func in omnitrack-auth-login omnitrack-auth-register; do
  echo "Testing $func..."
  aws lambda invoke --function-name $func response.json
  cat response.json
  echo ""
done
EOF

chmod +x test-all.sh
./test-all.sh
```

## 🐛 Troubleshooting

### Function Not Found
```bash
# List all functions
aws lambda list-functions

# Check deployment status
cd infrastructure
cdk diff
```

### Function Errors
```bash
# View detailed logs
aws logs tail /aws/lambda/FUNCTION_NAME --follow

# Check function configuration
aws lambda get-function --function-name FUNCTION_NAME
```

### Slow Deployment
```bash
# Verify local bundling is enabled
grep "forceDockerBundling: false" infrastructure/lib/infrastructure-stack.ts
```

## 📊 Performance

| Action | Time | Notes |
|--------|------|-------|
| Deploy all functions | 30-60 sec | With local bundling |
| Deploy single function | 10-20 sec | Using --hotswap |
| Test locally | <5 sec | Direct Node.js |
| Test on AWS | <1 sec | After deployment |

## 🎉 You're Ready!

Your Lambda functions are configured for fast, Docker-free deployment.

**Deploy now:**
```bash
cd infrastructure
cdk deploy --all
```

**Test now:**
```bash
./test-lambda-locally.sh
```

---

**Need help?** Check [NO_DOCKER_DEPLOYMENT.md](./NO_DOCKER_DEPLOYMENT.md) for detailed guides.
