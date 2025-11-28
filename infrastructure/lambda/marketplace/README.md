# Marketplace Service

The Marketplace Service enables users to publish, discover, rate, and fork supply chain disruption scenarios within a community marketplace.

## Features

- **Scenario Publishing**: Publish private scenarios to the public marketplace with metadata
- **Search & Discovery**: Search scenarios by industry, disruption type, geography, rating, and tags
- **Rating System**: Rate scenarios and view aggregate ratings
- **Scenario Forking**: Customize marketplace scenarios while preserving attribution
- **Usage Tracking**: Track scenario usage counts

## API Endpoints

### Publish Scenario
```
POST /marketplace/scenarios
```

Request body:
```json
{
  "scenarioId": "uuid",
  "title": "Supply Chain Disruption in Southeast Asia",
  "description": "Simulates a major port closure scenario",
  "tags": ["transportation", "port-closure", "asia"],
  "industry": "Manufacturing",
  "geography": "Southeast Asia"
}
```

### List Marketplace Scenarios
```
GET /marketplace/scenarios
```

### Get Marketplace Scenario
```
GET /marketplace/scenarios/{id}
```

### Search Scenarios
```
GET /marketplace/scenarios/search?industry=Manufacturing&minRating=4.0&tags=transportation
```

Query parameters:
- `industry`: Filter by industry
- `disruptionType`: Filter by disruption type
- `geography`: Filter by geography
- `minRating`: Minimum rating (0-5)
- `tags`: Comma-separated list of tags

### Rate Scenario
```
PUT /marketplace/scenarios/{id}/rating
```

Request body:
```json
{
  "rating": 5,
  "review": "Very realistic scenario with accurate impact predictions"
}
```

### Fork Scenario
```
POST /marketplace/scenarios/{id}/fork
```

Request body (optional):
```json
{
  "modifications": {
    "parameters": {
      "severity": "HIGH"
    }
  }
}
```

## Data Model

### Marketplace Metadata
```typescript
interface MarketplaceMetadata {
  title: string;
  description: string;
  author: string;
  rating: number;
  usageCount: number;
  tags: string[];
  industry: string;
  geography: string;
  originalAuthor?: string; // For forked scenarios
}
```

## Validation Rules

- Title, description, industry, and geography are required
- At least one tag is required
- Ratings must be between 1 and 5
- Only public scenarios can be accessed in the marketplace
- Forked scenarios preserve attribution to original author

## Requirements Validation

This service validates the following requirements:

- **5.1**: Marketplace listings include rating, usage count, and community feedback
- **5.2**: Search filters by industry, disruption type, geography, and rating
- **5.3**: Each published scenario receives a unique identifier
- **5.4**: Rating aggregation updates within 5 seconds
- **5.5**: Forked scenarios preserve attribution to original author
