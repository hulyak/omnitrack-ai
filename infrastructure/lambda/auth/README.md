# Authentication and Authorization System

This directory contains the authentication and authorization system for OmniTrack AI, implementing secure user management with comprehensive audit logging.

## Components

### Lambda Functions

#### 1. Register (`register.ts`)
- **Endpoint**: `POST /auth/register`
- **Purpose**: User registration with Cognito
- **Features**:
  - Email and password validation
  - Custom attributes (role, organization)
  - Automatic group assignment based on role
  - Audit logging for all registration attempts

#### 2. Login (`login.ts`)
- **Endpoint**: `POST /auth/login`
- **Purpose**: User authentication
- **Features**:
  - Username/password authentication via Cognito
  - JWT token generation (access, ID, refresh tokens)
  - Audit logging for all login attempts
  - Failed login tracking

#### 3. Logout (`logout.ts`)
- **Endpoint**: `POST /auth/logout`
- **Purpose**: User logout and token invalidation
- **Features**:
  - Global sign-out (invalidates all user tokens)
  - Requires valid access token
  - Audit logging for logout events
  - Protected by Cognito authorizer

#### 4. Refresh (`refresh.ts`)
- **Endpoint**: `POST /auth/refresh`
- **Purpose**: Token refresh
- **Features**:
  - Refresh token validation
  - New access and ID token generation
  - Audit logging for token refresh events

### Middleware and Utilities

#### JWT Validation Middleware (`middleware.ts`)
- Token verification using `aws-jwt-verify`
- User information extraction from JWT claims
- Helper functions for authenticated requests
- Standardized response formatting

#### Role-Based Access Control (`rbac.ts`)
- Comprehensive role definitions:
  - Admin
  - Supply Chain Director
  - Operations Manager
  - Sustainability Officer
  - Analyst
  - Viewer
- Permission-based authorization
- Helper functions for permission checking

## Audit Logging

All authentication events are logged to DynamoDB with the following information:
- **Timestamp**: ISO 8601 format
- **User Identity**: Username or email
- **Source IP**: Client IP address
- **Event Type**: LOGIN, LOGOUT, REGISTRATION, TOKEN_REFRESH
- **Success Status**: Boolean indicating success/failure
- **User Agent**: Optional browser/client information
- **Error Message**: For failed attempts

### Audit Log Schema
```typescript
{
  PK: "AUDIT#AUTH",
  SK: "{timestamp}#{userIdentity}",
  eventType: string,
  timestamp: string,
  userIdentity: string,
  sourceIp: string,
  success: boolean,
  userAgent?: string,
  errorMessage?: string
}
```

## Roles and Permissions

### Role Hierarchy
1. **Admin**: Full system access
2. **Supply Chain Director**: Strategic oversight and configuration
3. **Operations Manager**: Day-to-day operations and scenario management
4. **Sustainability Officer**: Environmental impact tracking and configuration
5. **Analyst**: Read access with feedback capabilities
6. **Viewer**: Read-only access

### Permission Categories
- User Management
- Digital Twin Operations
- Scenario Management
- Alert Management
- Marketplace Access
- Sustainability Tracking
- Learning Module
- System Configuration
- Audit Log Access

## Testing

### Property-Based Tests (`auth.test.ts`)
Comprehensive property-based tests using fast-check to verify:
- **Property 41**: Authentication audit logging
  - All auth events create audit logs with required fields
  - Failed events are logged with error details
  - Audit logs are queryable by partition key
  - IP addresses are preserved correctly
  - Timestamps are in ISO 8601 format

Tests run 100 iterations per property to ensure correctness across various inputs.

## Environment Variables

Required environment variables for Lambda functions:
- `USER_POOL_ID`: Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: Cognito User Pool Client ID
- `TABLE_NAME`: DynamoDB table name for audit logs

## Security Features

1. **Password Policy**: Enforced by Cognito
   - Minimum 12 characters
   - Requires uppercase, lowercase, digits, and symbols

2. **Token Security**:
   - Access tokens valid for 1 hour
   - ID tokens valid for 1 hour
   - Refresh tokens valid for 30 days
   - Token revocation enabled

3. **MFA Support**: Optional MFA with SMS and TOTP

4. **Audit Trail**: Complete audit logging for compliance

5. **IP Tracking**: Source IP logged for all authentication events

## Usage Examples

### Register a New User
```bash
curl -X POST https://api.omnitrack.ai/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "fullname": "John Doe",
    "role": "operations_manager",
    "organization": "ACME Corp"
  }'
```

### Login
```bash
curl -X POST https://api.omnitrack.ai/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Logout
```bash
curl -X POST https://api.omnitrack.ai/auth/logout \
  -H "Authorization: Bearer {access_token}"
```

### Refresh Token
```bash
curl -X POST https://api.omnitrack.ai/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "{refresh_token}"
  }'
```

## Deployment

Lambda functions are deployed via AWS CDK in the infrastructure stack:
- Runtime: Node.js 20.x
- Memory: 256 MB
- Timeout: 30 seconds
- X-Ray tracing enabled
- CloudWatch Logs integration

## Compliance

This implementation satisfies:
- **Requirement 12.1**: Authentication event logging with timestamp, user identity, and source IP
- **Property 41**: Authentication audit logging verification through property-based testing
