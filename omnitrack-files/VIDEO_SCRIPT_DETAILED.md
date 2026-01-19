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

### SEGMENT 1: The Problem (0:00 - 0:30)

**Visual**: Start with statistics/problem visualization or landing page

**Script**:
```
[0:00-0:10]
"Supply chain disruptions cost businesses $4 trillion annually. 
Companies take 3-7 days just to detect a problem, and another 
2-5 days to respond."

[0:10-0:20]
"By the time they realize there's an issue, the damage has already 
cascaded through their entire network - affecting suppliers, 
distributors, and customers."

[0:20-0:30]
"Traditional systems are reactive, manual, and simply too slow. 
We need a better solution."
```

**Camera Actions**:
- Start with impactful visual (stats or problem illustration)
- Transition to landing page showing the solution
- Keep text on screen for emphasis

**Notes**:
- Speak with urgency about the problem
- Use statistics to establish credibility
- Set up the need for the solution

---

### SEGMENT 2: The Solution (0:30 - 1:00)

**Visual**: Landing page and dashboard

**Script**:
```
[0:30-0:40]
[Show landing page]
"Meet OmniTrack AI - an autonomous multi-agent system that detects 
disruptions 10x faster and responds 50x faster than traditional 
systems."

[0:40-0:50]
[Scroll through features]
"Four specialized AI agents work together: Info Agent detects 
anomalies, Scenario Agent simulates outcomes, Strategy Agent 
recommends solutions, and Impact Agent assesses consequences."

[0:50-1:00]
[Transition to dashboard]
"The platform provides real-time visibility, predictive analytics, 
and autonomous decision-making - transforming reactive crisis 
management into proactive resilience."
```

**Camera Actions**:
- Show landing page hero section
- Highlight agent capabilities
- Smooth transition to dashboard
- Keep pace energetic

**Notes**:
- Emphasize the value proposition
- Focus on benefits, not features
- Build excitement for the demo

---

### SEGMENT 3: Live Application Demo (1:00 - 2:30)

**Visual**: Browser with localhost:3000

**Script**:
```
[1:00-1:15]
[Navigate to http://localhost:3000, then /dashboard]
"Here's the live application. The dashboard shows your entire supply 
chain network - suppliers, manufacturers, warehouses, and distributors. 
Each node displays real-time status and metrics."

[1:15-1:30]
[Interact with supply chain network]
"Click any node to see detailed information. The visualization updates 
in real-time, highlighting issues as they emerge. This is your 
command center for supply chain operations."

[1:30-1:45]
[Show agent controls and trigger Info Agent]
"The four AI agents work autonomously. The Info Agent scans the 
network and immediately identifies two critical issues - a distribution 
hub at 19% capacity and a supplier showing warning signs."

[1:45-2:00]
[Navigate to scenarios page]
"The scenarios page lets you run what-if simulations. Select a 
disruption type, set severity and duration, then run the simulation 
to see predicted impacts and recommended strategies."

[2:00-2:10]
[Navigate to explainability page]
"Every AI decision is transparent. Decision trees show the reasoning 
process, confidence scores indicate certainty, and natural language 
summaries explain recommendations in plain English."

[2:10-2:20]
[Quick tour: sustainability, voice, AR, marketplace]
"The platform includes sustainability tracking with carbon footprint 
analysis, voice interface for hands-free operation, AR visualization 
for spatial insights, and a marketplace for sharing strategies."

[2:20-2:30]
[Return to dashboard]
"Eight fully functional pages working together to transform supply 
chain management from reactive to proactive."
```

**Camera Actions**:
- Smooth page transitions
- Highlight interactive elements
- Show real functionality
- Keep pace brisk but clear

**Demo Preparation**:
- Ensure demo data is loaded
- Test all interactions beforehand
- Have backup plan if something fails
- Keep browser at 1920x1080

**Notes**:
- Focus on value and functionality
- Show real problem-solving
- Demonstrate intelligence
- Build toward technical reveal

---

### SEGMENT 4: Technical Architecture (2:30 - 3:30)

