/**
 * Monitoring Utilities Usage Example
 * 
 * This file demonstrates how to use the structured logging, metrics publishing,
 * and X-Ray tracing utilities in Lambda functions.
 */

import { Context } from 'aws-lambda';
import { createLogger, Logger, LogLevel } from './logger';
import { metricsPublisher, MetricUnit } from './metrics';
import {
  traceAsync,
  traceAgentExecution,
  traceDatabaseOperation,
  traceSimulation,
  addAnnotation,
  addMetadata,
  setUser,
} from './tracing';

/**
 * Example Lambda handler with comprehensive monitoring
 */
export const exampleHandler = async (event: any, context: Context) => {
  // Create logger with correlation ID from event
  const logger = createLogger(event, LogLevel.INFO);
  
  logger.info('Lambda invoked', {
    functionName: context.functionName,
    requestId: context.awsRequestId,
  });

  try {
    // Extract user ID from event (if available)
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (userId) {
      logger.setUserId(userId);
      setUser(userId); // Set user in X-Ray trace
    }

    // Add X-Ray annotations for filtering
    addAnnotation('environment', process.env.ENVIRONMENT || 'production');
    addAnnotation('userId', userId || 'anonymous');

    // Example 1: Trace a database operation
    const data = await traceDatabaseOperation('GetItem', 'omnitrack-main', async () => {
      logger.info('Fetching data from DynamoDB');
      // Simulated database call
      return { id: '123', name: 'Example' };
    });

    logger.info('Data retrieved', { dataId: data.id });

    // Example 2: Trace agent execution
    const agentResult = await traceAgentExecution(
      'ScenarioAgent',
      async () => {
        logger.info('Executing Scenario Agent');
        
        // Publish agent execution start metric
        const startTime = Date.now();
        
        try {
          // Simulated agent logic
          const result = await generateScenario();
          
          // Publish success metrics
          const duration = Date.now() - startTime;
          await metricsPublisher.publishAgentExecution('ScenarioAgent', duration, true);
          
          logger.info('Agent execution completed', { duration });
          return result;
        } catch (error) {
          // Publish failure metrics
          const duration = Date.now() - startTime;
          await metricsPublisher.publishAgentExecution('ScenarioAgent', duration, false);
          throw error;
        }
      },
      { scenarioType: 'supply-disruption' }
    );

    // Example 3: Trace simulation
    const simulationResult = await traceSimulation(
      'supply-disruption',
      'scenario-123',
      async () => {
        logger.info('Running simulation');
        
        const startTime = Date.now();
        
        // Simulated simulation logic
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const duration = Date.now() - startTime;
        
        // Publish simulation duration metric
        await metricsPublisher.publishSimulationDuration('supply-disruption', duration);
        
        logger.metric('SimulationCompleted', 1, 'Count', {
          scenarioType: 'supply-disruption',
          duration,
        });
        
        return { success: true, duration };
      }
    );

    // Example 4: Trace custom operation with metadata
    const processedData = await traceAsync(
      'ProcessData',
      async (subsegment) => {
        logger.info('Processing data');
        
        // Add custom metadata to subsegment
        subsegment?.addMetadata('dataSize', data.id.length);
        subsegment?.addAnnotation('dataType', 'scenario');
        
        // Simulated processing
        return { processed: true, data };
      },
      { source: 'api-request' },
      { operation: 'process' }
    );

    // Example 5: Log API call metrics
    const apiStartTime = Date.now();
    const apiResponse = await callExternalApi();
    const apiDuration = Date.now() - apiStartTime;
    
    logger.logApiCall('GET', '/external/api', 200, apiDuration, {
      responseSize: JSON.stringify(apiResponse).length,
    });

    // Example 6: Log database operation metrics
    const dbStartTime = Date.now();
    await saveToDynamoDB(data);
    const dbDuration = Date.now() - dbStartTime;
    
    logger.logDbOperation('PutItem', 'omnitrack-main', dbDuration, true, {
      itemId: data.id,
    });

    // Example 7: Publish custom business metrics
    await metricsPublisher.publishAlertGenerated('inventory-shortage', 'high');
    await metricsPublisher.publishMarketplaceActivity('scenario-published');
    await metricsPublisher.publishCacheMetric(true); // Cache hit

    // Example 8: Create child logger with additional context
    const childLogger = logger.child({ operation: 'cleanup' });
    childLogger.info('Starting cleanup');

    // Example 9: Log performance metric
    logger.metric('RequestProcessingTime', Date.now() - apiStartTime, 'Milliseconds');

    // Success response
    logger.info('Request completed successfully', {
      totalDuration: Date.now() - apiStartTime,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: processedData,
      }),
    };

  } catch (error) {
    // Example 10: Error logging with full context
    logger.error(
      'Request processing failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        eventType: event.requestContext?.eventType,
        path: event.path,
      }
    );

    // Publish error metric
    await metricsPublisher.publishMetric('RequestErrors', 1, MetricUnit.COUNT, [
      { Name: 'ErrorType', Value: error instanceof Error ? error.name : 'Unknown' },
    ]);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        requestId: context.awsRequestId,
      }),
    };
  }
};

/**
 * Example: Monitoring in agent execution
 */
