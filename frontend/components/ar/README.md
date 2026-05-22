# AR Visualization Components

This directory contains components for the Augmented Reality (AR) visualization of the supply chain digital twin.

## Components

### ARVisualization

The main AR visualization component that renders the digital twin in 3D space with WebXR support and graceful fallback to 2D map view.

**Features:**
- WebXR-based 3D rendering of supply chain nodes and routes
- Node selection with detailed metrics display
- Disruption highlighting with visual indicators
- View manipulation controls (zoom, rotate, filter)
- Graceful fallback to 2D interactive map view for unsupported devices
- Real-time digital twin state updates

**Props:**
- `digitalTwin`: The current state of the digital twin including nodes, routes, and disruptions
- `onNodeSelect`: Callback when a node is selected
- `onError`: Callback for error handling

**Usage:**
```tsx
import { ARVisualization } from '@/components/ar';

function ARPage() {
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinState>({
    nodes: [...],
    routes: [...],
    disruptions: [...],
    lastUpdated: new Date().toISOString(),
  });

  const handleNodeSelect = (node: SupplyChainNode) => {
    console.log('Selected node:', node);
  };

  return (
    <ARVisualization
      digitalTwin={digitalTwin}
      onNodeSelect={handleNodeSelect}
      onError={(error) => console.error(error)}
    />
  );
}
```

## AR Capabilities Detection

The component automatically detects device capabilities:
- **WebXR Support**: For immersive AR experiences
- **WebGL Support**: For 3D rendering
- **Device Type**: Desktop, mobile, or AR headset
- **Performance Level**: High, medium, or low

## Fallback Behavior

When AR/3D is not supported:
1. Component detects lack of WebGL/WebXR support
2. Automatically switches to 2D map view
3. Displays notification to user
4. Maintains all functionality (node selection, filtering, etc.)

## View Controls

- **Zoom**: Adjust view distance (0.1x to 5x)
- **Rotate**: Change camera angle
- **Filters**: Toggle node types, status, disruptions, and routes

## Requirements Validation

This component validates the following requirements:
- **10.1**: AR mode renders digital twin in 3D space with geographic accuracy
- **10.2**: Node selection displays detailed metrics and status
- **10.3**: Active disruptions are highlighted with visual indicators
- **10.4**: View manipulation controls (zoom, rotate, filter) with smooth rendering
- **10.5**: Graceful fallback to 2D map view when AR is unavailable
