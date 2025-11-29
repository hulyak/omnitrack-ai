# 📸 Screenshot Capture Guide

## Professional Screenshots for Hackathon Submission

This guide provides step-by-step instructions for capturing all 8 required screenshots.

---

## 🎯 Quick Setup

### Before You Start

```bash
# 1. Create screenshots directory
mkdir -p screenshots

# 2. Ensure demo is running
cd frontend
npm run dev
# Keep this running in background

# 3. Verify infrastructure works
cd infrastructure
npx cdk synth
```

### Browser Setup

1. Use Chrome or Firefox (best rendering)
2. Set window size to 1920x1080
3. Use incognito/private mode (clean state)
4. Hide bookmarks bar (Cmd+Shift+B on Mac)
5. Close unnecessary tabs
6. Zoom level: 100%

### IDE Setup

1. Clean workspace (close unnecessary files)
2. Set font size to readable level (14-16pt)
3. Use light theme (better for screenshots)
4. Hide unnecessary panels
5. Ensure Kiro branding is visible

---

## 📸 Screenshot 1: Kiro IDE Interface

**Purpose**: Show Kiro as your development environment

### Setup Steps

1. Open Kiro IDE
2. Open project root folder
3. In sidebar, expand:
   - `.kiro/specs/`
   - `frontend/`
   - `infrastructure/`
4. In editor, open: `infrastructure/lambda/agents/strategy-agent.ts`
5. Scroll to show imports and main function
6. Ensure file path is visible in tab

### What to Show

- ✅ Kiro IDE interface with branding
- ✅ File tree showing project structure
- ✅ Generated code in editor
- ✅ File path visible
- ✅ Line numbers visible
- ✅ Professional appearance

### Capture

- **Window**: Full Kiro IDE window
- **Resolution**: 1920x1080 minimum
- **Format**: PNG
- **Filename**: `screenshots/01-kiro-ide-interface.png`

### Checklist

- [ ] Kiro branding visible
- [ ] Project structure clear
- [ ] Code is readable
- [ ] No personal information
- [ ] Professional appearance

---

## 📸 Screenshot 2: Spec Files Structure

**Purpose**: Demonstrate spec-driven development

### Setup Steps

1. In Kiro IDE file tree, expand:
   - `.kiro/specs/`
   - `.kiro/specs/omnitrack-ai-supply-chain/`
   - `.kiro/specs/ai-copilot/`
2. Open `requirements.md` in preview mode
3. Scroll to show user stories and acceptance criteria
4. Ensure both folders are visible in tree

### What to Show

- ✅ `.kiro/specs/` folder structure
- ✅ Both feature specs visible
- ✅ Requirements document open
- ✅ User stories and acceptance criteria
- ✅ Professional formatting

### Capture

- **Window**: IDE with file tree + document preview
- **Resolution**: 1920x1080 minimum
- **Format**: PNG
- **Filename**: `screenshots/02-spec-files-structure.png`

### Checklist

- [ ] Folder structure clear
- [ ] Requirements visible
- [ ] Professional formatting
- [ ] Easy to understand
- [ ] Shows spec-driven approach

---

## 📸 Screenshot 3: Generated Lambda Code

**Purpose**: Show complex AI-generated code

### Setup Steps

1. Open: `infrastructure/lambda/agents/strategy-agent.ts`
2. Scroll to show:
   - Imports (AWS SDK, types)
   - Main handler function
   - Business logic
   - Error handling
3. Ensure line numbers are visible
4. File path should be in tab

### What to Show

- ✅ Complex TypeScript code
- ✅ AWS SDK imports
- ✅ Type definitions
- ✅ Error handling
- ✅ Professional code structure
- ✅ Line numbers

### Capture

- **Window**: Code editor full screen
- **Resolution**: 1920x1080 minimum
- **Format**: PNG
- **Filename**: `screenshots/03-generated-lambda-code.png`

### Checklist

- [ ] Code is readable (font size 14-16pt)
- [ ] Shows complexity
- [ ] Professional formatting
- [ ] File path visible
- [ ] Line numbers visible

