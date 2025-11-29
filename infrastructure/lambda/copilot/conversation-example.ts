/**
 * Example usage of ConversationService and ContextResolver
 * 
 * This file demonstrates how to use the conversation management
 * and context resolution services together.
 */

import { ConversationService } from './conversation-service';
import { ContextResolver } from './context-resolver';
import { createBedrockService } from './bedrock-service';

/**
 * Example: Complete conversation flow with context resolution
 */
export async function conversationFlowExample() {
  // Initialize services
  const bedrockService = createBedrockService();
  const conversationService = new ConversationService(bedrockService);
  const contextResolver = new ContextResolver();

  // 1. Create a new conversation
  const conversation = await conversationService.createConversation(
    'user123',
    'conn456',
    {
      nodes: [],
      edges: [],
      configuration: {
        region: 'us-east',
        industry: 'manufacturing',
      },
    }
  );

  console.log('Created conversation:', conversation.id);

  // 2. User sends first message
  const message1 = await conversationService.addMessage(conversation.id, {
    role: 'user',
    content: 'Add a supplier named Acme Corp in California',
  });

  console.log('User message 1:', message1.content);

  // 3. Assistant responds
  const response1 = await conversationService.addMessage(conversation.id, {
    role: 'assistant',
    content: 'I\'ve added supplier "Acme Corp" in California to your supply chain network.',
  });

  console.log('Assistant response 1:', response1.content);

  // 4. User sends message with pronoun reference
  const message2Content = 'Update it with capacity of 10000 units';

  // Get conversation history for context
  const history = await conversationService.getConversationHistory(
    conversation.id
  );

  // Resolve pronoun references
  const enhanced = contextResolver.createEnhancedMessage(
    message2Content,
    history
  );

  console.log('Original message:', enhanced.originalMessage);
  console.log('Enhanced message:', enhanced.enhancedMessage);
  console.log('Has references:', enhanced.hasReferences);

  // Add the enhanced message to conversation
  const message2 = await conversationService.addMessage(conversation.id, {
    role: 'user',
    content: enhanced.enhancedMessage,
  });

  // 5. Get conversation context for intent classification
  const context = await conversationService.getConversationContext(
    conversation.id
  );

  console.log('Recent messages:', context.recentMessages.length);
  console.log('Supply chain context:', context.supplyChainContext);

  // 6. Check context size
  const isValid = conversationService.isContextSizeValid(
    context.recentMessages
  );
  console.log('Context size valid:', isValid);

  // 7. Simulate long conversation (trigger summarization)
  for (let i = 0; i < 12; i++) {
    await conversationService.addMessage(conversation.id, {
      role: 'user',
      content: `Message ${i}`,
    });
    await conversationService.addMessage(conversation.id, {
      role: 'assistant',
      content: `Response ${i}`,
    });
  }

  // Get updated conversation (should have summary)
  const updatedConversation = await conversationService.getConversation(
    conversation.id
  );
  console.log('Has summary:', !!updatedConversation?.summary);
  console.log('Summary:', updatedConversation?.summary);

  return conversation.id;
}

/**
 * Example: Entity tracking and resolution
 */
export async function entityTrackingExample() {
  const conversationService = new ConversationService();
  const contextResolver = new ContextResolver();

  // Create conversation
  const conversation = await conversationService.createConversation(
    'user456',
    'conn789',
    {}
  );

  // Add messages with various entities
  await conversationService.addMessage(conversation.id, {
    role: 'user',
    content: 'Add supplier Acme Corp',
  });

  await conversationService.addMessage(conversation.id, {
    role: 'user',
    content: 'Add warehouse Boston Hub',
  });

  await conversationService.addMessage(conversation.id, {
    role: 'user',
    content: 'Run simulation port-closure-test',
  });

  // Get history and track entities
  const history = await conversationService.getConversationHistory(
    conversation.id
  );
  const context = contextResolver.trackEntities(history);

  console.log('Tracked entities:', context.entities.length);
  console.log('Last node:', context.lastNode?.name);
  console.log('Last simulation:', context.lastSimulation?.name);

  // Test pronoun resolution
  const testMessages = [
    'Update it',
    'Remove that',
    'Show me details about this',
  ];

  for (const msg of testMessages) {
    const { resolvedMessage, references } = contextResolver.resolveReferences(
      msg,
      context
    );
    console.log(`"${msg}" -> "${resolvedMessage}"`);
    console.log('References:', references);
  }

  // Get entities by type
  const nodes = contextResolver.getEntitiesByType('node', context);
  console.log('Node entities:', nodes.map((n) => n.name));

  const simulations = contextResolver.getEntitiesByType('simulation', context);
  console.log('Simulation entities:', simulations.map((s) => s.name));

  return conversation.id;
}

