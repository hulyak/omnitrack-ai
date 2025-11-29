# Scenarios & Explainability - Visual Guide 🎨

## 🎯 Page Previews

### Scenarios Page (`/scenarios`)

```
┌─────────────────────────────────────────────────────────────┐
│  Scenario Simulation                                        │
│  Model supply chain disruptions and test mitigation         │
│  strategies                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ Simulation Parameters│  │ Simulation Status     │        │
│  │                      │  │                       │        │
│  │ Scenario Type:       │  │ ⏳ Running...         │        │
│  │ [Supplier Disruption]│  │                       │        │
│  │                      │  │ Progress: 67%         │        │
│  │ Severity: ● High     │  │                       │        │
│  │                      │  │ Analyzing impact...   │        │
│  │ Duration: 30 days    │  │                       │        │
│  │ ├────────────────┤   │  │                       │        │
│  │                      │  │                       │        │
│  │ Affected Nodes:      │  │                       │        │
│  │ ☑ Shanghai Hub       │  │                       │        │
│  │ ☑ Singapore Port     │  │                       │        │
│  │ ☐ Los Angeles        │  │                       │        │
│  │                      │  │                       │        │
│  │ [Run Simulation]     │  │                       │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Detailed Results                                      │  │
│  │                                                        │  │
│  │  Overall Impact: 65% 🔴                               │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Revenue  │  │ Delivery │  │ Customer │           │  │
│  │  │ Impact   │  │ Delay    │  │ Satisf.  │           │  │
│  │  │ $2.5M    │  │ 7 days   │  │ 72%      │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  │                                                        │  │
│  │  Event Timeline:                                      │  │
│  │  Day 0  ━━ Disruption begins                         │  │
│  │  Day 6  ━━ Impact escalation                         │  │
│  │  Day 12 ━━ Mitigation activated                      │  │
│  │  Day 21 ━━ Recovery begins                           │  │
│  │  Day 30 ━━ Full recovery                             │  │
│  │                                                        │  │
│  │  Mitigation Strategies:                               │  │
│  │  1. Alternative Supplier (88% effective) $150K       │  │
│  │  2. Inventory Buffer (75% effective) $80K            │  │
│  │  3. Route Optimization (65% effective) $45K          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Explainability Page (`/explainability`)

```
┌─────────────────────────────────────────────────────────────┐
│  AI Explainability Demo                                     │
│  Explore how the AI reached its recommendations             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Scenario Context                                      │  │
│  │ Disruption: Weather Event | Location: Taiwan         │  │
│  │ Severity: HIGH 🔴                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Natural Language Summary                              │  │
│  │                                                        │  │
│  │ The AI analysis indicates a HIGH risk disruption     │  │
│  │ scenario affecting your Southeast Asia supply chain.  │  │
│  │ The primary concern is a potential 14-day delay in   │  │
│  │ semiconductor shipments from Taiwan...                │  │
│  │                                                        │  │
│  │ Confidence: 87% ████████▓░                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Decision Tree                                         │  │
│  │                                                        │  │
│  │         ┌─────────────────────┐                       │  │
│  │         │ Risk Assessment     │                       │  │
│  │         │ (87% confidence)    │                       │  │
│  │         └──────────┬──────────┘                       │  │
│  │                    │                                   │  │
│  │         ┌──────────┴──────────┐                       │  │
│  │         │                     │                       │  │
│  │    ┌────▼────┐          ┌────▼────┐                  │  │
│  │    │ Weather │          │ Alt.    │                  │  │
│  │    │ Pattern │          │ Sources │                  │  │
│  │    │ (92%)   │          │ (79%)   │                  │  │
│  │    └────┬────┘          └────┬────┘                  │  │
│  │         │                     │                       │  │
│  │    ┌────▼────┐          ┌────▼────┐                  │  │
│  │    │ Impact  │          │ Strategy│                  │  │
│  │    │ (85%)   │          │ (88%)   │                  │  │
│  │    └─────────┘          └─────────┘                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Agent Contributions                                   │  │
│  │                                                        │  │
│  │ 🤖 Info Agent (92%)                                   │  │
│  │    • Identified weather pattern anomalies             │  │
│  │    • Correlated historical typhoon data               │  │
│  │                                                        │  │
│  │ 🎯 Scenario Agent (85%)                               │  │
│  │    • Generated 12 alternative scenarios               │  │
│  │    • Modeled cascading effects                        │  │
│  │                                                        │  │
│  │ 💰 Impact Agent (83%)                                 │  │
│  │    • Calculated $5M financial impact                  │  │
│  │    • Predicted 14-day delivery delays                 │  │
│  │                                                        │  │
│  │ 🎲 Strategy Agent (88%)                               │  │
│  │    • Evaluated 8 mitigation strategies                │  │
│  │    • Recommended hybrid approach                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Feature Importance                                    │  │
│  │                                                        │  │
│  │ Temperature Deviation    ████████████░░░░  35%       │  │
│  │ Historical Patterns      ██████████░░░░░░  28%       │  │
│  │ Sensor Reliability       ████████░░░░░░░░  22%       │  │
│  │ Time of Day              █████░░░░░░░░░░░  15%       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Uncertainty Ranges                                    │  │
│  │                                                        │  │
│  │ Cost Impact:                                          │  │
│  │ Best: $3.2M  Expected: $5.0M  Worst: $7.8M          │  │
│  │ ├──────────────┼──────────────────┤                  │  │
│  │                                                        │  │
│  │ Delivery Delay:                                       │  │
│  │ Best: 7 days  Expected: 14 days  Worst: 21 days     │  │
│  │ ├──────────────┼──────────────────┤                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 UI Components

