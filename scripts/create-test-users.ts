#!/usr/bin/env node
/**
 * Create test users in Cognito for hackathon demo
 * Creates admin, analyst, and viewer users with appropriate permissions
 */

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  ListGroupsCommand,
  CreateGroupCommand
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID || '';

if (!USER_POOL_ID) {
  console.error('❌ Error: USER_POOL_ID environment variable is required');
  process.exit(1);
}

interface TestUser {
  username: string;
  email: string;
  name: string;
  role: string;
  password: string;
  group: string;
}

/**
 * Test users configuration
 */
const TEST_USERS: TestUser[] = [
  {
    username: 'demo-admin',
    email: 'admin@omnitrack-demo.local',
    name: 'Demo Administrator',
    role: 'ADMIN',
    password: 'DemoAdmin123!',
    group: 'Admins'
  },
  {
    username: 'demo-analyst',
    email: 'analyst@omnitrack-demo.local',
    name: 'Demo Analyst',
    role: 'SUPPLY_CHAIN_DIRECTOR',
    password: 'DemoAnalyst123!',
    group: 'Analysts'
  },
  {
    username: 'demo-viewer',
    email: 'viewer@omnitrack-demo.local',
    name: 'Demo Viewer',
    role: 'VIEWER',
    password: 'DemoViewer123!',
    group: 'Viewers'
  }
];

/**
 * Group configurations with permissions
 */
const GROUPS = [
  {
    GroupName: 'Admins',
    Description: 'Full administrative access to all features',
    Precedence: 1
  },
  {
    GroupName: 'Analysts',
    Description: 'Supply chain analysts with read/write access to scenarios and simulations',
    Precedence: 2
  },
  {
    GroupName: 'Viewers',
    Description: 'Read-only access to dashboards and reports',
    Precedence: 3
  }
];

/**
 * Check if user exists
 */
async function userExists(username: string): Promise<boolean> {
  try {
    await client.send(new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username
    }));
    return true;
  } catch (error: any) {
    if (error.name === 'UserNotFoundException') {
      return false;
    }
    throw error;
  }
}

/**
 * Check if group exists
 */
async function groupExists(groupName: string): Promise<boolean> {
  try {
    const response = await client.send(new ListGroupsCommand({
      UserPoolId: USER_POOL_ID
    }));
    return response.Groups?.some(g => g.GroupName === groupName) || false;
  } catch (error) {
    console.error(`Error checking group ${groupName}:`, error);
    return false;
  }
}

/**
 * Create Cognito group
 */
async function createGroup(group: typeof GROUPS[0]): Promise<void> {
  try {
    const exists = await groupExists(group.GroupName);
    if (exists) {
      console.log(`  ℹ Group "${group.GroupName}" already exists`);
      return;
    }

    await client.send(new CreateGroupCommand({
      UserPoolId: USER_POOL_ID,
      GroupName: group.GroupName,
      Description: group.Description,
      Precedence: group.Precedence
    }));
    console.log(`  ✓ Created group "${group.GroupName}"`);
  } catch (error) {
    console.error(`  ✗ Failed to create group "${group.GroupName}":`, error);
    throw error;
  }
}

/**
 * Create test user in Cognito
 */
async function createUser(user: TestUser): Promise<void> {
  try {
    // Check if user already exists
    const exists = await userExists(user.username);
    if (exists) {
      console.log(`  ℹ User "${user.username}" already exists`);
      return;
    }

    // Create user
    await client.send(new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: user.username,
      UserAttributes: [
        { Name: 'email', Value: user.email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: user.name },
        { Name: 'custom:role', Value: user.role }
      ],
      MessageAction: 'SUPPRESS', // Don't send welcome email
      TemporaryPassword: user.password
    }));

    // Set permanent password
    await client.send(new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: user.username,
      Password: user.password,
      Permanent: true
    }));

    // Add user to group
    await client.send(new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: user.username,
      GroupName: user.group
    }));

    console.log(`  ✓ Created user "${user.username}" (${user.role})`);
  } catch (error) {
    console.error(`  ✗ Failed to create user "${user.username}":`, error);
    throw error;
  }
}

/**
 * Generate credentials documentation
 */
