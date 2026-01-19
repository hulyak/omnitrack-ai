# CDK Bootstrap Guide

## What is CDK Bootstrap?

CDK Bootstrap is a one-time setup that prepares your AWS environment for CDK deployments. It creates:
- S3 bucket for storing CloudFormation templates
- IAM roles for deployment
- ECR repository for Docker images (not needed for us since we use local bundling)
- SSM parameters for version tracking

## Bootstrap Your Environment

Run this command once per AWS account/region:

```bash
cd infrastructure
npx cdk bootstrap
```

This will:
1. Create a CloudFormation stack called `CDKToolkit`
2. Set up necessary AWS resources
3. Configure permissions for deployments

## After Bootstrap

Once bootstrapped, you can deploy:

```bash
# Option 1: Use the deployment script
./infrastructure/cdk-deploy.sh

# Option 2: Manual deployment
cd infrastructure
npx cdk deploy
```

## Verify Bootstrap

Check if already bootstrapped:

```bash
aws cloudformation describe-stacks --stack-name CDKToolkit
```

If you see stack details, you're already bootstrapped.

## Troubleshooting

### Error: "Unable to resolve AWS account"
```bash
aws configure
# Enter your credentials
```

### Error: "Access Denied"
Your AWS user needs these permissions:
- CloudFormation full access
- S3 full access
- IAM role creation
- SSM parameter access

### Multiple Regions
Bootstrap each region separately:
```bash
npx cdk bootstrap aws://ACCOUNT-ID/us-east-1
npx cdk bootstrap aws://ACCOUNT-ID/us-west-2
```

## What Gets Created

The bootstrap stack creates:
- **S3 Bucket**: `cdk-hnb659fds-assets-{account}-{region}`
- **IAM Roles**: 
  - `cdk-hnb659fds-deploy-role-{account}-{region}`
  - `cdk-hnb659fds-file-publishing-role-{account}-{region}`
  - `cdk-hnb659fds-lookup-role-{account}-{region}`
- **SSM Parameter**: `/cdk-bootstrap/hnb659fds/version`

## Cost

Bootstrap resources are free tier eligible:
- S3 bucket: Pay only for storage used
- IAM roles: Free
- SSM parameters: Free

---

**Status**: Ready to Bootstrap
**Next Step**: Run `npx cdk bootstrap` from the infrastructure directory
