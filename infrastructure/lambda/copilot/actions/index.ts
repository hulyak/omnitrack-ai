/**
 * Action Registry Initialization
 * 
 * Exports all copilot actions and provides a function to register them.
 */

import { actionRegistry } from '../action-registry';
import {
  addSupplierAction,
  addManufacturerAction,
  addWarehouseAction,
  addDistributorAction,
  addRetailerAction,
  removeNodeAction
} from './node-actions';
import {
  connectNodesAction,
  disconnectNodesAction,
  updateNodeAction,
  optimizeLayoutAction
} from './connection-actions';
import {
  setRegionAction,
  setIndustryAction,
  setCurrencyAction,
  addShippingMethodAction,
  setRiskProfileAction
} from './config-actions';
import {
  scanAnomaliesAction,
  identifyRisksAction,
  findBottlenecksAction,
  calculateUtilizationAction
} from './analysis-actions';
import {
  runSimulationAction,
  whatIfPortClosureAction,
  whatIfSupplierFailureAction,
  whatIfDemandSpikeAction
} from './simulation-actions';
import {
  getNodeDetailsAction,
  getNetworkSummaryAction,
  getRecentAlertsAction,
  helpAction
} from './query-actions';

/**
 * All available build actions
 */
export const buildActions = [
  // Node management actions
  addSupplierAction,
  addManufacturerAction,
  addWarehouseAction,
  addDistributorAction,
  addRetailerAction,
  removeNodeAction,
  
  // Connection management actions
  connectNodesAction,
  disconnectNodesAction,
  updateNodeAction,
  optimizeLayoutAction
];

/**
 * All available configuration actions
 */
export const configActions = [
  setRegionAction,
  setIndustryAction,
  setCurrencyAction,
  addShippingMethodAction,
  setRiskProfileAction
];

/**
 * All available analysis actions
 */
export const analysisActions = [
  scanAnomaliesAction,
  identifyRisksAction,
  findBottlenecksAction,
  calculateUtilizationAction
];

/**
 * All available simulation actions
 */
export const simulationActions = [
  runSimulationAction,
  whatIfPortClosureAction,
  whatIfSupplierFailureAction,
  whatIfDemandSpikeAction
];

/**
 * All available query actions
 */
export const queryActions = [
  getNodeDetailsAction,
  getNetworkSummaryAction,
  getRecentAlertsAction,
  helpAction
];

/**
 * Register all build actions with the action registry
 */
export function registerBuildActions(): void {
  buildActions.forEach(action => {
    actionRegistry.register(action);
  });
}

/**
 * Register all configuration actions with the action registry
 */
export function registerConfigActions(): void {
  configActions.forEach(action => {
    actionRegistry.register(action);
  });
}

/**
 * Register all analysis actions with the action registry
 */
export function registerAnalysisActions(): void {
  analysisActions.forEach(action => {
    actionRegistry.register(action);
  });
}

/**
 * Register all simulation actions with the action registry
 */
export function registerSimulationActions(): void {
  simulationActions.forEach(action => {
    actionRegistry.register(action);
  });
}

/**
 * Register all query actions with the action registry
 */
export function registerQueryActions(): void {
  queryActions.forEach(action => {
    actionRegistry.register(action);
  });
}

/**
 * Register all actions
 */
export function registerAllActions(): void {
  registerBuildActions();
  registerConfigActions();
  registerAnalysisActions();
  registerSimulationActions();
  registerQueryActions();
}

/**
 * Export individual actions for testing
 */
export {
  // Node actions
  addSupplierAction,
  addManufacturerAction,
  addWarehouseAction,
  addDistributorAction,
  addRetailerAction,
  removeNodeAction,
  
  // Connection actions
  connectNodesAction,
  disconnectNodesAction,
  updateNodeAction,
  optimizeLayoutAction,
  
  // Configuration actions
  setRegionAction,
  setIndustryAction,
  setCurrencyAction,
  addShippingMethodAction,
  setRiskProfileAction,
  
  // Analysis actions
  scanAnomaliesAction,
  identifyRisksAction,
  findBottlenecksAction,
  calculateUtilizationAction,
  
  // Simulation actions
  runSimulationAction,
  whatIfPortClosureAction,
  whatIfSupplierFailureAction,
  whatIfDemandSpikeAction,
  
  // Query actions
  getNodeDetailsAction,
  getNetworkSummaryAction,
  getRecentAlertsAction,
  helpAction
};
