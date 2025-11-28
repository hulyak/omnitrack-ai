# OmniTrack AI - Troubleshooting Guide

## Table of Contents
1. [Common Issues](#common-issues)
2. [Infrastructure Issues](#infrastructure-issues)
3. [Application Issues](#application-issues)
4. [Performance Issues](#performance-issues)
5. [Integration Issues](#integration-issues)
6. [Security Issues](#security-issues)
7. [Diagnostic Tools](#diagnostic-tools)
8. [Log Analysis](#log-analysis)

## Common Issues

### Issue: Users Cannot Log In

**Symptoms**:
- Login page shows "Invalid credentials" error
- Users redirected back to login after entering credentials
- "Authentication failed" message

**Possible Causes**:
1. Cognito User Pool misconfigured
2. User account locked or disabled
3. Incorrect password
4. Network connectivity issues
5. JWT token validation failing

**Diagnosis Steps**:
```bash
# Check Cognito User Pool status
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_XXXXXXXXX \
  --profile omnitrack-production

# Check user status
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username user@example.com \
  --profile omnitrack-production

# Check CloudWatch logs for auth errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/omnitrack-production-auth-login \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000 \
  --profile omnitrack-production
```

**Resolution**:

1. **For locked accounts**:
   ```bash
   aws cognito-idp admin-enable-user \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username user@example.com \
     --profile omnitrack-production
   ```

2. **For password reset**:
   ```bash
   aws cognito-idp admin-reset-user-password \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username user@example.com \
     --profile omnitrack-production
   ```

3. **For JWT validation issues**:
   - Verify Cognito User Pool Client ID in frontend environment variables
   - Check token expiration settings
   - Ensure clock synchronization on client devices

4. **For network issues**:
   - Verify API Gateway endpoint is accessible
   - Check CORS configuration
   - Test with curl: `curl -I https://api.omnitrack.ai/v1/health`

### Issue: Scenario Simulations Timing Out

**Symptoms**:
- Simulation never completes
- "Request timeout" error after 60 seconds
- Simulation stuck in "Running" state

**Possible Causes**:
1. Lambda function timeout
2. Step Functions execution timeout
3. External service (Bedrock) slow response
4. DynamoDB throttling
5. Large dataset causing performance issues

**Diagnosis Steps**:
```bash
# Check Step Functions execution status
aws stepfunctions list-executions \
  --state-machine-arn arn:aws:states:us-east-1:ACCOUNT:stateMachine:omnitrack-negotiation \
  --status-filter RUNNING \
  --profile omnitrack-production

# Get execution details
aws stepfunctions describe-execution \
  --execution-arn EXECUTION_ARN \
  --profile omnitrack-production

# Check Lambda function metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=omnitrack-production-scenario-agent \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --profile omnitrack-production

# Check for throttling
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Throttles \
  --dimensions Name=FunctionName,Value=omnitrack-production-scenario-agent \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --profile omnitrack-production
```

**Resolution**:

1. **Increase Lambda timeout**:
   - Edit CDK stack to increase timeout from 30s to 60s or 120s
   - Deploy updated stack

2. **Optimize Lambda function**:
   - Review X-Ray traces to identify bottlenecks
   - Implement caching for frequently accessed data
   - Optimize database queries

3. **Handle Bedrock throttling**:
   - Implement exponential backoff
   - Request quota increase from AWS
   - Use provisioned throughput if available

4. **Address DynamoDB throttling**:
   - Switch to on-demand billing mode
   - Increase provisioned capacity
   - Optimize query patterns

### Issue: Alerts Not Being Delivered

**Symptoms**:
- Alerts visible in dashboard but no notifications received
- Email/Slack/Teams notifications not arriving
- Notification delay > 5 minutes

**Possible Causes**:
1. SNS topic subscription not confirmed
2. Notification service Lambda failing
3. Email/Slack/Teams integration misconfigured
4. User notification preferences disabled
5. SNS throttling

**Diagnosis Steps**:
```bash
# Check SNS topic subscriptions
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:omnitrack-production-alerts \
  --profile omnitrack-production

# Check notification Lambda logs
aws logs tail /aws/lambda/omnitrack-production-notification-service \
  --follow \
  --profile omnitrack-production

# Check SNS delivery status
aws sns get-topic-attributes \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:omnitrack-production-alerts \
  --profile omnitrack-production

# Check CloudWatch metrics for SNS
aws cloudwatch get-metric-statistics \
  --namespace AWS/SNS \
  --metric-name NumberOfNotificationsFailed \
  --dimensions Name=TopicName,Value=omnitrack-production-alerts \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --profile omnitrack-production
```

**Resolution**:

1. **Confirm SNS subscriptions**:
   ```bash
   # Resend confirmation email
   aws sns subscribe \
     --topic-arn arn:aws:sns:us-east-1:ACCOUNT:omnitrack-production-alerts \
     --protocol email \
     --notification-endpoint user@example.com \
     --profile omnitrack-production
   ```

2. **Fix Lambda function errors**:
   - Review CloudWatch logs for error messages
   - Check IAM permissions for SNS publish
   - Verify environment variables configured

3. **Verify integrations**:
   - Test Slack webhook: `curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' WEBHOOK_URL`
   - Test Teams webhook: Similar curl command
   - Check email deliverability (spam filters, etc.)

4. **Check user preferences**:
   - Query DynamoDB for user notification settings
   - Verify severity threshold not too high

### Issue: Digital Twin Not Updating

**Symptoms**:
- Digital twin shows stale data
- "Last updated" timestamp not changing
- IoT sensor data not reflected

**Possible Causes**:
1. IoT Core rule not triggering
2. IoT processor Lambda failing
3. DynamoDB write failures
4. Cache not invalidating
5. WebSocket connection issues

**Diagnosis Steps**:
```bash
# Check IoT Core metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/IoT \
  --metric-name PublishIn.Success \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --profile omnitrack-production

# Check IoT rule status
aws iot get-topic-rule \
  --rule-name omnitrack_production_sensor_data \
  --profile omnitrack-production

# Check IoT processor Lambda logs
aws logs tail /aws/lambda/omnitrack-production-iot-processor \
  --follow \
  --profile omnitrack-production

# Check DynamoDB write metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=omnitrack-production-main \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --profile omnitrack-production
```

**Resolution**:

1. **Enable IoT rule**:
   ```bash
   aws iot enable-topic-rule \
     --rule-name omnitrack_production_sensor_data \
     --profile omnitrack-production
   ```

2. **Fix Lambda errors**:
   - Review logs for specific error messages
   - Check IAM permissions for DynamoDB write
   - Verify data validation logic

3. **Clear cache**:
   ```bash
   # Connect to ElastiCache and flush keys
   redis-cli -h ELASTICACHE_ENDPOINT
   > DEL dt:state:*
   ```

4. **Restart WebSocket connections**:
   - Disconnect all clients
   - Clients will automatically reconnect
   - Or restart API Gateway WebSocket API

## Infrastructure Issues

### Issue: CloudFormation Stack Deployment Failed

**Symptoms**:
- CDK deploy command fails
- Stack in ROLLBACK_COMPLETE state
- Resources not created

**Diagnosis Steps**:
```bash
# Get stack events
aws cloudformation describe-stack-events \
  --stack-name omnitrack-production \
  --max-items 50 \
  --profile omnitrack-production

# Get failed resource details
aws cloudformation describe-stack-resources \
  --stack-name omnitrack-production \
  --profile omnitrack-production
```

**Common Failures and Resolutions**:

1. **Resource limit exceeded**:
   - Request limit increase from AWS Support
   - Delete unused resources
   - Use resource sharing where possible

2. **IAM permission denied**:
   - Review IAM policy for deployment role
   - Add missing permissions
   - Check service control policies (SCPs)

3. **Resource name conflict**:
   - Change resource names in CDK code
   - Delete conflicting resources
   - Use unique naming conventions

4. **Dependency issues**:
   - Review resource dependencies in CDK
   - Ensure proper DependsOn relationships
   - Check for circular dependencies

### Issue: Lambda Function Out of Memory

**Symptoms**:
- "Runtime exited with error: signal: killed" in logs
- Function duration close to timeout
- Intermittent failures

**Diagnosis Steps**:
```bash
# Check memory usage metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name MemoryUtilization \
  --dimensions Name=FunctionName,Value=omnitrack-production-impact-agent \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Maximum \
  --profile omnitrack-production

# Check function configuration
aws lambda get-function-configuration \
  --function-name omnitrack-production-impact-agent \
  --profile omnitrack-production
```

**Resolution**:

1. **Increase memory allocation**:
   - Edit CDK stack to increase from 1024 MB to 2048 MB or 3008 MB
   - Deploy updated stack
   - Monitor performance improvement

2. **Optimize code**:
   - Review memory-intensive operations
   - Implement streaming for large datasets
   - Use generators instead of loading all data
   - Clear unused variables

3. **Use external storage**:
   - Store large objects in S3
   - Use DynamoDB for intermediate results
   - Implement pagination for queries

### Issue: DynamoDB Throttling

**Symptoms**:
- ProvisionedThroughputExceededException errors
- High latency for database operations
- Failed writes/reads

**Diagnosis Steps**:
```bash
# Check throttling metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=omnitrack-production-main \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --profile omnitrack-production

# Check consumed capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=omnitrack-production-main \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --profile omnitrack-production
```

**Resolution**:

1. **Switch to on-demand mode**:
   ```bash
   aws dynamodb update-table \
     --table-name omnitrack-production-main \
     --billing-mode PAY_PER_REQUEST \
     --profile omnitrack-production
   ```

2. **Increase provisioned capacity**:
   ```bash
   aws dynamodb update-table \
     --table-name omnitrack-production-main \
     --provisioned-throughput ReadCapacityUnits=100,WriteCapacityUnits=100 \
     --profile omnitrack-production
   ```

3. **Optimize queries**:
   - Use batch operations
   - Implement caching with ElastiCache
   - Review and optimize GSI usage
   - Use projection expressions to reduce data transfer

4. **Implement exponential backoff**:
   - Add retry logic with exponential backoff
   - Use AWS SDK built-in retry mechanisms

## Application Issues

### Issue: Frontend Not Loading

**Symptoms**:
- Blank page
- "Failed to load resource" errors in console
- 404 errors for assets

**Diagnosis Steps**:
1. Open browser developer console (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed requests
4. Verify API endpoint in environment variables

**Resolution**:

1. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear cache and cookies
   - Try incognito/private mode

2. **Verify deployment**:
   ```bash
   # Check Amplify deployment status
   aws amplify list-jobs \
     --app-id YOUR_APP_ID \
     --branch-name main \
     --max-results 5 \
     --profile omnitrack-production
   ```

3. **Invalidate CloudFront cache**:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id DISTRIBUTION_ID \
     --paths "/*" \
     --profile omnitrack-production
   ```

4. **Check environment variables**:
   - Verify NEXT_PUBLIC_API_URL is correct
   - Verify Cognito configuration
   - Redeploy if variables changed

### Issue: WebSocket Disconnections

**Symptoms**:
- Real-time updates stop working
- "WebSocket connection closed" in console
- Frequent reconnection attempts

**Diagnosis Steps**:
```bash
# Check API Gateway WebSocket metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name ConnectCount \
  --dimensions Name=ApiId,Value=WEBSOCKET_API_ID \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --profile omnitrack-production

# Check connection Lambda logs
aws logs tail /aws/lambda/omnitrack-production-websocket-connect \
  --follow \
  --profile omnitrack-production
```

**Resolution**:

1. **Check connection timeout**:
   - API Gateway WebSocket idle timeout is 10 minutes
   - Implement ping/pong keep-alive in client
   - Send heartbeat every 5 minutes

2. **Fix Lambda errors**:
   - Review connection handler logs
   - Check DynamoDB connection table
   - Verify IAM permissions

3. **Implement reconnection logic**:
   - Add exponential backoff for reconnection
   - Store connection state
   - Resume from last known state

### Issue: Marketplace Search Not Working

**Symptoms**:
- Search returns no results
- Search takes too long
- Filters not applying correctly

**Diagnosis Steps**:
```bash
# Check OpenSearch cluster health
aws opensearch describe-domain \
  --domain-name omnitrack-production-scenarios \
  --profile omnitrack-production

# Check OpenSearch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ES \
  --metric-name SearchRate \
  --dimensions Name=DomainName,Value=omnitrack-production-scenarios \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --profile omnitrack-production
```

**Resolution**:

1. **Reindex data**:
   ```bash
   # Run reindex script
   node scripts/reindex-opensearch.js --environment production
   ```

2. **Check cluster capacity**:
   - Scale up OpenSearch cluster if needed
   - Add more nodes
   - Increase instance size

3. **Optimize queries**:
   - Review query structure
   - Use filters instead of queries where possible
   - Implement pagination

## Performance Issues

### Issue: High API Latency

**Symptoms**:
- API responses taking > 2 seconds
- Slow page loads
- Timeout errors

**Diagnosis Steps**:
```bash
# Check API Gateway latency
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Latency \
  --dimensions Name=ApiName,Value=omnitrack-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,p95,p99 \
  --profile omnitrack-production

# Check X-Ray traces
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s) \
  --profile omnitrack-production
```

**Resolution**:

1. **Implement caching**:
   - Enable ElastiCache for frequently accessed data
   - Set appropriate TTL values
   - Use CloudFront for static assets

2. **Optimize database queries**:
   - Add indexes for common queries
   - Use batch operations
   - Implement pagination

3. **Optimize Lambda functions**:
   - Use provisioned concurrency for critical functions
   - Increase memory allocation
   - Optimize cold start time

4. **Use CDN**:
   - Enable CloudFront for API Gateway
   - Configure appropriate cache behaviors
   - Use edge locations

## Integration Issues

### Issue: Bedrock API Errors

**Symptoms**:
- "ThrottlingException" errors
- "ModelNotReadyException" errors
- Scenario generation failures

**Diagnosis Steps**:
```bash
# Check CloudWatch logs for Bedrock errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/omnitrack-production-scenario-agent \
  --filter-pattern "Bedrock" \
  --start-time $(date -u -d '1 hour ago' +%s)000 \
  --profile omnitrack-production
```

**Resolution**:

1. **Handle throttling**:
   - Implement exponential backoff
   - Request quota increase from AWS
   - Use provisioned throughput if available

2. **Use correct model**:
   - Verify model ID in environment variables
   - Check model availability in region
   - Use fallback model if primary unavailable

3. **Optimize prompts**:
   - Reduce prompt size
   - Use more efficient prompt engineering
   - Cache common responses

### Issue: IoT Core Connection Failures

**Symptoms**:
- Sensors not publishing data
- "Connection refused" errors
- Certificate validation failures

**Diagnosis Steps**:
```bash
# Check IoT Core logs
aws logs tail /aws/iot/omnitrack-production \
  --follow \
  --profile omnitrack-production

# Check thing status
aws iot describe-thing \
  --thing-name THING_NAME \
  --profile omnitrack-production

# Check certificate status
aws iot describe-certificate \
  --certificate-id CERT_ID \
  --profile omnitrack-production
```

**Resolution**:

1. **Verify certificates**:
   - Ensure certificates not expired
   - Check certificate attached to thing
   - Verify policy attached to certificate

2. **Check connectivity**:
   - Test MQTT connection
   - Verify endpoint URL
   - Check network firewall rules

3. **Review policies**:
   - Ensure policy allows publish to topics
   - Check policy syntax
   - Verify policy attached correctly

## Security Issues

### Issue: Unauthorized Access Attempts

**Symptoms**:
- Multiple failed login attempts
- 403 Forbidden errors
- Suspicious activity alerts

**Diagnosis Steps**:
```bash
# Check CloudTrail for suspicious activity
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=ConsoleLogin \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --profile omnitrack-production

# Check GuardDuty findings
aws guardduty list-findings \
  --detector-id DETECTOR_ID \
  --profile omnitrack-production
```

**Resolution**:

1. **Block malicious IPs**:
   ```bash
   # Add IP to WAF block list
   aws wafv2 update-ip-set \
     --name omnitrack-blocked-ips \
     --scope REGIONAL \
     --id IP_SET_ID \
     --addresses IP_ADDRESS/32 \
     --profile omnitrack-production
   ```

2. **Reset compromised credentials**:
   - Force password reset for affected users
   - Rotate API keys
   - Revoke active sessions

3. **Enable MFA**:
   - Require MFA for all users
   - Use hardware tokens for admins

4. **Review audit logs**:
   - Check for data exfiltration
   - Review access patterns
   - Identify compromised accounts

## Diagnostic Tools

### CloudWatch Insights Queries

**Find errors in Lambda logs**:
```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

**Find slow Lambda executions**:
```
fields @timestamp, @duration
| filter @duration > 5000
| sort @duration desc
| limit 50
```

**Find API Gateway errors**:
```
fields @timestamp, status, requestId
| filter status >= 400
| stats count() by status
```

### X-Ray Analysis

1. Open X-Ray console
2. Select time range
3. View service map
4. Identify bottlenecks (red nodes)
5. Drill into traces for details

### Performance Profiling

```bash
# Enable Lambda Insights
aws lambda update-function-configuration \
  --function-name omnitrack-production-scenario-agent \
  --layers arn:aws:lambda:us-east-1:580247275435:layer:LambdaInsightsExtension:14 \
  --profile omnitrack-production
```

## Log Analysis

### Common Error Patterns

**Pattern**: `ProvisionedThroughputExceededException`
- **Cause**: DynamoDB throttling
- **Action**: Increase capacity or switch to on-demand

**Pattern**: `Task timed out after X seconds`
- **Cause**: Lambda timeout
- **Action**: Increase timeout or optimize code

**Pattern**: `Unable to import module`
- **Cause**: Missing dependency in Lambda package
- **Action**: Rebuild and redeploy Lambda function

**Pattern**: `AccessDeniedException`
- **Cause**: IAM permission missing
- **Action**: Add required permission to role

**Pattern**: `ResourceNotFoundException`
- **Cause**: Resource doesn't exist or wrong name
- **Action**: Verify resource name and region

### Log Aggregation

Use CloudWatch Logs Insights to aggregate logs across functions:

```
fields @timestamp, @message, @logStream
| filter @message like /ERROR/
| stats count() by @logStream
| sort count desc
```

## Escalation

If issues persist after troubleshooting:

1. **Level 1**: Contact on-call engineer (oncall@omnitrack.ai)
2. **Level 2**: Escalate to DevOps lead (devops-lead@omnitrack.ai)
3. **Level 3**: Open AWS Support ticket
4. **Level 4**: Engage vendor support for third-party integrations

---

**Document Version**: 1.0.0  
**Last Updated**: January 2024  
**For**: OmniTrack AI Platform v1.0
