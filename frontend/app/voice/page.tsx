'use client';

/**
 * Voice Interface Page
 * 
 * Dedicated page for the AI Voice Assistant interface.
 * Provides full-screen voice command interaction with the OmniTrack AI system.
 */

import { useState } from 'react';
import { VoiceInterface } from '@/components/voice';
import { VoiceCommandResult } from '@/types/voice';

export default function VoicePage() {
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);

  // Mock user ID - in production, get from auth context
  const userId = 'user-123';

  const handleCommandExecuted = (result: VoiceCommandResult) => {
    setLastResult(result);

    // Handle navigation or data display based on intent
    if (result.executionStatus === 'success' && result.visualData) {
      console.log('Command executed successfully:', result);
      
      // Example: Navigate to relevant page based on intent
      switch (result.recognizedIntent.name) {
        case 'QueryStatus':
          // Could navigate to dashboard
          break;
        case 'ViewAlerts':
          // Could navigate to alerts page
          break;
        case 'GetMetrics':
          // Could update metrics display
          break;
        // Add more cases as needed
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Voice Assistant</h1>
              <p className="text-sm text-gray-600 mt-1">
                Interact with OmniTrack AI using voice commands or text input
              </p>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Voice Interface - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="h-[calc(100vh-12rem)]">
              <VoiceInterface 
                userId={userId}
                onCommandExecuted={handleCommandExecuted}
              />
            </div>
          </div>

          {/* Info Panel - Takes 1 column */}
          <div className="space-y-6">
            {/* Quick Tips */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Click the microphone button and speak clearly</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Switch to text input if voice is not working</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Review command history to see past interactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Toggle auto-play to control audio responses</span>
                </li>
              </ul>
            </div>

            {/* Example Commands */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Commands</h3>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">"Show me the status"</p>
                  <p className="text-xs text-gray-500 mt-1">Get current supply chain status</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">"Run a scenario"</p>
                  <p className="text-xs text-gray-500 mt-1">Start a simulation</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">"View alerts"</p>
                  <p className="text-xs text-gray-500 mt-1">See active alerts</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">"Show metrics"</p>
                  <p className="text-xs text-gray-500 mt-1">Display key performance metrics</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">"Compare strategies"</p>
                  <p className="text-xs text-gray-500 mt-1">View mitigation strategy comparison</p>
                </div>
              </div>
            </div>

            {/* Browser Support */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Browser Support</h3>
              <p className="text-xs text-blue-700">
                Voice recognition works best in Chrome, Edge, and Safari. 
                If your browser doesn't support voice input, the system will 
                automatically switch to text input mode.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