/**
 * Example: Context management and summarization
 */
export async function contextManagementExample() {
  const conversationService = new ConversationService();

  // Create conversation
  const conversation = await conversationService.createConversation(
    'user789',
    'conn012',
    {}
  );

  // Add many messages to trigger summarization
  const messages = [
    'Add supplier Acme Corp',
    'Add warehouse Boston Hub',
    'Connect Acme Corp to Boston Hub',
    'Set shipping method to air freight',
    'Run simulation for demand spike',
    'What are the results?',
    'Add another warehouse in Seattle',
    'Connect Boston Hub to Seattle',
    'Run another simulation',
    'Show me the network summary',
    'What are the recent alerts?',
    'Update Acme Corp capacity',
  ];

  for (const content of messages) {
    await conversationService.addMessage(conversation.id, {
      role: 'user',
      content,
    });
    await conversationService.addMessage(conversation.id, {
      role: 'assistant',
      content: `Processed: ${content}`,
    });
  }

  // Get conversation (should have summary)
  const updatedConversation = await conversationService.getConversation(
    conversation.id
  );

  console.log('Total messages:', updatedConversation?.messages.length);
  console.log('Has summary:', !!updatedConversation?.summary);
  console.log('Summary:', updatedConversation?.summary);

  // Get context (should include summary + recent messages)
  const context = await conversationService.getConversationContext(
    conversation.id
  );

  console.log('Recent messages:', context.recentMessages.length);
  console.log('Summary available:', !!context.summary);

  // Check token count
  const tokenCount = conversationService.estimateTokenCount(
    context.recentMessages
  );
  console.log('Estimated tokens:', tokenCount);

  return conversation.id;
}

/**
 * Example: Supply chain context updates
 */
export async function supplyChainContextExample() {
  const conversationService = new ConversationService();

  // Create conversation with initial context
  const conversation = await conversationService.createConversation(
    'user999',
    'conn345',
    {
      nodes: [
        { id: 'node1', type: 'supplier', name: 'Acme Corp' },
      ],
      edges: [],
      configuration: {
        region: 'us-east',
        industry: 'manufacturing',
      },
    }
  );

  console.log('Initial context:', conversation.context);

  // Update context after action
  await conversationService.updateSupplyChainContext(conversation.id, {
    nodes: [
      { id: 'node1', type: 'supplier', name: 'Acme Corp' },
      { id: 'node2', type: 'warehouse', name: 'Boston Hub' },
    ],
    edges: [
      { from: 'node1', to: 'node2', type: 'shipping' },
    ],
    configuration: {
      region: 'us-east',
      industry: 'manufacturing',
    },
  });

  // Get updated conversation
  const updated = await conversationService.getConversation(conversation.id);
  console.log('Updated context:', updated?.context);

  // Update metadata
  await conversationService.updateMetadata(conversation.id, {
    totalTokens: 1500,
    averageResponseTime: 850,
  });

  const withMetadata = await conversationService.getConversation(
    conversation.id
  );
  console.log('Metadata:', withMetadata?.metadata);

  return conversation.id;
}

/**
 * Example: Clearing conversation (new session)
 */
export async function clearConversationExample() {
  const conversationService = new ConversationService();

  // Create and populate conversation
  const conversation = await conversationService.createConversation(
    'user111',
    'conn678',
    {}
  );

  await conversationService.addMessage(conversation.id, {
    role: 'user',
    content: 'Add supplier Acme Corp',
  });

  await conversationService.addMessage(conversation.id, {
    role: 'assistant',
    content: 'Added supplier Acme Corp',
  });

  console.log('Messages before clear:', conversation.messages.length);

  // Clear conversation
  await conversationService.clearConversation(conversation.id);

  // Get cleared conversation
  const cleared = await conversationService.getConversation(conversation.id);
  console.log('Messages after clear:', cleared?.messages.length);
  console.log('Summary after clear:', cleared?.summary);

  return conversation.id;
}

// Export all examples
export const examples = {
  conversationFlow: conversationFlowExample,
  entityTracking: entityTrackingExample,
  contextManagement: contextManagementExample,
  supplyChainContext: supplyChainContextExample,
  clearConversation: clearConversationExample,
};
