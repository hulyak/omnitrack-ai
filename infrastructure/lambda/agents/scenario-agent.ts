/**
 * Scenario Agent - Generates disruption scenarios using Amazon Bedrock
 * 
 * This agent generates disruption scenarios using historical patterns, ML models,
 * and LLM-powered reasoning through Amazon Bedrock.
 * 
 * Requirements: 2.1, 2.4
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { ScenarioRepository } from '../repositories/scenario-repository';
import { 
  Scenario, 
  DisruptionType, 
  Severity, 
  Location, 
  ScenarioParameters 
} from '../models/types';

// X-Ray SDK
const AWSXRay = require('aws-xray-sdk-core');

interface ScenarioAgentRequest {
  type: DisruptionType;
  location: Location;
  severity: Severity;
  duration: number;
  affectedNodes: string[];
  customParameters?: Record<string, any>;
  userId: string;
  isPublic?: boolean;
  generateVariations?: boolean;
  variationCount?: number;
  correlationId?: string;
}

interface ScenarioAgentResponse {
  scenario: Scenario;
  variations?: Scenario[];
  metadata: {
    correlationId: string;
    executionTime: number;
    generationMethod: string;
  };
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
 * Scenario Agent Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  // Extract correlation ID from headers or generate new one
  const correlationId = event.headers?.['x-correlation-id'] || 
                        event.requestContext?.requestId || 
                        `scenario-${Date.now()}`;
  
  const logger = new Logger(correlationId, context);
  
  // Start X-Ray subsegment for this operation
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('ScenarioAgent');
  subsegment?.addAnnotation('correlationId', correlationId);

  try {
    logger.info('Scenario Agent invoked', {
      path: event.path,
      httpMethod: event.httpMethod
    });

    // Parse and validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId
        },
        body: JSON.stringify({
          error: 'Request body is required',
          correlationId
        })
      };
    }

    const request: ScenarioAgentRequest = JSON.parse(event.body);
    
    logger.debug('Request parsed', { request });

    // Validate required fields
    const validationError = validateRequest(request);
    if (validationError) {
      logger.warn('Request validation failed', { error: validationError });
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId
        },
        body: JSON.stringify({
          error: validationError,
          correlationId
        })
      };
    }

    // Initialize repository
    const scenarioRepository = new ScenarioRepository();
    
    // Generate primary scenario
    logger.info('Generating primary scenario', {
      type: request.type,
      severity: request.severity
    });

    const scenario = await generateScenario(request, logger);
    
    // Store scenario in DynamoDB
    const storedScenario = await scenarioRepository.createScenario({
      type: scenario.type,
      parameters: scenario.parameters,
      createdBy: request.userId,
      isPublic: request.isPublic || false,
      marketplaceMetadata: scenario.marketplaceMetadata
    });

    logger.info('Scenario created', { scenarioId: storedScenario.scenarioId });

    // Generate variations if requested
    let variations: Scenario[] | undefined;
    if (request.generateVariations) {
      const variationCount = request.variationCount || 3;
      logger.info('Generating scenario variations', { count: variationCount });
      
      variations = await generateScenarioVariations(
        request,
        variationCount,
        scenarioRepository,
        logger
      );
      
      logger.info('Variations generated', { count: variations.length });
    }

    const executionTime = Date.now() - startTime;

    // Build response
    const response: ScenarioAgentResponse = {
      scenario: storedScenario,
      variations,
      metadata: {
        correlationId,
        executionTime,
        generationMethod: 'bedrock-llm'
      }
    };

    logger.info('Scenario Agent completed successfully', {
      executionTime,
      scenarioId: storedScenario.scenarioId,
      variationsCount: variations?.length || 0
    });

    subsegment?.close();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    logger.error('Scenario Agent failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    subsegment?.addError(error as Error);
    subsegment?.close();

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId
      },
      body: JSON.stringify({
        error: 'Internal server error',
        correlationId,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

/**
 * Validate scenario request
 */
function validateRequest(request: ScenarioAgentRequest): string | null {
  if (!request.type || !Object.values(DisruptionType).includes(request.type)) {
    return 'Invalid or missing disruption type';
  }

  if (!request.severity || !Object.values(Severity).includes(request.severity)) {
    return 'Invalid or missing severity';
  }

  if (!request.location) {
    return 'Location is required';
  }

  if (typeof request.location.latitude !== 'number' || 
      request.location.latitude < -90 || 
      request.location.latitude > 90) {
    return 'Invalid latitude';
  }

  if (typeof request.location.longitude !== 'number' || 
      request.location.longitude < -180 || 
      request.location.longitude > 180) {
    return 'Invalid longitude';
  }

  if (!request.location.city || !request.location.country) {
    return 'Location must include city and country';
  }

  if (typeof request.duration !== 'number' || request.duration <= 0) {
    return 'Duration must be a positive number';
  }

  if (!Array.isArray(request.affectedNodes)) {
    return 'affectedNodes must be an array';
  }

  if (!request.userId) {
    return 'userId is required';
  }

  return null;
}

/**
 * Generate scenario using Amazon Bedrock
 */
