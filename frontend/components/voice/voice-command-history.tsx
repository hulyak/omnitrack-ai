'use client';

/**
 * Voice Command History Component
 * 
 * Displays a scrollable list of previous voice commands and their responses.
 * Shows command status, timestamp, and allows users to review past interactions.
 */

import { VoiceCommandHistoryItem } from '../../types/voice';

interface VoiceCommandHistoryProps {
  history: VoiceCommandHistoryItem[];
}

export function VoiceCommandHistory({ history }: VoiceCommandHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <svg 
            className="w-16 h-16 mx-auto text-slate-400 mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
            />
          </svg>
          <p className="text-slate-200 text-sm font-medium">No commands yet</p>
          <p className="text-slate-400 text-xs mt-1">Start by speaking or typing a command</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: VoiceCommandHistoryItem['status']) => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        );
      case 'needs_clarification':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" 
              clipRule="evenodd" 
            />
          </svg>
        );
    }
  };

  const getStatusColor = (status: VoiceCommandHistoryItem['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-900/20 border-green-500/50';
      case 'failed':
        return 'bg-red-900/20 border-red-500/50';
      case 'needs_clarification':
        return 'bg-yellow-900/20 border-yellow-500/50';
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <h3 className="text-sm font-semibold text-white mb-4 px-2">Command History</h3>
      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border ${getStatusColor(item.status)} transition-all hover:bg-slate-800/30`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(item.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-300">
                    {formatTime(item.timestamp)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {item.intent}
                  </span>
                </div>
                <p className="text-sm text-white font-medium mb-2">
                  {item.transcript}
                </p>
                <p className="text-sm text-slate-300">
                  {item.response}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
