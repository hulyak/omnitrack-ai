/**
 * Security Headers Middleware
 * 
 * Adds security headers to all API responses to protect against common web vulnerabilities.
 * Validates: Requirements 12.1, 12.2, 12.5
 */

export interface SecurityHeaders {
  'Strict-Transport-Security': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Content-Security-Policy': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Cache-Control': string;
}

/**
 * Get security headers for API responses
 */
export function getSecurityHeaders(): SecurityHeaders {
  return {
    // HSTS - Force HTTPS for 1 year, include subdomains
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Content Security Policy - restrict resource loading
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for API responses
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.amazonaws.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
    
    // Referrer policy - don't leak referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy - disable unnecessary browser features
    'Permissions-Policy': [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', '),
    
    // Cache control - prevent caching of sensitive data
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  };
}

/**
 * Apply security headers to API Gateway response
 */
export function applySecurityHeaders(response: any): any {
  const securityHeaders = getSecurityHeaders();
  
  return {
    ...response,
    headers: {
      ...(response.headers || {}),
      ...securityHeaders,
    },
  };
}

/**
 * Middleware wrapper for Lambda handlers
 */
export function withSecurityHeaders(
  handler: (event: any, context: any) => Promise<any>
) {
  return async (event: any, context: any): Promise<any> => {
    try {
      const response = await handler(event, context);
      return applySecurityHeaders(response);
    } catch (error) {
      // Even error responses should have security headers
      const errorResponse = {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      };
      return applySecurityHeaders(errorResponse);
    }
  };
}

/**
 * Validate request headers for security
 */
export function validateRequestHeaders(headers: Record<string, string>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for required headers
  if (!headers['user-agent']) {
    errors.push('Missing User-Agent header');
  }

  // Check for suspicious patterns
  if (headers['user-agent'] && headers['user-agent'].length > 500) {
    errors.push('User-Agent header too long');
  }

  // Check for SQL injection patterns in headers
  const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i;
  for (const [key, value] of Object.entries(headers)) {
    if (sqlInjectionPattern.test(value)) {
      errors.push(`Suspicious pattern detected in header: ${key}`);
    }
  }

  // Check for XSS patterns in headers
  const xssPattern = /<script|javascript:|onerror=|onload=/i;
  for (const [key, value] of Object.entries(headers)) {
    if (xssPattern.test(value)) {
      errors.push(`XSS pattern detected in header: ${key}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize response data to prevent information leakage
 */
export function sanitizeResponse(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    // Remove sensitive fields from responses
    const sensitiveFields = [
      'password',
      'secret',
      'token',
      'apiKey',
      'privateKey',
      'accessKey',
      'secretKey',
    ];

    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      continue; // Skip sensitive fields
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      (sanitized as any)[key] = sanitizeResponse(value);
    } else {
      (sanitized as any)[key] = value;
    }
  }

  return sanitized;
}
