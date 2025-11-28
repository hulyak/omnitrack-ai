/**
 * Property-based tests for Learning Service
 * Feature: omnitrack-ai-supply-chain
 */

import * as fc from 'fast-check';
import { LearningService, FeedbackInput, ModelStatus } from './learning-service';
import { FeedbackRepository } from '../repositories/feedback-repository';
import { Feedback, DisruptionType } from '../models/types';
import { S3Client } from '@aws-sdk/client-s3';
import { SageMakerClient } from '@aws-sdk/client-sagemaker';

// Mock implementations
class MockFeedbackRepository extends FeedbackRepository {
  private feedbacks: Map<string, Feedback[]> = new Map();
  private feedbackCounter: Map<string, number> = new Map();

  async createFeedback(feedback: Omit<Feedback, 'feedbackId' | 'timestamp'>): Promise<Feedback> {
    const feedbackId = `feedback-${Date.now()}-${Math.random()}`;
    const timestamp = new Date().toISOString();
    
    const newFeedback: Feedback = {
      feedbackId,
      ...feedback,
      timestamp
    };

    const scenarioFeedbacks = this.feedbacks.get(feedback.scenarioId) || [];
    scenarioFeedbacks.push(newFeedback);
    this.feedbacks.set(feedback.scenarioId, scenarioFeedbacks);
    
    this.feedbackCounter.set(feedback.scenarioId, scenarioFeedbacks.length);

    return newFeedback;
  }

  async getFeedbackById(scenarioId: string, timestamp: string): Promise<Feedback | null> {
    const scenarioFeedbacks = this.feedbacks.get(scenarioId) || [];
    return scenarioFeedbacks.find(f => f.timestamp === timestamp) || null;
  }

  async getFeedbackByScenario(scenarioId: string): Promise<{ items: Feedback[]; lastEvaluatedKey?: any }> {
    return {
      items: this.feedbacks.get(scenarioId) || []
    };
  }

  async countFeedbackByScenario(scenarioId: string): Promise<number> {
    return this.feedbackCounter.get(scenarioId) || 0;
  }
}

class MockS3Client extends S3Client {
  private objects: Map<string, any> = new Map();

  async send(command: any): Promise<any> {
    if (command.constructor.name === 'PutObjectCommand') {
      // Use a timestamp that can be controlled for testing
      const timestamp = command.input.Timestamp || new Date();
      this.objects.set(command.input.Key, {
        Body: command.input.Body,
        LastModified: timestamp
      });
      return {};
    }
    
    if (command.constructor.name === 'GetObjectCommand') {
      const obj = this.objects.get(command.input.Key);
      if (!obj) {
        throw new Error('NoSuchKey');
      }
      return {
        Body: {
          transformToString: async () => obj.Body
        }
      };
    }
    
    if (command.constructor.name === 'ListObjectsV2Command') {
      const prefix = command.input.Prefix;
      const matchingKeys = Array.from(this.objects.keys())
        .filter(key => key.startsWith(prefix))
        .map(key => ({
          Key: key,
          LastModified: this.objects.get(key).LastModified
        }))
        .sort((a, b) => {
          // Sort by LastModified descending (newest first)
          return b.LastModified.getTime() - a.LastModified.getTime();
        });
      
      return {
        Contents: matchingKeys
      };
    }
    
    return {};
  }
}

class MockSageMakerClient extends SageMakerClient {
  async send(command: any): Promise<any> {
    return {};
  }
}

// Arbitraries for property testing
const feedbackInputArb = fc.record({
  scenarioId: fc.uuid(),
  userId: fc.uuid(),
  actualOutcome: fc.string({ minLength: 10, maxLength: 500 }),
  accuracy: fc.integer({ min: 1, max: 5 }),
  comments: fc.string({ minLength: 10, maxLength: 1000 }),
  metadata: fc.dictionary(fc.string(), fc.anything())
});

const disruptionTypeArb = fc.constantFrom(
  DisruptionType.NATURAL_DISASTER,
  DisruptionType.SUPPLIER_FAILURE,
  DisruptionType.TRANSPORTATION_DELAY,
  DisruptionType.DEMAND_SPIKE,
  DisruptionType.QUALITY_ISSUE,
  DisruptionType.GEOPOLITICAL,
  DisruptionType.CYBER_ATTACK,
  DisruptionType.LABOR_SHORTAGE
);

