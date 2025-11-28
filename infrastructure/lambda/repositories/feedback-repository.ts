/**
 * Feedback repository for DynamoDB operations
 */

import { BaseRepository, QueryOptions, QueryResult } from './base-repository';
import { Feedback, DynamoDBItem } from '../models/types';
import { validateFeedback } from '../models/validation';
import { randomUUID } from 'crypto';

export class FeedbackRepository extends BaseRepository {
  /**
   * Create new feedback
   */
  async createFeedback(
    feedback: Omit<Feedback, 'feedbackId' | 'timestamp'>
  ): Promise<Feedback> {
    const feedbackId = randomUUID();
    const timestamp = this.generateTimestamp();

    const newFeedback: Feedback = {
      feedbackId,
      ...feedback,
      timestamp
    };

    validateFeedback(newFeedback);

    const item: DynamoDBItem = {
      PK: `SCENARIO#${feedback.scenarioId}`,
      SK: `FEEDBACK#${timestamp}`,
      GSI1PK: `USER#${feedback.userId}`,
      GSI1SK: timestamp,
      ...newFeedback
    };

    await this.putItem(item);

    return newFeedback;
  }

  /**
   * Get feedback by ID
   */
  async getFeedbackById(scenarioId: string, timestamp: string): Promise<Feedback | null> {
    const item = await this.getItem(`SCENARIO#${scenarioId}`, `FEEDBACK#${timestamp}`);
    
    if (!item) {
      return null;
    }

    const { PK, SK, GSI1PK, GSI1SK, ...feedbackData } = item;
    return feedbackData as Feedback;
  }

  /**
   * Get all feedback for a scenario
   */
  async getFeedbackByScenario(
    scenarioId: string,
    options?: QueryOptions
  ): Promise<QueryResult<Feedback>> {
    const result = await this.query(
      `SCENARIO#${scenarioId}`,
      { operator: 'begins_with', value: 'FEEDBACK#' },
      options
    );

    const feedbacks = result.items.map(item => {
      const { PK, SK, GSI1PK, GSI1SK, ...feedbackData } = item;
      return feedbackData as Feedback;
    });

    return {
      items: feedbacks,
      lastEvaluatedKey: result.lastEvaluatedKey
    };
  }

  /**
   * Get feedback by user
   */
  async getFeedbackByUser(
    userId: string,
    options?: QueryOptions
  ): Promise<QueryResult<Feedback>> {
    const result = await this.queryGSI(`USER#${userId}`, undefined, 'GSI1', options);

    const feedbacks = result.items.map(item => {
      const { PK, SK, GSI1PK, GSI1SK, ...feedbackData } = item;
      return feedbackData as Feedback;
    });

    return {
      items: feedbacks,
      lastEvaluatedKey: result.lastEvaluatedKey
    };
  }

  /**
   * Count feedback for a scenario
   */
  async countFeedbackByScenario(scenarioId: string): Promise<number> {
    const result = await this.getFeedbackByScenario(scenarioId);
    return result.items.length;
  }

  /**
   * Get average accuracy rating for a scenario
   */
  async getAverageAccuracy(scenarioId: string): Promise<number> {
    const result = await this.getFeedbackByScenario(scenarioId);
    
    if (result.items.length === 0) {
      return 0;
    }

    const sum = result.items.reduce((acc, feedback) => acc + feedback.accuracy, 0);
    return sum / result.items.length;
  }
}
