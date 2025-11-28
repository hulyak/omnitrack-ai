/**
 * CloudWatch Metrics Utility for OmniTrack Lambda Functions
 * 
 * Provides utilities for publishing custom CloudWatch metrics
 * for business KPIs and operational metrics.
 */

import { CloudWatch } from 'aws-sdk';

const cloudwatch = new CloudWatch();

export enum MetricUnit {
  SECONDS = 'Seconds',
  MICROSECONDS = 'Microseconds',
  MILLISECONDS = 'Milliseconds',
  BYTES = 'Bytes',
  KILOBYTES = 'Kilobytes',
  MEGABYTES = 'Megabytes',
  GIGABYTES = 'Gigabytes',
  TERABYTES = 'Terabytes',
  BITS = 'Bits',
  KILOBITS = 'Kilobits',
  MEGABITS = 'Megabits',
  GIGABITS = 'Gigabits',
  TERABITS = 'Terabits',
  PERCENT = 'Percent',
  COUNT = 'Count',
  BYTES_PER_SECOND = 'Bytes/Second',
  KILOBYTES_PER_SECOND = 'Kilobytes/Second',
  MEGABYTES_PER_SECOND = 'Megabytes/Second',
  GIGABYTES_PER_SECOND = 'Gigabytes/Second',
  TERABYTES_PER_SECOND = 'Terabytes/Second',
  BITS_PER_SECOND = 'Bits/Second',
  KILOBITS_PER_SECOND = 'Kilobits/Second',
  MEGABITS_PER_SECOND = 'Megabits/Second',
  GIGABITS_PER_SECOND = 'Gigabits/Second',
  TERABITS_PER_SECOND = 'Terabits/Second',
  COUNT_PER_SECOND = 'Count/Second',
  NONE = 'None',
}

export interface MetricDimension {
  Name: string;
  Value: string;
}

export interface MetricData {
  MetricName: string;
  Value: number;
  Unit: MetricUnit;
  Timestamp?: Date;
  Dimensions?: MetricDimension[];
}

export class MetricsPublisher {
  private namespace: string;
  private defaultDimensions: MetricDimension[];

  constructor(namespace: string = 'OmniTrack', defaultDimensions: MetricDimension[] = []) {
    this.namespace = namespace;
    this.defaultDimensions = defaultDimensions;
  }

