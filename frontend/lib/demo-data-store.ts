/**
 * In-memory data store for demo mode
 * Simulates real-time supply chain data without AWS dependencies
 */

export interface SupplyChainNode {
  id: string;
  name: string;
  type: 'supplier' | 'manufacturer' | 'warehouse' | 'distributor' | 'retailer';
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    inventory: number;
    capacity: number;
    utilization: number;
    temperature?: number;
    delay?: number;
  };
  location?: {
    lat: number;
    lon: number;
    city: string;
    country: string;
    region: string;
  };
  details: {
    industry: string;
    currency: string;
    shippingMethods: string[];
    supplierInfo?: {
      companyName: string;
      contactPerson: string;
      email: string;
      phone: string;
      certifications: string[];
      leadTime: string;
    };
    factoryInfo?: {
      productionCapacity: string;
      workforceSize: number;
      operatingHours: string;
      certifications: string[];
    };
    portInfo?: {
      portName: string;
      portCode: string;
      customsClearanceTime: string;
      storageCapacity: string;
    };
    warehouseInfo?: {
      storageType: string;
      temperatureControlled: boolean;
      securityLevel: string;
      handlingCapacity: string;
    };
    distributionInfo?: {
      coverageArea: string;
      fleetSize: number;
      deliverySpeed: string;
    };
    retailerInfo?: {
      storeCount: number;
      salesChannels: string[];
      customerBase: string;
    };
  };
  lastUpdated: string;
}

export interface SensorEvent {
  nodeId: string;
  timestamp: string;
  sensorType: 'temperature' | 'delay' | 'inventory';
  value: number;
  isAnomaly: boolean;
  severity: 'normal' | 'high' | 'critical';
}

export interface SupplyChainConfig {
  region: string;
  industry: string;
  currency: string;
  shippingMethods: string[];
  nodeCount: number;
  riskProfile: string;
}

class DemoDataStore {
  private nodes: Map<string, SupplyChainNode> = new Map();
  private sensorEvents: SensorEvent[] = [];
  private subscribers: Set<(nodes: SupplyChainNode[]) => void> = new Set();
  private simulationInterval: NodeJS.Timeout | null = null;
  private config: SupplyChainConfig = {
    region: 'asia-pacific',
    industry: 'electronics',
    currency: 'USD',
    shippingMethods: ['sea-freight'],
    nodeCount: 6,
    riskProfile: 'medium',
  };

  constructor() {
    this.initializeNodes();
  }

  setConfig(config: SupplyChainConfig) {
    this.config = config;
    this.nodes.clear(); // Clear existing nodes
    this.initializeNodes();
    this.notifySubscribers();
  }

  getConfig(): SupplyChainConfig {
    return { ...this.config };
  }

