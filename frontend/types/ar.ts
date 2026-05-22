/**
 * AR Visualization type definitions
 */

export interface SupplyChainNode {
  nodeId: string;
  type: 'SUPPLIER' | 'MANUFACTURER' | 'WAREHOUSE' | 'DISTRIBUTOR' | 'RETAILER';
  name: string;
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  status: 'HEALTHY' | 'DEGRADED' | 'DISRUPTED' | 'OFFLINE';
  metrics: {
    capacity: number;
    utilization: number;
    inventory: number;
    leadTime: number;
  };
  connections: string[]; // Array of connected node IDs
}

export interface SupplyChainRoute {
  routeId: string;
  fromNodeId: string;
  toNodeId: string;
  status: 'ACTIVE' | 'DELAYED' | 'DISRUPTED' | 'BLOCKED';
  metrics: {
    distance: number;
    transitTime: number;
    cost: number;
    carbonFootprint: number;
  };
}

export interface Disruption {
  disruptionId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedNodeIds: string[];
  affectedRouteIds: string[];
  startTime: string;
  estimatedEndTime?: string;
  description: string;
}

export interface ARViewState {
  mode: '3D' | '2D';
  camera: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    zoom: number;
  };
  filters: {
    nodeTypes: string[];
    statusTypes: string[];
    showDisruptions: boolean;
    showRoutes: boolean;
  };
}

export interface DigitalTwinState {
  nodes: SupplyChainNode[];
  routes: SupplyChainRoute[];
  disruptions: Disruption[];
  lastUpdated: string;
}

export interface ARCapabilities {
  webXRSupported: boolean;
  webGLSupported: boolean;
  deviceType: 'desktop' | 'mobile' | 'ar-headset' | 'unknown';
  performanceLevel: 'high' | 'medium' | 'low';
}
