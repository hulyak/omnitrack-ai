/**
 * Voice Interface Handler
 * 
 * Main entry point for voice interface Lambda functions
 */

export { handler as lexFulfillmentHandler } from './lex-fulfillment';
export { VoiceService } from './voice-service';
export type {
  VoiceCommandInput,
  VoiceCommandResult,
  RecognizedIntent,
} from './voice-service';