### Scenarios Page Components

```
ScenarioParameterForm
├── Scenario Type Dropdown (6 options)
├── Severity Selector (Low/Medium/High)
├── Duration Slider (1-90 days)
├── Node Checkboxes (5 locations)
├── Notes Textarea
└── Submit Button

SimulationProgress
├── Progress Bar
├── Status Message
└── Loading Animation

SimulationResults
├── Impact Score Badge
├── Metrics Cards (3)
│   ├── Revenue Impact
│   ├── Delivery Delay
│   └── Customer Satisfaction
├── Timeline Visualization
└── Mitigation Strategies List
```

### Explainability Page Components

```
ExplainabilityPanel
├── Natural Language Summary
│   ├── Summary Text
│   └── Confidence Bar
├── Decision Tree Visualization
│   ├── Root Node
│   ├── Branch Nodes
│   └── Leaf Nodes
├── Agent Contributions
│   ├── Agent Cards (4)
│   │   ├── Agent Name & Role
│   │   ├── Confidence Score
│   │   ├── Key Insights
│   │   └── Data Sources
├── Feature Importance
│   └── Horizontal Bar Chart
└── Uncertainty Ranges
    └── Range Sliders
```

## 🎯 User Flow

### Scenarios Page Flow

```
1. User arrives at /scenarios
   ↓
2. Sees parameter form
   ↓
3. Selects scenario type
   ↓
4. Configures parameters
   ↓
5. Clicks "Run Simulation"
   ↓
6. Sees progress animation
   ↓
7. Views results
   ↓
8. Explores mitigation strategies
   ↓
9. Can run another simulation
```

### Explainability Page Flow

```
1. User arrives at /explainability
   ↓
2. Sees scenario context
   ↓
3. Reads natural language summary
   ↓
4. Explores decision tree
   ↓
5. Reviews agent contributions
   ↓
6. Checks feature importance
   ↓
7. Examines uncertainty ranges
   ↓
8. Understands AI reasoning
```

## 📊 Data Flow

### Scenarios API Flow

```
Frontend                API Route              Demo Data
   │                       │                       │
   │──── POST request ────>│                       │
   │   (parameters)        │                       │
   │                       │──── generate() ──────>│
   │                       │                       │
   │                       │<──── results ─────────│
   │<──── response ────────│                       │
   │   (simulation)        │                       │
   │                       │                       │
   └─── display results    │                       │
```

### Explainability API Flow

```
Frontend                API Route              Demo Data
   │                       │                       │
   │──── POST request ────>│                       │
   │   (agent decision)    │                       │
   │                       │──── analyze() ───────>│
   │                       │                       │
   │                       │<──── analysis ────────│
   │<──── response ────────│                       │
   │   (explainability)    │                       │
   │                       │                       │
   └─── display analysis   │                       │
```

## 🎨 Color Scheme

### Impact Levels
```
Low Impact:     🟢 Green   (#10B981)
Medium Impact:  🟡 Yellow  (#F59E0B)
High Impact:    🔴 Red     (#EF4444)
Critical:       🔴 Red     (#DC2626)
```

### Confidence Scores
```
High (80-100%): 🟢 Green   (#10B981)
Medium (60-79%): 🟡 Yellow (#F59E0B)
Low (0-59%):    🔴 Red     (#EF4444)
```

### Agent Types
```
Info Agent:     🔵 Blue    (#3B82F6)
Scenario Agent: 🟣 Purple  (#8B5CF6)
Impact Agent:   🟠 Orange  (#F97316)
Strategy Agent: 🟢 Green   (#10B981)
```

## 🎯 Key Features Highlighted

### Scenarios Page
```
✨ Dynamic Calculations
   └─ Impact scales with severity × duration

✨ Realistic Timelines
   └─ 5-phase event progression

✨ Actionable Strategies
   └─ Cost/benefit analysis for each

✨ Confidence Indicators
   └─ Shows prediction reliability
```

### Explainability Page
```
✨ Transparent AI
   └─ See exactly how decisions are made

✨ Interactive Trees
   └─ Click to explore decision paths

✨ Agent Attribution
   └─ Know which agent did what

✨ Uncertainty Ranges
   └─ Understand prediction confidence
```

## 📱 Responsive Design

Both pages are fully responsive:

```
Desktop (1024px+)
├── Two-column layout
├── Side-by-side cards
└── Full visualizations

Tablet (768-1023px)
├── Single column
├── Stacked cards
└── Compact visualizations

Mobile (< 768px)
├── Single column
├── Stacked cards
└── Mobile-optimized controls
```

---

**Visual Guide Complete** ✅

For implementation details, see:
- `SCENARIOS_EXPLAINABILITY_COMPLETE.md`
- `SCENARIOS_EXPLAINABILITY_QUICK_START.md`
