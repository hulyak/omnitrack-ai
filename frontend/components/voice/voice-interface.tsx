'use client';

/**
 * Voice Interface Component
 * 
 * Main component for voice command interaction with the OmniTrack AI system.
 * Provides microphone input, audio waveform visualization, command history,
 * audio response playback, and fallback to text input.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { useState, useRef, useEffect } from 'react';
import { VoiceCommandResult, VoiceCommandHistoryItem } from '../../types/voice';
import { apiClient } from '../../lib/api/client';
import { AudioWaveform } from './audio-waveform';
import { VoiceCommandHistory } from './voice-command-history';
import { AudioResponsePlayer } from './audio-response-player';

interface VoiceInterfaceProps {
  userId: string;
  onCommandExecuted?: (result: VoiceCommandResult) => void;
}

export function VoiceInterface({ userId, onCommandExecuted }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<VoiceCommandHistoryItem[]>([]);
  const [currentResponse, setCurrentResponse] = useState<VoiceCommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useTextFallback, setUseTextFallback] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for browser support
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported, using text fallback');
      setUseTextFallback(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);

      // If final result, process the command
      if (event.results[current].isFinal) {
        processVoiceCommand(transcriptText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        setError('Microphone access denied. Using text input.');
        setUseTextFallback(true);
      } else if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Using text input.');
        setUseTextFallback(true);
      } else {
        setError(`Recognition error: ${event.error}`);
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Initialize audio context for waveform visualization
  useEffect(() => {
    if (typeof window === 'undefined' || useTextFallback) return;

    const initAudioContext = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 2048;
        source.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
      } catch (err) {
        console.error('Failed to initialize audio context:', err);
        setUseTextFallback(true);
      }
    };

    if (isListening) {
      initAudioContext();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isListening, useTextFallback]);

  const startListening = () => {
    if (!recognitionRef.current || useTextFallback) {
      setUseTextFallback(true);
      return;
    }

    setError(null);
    setTranscript('');
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('Failed to start voice recognition. Using text input.');
      setUseTextFallback(true);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processVoiceCommand = async (commandText: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiClient.post<any>('/voice/command', {
        command: commandText,
        userId,
        timestamp: new Date().toISOString(),
      });

      // Transform API response to VoiceCommandResult format
      const result: VoiceCommandResult = {
        recognizedIntent: {
          name: response.intent.name,
          confidence: response.intent.confidence,
          slots: {},
        },
        audioResponse: response.response.text,
        visualData: response.data,
        requiresClarification: false,
        executionStatus: response.success ? 'success' : 'failed',
        executionTime: response.executionTime,
      };

      setCurrentResponse(result);

      // Add to history
      const historyItem: VoiceCommandHistoryItem = {
        id: `cmd-${Date.now()}`,
        timestamp: new Date(),
        transcript: commandText,
        intent: result.recognizedIntent.name,
        response: result.audioResponse,
        status: result.executionStatus,
      };
      setCommandHistory((prev) => [historyItem, ...prev].slice(0, 10));

      // Callback
      if (onCommandExecuted) {
        onCommandExecuted(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process command';
      setError(errorMessage);
      
      // Add error to history
      const historyItem: VoiceCommandHistoryItem = {
        id: `cmd-${Date.now()}`,
        timestamp: new Date(),
        transcript: commandText,
        intent: 'Error',
        response: errorMessage,
        status: 'failed',
      };
      setCommandHistory((prev) => [historyItem, ...prev].slice(0, 10));
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      processVoiceCommand(textInput.trim());
      setTextInput('');
    }
  };

  const toggleInputMode = () => {
    setUseTextFallback(!useTextFallback);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <h2 className="text-xl font-semibold text-white">AI Voice Assistant</h2>
        <button
          onClick={toggleInputMode}
          className="px-3 py-1 text-sm text-slate-300 hover:text-purple-400 border border-slate-700 rounded-md hover:bg-slate-800/50 transition-all"
        >
          {useTextFallback ? 'Switch to Voice' : 'Switch to Text'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Voice/Text Input Section */}
        <div className="p-6 border-b border-slate-800/50">
          {!useTextFallback ? (
            <div className="space-y-4">
              {/* Microphone Button */}
              <div className="flex justify-center">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className={`
                    w-20 h-20 rounded-full flex items-center justify-center
                    transition-all duration-200 shadow-lg
                    ${isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-blue-500 hover:bg-blue-600'
                    }
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isListening ? (
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <rect x="6" y="4" width="8" height="12" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Status Text */}
              <div className="text-center">
                <p className="text-sm text-slate-300">
                  {isListening 
                    ? 'Listening...' 
                    : isProcessing 
                    ? 'Processing...' 
                    : 'Click to speak'}
                </p>
              </div>

              {/* Audio Waveform */}
              {isListening && analyserRef.current && (
                <AudioWaveform analyser={analyserRef.current} />
              )}

              {/* Transcript Display */}
              {transcript && (
                <div className="p-3 bg-slate-800/50 rounded-md border border-slate-700/50">
                  <p className="text-sm text-slate-200">{transcript}</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <div>
                <label htmlFor="text-input" className="block text-sm font-medium text-slate-300 mb-2">
                  Type your command
                </label>
                <input
                  id="text-input"
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="e.g., Show me the current status"
                  disabled={isProcessing}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing || !textInput.trim()}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {isProcessing ? 'Processing...' : 'Send Command'}
              </button>
            </form>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-md">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Response Section */}
        {currentResponse && (
          <div className="p-6 border-b border-slate-800/50 bg-slate-800/30">
            <AudioResponsePlayer response={currentResponse} />
          </div>
        )}

        {/* Command History - Made Bigger */}
        <div className="flex-1 overflow-hidden min-h-[400px]">
          <VoiceCommandHistory history={commandHistory} />
        </div>
      </div>
    </div>
  );
}
