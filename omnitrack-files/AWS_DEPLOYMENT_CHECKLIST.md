# AWS Deployment Checklist for OmniTrack AI

## 🎯 Quick Decision: Do You Need AWS for Hackathon?

### ✅ Demo Mode (Recommended)
**Use if:**
- Hackathon is within 48 hours
- You want zero AWS costs
- You want zero configuration hassle
- Your demo focuses on UX and features

**What works:**
- ✅ All UI features
- ✅ Real-time IoT simulation
- ✅ AI Copilot (simulated responses)
- ✅ Agent controls (simulated results)
- ✅ Live data streaming

**What to say:**
"We built this with production AWS architecture in mind. For the demo, we're using simulated data, but the system is designed to deploy to AWS Lambda, Bedrock, and DynamoDB with a single command."

### 🚀 AWS Deployment (Optional)
**Use if:**
- You have 2+ hours for setup
- You want real AI responses
- You want to show AWS integration
- You're comfortable with AWS costs ($5-10)

**What you get:**
- ✅ Real Amazon Bedrock AI responses
- ✅ DynamoDB data persistence
- ✅ Cognito authentication
- ✅ Production-ready deployment
- ✅ CloudWatch monitoring

---

## 📋 AWS Deployment Steps (30-45 minutes)

### Prerequisites Check
```bash
# Check Node.js version (need 20+)
node --version

# Check AWS CLI
aws --version

# Check AWS credentials
aws sts get-caller-identity

# Check CDK
npm list -g aws-cdk
```

If any fail:
```bash
# Install Node.js 20+
# Visit: https://nodejs.org/

# Install AWS CLI
# Visit: https://aws.amazon.com/cli/

# Configure AWS
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)

# Install CDK
npm install -g aws-cdk
```

---

## Step 1: Configure Environment (5 minutes)

### 1.1 Set AWS Account Info
```bash
cd infrastructure
cp .env.example .env
```

Edit `infrastructure/.env`:
```bash
AWS_ACCOUNT_ID=YOUR_ACCOUNT_ID_HERE  # Get from: aws sts get-caller-identity
AWS_REGION=us-east-1
ENVIRONMENT=production
STACK_NAME=omnitrack-ai
```

### 1.2 Verify Configuration
```bash
# Check your AWS account ID
aws sts get-caller-identity --query Account --output text

# Check your region
aws configure get region
```

---

## Step 2: Enable Bedrock (Automatic!)

**Good News**: Amazon Bedrock models are now **automatically enabled** on first use!

### What This Means:
- ✅ No manual activation needed
- ✅ Claude 3.5 Sonnet available instantly
- ✅ No waiting for approval
- ✅ Works in all AWS regions

### Verify (Optional):
```bash
# List available models
aws bedrock list-foundation-models --region us-east-1 --by-provider anthropic

# You should see:
# - anthropic.claude-3-sonnet-20240229-v1:0
# - anthropic.claude-3-haiku-20240307-v1:0
# - anthropic.claude-3-5-sonnet-20240620-v1:0
```

---

## Step 3: Deploy Infrastructure (15-20 minutes)

### 3.1 Install Dependencies
```bash
cd infrastructure
npm install
```

### 3.2 Build TypeScript
```bash
npm run build
```

### 3.3 Bootstrap CDK (First Time Only)
```bash
npx cdk bootstrap
```

Expected output:
```
✅ Environment aws://YOUR_ACCOUNT/us-east-1 bootstrapped
```

### 3.4 Preview Deployment
```bash
npx cdk diff
```

This shows what will be created:
- DynamoDB table
- Lambda functions (4 agents)
- API Gateway (REST + WebSocket)
- Cognito User Pool
- IAM roles
- CloudWatch logs

### 3.5 Deploy
```bash
npx cdk deploy --all --require-approval never --outputs-file cdk-outputs.json
```

**This takes 10-15 minutes**. You'll see:
```
✅ OmniTrackStack: creating CloudFormation changeset...
✅ OmniTrackStack: deploying...
✅ OmniTrackStack: creating resources...
```

