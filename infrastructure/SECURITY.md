# OmniTrack AI - Security Hardening Documentation

This document describes the security hardening measures implemented in the OmniTrack AI infrastructure.

## Overview

The security hardening implementation addresses Requirements 12.1, 12.2, and 12.5 from the requirements document:
- **12.1**: Authentication audit logging
- **12.2**: Access audit trail for sensitive data
- **12.5**: Security automation for suspicious activity

## Security Components

### 1. AWS WAF (Web Application Firewall)

**Location**: `infrastructure/lib/infrastructure-stack.ts`

The WAF protects the API Gateway from common web exploits and attacks.

#### WAF Rules Implemented:

1. **Rate Limiting Rule**
   - Limits: 2000 requests per 5 minutes per IP address
   - Action: Block with 429 (Too Many Requests) response
   - Prevents DDoS attacks and API abuse

2. **AWS Managed Rules - Common Rule Set**
   - Protects against OWASP Top 10 vulnerabilities
   - Includes protection against:
     - Cross-site scripting (XSS)
     - SQL injection
     - Path traversal
     - Command injection

3. **AWS Managed Rules - Known Bad Inputs**
   - Blocks requests with known malicious patterns
   - Protects against exploit attempts

4. **AWS Managed Rules - SQL Injection**
   - Specialized protection against SQL injection attacks
   - Validates query parameters and request bodies

5. **Invalid User-Agent Blocking**
   - Blocks requests without valid User-Agent headers
   - Prevents automated bot attacks

6. **Geographic Restriction**
   - Blocks traffic from high-risk countries (configurable)
   - Default: Blocks CN, RU, KP
   - Can be customized based on business requirements

#### WAF Monitoring:

- CloudWatch metrics enabled for all rules
- Sampled requests captured for analysis
- Custom response bodies for blocked requests

### 2. AWS Secrets Manager

**Location**: `infrastructure/lib/infrastructure-stack.ts`

Secrets Manager securely stores API keys and credentials.

#### Stored Secrets:

- Amazon Bedrock API keys
- Slack webhook URLs
- Microsoft Teams webhook URLs
- External API keys
- Auto-generated API secret (32 characters)

#### Security Features:

- Encrypted at rest using KMS
- Automatic rotation support
- IAM-based access control
- Audit logging of secret access
- Retention policy on deletion

#### Usage in Lambda:

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
const response = await client.send(
  new GetSecretValueCommand({ SecretId: process.env.SECRETS_ARN })
);
const secrets = JSON.parse(response.SecretString);
```

### 3. AWS KMS (Key Management Service)

**Location**: `infrastructure/lib/infrastructure-stack.ts`

KMS provides encryption for sensitive data at rest.

#### Encrypted Resources:

1. **DynamoDB Table**
   - Customer-managed KMS key
   - Encrypts all data at rest
   - Automatic key rotation enabled

2. **S3 Buckets**
   - Digital Twin Snapshots bucket
   - Model Artifacts bucket
   - Server-side encryption with KMS
   - Access logging enabled

3. **Secrets Manager**
   - All secrets encrypted with KMS
   - Separate encryption context per secret

4. **CloudWatch Logs** (optional)
   - Can be configured for log encryption
   - Protects sensitive log data

#### Key Policy:

- Root account has full access
- Service principals (DynamoDB, S3, Secrets Manager, CloudWatch) have decrypt/encrypt permissions
- Scoped to specific AWS services via ViaService condition
- Automatic key rotation enabled (365 days)

### 4. Security Headers Middleware

**Location**: `infrastructure/lambda/api/security-headers-middleware.ts`

Adds security headers to all API responses to protect against common web vulnerabilities.

#### Headers Implemented:

1. **Strict-Transport-Security (HSTS)**
   - Forces HTTPS for 1 year
   - Includes subdomains
   - Preload enabled

2. **X-Content-Type-Options**
   - Prevents MIME type sniffing
   - Value: `nosniff`

3. **X-Frame-Options**
   - Prevents clickjacking attacks
   - Value: `DENY`

4. **X-XSS-Protection**
   - Enables browser XSS protection
   - Value: `1; mode=block`

5. **Content-Security-Policy (CSP)**
   - Restricts resource loading
   - Prevents XSS and data injection attacks
   - Configured for API responses

6. **Referrer-Policy**
   - Controls referrer information leakage
   - Value: `strict-origin-when-cross-origin`

7. **Permissions-Policy**
   - Disables unnecessary browser features
   - Blocks: geolocation, microphone, camera, payment, USB, etc.

8. **Cache-Control**
   - Prevents caching of sensitive data
   - Value: `no-store, no-cache, must-revalidate, private`

#### Usage:

```typescript
import { withSecurityHeaders } from './security-headers-middleware';

