# Voice Interface Module

This module implements the voice interface functionality using Amazon Lex for natural language understanding and command execution.

## Components

### voice-service.ts
Core service implementing voice command processing, intent recognition, and multi-modal output generation.

### lex-fulfillment.ts
Lambda handler for Amazon Lex bot fulfillment, processing recognized intents and executing commands.

### voice-service.property.test.ts
Property-based tests validating voice interface correctness properties.

## Features

- Natural language intent recognition
- Voice command execution with audio confirmation
- Ambiguity detection and clarification prompts
- Multi-modal output (visual + audio) generation
- Support for common supply chain commands

## Supported Intents

- **QueryStatus**: Check digital twin status
- **RunScenario**: Execute scenario simulation
- **ViewAlerts**: Display active alerts
- **AcknowledgeAlert**: Acknowledge specific alert
- **GetMetrics**: Retrieve key metrics
- **CompareStrategies**: Compare mitigation strategies

## Usage

```typescript
import { VoiceService } from './voice-service';

const voiceService = new VoiceService();

// Process voice input
const result = await voiceService.processVoiceCommand({
  userId: 'user123',
  transcript: 'Show me the current supply chain status',
  sessionId: 'session456'
});

// Result includes:
// - recognizedIntent: The identified intent
// - confidence: Confidence score
// - audioResponse: Text for audio playback
// - visualData: Data for visual display
```
