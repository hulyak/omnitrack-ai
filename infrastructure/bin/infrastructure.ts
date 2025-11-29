#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = new cdk.App();

// Get AWS account and region from environment variables or use defaults
const account = process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const stackName = process.env.STACK_NAME || 'omnitrack-ai';

new InfrastructureStack(app, stackName, {
  env: {
    account,
    region,
  },
  description: 'OmniTrack AI Supply Chain Management Platform Infrastructure',
  tags: {
    Project: 'OmniTrack AI',
    Environment: process.env.ENVIRONMENT || 'development',
    ManagedBy: 'AWS CDK',
  },
});
