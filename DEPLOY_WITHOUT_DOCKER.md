# 🚀 Deploy OmniTrack AI Without Docker

Quick guide to deploy Lambda functions without Docker.

## ⚡ Quick Start (30 seconds)

```bash
# 1. Install esbuild
npm install -g esbuild

# 2. Enable local bundling
cd infrastructure
./enable-local-bundling.sh

# 3. Deploy
cdk deploy --all
```

Done! No Docker required.

## 📋 What This Does

The script adds `forceDockerBundling: false` to all Lambda function bundling configurations, which tells AWS CDK to use your local esbuild instead of Docker.

**Before:**
```typescript
bundling: {
  minify: true,
  sourceMap: true,
  externalModules: ['aws-sdk'],
}
```

**After:**
```typescript
bundling: {
  forceDockerBundling: false,  // ← This line added
  minify: true,
  sourceMap: true,
  externalModules: ['aws-sdk'],
}
```

## ✅ Benefits

- ⚡ **10x faster** - Builds in 30-60 seconds vs 5-10 minutes
- 💾 **99% less disk space** - No 60GB Docker images
- 🎯 **Simpler** - Just install esbuild
- 🔧 **No Docker issues** - Eliminates Docker Desktop problems
- 🚀 **Better caching** - esbuild caches efficiently

## 🛠️ Prerequisites

### Install esbuild

```bash
npm install -g esbuild
```

Verify:
```bash
esbuild --version
```

## 📖 Detailed Guides

- **[NO_DOCKER_DEPLOYMENT.md](./NO_DOCKER_DEPLOYMENT.md)** - Complete guide with troubleshooting
- **[DOCKER_ALTERNATIVES_GUIDE.md](./DOCKER_ALTERNATIVES_GUIDE.md)** - All alternative approaches

## 🔄 Reverting Changes

If you need to go back to Docker bundling:

```bash
cd infrastructure
cp lib/infrastructure-stack.ts.backup lib/infrastructure-stack.ts
```

## 🐛 Troubleshooting

### "esbuild not found"
```bash
npm install -g esbuild
```

### "Permission denied"
```bash
chmod +x infrastructure/enable-local-bundling.sh
```

### Deployment fails
```bash
# Check for TypeScript errors
cd infrastructure
npx tsc --noEmit

# Try synthesis first
cdk synth
```

## 📊 Performance Comparison

| Method | Build Time | Disk Space |
|--------|-----------|------------|
| **Docker** | 5-10 min | 60GB+ |
| **Local esbuild** | 30-60 sec | <1GB |

## 🎯 Next Steps

After enabling local bundling:

1. **Test locally:**
   ```bash
   cd infrastructure
   cdk synth
   ```

2. **Deploy to AWS:**
   ```bash
   cdk deploy --all
   ```

3. **Verify functions:**
   ```bash
   aws lambda list-functions
   ```

## 💡 Tips

- Run `./enable-local-bundling.sh` anytime you add new Lambda functions
- Keep esbuild updated: `npm update -g esbuild`
- Use `cdk synth` to test before deploying
- Check bundle sizes: `cdk synth --quiet | grep "Code size"`

## 📚 More Information

- [AWS CDK Lambda Bundling Docs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs-readme.html)
- [esbuild Documentation](https://esbuild.github.io/)
- [Lambda Deployment Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

---

**Need help?** Check [NO_DOCKER_DEPLOYMENT.md](./NO_DOCKER_DEPLOYMENT.md) for detailed troubleshooting.
