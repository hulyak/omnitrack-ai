# AI Copilot User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Available Commands](#available-commands)
4. [Usage Examples](#usage-examples)
5. [Tips and Best Practices](#tips-and-best-practices)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

## Introduction

The OmniTrack AI Copilot is your intelligent assistant for managing supply chain networks through natural language. Instead of navigating complex menus and forms, simply tell the copilot what you want to do, and it will understand and execute your commands.

### What Can the Copilot Do?

- **Build** supply chain networks by adding nodes and connections
- **Configure** network settings like region, industry, and risk profiles
- **Analyze** your network for anomalies, risks, and bottlenecks
- **Simulate** scenarios like port closures or demand spikes
- **Query** information about nodes, metrics, and alerts

### Key Features

- 🗣️ **Natural Language Understanding**: Talk to your supply chain naturally
- ⚡ **Real-time Responses**: See responses stream in as they're generated
- 🧠 **Context Awareness**: The copilot remembers your conversation
- 💡 **Smart Suggestions**: Get helpful prompts and next steps
- 📊 **Data Integration**: Access real-time supply chain data

## Getting Started

### Opening the Copilot

1. Look for the **Copilot** button in the bottom-right corner of any page
2. Click the button to open the chat interface
3. The copilot will greet you with suggested starter prompts

### Your First Interaction

Try one of these starter prompts:

```
"Add a supplier in Shanghai"
"Show me my network summary"
"What risks do I have?"
"Help me understand what you can do"
```

### Understanding Responses

The copilot will:
- Show a typing indicator while processing
- Stream responses in real-time
- Provide clear confirmations of actions taken
- Suggest related next steps

## Available Commands

### Build Commands

Create and modify your supply chain network.

#### Add Nodes

```
"Add a supplier in Shanghai named Acme Corp"
"Create a manufacturer in Detroit"
"Add a warehouse in Los Angeles with 50000 sqft capacity"
"Add a distributor in Chicago"
"Create a retailer in New York"
```

**Parameters**:
- **Location**: City or region name
- **Name** (optional): Custom name for the node
- **Capacity** (optional): Storage or production capacity
- **Type**: supplier, manufacturer, warehouse, distributor, retailer

#### Remove Nodes

```
"Remove the supplier in Shanghai"
"Delete the warehouse named WH-001"
"Remove node ID abc123"
```

#### Connect Nodes

```
"Connect the Shanghai supplier to the Detroit manufacturer"
"Link warehouse WH-001 to distributor DIST-002"
"Create a connection from manufacturer to warehouse"
```

#### Update Nodes

```
"Update the Shanghai supplier capacity to 100000"
"Change the warehouse name to Central Distribution"
"Modify the manufacturer status to active"
```

#### Optimize Layout

```
"Optimize my network layout"
"Auto-arrange the nodes"
"Reorganize the network visualization"
```

### Configure Commands

Adjust network-wide settings.

#### Set Region

```
"Set my primary region to North America"
"Change region to Asia Pacific"
"Use Europe as my region"
```

**Available Regions**:
- North America
- Europe
- Asia Pacific
- Latin America
- Middle East & Africa

#### Set Industry

```
"Set my industry to automotive"
"Change to electronics industry"
"Use retail industry"
```

**Available Industries**:
- Automotive
- Electronics
- Retail
- Pharmaceuticals
- Food & Beverage
- Manufacturing

#### Set Currency

```
"Use USD as my currency"
"Change currency to EUR"
"Set currency to JPY"
```

#### Manage Shipping Methods

```
"Add air freight as a shipping method"
"Add ocean freight"
"Remove rail shipping"
```

**Available Methods**:
- Air Freight
- Ocean Freight
- Rail
- Truck
- Intermodal

#### Set Risk Profile

```
"Set risk profile to conservative"
"Use aggressive risk profile"
"Change to moderate risk"
```

**Risk Profiles**:
- Conservative: Prioritize stability
- Moderate: Balance risk and efficiency
- Aggressive: Optimize for cost/speed

### Analyze Commands

Get insights about your network.

#### Scan for Anomalies

```
"Scan for anomalies"
"Check for unusual activity"
"Find any problems in my network"
```

#### Identify Risks

```
"What risks do I have?"
"Identify risk points"
"Show me potential vulnerabilities"
```

#### Find Bottlenecks

```
"Find bottlenecks in my network"
"Where are the constraints?"
"Show me capacity issues"
```

#### Calculate Utilization

```
"Calculate network utilization"
"Show me capacity metrics"
"What's my efficiency?"
```

#### Assess Resilience

```
"How resilient is my network?"
"Assess my network robustness"
"Evaluate redundancy"
```

#### Compare Scenarios

```
"Compare scenario A with scenario B"
"Show me the difference between these options"
```

#### Generate Reports

```
"Generate a network report"
"Create a summary report"
"Export my network analysis"
```

### Simulate Commands

Test "what-if" scenarios.

#### Run Simulations

```
"Run a simulation of port closure in Shanghai"
"Simulate a supplier failure"
"What if demand increases by 30%?"
```

#### Specific Scenarios

**Port Closure**:
```
"What if the Shanghai port closes?"
"Simulate Los Angeles port disruption"
```

**Supplier Failure**:
```
"What if my main supplier fails?"
"Simulate supplier ABC going offline"
```

**Demand Spike**:
```
"What if demand increases by 50%?"
"Simulate a demand surge in Q4"
```

**Weather Events**:
```
"What if a hurricane hits the Gulf Coast?"
"Simulate severe weather in Europe"
```

#### Advanced Simulations

**Monte Carlo**:
```
"Run a Monte Carlo simulation"
"Perform probabilistic analysis"
```

**Stress Test**:
```
"Stress test my network"
"Test extreme scenarios"
```

**Sensitivity Analysis**:
```
"Analyze sensitivity to lead time changes"
"How sensitive am I to cost variations?"
```

**Cascade Analysis**:
```
"Map failure propagation"
"Show me cascade effects"
```

### Query Commands

Get information about your network.

#### Node Details

```
"Show me details for supplier in Shanghai"
"Get information about warehouse WH-001"
"What's the status of my manufacturer?"
```

#### Network Summary

```
"Summarize my network"
"Give me an overview"
"Show me network statistics"
```

#### Recent Alerts

```
"Show me recent alerts"
"What alerts do I have?"
"Any warnings?"
```

#### Performance Metrics

```
"Show me performance metrics"
"What are my KPIs?"
"Display network statistics"
```

#### Help

```
"Help"
"What can you do?"
"Show me available commands"
"How do I add a supplier?"
```

## Usage Examples

### Example 1: Building a Simple Network

**Goal**: Create a basic supply chain from supplier to retailer.

```
You: "Add a supplier in Shanghai"
Copilot: "✓ Created supplier node in Shanghai with ID SUP-001"

You: "Add a manufacturer in Detroit"
Copilot: "✓ Created manufacturer node in Detroit with ID MFG-001"

You: "Connect the Shanghai supplier to the Detroit manufacturer"
Copilot: "✓ Connected SUP-001 to MFG-001 with lead time 14 days"

You: "Add a warehouse in Chicago"
Copilot: "✓ Created warehouse node in Chicago with ID WH-001"

You: "Connect the manufacturer to the warehouse"
Copilot: "✓ Connected MFG-001 to WH-001 with lead time 2 days"
```

### Example 2: Analyzing Network Health

**Goal**: Check for issues and get recommendations.

```
You: "Scan my network for anomalies"
Copilot: "🔍 Scanning network... Found 2 anomalies:
1. High utilization (95%) at warehouse WH-001
2. Unusual delay pattern at supplier SUP-003

Recommendations:
- Consider adding warehouse capacity
- Review supplier SUP-003 performance"

You: "What risks do I have?"
Copilot: "⚠️ Identified 3 risk points:
1. Single supplier dependency for component X
2. Port concentration in Shanghai (60% of imports)
3. Limited backup capacity in Midwest region

Suggested actions:
- Diversify supplier base
- Add alternative port routes
- Increase warehouse capacity in Chicago"
```

### Example 3: Running What-If Scenarios

**Goal**: Test impact of potential disruptions.

```
You: "What if the Shanghai port closes for 2 weeks?"
Copilot: "🎯 Simulation Results:

Impact:
- 15 nodes affected
- 30% reduction in throughput
- $2.5M estimated cost impact
- 3-week recovery time

Mitigation Options:
1. Reroute through Hong Kong (+5 days, +$500K)
2. Use air freight for critical items (+$1.2M)
3. Draw from safety stock (covers 10 days)

Recommendation: Combination of options 1 and 3"

You: "Run that mitigation plan"
Copilot: "✓ Executing mitigation strategy...
- Rerouted 60% of shipments to Hong Kong
- Allocated safety stock for critical items
- Updated delivery schedules

New estimated impact: $800K, 1-week delay"
```

### Example 4: Multi-Step Requests

**Goal**: Execute complex operations in one request.

```
You: "Add a supplier in Vietnam, connect it to my Detroit manufacturer, 
and run a simulation to see how it improves resilience"

Copilot: "✓ Step 1/3: Created supplier in Vietnam (SUP-004)
✓ Step 2/3: Connected SUP-004 to MFG-001
🎯 Step 3/3: Running resilience simulation...

Results:
- Supplier redundancy increased from 60% to 85%
- Single-point-of-failure risk reduced by 40%
- Network resilience score: 7.8/10 (was 6.2/10)

The new supplier significantly improves your network resilience!"
```

### Example 5: Configuration and Optimization

**Goal**: Set up network preferences and optimize.

```
You: "Set my region to North America, industry to automotive, 
and optimize my network layout"

Copilot: "✓ Updated region to North America
✓ Updated industry to Automotive
✓ Optimizing network layout...

Optimization complete:
- Reduced average lead time by 12%
- Improved node positioning for visualization
- Identified 3 redundant connections (removed)
- Suggested 2 new strategic connections

Your network is now optimized for automotive supply chain in North America!"
```

## Tips and Best Practices

### Be Specific

❌ "Add a node"
✅ "Add a supplier in Shanghai"

❌ "Check my network"
✅ "Scan for anomalies and identify risks"

### Use Natural Language

You don't need to memorize exact commands. The copilot understands variations:

- "Add a supplier in Shanghai"
- "Create a new supplier located in Shanghai"
- "I need a supplier node in Shanghai"
- "Put a supplier in Shanghai"

All of these work!

### Provide Context

The copilot remembers your conversation:

```
You: "Add a supplier in Shanghai"
Copilot: "✓ Created supplier SUP-001"

You: "Connect it to my manufacturer"
Copilot: "✓ Connected SUP-001 to MFG-001"
       ↑ "it" refers to the supplier you just added
```

### Ask for Clarification

If you're unsure, just ask:

```
"How do I add a warehouse?"
"What's the difference between a distributor and a retailer?"
"Can you explain what a Monte Carlo simulation does?"
```

### Use Follow-Up Questions

Build on previous responses:

```
You: "Show me my risks"
Copilot: [Lists 3 risks]

You: "How do I fix the first one?"
Copilot: [Provides specific recommendations]

You: "Do that"
Copilot: [Executes the recommendation]
```

### Combine Multiple Actions

Save time by requesting multiple things:

```
"Add a supplier in Tokyo, a manufacturer in Seoul, and connect them"
"Scan for anomalies, identify risks, and generate a report"
"Set region to Asia Pacific and currency to JPY"
```

### Review Suggestions

The copilot often suggests next steps:

```
Copilot: "✓ Added supplier in Shanghai

💡 Suggested next steps:
- Connect this supplier to a manufacturer
- Set supplier capacity and lead time
- Add backup supplier for redundancy"
```

## Troubleshooting

### Copilot Not Responding

**Symptoms**: Message sent but no response

**Solutions**:
1. Check your internet connection
2. Refresh the page
3. Try closing and reopening the copilot
4. Check browser console for errors

### Unclear Intent

**Symptoms**: Copilot asks for clarification

**Example**:
```
You: "Add a node"
Copilot: "I'd be happy to add a node! Could you specify:
- What type? (supplier, manufacturer, warehouse, distributor, retailer)
- Where should it be located?"
```

**Solution**: Provide more specific information

### Action Failed

**Symptoms**: Copilot reports an error

**Example**:
```
Copilot: "❌ Unable to connect nodes: 
Supplier SUP-001 is already connected to Manufacturer MFG-001"
```

**Solutions**:
- Read the error message carefully
- Check if the action is valid
- Try an alternative approach
- Ask the copilot for help: "How do I fix this?"

### Slow Responses

**Symptoms**: Long wait times

**Possible Causes**:
- Complex simulations take time
- High system load
- Network latency

**Solutions**:
- Wait for completion (complex operations can take 10-30 seconds)
- Break complex requests into smaller steps
- Try during off-peak hours

### Context Lost

**Symptoms**: Copilot doesn't remember previous conversation

**Causes**:
- Session expired
- Page refreshed
- Conversation too long (auto-summarized)

**Solutions**:
- Provide full context in your message
- Reference specific IDs: "Update supplier SUP-001"
- Start a new conversation if needed

## FAQ

### How does the copilot understand my requests?

The copilot uses Amazon Bedrock (Claude 3.5 Sonnet) to understand natural language and classify your intent. It then executes the appropriate action and generates a helpful response.

### Can I undo actions?

Currently, there's no automatic undo. However, you can:
- Remove nodes you added: "Remove supplier SUP-001"
- Disconnect connections: "Disconnect SUP-001 from MFG-001"
- Reset configuration: "Reset configuration to defaults"

### How long does the copilot remember our conversation?

The copilot maintains context for your entire session. After 10 messages, older messages are summarized to keep responses fast while maintaining context.

### Can I use the copilot on mobile?

Yes! The copilot interface is fully responsive and works on mobile devices. Use the same commands and interactions.

### What if I make a typo?

The copilot is forgiving of typos and variations. It focuses on understanding your intent rather than exact spelling.

### Can multiple people use the copilot on the same network?

Yes, but each user has their own conversation context. Changes made by one user are visible to all users viewing the same network.

### Is my conversation data saved?

Conversations are stored for 30 days for your reference and to improve the copilot. After 30 days, they're automatically deleted.

### Can I export my conversation?

Currently, conversations aren't directly exportable, but you can:
- Take screenshots
- Copy and paste messages
- Generate reports of actions taken

### What languages does the copilot support?

Currently, the copilot supports English. Additional languages may be added in future updates.

### How accurate are simulations?

Simulations use industry-standard models and your network data. They provide directional guidance rather than exact predictions. Always validate critical decisions with domain experts.

### Can I create custom commands?

Custom commands aren't currently supported, but the copilot is extensible. Contact your administrator about adding custom actions for your organization.

### What's the difference between "scan anomalies" and "identify risks"?

- **Scan anomalies**: Looks for unusual patterns in current data (e.g., unexpected delays, utilization spikes)
- **Identify risks**: Analyzes structural vulnerabilities (e.g., single points of failure, geographic concentration)

### How do I report a bug or request a feature?

Use the feedback button in the copilot interface or contact support at support@omnitrack.ai

### Can the copilot access external data?

The copilot accesses your OmniTrack network data, including:
- Node configurations
- Connection details
- Real-time metrics
- Historical alerts
- Simulation results

It doesn't access external systems unless explicitly integrated.

### What happens if I close the copilot mid-conversation?

Your conversation is saved. When you reopen the copilot, you can continue where you left off.

### Can I schedule automated actions?

Direct scheduling isn't available in the copilot, but you can:
- Set up alerts for specific conditions
- Use the API for automated workflows
- Contact your administrator about automation options

---

## Need More Help?

- 📧 Email: support@omnitrack.ai
- 💬 In-app chat: Click the support icon
- 📚 Documentation: https://docs.omnitrack.ai
- 🎥 Video tutorials: https://omnitrack.ai/tutorials

**Pro Tip**: The best way to learn is to experiment! The copilot is designed to be forgiving and helpful. Try different commands and see what works for you.
