# Audit Logging Service

Centralized audit logging system for OmniTrack AI that provides comprehensive tracking of authentication events, data access, configuration changes, and security incidents.

## Features

### 1. Authentication Audit Logging
- Logs all authentication events (login, logout, token refresh)
- Captures timestamp, user identity, source IP, and user agent
- Records success/failure status and error messages
- **Validates: Requirements 12.1**

### 2. Access Audit Trail
- Logs access to sensitive supply chain data
- Records data classification level (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED)
- Tracks resource type and resource ID
- **Validates: Requirements 12.2**

### 3. Versioned Change Tracking
- Creates versioned records for all modifications
- Captures field-level changes (old value → new value)
- Maintains complete change history per resource
- **Validates: Requirements 12.3**

### 4. High-Performance Query API
- Optimized queries using DynamoDB GSIs
- Sub-10-second response time for 90-day queries
- Supports filtering by user, event type, resource, and date range
- **Validates: Requirements 12.4**

### 5. Suspicious Activity Detection
- Detects multiple failed login attempts
- Identifies distributed attack patterns
- Monitors excessive sensitive data access
- Flags off-hours access to restricted data
- Automatically generates security alerts
- Temporarily restricts suspicious accounts
- **Validates: Requirements 12.5**

## Data Model

### Audit Log Entry Structure
```typescript
{
  PK: "AUDIT#AUTH" | "AUDIT#ACCESS" | "AUDIT#CHANGE#{resourceType}#{resourceId}" | "AUDIT#SECURITY",
  SK: "{timestamp}#{userIdentity}#{resourceId}",
  GSI1PK: "AUDIT#USER#{userIdentity}",
  GSI1SK: "{timestamp}",
  eventType: "AUTHENTICATION" | "DATA_ACCESS" | "DATA_MODIFICATION" | "SECURITY_EVENT",
  timestamp: "ISO 8601 timestamp",
  userIdentity: "username or user ID",
  sourceIp: "IP address",
  userAgent: "User agent string",
  success: true | false,
  action: "LOGIN" | "LOGOUT" | "READ" | "UPDATE" | "DELETE" | etc.,
  resourceType: "SCENARIO" | "NODE" | "ALERT" | etc.,
  resourceId: "Resource identifier",
  dataClassification: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED",
  changes: [{ field, oldValue, newValue }],
  errorMessage: "Error description if failed",
  metadata: { version, ... }
}
```

## API Endpoints

### Query Audit Logs
```
GET /audit/logs?userIdentity=...&eventType=...&startDate=...&endDate=...&limit=...
```

**Query Parameters:**
- `userIdentity` (optional): Filter by user
- `eventType` (optional): AUTHENTICATION, DATA_ACCESS, DATA_MODIFICATION, SECURITY_EVENT
- `resourceType` (optional): Filter by resource type
- `resourceId` (optional): Filter by specific resource
- `startDate` (optional): ISO 8601 timestamp
- `endDate` (optional): ISO 8601 timestamp (max 90 days from startDate)
- `limit` (optional): Max results (default 100)

**Response:**
```json
{
  "results": [...],
  "count": 42,
  "queryTime": "234ms"
}
```

### Get Version History
```
GET /audit/versions/{resourceType}/{resourceId}?limit=50
```

**Response:**
```json
{
  "resourceType": "SCENARIO",
  "resourceId": "scenario-123",
  "versions": [...],
  "count": 15
}
```

## Usage Examples

### Log Authentication Event
```typescript
import { logAuthenticationEvent } from './audit-service';

await logAuthenticationEvent(
  'john.doe@example.com',
  '192.168.1.100',
  'LOGIN',
  true,
  'Mozilla/5.0...',
  undefined,
  { loginMethod: 'password' }
);
```

### Log Data Access
```typescript
import { logDataAccess, DataClassification } from './audit-service';

await logDataAccess(
  'john.doe@example.com',
  'SCENARIO',
  'scenario-123',
  DataClassification.CONFIDENTIAL,
  '192.168.1.100',
  'READ',
  'Mozilla/5.0...',
  { queryType: 'detail' }
);
```

### Log Data Modification
```typescript
import { logDataModification } from './audit-service';

await logDataModification(
  'john.doe@example.com',
  'SCENARIO',
  'scenario-123',
  [
    { field: 'severity', oldValue: 'MEDIUM', newValue: 'HIGH' },
    { field: 'duration', oldValue: 24, newValue: 48 }
  ],
  '192.168.1.100',
  'UPDATE',
  2, // version number
  'Mozilla/5.0...'
);
```

### Query Audit Logs
```typescript
import { queryAuditLogs, AuditEventType } from './audit-service';

const logs = await queryAuditLogs({
  userIdentity: 'john.doe@example.com',
  eventType: AuditEventType.DATA_ACCESS,
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-03-31T23:59:59Z'
}, 100);
```

### Get Version History
```typescript
import { getVersionHistory } from './audit-service';

const history = await getVersionHistory('SCENARIO', 'scenario-123', 50);
```

## Suspicious Activity Patterns

### Pattern 1: Multiple Failed Logins
- **Trigger**: 5+ failed login attempts in 5 minutes
- **Severity**: HIGH
- **Action**: Generate security alert, notify security team

### Pattern 2: Distributed Failed Logins
- **Trigger**: Failed login attempts from 3+ different IP addresses
- **Severity**: CRITICAL
- **Action**: Generate security alert, temporarily restrict account

### Pattern 3: Excessive Sensitive Access
- **Trigger**: 20+ sensitive data access events in 1 hour
- **Severity**: MEDIUM
- **Action**: Generate security alert for review

### Pattern 4: Off-Hours Restricted Access
- **Trigger**: Access to RESTRICTED data outside business hours (9 AM - 6 PM UTC)
- **Severity**: HIGH
- **Action**: Generate security alert, flag for investigation

## Performance Optimization

### Query Optimization Strategies
1. **User-based queries**: Use GSI1 (GSI1PK = AUDIT#USER#{userIdentity})
2. **Resource-based queries**: Use PK = AUDIT#CHANGE#{resourceType}#{resourceId}
3. **Event type queries**: Use PK prefix (AUDIT#AUTH, AUDIT#ACCESS, etc.)
4. **Date range filtering**: Use SK or GSI1SK with range conditions

### Indexing Strategy
- **Primary Index**: PK (partition key) + SK (sort key)
- **GSI1**: GSI1PK (user-based queries) + GSI1SK (timestamp sorting)
- All queries leverage indexes for sub-10-second performance

## Security Considerations

- Only users with `audit:read` permission can query logs
- Audit logs are immutable (no update or delete operations)
- Sensitive data in logs is masked where appropriate
- Security alerts are sent via SNS to security team
- Account restrictions are logged as security events

## Integration Points

- **Authentication**: Integrated with Cognito login/logout handlers
- **Data Access**: Called by all data repository operations
- **Change Tracking**: Called by all update/delete operations
- **Security Alerts**: Publishes to SNS topic for security team notifications
- **Account Restrictions**: Integrates with Cognito for temporary account disabling

## Testing

Property-based tests validate:
- **Property 42**: Access audit trail completeness
- **Property 44**: Audit query performance (< 10 seconds for 90-day queries)
- **Property 45**: Security automation (alert generation and account restriction)
