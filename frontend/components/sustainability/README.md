# Sustainability Dashboard Components

This directory contains the components for the Sustainability Dashboard feature of OmniTrack AI.

## Overview

The Sustainability Dashboard provides comprehensive environmental impact tracking and analysis for supply chain operations, including:

- Real-time carbon footprint metrics
- Route-based emissions visualization
- Historical trend analysis
- Strategy comparison with environmental KPIs
- Threshold alert indicators

## Components

### SustainabilityDashboard

Main container component that orchestrates all sustainability-related displays.

**Props:**
- `data?: SustainabilityData` - Sustainability metrics and analysis data
- `isLoading?: boolean` - Loading state indicator
- `error?: Error` - Error state
- `onRefresh?: () => void` - Callback for refreshing data

**Features:**
- Time period selection (7d, 30d, 90d)
- Automatic data refresh
- Responsive layout
- Loading and error states

### EnvironmentalMetricsDisplay

Displays key environmental metrics in a card-based layout.

**Props:**
- `metrics: EnvironmentalMetrics` - Environmental metrics data

**Displays:**
- Carbon footprint (kg CO₂)
- Total emissions
- Emissions per unit
- Sustainability score with rating

### CarbonFootprintVisualization

Visualizes carbon emissions by route using pie and bar charts.

**Props:**
- `metrics: EnvironmentalMetrics` - Overall metrics
- `routeEmissions: RouteEmission[]` - Route-specific emission data

**Features:**
- Pie chart showing emissions distribution
- Bar chart showing top 10 routes by emissions
- Color-coded by transport mode (AIR, SEA, RAIL, ROAD)
- Interactive tooltips

### TrendAnalysisCharts

Displays historical trends for environmental metrics.

**Props:**
- `trends: TrendDataPoint[]` - Historical data points
- `timePeriod: '7d' | '30d' | '90d'` - Selected time period

**Charts:**
- Carbon footprint over time (area chart)
- Sustainability score over time (line chart)
- Total emissions over time (line chart)

### StrategyComparisonView

Compares mitigation strategies across environmental, cost, and risk dimensions.

**Props:**
- `strategies: StrategyComparison[]` - Strategy comparison data

**Features:**
- Strategy cards with detailed metrics
- Bar chart comparing environmental KPIs
- Radar chart for multi-dimensional comparison
- Color-coded risk levels

### ThresholdAlertIndicators

Displays alerts when environmental thresholds are exceeded.

**Props:**
- `alerts: ThresholdAlert[]` - Threshold alert data

**Features:**
- Severity-based color coding
- Expandable alert details
- Recommended actions
- Percentage exceeded calculation

## Requirements Mapping

This implementation addresses the following requirements:

- **Requirement 3.1**: Display carbon footprint metrics for current supply chain configuration
- **Requirement 3.2**: Recalculate environmental impact when routes/suppliers change
- **Requirement 3.3**: Present environmental KPIs alongside cost and risk metrics
- **Requirement 3.4**: Generate alerts when sustainability thresholds are exceeded
- **Requirement 3.5**: Provide trend analysis of environmental metrics over configurable time periods

## Technology Stack

- **React 19**: Component framework
- **Recharts**: Charting library for data visualization
- **TailwindCSS**: Styling
- **TypeScript**: Type safety

## Usage Example

```tsx
import { SustainabilityDashboard } from '@/components/sustainability';
import type { SustainabilityData } from '@/types/sustainability';

function MyPage() {
  const [data, setData] = useState<SustainabilityData>();
  
  return (
    <SustainabilityDashboard
      data={data}
      isLoading={false}
      onRefresh={() => fetchData()}
    />
  );
}
```

## Data Integration

The components expect data in the following format:

```typescript
interface SustainabilityData {
  metrics: EnvironmentalMetrics;
  trends: TrendDataPoint[];
  strategyComparisons: StrategyComparison[];
  thresholdAlerts: ThresholdAlert[];
  lastUpdated: string;
}
```

See `frontend/types/sustainability.ts` for complete type definitions.

## Styling

Components use TailwindCSS with dark mode support. Color schemes:

- **Success/Good**: Green (#10b981)
- **Info**: Blue (#3b82f6)
- **Warning/Fair**: Yellow/Orange (#f59e0b)
- **Error/Poor**: Red (#ef4444)

Transport mode colors:
- **AIR**: Red (#ef4444)
- **SEA**: Blue (#3b82f6)
- **RAIL**: Green (#10b981)
- **ROAD**: Orange (#f59e0b)

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly tooltips

## Performance Considerations

- Memoized chart data transformations
- Lazy loading of chart components
- Optimized re-renders with React.memo
- Efficient data filtering for time periods
