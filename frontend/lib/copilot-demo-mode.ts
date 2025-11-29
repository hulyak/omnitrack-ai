/**
 * Demo mode copilot - simulates AI responses without WebSocket/AWS
 */

export interface DemoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const DEMO_RESPONSES: Record<string, string> = {
  // Greetings
  'hello': 'Hello! I\'m your AI Copilot for supply chain management. I can help you analyze your network, run simulations, and optimize operations. What would you like to do?',
  'hi': 'Hi there! I\'m here to help with your supply chain. Try asking me to "analyze the network" or "add a new supplier".',
  
  // Network queries
  'show network': 'Your supply chain network currently has 6 nodes across Asia-Pacific:\n\n• 2 Suppliers (Shanghai, Shenzhen)\n• 1 Manufacturer (Singapore)\n• 1 Warehouse (Hong Kong)\n• 1 Distributor (Tokyo)\n• 1 Retailer (Seoul)\n\nAll nodes are operating at healthy status with 75-85% utilization.',
  'network status': 'Network Status: ✅ Healthy\n\n• Total Nodes: 6\n• Healthy: 6 (100%)\n• Warnings: 0\n• Critical: 0\n\nAverage utilization: 80%\nNo anomalies detected.',
  'analyze': 'Running network analysis...\n\n✅ Analysis Complete:\n\n• Network Health: Excellent\n• Risk Level: Low\n• Bottlenecks: None detected\n• Recommendations:\n  - Consider adding backup supplier in different region\n  - Current capacity sufficient for 20% demand increase',
  
  // Adding nodes
  'add supplier': 'I can help you add a new supplier! Please provide:\n\n1. Location (city/country)\n2. Type of materials supplied\n3. Capacity (units/month)\n\nExample: "Add electronics supplier in Tokyo with 1000 units capacity"',
  'add warehouse': 'I\'ll add a new warehouse to your network. Where would you like to locate it? Popular options:\n\n• Singapore (central hub)\n• Mumbai (India gateway)\n• Dubai (Middle East access)\n• Sydney (Australia/Pacific)',
  
  // Simulations
  'simulate': 'I can run various simulations:\n\n1. Port Closure - Test impact of port disruptions\n2. Supplier Failure - Analyze backup options\n3. Demand Spike - Capacity stress test\n4. Weather Event - Natural disaster scenarios\n\nWhich would you like to simulate?',
  'port closure': 'Running port closure simulation...\n\n📊 Simulation Results:\n\nScenario: Shanghai port closed for 7 days\n\n• Impact: Medium\n• Affected Orders: 45\n• Delay: 5-7 days average\n• Cost Impact: $125,000\n\n💡 Mitigation Strategy:\n- Reroute through Shenzhen port\n- Air freight for critical orders\n- Estimated recovery: 10 days',
  
  // Configuration
  'change region': 'I can help you change your supply chain region. Current region: Asia-Pacific\n\nAvailable regions:\n• North America\n• Europe\n• Asia-Pacific (current)\n• Latin America\n• Middle East\n\nWhich region would you like to switch to?',
  
  // Help
  'help': 'Here\'s what I can help you with:\n\n🔍 Analysis:\n• "Analyze network"\n• "Show risks"\n• "Find bottlenecks"\n\n🏗️ Build:\n• "Add supplier in [city]"\n• "Add warehouse"\n• "Connect nodes"\n\n🎯 Simulate:\n• "Simulate port closure"\n• "What if supplier fails"\n• "Demand spike scenario"\n\n⚙️ Configure:\n• "Change region"\n• "Set industry"\n• "Update currency"\n\nJust ask me in natural language!',
  
  // Default
  'default': 'I understand you want to {query}. In demo mode, I can show you how the AI Copilot works! Try asking:\n\n• "Analyze my network"\n• "Add a supplier in Tokyo"\n• "Simulate a port closure"\n• "Show network status"\n• "Help"\n\nThe full version connects to AWS Bedrock for advanced AI reasoning.',
};

export function getDemoResponse(userMessage: string): string {
  const message = userMessage.toLowerCase().trim();
  
  // Check for exact matches first
  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (message.includes(key)) {
      return response;
    }
  }
  
  // Default response
  return DEMO_RESPONSES.default.replace('{query}', userMessage);
}

export function simulateTypingDelay(): Promise<void> {
  // Simulate network delay
  return new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
}

export function* streamDemoResponse(response: string): Generator<string> {
  // Stream response word by word
  const words = response.split(' ');
  for (const word of words) {
    yield word + ' ';
  }
}
