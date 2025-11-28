/**
 * AWS X-Ray Tracing Utility for OmniTrack Lambda Functions
 * 
 * Provides utilities for creating custom X-Ray segments and subsegments
 * to trace distributed workflows and identify performance bottlenecks.
 */

import * as AWSXRay from 'aws-xray-sdk-core';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

/**
 * Wrap AWS SDK clients with X-Ray tracing
 */
export function captureAWS<T>(awsService: T): T {
  return AWSXRay.captureAWS(awsService as any) as T;
}

/**
 * Wrap HTTP/HTTPS clients with X-Ray tracing
 */
export function captureHTTPs<T>(httpModule: T): T {
  return AWSXRay.captureHTTPs(httpModule as any) as T;
}

/**
 * Execute a function within a custom X-Ray subsegment
 */
export async function traceAsync<T>(
  name: string,
  fn: (subsegment: Subsegment) => Promise<T>,
  metadata?: Record<string, any>,
  annotations?: Record<string, string | number | boolean>
): Promise<T> {
  const segment = AWSXRay.getSegment();
  
  if (!segment) {
    // X-Ray not enabled, execute function without tracing
    return fn(null as any);
  }

  const subsegment = segment.addNewSubsegment(name);

  try {
    // Add metadata (searchable in X-Ray console)
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        subsegment.addMetadata(key, value);
      });
    }

    // Add annotations (indexed for filtering)
    if (annotations) {
      Object.entries(annotations).forEach(([key, value]) => {
        subsegment.addAnnotation(key, value);
      });
    }

    const result = await fn(subsegment);
    subsegment.close();
    return result;
  } catch (error) {
    subsegment.addError(error as Error);
    subsegment.close();
    throw error;
  }
}

/**
 * Execute a synchronous function within a custom X-Ray subsegment
 */
export function traceSync<T>(
  name: string,
  fn: (subsegment: Subsegment) => T,
  metadata?: Record<string, any>,
  annotations?: Record<string, string | number | boolean>
): T {
  const segment = AWSXRay.getSegment();
  
  if (!segment) {
    // X-Ray not enabled, execute function without tracing
    return fn(null as any);
  }

  const subsegment = segment.addNewSubsegment(name);

  try {
    // Add metadata
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        subsegment.addMetadata(key, value);
      });
    }

    // Add annotations
    if (annotations) {
      Object.entries(annotations).forEach(([key, value]) => {
        subsegment.addAnnotation(key, value);
      });
    }

    const result = fn(subsegment);
    subsegment.close();
    return result;
  } catch (error) {
    subsegment.addError(error as Error);
    subsegment.close();
    throw error;
  }
}

/**
 * Trace a database operation
 */
export async function traceDatabaseOperation<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  return traceAsync(
    `DynamoDB.${operation}`,
    async (subsegment) => {
      const startTime = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        
        if (subsegment) {
          subsegment.addMetadata('duration', duration);
        }
        
        return result;
      } catch (error) {
        throw error;
      }
    },
    { table },
    { operation, table }
  );
}

/**
 * Trace an external API call
 */
export async function traceExternalApiCall<T>(
  serviceName: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return traceAsync(
    `${serviceName}.${operation}`,
    async (subsegment) => {
      const startTime = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        
        if (subsegment) {
          subsegment.addMetadata('duration', duration);
        }
        
        return result;
      } catch (error) {
        throw error;
      }
    },
    { service: serviceName },
    { service: serviceName, operation }
  );
}

/**
 * Trace agent execution
 */
export async function traceAgentExecution<T>(
  agentName: string,
  fn: () => Promise<T>,
  inputParameters?: Record<string, any>
): Promise<T> {
  return traceAsync(
    `Agent.${agentName}`,
    async (subsegment) => {
      const startTime = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        
        if (subsegment) {
          subsegment.addMetadata('duration', duration);
          subsegment.addMetadata('success', true);
        }
        
        return result;
      } catch (error) {
        if (subsegment) {
          subsegment.addMetadata('success', false);
        }
        throw error;
      }
    },
    { inputParameters },
    { agentName }
  );
}

/**
 * Trace simulation execution
 */
export async function traceSimulation<T>(
  scenarioType: string,
  scenarioId: string,
  fn: () => Promise<T>
): Promise<T> {
  return traceAsync(
    'Simulation',
    async (subsegment) => {
      const startTime = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        
        if (subsegment) {
          subsegment.addMetadata('duration', duration);
          subsegment.addMetadata('scenarioId', scenarioId);
        }
        
        return result;
      } catch (error) {
        throw error;
      }
    },
    { scenarioId },
    { scenarioType }
  );
}

/**
 * Trace cache operation
 */
export async function traceCacheOperation<T>(
  operation: 'get' | 'set' | 'delete',
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  return traceAsync(
    `Cache.${operation}`,
    async (subsegment) => {
      const startTime = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        
        if (subsegment) {
          subsegment.addMetadata('duration', duration);
          subsegment.addMetadata('key', key);
        }
        
        return result;
      } catch (error) {
        throw error;
      }
    },
    { key },
    { operation }
  );
}

/**
 * Add custom annotation to current segment
 */
export function addAnnotation(key: string, value: string | number | boolean): void {
  const segment = AWSXRay.getSegment();
  if (segment) {
    segment.addAnnotation(key, value);
  }
}

/**
 * Add custom metadata to current segment
 */
export function addMetadata(key: string, value: any, namespace?: string): void {
  const segment = AWSXRay.getSegment();
  if (segment) {
    segment.addMetadata(key, value, namespace);
  }
}

/**
 * Get current trace ID for correlation
 */
export function getTraceId(): string | undefined {
  const segment = AWSXRay.getSegment();
  if (segment && 'trace_id' in segment) {
    return (segment as any).trace_id;
  }
  return undefined;
}

/**
 * Set user ID for X-Ray user tracking
 */
export function setUser(userId: string): void {
  const segment = AWSXRay.getSegment();
  if (segment && 'setUser' in segment) {
    (segment as any).setUser(userId);
  }
}
