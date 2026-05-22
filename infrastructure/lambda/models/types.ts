/**
 * Core domain entity types for OmniTrack AI
 */

export interface User {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SUPPLY_CHAIN_DIRECTOR = 'SUPPLY_CHAIN_DIRECTOR',
  OPERATIONS_MANAGER = 'OPERATIONS_MANAGER',
  SUSTAINABILITY_OFFICER = 'SUSTAINABILITY_OFFICER',
  VIEWER = 'VIEWER'
}

export interface UserPreferences {
  notificationChannels: NotificationChannel[];
  prioritizeSustainability: boolean;
  prioritizeCost: boolean;
  prioritizeRisk: boolean;
  defaultView: string;
  maxCostImpact?: number;
  minRiskReduction?: number;
  maxSustainabilityImpact?: number;
}

export enum NotificationChannel {
  SLACK = 'SLACK',
  TEAMS = 'TEAMS',
  EMAIL = 'EMAIL',
  MOBILE = 'MOBILE',
  SMS = 'SMS'
}

export interface Node {
  nodeId: string;
  type: NodeType;
  location: Location;
  capacity: number;
  status: NodeStatus;
  connections: string[]; // Array of connected node IDs
  metrics: NodeMetrics;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export enum NodeType {
  SUPPLIER = 'SUPPLIER',
  MANUFACTURER = 'MANUFACTURER',
  WAREHOUSE = 'WAREHOUSE',
  DISTRIBUTION_CENTER = 'DISTRIBUTION_CENTER',
  RETAILER = 'RETAILER',
  TRANSPORT_HUB = 'TRANSPORT_HUB'
}

export enum NodeStatus {
  OPERATIONAL = 'OPERATIONAL',
  DEGRADED = 'DEGRADED',
  DISRUPTED = 'DISRUPTED',
  OFFLINE = 'OFFLINE'
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
}

export interface NodeMetrics {
  currentInventory: number;
  utilizationRate: number;
  lastUpdateTimestamp: string;
  lastUpdateSource?: string;
}

export interface Scenario {
  scenarioId: string;
  type: DisruptionType;
  parameters: ScenarioParameters;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  marketplaceMetadata?: MarketplaceMetadata;
  version: number;
}

export enum DisruptionType {
  NATURAL_DISASTER = 'NATURAL_DISASTER',
  SUPPLIER_FAILURE = 'SUPPLIER_FAILURE',
  TRANSPORTATION_DELAY = 'TRANSPORTATION_DELAY',
  DEMAND_SPIKE = 'DEMAND_SPIKE',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  GEOPOLITICAL = 'GEOPOLITICAL',
  CYBER_ATTACK = 'CYBER_ATTACK',
  LABOR_SHORTAGE = 'LABOR_SHORTAGE'
}

export interface ScenarioParameters {
  location: Location;
  severity: Severity;
  duration: number; // in hours
  affectedNodes: string[];
  customParameters?: Record<string, any>;
}

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface MarketplaceMetadata {
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

export interface ScenarioResult {
  scenarioId: string;
  timestamp: string;
  impacts: ImpactAnalysis;
  strategies: MitigationStrategy[];
  confidence: number;
  executionTime: number; // in milliseconds
  decisionTree: DecisionTree;
  naturalLanguageSummary: string;
}

export interface ImpactAnalysis {
  costImpact: number;
  deliveryTimeImpact: number; // in hours
  inventoryImpact: number;
  sustainabilityImpact?: SustainabilityMetrics;
}

export interface SustainabilityMetrics {
  carbonFootprint: number; // in kg CO2
  emissionsByRoute: Record<string, number>;
  sustainabilityScore: number; // 0-100
}

export interface MitigationStrategy {
  strategyId: string;
  name: string;
  description: string;
  costImpact: number;
  riskReduction: number;
  sustainabilityImpact: number;
  implementationTime: number; // in hours
  tradeoffs: string[];
}

export interface DecisionTree {
  nodes: DecisionNode[];
  edges: DecisionEdge[];
}

export interface DecisionNode {
  nodeId: string;
  label: string;
  type: 'decision' | 'outcome' | 'condition';
  agentAttribution?: string;
  confidence?: number;
}

export interface DecisionEdge {
  from: string;
  to: string;
  label: string;
}

export interface Alert {
  alertId: string;
  type: AlertType;
  severity: Severity;
  nodeId: string;
  status: AlertStatus;
  message: string;
  createdAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  metadata: AlertMetadata;
  version: number;
}

export enum AlertType {
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
  THRESHOLD_EXCEEDED = 'THRESHOLD_EXCEEDED',
  DISRUPTION_PREDICTED = 'DISRUPTION_PREDICTED',
  SUSTAINABILITY_THRESHOLD = 'SUSTAINABILITY_THRESHOLD',
  INTEGRATION_FAILURE = 'INTEGRATION_FAILURE',
  SECURITY_ALERT = 'SECURITY_ALERT'
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

export interface AlertMetadata {
  priority: number; // 1-10, higher is more urgent
  affectedNodes: string[];
  estimatedImpact: string;
  recommendedActions: string[];
}

export interface Feedback {
  feedbackId: string;
  scenarioId: string;
  userId: string;
  actualOutcome: string;
  accuracy: number; // 1-5 rating
  comments: string;
  timestamp: string;
  metadata: Record<string, any>;
}

/**
 * DynamoDB item structure for single-table design
 */
export interface DynamoDBItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  [key: string]: any;
}

/**
 * Audit log entry for versioned change tracking
 */
export interface AuditLog {
  auditId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId: string;
  timestamp: string;
  changes: ChangeRecord[];
  version: number;
  metadata: Record<string, any>;
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ACCESS = 'ACCESS'
}

export interface ChangeRecord {
  field: string;
  oldValue: any;
  newValue: any;
}

/**
 * Negotiation result from cross-agent negotiation
 */
export interface NegotiationResult {
  balancedStrategies: MitigationStrategy[];
  tradeoffVisualizations: any[];
  conflictEscalation?: ConflictEscalation;
  negotiationParameters: any;
}

/**
 * Conflict escalation when agents cannot reach consensus
 */
export interface ConflictEscalation {
  reason: string;
  conflictingObjectives: string[];
  explanation: string;
  requiresUserInput: boolean;
}