### Alternative Files to Show

If strategy-agent.ts isn't impressive enough:
- `infrastructure/lambda/copilot/copilot-orchestrator.ts`
- `infrastructure/lib/infrastructure-stack.ts`
- `frontend/components/dashboard/supply-chain-network.tsx`

---

## 📸 Screenshot 4: Frontend Landing Page

**Purpose**: Show professional UI

### Setup Steps

1. Open browser (Chrome/Firefox)
2. Navigate to: `http://localhost:3000`
3. Wait for page to fully load
4. Ensure hero section is visible
5. Scroll to show key features
6. Address bar should show localhost

### What to Show

- ✅ Professional landing page
- ✅ Hero section with branding
- ✅ Key features visible
- ✅ Clean, modern design
- ✅ No console errors
- ✅ Address bar showing localhost

### Capture

- **Window**: Full browser window
- **Resolution**: 1920x1080 minimum
- **Format**: PNG
- **Filename**: `screenshots/04-frontend-landing.png`

### Checklist

- [ ] Page fully loaded
- [ ] No loading spinners
- [ ] Professional appearance
- [ ] Branding clear
- [ ] Address bar visible

### Pro Tips

- Hide bookmarks bar for cleaner look
- Ensure good contrast
- Check for any UI glitches
- Make sure images are loaded

---

## 📸 Screenshot 5: Dashboard with Live Data

**Purpose**: Show interactive features and functionality

### Setup Steps

1. Navigate to: `http://localhost:3000/dashboard`
2. Wait for all components to load:
   - Supply chain network
   - Key metrics
   - Agent controls
   - Active alerts
3. Ensure data is displayed (not loading states)
4. If possible, show interactive state (hover, selected node)

### What to Show

- ✅ Complete dashboard layout
- ✅ Supply chain network visualization
- ✅ Key metrics with data
- ✅ Agent control panel
- ✅ Active alerts/notifications
- ✅ Professional data visualization

### Capture

- **Window**: Full browser window
- **Resolution**: 1920x1080 minimum
- **Format**: PNG
- **Filename**: `screenshots/05-dashboard-live.png`

### Checklist

- [ ] All components loaded
- [ ] Data is visible (not placeholders)
- [ ] Network visualization rendered
- [ ] Metrics show values
- [ ] Professional appearance
- [ ] No errors in console

### Pro Tips

- Seed demo data first if needed
- Ensure network graph is rendered
- Show multiple features in one shot
- Capture at peak visual interest

---

## 📸 Screenshot 6: Infrastructure Stack Code

**Purpose**: Show deployment-ready infrastructure

### Setup Steps

1. Open: `infrastructure/lib/infrastructure-stack.ts`
2. Scroll to show:
   - Lambda function definitions
   - DynamoDB table configuration
   - Redis cluster setup
   - API Gateway configuration
3. Show line count (should be 2000+)
4. Ensure file path is visible

### What to Show

- ✅ AWS CDK infrastructure code
- ✅ Multiple AWS services
- ✅ Lambda functions
- ✅ Database configuration
- ✅ Professional code structure
- ✅ Line numbers showing scale

### Capture

- **Window**: Code editor full screen
- **Resolution**: 1920x1080 minimum
- **Format**: PNG
- **Filename**: `screenshots/06-infrastructure-code.png`

### Checklist

- [ ] Shows multiple AWS services
- [ ] Code is readable
- [ ] Line numbers visible
- [ ] File path visible
- [ ] Professional formatting

### What to Highlight

Look for sections with:
- Lambda function definitions
- DynamoDB table creation
- Redis cluster configuration
- API Gateway setup
- IAM roles and policies

---

## 📸 Screenshot 7: CDK Synth Success

**Purpose**: Prove deployment readiness

### Setup Steps

1. Open terminal
2. Navigate to infrastructure:
   ```bash
   cd infrastructure
   ```
3. Run CDK synth:
   ```bash
   npx cdk synth
   ```
