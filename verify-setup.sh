#!/bin/bash

# OmniTrack AI - Setup Verification Script
# This script verifies that the project infrastructure is correctly set up

set -e

echo "🔍 Verifying OmniTrack AI Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 20.x or higher"
    exit 1
fi

# Check npm
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check AWS CLI
echo "☁️  Checking AWS CLI..."
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version)
    echo -e "${GREEN}✓${NC} AWS CLI installed: $AWS_VERSION"
else
    echo -e "${YELLOW}⚠${NC} AWS CLI not found (optional for local development)"
fi

# Check CDK CLI
echo "🏗️  Checking AWS CDK CLI..."
if command -v cdk &> /dev/null; then
    CDK_VERSION=$(cdk --version)
    echo -e "${GREEN}✓${NC} AWS CDK installed: $CDK_VERSION"
else
    echo -e "${YELLOW}⚠${NC} AWS CDK not found (required for infrastructure deployment)"
fi

echo ""
echo "📁 Verifying project structure..."

# Check frontend
if [ -d "frontend" ]; then
    echo -e "${GREEN}✓${NC} Frontend directory exists"
    
    if [ -f "frontend/package.json" ]; then
        echo -e "${GREEN}✓${NC} Frontend package.json exists"
    fi
    
    if [ -f "frontend/jest.config.ts" ]; then
        echo -e "${GREEN}✓${NC} Frontend Jest config exists"
    fi
    
    if [ -f "frontend/.prettierrc.json" ]; then
        echo -e "${GREEN}✓${NC} Frontend Prettier config exists"
    fi
else
    echo -e "${RED}✗${NC} Frontend directory not found"
    exit 1
fi

# Check infrastructure
if [ -d "infrastructure" ]; then
    echo -e "${GREEN}✓${NC} Infrastructure directory exists"
    
    if [ -f "infrastructure/package.json" ]; then
        echo -e "${GREEN}✓${NC} Infrastructure package.json exists"
    fi
    
    if [ -f "infrastructure/cdk.json" ]; then
        echo -e "${GREEN}✓${NC} Infrastructure CDK config exists"
    fi
    
    if [ -f "infrastructure/.eslintrc.json" ]; then
        echo -e "${GREEN}✓${NC} Infrastructure ESLint config exists"
    fi
else
    echo -e "${RED}✗${NC} Infrastructure directory not found"
    exit 1
fi

# Check GitHub workflows
if [ -d ".github/workflows" ]; then
    echo -e "${GREEN}✓${NC} GitHub workflows directory exists"
    
    if [ -f ".github/workflows/frontend-ci.yml" ]; then
        echo -e "${GREEN}✓${NC} Frontend CI workflow exists"
    fi
    
    if [ -f ".github/workflows/infrastructure-ci.yml" ]; then
        echo -e "${GREEN}✓${NC} Infrastructure CI workflow exists"
    fi
else
    echo -e "${YELLOW}⚠${NC} GitHub workflows directory not found"
fi

echo ""
echo "🧪 Running quick tests..."

# Test frontend
echo "Testing frontend..."
cd frontend
if npm test -- --passWithNoTests > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend tests pass"
else
    echo -e "${RED}✗${NC} Frontend tests failed"
fi
cd ..

# Test infrastructure
echo "Testing infrastructure..."
cd infrastructure
if npm test -- --passWithNoTests > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Infrastructure tests pass"
else
    echo -e "${RED}✗${NC} Infrastructure tests failed"
fi
cd ..

echo ""
echo -e "${GREEN}✅ Setup verification complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. cd frontend && npm run dev    # Start frontend development server"
echo "  2. cd infrastructure && npm run cdk synth    # Synthesize CDK stack"
echo ""
echo "For more information, see SETUP.md"
