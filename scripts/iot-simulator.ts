/**
 * IoT Simulator for OmniTrack AI Demo
 * 
 * Generates realistic sensor data for supply chain nodes and publishes to AWS IoT Core
 * 
 * Features:
 * - Configurable sensor types (temperature, delay, inventory)
 * - Realistic thresholds for anomaly detection
 * - Geographic locations for nodes
 * - Adjustable data generation rates
 * - On-demand anomaly injection
 * 
 * Requirements: 2.1, 2.5
 */

import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

// AWS Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const IOT_ENDPOINT = process.env.IOT_ENDPOINT || '';
const TABLE_NAME = process.env.TABLE_NAME || 'omnitrack-main';

// Simulator Configuration
interface SimulatorConfig {
  dataGenerationIntervalMs: number;
  anomalyProbability: number; // 0.0 to 1.0
  enabledSensorTypes: SensorType[];
  nodeIds: string[];
}

// Sensor Types
type SensorType = 'temperature' | 'delay' | 'inventory';

// Sensor Configuration with realistic thresholds
interface SensorConfig {
  type: SensorType;
  unit: string;
  normalRange: { min: number; max: number };
  anomalyRange: { min: number; max: number };
  criticalThreshold: number;
}

// Geographic locations for demo nodes
interface NodeLocation {
  nodeId: string;
  name: string;
  location: {
    lat: number;
    lon: number;
    city: string;
    country: string;
  };
}

// Sensor configurations with realistic thresholds
const SENSOR_CONFIGS: Record<SensorType, SensorConfig> = {
  temperature: {
    type: 'temperature',
    unit: 'celsius',
    normalRange: { min: 18, max: 25 },
    anomalyRange: { min: -10, max: 45 },
    criticalThreshold: 30
  },
  delay: {
    type: 'delay',
    unit: 'hours',
    normalRange: { min: 0, max: 2 },
    anomalyRange: { min: 3, max: 72 },
    criticalThreshold: 24
  },
  inventory: {
    type: 'inventory',
    unit: 'units',
    normalRange: { min: 100, max: 1000 },
    anomalyRange: { min: 0, max: 50 },
    criticalThreshold: 75
  }
};

// Demo node locations (realistic supply chain geography)
const NODE_LOCATIONS: NodeLocation[] = [
  {
    nodeId: 'node-supplier-001',
    name: 'Shanghai Manufacturing Hub',
    location: { lat: 31.2304, lon: 121.4737, city: 'Shanghai', country: 'China' }
  },
  {
    nodeId: 'node-supplier-002',
    name: 'Shenzhen Electronics Supplier',
    location: { lat: 22.5431, lon: 114.0579, city: 'Shenzhen', country: 'China' }
  },
  {
    nodeId: 'node-warehouse-001',
    name: 'Singapore Distribution Center',
    location: { lat: 1.3521, lon: 103.8198, city: 'Singapore', country: 'Singapore' }
  },
  {
    nodeId: 'node-warehouse-002',
    name: 'Los Angeles Port Warehouse',
    location: { lat: 33.7701, lon: -118.1937, city: 'Los Angeles', country: 'USA' }
  },
  {
    nodeId: 'node-retailer-001',
    name: 'New York Distribution Hub',
    location: { lat: 40.7128, lon: -74.0060, city: 'New York', country: 'USA' }
  },
  {
    nodeId: 'node-retailer-002',
    name: 'London Fulfillment Center',
    location: { lat: 51.5074, lon: -0.1278, city: 'London', country: 'UK' }
  }
];

/**
 * IoT Simulator Class
 */
class IoTSimulator {
  private iotClient: IoTDataPlaneClient;
  private dynamoClient: DynamoDBDocumentClient;
  private config: SimulatorConfig;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private messageCount: number = 0;

