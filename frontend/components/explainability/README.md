# Explainability Components

This directory contains components for explaining AI decision-making processes in the OmniTrack AI platform.

## Components

### ExplainabilityPanel

The main container component that provides a tabbed interface for exploring AI explanations.

**Features:**

- Natural language summary of AI reasoning
- Interactive decision tree visualization
- Agent contribution breakdown
- Uncertainty analysis

**Usage:**

```tsx
import { ExplainabilityPanel } from '@/components/explainability';

<ExplainabilityPanel data={explainabilityData} />;
```

### DecisionTreeVisualization

An interactive D3.js-based visualization of the AI's decision-making process.

**Features:**

- Hierarchical tree layout
- Color-coded confidence levels
- Agent attribution badges
- Interactive node selection
- Hover tooltips with details
- Smooth animations

**Usage:**

```tsx
import { DecisionTreeVisualization } from '@/components/explainability';

<DecisionTreeVisualization
  tree={decisionTree}
  selectedNode={selectedNodeId}
  onNodeSelect={handleNodeSelect}
/>;
```

### NaturalLanguageSummary

Displays AI-generated explanations in plain language with technical term definitions.

**Features:**

- Formatted paragraphs
- Expandable/collapsible content
- Technical term highlighting
- Contextual definitions
- Confidence indicator

**Usage:**

```tsx
import { NaturalLanguageSummary } from '@/components/explainability';

<NaturalLanguageSummary summary={summaryText} confidence={0.85} technicalTerms={termDefinitions} />;
```

### ConfidenceIndicator

Visual indicators for confidence levels with multiple variants.

**Features:**

- Progress bar variant
- Circular variant
- Color-coded levels (High/Good/Medium/Low)
- Multiple sizes
- Optional labels

**Usage:**

```tsx
import { ConfidenceIndicator, CircularConfidenceIndicator } from '@/components/explainability';

<ConfidenceIndicator
  confidence={0.85}
  size="medium"
  showLabel
/>

<CircularConfidenceIndicator
  confidence={0.85}
  size={60}
/>
```

### AgentAttributionBadge

Displays which AI agent contributed to specific insights.

**Features:**

- Color-coded by agent type
- Agent-specific icons
- Confidence display
- Multiple sizes
- Card and list variants

**Usage:**

```tsx
import {
  AgentAttributionBadge,
  AgentAttributionCard,
  AgentAttributionList
} from '@/components/explainability';

<AgentAttributionBadge
  agentName="Impact Agent"
  confidence={0.92}
  size="medium"
/>

<AgentAttributionCard
  agentName="Strategy Agent"
  confidence={0.88}
  insights={['Insight 1', 'Insight 2']}
  dataSourcesUsed={['IoT Sensors', 'ERP System']}
/>

<AgentAttributionList
  agents={[
    { name: 'Info Agent', confidence: 0.95 },
    { name: 'Impact Agent', confidence: 0.88 }
  ]}
/>
```

## Data Types

See `frontend/types/explainability.ts` for complete type definitions.

### ExplainabilityData

```typescript
interface ExplainabilityData {
  summary: string;
  decisionTree: DecisionTreeNode;
  agentContributions: AgentContribution[];
  uncertaintyRanges: Record<string, UncertaintyRange>;
  overallConfidence: number;
  technicalTerms?: Record<string, string>;
  timestamp: string;
}
```

### DecisionTreeNode

```typescript
interface DecisionTreeNode {
  id: string;
  label: string;
  value?: string | number;
  description?: string;
  children?: DecisionTreeNode[];
  confidence?: number;
  agent?: string;
}
```

### AgentContribution

```typescript
interface AgentContribution {
  agentId: string;
  agentName: string;
  role: string;
  confidence: number;
  insights: string[];
  dataSourcesUsed?: string[];
}
```

## Design Principles

1. **Transparency**: Make AI decision-making processes visible and understandable
2. **Interactivity**: Allow users to explore reasoning paths at their own pace
3. **Clarity**: Use plain language and visual aids to explain complex concepts
4. **Confidence**: Always show uncertainty and confidence levels
5. **Attribution**: Clearly identify which AI agents contributed to each insight

## Requirements Validation

These components satisfy the following requirements from the design document:

- **Requirement 6.1**: Natural language summaries explaining key findings
- **Requirement 6.2**: Decision tree visualizations showing reasoning paths
- **Requirement 6.3**: Agent attribution identifying component contributions
- **Requirement 6.4**: Uncertainty ranges and confidence indicators

## Accessibility

All components follow accessibility best practices:

- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly

## Performance

- D3.js visualizations are optimized for smooth rendering
- Large decision trees are handled efficiently
- Animations use CSS transforms for GPU acceleration
- Components use React hooks for optimal re-rendering
