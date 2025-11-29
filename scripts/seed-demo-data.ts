#!/usr/bin/env node
/**
 * Seed script for DynamoDB demo data
 * Generates realistic supply chain data for hackathon demonstration
 */

import {
  DynamoDBClient,
  BatchWriteItemCommand,
  BatchWriteItemCommandInput
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'omnitrack-main';

interface DynamoDBItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  [key: string]: any;
}

/**
 * Generate sample supply chain nodes
 */
function generateNodes(): DynamoDBItem[] {
  const timestamp = new Date().toISOString();
  
  const nodes = [
    // Suppliers
    {
      PK: 'NODE#supplier-001',
      SK: 'METADATA',
      GSI1PK: 'NODE_TYPE#SUPPLIER',
      GSI1SK: timestamp,
      GSI2PK: 'NODE_STATUS#OPERATIONAL',
      GSI2SK: timestamp,
      nodeId: 'supplier-001',
      type: 'SUPPLIER',
      name: 'Pacific Electronics Supply Co.',
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: '123 Market Street',
        city: 'San Francisco',
        country: 'USA'
      },
      capacity: 10000,
      status: 'OPERATIONAL',
      connections: ['manufacturer-001', 'manufacturer-002'],
      metrics: {
        currentInventory: 8500,
        utilizationRate: 0.85,
        lastUpdateTimestamp: timestamp,
        lastUpdateSource: 'IoT_SENSOR'
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    },
    {
      PK: 'NODE#supplier-002',
      SK: 'METADATA',
      GSI1PK: 'NODE_TYPE#SUPPLIER',
      GSI1SK: timestamp,
      GSI2PK: 'NODE_STATUS#DEGRADED',
      GSI2SK: timestamp,
      nodeId: 'supplier-002',
      type: 'SUPPLIER',
      name: 'Asian Components Ltd.',
      location: {
        latitude: 22.3193,
        longitude: 114.1694,
        address: '456 Harbor Road',
        city: 'Hong Kong',
        country: 'China'
      },
      capacity: 15000,
      status: 'DEGRADED',
      connections: ['manufacturer-001'],
      metrics: {
        currentInventory: 5000,
        utilizationRate: 0.33,
        lastUpdateTimestamp: timestamp,
        lastUpdateSource: 'IoT_SENSOR'
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    },
    // Manufacturers
    {
      PK: 'NODE#manufacturer-001',
      SK: 'METADATA',
      GSI1PK: 'NODE_TYPE#MANUFACTURER',
      GSI1SK: timestamp,
      GSI2PK: 'NODE_STATUS#OPERATIONAL',
      GSI2SK: timestamp,
      nodeId: 'manufacturer-001',
      type: 'MANUFACTURER',
      name: 'TechBuild Manufacturing',
      location: {
        latitude: 30.2672,
        longitude: -97.7431,
        address: '789 Industrial Blvd',
        city: 'Austin',
        country: 'USA'
      },
      capacity: 5000,
      status: 'OPERATIONAL',
      connections: ['warehouse-001', 'distribution-001'],
      metrics: {
        currentInventory: 3200,
        utilizationRate: 0.64,
        lastUpdateTimestamp: timestamp,
        lastUpdateSource: 'IoT_SENSOR'
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    },
    {
      PK: 'NODE#manufacturer-002',
      SK: 'METADATA',
      GSI1PK: 'NODE_TYPE#MANUFACTURER',
      GSI1SK: timestamp,
      GSI2PK: 'NODE_STATUS#OPERATIONAL',
      GSI2SK: timestamp,
      nodeId: 'manufacturer-002',
      type: 'MANUFACTURER',
      name: 'Global Assembly Corp',
      location: {
        latitude: 51.5074,
        longitude: -0.1278,
        address: '321 Factory Lane',
        city: 'London',
        country: 'UK'
      },
      capacity: 7000,
      status: 'OPERATIONAL',
      connections: ['warehouse-002', 'distribution-002'],
      metrics: {
        currentInventory: 4500,
        utilizationRate: 0.64,
        lastUpdateTimestamp: timestamp,
        lastUpdateSource: 'IoT_SENSOR'
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    },
    // Warehouses
    {
      PK: 'NODE#warehouse-001',
      SK: 'METADATA',
      GSI1PK: 'NODE_TYPE#WAREHOUSE',
      GSI1SK: timestamp,
      GSI2PK: 'NODE_STATUS#OPERATIONAL',
      GSI2SK: timestamp,
      nodeId: 'warehouse-001',
      type: 'WAREHOUSE',
      name: 'Central Storage Facility',
      location: {
        latitude: 41.8781,
        longitude: -87.6298,
        address: '555 Warehouse Way',
        city: 'Chicago',
        country: 'USA'
      },
      capacity: 20000,
      status: 'OPERATIONAL',
      connections: ['distribution-001', 'retailer-001'],
      metrics: {
        currentInventory: 15000,
        utilizationRate: 0.75,
        lastUpdateTimestamp: timestamp,
        lastUpdateSource: 'IoT_SENSOR'
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    },
    {
      PK: 'NODE#warehouse-002',
      SK: 'METADATA',
      GSI1PK: 'NODE_TYPE#WAREHOUSE',
      GSI1SK: timestamp,
      GSI2PK: 'NODE_STATUS#OPERATIONAL',
      GSI2SK: timestamp,
      nodeId: 'warehouse-002',
      type: 'WAREHOUSE',
      name: 'European Distribution Hub',
      location: {
        latitude: 52.5200,
        longitude: 13.4050,
        address: '777 Logistics Strasse',
        city: 'Berlin',
        country: 'Germany'
      },
      capacity: 18000,
      status: 'OPERATIONAL',
      connections: ['distribution-002', 'retailer-002'],
      metrics: {
        currentInventory: 12000,
        utilizationRate: 0.67,
        lastUpdateTimestamp: timestamp,
        lastUpdateSource: 'IoT_SENSOR'
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    },
    // Distribution Centers
    {
      PK: 'NODE#distribution-001',
      SK: 'METADATA',
      GSI1PK: 'NODE_TYPE#DISTRIBUTION_CENTER',
      GSI1SK: timestamp,
      GSI2PK: 'NODE_STATUS#OPERATIONAL',
      GSI2SK: timestamp,
      nodeId: 'distribution-001',
      type: 'DISTRIBUTION_CENTER',
      name: 'East Coast Distribution',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '999 Distribution Ave',
        city: 'New York',
        country: 'USA'
      },
      capacity: 12000,
      status: 'OPERATIONAL',
      connections: ['retailer-001', 'retailer-003'],
      metrics: {
        currentInventory: 8000,
        utilizationRate: 0.67,
        lastUpdateTimestamp: timestamp,
        lastUpdateSource: 'IoT_SENSOR'
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    },
    {
      PK: 'NODE#distribution-002',
      SK: 'METADATA',
      GSI1PK: 'NODE_TYPE#DISTRIBUTION_CENTER',
      GSI1SK: timestamp,
      GSI2PK: 'NODE_STATUS#OPERATIONAL',
      GSI2SK: timestamp,
      nodeId: 'distribution-002',
      type: 'DISTRIBUTION_CENTER',
      name: 'Western Europe Hub',
      location: {
        latitude: 48.8566,
        longitude: 2.3522,
        address: '111 Commerce Boulevard',
        city: 'Paris',
        country: 'France'
      },
      capacity: 10000,
      status: 'OPERATIONAL',
      connections: ['retailer-002', 'retailer-004'],
      metrics: {
        currentInventory: 7500,
        utilizationRate: 0.75,
        lastUpdateTimestamp: timestamp,
        lastUpdateSource: 'IoT_SENSOR'
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    },
    // Retailers
    {
      PK: 'NODE#retailer-001',
      SK: 'METADATA',
      GSI1PK: 'NODE_TYPE#RETAILER',
      GSI1SK: timestamp,
      GSI2PK: 'NODE_STATUS#OPERATIONAL',
      GSI2SK: timestamp,
      nodeId: 'retailer-001',
      type: 'RETAILER',
      name: 'TechMart Flagship Store',
      location: {
        latitude: 34.0522,
        longitude: -118.2437,
        address: '222 Retail Plaza',
        city: 'Los Angeles',
        country: 'USA'
      },
      capacity: 3000,
      status: 'OPERATIONAL',
      connections: [],
      metrics: {
        currentInventory: 2100,
        utilizationRate: 0.70,
        lastUpdateTimestamp: timestamp,
        lastUpdateSource: 'IoT_SENSOR'
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    },
    {
      PK: 'NODE#retailer-002',
      SK: 'METADATA',
      GSI1PK: 'NODE_TYPE#RETAILER',
      GSI1SK: timestamp,
      GSI2PK: 'NODE_STATUS#OPERATIONAL',
      GSI2SK: timestamp,
      nodeId: 'retailer-002',
      type: 'RETAILER',
      name: 'Euro Electronics Store',
      location: {
        latitude: 41.9028,
        longitude: 12.4964,
        address: '333 Shopping Street',
        city: 'Rome',
        country: 'Italy'
      },
      capacity: 2500,
      status: 'OPERATIONAL',
      connections: [],
      metrics: {
        currentInventory: 1800,
        utilizationRate: 0.72,
        lastUpdateTimestamp: timestamp,
        lastUpdateSource: 'IoT_SENSOR'
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    }
  ];

  return nodes;
}

/**
 * Generate sample sensor data
 */
function generateSensorData(): DynamoDBItem[] {
  const timestamp = new Date().toISOString();
  const now = Date.now();
  
  const sensorData: DynamoDBItem[] = [];
  const nodeIds = ['supplier-001', 'supplier-002', 'manufacturer-001', 'warehouse-001'];
  const sensorTypes = ['temperature', 'delay', 'inventory'];
  
  // Generate 20 sensor readings across different nodes
  for (let i = 0; i < 20; i++) {
    const nodeId = nodeIds[i % nodeIds.length];
    const sensorType = sensorTypes[i % sensorTypes.length];
    const sensorTimestamp = new Date(now - (i * 60000)).toISOString(); // 1 minute intervals
    
    let value, threshold, unit;
    if (sensorType === 'temperature') {
      value = 20 + Math.random() * 10; // 20-30°C
      threshold = 28;
      unit = '°C';
    } else if (sensorType === 'delay') {
      value = Math.random() * 24; // 0-24 hours
      threshold = 12;
      unit = 'hours';
    } else {
      value = 1000 + Math.random() * 9000; // 1000-10000 units
      threshold = 2000;
      unit = 'units';
    }
    
    sensorData.push({
      PK: `SENSOR#${nodeId}-${sensorType}`,
      SK: `DATA#${sensorTimestamp}`,
      GSI1PK: `NODE#${nodeId}`,
      GSI1SK: sensorTimestamp,
      sensorId: `${nodeId}-${sensorType}`,
      nodeId,
      type: sensorType,
      value: Math.round(value * 100) / 100,
      threshold,
      unit,
      timestamp: sensorTimestamp,
      anomaly: value > threshold
    });
  }
  
  return sensorData;
}

/**
 * Generate sample scenarios
 */
function generateScenarios(): DynamoDBItem[] {
  const timestamp = new Date().toISOString();
  
  return [
    {
      PK: 'SCENARIO#scenario-001',
      SK: 'DETAILS',
      GSI1PK: 'SCENARIO_TYPE#SUPPLIER_FAILURE',
      GSI1SK: timestamp,
      scenarioId: 'scenario-001',
      type: 'SUPPLIER_FAILURE',
      name: 'Asian Supplier Disruption',
      description: 'Major supplier in Hong Kong experiences production delays due to equipment failure',
      parameters: {
        location: {
          latitude: 22.3193,
          longitude: 114.1694,
          address: '456 Harbor Road',
          city: 'Hong Kong',
          country: 'China'
        },
        severity: 'HIGH',
        duration: 72,
        affectedNodes: ['supplier-002', 'manufacturer-001'],
        customParameters: {
          equipmentType: 'Assembly Line',
          estimatedRepairTime: 48
        }
      },
      createdBy: 'demo-admin',
      createdAt: timestamp,
      updatedAt: timestamp,
      isPublic: true,
      marketplaceMetadata: {
        title: 'Supplier Equipment Failure Scenario',
        description: 'Realistic scenario modeling supplier production disruption',
        author: 'OmniTrack Demo',
        rating: 4.5,
        usageCount: 15,
        tags: ['supplier', 'equipment-failure', 'asia'],
        industry: 'Electronics',
        geography: 'Asia-Pacific'
      },
      version: 1
    },
    {
      PK: 'SCENARIO#scenario-002',
      SK: 'DETAILS',
      GSI1PK: 'SCENARIO_TYPE#TRANSPORTATION_DELAY',
      GSI1SK: timestamp,
      scenarioId: 'scenario-002',
      type: 'TRANSPORTATION_DELAY',
      name: 'Port Congestion Delay',
      description: 'Severe port congestion causing 2-week delays in shipments',
      parameters: {
        location: {
          latitude: 33.7701,
          longitude: -118.1937,
          address: 'Port of Los Angeles',
          city: 'Los Angeles',
          country: 'USA'
        },
        severity: 'CRITICAL',
        duration: 336,
        affectedNodes: ['warehouse-001', 'distribution-001', 'retailer-001'],
        customParameters: {
          delayReason: 'Port Congestion',
          alternativeRoutes: ['Air Freight', 'Rail']
        }
      },
      createdBy: 'demo-admin',
      createdAt: timestamp,
      updatedAt: timestamp,
      isPublic: true,
      marketplaceMetadata: {
        title: 'Port Congestion Scenario',
        description: 'Models impact of severe port delays on supply chain',
        author: 'OmniTrack Demo',
        rating: 4.8,
        usageCount: 23,
        tags: ['transportation', 'port', 'delay'],
        industry: 'Logistics',
        geography: 'North America'
      },
      version: 1
    }
  ];
}

/**
 * Generate sample alerts
 */
function generateAlerts(): DynamoDBItem[] {
  const timestamp = new Date().toISOString();
  const now = Date.now();
  
  return [
    {
      PK: 'ALERT#alert-001',
      SK: new Date(now - 3600000).toISOString(), // 1 hour ago
      GSI1PK: 'ALERT_TYPE#ANOMALY_DETECTED',
      GSI1SK: new Date(now - 3600000).toISOString(),
      GSI2PK: 'ALERT_STATUS#ACTIVE',
      GSI2SK: new Date(now - 3600000).toISOString(),
      alertId: 'alert-001',
      type: 'ANOMALY_DETECTED',
      severity: 'HIGH',
      nodeId: 'supplier-002',
      status: 'ACTIVE',
      message: 'Inventory levels dropped 40% below normal in the last 6 hours',
      createdAt: new Date(now - 3600000).toISOString(),
      metadata: {
        priority: 8,
        affectedNodes: ['supplier-002', 'manufacturer-001'],
        estimatedImpact: 'Production delays of 24-48 hours',
        recommendedActions: [
          'Contact supplier for status update',
          'Activate backup supplier',
          'Adjust production schedule'
        ]
      },
      version: 1
    },
    {
      PK: 'ALERT#alert-002',
      SK: new Date(now - 7200000).toISOString(), // 2 hours ago
      GSI1PK: 'ALERT_TYPE#THRESHOLD_EXCEEDED',
      GSI1SK: new Date(now - 7200000).toISOString(),
      GSI2PK: 'ALERT_STATUS#ACKNOWLEDGED',
      GSI2SK: new Date(now - 7200000).toISOString(),
      alertId: 'alert-002',
      type: 'THRESHOLD_EXCEEDED',
      severity: 'MEDIUM',
      nodeId: 'warehouse-001',
      status: 'ACKNOWLEDGED',
      message: 'Warehouse utilization exceeded 75% threshold',
      acknowledgedBy: 'demo-admin',
      acknowledgedAt: new Date(now - 3000000).toISOString(),
      createdAt: new Date(now - 7200000).toISOString(),
      metadata: {
        priority: 5,
        affectedNodes: ['warehouse-001'],
        estimatedImpact: 'Potential storage capacity issues within 48 hours',
        recommendedActions: [
          'Expedite outbound shipments',
          'Consider overflow storage options',
          'Review inventory optimization'
        ]
      },
      version: 1
    },
    {
      PK: 'ALERT#alert-003',
      SK: new Date(now - 1800000).toISOString(), // 30 minutes ago
      GSI1PK: 'ALERT_TYPE#DISRUPTION_PREDICTED',
      GSI1SK: new Date(now - 1800000).toISOString(),
      GSI2PK: 'ALERT_STATUS#ACTIVE',
      GSI2SK: new Date(now - 1800000).toISOString(),
      alertId: 'alert-003',
      type: 'DISRUPTION_PREDICTED',
      severity: 'CRITICAL',
      nodeId: 'distribution-001',
      status: 'ACTIVE',
      message: 'AI predicts 85% probability of delivery delays in next 72 hours',
      createdAt: new Date(now - 1800000).toISOString(),
      metadata: {
        priority: 9,
        affectedNodes: ['distribution-001', 'retailer-001', 'retailer-003'],
        estimatedImpact: 'Customer delivery delays of 3-5 days, potential revenue loss of $50K',
        recommendedActions: [
          'Activate alternative distribution routes',
          'Notify affected customers proactively',
          'Increase safety stock at retail locations'
        ]
      },
      version: 1
    }
  ];
}

/**
 * Batch write items to DynamoDB
 */
async function batchWriteItems(items: DynamoDBItem[]): Promise<void> {
  const BATCH_SIZE = 25; // DynamoDB limit
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    
    const params: BatchWriteItemCommandInput = {
      RequestItems: {
        [TABLE_NAME]: batch.map(item => ({
          PutRequest: {
            Item: marshall(item, { removeUndefinedValues: true })
          }
        }))
      }
    };
    
    try {
      await client.send(new BatchWriteItemCommand(params));
      console.log(`✓ Wrote batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} items)`);
    } catch (error) {
      console.error(`✗ Failed to write batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
      throw error;
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🌱 Seeding demo data to DynamoDB...\n');
  console.log(`Table: ${TABLE_NAME}\n`);
  
  try {
    // Generate all data
    console.log('📦 Generating data...');
    const nodes = generateNodes();
    const sensorData = generateSensorData();
    const scenarios = generateScenarios();
    const alerts = generateAlerts();
    
    console.log(`  - ${nodes.length} supply chain nodes`);
    console.log(`  - ${sensorData.length} sensor readings`);
    console.log(`  - ${scenarios.length} scenarios`);
    console.log(`  - ${alerts.length} alerts\n`);
    
    // Write to DynamoDB
    console.log('💾 Writing to DynamoDB...');
    await batchWriteItems([...nodes, ...sensorData, ...scenarios, ...alerts]);
    
    console.log('\n✅ Demo data seeded successfully!');
    console.log('\nSummary:');
    console.log(`  Total items: ${nodes.length + sensorData.length + scenarios.length + alerts.length}`);
    console.log(`  - Nodes: ${nodes.length}`);
    console.log(`  - Sensor Data: ${sensorData.length}`);
    console.log(`  - Scenarios: ${scenarios.length}`);
    console.log(`  - Alerts: ${alerts.length}`);
    
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { generateNodes, generateSensorData, generateScenarios, generateAlerts };
