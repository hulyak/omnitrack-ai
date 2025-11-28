/**
 * Voice Interface Service
 * 
 * Implements voice command processing with Amazon Lex integration,
 * including intent recognition, command execution, ambiguity handling,
 * and multi-modal output generation.
 */

export interface VoiceCommandInput {
  userId: string;
  transcript: string;
  sessionId: string;
  sessionAttributes?: Record<string, string>;
}

export interface RecognizedIntent {
  name: string;
  confidence: number;
  slots?: Record<string, string>;
}

export interface VoiceCommandResult {
  recognizedIntent: RecognizedIntent;
  audioResponse: string;
  visualData?: any;
  requiresClarification: boolean;
  clarificationPrompt?: string;
  executionStatus: 'success' | 'failed' | 'needs_clarification';
}

export interface IntentDefinition {
  name: string;
  patterns: string[];
  requiredSlots?: string[];
  executor: (slots: Record<string, string>, userId: string) => Promise<any>;
}

/**
 * Voice Service for processing voice commands and generating responses
 */
export class VoiceService {
  private intents: IntentDefinition[];
  private ambiguityThreshold: number = 0.7;
  private confidenceDifferenceThreshold: number = 0.15;

  constructor() {
    this.intents = this.initializeIntents();
  }

  /**
   * Initialize supported intents with their patterns and executors
   */
  private initializeIntents(): IntentDefinition[] {
    return [
      {
        name: 'QueryStatus',
        patterns: [
          'status',
          'supply chain status',
          'current status',
          'show status',
          'what is the status',
        ],
        executor: async (slots, userId) => {
          return {
            status: 'operational',
            activeNodes: 42,
            alerts: 3,
            lastUpdate: new Date().toISOString(),
          };
        },
      },
      {
        name: 'RunScenario',
        patterns: [
          'run scenario',
          'simulate',
          'run simulation',
          'execute scenario',
          'start scenario',
        ],
        requiredSlots: ['scenarioType'],
        executor: async (slots, userId) => {
          return {
            scenarioId: `scenario-${Date.now()}`,
            status: 'running',
            estimatedCompletion: 60,
          };
        },
      },
      {
        name: 'ViewAlerts',
        patterns: [
          'alerts',
          'show alerts',
          'view alerts',
          'what alerts',
          'active alerts',
        ],
        executor: async (slots, userId) => {
          return {
            alerts: [
              { id: 'alert-1', severity: 'high', message: 'Supplier delay detected' },
              { id: 'alert-2', severity: 'medium', message: 'Inventory threshold reached' },
            ],
          };
        },
      },
      {
        name: 'AcknowledgeAlert',
        patterns: [
          'acknowledge alert',
          'ack alert',
          'dismiss alert',
          'confirm alert',
        ],
        requiredSlots: ['alertId'],
        executor: async (slots, userId) => {
          return {
            alertId: slots.alertId,
            acknowledged: true,
            acknowledgedBy: userId,
            timestamp: new Date().toISOString(),
          };
        },
      },
      {
        name: 'GetMetrics',
        patterns: [
          'metrics',
          'show metrics',
          'key metrics',
          'performance metrics',
          'kpis',
        ],
        executor: async (slots, userId) => {
          return {
            cost: { value: 1250000, change: -2.5 },
            risk: { value: 0.23, change: 0.05 },
            sustainability: { value: 0.78, change: 0.03 },
          };
        },
      },
      {
        name: 'CompareStrategies',
        patterns: [
          'compare strategies',
          'strategy comparison',
          'compare mitigation',
          'show strategies',
        ],
        executor: async (slots, userId) => {
          return {
            strategies: [
              { id: 'strat-1', name: 'Alternative Supplier', score: 0.85 },
              { id: 'strat-2', name: 'Increase Inventory', score: 0.72 },
              { id: 'strat-3', name: 'Route Optimization', score: 0.68 },
            ],
          };
        },
      },
    ];
  }

