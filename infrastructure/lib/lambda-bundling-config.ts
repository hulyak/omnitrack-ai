/**
 * Lambda Bundling Configuration for Local Bundling (No Docker)
 * 
 * This configuration forces CDK to use local esbuild instead of Docker
 * for bundling Lambda functions.
 */

import { BundlingOptions } from 'aws-cdk-lib/aws-lambda-nodejs';

/**
 * Standard bundling configuration for Lambda functions
 * Uses local esbuild without Docker
 */
export const localBundlingConfig: Partial<BundlingOptions> = {
  minify: true,
  sourceMap: true,
  externalModules: ['aws-sdk', '@aws-sdk/*'],
  forceDockerBundling: false, // Force local bundling without Docker
  target: 'node20',
  format: 'esm' as any,
  mainFields: ['module', 'main'],
  loader: {
    '.node': 'file',
  },
  logLevel: 'warning' as any,
};

/**
 * Bundling configuration for VPC Lambda functions
 * Includes additional optimizations for VPC-connected functions
 */
export const vpcBundlingConfig: Partial<BundlingOptions> = {
  ...localBundlingConfig,
  // VPC functions may need additional node modules
  nodeModules: [
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb',
    '@aws-sdk/client-secrets-manager',
    'ioredis',
  ],
};

/**
 * Bundling configuration for Copilot Lambda functions
 * Includes Bedrock SDK dependencies
 */
export const copilotBundlingConfig: Partial<BundlingOptions> = {
  ...localBundlingConfig,
  nodeModules: [
    '@aws-sdk/client-bedrock-runtime',
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb',
  ],
};

/**
 * Bundling configuration for IoT Lambda functions
 * Includes IoT-specific dependencies
 */
export const iotBundlingConfig: Partial<BundlingOptions> = {
  ...vpcBundlingConfig,
  nodeModules: [
    ...(vpcBundlingConfig.nodeModules || []),
    '@aws-sdk/client-iot-data-plane',
  ],
};
