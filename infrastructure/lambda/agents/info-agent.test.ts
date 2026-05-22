/**
 * Unit tests for Info Agent Lambda handler
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from './info-agent';
import { NodeRepository } from '../repositories/node-repository';
import { AlertRepository } from '../repositories/alert-repository';

// Mock the repositories
jest.mock('../repositories/node-repository');
jest.mock('../repositories/alert-repository');

// Mock X-Ray
jest.mock('aws-xray-sdk-core', () => ({
  getSegment: jest.fn(() => ({
    addNewSubsegment: jest.fn(() => ({
      addAnnotation: jest.fn(),
      close: jest.fn(),
      addError: jest.fn()
    }))
  })),
  captureAWS: jest.fn((aws) => aws)
}));

describe('Info Agent Handler', () => {
  let mockEvent: Partial<APIGatewayProxyEvent>;
  let mockContext: Partial<Context>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEvent = {
      path: '/agents/info',
      httpMethod: 'POST',
      headers: {
        'x-correlation-id': 'test-correlation-id'
      },
      body: JSON.stringify({
        nodeIds: ['node-1', 'node-2'],
        includeAlerts: true
      }),
      requestContext: {
        requestId: 'test-request-id'
      } as any
    };

    mockContext = {
      awsRequestId: 'test-request-id',
      functionName: 'info-agent',
      getRemainingTimeInMillis: () => 30000
    } as any;
  });

  it('should successfully fetch nodes and alerts', async () => {
    // Arrange
    const mockNodes = [
      { nodeId: 'node-1', type: 'SUPPLIER', status: 'OPERATIONAL' },
      { nodeId: 'node-2', type: 'WAREHOUSE', status: 'OPERATIONAL' }
    ];

    const mockAlerts = [
      { alertId: 'alert-1', severity: 'HIGH', status: 'ACTIVE' }
    ];

    (NodeRepository.prototype.getNodesByIds as jest.Mock).mockResolvedValue(mockNodes);
    (AlertRepository.prototype.getAlertsByStatus as jest.Mock).mockResolvedValue({
      items: mockAlerts
    });

    // Act
    const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.headers?.['X-Correlation-Id']).toBe('test-correlation-id');

    const body = JSON.parse(result.body);
    expect(body.digitalTwinState.nodes).toEqual(mockNodes);
    expect(body.digitalTwinState.alerts).toEqual(mockAlerts);
    expect(body.metadata.correlationId).toBe('test-correlation-id');
    expect(body.metadata.executionTime).toBeGreaterThan(0);
    expect(body.metadata.dataSourcesQueried).toContain('DynamoDB');
  });

  it('should handle requests without specific node IDs', async () => {
    // Arrange
    mockEvent.body = JSON.stringify({
      includeAlerts: false
    });

    // Act
    const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

    // Assert
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.digitalTwinState.nodes).toEqual([]);
    expect(body.digitalTwinState.alerts).toBeUndefined();
  });

  it('should handle requests without alerts', async () => {
    // Arrange
    const mockNodes = [
      { nodeId: 'node-1', type: 'SUPPLIER', status: 'OPERATIONAL' }
    ];

    mockEvent.body = JSON.stringify({
      nodeIds: ['node-1'],
      includeAlerts: false
    });

    (NodeRepository.prototype.getNodesByIds as jest.Mock).mockResolvedValue(mockNodes);

    // Act
    const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

    // Assert
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.digitalTwinState.nodes).toEqual(mockNodes);
    expect(body.digitalTwinState.alerts).toBeUndefined();
    expect(AlertRepository.prototype.getAlertsByStatus).not.toHaveBeenCalled();
  });

  it('should generate correlation ID if not provided', async () => {
    // Arrange
    delete mockEvent.headers;
    delete (mockEvent as any).requestContext;
    mockEvent.body = JSON.stringify({ nodeIds: [] });

    // Act
    const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

    // Assert
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.metadata.correlationId).toBeDefined();
    expect(body.metadata.correlationId).toContain('info-');
  });

  it('should handle errors gracefully', async () => {
    // Arrange
    (NodeRepository.prototype.getNodesByIds as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    // Act
    const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

    // Assert
    expect(result.statusCode).toBe(500);
    expect(result.headers?.['X-Correlation-Id']).toBe('test-correlation-id');

    const body = JSON.parse(result.body);
    expect(body.error).toBe('Internal server error');
    expect(body.correlationId).toBe('test-correlation-id');
    expect(body.message).toBe('Database connection failed');
  });

  it('should include structured logging metadata', async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    mockEvent.body = JSON.stringify({ nodeIds: [] });

    // Act
    await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    const logCalls = consoleSpy.mock.calls;
    
    // Verify at least one log entry has the expected structure
    const hasStructuredLog = logCalls.some(call => {
      try {
        const logEntry = JSON.parse(call[0]);
        return (
          logEntry.correlationId === 'test-correlation-id' &&
          logEntry.requestId === 'test-request-id' &&
          logEntry.functionName === 'info-agent' &&
          logEntry.level &&
          logEntry.timestamp
        );
      } catch {
        return false;
      }
    });

    expect(hasStructuredLog).toBe(true);
    consoleSpy.mockRestore();
  });
});
