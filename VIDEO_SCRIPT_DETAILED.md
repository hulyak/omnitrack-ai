# 🎬 OmniTrack AI - Detailed Video Script

## Hackathon Submission Video (3-5 minutes)

---

## 📋 Pre-Recording Checklist

- [ ] Practice script 3 times
- [ ] Test all demo features
- [ ] Clear browser cache
- [ ] Close unnecessary applications
- [ ] Set up recording software (1920x1080, 30fps)
- [ ] Test microphone audio
- [ ] Prepare all windows/tabs in advance
- [ ] Have water nearby

---

## 🎥 Video Structure

**Total Duration**: 4 minutes 30 seconds

1. Introduction - 30 seconds
2. Kiro Usage Demo - 60 seconds
3. Local App Demo - 90 seconds
4. Architecture & Deployment - 60 seconds
5. Conclusion - 30 seconds

---

## 📝 Detailed Script with Timing

### SEGMENT 1: Introduction (0:00 - 0:30)

**Visual**: Kiro IDE with project open

**Script**:
```
[0:00-0:05]
"Hi, I'm presenting OmniTrack AI - an enterprise-grade AI-powered 
supply chain management platform."

[0:05-0:10]
[Show Kiro IDE interface clearly]
"This project was built entirely using Amazon Kiro."

[0:10-0:20]
[Show .kiro/specs folder structure]
"It demonstrates Kiro's power for spec-driven development, generating 
production-ready AWS infrastructure and a complete Next.js application."

[0:20-0:30]
[Show project file tree]
"All from natural language specifications. Let me show you how."
```

**Camera Actions**:
- Start with Kiro IDE full screen
- Slowly pan to show file structure
- Highlight `.kiro/specs/` folder
- Smooth transitions

**Notes**:
- Speak clearly and confidently
- Ensure Kiro branding is visible
- Keep cursor movements smooth

---

### SEGMENT 2: Kiro Usage Demo (0:30 - 1:30)

**Visual**: Kiro IDE, spec files, generated code

**Script**:
```
[0:30-0:40]
[Open .kiro/specs/omnitrack-ai-supply-chain/requirements.md]
"I started by creating detailed requirements in natural language. 
User stories, acceptance criteria, and technical specifications."

[0:40-0:50]
[Scroll through requirements document]
"Kiro analyzed these requirements and suggested architectural patterns, 
AWS services, and design approaches."

[0:50-1:00]
[Open infrastructure/lambda/agents/strategy-agent.ts]
"From these specs, Kiro generated 22+ AWS Lambda functions. Here's 
the strategy agent - complex business logic, error handling, and 
AWS integrations."

[1:00-1:10]
[Open frontend/components/dashboard/supply-chain-network.tsx]
"A complete Next.js frontend with 50+ React components. This is the 
supply chain network visualization - D3.js integration, real-time 
updates, and interactive features."

[1:10-1:20]
[Open infrastructure/lib/infrastructure-stack.ts]
"And full AWS CDK infrastructure - over 2000 lines of production-ready 
code. DynamoDB, Redis, API Gateway, Lambda functions, monitoring, 
and security."

[1:20-1:30]
[Show file count in terminal]
"All generated from specifications. That's the power of spec-driven 
development with Kiro."
```

**Camera Actions**:
- Smooth transitions between files
- Highlight key code sections
- Show line numbers and file paths
- Pause briefly on complex code

**Terminal Commands** (prepare in advance):
```bash
# Show file counts
find . -name '*.ts' -not -path './node_modules/*' | wc -l
find . -name '*.tsx' -not -path './node_modules/*' | wc -l
find infrastructure/lambda -name '*.ts' | wc -l
```

**Notes**:
- Don't scroll too fast
- Highlight impressive code sections
- Show file paths clearly

---

### SEGMENT 3: Local App Demo (1:30 - 3:00)

**Visual**: Browser with localhost:3000

