#!/bin/bash

# OmniTrack AI Production Monitoring Script
# This script monitors key metrics in production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

STACK_NAME=${STACK_NAME:-omnitrack-ai}
REGION=${AWS_REGION:-us-east-1}
DURATION=${1:-3600}  # Default: last hour

print_info "=== OmniTrack AI Production Monitoring ==="
echo ""
print_info "Stack: $STACK_NAME"
print_info "Region: $REGION"
print_info "Time Range: Last $((DURATION / 60)) minutes"
echo ""

# Calculate time range
END_TIME=$(date -u +%Y-%m-%dT%H:%M:%S)
START_TIME=$(date -u -d "$((DURATION / 60)) minutes ago" +%Y-%m-%dT%H:%M:%S)

# Get stack outputs
if [ -f "outputs.json" ]; then
    REST_API_ID=$(cat outputs.json | jq -r ".\"$STACK_NAME\".RestApiId // empty")
else
    REST_API_ID=$(aws cloudformation describe-stacks \
      --stack-name $STACK_NAME \
      --region $REGION \
      --query 'Stacks[0].Outputs[?OutputKey==`RestApiId`].OutputValue' \
      --output text)
fi

# ========================================
# API Gateway Metrics
# ========================================

print_info "=== API Gateway Metrics ==="
echo ""

if [ -n "$REST_API_ID" ]; then
    # Request Count
    print_info "Fetching request count..."
    REQUEST_COUNT=$(aws cloudwatch get-metric-statistics \
      --namespace AWS/ApiGateway \
      --metric-name Count \
      --dimensions Name=ApiName,Value=omnitrack-api \
      --start-time $START_TIME \
      --end-time $END_TIME \
      --period $DURATION \
      --statistics Sum \
      --region $REGION \
      --query 'Datapoints[0].Sum' \
      --output text)
    
    if [ "$REQUEST_COUNT" != "None" ] && [ -n "$REQUEST_COUNT" ]; then
        print_success "Total Requests: $REQUEST_COUNT"
    else
        print_warning "No request data available"
    fi
    
    # 4xx Error Rate
    print_info "Fetching 4xx error rate..."
    ERROR_4XX=$(aws cloudwatch get-metric-statistics \
      --namespace AWS/ApiGateway \
      --metric-name 4XXError \
      --dimensions Name=ApiName,Value=omnitrack-api \
      --start-time $START_TIME \
      --end-time $END_TIME \
      --period $DURATION \
      --statistics Average \
      --region $REGION \
      --query 'Datapoints[0].Average' \
      --output text)
    
    if [ "$ERROR_4XX" != "None" ] && [ -n "$ERROR_4XX" ]; then
        ERROR_4XX_PCT=$(echo "$ERROR_4XX * 100" | bc -l | xargs printf "%.2f")
        if (( $(echo "$ERROR_4XX < 0.05" | bc -l) )); then
            print_success "4xx Error Rate: ${ERROR_4XX_PCT}% (< 5%)"
        else
            print_warning "4xx Error Rate: ${ERROR_4XX_PCT}% (> 5%)"
        fi
    else
        print_info "4xx Error Rate: 0%"
    fi
    
    # 5xx Error Rate
    print_info "Fetching 5xx error rate..."
    ERROR_5XX=$(aws cloudwatch get-metric-statistics \
      --namespace AWS/ApiGateway \
      --metric-name 5XXError \
      --dimensions Name=ApiName,Value=omnitrack-api \
      --start-time $START_TIME \
      --end-time $END_TIME \
      --period $DURATION \
      --statistics Average \
      --region $REGION \
      --query 'Datapoints[0].Average' \
      --output text)
    
    if [ "$ERROR_5XX" != "None" ] && [ -n "$ERROR_5XX" ]; then
        ERROR_5XX_PCT=$(echo "$ERROR_5XX * 100" | bc -l | xargs printf "%.2f")
        if (( $(echo "$ERROR_5XX < 0.05" | bc -l) )); then
            print_success "5xx Error Rate: ${ERROR_5XX_PCT}% (< 5%)"
        else
            print_error "5xx Error Rate: ${ERROR_5XX_PCT}% (> 5%) - CRITICAL!"
        fi
    else
        print_success "5xx Error Rate: 0%"
    fi
    
    # Latency (p95)
    print_info "Fetching latency (p95)..."
    LATENCY_P95=$(aws cloudwatch get-metric-statistics \
      --namespace AWS/ApiGateway \
      --metric-name Latency \
      --dimensions Name=ApiName,Value=omnitrack-api \
      --start-time $START_TIME \
      --end-time $END_TIME \
      --period $DURATION \
      --statistics "p95" \
      --region $REGION \
      --query 'Datapoints[0]."p95"' \
      --output text)
    
    if [ "$LATENCY_P95" != "None" ] && [ -n "$LATENCY_P95" ]; then
        LATENCY_P95_INT=$(echo "$LATENCY_P95" | xargs printf "%.0f")
        if [ $LATENCY_P95_INT -lt 2000 ]; then
            print_success "Latency (p95): ${LATENCY_P95_INT}ms (< 2000ms)"
        else
            print_warning "Latency (p95): ${LATENCY_P95_INT}ms (> 2000ms)"
        fi
    else
        print_info "Latency (p95): No data"
    fi
