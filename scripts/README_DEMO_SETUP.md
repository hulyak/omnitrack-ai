# Demo Setup Scripts

This directory contains scripts for setting up demo data and test users for the OmniTrack AI hackathon demonstration.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 20+ installed
- Access to the deployed OmniTrack infrastructure

## Installation

```bash
cd scripts
npm install
```

## Scripts

### 1. IoT Simulator

Generates realistic sensor data for supply chain nodes and publishes to AWS IoT Core.

**Quick Start:**

```bash
# Start simulator with default settings
npm run start-iot-simulator

# Check status
npm run iot-simulator-status

# Stop simulator
npm run stop-iot-simulator
```

**Advanced Usage:**

```bash
# Start with custom settings
cd scripts && npm run iot-simulator start -- --interval 3000 --anomaly-rate 0.15

# Inject anomaly for demo
cd scripts && npm run iot-simulator inject-anomaly node-supplier-001 temperature
```

**Features:**
- Realistic sensor data (temperature, delay, inventory)
- Geographic locations across global supply chain
- Configurable anomaly rates
- On-demand anomaly injection for demos

**Documentation:** See [IOT_SIMULATOR_README.md](./IOT_SIMULATOR_README.md) for complete guide.

### 2. Seed Demo Data

Seeds DynamoDB with realistic supply chain data for demonstration purposes.

**Usage:**

```bash
# Set environment variable for table name
export DYNAMODB_TABLE_NAME=omnitrack-main

# Run the seed script
npm run seed-demo
```

**What it creates:**

- **10 Supply Chain Nodes**: Suppliers, manufacturers, warehouses, distribution centers, and retailers across global locations
- **20 Sensor Readings**: Temperature, delay, and inventory data from various nodes
- **2 Scenarios**: Pre-configured disruption scenarios (supplier failure, port congestion)
- **3 Alerts**: Active and acknowledged alerts with different severity levels

**Data Characteristics:**

- Realistic geographic locations (San Francisco, Hong Kong, Austin, London, etc.)
- Varied node statuses (operational, degraded)
- Time-series sensor data with anomalies
- Connected supply chain network

### 3. Create Test Users

Creates test users in Cognito with different roles and permissions.

**Usage:**

```bash
# Set environment variable for user pool
export USER_POOL_ID=your-user-pool-id

# Run the user creation script
npm run create-users
```

**What it creates:**

- **Admin User**: Full system access
  - Username: `demo-admin`
  - Password: `DemoAdmin123!`
  - Role: ADMIN
  
- **Analyst User**: Supply chain analysis capabilities
  - Username: `demo-analyst`
  - Password: `DemoAnalyst123!`
  - Role: SUPPLY_CHAIN_DIRECTOR
  
- **Viewer User**: Read-only access
  - Username: `demo-viewer`
  - Password: `DemoViewer123!`
  - Role: VIEWER

**Output:**

The script generates a `DEMO_CREDENTIALS.md` file with all user credentials and login instructions.

## Environment Variables

### Required for iot-simulator.ts

- `AWS_REGION`: AWS region (default: `us-east-1`)
- `IOT_ENDPOINT`: AWS IoT Core endpoint (e.g., `xxxxx.iot.us-east-1.amazonaws.com`)
- `TABLE_NAME`: DynamoDB table name (default: `omnitrack-main`)

### Required for seed-demo-data.ts

- `DYNAMODB_TABLE_NAME`: Name of the DynamoDB table (default: `omnitrack-main`)
- `AWS_REGION`: AWS region (default: from AWS CLI config)

### Required for create-test-users.ts

- `USER_POOL_ID`: Cognito User Pool ID
- `AWS_REGION`: AWS region (default: from AWS CLI config)

## Getting Environment Variables

### From CDK Outputs

After deploying the infrastructure:

```bash
cd infrastructure
npm run cdk outputs

# Look for:
# - OmniTrackStack.DynamoDBTableName
# - OmniTrackStack.UserPoolId
```

### From AWS Console

**DynamoDB Table:**
1. Go to DynamoDB console
2. Find table starting with `omnitrack-`
3. Copy table name

**Cognito User Pool:**
1. Go to Cognito console
2. Find user pool for OmniTrack
3. Copy User Pool ID from "User pool overview"

## Quick Setup (All-in-One)

