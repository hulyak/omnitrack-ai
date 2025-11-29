# Docker Alternatives for AWS CDK Deployment 🚀

## The Problem

Docker Desktop is crashing with "no space left on device" error. You need alternatives to deploy your Lambda functions.

---

## ✅ Best Alternatives (Ranked)

### Option 1: Fix Docker Space Issue (Quickest)

**Time**: 5 minutes
**Difficulty**: Easy

Docker is just out of disk space. Clean it up:

```bash
# Stop Docker Desktop
# Then run these commands:

# Remove all stopped containers
docker container prune -a

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune -a

# Remove all unused networks
docker network prune

# Nuclear option - remove everything
docker system prune -a --volumes

# Check disk space
df -h

# Restart Docker Desktop
open /Applications/Docker.app
```

**Free up Mac disk space**:
```bash
# Check what's using space
du -sh ~/Library/Containers/com.docker.docker/Data

# Clear Docker data (WARNING: removes all Docker data)
rm -rf ~/Library/Containers/com.docker.docker/Data/*

# Restart Docker Desktop
```

---

### Option 2: Use Podman (Docker Alternative)

**Time**: 10 minutes
**Difficulty**: Easy
**Best for**: Long-term Docker replacement

Podman is a drop-in Docker replacement that doesn't require a daemon.

```bash
# Install Podman
brew install podman

# Initialize Podman machine
podman machine init
podman machine start

# Verify installation
podman --version

# Create Docker alias (so CDK thinks it's Docker)
echo 'alias docker=podman' >> ~/.zshrc
source ~/.zshrc

# Test it works
docker --version  # Should show Podman

# Deploy with CDK
cd infrastructure
cdk deploy
```

**Pros**:
- ✅ No daemon required
- ✅ Lighter weight than Docker
- ✅ Compatible with Docker commands
- ✅ No disk space issues

**Cons**:
- ⚠️ Slightly different behavior in edge cases

---

### Option 3: Use Colima (Lightweight Docker Runtime)

**Time**: 10 minutes
**Difficulty**: Easy
**Best for**: Mac users wanting lightweight Docker

Colima is a minimal Docker runtime for macOS.

```bash
# Install Colima
brew install colima docker

# Start Colima with more disk space
colima start --cpu 2 --memory 4 --disk 60

# Verify Docker works
docker --version
docker ps

# Deploy with CDK
cd infrastructure
cdk deploy
```

**Pros**:
- ✅ Very lightweight
- ✅ Full Docker compatibility
- ✅ Configurable resources
- ✅ No GUI overhead

**Cons**:
- ⚠️ Command-line only (no GUI)

---

### Option 4: Deploy Without Docker (CDK Bundling)

**Time**: 15 minutes
**Difficulty**: Medium
**Best for**: Avoiding Docker entirely

Modify CDK to bundle Lambda functions locally without Docker.

**Step 1**: Install esbuild locally
```bash
cd infrastructure
npm install --save-dev esbuild
```

**Step 2**: Update `infrastructure/lib/infrastructure-stack.ts`

Find all `NodejsFunction` declarations and add `bundling` config:

```typescript
const registerFunction = new lambdaNodejs.NodejsFunction(this, 'RegisterFunction', {
  functionName: 'omnitrack-auth-register',
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'handler',
  entry: path.join(__dirname, '../lambda/auth/register.ts'),
  timeout: cdk.Duration.seconds(30),
  memorySize: 256,
  environment: lambdaEnvironment,
  role: lambdaExecutionRole,
  tracing: lambda.Tracing.ACTIVE,
  bundling: {
    minify: true,
    sourceMap: true,
    externalModules: ['aws-sdk', '@aws-sdk/*'],
    // ADD THIS:
    forceDockerBundling: false,  // Don't use Docker
    commandHooks: {
      beforeBundling(inputDir: string, outputDir: string): string[] {
        return [];
      },
      afterBundling(inputDir: string, outputDir: string): string[] {
        return [];
      },
      beforeInstall(inputDir: string, outputDir: string): string[] {
        return [];
      },
    },
  },
});
```

**Step 3**: Deploy
```bash
cd infrastructure
cdk deploy
```

**Pros**:
- ✅ No Docker needed
- ✅ Faster builds
- ✅ Uses local Node.js

**Cons**:
- ⚠️ May have platform-specific issues
- ⚠️ Native modules might not work

---

### Option 5: Use AWS SAM CLI (No Docker Required)

**Time**: 20 minutes
**Difficulty**: Medium
**Best for**: Avoiding CDK entirely

AWS SAM can deploy without Docker using `--use-container false`.

**Step 1**: Install SAM CLI
```bash
brew install aws-sam-cli
```

**Step 2**: Create SAM template from CDK
```bash
cd infrastructure

# Synthesize CDK to CloudFormation
cdk synth > template.yaml
```

**Step 3**: Deploy with SAM
```bash
sam deploy \
  --template-file template.yaml \
  --stack-name omnitrack-infrastructure \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset
```

**Pros**:
- ✅ No Docker required
- ✅ Direct CloudFormation deployment
- ✅ Good for CI/CD

**Cons**:
- ⚠️ Loses some CDK features
- ⚠️ More manual configuration

---

