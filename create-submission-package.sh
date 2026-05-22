#!/bin/bash

# OmniTrack AI - Create Hackathon Submission Package
# This script creates a clean submission package ready for upload

echo "📦 Creating hackathon submission package..."

# Create submission directory
SUBMISSION_DIR="omnitrack-ai-submission"
rm -rf $SUBMISSION_DIR
mkdir -p $SUBMISSION_DIR

echo "📋 Copying essential files..."

# Copy root documentation
cp README.md $SUBMISSION_DIR/
cp START_HERE_HACKATHON.md $SUBMISSION_DIR/
cp HACKATHON_PROJECT_DESCRIPTION.md $SUBMISSION_DIR/
cp HACKATHON_DOCS_INDEX.md $SUBMISSION_DIR/
cp HACKATHON_READY_GUIDE.md $SUBMISSION_DIR/
cp HACKATHON_SUBMISSION_MASTER_CHECKLIST.md $SUBMISSION_DIR/
cp HACKATHON_SUBMISSION_READY.md $SUBMISSION_DIR/
cp PITCH.md $SUBMISSION_DIR/
cp VISION.md $SUBMISSION_DIR/
cp QUICK_REFERENCE_CARD.md $SUBMISSION_DIR/
cp SETUP.md $SUBMISSION_DIR/
cp DEPLOYMENT_GUIDE.md $SUBMISSION_DIR/
cp VIDEO_SCRIPT_DETAILED.md $SUBMISSION_DIR/
cp SCREENSHOT_CAPTURE_GUIDE.md $SUBMISSION_DIR/
cp SUPPLY_CHAIN_FLOW_DIAGRAM.md $SUBMISSION_DIR/

# Copy configuration files
cp package.json $SUBMISSION_DIR/
cp package-lock.json $SUBMISSION_DIR/
cp .gitignore $SUBMISSION_DIR/

