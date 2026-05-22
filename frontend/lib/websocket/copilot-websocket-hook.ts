'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '@/types/copilot';

/**
 * WebSocket message types from backend
 */
type WebSocketMessageType = 
  | 'acknowledgment'
  | 'typing'
  | 'message'
  | 'stream_start'
  | 'stream_token'
  | 'stream_complete'
  | 'stream_interrupted'
  | 'suggestions'
  | 'complete'
  | 'error';

interface WebSocketMessage {
  type: WebSocketMessageType;
  content?: string;
  token?: string;
  error?: string;
  conversationId?: string;
  timestamp: number;
  metadata?: {
    intent?: string;
    confidence?: number;
    actionSuccess?: boolean;
    executionTime?: number;
    tokenCount?: number;
  };
  suggestions?: string[];
  partialResponse?: string;
}

interface QueuedMessage {
  message: string;
  timestamp: number;
}

interface UseCopilotWebSocketOptions {
  userId?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface UseCopilotWebSocketReturn {
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

/**
 * Custom hook for managing WebSocket connection to the AI Copilot backend
 * 
 * Features:
 * - Automatic connection lifecycle management
 * - Reconnection logic with exponential backoff
 * - Message queue for offline messages
 * - Streaming message support
 * - Error handling
 * 
 * Requirements: 2.1 - WebSocket connection management
 */
export function useCopilotWebSocket(
  options: UseCopilotWebSocketOptions = {}
): UseCopilotWebSocketReturn {
  const {
    userId = 'anonymous',
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const currentStreamingMessageRef = useRef<string>('');
  const streamingMessageIdRef = useRef<string | null>(null);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnecting) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    const wsUrl = process.env.NEXT_PUBLIC_COPILOT_WS_URL || 'ws://localhost:3001/copilot';
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    try {
      const ws = new WebSocket(`${wsUrl}?userId=${userId}&token=${token || ''}`);

      ws.onopen = () => {
        console.log('Copilot WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Send queued messages
        if (messageQueueRef.current.length > 0) {
          console.log(`Sending ${messageQueueRef.current.length} queued messages`);
          messageQueueRef.current.forEach((queuedMsg) => {
            ws.send(
              JSON.stringify({
                action: 'message',
                message: queuedMsg.message,
                conversationId: conversationId,
                streaming: true,
              })
            );
          });
          messageQueueRef.current = [];
        }
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
          setError('Failed to parse server message');
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        console.log('Copilot WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          const delay = Math.min(
            reconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          reconnectAttemptsRef.current += 1;

          console.log(
            `Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${reconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError('Failed to reconnect after multiple attempts');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [userId, conversationId, isConnecting, reconnectAttempts, reconnectDelay]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  /**
   * Handle incoming WebSocket messages
   */
  const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case 'acknowledgment':
        console.log('Message acknowledged');
        break;

      case 'typing':
        setIsTyping(true);
        break;

      case 'message':
        // Non-streaming message
        if (data.content) {
          const newMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.content,
            timestamp: new Date(data.timestamp),
          };
          setMessages((prev) => [...prev, newMessage]);
        }
        setIsTyping(false);
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
        break;

      case 'stream_start':
        // Start of streaming message
        setIsTyping(false);
        currentStreamingMessageRef.current = '';
        streamingMessageIdRef.current = `msg-${Date.now()}`;
        
        const streamingMessage: Message = {
          id: streamingMessageIdRef.current,
          role: 'assistant',
          content: '',
          timestamp: new Date(data.timestamp),
          isStreaming: true,
        };
        setMessages((prev) => [...prev, streamingMessage]);
        
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
        break;

      case 'stream_token':
        // Streaming token received
        if (data.token && streamingMessageIdRef.current) {
          currentStreamingMessageRef.current += data.token;
          
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageIdRef.current
                ? { ...msg, content: currentStreamingMessageRef.current }
                : msg
            )
          );
        }
        break;

      case 'stream_complete':
        // Streaming complete
        if (streamingMessageIdRef.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageIdRef.current
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
          streamingMessageIdRef.current = null;
          currentStreamingMessageRef.current = '';
        }
        break;

      case 'stream_interrupted':
        // Streaming interrupted
        if (streamingMessageIdRef.current && data.partialResponse) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageIdRef.current
                ? {
                    ...msg,
                    content: data.partialResponse + ' [interrupted]',
                    isStreaming: false,
                  }
                : msg
            )
          );
          streamingMessageIdRef.current = null;
          currentStreamingMessageRef.current = '';
        }
        setError('Streaming was interrupted');
        break;

      case 'suggestions':
        // Handle suggestions (could be displayed in UI)
        console.log('Suggestions received:', data.suggestions);
        break;

      case 'complete':
        // Message processing complete
        console.log('Message processing complete');
        break;

      case 'error':
        // Error from server
        setError(data.error || 'An error occurred');
        setIsTyping(false);
        
        // Add error message to chat
        const errorMessage: Message = {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: data.error || 'Sorry, I encountered an error processing your request.',
          timestamp: new Date(data.timestamp),
        };
        setMessages((prev) => [...prev, errorMessage]);
        break;

      default:
        console.warn('Unknown message type:', data.type);
    }
  }, []);

  /**
   * Send message to server
   */
  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim()) {
        return;
      }

      // Add user message to UI immediately
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setError(null);

      // Send to server if connected, otherwise queue
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            action: 'message',
            message: message.trim(),
            conversationId: conversationId,
            streaming: true,
          })
        );
      } else {
        // Queue message for later
        messageQueueRef.current.push({
          message: message.trim(),
          timestamp: Date.now(),
        });
        console.log('Message queued (offline)');
        
        // Try to reconnect if not already connecting
        if (!isConnecting) {
          connect();
        }
      }
    },
    [conversationId, isConnecting, connect]
  );

  /**
   * Auto-connect on mount if enabled
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    sendMessage,
    messages,
    isTyping,
    error,
    conversationId,
    connect,
    disconnect,
  };
}
