# Explainability Component Architecture

## Component Hierarchy

```
ExplainabilityPanel (Main Container)
│
├── Header
│   ├── Title & Description
│   └── ConfidenceIndicator (Overall confidence)
│
├── Tab Navigation
│   ├── Summary Tab
│   ├── Decision Tree Tab
│   ├── Agent Contributions Tab
│   └── Uncertainty Analysis Tab
│
└── Tab Content
    │
    ├── Summary Tab
    │   ├── NaturalLanguageSummary
    │   │   ├── Formatted paragraphs
    │   │   ├── Technical term highlighting
    │   │   └── ConfidenceIndicator
    │   │
    │   └── AgentAttributionList
    │       └── Multiple AgentAttributionBadge components
    │
    ├── Decision Tree Tab
    │   ├── Instructions panel
    │   ├── DecisionTreeVisualization (D3.js)
    │   │   ├── Tree nodes with confidence colors
    │   │   ├── Agent attribution badges
    │   │   ├── Interactive tooltips
    │   │   └── Node selection
    │   │
    │   └── Node details panel (when selected)
    │
    ├── Agent Contributions Tab
    │   └── Multiple AgentAttributionCard components
    │       ├── Agent icon & name
    │       ├── ConfidenceIndicator
    │       ├── Key insights list
    │       └── Data sources used
    │
    └── Uncertainty Analysis Tab
        └── Multiple uncertainty range cards
            ├── Metric name
            ├── ConfidenceIndicator
            ├── Best/Expected/Worst case values
            ├── Visual range indicator
            └── Assumptions text
```

## Data Flow

```
Backend API
    │
    ├─→ ExplainabilityData
    │       │
    │       ├─→ summary (string)
    │       │       └─→ NaturalLanguageSummary
    │       │
    │       ├─→ decisionTree (DecisionTreeNode)
    │       │       └─→ DecisionTreeVisualization
    │       │
    │       ├─→ agentContributions (AgentContribution[])
    │       │       └─→ AgentAttributionCard
    │       │
    │       ├─→ uncertaintyRanges (Record<string, UncertaintyRange>)
    │       │       └─→ Uncertainty cards
    │       │
    │       └─→ overallConfidence (number)
    │               └─→ ConfidenceIndicator
    │
    └─→ ExplainabilityPanel
            └─→ Renders all sub-components
```

## Component Responsibilities

### ExplainabilityPanel
**Purpose:** Main orchestrator component
**Responsibilities:**
- Manages tab state
- Distributes data to child components
- Provides consistent layout
- Handles node selection state

### DecisionTreeVisualization
**Purpose:** Visual representation of AI reasoning
**Responsibilities:**
- Renders D3.js tree visualization
- Handles node interactions (hover, click)
- Displays tooltips
- Manages animations
- Shows confidence colors and agent badges

### NaturalLanguageSummary
**Purpose:** Human-readable explanation
**Responsibilities:**
- Formats and displays summary text
- Highlights technical terms
- Shows term definitions
- Manages expand/collapse state
- Integrates confidence indicator

### ConfidenceIndicator
**Purpose:** Visual confidence display
**Responsibilities:**
- Renders progress bar or circular indicator
- Color-codes confidence levels
- Displays percentage and label
- Supports multiple sizes

### AgentAttributionBadge
**Purpose:** Agent identification
**Responsibilities:**
- Displays agent name and icon
- Shows agent-specific colors
- Optionally displays confidence
- Provides detailed card variant
- Supports list variant

## Interaction Patterns

### 1. Tab Navigation
```
User clicks tab → State updates → Content switches → Smooth transition
```

### 2. Decision Tree Exploration
```
User hovers node → Tooltip appears → Shows node details
User clicks node → Node selected → Details panel updates
```

### 3. Technical Term Definition
```
User clicks term → Definition panel appears → Shows explanation
User clicks close → Panel disappears
```

### 4. Summary Expansion
```
User clicks "Show more" → Full content displays
User clicks "Show less" → Content collapses
```

## Styling Approach

### Color Scheme
- **High Confidence:** Green (#10b981)
- **Good Confidence:** Blue (#3b82f6)
- **Medium Confidence:** Orange (#f59e0b)
- **Low Confidence:** Red (#ef4444)

### Agent Colors
- **Info Agent:** Purple (#8b5cf6)
- **Scenario Agent:** Pink (#ec4899)
- **Impact Agent:** Orange (#f59e0b)
- **Strategy Agent:** Green (#10b981)
- **Learning Module:** Blue (#3b82f6)
- **Sustainability Service:** Emerald (#10b981)

### Typography
- **Headers:** font-semibold, text-gray-900
- **Body:** text-gray-700
- **Labels:** text-sm, text-gray-600
- **Values:** font-semibold, text-gray-900

### Spacing
- **Component padding:** p-6
- **Section spacing:** space-y-6
- **Element spacing:** space-y-4
- **Inline spacing:** space-x-2

## Responsive Design

### Breakpoints
- **Mobile:** < 768px (single column)
- **Tablet:** 768px - 1024px (2 columns)
- **Desktop:** > 1024px (3 columns)

### Adaptations
- Tab navigation scrolls horizontally on mobile
- Decision tree scales to container width
- Grid layouts collapse to single column
- Font sizes adjust for readability

## Accessibility Features

### Keyboard Navigation
- Tab through interactive elements
- Enter/Space to activate buttons
- Arrow keys for tree navigation

### Screen Readers
- Semantic HTML structure
- ARIA labels on interactive elements
- Alt text for visual indicators
- Descriptive button labels

### Visual Accessibility
- High contrast colors
- Clear focus indicators
- Sufficient font sizes
- Color + text for information

## Performance Optimizations

### D3.js Visualization
- Efficient tree layout algorithm
- Smooth CSS transitions
- GPU-accelerated animations
- Debounced resize handlers

### React Rendering
- useState for local state
- useRef for DOM references
- useEffect for D3 updates
- Memoization where beneficial

### Data Handling
- Efficient data structures
- Minimal re-renders
- Lazy loading for large trees
- Virtualization for long lists

## Integration Example

```typescript
import { ExplainabilityPanel } from '@/components/explainability';
import type { ExplainabilityData } from '@/types/explainability';

function ScenarioResultsPage() {
  const [explanationData, setExplanationData] = useState<ExplainabilityData | null>(null);

  useEffect(() => {
    // Fetch explanation data from API
    fetch(`/api/scenarios/${scenarioId}/explanation`)
      .then(res => res.json())
      .then(data => setExplanationData(data));
  }, [scenarioId]);

  if (!explanationData) return <Loading />;

  return (
    <div>
      <h1>Scenario Results</h1>
      <ExplainabilityPanel data={explanationData} />
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
- Component rendering
- State management
- Event handlers
- Data formatting

### Integration Tests
- Tab switching
- Node selection
- Term definition display
- Data flow

### Visual Tests
- D3.js rendering
- Responsive layouts
- Color schemes
- Animations

## Future Enhancements

### Potential Additions
1. Export explanation as PDF
2. Share explanation link
3. Compare multiple explanations
4. Bookmark specific nodes
5. Annotation capabilities
6. Custom color themes
7. Accessibility mode toggle
8. Print-friendly view