  private generateNodesByConfig(): SupplyChainNode[] {
    const { region, industry, currency, shippingMethods, nodeCount, riskProfile } = this.config;
    
    // Define region-specific locations
    const regionLocations: Record<string, Array<{ city: string; country: string; lat: number; lon: number }>> = {
      'asia-pacific': [
        { city: 'Shanghai', country: 'China', lat: 31.2304, lon: 121.4737 },
        { city: 'Shenzhen', country: 'China', lat: 22.5431, lon: 114.0579 },
        { city: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198 },
        { city: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
        { city: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.9780 },
        { city: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777 },
      ],
      'north-america': [
        { city: 'Los Angeles', country: 'USA', lat: 33.7701, lon: -118.1937 },
        { city: 'New York', country: 'USA', lat: 40.7128, lon: -74.0060 },
        { city: 'Chicago', country: 'USA', lat: 41.8781, lon: -87.6298 },
        { city: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832 },
        { city: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332 },
      ],
      'europe': [
        { city: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 },
        { city: 'Rotterdam', country: 'Netherlands', lat: 51.9225, lon: 4.4792 },
        { city: 'Hamburg', country: 'Germany', lat: 53.5511, lon: 9.9937 },
        { city: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
        { city: 'Barcelona', country: 'Spain', lat: 41.3851, lon: 2.1734 },
      ],
      'latin-america': [
        { city: 'São Paulo', country: 'Brazil', lat: -23.5505, lon: -46.6333 },
        { city: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lon: -58.3816 },
        { city: 'Santiago', country: 'Chile', lat: -33.4489, lon: -70.6693 },
        { city: 'Lima', country: 'Peru', lat: -12.0464, lon: -77.0428 },
      ],
      'middle-east': [
        { city: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708 },
        { city: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lon: 46.6753 },
        { city: 'Tel Aviv', country: 'Israel', lat: 32.0853, lon: 34.7818 },
        { city: 'Istanbul', country: 'Turkey', lat: 41.0082, lon: 28.9784 },
      ],
    };

    const locations = regionLocations[region] || regionLocations['asia-pacific'];
    const nodes: SupplyChainNode[] = [];
    
    // Define node types distribution based on nodeCount
    const nodeTypes: Array<SupplyChainNode['type']> = ['supplier', 'supplier', 'manufacturer', 'warehouse', 'distributor', 'retailer'];
    
    // Adjust for different node counts
    let typesToUse = nodeTypes.slice(0, nodeCount);
    if (nodeCount > 6) {
      // Add more suppliers and warehouses for larger networks
      const extras: Array<SupplyChainNode['type']> = ['supplier', 'warehouse', 'distributor', 'manufacturer', 'retailer', 'warehouse'];
      typesToUse = [...typesToUse, ...extras.slice(0, nodeCount - 6)];
    }

    // Risk profile affects initial status distribution
    const riskMultiplier = riskProfile === 'high' ? 0.4 : riskProfile === 'medium' ? 0.7 : 0.9;

    for (let i = 0; i < nodeCount; i++) {
      const location = locations[i % locations.length];
      const nodeType = typesToUse[i];
      const nodeId = `${nodeType}-${i + 1}`;
      
      // Generate metrics based on risk profile
      const baseUtilization = 50 + Math.random() * 40;
      const utilization = Math.round(baseUtilization * riskMultiplier);
      const capacity = 500 + Math.floor(Math.random() * 1500);
      const inventory = Math.round((utilization / 100) * capacity);
      
      // Determine status based on utilization
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (utilization < 30) status = 'critical';
      else if (utilization < 50) status = 'warning';

      nodes.push({
        id: nodeId,
        name: `${location.city} ${this.getNodeTypeName(nodeType)}`,
        type: nodeType,
        status,
        metrics: {
          inventory,
          capacity,
          utilization,
          temperature: nodeType === 'warehouse' ? 4 + Math.random() * 4 : 20 + Math.random() * 5,
          delay: nodeType === 'distributor' ? Math.random() * 10 : undefined,
        },
        location: {
          ...location,
          region: this.getRegionLabel(region),
        },
        details: {
          industry: this.getIndustryLabel(industry),
          currency,
          shippingMethods: shippingMethods.map(m => this.getShippingMethodLabel(m)),
          ...this.generateNodeDetails(nodeType, location),
        },
        lastUpdated: new Date().toISOString(),
      });
    }

    return nodes;
  }

  private getNodeTypeName(type: SupplyChainNode['type']): string {
    const names: Record<SupplyChainNode['type'], string[]> = {
      supplier: ['Raw Materials Co.', 'Components Supply', 'Materials Ltd.', 'Supply Corp.'],
      manufacturer: ['Assembly Plant', 'Manufacturing Hub', 'Production Facility', 'Factory'],
      warehouse: ['Warehouse', 'Storage Facility', 'Distribution Center', 'Logistics Hub'],
      distributor: ['Distribution Hub', 'Regional Distributor', 'Logistics Center', 'Distribution Network'],
      retailer: ['Retail Network', 'Store Chain', 'Retail Hub', 'Consumer Outlet'],
    };
    const options = names[type];
    return options[Math.floor(Math.random() * options.length)];
  }

  private getRegionLabel(region: string): string {
    const labels: Record<string, string> = {
      'asia-pacific': 'Asia-Pacific',
      'north-america': 'North America',
      'europe': 'Europe',
      'latin-america': 'Latin America',
      'middle-east': 'Middle East',
    };
    return labels[region] || 'Global';
  }

  private getIndustryLabel(industry: string): string {
    const labels: Record<string, string> = {
      electronics: 'Electronics Manufacturing',
      automotive: 'Automotive',
      pharmaceuticals: 'Pharmaceuticals',
      'food-beverage': 'Food & Beverage',
      fashion: 'Fashion & Apparel',
      chemicals: 'Chemicals',
    };
    return labels[industry] || 'General Manufacturing';
  }

  private getShippingMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      'sea-freight': 'Sea Freight',
      'air-freight': 'Air Freight',
      rail: 'Rail',
      truck: 'Truck',
      express: 'Express Delivery',
    };
    return labels[method] || method;
  }