  /**
   * Publish a single metric to CloudWatch
   */
  async publishMetric(
    metricName: string,
    value: number,
    unit: MetricUnit = MetricUnit.COUNT,
    dimensions: MetricDimension[] = []
  ): Promise<void> {
    const allDimensions = [...this.defaultDimensions, ...dimensions];

    const params: CloudWatch.PutMetricDataInput = {
      Namespace: this.namespace,
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
          Dimensions: allDimensions.length > 0 ? allDimensions : undefined,
        },
      ],
    };

    try {
      await cloudwatch.putMetricData(params).promise();
    } catch (error) {
      console.error('Failed to publish metric:', error);
      // Don't throw - metrics publishing should not break application flow
    }
  }

  /**
   * Publish multiple metrics in a single API call
   */
  async publishMetrics(metrics: MetricData[]): Promise<void> {
    const metricData = metrics.map((metric) => ({
      MetricName: metric.MetricName,
      Value: metric.Value,
      Unit: metric.Unit,
      Timestamp: metric.Timestamp || new Date(),
      Dimensions: metric.Dimensions
        ? [...this.defaultDimensions, ...metric.Dimensions]
        : this.defaultDimensions.length > 0
        ? this.defaultDimensions
        : undefined,
    }));

    const params: CloudWatch.PutMetricDataInput = {
      Namespace: this.namespace,
      MetricData: metricData,
    };

    try {
      await cloudwatch.putMetricData(params).promise();
    } catch (error) {
      console.error('Failed to publish metrics:', error);
      // Don't throw - metrics publishing should not break application flow
    }
  }

  /**
   * Publish simulation execution time
   */
  async publishSimulationDuration(scenarioType: string, duration: number): Promise<void> {
    await this.publishMetric('SimulationDuration', duration, MetricUnit.MILLISECONDS, [
      { Name: 'ScenarioType', Value: scenarioType },
    ]);
  }

  /**
   * Publish alert generation count
   */
  async publishAlertGenerated(alertType: string, severity: string): Promise<void> {
    await this.publishMetric('AlertsGenerated', 1, MetricUnit.COUNT, [
      { Name: 'AlertType', Value: alertType },
      { Name: 'Severity', Value: severity },
    ]);
  }

  /**
   * Publish digital twin update latency
   */
  async publishDigitalTwinUpdateLatency(duration: number): Promise<void> {
    await this.publishMetric('DigitalTwinUpdateLatency', duration, MetricUnit.MILLISECONDS);
  }

  /**
   * Publish agent execution metrics
   */
  async publishAgentExecution(
    agentName: string,
    duration: number,
    success: boolean
  ): Promise<void> {
    await this.publishMetrics([
      {
        MetricName: 'AgentExecutionDuration',
        Value: duration,
        Unit: MetricUnit.MILLISECONDS,
        Dimensions: [
          { Name: 'AgentName', Value: agentName },
          { Name: 'Success', Value: success.toString() },
        ],
      },
      {
        MetricName: 'AgentExecutionCount',
        Value: 1,
        Unit: MetricUnit.COUNT,
        Dimensions: [
          { Name: 'AgentName', Value: agentName },
          { Name: 'Success', Value: success.toString() },
        ],
      },
    ]);
  }

  /**
   * Publish marketplace scenario metrics
   */
  async publishMarketplaceActivity(activityType: string): Promise<void> {
    await this.publishMetric('MarketplaceActivity', 1, MetricUnit.COUNT, [
      { Name: 'ActivityType', Value: activityType },
    ]);
  }

  /**
   * Publish sustainability calculation metrics
   */
  async publishSustainabilityCalculation(duration: number): Promise<void> {
    await this.publishMetric('SustainabilityCalculationDuration', duration, MetricUnit.MILLISECONDS);
  }

  /**
   * Publish cache hit/miss metrics
   */
  async publishCacheMetric(hit: boolean): Promise<void> {
    await this.publishMetric('CacheHitRate', 1, MetricUnit.COUNT, [
      { Name: 'Result', Value: hit ? 'Hit' : 'Miss' },
    ]);
  }

  /**
   * Publish IoT data processing metrics
   */
  async publishIoTDataProcessed(sensorType: string, dataPoints: number): Promise<void> {
    await this.publishMetric('IoTDataPointsProcessed', dataPoints, MetricUnit.COUNT, [
      { Name: 'SensorType', Value: sensorType },
    ]);
  }

  /**
   * Publish negotiation metrics
   */
  async publishNegotiationMetrics(
    duration: number,
    strategiesGenerated: number,
    consensusReached: boolean
  ): Promise<void> {
    await this.publishMetrics([
      {
        MetricName: 'NegotiationDuration',
        Value: duration,
        Unit: MetricUnit.MILLISECONDS,
      },
      {
        MetricName: 'StrategiesGenerated',
        Value: strategiesGenerated,
        Unit: MetricUnit.COUNT,
      },
      {
        MetricName: 'ConsensusReached',
        Value: consensusReached ? 1 : 0,
        Unit: MetricUnit.COUNT,
      },
    ]);
  }

  /**
   * Publish user feedback metrics
   */
  async publishFeedbackReceived(scenarioType: string, rating: number): Promise<void> {
    await this.publishMetrics([
      {
        MetricName: 'FeedbackReceived',
        Value: 1,
        Unit: MetricUnit.COUNT,
        Dimensions: [{ Name: 'ScenarioType', Value: scenarioType }],
      },
      {
        MetricName: 'FeedbackRating',
        Value: rating,
        Unit: MetricUnit.NONE,
        Dimensions: [{ Name: 'ScenarioType', Value: scenarioType }],
      },
    ]);
  }
}

/**
 * Default metrics publisher instance
 */
export const metricsPublisher = new MetricsPublisher('OmniTrack', [
  { Name: 'Environment', Value: process.env.ENVIRONMENT || 'production' },
]);