**Script**:
```
[1:30-1:40]
[Navigate to http://localhost:3000]
"Here's the application running locally. The landing page showcases 
our AI-powered supply chain platform with a clean, professional 
interface."

[1:40-1:50]
[Scroll through landing page features]
"Key features include real-time monitoring, AI agent orchestration, 
scenario simulation, and explainable AI decisions."

[1:50-2:05]
[Click "Get Started" or navigate to /dashboard]
"The dashboard provides real-time supply chain visibility. Here we 
have an interactive network visualization showing suppliers, 
manufacturers, and distribution centers."

[2:05-2:20]
[Interact with supply chain network]
"Users can click nodes to see details, view connections, and monitor 
status in real-time. The network updates dynamically as conditions 
change."

[2:20-2:35]
[Show agent controls panel]
"The AI agent system includes four specialized agents: Info Agent 
for data gathering, Scenario Agent for what-if analysis, Strategy 
Agent for optimization, and Impact Agent for risk assessment."

[2:35-2:45]
[Trigger an agent if possible, or show results]
"Each agent can be triggered independently or work together for 
comprehensive supply chain intelligence."

[2:45-2:55]
[Navigate to scenarios page]
"The scenarios page allows users to run what-if simulations. Change 
parameters, run the simulation, and get AI-powered recommendations."

[2:55-3:00]
[Show explainability features]
"Every AI decision includes detailed explanations, confidence scores, 
and reasoning - making the AI transparent and trustworthy."
```

**Camera Actions**:
- Smooth page transitions
- Highlight interactive elements
- Show hover states and animations
- Demonstrate key features

**Demo Preparation**:
- Ensure demo data is loaded
- Test all interactions beforehand
- Have backup plan if something fails
- Keep browser at 1920x1080

**Notes**:
- Move cursor deliberately
- Pause on key features
- Show real functionality, not just UI
- Demonstrate value proposition

---

### SEGMENT 4: Architecture & Deployment (3:00 - 4:00)

**Visual**: IDE with infrastructure code, terminal

**Script**:
```
[3:00-3:10]
[Open infrastructure/lib/infrastructure-stack.ts]
"Now let's look at the backend architecture. This is production-ready 
AWS infrastructure, all generated by Kiro."

[3:10-3:20]
[Scroll through infrastructure code]
"We have 22+ Lambda functions for microservices architecture, DynamoDB 
with single-table design for scalable data storage, ElastiCache Redis 
for high-performance caching."

[3:20-3:30]
[Show API Gateway and WebSocket configuration]
"API Gateway for REST APIs, WebSocket APIs for real-time communication, 
complete with authentication, rate limiting, and security headers."

[3:30-3:40]
[Show monitoring and security configuration]
"CloudWatch monitoring, X-Ray tracing, comprehensive IAM roles, VPC 
configuration, and security groups - all following AWS best practices."

[3:40-3:50]
[Switch to terminal, run: cd infrastructure && npx cdk synth]
"The infrastructure synthesizes successfully. This generates over 
2000 lines of CloudFormation templates."

[3:50-4:00]
[Show successful synth output]
"And it's deployment-ready. One command - 'cdk deploy' - deploys 
the entire infrastructure to AWS. Kiro generated not just the 
application, but the complete cloud infrastructure."
```

**Camera Actions**:
- Show code structure clearly
- Highlight AWS services
- Terminal output should be readable
- Show success indicators

**Terminal Commands** (prepare in advance):
```bash
cd infrastructure
npx cdk synth > /dev/null && echo "✅ CDK Synthesis Successful"
```

**Notes**:
- Emphasize "production-ready"
- Show deployment readiness
- Highlight AWS best practices
- Keep technical but accessible

---

### SEGMENT 5: Conclusion (4:00 - 4:30)

**Visual**: Project overview, back to Kiro IDE

**Script**:
```
[4:00-4:10]
[Show project structure overview]
"To summarize: OmniTrack AI is fully functional locally with a 
polished frontend, comprehensive backend services, and deployment-ready 
AWS infrastructure."

[4:10-4:20]
[Show .kiro/specs folder again]
"All generated from specifications using Amazon Kiro's AI-powered 
development workflow. This demonstrates spec-driven development at 
enterprise scale."

[4:20-4:30]
[Show final screen with project name and "Built with Amazon Kiro"]
"From idea to production-ready application in a fraction of the time. 
That's the power of Amazon Kiro. Thank you!"
```

