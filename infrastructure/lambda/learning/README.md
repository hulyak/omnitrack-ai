# Learning Module

The Learning Module implements continuous improvement of prediction models through user feedback collection and automated model retraining.

## Components

### LearningService
Core service that handles:
- Feedback collection and storage
- Threshold-triggered model retraining
- Model version management
- Performance metrics tracking

### Lambda Handlers
- `collectFeedbackHandler`: POST /learning/feedback - Collects user feedback on scenario accuracy
- `getModelMetricsHandler`: GET /learning/metrics - Returns model performance trends
- `getCurrentModelVersionHandler`: GET /learning/model-version - Returns active model version

## Requirements Addressed

- **Requirement 4.1**: Store feedback with scenario associations
- **Requirement 4.2**: Trigger retraining when feedback count reaches threshold (default: 10)
- **Requirement 4.3**: Apply improved predictions using latest model versions
- **Requirement 4.4**: Display model performance metrics over time

## Architecture

```
User Feedback → Lambda Handler → LearningService
                                      ↓
                                FeedbackRepository → DynamoDB
                                      ↓
                            Check Retraining Threshold
                                      ↓
                            Trigger SageMaker Training
                                      ↓
                            Store Model Artifacts → S3
                                      ↓
                            Update Model Version
```

## Model Versioning

Models are versioned and stored in S3 with metadata:
- Model artifacts: `s3://bucket/models/{scenarioType}/{modelId}.tar.gz`
- Model metadata: `s3://bucket/models/{scenarioType}/{modelId}.metadata.json`

Metadata includes:
- Model version number
- Training job name
- Performance metrics (accuracy, precision, recall, F1)
- Training data count
- Creation timestamp
- Status (TRAINING, ACTIVE, DEPRECATED, FAILED)

## Retraining Process

1. User submits feedback via API
2. Feedback stored in DynamoDB with scenario association
3. System checks if feedback count >= threshold (default: 10)
4. If threshold met:
   - Aggregate feedback data for scenario type
   - Upload training data to S3
   - Create SageMaker training job
   - Store new model artifacts and metadata
5. New model becomes active for future predictions

## Usage

### Collect Feedback
```typescript
POST /learning/feedback
{
  "scenarioId": "uuid",
  "userId": "uuid",
  "actualOutcome": "Description of what actually happened",
  "accuracy": 4,  // 1-5 rating
  "comments": "The prediction was mostly accurate but underestimated the delay",
  "metadata": {}
}
```

### Get Model Metrics
```typescript
GET /learning/metrics?scenarioType=NATURAL_DISASTER
```

### Get Current Model Version
```typescript
GET /learning/model-version?scenarioType=NATURAL_DISASTER
```

## Configuration

Environment variables:
- `MODEL_BUCKET`: S3 bucket for model artifacts (default: omnitrack-models)
- `SAGEMAKER_ROLE_ARN`: IAM role for SageMaker training jobs
- `TRAINING_IMAGE_URI`: Docker image for training
- `RETRAINING_THRESHOLD`: Feedback count threshold (default: 10)
