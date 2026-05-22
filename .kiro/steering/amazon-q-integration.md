---
inclusion: manual
contextKey: amazon-q
---

# Amazon Q Developer Integration Guide

This guide explains how Amazon Q Developer complements Kiro for CLI-based development tasks in the OmniTrack AI project.

## Overview

**Amazon Q Developer** is an AI-powered assistant for command-line development tasks, while **Kiro** excels at spec-driven IDE workflows. Together, they provide comprehensive AI assistance across your development workflow.

### When to Use Amazon Q Developer

✅ **CLI-based tasks**:
- Generating AWS CDK snippets from command line
- Quick code refactoring via terminal
- Security vulnerability scanning
- Unit test generation from CLI
- Infrastructure as Code (IaC) generation
- AWS service integration examples

### When to Use Kiro

✅ **IDE-integrated tasks**:
- Spec-driven feature development
- Multi-file code generation
- Property-based test implementation
- Component scaffolding
- Real-time code assistance
- Workspace-aware refactoring

## Installation and Setup

### Prerequisites

- **No AWS account required!** Amazon Q Developer CLI works with AWS Builder ID
- macOS, Linux, or Windows
- Terminal access

### Installation Steps

#### Option 1: Using Homebrew (macOS/Linux)

```bash
brew install amazon-q
```

#### Option 2: Using pip (All platforms)

```bash
pip install amazon-q-developer-cli
```

#### Option 3: Using npm (All platforms)

```bash
npm install -g @aws/amazon-q-developer-cli
```

### Authentication

```bash
# Login with AWS Builder ID (no AWS account needed)
q login

# Follow the browser prompt to authenticate
# You'll be redirected to AWS Builder ID sign-in
```

### Verification

```bash
# Check installation
q --version

# Test with a simple query
q "How do I create a Lambda function with TypeScript?"
```

## Common Use Cases for OmniTrack AI

### 1. Generate AWS CDK Snippets

**Task**: Create a new Lambda function in CDK

```bash
q "Generate AWS CDK code to create a Lambda function with TypeScript runtime, 1GB memory, 30 second timeout, and environment variables"
```

**Output**:
```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';

const fn = new lambda.Function(this, 'MyFunction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'),
  memorySize: 1024,
  timeout: cdk.Duration.seconds(30),
  environment: {
    TABLE_NAME: table.tableName,
    REGION: this.region
  }
});
```

### 2. Generate DynamoDB Table Definition

**Task**: Create a DynamoDB table with GSIs

```bash
q "Generate AWS CDK code for a DynamoDB table with partition key PK, sort key SK, and two GSIs for querying by type and status"
```

### 3. Create Step Functions State Machine

**Task**: Define a state machine for multi-agent orchestration

```bash
q "Generate AWS CDK code for a Step Functions state machine that executes three Lambda functions in parallel, aggregates results, and handles errors with retry logic"
```

### 4. Security Vulnerability Scanning

**Task**: Check code for security issues

```bash
# Scan a specific file
q security-scan infrastructure/lambda/auth/login.ts

# Scan entire directory
q security-scan infrastructure/lambda/auth/
```

### 5. Generate Unit Tests

**Task**: Create tests for a Lambda handler

```bash
q "Generate Jest unit tests for a Lambda function that processes IoT sensor data and stores it in DynamoDB"
```

### 6. Code Refactoring

**Task**: Refactor code to use async/await

```bash
q "Refactor this code to use async/await instead of promises" < old-code.ts > new-code.ts
```

### 7. Explain Complex Code

**Task**: Understand existing code

```bash
q "Explain what this Step Functions state machine does" < state-machine-definition.json
```

### 8. Generate API Gateway Integration

**Task**: Create API Gateway with Lambda integration

```bash
q "Generate AWS CDK code for API Gateway REST API with Lambda integration, CORS enabled, and API key authentication"
```

## Integration with OmniTrack AI Workflow

### Workflow 1: Infrastructure Development

