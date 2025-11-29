#!/bin/bash

# CDK Deployment Script for OmniTrack AI
# This script ensures CDK commands run from the correct directory

set -e

echo "🚀 OmniTrack AI - CDK Deployment"
echo "================================"
echo ""

# Change to infrastructure directory
cd "$(dirname "$0")"

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Please run: aws configure"
    exit 1
fi

echo "✅ AWS credentials configured"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Bootstrap CDK if needed (first time only)
echo "🔧 Checking CDK bootstrap status..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
    echo "⚠️  CDK not bootstrapped. Bootstrapping now..."
    npx cdk bootstrap
    echo ""
fi

# Synthesize the stack
echo "🔨 Synthesizing CDK stack..."
npx cdk synth
echo ""

# Deploy the stack
echo "🚀 Deploying to AWS..."
npx cdk deploy --require-approval never

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Check AWS Console for deployed resources"
echo "2. Note the API Gateway URL from the outputs"
echo "3. Update frontend/.env.local with the API URL"
