/**
 * Voice Interface Types
 * Type definitions for voice command processing and audio interaction
 */

export interface VoiceCommandInput {
  userId: string;
  transcript: string;
  sessionId: string;
  sessionAttributes?: Record<string, string>;
}

export interface RecognizedIntent {
  name: string;
  confidence: number;
  slots?: Record<string, string>;
}

export interface VoiceCommandResult {
  recognizedIntent: RecognizedIntent;
  audioResponse: string;
  visualData?: any;
  requiresClarification: boolean;
  clarificationPrompt?: string;
  executionStatus: 'success' | 'failed' | 'needs_clarification';
  executionTime?: number;
}

export interface VoiceCommandHistoryItem {
  id: string;
  timestamp: Date;
  transcript: string;
  intent: string;
  response: string;
  status: 'success' | 'failed' | 'needs_clarification';
}

export interface AudioVisualizationData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
}