**Visual**: IDE with infrastructure code, terminal

**Script**:
```
[2:30-2:45]
[Open infrastructure/lib/infrastructure-stack.ts]
"Behind this application is production-ready AWS infrastructure. 
22 Lambda functions for microservices, DynamoDB for data storage, 
ElastiCache Redis for caching, API Gateway for REST and WebSocket 
APIs."

[2:45-3:00]
[Scroll through infrastructure code]
"Complete with CloudWatch monitoring, X-Ray tracing, comprehensive 
IAM roles, VPC configuration, and security groups - all following 
AWS best practices."

[3:00-3:10]
[Show frontend code structure]
"The frontend is built with Next.js 15 and React 19. 50+ components, 
D3.js visualizations, real-time WebSocket connections, and a 
comprehensive design system."

[3:10-3:20]
[Switch to terminal, run: cd infrastructure && npx cdk synth]
"The infrastructure synthesizes successfully - over 2000 lines of 
CloudFormation templates, ready for deployment."

[3:20-3:30]
[Show successful synth output]
"Currently running locally for this demo, but one command deploys the 
entire stack to AWS. This is enterprise-grade, deployment-ready 
infrastructure."
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
- Show technical depth
- Build credibility
- Set up for Kiro reveal

---

### SEGMENT 5: The Kiro Advantage (3:30 - 4:30)

**Visual**: Kiro IDE, .kiro folder structure, spec files, steering docs, hooks

**Script**:
```
[3:30-3:45]
[Show Kiro IDE with .kiro/ folder expanded]
"This entire application was built using Amazon Kiro's complete workflow. 
Three powerful capabilities: spec-driven development, agent steering, 
and automated hooks."

[3:45-3:55]
[Open .kiro/specs/requirements.md]
"I started with natural language specifications. Requirements, design 
properties, implementation tasks. Kiro generated 17,500+ lines of code - 
22 Lambda functions, 50 React components, complete AWS infrastructure."

[3:55-4:05]
[Show .kiro/steering/omnitrack-conventions.md]
"Agent steering ensured consistency. I defined coding standards and 
design tokens once. Every component Kiro generated followed these 
conventions - 50+ components with perfect consistency and WCAG AA 
compliance from day one."

[4:05-4:15]
[Show .kiro/hooks/ folder with hook files]
"Automated hooks provided continuous quality. Tests run on save, 
TypeScript validation on every change, infrastructure checks before 
deployment. This safety net enabled rapid iteration without breaking 
things."

[4:15-4:25]
[Show MCP integration and code stats]
"MCP integration gave Kiro real-time AWS documentation access. Generated 
code uses current patterns, not outdated examples. Result: 10x faster 
development, enterprise quality, zero TypeScript errors."

[4:25-4:30]
[Show final screen with branding]
"OmniTrack AI: solving a $4 trillion problem with autonomous AI agents. 
Built entirely with Amazon Kiro. Thank you!"
```

**Camera Actions**:
- Show Kiro IDE with .kiro folder structure
- Highlight specs, steering, and hooks folders
- Show actual file contents briefly
- Demonstrate the workflow visually
- End with strong branding

**Final Screen** (create graphic):
```
OmniTrack AI
Autonomous AI for Supply Chain Resilience

Built with Amazon Kiro
✓ Spec-Driven Development
✓ Agent Steering
✓ Automated Hooks
✓ MCP Integration

17,500+ Lines Generated
Zero TypeScript Errors
Production-Ready

AWS Global Vibe Hackathon 2025
```

**Notes**:
- Show all three Kiro capabilities (specs, steering, hooks)
- Demonstrate the .kiro folder structure
- Emphasize workflow, not just code generation
- Mention MCP for context-aware generation
- Show impressive statistics
- Highlight speed and quality
- Strong, confident conclusion

**Files to Show**:
- `.kiro/specs/omnitrack-ai-supply-chain/requirements.md`
- `.kiro/steering/omnitrack-conventions.md`
- `.kiro/hooks/test-on-save.json`
- MCP configuration or mention

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
