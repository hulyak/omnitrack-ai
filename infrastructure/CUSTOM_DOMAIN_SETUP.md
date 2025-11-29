# Custom Domain Setup for OmniTrack AI

This guide explains how to set up custom domains for your OmniTrack AI APIs.

## Prerequisites

- A registered domain name (can be registered in Route 53 or external registrar)
- AWS Certificate Manager (ACM) certificate for your domain
- Deployed OmniTrack AI infrastructure

## Overview

You'll set up custom domains for:
1. REST API: `api.yourdomain.com`
2. WebSocket API: `ws.yourdomain.com`
3. Copilot WebSocket API: `copilot.yourdomain.com`

## Step 1: Request ACM Certificate

### Option A: Using AWS Console

1. Go to AWS Certificate Manager in your region
2. Click "Request a certificate"
3. Choose "Request a public certificate"
4. Add domain names:
   - `api.yourdomain.com`
   - `ws.yourdomain.com`
   - `copilot.yourdomain.com`
   - Or use wildcard: `*.yourdomain.com`
5. Choose DNS validation
6. Click "Request"
7. Add CNAME records to your DNS (Route 53 or external)
8. Wait for validation (usually a few minutes)

### Option B: Using AWS CLI

```bash
# Request certificate
aws acm request-certificate \
  --domain-name "*.yourdomain.com" \
  --subject-alternative-names "yourdomain.com" \
  --validation-method DNS \
  --region us-east-1

# Get certificate ARN
CERT_ARN=$(aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[?DomainName==`*.yourdomain.com`].CertificateArn' --output text)

# Get validation records
aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1 --query 'Certificate.DomainValidationOptions'
```

## Step 2: Update CDK Stack

Add custom domain configuration to your infrastructure stack:

```typescript
// In infrastructure/lib/infrastructure-stack.ts

// Add after REST API creation
const apiDomainName = new apigateway.DomainName(this, 'ApiDomainName', {
  domainName: 'api.yourdomain.com',
  certificate: acm.Certificate.fromCertificateArn(
    this,
    'ApiCertificate',
    'arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID'
  ),
  endpointType: apigateway.EndpointType.REGIONAL,
  securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
});

new apigateway.BasePathMapping(this, 'ApiBasePathMapping', {
  domainName: apiDomainName,
  restApi: this.restApi,
  stage: this.restApi.deploymentStage,
});

// Add after WebSocket API creation
const wsDomainName = new apigatewayv2.CfnDomainName(this, 'WsDomainName', {
  domainName: 'ws.yourdomain.com',
  domainNameConfigurations: [
    {
      certificateArn: 'arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID',
      endpointType: 'REGIONAL',
      securityPolicy: 'TLS_1_2',
    },
  ],
});

new apigatewayv2.CfnApiMapping(this, 'WsApiMapping', {
  apiId: this.webSocketApi.ref,
  domainName: wsDomainName.domainName,
  stage: 'prod',
});

// Add after Copilot WebSocket API creation
const copilotWsDomainName = new apigatewayv2.CfnDomainName(this, 'CopilotWsDomainName', {
  domainName: 'copilot.yourdomain.com',
  domainNameConfigurations: [
    {
      certificateArn: 'arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID',
      endpointType: 'REGIONAL',
      securityPolicy: 'TLS_1_2',
    },
  ],
});

new apigatewayv2.CfnApiMapping(this, 'CopilotWsApiMapping', {
  apiId: copilotWebSocketApi.ref,
  domainName: copilotWsDomainName.domainName,
  stage: 'prod',
});
```

## Step 3: Create Route 53 Records

### Option A: Using AWS Console

1. Go to Route 53 → Hosted Zones
2. Select your domain
3. Create A record for `api.yourdomain.com`:
   - Type: A
   - Alias: Yes
   - Alias Target: Select API Gateway domain
4. Repeat for `ws.yourdomain.com` and `copilot.yourdomain.com`

### Option B: Using AWS CLI

