/**
 * Notification Service - Multi-channel alert delivery
 * 
 * This service delivers alerts through multiple channels (Slack, Teams, email, mobile)
 * using Amazon SNS for fan-out and channel-specific Lambda functions for formatting.
 * 
 * Requirements: 1.2, 1.4, 3.4
 */

import { SNSEvent, Context } from 'aws-lambda';
import { AlertRepository } from '../repositories/alert-repository';
import { UserRepository } from '../repositories/user-repository';
import {
  Alert,
  NotificationChannel,
  User,
  AlertStatus
} from '../models/types';

// AWS SDK
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

// X-Ray SDK
const AWSXRay = require('aws-xray-sdk-core');

interface NotificationPayload {
  alertId: string;
  channels: NotificationChannel[];
  recipients: string[]; // User IDs
}

interface ChannelDeliveryResult {
  channel: NotificationChannel;
  success: boolean;
  error?: string;
}

/**
 * Structured logger with correlation ID support
 */
class Logger {
  private correlationId: string;
  private context: Context;

  constructor(correlationId: string, context: Context) {
    this.correlationId = correlationId;
    this.context = context;
  }

  private log(level: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      requestId: this.context.awsRequestId,
      functionName: this.context.functionName,
      ...data
    };
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  error(message: string, data?: any) {
    this.log('ERROR', message, data);
  }

  warn(message: string, data?: any) {
    this.log('WARNING', message, data);
  }

  debug(message: string, data?: any) {
    this.log('DEBUG', message, data);
  }
}

/**
 * Notification Service Lambda handler
 * Triggered by SNS when alerts are generated
 */
