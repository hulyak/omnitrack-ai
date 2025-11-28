# OmniTrack AI Infrastructure

This directory contains the AWS CDK infrastructure code for the OmniTrack AI Supply Chain platform.

## Architecture Overview

The infrastructure implements a cloud-native, serverless architecture with the following components:

### Networking
- **VPC**: Multi-AZ VPC with public and private subnets across 3 availability zones
- **NAT Gateways**: One per AZ for high availability
- **VPC Flow Logs**: Enabled for security monitoring

### Data Storage
- **DynamoDB**: Single-table design with GSI1 and GSI2 for flexible querying
  - GSI1: Query by type and timestamp
  - GSI2: Query by status and priority
  - Point-in-time recovery enabled
  - DynamoDB Streams enabled for change data capture
- **S3 Buckets**:
  - Digital Twin Snapshots: Versioned with 90-day lifecycle
  - Model Artifacts: Versioned with tiered storage (IA after 30 days, Glacier after 90 days)

### Authentication & Authorization
- **Amazon Cognito User Pool**: User authentication with email/username sign-in
  - Password policy: 12+ characters with complexity requirements
  - MFA support (SMS and TOTP)
  - Custom attributes for role and organization
  - Account recovery via email

### API Layer
- **REST API Gateway**: 
  - CORS enabled
  - CloudWatch logging and X-Ray tracing enabled
  - Access logs in JSON format
  - Placeholder resources: auth, digital-twin, scenarios, alerts, marketplace, sustainability
- **WebSocket API Gateway**: For real-time updates
  - Route selection based on action field
  - CloudWatch logging enabled

### Monitoring & Observability
- **CloudWatch Log Groups**:
  - API Gateway access logs
  - WebSocket API logs
  - Application logs
  - Lambda function logs
  - VPC Flow Logs
- **X-Ray Tracing**: Enabled on API Gateway for distributed tracing

## Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- AWS CDK CLI: `npm install -g aws-cdk`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Bootstrap CDK (first time only):
```bash
npx cdk bootstrap
```

## Deployment

### Synthesize CloudFormation template
```bash
npm run cdk synth
```

### Deploy to AWS
```bash
npx cdk deploy
```

### View differences before deployment
```bash
npx cdk diff
```

### Destroy the stack
```bash
npx cdk destroy
```

## Stack Outputs

After deployment, the following outputs are available:

- `VpcId`: VPC identifier
- `DynamoDBTableName`: Main DynamoDB table name
- `DynamoDBTableArn`: Main DynamoDB table ARN
- `UserPoolId`: Cognito User Pool ID
- `UserPoolClientId`: Cognito User Pool Client ID
- `UserPoolArn`: Cognito User Pool ARN
- `RestApiUrl`: REST API Gateway endpoint URL
- `RestApiId`: REST API Gateway ID
- `WebSocketApiId`: WebSocket API Gateway ID
- `WebSocketApiUrl`: WebSocket API Gateway endpoint URL
- `DigitalTwinBucketName`: S3 bucket for digital twin snapshots
- `ModelArtifactsBucketName`: S3 bucket for ML model artifacts
- `ApplicationLogGroupName`: CloudWatch log group for application logs

## Development

### Watch mode
```bash
npm run watch
```

### Run tests
```bash
npm test
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Formatting
```bash
npm run format
npm run format:check
```

## Security Considerations

- All S3 buckets have public access blocked and SSL enforcement enabled
- DynamoDB table uses AWS-managed encryption
- VPC Flow Logs capture all network traffic for security analysis
- Cognito User Pool enforces strong password policies
- API Gateway has CloudWatch logging enabled for audit trails

## Cost Optimization

- DynamoDB uses on-demand billing mode
- S3 lifecycle policies automatically transition old data to cheaper storage tiers
- NAT Gateways are deployed per AZ for high availability (consider reducing for dev/test environments)
- CloudWatch log retention is set to 1 month to control costs

## Next Steps

Future tasks will add:
- Lambda functions for business logic
- IoT Core integration for sensor data
- Amazon Bedrock integration for AI agents
- ElastiCache Redis for caching
- OpenSearch for scenario search
- Step Functions for multi-agent orchestration
- SNS topics for notifications
- SageMaker for ML model training

## Useful Commands

* `npm run build`   - Compile TypeScript to JavaScript
* `npm run watch`   - Watch for changes and compile
* `npm run test`    - Run Jest unit tests
* `npm run cdk synth` - Synthesize CloudFormation template
* `npm run cdk deploy` - Deploy stack to AWS
* `npm run cdk diff` - Compare deployed stack with current state
* `npm run cdk destroy` - Remove all resources from AWS