4. Wait for completion
5. Capture terminal showing success

### What to Show

- ✅ Command: `npx cdk synth`
- ✅ Success output
- ✅ CloudFormation template generation
- ✅ No errors
- ✅ Timestamp (recent)
- ✅ File path/directory

### Capture

- **Window**: Terminal window
- **Resolution**: 1920x1080 minimum
- **Format**: PNG
- **Filename**: `screenshots/07-cdk-synth-success.png`

### Checklist

- [ ] Command visible
- [ ] Success indicators clear
- [ ] No error messages
- [ ] Timestamp visible
- [ ] Professional terminal theme

### Terminal Setup

For best appearance:
- Use a professional terminal theme
- Font size: 14-16pt
- Clear previous output
- Ensure good contrast
- Show full command and output

### Alternative Command

If synth output is too verbose:
```bash
npx cdk synth > /dev/null && echo "✅ CDK Synthesis Successful - Ready for Deployment"
```

---

## 📸 Screenshot 8: Architecture Diagram

**Purpose**: Show system design and AWS services

### Setup Steps

**Option A: Use Existing Diagram**
1. Open: `docs/architecture/ARCHITECTURE.md`
2. Render Mermaid diagram
3. Capture diagram

**Option B: Create Visual Diagram**
1. Use draw.io, Lucidchart, or similar
2. Create architecture diagram showing:
   - Frontend (Next.js)
   - API Gateway
   - Lambda functions
   - DynamoDB
   - Redis
   - S3
   - CloudWatch
   - Cognito

### What to Show

- ✅ Complete system architecture
- ✅ All major AWS services
- ✅ Data flow
- ✅ Service relationships
- ✅ Professional diagram
- ✅ Clear labels

### Capture

- **Window**: Diagram viewer or editor
- **Resolution**: 1920x1080 minimum
- **Format**: PNG
- **Filename**: `screenshots/08-architecture-diagram.png`

### Checklist

- [ ] All services visible
- [ ] Clear relationships
- [ ] Professional appearance
- [ ] Easy to understand
- [ ] Proper labels

### Services to Include

**Frontend**:
- Next.js Application
- React Components

**Backend**:
- API Gateway (REST + WebSocket)
- 22+ Lambda Functions
- DynamoDB (Single Table)
- ElastiCache Redis
- S3 (Storage)

**Security & Monitoring**:
- Cognito (Auth)
- CloudWatch (Monitoring)
- X-Ray (Tracing)
- IAM (Permissions)

**AI/ML** (if applicable):
- Amazon Bedrock
- Step Functions

---

## 🎨 Post-Capture Editing

### Tools

**macOS**:
- Preview (built-in)
- Skitch (annotations)
- CleanShot X (professional)

**Cross-platform**:
- GIMP (free)
- Photoshop (professional)
- Figma (design tool)

### Editing Checklist

For each screenshot:

- [ ] Crop to remove unnecessary space
- [ ] Ensure 1920x1080 or similar professional resolution
- [ ] Add subtle drop shadow (optional)
- [ ] Compress for web (PNG optimization)
- [ ] Add arrows/highlights if needed (sparingly)
- [ ] Verify text is readable
- [ ] Check for personal information
- [ ] Save with descriptive filename

### Annotation Guidelines

**When to annotate**:
- Highlight key features
- Point out important code
- Show data flow
- Emphasize innovation

**How to annotate**:
- Use arrows sparingly
- Keep annotations minimal
- Use consistent colors
- Don't clutter the image
- Ensure annotations are professional

### Compression

Optimize file size without losing quality:

```bash
# Using ImageOptim (macOS)
# Drag and drop PNG files

# Using command line (requires optipng)
optipng -o7 screenshots/*.png

# Using online tools
# TinyPNG.com
# Squoosh.app
```

Target: < 500KB per screenshot

---

## ✅ Final Quality Check

### Review Each Screenshot