async function generateScenario() {
  const logger = new Logger({ component: 'ScenarioGenerator' });
  
  logger.info('Generating scenario');
  
  // Trace Bedrock API call
  const scenario = await traceAsync(
    'BedrockInvoke',
    async (subsegment) => {
      logger.info('Calling Amazon Bedrock');
      
      // Simulated Bedrock call
      const result = {
        scenarioId: 'scenario-123',
        type: 'supply-disruption',
        parameters: {},
      };
      
      subsegment?.addAnnotation('modelId', 'anthropic.claude-v2');
      subsegment?.addMetadata('promptTokens', 150);
      subsegment?.addMetadata('completionTokens', 500);
      
      return result;
    },
    { service: 'bedrock' },
    { operation: 'invoke-model' }
  );
  
  logger.info('Scenario generated', { scenarioId: scenario.scenarioId });
  
  return scenario;
}

/**
 * Example: Monitoring database operations
 */
async function saveToDynamoDB(data: any) {
  const logger = new Logger({ component: 'DatabaseWriter' });
  
  return traceDatabaseOperation('PutItem', 'omnitrack-main', async () => {
    logger.info('Saving to DynamoDB', { itemId: data.id });
    
    // Simulated DynamoDB call
    await new Promise(resolve => setTimeout(resolve, 50));
    
    logger.info('Save completed', { itemId: data.id });
  });
}

/**
 * Example: Monitoring external API calls
 */
async function callExternalApi() {
  const logger = new Logger({ component: 'ExternalApiClient' });
  
  return traceAsync(
    'ExternalAPI.GetData',
    async (subsegment) => {
      logger.info('Calling external API');
      
      const startTime = Date.now();
      
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 100));
      const response = { data: 'example' };
      
      const duration = Date.now() - startTime;
      
      subsegment?.addMetadata('duration', duration);
      subsegment?.addMetadata('statusCode', 200);
      subsegment?.addAnnotation('success', true);
      
      logger.info('API call completed', { duration, statusCode: 200 });
      
      return response;
    },
    { endpoint: 'https://api.example.com/data' },
    { service: 'external-api' }
  );
}

/**
 * Example: Monitoring with different log levels
 */
export const debuggingExample = async (event: any, context: Context) => {
  // Create logger with DEBUG level for troubleshooting
  const logger = createLogger(event, LogLevel.DEBUG);
  
  logger.debug('Detailed debugging information', {
    eventKeys: Object.keys(event),
    contextKeys: Object.keys(context),
  });
  
  logger.info('Processing request');
  
  logger.warning('Potential issue detected', {
    issue: 'High memory usage',
    memoryUsed: process.memoryUsage().heapUsed,
  });
  
  try {
    // Some operation
    throw new Error('Example error');
  } catch (error) {
    logger.error('Operation failed', error as Error, {
      operation: 'example',
    });
  }
  
  logger.critical('Critical system failure', new Error('System down'), {
    severity: 'critical',
    requiresImmediate: true,
  });
};

/**
 * Example: Monitoring multi-agent workflow
 */
export const multiAgentExample = async (event: any, context: Context) => {
  const logger = createLogger(event);
  
  logger.info('Starting multi-agent workflow');
  
  // Track overall workflow
  const workflowStartTime = Date.now();
  
  try {
    // Execute multiple agents in sequence
    const infoAgentResult = await traceAgentExecution('InfoAgent', async () => {
      logger.info('Executing Info Agent');
      const startTime = Date.now();
      
      // Simulated agent execution
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const duration = Date.now() - startTime;
      await metricsPublisher.publishAgentExecution('InfoAgent', duration, true);
      
      return { data: 'supply-chain-state' };
    });
    
    const scenarioAgentResult = await traceAgentExecution('ScenarioAgent', async () => {
      logger.info('Executing Scenario Agent');
      const startTime = Date.now();
      
      // Simulated agent execution
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const duration = Date.now() - startTime;
      await metricsPublisher.publishAgentExecution('ScenarioAgent', duration, true);
      
      return { scenarios: ['scenario-1', 'scenario-2'] };
    });
    
    const impactAgentResult = await traceAgentExecution('ImpactAgent', async () => {
      logger.info('Executing Impact Agent');
      const startTime = Date.now();
      
      // Simulated agent execution
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const duration = Date.now() - startTime;
      await metricsPublisher.publishAgentExecution('ImpactAgent', duration, true);
      
      return { impacts: { cost: 10000, time: 5 } };
    });
    
    // Publish workflow metrics
    const workflowDuration = Date.now() - workflowStartTime;
    await metricsPublisher.publishNegotiationMetrics(workflowDuration, 3, true);
    
    logger.info('Multi-agent workflow completed', {
      duration: workflowDuration,
      agentsExecuted: 3,
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        results: {
          info: infoAgentResult,
          scenarios: scenarioAgentResult,
          impacts: impactAgentResult,
        },
      }),
    };
    
  } catch (error) {
    const workflowDuration = Date.now() - workflowStartTime;
    
    logger.error('Multi-agent workflow failed', error as Error, {
      duration: workflowDuration,
    });
    
    // Publish failure metrics
    await metricsPublisher.publishNegotiationMetrics(workflowDuration, 0, false);
    
    throw error;
  }
};