  private generateNodeDetails(type: SupplyChainNode['type'], location: { city: string; country: string }) {
    const details: any = {};

    switch (type) {
      case 'supplier':
        details.supplierInfo = {
          companyName: `${location.city} ${this.getNodeTypeName(type)}`,
          contactPerson: this.generateName(),
          email: `contact@${location.city.toLowerCase().replace(/\s/g, '')}.com`,
          phone: this.generatePhone(location.country),
          certifications: ['ISO 9001', 'ISO 14001', 'RoHS'],
          leadTime: `${7 + Math.floor(Math.random() * 14)} days`,
        };
        break;
      case 'manufacturer':
        details.factoryInfo = {
          productionCapacity: `${10000 + Math.floor(Math.random() * 90000)} units/month`,
          workforceSize: 100 + Math.floor(Math.random() * 900),
          operatingHours: '24/7 (3 shifts)',
          certifications: ['ISO 9001', 'ISO 14001', 'OHSAS 18001'],
        };
        break;
      case 'warehouse':
        details.warehouseInfo = {
          storageType: 'Temperature-Controlled',
          temperatureControlled: true,
          securityLevel: 'High (24/7 surveillance)',
          handlingCapacity: `${100 + Math.floor(Math.random() * 400)} pallets/day`,
        };
        break;
      case 'distributor':
        details.distributionInfo = {
          coverageArea: `${location.city} Region`,
          fleetSize: 20 + Math.floor(Math.random() * 180),
          deliverySpeed: '1-3 business days',
        };
        break;
      case 'retailer':
        details.retailerInfo = {
          storeCount: 10 + Math.floor(Math.random() * 90),
          salesChannels: ['Physical Stores', 'E-commerce', 'Mobile App'],
          customerBase: `${(Math.random() * 5 + 0.5).toFixed(1)}M active customers`,
        };
        break;
    }

    return details;
  }

  private generateName(): string {
    const firstNames = ['Wei', 'Li', 'John', 'Maria', 'Ahmed', 'Yuki', 'Hans', 'Pierre'];
    const lastNames = ['Chen', 'Wang', 'Smith', 'Garcia', 'Al-Rashid', 'Tanaka', 'Schmidt', 'Dubois'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  private generatePhone(country: string): string {
    const codes: Record<string, string> = {
      China: '+86',
      USA: '+1',
      UK: '+44',
      Germany: '+49',
      Japan: '+81',
      Singapore: '+65',
    };
    const code = codes[country] || '+1';
    return `${code}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  private initializeNodes() {
    const initialNodes = this.generateNodesByConfig();
    initialNodes.forEach(node => this.nodes.set(node.id, node));
  }

  startSimulation() {
    if (this.simulationInterval) return;

    this.simulationInterval = setInterval(() => {
      this.updateNodes();
      this.notifySubscribers();
    }, 3000); // Update every 3 seconds
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private updateNodes() {
    this.nodes.forEach((node, id) => {
      // Randomly update metrics
      const inventoryChange = Math.floor(Math.random() * 40) - 20;
      const newInventory = Math.max(
        0,
        Math.min(node.metrics.capacity, node.metrics.inventory + inventoryChange)
      );
      const newUtilization = Math.round((newInventory / node.metrics.capacity) * 100);

      // Update temperature if applicable
      let newTemperature = node.metrics.temperature;
      if (newTemperature !== undefined) {
        newTemperature = Math.max(0, Math.min(30, newTemperature + (Math.random() * 2 - 1)));
      }

      // Update delay if applicable
      let newDelay = node.metrics.delay;
      if (newDelay !== undefined) {
        newDelay = Math.max(0, newDelay + (Math.random() * 2 - 1));
      }

      // Determine status
      let newStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (newUtilization < 30) newStatus = 'critical';
      else if (newUtilization < 50) newStatus = 'warning';

      // Check for temperature anomalies
      if (newTemperature !== undefined && (newTemperature < 2 || newTemperature > 28)) {
        newStatus = 'critical';
        this.addSensorEvent({
          nodeId: id,
          timestamp: new Date().toISOString(),
          sensorType: 'temperature',
          value: newTemperature,
          isAnomaly: true,
          severity: 'critical',
        });
      }

      // Update node
      this.nodes.set(id, {
        ...node,
        status: newStatus,
        metrics: {
          ...node.metrics,
          inventory: newInventory,
          utilization: newUtilization,
          temperature: newTemperature,
          delay: newDelay,
        },
        lastUpdated: new Date().toISOString(),
      });
    });
  }

  private addSensorEvent(event: SensorEvent) {
    this.sensorEvents.push(event);
    // Keep only last 100 events
    if (this.sensorEvents.length > 100) {
      this.sensorEvents = this.sensorEvents.slice(-100);
    }
  }

  subscribe(callback: (nodes: SupplyChainNode[]) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    const nodes = Array.from(this.nodes.values());
    this.subscribers.forEach(callback => callback(nodes));
  }

  getNodes(): SupplyChainNode[] {
    return Array.from(this.nodes.values());
  }

  getNode(id: string): SupplyChainNode | undefined {
    return this.nodes.get(id);
  }

  getSensorEvents(limit: number = 50): SensorEvent[] {
    return this.sensorEvents.slice(-limit);
  }
}

// Singleton instance
let dataStore: DemoDataStore | null = null;

export function getDemoDataStore(): DemoDataStore {
  if (!dataStore) {
    dataStore = new DemoDataStore();
  }
  return dataStore;
}
