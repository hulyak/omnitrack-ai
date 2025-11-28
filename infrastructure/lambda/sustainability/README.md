# Sustainability Service

The Sustainability Service calculates environmental impact metrics for supply chain configurations, including carbon footprint, environmental KPIs, and sustainability scores.

## Features

- **Environmental Metric Calculation**: Calculates comprehensive carbon footprint metrics for any supply chain configuration
- **Reactive Recalculation**: Recalculates environmental impact within 10 seconds when routes or suppliers change
- **Strategy Comparison**: Compares environmental KPIs, cost metrics, and risk metrics across multiple mitigation strategies
- **Historical Trend Analysis**: Provides trend analysis of environmental metrics over configurable time periods (up to 90 days)

## API Endpoints

### Calculate Metrics
`POST /sustainability/metrics`

Calculates environmental metrics for a supply chain configuration.

**Request Body:**
```json
{
  "configuration": {
    "nodes": ["node-id-1", "node-id-2"],
    "routes": [
      {
        "routeId": "route-1",
        "fromNodeId": "node-1",
        "toNodeId": "node-2",
        "distance": 500,
        "transportMode": "TRUCK",
        "volume": 10
      }
    ],
    "energySources": {
      "node-1": "RENEWABLE",
      "node-2": "NATURAL_GAS"
    }
  }
}
```

**Response:**
```json
{
  "carbonFootprint": 50000,
  "sustainabilityScore": 65,
  "environmentalKPIs": {
    "totalCarbonFootprint": 50000,
    "carbonIntensity": 10.5,
    "renewableEnergyPercentage": 40,
    "emissionsByCategory": {
      "transportation": 20000,
      "manufacturing": 15000,
      "warehousing": 5000,
      "energy": 10000
    },
    "emissionsByRoute": {
      "route-1": 20000
    }
  },
  "metadata": {
    "correlationId": "...",
    "executionTime": 150,
    "calculatedAt": "2025-11-27T14:00:00.000Z"
  }
}
```

### Recalculate on Change
`POST /sustainability/recalculate`

Reactively recalculates environmental impact when routes or suppliers change.

**Request Body:**
```json
{
  "configurationId": "config-123",
  "changes": {
    "addedRoutes": [...],
    "removedRoutes": ["route-1"],
    "modifiedNodes": ["node-1"]
  }
}
```

### Compare Strategies
`POST /sustainability/compare`

Compares environmental KPIs across multiple mitigation strategies.

**Request Body:**
```json
{
  "strategies": [
    {
      "strategyId": "strategy-1",
      "strategyName": "Air Freight",
      "configuration": {...}
    },
    {
      "strategyId": "strategy-2",
      "strategyName": "Sea Freight",
      "configuration": {...}
    }
  ]
}
```

**Response:**
```json
{
  "comparisons": [
    {
      "strategyId": "strategy-1",
      "strategyName": "Air Freight",
      "environmentalKPIs": {...},
      "costMetrics": {
        "totalCost": 50000,
        "costPerUnit": 500
      },
      "riskMetrics": {
        "riskScore": 30,
        "vulnerabilityCount": 2
      }
    }
  ]
}
```

### Get Historical Trends
`GET /sustainability/trends?configurationId=config-123&startDate=2025-09-01&endDate=2025-11-27`

Retrieves historical trend analysis of environmental metrics.

**Response:**
```json
{
  "configurationId": "config-123",
  "startDate": "2025-09-01",
  "endDate": "2025-11-27",
  "trends": [
    {
      "timestamp": "2025-09-01T00:00:00.000Z",
      "carbonFootprint": 48000,
      "sustainabilityScore": 67
    }
  ],
  "summary": {
    "averageCarbonFootprint": 50000,
    "averageSustainabilityScore": 65,
    "trend": "improving"
  }
}
```

## Emission Factors

The service uses industry-standard emission factors:

### Transportation (kg CO2 per ton-km)
- Truck: 0.062
- Rail: 0.022
- Ship: 0.008
- Air: 0.602

### Energy Sources (kg CO2 per kWh)
- Coal: 0.95
- Natural Gas: 0.45
- Renewable: 0.02

### Manufacturing (kg CO2 per unit)
- Light Manufacturing: 50
- Heavy Manufacturing: 200
- Assembly: 30

### Warehouse Operations (kg CO2 per day per 1000 sqm)
- Warehouse Operations: 15

## Sustainability Score Calculation

The sustainability score (0-100) is calculated using:
- 70% weight on carbon footprint (normalized against max of 100,000 kg CO2)
- 30% weight on renewable energy percentage

Higher scores indicate better sustainability performance.

## Requirements Validated

- **Requirement 3.1**: Environmental metric calculation for any supply chain configuration
- **Requirement 3.2**: Reactive recalculation within 10 seconds
- **Requirement 3.3**: Strategy comparison with environmental, cost, and risk metrics
- **Requirement 3.5**: Historical trend availability for up to 90 days

## Property-Based Tests

The service includes comprehensive property-based tests that verify:

1. **Property 10**: Environmental metrics are calculated and returned for any valid configuration
2. **Property 11**: Recalculation completes within 10 seconds for any configuration change
3. **Property 12**: Strategy comparisons include all three metric types (environmental, cost, risk)
4. **Property 13**: Historical trends are available for any valid date range up to 90 days

All tests run 100 iterations with randomized inputs to ensure correctness across a wide range of scenarios.