describe('Learning Service Property Tests', () => {
  /**
   * Feature: omnitrack-ai-supply-chain, Property 14: Feedback persistence with association
   * Validates: Requirements 4.1
   * 
   * For any user feedback on scenario accuracy, the system should store the feedback 
   * with correct associations to scenario ID, user ID, and timestamp.
   */
  test('Property 14: Feedback persistence with association', async () => {
    await fc.assert(
      fc.asyncProperty(feedbackInputArb, async (input) => {
        const mockRepo = new MockFeedbackRepository();
        const mockS3 = new MockS3Client({});
        const mockSageMaker = new MockSageMakerClient({});
        
        const service = new LearningService(
          mockRepo,
          mockS3,
          mockSageMaker,
          'test-bucket',
          100 // High threshold to prevent retraining during test
        );

        // Collect feedback
        const feedback = await service.collectFeedback(input);

        // Verify feedback was stored
        expect(feedback).toBeDefined();
        expect(feedback.feedbackId).toBeDefined();
        expect(feedback.timestamp).toBeDefined();

        // Verify associations are correct
        expect(feedback.scenarioId).toBe(input.scenarioId);
        expect(feedback.userId).toBe(input.userId);
        expect(feedback.actualOutcome).toBe(input.actualOutcome);
        expect(feedback.accuracy).toBe(input.accuracy);
        expect(feedback.comments).toBe(input.comments);

        // Verify feedback can be retrieved with correct associations
        const retrieved = await mockRepo.getFeedbackById(
          feedback.scenarioId,
          feedback.timestamp
        );

        expect(retrieved).not.toBeNull();
        expect(retrieved?.scenarioId).toBe(input.scenarioId);
        expect(retrieved?.userId).toBe(input.userId);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 15: Threshold-triggered retraining
   * Validates: Requirements 4.2
   * 
   * For any scenario type, when feedback count reaches 10 entries, 
   * the system should trigger model retraining for that scenario type.
   */
  test('Property 15: Threshold-triggered retraining', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(feedbackInputArb, { minLength: 10, maxLength: 15 }),
        async (baseScenarioId, feedbackInputs) => {
          const mockRepo = new MockFeedbackRepository();
          const mockS3 = new MockS3Client({});
          const mockSageMaker = new MockSageMakerClient({});
          
          const service = new LearningService(
            mockRepo,
            mockS3,
            mockSageMaker,
            'test-bucket',
            10 // Threshold of 10
          );

          // Override getScenarioType to return consistent type
          (service as any).getScenarioType = async () => ({
            type: DisruptionType.NATURAL_DISASTER
          });

          let retrainingTriggered = false;
          const originalTriggerRetraining = (service as any).triggerRetraining.bind(service);
          (service as any).triggerRetraining = async (...args: any[]) => {
            retrainingTriggered = true;
            return 'mock-training-job';
          };

          // Submit feedback with same scenario ID
          for (let i = 0; i < feedbackInputs.length; i++) {
            const input = { ...feedbackInputs[i], scenarioId: baseScenarioId };
            await service.collectFeedback(input);
          }

          // Get feedback count
          const count = await mockRepo.countFeedbackByScenario(baseScenarioId);

          // If count >= 10, retraining should have been triggered
          if (count >= 10) {
            expect(retrainingTriggered).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 16: Model version consistency
   * Validates: Requirements 4.3
   * 
   * For any scenario generation request after a model update, 
   * the system should use the latest model version for predictions.
   */
  test('Property 16: Model version consistency', async () => {
    await fc.assert(
      fc.asyncProperty(disruptionTypeArb, async (scenarioType) => {
        const mockRepo = new MockFeedbackRepository();
        const mockS3 = new MockS3Client({});
        const mockSageMaker = new MockSageMakerClient({});
        
        const service = new LearningService(
          mockRepo,
          mockS3,
          mockSageMaker,
          'test-bucket'
        );

        // Create multiple model versions
        const modelVersions = [
          {
            modelId: 'model-1',
            version: 1,
            scenarioType,
            trainingJobName: 'job-1',
            artifactLocation: `s3://test-bucket/models/${scenarioType}/model-1.tar.gz`,
            metrics: {
              accuracy: 0.75,
              precision: 0.72,
              recall: 0.78,
              f1Score: 0.75,
              trainingDataCount: 100
            },
            createdAt: new Date('2024-01-01').toISOString(),
            status: ModelStatus.ACTIVE
          },
          {
            modelId: 'model-2',
            version: 2,
            scenarioType,
            trainingJobName: 'job-2',
            artifactLocation: `s3://test-bucket/models/${scenarioType}/model-2.tar.gz`,
            metrics: {
              accuracy: 0.85,
              precision: 0.83,
              recall: 0.87,
              f1Score: 0.85,
              trainingDataCount: 200
            },
            createdAt: new Date('2024-02-01').toISOString(),
            status: ModelStatus.ACTIVE
          }
        ];

        // Store model versions in mock S3
        for (const modelVersion of modelVersions) {
          const key = `models/${scenarioType}/${modelVersion.modelId}.tar.gz`;
          const metadataKey = `${key}.metadata.json`;
          
          await mockS3.send({
            constructor: { name: 'PutObjectCommand' },
            input: {
              Bucket: 'test-bucket',
              Key: key,
              Body: 'model-data',
              Timestamp: new Date(modelVersion.createdAt)
            }
          });
          
          await mockS3.send({
            constructor: { name: 'PutObjectCommand' },
            input: {
              Bucket: 'test-bucket',
              Key: metadataKey,
              Body: JSON.stringify(modelVersion),
              Timestamp: new Date(modelVersion.createdAt)
            }
          });
        }

        // Get current model version
        const currentModel = await service.getCurrentModelVersion(scenarioType);

        // Should return the latest version (most recent createdAt)
        expect(currentModel).not.toBeNull();
        expect(currentModel?.version).toBe(2);
        expect(currentModel?.modelId).toBe('model-2');
        expect(currentModel?.status).toBe(ModelStatus.ACTIVE);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: omnitrack-ai-supply-chain, Property 17: Model metrics availability
   * Validates: Requirements 4.4
   * 
   * For any request for prediction accuracy metrics, 
   * the system should return model performance trends over time.
   */
  test('Property 17: Model metrics availability', async () => {
    await fc.assert(
      fc.asyncProperty(
        disruptionTypeArb,
        fc.array(
          fc.record({
            accuracy: fc.float({ min: 0, max: 1, noNaN: true }),
            precision: fc.float({ min: 0, max: 1, noNaN: true }),
            recall: fc.float({ min: 0, max: 1, noNaN: true }),
            f1Score: fc.float({ min: 0, max: 1, noNaN: true }),
            trainingDataCount: fc.integer({ min: 10, max: 1000 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (scenarioType, metricsArray) => {
          const mockRepo = new MockFeedbackRepository();
          const mockS3 = new MockS3Client({});
          const mockSageMaker = new MockSageMakerClient({});
          
          const service = new LearningService(
            mockRepo,
            mockS3,
            mockSageMaker,
            'test-bucket'
          );

          // Store model versions with metrics
          for (let i = 0; i < metricsArray.length; i++) {
            const modelVersion = {
              modelId: `model-${i}`,
              version: i + 1,
              scenarioType,
              trainingJobName: `job-${i}`,
              artifactLocation: `s3://test-bucket/models/${scenarioType}/model-${i}.tar.gz`,
              metrics: metricsArray[i],
              createdAt: new Date(Date.now() + i * 1000).toISOString(),
              status: ModelStatus.ACTIVE
            };

            const metadataKey = `models/${scenarioType}/model-${i}.tar.gz.metadata.json`;
            
            await mockS3.send({
              constructor: { name: 'PutObjectCommand' },
              input: {
                Bucket: 'test-bucket',
                Key: metadataKey,
                Body: JSON.stringify(modelVersion)
              }
            });
          }

          // Get model metrics
          const metrics = await service.getModelMetrics(scenarioType);

          // Should return all stored metrics
          expect(metrics).toBeDefined();
          expect(metrics.length).toBe(metricsArray.length);

          // Verify each metric has required fields
          for (const metric of metrics) {
            expect(metric).toHaveProperty('accuracy');
            expect(metric).toHaveProperty('precision');
            expect(metric).toHaveProperty('recall');
            expect(metric).toHaveProperty('f1Score');
            expect(metric).toHaveProperty('trainingDataCount');
            
            // Verify values are in valid ranges
            expect(metric.accuracy).toBeGreaterThanOrEqual(0);
            expect(metric.accuracy).toBeLessThanOrEqual(1);
            expect(metric.precision).toBeGreaterThanOrEqual(0);
            expect(metric.precision).toBeLessThanOrEqual(1);
            expect(metric.recall).toBeGreaterThanOrEqual(0);
            expect(metric.recall).toBeLessThanOrEqual(1);
            expect(metric.f1Score).toBeGreaterThanOrEqual(0);
            expect(metric.f1Score).toBeLessThanOrEqual(1);
            expect(metric.trainingDataCount).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