else
    print_warning "REST API ID not found"
fi

echo ""

# ========================================
# Lambda Metrics
# ========================================

print_info "=== Lambda Metrics ==="
echo ""

# Get Lambda functions
LAMBDA_FUNCTIONS=$(aws lambda list-functions \
  --region $REGION \
  --query 'Functions[?starts_with(FunctionName, `omnitrack-`)].FunctionName' \
  --output text)

if [ -n "$LAMBDA_FUNCTIONS" ]; then
    for FUNCTION_NAME in $LAMBDA_FUNCTIONS; do
        print_info "Function: $FUNCTION_NAME"
        
        # Invocations
        INVOCATIONS=$(aws cloudwatch get-metric-statistics \
          --namespace AWS/Lambda \
          --metric-name Invocations \
          --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
          --start-time $START_TIME \
          --end-time $END_TIME \
          --period $DURATION \
          --statistics Sum \
          --region $REGION \
          --query 'Datapoints[0].Sum' \
          --output text)
        
        if [ "$INVOCATIONS" != "None" ] && [ -n "$INVOCATIONS" ]; then
            echo "  Invocations: $INVOCATIONS"
        else
            echo "  Invocations: 0"
        fi
        
        # Errors
        ERRORS=$(aws cloudwatch get-metric-statistics \
          --namespace AWS/Lambda \
          --metric-name Errors \
          --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
          --start-time $START_TIME \
          --end-time $END_TIME \
          --period $DURATION \
          --statistics Sum \
          --region $REGION \
          --query 'Datapoints[0].Sum' \
          --output text)
        
        if [ "$ERRORS" != "None" ] && [ -n "$ERRORS" ] && [ "$ERRORS" != "0" ]; then
            print_warning "  Errors: $ERRORS"
        else
            echo "  Errors: 0"
        fi
        
        # Duration (Average)
        DURATION_AVG=$(aws cloudwatch get-metric-statistics \
          --namespace AWS/Lambda \
          --metric-name Duration \
          --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
          --start-time $START_TIME \
          --end-time $END_TIME \
          --period $DURATION \
          --statistics Average \
          --region $REGION \
          --query 'Datapoints[0].Average' \
          --output text)
        
        if [ "$DURATION_AVG" != "None" ] && [ -n "$DURATION_AVG" ]; then
            DURATION_AVG_INT=$(echo "$DURATION_AVG" | xargs printf "%.0f")
            echo "  Duration (avg): ${DURATION_AVG_INT}ms"
        fi
        
        echo ""
    done
else
    print_warning "No Lambda functions found"
fi

# ========================================
# DynamoDB Metrics
# ========================================

print_info "=== DynamoDB Metrics ==="
echo ""

# Get DynamoDB tables
TABLES=$(aws dynamodb list-tables \
  --region $REGION \
  --query 'TableNames[?contains(@, `omnitrack`)]' \
  --output text)

