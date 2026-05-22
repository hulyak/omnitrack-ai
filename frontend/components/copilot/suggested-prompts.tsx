'use client';

import { SuggestedPromptsProps } from '@/types/copilot';
import { Sparkles } from 'lucide-react';

/**
 * SuggestedPrompts - Displays clickable prompt suggestions
 * 
 * Features:
 * - Display starter prompts on first open
 * - Show contextual suggestions
 * - Make suggestions clickable
 * - Responsive grid layout
 * 
 * Requirements: 5.1, 5.4
 */
export function SuggestedPrompts({ prompts, onSelectPrompt }: SuggestedPromptsProps) {
  if (!prompts || prompts.length === 0) return null;

  return (
    <div className="w-full space-y-3 px-2 sm:px-0">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Sparkles className="w-4 h-4" />
        <span className="font-medium">Suggested prompts</span>
      </div>

      <div className="grid gap-2" role="list" aria-label="Suggested prompts">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(prompt)}
            className="w-full text-left px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
            aria-label={`Use prompt ${index + 1}: ${prompt}`}
            role="listitem"
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors" aria-hidden="true">
                {index + 1}
              </div>
              <p className="text-sm text-gray-700 group-hover:text-blue-700 transition-colors">
                {prompt}
              </p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 text-center">
        Tap a prompt to get started, or type your own message below
      </p>
    </div>
  );
}
