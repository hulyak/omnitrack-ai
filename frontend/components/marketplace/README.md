# Marketplace Components

This directory contains all components related to the Scenario Marketplace feature, which allows users to browse, search, rate, and fork supply chain disruption scenarios shared by the community.

## Components

### MarketplaceBrowser
Main component that displays the marketplace with search, filtering, and view mode controls.

**Features:**
- Grid and list view modes
- Real-time search across titles, descriptions, and tags
- Faceted filtering by industry, disruption type, geography, rating, and tags
- Responsive design for mobile and desktop

**Usage:**
```tsx
import { MarketplaceBrowser } from '@/components/marketplace';

<MarketplaceBrowser />
```

### ScenarioCard
Card component for displaying scenarios in grid view.

**Features:**
- Compact display of scenario metadata
- Star rating visualization
- Usage statistics
- Tag display with overflow handling
- Severity badge with color coding

### ScenarioListItem
List item component for displaying scenarios in list view.

**Features:**
- Expanded horizontal layout
- Full metadata display
- Better for detailed browsing

### ScenarioDetail
Detailed view of a single marketplace scenario.

**Features:**
- Complete scenario information display
- Rating and review submission
- Scenario forking with customization
- Attribution display for forked scenarios
- Location details with coordinates

### SearchBar
Search input component with clear functionality.

**Features:**
- Real-time search input
- Clear button when query is present
- Search icon indicator

### FilterPanel
Comprehensive filtering interface with faceted navigation.

**Features:**
- Industry filter dropdown
- Disruption type filter dropdown
- Geography filter dropdown
- Minimum rating filter
- Tag selection with toggle buttons
- Apply and reset actions

### StarRating
Reusable star rating component for display and interaction.

**Features:**
- Display mode for showing ratings
- Interactive mode for rating submission
- Three size variants (sm, md, lg)
- Visual feedback on hover (interactive mode)

**Usage:**
```tsx
// Display mode
<StarRating rating={4.5} size="md" />

// Interactive mode
<StarRating 
  rating={userRating} 
  size="lg" 
  interactive 
  onRate={(rating) => setUserRating(rating)} 
/>
```

### RatingForm
Modal form for submitting ratings and reviews.

**Features:**
- Interactive star rating selection
- Optional review text area
- Character count display
- Form validation
- Error handling
- Loading states

### ForkScenarioModal
Modal for forking and customizing scenarios.

**Features:**
- Parameter customization (severity, duration)
- Attribution preservation notice
- Original scenario information display
- Navigation to forked scenario after creation

## Data Flow

1. **Loading Scenarios**: `MarketplaceBrowser` fetches scenarios from `/marketplace/scenarios` API endpoint
2. **Filtering**: Client-side filtering applied based on user selections
3. **Rating**: `RatingForm` submits to `/marketplace/scenarios/{id}/rating` endpoint
4. **Forking**: `ForkScenarioModal` posts to `/marketplace/scenarios/{id}/fork` endpoint

## API Integration

All components use the centralized `apiClient` from `@/lib/api/client` for API calls.

### Endpoints Used:
- `GET /marketplace/scenarios` - List all marketplace scenarios
- `GET /marketplace/scenarios/{id}` - Get scenario details
- `PUT /marketplace/scenarios/{id}/rating` - Submit rating
- `POST /marketplace/scenarios/{id}/fork` - Fork scenario

## Styling

Components use Tailwind CSS for styling with a consistent design system:
- Primary color: Blue (blue-600)
- Severity colors: Red (critical), Orange (high), Yellow (medium), Green (low)
- Responsive breakpoints: sm, md, lg
- Hover states and transitions for interactive elements

## Requirements Validation

This implementation satisfies the following requirements:

- **5.1**: Marketplace listing with ratings, usage counts, and community feedback
- **5.2**: Search and filter by industry, disruption type, geography, and rating
- **5.3**: Scenario publishing with unique identifiers
- **5.4**: Rating system with aggregate rating updates
- **5.5**: Scenario forking with attribution preservation