export const handler = async (
  event: SNSEvent,
  context: Context
): Promise<void> => {
  const correlationId = `notif-${Date.now()}`;
  const logger = new Logger(correlationId, context);

  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('NotificationService');
  subsegment?.addAnnotation('correlationId', correlationId);

  try {
    logger.info('Notification Service invoked', {
      recordCount: event.Records.length
    });

    const alertRepository = new AlertRepository();
    const userRepository = new UserRepository();

    for (const record of event.Records) {
      const message = JSON.parse(record.Sns.Message);
      const payload: NotificationPayload = message;

      logger.info('Processing notification', {
        alertId: payload.alertId,
        channels: payload.channels,
        recipientCount: payload.recipients.length
      });

      // Fetch alert details
      const alert = await alertRepository.getAlertById(payload.alertId);
      if (!alert) {
        logger.warn('Alert not found', { alertId: payload.alertId });
        continue;
      }

      // Fetch recipient details
      const recipients = await Promise.all(
        payload.recipients.map(userId => userRepository.getUserById(userId))
      );
      const validRecipients = recipients.filter((u): u is User => u !== null);

      logger.info('Recipients fetched', {
        validRecipients: validRecipients.length
      });

      // Deliver notifications to all channels
      const deliveryResults = await deliverNotifications(
        alert,
        validRecipients,
        payload.channels,
        logger
      );

      // Log delivery results
      const successCount = deliveryResults.filter(r => r.success).length;
      const failureCount = deliveryResults.length - successCount;

      logger.info('Notification delivery completed', {
        alertId: alert.alertId,
        successCount,
        failureCount,
        results: deliveryResults
      });

      // Update alert with notification status
      if (successCount > 0) {
        logger.debug('Notifications delivered successfully');
      }
    }

    subsegment?.close();

  } catch (error) {
    logger.error('Notification service failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    subsegment?.addError(error as Error);
    subsegment?.close();

    throw error;
  }
};

/**
 * Deliver notifications to all specified channels
 */
async function deliverNotifications(
  alert: Alert,
  recipients: User[],
  channels: NotificationChannel[],
  logger: Logger
): Promise<ChannelDeliveryResult[]> {
  const results: ChannelDeliveryResult[] = [];

  for (const channel of channels) {
    try {
      logger.info('Delivering to channel', { channel });

      switch (channel) {
        case NotificationChannel.SLACK:
          await deliverToSlack(alert, recipients, logger);
          results.push({ channel, success: true });
          break;

        case NotificationChannel.TEAMS:
          await deliverToTeams(alert, recipients, logger);
          results.push({ channel, success: true });
          break;

        case NotificationChannel.EMAIL:
          await deliverToEmail(alert, recipients, logger);
          results.push({ channel, success: true });
          break;

        case NotificationChannel.MOBILE:
          await deliverToMobile(alert, recipients, logger);
          results.push({ channel, success: true });
          break;

        case NotificationChannel.SMS:
          await deliverToSMS(alert, recipients, logger);
          results.push({ channel, success: true });
          break;

        default:
          logger.warn('Unknown notification channel', { channel });
          results.push({
            channel,
            success: false,
            error: 'Unknown channel'
          });
      }
    } catch (error) {
      logger.error('Channel delivery failed', {
        channel,
        error: error instanceof Error ? error.message : String(error)
      });

      results.push({
        channel,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Deliver notification to Slack
 */
async function deliverToSlack(
  alert: Alert,
  recipients: User[],
  logger: Logger
): Promise<void> {
  logger.info('Delivering to Slack', {
    alertId: alert.alertId,
    recipientCount: recipients.length
  });

  // Format Slack message
  const slackMessage = formatSlackMessage(alert);

  // In production, this would call Slack API
  // For now, we'll publish to an SNS topic that triggers Slack integration
  const topicArn = process.env.SLACK_TOPIC_ARN;
  if (!topicArn) {
    logger.warn('Slack topic ARN not configured');
    return;
  }

  await sns.publish({
    TopicArn: topicArn,
    Message: JSON.stringify(slackMessage),
    Subject: `Alert: ${alert.type}`
  }).promise();

  logger.info('Slack notification published');
}

/**
 * Deliver notification to Microsoft Teams
 */
async function deliverToTeams(
  alert: Alert,
  recipients: User[],
  logger: Logger
): Promise<void> {
  logger.info('Delivering to Teams', {
    alertId: alert.alertId,
    recipientCount: recipients.length
  });

  // Format Teams message
  const teamsMessage = formatTeamsMessage(alert);

  // In production, this would call Teams API
  const topicArn = process.env.TEAMS_TOPIC_ARN;
  if (!topicArn) {
    logger.warn('Teams topic ARN not configured');
    return;
  }

  await sns.publish({
    TopicArn: topicArn,
    Message: JSON.stringify(teamsMessage),
    Subject: `Alert: ${alert.type}`
  }).promise();

  logger.info('Teams notification published');
}

/**
 * Deliver notification via email
 */
async function deliverToEmail(
  alert: Alert,
  recipients: User[],
  logger: Logger
): Promise<void> {
  logger.info('Delivering to Email', {
    alertId: alert.alertId,
    recipientCount: recipients.length
  });

  const emailAddresses = recipients.map(r => r.email).filter(Boolean);

  if (emailAddresses.length === 0) {
    logger.warn('No email addresses found for recipients');
    return;
  }

  // Format email message
  const emailBody = formatEmailMessage(alert);

  // In production, this would use SES
  const topicArn = process.env.EMAIL_TOPIC_ARN;
  if (!topicArn) {
    logger.warn('Email topic ARN not configured');
    return;
  }

  await sns.publish({
    TopicArn: topicArn,
    Message: JSON.stringify({
      to: emailAddresses,
      subject: `OmniTrack Alert: ${alert.type}`,
      body: emailBody
    })
  }).promise();

  logger.info('Email notification published', {
    recipientCount: emailAddresses.length
  });
}

/**
 * Deliver notification to mobile devices
 */
async function deliverToMobile(
  alert: Alert,
  recipients: User[],
  logger: Logger
): Promise<void> {
  logger.info('Delivering to Mobile', {
    alertId: alert.alertId,
    recipientCount: recipients.length
  });

  // Format mobile push notification
  const pushMessage = formatMobilePushMessage(alert);

  // In production, this would use SNS mobile push or Firebase
  const topicArn = process.env.MOBILE_TOPIC_ARN;
  if (!topicArn) {
    logger.warn('Mobile topic ARN not configured');
    return;
  }

  await sns.publish({
    TopicArn: topicArn,
    Message: JSON.stringify(pushMessage),
    Subject: `Alert: ${alert.type}`
  }).promise();

  logger.info('Mobile notification published');
}

/**
 * Deliver notification via SMS
 */
async function deliverToSMS(
  alert: Alert,
  recipients: User[],
  logger: Logger
): Promise<void> {
  logger.info('Delivering to SMS', {
    alertId: alert.alertId,
    recipientCount: recipients.length
  });

  // Format SMS message (must be concise)
  const smsMessage = formatSMSMessage(alert);

  // In production, this would use SNS SMS
  const topicArn = process.env.SMS_TOPIC_ARN;
  if (!topicArn) {
    logger.warn('SMS topic ARN not configured');
    return;
  }

  await sns.publish({
    TopicArn: topicArn,
    Message: smsMessage,
    Subject: `Alert: ${alert.type}`
  }).promise();

  logger.info('SMS notification published');
}

/**
 * Format alert for Slack
 */
function formatSlackMessage(alert: Alert): any {
  const severityColors = {
    LOW: '#36a64f',
    MEDIUM: '#ff9900',
    HIGH: '#ff6600',
    CRITICAL: '#ff0000'
  };

  return {
    text: `*${alert.type}*`,
    attachments: [
      {
        color: severityColors[alert.severity],
        fields: [
          {
            title: 'Severity',
            value: alert.severity,
            short: true
          },
          {
            title: 'Node',
            value: alert.nodeId,
            short: true
          },
          {
            title: 'Message',
            value: alert.message,
            short: false
          },
          {
            title: 'Priority',
            value: alert.metadata.priority.toString(),
            short: true
          },
          {
            title: 'Estimated Impact',
            value: alert.metadata.estimatedImpact,
            short: false
          },
          {
            title: 'Recommended Actions',
            value: alert.metadata.recommendedActions.join('\n• '),
            short: false
          }
        ],
        footer: 'OmniTrack AI',
        ts: Math.floor(new Date(alert.createdAt).getTime() / 1000)
      }
    ]
  };
}

/**
 * Format alert for Microsoft Teams
 */
function formatTeamsMessage(alert: Alert): any {
  const severityColors = {
    LOW: '00FF00',
    MEDIUM: 'FFA500',
    HIGH: 'FF6600',
    CRITICAL: 'FF0000'
  };

  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: alert.message,
    themeColor: severityColors[alert.severity],
    title: alert.type,
    sections: [
      {
        facts: [
          { name: 'Severity', value: alert.severity },
          { name: 'Node', value: alert.nodeId },
          { name: 'Priority', value: alert.metadata.priority.toString() },
          { name: 'Estimated Impact', value: alert.metadata.estimatedImpact }
        ]
      },
      {
        title: 'Recommended Actions',
        text: alert.metadata.recommendedActions.map(a => `• ${a}`).join('\n')
      }
    ]
  };
}

/**
 * Format alert for email
 */
function formatEmailMessage(alert: Alert): string {
  return `
OmniTrack AI Alert

Type: ${alert.type}
Severity: ${alert.severity}
Priority: ${alert.metadata.priority}
Node: ${alert.nodeId}

Message:
${alert.message}

Estimated Impact:
${alert.metadata.estimatedImpact}

Recommended Actions:
${alert.metadata.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Affected Nodes:
${alert.metadata.affectedNodes.join(', ')}

Created: ${alert.createdAt}
Alert ID: ${alert.alertId}

---
This is an automated alert from OmniTrack AI Supply Chain Resilience Platform.
  `.trim();
}

/**
 * Format alert for mobile push notification
 */
function formatMobilePushMessage(alert: Alert): any {
  return {
    title: `${alert.severity} Alert: ${alert.type}`,
    body: alert.message,
    data: {
      alertId: alert.alertId,
      nodeId: alert.nodeId,
      severity: alert.severity,
      priority: alert.metadata.priority
    }
  };
}

/**
 * Format alert for SMS (must be concise)
 */
function formatSMSMessage(alert: Alert): string {
  return `OmniTrack ${alert.severity} Alert: ${alert.message.substring(0, 100)}. Priority: ${alert.metadata.priority}`;
}

/**
 * Notify team members about alert acknowledgment
 */
export async function notifyAcknowledgment(
  alert: Alert,
  acknowledgedBy: string,
  teamMembers: User[],
  logger: Logger
): Promise<void> {
  logger.info('Notifying team of acknowledgment', {
    alertId: alert.alertId,
    acknowledgedBy,
    teamMemberCount: teamMembers.length
  });

  const message = {
    text: `Alert ${alert.alertId} has been acknowledged by user ${acknowledgedBy}`,
    alert: {
      alertId: alert.alertId,
      type: alert.type,
      severity: alert.severity,
      nodeId: alert.nodeId,
      acknowledgedBy,
      acknowledgedAt: alert.acknowledgedAt
    }
  };

  // Determine notification channels from team member preferences
  const channels = new Set<NotificationChannel>();
  for (const member of teamMembers) {
    member.preferences.notificationChannels.forEach(ch => channels.add(ch));
  }

  // Deliver acknowledgment notifications
  await deliverNotifications(
    alert,
    teamMembers,
    Array.from(channels),
    logger
  );

  logger.info('Acknowledgment notifications sent');
}