**Step 1**: Use Kiro to review specifications
```
Open .kiro/specs/omnitrack-ai-supply-chain/design.md in Kiro
Ask: "What infrastructure is needed for the IoT Simulator?"
```

**Step 2**: Use Amazon Q to generate CDK code
```bash
q "Generate AWS CDK code for a Lambda function that generates synthetic IoT sensor data every 5 seconds and publishes to DynamoDB"
```

**Step 3**: Use Kiro to integrate into project
```
Paste generated code into infrastructure/lib/infrastructure-stack.ts
Ask Kiro: "Integrate this Lambda function into the existing stack and ensure it follows our conventions"
```

### Workflow 2: Security Review

**Step 1**: Use Amazon Q to scan for vulnerabilities
```bash
q security-scan infrastructure/lambda/auth/
```

**Step 2**: Use Kiro to fix issues
```
Open flagged files in Kiro
Ask: "Fix the security vulnerabilities identified in this file"
```

### Workflow 3: Test Generation

**Step 1**: Use Kiro to understand requirements
```
Open .kiro/specs/omnitrack-ai-supply-chain/design.md
Review Property 46: Simulator data generation timing
```

**Step 2**: Use Amazon Q to generate test structure
```bash
q "Generate a Jest test structure for testing that a function generates events at a specified interval"
```

**Step 3**: Use Kiro to implement property-based test
```
Ask Kiro: "Convert this test to use fast-check for property-based testing with 100 iterations"
```

## Amazon Q CLI Commands Reference

### Code Generation

```bash
# Generate code from description
q "Generate [description]"

# Generate code with context from file
q "Generate [description]" < input-file.ts

# Generate and save to file
q "Generate [description]" > output-file.ts
```

### Code Explanation

```bash
# Explain code
q "Explain this code" < file.ts

# Explain specific concept
q "Explain how AWS Step Functions error handling works"
```

### Code Refactoring

```bash
# Refactor code
q "Refactor this to use [pattern]" < old-code.ts > new-code.ts

# Optimize code
q "Optimize this code for performance" < code.ts
```

### Security Scanning

```bash
# Scan file
q security-scan file.ts

# Scan directory
q security-scan directory/

# Scan with specific rules
q security-scan --rules=owasp file.ts
```

### Test Generation

```bash
# Generate tests
q "Generate unit tests for this code" < code.ts > code.test.ts

# Generate specific test type
q "Generate property-based tests using fast-check" < code.ts
```

### Documentation

```bash
# Generate documentation
q "Generate JSDoc comments for this code" < code.ts

# Generate README
q "Generate a README for this module" < index.ts > README.md
```

## Best Practices

### DO:

✅ **Use Amazon Q for quick CLI tasks**
- One-off code generation
- Security scans
- Quick refactoring
- Infrastructure snippets

✅ **Use Kiro for complex IDE tasks**
- Multi-file features
- Spec-driven development
- Workspace-aware changes
- Property-based test implementation

✅ **Combine both tools**
- Generate with Q, integrate with Kiro
- Scan with Q, fix with Kiro
- Prototype with Q, refine with Kiro

### DON'T:

❌ **Don't use Amazon Q for**:
- Multi-file refactoring (use Kiro)
- Spec-driven development (use Kiro)
- Complex workspace changes (use Kiro)

❌ **Don't use Kiro for**:
- Quick CLI commands (use Amazon Q)
- One-off security scans (use Amazon Q)
- Simple code snippets (use Amazon Q)

## Example Commands for OmniTrack AI

### Infrastructure

```bash
# Lambda function
q "Generate CDK code for Lambda function with DynamoDB access"

# API Gateway
q "Generate CDK code for API Gateway with Lambda proxy integration"

# Step Functions
q "Generate CDK code for Step Functions state machine with error handling"

# DynamoDB
q "Generate CDK code for DynamoDB table with GSI"

# IoT Core
q "Generate CDK code for IoT Core thing and topic rule"
```

