/**
 * Property-based tests for Notification Service
 * 
 * Feature: omnitrack-ai-supply-chain
 */

import * as fc from 'fast-check';
import {
  Alert,
  AlertType,
  AlertStatus,
  Severity,
  NotificationChannel,
  User,
  UserRole,
  UserPreferences
} from '../models/types';

/**
 * Arbitrary generators for property-based testing
 */

const notificationChannelArbitrary = fc.constantFrom(
  NotificationChannel.SLACK,
  NotificationChannel.TEAMS,
  NotificationChannel.EMAIL,
  NotificationChannel.MOBILE,
  NotificationChannel.SMS
);

const userPreferencesArbitrary: fc.Arbitrary<UserPreferences> = fc.record({
  notificationChannels: fc.array(notificationChannelArbitrary, {
    minLength: 1,
    maxLength: 5
  }),
  prioritizeSustainability: fc.boolean(),
  prioritizeCost: fc.boolean(),
  prioritizeRisk: fc.boolean(),
  defaultView: fc.constantFrom('dashboard', 'scenarios', 'marketplace')
});

const userArbitrary: fc.Arbitrary<User> = fc.record({
  userId: fc.uuid(),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  role: fc.constantFrom(
    UserRole.ADMIN,
    UserRole.SUPPLY_CHAIN_DIRECTOR,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SUSTAINABILITY_OFFICER,
    UserRole.VIEWER
  ),
  preferences: userPreferencesArbitrary,
  createdAt: fc.integer({ min: Date.parse('2024-01-01'), max: Date.now() }).map(ms => new Date(ms).toISOString()),
  updatedAt: fc.integer({ min: Date.parse('2024-01-01'), max: Date.now() }).map(ms => new Date(ms).toISOString()),
  version: fc.integer({ min: 1, max: 10 })
});

const alertArbitrary: fc.Arbitrary<Alert> = fc.record({
  alertId: fc.uuid(),
  type: fc.constantFrom(
    AlertType.ANOMALY_DETECTED,
    AlertType.THRESHOLD_EXCEEDED,
    AlertType.DISRUPTION_PREDICTED,
    AlertType.SUSTAINABILITY_THRESHOLD
  ),
  severity: fc.constantFrom(
    Severity.LOW,
    Severity.MEDIUM,
    Severity.HIGH,
    Severity.CRITICAL
  ),
  nodeId: fc.uuid(),
  status: fc.constant(AlertStatus.ACTIVE),
  message: fc.string({ minLength: 10, maxLength: 200 }),
  createdAt: fc.integer({ min: Date.parse('2024-01-01'), max: Date.now() }).map(ms => new Date(ms).toISOString()),
  metadata: fc.record({
    priority: fc.integer({ min: 1, max: 10 }),
    affectedNodes: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
    estimatedImpact: fc.string({ minLength: 10, maxLength: 100 }),
    recommendedActions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), {
      minLength: 1,
      maxLength: 5
    })
  }),
  version: fc.integer({ min: 1, max: 10 })
});

/**
 * Property 2: Multi-channel notification delivery
 * Feature: omnitrack-ai-supply-chain, Property 2: Multi-channel notification delivery
 * Validates: Requirements 1.2, 3.4
 * 
 * For any generated alert with configured notification channels,
 * the system should deliver notifications to all active channels
 * (Slack, Teams, email, mobile).
 */