**Camera Actions**:
- Return to starting view
- Show project completeness
- End with clear branding

**Final Screen** (create graphic):
```
OmniTrack AI
AI-Powered Supply Chain Management

Built with Amazon Kiro

[Your Name/Team]
AWS Global Vibe Hackathon 2025
```

**Notes**:
- Confident conclusion
- Emphasize key achievements
- Clear call-to-action (implicit)
- Professional ending

---

## 🎬 Post-Production Checklist

### Editing Tasks

- [ ] Trim dead space at start/end
- [ ] Cut out mistakes or long pauses
- [ ] Add title card (0:00-0:03)
- [ ] Add "Built with Amazon Kiro" watermark (bottom right)
- [ ] Add captions for key points
- [ ] Add subtle background music (royalty-free)
- [ ] Add transition effects (subtle, professional)
- [ ] Color correction if needed
- [ ] Audio normalization
- [ ] Add end card with links (4:30-4:35)

### Title Card Design

```
OmniTrack AI
Enterprise AI-Powered Supply Chain Management

Built with Amazon Kiro

AWS Global Vibe Hackathon 2025
```

### Key Points to Caption

- "Built entirely with Amazon Kiro"
- "22+ AWS Lambda functions generated"
- "50+ React components generated"
- "2000+ lines of infrastructure code"
- "Production-ready architecture"
- "One command deployment"

### Background Music Suggestions

**Royalty-free sources**:
- YouTube Audio Library
- Epidemic Sound
- Artlist

**Style**: Upbeat, tech-focused, not distracting
**Volume**: 20-30% of voice level

### Export Settings

- **Format**: MP4 (H.264)
- **Resolution**: 1920x1080 (1080p)
- **Frame Rate**: 30fps
- **Bitrate**: 8-10 Mbps
- **Audio**: AAC, 192 kbps, 48kHz

---

## 📊 Video Quality Checklist

### Visual Quality
- [ ] 1080p resolution throughout
- [ ] No pixelation or blur
- [ ] Text is readable
- [ ] Colors are accurate
- [ ] Smooth transitions

### Audio Quality
- [ ] Clear voice throughout
- [ ] No background noise
- [ ] Consistent volume
- [ ] Music doesn't overpower voice
- [ ] No audio clipping

### Content Quality
- [ ] All features demonstrated
- [ ] No errors shown
- [ ] Professional presentation
- [ ] Appropriate pacing
- [ ] Clear narrative flow

### Technical Quality
- [ ] No lag or stuttering
- [ ] Smooth cursor movements
- [ ] Proper timing
- [ ] Good lighting (if showing face)
- [ ] Professional appearance

---

## 🎯 Success Metrics

Your video is ready when:

✅ **Duration**: 3-5 minutes (ideal: 4-4.5 minutes)
✅ **Clarity**: All text and code is readable
✅ **Audio**: Clear voice, no background noise
✅ **Pacing**: Not too fast, not too slow
✅ **Content**: Shows Kiro usage, demo, and architecture
✅ **Professional**: Polished, edited, branded
✅ **Engaging**: Tells a compelling story
✅ **Technical**: Demonstrates real functionality

---

## 🚀 Upload Checklist

**Before uploading**:
- [ ] Watch entire video
- [ ] Check audio sync
- [ ] Verify all edits
- [ ] Test on different devices
- [ ] Get feedback from others

**Upload settings** (YouTube/Vimeo):
- Title: "OmniTrack AI - Built with Amazon Kiro | AWS Hackathon 2025"
- Description: Include project description and links
- Tags: AWS, Kiro, Hackathon, AI, Supply Chain, Serverless
- Visibility: Public or Unlisted (per hackathon rules)
- Thumbnail: Custom thumbnail with project logo

**After uploading**:
- [ ] Test video plays correctly
- [ ] Check all links in description
- [ ] Verify visibility settings
- [ ] Copy shareable link
- [ ] Add to submission form

---

**Pro Tip**: Record 2-3 takes and pick the best one. It's easier than trying to get a perfect single take!

Good luck with your video! 🎬🏆
