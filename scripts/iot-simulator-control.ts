#!/usr/bin/env ts-node
/**
 * IoT Simulator Control Script
 * 
 * Command-line interface for controlling the IoT simulator
 * 
 * Usage:
 *   npm run iot-simulator start [options]
 *   npm run iot-simulator stop
 *   npm run iot-simulator status
 *   npm run iot-simulator inject-anomaly <nodeId> <sensorType>
 * 
 * Options:
 *   --interval <ms>        Data generation interval in milliseconds (default: 5000)
 *   --anomaly-rate <0-1>   Probability of anomaly (default: 0.05)
 *   --sensors <types>      Comma-separated sensor types (default: temperature,delay,inventory)
 *   --nodes <ids>          Comma-separated node IDs (default: all demo nodes)
 * 
 * Requirements: 2.1
 */

import { IoTSimulator, SimulatorConfig, SensorType, NODE_LOCATIONS } from './iot-simulator';
import fs from 'fs';
import path from 'path';

// State file to track running simulator
const STATE_FILE = path.join(__dirname, '.iot-simulator-state.json');

interface SimulatorState {
  isRunning: boolean;
  pid: number;
  startedAt: string;
  config: SimulatorConfig;
}

/**
 * Parse command line arguments
 */
function parseArgs(): { command: string; options: any } {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const options: any = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const value = args[i + 1];
      options[key] = value;
      i++; // Skip next arg as it's the value
    } else {
      // Positional arguments
      if (!options.positional) options.positional = [];
      options.positional.push(arg);
    }
  }

  return { command, options };
}

/**
 * Load simulator state from file
 */
function loadState(): SimulatorState | null {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load state:', error);
  }
  return null;
}

/**
 * Save simulator state to file
 */
function saveState(state: SimulatorState): void {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

/**
 * Clear simulator state
 */
function clearState(): void {
  try {
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE);
    }
  } catch (error) {
    console.error('Failed to clear state:', error);
  }
}

/**
 * Build simulator configuration from options
 */
function buildConfig(options: any): SimulatorConfig {
  // Parse interval
  const interval = options.interval 
    ? parseInt(options.interval, 10) 
    : 5000;

  // Parse anomaly rate
  const anomalyRate = options['anomaly-rate']
    ? parseFloat(options['anomaly-rate'])
    : 0.05;

  // Parse sensor types
  const sensors = options.sensors
    ? options.sensors.split(',').map((s: string) => s.trim() as SensorType)
    : ['temperature', 'delay', 'inventory'] as SensorType[];

  // Parse node IDs
  const nodes = options.nodes
    ? options.nodes.split(',').map((n: string) => n.trim())
    : NODE_LOCATIONS.map(loc => loc.nodeId);

  return {
    dataGenerationIntervalMs: interval,
    anomalyProbability: anomalyRate,
    enabledSensorTypes: sensors,
    nodeIds: nodes
  };
}

/**
 * Start command
 */
async function startCommand(options: any): Promise<void> {
  console.log('🚀 IoT Simulator Control - START\n');

  // Check if already running
  const state = loadState();
  if (state?.isRunning) {
    console.log('⚠️  Simulator is already running');
    console.log(`   Started at: ${state.startedAt}`);
    console.log(`   PID: ${state.pid}`);
    console.log('\n💡 Use "npm run iot-simulator stop" to stop it first\n');
    return;
  }

  // Build configuration
  const config = buildConfig(options);

  // Validate configuration
  if (config.dataGenerationIntervalMs < 1000) {
    console.error('❌ Error: Interval must be at least 1000ms');
    process.exit(1);
  }

  if (config.anomalyProbability < 0 || config.anomalyProbability > 1) {
    console.error('❌ Error: Anomaly rate must be between 0 and 1');
    process.exit(1);
  }

  // Create and start simulator
  const simulator = new IoTSimulator(config);
  
  try {
    await simulator.start();

    // Save state
    saveState({
      isRunning: true,
      pid: process.pid,
      startedAt: new Date().toISOString(),
      config
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Received SIGINT, shutting down...');
      simulator.stop();
      clearState();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n🛑 Received SIGTERM, shutting down...');
      simulator.stop();
      clearState();
      process.exit(0);
    });

    // Keep process running
    console.log('💡 Press Ctrl+C to stop the simulator\n');
    
    // Prevent process from exiting
    await new Promise(() => {});
  } catch (error) {
    console.error('❌ Failed to start simulator:', error);
    clearState();
    process.exit(1);
  }
}

/**
 * Stop command
 */
function stopCommand(): void {
  console.log('🛑 IoT Simulator Control - STOP\n');

  const state = loadState();
  
  if (!state?.isRunning) {
    console.log('⚠️  Simulator is not running\n');
    return;
  }

  try {
    // Try to kill the process
    if (state && state.pid) {
      process.kill(state.pid, 'SIGTERM');
      console.log(`✅ Sent stop signal to simulator (PID: ${state.pid})`);
    }
    
    // Clear state
    clearState();
    console.log('✅ Simulator stopped\n');
  } catch (error) {
    console.error('❌ Failed to stop simulator:', error);
    console.log('💡 The process may have already stopped. Clearing state...');
    clearState();
  }
}

/**
 * Status command
 */