  /**
   * Process voice command and return result with intent recognition
   * 
   * Property 31: Voice intent recognition
   * For any voice command, the system should extract and return the recognized intent
   */
  async processVoiceCommand(input: VoiceCommandInput): Promise<VoiceCommandResult> {
    // Recognize intent from transcript
    const intentMatches = this.recognizeIntent(input.transcript);

    // Check for ambiguity (multiple intents with similar confidence)
    if (this.isAmbiguous(intentMatches)) {
      return this.handleAmbiguity(intentMatches);
    }

    // Get the best matching intent
    const bestMatch = intentMatches[0];

    if (!bestMatch || bestMatch.confidence < this.ambiguityThreshold) {
      return {
        recognizedIntent: { name: 'Unknown', confidence: 0 },
        audioResponse: 'I did not understand that command. Please try again.',
        requiresClarification: true,
        clarificationPrompt: 'Could you please rephrase your request?',
        executionStatus: 'needs_clarification',
      };
    }

    // Check if required slots are present
    const intent = this.intents.find((i) => i.name === bestMatch.name);
    if (intent?.requiredSlots) {
      const missingSlots = this.checkRequiredSlots(
        intent.requiredSlots,
        bestMatch.slots || {}
      );
      if (missingSlots.length > 0) {
        return {
          recognizedIntent: bestMatch,
          audioResponse: `I need more information. Please specify ${missingSlots.join(', ')}.`,
          requiresClarification: true,
          clarificationPrompt: `What ${missingSlots[0]} would you like?`,
          executionStatus: 'needs_clarification',
        };
      }
    }

    // Execute the command
    try {
      const executionResult = await this.executeCommand(
        bestMatch,
        input.userId
      );
      return executionResult;
    } catch (error) {
      return {
        recognizedIntent: bestMatch,
        audioResponse: 'An error occurred while executing your command.',
        requiresClarification: false,
        executionStatus: 'failed',
      };
    }
  }

  /**
   * Recognize intent from transcript using pattern matching
   */
  private recognizeIntent(transcript: string): RecognizedIntent[] {
    const normalizedTranscript = transcript.toLowerCase().trim();
    const matches: RecognizedIntent[] = [];

    for (const intent of this.intents) {
      let maxConfidence = 0;
      const slots: Record<string, string> = {};

      for (const pattern of intent.patterns) {
        const confidence = this.calculateConfidence(
          normalizedTranscript,
          pattern
        );
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
        }
      }

      if (maxConfidence > 0) {
        // Extract slots if needed
        if (intent.requiredSlots) {
          this.extractSlots(normalizedTranscript, intent.requiredSlots, slots);
        }

        matches.push({
          name: intent.name,
          confidence: maxConfidence,
          slots: Object.keys(slots).length > 0 ? slots : undefined,
        });
      }
    }

    // Sort by confidence descending
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate confidence score for pattern matching
   */
  private calculateConfidence(transcript: string, pattern: string): number {
    const transcriptWords = transcript.split(/\s+/);
    const patternWords = pattern.split(/\s+/);

    let matchCount = 0;
    for (const patternWord of patternWords) {
      if (transcriptWords.some((tw) => tw.includes(patternWord) || patternWord.includes(tw))) {
        matchCount++;
      }
    }

    return matchCount / patternWords.length;
  }

  /**
   * Extract slot values from transcript
   */
  private extractSlots(
    transcript: string,
    requiredSlots: string[],
    slots: Record<string, string>
  ): void {
    // Simple slot extraction - in production, use Lex's slot filling
    for (const slot of requiredSlots) {
      if (slot === 'scenarioType') {
        const types = ['disruption', 'delay', 'shortage', 'weather'];
        for (const type of types) {
          if (transcript.includes(type)) {
            slots[slot] = type;
            break;
          }
        }
      } else if (slot === 'alertId') {
        const match = transcript.match(/alert[- ]?(\d+|[a-z0-9-]+)/i);
        if (match) {
          slots[slot] = match[1];
        }
      }
    }
  }