```bash
# Set environment variables
export DYNAMODB_TABLE_NAME=omnitrack-main
export USER_POOL_ID=us-east-1_XXXXXXXXX
export AWS_REGION=us-east-1
export IOT_ENDPOINT=xxxxx.iot.us-east-1.amazonaws.com
export TABLE_NAME=omnitrack-main

# Install dependencies
cd scripts
npm install

# Run setup scripts
npm run seed-demo
npm run create-users

# Start IoT simulator
npm run start-iot-simulator

# View credentials
cat DEMO_CREDENTIALS.md
```

## Verification

### Verify DynamoDB Data

```bash
# Check node count
aws dynamodb scan \
  --table-name $DYNAMODB_TABLE_NAME \
  --filter-expression "begins_with(PK, :pk)" \
  --expression-attribute-values '{":pk":{"S":"NODE#"}}' \
  --select COUNT

# Check scenario count
aws dynamodb scan \
  --table-name $DYNAMODB_TABLE_NAME \
  --filter-expression "begins_with(PK, :pk)" \
  --expression-attribute-values '{":pk":{"S":"SCENARIO#"}}' \
  --select COUNT
```

### Verify Cognito Users

```bash
# List users
aws cognito-idp list-users \
  --user-pool-id $USER_POOL_ID

# Check groups
aws cognito-idp list-groups \
  --user-pool-id $USER_POOL_ID
```

## Cleanup

### Remove Demo Data

```bash
# Delete all items (use with caution!)
aws dynamodb scan \
  --table-name $DYNAMODB_TABLE_NAME \
  --attributes-to-get "PK" "SK" \
  --output json | \
  jq -r '.Items[] | "\(.PK.S) \(.SK.S)"' | \
  while read pk sk; do
    aws dynamodb delete-item \
      --table-name $DYNAMODB_TABLE_NAME \
      --key "{\"PK\":{\"S\":\"$pk\"},\"SK\":{\"S\":\"$sk\"}}"
  done
```

### Remove Test Users

```bash
# Delete users
aws cognito-idp admin-delete-user \
  --user-pool-id $USER_POOL_ID \
  --username demo-admin

aws cognito-idp admin-delete-user \
  --user-pool-id $USER_POOL_ID \
  --username demo-analyst

aws cognito-idp admin-delete-user \
  --user-pool-id $USER_POOL_ID \
  --username demo-viewer
```

## Troubleshooting

### "Table not found" error

- Verify `DYNAMODB_TABLE_NAME` is correct
- Check AWS credentials have DynamoDB access
- Ensure table exists in the specified region

### "User pool not found" error

- Verify `USER_POOL_ID` is correct
- Check AWS credentials have Cognito access
- Ensure user pool exists in the specified region

### "Access denied" errors

Ensure your AWS credentials have the following permissions:

- `dynamodb:PutItem`
- `dynamodb:BatchWriteItem`
- `cognito-idp:AdminCreateUser`
- `cognito-idp:AdminSetUserPassword`
- `cognito-idp:AdminAddUserToGroup`
- `cognito-idp:CreateGroup`
- `cognito-idp:ListGroups`

## Security Notes

⚠️ **IMPORTANT**: These scripts are for demo purposes only.

- Demo credentials are NOT secure for production use
- Delete test users after the hackathon
- Do not commit `DEMO_CREDENTIALS.md` to version control
- Use strong, unique passwords for production systems

## Property-Based Tests

The demo setup includes property-based tests that validate:

1. **Authentication Requirement** (Property 6)
   - Tests that all requests without valid JWT tokens are rejected
   - Location: `infrastructure/lambda/demo/authentication-requirement.property.test.ts`

2. **Token Validation** (Property 7)
   - Tests that invalid/expired tokens return 401 responses
   - Location: `infrastructure/lambda/demo/token-validation.property.test.ts`

3. **RBAC Enforcement** (Property 8)
   - Tests that role-based permissions are correctly enforced
   - Location: `infrastructure/lambda/demo/rbac-enforcement.property.test.ts`

### Running Property Tests

```bash
cd infrastructure/lambda
npm test -- demo/*.property.test.ts
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Verify environment variables are set correctly
4. Ensure infrastructure is fully deployed

---

**Last Updated**: November 28, 2024
**Hackathon**: Kiroween 2024
