/**
 * Amazon Lex Fulfillment Handler
 * 
 * Lambda function handler for Amazon Lex bot fulfillment.
 * Processes recognized intents from Lex and executes corresponding commands.
 */

import { VoiceService, VoiceCommandInput } from './voice-service';

export interface LexEvent {
  sessionState: {
    intent: {
      name: string;
      state: string;
      slots?: Record<string, { value?: { interpretedValue?: string } }>;
    };
    sessionAttributes?: Record<string, string>;
  };
  sessionId: string;
  inputTranscript: string;
  requestAttributes?: Record<string, string>;
}

export interface LexResponse {
  sessionState: {
    dialogAction: {
      type: 'Close' | 'ElicitSlot' | 'ConfirmIntent' | 'Delegate';
      slotToElicit?: string;
    };
    intent: {
      name: string;
      state: 'Fulfilled' | 'Failed' | 'InProgress';
      slots?: Record<string, any>;
    };
    sessionAttributes?: Record<string, string>;
  };
  messages?: Array<{
    contentType: 'PlainText' | 'SSML';
    content: string;
  }>;
}

const voiceService = new VoiceService();

/**
 * Lambda handler for Lex fulfillment
 */
export async function handler(event: LexEvent): Promise<LexResponse> {
  console.log('Lex event received:', JSON.stringify(event, null, 2));

  try {
    // Extract user ID from session attributes or request attributes
    const userId =
      event.sessionState.sessionAttributes?.userId ||
      event.requestAttributes?.userId ||
      'anonymous';

    // Extract slots from Lex event
    const slots: Record<string, string> = {};
    if (event.sessionState.intent.slots) {
      for (const [key, value] of Object.entries(event.sessionState.intent.slots)) {
        if (value?.value?.interpretedValue) {
          slots[key] = value.value.interpretedValue;
        }
      }
    }

    // Create voice command input
    const voiceInput: VoiceCommandInput = {
      userId,
      transcript: event.inputTranscript,
      sessionId: event.sessionId,
      sessionAttributes: event.sessionState.sessionAttributes,
    };

    // Process the voice command
    const result = await voiceService.processVoiceCommand(voiceInput);

    // Build Lex response based on execution result
    if (result.requiresClarification) {
      return buildClarificationResponse(event, result.clarificationPrompt || '');
    }

    if (result.executionStatus === 'success') {
      return buildSuccessResponse(event, result.audioResponse, result.visualData);
    }

    return buildFailureResponse(event, result.audioResponse);
  } catch (error) {
    console.error('Error processing Lex fulfillment:', error);
    return buildFailureResponse(
      event,
      'An error occurred while processing your request.'
    );
  }
}

/**
 * Build Lex response for clarification needed
 */
function buildClarificationResponse(
  event: LexEvent,
  clarificationPrompt: string
): LexResponse {
  return {
    sessionState: {
      dialogAction: {
        type: 'ElicitSlot',
        slotToElicit: 'clarification',
      },
      intent: {
        name: event.sessionState.intent.name,
        state: 'InProgress',
        slots: event.sessionState.intent.slots,
      },
      sessionAttributes: event.sessionState.sessionAttributes,
    },
    messages: [
      {
        contentType: 'PlainText',
        content: clarificationPrompt,
      },
    ],
  };
}

/**
 * Build Lex response for successful execution
 */
function buildSuccessResponse(
  event: LexEvent,
  audioResponse: string,
  visualData?: any
): LexResponse {
  const sessionAttributes: Record<string, string> = {
    ...event.sessionState.sessionAttributes,
    lastExecutionStatus: 'success',
    ...(visualData ? { visualData: JSON.stringify(visualData) } : {}),
  };

  return {
    sessionState: {
      dialogAction: {
        type: 'Close',
      },
      intent: {
        name: event.sessionState.intent.name,
        state: 'Fulfilled',
        slots: event.sessionState.intent.slots,
      },
      sessionAttributes,
    },
    messages: [
      {
        contentType: 'PlainText',
        content: audioResponse,
      },
    ],
  };
}

/**
 * Build Lex response for failed execution
 */
function buildFailureResponse(event: LexEvent, errorMessage: string): LexResponse {
  return {
    sessionState: {
      dialogAction: {
        type: 'Close',
      },
      intent: {
        name: event.sessionState.intent.name,
        state: 'Failed',
        slots: event.sessionState.intent.slots,
      },
      sessionAttributes: {
        ...event.sessionState.sessionAttributes,
        lastExecutionStatus: 'failed',
      },
    },
    messages: [
      {
        contentType: 'PlainText',
        content: errorMessage,
      },
    ],
  };
}

/**
 * Helper function to extract slot value from Lex slot object
 */
export function extractSlotValue(
  slot: { value?: { interpretedValue?: string } } | undefined
): string | undefined {
  return slot?.value?.interpretedValue;
}
