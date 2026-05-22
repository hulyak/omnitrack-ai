# Voice Interface Components

This directory contains components for the AI Voice Assistant feature of OmniTrack AI.

## Components

### VoiceInterface
Main component that orchestrates voice command interaction. Provides:
- Microphone activation and voice input capture
- Speech recognition using Web Speech API
- Text input fallback for unsupported browsers
- Command processing and response handling
- Integration with backend voice service

**Requirements:** 8.1, 8.2, 8.3, 8.4

### AudioWaveform
Real-time audio waveform visualization component. Features:
- Frequency-based bar visualization
- Smooth animation using requestAnimationFrame
- Customizable colors and dimensions
- Web Audio API integration

### VoiceCommandHistory
Displays scrollable history of voice commands. Shows:
- Command transcript and timestamp
- Recognized intent and confidence
- Response text and status
- Visual status indicators (success/failed/clarification)

### AudioResponsePlayer
Plays audio responses using text-to-speech. Provides:
- Speech synthesis for audio responses
- Play/pause controls
- Auto-play toggle
- Visual data display
- Clarification prompt handling

## Usage

```tsx
import { VoiceInterface } from '@/components/voice';

function MyPage() {
  const handleCommandExecuted = (result) => {
    console.log('Command executed:', result);
    // Handle visual data display, navigation, etc.
  };

  return (
    <VoiceInterface 
      userId="user-123"
      onCommandExecuted={handleCommandExecuted}
    />
  );
}
```

## Browser Support

The voice interface uses the following Web APIs:
- **Web Speech API** (Speech Recognition): Chrome, Edge, Safari
- **Speech Synthesis API**: All modern browsers
- **Web Audio API**: All modern browsers

For browsers without speech recognition support, the component automatically falls back to text input.

## Features

### Voice Input
- Click microphone button to start listening
- Real-time transcript display
- Automatic command processing on speech end
- Error handling with user-friendly messages

### Text Fallback
- Automatic fallback for unsupported browsers
- Manual toggle between voice and text modes
- Same command processing pipeline

### Audio Visualization
- Real-time frequency visualization during recording
- Smooth 60fps animation
- Responsive canvas rendering

### Command History
- Last 10 commands stored in memory
- Status indicators for each command
- Timestamp and intent display
- Scrollable list view

### Audio Response
- Text-to-speech synthesis
- Play/pause controls
- Auto-play option
- Visual data display for commands that return data

## Integration with Backend

The voice interface communicates with the backend voice service via REST API:

**Endpoint:** `POST /voice/command`

**Request:**
```json
{
  "userId": "user-123",
  "transcript": "show me the current status",
  "sessionId": "session-1234567890"
}
```

**Response:**
```json
{
  "recognizedIntent": {
    "name": "QueryStatus",
    "confidence": 0.95,
    "slots": {}
  },
  "audioResponse": "The supply chain is operational...",
  "visualData": { ... },
  "requiresClarification": false,
  "executionStatus": "success"
}
```

## Supported Commands

The voice interface supports the following intents:
- **QueryStatus**: Get supply chain status
- **RunScenario**: Execute simulation scenarios
- **ViewAlerts**: Display active alerts
- **AcknowledgeAlert**: Acknowledge specific alerts
- **GetMetrics**: Retrieve key performance metrics
- **CompareStrategies**: Compare mitigation strategies

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- Visual feedback for all interactions
- Text fallback for voice features
- Clear error messages

## Performance

- Efficient canvas rendering with requestAnimationFrame
- Debounced speech recognition
- Optimized history list (max 10 items)
- Lazy audio context initialization
- Proper cleanup on unmount
