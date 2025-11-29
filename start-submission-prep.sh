#!/bin/bash

# OmniTrack AI - Hackathon Submission Preparation
# Quick start script to begin submission preparation

set -e

echo "🏆 OmniTrack AI - Hackathon Submission Preparation"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Phase 1: Setup and Verification${NC}"
echo "-----------------------------------"
echo ""

# Create screenshots directory
echo "📁 Creating screenshots directory..."
mkdir -p screenshots
echo -e "${GREEN}✅ Screenshots directory created${NC}"
echo ""

# Check Node.js
echo "🔍 Checking Node.js..."
if command -v node &> /dev/null; then
    node_version=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $node_version${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo ""

# Check npm
echo "🔍 Checking npm..."
if command -v npm &> /dev/null; then
    npm_version=$(npm --version)
    echo -e "${GREEN}✅ npm installed: $npm_version${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo ""

# Frontend setup
echo -e "${BLUE}📱 Setting up Frontend${NC}"
echo "---------------------"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

echo "🔨 Testing frontend build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend builds successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed. Please fix errors before continuing.${NC}"
    exit 1
fi

cd ..
echo ""

# Infrastructure setup
echo -e "${BLUE}🏗️ Setting up Infrastructure${NC}"
echo "----------------------------"
cd infrastructure

if [ ! -d "node_modules" ]; then
    echo "📦 Installing infrastructure dependencies..."
    npm install
    echo -e "${GREEN}✅ Infrastructure dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Infrastructure dependencies already installed${NC}"
fi

echo "🔨 Testing CDK synthesis..."
if npx cdk synth > /dev/null 2>&1; then
    echo -e "${GREEN}✅ CDK synthesis successful${NC}"
else
    echo -e "${YELLOW}⚠️  CDK synthesis had warnings (this may be okay)${NC}"
fi

cd ..
echo ""

# Project statistics
echo -e "${BLUE}📊 Project Statistics${NC}"
echo "--------------------"

ts_files=$(find . -name '*.ts' -not -path './node_modules/*' -not -path './.next/*' -not -path './cdk.out/*' | wc -l | tr -d ' ')
tsx_files=$(find . -name '*.tsx' -not -path './node_modules/*' -not -path './.next/*' | wc -l | tr -d ' ')
lambda_files=$(find infrastructure/lambda -name '*.ts' -not -path './node_modules/*' 2>/dev/null | wc -l | tr -d ' ')
spec_files=$(find .kiro/specs -name '*.md' 2>/dev/null | wc -l | tr -d ' ')

echo "📁 TypeScript files: $ts_files"
echo "📁 React components: $tsx_files"
echo "📁 Lambda functions: $lambda_files"
echo "📁 Spec files: $spec_files"
echo ""

# Submission checklist
echo -e "${BLUE}✅ Submission Preparation Checklist${NC}"
echo "===================================="
echo ""
echo "Phase 1: Polish Demo (2-3 hours)"
echo "  [ ] Fix any UI glitches"
echo "  [ ] Test all features"
echo "  [ ] Seed demo data"
echo "  [ ] Verify performance"
echo ""
echo "Phase 2: Create Screenshots (1 hour)"
echo "  [ ] Screenshot 1: Kiro IDE Interface"
echo "  [ ] Screenshot 2: Spec Files Structure"
echo "  [ ] Screenshot 3: Generated Lambda Code"
echo "  [ ] Screenshot 4: Frontend Landing Page"
echo "  [ ] Screenshot 5: Dashboard with Live Data"
echo "  [ ] Screenshot 6: Infrastructure Stack Code"
echo "  [ ] Screenshot 7: CDK Synth Success"
echo "  [ ] Screenshot 8: Architecture Diagram"
echo ""
echo "Phase 3: Record Video (2-3 hours)"
echo "  [ ] Practice script"
echo "  [ ] Record segments"
echo "  [ ] Edit video"
echo "  [ ] Upload to YouTube/Vimeo"
echo ""
echo "Phase 4: Write Documentation (1-2 hours)"
echo "  [ ] Update README.md"
echo "  [ ] Write submission description"
echo "  [ ] Review Kiro usage docs"
echo "  [ ] Verify deployment readiness"
echo ""
echo "Phase 5: Submit"
echo "  [ ] Commit all changes"
echo "  [ ] Fill out submission form"
echo "  [ ] Submit before deadline"
echo ""

# Next steps
echo -e "${BLUE}🚀 Next Steps${NC}"
echo "============"
echo ""
echo "1. Start the demo:"
echo -e "   ${YELLOW}cd frontend && npm run dev${NC}"
echo "   Then visit: http://localhost:3000"
echo ""
echo "2. Review the guides:"
echo "   - HACKATHON_SUBMISSION_MASTER_CHECKLIST.md (start here)"
echo "   - DEMO_POLISH_GUIDE.md"
echo "   - SCREENSHOT_CAPTURE_GUIDE.md"
echo "   - VIDEO_SCRIPT_DETAILED.md"
echo "   - DEPLOYMENT_READINESS_PROOF.md"
echo ""
echo "3. Capture screenshots:"
echo "   Follow SCREENSHOT_CAPTURE_GUIDE.md"
echo "   Save to: screenshots/"
echo ""
echo "4. Record video:"
echo "   Follow VIDEO_SCRIPT_DETAILED.md"
echo "   Duration: 3-5 minutes"
echo ""
echo "5. Complete submission:"
echo "   Follow HACKATHON_SUBMISSION_MASTER_CHECKLIST.md"
echo ""

# Helpful commands
echo -e "${BLUE}📝 Helpful Commands${NC}"
echo "==================="
echo ""
echo "Start frontend demo:"
echo -e "  ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo "Verify infrastructure:"
echo -e "  ${YELLOW}cd infrastructure && npx cdk synth${NC}"
echo ""
echo "Check for errors:"
echo -e "  ${YELLOW}cd frontend && npm run build${NC}"
echo -e "  ${YELLOW}cd infrastructure && npx tsc --noEmit${NC}"
echo ""
echo "View project structure:"
echo -e "  ${YELLOW}tree -I 'node_modules|.next|cdk.out' -L 3${NC}"
echo ""

# Time estimate
echo -e "${BLUE}⏱️ Time Estimate${NC}"
echo "================"
echo ""
echo "Total time needed: 6-9 hours"
echo "Recommended start: 48 hours before deadline"
echo ""
echo "Phase 1 (Demo Polish): 2-3 hours"
echo "Phase 2 (Screenshots): 1 hour"
echo "Phase 3 (Video): 2-3 hours"
echo "Phase 4 (Documentation): 1-2 hours"
echo "Phase 5 (Submission): 30 minutes"
echo ""

# Success message
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo ""
echo "You're ready to start preparing your hackathon submission."
echo "Follow the master checklist to track your progress."
echo ""
echo -e "${BLUE}Good luck! 🏆${NC}"
echo ""

# Open master checklist (optional)
if command -v open &> /dev/null; then
    read -p "Open master checklist now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open HACKATHON_SUBMISSION_MASTER_CHECKLIST.md
    fi
elif command -v xdg-open &> /dev/null; then
    read -p "Open master checklist now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open HACKATHON_SUBMISSION_MASTER_CHECKLIST.md
    fi
fi