### Application Code

```bash
# Lambda handler
q "Generate Lambda handler for processing IoT sensor data"

# DynamoDB operations
q "Generate TypeScript code for DynamoDB batch write with error handling"

# API client
q "Generate TypeScript API client with error handling and retry logic"

# WebSocket handler
q "Generate Lambda handler for WebSocket API Gateway"
```

### Testing

```bash
# Unit tests
q "Generate Jest tests for Lambda handler"

# Property tests
q "Generate fast-check property tests for data validation function"

# Integration tests
q "Generate integration test for API endpoint"

# Mock data
q "Generate mock IoT sensor data for testing"
```

### Security

```bash
# Scan authentication code
q security-scan infrastructure/lambda/auth/

# Scan API handlers
q security-scan infrastructure/lambda/api/

# Check for common vulnerabilities
q "Check this code for SQL injection vulnerabilities" < handler.ts
```

## Troubleshooting

### Amazon Q Not Responding

**Check**:
- Internet connection
- Authentication status: `q login`
- CLI version: `q --version`

**Solution**:
```bash
# Re-authenticate
q logout
q login

# Update CLI
brew upgrade amazon-q  # or pip install --upgrade amazon-q-developer-cli
```

### Generated Code Doesn't Match Project Style

**Solution**:
- Use Kiro to refactor generated code
- Ask Kiro: "Refactor this code to match our project conventions"
- Reference `.kiro/steering/omnitrack-conventions.md`

### Security Scan False Positives

**Solution**:
- Review flagged code manually
- Use Kiro for context-aware security review
- Add exceptions for known safe patterns

## Comparison: Amazon Q vs Kiro

| Feature | Amazon Q Developer | Kiro |
|---------|-------------------|------|
| **Interface** | Command-line | IDE-integrated |
| **Best For** | Quick CLI tasks | Complex IDE workflows |
| **Code Generation** | Snippets & examples | Full features |
| **Context Awareness** | Limited to input | Full workspace |
| **Multi-file Changes** | No | Yes |
| **Spec Integration** | No | Yes |
| **Security Scanning** | Yes | Limited |
| **Test Generation** | Basic | Property-based |
| **Refactoring** | Simple | Complex |
| **AWS Integration** | Excellent | Good |

## Demo Script

### Setting Up Amazon Q Developer

```bash
# 1. Install
brew install amazon-q

# 2. Login with AWS Builder ID
q login
# Follow browser prompt - no AWS account needed!

# 3. Test installation
q "Hello, Amazon Q!"
```

### Generating AWS CDK Code

```bash
# Generate Lambda function
q "Generate AWS CDK code for a Lambda function that processes IoT sensor data, stores it in DynamoDB, and triggers an alert if values exceed thresholds"

# Copy output to infrastructure/lib/infrastructure-stack.ts
```

### Security Scanning

```bash
# Scan authentication code
q security-scan infrastructure/lambda/auth/

# Review findings
# Use Kiro to fix any issues
```

### Generating Tests

```bash
# Generate test structure
q "Generate Jest tests for a Lambda function that validates IoT sensor data"

# Use Kiro to convert to property-based tests
```

## Resources

- [Amazon Q Developer Documentation](https://docs.aws.amazon.com/amazonq/)
- [AWS Builder ID Sign-up](https://aws.amazon.com/builder-id/)
- [Amazon Q CLI Reference](https://docs.aws.amazon.com/amazonq/latest/cli-reference/)
- [Kiro Documentation](https://docs.kiro.ai/)

## Summary

Amazon Q Developer and Kiro work together to provide comprehensive AI assistance:

- **Amazon Q**: Fast CLI-based code generation, security scanning, and AWS integration
- **Kiro**: Spec-driven IDE workflows, multi-file changes, and property-based testing

Use Amazon Q for quick terminal tasks and Kiro for complex IDE workflows. Together, they accelerate development of the OmniTrack AI platform!