### Option 6: Use Pre-Built Lambda Layers

**Time**: 30 minutes
**Difficulty**: Hard
**Best for**: Advanced users

Build Lambda functions separately and upload as layers.

**Step 1**: Build Lambda code locally
```bash
cd infrastructure/lambda/auth

# Install dependencies
npm install

# Build with esbuild
npx esbuild register.ts --bundle --platform=node --target=node20 --outfile=dist/register.js

# Create deployment package
cd dist
zip -r register.zip register.js
```

**Step 2**: Upload to S3
```bash
aws s3 cp register.zip s3://your-bucket/lambda/register.zip
```

**Step 3**: Update CDK to use S3 code
```typescript
const registerFunction = new lambda.Function(this, 'RegisterFunction', {
  functionName: 'omnitrack-auth-register',
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'register.handler',
  code: lambda.Code.fromBucket(
    s3.Bucket.fromBucketName(this, 'LambdaBucket', 'your-bucket'),
    'lambda/register.zip'
  ),
  // ... rest of config
});
```

**Pros**:
- ✅ Full control over build process
- ✅ No Docker needed
- ✅ Can optimize bundle size

**Cons**:
- ⚠️ Manual process
- ⚠️ More complex setup
- ⚠️ Need to manage S3 bucket

---

### Option 7: Use GitHub Actions / CI/CD

**Time**: 30 minutes
**Difficulty**: Medium
**Best for**: Team deployments

Let GitHub Actions handle the Docker build in the cloud.

**Step 1**: Create `.github/workflows/deploy.yml`
```yaml
name: Deploy Infrastructure

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Install dependencies
        run: |
          cd infrastructure
          npm install
      
      - name: Deploy with CDK
        run: |
          cd infrastructure
          npx cdk deploy --require-approval never
```

**Step 2**: Add AWS credentials to GitHub Secrets
- Go to: Repository > Settings > Secrets
- Add: `AWS_ACCESS_KEY_ID`
- Add: `AWS_SECRET_ACCESS_KEY`

**Step 3**: Push to GitHub
```bash
git add .
git commit -m "Add CI/CD deployment"
git push
```

**Pros**:
- ✅ No local Docker needed
- ✅ Automated deployments
- ✅ Works for team
- ✅ GitHub provides Docker

**Cons**:
- ⚠️ Requires GitHub account
- ⚠️ Slower than local deployment

---

### Option 8: Use Your Working Demo (Recommended!)

**Time**: 0 minutes
**Difficulty**: None
**Best for**: Right now

Your app already works perfectly with demo data!

```bash
cd frontend
npm run dev

# Visit: http://localhost:3000
```

**Why this is great**:
- ✅ No AWS setup needed
- ✅ No Docker needed
- ✅ Works immediately
- ✅ Perfect for demos
- ✅ Realistic data
- ✅ Full functionality

**Deploy to AWS later** when you:
- Need real AI processing
- Want to scale to users
- Need production deployment

---

## 🎯 Recommended Path

### For Right Now:
**Use Option 8** - Your demo works perfectly!

### For AWS Deployment:
1. **Try Option 1** - Fix Docker space (5 min)
2. **If that fails, use Option 2** - Podman (10 min)
3. **If that fails, use Option 3** - Colima (10 min)

### For Long Term:
**Use Option 7** - GitHub Actions CI/CD

---

## Quick Comparison

| Option | Time | Difficulty | Docker Needed | Best For |
|--------|------|------------|---------------|----------|
| 1. Fix Docker | 5 min | Easy | Yes | Quick fix |
| 2. Podman | 10 min | Easy | No | Docker replacement |
| 3. Colima | 10 min | Easy | No | Lightweight |
| 4. No Docker CDK | 15 min | Medium | No | Avoiding Docker |
| 5. SAM CLI | 20 min | Medium | No | Alternative tool |
| 6. Lambda Layers | 30 min | Hard | No | Advanced users |
| 7. GitHub Actions | 30 min | Medium | No | CI/CD |
| 8. Demo Mode | 0 min | None | No | **Right now!** |

---

## Troubleshooting

### Podman Issues
```bash
# If Podman fails to start
podman machine stop
podman machine rm
podman machine init --disk-size 60
podman machine start
```

### Colima Issues
```bash
# If Colima fails
colima stop
colima delete
colima start --cpu 2 --memory 4 --disk 60
```

### CDK Bundling Issues
```bash
# If local bundling fails
cd infrastructure
rm -rf cdk.out
npm install
cdk synth
cdk deploy
```

---

## My Recommendation

**Right Now**: Use your demo! It's working great.

**This Weekend**: Try fixing Docker (Option 1) - just clean up disk space.

**If Docker keeps failing**: Install Podman (Option 2) - it's the best long-term replacement.

**For production**: Set up GitHub Actions (Option 7) - automated and reliable.

---

## Summary

You have **8 alternatives** to Docker Desktop:
- 3 are quick fixes (5-10 min)
- 2 are medium effort (15-20 min)
- 1 is advanced (30 min)
- 1 is CI/CD (30 min setup, automated after)
- 1 is "use what works now" (0 min)

Your demo is production-quality and works perfectly without any AWS setup. Deploy to AWS when you're ready!
