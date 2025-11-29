#!/bin/bash

# Test Lambda Functions Locally (No Docker Required)

echo "🧪 Testing Lambda Functions Locally"
echo ""

# Check if you want to use SAM or just Node.js
echo "Choose testing method:"
echo "1. Direct Node.js execution (fastest)"
echo "2. AWS SAM Local (more realistic)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "📦 Testing with Direct Node.js..."
    echo ""
    
    # Example: Test the login function
    cd infrastructure/lambda/auth
    
    # Create test event
    cat > test-event.json << 'EOF'
{
  "body": "{\"username\":\"test@example.com\",\"password\":\"TestPassword123!\"}",
  "requestContext": {
    "requestId": "test-request-id"
  }
}
EOF
    
    echo "Running login function..."
    npx ts-node -e "
    import { handler } from './login';
    const event = require('./test-event.json');
    handler(event).then(result => {
      console.log('Result:', JSON.stringify(result, null, 2));
    }).catch(err => {
      console.error('Error:', err);
    });
    "
    
    rm test-event.json
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "📦 Testing with AWS SAM Local..."
    echo ""
    
    # Check if SAM is installed
    if ! command -v sam &> /dev/null; then
        echo "Installing AWS SAM CLI..."
        brew install aws-sam-cli  # macOS
        # or: pip install aws-sam-cli
    fi
    
    # Create SAM template
    cd infrastructure
    
    echo "Generating SAM template from CDK..."
    cdk synth --no-staging > template.yaml
    
    echo "Starting local API..."
    sam local start-api --template template.yaml
    
else
    echo "Invalid choice"
    exit 1
fi
