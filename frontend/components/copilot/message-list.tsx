'use client';

import { useEffect, useRef } from 'react';
import { MessageListProps, Message } from '@/types/copilot';
import { Bot, User } from 'lucide-react';

/**
 * MessageList - Displays conversation messages with auto-scroll
 * 
 * Features:
 * - Message bubbles for user and assistant
 * - Typing indicator
 * - Auto-scroll to bottom on new messages
 * - Timestamp display
 * - Streaming message support
 * 
 * Requirements: 2.2, 2.4
 */
export function MessageList({ messages, isTyping }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto p-4 space-y-4 scroll-smooth"
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
      aria-label="Conversation messages"
    >
      {messages.length === 0 && (
        <div role="status" aria-live="polite" className="sr-only">
          No messages yet. Start a conversation by typing a message.
        </div>
      )}
      
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isTyping && <TypingIndicator />}

      {/* Invisible element for auto-scroll */}
      <div ref={messagesEndRef} aria-hidden="true" />
    </div>
  );
}

/**
 * MessageBubble - Individual message display component
 */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      role="article"
      aria-label={`Message from ${isUser ? 'you' : 'AI assistant'} at ${formatTime(message.timestamp)}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700'
        }`}
        aria-hidden="true"
        role="img"
        aria-label={isUser ? 'User avatar' : 'AI assistant avatar'}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
        <div
          className={`rounded-lg px-3 py-2 sm:px-4 sm:py-2 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900'
          } ${message.isStreaming ? 'animate-pulse' : ''}`}
          role="region"
          aria-label={`${isUser ? 'Your' : 'Assistant'} message content`}
        >
          <p className="text-sm sm:text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
          {message.isStreaming && (
            <span className="sr-only" aria-live="polite">
              Message is being received
            </span>
          )}
        </div>

        {/* Timestamp */}
        <time 
          className="text-xs text-gray-500 mt-1 px-1"
          dateTime={new Date(message.timestamp).toISOString()}
          aria-label={`Sent at ${formatTime(message.timestamp)}`}
        >
          {formatTime(message.timestamp)}
        </time>
      </div>
    </div>
  );
}

/**
 * TypingIndicator - Shows when assistant is processing
 */
function TypingIndicator() {
  return (
    <div 
      className="flex gap-3" 
      role="status" 
      aria-live="polite"
      aria-atomic="true"
      aria-label="AI assistant is typing a response"
    >
      {/* Avatar */}
      <div 
        className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center"
        aria-hidden="true"
      >
        <Bot className="w-4 h-4" />
      </div>

      {/* Typing Animation */}
      <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-1" aria-hidden="true">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      
      {/* Screen reader text */}
      <span className="sr-only">AI assistant is typing</span>
    </div>
  );
}