# Copy scripts
mkdir -p $SUBMISSION_DIR/scripts
cp fix-and-start-demo.sh $SUBMISSION_DIR/
cp verify-setup.sh $SUBMISSION_DIR/
cp -r scripts/* $SUBMISSION_DIR/scripts/

# Copy documentation
echo "📚 Copying documentation..."
cp -r docs $SUBMISSION_DIR/

# Copy frontend (excluding node_modules and build artifacts)
echo "🎨 Copying frontend..."
mkdir -p $SUBMISSION_DIR/frontend
rsync -av --exclude='node_modules' --exclude='.next' --exclude='.turbo' frontend/ $SUBMISSION_DIR/frontend/

# Copy infrastructure (excluding node_modules and build artifacts)
echo "🏗️  Copying infrastructure..."
mkdir -p $SUBMISSION_DIR/infrastructure
rsync -av --exclude='node_modules' --exclude='cdk.out' --exclude='.env' infrastructure/ $SUBMISSION_DIR/infrastructure/

# Copy GitHub workflows
echo "⚙️  Copying CI/CD..."
mkdir -p $SUBMISSION_DIR/.github
cp -r .github/workflows $SUBMISSION_DIR/.github/

# Create a clean .env.example
echo "🔐 Creating .env.example..."
cat > $SUBMISSION_DIR/infrastructure/.env.example << 'EOF'
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your-account-id

# Application Configuration
ENVIRONMENT=production
LOG_LEVEL=info

# Bedrock Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://your-api-gateway-url
NEXT_PUBLIC_WS_URL=wss://your-websocket-url

# Optional: Custom Domain
# CUSTOM_DOMAIN=omnitrack.example.com
EOF

# Create submission README
echo "📝 Creating submission README..."
cat > $SUBMISSION_DIR/SUBMISSION_README.md << 'EOF'
# OmniTrack AI - Hackathon Submission Package

## 🚀 Quick Start

### For Judges - 5 Minute Setup

1. **Install Dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Start Demo**
   ```bash
   ./fix-and-start-demo.sh
   ```

3. **Access Application**
   - Open: http://localhost:3000
   - Dashboard: http://localhost:3000/dashboard

### Key Documents

- **START_HERE_HACKATHON.md** - Quick start guide for judges
- **HACKATHON_PROJECT_DESCRIPTION.md** - Complete project overview
- **VIDEO_SCRIPT_DETAILED.md** - Demo video script
- **PITCH.md** - Elevator pitch
- **DEPLOYMENT_GUIDE.md** - AWS deployment instructions

### Project Structure

```
omnitrack-ai-submission/
├── README.md                          # Main documentation
├── START_HERE_HACKATHON.md            # Judge quick start
├── HACKATHON_PROJECT_DESCRIPTION.md   # Project details
├── docs/                              # Complete documentation
├── frontend/                          # Next.js application
├── infrastructure/                    # AWS CDK infrastructure
└── scripts/                           # Utility scripts
```

### Features to Demo

1. **Supply Chain Dashboard** - Real-time monitoring
2. **AI Agents** - Multi-agent orchestration
3. **Scenario Analysis** - What-if simulations
4. **AI Explainability** - Decision transparency
5. **AI Copilot** - Natural language interface

### AWS Services Used

- Amazon Bedrock (Claude 3.5 Sonnet)
- AWS Lambda
- DynamoDB
- Step Functions
- API Gateway
- CloudWatch
- Cognito
- IoT Core

### Support

For questions or issues:
- See SETUP.md for detailed setup
- See docs/operations/TROUBLESHOOTING.md for common issues
- See HACKATHON_DOCS_INDEX.md for all documentation

---

**Built for AWS Hackathon 2025**
**Powered by Amazon Bedrock and AWS Serverless**
EOF

# Create package info
cat > $SUBMISSION_DIR/PACKAGE_INFO.txt << EOF
OmniTrack AI - Hackathon Submission Package
============================================

Created: $(date)
Package Version: 1.0.0
Submission Ready: Yes

Contents:
- Source code (frontend + infrastructure)
- Complete documentation
- Setup and deployment scripts
- Demo scripts
- Architecture diagrams
- API documentation

Total Files: $(find $SUBMISSION_DIR -type f | wc -l)
Total Size: $(du -sh $SUBMISSION_DIR | cut -f1)

Next Steps:
1. Review SUBMISSION_README.md
2. Test with ./fix-and-start-demo.sh
3. Record demo video
4. Capture screenshots
5. Submit to hackathon platform

Good luck! 🚀
EOF

# Create archive
echo "🗜️  Creating archive..."
tar -czf omnitrack-ai-submission.tar.gz $SUBMISSION_DIR

# Create zip for Windows compatibility
zip -r omnitrack-ai-submission.zip $SUBMISSION_DIR -q

echo ""
echo "✅ Submission package created!"
echo ""
echo "📦 Package Details:"
echo "  Directory: $SUBMISSION_DIR/"
echo "  Archive (tar.gz): omnitrack-ai-submission.tar.gz"
echo "  Archive (zip): omnitrack-ai-submission.zip"
echo "  Total Files: $(find $SUBMISSION_DIR -type f | wc -l)"
echo "  Package Size: $(du -sh $SUBMISSION_DIR | cut -f1)"
echo ""
echo "📋 Contents:"
echo "  ✓ Source code (frontend + infrastructure)"
echo "  ✓ Documentation (16 markdown files + docs/)"
echo "  ✓ Scripts (demo, setup, deployment)"
echo "  ✓ Configuration files"
echo "  ✓ CI/CD workflows"
echo ""
echo "🎯 Next Steps:"
echo "  1. Test the package:"
echo "     cd $SUBMISSION_DIR"
echo "     ./fix-and-start-demo.sh"
echo ""
echo "  2. Review submission checklist:"
echo "     cat HACKATHON_SUBMISSION_MASTER_CHECKLIST.md"
echo ""
echo "  3. Upload to hackathon platform:"
echo "     - Use omnitrack-ai-submission.tar.gz (Linux/Mac)"
echo "     - Use omnitrack-ai-submission.zip (Windows)"
echo ""
echo "🏆 Ready to submit!"
echo ""
