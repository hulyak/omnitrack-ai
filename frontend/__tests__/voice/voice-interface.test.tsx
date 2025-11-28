/**
 * Voice Interface Component Tests
 * 
 * Tests for the voice interface component functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceInterface } from '../../components/voice/voice-interface';
import { apiClient } from '../../lib/api/client';

// Mock the API client
jest.mock('../../lib/api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

// Mock Web Speech API
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  onresult: null,
  onerror: null,
  onend: null,
};

const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
};

// Setup global mocks
beforeAll(() => {
  (global as any).SpeechRecognition = jest.fn(() => mockSpeechRecognition);
  (global as any).webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);
  (global as any).speechSynthesis = mockSpeechSynthesis;
  (global as any).SpeechSynthesisUtterance = jest.fn();
  
  // Mock getUserMedia
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: jest.fn(() => Promise.resolve({
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => [],
      })),
    },
    writable: true,
  });

  // Mock AudioContext
  (global as any).AudioContext = jest.fn(() => ({
    createAnalyser: jest.fn(() => ({
      fftSize: 2048,
      frequencyBinCount: 1024,
      connect: jest.fn(),
    })),
    createMediaStreamSource: jest.fn(() => ({
      connect: jest.fn(),
    })),
    close: jest.fn(),
  }));
});

describe('VoiceInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the voice interface component', () => {
    render(<VoiceInterface userId="test-user" />);
    
    expect(screen.getByText('AI Voice Assistant')).toBeInTheDocument();
    expect(screen.getByText('Click to speak')).toBeInTheDocument();
  });

  it('allows switching between voice and text input modes', () => {
    render(<VoiceInterface userId="test-user" />);
    
    const switchButton = screen.getByText('Switch to Text');
    fireEvent.click(switchButton);
    
    expect(screen.getByText('Switch to Voice')).toBeInTheDocument();
    expect(screen.getByLabelText('Type your command')).toBeInTheDocument();
  });

  it('processes text input commands', async () => {
    const mockResponse = {
      recognizedIntent: { name: 'QueryStatus', confidence: 0.95 },
      audioResponse: 'The supply chain is operational',
      visualData: { status: 'operational' },
      requiresClarification: false,
      executionStatus: 'success' as const,
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    render(<VoiceInterface userId="test-user" />);
    
    // Switch to text mode
    const switchButton = screen.getByText('Switch to Text');
    fireEvent.click(switchButton);
    
    // Enter command
    const input = screen.getByLabelText('Type your command');
    fireEvent.change(input, { target: { value: 'show status' } });
    
    // Submit
    const submitButton = screen.getByText('Send Command');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/voice/command', {
        userId: 'test-user',
        transcript: 'show status',
        sessionId: expect.any(String),
      });
    });
  });

  it('displays command history', async () => {
    const mockResponse = {
      recognizedIntent: { name: 'QueryStatus', confidence: 0.95 },
      audioResponse: 'The supply chain is operational',
      visualData: { status: 'operational' },
      requiresClarification: false,
      executionStatus: 'success' as const,
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    render(<VoiceInterface userId="test-user" />);
    
    // Switch to text mode
    const switchButton = screen.getByText('Switch to Text');
    fireEvent.click(switchButton);
    
    // Enter and submit command
    const input = screen.getByLabelText('Type your command');
    fireEvent.change(input, { target: { value: 'show status' } });
    
    const submitButton = screen.getByText('Send Command');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Command History')).toBeInTheDocument();
      expect(screen.getByText('show status')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<VoiceInterface userId="test-user" />);
    
    // Switch to text mode
    const switchButton = screen.getByText('Switch to Text');
    fireEvent.click(switchButton);
    
    // Enter and submit command
    const input = screen.getByLabelText('Type your command');
    fireEvent.change(input, { target: { value: 'show status' } });
    
    const submitButton = screen.getByText('Send Command');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Error appears in both the error display and command history
      const errorElements = screen.getAllByText('Network error');
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it('calls onCommandExecuted callback when command succeeds', async () => {
    const mockResponse = {
      recognizedIntent: { name: 'QueryStatus', confidence: 0.95 },
      audioResponse: 'The supply chain is operational',
      visualData: { status: 'operational' },
      requiresClarification: false,
      executionStatus: 'success' as const,
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const onCommandExecuted = jest.fn();
    render(<VoiceInterface userId="test-user" onCommandExecuted={onCommandExecuted} />);
    
    // Switch to text mode
    const switchButton = screen.getByText('Switch to Text');
    fireEvent.click(switchButton);
    
    // Enter and submit command
    const input = screen.getByLabelText('Type your command');
    fireEvent.change(input, { target: { value: 'show status' } });
    
    const submitButton = screen.getByText('Send Command');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onCommandExecuted).toHaveBeenCalledWith(mockResponse);
    });
  });
});