function generateCredentialsDoc(): string {
  const doc = `
# Demo User Credentials

**⚠️ IMPORTANT: These are demo credentials for hackathon presentation only.**
**Do NOT use in production or commit to version control.**

## User Pool Information
- User Pool ID: ${USER_POOL_ID}
- Region: ${process.env.AWS_REGION || 'us-east-1'}

## Test Users

### Administrator
- **Username**: ${TEST_USERS[0].username}
- **Email**: ${TEST_USERS[0].email}
- **Password**: ${TEST_USERS[0].password}
- **Role**: ${TEST_USERS[0].role}
- **Permissions**: Full access to all features
- **Use Case**: Demonstrate admin capabilities, user management, system configuration

### Analyst
- **Username**: ${TEST_USERS[1].username}
- **Email**: ${TEST_USERS[1].email}
- **Password**: ${TEST_USERS[1].password}
- **Role**: ${TEST_USERS[1].role}
- **Permissions**: Read/write access to scenarios, simulations, and analytics
- **Use Case**: Demonstrate supply chain analysis, scenario creation, strategy evaluation

### Viewer
- **Username**: ${TEST_USERS[2].username}
- **Email**: ${TEST_USERS[2].email}
- **Password**: ${TEST_USERS[2].password}
- **Role**: ${TEST_USERS[2].role}
- **Permissions**: Read-only access to dashboards and reports
- **Use Case**: Demonstrate role-based access control, limited permissions

## Login Instructions

1. Navigate to the OmniTrack AI login page
2. Enter username and password from above
3. You will be logged in immediately (no email verification required)

## Demo Flow Recommendations

### For Judges Demo:
1. Start with **Viewer** account to show read-only access
2. Switch to **Analyst** account to demonstrate scenario creation
3. Switch to **Admin** account to show full system capabilities

### For Video Recording:
- Use **Analyst** account for most demonstrations
- Shows realistic user workflow without excessive permissions
- Highlights key features: scenarios, simulations, AI recommendations

## Security Notes

- All users have email_verified set to true (no verification needed)
- Passwords meet Cognito requirements (12+ chars, mixed case, digits, symbols)
- Users are assigned to appropriate Cognito groups for RBAC
- Custom attribute 'role' is set for application-level permissions

## Cleanup

After the hackathon, delete these test users:
\`\`\`bash
aws cognito-idp admin-delete-user --user-pool-id ${USER_POOL_ID} --username demo-admin
aws cognito-idp admin-delete-user --user-pool-id ${USER_POOL_ID} --username demo-analyst
aws cognito-idp admin-delete-user --user-pool-id ${USER_POOL_ID} --username demo-viewer
\`\`\`

---
**Generated**: ${new Date().toISOString()}
`;

  return doc;
}

/**
 * Main execution
 */
async function main() {
  console.log('👥 Creating test users in Cognito...\n');
  console.log(`User Pool ID: ${USER_POOL_ID}\n`);

  try {
    // Create groups first
    console.log('📁 Creating Cognito groups...');
    for (const group of GROUPS) {
      await createGroup(group);
    }
    console.log('');

    // Create users
    console.log('👤 Creating test users...');
    for (const user of TEST_USERS) {
      await createUser(user);
    }
    console.log('');

    // Generate credentials documentation
    const credentialsDoc = generateCredentialsDoc();
    const fs = require('fs');
    const path = require('path');
    
    const outputPath = path.join(__dirname, 'DEMO_CREDENTIALS.md');
    fs.writeFileSync(outputPath, credentialsDoc);

    console.log('✅ Test users created successfully!\n');
    console.log('📄 Credentials documented in: scripts/DEMO_CREDENTIALS.md\n');
    console.log('⚠️  IMPORTANT: Keep credentials secure and delete after demo\n');

    console.log('Summary:');
    console.log(`  - ${GROUPS.length} groups created`);
    console.log(`  - ${TEST_USERS.length} users created`);
    console.log('');
    console.log('Users:');
    TEST_USERS.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`);
    });

  } catch (error) {
    console.error('\n❌ Error creating test users:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { TEST_USERS, GROUPS, createUser, createGroup };