async function generateScenario(
  request: ScenarioAgentRequest,
  logger: Logger
): Promise<Scenario> {
  const bedrockClient = new BedrockRuntimeClient({ 
    region: process.env.AWS_REGION || 'us-east-1' 
  });

  // Construct prompt for Bedrock
  const prompt = buildScenarioPrompt(request);
  
  logger.debug('Invoking Bedrock', { promptLength: prompt.length });

  try {
    // Use Claude 3 Sonnet model
    const modelId = 'anthropic.claude-3-sonnet-20240229-v1:0';
    
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    };

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    logger.debug('Bedrock response received', { 
      contentLength: responseBody.content?.[0]?.text?.length 
    });

    // Extract scenario details from LLM response
    const scenarioDetails = parseBedrockResponse(responseBody.content[0].text);

    // Build scenario object
    const parameters: ScenarioParameters = {
      location: request.location,
      severity: request.severity,
      duration: request.duration,
      affectedNodes: request.affectedNodes,
      customParameters: {
        ...request.customParameters,
        ...scenarioDetails.additionalParameters
      }
    };

    const scenario: Partial<Scenario> = {
      type: request.type,
      parameters,
      marketplaceMetadata: scenarioDetails.marketplaceMetadata
    };

    return scenario as Scenario;

  } catch (error) {
    logger.error('Bedrock invocation failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Fallback to rule-based generation if Bedrock fails
    logger.warn('Falling back to rule-based scenario generation');
    return generateScenarioRuleBased(request);
  }
}

/**
 * Build prompt for Bedrock LLM
 */
function buildScenarioPrompt(request: ScenarioAgentRequest): string {
  return `You are an expert supply chain analyst. Generate a detailed disruption scenario based on the following parameters:

Disruption Type: ${request.type}
Location: ${request.location.city}, ${request.location.country} (${request.location.latitude}, ${request.location.longitude})
Severity: ${request.severity}
Duration: ${request.duration} hours
Affected Nodes: ${request.affectedNodes.length} supply chain nodes

Please provide:
1. A detailed description of the disruption scenario (2-3 paragraphs)
2. Key risk factors and potential cascading effects
3. Estimated timeline of impact progression
4. Critical decision points for mitigation

Format your response as JSON with the following structure:
{
  "description": "detailed scenario description",
  "riskFactors": ["factor1", "factor2", ...],
  "timeline": "timeline description",
  "criticalDecisionPoints": ["point1", "point2", ...],
  "additionalParameters": {
    "estimatedCostImpact": number,
    "probabilityOfOccurrence": number (0-1)
  }
}`;
}

/**
 * Parse Bedrock response
 */
function parseBedrockResponse(responseText: string): {
  additionalParameters: Record<string, any>;
  marketplaceMetadata?: any;
} {
  try {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        additionalParameters: {
          description: parsed.description,
          riskFactors: parsed.riskFactors,
          timeline: parsed.timeline,
          criticalDecisionPoints: parsed.criticalDecisionPoints,
          ...parsed.additionalParameters
        }
      };
    }
  } catch (error) {
    // If parsing fails, return basic parameters
  }

  return {
    additionalParameters: {
      description: responseText.substring(0, 500),
      generatedByLLM: true
    }
  };
}

/**
 * Generate scenario using rule-based approach (fallback)
 */
function generateScenarioRuleBased(request: ScenarioAgentRequest): Scenario {
  const parameters: ScenarioParameters = {
    location: request.location,
    severity: request.severity,
    duration: request.duration,
    affectedNodes: request.affectedNodes,
    customParameters: {
      ...request.customParameters,
      generationMethod: 'rule-based',
      description: `${request.type} disruption at ${request.location.city}, ${request.location.country} with ${request.severity} severity`
    }
  };

  return {
    type: request.type,
    parameters
  } as Scenario;
}

/**
 * Generate scenario variations
 */
async function generateScenarioVariations(
  baseRequest: ScenarioAgentRequest,
  count: number,
  repository: ScenarioRepository,
  logger: Logger
): Promise<Scenario[]> {
  const variations: Scenario[] = [];
  
  // Define variation strategies
  const variationStrategies = [
    // Vary severity
    (req: ScenarioAgentRequest) => ({
      ...req,
      severity: varyEnumValue(req.severity, Object.values(Severity))
    }),
    // Vary duration
    (req: ScenarioAgentRequest) => ({
      ...req,
      duration: Math.max(1, Math.floor(req.duration * (0.5 + Math.random())))
    }),
    // Vary affected nodes
    (req: ScenarioAgentRequest) => ({
      ...req,
      affectedNodes: req.affectedNodes.length > 1 
        ? req.affectedNodes.slice(0, Math.max(1, Math.floor(req.affectedNodes.length * 0.7)))
        : req.affectedNodes
    }),
    // Vary location slightly
    (req: ScenarioAgentRequest) => ({
      ...req,
      location: {
        ...req.location,
        latitude: Math.max(-90, Math.min(90, req.location.latitude + (Math.random() - 0.5) * 2)),
        longitude: Math.max(-180, Math.min(180, req.location.longitude + (Math.random() - 0.5) * 2))
      }
    })
  ];

  for (let i = 0; i < count; i++) {
    try {
      // Apply random variation strategy
      const strategy = variationStrategies[i % variationStrategies.length];
      const variedRequest = strategy(baseRequest);
      
      logger.debug('Generating variation', { index: i });
      
      const variedScenario = await generateScenario(variedRequest, logger);
      
      // Store variation
      const storedVariation = await repository.createScenario({
        type: variedScenario.type,
        parameters: variedScenario.parameters,
        createdBy: baseRequest.userId,
        isPublic: baseRequest.isPublic || false,
        marketplaceMetadata: variedScenario.marketplaceMetadata
      });
      
      variations.push(storedVariation);
    } catch (error) {
      logger.warn('Failed to generate variation', {
        index: i,
        error: error instanceof Error ? error.message : String(error)
      });
      // Continue with other variations even if one fails
    }
  }

  return variations;
}

/**
 * Vary enum value to a different value
 */
function varyEnumValue<T>(current: T, allValues: T[]): T {
  const otherValues = allValues.filter(v => v !== current);
  return otherValues[Math.floor(Math.random() * otherValues.length)] || current;
}
