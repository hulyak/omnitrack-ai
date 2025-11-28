---
inclusion: always
---

# MCP (Model Context Protocol) Integration Guide

This steering file provides guidance on using MCP servers to enhance code generation and development workflows in OmniTrack AI.

## Available MCP Servers

### 1. AWS Documentation MCP Server
**Purpose**: Context-aware AWS API documentation lookup

**Usage**:
- Query AWS service documentation during code generation
- Fetch up-to-date API examples for DynamoDB, Lambda, Step Functions
- Retrieve best practices for AWS service integration
- Get current SDK method signatures

**Example Queries**:
```
"Show me DynamoDB single-table design patterns"
"What are the latest Lambda runtime options for Node.js?"
"How do I configure Step Functions error handling?"
"Show me Amazon Bedrock API examples for Claude"
```

### 2. NPM Package Lookup MCP
**Purpose**: Retrieve module metadata and version information

**Usage**:
- Check latest package versions during dependency updates
- Verify package compatibility
- Find alternative packages
- Review package documentation

**Example Queries**:
```
"What's the latest version of fast-check?"
"Show me alternatives to axios for HTTP requests"
"What are the peer dependencies for React 19?"
```

### 3. File System MCP (if configured)
**Purpose**: Access project files and documentation

**Usage**:
- Reference existing code patterns
- Read specification documents
- Access configuration files
- Review test examples

## Integration Patterns

### During Code Generation

When generating AWS infrastructure code:
1. Query AWS Documentation MCP for current best practices
2. Use retrieved examples as templates
3. Adapt to OmniTrack AI patterns
4. Include proper error handling and logging

**Example**:
```typescript
// Before generating DynamoDB code, query:
// "Show me DynamoDB batch write operations with error handling"

// Then generate code incorporating MCP-sourced patterns:
const batchWrite = async (items: any[]) => {
  const params = {
    RequestItems: {
      [tableName]: items.map(item => ({
        PutRequest: { Item: item }
      }))
    }
  };
  
  try {
    const result = await dynamodb.batchWrite(params).promise();
    // Handle unprocessed items...
  } catch (error) {
    logger.error('Batch write failed', { error });
    throw error;
  }
};
```

### During Dependency Management

When updating packages:
1. Query NPM Package Lookup MCP for latest versions
2. Check for breaking changes
3. Review migration guides
4. Update package.json with compatible versions

### During API Design

When designing new endpoints:
1. Query AWS Documentation for API Gateway patterns
2. Review Lambda integration best practices
3. Incorporate authentication patterns
4. Follow REST conventions

## MCP Query Best Practices

### Be Specific
❌ "Tell me about Lambda"
✅ "Show me Lambda error handling patterns for Node.js 20"

### Request Examples
❌ "How does DynamoDB work?"
✅ "Show me a DynamoDB query with GSI and pagination example"

### Include Context
❌ "Best practices for Step Functions"
✅ "Best practices for Step Functions orchestrating multiple Lambda functions with error retry"

### Ask for Current Information
❌ "Lambda configuration"
✅ "Latest Lambda configuration options for Node.js runtime in 2024"

## Integration Workflow

### 1. Planning Phase
- Query MCP for architecture patterns
- Review AWS service capabilities
- Check package availability and versions

### 2. Implementation Phase
- Query MCP for code examples
- Adapt examples to project conventions
- Incorporate error handling patterns
- Add proper logging and monitoring

### 3. Testing Phase
- Query MCP for testing patterns
- Review test examples
- Implement property-based tests
- Add integration tests

### 4. Documentation Phase
- Query MCP for documentation templates
- Include API examples
- Add usage instructions
- Document dependencies

## MCP Configuration

### Recommended MCP Servers for OmniTrack AI

```json
{
  "mcpServers": {
    "aws-docs": {
      "command": "uvx",
      "args": ["awslabs.aws-documentation-mcp-server@latest"],
      "env": {
        "FASTMCP_LOG_LEVEL": "ERROR"
      },
      "disabled": false,
      "autoApprove": ["search", "get_documentation"]
    },
    "npm-lookup": {
      "command": "uvx",
      "args": ["npm-package-lookup-mcp@latest"],
      "disabled": false,
      "autoApprove": ["search_packages", "get_package_info"]
    }
  }
}
```

### Auto-Approve Recommendations

Auto-approve read-only operations:
- `search`
- `get_documentation`
- `search_packages`
- `get_package_info`
- `read_file` (for project files)

Require approval for write operations:
- `write_file`
- `delete_file`
- `execute_command`

## Example Use Cases

### Use Case 1: Implementing New Lambda Function

**Step 1**: Query MCP for Lambda patterns
```
"Show me Lambda function structure with TypeScript and error handling"
```

**Step 2**: Generate code using MCP-sourced patterns
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from './utils/logger';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const correlationId = event.requestContext.requestId;
  
  try {
    logger.info('Processing request', { correlationId });
    
    // Business logic here
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    logger.error('Request failed', { correlationId, error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

### Use Case 2: Adding New Dependency

**Step 1**: Query NPM MCP
```
"What's the latest version of @aws-sdk/client-dynamodb and its peer dependencies?"
```

**Step 2**: Update package.json with compatible versions
```json
{
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.x.x",
    "@aws-sdk/lib-dynamodb": "^3.x.x"
  }
}
```

### Use Case 3: Implementing Step Functions Workflow

**Step 1**: Query AWS Documentation MCP
```
"Show me Step Functions state machine definition with parallel execution and error handling"
```

**Step 2**: Create state machine definition using patterns
```json
{
  "Comment": "Multi-agent orchestration workflow",
  "StartAt": "ParallelAgentExecution",
  "States": {
    "ParallelAgentExecution": {
      "Type": "Parallel",
      "Branches": [
        {
          "StartAt": "InfoAgent",
          "States": {
            "InfoAgent": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:...",
              "Retry": [
                {
                  "ErrorEquals": ["States.TaskFailed"],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 3,
                  "BackoffRate": 2
                }
              ],
              "End": true
            }
          }
        }
      ],
      "Next": "AggregateResults"
    }
  }
}
```

## Troubleshooting

### MCP Server Not Responding
1. Check MCP server status in Kiro
2. Verify network connectivity
3. Review MCP server logs
4. Restart MCP server if needed

### Outdated Information
1. Specify date/version in query
2. Cross-reference with official documentation
3. Verify against current AWS SDK versions

### Query Returns No Results
1. Rephrase query with more specific terms
2. Break complex queries into smaller parts
3. Try alternative search terms
4. Check MCP server capabilities

## Best Practices Summary

✅ **DO**:
- Query MCP for current best practices
- Use MCP examples as templates
- Adapt patterns to project conventions
- Verify information with official docs
- Include context in queries

❌ **DON'T**:
- Copy MCP examples verbatim without adaptation
- Skip error handling from examples
- Ignore project conventions
- Use outdated patterns
- Make vague queries

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [AWS Documentation MCP Server](https://github.com/awslabs/aws-documentation-mcp-server)
- [Kiro MCP Integration Guide](https://docs.kiro.ai/mcp)