if [ -n "$TABLES" ]; then
    for TABLE_NAME in $TABLES; do
        print_info "Table: $TABLE_NAME"
        
        # Read Capacity
        READ_CAPACITY=$(aws cloudwatch get-metric-statistics \
          --namespace AWS/DynamoDB \
          --metric-name ConsumedReadCapacityUnits \
          --dimensions Name=TableName,Value=$TABLE_NAME \
          --start-time $START_TIME \
          --end-time $END_TIME \
          --period $DURATION \
          --statistics Sum \
          --region $REGION \
          --query 'Datapoints[0].Sum' \
          --output text)
        
        if [ "$READ_CAPACITY" != "None" ] && [ -n "$READ_CAPACITY" ]; then
            READ_CAPACITY_INT=$(echo "$READ_CAPACITY" | xargs printf "%.0f")
            echo "  Read Capacity Units: $READ_CAPACITY_INT"
        else
            echo "  Read Capacity Units: 0"
        fi
        
        # Write Capacity
        WRITE_CAPACITY=$(aws cloudwatch get-metric-statistics \
          --namespace AWS/DynamoDB \
          --metric-name ConsumedWriteCapacityUnits \
          --dimensions Name=TableName,Value=$TABLE_NAME \
          --start-time $START_TIME \
          --end-time $END_TIME \
          --period $DURATION \
          --statistics Sum \
          --region $REGION \
          --query 'Datapoints[0].Sum' \
          --output text)
        
        if [ "$WRITE_CAPACITY" != "None" ] && [ -n "$WRITE_CAPACITY" ]; then
            WRITE_CAPACITY_INT=$(echo "$WRITE_CAPACITY" | xargs printf "%.0f")
            echo "  Write Capacity Units: $WRITE_CAPACITY_INT"
        else
            echo "  Write Capacity Units: 0"
        fi
        
        # Throttled Requests
        THROTTLES=$(aws cloudwatch get-metric-statistics \
          --namespace AWS/DynamoDB \
          --metric-name UserErrors \
          --dimensions Name=TableName,Value=$TABLE_NAME \
          --start-time $START_TIME \
          --end-time $END_TIME \
          --period $DURATION \
          --statistics Sum \
          --region $REGION \
          --query 'Datapoints[0].Sum' \
          --output text)
        
        if [ "$THROTTLES" != "None" ] && [ -n "$THROTTLES" ] && [ "$THROTTLES" != "0" ]; then
            print_warning "  Throttled Requests: $THROTTLES"
        else
            echo "  Throttled Requests: 0"
        fi
        
        echo ""
    done
else
    print_warning "No DynamoDB tables found"
fi

# ========================================
# CloudWatch Alarms
# ========================================

print_info "=== CloudWatch Alarms ==="
echo ""

# Get alarm states
ALARMS=$(aws cloudwatch describe-alarms \
  --region $REGION \
  --query 'MetricAlarms[?starts_with(AlarmName, `OmniTrack-`)].[AlarmName,StateValue]' \
  --output text)

if [ -n "$ALARMS" ]; then
    while IFS=$'\t' read -r ALARM_NAME STATE; do
        if [ "$STATE" == "OK" ]; then
            print_success "$ALARM_NAME: $STATE"
        elif [ "$STATE" == "ALARM" ]; then
            print_error "$ALARM_NAME: $STATE"
        else
            print_warning "$ALARM_NAME: $STATE"
        fi
    done <<< "$ALARMS"
else
    print_warning "No alarms found"
fi

echo ""

# ========================================
# Recent Errors
# ========================================

print_info "=== Recent Errors (Last 10) ==="
echo ""

# Check error log group
ERROR_LOG_GROUP="/aws/omnitrack/errors"

if aws logs describe-log-groups --region $REGION --log-group-name-prefix $ERROR_LOG_GROUP &> /dev/null; then
    RECENT_ERRORS=$(aws logs filter-log-events \
      --log-group-name $ERROR_LOG_GROUP \
      --start-time $(($(date +%s) - DURATION))000 \
      --limit 10 \
      --region $REGION \
      --query 'events[*].message' \
      --output text 2>/dev/null)
    
    if [ -n "$RECENT_ERRORS" ]; then
        echo "$RECENT_ERRORS"
    else
        print_success "No recent errors"
    fi
else
    print_info "Error log group not found or no errors logged"
fi

echo ""

# ========================================
# Summary
# ========================================

print_info "=== Monitoring Summary ==="
echo ""
print_info "Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=OmniTrack-Operations-Dashboard"
print_info "Logs: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups"
print_info "Alarms: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#alarmsV2:"
echo ""
print_info "To monitor continuously, run:"
echo "  watch -n 60 ./monitor-production.sh"
