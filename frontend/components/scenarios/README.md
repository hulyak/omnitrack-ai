# Scenario Simulator Components

This directory contains the components for the Scenario Simulator feature, which allows users to simulate supply chain disruptions and analyze potential impacts.

## Components

### ScenarioSimulator

Main container component that orchestrates the simulation workflow.

- **Location**: `scenario-simulator.tsx`
- **Purpose**: Manages the overall state and flow between parameter input, progress tracking, and results display

### ScenarioParameterForm

Form component for configuring simulation parameters.

- **Location**: `scenario-parameter-form.tsx`
- **Features**:
  - Disruption type selection (8 types: supplier failure, transportation delay, natural disaster, etc.)
  - Location input with validation
  - Severity level selection (LOW, MEDIUM, HIGH, CRITICAL)
  - Optional duration configuration (1-365 days)
  - Sustainability impact toggle
  - Scenario variation request
- **Validation**: Required location, duration range checks

### SimulationProgress

Progress indicator component that polls for simulation status.

- **Location**: `simulation-progress.tsx`
- **Features**:
  - Real-time progress bar with shimmer animation
  - Agent execution status tracking (Info, Scenario, Impact, Strategy agents)
  - Elapsed time counter
  - Automatic completion detection

### SimulationResults

Results display component with multiple views.

- **Location**: `simulation-results.tsx`
- **Features**:
  - Tabbed interface (Overview, Impact Analysis, Strategies, Decision Tree)
  - Executive summary with key metrics
  - Detailed cost, delivery, inventory, and sustainability impacts
  - Ranked mitigation strategies with confidence scores
  - Decision tree visualization integration

### DecisionTreeVisualization

D3.js-based visualization of AI reasoning.

- **Location**: `decision-tree-visualization.tsx`
- **Features**:
  - Interactive tree layout
  - Color-coded confidence levels
  - Agent attribution labels
  - Responsive SVG rendering

## Usage

```tsx
import { ScenarioSimulator } from '@/components/scenarios/scenario-simulator';

export default function ScenariosPage() {
  return (
    <ProtectedRoute>
      <ScenarioSimulator />
    </ProtectedRoute>
  );
}
```

## API Integration

The components integrate with the following API endpoints:

- `POST /scenarios/simulate` - Start a new simulation
- `GET /scenarios/{id}/results` - Poll for simulation results

## Testing

Unit tests are located in `frontend/__tests__/scenarios/`:

- `scenario-parameter-form.test.tsx` - Form validation and submission tests

Run tests with:

```bash
npm test -- __tests__/scenarios/
```

## Requirements Validated

This implementation satisfies the following requirements:

- **2.1**: Simulation completes within 60 seconds
- **2.2**: Results include cost, delivery time, and inventory impacts
- **2.3**: Decision trees show reasoning behind predictions
- **2.4**: Scenario variations can be requested
- **2.5**: Sustainability impact calculations included when requested