export const handler = withSecurityHeaders(async (event, context) => {
  // Your handler logic
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' }),
  };
});
```

#### Additional Security Functions:

- **validateRequestHeaders**: Validates incoming request headers for suspicious patterns
- **sanitizeResponse**: Removes sensitive fields from responses
- **applySecurityHeaders**: Applies all security headers to responses

### 5. VPC Security Groups (Least Privilege)

**Location**: `infrastructure/lib/infrastructure-stack.ts`

Security groups implement least-privilege network access control.

#### Lambda Security Group:

- **Outbound**: Allows all (required for AWS service access)
- **Inbound**: No inbound rules (Lambda doesn't accept incoming connections)
- **Purpose**: Isolates Lambda functions in private subnets

#### Redis Security Group:

- **Outbound**: Disabled (Redis doesn't need outbound)
- **Inbound**: Only from Lambda Security Group on port 6379
- **Purpose**: Restricts Redis access to only Lambda functions

#### Network Architecture:

```
┌─────────────────────────────────────────┐
│           Public Subnets (3 AZs)        │
│  - NAT Gateways                         │
│  - Internet Gateway                     │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          Private Subnets (3 AZs)        │
│  ┌─────────────────────────────────┐   │
│  │  Lambda Functions               │   │
│  │  (Lambda Security Group)        │   │
│  │  - Outbound: All                │   │
│  │  - Inbound: None                │   │
│  └─────────────────────────────────┘   │
│                │                         │
│                │ Port 6379               │
│                ▼                         │
│  ┌─────────────────────────────────┐   │
│  │  ElastiCache Redis              │   │
│  │  (Redis Security Group)         │   │
│  │  - Outbound: None               │   │
│  │  - Inbound: Lambda SG only      │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

#### VPC Flow Logs:

- Enabled for all VPC traffic
- Logs stored in CloudWatch Logs
- Retention: 30 days
- Useful for security analysis and troubleshooting

## Security Best Practices

### 1. Principle of Least Privilege

- IAM roles have minimal required permissions
- Security groups allow only necessary traffic
- Lambda functions can only access required resources

### 2. Defense in Depth

- Multiple layers of security:
  1. WAF at API Gateway
  2. Authentication with Cognito
  3. Authorization with IAM
  4. Network isolation with VPC
  5. Encryption at rest with KMS
  6. Encryption in transit with TLS

### 3. Encryption Everywhere

- Data at rest: KMS encryption for DynamoDB, S3, Secrets Manager
- Data in transit: TLS 1.2+ enforced via HSTS
- Secrets: Never stored in code or environment variables

### 4. Audit Logging

- VPC Flow Logs for network traffic
- CloudWatch Logs for application logs
- API Gateway access logs
- DynamoDB streams for data changes
- Secrets Manager access logging

### 5. Automated Security

- WAF automatically blocks malicious requests
- CloudWatch Alarms for security events
- Automatic key rotation for KMS
- Automatic secret rotation (configurable)

