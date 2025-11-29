/**
 * CloudWatch Alarms for AI Copilot
 * 
 * Creates alarms for monitoring copilot health and performance:
 * - High error rate
 * - Slow response times
 * - High token usage
 * 
 * Requirements: 9.4 - CloudWatch alarms for copilot
 */

import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface CopilotAlarmsProps {
  /**
   * Lambda function to monitor
   */
  copilotFunction: lambda.Function;

  /**
   * SNS topic for critical alerts
   */
  criticalAlertTopic: sns.ITopic;

  /**
   * SNS topic for warning alerts
   */
  warningAlertTopic: sns.ITopic;

  /**
   * Environment name (e.g., 'production', 'staging')
   */
  environment: string;
}

/**
 * Copilot CloudWatch Alarms Construct
 * 
 * Creates comprehensive alarms for monitoring AI Copilot health and performance.
 */
export class CopilotAlarms extends Construct {
  public readonly errorRateAlarm: cloudwatch.Alarm;
  public readonly responseTimeAlarm: cloudwatch.Alarm;
  public readonly tokenUsageAlarm: cloudwatch.Alarm;
  public readonly lambdaErrorAlarm: cloudwatch.Alarm;
  public readonly lambdaThrottleAlarm: cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: CopilotAlarmsProps) {
    super(scope, id);

    // Metric namespace for copilot
    const namespace = 'OmniTrack/Copilot';

    // 1. High Error Rate Alarm
    // Alert when error rate exceeds 5%
    // Requirements: 9.4 - Alert on high error rate
    const errorRateMetric = new cloudwatch.MathExpression({
      expression: 'errors / requests * 100',
      usingMetrics: {
        errors: new cloudwatch.Metric({
          namespace,
          metricName: 'Errors',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          dimensionsMap: {
            Environment: props.environment,
            Component: 'copilot',
          },
        }),
        requests: new cloudwatch.Metric({
          namespace,
          metricName: 'MessagesReceived',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          dimensionsMap: {
            Environment: props.environment,
            Component: 'copilot',
          },
        }),
      },
      label: 'Error Rate (%)',
    });

    this.errorRateAlarm = new cloudwatch.Alarm(this, 'CopilotErrorRateAlarm', {
      alarmName: `${props.environment}-Copilot-High-Error-Rate`,
      alarmDescription: 'Copilot error rate exceeds 5%',
      metric: errorRateMetric,
      threshold: 5,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    this.errorRateAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(props.criticalAlertTopic)
    );

    // 2. Slow Response Time Alarm
    // Alert when p95 response time exceeds 2 seconds
    // Requirements: 9.4 - Alert on slow response times
    const responseTimeMetric = new cloudwatch.Metric({
      namespace,
      metricName: 'ResponseTime',
      statistic: 'p95',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        Environment: props.environment,
        Component: 'copilot',
      },
    });

    this.responseTimeAlarm = new cloudwatch.Alarm(this, 'CopilotResponseTimeAlarm', {
      alarmName: `${props.environment}-Copilot-Slow-Response-Time`,
      alarmDescription: 'Copilot p95 response time exceeds 2 seconds',
      metric: responseTimeMetric,
      threshold: 2000, // 2 seconds in milliseconds
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    this.responseTimeAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(props.warningAlertTopic)
    );

    // 3. High Token Usage Alarm
    // Alert when token usage exceeds 80% of expected daily limit
    // Requirements: 9.4 - Alert on high token usage
    const tokenUsageMetric = new cloudwatch.Metric({
      namespace,
      metricName: 'BedrockTokensUsed',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      dimensionsMap: {
        Environment: props.environment,
        Component: 'copilot',
      },
    });

    // Assuming 1M tokens per day limit, that's ~41,667 tokens per hour
    // Alert at 80% = ~33,333 tokens per hour
    this.tokenUsageAlarm = new cloudwatch.Alarm(this, 'CopilotTokenUsageAlarm', {
      alarmName: `${props.environment}-Copilot-High-Token-Usage`,
      alarmDescription: 'Copilot token usage exceeds 80% of hourly limit',
      metric: tokenUsageMetric,
      threshold: 33333,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    this.tokenUsageAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(props.warningAlertTopic)
    );

    // 4. Lambda Function Error Alarm
    // Alert when Lambda function errors exceed threshold
    const lambdaErrorMetric = props.copilotFunction.metricErrors({
      period: cdk.Duration.minutes(5),
      statistic: 'Sum',
    });

    this.lambdaErrorAlarm = new cloudwatch.Alarm(this, 'CopilotLambdaErrorAlarm', {
      alarmName: `${props.environment}-Copilot-Lambda-Errors`,
      alarmDescription: 'Copilot Lambda function errors exceed threshold',
      metric: lambdaErrorMetric,
      threshold: 5,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    this.lambdaErrorAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(props.criticalAlertTopic)
    );

    // 5. Lambda Function Throttle Alarm
    // Alert when Lambda function is throttled
    const lambdaThrottleMetric = props.copilotFunction.metricThrottles({
      period: cdk.Duration.minutes(5),
      statistic: 'Sum',
    });

    this.lambdaThrottleAlarm = new cloudwatch.Alarm(this, 'CopilotLambdaThrottleAlarm', {
      alarmName: `${props.environment}-Copilot-Lambda-Throttles`,
      alarmDescription: 'Copilot Lambda function is being throttled',
      metric: lambdaThrottleMetric,
      threshold: 5,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    this.lambdaThrottleAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(props.warningAlertTopic)
    );

    // Additional alarms for specific metrics

    // 6. Low Confidence Classification Alarm
    // Alert when too many classifications have low confidence
    const lowConfidenceMetric = new cloudwatch.Metric({
      namespace,
      metricName: 'LowConfidenceClassifications',
      statistic: 'Sum',
      period: cdk.Duration.minutes(15),
      dimensionsMap: {
        Environment: props.environment,
        Component: 'copilot',
      },
    });

    const lowConfidenceAlarm = new cloudwatch.Alarm(this, 'CopilotLowConfidenceAlarm', {
      alarmName: `${props.environment}-Copilot-Low-Confidence-Classifications`,
      alarmDescription: 'Too many low confidence intent classifications',
      metric: lowConfidenceMetric,
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    lowConfidenceAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(props.warningAlertTopic)
    );

    // 7. Action Failure Rate Alarm
    // Alert when action failure rate is high
    const actionFailureRateMetric = new cloudwatch.MathExpression({
      expression: 'failures / total * 100',
      usingMetrics: {
        failures: new cloudwatch.Metric({
          namespace,
          metricName: 'ActionFailures',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          dimensionsMap: {
            Environment: props.environment,
            Component: 'copilot',
          },
        }),
        total: new cloudwatch.Metric({
          namespace,
          metricName: 'ActionExecutionCount',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          dimensionsMap: {
            Environment: props.environment,
            Component: 'copilot',
          },
        }),
      },
      label: 'Action Failure Rate (%)',
    });

    const actionFailureAlarm = new cloudwatch.Alarm(this, 'CopilotActionFailureAlarm', {
      alarmName: `${props.environment}-Copilot-High-Action-Failure-Rate`,
      alarmDescription: 'Copilot action failure rate exceeds 10%',
      metric: actionFailureRateMetric,
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    actionFailureAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(props.warningAlertTopic)
    );

    // 8. Streaming Interruption Alarm
    // Alert when too many streaming responses are interrupted
    const streamingInterruptionMetric = new cloudwatch.Metric({
      namespace,
      metricName: 'StreamingResponsesInterrupted',
      statistic: 'Sum',
      period: cdk.Duration.minutes(10),
      dimensionsMap: {
        Environment: props.environment,
        Component: 'copilot',
      },
    });

    const streamingInterruptionAlarm = new cloudwatch.Alarm(this, 'CopilotStreamingInterruptionAlarm', {
      alarmName: `${props.environment}-Copilot-Streaming-Interruptions`,
      alarmDescription: 'Too many streaming responses are being interrupted',
      metric: streamingInterruptionMetric,
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    streamingInterruptionAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(props.warningAlertTopic)
    );

    // Tag all alarms
    cdk.Tags.of(this).add('Component', 'Copilot');
    cdk.Tags.of(this).add('Environment', props.environment);
  }

  /**
   * Create a composite alarm for overall copilot health
   */
  public createCompositeHealthAlarm(
    criticalAlertTopic: sns.ITopic,
    environment: string
  ): cloudwatch.CompositeAlarm {
    const compositeAlarm = new cloudwatch.CompositeAlarm(this, 'CopilotHealthAlarm', {
      compositeAlarmName: `${environment}-Copilot-Health-Composite`,
      alarmDescription: 'Composite alarm for overall copilot health',
      alarmRule: cloudwatch.AlarmRule.anyOf(
        cloudwatch.AlarmRule.fromAlarm(this.errorRateAlarm, cloudwatch.AlarmState.ALARM),
        cloudwatch.AlarmRule.fromAlarm(this.lambdaErrorAlarm, cloudwatch.AlarmState.ALARM),
        cloudwatch.AlarmRule.fromAlarm(this.lambdaThrottleAlarm, cloudwatch.AlarmState.ALARM)
      ),
    });

    compositeAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(criticalAlertTopic)
    );

    return compositeAlarm;
  }
}