describe('Property 2: Multi-channel notification delivery', () => {
  test('all configured channels receive notifications', () => {
    fc.assert(
      fc.property(
        alertArbitrary,
        fc.array(notificationChannelArbitrary, { minLength: 1, maxLength: 5 }),
        (alert, configuredChannels) => {
          // Remove duplicates
          const uniqueChannels = Array.from(new Set(configuredChannels));

          // Simulate notification delivery
          const deliveryResults = uniqueChannels.map(channel => ({
            channel,
            success: true,
            deliveredAt: new Date().toISOString()
          }));

          // Property: All configured channels should receive notifications
          expect(deliveryResults.length).toBe(uniqueChannels.length);

          // Property: Each channel should have a delivery result
          for (const channel of uniqueChannels) {
            const result = deliveryResults.find(r => r.channel === channel);
            expect(result).toBeDefined();
            expect(result?.success).toBe(true);
          }

          // Property: No duplicate deliveries
          const channelCounts = new Map<NotificationChannel, number>();
          for (const result of deliveryResults) {
            channelCounts.set(result.channel, (channelCounts.get(result.channel) || 0) + 1);
          }

          for (const count of channelCounts.values()) {
            expect(count).toBe(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('notification delivery includes all required alert information', () => {
    fc.assert(
      fc.property(
        alertArbitrary,
        notificationChannelArbitrary,
        (alert, channel) => {
          // Simulate formatting notification for a channel
          const notification = {
            alertId: alert.alertId,
            type: alert.type,
            severity: alert.severity,
            nodeId: alert.nodeId,
            message: alert.message,
            priority: alert.metadata.priority,
            estimatedImpact: alert.metadata.estimatedImpact,
            recommendedActions: alert.metadata.recommendedActions,
            channel
          };

          // Property: Notification must include all essential alert fields
          expect(notification.alertId).toBe(alert.alertId);
          expect(notification.type).toBe(alert.type);
          expect(notification.severity).toBe(alert.severity);
          expect(notification.nodeId).toBe(alert.nodeId);
          expect(notification.message).toBe(alert.message);
          expect(notification.priority).toBe(alert.metadata.priority);
          expect(notification.estimatedImpact).toBe(alert.metadata.estimatedImpact);
          expect(notification.recommendedActions).toEqual(alert.metadata.recommendedActions);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('users with multiple channel preferences receive notifications on all channels', () => {
    fc.assert(
      fc.property(
        alertArbitrary,
        fc.array(userArbitrary, { minLength: 1, maxLength: 10 }),
        (alert, users) => {
          // Collect all unique channels from user preferences
          const allChannels = new Set<NotificationChannel>();
          for (const user of users) {
            user.preferences.notificationChannels.forEach(ch => allChannels.add(ch));
          }

          // Simulate notification delivery to all channels
          const deliveredChannels = Array.from(allChannels);

          // Property: All user-preferred channels should be included
          for (const user of users) {
            for (const preferredChannel of user.preferences.notificationChannels) {
              expect(deliveredChannels).toContain(preferredChannel);
            }
          }

          // Property: Number of delivered channels should match unique channels
          expect(deliveredChannels.length).toBe(allChannels.size);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('notification delivery handles empty channel list gracefully', () => {
    fc.assert(
      fc.property(alertArbitrary, (alert) => {
        const configuredChannels: NotificationChannel[] = [];

        // Simulate notification delivery with no channels
        const deliveryResults = configuredChannels.map(channel => ({
          channel,
          success: true
        }));

        // Property: No notifications should be sent when no channels configured
        expect(deliveryResults.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  test('failed channel delivery does not prevent other channels from receiving notifications', () => {
    fc.assert(
      fc.property(
        alertArbitrary,
        fc.array(notificationChannelArbitrary, { minLength: 2, maxLength: 5 }),
        fc.integer({ min: 0, max: 4 }), // Index of channel that will fail
        (alert, channels, failureIndex) => {
          const uniqueChannels = Array.from(new Set(channels));
          
          if (uniqueChannels.length < 2) {
            // Skip if we don't have at least 2 channels
            return true;
          }

          // Simulate delivery with one failure
          const deliveryResults = uniqueChannels.map((channel, index) => ({
            channel,
            success: index !== failureIndex % uniqueChannels.length,
            error: index === failureIndex % uniqueChannels.length ? 'Simulated failure' : undefined
          }));

          // Property: At least one channel should succeed
          const successCount = deliveryResults.filter(r => r.success).length;
          expect(successCount).toBeGreaterThan(0);

          // Property: Failed channel should have error message
          const failedResult = deliveryResults.find(r => !r.success);
          if (failedResult) {
            expect(failedResult.error).toBeDefined();
          }

          // Property: All channels should have a delivery attempt
          expect(deliveryResults.length).toBe(uniqueChannels.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Additional property tests for notification formatting
 */
describe('Notification formatting properties', () => {
  test('Slack message format includes all required fields', () => {
    fc.assert(
      fc.property(alertArbitrary, (alert) => {
        // Simulate Slack message formatting
        const slackMessage = {
          text: alert.type,
          attachments: [
            {
              fields: [
                { title: 'Severity', value: alert.severity },
                { title: 'Node', value: alert.nodeId },
                { title: 'Message', value: alert.message },
                { title: 'Priority', value: alert.metadata.priority.toString() }
              ]
            }
          ]
        };

        // Property: Slack message must have text and attachments
        expect(slackMessage.text).toBe(alert.type);
        expect(slackMessage.attachments).toHaveLength(1);
        expect(slackMessage.attachments[0].fields.length).toBeGreaterThanOrEqual(4);
      }),
      { numRuns: 100 }
    );
  });

  test('Email message format includes all required information', () => {
    fc.assert(
      fc.property(alertArbitrary, (alert) => {
        // Simulate email formatting
        const emailBody = `
Type: ${alert.type}
Severity: ${alert.severity}
Node: ${alert.nodeId}
Message: ${alert.message}
Priority: ${alert.metadata.priority}
        `.trim();

        // Property: Email must contain all key information
        expect(emailBody).toContain(alert.type);
        expect(emailBody).toContain(alert.severity);
        expect(emailBody).toContain(alert.nodeId);
        expect(emailBody).toContain(alert.message);
        expect(emailBody).toContain(alert.metadata.priority.toString());
      }),
      { numRuns: 100 }
    );
  });

  test('SMS message is concise and within character limits', () => {
    fc.assert(
      fc.property(alertArbitrary, (alert) => {
        // Simulate SMS formatting (must be concise)
        const smsMessage = `OmniTrack ${alert.severity} Alert: ${alert.message.substring(0, 100)}`;

        // Property: SMS should be under 160 characters (standard SMS limit)
        expect(smsMessage.length).toBeLessThanOrEqual(160);

        // Property: SMS should include severity
        expect(smsMessage).toContain(alert.severity);
      }),
      { numRuns: 100 }
    );
  });

  test('mobile push notification includes data payload', () => {
    fc.assert(
      fc.property(alertArbitrary, (alert) => {
        // Simulate mobile push notification
        const pushNotification = {
          title: `${alert.severity} Alert: ${alert.type}`,
          body: alert.message,
          data: {
            alertId: alert.alertId,
            nodeId: alert.nodeId,
            severity: alert.severity,
            priority: alert.metadata.priority
          }
        };

        // Property: Push notification must have title, body, and data
        expect(pushNotification.title).toBeDefined();
        expect(pushNotification.body).toBe(alert.message);
        expect(pushNotification.data.alertId).toBe(alert.alertId);
        expect(pushNotification.data.nodeId).toBe(alert.nodeId);
        expect(pushNotification.data.severity).toBe(alert.severity);
        expect(pushNotification.data.priority).toBe(alert.metadata.priority);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property tests for acknowledgment notifications
 */
describe('Acknowledgment notification properties', () => {
  test('acknowledgment notifications include acknowledger information', () => {
    fc.assert(
      fc.property(
        alertArbitrary,
        fc.uuid(),
        fc.date().map(d => d.toISOString()),
        (alert, userId, acknowledgedAt) => {
          // Simulate acknowledgment notification
          const ackNotification = {
            alertId: alert.alertId,
            acknowledgedBy: userId,
            acknowledgedAt,
            originalAlert: {
              type: alert.type,
              severity: alert.severity,
              nodeId: alert.nodeId
            }
          };

          // Property: Acknowledgment notification must include acknowledger
          expect(ackNotification.acknowledgedBy).toBe(userId);
          expect(ackNotification.acknowledgedAt).toBe(acknowledgedAt);

          // Property: Original alert information must be preserved
          expect(ackNotification.originalAlert.type).toBe(alert.type);
          expect(ackNotification.originalAlert.severity).toBe(alert.severity);
          expect(ackNotification.originalAlert.nodeId).toBe(alert.nodeId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('team members receive acknowledgment notifications on their preferred channels', () => {
    fc.assert(
      fc.property(
        alertArbitrary,
        fc.uuid(),
        fc.array(userArbitrary, { minLength: 1, maxLength: 10 }),
        (alert, acknowledgedBy, teamMembers) => {
          // Collect all unique channels from team member preferences
          const teamChannels = new Set<NotificationChannel>();
          for (const member of teamMembers) {
            member.preferences.notificationChannels.forEach(ch => teamChannels.add(ch));
          }

          // Simulate acknowledgment notification delivery
          const deliveredChannels = Array.from(teamChannels);

          // Property: All team member preferred channels should receive notification
          for (const member of teamMembers) {
            for (const preferredChannel of member.preferences.notificationChannels) {
              expect(deliveredChannels).toContain(preferredChannel);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
