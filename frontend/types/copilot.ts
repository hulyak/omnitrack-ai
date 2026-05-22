/**
 * Type definitions for AI Copilot components
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface CopilotChatProps {
  isOpen: boolean;
  onClose: () => void;
  supplyChainContext?: SupplyChainContext;
}

export interface CopilotInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  suggestions?: string[];
}

export interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

export interface SuggestedPromptsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
}

export interface SupplyChainContext {
  nodes: any[];
  edges: any[];
  configuration: any;
  recentActions: any[];
  activeSimulations: any[];
}

export interface CopilotResponse {
  type: 'message' | 'error' | 'complete';
  content: string;
  metadata?: {
    intent: string;
    confidence: number;
    executionTime: number;
  };
}

export interface StreamingMessage extends Message {
  isStreaming?: boolean;
}

export interface WebSocketHookOptions {
  userId?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface WebSocketHookReturn {
  isConnected: boolean;
  isConnecting: boolean;
  sendMessage: (message: string) => void;
  messages: Message[];
  isTyping: boolean;
  error: string | null;
  conversationId: string | null;
  connect: () => void;
  disconnect: () => void;
}
