# OmniTrack AI - Functional App Implementation

## Overview
Transforming OmniTrack from a landing page with waitlist into a FULLY FUNCTIONAL application where users can login/signup and use real agent features.

## Implementation Plan

### Phase 1: Landing Page Updates ✓
- [x] Remove WaitlistFooter component
- [x] Update HeroSection CTA: "Get Started" → /login
- [x] Add "Watch Demo" modal
- [x] Keep agent capabilities section as-is

### Phase 2: Authentication Flow
- [ ] Update login page with Demo Mode button
- [ ] Create signup page (/signup)
- [ ] Implement demo mode (no auth, sample data)
- [ ] Connect to AWS Cognito for real auth

### Phase 3: Functional Dashboard
- [ ] Add live metrics (updating every 5s)
- [ ] Implement React Flow supply chain network
- [ ] Create agent control buttons
- [ ] Connect agent buttons to AWS Lambda

### Phase 4: Agent Integration
- [ ] Info Agent: "Scan for anomalies" button
- [ ] Scenario Agent: Dropdown + "Run Simulation"
- [ ] Strategy Agent: "Generate mitigation plan"
- [ ] Impact Agent: "Calculate ESG impact"

### Phase 5: Backend API Routes
- [ ] Create Next.js API routes for agents
- [ ] Connect to AWS Lambda functions
- [ ] Handle authentication tokens
- [ ] Return real data

## User Flow

```
Landing Page (/)
    ↓
[Get Started] → Login (/login)
    ↓
    ├─→ [Demo Mode] → Dashboard (no auth, sample data)
    └─→ [Login/Signup] → Dashboard (real auth, real data)
         ↓
    Dashboard (/dashboard)
         ↓
    [Agent Buttons] → AWS Lambda → Results Display
```

## Technical Stack
- Frontend: Next.js 15, React 19, Tailwind CSS
- Visualization: React Flow
- Auth: AWS Cognito
- Backend: AWS Lambda
- State: React Context + SWR

## Files to Modify

### Frontend
1. `frontend/app/page.tsx` - Remove waitlist
2. `frontend/components/landing/hero-section.tsx` - Update CTAs
3. `frontend/app/login/page.tsx` - Add Demo Mode
4. `frontend/app/signup/page.tsx` - CREATE NEW
5. `frontend/app/dashboard/page.tsx` - Make functional
6. `frontend/components/dashboard/*` - Add agent controls
7. `frontend/lib/api/client.ts` - Add agent API calls

### Backend (Already exists!)
- `infrastructure/lambda/agents/info-agent.ts` ✓
- `infrastructure/lambda/agents/scenario-agent.ts` ✓
- `infrastructure/lambda/agents/strategy-agent.ts` ✓
- `infrastructure/lambda/agents/impact-agent.ts` ✓

## Status
🚧 IN PROGRESS - Starting implementation now
