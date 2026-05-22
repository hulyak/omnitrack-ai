/**
 * Lambda handler for feedback collection
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LearningService, FeedbackInput } from './learning-service';
import { FeedbackRepository } from '../repositories/feedback-repository';

const learningService = new LearningService(new FeedbackRepository());

/**
 * Handler for POST /learning/feedback
 * Collects user feedback on scenario accuracy
 */
export async function collectFeedbackHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const input: FeedbackInput = JSON.parse(event.body);

    // Validate required fields
    if (!input.scenarioId || !input.userId || !input.actualOutcome || 
        typeof input.accuracy !== 'number' || !input.comments) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Validate accuracy range
    if (input.accuracy < 1 || input.accuracy > 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Accuracy must be between 1 and 5' })
      };
    }

    const feedback = await learningService.collectFeedback(input);

    return {
      statusCode: 201,
      body: JSON.stringify(feedback)
    };
  } catch (error: any) {
    console.error('Error collecting feedback:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
}

/**
 * Handler for GET /learning/metrics
 * Returns model performance metrics
 */
export async function getModelMetricsHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const scenarioType = event.queryStringParameters?.scenarioType;

    if (!scenarioType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'scenarioType query parameter is required' })
      };
    }

    const metrics = await learningService.getModelMetrics(scenarioType as any);

    return {
      statusCode: 200,
      body: JSON.stringify({
        scenarioType,
        metrics,
        metricsCount: metrics.length
      })
    };
  } catch (error: any) {
    console.error('Error getting model metrics:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
}

/**
 * Handler for GET /learning/model-version
 * Returns current model version for a scenario type
 */
export async function getCurrentModelVersionHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const scenarioType = event.queryStringParameters?.scenarioType;

    if (!scenarioType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'scenarioType query parameter is required' })
      };
    }

    const modelVersion = await learningService.getCurrentModelVersion(scenarioType as any);

    if (!modelVersion) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No model version found for this scenario type' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(modelVersion)
    };
  } catch (error: any) {
    console.error('Error getting model version:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
}