  constructor(config: SimulatorConfig) {
    this.config = config;
    
    // Initialize AWS clients
    this.iotClient = new IoTDataPlaneClient({
      region: AWS_REGION,
      endpoint: IOT_ENDPOINT || undefined
    });

    const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoClient);
  }

  /**
   * Start the simulator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Simulator is already running');
      return;
    }

    console.log('🚀 Starting IoT Simulator...');
    console.log(`📊 Configuration:
  - Data Generation Interval: ${this.config.dataGenerationIntervalMs}ms
  - Anomaly Probability: ${(this.config.anomalyProbability * 100).toFixed(1)}%
  - Enabled Sensors: ${this.config.enabledSensorTypes.join(', ')}
  - Node Count: ${this.config.nodeIds.length}
`);

    this.isRunning = true;
    this.messageCount = 0;

    // Verify nodes exist in DynamoDB
    await this.verifyNodes();

    // Start data generation loop
    this.intervalId = setInterval(
      () => this.generateAndPublishData(),
      this.config.dataGenerationIntervalMs
    );

    console.log('✅ Simulator started successfully\n');
  }

  /**
   * Stop the simulator
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️  Simulator is not running');
      return;
    }

    console.log('\n🛑 Stopping IoT Simulator...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log(`✅ Simulator stopped. Total messages sent: ${this.messageCount}`);
  }

  /**
   * Inject an anomaly for a specific node and sensor type
   */
  async injectAnomaly(nodeId: string, sensorType: SensorType): Promise<void> {
    console.log(`💥 Injecting anomaly: ${sensorType} for ${nodeId}`);
    
    const sensorData = this.generateSensorData(nodeId, sensorType, true);
    await this.publishToIoTCore(sensorData);
    
    console.log(`✅ Anomaly injected successfully`);
  }

  /**
   * Verify that nodes exist in DynamoDB
   */
  private async verifyNodes(): Promise<void> {
    try {
      console.log('🔍 Verifying nodes in DynamoDB...');
      
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(PK, :pk)',
        ExpressionAttributeValues: {
          ':pk': 'NODE#'
        },
        ProjectionExpression: 'PK, SK'
      });

      const response = await this.dynamoClient.send(command);
      const existingNodeIds = response.Items?.map((item: any) => 
        item.PK.replace('NODE#', '')
      ) || [];

      console.log(`✅ Found ${existingNodeIds.length} nodes in DynamoDB`);
      
      // Check if configured nodes exist
      const missingNodes = this.config.nodeIds.filter(
        id => !existingNodeIds.includes(id)
      );

      if (missingNodes.length > 0) {
        console.warn(`⚠️  Warning: ${missingNodes.length} configured nodes not found in DynamoDB:`);
        missingNodes.forEach(id => console.warn(`   - ${id}`));
        console.warn('   Run "npm run seed-demo" to create demo nodes\n');
      }
    } catch (error) {
      console.error('❌ Failed to verify nodes:', error);
      throw error;
    }
  }

  /**
   * Generate and publish sensor data for all nodes
   */
  private async generateAndPublishData(): Promise<void> {
    try {
      const promises: Promise<void>[] = [];

      // Generate data for each node and sensor type
      for (const nodeId of this.config.nodeIds) {
        for (const sensorType of this.config.enabledSensorTypes) {
          const isAnomaly = Math.random() < this.config.anomalyProbability;
          const sensorData = this.generateSensorData(nodeId, sensorType, isAnomaly);
          promises.push(this.publishToIoTCore(sensorData));
        }
      }

      await Promise.all(promises);
      this.messageCount += promises.length;

      // Log progress every 10 messages
      if (this.messageCount % 10 === 0) {
        console.log(`📡 Sent ${this.messageCount} messages...`);
      }
    } catch (error) {
      console.error('❌ Error generating data:', error);
    }
  }

  /**
   * Generate sensor data for a specific node and sensor type
   */
  private generateSensorData(
    nodeId: string,
    sensorType: SensorType,
    forceAnomaly: boolean = false
  ): any {
    const config = SENSOR_CONFIGS[sensorType];
    const location = NODE_LOCATIONS.find(loc => loc.nodeId === nodeId);
    
    // Determine if this should be an anomaly
    const isAnomaly = forceAnomaly || Math.random() < this.config.anomalyProbability;
    
    // Generate value based on normal or anomaly range
    const range = isAnomaly ? config.anomalyRange : config.normalRange;
    const value = this.randomInRange(range.min, range.max);
    
    // Determine severity
    const severity = this.calculateSeverity(value, config);

    return {
      nodeId,
      timestamp: new Date().toISOString(),
      sensorType,
      metrics: {
        [sensorType]: value,
        threshold: config.criticalThreshold,
        isAnomaly,
        severity
      },
      location: location?.location || null,
      source: 'iot-simulator',
      messageId: `sim-${Date.now()}-${Math.random().toString(36).substring(7)}`
    };
  }

  /**
   * Calculate severity based on value and thresholds
   */
  private calculateSeverity(value: number, config: SensorConfig): string {
    if (config.type === 'inventory') {
      // For inventory, low values are critical
      if (value < config.criticalThreshold) return 'critical';
      if (value < config.normalRange.min) return 'high';
      return 'normal';
    } else {
      // For temperature and delay, high values are critical
      if (value > config.criticalThreshold) return 'critical';
      if (value > config.normalRange.max) return 'high';
      return 'normal';
    }
  }

  /**
   * Publish sensor data to AWS IoT Core
   */
  private async publishToIoTCore(sensorData: any): Promise<void> {
    try {
      const topic = `omnitrack/sensors/${sensorData.nodeId}/data`;
      
      const command = new PublishCommand({
        topic,
        payload: Buffer.from(JSON.stringify(sensorData)),
        qos: 1
      });

      await this.iotClient.send(command);

      // Log anomalies
      if (sensorData.metrics.isAnomaly) {
        const sensorConfig = SENSOR_CONFIGS[sensorData.sensorType as SensorType];
        const value = sensorData.metrics[sensorData.sensorType];
        console.log(`⚠️  ANOMALY: ${sensorData.sensorType} = ${value} ${sensorConfig.unit} (${sensorData.nodeId})`);
      }
    } catch (error) {
      console.error(`❌ Failed to publish to IoT Core:`, error);
      throw error;
    }
  }

  /**
   * Generate random number in range
   */
  private randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Get simulator status
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      messageCount: this.messageCount,
      config: this.config,
      nodeLocations: NODE_LOCATIONS
    };
  }
}

// Export for use in other scripts
export { IoTSimulator, SimulatorConfig, SensorType, NODE_LOCATIONS };