**Technical Quality**:
- [ ] Resolution: 1920x1080 or higher
- [ ] Format: PNG (lossless)
- [ ] File size: < 500KB (optimized)
- [ ] No pixelation or blur
- [ ] Colors accurate

**Content Quality**:
- [ ] Shows what it's supposed to show
- [ ] Text is readable
- [ ] No personal information
- [ ] No errors or glitches visible
- [ ] Professional appearance

**Composition**:
- [ ] Well-framed
- [ ] Important elements visible
- [ ] Not too cluttered
- [ ] Good contrast
- [ ] Visually appealing

### Screenshot Set Review

As a complete set, screenshots should:
- [ ] Tell a complete story
- [ ] Show Kiro usage throughout
- [ ] Demonstrate functionality
- [ ] Prove deployment readiness
- [ ] Look professional together
- [ ] Be consistent in style

---

## 📁 File Organization

### Directory Structure

```
screenshots/
├── 01-kiro-ide-interface.png
├── 02-spec-files-structure.png
├── 03-generated-lambda-code.png
├── 04-frontend-landing.png
├── 05-dashboard-live.png
├── 06-infrastructure-code.png
├── 07-cdk-synth-success.png
├── 08-architecture-diagram.png
└── README.md (optional - describes each screenshot)
```

### Naming Convention

Use descriptive, numbered filenames:
- Start with number (for ordering)
- Use hyphens (not spaces)
- Be descriptive
- Use lowercase
- Include .png extension

---

## 🚀 Quick Capture Script

Save time with this script:

```bash
#!/bin/bash

# Create screenshots directory
mkdir -p screenshots

echo "📸 Screenshot Capture Guide"
echo "=========================="
echo ""
echo "Capture these 8 screenshots:"
echo ""
echo "1. Kiro IDE Interface"
echo "   - Open Kiro with project"
echo "   - Show file tree + generated code"
echo "   - Save as: screenshots/01-kiro-ide-interface.png"
echo ""
echo "2. Spec Files Structure"
echo "   - Show .kiro/specs/ folder"
echo "   - Open requirements.md"
echo "   - Save as: screenshots/02-spec-files-structure.png"
echo ""
echo "3. Generated Lambda Code"
echo "   - Open strategy-agent.ts"
echo "   - Show complex code"
echo "   - Save as: screenshots/03-generated-lambda-code.png"
echo ""
echo "4. Frontend Landing Page"
echo "   - Navigate to localhost:3000"
echo "   - Show hero section"
echo "   - Save as: screenshots/04-frontend-landing.png"
echo ""
echo "5. Dashboard with Live Data"
echo "   - Navigate to /dashboard"
echo "   - Show all components"
echo "   - Save as: screenshots/05-dashboard-live.png"
echo ""
echo "6. Infrastructure Stack Code"
echo "   - Open infrastructure-stack.ts"
echo "   - Show AWS services"
echo "   - Save as: screenshots/06-infrastructure-code.png"
echo ""
echo "7. CDK Synth Success"
echo "   - Run: npx cdk synth"
echo "   - Show success output"
echo "   - Save as: screenshots/07-cdk-synth-success.png"
echo ""
echo "8. Architecture Diagram"
echo "   - Open architecture diagram"
echo "   - Show all services"
echo "   - Save as: screenshots/08-architecture-diagram.png"
echo ""
echo "After capturing, run: ls -lh screenshots/"
```

Save as `capture-screenshots.sh` and run:
```bash
chmod +x capture-screenshots.sh
./capture-screenshots.sh
```

---

## 🎯 Success Criteria

Your screenshots are ready when:

✅ **All 8 captured**: Complete set
✅ **High quality**: 1080p, clear, readable
✅ **Professional**: Clean, polished appearance
✅ **Consistent**: Similar style and quality
✅ **Compelling**: Tell a clear story
✅ **Optimized**: Reasonable file sizes
✅ **Organized**: Properly named and stored

---

**Pro Tip**: Capture screenshots in one session to ensure consistency in lighting, theme, and style!

Good luck! 📸🏆