### 3.6 Save Outputs
After deployment, CDK creates `cdk-outputs.json` with:
- API Gateway URL
- WebSocket URL
- Cognito User Pool ID
- Cognito Client ID

---

## Step 4: Configure Frontend (5 minutes)

### 4.1 Extract CDK Outputs
```bash
cd infrastructure

# View outputs
cat cdk-outputs.json

# Or use jq to extract specific values
jq -r '.OmniTrackStack.RestApiUrl' cdk-outputs.json
jq -r '.OmniTrackStack.WebSocketApiUrl' cdk-outputs.json
jq -r '.OmniTrackStack.UserPoolId' cdk-outputs.json
jq -r '.OmniTrackStack.UserPoolClientId' cdk-outputs.json
```

### 4.2 Update Frontend Config
```bash
cd ../frontend
```

Create `frontend/.env.local`:
```bash
# Copy these from cdk-outputs.json
NEXT_PUBLIC_API_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_WEBSOCKET_URL=wss://YOUR_WS_ID.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_COPILOT_WEBSOCKET_URL=wss://YOUR_COPILOT_WS_ID.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_AWS_REGION=us-east-1
```

---

## Step 5: Test Deployment (5 minutes)

### 5.1 Test API Gateway
```bash
# Get API URL
API_URL=$(jq -r '.OmniTrackStack.RestApiUrl' infrastructure/cdk-outputs.json)

# Test health endpoint (if implemented)
curl $API_URL/health

# Should return: {"status":"ok"}
```

### 5.2 Test Bedrock Integration
```bash
cd infrastructure/lambda
npx ts-node demo/verify-bedrock-access.ts
```

Expected output:
```
✅ Bedrock access verified
✅ Claude 3.5 Sonnet available
✅ Response time: <3s
```

### 5.3 Build and Run Frontend
```bash
cd ../../frontend
npm install
npm run build
npm start
```

Visit: `http://localhost:3000`

### 5.4 Test Full Flow
1. Click "Get Started"
2. Click "Sign Up" (creates Cognito user)
3. Enter email and password
4. Verify email (check inbox)
5. Login
6. Dashboard loads with real data
7. Click "🔍 Scan for Anomalies"
8. See real Bedrock AI response!
9. Open AI Copilot
10. Type message, get real AI response!

---

## Step 6: Verify Everything Works

### Checklist
- [ ] Frontend loads at localhost:3000
- [ ] Can create account (Cognito)
- [ ] Can login
- [ ] Dashboard shows supply chain
- [ ] Agent controls work
- [ ] AI Copilot responds with real AI
- [ ] Real-time data updates
- [ ] No console errors

### View Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/omnitrack-info-agent --follow --region us-east-1

# View API Gateway logs
aws logs tail /aws/apigateway/omnitrack-api --follow --region us-east-1
```

---

## 🐛 Troubleshooting

### Issue: CDK Bootstrap Fails
```bash
# Error: "Unable to resolve AWS account"
# Fix: Configure AWS credentials
aws configure

# Error: "Region not set"
# Fix: Set default region
aws configure set region us-east-1
```

### Issue: CDK Deploy Fails
```bash
# Error: "Stack already exists"
# Fix: Destroy and redeploy
npx cdk destroy --all
npx cdk deploy --all

# Error: "Insufficient permissions"
# Fix: Ensure IAM user has AdministratorAccess or required permissions
```

### Issue: Bedrock Access Denied
```bash
# Error: "AccessDeniedException"
# Fix: Models auto-enable on first use, just try again
# Or check: aws bedrock list-foundation-models --region us-east-1
```

### Issue: Frontend Can't Connect
```bash
# Error: "Failed to fetch"
# Fix: Check .env.local has correct API URL
cat frontend/.env.local

# Fix: Check API Gateway is deployed
aws apigateway get-rest-apis --region us-east-1

# Fix: Check CORS settings in API Gateway
```

### Issue: High AWS Costs
```bash
# Check current costs
aws ce get-cost-and-usage \
  --time-period Start=2024-11-01,End=2024-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost

# Destroy everything to stop costs
cd infrastructure
npx cdk destroy --all
```

---

## 💰 Cost Estimate

### Hackathon Weekend (48 hours)
- **DynamoDB**: $0.50 (on-demand)
- **Lambda**: $1.00 (1M requests free tier)
- **API Gateway**: $1.00 (1M requests free tier)
- **Bedrock**: $3-5 (depends on usage)
- **CloudWatch**: $0.50 (logs)
- **Cognito**: $0 (free tier)

**Total**: ~$5-10 for hackathon weekend

### After Hackathon
```bash
# Destroy everything to avoid ongoing costs
cd infrastructure
npx cdk destroy --all

# Confirm deletion
# Type: yes
```

---

## 🎯 What to Show Judges

### With AWS Deployment
1. **Real AI Responses**: "This is using Amazon Bedrock Claude 3.5 Sonnet"
2. **Production Architecture**: "Deployed on AWS Lambda, DynamoDB, API Gateway"
3. **Scalability**: "Serverless architecture scales automatically"
4. **Monitoring**: "CloudWatch dashboards track all metrics"
5. **Security**: "Cognito authentication, encrypted data"

### Demo Flow
1. Show landing page
2. Create account (real Cognito)
3. Login (real authentication)
4. Dashboard with live data
5. Run agent (real Bedrock AI)
6. AI Copilot (real conversation)
7. Show CloudWatch dashboard (optional)

---

## 📊 Deployment Status

### After Successful Deployment

**Infrastructure**:
- ✅ DynamoDB table created
- ✅ Lambda functions deployed (4 agents)
- ✅ API Gateway configured
- ✅ Cognito User Pool created
- ✅ CloudWatch monitoring enabled
- ✅ IAM roles configured

**Frontend**:
- ✅ Connected to API Gateway
- ✅ Connected to WebSocket
- ✅ Cognito authentication working
- ✅ Real Bedrock AI responses
- ✅ Real-time data from DynamoDB

**Capabilities**:
- ✅ User signup/login
- ✅ Real-time supply chain monitoring
- ✅ AI agent collaboration
- ✅ Natural language AI Copilot
- ✅ Data persistence
- ✅ Production-ready architecture

---

## 🚀 Quick Commands Reference

```bash
# Deploy everything
cd infrastructure && npx cdk deploy --all

# Destroy everything
cd infrastructure && npx cdk destroy --all

# View logs
aws logs tail /aws/lambda/omnitrack-info-agent --follow

# Check costs
aws ce get-cost-and-usage --time-period Start=2024-11-01,End=2024-11-30 --granularity MONTHLY --metrics BlendedCost

# Test API
curl $(jq -r '.OmniTrackStack.RestApiUrl' infrastructure/cdk-outputs.json)/health

# Start frontend
cd frontend && npm run dev

# Build frontend
cd frontend && npm run build && npm start
```

---

## ✅ Final Checklist

### Before Demo
- [ ] AWS infrastructure deployed
- [ ] Frontend configured with API URLs
- [ ] Test account created
- [ ] Agent controls tested
- [ ] AI Copilot tested
- [ ] No console errors
- [ ] CloudWatch dashboard accessible

### During Demo
- [ ] Show real Bedrock AI responses
- [ ] Mention AWS services used
- [ ] Highlight production-ready architecture
- [ ] Show CloudWatch monitoring (optional)
- [ ] Explain scalability

### After Hackathon
- [ ] Destroy AWS resources: `npx cdk destroy --all`
- [ ] Verify no ongoing costs
- [ ] Save cdk-outputs.json for future reference

---

## 🎉 You're Ready to Deploy!

**Remember**: Demo mode works perfectly for hackathon. AWS deployment is optional but impressive if you have time!

**Choose your path**:
- **Demo Mode**: 2 minutes, $0, works great
- **AWS Deployment**: 45 minutes, $5-10, production-ready

Both are valid choices. Pick what makes sense for your timeline!

---

**Good luck! 🚀**
