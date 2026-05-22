/**
 * Learning Module Service
 * Handles feedback collection, model retraining triggers, and model versioning
 */

import { FeedbackRepository } from '../repositories/feedback-repository';
import { Feedback, DisruptionType } from '../models/types';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { SageMakerClient, CreateTrainingJobCommand, DescribeTrainingJobCommand } from '@aws-sdk/client-sagemaker';
import { randomUUID } from 'crypto';

export interface FeedbackInput {
  scenarioId: string;
  userId: string;
  actualOutcome: string;
  accuracy: number;
  comments: string;
  metadata?: Record<string, any>;
}

export interface ModelVersion {
  modelId: string;
  version: number;
  scenarioType: DisruptionType;
  trainingJobName: string;
  artifactLocation: string;
  metrics: ModelMetrics;
  createdAt: string;
  status: ModelStatus;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDataCount: number;
}

export enum ModelStatus {
  TRAINING = 'TRAINING',
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
  FAILED = 'FAILED'
}

export interface RetrainingTrigger {
  scenarioType: DisruptionType;
  feedbackCount: number;
  threshold: number;
  shouldRetrain: boolean;
}

export class LearningService {
  private feedbackRepository: FeedbackRepository;
  private s3Client: S3Client;
  private sageMakerClient: SageMakerClient;
  private modelBucket: string;
  private retrainingThreshold: number;

  constructor(
    feedbackRepository?: FeedbackRepository,
    s3Client?: S3Client,
    sageMakerClient?: SageMakerClient,
    modelBucket?: string,
    retrainingThreshold: number = 10
  ) {
    this.feedbackRepository = feedbackRepository || new FeedbackRepository();
    this.s3Client = s3Client || new S3Client({});
    this.sageMakerClient = sageMakerClient || new SageMakerClient({});
    this.modelBucket = modelBucket || process.env.MODEL_BUCKET || 'omnitrack-models';
    this.retrainingThreshold = retrainingThreshold;
  }

  /**
   * Collect feedback from user
   * Requirement 4.1: Store feedback with scenario associations
   */
  async collectFeedback(input: FeedbackInput): Promise<Feedback> {
    const feedback = await this.feedbackRepository.createFeedback({
      scenarioId: input.scenarioId,
      userId: input.userId,
      actualOutcome: input.actualOutcome,
      accuracy: input.accuracy,
      comments: input.comments,
      metadata: input.metadata || {}
    });

    // Check if retraining threshold is met
    await this.checkRetrainingThreshold(input.scenarioId);

    return feedback;
  }

  /**
   * Check if retraining threshold is met for a scenario type
   * Requirement 4.2: Trigger retraining when sufficient feedback accumulates
   */
  async checkRetrainingThreshold(scenarioId: string): Promise<RetrainingTrigger | null> {
    // Get scenario to determine type
    const scenario = await this.getScenarioType(scenarioId);
    if (!scenario) {
      return null;
    }

    const feedbackCount = await this.feedbackRepository.countFeedbackByScenario(scenarioId);
    
    const shouldRetrain = feedbackCount >= this.retrainingThreshold;

    const trigger: RetrainingTrigger = {
      scenarioType: scenario.type,
      feedbackCount,
      threshold: this.retrainingThreshold,
      shouldRetrain
    };

    if (shouldRetrain) {
      await this.triggerRetraining(scenario.type, scenarioId);
    }

    return trigger;
  }

  /**
   * Trigger model retraining for a scenario type
   * Requirement 4.2: Retrain learning model when threshold is met
   */
  async triggerRetraining(scenarioType: DisruptionType, scenarioId: string): Promise<string> {
    const trainingJobName = `omnitrack-${scenarioType.toLowerCase()}-${Date.now()}`;
    
    // Get feedback data for training
    const feedbackData = await this.feedbackRepository.getFeedbackByScenario(scenarioId);
    
    // Prepare training data and upload to S3
    const trainingDataKey = `training-data/${scenarioType}/${Date.now()}.json`;
    await this.uploadTrainingData(trainingDataKey, feedbackData.items);

    // Create SageMaker training job
    const command = new CreateTrainingJobCommand({
      TrainingJobName: trainingJobName,
      RoleArn: process.env.SAGEMAKER_ROLE_ARN,
      AlgorithmSpecification: {
        TrainingImage: process.env.TRAINING_IMAGE_URI,
        TrainingInputMode: 'File'
      },
      InputDataConfig: [
        {
          ChannelName: 'training',
          DataSource: {
            S3DataSource: {
              S3DataType: 'S3Prefix',
              S3Uri: `s3://${this.modelBucket}/${trainingDataKey}`,
              S3DataDistributionType: 'FullyReplicated'
            }
          },
          ContentType: 'application/json'
        }
      ],
      OutputDataConfig: {
        S3OutputPath: `s3://${this.modelBucket}/models/${scenarioType}`
      },
      ResourceConfig: {
        InstanceType: 'ml.m5.xlarge',
        InstanceCount: 1,
        VolumeSizeInGB: 10
      },
      StoppingCondition: {
        MaxRuntimeInSeconds: 3600
      }
    });

    await this.sageMakerClient.send(command);

    return trainingJobName;
  }

