'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Send } from 'lucide-react';
import { CopilotInputProps } from '@/types/copilot';

/**
 * CopilotInput - Message input component with auto-resize
 * 
 * Features:
 * - Textarea with auto-resize
 * - Send button
 * - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
 * - Character limit
 * - Disabled state handling
 * 
 * Requirements: 1.1
 */
export function CopilotInput({ onSend, disabled, suggestions }: CopilotInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 2000;

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set height based on scrollHeight, with min and max constraints
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 120);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setValue(newValue);
    }
  };

  const handleSend = () => {
    if (!value.trim() || disabled) return;

    onSend(value);
    setValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const remainingChars = maxLength - value.length;
  const showCharCount = remainingChars < 100;

  return (
    <div className="p-3 sm:p-4">
      {/* Suggestions (if provided) */}
      {suggestions && suggestions.length > 0 && (
        <div 
          className="mb-2 flex flex-wrap gap-1.5 sm:gap-2" 
          role="group" 
          aria-label="Message suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                setValue(suggestion);
                textareaRef.current?.focus();
              }}
              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
              aria-label={`Use suggestion: ${suggestion}`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 items-end" role="group" aria-label="Message input area">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-sm"
            rows={1}
            aria-label="Type your message to the AI assistant"
            aria-describedby="char-count input-help"
            aria-required="true"
            aria-invalid={value.length > maxLength}
          />

          {/* Character Count */}
          {showCharCount && (
            <div
              id="char-count"
              className={`absolute bottom-1 right-2 text-xs ${
                remainingChars < 50 ? 'text-red-500' : 'text-gray-400'
              }`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="sr-only">{remainingChars} characters remaining</span>
              <span aria-hidden="true">{remainingChars}</span>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="flex-shrink-0 p-2 sm:p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
          aria-label="Send message"
          title="Send message (Enter)"
        >
          <Send className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Helper Text - Hidden on mobile */}
      <div id="input-help" className="mt-2 text-xs text-gray-500 hidden sm:block" role="note">
        <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs" aria-label="Enter key">
          Enter
        </kbd>{' '}
        to send •{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs" aria-label="Shift plus Enter keys">
          Shift + Enter
        </kbd>{' '}
        for new line
      </div>
    </div>
  );
}
