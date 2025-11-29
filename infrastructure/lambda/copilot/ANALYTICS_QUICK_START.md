# AI Copilot Analytics - Quick Start Guide

## Overview

The analytics system tracks copilot usage and provides insights through an admin dashboard.

## What Was Implemented

### Task 17.1: Analytics Tracking ✅

**Backend Service** (`analytics-service.ts`):
- Tracks user actions, commands, and errors
- Stores data in DynamoDB with 90-day retention
- Provides query methods for retrieving analytics

**Integration** (`websocket-handler.ts`):
- Automatically tracks events during copilot interactions
- Tracks message sent, action executed, errors, connections
- Non-blocking - analytics failures don't break main flow

**Infrastructure** (`infrastructure-stack.ts`):
- Created `omnitrack-copilot-analytics` DynamoDB table
- Added GSIs for efficient querying by date and event type
- Granted permissions to copilot execution role

### Task 17.2: Analytics Dashboard ✅

**API Handlers** (`analytics-handler.ts`):
- Dashboard summary endpoint
- Command statistics endpoint
- Error patterns endpoint
- User activity endpoint
- Export functionality (JSON/CSV)

**Frontend Dashboard** (`analytics-dashboard.tsx`):
- Summary cards (executions, success rate, avg time, errors)
- Popular commands table
- Error patterns display
- Date range filtering
- Export buttons (JSON/CSV)

**API Routes**:
- `/api/copilot/analytics/dashboard` - Dashboard data
- `/api/copilot/analytics/export` - Data export

**Admin Page** (`/copilot-analytics`):
- Full-page analytics dashboard
- Accessible at `/copilot-analytics` route

## Quick Usage

### Viewing Analytics

1. Navigate to `/copilot-analytics` in your browser
2. Use date range selector to filter data
3. View summary cards, popular commands, and error patterns
4. Click "Export JSON" or "Export CSV" to download data

### Tracked Events

The system automatically tracks:
- ✅ User messages sent
- ✅ Actions executed (success/failure)
- ✅ Command execution times
- ✅ Error occurrences and patterns
- ✅ WebSocket connections/disconnections
- ✅ Streaming events
- ✅ Multi-step executions

### Data Retention

- Analytics data is retained for **90 days**
- Automatic cleanup via DynamoDB TTL
- No manual cleanup required

## API Endpoints

### Get Dashboard Summary
```bash
GET /analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31
```

### Get Command Stats
```bash
GET /analytics/commands/add-supplier?startDate=2024-01-01&endDate=2024-01-31
```

### Get Popular Commands
```bash
GET /analytics/commands/popular?startDate=2024-01-01&endDate=2024-01-31&limit=10
```

### Get Error Patterns
```bash
GET /analytics/errors?errorType=ValidationError&limit=20
```

### Get User Activity
```bash
GET /analytics/users/{userId}?startDate=1704067200000&endDate=1706745600000
```

### Export Data
```bash
GET /analytics/export?startDate=2024-01-01&endDate=2024-01-31&format=csv
```

## Dashboard Features

### Summary Cards
- **Total Executions**: All actions executed in period
- **Success Rate**: Percentage of successful actions
- **Avg Response Time**: Average execution time
- **Total Errors**: Error count with unique types

### Popular Commands
- Command name and execution count
- Success rate percentage
- Average execution time
- Last used timestamp

### Error Patterns
- Error type and message
- Occurrence count
- First and last occurrence
- Affected users count

### Export
- JSON format for programmatic analysis
- CSV format for spreadsheet analysis
- Includes all commands and errors

## Development Notes

### Mock Data

The frontend API routes currently return mock data for development. In production:

1. Update API routes to call Lambda functions
2. Configure API Gateway endpoints
3. Set up authentication/authorization

### Environment Variables

```bash
ANALYTICS_TABLE_NAME=omnitrack-copilot-analytics
```

### Permissions Required

The copilot Lambda execution role needs:
- `dynamodb:PutItem` - Track events
- `dynamodb:UpdateItem` - Update statistics
- `dynamodb:Query` - Retrieve analytics
- `dynamodb:GetItem` - Get records

## Testing

### Manual Testing

1. Use the copilot to execute some commands
2. Navigate to `/copilot-analytics`
3. Verify data appears in dashboard
4. Test date range filtering
5. Test export functionality

### Automated Testing

Run tests for analytics service:
```bash
cd infrastructure/lambda
npm test analytics-service.test.ts
```

## Troubleshooting

### No Data Showing
- Check DynamoDB table exists
- Verify IAM permissions
- Check CloudWatch logs for errors
- Ensure analytics tracking is enabled

### Slow Dashboard
- Check GSI usage
- Review query patterns
- Monitor DynamoDB metrics

## Next Steps

1. **Deploy Infrastructure**
   ```bash
   cd infrastructure
   npm run deploy
   ```

2. **Test Analytics Tracking**
   - Use copilot to execute commands
   - Check DynamoDB for analytics events

3. **Access Dashboard**
   - Navigate to `/copilot-analytics`
   - Verify data displays correctly

4. **Configure Production**
   - Update API routes to call Lambda
   - Set up authentication
   - Configure CloudWatch alarms

## Files Created

### Backend
- `infrastructure/lambda/copilot/analytics-service.ts` - Analytics service
- `infrastructure/lambda/copilot/analytics-handler.ts` - API handlers
- `infrastructure/lib/infrastructure-stack.ts` - Updated with analytics table

### Frontend
- `frontend/components/copilot/analytics-dashboard.tsx` - Dashboard component
- `frontend/app/api/copilot/analytics/dashboard/route.ts` - Dashboard API
- `frontend/app/api/copilot/analytics/export/route.ts` - Export API
- `frontend/app/copilot-analytics/page.tsx` - Analytics page
- `frontend/components/copilot/index.ts` - Updated exports

### Documentation
- `infrastructure/lambda/copilot/ANALYTICS_IMPLEMENTATION.md` - Full docs
- `infrastructure/lambda/copilot/ANALYTICS_QUICK_START.md` - This file

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review DynamoDB metrics
3. Verify IAM permissions
4. Check API Gateway logs

## References

- Requirements: 9.5 - Track and aggregate usage metrics
- Design: Analytics Service and Dashboard
- Tasks: 17.1 (Analytics Tracking), 17.2 (Analytics Dashboard)