  /**
   * Get current model version for a scenario type
   * Requirement 4.3: Apply improved predictions to future scenario generations
   */
  async getCurrentModelVersion(scenarioType: DisruptionType): Promise<ModelVersion | null> {
    const prefix = `models/${scenarioType}/`;
    
    const command = new ListObjectsV2Command({
      Bucket: this.modelBucket,
      Prefix: prefix,
      MaxKeys: 100
    });

    const response = await this.s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      return null;
    }

    // Sort by last modified to get the latest version
    const sortedModels = response.Contents.sort((a, b) => {
      const timeA = a.LastModified?.getTime() || 0;
      const timeB = b.LastModified?.getTime() || 0;
      return timeB - timeA;
    });

    const latestModel = sortedModels[0];
    
    // Get model metadata
    const metadataKey = `${latestModel.Key}.metadata.json`;
    const metadataCommand = new GetObjectCommand({
      Bucket: this.modelBucket,
      Key: metadataKey
    });

    try {
      const metadataResponse = await this.s3Client.send(metadataCommand);
      const metadataBody = await metadataResponse.Body?.transformToString();
      const metadata = metadataBody ? JSON.parse(metadataBody) : {};

      return {
        modelId: metadata.modelId || randomUUID(),
        version: metadata.version || 1,
        scenarioType,
        trainingJobName: metadata.trainingJobName || 'unknown',
        artifactLocation: `s3://${this.modelBucket}/${latestModel.Key}`,
        metrics: metadata.metrics || this.getDefaultMetrics(),
        createdAt: latestModel.LastModified?.toISOString() || new Date().toISOString(),
        status: ModelStatus.ACTIVE
      };
    } catch (error) {
      // If metadata doesn't exist, return basic model info
      return {
        modelId: randomUUID(),
        version: 1,
        scenarioType,
        trainingJobName: 'unknown',
        artifactLocation: `s3://${this.modelBucket}/${latestModel.Key}`,
        metrics: this.getDefaultMetrics(),
        createdAt: latestModel.LastModified?.toISOString() || new Date().toISOString(),
        status: ModelStatus.ACTIVE
      };
    }
  }

  /**
   * Store model version metadata
   */
  async storeModelVersion(modelVersion: ModelVersion): Promise<void> {
    const key = `models/${modelVersion.scenarioType}/${modelVersion.modelId}.metadata.json`;
    
    const command = new PutObjectCommand({
      Bucket: this.modelBucket,
      Key: key,
      Body: JSON.stringify(modelVersion),
      ContentType: 'application/json'
    });

    await this.s3Client.send(command);
  }

  /**
   * Get model performance metrics
   * Requirement 4.4: Display model performance trends over time
   */
  async getModelMetrics(scenarioType: DisruptionType): Promise<ModelMetrics[]> {
    const prefix = `models/${scenarioType}/`;
    
    const command = new ListObjectsV2Command({
      Bucket: this.modelBucket,
      Prefix: prefix,
      MaxKeys: 100
    });

    const response = await this.s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    const metricsPromises = response.Contents
      .filter(obj => obj.Key?.endsWith('.metadata.json'))
      .map(async (obj) => {
        try {
          const getCommand = new GetObjectCommand({
            Bucket: this.modelBucket,
            Key: obj.Key
          });
          const metadataResponse = await this.s3Client.send(getCommand);
          const metadataBody = await metadataResponse.Body?.transformToString();
          const metadata = metadataBody ? JSON.parse(metadataBody) : {};
          return metadata.metrics;
        } catch (error) {
          return null;
        }
      });

    const metrics = await Promise.all(metricsPromises);
    return metrics.filter(m => m !== null) as ModelMetrics[];
  }

  /**
   * Upload training data to S3
   */
  private async uploadTrainingData(key: string, feedbackData: Feedback[]): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.modelBucket,
      Key: key,
      Body: JSON.stringify(feedbackData),
      ContentType: 'application/json'
    });

    await this.s3Client.send(command);
  }

  /**
   * Get scenario type from scenario ID
   * This is a placeholder - in real implementation, would query scenario repository
   */
  private async getScenarioType(scenarioId: string): Promise<{ type: DisruptionType } | null> {
    // Placeholder implementation
    // In real implementation, would query ScenarioRepository
    return {
      type: DisruptionType.NATURAL_DISASTER
    };
  }

  /**
   * Get default metrics for new models
   */
  private getDefaultMetrics(): ModelMetrics {
    return {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      trainingDataCount: 0
    };
  }
}
