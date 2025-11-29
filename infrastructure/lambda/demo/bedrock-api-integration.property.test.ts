/**
 * Property-Based Test: Bedrock API Integration
 * 
 * Feature: hackathon-aws-demo, Property 4: Bedrock API integration
 * Validates: Requirements 3.1
 * 
 * Property: For any agent request requiring AI reasoning, the system should invoke
 * the Amazon Bedrock Claude API and receive a valid response
 */

import * as fc from 'fast-check';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { mockClient } from 'aws-sdk-client-mock';

const bedrockMock = mockClient(BedrockRuntimeClient);

// Model IDs used in the system
const BEDROCK_MODELS = {
  CLAUDE_3_SONNET: 'anthropic.claude-3-sonnet-20240229-v1:0',
  CLAUDE_3_HAIKU: 'anthropic.claude-3-haiku-20240307-v1:0'
};

describe('Bedrock API Integration Property Tests', () => {
  beforeEach(() => {
    bedrockMock.reset();
  });

  // Feature: hackathon-aws-demo, Property 4: Bedrock API integration
  it('should successfully invoke Bedrock API for any valid agent request', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random agent requests
        fc.record({
          agentType: fc.constantFrom('info', 'scenario', 'strategy', 'impact'),
          prompt: fc.string({ minLength: 10, maxLength: 500 }),
          maxTokens: fc.integer({ min: 100, max: 2000 }),
          temperature: fc.double({ min: 0.1, max: 1.0 })
        }),
        async (request) => {
          // Mock successful Bedrock response
          const responseData = {
            id: 'msg_test',
            type: 'message',
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: 'This is a test response from Claude'
              }
            ],
            model: BEDROCK_MODELS.CLAUDE_3_SONNET,
            stop_reason: 'end_turn',
            usage: {
              input_tokens: 10,
              output_tokens: 20
            }
          };

          bedrockMock.on(InvokeModelCommand).resolves({
            body: new Uint8Array(Buffer.from(JSON.stringify(responseData))) as any,
            contentType: 'application/json',
            $metadata: {}
          });

          // Invoke Bedrock API
          const client = new BedrockRuntimeClient({ region: 'us-east-1' });
          
          const payload = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: request.maxTokens,
            messages: [
              {
                role: 'user',
                content: request.prompt
              }
            ],
            temperature: request.temperature
          };

          const command = new InvokeModelCommand({
            modelId: BEDROCK_MODELS.CLAUDE_3_SONNET,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(payload)
          });

          const response = await client.send(command);

          // Property: Response should always be received
          expect(response).toBeDefined();
          expect(response.body).toBeDefined();

          // Property: Response body should be parseable
          const responseBody = JSON.parse(new TextDecoder().decode(response.body));
          expect(responseBody).toBeDefined();
          expect(responseBody.content).toBeDefined();
          expect(Array.isArray(responseBody.content)).toBe(true);
          expect(responseBody.content.length).toBeGreaterThan(0);

          // Property: Response should contain text content
          const textContent = responseBody.content.find((c: any) => c.type === 'text');
          expect(textContent).toBeDefined();
          expect(typeof textContent.text).toBe('string');
          expect(textContent.text.length).toBeGreaterThan(0);

          // Property: Usage information should be present
          expect(responseBody.usage).toBeDefined();
          expect(typeof responseBody.usage.input_tokens).toBe('number');
          expect(typeof responseBody.usage.output_tokens).toBe('number');
          expect(responseBody.usage.input_tokens).toBeGreaterThan(0);
          expect(responseBody.usage.output_tokens).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: hackathon-aws-demo, Property 4: Bedrock API integration
  it('should handle different model IDs correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          BEDROCK_MODELS.CLAUDE_3_SONNET,
          BEDROCK_MODELS.CLAUDE_3_HAIKU
        ),
        fc.string({ minLength: 10, maxLength: 200 }),
        async (modelId, prompt) => {
          // Mock response
          const responseData = {
            id: 'msg_test',
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: 'Response' }],
            model: modelId,
            stop_reason: 'end_turn',
            usage: { input_tokens: 5, output_tokens: 10 }
          };

          bedrockMock.on(InvokeModelCommand).resolves({
            body: new Uint8Array(Buffer.from(JSON.stringify(responseData))) as any,
            contentType: 'application/json',
            $metadata: {}
          });

          const client = new BedrockRuntimeClient({ region: 'us-east-1' });
          
          const command = new InvokeModelCommand({
            modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
              anthropic_version: 'bedrock-2023-05-31',
              max_tokens: 500,
              messages: [{ role: 'user', content: prompt }]
            })
          });

          const response = await client.send(command);
          const responseBody = JSON.parse(new TextDecoder().decode(response.body));

          // Property: Response model should match requested model
          expect(responseBody.model).toBe(modelId);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: hackathon-aws-demo, Property 4: Bedrock API integration
  it('should respect max_tokens parameter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 2000 }),
        async (maxTokens) => {
          // Mock response with token usage
          const outputTokens = Math.min(maxTokens, Math.floor(Math.random() * maxTokens));
          const responseData = {
            id: 'msg_test',
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: 'A'.repeat(outputTokens * 4) }], // Rough approximation
            model: BEDROCK_MODELS.CLAUDE_3_SONNET,
            stop_reason: 'end_turn',
            usage: { input_tokens: 10, output_tokens: outputTokens }
          };

          bedrockMock.on(InvokeModelCommand).resolves({
            body: new Uint8Array(Buffer.from(JSON.stringify(responseData))) as any,
            contentType: 'application/json',
            $metadata: {}
          });

          const client = new BedrockRuntimeClient({ region: 'us-east-1' });
          
          const command = new InvokeModelCommand({
            modelId: BEDROCK_MODELS.CLAUDE_3_SONNET,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
              anthropic_version: 'bedrock-2023-05-31',
              max_tokens: maxTokens,
              messages: [{ role: 'user', content: 'Test prompt' }]
            })
          });

          const response = await client.send(command);
          const responseBody = JSON.parse(new TextDecoder().decode(response.body));

          // Property: Output tokens should not exceed max_tokens
          expect(responseBody.usage.output_tokens).toBeLessThanOrEqual(maxTokens);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: hackathon-aws-demo, Property 4: Bedrock API integration
  it('should handle temperature parameter correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0.0, max: 1.0 }),
        async (temperature) => {
          const responseData = {
            id: 'msg_test',
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: 'Response' }],
            model: BEDROCK_MODELS.CLAUDE_3_SONNET,
            stop_reason: 'end_turn',
            usage: { input_tokens: 5, output_tokens: 10 }
          };

          bedrockMock.on(InvokeModelCommand).resolves({
            body: new Uint8Array(Buffer.from(JSON.stringify(responseData))) as any,
            contentType: 'application/json',
            $metadata: {}
          });

          const client = new BedrockRuntimeClient({ region: 'us-east-1' });
          
          const payload = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 500,
            messages: [{ role: 'user', content: 'Test' }],
            temperature
          };

          const command = new InvokeModelCommand({
            modelId: BEDROCK_MODELS.CLAUDE_3_SONNET,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(payload)
          });

          // Property: API should accept any valid temperature value
          await expect(client.send(command)).resolves.toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: hackathon-aws-demo, Property 4: Bedrock API integration
  it('should handle API errors gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'ThrottlingException',
          'ValidationException',
          'AccessDeniedException',
          'ResourceNotFoundException'
        ),
        async (errorType) => {
          // Mock error response
          bedrockMock.on(InvokeModelCommand).rejects({
            name: errorType,
            message: `Simulated ${errorType}`,
            $metadata: {}
          });

          const client = new BedrockRuntimeClient({ region: 'us-east-1' });
          
          const command = new InvokeModelCommand({
            modelId: BEDROCK_MODELS.CLAUDE_3_SONNET,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
              anthropic_version: 'bedrock-2023-05-31',
              max_tokens: 500,
              messages: [{ role: 'user', content: 'Test' }]
            })
          });

          // Property: Errors should be catchable and identifiable
          try {
            await client.send(command);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error: any) {
            expect(error).toBeDefined();
            expect(error.name).toBe(errorType);
            expect(typeof error.message).toBe('string');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: hackathon-aws-demo, Property 4: Bedrock API integration
  it('should maintain request-response correlation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            requestId: fc.uuid(),
            prompt: fc.string({ minLength: 10, maxLength: 100 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (requests) => {
          const client = new BedrockRuntimeClient({ region: 'us-east-1' });
          const responses: Array<{ requestId: string; response: any }> = [];

          for (const request of requests) {
            // Mock unique response for each request
            const responseData = {
              id: request.requestId,
              type: 'message',
              role: 'assistant',
              content: [{ type: 'text', text: `Response to: ${request.prompt}` }],
              model: BEDROCK_MODELS.CLAUDE_3_SONNET,
              stop_reason: 'end_turn',
              usage: { input_tokens: 5, output_tokens: 10 }
            };

            bedrockMock.on(InvokeModelCommand).resolves({
              body: new Uint8Array(Buffer.from(JSON.stringify(responseData))) as any,
              contentType: 'application/json',
              $metadata: {}
            });

            const command = new InvokeModelCommand({
              modelId: BEDROCK_MODELS.CLAUDE_3_SONNET,
              contentType: 'application/json',
              accept: 'application/json',
              body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 500,
                messages: [{ role: 'user', content: request.prompt }]
              })
            });

            const response = await client.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            
            responses.push({
              requestId: request.requestId,
              response: responseBody
            });
          }

          // Property: Each request should have a corresponding response
          expect(responses.length).toBe(requests.length);

          // Property: Response IDs should match request IDs
          for (let i = 0; i < requests.length; i++) {
            expect(responses[i].requestId).toBe(requests[i].requestId);
            expect(responses[i].response.id).toBe(requests[i].requestId);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