```bash
# Get API Gateway domain names
API_DOMAIN_TARGET=$(aws apigateway get-domain-name --domain-name api.yourdomain.com --query 'regionalDomainName' --output text)
WS_DOMAIN_TARGET=$(aws apigatewayv2 get-domain-name --domain-name ws.yourdomain.com --query 'DomainNameConfigurations[0].ApiGatewayDomainName' --output text)
COPILOT_DOMAIN_TARGET=$(aws apigatewayv2 get-domain-name --domain-name copilot.yourdomain.com --query 'DomainNameConfigurations[0].ApiGatewayDomainName' --output text)

# Get hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name yourdomain.com --query 'HostedZones[0].Id' --output text)

# Create A records
aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch '{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z1UJRXOUMOOFQ8",
          "DNSName": "'$API_DOMAIN_TARGET'",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "ws.yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z1UJRXOUMOOFQ8",
          "DNSName": "'$WS_DOMAIN_TARGET'",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "copilot.yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z1UJRXOUMOOFQ8",
          "DNSName": "'$COPILOT_DOMAIN_TARGET'",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}'
```

## Step 4: Update Frontend Configuration

Update your frontend environment variables:

```bash
# frontend/.env.production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WEBSOCKET_URL=wss://ws.yourdomain.com
NEXT_PUBLIC_COPILOT_WEBSOCKET_URL=wss://copilot.yourdomain.com
```

## Step 5: Update CORS Configuration

Update CORS to allow your custom domain:

```typescript
// In infrastructure/lib/infrastructure-stack.ts

defaultCorsPreflightOptions: {
  allowOrigins: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'http://localhost:3000', // For development
  ],
  allowMethods: apigateway.Cors.ALL_METHODS,
  allowHeaders: [
    'Content-Type',
    'X-Amz-Date',
    'Authorization',
    'X-Api-Key',
    'X-Amz-Security-Token',
  ],
  allowCredentials: true,
  maxAge: cdk.Duration.hours(1),
}
```

## Step 6: Redeploy Infrastructure

```bash
cd infrastructure
npm run build
npx cdk deploy
```

## Step 7: Verify Custom Domains

```bash
# Test REST API
curl https://api.yourdomain.com/health

# Test WebSocket (using wscat)
npm install -g wscat
wscat -c wss://ws.yourdomain.com

# Test Copilot WebSocket
wscat -c wss://copilot.yourdomain.com
```

## Step 8: Update DNS TTL (Optional)

For faster DNS propagation, reduce TTL:

```bash
aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch '{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.yourdomain.com",
        "Type": "A",
        "TTL": 300,
        "AliasTarget": {
          "HostedZoneId": "Z1UJRXOUMOOFQ8",
          "DNSName": "'$API_DOMAIN_TARGET'",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}'
```

## Troubleshooting

### Certificate Validation Stuck

- Verify CNAME records are correctly added to DNS
- Wait up to 30 minutes for DNS propagation
- Check certificate status in ACM console

### Custom Domain Not Working

- Verify API Gateway domain name is created
- Check Route 53 A record points to correct target
- Verify certificate is valid and not expired
- Check API Gateway stage is deployed

### CORS Errors

- Verify CORS configuration includes your domain
- Check browser console for specific CORS errors
- Ensure preflight OPTIONS requests are handled

### SSL/TLS Errors

- Verify certificate covers all subdomains
- Check security policy is TLS 1.2 or higher
- Ensure certificate is in the correct region

## Best Practices

1. **Use Wildcard Certificates** - Easier to manage multiple subdomains
2. **Enable DNSSEC** - Adds security to DNS resolution
3. **Monitor Certificate Expiration** - Set up CloudWatch alarms
4. **Use CloudFront** - Add CDN for better performance
5. **Enable WAF** - Protect APIs with Web Application Firewall
6. **Set Up Health Checks** - Monitor API availability
7. **Use Multiple Regions** - For high availability

## Cost Considerations

- **ACM Certificates**: Free for public certificates
- **Route 53 Hosted Zone**: $0.50/month
- **Route 53 Queries**: $0.40 per million queries
- **API Gateway Custom Domain**: No additional cost
- **CloudFront (optional)**: Pay per request and data transfer

## Next Steps

1. Set up CloudFront distribution for caching
2. Configure WAF rules for API protection
3. Set up health checks and alarms
4. Document custom domain for team
5. Update API documentation with new URLs

---

**Last Updated**: November 28, 2024