## Deployment

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. AWS CDK installed (`npm install -g aws-cdk`)
3. Node.js 20.x or later

### Deploy Security Infrastructure

```bash
cd infrastructure
npm install
cdk deploy
```

### Update Secrets

After deployment, update the secrets in Secrets Manager:

```bash
aws secretsmanager update-secret \
  --secret-id omnitrack/api-keys \
  --secret-string '{
    "bedrockApiKey": "your-actual-key",
    "slackWebhookUrl": "https://hooks.slack.com/...",
    "teamsWebhookUrl": "https://outlook.office.com/...",
    "externalApiKey": "your-external-api-key"
  }'
```

### Verify WAF Rules

```bash
# Get WAF Web ACL ID
aws wafv2 list-web-acls --scope REGIONAL --region us-east-1

# Get WAF metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/WAFV2 \
  --metric-name BlockedRequests \
  --dimensions Name=Rule,Value=RateLimitRule Name=WebACL,Value=omnitrack-api-protection \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## Monitoring and Alerts

### CloudWatch Metrics

- **WAF Blocked Requests**: Monitor blocked requests by rule
- **API Gateway 4xx/5xx Errors**: Track authentication and authorization failures
- **Lambda Errors**: Monitor security-related Lambda failures
- **Secrets Manager Access**: Track secret access patterns

### CloudWatch Alarms

Create alarms for:
- High rate of WAF blocks (potential attack)
- Unusual secret access patterns
- Failed authentication attempts
- Suspicious API access patterns

### Security Incident Response

1. **Detection**: CloudWatch Alarms trigger SNS notifications
2. **Investigation**: Review CloudWatch Logs and VPC Flow Logs
3. **Containment**: Update WAF rules or security groups
4. **Remediation**: Patch vulnerabilities, rotate credentials
5. **Recovery**: Restore from backups if needed
6. **Lessons Learned**: Update security policies

## Compliance

### Data Protection

- **Encryption at Rest**: All sensitive data encrypted with KMS
- **Encryption in Transit**: TLS 1.2+ enforced
- **Data Retention**: Configurable retention policies
- **Data Deletion**: Secure deletion with KMS key deletion

### Access Control

- **Authentication**: Cognito User Pools with MFA
- **Authorization**: IAM roles and policies
- **Audit Logging**: All access logged to CloudWatch
- **Least Privilege**: Minimal permissions granted

### Network Security

- **Network Isolation**: VPC with private subnets
- **Traffic Filtering**: Security groups and WAF
- **DDoS Protection**: WAF rate limiting
- **Geographic Restrictions**: WAF geo-blocking

## Maintenance

### Regular Tasks

1. **Review WAF Logs**: Weekly review of blocked requests
2. **Rotate Secrets**: Quarterly rotation of API keys
3. **Update WAF Rules**: Monthly review and updates
4. **Security Patches**: Apply patches within 30 days
5. **Access Review**: Quarterly review of IAM permissions

### Security Updates

- Subscribe to AWS Security Bulletins
- Monitor CVE databases for vulnerabilities
- Update dependencies regularly
- Test security controls quarterly

## Troubleshooting

### WAF Blocking Legitimate Traffic

1. Check CloudWatch Logs for blocked requests
2. Review WAF sampled requests
3. Adjust WAF rules if needed
4. Add IP to allowlist if necessary

### Secrets Manager Access Denied

1. Verify IAM role has `secretsmanager:GetSecretValue` permission
2. Check KMS key policy allows decrypt
3. Verify secret ARN is correct
4. Check VPC endpoints if using VPC

### KMS Encryption Errors

1. Verify KMS key is enabled
2. Check key policy allows service access
3. Verify IAM role has `kms:Decrypt` permission
4. Check key is in same region as resource

## References

- [AWS WAF Documentation](https://docs.aws.amazon.com/waf/)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [AWS KMS Documentation](https://docs.aws.amazon.com/kms/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
