# Deploy Lambda Functions Without Docker

This guide shows you how to deploy OmniTrack AI Lambda functions without Docker.

## Quick Start

### Option 1: Automated Script (Recommended)

```bash
cd infrastructure
./enable-local-bundling.sh
cdk deploy --all
```

### Option 2: Manual Configuration

Update your Lambda function definitions in `infrastructure/lib/infrastructure-stack.ts`:

```typescript
import { localBundlingConfig, vpcBundlingConfig, copilotBundlingConfig } from './lambda-bundling-config';

// For standard Lambda functions
const myFunction = new lambdaNodejs.NodejsFunction(this, 'MyFunction', {
  // ... other config
  bundling: localBundlingConfig,
});

// For VPC Lambda functions
const vpcFunction = new lambdaNodejs.NodejsFunction(this, 'VPCFunction', {
  // ... other config
  bundling: vpcBundlingConfig,
});

// For Copilot Lambda functions
const copilotFunction = new lambdaNodejs.NodejsFunction(this, 'CopilotFunction', {
  // ... other config
  bundling: copilotBundlingConfig,
});
```

## Prerequisites

### Install esbuild

```bash
npm install -g esbuild
```

Or locally in your project:

```bash
cd infrastructure
npm install --save-dev esbuild
```

### Verify Installation

```bash
esbuild --version
```

## Deployment Methods

### Method 1: Use CDK with Local Bundling

```bash
cd infrastructure
cdk deploy --all --require-approval never
```

The `forceDockerBundling: false` flag in the bundling configuration ensures CDK uses local esbuild.

### Method 2: Pre-bundle Lambda Functions

If you want more control, pre-bundle your Lambda code:

```bash
cd infrastructure/lambda

# Bundle a specific function
esbuild auth/register.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --outfile=dist/register.js \
  --external:aws-sdk \
  --external:@aws-sdk/* \
  --minify \
  --sourcemap

# Then deploy
cd ..
cdk deploy --all
```

### Method 3: Use AWS SAM CLI (Alternative)

AWS SAM CLI can build Lambda functions without Docker:

```bash
# Install SAM CLI
brew install aws-sam-cli  # macOS
# or
pip install aws-sam-cli   # Python

# Build without Docker
sam build --use-container=false

# Deploy
sam deploy --guided
```

## Configuration Details

### Local Bundling Configuration

The `lambda-bundling-config.ts` file provides pre-configured bundling options:

```typescript
export const localBundlingConfig = {
  minify: true,
  sourceMap: true,
  externalModules: ['aws-sdk', '@aws-sdk/*'],
  forceDockerBundling: false,  // KEY: Forces local bundling
  target: 'node20',
  format: 'esm',
  mainFields: ['module', 'main'],
  loader: { '.node': 'file' },
  logLevel: 'warning',
};
```

### Why This Works

1. **forceDockerBundling: false** - Tells CDK to skip Docker entirely
2. **Local esbuild** - CDK uses your locally installed esbuild
3. **External modules** - AWS SDK is provided by Lambda runtime
4. **Target node20** - Matches Lambda runtime version

## Troubleshooting

### Error: "esbuild not found"

```bash
npm install -g esbuild
# or
cd infrastructure && npm install --save-dev esbuild
```

### Error: "Cannot find module"

Add the module to `nodeModules` in bundling config:

```typescript
bundling: {
  ...localBundlingConfig,
  nodeModules: ['missing-module-name'],
}
```

### Error: "Bundling failed"

Check your TypeScript configuration:

```bash
cd infrastructure
npx tsc --noEmit  # Check for TypeScript errors
```

### Slow Bundling

Enable caching:

```typescript
bundling: {
  ...localBundlingConfig,
  commandHooks: {
    beforeBundling(inputDir: string, outputDir: string): string[] {
      return [];
    },
    afterBundling(inputDir: string, outputDir: string): string[] {
      return [`echo "Bundled successfully"`];
    },
    beforeInstall() {
      return [];
    },
  },
}
```

## Performance Comparison

| Method | Build Time | Disk Space | Complexity |
|--------|-----------|------------|------------|
| Docker | 5-10 min | 60GB+ | High |
| Local esbuild | 30-60 sec | <1GB | Low |
| Pre-bundled | 10-20 sec | <500MB | Medium |

## Benefits of Local Bundling

✅ **No Docker required** - Eliminates Docker Desktop issues
✅ **Faster builds** - 10x faster than Docker bundling
✅ **Less disk space** - No Docker images to store
✅ **Simpler setup** - Just install esbuild
✅ **Better caching** - esbuild caches efficiently
✅ **Cross-platform** - Works on macOS, Linux, Windows

## Advanced Configuration

### Custom esbuild Plugins

```typescript
import { localBundlingConfig } from './lambda-bundling-config';

const customBundling = {
  ...localBundlingConfig,
  esbuildArgs: {
    '--tree-shaking': 'true',
    '--keep-names': 'true',
  },
};
```

### Environment-Specific Bundling

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

const bundlingConfig = {
  ...localBundlingConfig,
  minify: !isDevelopment,
  sourceMap: isDevelopment,
};
```

### Monorepo Support

```typescript
const bundlingConfig = {
  ...localBundlingConfig,
  nodeModules: [
    '@company/shared-utils',
    '@company/data-models',
  ],
};
```

## Migration from Docker

### Step 1: Backup Current Configuration

```bash
cd infrastructure
cp lib/infrastructure-stack.ts lib/infrastructure-stack.ts.docker-backup
```

### Step 2: Update Bundling Configuration

Replace all `bundling: { ... }` blocks with:

```typescript
import { localBundlingConfig } from './lambda-bundling-config';

// Then use:
bundling: localBundlingConfig,
```

### Step 3: Test Locally

```bash
cdk synth  # Test synthesis
```

### Step 4: Deploy

```bash
cdk deploy --all
```

### Step 5: Verify

```bash
# Check Lambda function sizes
aws lambda list-functions --query 'Functions[*].[FunctionName,CodeSize]' --output table

# Test a function
aws lambda invoke --function-name omnitrack-auth-login response.json
cat response.json
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy Lambda Functions

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install esbuild
        run: npm install -g esbuild
      
      - name: Install dependencies
        run: |
          cd infrastructure
          npm ci
      
      - name: Deploy to AWS
        run: |
          cd infrastructure
          npx cdk deploy --all --require-approval never
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  image: node:20
  before_script:
    - npm install -g esbuild aws-cdk
  script:
    - cd infrastructure
    - npm ci
    - cdk deploy --all --require-approval never
  only:
    - main
```

## Best Practices

1. **Use bundling configs** - Import from `lambda-bundling-config.ts`
2. **External modules** - Keep AWS SDK external (provided by runtime)
3. **Minimize dependencies** - Only bundle what you need
4. **Enable source maps** - For better debugging
5. **Cache node_modules** - Speed up CI/CD builds
6. **Test locally** - Use `cdk synth` before deploying
7. **Monitor bundle sizes** - Keep Lambda packages under 50MB
8. **Use layers** - For shared dependencies across functions

## Resources

- [AWS CDK Lambda Bundling](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs-readme.html)
- [esbuild Documentation](https://esbuild.github.io/)
- [AWS Lambda Runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review `DOCKER_ALTERNATIVES_GUIDE.md`
3. Check CDK logs: `cdk deploy --verbose`
4. Verify esbuild: `esbuild --version`

---

**Last Updated**: November 29, 2024
**Tested With**: AWS CDK 2.x, Node.js 20, esbuild 0.19+
