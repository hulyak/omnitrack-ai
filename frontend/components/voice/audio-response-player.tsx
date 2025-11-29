'use client';

/**
 * Audio Response Player Component
 * 
 * Plays audio responses from the voice assistant and displays visual data.
 * Supports text-to-speech synthesis and visual representation of command results.
 */

import { useEffect, useState, useRef } from 'react';
import { VoiceCommandResult } from '../../types/voice';

interface AudioResponsePlayerProps {
  response: VoiceCommandResult;
}

export function AudioResponsePlayer({ response }: AudioResponsePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for speech synthesis support
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(response.audioResponse);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;

    // Auto-play if enabled
    if (autoPlay) {
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [response.audioResponse, autoPlay]);

  const playAudio = () => {
    if (utteranceRef.current && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utteranceRef.current);
    }
  };

  const stopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const getStatusColor = () => {
    switch (response.executionStatus) {
      case 'success':
        return 'bg-green-900/20 border-green-500/50';
      case 'failed':
        return 'bg-red-900/20 border-red-500/50';
      case 'needs_clarification':
        return 'bg-yellow-900/20 border-yellow-500/50';
    }
  };

  const getStatusIcon = () => {
    switch (response.executionStatus) {
      case 'success':
        return (
          <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        );
      case 'needs_clarification':
        return (
          <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" 
              clipRule="evenodd" 
            />
          </svg>
        );
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-white">
              {response.recognizedIntent.name}
              <span className="ml-2 text-xs text-slate-400 font-normal">
                ({Math.round(response.recognizedIntent.confidence * 100)}% confidence)
              </span>
            </h4>
            
            <div className="flex items-center gap-2">
              <label className="flex items-center text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="mr-1"
                />
                Auto-play
              </label>
              
              {isPlaying ? (
                <button
                  onClick={stopAudio}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md"
                  title="Stop audio"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={playAudio}
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-md"
                  title="Play audio"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-200 mb-3">
            {response.audioResponse}
          </p>

          {response.requiresClarification && response.clarificationPrompt && (
            <div className="mt-2 p-2 bg-yellow-900/30 rounded border border-yellow-500/50">
              <p className="text-xs text-yellow-200">
                <span className="font-semibold">Clarification needed:</span> {response.clarificationPrompt}
              </p>
            </div>
          )}

          {response.visualData && (
            <div className="mt-3 p-3 bg-slate-800/50 rounded border border-slate-700">
              <h5 className="text-xs font-semibold text-slate-200 mb-2">Visual Data</h5>
              <pre className="text-xs text-slate-300 overflow-x-auto">
                {JSON.stringify(response.visualData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