function statusCommand(): void {
  console.log('📊 IoT Simulator Control - STATUS\n');

  const state = loadState();

  if (!state?.isRunning) {
    console.log('Status: ⭕ Not Running\n');
    return;
  }

  console.log('Status: ✅ Running');
  console.log(`Started: ${new Date(state.startedAt).toLocaleString()}`);
  console.log(`PID: ${state.pid}`);
  console.log('\nConfiguration:');
  console.log(`  Interval: ${state.config.dataGenerationIntervalMs}ms`);
  console.log(`  Anomaly Rate: ${(state.config.anomalyProbability * 100).toFixed(1)}%`);
  console.log(`  Sensors: ${state.config.enabledSensorTypes.join(', ')}`);
  console.log(`  Nodes: ${state.config.nodeIds.length} nodes`);
  console.log('\nNode Locations:');
  
  NODE_LOCATIONS.forEach(loc => {
    const isEnabled = state.config.nodeIds.includes(loc.nodeId);
    const status = isEnabled ? '✅' : '⭕';
    console.log(`  ${status} ${loc.name} (${loc.nodeId})`);
    console.log(`     📍 ${loc.location.city}, ${loc.location.country}`);
  });
  
  console.log('');
}

/**
 * Inject anomaly command
 */
async function injectAnomalyCommand(options: any): Promise<void> {
  console.log('💥 IoT Simulator Control - INJECT ANOMALY\n');

  const state = loadState();
  
  if (!state?.isRunning) {
    console.log('❌ Error: Simulator is not running');
    console.log('💡 Start the simulator first with "npm run iot-simulator start"\n');
    process.exit(1);
  }

  const positional = options.positional || [];
  const nodeId = positional[0];
  const sensorType = positional[1] as SensorType;

  if (!nodeId || !sensorType) {
    console.log('❌ Error: Missing arguments');
    console.log('Usage: npm run iot-simulator inject-anomaly <nodeId> <sensorType>');
    console.log('\nAvailable sensor types: temperature, delay, inventory');
    console.log('\nAvailable nodes:');
    NODE_LOCATIONS.forEach(loc => {
      console.log(`  - ${loc.nodeId} (${loc.name})`);
    });
    console.log('');
    process.exit(1);
  }

  // Validate sensor type
  if (!['temperature', 'delay', 'inventory'].includes(sensorType)) {
    console.log(`❌ Error: Invalid sensor type "${sensorType}"`);
    console.log('Valid types: temperature, delay, inventory\n');
    process.exit(1);
  }

  // Validate node ID
  const nodeExists = NODE_LOCATIONS.some(loc => loc.nodeId === nodeId);
  if (!nodeExists) {
    console.log(`❌ Error: Unknown node ID "${nodeId}"`);
    console.log('\nAvailable nodes:');
    NODE_LOCATIONS.forEach(loc => {
      console.log(`  - ${loc.nodeId} (${loc.name})`);
    });
    console.log('');
    process.exit(1);
  }

  // Create simulator instance and inject anomaly
  const simulator = new IoTSimulator(state.config);
  
  try {
    await simulator.injectAnomaly(nodeId, sensorType);
    console.log('✅ Anomaly injected successfully\n');
  } catch (error) {
    console.error('❌ Failed to inject anomaly:', error);
    process.exit(1);
  }
}

/**
 * Help command
 */
function helpCommand(): void {
  console.log(`
🤖 IoT Simulator Control - Help

USAGE:
  npm run iot-simulator <command> [options]

COMMANDS:
  start                Start the IoT simulator
  stop                 Stop the running simulator
  status               Show simulator status
  inject-anomaly       Inject an anomaly for testing
  help                 Show this help message

START OPTIONS:
  --interval <ms>           Data generation interval (default: 5000)
  --anomaly-rate <0-1>      Probability of anomaly (default: 0.05)
  --sensors <types>         Comma-separated sensor types (default: all)
  --nodes <ids>             Comma-separated node IDs (default: all)

EXAMPLES:
  # Start with default settings
  npm run iot-simulator start

  # Start with custom interval and higher anomaly rate
  npm run iot-simulator start -- --interval 3000 --anomaly-rate 0.15

  # Start with only temperature sensors
  npm run iot-simulator start -- --sensors temperature

  # Start for specific nodes
  npm run iot-simulator start -- --nodes node-supplier-001,node-warehouse-001

  # Check status
  npm run iot-simulator status

  # Inject a temperature anomaly
  npm run iot-simulator inject-anomaly node-supplier-001 temperature

  # Stop the simulator
  npm run iot-simulator stop

SENSOR TYPES:
  - temperature    Temperature sensors (18-25°C normal, >30°C critical)
  - delay          Shipment delay sensors (0-2h normal, >24h critical)
  - inventory      Inventory level sensors (100-1000 units normal, <75 critical)

DEMO NODES:
  - node-supplier-001      Shanghai Manufacturing Hub
  - node-supplier-002      Shenzhen Electronics Supplier
  - node-warehouse-001     Singapore Distribution Center
  - node-warehouse-002     Los Angeles Port Warehouse
  - node-retailer-001      New York Distribution Hub
  - node-retailer-002      London Fulfillment Center

For more information, see: scripts/README_DEMO_SETUP.md
`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const { command, options } = parseArgs();

  try {
    switch (command) {
      case 'start':
        await startCommand(options);
        break;
      case 'stop':
        stopCommand();
        break;
      case 'status':
        statusCommand();
        break;
      case 'inject-anomaly':
        await injectAnomalyCommand(options);
        break;
      case 'help':
      default:
        helpCommand();
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main };
