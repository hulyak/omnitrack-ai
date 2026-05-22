# OmniTrack AI - Navigation Guide

## Page Structure & Purpose

OmniTrack AI has a comprehensive set of pages organized into three categories:

### 🎯 Core Pages

**1. Home (`/`)**
- **Purpose:** Landing page with product overview
- **For:** New visitors and marketing
- **Key Features:** Hero section, feature showcase, demo access

**2. Dashboard (`/dashboard`)**
- **Purpose:** Main control center for supply chain monitoring
- **For:** Daily operations and real-time monitoring
- **Key Features:**
  - Real-time supply chain network visualization
  - AI agent controls (Info, Scenario, Strategy, Impact)
  - Supply chain configuration
  - Active alerts and metrics
  - AI Copilot chat interface

### 📊 Analysis & Insights Pages

**3. Scenarios (`/scenarios`)**
- **Purpose:** Run "what-if" simulations to test disruption scenarios
- **For:** Risk assessment and contingency planning
- **Key Features:**
  - Scenario parameter configuration
  - AI-powered simulation execution
  - Impact analysis (cost, delivery, inventory)
  - Mitigation strategy recommendations
  - Decision tree visualization
- **Why Needed:** Helps teams prepare for potential disruptions before they happen

**4. AI Explainability (`/explainability`)**
- **Purpose:** Understand how AI agents make decisions
- **For:** Building trust and transparency in AI recommendations
- **Key Features:**
  - Natural language summaries
  - Interactive decision trees
  - Agent contribution breakdown
  - Confidence indicators
  - Uncertainty analysis
- **Why Needed:** Critical for enterprise adoption - users need to understand and trust AI decisions

**5. Sustainability (`/sustainability`)**
- **Purpose:** Track environmental impact and carbon footprint
- **For:** ESG reporting and green supply chain initiatives
- **Key Features:**
  - Carbon footprint tracking by route
  - Emissions trends over time
  - Strategy comparison for environmental impact
  - Sustainability score and rating
  - Threshold alerts for emissions
- **Why Needed:** Growing regulatory requirements and corporate sustainability goals

### 🚀 Advanced Features

**6. Voice Assistant (`/voice`)**
- **Purpose:** Hands-free interaction with the system
- **For:** Mobile users, warehouse managers, executives on-the-go
- **Key Features:**
  - Voice command recognition
  - Text input fallback
  - Audio responses
  - Command history
  - Natural language processing
- **Why Needed:** Enables interaction while multitasking or in hands-busy environments

**7. AR Visualization (`/ar`)**
- **Purpose:** Immersive 3D visualization of supply chain digital twin
- **For:** Executive presentations, training, and spatial understanding
- **Key Features:**
  - 3D supply chain network
  - Real-time node status
  - Route visualization
  - Disruption overlays
  - Interactive exploration
- **Why Needed:** Provides intuitive spatial understanding of complex global networks

## Navigation Implementation

### Desktop Navigation
- **Top 5 pages** shown directly in header
- **"More" dropdown** for advanced features
- **Hover tooltips** show page descriptions
- **Active state** highlights current page

### Mobile Navigation
- **Hamburger menu** opens full navigation drawer
- **Categorized sections:**
  - Core (Home, Dashboard)
  - Analysis & Insights (Scenarios, Explainability, Sustainability)
  - Advanced Features (Voice, AR)
- **Feature explanations** included in mobile menu

## User Journey

### New User
1. **Home** → Learn about OmniTrack AI
2. **Dashboard** → See demo or configure supply chain
3. **Scenarios** → Run first simulation
4. **AI Explainability** → Understand the results

### Daily Operations User
1. **Dashboard** → Monitor real-time status
2. **Scenarios** → Test response to new risks
3. **Sustainability** → Check environmental metrics

### Executive User
1. **Dashboard** → Quick overview
2. **AR Visualization** → Present to stakeholders
3. **Voice Assistant** → Quick queries on mobile

## Why So Many Pages?

Each page serves a distinct purpose in the supply chain management workflow:

1. **Dashboard** = Real-time monitoring (reactive)
2. **Scenarios** = Risk planning (proactive)
3. **AI Explainability** = Trust & transparency (governance)
4. **Sustainability** = ESG compliance (regulatory)
5. **Voice** = Accessibility (usability)
6. **AR** = Visualization (communication)

This separation:
- ✅ Prevents information overload
- ✅ Allows focused workflows
- ✅ Enables role-based access
- ✅ Supports different use cases
- ✅ Improves performance (code splitting)

## Design Consistency

All pages now share:
- **Dark theme:** `from-slate-950 via-purple-950 to-slate-900`
- **Purple/blue accents:** Brand colors throughout
- **Consistent navigation:** Same header structure
- **Unified typography:** White headings, slate-300/400 body text
- **Matching components:** Cards, buttons, inputs all styled consistently

## Future Enhancements

Potential additions:
- **Analytics Dashboard** (`/analytics`) - Usage metrics and KPIs
- **Marketplace** (`/marketplace`) - Share/discover scenarios
- **Settings** (`/settings`) - User preferences and configuration
- **Reports** (`/reports`) - Generate PDF/Excel reports
- **Team** (`/team`) - Collaboration and permissions

## Quick Reference

| Page | URL | Primary Use Case | User Type |
|------|-----|------------------|-----------|
| Home | `/` | Marketing | Prospects |
| Dashboard | `/dashboard` | Daily monitoring | All users |
| Scenarios | `/scenarios` | Risk planning | Analysts |
| AI Explainability | `/explainability` | Understanding AI | Managers |
| Sustainability | `/sustainability` | ESG reporting | Compliance |
| Voice | `/voice` | Mobile access | Field users |
| AR | `/ar` | Presentations | Executives |

