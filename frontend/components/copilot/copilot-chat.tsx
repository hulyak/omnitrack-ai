'use client';

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
import { X, Minimize2, Maximize2, WifiOff, Wifi, Sparkles } from 'lucide-react';
import { CopilotChatProps, Message } from '@/types/copilot';
import { MessageList } from './message-list';
import { CopilotInput } from './copilot-input';
import { SuggestedPrompts } from './suggested-prompts';
import { useCopilotWebSocket } from '@/lib/websocket/copilot-websocket-hook';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * CopilotChat - Main container component for the AI Copilot interface
 * 
 * Features:
 * - Open/close animation
 * - Minimize/maximize functionality
 * - Message history management
 * - WebSocket connection handling with streaming support
 * - Responsive design with Tailwind CSS
 * 
 * Requirements: 1.1, 2.1, 2.2, 8.1
 */
export function CopilotChat({ isOpen, onClose, supplyChainContext }: CopilotChatProps) {
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [demoMode, setDemoMode] = useState(true); // Always use demo mode for now
  const [demoMessages, setDemoMessages] = useState<Message[]>([]);
  const [demoTyping, setDemoTyping] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

  // Use WebSocket hook for real-time communication (disabled in demo mode)
  const {
    isConnected,
    isConnecting,
    sendMessage: wsSendMessage,
    messages: wsMessages,
    isTyping: wsTyping,
    error: wsError,
    conversationId,
  } = useCopilotWebSocket({
    userId: user?.id || 'anonymous',
    autoConnect: false, // Disabled for demo mode
    reconnectAttempts: 5,
    reconnectDelay: 1000,
  });

  // Use demo or real messages
  const messages = demoMode ? demoMessages : wsMessages;
  const isTyping = demoMode ? demoTyping : wsTyping;

  // Starter prompts for first-time users
  const starterPrompts = [
    'Add a new supplier in Asia',
    'Show me recent alerts',
    'Run a simulation for port closure',
    'What are the current bottlenecks?',
    'Help me optimize my supply chain',
  ];

  // Demo mode message handler
  const handleDemoMessage = useCallback(async (content: string) => {
    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setDemoMessages(prev => [...prev, userMsg]);

    // Show typing indicator
    setDemoTyping(true);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Generate response based on message
    const response = getDemoResponse(content);
    
    // Add assistant message
    const assistantMsg: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };
    
    setDemoTyping(false);
    setDemoMessages(prev => [...prev, assistantMsg]);
  }, []);

  // Helper function for demo responses
  const getDemoResponse = (message: string): string => {
    const msg = message.toLowerCase();
    
    if (msg.includes('hello') || msg.includes('hi')) {
      return 'Hello! I\'m your AI Copilot. I can help you analyze your supply chain, run simulations, and optimize operations. Try asking me to "analyze the network" or "add a supplier"!';
    }
    if (msg.includes('analyze') || msg.includes('status')) {
      return '📊 Network Analysis:\n\n✅ Status: Healthy\n• Total Nodes: 6\n• Utilization: 80%\n• No critical issues\n\n💡 Recommendation: Consider adding a backup supplier for redundancy.';
    }
    if (msg.includes('add') && msg.includes('supplier')) {
      return 'I can help add a new supplier! In the full version, I would:\n\n1. Create a new supplier node\n2. Connect it to your network\n3. Configure capacity and location\n\nFor now, this is a demo. Deploy to AWS to unlock full AI capabilities!';
    }
    if (msg.includes('simulate') || msg.includes('port')) {
      return '🎯 Simulation: Port Closure\n\n📉 Impact: Medium\n• Affected orders: 45\n• Delay: 5-7 days\n• Cost: $125K\n\n✅ Mitigation:\n- Reroute via alternate port\n- Air freight for critical items';
    }
    if (msg.includes('help')) {
      return 'I can help with:\n\n🔍 Analysis: "analyze network", "show risks"\n🏗️ Build: "add supplier", "connect nodes"\n🎯 Simulate: "port closure", "demand spike"\n⚙️ Configure: "change region", "set industry"\n\nThis is demo mode. Deploy to AWS for full AI power!';
    }
    
    return `I understand you want to ${message}. This is demo mode - responses are simulated. Deploy to AWS with Bedrock to unlock:\n\n✨ Real AI reasoning\n✨ 40+ actions\n✨ Context awareness\n✨ Multi-step workflows\n\nTry: "help" to see what I can do!`;
  };

  const handleSendMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    
    if (demoMode) {
      handleDemoMessage(content);
    } else {
      wsSendMessage(content);
    }
  }, [demoMode, handleDemoMessage, wsSendMessage]);

  const handleSelectPrompt = useCallback((prompt: string) => {
    handleSendMessage(prompt);
  }, [handleSendMessage]);

  const handleToggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  // Touch gesture handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!headerRef.current?.contains(e.target as Node)) return;
    
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!headerRef.current?.contains(e.target as Node)) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const touchDuration = Date.now() - touchStartTime.current;
    const swipeDistance = touchEndY - touchStartY.current;
    
    // Swipe down to minimize (at least 50px in less than 300ms)
    if (swipeDistance > 50 && touchDuration < 300 && !isMinimized) {
      handleToggleMinimize();
    }
    // Swipe up to maximize (at least 50px in less than 300ms)
    else if (swipeDistance < -50 && touchDuration < 300 && isMinimized) {
      handleToggleMinimize();
    }
    // Quick tap on header to toggle (less than 200ms, less than 10px movement)
    else if (Math.abs(swipeDistance) < 10 && touchDuration < 200) {
      handleToggleMinimize();
    }
  }, [isMinimized, handleToggleMinimize]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    // Escape to close
    if (e.key === 'Escape' && !isMinimized) {
      e.preventDefault();
      onClose();
    }
    
    // Ctrl/Cmd + M to minimize/maximize
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
      e.preventDefault();
      handleToggleMinimize();
    }
  }, [isMinimized, onClose, handleToggleMinimize]);

  // Focus management - trap focus within dialog
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    // Focus the close button when dialog opens
    closeButtonRef.current?.focus();

    const handleTabKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab on first element -> focus last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
      // Tab on last element -> focus first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    dialog.addEventListener('keydown', handleTabKey);
    return () => dialog.removeEventListener('keydown', handleTabKey);
  }, [isOpen, isMinimized]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      className={`fixed z-50 flex flex-col bg-white shadow-2xl border border-gray-200 transition-all duration-300 ease-in-out
        ${isMinimized ? 'h-14' : 'h-[600px] md:h-[600px]'}
        
        /* Mobile: Full screen on small devices */
        bottom-0 left-0 right-0 rounded-t-lg
        
        /* Tablet and up: Floating dialog */
        md:bottom-4 md:right-4 md:left-auto md:w-96 md:max-w-[calc(100vw-2rem)] md:rounded-lg
        
        /* Large screens: Larger dialog */
        lg:w-[28rem]
      `}
      role="dialog"
      aria-label="AI Copilot Chat"
      aria-modal="true"
      aria-describedby="copilot-description"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div 
        ref={headerRef}
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg cursor-pointer touch-none select-none md:cursor-default"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="banner"
        aria-label="Copilot header - swipe or tap to minimize/maximize on mobile"
      >
        <div className="flex items-center gap-2">
          {/* Connection status indicator */}
          {demoMode ? (
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" title="Demo Mode" />
          ) : isConnecting ? (
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Connecting..." />
          ) : isConnected ? (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Connected" />
          ) : (
            <div className="w-2 h-2 bg-red-400 rounded-full" title="Disconnected" />
          )}
          <h2 className="font-semibold text-sm flex items-center gap-2">
            AI Copilot
            {demoMode && <span className="text-xs bg-yellow-400/20 px-2 py-0.5 rounded-full text-yellow-200">Demo</span>}
          </h2>
          
          {/* Connection icon */}
          {demoMode ? (
            <Sparkles className="w-3 h-3 opacity-70" />
          ) : isConnected ? (
            <Wifi className="w-3 h-3 opacity-70" />
          ) : (
            <WifiOff className="w-3 h-3 opacity-70" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMinimize}
            className="p-1 hover:bg-blue-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            aria-label={isMinimized ? 'Maximize copilot (Ctrl+M)' : 'Minimize copilot (Ctrl+M)'}
            title={isMinimized ? 'Maximize (Ctrl+M)' : 'Minimize (Ctrl+M)'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1 hover:bg-blue-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            aria-label="Close copilot (Escape)"
            title="Close (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content - Hidden when minimized */}
      {!isMinimized && (
        <>
          {/* Connection status announcements for screen readers */}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {demoMode && 'Demo mode - simulated responses'}
            {!demoMode && isConnecting && 'Connecting to AI assistant...'}
            {!demoMode && isConnected && !isConnecting && 'Connected to AI assistant'}
            {!demoMode && !isConnected && !isConnecting && 'Disconnected from AI assistant'}
          </div>

          {/* Error banner */}
          {wsError && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-200" role="alert" aria-live="assertive">
              <p className="text-xs text-red-600">{wsError}</p>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-hidden">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Welcome to AI Copilot
                  </h3>
                  <p id="copilot-description" className="text-sm text-gray-600">
                    I can help you build, configure, and analyze your supply chain.
                    Try one of these prompts to get started:
                  </p>
                </div>
                
                <SuggestedPrompts
                  prompts={starterPrompts}
                  onSelectPrompt={handleSelectPrompt}
                />
              </div>
            ) : (
              <MessageList messages={messages} isTyping={isTyping} />
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200">
            <CopilotInput
              onSend={handleSendMessage}
              disabled={demoMode ? false : (!isConnected || isConnecting)}
            />
          </div>
        </>
      )}
    </div>
  );
}