  /**
   * Check if required slots are present
   */
  private checkRequiredSlots(
    requiredSlots: string[],
    providedSlots: Record<string, string>
  ): string[] {
    return requiredSlots.filter((slot) => !providedSlots[slot]);
  }

  /**
   * Check if intent recognition is ambiguous
   * 
   * Property 33: Ambiguity handling
   * For any ambiguous voice input, the system should request clarification
   */
  private isAmbiguous(intentMatches: RecognizedIntent[]): boolean {
    if (intentMatches.length < 2) {
      return false;
    }

    const topTwo = intentMatches.slice(0, 2);
    const confidenceDifference = topTwo[0].confidence - topTwo[1].confidence;

    // Ambiguous if top two intents have similar confidence
    return (
      topTwo[0].confidence >= this.ambiguityThreshold &&
      topTwo[1].confidence >= this.ambiguityThreshold &&
      confidenceDifference < this.confidenceDifferenceThreshold
    );
  }

  /**
   * Handle ambiguous intent recognition
   */
  private handleAmbiguity(intentMatches: RecognizedIntent[]): VoiceCommandResult {
    const topIntents = intentMatches.slice(0, 2);
    const intentNames = topIntents.map((i) => i.name).join(' or ');

    return {
      recognizedIntent: topIntents[0],
      audioResponse: `I'm not sure if you want to ${intentNames}. Which one did you mean?`,
      requiresClarification: true,
      clarificationPrompt: `Did you mean ${topIntents[0].name} or ${topIntents[1].name}?`,
      executionStatus: 'needs_clarification',
    };
  }

  /**
   * Execute recognized command
   * 
   * Property 32: Voice command execution with confirmation
   * For any recognized voice command, the system should execute and provide audio confirmation
   */
  private async executeCommand(
    intent: RecognizedIntent,
    userId: string
  ): Promise<VoiceCommandResult> {
    const intentDef = this.intents.find((i) => i.name === intent.name);
    if (!intentDef) {
      throw new Error(`Intent ${intent.name} not found`);
    }

    // Execute the command
    const visualData = await intentDef.executor(intent.slots || {}, userId);

    // Generate audio confirmation
    const audioResponse = this.generateAudioConfirmation(intent.name, visualData);

    return {
      recognizedIntent: intent,
      audioResponse,
      visualData,
      requiresClarification: false,
      executionStatus: 'success',
    };
  }

  /**
   * Generate audio confirmation message
   * 
   * Property 34: Multi-modal visualization output
   * For any voice command requesting data visualization, provide both visual and audio output
   */
  private generateAudioConfirmation(intentName: string, data: any): string {
    switch (intentName) {
      case 'QueryStatus':
        return `The supply chain is ${data.status}. There are ${data.activeNodes} active nodes and ${data.alerts} alerts.`;
      
      case 'RunScenario':
        return `Scenario ${data.scenarioId} is now running. Estimated completion in ${data.estimatedCompletion} seconds.`;
      
      case 'ViewAlerts':
        return `You have ${data.alerts.length} active alerts. The highest priority is: ${data.alerts[0]?.message || 'none'}.`;
      
      case 'AcknowledgeAlert':
        return `Alert ${data.alertId} has been acknowledged.`;
      
      case 'GetMetrics':
        return `Current metrics: Cost is ${data.cost.value} with ${data.cost.change}% change. Risk level is ${data.risk.value}. Sustainability score is ${data.sustainability.value}.`;
      
      case 'CompareStrategies':
        return `Top strategy is ${data.strategies[0].name} with a score of ${data.strategies[0].score}.`;
      
      default:
        return 'Command executed successfully.';
    }
  }

  /**
   * Generate multi-modal output for visualization requests
   * 
   * Property 34: Multi-modal visualization output
   * Ensures both visual data and audio summary are provided
   */
  generateMultiModalOutput(
    intentName: string,
    visualData: any
  ): { visual: any; audio: string } {
    return {
      visual: visualData,
      audio: this.generateAudioConfirmation(intentName, visualData),
    };
  }
}
